const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8').replace('<script src="clips.js" defer></script>','<script>'+fs.readFileSync('./clips.js','utf8')+'</script>');

/* Check 5 -- Automatic Word Recognition. 120 printed-word items across 6
   locked sets (5A-5F, 20 each), ONE continuous AUDIO recording (no
   camera, same audio-only architecture as Check 1/4), no model
   audio/hints, teacher-controlled early stop via the existing Done-early
   button, immediate unlock once Check 4 is done, standardized filename,
   never marking complete on an empty recording. New for Check 5: the
   Clean/Professional visual style (pill buttons, muted small icons,
   fit-to-content tiles), a 6-state teacher scoring cycle that preserves
   the accuracy-vs-automaticity distinction (blank = Correct/Immediate,
   the fast default; Labored/Decoded is a separate state), a persisted
   playback-speed control, and keyboard shortcuts for grading. */
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
    /* jsdom's native HTMLMediaElement.paused is a getter with no setter, so a
       plain assignment silently no-ops -- give play()/pause() an own
       data property on the element itself so it actually flips. */
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
  ck(w.C5_ITEMS.length===120,"120 total items (got "+w.C5_ITEMS.length+")");
  var expectCounts={"5A":20,"5B":20,"5C":20,"5D":20,"5E":20,"5F":20};
  var i, allSetsOk=true;
  for(i=0;i<w.C5_SETS.length;i++){
    var s=w.C5_SETS[i];
    if(s.words.length!==expectCounts[s.id]){ allSetsOk=false; console.log("FAIL: set "+s.id+" expected "+expectCounts[s.id]+" got "+s.words.length); }
  }
  ck(allSetsOk,"every set is exactly 20 words (6 x 20 = 120)");
  ck(w.C5_SETS.length===6,"exactly 6 sets, none merged/added/removed");

  var words=w.C5_ITEMS.map(function(x){return x.word.toLowerCase();});
  var seen={}, dupes=[];
  words.forEach(function(x){ if(seen[x]){ dupes.push(x); } seen[x]=(seen[x]||0)+1; });
  ck(dupes.length===0,"no duplicate targets within Check 5 (dupes: "+dupes.join(",")+")");

  var rejectedOverlap=["he","she","in","at","this","when","up","these","her","make","time","look","go","no","number","first","oil","day","important","information","problem","different"];
  var reintroduced=rejectedOverlap.filter(function(x){return seen[x];});
  ck(reintroduced.length===0,"none of the previously-rejected overlap words have returned (found: "+reintroduced.join(",")+")");
  ck(!seen["oil"],"no 'oil' artifact (this is not the rejected Fry-like bank)");

  var expected5C=["read","write","say","tell","ask","answer","choose","match","circle","underline","complete","explain","describe","compare","show","find","use","check","turn","start"];
  ck(w.C5_SETS[2].words.join(",")===expected5C.join(","),"5C matches the exact QC-corrected word list, in order (select->match already applied)");

  /* ---- unlock: Check 5 stays locked until Check 4 is done ---- */
  w.CURCLASS=w.CLASSES[0]; w.READER=w.CLASSES[0].students[0];
  w.go("diagLanding");
  var diagBtns=d.querySelectorAll("#diagLanding .btn"), c5Btn=null, j;
  for(j=0;j<diagBtns.length;j++){ if(diagBtns[j].textContent.indexOf("Check 5")>-1){ c5Btn=diagBtns[j]; } }
  ck(!!c5Btn && c5Btn.disabled===true,"Check 5 is locked before Check 4 is done");
  ck(c5Btn.className.indexOf("locked")>-1,"Check 5 shows the locked style before Check 4 is done");

  w.ckMarkDone("check1"); w.ckMarkDone("check2"); w.ckMarkDone("check3"); w.ckMarkDone("check4");
  w.go("diagLanding");
  diagBtns=d.querySelectorAll("#diagLanding .btn");
  for(j=0;j<diagBtns.length;j++){ if(diagBtns[j].textContent.indexOf("Check 5")>-1){ c5Btn=diagBtns[j]; } }
  ck(!!c5Btn && c5Btn.disabled!==true,"Check 5 unlocks immediately once Check 4 is done, no reload needed");
  ck(c5Btn.className.indexOf("locked")===-1,"Check 5 no longer shows the locked style");

  /* ---- filename convention ---- */
  ck(/^Miriam_G_P1_CHECK_5_\d{4}_\d{2}_\d{2}\.webm$/.test(w.rfStandardFileName("CHECK_5")),
    "Check 5 uses the standard filename pattern with CHECK_5 (got '"+w.rfStandardFileName("CHECK_5")+"')");

  /* ---- student flow ---- */
  click(c5Btn);
  ck(activeId()==="check5","Check 5 opens");
  ck(d.getElementById("c5-current").style.display==="none","no word shown before Record is tapped");
  ck(!q("#check5 video"),"Check 5 is audio-only -- no camera preview element at all");
  ck(q("#c5-start").textContent==="Start Recording","the primary action is a plain pill button with no icon (locked button rule)");

  w.c5Start();
  setTimeout(function(){
    ck(d.getElementById("c5-current").style.display==="block","first word shows once recording actually starts");
    ck(d.getElementById("c5-current").textContent===w.C5_ITEMS[0].word,"first item is "+w.C5_ITEMS[0].word+" (start of set 5A)");
    ck(d.getElementById("c5-progress").textContent==="Item 1 of 120","progress reads Item 1 of 120");
    ck(d.getElementById("c5-section-label").textContent==="5A","section label reads 5A for the first item");
    ck(d.getElementById("c5-done").style.display!=="none","the Done-early button is available from the start");
    ck(d.getElementById("c5-start").style.display==="none","Start Recording is hidden once recording begins");

    /* ---- rapid double-tap protection: two synchronous taps only advance once ---- */
    w.c5NextTap(); w.c5NextTap();
    ck(w.c5Idx===1,"two synchronous Next taps only advanced ONE item (idx now 1, not 2)");

    setTimeout(function(){ // past one animation frame -- a real next tap works again
      w.c5NextTap();
      ck(w.c5Idx===2,"after a frame, a real next tap advances normally (idx now 2)");

      /* ---- jump to the last item to confirm Finish labeling ---- */
      w.c5Idx=119; w.c5PaintItem();
      ck(d.getElementById("c5-current").textContent==="meaning","last item is the last 5F word (meaning)");
      ck(d.getElementById("c5-section-label").textContent==="5F","section label reads 5F");
      ck(d.getElementById("c5-next-lbl").textContent==="Finish","the last item's Next button reads Finish");

      /* ---- teacher-controlled early stop: Done works at ANY point, not just the end ---- */
      w.c5Idx=50; w.c5PaintItem();
      w.c5DoneTap();
      setTimeout(function(){
        ck(!!d.getElementById("c5-review").innerHTML,"Done finalizes the recording straight into review, even mid-check");
        ck(d.getElementById("c5-review").innerHTML.indexOf("Play back")>-1,"a Play back control is offered");
        ck(d.getElementById("c5-review").innerHTML.indexOf("Redo")===-1,"no student Redo on a check -- only View as Student may restart one");
        ck(d.getElementById("c5-review").innerHTML.indexOf("Save")>-1,"a Save control is offered");
        ck(d.querySelectorAll("#c5-review .pill-btn").length>0,"review controls use the new pill-button style");

        /* ---- guard: an empty/failed blob must never be submittable ---- */
        var realBlob=w.c5Blob;
        w.c5Blob=new w.Blob([],{type:"audio/webm"});
        var beforeAttempts=w.C5Attempts.forStudent(w.READER.id).length;
        w.c5Finish();
        ck(w.C5Attempts.forStudent(w.READER.id).length===beforeAttempts,"Save does nothing on an empty recording -- no attempt is ever saved for it");
        w.c5Blob=realBlob;

        w.c5Finish();
        ck(w.__downloads.length===1,"exactly one file downloaded (got "+w.__downloads.length+")");
        ck(/^Miriam_G_P1_CHECK_5_\d{4}_\d{2}_\d{2}\.webm$/.test(w.__downloads[0]),"downloaded file follows the standard naming pattern (got '"+w.__downloads[0]+"')");
        var yesBtn=d.getElementById("c5-yes-btn");
        ck(!!yesBtn,"a YES button is shown");
        ck(!w.ckDone()["check5"],"Check 5 is not marked done until YES is tapped");

        var attempts=w.C5Attempts.forStudent(w.READER.id);
        ck(attempts.length===1,"one Check 5 attempt saved");
        ck(attempts[0].reachedCount===51,"the saved attempt records how far the student actually got (51 of 120, stopped mid-5C)");
        ck(typeof attempts[0].totalTimeMs==="number","pilot timing data (total administration time) is retained");

        click(yesBtn);
        ck(activeId()==="diagLanding","YES returns straight to the Reading Checks dashboard");
        ck(!!w.ckDone()["check5"],"Check 5 marked completed after YES");

        var diagBtns2=d.querySelectorAll("#diagLanding .btn"), foundC5Green=false, c6Btn=null, m;
        for(m=0;m<diagBtns2.length;m++){
          if(diagBtns2[m].textContent.indexOf("Check 5")>-1 && /Completed/.test(diagBtns2[m].textContent) && diagBtns2[m].className.indexOf("done")>-1){ foundC5Green=true; }
          if(diagBtns2[m].textContent.indexOf("Check 6:")>-1){ c6Btn=diagBtns2[m]; }
        }
        ck(foundC5Green,"Check 5 shows green/Completed on the dashboard");
        ck(!!c6Btn && c6Btn.disabled!==true,"Check 6 is not gray/locked once Check 5 is done");
        ck(!!c6Btn && c6Btn.className.indexOf("locked")===-1,"Check 6 uses the normal available style, not the locked style");
        click(c6Btn);
        ck(activeId()==="check6","tapping Check 6 navigates to the real Check 6 screen now that it's built");
        w.go("diagLanding");

        teacherScoringFlow(attempts[0].id);
      },30);
    },30);
  },30);

  function teacherScoringFlow(attemptId){
    /* ---- teacher scoring: check5Teach ---- */
    w.go("check5Teach");
    ck(activeId()==="check5Teach","teacher review screen opens");
    var studentBtns=d.querySelectorAll("#c5t-roster .btn"), target=null, k;
    for(k=0;k<studentBtns.length;k++){ if(studentBtns[k].textContent.indexOf(w.READER.name)===0){ target=studentBtns[k]; } }
    ck(!!target && /\(1\)/.test(target.textContent),"roster shows the attempt count next to the student's name");
    click(target);
    ck(d.getElementById("c5t-body").textContent.indexOf("Reached 51 of 120")>-1,"teacher sees how far the student actually got");
    var openBtn=q("#c5t-body .mini-btn");
    ck(!!openBtn,"attempt list shows an Open button");
    click(openBtn);

    var totalCells=0, setIds=[], b;
    for(b=0;b<w.C5_SETS.length;b++){
      var cells=d.querySelectorAll("#c5t-grid-"+w.C5_SETS[b].id+" .clean-tile");
      totalCells+=cells.length;
      setIds.push(w.C5_SETS[b].id+"="+cells.length);
    }
    ck(totalCells===120,"120 tappable cells rendered across all 6 set grids (got "+setIds.join(",")+")");

    /* items 51+ (index>=51) were never reached -- pre-fill as Not Reached */
    ck(w.c5tScores[50]==="","item 51 (index 50, the last one actually reached) defaults to blank (Correct/Immediate)");
    ck(w.c5tScores[51]==="nr","item 52 (index 51, past where the student stopped) pre-fills as Not Reached");
    ck(w.c5tScores[119]==="nr","the very last item also pre-fills as Not Reached");

    /* ---- playback speed control: persists across opens, sets playbackRate live ---- */
    var player=d.getElementById("c5t-player");
    ck(player.playbackRate===1,"playback defaults to 1x with no saved preference");
    w.c5tSetSpeed(1.5);
    ck(player.playbackRate===1.5,"choosing 1.5x changes playbackRate immediately, even while a file could be playing");
    ck(q("#c5t-body .speed-btn.on").textContent==="1.5×","the 1.5x button shows as selected");
    w.c5tOpenAttempt(attemptId); // re-open the same attempt (like opening the next student)
    ck(d.getElementById("c5t-player").playbackRate===1.5,"the chosen playback speed is remembered on this device for the next recording opened");

    /* ---- keyboard shortcuts: space play/pause, arrows seek 5s -- only while check5Teach is active ---- */
    player=d.getElementById("c5t-player");
    player.paused=true; player.currentTime=10; player.duration=60;
    d.dispatchEvent(new w.KeyboardEvent("keydown",{key:" ",code:"Space",bubbles:true}));
    ck(player.paused===false,"Space starts playback when paused");
    d.dispatchEvent(new w.KeyboardEvent("keydown",{key:" ",code:"Space",bubbles:true}));
    ck(player.paused===true,"Space pauses playback when playing");
    d.dispatchEvent(new w.KeyboardEvent("keydown",{key:"ArrowRight",bubbles:true}));
    ck(player.currentTime===15,"Right arrow seeks forward 5 seconds (10 -> 15)");
    d.dispatchEvent(new w.KeyboardEvent("keydown",{key:"ArrowLeft",bubbles:true}));
    ck(player.currentTime===10,"Left arrow seeks back 5 seconds (15 -> 10)");
    var noteEl0=d.getElementById("c5t-note");
    noteEl0.dispatchEvent(new w.KeyboardEvent("keydown",{key:" ",code:"Space",bubbles:true,cancelable:true}));
    ck(player.currentTime===10 && player.paused===true,"keyboard shortcuts are ignored while typing in the note field");

    /* index 0 (and, 5A) -> Incorrect; index 1 (or, 5A) -> Labored/Decoded; index 2 (but, 5A) -> Self-corrected;
       index 3 (because, 5A) -> Skip. (C5T_ORDER is ["","lab","err","sc","skip","nr"]: 1 tap=lab, 2=err, 3=sc, 4=skip) */
    w.c5tTap(0); w.c5tTap(0); // -> lab -> err
    w.c5tTap(1); // -> lab
    w.c5tTap(2); w.c5tTap(2); w.c5tTap(2); // -> lab -> err -> sc
    w.c5tTap(3); w.c5tTap(3); w.c5tTap(3); w.c5tTap(3); // -> lab -> err -> sc -> skip
    ck(w.c5tScores[0]==="err" && w.c5tScores[1]==="lab" && w.c5tScores[2]==="sc" && w.c5tScores[3]==="skip",
      "the 6-state cycle lands on the exact expected state for each (got: "+[w.c5tScores[0],w.c5tScores[1],w.c5tScores[2],w.c5tScores[3]].join(",")+")");

    var results=d.getElementById("c5t-results").textContent;
    /* set 5A has 20 words; index0=err, index1=lab, index2=sc, index3=skip -- lab AND sc
       both count as correct, so 5A = 18/20 (only err+skip are wrong). Globally, 51 of
       120 items were reached (indices 0-50); of those, 47 are still blank/Immediate
       (51 reached - the 4 items just tapped away from blank). */
    ck(/5A Core classroom connectors & pronouns:\s*18\s*\/\s*20/.test(results),"5A tally: self-corrected AND labored both count as correct, incorrect/skip do not (got: "+results+")");
    ck(/Correct — Immediate:\s*47\b/.test(results),"Immediate count is every still-blank REACHED item, excluding labored/self-corrected/incorrect/skip/not-reached (got: "+results+")");
    ck(/Correct — Labored\/Decoded:\s*1\b/.test(results),"Labored/Decoded is tracked as its own separate count, never merged into Immediate");
    ck(/Incorrect:\s*1\b/.test(results),"Incorrect count is exact");
    ck(/Self-Corrected:\s*1\b/.test(results),"Self-Corrected count is exact");
    ck(/Skips:\s*1(?!\d)/.test(results),"Skip count is exact");

    /* flag an item for an error pattern -- independent of correctness */
    w.c5tToggleFlag({stopPropagation:function(){}},2);
    var resultsAfterFlag=d.getElementById("c5t-results").textContent;
    ck(/Flagged for an error pattern[^:]*:\s*but\b/.test(resultsAfterFlag),"flag recorded and named");
    ck(/5A Core classroom connectors & pronouns:\s*18\s*\/\s*20/.test(resultsAfterFlag),"flagging an item does NOT change its correctness or the tally");

    var noteEl=d.getElementById("c5t-note");
    noteEl.value="Labored on 'or' -- sounded it out letter by letter before landing on the word.";

    w.c5tSave();
    var saved=w.C5Attempts.get(attemptId);
    ck(saved.setCorrect["5A"]===18,"5A set score persisted");
    ck(saved.immediateCount===47 && saved.laboredCount===1 && saved.incorrectCount===1 && saved.selfCorrectedCount===1 && saved.skipCount===1,
      "every category persisted separately, never collapsed (got imm="+saved.immediateCount+" lab="+saved.laboredCount+" err="+saved.incorrectCount+" sc="+saved.selfCorrectedCount+" skip="+saved.skipCount+")");
    ck(saved.note.indexOf("Labored")>-1,"teacher note persisted");
    ck(saved.targets.indexOf("and")>-1,"an incorrect word is a needs-instruction target");
    ck(saved.targets.indexOf("or")>-1,"a labored/decoded word IS a needs-instruction target (not automatic yet, per the older canonical Check 5 spec)");
    ck(saved.targets.indexOf("because")>-1,"a skipped word is a needs-instruction target");
    ck(saved.targets.indexOf("but")===-1,"a self-corrected word is NOT treated as needing instruction");

    skipTimeoutFlow();
  }

  function skipTimeoutFlow(){
    /* ---- Section 6: Skip button, hidden auto-skip timer, 5-skip-streak set-jump,
       final-set finish, timestamp logging, and the matching teacher-side display ---- */
    w.go("diagLanding");
    var diagBtns3=d.querySelectorAll("#diagLanding .btn"), c5Btn2=null, mm;
    for(mm=0;mm<diagBtns3.length;mm++){ if(diagBtns3[mm].textContent.indexOf("Check 5")>-1){ c5Btn2=diagBtns3[mm]; } }
    click(c5Btn2);
    ck(activeId()==="check5","Check 5 re-opens for the skip/timeout pass");
    ck(q("#c5-skip")&&q("#c5-skip").textContent==="Skip","a Skip button is present next to Next");
    ck(q("#c5-skip").className.indexOf("pill-btn")>-1,"Skip uses the clean pill-button style");
    ck(d.getElementById("c5-intro").textContent.indexOf("If you don’t know it, tap Skip.")>-1,"directions mention Skip");

    w.c5Start();
    setTimeout(function(){
      ck(w.c5Idx===0,"skip/timeout pass starts fresh at item 0");

      /* ---- a single tapped Skip just advances, like Next, and counts toward the streak.
         (the rapid-double-tap-protection lock is a per-physical-tap debounce, already
         covered above -- reset it between these deliberately separate taps so it doesn't
         swallow them, exactly as a real animation frame boundary would.) ---- */
      w.c5SkipTap();
      w.c5NextLock=false;
      ck(w.c5Idx===1,"a single Skip tap advances to the next item");
      ck(w.c5SkipStreak===1,"skip streak is now 1");
      w.c5NextTap();
      w.c5NextLock=false;
      ck(w.c5SkipStreak===0,"a real Next tap resets the skip streak back to 0");
      ck(w.c5Idx===2,"Next still advances normally after a skip");

      /* ---- the hidden 5-second auto-skip timer behaves exactly like a tapped Skip
         (simulated directly -- no need to block the test on a real 5-second wait) ---- */
      var idxBefore=w.c5Idx;
      w.c5ClearAutoTimer();
      w.c5AutoSkip();
      ck(w.c5Idx===idxBefore+1,"an auto-skip (simulated timeout) advances exactly like a tapped Skip");
      ck(w.c5Timestamps[w.c5Timestamps.length-1].action==="timeout","the timeout is logged as its own distinct action, not 'skip'");
      ck(w.c5Timestamps[w.c5Timestamps.length-1].idx===idxBefore,"the timeout is logged against the item that timed out");

      /* ---- 5 skips in a row mid-check ends THAT SET only, jumps to the next set ---- */
      w.c5Idx=5; w.c5PaintItem(); w.c5SkipStreak=0;
      w.c5SkipTap(); w.c5NextLock=false;
      w.c5SkipTap(); w.c5NextLock=false;
      w.c5SkipTap(); w.c5NextLock=false;
      w.c5SkipTap(); w.c5NextLock=false;
      ck(w.c5Idx===9,"four skips in a row just advance one at a time (streak below 5)");
      ck(w.c5SkipStreak===4,"skip streak is 4 just before the 5th");
      w.c5SkipTap(); w.c5NextLock=false; // 5th skip in a row -> ends set 5A, jumps to 5B
      ck(w.c5SkipStreak===0,"the streak resets to 0 once it triggers the set-jump");
      ck(w.c5Idx===w.C5_SET_START[1],"5 skips in a row jumps straight to the first item of the next set (5B), skipping the rest of 5A");
      ck(w.c5NotReachedIdx.indexOf(10)>-1 && w.c5NotReachedIdx.indexOf(19)>-1,
        "every remaining un-reached item in 5A (10 through 19) is recorded as Not Reached (got: "+w.c5NotReachedIdx.join(",")+")");
      ck(w.c5NotReachedIdx.length===10,"exactly the 10 remaining 5A items (indices 10-19) are marked Not Reached so far, no more no less");

      /* ---- 5 skips in a row on the VERY LAST set ends the whole check, not just the set ---- */
      w.c5Idx=110; w.c5PaintItem(); w.c5SkipStreak=0;
      w.c5SkipTap(); w.c5NextLock=false;
      w.c5SkipTap(); w.c5NextLock=false;
      w.c5SkipTap(); w.c5NextLock=false;
      w.c5SkipTap(); w.c5NextLock=false;
      w.c5SkipTap(); w.c5NextLock=false;
      setTimeout(function(){
        ck(w.c5EndedViaFinalStreak===true,"5 skips in a row on the final set ends the WHOLE check (no next set to jump to)");
        ck(d.getElementById("c5-state").textContent==="Great work! You’re done.","the final-set streak shows the special finishing message, not the generic one");
        ck(w.c5NotReachedIdx.length===15,"Not Reached now totals the earlier 5A gap (10) plus the final 5F gap (5) = 15 (got "+w.c5NotReachedIdx.length+")");

        w.c5Finish();
        var attempts2=w.C5Attempts.forStudent(w.READER.id);
        var lastAttempt=attempts2[attempts2.length-1];
        ck(lastAttempt.notReachedIdx.length===15,"the saved attempt records all 15 Not Reached items from both gaps");
        ck(lastAttempt.notReachedIdx.indexOf(115)>-1 && lastAttempt.notReachedIdx.indexOf(119)>-1,"the final-set gap (115-119) is in the saved Not Reached list");
        ck(Array.isArray(lastAttempt.timestamps) && lastAttempt.timestamps.length>0,"every Next/Skip/Done/timeout tap is logged with a timestamp in the saved attempt");

        /* ---- teacher screen: seconds-per-word, timeout marking, Not-Reached pre-fill, click-to-seek ---- */
        w.go("check5Teach");
        w.c5tPick(0);
        var studentBtns2=d.querySelectorAll("#c5t-roster .btn"), target2=null, kk;
        for(kk=0;kk<studentBtns2.length;kk++){ if(studentBtns2[kk].textContent.indexOf(w.READER.name)===0){ target2=studentBtns2[kk]; } }
        click(target2);
        var openBtns=d.querySelectorAll("#c5t-body .mini-btn");
        click(openBtns[openBtns.length-1]); // open the most recently saved attempt
        ck(w.C5T_ATTEMPT===lastAttempt.id,"the teacher opened the most recently saved attempt");

        ck(w.c5tScores[10]==="nr" && w.c5tScores[19]==="nr","the mid-check 5A gap pre-fills as Not Reached on the teacher screen too");
        ck(w.c5tScores[115]==="nr" && w.c5tScores[119]==="nr","the final 5F gap also pre-fills as Not Reached");
        ck(w.c5tScores[9]!=="nr","an item that was actually reached (just skipped) is NOT marked Not Reached");

        var cell0=q("#c5t-grid-5A .clean-tile");
        ck(cell0.innerHTML.indexOf("mini-note")>-1,"the first tile shows a grayed seconds-per-word helper line");
        var timeoutCell=d.querySelectorAll("#c5t-grid-5A .clean-tile")[2];
        ck(!!timeoutCell && timeoutCell.innerHTML.indexOf("timed out")>-1,"the item that auto-skipped via the hidden timer is marked as timed out on the teacher screen");

        var player2=d.getElementById("c5t-player");
        player2.currentTime=0;
        var allTiles=d.querySelectorAll("#c5t-body .clean-tile");
        click(allTiles[0]); // item 0 has a logged timestamp -- tapping should seek the player, alongside cycling its score
        ck(typeof player2.currentTime==="number","tapping a word with a logged timestamp seeks the player with no crash");
        ck(player2.playbackRate===1.5,"the existing playback-speed control is untouched by the new seek behavior");

        regressionScreens();
      },30);
    },30);
  }

  function regressionScreens(){
    /* ---- every existing screen still opens (regression protection) ---- */
    w.CURGROUP=w.GROUPS[0];
    var existingScreens=["s-home","s-pick","s-roster","studentMenu","diagLanding","check1","check1Preview","check1Teach",
      "check2","s-teachC2","check2Teach","check3","s-teachC3","check3Teach","check4","check4Teach","check5","check5Teach","s-teachDir",
      "s-groups","s-final","s-score","s-board","s-teach","s-settings","s-status","fluencyPassage","fluencyRetell","s-fluteach"];
    var allOk=true, m;
    for(m=0;m<existingScreens.length;m++){
      w.go(existingScreens[m]);
      if(activeId()!==existingScreens[m]){ allOk=false; console.log("FAIL: screen did not open: "+existingScreens[m]); }
    }
    ck(allOk,"every existing screen, plus the 2 new Check 5 screens, still opens");

    /* ---- Checks 1-4 functionally unchanged: spot-check their item counts/architecture ---- */
    ck(w.C4_ITEMS.length===142,"Check 4 still has 142 items (untouched by this task)");
    ck(w.C1_UPPER.length===26,"Check 1's 26-letter uppercase sequence is untouched by this task");

    console.log("\n=== "+pass+" passed, "+fail+" failed ===");
    process.exit(fail?1:0);
  }
},400);
