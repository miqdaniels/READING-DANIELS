const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8');

/* This round's specific regressions:
   1) The reported bug: after tapping a class period, tapping a student's
      name a SHORT time later (not the old artificial ~460ms test wait --
      a real, fast, confident tap) had to be tapped twice. Root cause was
      a single GLOBAL 400ms cooldown shared by every guarded button, so a
      legitimate next tap on a totally different, freshly-rendered button
      got silently swallowed if it landed within that window. The fix
      shortened the window (200ms) and made each render's own "used" flag
      local instead of global. This test proves a tap ~250ms after the
      class pick -- comfortably real, comfortably not a same-instant
      duplicate/bounce event -- still works on the very first try.
   2) Fix 3's one standard filename function, tested directly against the
      user's own literal examples.
   3) Reading Check progress is isolated per student (Fix 6). */
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

  /* ---- Fix 1: a real (not artificially-slow) tap sequence works first try ---- */
  w.READER=null;
  w.go("s-pick"); w.buildClasses();
  var classBtns=d.querySelectorAll("#class-list .btn");
  click(classBtns[0]); // First hour
  ck(activeId()==="s-roster","class tap reaches the roster");

  setTimeout(function(){ // 250ms: a real, fast, deliberate tap -- not an instant duplicate
    var nameBtns=d.querySelectorAll("#roster-list .btn"), target=null, i;
    for(i=0;i<nameBtns.length;i++){ if(nameBtns[i].textContent==="Miriam Gomez") target=nameBtns[i]; }
    click(target); // exactly ONE tap
    ck(activeId()==="studentMenu","one tap on the name, ~250ms after the class tap, opens the student menu on the first try");
    ck(w.READER && w.READER.name==="Miriam Gomez","the correct student was selected");

    /* ---- and the reverse: an instant (0ms) stray tap right after a nav is
       still ignored (waiting 250ms first, clear of navGuard's own short
       window, so THIS scenario's class tap isn't itself blocked by the
       previous scenario's tap) ---- */
    setTimeout(function(){
      w.READER=null;
      w.go("s-pick"); w.buildClasses();
      var classBtns2=d.querySelectorAll("#class-list .btn");
      click(classBtns2[0]);
      ck(activeId()==="s-roster","(setup) the deliberate class tap itself reaches the roster");
      var rosterBtnsNow=d.querySelectorAll("#roster-list .btn");
      click(rosterBtnsNow[0]); // same instant -- a genuine accidental extra contact
      ck(activeId()==="s-roster","an instant stray tap right after a class pick is still ignored, not drilled into studentMenu");
      ck(w.READER===null,"READER was not accidentally set by the instant stray tap");

      finishFixSixChecks();
    },250);
  },250);

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
