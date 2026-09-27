const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8')
  .replace('<script src="clips.js" defer></script>','<script>'+fs.readFileSync('./clips.js','utf8')+'</script>');

/* FLUENCY -- 3-DAY CYCLE. Day 1: cold read (new passage, scored), one
   attempt, auto-stop at 1:00, no Pause, no Redo -- then Retell. Day 2:
   practice, same passage as Day 1, 3 reads in ONE continuous recording
   with "Read N of 3" labels and a short "Get ready" interstitial between
   them (recording never stops), Redo allowed, no Retell. Day 3: cold read
   on ANOTHER new passage, same rules as Day 1. File names carry the day.
   setInterval is fast-forwarded (real per-second ticks, no wall-clock
   wait) so a 1:00 countdown resolves instantly in the test; the ~1.2s
   "Time's up!" flash uses a real setTimeout and is waited out for real. */
function makeDom(){
  return new JSDOM(html,{url:"https://miqdaniels.github.io/READING-DANIELS/",runScripts:"dangerously",pretendToBeVisual:true,
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
      w.setInterval=function(fn){
        var h={stopped:false};
        function tick(){ if(h.stopped){ return; } fn(); if(!h.stopped){ setTimeout(tick,0); } }
        setTimeout(tick,0);
        return h;
      };
      w.clearInterval=function(h){ if(h){ h.stopped=true; } };

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
    }
  });
}
const dom=makeDom();
const w=dom.window, d=w.document;
function activeId(){ var s=d.getElementsByClassName("screen"); for(var i=0;i<s.length;i++) if(/active/.test(s[i].className)) return s[i].id; return null; }
function click(el){ el.dispatchEvent(new w.Event("click",{bubbles:true})); }

setTimeout(function(){
  let pass=0,fail=0;
  function ck(c,m){ if(c){pass++;} else {fail++; console.log("FAIL:",m);} }

  var stu=w.CLASSES[0].students[2];
  w.READER=stu; w.CURCLASS=w.CLASSES[0];

  /* ================= DAY 1 ================= */
  w.fluOpen();
  ck(activeId()==="fluencyPassage","Day 1: opens the passage screen");
  ck(w.fluDay===1,"Day 1: fluDay is 1");
  var day1Passage=w.fluPassage;
  ck(d.getElementById("flu-directions").textContent==="Read the passage out loud. You have one minute. The recording stops by itself.","Day 1: exact directions text");
  ck(d.getElementById("flu-read-label").style.display==="none","Day 1: no 'Read N of 3' label (single attempt)");

  w.fluToggleRec();
  setTimeout(function(){
    ck(w.recording===true,"Day 1: recording starts");
    /* let the fast-forwarded 60 ticks run out on their own -- no Done tap */
    setTimeout(function(){
      ck(w.recording===false,"Day 1: recording auto-stopped at 1:00, no tap needed");
      /* the ~1.2s "Time's up!" flash, then the review screen */
      setTimeout(function(){
        ck(d.getElementById("flu-state").textContent==="Great job! Tap Save.","Day 1: review text is exact");
        ck(d.getElementById("flu-redo").style.display==="none","Day 1: no Redo on the review screen");
        ck(!!d.querySelector("#flu-active .flu-sq-play"),"Day 1: Play back is offered");

        w.fluSubmit();
        setTimeout(function(){
          ck(activeId()==="fluencyPassage","Day 1: Save shows a confirmation before leaving the passage screen");
          ck(/Saved! Now upload it to Canvas\./.test(d.getElementById("flu-after").textContent),"Day 1: exact saved confirmation text");
          ck(/Day1-ColdRead/.test(w.__downloads[0]),"Day 1: file name includes Day1-ColdRead (got '"+w.__downloads[0]+"')");
          var nextBtn=d.querySelector("#flu-after .icon-btn-next");
          ck(!!nextBtn,"Day 1: a green Next arrow is offered");
          click(nextBtn);
          ck(activeId()==="fluencyRetell","Day 1: Next moves to Retell");

          w.retToggleRec();
          setTimeout(function(){
            w.retToggleRec();
            w.retSubmit();
            setTimeout(function(){
              w.retFinishToMenu();
              ck(activeId()==="studentMenu","Day 1: retell finish returns to the menu");

              var attempts=w.FluAttempts.forStudent(stu.id);
              ck(attempts.length===1,"Day 1: one attempt recorded");
              ck(attempts[0].day===1,"Day 1: attempt tagged day 1");
              ck(attempts[0].scored===true,"Day 1: auto-marked Score");

              runDay2();
            },30);
          },30);
        },30);
      },1300);
    },250);
  },60);

  function runDay2(){
    w.fluOpen();
    ck(activeId()==="fluencyPassage","Day 2: opens the passage screen");
    ck(w.fluDay===2,"Day 2: fluDay is 2");
    ck(w.fluPassage===day1Passage,"Day 2: reuses the exact same passage as Day 1");
    ck(d.getElementById("flu-directions").textContent==="Read the passage 3 times. Each read is one minute.","Day 2: exact directions text");
    ck(d.getElementById("flu-read-label").textContent==="Read 1 of 3","Day 2: starts on Read 1 of 3");

    w.fluToggleRec(); // starts the continuous 3-read recording (async: getUserMedia)
    /* End Read 1 with a manual Done tap, fired the moment the recorder
       exists but strictly BEFORE any fast-forwarded timer tick can run:
       a microtask (a plain resolved Promise .then) always drains fully
       before the next macrotask, even a zero-delay setTimeout, so this
       can never race the auto-stop. Read 2 and Read 3 below are instead
       left to run out naturally on the fake ticks, proving the
       auto-stop+flash path once real wall-clock time (the "Get ready"
       interstitial) is involved -- trying to time a manual interrupt
       against those same ticks with a real-time wait is what caused the
       original flaky race (the wait could land before OR after the
       ticks finished, unpredictably). */
    Promise.resolve().then(function(){
      ck(w.fluD2Rec && w.fluD2Rec.state==="recording","Day 2: the underlying recorder is running");
      ck(w.fluReadNum===1,"Day 2: still on Read 1 (no tick has had a chance to fire yet)");
      w.fluToggleRec(); // Done -- manual, early finish of Read 1
      ck(w.fluD2Rec && w.fluD2Rec.state==="recording","Day 2: Done on Read 1 doesn't stop the recorder, just that read");
      ck(d.getElementById("flu-getready").style.display==="block","Day 2: 'Get ready for Read 2' shows after the manual Done");
      ck(/Get ready for Read 2/.test(d.getElementById("flu-getready-text").textContent),"Day 2: names Read 2 next");

      setTimeout(function(){ // the real 2s "Get ready" interstitial clears
        ck(d.getElementById("flu-getready").style.display==="none","Day 2: interstitial clears on its own");
        ck(d.getElementById("flu-read-label").textContent==="Read 2 of 3","Day 2: now on Read 2 of 3");

        /* Read 2: let the fast-forwarded 60 ticks run out on their own --
           auto-stop -> flash -> "Get ready for Read 3" */
        setTimeout(function(){       // 250: Read 2's 60 fast-forwarded ticks
          setTimeout(function(){     // 1300: the "Time's up!" flash
            ck(d.getElementById("flu-getready").style.display==="block","Day 2: 'Get ready for Read 3' shows after Read 2 auto-stops");
            ck(/Get ready for Read 3/.test(d.getElementById("flu-getready-text").textContent),"Day 2: names Read 3 next");
            ck(w.fluD2Rec && w.fluD2Rec.state==="recording","Day 2: recording still hasn't stopped (one more read to go)");

            setTimeout(function(){ // the real 2s interstitial for Read 3
              ck(d.getElementById("flu-read-label").textContent==="Read 3 of 3","Day 2: now on Read 3 of 3");

              /* Read 3 auto-stops too -> flash -> this time the WHOLE
                 recording finally stops (it was the last of 3) -> review */
              setTimeout(function(){     // 250: Read 3's 60 fast-forwarded ticks
                setTimeout(function(){   // 1300: the "Time's up!" flash
                  ck(w.fluD2Rec===null,"Day 2: after Read 3, the recorder actually stops (one file)");
                  ck(d.getElementById("flu-state").textContent==="Great job! Tap Save.","Day 2: same review text");
                  ck(d.getElementById("flu-redo").style.display!=="none","Day 2: Redo IS offered");

                  w.fluSubmit();
                  setTimeout(function(){
                    ck(activeId()==="fluencyPassage","Day 2: Save shows a confirmation too");
                    ck(/Day2-Practice/.test(w.__downloads[2]),"Day 2: file name includes Day2-Practice (got '"+w.__downloads[2]+"')");
                    ck(!d.querySelector("#flu-after .icon-btn-next"),"Day 2: no Next-to-Retell button");
                    var backBtn=d.querySelector("#flu-after .btn.primary");
                    ck(!!backBtn && /Back to my menu/.test(backBtn.textContent),"Day 2: a Back to my menu button is offered instead");
                    click(backBtn);
                    ck(activeId()==="studentMenu","Day 2: back to menu returns there");

                    var attempts=w.FluAttempts.forStudent(stu.id);
                    ck(attempts.length===2,"Day 2: a second attempt recorded");
                    ck(attempts[1].day===2,"Day 2: attempt tagged day 2");
                    ck(attempts[1].scored===false,"Day 2: NOT auto-scored");

                    runDay3();
                  },30);
                },1300);
              },250);
            },2100);
          },1300);
        },250);
      },2100);
    });
  }

  function runDay3(){
    w.fluOpen();
    ck(w.fluDay===3,"Day 3: fluDay is 3");
    ck(w.fluPassage!==day1Passage,"Day 3: a DIFFERENT (new) passage than Day 1/2's");
    ck(d.getElementById("flu-directions").textContent==="Read the passage out loud. You have one minute. The recording stops by itself.","Day 3: same directions as Day 1");

    w.fluToggleRec();
    setTimeout(function(){
      setTimeout(function(){
        setTimeout(function(){
          w.fluSubmit();
          setTimeout(function(){
            ck(/Day3-ColdRead/.test(w.__downloads[3]),"Day 3: file name includes Day3-ColdRead (got '"+w.__downloads[3]+"')");
            var nextBtn=d.querySelector("#flu-after .icon-btn-next");
            click(nextBtn);
            w.retToggleRec();
            setTimeout(function(){
              w.retToggleRec();
              w.retSubmit();
              setTimeout(function(){
                w.retFinishToMenu();

                var attempts=w.FluAttempts.forStudent(stu.id);
                ck(attempts.length===3,"Day 3: a third attempt recorded");
                ck(attempts[2].day===3,"Day 3: attempt tagged day 3");
                ck(attempts[2].scored===false,"Day 3: NOT auto-scored (only Day 1 auto-scores)");
                ck(/Day3-ColdRead_RETELL/.test(w.__downloads[4]),"Day 3: retell file name includes the day too (got '"+w.__downloads[4]+"')");

                var cyc=w.FluCycle.get(stu.id);
                ck(cyc.day===1,"cycle wraps back to Day 1 after Day 3's retell is saved");

                runTeacherScoring();
              },30);
            },60);
          },30);
        },1300);
      },250);
    },60);
  }

  function runTeacherScoring(){
    w.go("s-fluteach");
    w.flutPick(0);
    var roster=d.querySelectorAll("#flut-roster .btn"), target=null, i;
    for(i=0;i<roster.length;i++){ if(roster[i].textContent.indexOf(stu.name)===0){ target=roster[i]; } }
    click(target);
    var cards=d.querySelectorAll("#flut-body .card");
    ck(cards.length===3,"teacher sees all 3 attempts");

    /* Day 1 (auto-scored): full scoring UI shows immediately */
    ck(/Day 1/.test(cards[0].textContent),"first card is Day 1");
    ck(/Completed/.test(cards[0].textContent) && !/not yet scored/.test(cards[0].textContent),"Day 1 shows Completed, already scored");
    ck(!!cards[0].querySelector("input"),"Day 1's scoring inputs are visible (it's already marked Score)");
    ck(/Unmark/.test(cards[0].textContent),"Day 1 offers Unmark (it's already scored)");

    /* Day 2 (not auto-scored): "Completed -- not yet scored", no inputs, has "Score this read" */
    ck(/Day 2/.test(cards[1].textContent),"second card is Day 2");
    ck(/not yet scored/.test(cards[1].textContent),"Day 2 shows not yet scored");
    ck(!cards[1].querySelector("input"),"Day 2 has no scoring inputs until marked");
    ck(/Score this read/.test(cards[1].textContent),"Day 2 offers Score this read");

    var day2Id=w.FluAttempts.forStudent(stu.id)[1].id;
    w.flutSetScored(day2Id,true);
    var cards2=d.querySelectorAll("#flut-body .card");
    ck(!!cards2[1].querySelector("input"),"after Score this read, Day 2's inputs appear");
    ck(/Unmark/.test(cards2[1].textContent),"Day 2 now offers Unmark");

    w.flutSetScored(day2Id,false);
    var cards3=d.querySelectorAll("#flut-body .card");
    ck(!cards3[1].querySelector("input"),"Unmark hides the inputs again");
    ck(/Score this read/.test(cards3[1].textContent),"Day 2 offers Score this read again after unmarking");

    console.log("\n=== "+pass+" passed, "+fail+" failed ===");
    process.exit(fail?1:0);
  }
},400);
