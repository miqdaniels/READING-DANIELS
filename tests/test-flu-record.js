const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8');

/* This file tests the Fluency passage screen's single Record/Stop button:
   tap once to start recording AND the 1:00 timer together, tap again (or
   let the timer run out) to end it, then the button locks. A real 60s
   countdown would make this test painfully slow, so window.setInterval is
   replaced with a fast-forwarding version that fires ticks back-to-back via
   real (but effectively instant) macrotasks -- the tick logic itself is
   untouched, only the wall-clock wait between ticks is removed. */
function makeDom(micBlocked){
  return new JSDOM(html,{url:"https://miqdaniels.github.io/READING-DANIELS/",runScripts:"dangerously",pretendToBeVisual:true,
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
        if(micBlocked){ var e=new Error("blocked"); e.name="NotAllowedError"; return Promise.reject(e); }
        return Promise.resolve({getTracks:function(){return [{stop:function(){}}];}});
      }},configurable:true});
      /* fast-forwarded setInterval/clearInterval: same tick semantics
         (each tick is still a separate turn of the event loop, so
         clearInterval called between ticks genuinely stops it), just with
         no real wall-clock delay between ticks */
      w.setInterval=function(fn){
        var h={stopped:false};
        function tick(){ if(h.stopped){ return; } fn(); if(!h.stopped){ setTimeout(tick,0); } }
        setTimeout(tick,0);
        return h;
      };
      w.clearInterval=function(h){ if(h){ h.stopped=true; } };
    }
  });
}

function activeId(d){ var s=d.getElementsByClassName("screen"); for(var i=0;i<s.length;i++) if(/active/.test(s[i].className)) return s[i].id; return null; }

setTimeout(function(){
  let pass=0,fail=0;
  function ck(c,m){ if(c){pass++;} else {fail++; console.log("FAIL:",m);} }

  const dom=makeDom(false);
  const w=dom.window, d=w.document;

  w.CURCLASS=w.CLASSES[0]; w.READER=w.CLASSES[0].students[0];
  w.fluOpen();
  ck(activeId(d)==="fluencyPassage","on the fluency passage screen");
  ck(d.getElementById("flu-rec-lbl").textContent==="Record","starts showing Record");
  ck(d.getElementById("flu-rec").disabled===false,"Record button starts enabled");

  /* ---- tap Record: button becomes Stop, timer starts on mic onstart ---- */
  w.fluToggleRec();
  setTimeout(function(){
    ck(w.recording===true,"recording is active after tapping Record");
    ck(d.getElementById("flu-rec-lbl").textContent==="Stop","button now says Stop");
    ck(d.getElementById("flu-rec").className.indexOf("rec")>-1,"button shows the recording style");
    ck(/^\d:\d\d$/.test(d.getElementById("flu-timer").textContent),"timer is counting down once recording actually started (got "+d.getElementById("flu-timer").textContent+")");

    /* ---- early Stop: tapping again ends it before 60s ---- */
    w.fluToggleRec();
    ck(w.recording===false,"an early Stop tap ends the recording");
    ck(w.fluBlob!==null,"a blob was captured from the early stop");
    ck(d.getElementById("flu-rec").disabled===true,"button is disabled once the recording has ended (early stop)");
    ck(d.getElementById("flu-rec-lbl").textContent==="Recorded","label reflects the locked state");

    /* ---- fresh attempt: let the timer run all the way to auto-stop ---- */
    w.fluOpen();
    ck(d.getElementById("flu-rec").disabled===false,"a fresh passage entry re-enables Record");
    w.fluToggleRec();
    setTimeout(function(){
      ck(w.recording===true,"recording started for the auto-stop scenario");
      /* let the fast-forwarded timer run out on its own -- no manual Stop tap */
      setTimeout(function(){
        ck(w.recording===false,"recording stopped on its own once the timer reached 0:00 -- no tap needed");
        ck(w.fluBlob!==null,"a blob was captured from the automatic stop");
        ck(d.getElementById("flu-timer").textContent==="0:00","timer display reached 0:00");
        ck(d.getElementById("flu-rec").disabled===true,"button is disabled after the automatic stop");
        ck(d.getElementById("flu-rec-lbl").textContent==="Recorded","label reflects the locked state after auto-stop");

        /* ---- mic blocked: friendly message, button stays usable ---- */
        const dom2=makeDom(true);
        const w2=dom2.window, d2=w2.document;
        w2.CURCLASS=w2.CLASSES[0]; w2.READER=w2.CLASSES[0].students[1];
        w2.fluOpen();
        w2.fluToggleRec();
        setTimeout(function(){
          var st=d2.getElementById("flu-state");
          ck(/microphone/i.test(st.textContent) && st.className.indexOf("err")>-1,"a mic error shows a plain message");
          ck(d2.getElementById("flu-rec").disabled===false,"the button is NOT locked after a mic error -- the student can try again");
          ck(d2.getElementById("flu-rec-lbl").textContent==="Record","label goes back to Record after a mic error");

          console.log("\n=== "+pass+" passed, "+fail+" failed ===");
          process.exit(fail?1:0);
        },60);
      },250); // 60 fast-forwarded ticks resolve well within this
    },60);
  },60);
},400);
