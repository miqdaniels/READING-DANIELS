const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8').replace('<script src="clips.js" defer></script>','<script>'+fs.readFileSync('./clips.js','utf8')+'</script>');

/* Check 6C -- Build It: Morphological Manipulation & Application. 16
   ORIGINAL tap-to-build items (4 categories x 4: Add a Word Part, Remove
   a Word Part, Change the Word, Build the Word in Context). NO typed
   input, NO recording, NO whole-word multiple choice -- every item shows
   real morphological pieces and the student either taps 2 in the correct
   order (Add) or taps the one piece that correctly completes the
   construction (Remove/Change/Context). Auto-scored the instant the
   required tap(s) land. 6A and 6B are locked/approved and untouched by
   this build. Check 6C sits between Check 6B and Check 7 in the unlock
   chain, so Check 7 now waits on all of 6A+6B+6C. */
const dom=new JSDOM(html,{url:"https://miqdaniels.github.io/READING-DANIELS/",runScripts:"dangerously",pretendToBeVisual:true,
  beforeParse(w){
    w.HTMLElement.prototype.scrollIntoView=function(){}; w.scrollTo=function(){};
    // Mick, 2026-09-29: 6C now exports a results file on Save & Finish -- same download mocks the recording-check tests already use.
    w.URL.createObjectURL=function(){return "blob:x";};
    w.URL.revokeObjectURL=function(){};
    var downloads=[];
    w.__downloads=downloads;
    var realCreateElement=w.document.createElement.bind(w.document);
    w.document.createElement=function(tag){
      var el=realCreateElement(tag);
      if(tag==="a"){ el.click=function(){ if(el.download){ downloads.push(el.download); } }; }
      return el;
    };
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
  ck(w.C6C_ITEMS.length===16,"16 total items (got "+w.C6C_ITEMS.length+")");
  var expectCounts={"6C-Add":4,"6C-Remove":4,"6C-Change":4,"6C-Context":4};
  var i, allSetsOk=true;
  for(i=0;i<w.C6C_SETS.length;i++){
    var s=w.C6C_SETS[i];
    if(s.items.length!==expectCounts[s.id]){ allSetsOk=false; console.log("FAIL: set "+s.id+" expected "+expectCounts[s.id]+" got "+s.items.length); }
  }
  ck(allSetsOk,"every category is exactly 4 items (4 x 4 = 16)");
  ck(w.C6C_SETS.length===4,"exactly 4 categories, none merged/added/removed");
  ck(w.C6C_SETS[0].label==="Add a Word Part","category 1 label matches");
  ck(w.C6C_SETS[1].label==="Remove a Word Part","category 2 label matches");
  ck(w.C6C_SETS[2].label==="Change the Word","category 3 label matches");
  ck(w.C6C_SETS[3].label==="Build the Word in Context","category 4 label matches");
  ck(w.C6C_SETS[0].mode==="build2","Add a Word Part uses the 2-tile tap-in-order interaction");
  ck(w.C6C_SETS[1].mode==="pick" && w.C6C_SETS[2].mode==="pick" && w.C6C_SETS[3].mode==="pick",
    "Remove/Change/Context use the tap-the-right-piece interaction");

  var targets=w.C6C_ITEMS.map(function(x){return x.expected.toLowerCase();});
  var seen={}, dupes=[];
  targets.forEach(function(x){ if(seen[x]){ dupes.push(x); } seen[x]=(seen[x]||0)+1; });
  ck(dupes.length===0,"no duplicate expected targets within Check 6C (dupes: "+dupes.join(",")+")");

  /* ---- construct check: for Add/Change/Context (where the expected answer is a
     COMBINATION of pieces), no single tile should already equal the finished
     word -- that would be recognition, not construction. Remove is exempt by
     design: the correct "remaining piece" legitimately equals the expected
     base word, since identifying which piece remains IS the manipulation. ---- */
  var noWholeWordChoices=true;
  w.C6C_ITEMS.forEach(function(it){
    if(it.section==="6C-Remove"){ return; }
    it.pieces.forEach(function(p){
      if(p.toLowerCase()===it.expected.toLowerCase()){ noWholeWordChoices=false; console.log("FAIL: item shows the finished word itself as a tile: "+p); }
    });
  });
  ck(noWholeWordChoices,"no Add/Change/Context item ever shows the finished target word itself as a tappable piece (this measures construction, not recognition)");

  var jargon=/\bmorpheme\b|\bderivational\b|\bbound morpheme\b|\baffixation\b|\bsemantic change\b/i;
  var noJargon=true;
  w.C6C_ITEMS.forEach(function(it){ if(jargon.test(it.prompt)){ noJargon=false; console.log("FAIL: jargon in prompt: "+it.prompt); } });
  ck(noJargon,"no morphology jargon appears in any student-facing prompt");

  /* ---- unlock: Check 6C stays locked until Check 6B is done ---- */
  w.CURCLASS=w.CLASSES[0]; w.READER=w.CLASSES[0].students[0];
  w.go("diagLanding");
  var diagBtns=d.querySelectorAll("#diagLanding .btn"), c6cBtn=null, j;
  for(j=0;j<diagBtns.length;j++){ if(diagBtns[j].textContent.indexOf("Check 6C")>-1){ c6cBtn=diagBtns[j]; } }
  ck(!!c6cBtn && c6cBtn.disabled===true,"Check 6C is locked before Check 6B is done");
  ck(c6cBtn.className.indexOf("locked")>-1,"Check 6C shows the locked style before 6B is done");

  w.ckMarkDone("check1"); w.ckMarkDone("check2"); w.ckMarkDone("check3"); w.ckMarkDone("check4");
  w.ckMarkDone("check5"); w.ckMarkDone("check6"); w.ckMarkDone("check6b");
  w.go("diagLanding");
  diagBtns=d.querySelectorAll("#diagLanding .btn");
  for(j=0;j<diagBtns.length;j++){ if(diagBtns[j].textContent.indexOf("Check 6C")>-1){ c6cBtn=diagBtns[j]; } }
  ck(!!c6cBtn && c6cBtn.disabled!==true,"Check 6C unlocks immediately once 6B is done, no reload needed");
  ck(c6cBtn.className.indexOf("locked")===-1,"Check 6C no longer shows the locked style");

  ck(!w.check6FullyDone(),"Check 6 is not fully done yet -- 6C hasn't been completed");

  /* ---- student flow ---- */
  click(c6cBtn);
  ck(activeId()==="check6c","Check 6C opens");
  ck(!q("#check6c video"),"Check 6C has no camera preview element");
  ck(!q("#check6c audio"),"Check 6C has no audio recorder element -- tap-to-build only");
  ck(!q("#check6c .mic-ico"),"Check 6C never shows a mic/record icon -- no recording is used");
  ck(!q("#check6c input[type=text]") && !q("#check6c textarea"),"Check 6C has no typed-input field anywhere");
  ck(q("#c6c-stem").textContent===w.C6C_ITEMS[0].prompt,"first prompt shown matches the first item");
  ck(d.querySelectorAll("#c6c-pieces .word-part-tile").length===2,"first item (Add) shows exactly 2 word-part tiles");
  ck(q("#c6c-progress").textContent==="Item 1 of 16","progress reads Item 1 of 16");

  /* ---- rapid double-tap protection on the FIRST tap of a build2 item ---- */
  var firstItem=w.C6C_ITEMS[0];
  var tiles=d.querySelectorAll("#c6c-pieces .word-part-tile");
  click(tiles[firstItem.answerOrder[0]]);
  click(tiles[firstItem.answerOrder[0]]); // synchronous repeat tap on the SAME tile, same tick
  ck(w.c6cTapped.length===1,"a rapid repeat tap on the same tile does not register twice (got "+w.c6cTapped.length+")");

  function answerRemaining(cb){
    if(w.c6cResponses.length>=w.C6C_ITEMS.length){ cb(); return; }
    var item=w.C6C_ITEMS[w.c6cIdx];
    var pieces=d.querySelectorAll("#c6c-pieces .word-part-tile");
    if(item.mode==="build2"){
      var startAt=w.c6cTapped.length; // item 0 already has 1 tap in progress from the test above
      var nextIdx=item.answerOrder[startAt];
      click(pieces[nextIdx]);
      setTimeout(function(){ answerRemaining(cb); },20);
    } else {
      click(pieces[item.correctIndex]);
      setTimeout(function(){ answerRemaining(cb); },20);
    }
  }

  setTimeout(function(){
    answerRemaining(function(){
      ck(w.c6cResponses.length===16,"all 16 items recorded exactly one response each (got "+w.c6cResponses.length+")");
      ck(w.c6cResponses[0].isCorrect===true,"item 1 (Add un-+pack) scored correct when tapped in the right order");
      ck(!!q("#c6c-done .pill-btn-primary"),"a Save & Finish button appears after the last item");
      ck(q("#c6c-done .pill-btn-primary").textContent==="Save & Finish","the button reads Save & Finish, same as the recording checks (Mick, 2026-09-29)");
      ck(!/Correct|Wrong|Great job/i.test(d.getElementById("check6c").textContent),"no per-item correctness feedback ever appeared");
      ck(w.C6CAttempts.forStudent(w.READER.id).length===0,"nothing is saved yet -- Save & Finish hasn't been tapped");

      click(q("#c6c-done .pill-btn-primary")); // tap Save & Finish

      /* ---- SAVING BUG fix (Mick, 2026-09-29): same fix as 6B -- exports
         a results file (same naming pattern as the recording checks,
         .json instead of .webm) so a teacher on a different device can
         actually see the results. ---- */
      ck(w.__downloads.length===1,"Save & Finish exports exactly one results file (got "+w.__downloads.length+")");
      ck(/^Miriam_G_P1_CHECK_6C_\d{4}_\d{2}_\d{2}\.json$/.test(w.__downloads[0]),"the results file follows the same naming pattern as the recording checks, but .json (got '"+w.__downloads[0]+"')");
      ck(!!q("#c6c-yes-btn"),"a YES-did-you-submit confirmation is shown, same as every recording check");
      ck(!w.ckDone()["check6c"],"Check 6C is not marked done until YES is tapped");

      var attempts=w.C6CAttempts.forStudent(w.READER.id);
      ck(attempts.length===1,"one Check 6C attempt saved locally too (so a teacher on THIS same device already sees it)");
      ck(attempts[0].fileName===w.__downloads[0],"the saved attempt records the exact filename that was exported");
      ck(attempts[0].overall===16,"overall score is exact (answered every item correctly)");
      ck(attempts[0].setCorrect["6C-Add"]===4 && attempts[0].setCorrect["6C-Remove"]===4
        && attempts[0].setCorrect["6C-Change"]===4 && attempts[0].setCorrect["6C-Context"]===4,
        "every category score is exact");
      ck(typeof attempts[0].totalTimeMs==="number","administration time is retained");
      ck(attempts[0].responses.length===16,"item-level response data retained for all 16 items");
      ck(attempts[0].responses[0].response==="unpack","the student's exact constructed response is stored");
      ck(attempts[0].responses[0].baseWord==="pack" && attempts[0].responses[0].morpheme==="un-","item-level metadata (base word + morpheme) retained");

      click(q("#c6c-yes-btn"));
      ck(activeId()==="diagLanding","YES returns to the Reading Checks dashboard");
      ck(!!w.ckDone()["check6c"],"Check 6C marked completed after YES");
      ck(w.check6FullyDone(),"Check 6 is now fully done -- all of 6A+6B+6C are complete");

      var diagBtns2=d.querySelectorAll("#diagLanding .btn"), foundC6cGreen=false, c7Btn=null, m;
      for(m=0;m<diagBtns2.length;m++){
        if(diagBtns2[m].textContent.indexOf("Check 6C")>-1 && /Completed/.test(diagBtns2[m].textContent) && diagBtns2[m].className.indexOf("done")>-1){ foundC6cGreen=true; }
        if(diagBtns2[m].textContent.indexOf("Check 7")>-1){ c7Btn=diagBtns2[m]; }
      }
      ck(foundC6cGreen,"Check 6C shows green/Completed on the dashboard");
      ck(!!c7Btn && c7Btn.disabled!==true,"Check 7 is not gray/locked once Check 6 (6A+6B+6C) is fully done");
      ck(!!c7Btn && c7Btn.className.indexOf("locked")===-1,"Check 7 uses the normal available style, not the locked style");
      click(c7Btn);
      ck(activeId()==="check7","tapping Check 7 opens it -- it was built in a later task");

      teacherViewFlow(attempts[0].id);
    });
  },20);

  function teacherViewFlow(attemptId){
    w.go("check6cTeach");
    ck(activeId()==="check6cTeach","teacher results screen opens");
    var studentBtns=d.querySelectorAll("#c6ct-roster .btn"), target=null, k;
    for(k=0;k<studentBtns.length;k++){ if(studentBtns[k].textContent.indexOf(w.READER.name)===0){ target=studentBtns[k]; } }
    ck(!!target,"roster shows the student");
    click(target);
    var openBtn=q("#c6ct-body .mini-btn");
    ck(!!openBtn,"attempt list shows an Open button");
    ck(!d.querySelector("#c6ct-body input, #c6ct-body select, #c6ct-body textarea"),"no scoring controls exist -- 6C is read-only, nothing to tap-score");
    click(openBtn);
    var body=d.getElementById("c6ct-body").textContent;
    ck(body.indexOf("Overall: 16 / 16")>-1,"overall score displayed correctly");
    ck(body.indexOf("Add a Word Part: 4 / 4")>-1,"category score displayed correctly");
    ck(d.querySelectorAll("#c6ct-body .clean-tile").length===16,"all 16 individual responses are listed");
    ck(d.querySelectorAll("#c6ct-body .clean-tile.state-err").length===0,"no incorrect-state tiles (every answer was correct in this run)");

    w.go("check6cTeach");
    var pvBtn=Array.prototype.filter.call(d.querySelectorAll("#check6cTeach .mini-btn"),function(b){return /Student View/.test(b.textContent);})[0];
    ck(!!pvBtn,"Check 6C Review has a Student View button");
    click(pvBtn);
    ck(activeId()==="check6c","Student View opens the real Check 6C student screen");
    click(q("#preview-banner .vas-exit"));
    ck(activeId()==="check6cTeach","exiting preview returns to Check 6C Review");

    /* ---- SAVING BUG fix (Mick, 2026-09-29): same "open a results file"
       import as 6B -- a teacher on a different device pulls the exported
       file into her own storage instead of never seeing it. ---- */
    var fakeAttempt={ id:"fake-imported-id-1", studentId:w.READER.id, studentName:w.READER.name, date:"2026-09-29",
      fileName:"Fake_Import_Test.json", totalTimeMs:12345, responses:attemptId?w.C6CAttempts.get(attemptId).responses:[],
      overall:16, setCorrect:{"6C-Add":4,"6C-Remove":4,"6C-Change":4,"6C-Context":4}, missed:[] };
    ck(!w.C6CAttempts.get("fake-imported-id-1"),"the imported attempt truly isn't in this device's storage yet");
    var fakeFile=new w.File([JSON.stringify(fakeAttempt)],"imported-results.json",{type:"application/json"});
    w.c6ctOpenFile({ files:[fakeFile] });
    setTimeout(function(){
      ck(!!w.C6CAttempts.get("fake-imported-id-1"),"opening the results file adds it to this device's Check 6C attempts");
      ck(d.getElementById("c6ct-file-note").textContent.indexOf("imported-results.json")>-1,"a confirmation names the opened file");
      ck(d.getElementById("c6ct-body").textContent.indexOf("Overall: 16 / 16")>-1,"the imported attempt opens automatically for viewing");

      var badFile=new w.File(["not real json"],"bad.json",{type:"application/json"});
      w.c6ctOpenFile({ files:[badFile] });
      setTimeout(function(){
        ck(d.getElementById("c6ct-file-note").textContent.indexOf("doesn't look like")>-1,"an invalid file gets an honest error, not a silent failure or a crash");
        regressionScreens();
      },20);
    },20);
  }

  function regressionScreens(){
    w.CURGROUP=w.GROUPS[0];
    var existingScreens=["s-home","s-pick","s-roster","studentMenu","diagLanding","check1","check1Preview","check1Teach",
      "check2","s-teachC2","check2Teach","check3","s-teachC3","check3Teach","check4","check4Teach","check5","check5Teach",
      "check6","check6Teach","check6b","check6bTeach","check6c","check6cTeach","s-teachDir",
      "s-groups","s-final","s-score","s-board","s-teach","s-settings","s-status","fluencyPassage","fluencyRetell","s-fluteach"];
    var allOk=true, m;
    for(m=0;m<existingScreens.length;m++){
      w.go(existingScreens[m]);
      if(activeId()!==existingScreens[m]){ allOk=false; console.log("FAIL: screen did not open: "+existingScreens[m]); }
    }
    ck(allOk,"every existing screen, plus the 2 new Check 6C screens, still opens");

    /* ---- 6A, 6B, and Checks 1-5 functionally unchanged ---- */
    ck(w.C6_ITEMS.length===50,"Check 6 (6A) still has 50 items (untouched by this task)");
    ck(w.C6B_ITEMS.length===24,"Check 6B still has 24 items (untouched by this task)");
    ck(w.C5_ITEMS.length===120,"Check 5 still has 120 items (untouched by this task)");
    ck(w.C4_ITEMS.length===142,"Check 4 still has 142 items (untouched by this task)");
    ck(w.C1_UPPER.length===26,"Check 1's 26-letter uppercase sequence is untouched by this task");

    console.log("\n=== "+pass+" passed, "+fail+" failed ===");
    process.exit(fail?1:0);
  }
},400);
