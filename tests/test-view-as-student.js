const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8');

/* VIEW AS STUDENT + PLACEHOLDER STUDENTS.
   - "View as Student" only exists inside the teacher-only #teacher-doors
     block (gated by ?teacher in the URL, same as every other teacher
     screen) -- a plain student URL never renders a way to reach it.
   - While active: a "VIEWING AS STUDENT" banner with Exit shows on every
     screen; nothing written during the session touches a REAL student's
     storage (every per-student key is redirected into a separate "vas_"
     sandbox); Reset sweeps that sandbox clean.
   - Placeholder "Student 1/2/3" slots are grayed out and non-tappable
     (even mashed) until the teacher activates them by name; once
     activated they behave exactly like a normal student. */
function makeDom(url){
  return new JSDOM(html,{url:url,runScripts:"dangerously",pretendToBeVisual:true,
    beforeParse(w){
      w.HTMLElement.prototype.scrollIntoView=function(){}; w.scrollTo=function(){};
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
      }}, configurable:true});
    }
  });
}
function activeId(d){ var s=d.getElementsByClassName("screen"); for(var i=0;i<s.length;i++) if(/active/.test(s[i].className)) return s[i].id; return null; }
function click(w,el){ el.dispatchEvent(new w.Event("click",{bubbles:true})); }

setTimeout(function(){
  let pass=0,fail=0;
  function ck(c,m){ if(c){pass++;} else {fail++; console.log("FAIL:",m);} }

  /* ---- 1) not reachable from the plain student URL ---- */
  var domS=makeDom("https://miqdaniels.github.io/READING-DANIELS/");
  var wS=domS.window, dS=domS.window.document;
  ck(dS.getElementById("teacher-doors").style.display==="none","student URL: teacher-doors (and everything in it, including View as Student) is hidden");
  ck(activeId(dS)==="s-pick","student URL opens straight to the class-hour screen, never s-home");

  /* ---- teacher URL from here on ---- */
  var dom=makeDom("https://miqdaniels.github.io/READING-DANIELS/?teacher");
  var w=dom.window, d=w.document;
  ck(d.getElementById("teacher-doors").style.display!=="none","teacher URL: teacher-doors is visible");
  var vasBtn=null, btns=d.querySelectorAll("#teacher-doors .btn"), i;
  for(i=0;i<btns.length;i++){ if(/View as Student/.test(btns[i].textContent)) vasBtn=btns[i]; }
  ck(!!vasBtn,"a 'View as Student' button exists on the teacher side");

  /* ---- 2) entering shows the banner + Exit, walks class -> name -> menu ---- */
  ck(d.getElementById("vas-banner").style.display==="none","banner is hidden before entering View as Student");
  w.enterViewAsStudent();
  ck(w.VIEW_AS_STUDENT===true,"VIEW_AS_STUDENT flag is on");
  ck(activeId(d)==="s-pick","View as Student opens the real class-hour screen");
  ck(d.getElementById("vas-banner").style.display!=="none","the VIEWING AS STUDENT banner is showing");
  ck(/VIEWING AS STUDENT/.test(d.getElementById("vas-banner").textContent),"banner says VIEWING AS STUDENT");
  var exitBtn=d.querySelector("#vas-banner .vas-exit");
  ck(!!exitBtn,"an Exit button is in the banner");

  w.buildClasses();
  var classBtns=d.querySelectorAll("#class-list .btn");
  click(w,classBtns[0]);
  ck(activeId(d)==="s-roster","class tap reaches the roster while viewing as student");
  ck(d.getElementById("vas-banner").style.display!=="none","banner still showing on the roster screen");

  /* pick a REAL (non-placeholder) student for the demo */
  var realStudent=w.CLASSES[0].students[0];
  var nameBtns=d.querySelectorAll("#roster-list .btn"), target=null, k;
  for(k=0;k<nameBtns.length;k++){ if(nameBtns[k].textContent===realStudent.name) target=nameBtns[k]; }
  click(w,target);
  ck(activeId(d)==="s-confirm","name tap reaches the Is-this-you confirm, same as for a real student");
  click(w,d.getElementById("confirm-yes-btn"));
  ck(activeId(d)==="studentMenu","Yes reaches the student menu");
  ck(w.READER===realStudent,"READER is the real student, for a realistic demo");
  ck(d.getElementById("vas-banner").style.display!=="none","banner still showing on the student menu");

  /* ---- 3) complete a Check 1 take through the real UI and confirm it
     NEVER touches the real student's storage, and Redo works freely.
     Isolation is checked with RAW localStorage reads, not the mode-aware
     accessors (C1Attempts/ckDone read whichever sandbox is CURRENTLY
     active, by design -- that's what keeps every other screen honest
     both during and after a demo, but it means the real/sandboxed keys
     have to be told apart here by reading storage directly). ---- */
  w.go("check1");
  w.c1Start();
  setTimeout(function(){
    var n=w.C1_ALL.length, j;
    for(j=0;j<n-1;j++){ w.c1Next(); }
    w.c1Next(); // reaches the last letter and triggers the auto-stop
    w.c1Finish(); // "Submit Recording" -- downloads + logs the attempt
    w.c1ConfirmSubmitted(); // taps YES -- marks the check done

    var realAttempts=JSON.parse(w.localStorage.getItem("rf_check1_attempts")||"[]");
    ck(realAttempts.filter(function(a){return a.studentId===realStudent.id;}).length===0,"the REAL student's Check 1 attempt log is untouched");
    var realChecks=JSON.parse(w.localStorage.getItem("rf_checks_"+realStudent.id)||"{}");
    ck(realChecks.check1!==1,"the REAL student's check-done flag is untouched");
    var vasAttempts=JSON.parse(w.localStorage.getItem("vas_rf_check1_attempts")||"[]");
    ck(vasAttempts.filter(function(a){return a.studentId===realStudent.id;}).length===1,"the DEMO's own sandboxed attempt log WAS recorded");
    var vasChecks=JSON.parse(w.localStorage.getItem("vas_rf_checks_"+realStudent.id)||"{}");
    ck(vasChecks.check1===1,"the DEMO's own sandboxed check-done flag WAS set");

    /* Redo -- no one-shot limit, can demo the same check again right away */
    w.go("check1");
    ck(activeId(d)==="check1","can re-open Check 1 again immediately in View as Student");
    w.c1Start(); // mic is already cached from the first take, but startRec's mic promise still resolves on a microtask
    setTimeout(function(){
      ck(w.recording===true,"a second full take starts cleanly -- Redo has no one-shot limit here");
      for(j=0;j<n-1;j++){ w.c1Next(); }
      w.c1Next();
      w.c1Finish();
      w.c1ConfirmSubmitted();
      var realAttempts2=JSON.parse(w.localStorage.getItem("rf_check1_attempts")||"[]");
      ck(realAttempts2.filter(function(a){return a.studentId===realStudent.id;}).length===0,"still nothing landed on the real student's attempt log after a second demo take");

      /* ---- Exit returns to the teacher home and turns the mode off ---- */
      click(w,d.getElementById("vas-banner").querySelector(".vas-exit"));
      ck(w.VIEW_AS_STUDENT===false,"Exit turns View as Student off");
      ck(activeId(d)==="s-home","Exit returns to the teacher home");
      ck(d.getElementById("vas-banner").style.display==="none","banner is hidden again after Exit");

      /* ---- Reset clears the sandbox ---- */
      ck(w.localStorage.getItem("vas_rf_checks_"+realStudent.id)!==null,"(setup) sandboxed data exists before Reset");
      w.vasReset();
      ck(w.localStorage.getItem("vas_rf_checks_"+realStudent.id)===null,"Reset clears the View as Student sandbox");
      ck(/Cleared/.test(d.getElementById("vas-reset-msg").textContent),"Reset shows a confirmation message");

      runPlaceholderTests();
    },30);
  },30);

  function runPlaceholderTests(){
    /* ---- grayed-out placeholders can't be tapped, even mashed ---- */
    w.READER=null; w.CURCLASS=null; w.PENDING_STU=null;
    w.go("s-pick"); w.buildClasses();
    var cB=d.querySelectorAll("#class-list .btn"); click(w,cB[0]);
    var nB=d.querySelectorAll("#roster-list .btn"), placeholderBtn=null, m;
    for(m=0;m<nB.length;m++){ if(nB[m].textContent==="Student 1") placeholderBtn=nB[m]; }
    ck(!!placeholderBtn,"the 'Student 1' placeholder slot is listed on the roster");
    ck(placeholderBtn.disabled===true,"the placeholder button is disabled");
    ck(placeholderBtn.className.indexOf("locked")>-1,"the placeholder uses the grayed-out locked style");
    for(m=0;m<10;m++){ click(w,placeholderBtn); } // mash it 10x
    ck(activeId(d)==="s-roster","mashing the grayed-out placeholder does nothing at all");
    ck(w.PENDING_STU===null,"no student got selected from mashing the placeholder");
    ck(w.READER===null,"READER was never set from the placeholder");

    /* placeholders don't shift the layout -- still directly in the roster
       list, same as any other student button, nothing tappable inserted
       around them */
    ck(d.getElementById("roster-list").contains(placeholderBtn),"the placeholder sits in the normal roster list, not a separate zone");

    /* ---- teacher activates it with a real name ---- */
    w.go("s-teachStudents");
    ck(activeId(d)==="s-teachStudents","Add new student screen opens");
    var slotId=w.CLASSES[0].students.filter(function(s){ return s.name==="Student 1"; })[0].id;
    var input=d.getElementById("ts-name-"+slotId);
    ck(!!input,"an input exists for the Student 1 slot");
    input.value="Miguel R.";
    w.teachActivate(slotId,"ts-name-"+slotId);
    ck(w.CLASSES[0].students.filter(function(s){ return s.id===slotId; })[0].name==="Miguel R.","the slot's name is now Miguel R. in memory");
    ck(w.CLASSES[0].students.filter(function(s){ return s.id===slotId; })[0].activated===true,"the slot is marked activated");

    /* ---- the roster now shows the new name, tappable with one tap ---- */
    w.go("s-roster");
    var nB2=d.querySelectorAll("#roster-list .btn"), activated=null;
    for(m=0;m<nB2.length;m++){ if(nB2[m].textContent==="Miguel R.") activated=nB2[m]; }
    ck(!!activated,"the roster shows 'Miguel R.' instead of 'Student 1'");
    ck(activated.disabled!==true,"the activated slot is enabled");
    ck(activated.className.indexOf("locked")===-1,"the activated slot no longer uses the locked style");
    click(w,activated); // exactly one tap
    ck(activeId(d)==="s-confirm","one tap on the activated slot reaches the Is-this-you confirm");
    ck(d.getElementById("confirm-name").textContent==="Miguel R.","confirm screen shows the newly-activated name");
    click(w,d.getElementById("confirm-yes-btn"));
    ck(activeId(d)==="studentMenu","one tap (plus Yes) opens the student menu");
    ck(w.READER.name==="Miguel R.","READER is the activated student, working like any other");
    ck(w.READER.id===slotId,"same underlying id as the placeholder slot -- normal one-shot rules on checks/cold read/retell still apply");

    console.log("\n=== "+pass+" passed, "+fail+" failed ===");
    process.exit(fail?1:0);
  }
},400);
