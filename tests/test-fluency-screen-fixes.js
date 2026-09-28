const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8').replace('<script src="clips.js" defer></script>','<script>'+fs.readFileSync('./clips.js','utf8')+'</script>');

/* FLUENCY SCREEN FIXES.
   1. No scrolling: fluFitPassageText() auto-shrinks the passage font
      down to (never below) 18px based on real available space, and caps
      the passage box's own height so only IT scrolls if it still can't
      fit -- never the whole page. jsdom has no real layout engine, so
      the "real available space" side of this is exercised here by
      stubbing getBoundingClientRect/scrollHeight/innerHeight the way a
      real browser's numbers would come back, rather than trying to
      measure an actual rendered page.
   2. Buttons: Record/Play back/Save are three identical rounded squares
      (Fluency AND Retell), true red/blue/green -- no brown anywhere.
   3. Fluency is locked on the student menu until BOTH diagnostic checks
      (Check 1 and Check 2 -- the only two the app has) are done.
   NOT built this round (explicitly stopped on, per the task's own
   instructions -- see the chat reply, not tested here as if it existed):
   removing PK passages and opening Fluency at a diagnostics-derived
   placement. All existing passages are PK-level and there is no
   diagnostic-to-placement mapping in the app to hook into. */
function makeDom(innerHeight,fastForward){
  return new JSDOM(html,{url:"https://miqdaniels.github.io/READING-DANIELS/",runScripts:"dangerously",pretendToBeVisual:true,
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
      if(innerHeight){ Object.defineProperty(w,'innerHeight',{value:innerHeight,configurable:true}); }

      /* minimal fake IndexedDB -- FluencyStore's Save needs a working one */
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
      if(fastForward){
        /* same fast-forwarded interval pattern as test-fluency-cycle.js:
           chains real setTimeout(fn,0) calls instead of waiting real
           wall-clock time, so a 1-minute countdown resolves instantly */
        w.setInterval=function(fn){
          var h={stopped:false};
          function tick(){ if(h.stopped){ return; } fn(); if(!h.stopped){ setTimeout(tick,0); } }
          setTimeout(tick,0);
          return h;
        };
        w.clearInterval=function(h){ if(h){ h.stopped=true; } };
      }
    }
  });
}
function activeId(d){ var s=d.getElementsByClassName("screen"); for(var i=0;i<s.length;i++) if(/active/.test(s[i].className)) return s[i].id; return null; }
function click(w,el){ el.dispatchEvent(new w.Event("click",{bubbles:true})); }

setTimeout(function(){
  let pass=0,fail=0;
  function ck(c,m){ if(c){pass++;} else {fail++; console.log("FAIL:",m);} }

  /* ================= 1) NO SCROLLING / auto-fit ================= */
  var dom=makeDom(700); // a short, Lenovo-ish window
  var w=dom.window, d=w.document;
  w.READER=w.CLASSES[0].students[0]; w.CURCLASS=w.CLASSES[0];
  w.fluOpen();
  ck(activeId(d)==="fluencyPassage","Fluency opens");

  var wrap=d.getElementById("flu-text-wrap"), el=d.getElementById("flu-text");
  ck(!!wrap && !!el,"the passage has its own fit-wrapper");

  /* stub real-browser layout numbers: passage box starts 300px down the
     page, and the text itself would naturally need 900px of height at
     the normal (23px) font size -- far more than a 700px-tall window
     leaves room for, so the fit function has real work to do */
  wrap.getBoundingClientRect=function(){ return {top:300,left:0,right:400,bottom:300,width:400,height:0}; };
  var fakeScrollHeight=900;
  Object.defineProperty(el,'scrollHeight',{get:function(){
    // proportional to font-size, like real wrapped text roughly is
    var fs=parseInt(el.style.fontSize,10)||23;
    return Math.round(fakeScrollHeight*(fs/23));
  },configurable:true});

  w.fluFitPassageText();
  var fontPx=parseInt(el.style.fontSize,10);
  ck(fontPx<23,"the font actually shrank from its normal size to fit (got "+fontPx+"px)");
  ck(fontPx>=18,"...but never below the 18px floor (got "+fontPx+"px)");
  ck(wrap.style.maxHeight!=="" ,"the passage box gets a max-height so it can't push the buttons off-screen");
  ck(wrap.style.overflowY==="auto","...and only the passage box itself scrolls when it's still too tall at 18px, not the whole page");

  /* a roomy window needs no shrinking at all */
  var dom2=makeDom(1400);
  var w2=dom2.window, d2=w2.document;
  w2.READER=w2.CLASSES[0].students[0]; w2.CURCLASS=w2.CLASSES[0];
  w2.fluOpen();
  var wrap2=d2.getElementById("flu-text-wrap"), el2=d2.getElementById("flu-text");
  wrap2.getBoundingClientRect=function(){ return {top:200,left:0,right:400,bottom:200,width:400,height:0}; };
  Object.defineProperty(el2,'scrollHeight',{get:function(){ return 300; },configurable:true}); // easily fits
  w2.fluFitPassageText();
  ck(parseInt(el2.style.fontSize,10)===23,"on a roomy window, the passage stays at its normal size (got "+el2.style.fontSize+")");
  ck(wrap2.style.overflowY==="visible","...and doesn't need its own scrollbar");

  /* ================= 2) BUTTONS: identical squares, true red, no brown ================= */
  var recBtn=d.getElementById("flu-rec"), playBtn=d.getElementById("flu-play"), saveBtn=d.getElementById("flu-save");
  ck(!!recBtn && !!playBtn && !!saveBtn,"Record, Play back, and Save all exist in one row");
  var recCss=w.getComputedStyle(recBtn), playCss=w.getComputedStyle(playBtn), saveCss=w.getComputedStyle(saveBtn);
  ck(recCss.width===playCss.width && playCss.width===saveCss.width,"all three buttons are the exact same width (got "+recCss.width+"/"+playCss.width+"/"+saveCss.width+")");
  ck(recCss.height===playCss.height && playCss.height===saveCss.height,"...and the exact same height");
  ck(recCss.borderRadius===playCss.borderRadius && playCss.borderRadius===saveCss.borderRadius,"...and the same rounded-square corners");
  var recMic=w.getComputedStyle(d.querySelector("#flu-rec .mic-ico")); ck(recMic.backgroundColor==="rgb(229, 57, 53)","Record is the one red-circle mic (got "+recMic.backgroundColor+")");
  ck(recCss.backgroundColor!=="rgb(180, 83, 9)","...and is NOT the old brown (--retry)");
  ck(playCss.backgroundColor!=="rgb(180, 83, 9)" && saveCss.backgroundColor!=="rgb(180, 83, 9)","no brown on Play back or Save either");
  ck(!/\.flu-sq-record\{[^}]*var\(--retry\)/.test(html) && !/\.flu-sq-play\{[^}]*var\(--retry\)/.test(html) && !/\.flu-sq-save\{[^}]*var\(--retry\)/.test(html),"none of the three buttons' CSS references the brown --retry color at all");
  ck(saveBtn.disabled===true && playBtn.disabled===true,"Play back and Save start grayed out (disabled) until a recording exists");

  /* checked with a real word-boundary, not a plain substring -- "record"
     itself contains the letters "rec", so a naive indexOf("rec") would
     pass even on the un-pulsing base class */
  function hasClass(el,cls){ return (" "+el.className+" ").indexOf(" "+cls+" ")>-1; }

  w.fluToggleRec(); // starts the mic (async -- getUserMedia is a Promise)
  setTimeout(function(){
    ck(hasClass(recBtn,"rec"),"Record pulses (the .rec class is on) while recording");
    w.fluToggleRec(); // Done -- manual early finish, no flash
    ck(playBtn.disabled===false && saveBtn.disabled===false,"Play back and Save become tappable once the recording is done");

    /* ---- Time's up: at 1:00 the SAME red square stops pulsing and
       flashes 3 times with "Time's up!" -- not a separate button ---- */
    var dom3=makeDom(1400,true);
    var w3=dom3.window, d3=w3.document;
    w3.READER=w3.CLASSES[0].students[1]; w3.CURCLASS=w3.CLASSES[0];
    w3.fluOpen();
    var rec3=d3.getElementById("flu-rec"), done3=d3.getElementById("flu-done");
    w3.fluToggleRec();
    setTimeout(function(){ // let the mic-start promise resolve before the timer even begins
    setTimeout(function(){ // the fast-forwarded 60 ticks run out on their own
    ck(rec3.style.display==="none" && done3.style.display==="inline-flex","at 1:00, the same slot swaps to the flashing element (not a 4th button)");
    ck(done3.className.indexOf("flu-sq-record")>-1,"...still the identical red square class");
    ck(done3.className.indexOf("flash")>-1,"...now flashing");
    ck(done3.querySelector(".icon-label").textContent==="Time's up!",'...labeled "Time\'s up!"');
    setTimeout(function(){ // the ~1.2s flash finishes
      ck(d3.getElementById("flu-state").textContent==="Great job! Tap Save.","after the flash, the review screen shows");
      ck(!/\.flu-sq-record\.flash\{[^}]*var\(--retry\)/.test(html) && !/fluSqFlash\{[^}]*var\(--retry\)/.test(html),"the flash animation doesn't use the brown --retry color either");

      /* ================= Retell: same three squares ================= */
      var wR=w, dR=d; // reuse the first dom -- it's mid-Fluency-review, tap Save then Next
      wR.fluSubmit();
      setTimeout(function(){
        var nb=dR.querySelector("#flu-after .icon-btn-next");
        click(wR,nb);
        var retRec=dR.getElementById("ret-rec"), retPlay=dR.getElementById("ret-play"), retSave=dR.getElementById("ret-submit");
        ck(!!retRec && !!retPlay && !!retSave,"Retell also has all three buttons");
        var rRec=wR.getComputedStyle(retRec), rPlay=wR.getComputedStyle(retPlay), rSave=wR.getComputedStyle(retSave);
        ck(rRec.width===rPlay.width && rPlay.width===rSave.width,"Retell's three buttons are the same size as each other");
        ck(rRec.width===recCss.width,"...and the SAME size as Fluency's (one shared button system)");
        ck(w.getComputedStyle(d.querySelector("#ret-rec .mic-ico")).backgroundColor==="rgb(229, 57, 53)","Retell's Record is the same red-circle mic");
        ck(retPlay.disabled===true && retSave.disabled===true,"Retell's Play back/Save start disabled too");

        /* ================= 3) LOCK FLUENCY UNTIL DIAGNOSTICS DONE ================= */
        runLockTest();
      },30);
    },1300);
    },250);
    },60);
  },30);

  function runLockTest(){
    var dom4=makeDom();
    var w4=dom4.window, d4=w4.document;
    w4.READER=w4.CLASSES[0].students[2]; w4.CURCLASS=w4.CLASSES[0];
    w4.go("studentMenu");
    var fluBtn=d4.getElementById("sm-flu-btn");
    ck(fluBtn.className.indexOf("locked")>-1,"Fluency is grayed out on the menu before any checks are done");
    click(w4,fluBtn);
    ck(activeId(d4)==="studentMenu","tapping the locked Fluency tile does NOT open Fluency");
    ck(d4.getElementById("sm-flu-lock-msg").textContent==="Finish your check first.",'...and shows "Finish your check first."');

    w4.ckMarkDone("check1");
    w4.go("studentMenu"); // repaint
    ck(d4.getElementById("sm-flu-btn").className.indexOf("locked")>-1,"still locked with only Check 1 done");
    click(w4,d4.getElementById("sm-flu-btn"));
    ck(activeId(d4)==="studentMenu","...still blocked");

    w4.ckMarkDone("check2");
    w4.go("studentMenu"); // repaint
    ck(d4.getElementById("sm-flu-btn").className.indexOf("locked")===-1,"unlocked once BOTH Check 1 and Check 2 are done");
    click(w4,d4.getElementById("sm-flu-btn"));
    ck(activeId(d4)==="fluencyPassage","tapping it now opens Fluency");
    ck(d4.getElementById("sm-flu-lock-msg").style.display==="none","the lock message is hidden once unlocked");

    console.log("\n=== "+pass+" passed, "+fail+" failed ===");
    process.exit(fail?1:0);
  }
},400);
