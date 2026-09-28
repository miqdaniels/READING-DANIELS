const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8').replace('<script src="clips.js" defer></script>','<script>'+fs.readFileSync('./clips.js','utf8')+'</script>');

/* Check 7 -- Multisyllabic Word Analysis. 90 printed-word items across 6
   locked bands (7A Two-Syllable 20, 7B Compound 10, 7C Syllable-Pattern
   Application 18, 7D Three-Syllable 15, 7E Four-Plus Syllable/Academic 15,
   7F Controlled Pseudowords 12), ONE continuous AUDIO recording (no
   camera, same audio-only architecture as Check 1/4/5/6A), no model
   audio/hints, teacher-controlled early stop, immediate unlock once Check
   6 (6A+6B+6C, all three) is done, standardized filename, never marking
   complete on an empty recording, Clean/Professional visual style. Simple
   5-state teacher scoring cycle (no Immediate/Labored split -- not
   requested). Real-word (7A-7E) vs pseudoword (7F) totals tracked and
   displayed SEPARATELY, mirroring Check 4's 4L pattern. Content = the
   QC-corrected MASTER_SPEC section, confirmed by Miq after a pre-build QC
   gate found it already resolves the three previously-known issues (7C
   duplicating 7A, 7E duplicating Check 6, 7F unpopulated). */
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
  ck(w.C7_ITEMS.length===90,"90 total items (got "+w.C7_ITEMS.length+")");
  var expectCounts={"7A":20,"7B":10,"7C":18,"7D":15,"7E":15,"7F":12};
  var i, allSetsOk=true;
  for(i=0;i<w.C7_SETS.length;i++){
    var s=w.C7_SETS[i];
    if(s.words.length!==expectCounts[s.id]){ allSetsOk=false; console.log("FAIL: set "+s.id+" expected "+expectCounts[s.id]+" got "+s.words.length); }
  }
  ck(allSetsOk,"every band matches the QC-confirmed count (20+10+18+15+15+12=90)");
  ck(w.C7_SETS.length===6,"exactly 6 bands, none merged/added/removed");

  var words=w.C7_ITEMS.map(function(x){return x.word.toLowerCase();});
  var seen={}, dupes=[];
  words.forEach(function(x){ if(seen[x]){ dupes.push(x); } seen[x]=(seen[x]||0)+1; });
  ck(dupes.length===0,"no duplicate targets within Check 7 (dupes: "+dupes.join(",")+")");

  /* ---- the three previously-known QC issues must NOT be present ---- */
  var c7c=w.C7_SETS[2].words, c7a=w.C7_SETS[0].words;
  var c7cDupesA=c7c.filter(function(x){ return c7a.indexOf(x)>-1; });
  ck(c7cDupesA.length===0,"7C does not duplicate any 7A word (the previously-known 7C duplication is gone): "+c7cDupesA.join(","));
  var knownOldC7CDupes=["rabbit","basket","contest","robot","music","hotel","market"];
  var stillPresent=knownOldC7CDupes.filter(function(x){ return c7c.indexOf(x)>-1; });
  ck(stillPresent.length===0,"none of the specific known-bad 7C duplicates (rabbit/basket/contest/robot/music/hotel/market) are in 7C");

  var c6Words=w.C6_ITEMS.map(function(x){return x.word.toLowerCase();});
  var c7e=w.C7_SETS[4].words;
  var c7eDupesC6=c7e.filter(function(x){ return c6Words.indexOf(x)>-1; });
  ck(c7eDupesC6.length===0,"7E does not duplicate any Check 6 morphology word (the previously-known 7E duplication is gone): "+c7eDupesC6.join(","));
  var knownOldC7EDupes=["information","transportation","organization"];
  var stillPresentE=knownOldC7EDupes.filter(function(x){ return c7e.indexOf(x)>-1; });
  ck(stillPresentE.length===0,"none of the specific known-bad 7E duplicates (information/transportation/organization) are in 7E");

  ck(w.C7_SETS[5].words.length===12,"7F has all 12 required original pseudowords (not 'CONTENT REQUIRED' placeholder-missing)");
  var pseudoWords=w.C7_SETS[5].words;
  var expectedPseudo=["mepnic","ravlet","sopane","fimote","zeebon","plooder","narvish","torpune","cambrel","vantrel","plindor","vorimble"];
  ck(pseudoWords.join(",")===expectedPseudo.join(","),"7F matches the exact QC-corrected 12 pseudowords, in order");

  /* ---- cross-check duplicates against Checks 3/4/5/6's actual live word banks ---- */
  var c3Words=w.C3_ITEMS.map(function(x){return (x.word||"").toLowerCase();}).filter(Boolean);
  var c4Words=w.C4_ITEMS.map(function(x){return x.word.toLowerCase();});
  var c5Words=w.C5_ITEMS.map(function(x){return x.word.toLowerCase();});
  var crossDupes=[];
  words.forEach(function(x){
    if(c3Words.indexOf(x)>-1){ crossDupes.push(x+"~C3"); }
    if(c4Words.indexOf(x)>-1){ crossDupes.push(x+"~C4"); }
    if(c5Words.indexOf(x)>-1){ crossDupes.push(x+"~C5"); }
    if(c6Words.indexOf(x)>-1){ crossDupes.push(x+"~C6"); }
  });
  ck(crossDupes.length===0,"zero cross-check duplicates between Check 7 and Checks 3/4/5/6's actual live banks (found: "+crossDupes.join(",")+")");

  ck(w.C7_SETS[0].label==="Two-Syllable Words","7A label matches");
  ck(w.C7_SETS[1].label==="Compound Words","7B label matches");
  ck(w.C7_SETS[2].label==="Syllable-Pattern Application","7C label matches");
  ck(w.C7_SETS[3].label==="Three-Syllable Words","7D label matches");
  ck(w.C7_SETS[4].label==="Four-Plus Syllable / Academic Words","7E label matches");
  ck(w.C7_SETS[5].label==="Controlled Pseudowords","7F label matches");
  ck(w.C7_SETS[5].pseudo===true,"7F is flagged pseudo:true");
  for(i=0;i<5;i++){ ck(!w.C7_SETS[i].pseudo,"7"+String.fromCharCode(65+i)+" is NOT flagged pseudo"); }

  /* ---- unlock: Check 7 stays locked until Check 6 (6A+6B+6C, all three) is done ---- */
  w.CURCLASS=w.CLASSES[0]; w.READER=w.CLASSES[0].students[0];
  w.go("diagLanding");
  var diagBtns=d.querySelectorAll("#diagLanding .btn"), c7Btn=null, j;
  for(j=0;j<diagBtns.length;j++){ if(diagBtns[j].textContent.indexOf("Check 7")>-1){ c7Btn=diagBtns[j]; } }
  ck(!!c7Btn && c7Btn.disabled===true,"Check 7 is locked before Check 6C is done");
  ck(c7Btn.className.indexOf("locked")>-1,"Check 7 shows the locked style before Check 6C is done");

  w.ckMarkDone("check1"); w.ckMarkDone("check2"); w.ckMarkDone("check3"); w.ckMarkDone("check4"); w.ckMarkDone("check5"); w.ckMarkDone("check6");
  w.go("diagLanding");
  diagBtns=d.querySelectorAll("#diagLanding .btn");
  for(j=0;j<diagBtns.length;j++){ if(diagBtns[j].textContent.indexOf("Check 7")>-1){ c7Btn=diagBtns[j]; } }
  ck(!!c7Btn && c7Btn.disabled===true,"Check 7 still locked after 6A alone (waits on 6B+6C too)");

  w.ckMarkDone("check6b");
  w.go("diagLanding");
  diagBtns=d.querySelectorAll("#diagLanding .btn");
  for(j=0;j<diagBtns.length;j++){ if(diagBtns[j].textContent.indexOf("Check 7")>-1){ c7Btn=diagBtns[j]; } }
  ck(!!c7Btn && c7Btn.disabled===true,"Check 7 still locked after 6A+6B (waits on 6C too)");

  w.ckMarkDone("check6c");
  w.go("diagLanding");
  diagBtns=d.querySelectorAll("#diagLanding .btn");
  for(j=0;j<diagBtns.length;j++){ if(diagBtns[j].textContent.indexOf("Check 7")>-1){ c7Btn=diagBtns[j]; } }
  ck(!!c7Btn && c7Btn.disabled!==true,"Check 7 unlocks immediately once Check 6 (6A+6B+6C) is fully done, no reload needed");
  ck(c7Btn.className.indexOf("locked")===-1,"Check 7 no longer shows the locked style");
  ck(w.check6FullyDone()===true,"check6FullyDone() correctly reports true once all three parts are done");

  /* ---- filename convention ---- */
  ck(/^Miriam_Gomez_P1_CHECK_7_\d{4}_\d{2}_\d{2}\.webm$/.test(w.rfStandardFileName("CHECK_7")),
    "Check 7 uses the standard filename pattern with CHECK_7 (got '"+w.rfStandardFileName("CHECK_7")+"')");

  /* ---- student flow ---- */
  click(c7Btn);
  ck(activeId()==="check7","Check 7 opens");
  ck(d.getElementById("c7-current").style.display==="none","no word shown before Record is tapped");
  ck(!q("#check7 video"),"Check 7 is audio-only -- no camera preview element at all");
  ck(q("#c7-start").textContent==="Start Recording","the primary action is a plain pill button with no icon (locked button rule)");

  w.c7Start();
  setTimeout(function(){
    ck(d.getElementById("c7-current").style.display==="block","first word shows once recording actually starts");
    ck(d.getElementById("c7-current").textContent===w.C7_ITEMS[0].word,"first item is "+w.C7_ITEMS[0].word+" (start of band 7A)");
    ck(d.getElementById("c7-progress").textContent==="Item 1 of 90","progress reads Item 1 of 90");
    ck(d.getElementById("c7-section-label").textContent==="7A","section label reads 7A for the first item");
    ck(d.getElementById("c7-pseudo-note").style.display==="none","the made-up-words note is hidden on a real-word item");
    ck(d.getElementById("c7-done").style.display!=="none","the Done-early button is available from the start");
    ck(d.getElementById("c7-start").style.display==="none","Start Recording is hidden once recording begins");

    /* ---- longest actual real-word target must render with no crash and no truncation ---- */
    w.c7Idx=73; w.c7PaintItem(); // index 73 = "responsibility" (7E, 14 letters)
    ck(d.getElementById("c7-current").textContent==="responsibility","a long Check 7 academic target (14 letters) renders in full, untruncated");
    ck(d.getElementById("c7-section-label").textContent==="7E","responsibility is correctly tagged as band 7E");
    ck(d.getElementById("c7-pseudo-note").style.display==="none","still no made-up-words note on a 7E real word");

    /* ---- pseudoword transition note appears once the student reaches 7F ---- */
    w.c7Idx=78; w.c7PaintItem(); // index 78 = first 7F item ("mepnic")
    ck(d.getElementById("c7-current").textContent==="mepnic","first 7F item is mepnic");
    ck(d.getElementById("c7-section-label").textContent==="7F","mepnic is correctly tagged as band 7F");
    ck(d.getElementById("c7-pseudo-note").style.display==="block","the made-up-words note shows once a pseudoword item is reached");

    w.c7Idx=0; w.c7PaintItem();

    /* ---- rapid double-tap protection: two synchronous taps only advance once ---- */
    w.c7NextTap(); w.c7NextTap();
    ck(w.c7Idx===1,"two synchronous Next taps only advanced ONE item (idx now 1, not 2)");

    setTimeout(function(){ // past one animation frame -- a real next tap works again
      w.c7NextTap();
      ck(w.c7Idx===2,"after a frame, a real next tap advances normally (idx now 2)");

      /* ---- jump to the last item to confirm Finish labeling ---- */
      w.c7Idx=89; w.c7PaintItem();
      ck(d.getElementById("c7-current").textContent==="vorimble","last item is the last 7F pseudoword (vorimble)");
      ck(d.getElementById("c7-next-lbl").textContent==="Finish","the last item's Next button reads Finish");

      /* ---- teacher-controlled early stop: Done works at ANY point ---- */
      w.c7Idx=40; w.c7PaintItem();
      w.c7DoneTap();
      setTimeout(function(){
        ck(!!d.getElementById("c7-review").innerHTML,"Done finalizes the recording straight into review, even mid-check");
        ck(d.getElementById("c7-review").innerHTML.indexOf("Play back")>-1,"a Play back control is offered");
        ck(d.getElementById("c7-review").innerHTML.indexOf("Redo")===-1,"no student Redo on a check -- only View as Student may restart one");
        ck(d.getElementById("c7-review").innerHTML.indexOf("Save")>-1,"a Save control is offered");
        ck(d.querySelectorAll("#c7-review .pill-btn").length>0,"review controls use the new pill-button style");

        /* ---- guard: an empty/failed blob must never be submittable ---- */
        var realBlob=w.c7Blob;
        w.c7Blob=new w.Blob([],{type:"audio/webm"});
        var beforeAttempts=w.C7Attempts.forStudent(w.READER.id).length;
        w.c7Finish();
        ck(w.C7Attempts.forStudent(w.READER.id).length===beforeAttempts,"Save does nothing on an empty recording -- no attempt is ever saved for it");
        w.c7Blob=realBlob;

        w.c7Finish();
        ck(w.__downloads.length===1,"exactly one file downloaded (got "+w.__downloads.length+")");
        ck(/^Miriam_Gomez_P1_CHECK_7_\d{4}_\d{2}_\d{2}\.webm$/.test(w.__downloads[0]),"downloaded file follows the standard naming pattern");
        var yesBtn=d.getElementById("c7-yes-btn");
        ck(!!yesBtn,"a YES button is shown");
        ck(!w.ckDone()["check7"],"Check 7 is not marked done until YES is tapped");

        var attempts=w.C7Attempts.forStudent(w.READER.id);
        ck(attempts.length===1,"one Check 7 attempt saved");
        ck(attempts[0].reachedCount===41,"the saved attempt records how far the student actually got (41 of 90, stopped mid-7C)");
        ck(typeof attempts[0].totalTimeMs==="number","administration time is retained");

        click(yesBtn);
        ck(activeId()==="diagLanding","YES returns straight to the Reading Checks dashboard");
        ck(!!w.ckDone()["check7"],"Check 7 marked completed after YES");

        var diagBtns2=d.querySelectorAll("#diagLanding .btn"), foundC7Green=false, m;
        for(m=0;m<diagBtns2.length;m++){
          if(diagBtns2[m].textContent.indexOf("Check 7")>-1 && /Completed/.test(diagBtns2[m].textContent) && diagBtns2[m].className.indexOf("done")>-1){ foundC7Green=true; }
        }
        ck(foundC7Green,"Check 7 shows green/Completed on the dashboard");

        teacherScoringFlow(attempts[0].id);
      },30);
    },30);
  },30);

  function teacherScoringFlow(attemptId){
    /* ---- teacher scoring: check7Teach ---- */
    w.go("check7Teach");
    ck(activeId()==="check7Teach","teacher review screen opens");
    var studentBtns=d.querySelectorAll("#c7t-roster .btn"), target=null, k;
    for(k=0;k<studentBtns.length;k++){ if(studentBtns[k].textContent.indexOf(w.READER.name)===0){ target=studentBtns[k]; } }
    ck(!!target && /\(1\)/.test(target.textContent),"roster shows the attempt count next to the student's name");
    click(target);
    ck(d.getElementById("c7t-body").textContent.indexOf("Reached 41 of 90")>-1,"teacher sees how far the student actually got");
    var openBtn=q("#c7t-body .mini-btn");
    ck(!!openBtn,"attempt list shows an Open button");
    click(openBtn);

    var totalCells=0, setIds=[], b;
    for(b=0;b<w.C7_SETS.length;b++){
      var cells=d.querySelectorAll("#c7t-grid-"+w.C7_SETS[b].id+" .clean-tile");
      totalCells+=cells.length;
      setIds.push(w.C7_SETS[b].id+"="+cells.length);
    }
    ck(totalCells===90,"90 tappable cells rendered across all 6 band grids (got "+setIds.join(",")+")");

    var longTile=Array.prototype.filter.call(d.querySelectorAll("#c7t-grid-7E .clean-tile"),function(t){return t.textContent.indexOf("responsibility")>-1;})[0];
    ck(!!longTile,"the 14-letter word 'responsibility' renders as its own scoring tile, untruncated");
    var pseudoTile=Array.prototype.filter.call(d.querySelectorAll("#c7t-grid-7F .clean-tile"),function(t){return t.textContent.indexOf("mepnic")>-1;})[0];
    ck(!!pseudoTile,"the pseudoword 'mepnic' renders as its own scoring tile in the 7F grid");

    /* item 42+ (index>=41) were never reached -- pre-fill as Not Reached */
    ck(w.c7tScores[40]==="","the last item actually reached (index 40) defaults to blank (Correct)");
    ck(w.c7tScores[41]==="nr","the item just past where the student stopped (index 41) pre-fills as Not Reached");
    ck(w.c7tScores[89]==="nr","the very last item also pre-fills as Not Reached");

    /* ---- playback speed control: own persisted key, separate from every earlier check's ---- */
    var player=d.getElementById("c7t-player");
    ck(player.playbackRate===1,"playback defaults to 1x with no saved preference");
    w.c7tSetSpeed(1.5);
    ck(player.playbackRate===1.5,"choosing 1.5x changes playbackRate immediately");
    ck(q("#c7t-body .speed-btn.on").textContent==="1.5×","the 1.5x button shows as selected");
    w.c7tOpenAttempt(attemptId);
    ck(d.getElementById("c7t-player").playbackRate===1.5,"the chosen playback speed is remembered on this device for the next recording opened");
    ck(w.localStorage.getItem("rf_c6_playback_rate")===null || w.localStorage.getItem("rf_c6_playback_rate")!=="1.5",
      "Check 7's playback speed is stored under its OWN key, never touching Check 6's saved preference");

    /* index 0 (sunset, 7A) -> Incorrect; index 1 (picnic) -> Self-corrected;
       index 2 (rabbit) -> Skip. (C7T_ORDER is ["","err","sc","skip","nr"]) */
    w.c7tTap(0); // -> err
    w.c7tTap(1); w.c7tTap(1); // -> err -> sc
    w.c7tTap(2); w.c7tTap(2); w.c7tTap(2); // -> err -> sc -> skip
    ck(w.c7tScores[0]==="err" && w.c7tScores[1]==="sc" && w.c7tScores[2]==="skip",
      "the 5-state cycle lands on the exact expected state for each (got: "+[w.c7tScores[0],w.c7tScores[1],w.c7tScores[2]].join(",")+")");

    var results=d.getElementById("c7t-results").textContent;
    /* band 7A has 20 words, reached indices 0-40 (all of 7A, since it's only
       the first 20); index0=err, index1=sc(counts correct), index2=skip,
       the rest (17 words, indices 3-19) still blank/Correct -> 18/20 */
    ck(/7A Two-Syllable Words:\s*18\s*\/\s*20/.test(results),"7A tally: self-corrected counts as correct, incorrect/skip do not (got: "+results+")");
    ck(/Self-corrections:\s*1\b/.test(results),"self-correction count is exact");
    ck(/Skips:\s*1(?!\d)/.test(results),"skip count is exact");
    ck(!/Immediate/.test(results) && !/Labored/.test(results),"Check 7 does NOT use Check 5's Immediate/Labored split -- not requested for this build");
    ck(/Real Words \(7A.7E\):\s*39\s*\/\s*41/.test(results),"Real Words (7A-7E) subtotal counts only real-word items reached, separately from pseudowords (got: "+results+")");
    ck(/Controlled Pseudowords \(7F\):\s*0\s*\/\s*0/.test(results),"Controlled Pseudowords (7F) subtotal is 0/0 since 7F was never reached in this attempt -- never blended into the real-word score");

    var noteEl=d.getElementById("c7t-note");
    noteEl.value="Substituted a similar-looking word for 'sunset'.";

    w.c7tSave();
    var saved=w.C7Attempts.get(attemptId);
    ck(saved.setCorrect["7A"]===18,"7A band score persisted");
    ck(saved.note.indexOf("Substituted")>-1,"teacher note persisted");
    ck(saved.targets.indexOf("sunset")>-1,"an incorrect word is a needs-instruction target");
    ck(saved.targets.indexOf("rabbit")>-1,"a skipped word is a needs-instruction target");
    ck(saved.targets.indexOf("picnic")===-1,"a self-corrected word is NOT treated as needing instruction");
    ck(saved.realWordsCorrect===39,"real-words-correct persisted separately");
    ck(saved.pseudoCorrect===0,"pseudo-correct persisted separately (0, since 7F was never reached)");

    /* ---- Student View preview works even with data already saved ---- */
    w.go("check7Teach");
    var pvBtn=Array.prototype.filter.call(d.querySelectorAll("#check7Teach .mini-btn"),function(b){return /Student View/.test(b.textContent);})[0];
    ck(!!pvBtn,"Check 7 Review has a persistent Student View button");
    click(pvBtn);
    ck(activeId()==="check7","Student View opens the real Check 7 student screen");
    ck(q("#c7-start").className.indexOf("pill-btn")>-1,"the previewed screen uses the Clean/Professional pill button");
    click(q("#preview-banner .vas-exit"));
    ck(activeId()==="check7Teach","exiting preview returns to Check 7 Review");

    regressionScreens();
  }

  function regressionScreens(){
    /* ---- every existing screen still opens (regression protection) ---- */
    w.CURGROUP=w.GROUPS[0];
    var existingScreens=["s-home","s-pick","s-roster","studentMenu","diagLanding","check1","check1Preview","check1Teach",
      "check2","s-teachC2","check2Teach","check3","s-teachC3","check3Teach","check4","check4Teach","check5","check5Teach",
      "check6","check6Teach","check6b","check6bTeach","check6c","check6cTeach","check7","check7Teach","s-teachDir",
      "s-groups","s-final","s-score","s-board","s-teach","s-settings","s-status","fluencyPassage","fluencyRetell","s-fluteach"];
    var allOk=true, m;
    for(m=0;m<existingScreens.length;m++){
      w.go(existingScreens[m]);
      if(activeId()!==existingScreens[m]){ allOk=false; console.log("FAIL: screen did not open: "+existingScreens[m]); }
    }
    ck(allOk,"every existing screen, plus the 2 new Check 7 screens, still opens");

    /* ---- Checks 1-6 (6A/6B/6C) functionally unchanged: spot-check ---- */
    ck(w.C4_ITEMS.length===142,"Check 4 still has 142 items (untouched by this task)");
    ck(w.C5_ITEMS.length===120,"Check 5 still has 120 items (untouched by this task)");
    ck(w.C6_ITEMS.length===50,"Check 6 (6A) still has 50 items (untouched by this task)");
    ck(w.C6B_ITEMS.length===24,"Check 6B still has 24 items (untouched by this task)");
    ck(w.C6C_ITEMS.length===16,"Check 6C still has 16 items (untouched by this task)");
    ck(w.C1_UPPER.length===26,"Check 1's 26-letter uppercase sequence is untouched by this task");

    console.log("\n=== "+pass+" passed, "+fail+" failed ===");
    process.exit(fail?1:0);
  }
},400);
