const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8').replace('<script src="clips.js" defer></script>','<script>'+fs.readFileSync('./clips.js','utf8')+'</script>');

/* Teacher prompt-recorder mic icon: the Muted mic is a thin ink-soft
   outline while idle, and turns a soft red (#c0392b, pulsing ring) the
   instant recording actually starts, back to plain ink-soft gray once
   it stops -- confirmed by Mick 2026-09-30 ("when it's recording, I do
   like it to turn red. And then it can go back to gray"), correcting
   the earlier 2026-09-29 "stays gray always" STYLE LOCK entry -- on the
   real s-teachC2/s-teachC3 prompt-recorder screens (using the app's own
   c2tToggle/c3tToggle, not just a CSS-source regex check). */
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
  ok(w.getComputedStyle(dot).backgroundColor==="rgba(0, 0, 0, 0)" || w.getComputedStyle(dot).backgroundColor==="transparent","mic is a transparent outline before recording starts");

  w.c2tToggle(key);
  setTimeout(function(){
    ok(recBtn.className==="rec-btn rec","the button picks up the .rec class once recording actually starts");
    var bg=w.getComputedStyle(dot).backgroundColor;
    ok(bg==="rgba(0, 0, 0, 0)" || bg==="transparent","mic's own fill stays transparent while recording (the ring is border/glyph color, not a fill)");
    var border=w.getComputedStyle(dot).borderColor;
    ok(border==="rgb(192, 57, 43)","mic ring turns the approved soft red #c0392b once recording starts (got "+border+")");

    w.c2tToggle(key);
    var borderAfter=w.getComputedStyle(dot).borderColor;
    ok(borderAfter!=="rgb(192, 57, 43)","mic ring goes back to plain gray once recording stops (got "+borderAfter+")");

    w.c3tToggle ? testC3() : finish();

    function testC3(){
      w.go("s-teachC3");
      var key3=w.C3_PROMPT_DEFS[0].promptKey;
      var recBtn3=d.getElementById("c3t-rec-"+key3);
      var dot3=recBtn3.querySelector(".rec-dot");
      ok(w.getComputedStyle(dot3).backgroundColor==="rgba(0, 0, 0, 0)" || w.getComputedStyle(dot3).backgroundColor==="transparent","Check 3 Prompts: mic is a transparent outline before recording starts");
      w.c3tToggle(key3);
      setTimeout(function(){
        ok(recBtn3.className==="rec-btn rec","Check 3 Prompts: button picks up .rec once recording starts");
        var border3=w.getComputedStyle(dot3).borderColor;
        ok(border3==="rgb(192, 57, 43)","Check 3 Prompts: mic ring turns soft red once recording starts (got "+border3+")");
        finish();
      },30);
    }
    function finish(){
      console.log("\n=== "+pass+" passed, "+fail+" failed ===");
      process.exit(fail?1:0);
    }
  },30);
},300);
