const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8').replace('<script src="clips.js" defer></script>','<script>'+fs.readFileSync('./clips.js','utf8')+'</script>');

/* Teacher prompt-recorder mic icon (Mick, 2026-09-29 -- STYLE LOCK): the
   Muted mic stays the SAME thin ink-soft outline whether idle or
   actually recording -- no red, ever -- on the real s-teachC2/s-teachC3
   prompt-recorder screens (using the app's own c2tToggle/c3tToggle --
   not just a CSS-source regex check). */
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
    ok(bg!=="rgb(229, 57, 53)","mic does NOT turn red once recording starts (got "+bg+")");
    ok(bg==="rgba(0, 0, 0, 0)" || bg==="transparent","mic stays the same transparent outline while recording -- no color change at all");

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
        var bg3=w.getComputedStyle(dot3).backgroundColor;
        ok(bg3!=="rgb(229, 57, 53)","Check 3 Prompts: mic does NOT turn red once recording starts (got "+bg3+")");
        finish();
      },30);
    }
    function finish(){
      console.log("\n=== "+pass+" passed, "+fail+" failed ===");
      process.exit(fail?1:0);
    }
  },30);
},300);
