const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8');

/* Check 2 -- Letter-Sound Knowledge. 31 scored targets (2A 21 consonants +
   2B 5 short vowels + 2C 5 long vowels), one continuous camera+mic video,
   5:00 ceiling with a 4:30 warning, Not Reached distinct from Incorrect,
   immediate unlock of Check 2 once Check 1 is done, standardized filename,
   never marking complete on an empty/failed recording. */
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
    w.__c2Downloads=[];
    var realCreateElement=w.document.createElement.bind(w.document);
    w.document.createElement=function(tag){
      var el=realCreateElement(tag);
      if(tag==="a"){ el.click=function(){ if(el.download){ w.__c2Downloads.push(el.download); } }; }
      return el;
    };
    Object.defineProperty(w.navigator,'mediaDevices',{value:{getUserMedia:function(){
      return Promise.resolve({ getTracks:function(){ return [
        {stop:function(){ w.__tracksStopped++; }},
        {stop:function(){ w.__tracksStopped++; }}
      ]; } });
    }}, configurable:true});
  }
});
const w=dom.window, d=w.document;
function activeId(){ var s=d.getElementsByClassName("screen"); for(var i=0;i<s.length;i++) if(/active/.test(s[i].className)) return s[i].id; return null; }
function click(el){ el.dispatchEvent(new w.Event("click",{bubbles:true})); }
function q(sel){ return d.querySelector(sel); }

setTimeout(function(){
  let pass=0,fail=0;
  function ck(c,m){ if(c){pass++;} else {fail++; console.log("FAIL:",m);} }

  /* ---- content structure ---- */
  ck(w.C2_ITEMS.length===31,"31 total scored targets (got "+w.C2_ITEMS.length+")");
  var n2a=0,n2b=0,n2c=0,i;
  for(i=0;i<w.C2_ITEMS.length;i++){
    if(w.C2_ITEMS[i].section==="2A"){ n2a++; } else if(w.C2_ITEMS[i].section==="2B"){ n2b++; } else if(w.C2_ITEMS[i].section==="2C"){ n2c++; }
  }
  ck(n2a===21,"2A has 21 items (got "+n2a+")");
  ck(n2b===5,"2B has 5 items (got "+n2b+")");
  ck(n2c===5,"2C has 5 items (got "+n2c+")");
  ck(w.C2_CONSONANTS.join(" ")==="m s t p f n r b c h d g l w j k v y z q x","2A consonant order matches the spec exactly");
  ck(w.C2_ITEMS[21].letter==="a" && w.C2_ITEMS[21].keyword==="apple","2B starts with short a / apple");
  ck(w.C2_ITEMS[25].letter==="u" && w.C2_ITEMS[25].keyword==="up","2B ends with short u / up");
  ck(w.C2_ITEMS[26].letter==="a" && w.C2_ITEMS[26].keyword==="apron","2C starts with long a / apron");
  ck(w.C2_ITEMS[30].letter==="u" && w.C2_ITEMS[30].keyword==="unicorn","2C ends with long u / unicorn");
  ck(w.C2_PROMPT_DEFS.length===10,"10 teacher prompt scripts (5 short + 5 long)");

  /* ---- 2026-09-26 keyword corrections: short O -> ox, long E -> me ---- */
  var wholeSrc=fs.readFileSync("./index.html","utf8");
  ck(wholeSrc.indexOf("octopus")===-1,"'octopus' is no longer used anywhere for Check 2's short-O item");
  ck(wholeSrc.indexOf("eagle")===-1,"'eagle' is no longer used anywhere for Check 2's long-E item");
  ck(!/keyword:"even"/.test(wholeSrc),"'even' was NOT introduced as the long-E replacement");
  ck(w.C2_ITEMS[24].letter==="o" && w.C2_ITEMS[24].keyword==="ox" && w.C2_ITEMS[24].promptKey==="c2_short_o","short O now uses the keyword 'ox' (same c2_short_o recording slot)");
  ck(w.C2_ITEMS[27].letter==="e" && w.C2_ITEMS[27].keyword==="me" && w.C2_ITEMS[27].promptKey==="c2_long_e","long E now uses the keyword 'me' (same c2_long_e recording slot)");
  ck(w.C2_ANSWER_KEY["2B"].o==="short o (ox)","teacher answer-key reference updated for short O");
  ck(w.C2_ANSWER_KEY["2C"].e==="long e (me)","teacher answer-key reference updated for long E");
  ck(w.C2_SHORT_VOWELS[0].keyword==="apple" && w.C2_SHORT_VOWELS[1].keyword==="edge" && w.C2_SHORT_VOWELS[2].keyword==="itch" && w.C2_SHORT_VOWELS[4].keyword==="up",
    "the other four short-vowel keywords are unchanged (apple/edge/itch/up)");
  ck(w.C2_LONG_VOWELS[0].keyword==="apron" && w.C2_LONG_VOWELS[2].keyword==="ice" && w.C2_LONG_VOWELS[3].keyword==="open" && w.C2_LONG_VOWELS[4].keyword==="unicorn",
    "the other four long-vowel keywords are unchanged (apron/ice/open/unicorn)");

  /* ---- bug fix: the Check 2 prompt recorder screen actually has working
     Export/Load controls now (it previously only had descriptive text
     with nothing to click) ---- */
  w.go("s-teachC2");
  ck(activeId()==="s-teachC2","Check 2 prompts screen opens");
  var exportBtn=null, loadBtn=null, tbtns=d.querySelectorAll("#s-teachC2 .mini-btn"), tb;
  for(tb=0;tb<tbtns.length;tb++){
    if(/Export/.test(tbtns[tb].textContent)){ exportBtn=tbtns[tb]; }
    if(/Load/.test(tbtns[tb].textContent)){ loadBtn=tbtns[tb]; }
  }
  ck(!!exportBtn,"an actual clickable Export button is present");
  ck(!!loadBtn,"an actual clickable Load button is present");
  ck(!!d.getElementById("c2t-import"),"a file-picker input backs the Load button");
  ck(typeof w.c2tExport==="function" && typeof w.c2tImportPick==="function","c2tExport/c2tImportPick are wired up and don't collide with #t-backup-state on the other recorder screen");
  click(exportBtn);
  ck(d.getElementById("c2t-backup-state").textContent.length>0,"tapping Export updates this screen's own status line without erroring");

  /* ---- Fix 3 filename convention applies to Check 2 too ---- */
  w.CURCLASS=w.CLASSES[0]; w.READER=w.CLASSES[0].students[0];
  ck(/^Miriam_Gomez_P1_CHECK_2_\d{4}_\d{2}_\d{2}\.webm$/.test(w.rfStandardFileName("CHECK_2")),
    "Check 2 uses the standard filename pattern with CHECK_2 (got '"+w.rfStandardFileName("CHECK_2")+"')");

  /* ---- Check 1 completion immediately unlocks Check 2, no reload needed ---- */
  w.ckMarkDone("check1");
  w.go("diagLanding");
  var diagBtns=d.querySelectorAll("#diagLanding .btn"), c2Btn=null, i2;
  for(i2=0;i2<diagBtns.length;i2++){ if(diagBtns[i2].textContent.indexOf("Check 2")>-1){ c2Btn=diagBtns[i2]; } }
  ck(!!c2Btn && c2Btn.disabled!==true,"Check 2 is clickable immediately after Check 1 completes");
  ck(c2Btn.textContent.indexOf("\u{1F512}")===-1,"Check 2's button no longer shows the lock icon once unlocked");

  /* ---- media permission denied: a clear message, never silently continues ---- */
  click(c2Btn);
  ck(activeId()==="check2","Check 2 opens (camera setup screen)");
  var realGUM=w.navigator.mediaDevices.getUserMedia;
  w.navigator.mediaDevices.getUserMedia=function(){ var e=new w.Error("blocked"); e.name="NotAllowedError"; return w.Promise.reject(e); };
  w.c2SetupMedia();
  setTimeout(function(){
    var st=d.getElementById("c2-setup-state");
    ck(st.className.indexOf("err")>-1 && /[Cc]amera/.test(st.textContent),"camera/mic permission denial shows a clear, honest message");
    ck(d.getElementById("c2-start-real").style.display==="none","Start Check 2 never appears if setup failed -- can't begin without a usable recording");

    /* ---- now let it succeed ---- */
    w.navigator.mediaDevices.getUserMedia=realGUM;
    w.c2SetupMedia();
    setTimeout(function(){
      ck(d.getElementById("c2-preview").style.display==="block","camera preview shows once permission succeeds");
      ck(d.getElementById("c2-start-real").style.display!=="none","Start Check 2 appears once camera/mic are ready");
      ck(/face and mouth/.test(d.getElementById("c2-face-note").textContent),"student is told to keep face/mouth visible");

      w.c2StartCheck();
      setTimeout(function(){
        ck(activeId()==="check2","still on check2 (assessment now showing)");
        ck(d.getElementById("c2-assess").style.display==="block","the assessment walk is showing now that recording has actually started");
        ck(d.getElementById("c2-current").textContent==="m","first item is the first 2A consonant (m)");
        ck(d.getElementById("c2-section-label").textContent.indexOf("2A")>-1,"section label reads 2A for the first item");
        ck(d.getElementById("c2-timer").textContent==="5:00","timer reads 5:00 right as recording begins");

        /* ---- rapid double-tap protection: two synchronous taps only advance once ---- */
        w.c2NextTap(); w.c2NextTap();
        ck(d.getElementById("c2-progress").textContent==="Item 2 of 31","two synchronous Next taps only advanced ONE item (now on item 2, not 3)");

        setTimeout(function(){ // past one animation frame -- a real next tap works again
          w.c2NextTap();
          ck(d.getElementById("c2-progress").textContent==="Item 3 of 31","after a frame, a real next tap advances normally");

          /* ---- walk to the 2B boundary and confirm the prompt/keyword wiring ----
             (jump via the underlying c2DoAdvance directly, bypassing the
             frame-paced Next guard -- that guard is already proven above;
             this part is testing the 2A/2B section-boundary behavior) */
          w.c2Idx=19; w.c2PaintItem();
          w.c2DoAdvance();
          ck(d.getElementById("c2-progress").textContent==="Item 21 of 31","reached the last 2A item (21st)");
          ck(d.getElementById("c2-section-label").textContent.indexOf("2A")>-1,"still labeled 2A on item 21");
          w.c2DoAdvance();
          setTimeout(function(){
            ck(d.getElementById("c2-progress").textContent==="Item 22 of 31","advanced into 2B");
            ck(d.getElementById("c2-section-label").textContent.indexOf("2B")>-1,"section label switched to 2B");
            ck(d.getElementById("c2-current").textContent==="a","first 2B item shows the bare vowel letter (no keyword text shown on screen)");
            ck(d.getElementById("c2-prompt-row").style.display==="block","a prompt/replay control shows for vowel items");
            ck(/been recorded yet/.test(d.getElementById("c2-state").textContent),"honest message shown when the teacher hasn't recorded this prompt yet (never fakes audio)");

            /* ---- timer: 4:30 warning and 5:00 hard stop, driven by the actual clock logic ---- */
            w.c2StartAt = new Date().getTime() - 271000; // 4:31 elapsed
            w.c2TickTimer();
            ck(d.getElementById("c2-warn").style.display==="block","4:30 warning shows once 4:31 has elapsed");
            ck(/30 seconds remaining/.test(d.getElementById("c2-warn").textContent),"warning text matches exactly");

            w.c2StartAt = new Date().getTime() - 300500; // past 5:00
            w.c2TickTimer();
            ck(w.c2HardStopped===true,"5:00 hard stop triggers");
            ck(w.c2NotReachedFrom===22,"everything from the next unreached item on is marked Not Reached (stopped after item 22, index 21)");
            ck(activeId()==="check2","hard stop still keeps the student on check2 (moves to review, not away)");
            ck(!!d.getElementById("c2-review").innerHTML,"hard stop finalizes the recording straight into review");

            finishReviewFlow();
          },30);
        },30);
      },30);
    },30);
  },30);

  function finishReviewFlow(){
    /* ---- review: Watch/Stop + Record Again + Submit; never marks complete on empty blob ---- */
    ck(d.getElementById("c2-review").innerHTML.indexOf("Watch Recording")>-1,"a Watch Recording control is offered");
    ck(d.getElementById("c2-review").innerHTML.indexOf("Record Again")>-1,"a Record Again control is offered");
    ck(d.getElementById("c2-review").innerHTML.indexOf("Submit Recording")>-1,"a Submit Recording control is offered");

    w.c2ToggleListen();
    ck(/Stop/.test(d.getElementById("c2-listen-btn").textContent),"Stop control appears once playback starts");
    w.c2ToggleListen();
    ck(/Watch Recording/.test(d.getElementById("c2-listen-btn").textContent),"Stop returns to Watch Recording, ready to play again");

    /* ---- guard: an empty/failed blob must never be submittable ---- */
    var realBlob=w.c2Blob;
    w.c2Blob=new w.Blob([],{type:"video/webm"});
    var beforeAttempts=w.C2Attempts.forStudent(w.READER.id).length;
    w.c2Finish();
    ck(w.C2Attempts.forStudent(w.READER.id).length===beforeAttempts,"Submit does nothing on an empty recording -- no attempt is ever saved for it");
    w.c2Blob=realBlob;

    w.c2Finish();
    var webmDownloads=w.__c2Downloads.filter(function(f){ return /\.webm$/.test(f); });
    ck(webmDownloads.length===1,"exactly one video file downloaded (got "+webmDownloads.length+"; unrelated JSON export backups, if any, are ignored here)");
    ck(/^Miriam_Gomez_P1_CHECK_2_\d{4}_\d{2}_\d{2}\.webm$/.test(webmDownloads[0]),"downloaded file follows the standard naming pattern (got '"+webmDownloads[0]+"')");
    ck(/Did you submit your video file\?/.test(d.getElementById("c2-review").textContent),"asks the student to confirm submission");
    var yesBtn=d.getElementById("c2-yes-btn");
    ck(!!yesBtn,"a YES button is shown");
    ck(!w.ckDone()["check2"],"Check 2 is not marked done until YES is tapped");

    var attempts=w.C2Attempts.forStudent(w.READER.id);
    ck(attempts.length===1,"one Check 2 attempt saved");
    ck(attempts[0].reachedCount===22,"the saved attempt records how far the student actually got (22 of 31)");

    click(yesBtn);
    ck(activeId()==="diagLanding","YES returns straight to the Reading Checks dashboard");
    ck(!!w.ckDone()["check2"],"Check 2 marked completed after YES");
    ck(w.__tracksStopped>=2,"camera/mic tracks were released once the check2 screen was exited ("+w.__tracksStopped+" stopped)");

    var diagBtns2=d.querySelectorAll("#diagLanding .btn"), foundC2Green=false, c3Btn=null, j;
    for(j=0;j<diagBtns2.length;j++){
      if(diagBtns2[j].textContent.indexOf("Check 2")>-1 && /Completed/.test(diagBtns2[j].textContent) && diagBtns2[j].className.indexOf("done")>-1){ foundC2Green=true; }
      if(diagBtns2[j].textContent.indexOf("Check 3")>-1){ c3Btn=diagBtns2[j]; }
    }
    ck(foundC2Green,"Check 2 shows green/Completed on the dashboard");
    /* Check 3 is now logically unlocked (Check 2 is done) but has no real
       screen yet -- it must show in its normal available style (not gray/
       locked) and tapping it must say "Coming soon!" rather than opening
       a broken screen. */
    ck(!!c3Btn && c3Btn.disabled!==true,"Check 3 is not gray/locked once Check 2 is done, even though it isn't built yet");
    ck(!!c3Btn && c3Btn.className.indexOf("locked")===-1,"Check 3 uses the normal available style, not the locked style");
    click(c3Btn);
    ck(activeId()==="diagLanding","tapping the not-yet-built Check 3 never navigates anywhere");
    ck(/Coming soon!/.test(d.getElementById("diag-comingsoon-note").textContent),"tapping it shows 'Coming soon!' instead of a broken screen");
    ck(d.getElementById("diag-alldone").style.display==="none","no final-completion banner yet (Checks 3-7 aren't built/done)");

    teacherScoringFlow(attempts[0].id);
  }

  function teacherScoringFlow(attemptId){
    /* ---- teacher scoring: check2Teach ---- */
    w.go("check2Teach");
    ck(activeId()==="check2Teach","teacher review screen opens");
    var studentBtns=d.querySelectorAll("#c2t-roster .btn"), target=null, k;
    for(k=0;k<studentBtns.length;k++){ if(studentBtns[k].textContent.indexOf(w.READER.name)===0){ target=studentBtns[k]; } }
    ck(!!target && /\(1\)/.test(target.textContent),"roster shows the attempt count next to the student's name");
    click(target);
    var openBtn=q("#c2t-body .mini-btn");
    ck(!!openBtn,"attempt list shows an Open button");
    click(openBtn);

    ck(d.getElementById("c2t-body").textContent.indexOf("Reached 22 of 31")>-1,"teacher sees how far the student actually got");
    var a2aCells=d.querySelectorAll("#c2t-2a-grid .c1t-cell");
    var a2bCells=d.querySelectorAll("#c2t-2b-grid .c1t-cell");
    var a2cCells=d.querySelectorAll("#c2t-2c-grid .c1t-cell");
    ck(a2aCells.length===21 && a2bCells.length===5 && a2cCells.length===5,"31 tappable cells rendered across the three sections (21+5+5)");

    /* items 0-21 were reached (index<22), items 22-30 auto-prefill Not Reached */
    ck(a2bCells[0].className.indexOf("skip")===-1,"item 22 (2B index 0) was still reached right as time ran out -- defaults to blank/Correct, not Not Reached");
    ck(a2bCells[1].className.indexOf("skip")>-1,"item 23 (2B index 1), past where the student's 22 reached items stopped, pre-fills as Not Reached");
    ck(a2cCells[4].className.indexOf("skip")>-1,"the very last item also pre-fills as Not Reached");
    ck(a2aCells[0].className.indexOf("err")===-1 && a2aCells[0].className.indexOf("sc")===-1,"a reached item defaults to blank/Correct, not pre-judged");

    /* index 0 (m) -> Incorrect; index 1 (s) -> Self-corrected; index 2 (t) -> Letter-name substitution;
       index 3 (p) -> Acceptable alternate; index 4 (f) -> Skip */
    w.c2tTap(0);
    w.c2tTap(1); w.c2tTap(1);
    w.c2tTap(2); w.c2tTap(2); w.c2tTap(2);
    w.c2tTap(3); w.c2tTap(3); w.c2tTap(3); w.c2tTap(3);
    w.c2tTap(4); w.c2tTap(4); w.c2tTap(4); w.c2tTap(4); w.c2tTap(4);
    var results=d.getElementById("c2t-results").textContent;
    ck(/2A Consonant Sound Retrieval:\s*18\s*\/\s*21/.test(results),"2A tally: self-corrected + acceptable alternate count as correct, incorrect/letter-name-sub/skip do not, Not Reached excluded (got: "+results+")");
    ck(/Letter-name substitutions:\s*t/.test(results),"letter-name substitution tracked and named separately");
    ck(/Acceptable alternates:\s*p/.test(results),"acceptable alternate tracked and named separately");
    ck(/Self-corrections:\s*1/.test(results),"self-correction counted");
    ck(/Not Reached[^:]*:\s*.*short a/.test(results) || /Not Reached/.test(results),"Not Reached items listed, never folded into Incorrect");

    /* sound-production observation is independent of correctness -- flag item 5 (n, currently blank/Correct) */
    w.c2tToggleObs({stopPropagation:function(){}},5);
    var resultsAfterObs=d.getElementById("c2t-results").textContent;
    ck(/Sound-production observations[^:]*:\s*n\b/.test(resultsAfterObs),"observation flag recorded");
    ck(/2A Consonant Sound Retrieval:\s*18\s*\/\s*21/.test(resultsAfterObs),"flagging an observation on an otherwise-correct item does NOT change its correctness or the tally");

    w.c2tSave();
    var saved=w.C2Attempts.get(attemptId);
    ck(saved.c2aCorrect===18,"2A score persisted");
    ck(saved.targets.indexOf("t")>-1 && saved.targets.indexOf("f")>-1,"missed/needs-instruction targets saved (incorrect, letter-name-sub, skip) -- not the self-corrected or acceptable-alternate ones");
    ck(saved.targets.indexOf("s")===-1 && saved.targets.indexOf("p")===-1,"self-corrected and acceptable-alternate items are NOT treated as needing instruction");

    /* ---- every existing screen still opens (regression protection) ---- */
    w.CURGROUP=w.GROUPS[0];
    var existingScreens=["s-home","s-pick","s-roster","studentMenu","diagLanding","check1","check1Preview","check1Teach","check2","s-teachC2","check2Teach","s-groups","s-final","s-score","s-board","s-teach","s-settings","s-status","fluencyPassage","fluencyRetell","s-fluteach"];
    var allOk=true, m;
    for(m=0;m<existingScreens.length;m++){
      w.go(existingScreens[m]);
      if(activeId()!==existingScreens[m]){ allOk=false; console.log("FAIL: screen did not open: "+existingScreens[m]); }
    }
    ck(allOk,"every existing screen (Check 1 included) still opens");

    console.log("\n=== "+pass+" passed, "+fail+" failed ===");
    process.exit(fail?1:0);
  }
},400);
