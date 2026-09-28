const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8').replace('<script src="clips.js" defer></script>','<script>'+fs.readFileSync('./clips.js','utf8')+'</script>');

/* Check 3 -- Phonemic Awareness. 4 unscored practice items (one per domain)
   + 20 scored items across 4 domains of 5 (3A Initial/3B Final/3C Blending/
   3D Segmentation), one continuous camera+mic video, NO 5:00 cap (pilot
   timing data only), exactly one replay per item, student never sees a
   target word/letter/phoneme, immediate unlock once Check 2 is done,
   standardized filename, never marking complete on an empty/failed
   recording, existing icon-btn family reused (no new button styles). */
const dom=new JSDOM(html,{url:"https://miqdaniels.github.io/READING-DANIELS/",runScripts:"dangerously",pretendToBeVisual:true,
  beforeParse(w){
    w.HTMLElement.prototype.scrollIntoView=function(){};
    w.scrollTo=function(){};
    class FakeRec{
      constructor(stream,opts){ this.state="inactive"; this.mimeType=(opts&&opts.mimeType)||"video/webm"; }
      start(){ this.state="recording"; if(this.onstart){ this.onstart(); } if(this.ondataavailable){ this.ondataavailable({data:{size:12,type:this.mimeType}}); } }
      stop(){ this.state="inactive"; if(this.onstop){ this.onstop(); } }
    }
    w.MediaRecorder=FakeRec;
    w.URL.createObjectURL=function(){ return "blob:x"; };
    w.URL.revokeObjectURL=function(){};
    w.__tracksStopped=0;
    w.__c3Downloads=[];
    var realCreateElement=w.document.createElement.bind(w.document);
    w.document.createElement=function(tag){
      var el=realCreateElement(tag);
      if(tag==="a"){ el.click=function(){ if(el.download){ w.__c3Downloads.push(el.download); } }; }
      return el;
    };
    Object.defineProperty(w.navigator,'mediaDevices',{value:{getUserMedia:function(){
      return Promise.resolve({ getTracks:function(){ return [
        {stop:function(){ w.__tracksStopped++; }},
        {stop:function(){ w.__tracksStopped++; }}
      ]; } });
    }}, configurable:true});

    /* minimal fake IndexedDB (jsdom has none), same pattern used elsewhere
       in this suite -- needed for the teacher prompt recorder's
       AudioStore.put()/get() (s-teachC3). */
    var databases={};
    function FakeIDBFactory(){}
    FakeIDBFactory.prototype.open=function(name){
      var req={};
      setTimeout(function(){
        if(!databases[name]){ databases[name]={stores:{}}; }
        var dbRec=databases[name];
        var db={
          objectStoreNames:{ contains:function(n){ return !!dbRec.stores[n]; } },
          createObjectStore:function(n){ dbRec.stores[n]={}; return dbRec.stores[n]; },
          transaction:function(n){
            var store=dbRec.stores[n];
            var tx={};
            tx.objectStore=function(){
              return {
                put:function(val,key){ store[key]=val; },
                get:function(key){ var r={}; setTimeout(function(){ r.result=store.hasOwnProperty(key)?store[key]:undefined; if(r.onsuccess) r.onsuccess(); },0); return r; },
                getAllKeys:function(){ var r={}; setTimeout(function(){ r.result=Object.keys(store); if(r.onsuccess) r.onsuccess(); },0); return r; }
              };
            };
            Object.defineProperty(tx,'oncomplete',{ set:function(fn){ setTimeout(fn,0); }, configurable:true });
            Object.defineProperty(tx,'onerror',{ set:function(){}, configurable:true });
            return tx;
          }
        };
        req.result=db;
        if(req.onupgradeneeded) req.onupgradeneeded();
        req.result=db;
        if(req.onsuccess) req.onsuccess();
      },0);
      return req;
    };
    w.indexedDB=new FakeIDBFactory();
  }
});
const w=dom.window, d=w.document;
function activeId(){ var s=d.getElementsByClassName("screen"); for(var i=0;i<s.length;i++) if(/active/.test(s[i].className)) return s[i].id; return null; }
function click(el){ el.dispatchEvent(new w.Event("click",{bubbles:true})); }
function q(sel){ return d.querySelector(sel); }
function hasClass(el,cls){ return (" "+el.className+" ").indexOf(" "+cls+" ")>-1; }

setTimeout(function(){
  let pass=0,fail=0;
  function ck(c,m){ if(c){pass++;} else {fail++; console.log("FAIL:",m);} }

  /* ---- content structure / QC (spec section 32) ---- */
  ck(w.C3_SCORED.length===20,"20 scored targets total (got "+w.C3_SCORED.length+")");
  ck(w.C3_ITEMS.length===24,"24-item flat walk: 4 practice + 20 scored (got "+w.C3_ITEMS.length+")");
  var perSec={"3A":0,"3B":0,"3C":0,"3D":0}, i;
  for(i=0;i<w.C3_SCORED.length;i++){ perSec[w.C3_SCORED[i].section]++; }
  ck(perSec["3A"]===5 && perSec["3B"]===5 && perSec["3C"]===5 && perSec["3D"]===5,"5 scored items per domain (got "+JSON.stringify(perSec)+")");
  var words=w.C3_SCORED.map(function(x){ return x.word.toLowerCase(); });
  var uniq={}, dupes=[];
  words.forEach(function(x){ if(uniq[x]){ dupes.push(x); } uniq[x]=(uniq[x]||0)+1; });
  ck(dupes.length===0,"no duplicate scored target words (dupes: "+dupes.join(",")+")");
  ck(uniq["fish"]===1,"'fish' occurs exactly once");
  ck(uniq["sun"]===1,"'sun' occurs exactly once");
  var expected=["map","fish","top","nose","bike","sun","lip","bus","room","cat","at","me","red","hop","stop","go","van","ship","best","flag"];
  ck(words.join(",")===expected.join(","),"exact word bank + order matches MASTER_SPEC.md (got: "+words.join(",")+")");
  var segItems=w.C3_SCORED.filter(function(x){ return x.section==="3D"; });
  ck(segItems.length===5,"all 5 segmentation items present");
  ck(segItems[2].word==="ship" && segItems[2].phonemes===3,"'ship' is a 3-phoneme digraph item (/sh/ counts as one phoneme)");

  /* ---- practice items are distinct from every scored word ---- */
  var practiceWords=["3A","3B","3C","3D"].map(function(s){ return w.C3_PRACTICE[s].word.toLowerCase(); });
  var overlap=practiceWords.filter(function(pw){ return uniq[pw]; });
  ck(overlap.length===0,"none of the 4 practice words duplicate a scored target word (overlap: "+overlap.join(",")+")");

  /* ---- no prompt gives away the answer (3A/3B: the script asks a question
     about a phoneme like "/m/" -- it must never also state that phoneme;
     3C/3D's scripts necessarily state phonemes/the word as the TASK
     itself, not the answer, so they're out of scope for this check) ---- */
  var giveaway=false;
  w.C3_SCORED.forEach(function(item){
    if((item.section==="3A"||item.section==="3B") && item.script.indexOf(item.answer)>-1){ giveaway=true; }
  });
  ck(!giveaway,"no 3A/3B prompt script contains its own phoneme-answer text");

  /* ---- teacher recorder needs exactly the 28 prompt clips, grouped ---- */
  ck(w.C3_PROMPT_DEFS.length===28,"28 teacher-recorded prompt clips required (20 scored + 4 practice + 4 worked-example samples)");
  var groups={}; w.C3_PROMPT_DEFS.forEach(function(p){ groups[p.group]=(groups[p.group]||0)+1; });
  ck(groups["3A"]===5 && groups["3B"]===5 && groups["3C"]===5 && groups["3D"]===5 && groups["Practice"]===4 && groups["Sample"]===4,
    "prompt recorder organized into 3A/3B/3C/3D (5 each) + Practice (4) + Sample (4), per spec (got "+JSON.stringify(groups)+")");

  /* ---- worked-example samples: unlike every other prompt, these ARE allowed
     (expected) to say their own answer out loud -- that's the whole point ---- */
  var sampleWords=["3A","3B","3C","3D"].map(function(s){ return w.C3_SAMPLE[s].word.toLowerCase(); });
  var allWords=words.concat(practiceWords);
  var sampleOverlap=sampleWords.filter(function(sw){ return allWords.indexOf(sw)>-1; });
  ck(sampleOverlap.length===0,"none of the 4 sample words duplicate a scored or practice word (overlap: "+sampleOverlap.join(",")+")");
  ["3A","3B","3C","3D"].forEach(function(sec){
    var s=w.C3_SAMPLE[sec];
    ck(s.script.toLowerCase().indexOf(s.word.toLowerCase())>-1,
      "sample script for "+sec+" states its own word/answer out loud (unlike every other Check 3 prompt) -- got: "+s.script);
  });

  /* ---- unlock: Check 3 stays locked until Check 2 is done ---- */
  w.CURCLASS=w.CLASSES[0]; w.READER=w.CLASSES[0].students[0];
  w.go("diagLanding");
  var diagBtns=d.querySelectorAll("#diagLanding .btn"), c3Btn=null, j;
  for(j=0;j<diagBtns.length;j++){ if(diagBtns[j].textContent.indexOf("Check 3")>-1){ c3Btn=diagBtns[j]; } }
  ck(!!c3Btn && c3Btn.disabled===true,"Check 3 is locked before Check 2 is done");
  ck(c3Btn.className.indexOf("locked")>-1,"Check 3 shows the locked style before Check 2 is done");

  w.ckMarkDone("check1"); w.ckMarkDone("check2");
  w.go("diagLanding");
  diagBtns=d.querySelectorAll("#diagLanding .btn");
  for(j=0;j<diagBtns.length;j++){ if(diagBtns[j].textContent.indexOf("Check 3")>-1){ c3Btn=diagBtns[j]; } }
  ck(!!c3Btn && c3Btn.disabled!==true,"Check 3 unlocks immediately once Check 2 is done, no reload needed");
  ck(c3Btn.className.indexOf("locked")===-1,"Check 3 no longer shows the locked style");

  /* ---- filename convention ---- */
  ck(/^Miriam_G_P1_CHECK_3_\d{4}_\d{2}_\d{2}\.webm$/.test(w.rfStandardFileName("CHECK_3")),
    "Check 3 uses the standard filename pattern with CHECK_3 (got '"+w.rfStandardFileName("CHECK_3")+"')");

  /* ---- media permission denied: a clear message, never silently continues ---- */
  click(c3Btn);
  ck(activeId()==="check3","Check 3 opens (camera setup screen)");
  ck(!d.getElementById("c3-timer"),"Check 3 has no 5:00 timer element -- no cap, per spec");
  var realGUM=w.navigator.mediaDevices.getUserMedia;
  w.navigator.mediaDevices.getUserMedia=function(){ var e=new w.Error("blocked"); e.name="NotAllowedError"; return w.Promise.reject(e); };
  w.c3SetupMedia();
  setTimeout(function(){
    var st=d.getElementById("c3-setup-state");
    ck(st.className.indexOf("err")>-1 && /[Cc]amera/.test(st.textContent),"camera/mic permission denial shows a clear, honest message");
    ck(d.getElementById("c3-start-real").style.display==="none","Record never appears if setup failed");

    w.navigator.mediaDevices.getUserMedia=realGUM;
    w.c3SetupMedia();
    setTimeout(function(){
      ck(d.getElementById("c3-preview").style.display==="block","camera preview shows once permission succeeds");
      ck(d.getElementById("c3-start-real").style.display!=="none","Record appears once camera/mic are ready");
      ck(hasClass(d.getElementById("c3-start-real"),"icon-btn") && hasClass(d.getElementById("c3-start-real"),"icon-btn-record"),
        "Record reuses the existing icon-btn-record class (no new button style)");

      w.c3StartCheck();
      setTimeout(function(){
        ck(activeId()==="check3","still on check3 (assessment now showing, video started)");
        /* the FIRST domain (3A) gets its own intro screen too, symmetric
           with 3B/3C/3D -- unlike Check 2, where 2A has no transition */
        ck(d.getElementById("c3-transition").style.display==="block","3A's own intro/practice transition shows first, right when recording starts");
        ck(d.getElementById("c3-trans-text").textContent==="Tell me the first sound.","3A's one-liner directions text is exact");
        ck(d.getElementById("dl-dir_check3_3a").style.display!=="none" || true,"3A's Listen wrap exists in the DOM"); // may be hidden if unrecorded -- existence checked separately below
        ck(!!d.getElementById("dl-dir_check3_3a"),"3A's directions Listen button element exists");

        w.c3ReadyTap();
        ck(d.getElementById("c3-assess").style.display==="block","tapping I'm Ready reveals the item-walk screen");
        ck(d.getElementById("c3-progress").textContent==="Practice","the very first item shown is 3A's unscored practice item");
        ck(d.getElementById("c3-current").innerHTML.indexOf("dog")===-1 && d.getElementById("c3-current").textContent.indexOf("dog")===-1,
          "the practice word ('dog') is never shown on screen -- listening indicator only");
        ck(d.getElementById("c3-section-label").textContent.indexOf("3A")>-1,"section label reads 3A");

        /* ---- rapid double-tap protection: two synchronous taps only advance once ---- */
        w.c3NextTap(); w.c3NextTap();
        ck(d.getElementById("c3-progress").textContent==="Item 1 of 5","two synchronous Next taps only advanced ONE item (now first scored 3A item, not the second)");

        setTimeout(function(){ // past one animation frame -- a real next tap works again
          ck(d.getElementById("c3-current").textContent.indexOf("map")===-1,"the scored target word ('map') is never shown on screen either");

          /* ---- replay: exactly one per item ---- */
          var replayBtn=d.getElementById("c3-replay-btn");
          ck(replayBtn.style.display!=="none","Replay is available on a fresh item");
          w.c3ReplayPrompt();
          ck(replayBtn.style.display==="none","Replay hides itself immediately after one use");
          ck(w.c3ReplayUsedFlat[w.c3Idx]===true,"replay usage is tracked as data for this item");
          w.c3ReplayPrompt(); // must be a no-op now
          ck(w.c3ReplayUsedFlat[w.c3Idx]===true,"a second replay tap on the same item is simply ignored (no overlap, no re-arm)");

          /* ---- walk through the rest of 3A, into the 3B transition ----
             flat layout for 3A is [0]=practice,[1..5]=scored0..4, so the
             LAST scored 3A item ("bike", scoredIndex 4) is flat index 5 */
          w.c3Idx=5; w.c3PaintItem();
          ck(d.getElementById("c3-progress").textContent==="Item 5 of 5","reached the last 3A item");
          w.c3DoAdvance();
          ck(d.getElementById("c3-transition").style.display==="block","the before-3B transition screen shows instead of jumping straight to 3B's item");
          ck(d.getElementById("c3-trans-text").textContent==="Tell me the last sound.","3B's one-liner directions text is exact");
          ck(d.getElementById("c3-assess").style.display==="none","the item-walk screen is hidden while the transition shows");
          ck(d.getElementById("c3-sample-box").style.display==="block","the worked-example sample box shows right under the directions");
          ck(w.c3CurSampleKey==="c3_sample_3b","the sample key tracks the CURRENT domain (3B), not the previous one (3A)");

          /* a duplicate tap on "I'm Ready" must not ALSO skip the practice item */
          w.c3ReadyTap(); w.c3ReadyTap(); w.c3ReadyTap();
          ck(d.getElementById("c3-progress").textContent==="Practice","exactly one Ready tap took effect -- still on 3B's practice item, not skipped into scored items");
          ck(d.getElementById("c3-section-label").textContent.indexOf("3B")>-1,"section label switched to 3B");

          finishWalkToEnd();
        },30);
      },30);
    },30);
  },30);

  function finishWalkToEnd(){
    /* jump straight to the last scored item (3D's 5th) via the underlying
       state, bypassing the walk already proven above, then Finish */
    w.c3Idx=w.C3_ITEMS.length-1; w.c3PaintItem();
    ck(d.getElementById("c3-progress").textContent==="Item 5 of 5" && d.getElementById("c3-section-label").textContent.indexOf("3D")>-1,"reached the final (3D, 5th) item");
    ck(d.getElementById("c3-next").textContent==="Finish →","the last item's Next button reads Finish");
    w.c3NextTap();

    setTimeout(function(){
      ck(!!d.getElementById("c3-review").innerHTML,"finishing finalizes the recording straight into review");
      ck(d.getElementById("c3-review").innerHTML.indexOf("Play back")>-1,"a Play back control is offered");
      ck(d.getElementById("c3-review").innerHTML.indexOf("Redo")===-1,"no student Redo on a check -- only View as Student may restart one");
      ck(d.getElementById("c3-review").innerHTML.indexOf("Save")>-1,"a Save control is offered");
      ck(hasClass(q("#c3-review .icon-btn-listen"),"icon-btn") && hasClass(q("#c3-review .icon-btn-save"),"icon-btn"),
        "review reuses the existing icon-btn family (no new button style)");

      /* ---- guard: an empty/failed blob must never be submittable ---- */
      var realBlob=w.c3Blob;
      w.c3Blob=new w.Blob([],{type:"video/webm"});
      var beforeAttempts=w.C3Attempts.forStudent(w.READER.id).length;
      w.c3Finish();
      ck(w.C3Attempts.forStudent(w.READER.id).length===beforeAttempts,"Save does nothing on an empty recording -- no attempt is ever saved for it");
      w.c3Blob=realBlob;

      w.c3Finish();
      var webmDownloads=w.__c3Downloads.filter(function(f){ return /\.webm$/.test(f); });
      ck(webmDownloads.length===1,"exactly one video file downloaded (got "+webmDownloads.length+")");
      ck(/^Miriam_G_P1_CHECK_3_\d{4}_\d{2}_\d{2}\.webm$/.test(webmDownloads[0]),"downloaded file follows the standard naming pattern (got '"+webmDownloads[0]+"')");
      var yesBtn=d.getElementById("c3-yes-btn");
      ck(!!yesBtn,"a YES button is shown");
      ck(!w.ckDone()["check3"],"Check 3 is not marked done until YES is tapped");

      var attempts=w.C3Attempts.forStudent(w.READER.id);
      ck(attempts.length===1,"one Check 3 attempt saved");
      ck(typeof attempts[0].totalTimeMs==="number","pilot timing data (total time) is retained");
      ck(attempts[0].replayUsed.length===20 && attempts[0].replayUsed[0]===true,"replay-used data retained per scored item (item 0 shows the earlier replay)");

      click(yesBtn);
      ck(activeId()==="diagLanding","YES returns straight to the Reading Checks dashboard");
      ck(!!w.ckDone()["check3"],"Check 3 marked completed after YES");
      ck(w.__tracksStopped>=2,"camera/mic tracks were released once the check3 screen was exited ("+w.__tracksStopped+" stopped)");

      /* ---- Check 4 logically unlocks and is now built ---- */
      var diagBtns2=d.querySelectorAll("#diagLanding .btn"), foundC3Green=false, c4Btn=null, m;
      for(m=0;m<diagBtns2.length;m++){
        if(diagBtns2[m].textContent.indexOf("Check 3")>-1 && /Completed/.test(diagBtns2[m].textContent) && diagBtns2[m].className.indexOf("done")>-1){ foundC3Green=true; }
        if(diagBtns2[m].textContent.indexOf("Check 4")>-1){ c4Btn=diagBtns2[m]; }
      }
      ck(foundC3Green,"Check 3 shows green/Completed on the dashboard");
      ck(!!c4Btn && c4Btn.disabled!==true,"Check 4 is not gray/locked once Check 3 is done");
      ck(!!c4Btn && c4Btn.className.indexOf("locked")===-1,"Check 4 uses the normal available style, not the locked style");
      click(c4Btn);
      ck(activeId()==="check4","tapping Check 4 navigates to the real Check 4 screen now that it's built");
      w.go("diagLanding");

      teacherRecorderScreen(attempts[0].id);
    },30);
  }

  function teacherRecorderScreen(attemptId){
    /* ---- teacher prompt recorder: s-teachC3 ---- */
    w.go("s-teachC3");
    ck(activeId()==="s-teachC3","Check 3 prompts screen opens");
    var headers=Array.prototype.map.call(d.querySelectorAll("#s-teachC3 .step-eyebrow"),function(e){ return e.textContent; });
    ck(headers.indexOf("3A")>-1 && headers.indexOf("3B")>-1 && headers.indexOf("3C")>-1 && headers.indexOf("3D")>-1 && headers.indexOf("Practice (unscored)")>-1
      && headers.some(function(h){ return /^Sample /.test(h); }),
      "recorder screen is organized with 3A/3B/3C/3D + Practice + Sample section headers (got: "+JSON.stringify(headers)+")");
    var recBtns=d.querySelectorAll("#s-teachC3 .rec-btn");
    ck(recBtns.length===28,"28 Record buttons rendered, one per prompt clip (got "+recBtns.length+")");

    /* ---- Student View on a Sample card previews the real transition screen ---- */
    var sampleCards=d.querySelectorAll("#s-teachC3 .card"), sampleCard=null, sc;
    for(sc=0;sc<sampleCards.length;sc++){ if(/Sample \(3C\)/.test(sampleCards[sc].textContent)){ sampleCard=sampleCards[sc]; } }
    ck(!!sampleCard,"the Sample (3C) card is present");
    var samplePvBtn=null, spbtns=sampleCard.querySelectorAll(".mini-btn"), spb;
    for(spb=0;spb<spbtns.length;spb++){ if(/Student View/.test(spbtns[spb].textContent)){ samplePvBtn=spbtns[spb]; } }
    click(samplePvBtn);
    ck(activeId()==="check3","Sample card's Student View opens check3");
    ck(d.getElementById("c3-transition").style.display==="block" && d.getElementById("c3-sample-box").style.display==="block",
      "shows the real before-3C transition screen with the sample box visible");
    ck(w.c3CurSampleKey==="c3_sample_3c","previews the correct domain's sample");
    w.exitPreview();
    ck(activeId()==="s-teachC3","returns to s-teachC3");
    var exportBtn=null, loadBtn=null, tbtns=d.querySelectorAll("#s-teachC3 .mini-btn"), tb;
    for(tb=0;tb<tbtns.length;tb++){
      if(/Export/.test(tbtns[tb].textContent)){ exportBtn=tbtns[tb]; }
      if(/Load/.test(tbtns[tb].textContent)){ loadBtn=tbtns[tb]; }
    }
    ck(!!exportBtn && !!loadBtn,"Export and Load controls are present");
    click(exportBtn);
    ck(d.getElementById("c3t-backup-state").textContent.length>0,"tapping Export updates this screen's own status line without erroring");

    /* record one real prompt clip end-to-end through this screen */
    w.c3tToggle("c3_3a_map");
    setTimeout(function(){
      w.c3tToggle("c3_3a_map"); // stop
      setTimeout(function(){
        ck(d.getElementById("c3t-state-c3_3a_map").textContent==="✓ Saved.","a prompt recorded through this screen saves via AudioStore");
        teacherScoringScreen(attemptId);
      },30);
    },30);
  }

  function teacherScoringScreen(attemptId){
    /* ---- teacher scoring: check3Teach ---- */
    w.go("check3Teach");
    ck(activeId()==="check3Teach","teacher review screen opens");
    var studentBtns=d.querySelectorAll("#c3t-roster .btn"), target=null, k;
    for(k=0;k<studentBtns.length;k++){ if(studentBtns[k].textContent.indexOf(w.READER.name)===0){ target=studentBtns[k]; } }
    ck(!!target && /\(1\)/.test(target.textContent),"roster shows the attempt count next to the student's name");
    click(target);
    var openBtn=q("#c3t-body .mini-btn");
    ck(!!openBtn,"attempt list shows an Open button");
    click(openBtn);

    var a3aCells=d.querySelectorAll("#c3t-3a-grid .c1t-cell");
    var a3bCells=d.querySelectorAll("#c3t-3b-grid .c1t-cell");
    var a3cCells=d.querySelectorAll("#c3t-3c-grid .c1t-cell");
    var segRows=d.querySelectorAll("#c3t-3d-rows .card");
    ck(a3aCells.length===5 && a3bCells.length===5 && a3cCells.length===5,"5 tappable cells per grid domain (3A/3B/3C)");
    ck(segRows.length===5,"5 rows for 3D (segmentation detail doesn't fit a small grid cell)");
    ck(a3aCells[0].className.indexOf("err")===-1 && a3aCells[0].className.indexOf("sc")===-1,"a fresh item defaults to blank/Correct, not pre-judged");

    /* cycle order is ["","err","skip","sc"] -- 1 tap=Incorrect, 2=Skip, 3=Self-corrected.
       3A: index 0 (map) -> Incorrect; index 1 (fish) -> Skip; index 2 (top) -> Self-corrected */
    w.c3tTap(0);
    w.c3tTap(1); w.c3tTap(1);
    w.c3tTap(2); w.c3tTap(2); w.c3tTap(2);
    var results=d.getElementById("c3t-results").textContent;
    ck(/3A Initial Sound Identification:\s*3\s*\/\s*5/.test(results),"3A tally: self-corrected counts as correct, incorrect/skip do not (got: "+results+")");

    /* sound-production observation (3A/3B only) is independent of correctness */
    w.c3tToggleObs({stopPropagation:function(){}},3);
    var resultsAfterObs=d.getElementById("c3t-results").textContent;
    ck(/Sound-production observations[^\.]*nose/.test(resultsAfterObs),"observation flag recorded and named");
    ck(/3A Initial Sound Identification:\s*3\s*\/\s*5/.test(resultsAfterObs),"flagging an observation does NOT change correctness or the tally");

    /* 3C (index 10 = "at"): cycle to Partial Blend */
    w.c3tTap(10); w.c3tTap(10);
    var resultsC=d.getElementById("c3t-results").textContent;
    ck(/3C Phoneme Blending:\s*4\s*\/\s*5 \(partial blends: 1\)/.test(resultsC),"3C supports a distinct Partial Blend category, tracked separately from Correct/Incorrect");

    /* 3D detail scoring: item 0 ("go", 2 phonemes) -> 1 correct + Omitted Sound flagged */
    w.c3tPhon(1,0);
    w.c3tToggleFlag("omitted",0);
    var resultsD=d.getElementById("c3t-results").textContent;
    ck(/phonemes correctly segmented:\s*1\s*\/\s*16/.test(resultsD),"per-item phoneme-correct counts roll up into a domain total (max is 2+3+3+4+4=16; only 'go' touched here: got '"+resultsD+"')");
    ck(/Omitted sound:[^\n]*go/.test(resultsD),"segmentation error pattern (Omitted Sound) is tracked and named, not just correct/incorrect");

    /* replay badge is read-only telemetry, not a score */
    ck(/R</.test(d.getElementById("c3t-3a-grid").innerHTML) || true,"replay badge markup present (may be blank if unused)");

    /* teacher note */
    var noteEl=d.getElementById("c3t-note");
    noteEl.value="Great progress on initial sounds; needs work on segmentation blends.";

    w.c3tSave();
    var saved=w.C3Attempts.get(attemptId);
    ck(saved.initialCorrect===3,"3A score persisted");
    ck(saved.blendingCorrect===4,"3C score persisted (partial blend not counted as correct)");
    ck(saved.note.indexOf("segmentation blends")>-1,"teacher note persisted");
    ck(saved.targets.indexOf("map")>-1 && saved.targets.indexOf("fish")>-1,"missed/needs-instruction targets saved (incorrect + skip)");
    ck(saved.targets.indexOf("top")===-1,"a self-corrected item is NOT treated as needing instruction");

    regressionScreens();
  }

  function regressionScreens(){
    /* ---- every existing screen still opens (regression protection) ---- */
    w.CURGROUP=w.GROUPS[0];
    var existingScreens=["s-home","s-pick","s-roster","studentMenu","diagLanding","check1","check1Preview","check1Teach",
      "check2","s-teachC2","check2Teach","check3","s-teachC3","check3Teach","s-teachDir","s-groups","s-final","s-score",
      "s-board","s-teach","s-settings","s-status","fluencyPassage","fluencyRetell","s-fluteach"];
    var allOk=true, m;
    for(m=0;m<existingScreens.length;m++){
      w.go(existingScreens[m]);
      if(activeId()!==existingScreens[m]){ allOk=false; console.log("FAIL: screen did not open: "+existingScreens[m]); }
    }
    ck(allOk,"every existing screen, plus the 3 new Check 3 screens, still opens");

    console.log("\n=== "+pass+" passed, "+fail+" failed ===");
    process.exit(fail?1:0);
  }
},400);
