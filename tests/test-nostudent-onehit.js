const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8');

/* This round's fixes:
   1) App opens straight to the class-hour screen -- no "Student" button,
      no s-home screen shown to students at all.
   2) "Bridges Unit 1" removed from the header (shown on every screen);
      it still shows, once, inside Word Practice (s-groups).
   3) The old "Read and Slide" lede text is gone.
   4) 15-round single-tap reliability: tap each class-hour button and each
      name button EXACTLY ONCE and confirm it moves on -- and never lands
      on the wrong name (the reported symptom named "Miriam Gomez", the
      first student in the first class, as the wrong landing spot). */
const dom=new JSDOM(html,{url:"https://miqdaniels.github.io/READING-DANIELS/",runScripts:"dangerously",pretendToBeVisual:true,
  beforeParse(w){ w.HTMLElement.prototype.scrollIntoView=function(){}; w.scrollTo=function(){}; }
});
const w=dom.window, d=w.document;
function activeId(){ var s=d.getElementsByClassName("screen"); for(var i=0;i<s.length;i++) if(/active/.test(s[i].className)) return s[i].id; return null; }
function click(el){ el.dispatchEvent(new w.Event("click",{bubbles:true})); }
var GUARD_CLEAR=460;

setTimeout(function(){
  let pass=0,fail=0;
  function ck(c,m){ if(c){pass++;} else {fail++; console.log("FAIL:",m);} }

  /* ---- opens straight to the class-hour screen, no Student button ---- */
  ck(activeId()==="s-pick","app opens straight to the class-hour screen (got '"+activeId()+"')");
  ck(!d.getElementById("s-home").className.match(/active/),"s-home (old Student-button screen) is not the active screen");
  ck(d.body.textContent.indexOf("Student")===-1 || d.querySelectorAll(".btn").length && (function(){
      var btns=d.querySelectorAll(".btn"),i; for(i=0;i<btns.length;i++){ if(btns[i].textContent.replace(/\s+/g," ").trim()==="Student"){ return false; } } return true;
    })(),"there is no bare 'Student' button anywhere in the app");
  var h1=d.querySelector("header.app h1");
  ck(!!h1 && h1.textContent==="Reading Foundations","'Reading Foundations' still shows at the top");

  /* ---- "Bridges Unit 1" removed from the shared header, still shown once in Word Practice ---- */
  var headerTag=d.querySelector("header.app .tag");
  ck(!headerTag,"'Bridges Unit 1' tag is gone from the shared header");
  w.READER=w.CLASSES[0].students[0]; w.CURGROUP=w.GROUPS[0];
  w.go("s-groups");
  ck(d.getElementById("s-groups").textContent.indexOf("Bridges Unit 1")>-1,"'Bridges Unit 1' still shows inside Word Practice (s-groups)");
  w.go("s-pick");

  /* ---- old "Read and Slide" lede text is gone from the whole document ---- */
  var fullText=d.documentElement.textContent;
  ck(fullText.indexOf("Read and Slide")===-1,"'Read and Slide' text is gone");
  ck(fullText.indexOf("Hear the word, then slide your finger across the sentence and read it out loud. Record your best read and turn it in.")===-1,"the old lede paragraph is gone");

  /* ---- 15-round single-tap reliability: class-hour buttons AND name buttons ---- */
  var round=0, wrongLanding=false;

  function runRound(){
    round++;
    w.READER=null;
    w.go("s-pick");
    ck(activeId()==="s-pick","round "+round+": s-pick is showing before the tap");
    w.buildClasses();
    var classBtns=d.querySelectorAll("#class-list .btn");
    ck(classBtns.length===w.CLASSES.length,"round "+round+": all "+w.CLASSES.length+" class-hour buttons rendered");
    var ci=(round-1)%classBtns.length;
    var wantClass=w.CLASSES[ci];
    click(classBtns[ci]); // exactly ONE tap
    ck(activeId()==="s-roster","round "+round+": one tap on '"+wantClass.label+"' reached the roster (got '"+activeId()+"')");
    ck(w.CURCLASS===wantClass,"round "+round+": the correct class ('"+wantClass.label+"') was selected, not another one");

    setTimeout(function(){
      var nameBtns=d.querySelectorAll("#roster-list .btn");
      ck(nameBtns.length===wantClass.students.length,"round "+round+": all names for '"+wantClass.label+"' rendered");
      var si=(round*3)%nameBtns.length; // vary the picked name across rounds
      var wantStudent=wantClass.students[si];
      click(nameBtns[si]); // exactly ONE tap
      ck(activeId()==="s-confirm","round "+round+": one tap on '"+wantStudent.name+"' reached the Is-this-you confirm (got '"+activeId()+"')");
      ck(d.getElementById("confirm-name").textContent===wantStudent.name,"round "+round+": the confirm screen names '"+wantStudent.name+"'");
      click(d.getElementById("confirm-yes-btn")); // exactly ONE tap
      var landedRight = activeId()==="studentMenu" && w.READER===wantStudent;
      if(!landedRight){ wrongLanding=true; }
      ck(activeId()==="studentMenu","round "+round+": tapping Yes reached the student menu (got '"+activeId()+"')");
      ck(w.READER===wantStudent,"round "+round+": READER is '"+wantStudent.name+"' (got '"+(w.READER?w.READER.name:null)+"') -- not a wrong-name landing");
      ck(d.getElementById("sm-who").textContent===wantStudent.name,"round "+round+": the menu header shows '"+wantStudent.name+"'");

      if(round<15){
        setTimeout(runRound,GUARD_CLEAR);
      } else {
        ck(!wrongLanding,"across all 15 rounds, a single tap never landed on the wrong name");
        console.log("\n=== "+pass+" passed, "+fail+" failed ===");
        process.exit(fail?1:0);
      }
    },GUARD_CLEAR);
  }
  runRound();
},400);
