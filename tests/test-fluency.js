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
    var micBlocked=false;
    w.__setMicBlocked=function(v){ micBlocked=v; };
    Object.defineProperty(w.navigator,'mediaDevices',{value:{getUserMedia:function(){
      if(micBlocked){ var e=new Error("blocked"); e.name="NotAllowedError"; return Promise.reject(e); }
      return Promise.resolve({getTracks:function(){return [{stop:function(){}}];}});
    }},configurable:true});

    /* Minimal fake IndexedDB -- jsdom does not implement one, and the real
       app's AudioStore/FluencyStore both need a working put/get/getAllKeys
       to be exercised honestly (not skipped) in tests. */
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
function click(el){ el.dispatchEvent(new w.Event("click",{bubbles:true})); }

/* Separate fresh page for the mic-blocked path: the app caches the granted
   mediaStream for reuse across every recording feature (by design, so a
   student isn't re-prompted for mic access every screen), so "blocked" can
   only be observed truthfully on a page's very first recording attempt. */
const dom2=new JSDOM(html,{url:"https://miqdaniels.github.io/READING-DANIELS/",runScripts:"dangerously",pretendToBeVisual:true,
  beforeParse(w2){
    w2.HTMLElement.prototype.scrollIntoView=function(){};
    w2.scrollTo=function(){};
    Object.defineProperty(w2.navigator,'mediaDevices',{value:{getUserMedia:function(){
      var e=new Error("blocked"); e.name="NotAllowedError"; return Promise.reject(e);
    }},configurable:true});
  }
});
const w2=dom2.window, d2=w2.document;

let micPassTotal=0, micFailTotal=0;
setTimeout(function(){
  let micPass=0, micFail=0;
  function mck(c,m){ if(c){micPass++;} else {micFail++; console.log("FAIL:",m);} }
  w2.CURCLASS=w2.CLASSES[0]; w2.READER=w2.CLASSES[0].students[2];
  w2.fluOpen();
  mck(w2.document.getElementById("fluencyPassage").className==="screen active","(mic test) fluOpen reaches fluencyPassage");
  w2.fluToggleRec();
  setTimeout(function(){
    var st=w2.document.getElementById("flu-state");
    mck(/Microphone is blocked/.test(st.textContent),"friendly mic-blocked message shown on first attempt");
    console.log("(mic-blocked sub-check) "+micPass+" passed, "+micFail+" failed");
    micPassTotal=micPass; micFailTotal=micFail;
    runMain();
  },60);
},400);

function runMain(){
  let pass=0,fail=0;
  function ck(c,m){ if(c){pass++;} else {fail++; console.log("FAIL:",m);} }

  /* ---- every existing screen still opens ---- */
  var existingScreens=["s-home","s-pick","s-roster","studentMenu","s-groups","s-final","s-score","s-board","s-teach","s-settings","s-status"];
  w.CURCLASS=w.CLASSES[0]; w.READER=w.CLASSES[0].students[0]; w.CURGROUP=w.GROUPS[0];
  var i;
  for(i=0;i<existingScreens.length;i++){
    w.go(existingScreens[i]);
    ck(activeId()===existingScreens[i], "existing screen opens: "+existingScreens[i]);
  }

  /* ---- data structure ---- */
  ck(w.LEVELS[0]==="PK","LEVELS starts with PK");
  ck(w.PASSAGES.length===5,"5 PK passages built ("+w.PASSAGES.length+")");
  var p00=w.findPassage("PK",0);
  ck(!!p00 && p00.title==="Phones at School","findPassage PK 0.0 title");
  ck(p00.label==="PK 0.0","label format PK 0.0");
  ck(p00.totalWords===168,"PK 0.0 total words 168 (got "+p00.totalWords+")");
  ck(w.findPassage("K",0)===null,"K level not built yet (honest gap)");

  /* ---- fluOpen defaults a fresh student to PK 0.0 ---- */
  w.READER=w.CLASSES[0].students[1];
  w.go("studentMenu");

  /* navGuard() ignores a click within 400ms of that go() (a real fix for
     rapid mistaken taps drilling through screens) -- wait past it, same as
     a real person would, before tapping the menu's Fluency button. */
  setTimeout(function(){
  var fluBtn=null, btns=d.querySelectorAll("#studentMenu .btn");
  for(i=0;i<btns.length;i++){ if(/^Fluency/.test(btns[i].textContent)) fluBtn=btns[i]; }
  ck(!!fluBtn,"Fluency button present on studentMenu");
  click(fluBtn);
  ck(activeId()==="fluencyPassage","Fluency opens fluencyPassage");
  ck(d.getElementById("flu-level").textContent==="PK 0.0","fresh student placed at PK 0.0");
  ck(d.getElementById("flu-title").textContent==="Phones at School","passage title shown");
  ck(/My phone is in my bag/.test(d.getElementById("flu-text").textContent),"passage text shown");
  ck(!/Words read|WCPM/.test(d.getElementById("flu-text").textContent),"no vocab/word-count clutter on passage screen");

  /* ---- record + submit on fluencyPassage ---- */
  w.fluToggleRec();
  setTimeout(function(){
    ck(w.recording===true,"recording started");
    w.fluToggleRec(); // stop
    ck(w.fluBlob!==null,"fluency blob captured");
    ck(activeId()==="fluencyPassage","still on passage screen before submit");

    w.fluSubmit();

    // fluSubmit -> FluencyStore.put is async (IndexedDB round trip); give it a tick
    setTimeout(function(){
      ck(activeId()==="fluencyRetell","Submit moves to fluencyRetell");
      ck(d.getElementById("fluencyPassage").className==="screen","passage screen fully inactive");

      var retLevel=d.getElementById("ret-level").textContent;
      ck(retLevel.indexOf("PK 0.0")===0,"retell header shows level (got '"+retLevel+"')");
      ck(/Tell about Phones at School\. You have 1 minute\./.test(d.getElementById("ret-prompt").textContent),"retell prompt names title + time limit");
      var frameLis=d.querySelectorAll("#ret-frames li");
      ck(frameLis.length===3,"3 sentence frames listed");
      ck(frameLis[0].textContent==="This is about ___.","frame text matches data");
      ck(!/My phone is in my bag/.test(d.getElementById("fluencyRetell").textContent),"passage text NOT visible on retell screen itself");

      var attemptId=w.fluAttemptId;
      ck(!!attemptId,"attempt id created");
      var attempt=w.FluAttempts.get(attemptId);
      ck(!!attempt && attempt.studentId===w.READER.id,"attempt recorded for student");
      ck(attempt.retellSaved===false,"retell not yet saved before submit");

      /* ---- record + submit retell ---- */
      ck(d.getElementById("ret-submit").disabled===true,"retell submit disabled before recording");
      w.retToggleRec();
      setTimeout(function(){
        w.retToggleRec(); // stop
        ck(w.retBlob!==null,"retell blob captured");
        ck(d.getElementById("ret-submit").disabled===false,"retell submit enabled after recording");
        w.retSubmit();

        setTimeout(function(){
          ck(activeId()==="studentMenu","retell submit returns to student's menu (studentMenu)");
          var savedAttempt=w.FluAttempts.get(attemptId);
          ck(savedAttempt.retellSaved===true,"retell save flag persisted");

          setTimeout(function(){
            /* ---- teacher review screen ---- */
            w.go("s-fluteach");
            ck(activeId()==="s-fluteach","teacher review screen opens");
            var studentBtns=d.querySelectorAll("#flut-roster .btn");
            ck(studentBtns.length===w.CLASSES[0].students.length,"roster lists all students in class");
            var targetBtn=null;
            for(i=0;i<studentBtns.length;i++){ if(studentBtns[i].textContent.indexOf(w.READER.name)===0) targetBtn=studentBtns[i]; }
            ck(!!targetBtn,"reviewed student appears in roster");
            click(targetBtn);
            var cards=d.querySelectorAll("#flut-body .card");
            ck(cards.length>=1,"attempt card rendered");
            ck(/Fluency recording/.test(cards[0].textContent) && /Retell recording/.test(cards[0].textContent),"both recordings listed");

            w.flutSetField(attemptId,"wordsRead",100);
            w.flutSetField(attemptId,"errors",5);
            var recomputed=w.FluAttempts.get(attemptId);
            ck(recomputed.wordsRead===100 && recomputed.errors===5,"teacher fields saved");
            var comp=w.flutCompute(recomputed);
            ck(comp.wcpm===95,"WCPM = words read - errors (95)");
            ck(comp.acc===95,"Accuracy = right/read*100 (95%)");
            ck(w.flutRecommend(comp.acc)==="Ready to move up","95% recommends move up");
            ck(w.flutRecommend(92)==="Repeat level","92% recommends repeat");
            ck(w.flutRecommend(80)==="Too hard","80% recommends too hard");

            var beforePlace=w.FluPlace.get(w.READER.id);
            ck(beforePlace.level==="PK" && beforePlace.sub===0,"placement still PK 0.0 before decision");
            w.flutMove(attemptId,"repeat");
            var afterPlace=w.FluPlace.get(w.READER.id);
            ck(afterPlace.level==="PK" && afterPlace.sub===1,"repeat decision advances to next PK passage (0.1)");

            w.flutMove(attemptId,"up");
            var afterUp=w.FluPlace.get(w.READER.id);
            ck(afterUp.level==="K" && afterUp.sub===0,"move up lands on .0 of next level");

            console.log("\n=== "+(pass+micPassTotal)+" passed, "+(fail+micFailTotal)+" failed ===");
            process.exit((fail+micFailTotal)?1:0);
          },60);
        },60);
      },60);
    },60);
  },60);
  },460);
}
