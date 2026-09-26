const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8');

/* End-to-end: Student -> hour -> name -> Fluency -> passage -> retell ->
   save, confirming both the cold-read AND the retell each trigger a real
   file download with the right name. Also confirms the sentence frames
   are untouched and the unsaved-retell warning behaves correctly. */
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

    /* capture every triggered download */
    var downloads=[];
    w.__downloads=downloads;
    var realCreateElement=w.document.createElement.bind(w.document);
    w.document.createElement=function(tag){
      var el=realCreateElement(tag);
      if(tag==="a"){ el.click=function(){ if(el.download){ downloads.push(el.download); } }; }
      return el;
    };

    /* minimal fake IndexedDB, same as other fluency tests */
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
function menuBtn(scope,label){
  var btns=d.querySelectorAll(scope+" .btn"), i;
  for(i=0;i<btns.length;i++){ if(btns[i].textContent.indexOf(label)===0) return btns[i]; }
  return null;
}
/* FirstName_LastName_P#_FLUENCY_PK_0_0_COLDREAD/RETELL_YYYY_MM_DD.webm --
   the same standardized filename pattern used everywhere else (Fix 3). */
const FNAME_RE=/^[A-Za-z]+_[A-Za-z]+_P1_FLUENCY_PK_0_0_(COLDREAD|RETELL)_\d{4}_\d{2}_\d{2}\.webm$/;

setTimeout(function(){
  let pass=0,fail=0;
  function ck(c,m){ if(c){pass++;} else {fail++; console.log("FAIL:",m);} }

  /* ---- full path: student -> hour -> name -> Fluency -> passage ---- */
  w.go("s-pick"); w.buildClasses();
  var hourBtns=d.querySelectorAll("#class-list .btn");
  click(hourBtns[0]);
  ck(activeId()==="s-roster","hour tap reaches the roster");

  setTimeout(function(){
    var nameBtns=d.querySelectorAll("#roster-list .btn"), target=null, i;
    for(i=0;i<nameBtns.length;i++){ if(nameBtns[i].textContent===w.CLASSES[0].students[0].name) target=nameBtns[i]; }
    click(target);
    ck(activeId()==="studentMenu","name tap reaches the student menu");

    setTimeout(function(){
      click(menuBtn("#studentMenu","Fluency"));
      ck(activeId()==="fluencyPassage","Fluency opens the passage screen");
      ck(d.getElementById("flu-level").textContent==="PK 0.0","fresh student starts at PK 0.0");

      w.fluToggleRec();
      setTimeout(function(){
        w.fluToggleRec(); // stop
        w.fluSubmit();
        setTimeout(function(){
          /* ---- cold-read file saved ---- */
          ck(activeId()==="fluencyRetell","Submit moves on to the retell screen");
          ck(w.__downloads.length===1,"exactly one file downloaded for the cold read (got "+w.__downloads.length+")");
          ck(FNAME_RE.test(w.__downloads[0]) && /COLDREAD/.test(w.__downloads[0]),"cold-read file name follows FirstName_LastName_P#_FLUENCY_..._COLDREAD_date.webm (got '"+w.__downloads[0]+"')");

          /* ---- sentence frames untouched ---- */
          var frameLis=d.querySelectorAll("#ret-frames li");
          ck(frameLis.length===3 && frameLis[0].textContent==="This is about ___.","sentence frames are exactly as before");

          /* ---- unsaved-retell warning ---- */
          ck(w.window.onbeforeunload===null || w.window.onbeforeunload===undefined,"no unsaved-leave warning before any recording exists");

          w.retToggleRec();
          setTimeout(function(){
            w.retToggleRec(); // stop
            ck(typeof w.window.onbeforeunload==="function","an unsaved-leave warning is armed once a retell recording exists");
            var warnEvent={preventDefault:function(){}};
            var warnMsg=w.window.onbeforeunload(warnEvent);
            ck(!!warnMsg,"the warning handler actually returns a message (would prompt the browser's leave-confirm)");

            w.retSubmit();
            setTimeout(function(){
              /* ---- retell file saved + confirmation, not auto-navigated ---- */
              ck(activeId()==="fluencyRetell","still on the retell screen -- confirmation shown before leaving");
              ck(w.__downloads.length===2,"a second file downloaded for the retell (got "+w.__downloads.length+")");
              ck(FNAME_RE.test(w.__downloads[1]) && /RETELL/.test(w.__downloads[1]),"retell file name follows FirstName_LastName_P#_FLUENCY_..._RETELL_date.webm (got '"+w.__downloads[1]+"')");
              ck(/Your retell is saved! Now upload it to Canvas\./.test(d.getElementById("ret-state").textContent),"plain confirmation message shown");
              ck(/Upload/.test(d.getElementById("ret-state").innerHTML) && d.getElementById("ret-state").innerHTML.indexOf(">Record<")===-1,"Canvas steps say Upload, not Record");
              ck(w.window.onbeforeunload===null || w.window.onbeforeunload===undefined,"unsaved-leave warning is cleared once saved");
              ck(d.getElementById("ret-rec").style.display==="none" && d.getElementById("ret-submit").style.display==="none","recording controls are hidden once saved (can't resubmit/lose it)");

              click(menuBtn("#fluencyRetell","Back to my menu"));
              ck(activeId()==="studentMenu","Back to my menu returns to the student menu");

              console.log("\n=== "+pass+" passed, "+fail+" failed ===");
              process.exit(fail?1:0);
            },60);
          },60);
        },60);
      },60);
    },460);
  },460);
},400);
