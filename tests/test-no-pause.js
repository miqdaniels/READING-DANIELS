const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8').replace('<script src="clips.js" defer></script>','<script>'+fs.readFileSync('./clips.js','utf8')+'</script>');

/* CHANGE: REMOVE PAUSE FROM ALL DIAGNOSTICS -- no Pause button anywhere in
   Check 1, Check 2, Fluency, or Retell (pausing lets a student leave and
   look up answers). Check 2's 5:00 timer still pauses automatically on the
   before-2B/before-2C transition screens (the video keeps recording); no
   manual pause exists anywhere in Check 2's own assessment screen. Redo
   stays available on every review screen for a real emergency restart.
   Word Practice's own phrase-pacer Pause (s-final) is a different, allowed
   feature and is NOT covered by this file. */
const dom=new JSDOM(html,{url:"https://miqdaniels.github.io/READING-DANIELS/",runScripts:"dangerously",pretendToBeVisual:true,
  beforeParse(w){
    w.HTMLElement.prototype.scrollIntoView=function(){}; w.scrollTo=function(){};
    class FakeRec{
      constructor(stream,opts){ this.state="inactive"; this.mimeType=(opts&&opts.mimeType)||"video/webm"; }
      start(){ this.state="recording"; if(this.onstart){ this.onstart(); } if(this.ondataavailable){ this.ondataavailable({data:{size:12,type:this.mimeType}}); } }
      pause(){ this.state="paused"; }
      resume(){ this.state="recording"; }
      stop(){ this.state="inactive"; if(this.onstop){ this.onstop(); } }
    }
    w.MediaRecorder=FakeRec;
    w.URL.createObjectURL=function(){ return "blob:x"; };
    w.URL.revokeObjectURL=function(){};
    Object.defineProperty(w.navigator,'mediaDevices',{value:{getUserMedia:function(){
      return Promise.resolve({ getTracks:function(){ return [{stop:function(){}},{stop:function(){}}]; } });
    }}, configurable:true});

    /* Minimal fake IndexedDB -- jsdom has none, and FluencyStore (used by
       Fluency/Retell's Save) needs a working put/get to be exercised
       honestly rather than silently failing into its error branch. */
    var databases={};
    function FakeIDBFactory(){}
    FakeIDBFactory.prototype.open=function(name){
      var req={};
      setTimeout(function(){
        if(!databases[name]){ databases[name]={stores:{}}; }
        var dbRec=databases[name];
        var db={
          objectStoreNames:{ contains:function(n){ return !!dbRec.stores[n]; } },
          createObjectStore:function(n){ dbRec.stores[n]={}; return dbRec.stores[n]; },
          transaction:function(n){
            var store=dbRec.stores[n];
            var tx={};
            tx.objectStore=function(){
              return {
                put:function(val,key){ store[key]=val; },
                get:function(key){ var r={}; setTimeout(function(){ r.result=store.hasOwnProperty(key)?store[key]:undefined; if(r.onsuccess) r.onsuccess(); },0); return r; },
                getAllKeys:function(){ var r={}; setTimeout(function(){ r.result=Object.keys(store); if(r.onsuccess) r.onsuccess(); },0); return r; }
              };
            };
            Object.defineProperty(tx,'oncomplete',{ set:function(fn){ setTimeout(fn,0); }, configurable:true });
            Object.defineProperty(tx,'onerror',{ set:function(){}, configurable:true });
            return tx;
          }
        };
        req.result=db;
        if(req.onupgradeneeded) req.onupgradeneeded();
        req.result=db;
        if(req.onsuccess) req.onsuccess();
      },0);
      return req;
    };
    w.indexedDB=new FakeIDBFactory();
  }
});
const w=dom.window, d=w.document;
function activeId(){ var s=d.getElementsByClassName("screen"); for(var i=0;i<s.length;i++) if(/active/.test(s[i].className)) return s[i].id; return null; }
/* No button anywhere inside the given screen may be a Pause/Resume control. */
function noPauseIn(screenId){
  var scr=d.getElementById(screenId); if(!scr){ return true; }
  var labels=scr.querySelectorAll(".icon-label, .rec-btn *, button");
  var i;
  for(i=0;i<labels.length;i++){
    var t=(labels[i].textContent||"").replace(/\s+/g," ").trim();
    if(/^Pause$/.test(t) || /^Resume$/.test(t)){ return false; }
  }
  return true;
}

setTimeout(function(){
  let pass=0,fail=0;
  function ck(c,m){ if(c){pass++;} else {fail++; console.log("FAIL:",m);} }

  w.READER=w.CLASSES[0].students[0]; w.CURCLASS=w.CLASSES[0];

  /* ---- Check 1: no Pause anywhere, Record + Next only ---- */
  w.go("check1");
  ck(noPauseIn("check1"),"no Pause/Resume control anywhere in Check 1");
  w.c1Start();
  setTimeout(function(){
    ck(noPauseIn("check1"),"still no Pause once Check 1 recording is active");
    ck(d.getElementById("c1-next").style.display!=="none","Next is the only way to move through Check 1 (no Pause hides it)");

    /* ---- no student Redo on a check -- but the underlying restart still
       works cleanly for View as Student, which is exempt ---- */
    var C1_ALL=w.C1_ALL, i;
    for(i=0;i<C1_ALL.length-1;i++){ w.c1Next(); }
    w.c1Next(); // Finish -> stops the recording, shows review
    ck(d.getElementById("c1-review").innerHTML.indexOf("Redo")===-1,"no student Redo is offered on the Check 1 review screen");
    w.c1RecordAgain(); // the restart mechanism itself still works (View as Student uses it)
    ck(activeId()==="check1","restarting returns to a clean Check 1 start");
    ck(d.getElementById("c1-start").style.display!=="none","Record button is back and usable after restarting");
    ck(d.getElementById("c1-start").disabled===false,"Record button is re-enabled after restarting");
    ck(noPauseIn("check1"),"still no Pause after restarting");

    runCheck2();
  },30);

  function runCheck2(){
    /* ---- Check 2: no Pause button in setup or the assessment screen ---- */
    w.go("check2");
    ck(noPauseIn("check2"),"no Pause/Resume control anywhere in Check 2 (setup)");
    w.c2SetupMedia();
    setTimeout(function(){
      w.c2StartCheck();
      setTimeout(function(){
        ck(activeId()==="check2","Check 2 assessment underway");
        ck(noPauseIn("check2"),"no Pause/Resume control once Check 2 is recording");
        ck(w.c2TimerHandle!==null,"the 5:00 timer is running straight through (not paused) during ordinary items");

        /* ---- walk to the 2A -> 2B boundary (jump the index directly and
           call c2DoAdvance(), same trick test-check2.js uses, bypassing the
           frame-paced Next guard which isn't what's under test here): the
           TRANSITION screen is the only place the timer pauses, and the
           recording never stops ---- */
        w.c2Idx=20; w.c2PaintItem(); // last 2A item (index 20 of 0..30)
        w.c2DoAdvance(); // crosses into 2B -> shows the transition screen
        ck(activeId()==="check2","still on the check2 screen (transition is a sub-panel of it)");
        ck(d.getElementById("c2-transition").style.display!=="none","the before-2B transition screen is showing");
        ck(w.c2TimerHandle===null,"the 5:00 timer is paused ONLY here, on the transition screen");
        ck(w.c2Recorder && w.c2Recorder.state==="recording","the underlying recorder is still running through the transition -- never paused");
        ck(noPauseIn("check2"),"the transition screen itself has no manual Pause button (it resumes automatically on I'm Ready)");

        w.c2ReadyTap();
        ck(w.c2TimerHandle!==null,"tapping I'm Ready resumes the timer");
        ck(noPauseIn("check2"),"still no Pause after resuming into 2B");

        /* ---- finish Check 2 straight through (no pausing); no student
           Redo is offered, but the restart mechanism itself still works
           (View as Student uses it) -- jump straight to the last item and
           advance once more, which triggers c2FinishRecording() and stops
           the recorder ---- */
        w.c2Idx=w.C2_ITEMS.length-1; w.c2PaintItem();
        w.c2DoAdvance();
        setTimeout(function(){
          ck(d.getElementById("c2-review").innerHTML.indexOf("Redo")===-1,"no student Redo is offered on the Check 2 review screen");
          w.c2RecordAgain();
          ck(d.getElementById("c2-setup").style.display!=="none","restarting returns Check 2 to a clean setup screen");
          ck(noPauseIn("check2"),"still no Pause after restarting Check 2");

          runFluencyRetell();
        },30);
      },30);
    },30);
  }

  function runFluencyRetell(){
    /* ---- Fluency: no Pause, Record/Done only ---- */
    w.CURCLASS=w.CLASSES[0]; w.READER=w.CLASSES[0].students[1];
    w.fluOpen();
    ck(noPauseIn("fluencyPassage"),"no Pause/Resume control in Fluency before recording");
    w.fluToggleRec();
    setTimeout(function(){
      ck(w.recording===true,"Fluency recording is active");
      ck(noPauseIn("fluencyPassage"),"no Pause/Resume control while Fluency is recording (Done takes its place)");
      ck(d.getElementById("flu-done").style.display!=="none","Done is offered instead of Pause");
      w.fluToggleRec(); // Done
      ck(w.recording===false,"Done ends the Fluency recording cleanly");

      w.fluSubmit();
      setTimeout(function(){
        ck(activeId()==="fluencyRetell","Submit moves on to Retell");
        ck(noPauseIn("fluencyRetell"),"no Pause/Resume control in Retell before recording");
        w.retToggleRec();
        setTimeout(function(){
          ck(w.recording===true,"Retell recording is active");
          ck(noPauseIn("fluencyRetell"),"no Pause/Resume control while Retell is recording (Done takes its place)");
          ck(d.getElementById("ret-done").style.display!=="none","Done is offered instead of Pause in Retell too");
          w.retToggleRec(); // Done
          ck(w.recording===false,"Done ends the Retell recording cleanly");

          console.log("\n=== "+pass+" passed, "+fail+" failed ===");
          process.exit(fail?1:0);
        },30);
      },30);
    },30);
  }
},400);
