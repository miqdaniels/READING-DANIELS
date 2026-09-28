const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8').replace('<script src="clips.js" defer></script>','<script>'+fs.readFileSync('./clips.js','utf8')+'</script>');

/* Check 6 (6A only) -- Morphology: Read It. 50 printed-word items across 5
   locked morphology sets (10 each), ONE continuous AUDIO recording (no
   camera, same audio-only architecture as Check 1/4/5), no model
   audio/hints, teacher-controlled early stop, immediate unlock once
   Check 5 is done, standardized filename, never marking complete on an
   empty recording, Clean/Professional visual style. Simple 5-state
   teacher scoring cycle (no Immediate/Labored split -- not requested for
   Check 6). 6B (Understand It) and 6C (Build It) are explicitly NOT
   built -- only stubs with 3 illustrative examples each exist in
   MASTER_SPEC.md, per the 2026-09-28 content-retrieval analysis. */
const dom=new JSDOM(html,{url:"https://miqdaniels.github.io/READING-DANIELS/",runScripts:"dangerously",pretendToBeVisual:true,
  beforeParse(w){
    w.HTMLElement.prototype.scrollIntoView=function(){};
    w.scrollTo=function(){};
    class FakeRec{
      constructor(s){this.state="inactive";this.mimeType="audio/webm";this._s=s;}
      start(){this.state="recording"; if(this.onstart) this.onstart(); if(this.ondataavailable) this.ondataavailable({data:{size:10,type:"audio/webm"}});}
      stop(){this.state="inactive"; if(this.onstop) this.onstop();}
    }
    w.MediaRecorder=FakeRec;
    w.URL.createObjectURL=function(){return "blob:x";};
    w.URL.revokeObjectURL=function(){};
    Object.defineProperty(w.navigator,'mediaDevices',{value:{getUserMedia:function(){
      return Promise.resolve({getTracks:function(){return [{stop:function(){}}];}});
    }},configurable:true});
    var downloads=[];
    w.__downloads=downloads;
    var realCreateElement=w.document.createElement.bind(w.document);
    w.document.createElement=function(tag){
      var el=realCreateElement(tag);
      if(tag==="a"){ el.click=function(){ if(el.download){ downloads.push(el.download); } }; }
      return el;
    };
    w.HTMLMediaElement.prototype.play=function(){ Object.defineProperty(this,"paused",{value:false,configurable:true}); return Promise.resolve(); };
    w.HTMLMediaElement.prototype.pause=function(){ Object.defineProperty(this,"paused",{value:true,configurable:true}); };
  }
});
const w=dom.window, d=w.document;
function activeId(){ var s=d.getElementsByClassName("screen"); for(var i=0;i<s.length;i++) if(/active/.test(s[i].className)) return s[i].id; return null; }
function click(el){ el.dispatchEvent(new w.Event("click",{bubbles:true})); }
function q(sel){ return d.querySelector(sel); }

setTimeout(function(){
  let pass=0,fail=0;
  function ck(c,m){ if(c){pass++;} else {fail++; console.log("FAIL:",m);} }

  /* ---- content structure / QC ---- */
  ck(w.C6_ITEMS.length===50,"50 total items (got "+w.C6_ITEMS.length+")");
  var expectCounts={"6A-1":10,"6A-2":10,"6A-3":10,"6A-4":10,"6A-5":10};
  var i, allSetsOk=true;
  for(i=0;i<w.C6_SETS.length;i++){
    var s=w.C6_SETS[i];
    if(s.words.length!==expectCounts[s.id]){ allSetsOk=false; console.log("FAIL: set "+s.id+" expected "+expectCounts[s.id]+" got "+s.words.length); }
  }
  ck(allSetsOk,"every set is exactly 10 words (5 x 10 = 50)");
  ck(w.C6_SETS.length===5,"exactly 5 sets, none merged/added/removed");

  var words=w.C6_ITEMS.map(function(x){return x.word.toLowerCase();});
  var seen={}, dupes=[];
  words.forEach(function(x){ if(seen[x]){ dupes.push(x); } seen[x]=(seen[x]||0)+1; });
  ck(dupes.length===0,"no duplicate targets within Check 6 (dupes: "+dupes.join(",")+")");

  var previouslyDuplicated=["washable","kindness","disagreement","impossible"];
  ck(!seen["washable"] || w.C6_SETS[2].words.indexOf("washable")>-1 && w.C6_SETS[3].words.indexOf("washable")===-1,
    "'washable' appears only once (in Set 3), the Set 4 duplicate is gone");
  ck(!seen["kindness"] || w.C6_SETS[2].words.indexOf("kindness")>-1 && w.C6_SETS[3].words.indexOf("kindness")===-1,
    "'kindness' appears only once (in Set 3), the Set 4 duplicate is gone");
  ck(w.C6_SETS[3].words.indexOf("disagreement")>-1 && w.C6_SETS[4].words.indexOf("disagreement")===-1,
    "'disagreement' appears only once (in Set 4), the Set 5 duplicate is gone");
  ck(w.C6_SETS[1].words.indexOf("impossible")>-1 && w.C6_SETS[4].words.indexOf("impossible")===-1,
    "'impossible' appears only once (in Set 2), the Set 5 duplicate is gone");

  var expectedSet4=["unhelpful","rereading","disagreement","carefully","unfinished","hopelessness","incorrectly","carelessness","unfairness","reusable"];
  ck(w.C6_SETS[3].words.join(",")===expectedSet4.join(","),"Set 4 matches the exact QC-corrected word list, in order");
  var expectedSet5=["prediction","transportation","development","misunderstanding","information","preparation","movement","improvement","educational","organization"];
  ck(w.C6_SETS[4].words.join(",")===expectedSet5.join(","),"Set 5 matches the exact QC-corrected word list, in order");

  ck(w.C6_SETS[0].label==="Inflectional Endings","Set 1 category label matches");
  ck(w.C6_SETS[1].label==="Common Prefixes","Set 2 category label matches");
  ck(w.C6_SETS[2].label==="Common Suffixes","Set 3 category label matches");
  ck(w.C6_SETS[3].label==="Multiple Morphemes","Set 4 category label matches");
  ck(w.C6_SETS[4].label==="Academic/Derivational Morphology","Set 5 category label matches");

  /* ---- unlock: Check 6 stays locked until Check 5 is done ---- */
  w.CURCLASS=w.CLASSES[0]; w.READER=w.CLASSES[0].students[0];
  w.go("diagLanding");
  var diagBtns=d.querySelectorAll("#diagLanding .btn"), c6Btn=null, j;
  for(j=0;j<diagBtns.length;j++){ if(diagBtns[j].textContent.indexOf("Check 6:")>-1){ c6Btn=diagBtns[j]; } }
  ck(!!c6Btn && c6Btn.disabled===true,"Check 6 is locked before Check 5 is done");
  ck(c6Btn.className.indexOf("locked")>-1,"Check 6 shows the locked style before Check 5 is done");

  w.ckMarkDone("check1"); w.ckMarkDone("check2"); w.ckMarkDone("check3"); w.ckMarkDone("check4"); w.ckMarkDone("check5");
  w.go("diagLanding");
  diagBtns=d.querySelectorAll("#diagLanding .btn");
  for(j=0;j<diagBtns.length;j++){ if(diagBtns[j].textContent.indexOf("Check 6:")>-1){ c6Btn=diagBtns[j]; } }
  ck(!!c6Btn && c6Btn.disabled!==true,"Check 6 unlocks immediately once Check 5 is done, no reload needed");
  ck(c6Btn.className.indexOf("locked")===-1,"Check 6 no longer shows the locked style");

  /* ---- filename convention ---- */
  ck(/^Miriam_G_P1_CHECK_6_\d{4}_\d{2}_\d{2}\.webm$/.test(w.rfStandardFileName("CHECK_6")),
    "Check 6 uses the standard filename pattern with CHECK_6 (got '"+w.rfStandardFileName("CHECK_6")+"')");

  /* ---- student flow ---- */
  click(c6Btn);
  ck(activeId()==="check6","Check 6 opens");
  ck(d.getElementById("c6-current").style.display==="none","no word shown before Record is tapped");
  ck(!q("#check6 video"),"Check 6 is audio-only -- no camera preview element at all");
  ck(q("#c6-start").textContent==="Start Recording","the primary action is a plain pill button with no icon (locked button rule)");

  w.c6Start();
  setTimeout(function(){
    ck(d.getElementById("c6-current").style.display==="block","first word shows once recording actually starts");
    ck(d.getElementById("c6-current").textContent===w.C6_ITEMS[0].word,"first item is "+w.C6_ITEMS[0].word+" (start of set 6A-1)");
    ck(d.getElementById("c6-progress").textContent==="Item 1 of 50","progress reads Item 1 of 50");
    ck(d.getElementById("c6-section-label").textContent==="6A-1","section label reads 6A-1 for the first item");
    ck(d.getElementById("c6-done").style.display!=="none","the Done-early button is available from the start");
    ck(d.getElementById("c6-start").style.display==="none","Start Recording is hidden once recording begins");

    /* ---- longest actual target (17 letters) must render with no crash and no truncation ---- */
    w.c6Idx=43; w.c6PaintItem();
    ck(d.getElementById("c6-current").textContent==="misunderstanding","the longest Check 6 target (17 letters) renders in full, untruncated");
    ck(d.getElementById("c6-section-label").textContent==="6A-5","misunderstanding is correctly tagged as set 6A-5");

    w.c6Idx=0; w.c6PaintItem();

    /* ---- rapid double-tap protection: two synchronous taps only advance once ---- */
    w.c6NextTap(); w.c6NextTap();
    ck(w.c6Idx===1,"two synchronous Next taps only advanced ONE item (idx now 1, not 2)");

    setTimeout(function(){ // past one animation frame -- a real next tap works again
      w.c6NextTap();
      ck(w.c6Idx===2,"after a frame, a real next tap advances normally (idx now 2)");

      /* ---- jump to the last item to confirm Finish labeling ---- */
      w.c6Idx=49; w.c6PaintItem();
      ck(d.getElementById("c6-current").textContent==="organization","last item is the last 6A-5 word (organization)");
      ck(d.getElementById("c6-next-lbl").textContent==="Finish","the last item's Next button reads Finish");

      /* ---- teacher-controlled early stop: Done works at ANY point ---- */
      w.c6Idx=22; w.c6PaintItem();
      w.c6DoneTap();
      setTimeout(function(){
        ck(!!d.getElementById("c6-review").innerHTML,"Done finalizes the recording straight into review, even mid-check");
        ck(d.getElementById("c6-review").innerHTML.indexOf("Play back")>-1,"a Play back control is offered");
        ck(d.getElementById("c6-review").innerHTML.indexOf("Redo")===-1,"no student Redo on a check -- only View as Student may restart one");
        ck(d.getElementById("c6-review").innerHTML.indexOf("Save")>-1,"a Save control is offered");
        ck(d.querySelectorAll("#c6-review .pill-btn").length>0,"review controls use the new pill-button style");

        /* ---- guard: an empty/failed blob must never be submittable ---- */
        var realBlob=w.c6Blob;
        w.c6Blob=new w.Blob([],{type:"audio/webm"});
        var beforeAttempts=w.C6Attempts.forStudent(w.READER.id).length;
        w.c6Finish();
        ck(w.C6Attempts.forStudent(w.READER.id).length===beforeAttempts,"Save does nothing on an empty recording -- no attempt is ever saved for it");
        w.c6Blob=realBlob;

        w.c6Finish();
        ck(w.__downloads.length===1,"exactly one file downloaded (got "+w.__downloads.length+")");
        ck(/^Miriam_G_P1_CHECK_6_\d{4}_\d{2}_\d{2}\.webm$/.test(w.__downloads[0]),"downloaded file follows the standard naming pattern");
        var yesBtn=d.getElementById("c6-yes-btn");
        ck(!!yesBtn,"a YES button is shown");
        ck(!w.ckDone()["check6"],"Check 6 is not marked done until YES is tapped");

        var attempts=w.C6Attempts.forStudent(w.READER.id);
        ck(attempts.length===1,"one Check 6 attempt saved");
        ck(attempts[0].reachedCount===23,"the saved attempt records how far the student actually got (23 of 50, stopped mid-6A-3)");
        ck(typeof attempts[0].totalTimeMs==="number","administration time is retained");

        click(yesBtn);
        ck(activeId()==="diagLanding","YES returns straight to the Reading Checks dashboard");
        ck(!!w.ckDone()["check6"],"Check 6 marked completed after YES");

        var diagBtns2=d.querySelectorAll("#diagLanding .btn"), foundC6Green=false, c6bBtn=null, c7Btn=null, m;
        for(m=0;m<diagBtns2.length;m++){
          if(diagBtns2[m].textContent.indexOf("Check 6:")>-1 && /Completed/.test(diagBtns2[m].textContent) && diagBtns2[m].className.indexOf("done")>-1){ foundC6Green=true; }
          if(diagBtns2[m].textContent.indexOf("Check 6B")>-1){ c6bBtn=diagBtns2[m]; }
          if(diagBtns2[m].textContent.indexOf("Check 7")>-1){ c7Btn=diagBtns2[m]; }
        }
        ck(foundC6Green,"Check 6 (6A) shows green/Completed on the dashboard");
        /* Check 6B is the very next component -- it unlocks off 6A's completion,
           exactly like every other check-to-check unlock. Check 7 (the NEXT
           diagnostic domain) does NOT unlock yet: 6B is still an unbuilt-until-now
           part of Check 6, so Check 7 correctly stays locked until 6B is done too. */
        ck(!!c6bBtn && c6bBtn.disabled!==true,"Check 6B is not gray/locked once Check 6 (6A) is done");
        ck(!!c6bBtn && c6bBtn.className.indexOf("locked")===-1,"Check 6B uses the normal available style, not the locked style");
        ck(!!c7Btn && c7Btn.disabled===true,"Check 7 stays locked after 6A alone -- it now waits on 6B too");
        ck(!!c7Btn && c7Btn.className.indexOf("locked")>-1,"Check 7 still shows the locked style after 6A alone");

        teacherScoringFlow(attempts[0].id);
      },30);
    },30);
  },30);

  function teacherScoringFlow(attemptId){
    /* ---- teacher scoring: check6Teach ---- */
    w.go("check6Teach");
    ck(activeId()==="check6Teach","teacher review screen opens");
    var studentBtns=d.querySelectorAll("#c6t-roster .btn"), target=null, k;
    for(k=0;k<studentBtns.length;k++){ if(studentBtns[k].textContent.indexOf(w.READER.name)===0){ target=studentBtns[k]; } }
    ck(!!target && /\(1\)/.test(target.textContent),"roster shows the attempt count next to the student's name");
    click(target);
    ck(d.getElementById("c6t-body").textContent.indexOf("Reached 23 of 50")>-1,"teacher sees how far the student actually got");
    var openBtn=q("#c6t-body .mini-btn");
    ck(!!openBtn,"attempt list shows an Open button");
    click(openBtn);

    var totalCells=0, setIds=[], b;
    for(b=0;b<w.C6_SETS.length;b++){
      var cells=d.querySelectorAll("#c6t-grid-"+w.C6_SETS[b].id+" .clean-tile");
      totalCells+=cells.length;
      setIds.push(w.C6_SETS[b].id+"="+cells.length);
    }
    ck(totalCells===50,"50 tappable cells rendered across all 5 set grids (got "+setIds.join(",")+")");

    var longTile=Array.prototype.filter.call(d.querySelectorAll("#c6t-grid-6A-5 .clean-tile"),function(t){return t.textContent.indexOf("misunderstanding")>-1;})[0];
    ck(!!longTile,"the 17-letter word 'misunderstanding' renders as its own scoring tile, untruncated");

    /* items 23+ (index>=23) were never reached -- pre-fill as Not Reached */
    ck(w.c6tScores[22]==="","item 23 (index 22, the last one actually reached) defaults to blank (Correct)");
    ck(w.c6tScores[23]==="nr","item 24 (index 23, past where the student stopped) pre-fills as Not Reached");
    ck(w.c6tScores[49]==="nr","the very last item also pre-fills as Not Reached");

    /* ---- playback speed control: own persisted key, separate from Check 5's ---- */
    var player=d.getElementById("c6t-player");
    ck(player.playbackRate===1,"playback defaults to 1x with no saved preference");
    w.c6tSetSpeed(1.75);
    ck(player.playbackRate===1.75,"choosing 1.75x changes playbackRate immediately");
    ck(q("#c6t-body .speed-btn.on").textContent==="1.75×","the 1.75x button shows as selected");
    w.c6tOpenAttempt(attemptId);
    ck(d.getElementById("c6t-player").playbackRate===1.75,"the chosen playback speed is remembered on this device for the next recording opened");
    ck(w.localStorage.getItem("rf_c5_playback_rate")===null || w.localStorage.getItem("rf_c5_playback_rate")!=="1.75",
      "Check 6's playback speed is stored under its OWN key, never touching Check 5's saved preference");

    /* index 0 (jumps, 6A-1) -> Incorrect; index 1 (wishes) -> Self-corrected;
       index 2 (jumped) -> Skip. (C6T_ORDER is ["","err","sc","skip","nr"]) */
    w.c6tTap(0); // -> err
    w.c6tTap(1); w.c6tTap(1); // -> err -> sc
    w.c6tTap(2); w.c6tTap(2); w.c6tTap(2); // -> err -> sc -> skip
    ck(w.c6tScores[0]==="err" && w.c6tScores[1]==="sc" && w.c6tScores[2]==="skip",
      "the 5-state cycle lands on the exact expected state for each (got: "+[w.c6tScores[0],w.c6tScores[1],w.c6tScores[2]].join(",")+")");

    var results=d.getElementById("c6t-results").textContent;
    /* set 6A-1 has 10 words, reached indices 0-22 (all of 6A-1, since it's only
       the first 10); index0=err, index1=sc(counts correct), index2=skip,
       the rest (7 words, indices 3-9) still blank/Correct -> 8/10 */
    ck(/Inflectional Endings:\s*8\s*\/\s*10/.test(results),"6A-1 tally: self-corrected counts as correct, incorrect/skip do not (got: "+results+")");
    ck(/Self-corrections:\s*1\b/.test(results),"self-correction count is exact");
    ck(/Skips:\s*1(?!\d)/.test(results),"skip count is exact");
    ck(!/Immediate/.test(results) && !/Labored/.test(results),"Check 6 does NOT use Check 5's Immediate/Labored split -- not requested for this build");

    var noteEl=d.getElementById("c6t-note");
    noteEl.value="Substituted a similar-looking word for 'jumps'.";

    w.c6tSave();
    var saved=w.C6Attempts.get(attemptId);
    ck(saved.setCorrect["6A-1"]===8,"6A-1 set score persisted");
    ck(saved.note.indexOf("Substituted")>-1,"teacher note persisted");
    ck(saved.targets.indexOf("jumps")>-1,"an incorrect word is a needs-instruction target");
    ck(saved.targets.indexOf("jumped")>-1,"a skipped word is a needs-instruction target");
    ck(saved.targets.indexOf("wishes")===-1,"a self-corrected word is NOT treated as needing instruction");

    /* ---- Student View preview works even with data already saved ---- */
    w.go("check6Teach");
    var pvBtn=Array.prototype.filter.call(d.querySelectorAll("#check6Teach .mini-btn"),function(b){return /Student View/.test(b.textContent);})[0];
    ck(!!pvBtn,"Check 6 Review has a persistent Student View button");
    click(pvBtn);
    ck(activeId()==="check6","Student View opens the real Check 6 student screen");
    ck(q("#c6-start").className.indexOf("pill-btn")>-1,"the previewed screen uses the new Clean/Professional pill button, not the old style");
    click(q("#preview-banner .vas-exit"));
    ck(activeId()==="check6Teach","exiting preview returns to Check 6 Review");

    regressionScreens();
  }

  function regressionScreens(){
    /* ---- every existing screen still opens (regression protection) ---- */
    w.CURGROUP=w.GROUPS[0];
    var existingScreens=["s-home","s-pick","s-roster","studentMenu","diagLanding","check1","check1Preview","check1Teach",
      "check2","s-teachC2","check2Teach","check3","s-teachC3","check3Teach","check4","check4Teach","check5","check5Teach",
      "check6","check6Teach","check6b","check6bTeach","s-teachDir",
      "s-groups","s-final","s-score","s-board","s-teach","s-settings","s-status","fluencyPassage","fluencyRetell","s-fluteach"];
    var allOk=true, m;
    for(m=0;m<existingScreens.length;m++){
      w.go(existingScreens[m]);
      if(activeId()!==existingScreens[m]){ allOk=false; console.log("FAIL: screen did not open: "+existingScreens[m]); }
    }
    ck(allOk,"every existing screen, plus the 2 new Check 6 screens, still opens");

    /* ---- Checks 1-5 functionally unchanged: spot-check ---- */
    ck(w.C4_ITEMS.length===142,"Check 4 still has 142 items (untouched by this task)");
    ck(w.C5_ITEMS.length===120,"Check 5 still has 120 items (untouched by this task)");
    ck(w.C1_UPPER.length===26,"Check 1's 26-letter uppercase sequence is untouched by this task");

    console.log("\n=== "+pass+" passed, "+fail+" failed ===");
    process.exit(fail?1:0);
  }
},400);
