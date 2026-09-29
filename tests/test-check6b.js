const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8').replace('<script src="clips.js" defer></script>','<script>'+fs.readFileSync('./clips.js','utf8')+'</script>');

/* Check 6B -- Understand It: Morpheme Meaning. 24 ORIGINAL selected-
   response items (4 categories x 6: Prefix Meaning, Suffix Meaning/
   Function, Inflectional Endings, Word-Part Meaning in Context), 3
   choices each, NO recording, NO camera/mic at all -- auto-scored the
   instant the student taps a choice. 6A is locked/untouched by this
   build; Check 6B sits between Check 6 (6A) and Check 7 in the unlock
   chain, so Check 7 now waits on 6B, not 6A alone. Check 6C and Check 7
   remain NOT built. */
const dom=new JSDOM(html,{url:"https://miqdaniels.github.io/READING-DANIELS/",runScripts:"dangerously",pretendToBeVisual:true,
  beforeParse(w){
    w.HTMLElement.prototype.scrollIntoView=function(){}; w.scrollTo=function(){};
    // Mick, 2026-09-29: 6B now exports a results file on Save & Finish -- same download mocks the recording-check tests already use.
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
  ck(w.C6B_ITEMS.length===24,"24 total items (got "+w.C6B_ITEMS.length+")");
  var expectCounts={"6B-Prefix":6,"6B-Suffix":6,"6B-Inflect":6,"6B-Context":6};
  var i, allSetsOk=true;
  for(i=0;i<w.C6B_SETS.length;i++){
    var s=w.C6B_SETS[i];
    if(s.items.length!==expectCounts[s.id]){ allSetsOk=false; console.log("FAIL: set "+s.id+" expected "+expectCounts[s.id]+" got "+s.items.length); }
  }
  ck(allSetsOk,"every category is exactly 6 items (4 x 6 = 24)");
  ck(w.C6B_SETS.length===4,"exactly 4 categories, none merged/added/removed");
  ck(w.C6B_SETS[0].label==="Prefix Meaning","category 1 label matches");
  ck(w.C6B_SETS[1].label==="Suffix Meaning/Function","category 2 label matches");
  ck(w.C6B_SETS[2].label==="Inflectional Endings","category 3 label matches");
  ck(w.C6B_SETS[3].label==="Word-Part Meaning in Context","category 4 label matches");

  var targets=w.C6B_ITEMS.map(function(x){return x.targetWord.toLowerCase();});
  var seen={}, dupes=[];
  targets.forEach(function(x){ if(seen[x]){ dupes.push(x); } seen[x]=(seen[x]||0)+1; });
  ck(dupes.length===0,"no duplicate target words within Check 6B (dupes: "+dupes.join(",")+")");

  var allThreeChoices=true, allHaveCorrect=true;
  w.C6B_ITEMS.forEach(function(it){
    if(!it.choices || it.choices.length!==3){ allThreeChoices=false; }
    if(typeof it.correct!=="number" || it.correct<0 || it.correct>2){ allHaveCorrect=false; }
  });
  ck(allThreeChoices,"every item has exactly 3 answer choices");
  ck(allHaveCorrect,"every item has exactly one correct answer index (0-2)");

  var posTally=[0,0,0];
  w.C6B_ITEMS.forEach(function(it){ posTally[it.correct]++; });
  ck(posTally[0]===8 && posTally[1]===8 && posTally[2]===8,
    "correct-answer position is balanced 8/8/8 across A/B/C (got "+posTally.join("/")+")");

  var jargon=/\bmorpheme\b|\bderivational\b|\bsemantic\b|\bgrammatical function\b|\baffix\b/i;
  var noJargon=true;
  w.C6B_ITEMS.forEach(function(it){ if(jargon.test(it.stem)){ noJargon=false; console.log("FAIL: jargon found in stem: "+it.stem); } });
  ck(noJargon,"no morphology jargon (morpheme/derivational/semantic/affix) appears in any student-facing stem");

  /* ---- unlock: Check 6B stays locked until Check 6 (6A) is done ---- */
  w.CURCLASS=w.CLASSES[0]; w.READER=w.CLASSES[0].students[0];
  w.go("diagLanding");
  var diagBtns=d.querySelectorAll("#diagLanding .btn"), c6bBtn=null, j;
  for(j=0;j<diagBtns.length;j++){ if(diagBtns[j].textContent.indexOf("Check 6B")>-1){ c6bBtn=diagBtns[j]; } }
  ck(!!c6bBtn && c6bBtn.disabled===true,"Check 6B is locked before Check 6 (6A) is done");
  ck(c6bBtn.className.indexOf("locked")>-1,"Check 6B shows the locked style before 6A is done");

  w.ckMarkDone("check1"); w.ckMarkDone("check2"); w.ckMarkDone("check3"); w.ckMarkDone("check4"); w.ckMarkDone("check5"); w.ckMarkDone("check6");
  w.go("diagLanding");
  diagBtns=d.querySelectorAll("#diagLanding .btn");
  for(j=0;j<diagBtns.length;j++){ if(diagBtns[j].textContent.indexOf("Check 6B")>-1){ c6bBtn=diagBtns[j]; } }
  ck(!!c6bBtn && c6bBtn.disabled!==true,"Check 6B unlocks immediately once 6A is done, no reload needed");
  ck(c6bBtn.className.indexOf("locked")===-1,"Check 6B no longer shows the locked style");

  /* ---- student flow ---- */
  click(c6bBtn);
  ck(activeId()==="check6b","Check 6B opens");
  ck(!q("#check6b video"),"Check 6B has no camera preview element");
  ck(!q("#check6b audio"),"Check 6B has no audio recorder element -- selected-response only");
  ck(!q("#check6b .mic-ico"),"Check 6B never shows a mic/record icon -- no recording is used");
  ck(q("#c6b-stem").textContent===w.C6B_ITEMS[0].stem,"first stem shown matches the first item");
  ck(d.querySelectorAll("#c6b-choices .choice-pill").length===3,"exactly 3 answer-choice buttons shown");
  ck(q("#c6b-progress").textContent==="Item 1 of 24","progress reads Item 1 of 24");
  ck(!q("#c6b-stem").parentNode.textContent.match(/6B-Prefix|Prefix Meaning/),"the category is never shown to the student");

  /* ---- Mick, 2026-09-29: Back bar hidden while questions show (it looked
     like a 4th answer choice) ---- */
  ck(d.getElementById("c6b-backbar").style.display==="none","the Back bar is hidden while a question is showing (it read like a 4th answer choice)");

  /* ---- layout: two answer buttons side by side, one centered below ---- */
  var rows=d.querySelectorAll("#c6b-choices .c6b-choice-row");
  ck(rows.length===2,"answers render as two rows (a pair, then a single)");
  ck(rows[0].querySelectorAll(".choice-pill").length===2,"the first row holds exactly 2 answer buttons, side by side");
  ck(rows[1].querySelectorAll(".choice-pill").length===1,"the second row holds exactly 1 answer button, centered below");
  ck(rows[1].className.indexOf("c6b-choice-single")>-1,"the single centered row carries its own layout class");

  /* ---- question text size: short question ~3rem, and it actually
     shrinks for a known long sentence-style stem so nothing is forced to
     scroll on a small screen ---- */
  ck(q("#c6b-stem").style.fontSize==="3rem","a short question (<=45 chars) renders at 3rem (got '"+q("#c6b-stem").style.fontSize+"' for '"+w.C6B_ITEMS[0].stem+"')");
  var longIdx=-1, li; for(li=0;li<w.C6B_ITEMS.length;li++){ if(w.C6B_ITEMS[li].stem.length>65){ longIdx=li; break; } }
  ck(longIdx>-1,"the item bank actually contains a long sentence-style stem to test against");
  w.c6bIdx=longIdx; w.c6bPaintItem();
  ck(parseFloat(q("#c6b-stem").style.fontSize)<3,"a long sentence question renders smaller than the short-question size (got '"+q("#c6b-stem").style.fontSize+"' for a "+w.C6B_ITEMS[longIdx].stem.length+"-char stem)");
  w.c6bIdx=0; w.c6bPaintItem(); // restore, since the real run below expects to start at item 0

  /* ---- answer text size: short answers ~2rem, long full-sentence
     answers step down so a wrapped 2-line answer never forces the page
     to scroll on a small (1366x768) screen ---- */
  var shortAnswerBtn=q("#c6b-choices .choice-pill");
  ck(shortAnswerBtn.style.fontSize==="2rem","short answers render at 2rem (got '"+shortAnswerBtn.style.fontSize+"')");
  var longAnsIdx=-1, lj, lk, maxLen; for(lj=0;lj<w.C6B_ITEMS.length;lj++){ maxLen=0; for(lk=0;lk<w.C6B_ITEMS[lj].choices.length;lk++){ maxLen=Math.max(maxLen,w.C6B_ITEMS[lj].choices[lk].length); } if(maxLen>30){ longAnsIdx=lj; break; } }
  ck(longAnsIdx>-1,"the item bank actually contains a long full-sentence answer to test against");
  w.c6bIdx=longAnsIdx; w.c6bPaintItem();
  ck(parseFloat(q("#c6b-choices .choice-pill").style.fontSize)<2,"a long full-sentence answer renders smaller than the short-answer size (got '"+q("#c6b-choices .choice-pill").style.fontSize+"')");
  w.c6bIdx=0; w.c6bPaintItem();

  /* ---- answers are shuffled per item, not always in the same order ---- */
  var seenOrders={}, ri;
  for(ri=0;ri<20;ri++){
    w.c6bPaintItem();
    seenOrders[w.c6bOrder.join(",")]=true;
  }
  ck(Object.keys(seenOrders).length>1,"answer order actually varies across repaints, not fixed (saw "+Object.keys(seenOrders).length+" distinct order(s) in 20 tries)");
  w.c6bIdx=0; w.c6bPaintItem(); // repaint item 0 fresh before the real run starts

  /* ---- rapid double-tap protection: a second synchronous tap on the
     same physical spot must not register a second, unintended answer.
     Answers are shuffled now, so tap the CORRECT one by its text -- every
     later assertion in this test assumes a run that answered everything
     correctly. ---- */
  var firstItem=w.C6B_ITEMS[0], firstBtns=d.querySelectorAll("#c6b-choices .choice-pill"), fk, firstChoiceBtn=null;
  for(fk=0;fk<firstBtns.length;fk++){ if(firstBtns[fk].textContent===firstItem.choices[firstItem.correct]){ firstChoiceBtn=firstBtns[fk]; } }
  click(firstChoiceBtn);
  var secondItemBtns=d.querySelectorAll("#c6b-choices .choice-pill");
  click(secondItemBtns[0]); // synchronous second click, same tick -- should be swallowed by the lock regardless of which button
  ck(w.c6bResponses.length===1,"a rapid second tap right after the first does not record a second response (got "+w.c6bResponses.length+")");

  /* Answers are shuffled on screen now (Mick, 2026-09-29), so "the correct
     button" has to be found by its actual text, never by position. */
  function answerRemaining(cb){
    var btns=d.querySelectorAll("#c6b-choices .choice-pill");
    if(btns.length===0){ cb(); return; }
    var item=w.C6B_ITEMS[w.c6bIdx];
    var correctText=item.choices[item.correct], k, target=null;
    for(k=0;k<btns.length;k++){ if(btns[k].textContent===correctText){ target=btns[k]; } }
    ck(!!target,"the correct answer's text is findable among the (possibly reordered) on-screen buttons for item "+w.c6bIdx);
    click(target); // answer every remaining item correctly
    setTimeout(function(){ answerRemaining(cb); },20);
  }

  setTimeout(function(){
    answerRemaining(function(){
      ck(w.c6bResponses.length===24,"all 24 items recorded exactly one response each (got "+w.c6bResponses.length+")");
      ck(!!q("#c6b-done .pill-btn-primary"),"a Save & Finish button appears after the last item");
      ck(q("#c6b-done .pill-btn-primary").textContent==="Save & Finish","the button reads Save & Finish, same as the recording checks (Mick, 2026-09-29)");
      ck(q("#c6b-done").textContent.indexOf("24")===-1 && q("#c6b-done").textContent.indexOf("/")===-1,
        "the student is never shown their raw score (dignity-first, matches every other Check)");
      ck(!/Correct|Wrong|Incorrect/i.test(d.getElementById("check6b").textContent.replace(/Correct .{0,20}Skip/,"")),
        "no per-item correctness feedback ever appeared during the test");
      ck(w.C6BAttempts.forStudent(w.READER.id).length===0,"nothing is saved yet -- Save & Finish hasn't been tapped");

      click(q("#c6b-done .pill-btn-primary")); // tap Save & Finish

      /* ---- SAVING BUG fix (Mick, 2026-09-29): results now export as a
         file (same naming pattern as the recording checks, .json instead
         of .webm) so a teacher on a different device can actually see
         them, instead of the results living only in this browser. ---- */
      ck(w.__downloads.length===1,"Save & Finish exports exactly one results file (got "+w.__downloads.length+")");
      ck(/^Miriam_G_P1_CHECK_6B_\d{4}_\d{2}_\d{2}\.json$/.test(w.__downloads[0]),"the results file follows the same naming pattern as the recording checks, but .json (got '"+w.__downloads[0]+"')");
      ck(!!q("#c6b-yes-btn"),"a YES-did-you-submit confirmation is shown, same as every recording check");
      ck(!w.ckDone()["check6b"],"Check 6B is not marked done until YES is tapped");

      var attempts=w.C6BAttempts.forStudent(w.READER.id);
      ck(attempts.length===1,"one Check 6B attempt saved locally too (so a teacher on THIS same device already sees it)");
      ck(attempts[0].fileName===w.__downloads[0],"the saved attempt records the exact filename that was exported");
      ck(attempts[0].overall===24,"overall score is exact (answered every item correctly)");
      ck(attempts[0].setCorrect["6B-Prefix"]===6 && attempts[0].setCorrect["6B-Suffix"]===6
        && attempts[0].setCorrect["6B-Inflect"]===6 && attempts[0].setCorrect["6B-Context"]===6,
        "every category score is exact");
      ck(typeof attempts[0].totalTimeMs==="number","administration time is retained");
      ck(attempts[0].responses.length===24,"item-level response data retained for all 24 items");
      ck(attempts[0].responses[0].targetWord===w.C6B_ITEMS[0].targetWord,"item-level metadata (target word) retained");
      ck(attempts[0].responses[0].morpheme===w.C6B_ITEMS[0].morpheme,"item-level metadata (morpheme) retained");
      /* ---- bug fix (Mick, 2026-09-29): saved by the words chosen, not the
         list position -- a position-only record was write-only (never
         shown to the teacher) and meaningless if choices were reordered ---- */
      ck(typeof attempts[0].responses[0].chosen==="string" && w.C6B_ITEMS[0].choices.indexOf(attempts[0].responses[0].chosen)>-1,
        "the chosen answer is saved as its actual words, not a numeric position (got '"+attempts[0].responses[0].chosen+"')");
      ck(attempts[0].responses[0].chosen===w.C6B_ITEMS[0].choices[w.C6B_ITEMS[0].correct],
        "the saved chosen-answer text matches the choice actually tapped");
      ck(typeof attempts[0].responses[0].correctAnswer==="string" && attempts[0].responses[0].correctAnswer===w.C6B_ITEMS[0].choices[w.C6B_ITEMS[0].correct],
        "the correct answer is also saved by its words, for teacher review");

      click(q("#c6b-yes-btn"));
      ck(activeId()==="diagLanding","YES returns to the Reading Checks dashboard");
      ck(!!w.ckDone()["check6b"],"Check 6B marked completed after YES");

      var diagBtns2=d.querySelectorAll("#diagLanding .btn"), foundC6bGreen=false, c6cBtn=null, c7Btn=null, m;
      for(m=0;m<diagBtns2.length;m++){
        if(diagBtns2[m].textContent.indexOf("Check 6B")>-1 && /Completed/.test(diagBtns2[m].textContent) && diagBtns2[m].className.indexOf("done")>-1){ foundC6bGreen=true; }
        if(diagBtns2[m].textContent.indexOf("Check 6C")>-1){ c6cBtn=diagBtns2[m]; }
        if(diagBtns2[m].textContent.indexOf("Check 7")>-1){ c7Btn=diagBtns2[m]; }
      }
      ck(foundC6bGreen,"Check 6B shows green/Completed on the dashboard");
      /* Check 6C is the next component -- it unlocks off 6B's completion. Check 7
         (the next diagnostic domain) still waits: 6C is a separate, now-built part
         of Check 6, so Check 7 correctly stays locked until 6C is done too. */
      ck(!!c6cBtn && c6cBtn.disabled!==true,"Check 6C is not gray/locked once Check 6B is done");
      ck(!!c6cBtn && c6cBtn.className.indexOf("locked")===-1,"Check 6C uses the normal available style, not the locked style");
      ck(!!c7Btn && c7Btn.disabled===true,"Check 7 stays locked after 6B -- it now waits on 6C too");
      ck(!!c7Btn && c7Btn.className.indexOf("locked")>-1,"Check 7 still shows the locked style after 6B");

      teacherViewFlow(attempts[0].id);
    });
  },20);

  function teacherViewFlow(attemptId){
    w.go("check6bTeach");
    ck(activeId()==="check6bTeach","teacher results screen opens");
    var studentBtns=d.querySelectorAll("#c6bt-roster .btn"), target=null, k;
    for(k=0;k<studentBtns.length;k++){ if(studentBtns[k].textContent.indexOf(w.READER.name)===0){ target=studentBtns[k]; } }
    ck(!!target,"roster shows the student");
    click(target);
    var openBtn=q("#c6bt-body .mini-btn");
    ck(!!openBtn,"attempt list shows an Open button");
    ck(!d.querySelector("#c6bt-body input, #c6bt-body select, #c6bt-body textarea"),"no scoring controls exist -- 6B is read-only, nothing to tap-score");
    click(openBtn);
    var body=d.getElementById("c6bt-body").textContent;
    ck(body.indexOf("Overall: 24 / 24")>-1,"overall score displayed correctly");
    ck(body.indexOf("Prefix Meaning: 6 / 6")>-1,"category score displayed correctly");
    ck(d.querySelectorAll("#c6bt-body .clean-tile").length===24,"all 24 individual responses are listed");
    ck(d.querySelectorAll("#c6bt-body .clean-tile.state-err").length===0,"no incorrect-state tiles (every answer was correct in this run)");
    ck(body.indexOf('chose: "'+w.C6B_ITEMS[0].choices[w.C6B_ITEMS[0].correct]+'"')>-1,
      "the teacher review actually shows which answer the student chose, by its words (previously write-only)");

    /* ---- Student View preview ---- */
    w.go("check6bTeach");
    var pvBtn=Array.prototype.filter.call(d.querySelectorAll("#check6bTeach .mini-btn"),function(b){return /Student View/.test(b.textContent);})[0];
    ck(!!pvBtn,"Check 6B Review has a Student View button");
    click(pvBtn);
    ck(activeId()==="check6b","Student View opens the real Check 6B student screen");
    click(q("#preview-banner .vas-exit"));
    ck(activeId()==="check6bTeach","exiting preview returns to Check 6B Review");

    /* ---- SAVING BUG fix (Mick, 2026-09-29): a teacher on a DIFFERENT
       device never had this attempt in her own storage -- opening the
       exported results file should pull it in, jump straight to the
       right student, and show it, without ever duplicating on a
       second open of the same file. ---- */
    var fakeAttempt={ id:"fake-imported-id-1", studentId:w.READER.id, studentName:w.READER.name, date:"2026-09-29",
      fileName:"Fake_Import_Test.json", totalTimeMs:12345, responses:attemptId?w.C6BAttempts.get(attemptId).responses:[],
      overall:24, setCorrect:{"6B-Prefix":6,"6B-Suffix":6,"6B-Inflect":6,"6B-Context":6}, missed:[] };
    ck(!w.C6BAttempts.get("fake-imported-id-1"),"the imported attempt truly isn't in this device's storage yet");
    var fakeFile=new w.File([JSON.stringify(fakeAttempt)],"imported-results.json",{type:"application/json"});
    w.c6btOpenFile({ files:[fakeFile] });
    setTimeout(function(){
      ck(!!w.C6BAttempts.get("fake-imported-id-1"),"opening the results file adds it to this device's Check 6B attempts");
      ck(activeId()==="check6bTeach","opening the file keeps the teacher on the Check 6B review screen");
      ck(d.getElementById("c6bt-file-note").textContent.indexOf("imported-results.json")>-1,"a confirmation names the opened file");
      ck(d.getElementById("c6bt-body").textContent.indexOf("Overall: 24 / 24")>-1,"the imported attempt opens automatically for viewing");
      var beforeCount=w.C6BAttempts.forStudent(w.READER.id).length;
      w.c6btOpenFile({ files:[new w.File([JSON.stringify(fakeAttempt)],"imported-results.json",{type:"application/json"})] });
      setTimeout(function(){
        ck(w.C6BAttempts.forStudent(w.READER.id).length===beforeCount,"opening the exact same file again never duplicates the attempt");

        var badFile=new w.File(["not real json"],"bad.json",{type:"application/json"});
        w.c6btOpenFile({ files:[badFile] });
        setTimeout(function(){
          ck(d.getElementById("c6bt-file-note").textContent.indexOf("doesn't look like")>-1,"an invalid file gets an honest error, not a silent failure or a crash");

          regressionScreens();
        },20);
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
    ck(allOk,"every existing screen, plus the 2 new Check 6B screens, still opens");

    /* ---- 6A and Checks 1-5 functionally unchanged ---- */
    ck(w.C6_ITEMS.length===50,"Check 6 (6A) still has 50 items (untouched by this task)");
    ck(w.C6_SETS[3].words.indexOf("carelessness")>-1,"6A's corrected Set 4 is still intact (untouched by this task)");
    ck(w.C5_ITEMS.length===120,"Check 5 still has 120 items (untouched by this task)");
    ck(w.C4_ITEMS.length===142,"Check 4 still has 142 items (untouched by this task)");
    ck(w.C1_UPPER.length===26,"Check 1's 26-letter uppercase sequence is untouched by this task");

    console.log("\n=== "+pass+" passed, "+fail+" failed ===");
    process.exit(fail?1:0);
  }
},400);
