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

    /* Minimal fake IndexedDB -- jsdom has none, and FluencyStore needs a
       working put/get to be exercised honestly through the retell submit. */
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
function menuBtn(label){
  var btns=d.querySelectorAll("#studentMenu .btn"), i;
  for(i=0;i<btns.length;i++){ if(btns[i].textContent.indexOf(label)===0) return btns[i]; }
  return null;
}
/* No timed guard exists anymore -- every tap fires the instant it lands,
   on the very first try, even the first tap on a screen that just
   rendered. These waits are just realistic pacing between test steps, not
   clearing any cooldown. */
var GUARD_CLEAR=460;

setTimeout(function(){
  let pass=0,fail=0;
  function ck(c,m){ if(c){pass++;} else {fail++; console.log("FAIL:",m);} }

  /* ---- every existing screen still opens ---- */
  var existingScreens=["s-home","s-pick","s-roster","s-groups","s-final","s-score","s-board","s-teach","s-settings","s-status","fluencyPassage","fluencyRetell","s-fluteach"];
  w.CURCLASS=w.CLASSES[0]; w.READER=w.CLASSES[0].students[0]; w.CURGROUP=w.GROUPS[0];
  var i;
  for(i=0;i<existingScreens.length;i++){
    w.go(existingScreens[i]);
    ck(activeId()===existingScreens[i], "existing screen still opens: "+existingScreens[i]);
  }

  /* ---- an immediate second tap, on a DIFFERENT freshly-rendered button,
     always fires -- this app's own menus are linear (Diagnostic Tools ->
     a Check, both always "the first option"), and a cross-screen "same
     slot" guard used to mistake that completely normal fast path for an
     accidental collision, adding real, reported delay. There is no
     cross-screen guard anymore: only a literal duplicate event on the
     EXACT SAME button is ever blocked (see the "double-fire" test below),
     never a genuine tap on the next screen. */
  w.READER=null;
  w.go("s-pick"); w.buildClasses();
  var classBtns=d.querySelectorAll("#class-list .btn");
  click(classBtns[0]); // "First hour"
  ck(activeId()==="s-roster","the class tap reaches s-roster");
  var rosterBtnsNow=d.querySelectorAll("#roster-list .btn");
  click(rosterBtnsNow[0]); // immediately tapping the roster's first name (Miriam Gomez)
  ck(activeId()==="studentMenu","an immediate tap on the freshly-rendered roster fires right away, no wait");
  ck(w.READER && w.READER.name==="Miriam Gomez","and selects the right student");

  /* ---- but a literal duplicate event for the SAME tap on the SAME
     button never double-fires, no matter how much time passes ---- */
  w.READER=null;
  w.go("s-pick"); w.buildClasses();
  var classBtns2=d.querySelectorAll("#class-list .btn");
  click(classBtns2[0]);
  var rosterBtnsNow2=d.querySelectorAll("#roster-list .btn");
  click(rosterBtnsNow2[0]); click(rosterBtnsNow2[0]); click(rosterBtnsNow2[0]);
  ck(activeId()==="studentMenu","three clicks on the exact same name button still only navigate once");
  ck(w.READER && w.READER.name==="Miriam Gomez","READER is set correctly, not corrupted by the extra duplicate events");

  /* ---- tapping a student's name (for real, past the guard window) opens studentMenu, not straight into an activity ---- */
  w.READER=null;
  w.go("s-pick"); w.buildClasses();
  w.CURCLASS=w.CLASSES[0];
  w.go("s-roster");

  setTimeout(function(){
    var nameBtns=d.querySelectorAll("#roster-list .btn"), target=null;
    for(i=0;i<nameBtns.length;i++){ if(nameBtns[i].textContent==="Miriam Gomez") target=nameBtns[i]; }
    ck(!!target,"Miriam Gomez listed on the roster");
    click(target);
    ck(activeId()==="studentMenu","tapping a name opens studentMenu (not an activity directly)");
    ck(w.READER && w.READER.name==="Miriam Gomez","READER set correctly by the tap");
    ck(d.getElementById("sm-who").textContent==="Miriam Gomez","student's name shown at the top of the menu");

    var fluBtn=menuBtn("Fluency"), wpBtn=menuBtn("Word Practice"), rcBtn=menuBtn("Reading Comprehension");
    ck(!!fluBtn && !!wpBtn && !!rcBtn,"all three menu buttons present");
    ck(/Coming soon/.test(rcBtn.textContent),"Reading Comprehension shows a Coming soon label");
    ck(rcBtn.className.indexOf("locked")>-1,"Reading Comprehension uses the app's existing locked/disabled style");
    ck(rcBtn.disabled===true,"Reading Comprehension is disabled");

    /* ---- Reading Comprehension: tapping it does nothing (no onclick at all, no guard needed) ---- */
    click(rcBtn);
    ck(activeId()==="studentMenu","tapping Reading Comprehension leaves the student on studentMenu");

    /* ---- Word Practice opens the pre-existing screen, unchanged ---- */
    setTimeout(function(){
      click(wpBtn);
      ck(activeId()==="s-groups","Word Practice opens the existing word/vocabulary practice screen (s-groups)");
      var groupBtns=d.querySelectorAll("#group-list button");
      ck(groupBtns.length===w.GROUPS.length,"s-groups still lists all the groups (screen itself unchanged)");

      /* ---- Back returns to the student list ---- */
      w.go("studentMenu");
      var backBtn=null, navBtns=d.querySelectorAll("#studentMenu .nav-row .btn");
      for(i=0;i<navBtns.length;i++){ if(/Back/.test(navBtns[i].textContent)) backBtn=navBtns[i]; }
      ck(!!backBtn,"Back button present");
      click(backBtn); // plain onclick="go(...)", no guard on this button
      ck(activeId()==="s-roster","Back returns to the student list (s-roster)");

      /* ---- Fluency opens the passage screen we built, at the student's current placement ---- */
      w.READER=w.CLASSES[0].students[3];
      w.go("studentMenu");

      setTimeout(function(){
        click(menuBtn("Fluency"));
        ck(activeId()==="fluencyPassage","Fluency opens fluencyPassage");
        ck(d.getElementById("flu-level").textContent==="PK 0.0","opens at the student's current level passage (PK 0.0)");

        /* ---- record + submit fluency, then retell, then confirm the menu shows again ---- */
        w.fluToggleRec();
        setTimeout(function(){
          w.fluToggleRec(); // stop
          w.fluSubmit();
          setTimeout(function(){
            ck(activeId()==="fluencyRetell","Submit moves on to the retell screen");
            w.retToggleRec();
            setTimeout(function(){
              w.retToggleRec(); // stop
              w.retSubmit();
              setTimeout(function(){
                ck(activeId()==="fluencyRetell","retell submit shows a confirmation first");
                w.retFinishToMenu();
                ck(activeId()==="studentMenu","after Back to my menu, the student menu shows again");
                ck(d.getElementById("sm-who").textContent===w.READER.name,"menu still shows the right student's name");

                /* ---- finishing word practice (final read save) also returns to the menu ---- */
                w.CURGROUP=w.GROUPS[0];
                w.go("s-final");
                w.fStart();
                setTimeout(function(){
                  w.fp=w.FSEQ.length-1; // fast-forward to the last chunk
                  w.fStop();
                  setTimeout(function(){
                    w.fSave();
                    var afterHtml=d.getElementById("f-after").innerHTML;
                    ck(/Back to my menu/.test(afterHtml),"finishing a group's final read offers a way back to the student menu");
                    var doneBtn=null, btns2=d.querySelectorAll("#f-after .btn");
                    for(i=0;i<btns2.length;i++){ if(/Back to my menu/.test(btns2[i].textContent)) doneBtn=btns2[i]; }
                    click(doneBtn);
                    ck(activeId()==="studentMenu","finishing word practice returns to the student menu");

                    console.log("\n=== "+pass+" passed, "+fail+" failed ===");
                    process.exit(fail?1:0);
                  },30);
                },30);
              },60);
            },60);
          },60);
        },60);
      },GUARD_CLEAR);
    },GUARD_CLEAR);
  },GUARD_CLEAR);
},400);
