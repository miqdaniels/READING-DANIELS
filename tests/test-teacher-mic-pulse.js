const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8').replace('<script src="clips.js" defer></script>','<script>'+fs.readFileSync('./clips.js','utf8')+'</script>');

/* Teacher prompt-recorder mic icon (Mick, Sept 28 2026): plain/white at
   rest, switches to the red pulsing mic the instant actual recording
   starts, on the real s-teachC2/s-teachC3 prompt-recorder screens
   (using the app's own c2tToggle/c3tToggle -- not just a CSS-source
   regex check). This behavior was accidentally disabled for these two
   screens during the same night's Check 2/3 student-screen restyle
   (which scoped an animation:none rule too broadly); this test locks
   in the fix so it can't silently regress again. */
const dom=new JSDOM(html,{url:"https://miqdaniels.github.io/READING-DANIELS/?teacher",runScripts:"dangerously",pretendToBeVisual:true,
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
  }
});
const w=dom.window, d=w.document;

setTimeout(function(){
  let pass=0,fail=0;
  function ok(c,m){ if(c){pass++;} else {fail++; console.log("FAIL:",m);} }

  w.go("s-teachC2");
  ok(d.getElementById("s-teachC2").className.indexOf("active")>-1,"Check 2 Prompts screen opens");
  var key=w.C2_PROMPT_DEFS[0].promptKey;
  var recBtn=d.getElementById("c2t-rec-"+key);
  var dot=recBtn.querySelector(".rec-dot");
  ok(w.getComputedStyle(dot).backgroundColor==="rgb(255, 255, 255)","mic is plain white before recording starts");

  w.c2tToggle(key);
  setTimeout(function(){
    ok(recBtn.className==="rec-btn rec","the button picks up the .rec class once recording actually starts");
    ok(w.getComputedStyle(dot).backgroundColor==="rgb(229, 57, 53)","mic turns red the instant recording starts");

    w.c3tToggle ? testC3() : finish();

    function testC3(){
      w.go("s-teachC3");
      var key3=w.C3_PROMPT_DEFS[0].promptKey;
      var recBtn3=d.getElementById("c3t-rec-"+key3);
      var dot3=recBtn3.querySelector(".rec-dot");
      ok(w.getComputedStyle(dot3).backgroundColor==="rgb(255, 255, 255)","Check 3 Prompts: mic is plain white before recording starts");
      w.c3tToggle(key3);
      setTimeout(function(){
        ok(recBtn3.className==="rec-btn rec","Check 3 Prompts: button picks up .rec once recording starts");
        ok(w.getComputedStyle(dot3).backgroundColor==="rgb(229, 57, 53)","Check 3 Prompts: mic turns red the instant recording starts");
        finish();
      },30);
    }
    function finish(){
      console.log("\n=== "+pass+" passed, "+fail+" failed ===");
      process.exit(fail?1:0);
    }
  },30);
},300);
