const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8');

/* FIX: "wrong-name taps from mashing" -- on a real device, mashing a
   class-hour button sometimes landed on a student's name on the NEXT
   screen, because both screens stacked their buttons in the same vertical
   column starting at the same on-screen spot, so a residual/ghost tap at
   that spot hit whatever button rendered there next. Fixed with LAYOUT,
   not more timing delays:
   1) class-hour buttons are one horizontal row, not a stacked column.
   2) the name screen has a non-tappable header (title + hour + book icon)
      sitting in that same zone -- nothing there has an onclick, so a
      stray tap lands on nothing.
   3) an "Is this you? [Name]" confirm screen sits between tapping a name
      and opening the student menu, with Yes/No laid out as a horizontal
      pair (not a stacked list) so they don't occupy the same screen slot
      a name in a long vertical roster would.
   The existing short one-shot stray-tap protection (a per-render "used"
   flag that blocks a literal duplicate event on the exact same button)
   is unchanged -- no new delays anywhere. */
const dom=new JSDOM(html,{url:"https://miqdaniels.github.io/READING-DANIELS/",runScripts:"dangerously",pretendToBeVisual:true,
  beforeParse(w){ w.HTMLElement.prototype.scrollIntoView=function(){}; w.scrollTo=function(){}; }
});
const w=dom.window, d=w.document;
function activeId(){ var s=d.getElementsByClassName("screen"); for(var i=0;i<s.length;i++) if(/active/.test(s[i].className)) return s[i].id; return null; }
function click(el){ el.dispatchEvent(new w.Event("click",{bubbles:true})); }

setTimeout(function(){
  let pass=0,fail=0;
  function ck(c,m){ if(c){pass++;} else {fail++; console.log("FAIL:",m);} }

  /* ---- LAYOUT: class-hour buttons are one horizontal row ---- */
  w.go("s-pick"); w.buildClasses();
  ck(d.getElementById("class-list").className.indexOf("classrow")>-1,"class-hour buttons use the one-row layout, not the stacked grid");
  var classBtnsChk=d.querySelectorAll("#class-list .btn"), ci;
  for(ci=0;ci<classBtnsChk.length;ci++){
    ck(classBtnsChk[ci].className.indexOf("block")===-1,"class-hour button '"+classBtnsChk[ci].textContent+"' is not a full-width stacked block");
  }

  /* ---- LAYOUT: the name screen's header zone is non-tappable ---- */
  w.CURCLASS=w.CLASSES[0]; w.go("s-roster");
  var headzone=d.querySelector(".roster-headzone");
  ck(!!headzone,"name screen has a header zone sitting where the class-hour row was");
  ck(d.querySelectorAll(".roster-headzone button, .roster-headzone a, .roster-headzone [onclick]").length===0,"nothing tappable sits inside the header zone");
  ck(headzone.textContent.indexOf("Reading Foundations")>-1,"header zone shows the app title");
  ck(headzone.textContent.indexOf(w.CLASSES[0].label)>-1,"header zone shows the class hour");
  ck(headzone.textContent.indexOf("📖")>-1,"header zone shows the book icon");
  /* the header zone comes before the roster list in the DOM (i.e. above it on screen) */
  var pos=headzone.compareDocumentPosition(d.getElementById("roster-list"));
  ck(!!(pos & 4),"the header zone sits above the name list, not mixed into it"); // 4 = Node.DOCUMENT_POSITION_FOLLOWING

  /* ---- LAYOUT: confirm screen's Yes/No are a horizontal pair, not a stacked list ---- */
  w.PENDING_STU=w.CLASSES[0].students[0]; w.go("s-confirm");
  var yesBtn=d.getElementById("confirm-yes-btn"), noBtn=d.getElementById("confirm-no-btn");
  ck(!!yesBtn && !!noBtn,"both Yes and No buttons are present");
  ck(yesBtn.className.indexOf("block")===-1 && noBtn.className.indexOf("block")===-1,"Yes/No are not full-width stacked blocks like the name list");
  ck(yesBtn.parentElement===noBtn.parentElement && yesBtn.parentElement.className.indexOf("nav-row")>-1,"Yes and No sit together in one horizontal row");

  /* ---- MASH TEST: mash each class-hour button 10x fast; no name may be
     selected by accident, and the roster shows only once per mash ---- */
  var mashRound=0, classIdx;
  for(classIdx=0;classIdx<w.CLASSES.length;classIdx++){
    w.READER=null; w.PENDING_STU=null; w.CURCLASS=null;
    w.go("s-pick"); w.buildClasses();
    var classBtns=d.querySelectorAll("#class-list .btn"), mm;
    ck(classBtns.length===w.CLASSES.length,"mash round "+classIdx+": all class-hour buttons rendered");
    for(mm=0;mm<10;mm++){ click(classBtns[classIdx]); } // mash the SAME button 10x, 0ms apart
    ck(activeId()==="s-roster","mash round "+classIdx+": mashing '"+w.CLASSES[classIdx].label+"' 10x reaches the roster (not further)");
    ck(w.CURCLASS===w.CLASSES[classIdx],"mash round "+classIdx+": the correct class was selected");
    ck(w.READER===null,"mash round "+classIdx+": no student got accidentally selected by the mash");
    ck(w.PENDING_STU===null,"mash round "+classIdx+": no name is even pending confirmation from the mash");
    ck(activeId()!=="studentMenu" && activeId()!=="s-confirm","mash round "+classIdx+": mashing the class button alone never reaches the name-confirm or the menu");
  }

  /* ---- 15-round reliability: tap each name once, confirm the right
     "Is this you?" screen shows, tap Yes, confirm the right student menu ---- */
  var round=0, wrongLanding=false;
  function runRound(){
    round++;
    w.READER=null; w.PENDING_STU=null; w.CURCLASS=null;
    w.go("s-pick"); w.buildClasses();
    var classBtns2=d.querySelectorAll("#class-list .btn");
    var ci2=(round-1)%classBtns2.length;
    var wantClass=w.CLASSES[ci2];
    click(classBtns2[ci2]); // exactly ONE tap
    ck(activeId()==="s-roster","round "+round+": one tap on '"+wantClass.label+"' reaches the roster");

    var nameBtns=d.querySelectorAll("#roster-list .btn");
    var si=(round*5)%nameBtns.length;
    var wantStudent=wantClass.students[si];
    click(nameBtns[si]); // exactly ONE tap
    var confirmRight = activeId()==="s-confirm" && w.PENDING_STU===wantStudent && d.getElementById("confirm-name").textContent===wantStudent.name;
    if(!confirmRight){ wrongLanding=true; }
    ck(activeId()==="s-confirm","round "+round+": one tap on '"+wantStudent.name+"' reaches the Is-this-you confirm (got '"+activeId()+"')");
    ck(d.getElementById("confirm-name").textContent===wantStudent.name,"round "+round+": confirm screen names '"+wantStudent.name+"' (got '"+d.getElementById("confirm-name").textContent+"')");

    click(d.getElementById("confirm-yes-btn")); // exactly ONE tap
    var landedRight = activeId()==="studentMenu" && w.READER===wantStudent;
    if(!landedRight){ wrongLanding=true; }
    ck(activeId()==="studentMenu","round "+round+": tapping Yes reaches the student menu (got '"+activeId()+"')");
    ck(w.READER===wantStudent,"round "+round+": READER is '"+wantStudent.name+"' (got '"+(w.READER?w.READER.name:null)+"')");
    ck(d.getElementById("sm-who").textContent===wantStudent.name,"round "+round+": menu header shows '"+wantStudent.name+"'");

    if(round<15){
      runRound();
    } else {
      ck(!wrongLanding,"across all 15 rounds, a single tap never landed on the wrong name or the wrong confirm screen");

      /* ---- "No, go back" returns to the roster without selecting the student ---- */
      w.READER=null; w.PENDING_STU=null;
      w.go("s-pick"); w.buildClasses();
      var cB=d.querySelectorAll("#class-list .btn"); click(cB[0]);
      var nB=d.querySelectorAll("#roster-list .btn"); click(nB[1]);
      ck(activeId()==="s-confirm","(No test) name tap reaches the confirm screen");
      click(d.getElementById("confirm-no-btn"));
      ck(activeId()==="s-roster","No, go back returns to the roster");
      ck(w.READER===null,"No, go back never selects the student");
      ck(w.PENDING_STU===null,"No, go back clears the pending student");

      console.log("\n=== "+pass+" passed, "+fail+" failed ===");
      process.exit(fail?1:0);
    }
  }
  runRound();
},400);
