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
  beforeParse(w){ w.HTMLElement.prototype.scrollIntoView=function(){}; w.scrollTo=function(){}; }
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

  /* ---- rapid double-tap protection: a second synchronous tap on the
     same physical spot must not register a second, unintended answer ---- */
  var firstChoiceBtn=d.querySelectorAll("#c6b-choices .choice-pill")[0];
  click(firstChoiceBtn);
  var secondItemBtns=d.querySelectorAll("#c6b-choices .choice-pill");
  click(secondItemBtns[0]); // synchronous second click, same tick -- should be swallowed by the lock
  ck(w.c6bResponses.length===1,"a rapid second tap right after the first does not record a second response (got "+w.c6bResponses.length+")");

  function answerRemaining(cb){
    var btns=d.querySelectorAll("#c6b-choices .choice-pill");
    if(btns.length===0){ cb(); return; }
    var item=w.C6B_ITEMS[w.c6bIdx];
    click(btns[item.correct]); // answer every remaining item correctly
    setTimeout(function(){ answerRemaining(cb); },20);
  }

  setTimeout(function(){
    answerRemaining(function(){
      ck(w.c6bResponses.length===24,"all 24 items recorded exactly one response each (got "+w.c6bResponses.length+")");
      ck(!!q("#c6b-done .pill-btn-primary"),"a Continue button appears after the last item");
      ck(q("#c6b-done").textContent.indexOf("24")===-1 && q("#c6b-done").textContent.indexOf("/")===-1,
        "the student is never shown their raw score (dignity-first, matches every other Check)");
      ck(!/Correct|Wrong|Incorrect/i.test(d.getElementById("check6b").textContent.replace(/Correct .{0,20}Skip/,"")),
        "no per-item correctness feedback ever appeared during the test");

      var attempts=w.C6BAttempts.forStudent(w.READER.id);
      ck(attempts.length===1,"one Check 6B attempt saved");
      ck(attempts[0].overall===24,"overall score is exact (answered every item correctly)");
      ck(attempts[0].setCorrect["6B-Prefix"]===6 && attempts[0].setCorrect["6B-Suffix"]===6
        && attempts[0].setCorrect["6B-Inflect"]===6 && attempts[0].setCorrect["6B-Context"]===6,
        "every category score is exact");
      ck(typeof attempts[0].totalTimeMs==="number","administration time is retained");
      ck(attempts[0].responses.length===24,"item-level response data retained for all 24 items");
      ck(attempts[0].responses[0].targetWord===w.C6B_ITEMS[0].targetWord,"item-level metadata (target word) retained");
      ck(attempts[0].responses[0].morpheme===w.C6B_ITEMS[0].morpheme,"item-level metadata (morpheme) retained");
      ck(!w.ckDone()["check6b"],"Check 6B is not marked done until Continue is tapped");

      click(q("#c6b-done .pill-btn-primary"));
      ck(activeId()==="diagLanding","Continue returns to the Reading Checks dashboard");
      ck(!!w.ckDone()["check6b"],"Check 6B marked completed after Continue");

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

    /* ---- Student View preview ---- */
    w.go("check6bTeach");
    var pvBtn=Array.prototype.filter.call(d.querySelectorAll("#check6bTeach .mini-btn"),function(b){return /Student View/.test(b.textContent);})[0];
    ck(!!pvBtn,"Check 6B Review has a Student View button");
    click(pvBtn);
    ck(activeId()==="check6b","Student View opens the real Check 6B student screen");
    click(q("#preview-banner .vas-exit"));
    ck(activeId()==="check6bTeach","exiting preview returns to Check 6B Review");

    regressionScreens();
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
