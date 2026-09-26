const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8');

/* ZERO artificial delay anywhere a real tap is expected to work -- every
   button fires on the very first tap, always, including the first tap on
   a screen that just rendered. Root cause history: first a single GLOBAL
   cooldown (400ms, then 200ms) blocked ANY guarded button if ANY other
   guarded button had fired recently. That was replaced with a guard
   scoped to "the one list slot the previous tap landed on" -- which fixed
   the class/name case but then broke this app's own linear menus
   (Diagnostic Tools -> a Check are BOTH always slot 0, so tapping the
   obvious next option kept getting blocked as a false "collision").
   There is no cross-screen guard of any kind anymore. The only remaining
   protection is a one-shot per-render flag that stops a literal duplicate
   event on the EXACT SAME button from double-firing -- it never delays a
   tap on anything else, even by a millisecond, no matter how the previous
   screen was tapped.
   Also covers Fix 3 (standard filename function) and Fix 6 (per-student
   isolation of Check progress). */
const dom=new JSDOM(html,{url:"https://miqdaniels.github.io/READING-DANIELS/",runScripts:"dangerously",pretendToBeVisual:true,
  beforeParse(w){ w.HTMLElement.prototype.scrollIntoView=function(){}; w.scrollTo=function(){}; }
});
const w=dom.window, d=w.document;
function activeId(){ var s=d.getElementsByClassName("screen"); for(var i=0;i<s.length;i++) if(/active/.test(s[i].className)) return s[i].id; return null; }
function click(el){ el.dispatchEvent(new w.Event("click",{bubbles:true})); }

setTimeout(function(){
  let pass=0,fail=0;
  function ck(c,m){ if(c){pass++;} else {fail++; console.log("FAIL:",m);} }

  /* ---- Fix 3: rfBuildFileName against the user's own examples ---- */
  ck(w.rfBuildFileName("Maria","Garcia","P1","CHECK_1","2026_09_25")==="Maria_Garcia_P1_CHECK_1_2026_09_25.webm",
    "Maria Garcia example matches exactly (got '"+w.rfBuildFileName("Maria","Garcia","P1","CHECK_1","2026_09_25")+"')");
  ck(w.rfBuildFileName("Brandon","Cruz","P3","CHECK_2","2026_09_25")==="Brandon_Cruz_P3_CHECK_2_2026_09_25.webm",
    "Brandon Cruz example matches exactly (got '"+w.rfBuildFileName("Brandon","Cruz","P3","CHECK_2","2026_09_25")+"')");
  ck(w.rfBuildFileName("O'Brien-Smith","Jr. García","P7","CHECK_3","2026_09_25")==="OBrienSmith_JrGarca_P7_CHECK_3_2026_09_25.webm",
    "unusual characters are stripped, not left to break the filename (got '"+w.rfBuildFileName("O'Brien-Smith","Jr. García","P7","CHECK_3","2026_09_25")+"')");
  ck(w.rfBuildFileName("","","P1","CHECK_1","2026_09_25").indexOf("Student_P1_CHECK_1")===0,
    "a missing name still produces a safe, well-formed filename");

  /* ---- Test A: one quick tap on a class opens the roster immediately ---- */
  w.READER=null; w.CURCLASS=null;
  w.go("s-pick"); w.buildClasses();
  var classBtns=d.querySelectorAll("#class-list .btn");
  click(classBtns[0]); // First hour, slot 0
  ck(activeId()==="s-roster","Test A: one tap on a class opens the roster with zero wait");

  /* ---- Test B: tap the class, then IMMEDIATELY (0ms, same tick) tap the
     intended student -- as long as it's a different slot than the class
     button just tapped, it must work on the very first try, no wait at
     all. Kiara Joachin is slot 3 in First hour's roster (Miriam is 0). ---- */
  var nameBtns=d.querySelectorAll("#roster-list .btn"), target=null, i;
  for(i=0;i<nameBtns.length;i++){ if(nameBtns[i].textContent==="Kiara Joachin") target=nameBtns[i]; }
  ck(!!target,"Kiara Joachin is on the First hour roster (setup check)");
  click(target); // zero elapsed time since the class tap -- no setTimeout at all
  ck(activeId()==="s-confirm","Test B: an immediate (0ms) tap on a DIFFERENT slot opens the Is-this-you confirm on the first try");
  ck(d.getElementById("confirm-name").textContent==="Kiara Joachin","the confirm screen shows the tapped student's name");
  click(d.getElementById("confirm-yes-btn")); // zero elapsed time -- immediate tap on the freshly-rendered confirm screen
  ck(activeId()==="studentMenu","Test B: an immediate (0ms) tap on Yes opens the student menu on the first try");
  ck(w.READER && w.READER.name==="Kiara Joachin","the correct student was selected, with no wait");

  /* ---- Test C: rapidly mash the SAME button several times. A real tap
     on a freshly-rendered button always fires (that's the whole point --
     see Test B), but mashing the exact same element must still only ever
     navigate ONCE, never double- or triple-fire from the extra events. ---- */
  w.READER=null; w.CURCLASS=null; w.PENDING_STU=null;
  w.go("s-pick"); w.buildClasses();
  var classBtns2=d.querySelectorAll("#class-list .btn");
  click(classBtns2[0]); // First hour
  ck(activeId()==="s-roster","(setup) the class tap reaches the roster");
  var rosterBtnsNow=d.querySelectorAll("#roster-list .btn");
  var mashCount=6, m;
  for(m=0;m<mashCount;m++){ click(rosterBtnsNow[0]); } // rapid mashing, 0ms apart, same exact button (Miriam)
  ck(activeId()==="s-confirm","Test C: mashing the same name button still reaches the confirm screen only once (the first tap fires)");
  ck(w.PENDING_STU && w.PENDING_STU.name==="Miriam Gomez","Test C: the mashed name was selected once, correctly");

  /* mashing the confirm screen's Yes button the same way still only navigates once */
  var yesBtn=d.getElementById("confirm-yes-btn");
  for(m=0;m<mashCount;m++){ click(yesBtn); }
  ck(activeId()==="studentMenu","Test C: mashing Yes still reaches the student menu only once");
  ck(w.READER && w.READER.name==="Miriam Gomez","Test C: READER was set once, correctly");

  /* ---- and a SEPARATE later tap on that same now-stale roster button still
     never double-navigates, since its one-shot flag is already spent ---- */
  click(rosterBtnsNow[0]);
  ck(activeId()==="studentMenu","a further click on the same (now stale) button does nothing more");

  finishFixSixChecks();

  function finishFixSixChecks(){
    /* ---- Fix 6: Check progress is isolated per student ---- */
    w.READER=w.CLASSES[0].students[0]; // Miriam Gomez, p1
    w.ckMarkDone("check1");
    ck(!!w.ckDone()["check1"],"Miriam's own Check 1 is marked done");
    w.READER=w.CLASSES[0].students[1]; // Oneiver Guerrero, same class
    ck(!w.ckDone()["check1"],"a different student in the SAME class does not inherit that completion");
    w.READER=w.CLASSES[1].students[0]; // a same-index student in a different class/period
    ck(!w.ckDone()["check1"],"a student in a different class period does not inherit it either");
    /* the record genuinely lives in localStorage, keyed by student id -- not just an in-memory flag */
    ck(JSON.parse(w.localStorage.getItem("rf_checks_"+w.CLASSES[0].students[0].id))["check1"]===1,
      "completion is written to real localStorage under a per-student key, so it survives a refresh");

    console.log("\n=== "+pass+" passed, "+fail+" failed ===");
    process.exit(fail?1:0);
  }
},400);
