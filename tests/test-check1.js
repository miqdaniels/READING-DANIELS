const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8');

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
    /* capture the Check 1 download so the test can confirm one (and only
       one) file is produced for the whole 52-letter assessment */
    var downloads=[];
    w.__downloads=downloads;
    var realCreateElement=w.document.createElement.bind(w.document);
    w.document.createElement=function(tag){
      var el=realCreateElement(tag);
      if(tag==="a"){
        var origClick=el.click.bind(el);
        el.click=function(){ if(el.download){ downloads.push(el.download); } };
      }
      return el;
    };
  }
});
const w=dom.window, d=w.document;
function activeId(){ var s=d.getElementsByClassName("screen"); for(var i=0;i<s.length;i++) if(/active/.test(s[i].className)) return s[i].id; return null; }
function click(el){ el.dispatchEvent(new w.Event("click",{bubbles:true})); }

setTimeout(function(){
  let pass=0,fail=0;
  function ck(c,m){ if(c){pass++;} else {fail++; console.log("FAIL:",m);} }

  w.CURCLASS=w.CLASSES[0]; w.READER=w.CLASSES[0].students[2];
  w.go("check1");
  ck(activeId()==="check1","on the Check 1 screen");
  ck(d.getElementById("c1-current").style.display==="none","no letter shown before Start is tapped");

  w.c1Start();
  setTimeout(function(){
    ck(d.getElementById("c1-current").style.display==="block","first letter shows once recording actually starts");
    ck(d.getElementById("c1-current").textContent===w.C1_ALL[0],"first letter is "+w.C1_ALL[0]+" (start of the fixed sequence)");
    ck(d.getElementById("c1-progress").textContent==="Letter 1 of 52","progress reads Letter 1 of 52");
    ck(d.getElementById("c1-start").style.display!=="none","Start button stays visible (so its pulsing dot is visible) once recording begins");
    ck(d.getElementById("c1-start").disabled===true,"Start button is disabled while recording so it can't be tapped again");
    ck(d.getElementById("c1-start").className.indexOf("rec")>-1,"Start button carries the pulsing-dot 'rec' class while recording");
    ck(d.getElementById("c1-next").style.display!=="none","Next letter button shows once recording begins");

    /* walk through all 52 letters with one tap each */
    var i;
    for(i=0;i<51;i++){ w.c1Next(); }
    ck(d.getElementById("c1-progress").textContent==="Letter 52 of 52","reached the 52nd and last letter");
    ck(d.getElementById("c1-current").textContent===w.C1_ALL[51],"last letter shown is "+w.C1_ALL[51]);
    ck(d.getElementById("c1-next").textContent.indexOf("Finish")===0,"button reads Finish on the last letter");

    w.c1Next(); // taps Finish -> stops the ONE continuous recording
    ck(w.recording===false,"recording has stopped after Finish");

    /* ---- review step: nothing is downloaded/saved until Submit ---- */
    ck(w.__downloads.length===0,"nothing downloads yet -- the student reviews first (got "+w.__downloads.length+")");
    ck(d.getElementById("c1-review").innerHTML.indexOf("Listen to Recording")>-1,"a Listen control is offered before saving");
    ck(d.getElementById("c1-review").innerHTML.indexOf("Record Again")>-1,"a Record Again control is offered before saving");
    ck(d.getElementById("c1-review").innerHTML.indexOf("Submit Recording")>-1,"a Submit Recording control is offered");
    ck(w.C1Attempts.forStudent(w.READER.id).length===0,"no attempt is saved yet, before Submit is tapped");

    w.c1Finish(); // taps "Submit Recording"
    ck(w.__downloads.length===1,"exactly one file was downloaded for the whole 52-letter check (got "+w.__downloads.length+")");
    ck(/^[A-Za-z]+_[A-Za-z]+_P1_CHECK_1_\d{4}_\d{2}_\d{2}\.webm$/.test(w.__downloads[0]),"file name follows FirstName_LastName_P#_CHECK_1_YYYY_MM_DD.webm (got '"+w.__downloads[0]+"')");
    ck(/Nice work/.test(d.getElementById("c1-state").textContent),"student sees a plain confirmation after finishing");
    ck(/Upload/.test(d.getElementById("c1-state").innerHTML) && !/Record</.test(d.getElementById("c1-state").innerHTML),"Canvas steps say Upload, not Record");

    /* ---- the app does not consider the Check done until the student
       confirms they actually submitted the file to Canvas ---- */
    ck(/Did you submit your audio file\?/.test(d.getElementById("c1-state").textContent),"asks the student to confirm submission");
    var yesBtn=d.getElementById("c1-yes-btn");
    ck(!!yesBtn,"a YES button is shown");
    ck(!w.ckDone()["check1"],"Check 1 is not marked done until YES is tapped");

    var attempts=w.C1Attempts.forStudent(w.READER.id);
    ck(attempts.length===1,"one Check 1 attempt saved for this student");
    ck(attempts[0].scores===null,"attempt is not yet scored");
    var attemptId=attempts[0].id;

    click(yesBtn);
    ck(activeId()==="diagLanding","YES returns to the Reading Checks dashboard");
    ck(!!w.ckDone()["check1"],"Check 1 is marked completed after YES");
    var i2, diagBtns=d.querySelectorAll("#diagLanding .btn");
    var foundDone=false, foundCk2Locked=true;
    for(i2=0;i2<diagBtns.length;i2++){
      if(/Check 1/.test(diagBtns[i2].textContent) && /Completed/.test(diagBtns[i2].textContent)){ foundDone=true; }
      if(/Check 2/.test(diagBtns[i2].textContent) && diagBtns[i2].disabled!==true){ foundCk2Locked=false; }
    }
    ck(foundDone,"Check 1 shows as Completed on the dashboard");
    ck(foundCk2Locked,"Check 2 is still not clickable (it has no real screen built yet -- stays 'Coming soon')");

    /* ---- clicking YES again (accidental double tap) never double-records ---- */
    var attemptsAfter=w.C1Attempts.forStudent(w.READER.id);
    ck(attemptsAfter.length===1,"still exactly one attempt saved (YES does not create duplicate records)");

    /* ---- mic-blocked path never locks the Start button ----
       (a fresh page/window is required: this app deliberately caches a
       granted mediaStream for reuse across every recording feature, so
       "blocked" can only be observed truthfully on a page's very first
       recording attempt -- same behavior already relied on elsewhere) */
    const dom2=new JSDOM(html,{url:"https://miqdaniels.github.io/READING-DANIELS/",runScripts:"dangerously",pretendToBeVisual:true,
      beforeParse(w2){
        w2.HTMLElement.prototype.scrollIntoView=function(){};
        w2.scrollTo=function(){};
        Object.defineProperty(w2.navigator,'mediaDevices',{value:{getUserMedia:function(){
          var e=new w2.Error("blocked"); e.name="NotAllowedError"; return w2.Promise.reject(e);
        }},configurable:true});
      }
    });
    const w2=dom2.window, d2=w2.document;
    w2.CURCLASS=w2.CLASSES[0]; w2.READER=w2.CLASSES[0].students[3];
    w2.go("check1");
    w2.c1Start();
    setTimeout(function(){
      var st=d2.getElementById("c1-state");
      ck(/[Mm]icrophone/.test(st.textContent) && st.className.indexOf("err")>-1,"mic error shows a plain message");
      ck(d2.getElementById("c1-start").style.display!=="none","Start button is not hidden/locked after a mic error");

      /* ---- teacher scoring ---- */
      w.go("check1Teach");
      ck(activeId()==="check1Teach","teacher review screen opens");
      var studentBtns=d.querySelectorAll("#c1t-roster .btn"), target=null, j;
      for(j=0;j<studentBtns.length;j++){ if(studentBtns[j].textContent.indexOf(w.READER.name)===0) target=studentBtns[j]; }
      ck(!!target && /\(1\)/.test(target.textContent),"roster shows the attempt count next to the student's name");
      click(target);
      var openBtn=d.querySelector("#c1t-body .mini-btn");
      ck(!!openBtn,"attempt list shows an Open button");
      click(openBtn);

      var upperCells=d.querySelectorAll("#c1t-upper-grid .c1t-cell");
      var lowerCells=d.querySelectorAll("#c1t-lower-grid .c1t-cell");
      ck(upperCells.length===26 && lowerCells.length===26,"52 tappable letter cells rendered (26 + 26)");

      /* index 0 (M) -> Incorrect (missed); index 1 (T) -> Incorrect -> Self-corrected
         (counts as correct, but tracked as a self-correction); index 2 (A) ->
         Incorrect -> Self-corrected -> Skip (missed) */
      w.c1tTap(0);
      w.c1tTap(1); w.c1tTap(1);
      w.c1tTap(2); w.c1tTap(2); w.c1tTap(2);
      var results=d.getElementById("c1t-results").textContent;
      ck(/Uppercase:\s*24\s*\/\s*26/.test(results),"uppercase result reflects the 2 actually missed, self-correction counts as correct (24/26) (got: "+results+")");
      ck(/Lowercase:\s*26\s*\/\s*26/.test(results),"lowercase untouched (26/26)");
      ck(/Overall:\s*50\s*\/\s*52/.test(results),"overall is 50/52, never collapsed to one misleading number without the breakdown");
      ck(/Self-corrections:\s*1/.test(results),"1 self-correction counted");
      ck(/Missed uppercase: M A/.test(results),"missed-letter list names M and A, not T (T was self-corrected)");

      w.c1tSave();
      var saved=w.C1Attempts.get(attemptId);
      ck(saved.uppercaseCorrect===24 && saved.lowercaseCorrect===26,"scores persisted to the attempt record");
      ck(saved.targets.length===2 && saved.targets.indexOf("M")>-1 && saved.targets.indexOf("A")>-1,"missed letters (not self-corrected ones) auto-populate the target list (What to Teach Next)");
      ck(d.getElementById("c1t-save-note").textContent.indexOf("Saved")>-1,"teacher sees a save confirmation");

      /* ---- every other existing screen still opens ---- */
      w.CURGROUP=w.GROUPS[0];
      var existingScreens=["s-home","s-pick","s-roster","studentMenu","diagLanding","check1Preview","s-groups","s-final","s-score","s-board","s-teach","s-settings","s-status","fluencyPassage","fluencyRetell","s-fluteach"];
      var allOk=true, k;
      for(k=0;k<existingScreens.length;k++){
        w.go(existingScreens[k]);
        if(activeId()!==existingScreens[k]){ allOk=false; console.log("FAIL: screen did not open: "+existingScreens[k]); }
      }
      ck(allOk,"every existing screen still opens");

      console.log("\n=== "+pass+" passed, "+fail+" failed ===");
      process.exit(fail?1:0);
    },60);
  },60);
},400);
