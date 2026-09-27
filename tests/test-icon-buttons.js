const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8')
  .replace('<script src="clips.js" defer></script>','<script>'+fs.readFileSync('./clips.js','utf8')+'</script>');

/* ICON BUTTONS: one icon + one short word, same icon/color everywhere,
   Record pulses while recording, and every Save still downloads the
   right file. Buttons at least 64px tall (90px for Record) is a CSS-only
   rule (icon-btn / icon-btn-record in <style>) and isn't measurable in
   jsdom (no real layout engine), so this file checks the structural and
   behavioral parts: the right classes/icons/labels are present, Record
   pulses, and downloads still fire correctly. */
const dom=new JSDOM(html,{url:"https://miqdaniels.github.io/READING-DANIELS/",runScripts:"dangerously",pretendToBeVisual:true,
  beforeParse(w){
    w.HTMLElement.prototype.scrollIntoView=function(){}; w.scrollTo=function(){};
    class FakeRec{
      constructor(s,opts){ this.state="inactive"; this.mimeType=(opts&&opts.mimeType)||"audio/webm"; this._s=s; }
      start(){ this.state="recording"; if(this.onstart) this.onstart(); if(this.ondataavailable) this.ondataavailable({data:{size:10,type:this.mimeType}}); }
      stop(){ this.state="inactive"; if(this.onstop) this.onstop(); }
    }
    w.MediaRecorder=FakeRec;
    w.URL.createObjectURL=function(){ return "blob:x"; };
    w.URL.revokeObjectURL=function(){};
    w.__downloads=[];
    var realCreateElement=w.document.createElement.bind(w.document);
    w.document.createElement=function(tag){
      var el=realCreateElement(tag);
      if(tag==="a"){ el.click=function(){ if(el.download){ w.__downloads.push(el.download); } }; }
      return el;
    };
    Object.defineProperty(w.navigator,'mediaDevices',{value:{getUserMedia:function(){
      return Promise.resolve({getTracks:function(){return [{stop:function(){}}];}});
    }}, configurable:true});

    /* Minimal fake IndexedDB -- jsdom has none, and FluencyStore (Fluency/
       Retell's Save) needs a working put/get to be exercised honestly. */
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

setTimeout(function(){
  let pass=0,fail=0;
  function ck(c,m){ if(c){pass++;} else {fail++; console.log("FAIL:",m);} }

  w.READER=w.CLASSES[0].students[0]; w.CURCLASS=w.CLASSES[0]; w.CURGROUP=w.GROUPS[0];

  /* ---- Check 1: Record pulses, Next is a green-arrow icon button ---- */
  w.go("check1");
  var c1rec=d.getElementById("c1-start");
  ck(c1rec.className.indexOf("icon-btn-record")>-1,"Check 1 Record is an icon-btn-record");
  ck(!!c1rec.querySelector(".icon-glyph") && !!c1rec.querySelector(".icon-label"),"Check 1 Record has an icon + a word");
  w.c1Start();
  setTimeout(function(){
    ck(c1rec.className.indexOf("rec")>-1,"Check 1 Record carries the pulsing 'rec' class once recording");
    ck(d.getElementById("c1-next").className.indexOf("icon-btn-next")>-1,"Check 1 Next is an icon-btn-next");

    var n=w.C1_ALL.length, i;
    for(i=0;i<n-1;i++){ w.c1Next(); }
    w.c1Next();
    ck(d.getElementById("c1-review").querySelector(".icon-btn-listen")!==null,"Check 1 review shows a Play back icon button");
    ck(d.getElementById("c1-review").querySelector(".icon-btn-save")!==null,"Check 1 review shows a Save icon button");
    w.c1Finish();
    ck(w.__downloads.length===1,"Check 1 Save downloaded exactly one file");
    ck(/CHECK_1/.test(w.__downloads[0]),"Check 1's downloaded file name is correct (got '"+w.__downloads[0]+"')");

    runFluency();
  },30);

  function runFluency(){
    w.go("fluencyPassage");
    var fRec=d.getElementById("flu-rec");
    ck(fRec.className.indexOf("flu-sq-record")>-1,"Fluency Record is a flu-sq-record (its own true-red rounded square, no brown)");
    w.fluToggleRec();
    setTimeout(function(){
      ck(fRec.className.indexOf("rec")>-1,"Fluency Record pulses while recording");
      ck(d.getElementById("flu-done").className.indexOf("flu-sq-record")>-1,"Fluency's Done state is the SAME red square, still visible while recording (no Pause)");
      w.fluToggleRec(); // Done
      ck(d.getElementById("flu-play").className.indexOf("flu-sq-play")>-1,"Fluency Play back is a flu-sq-play (matching rounded square)");
      w.fluSubmit();
      setTimeout(function(){
        ck(w.__downloads.length===2,"Fluency Save downloaded exactly one file (2 total so far)");
        ck(/FLUENCY/.test(w.__downloads[1]) && /Day1-ColdRead/.test(w.__downloads[1]),"Fluency's downloaded file name is correct (got '"+w.__downloads[1]+"')");
        var nextBtn=d.querySelector("#flu-after .icon-btn-next");
        ck(!!nextBtn && nextBtn.className.indexOf("icon-btn-next")>-1,"a Next icon button moves on to Retell");
        nextBtn.dispatchEvent(new w.Event("click",{bubbles:true}));
        runRetellAndFinal();
      },30);
    },30);
  }

  function runRetellAndFinal(){
    var retRec=d.getElementById("ret-rec");
    ck(retRec.className.indexOf("flu-sq-record")>-1,"Retell Record is a flu-sq-record too (same matching square as Fluency)");
    w.retToggleRec();
    setTimeout(function(){
      ck(retRec.className.indexOf("rec")>-1,"Retell Record pulses while recording");
      ck(d.getElementById("ret-done").className.indexOf("flu-sq-record")>-1,"Retell's Done state is the SAME red square, still visible while recording (no Pause)");
      w.retToggleRec(); // Done
      w.retSubmit();
      setTimeout(function(){
        ck(w.__downloads.length===3,"Retell Save downloaded exactly one file (3 total so far)");
        ck(/RETELL/.test(w.__downloads[2]),"Retell's downloaded file name is correct (got '"+w.__downloads[2]+"')");
        runWordPractice();
      },30);
    },30);
  }

  function runWordPractice(){
    w.go("s-final");
    w.fStart();
    setTimeout(function(){
      var startBtn=d.querySelector("#f-controls .icon-btn-record");
      ck(!startBtn,"once recording, the idle Record button is gone (controls swapped to Next/Done)");
      ck(!!d.querySelector("#f-controls .icon-btn-next") || !!d.querySelector("#f-controls .icon-btn-pause"),"Next (tap mode) or Pause (pacer mode) icon button shows while recording");
      ck(!!d.querySelector("#f-controls .icon-btn-done"),"a Done icon button is offered to end the take early");
      w.fp=w.FSEQ.length-1;
      w.fStop();
      setTimeout(function(){
        ck(!!d.querySelector("#f-after .icon-btn-listen"),"Word Practice final read offers a Play back icon button");
        ck(!!d.querySelector("#f-after .icon-btn-redo"),"Word Practice final read offers a Redo icon button (practice tool -- allowed)");
        ck(!!d.querySelector("#f-after .icon-btn-save"),"Word Practice final read offers a Save icon button");
        w.fSave();
        ck(w.__downloads.length===4,"Word Practice Save downloaded exactly one file (4 total so far)");

        console.log("\n=== "+pass+" passed, "+fail+" failed ===");
        process.exit(fail?1:0);
      },30);
    },30);
  }
},400);
