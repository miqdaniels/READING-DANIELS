const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8');

/* Mirrors the user's own Test A/B/C/D exactly, with ZERO artificial delay
   anywhere a real distinct tap is expected to work. Root cause history:
   a single GLOBAL cooldown (first 400ms, then 200ms) blocked ANY guarded
   button if ANY other guarded button had fired recently, which is why a
   real fast tap on a student's name right after picking a class kept
   getting eaten. The fix replaced that with a guard scoped to the ONE
   exact list slot that's actually at risk (the slot the previous tap
   landed on) -- every other slot, including the very next one, is fully
   live from the first frame, no wait at all, ever.
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
  ck(activeId()==="studentMenu","Test B: an immediate (0ms) tap on a DIFFERENT slot opens the student menu on the first try");
  ck(w.READER && w.READER.name==="Kiara Joachin","the correct student was selected, with no wait");

  /* ---- Test C: rapidly mash the exact same on-screen slot several times.
     Physically this means: tap class (slot 0), then several more taps
     land -- because the screen already changed -- on the roster's own
     slot 0 (Miriam Gomez). NONE of those extra taps may select anyone. ---- */
  w.READER=null; w.CURCLASS=null;
  w.go("s-pick"); w.buildClasses();
  var classBtns2=d.querySelectorAll("#class-list .btn");
  click(classBtns2[0]); // First hour, slot 0 -- the one deliberate tap
  ck(activeId()==="s-roster","(setup) the deliberate class tap reaches the roster");
  var rosterBtnsNow=d.querySelectorAll("#roster-list .btn");
  var mashCount=6, m;
  for(m=0;m<mashCount;m++){ click(rosterBtnsNow[0]); } // rapid mashing, 0ms apart, same slot 0 (Miriam)
  ck(activeId()==="s-roster","Test C: "+mashCount+" rapid mashes on the same slot never drill into the student menu");
  ck(w.READER===null,"Test C: READER was not accidentally set to Miriam (or anyone) by the mashing");

  /* ---- and once the student stops mashing that exact slot and genuinely
     decides they DO want that slot's name, it works -- this is the one
     honest, disclosed edge: the exact same list position as the just-
     tapped button needs the mashing to actually stop first. Any OTHER
     slot never had this limitation (see Test B). ---- */
  setTimeout(function(){
    click(rosterBtnsNow[0]);
    ck(activeId()==="studentMenu","a later, genuine, single tap on that same slot works once the mashing has actually stopped");
    ck(w.READER && w.READER.name==="Miriam Gomez","and selects the right student");

    finishFixSixChecks();
  },150);

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
