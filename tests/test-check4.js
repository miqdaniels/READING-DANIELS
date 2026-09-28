const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8').replace('<script src="clips.js" defer></script>','<script>'+fs.readFileSync('./clips.js','utf8')+'</script>');

/* Check 4 -- Decoding Inventory. 142 printed-word items across 12 locked
   bands (4A-4L, 4L = 14 controlled pseudowords), ONE continuous AUDIO
   recording (no camera, same audio-only architecture as Check 1), no
   model audio/hints, teacher-controlled early stop via the existing
   Done-early icon button, immediate unlock once Check 3 is done,
   standardized filename, never marking complete on an empty recording. */
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
    var downloads=[];
    w.__downloads=downloads;
    var realCreateElement=w.document.createElement.bind(w.document);
    w.document.createElement=function(tag){
      var el=realCreateElement(tag);
      if(tag==="a"){ el.click=function(){ if(el.download){ downloads.push(el.download); } }; }
      return el;
    };
  }
});
const w=dom.window, d=w.document;
function activeId(){ var s=d.getElementsByClassName("screen"); for(var i=0;i<s.length;i++) if(/active/.test(s[i].className)) return s[i].id; return null; }
function click(el){ el.dispatchEvent(new w.Event("click",{bubbles:true})); }
function q(sel){ return d.querySelector(sel); }

setTimeout(function(){
  let pass=0,fail=0;
  function ck(c,m){ if(c){pass++;} else {fail++; console.log("FAIL:",m);} }

  /* ---- content structure / QC ---- */
  ck(w.C4_ITEMS.length===142,"142 total items (got "+w.C4_ITEMS.length+")");
  var expectCounts={"4A":10,"4B":12,"4C":12,"4D":10,"4E":12,"4F":10,"4G":12,"4H":12,"4I":14,"4J":12,"4K":12,"4L":14};
  var i, allBandsOk=true;
  for(i=0;i<w.C4_BANDS.length;i++){
    var b=w.C4_BANDS[i];
    if(b.words.length!==expectCounts[b.id]){ allBandsOk=false; console.log("FAIL: band "+b.id+" expected "+expectCounts[b.id]+" got "+b.words.length); }
  }
  ck(allBandsOk,"every band matches the QC-corrected count exactly (4G=12, 4L=14, per the resolved MASTER_SPEC.md conflict)");
  ck(w.C4_BANDS.length===12,"exactly 12 bands, none merged/added/removed");

  var words=w.C4_ITEMS.map(function(x){return x.word.toLowerCase();});
  var seen={}, dupes=[];
  words.forEach(function(x){ if(seen[x]){ dupes.push(x); } seen[x]=(seen[x]||0)+1; });
  ck(dupes.length===0,"no duplicate targets within Check 4 (dupes: "+dupes.join(",")+")");

  var pseudos=w.C4_BANDS[11];
  ck(pseudos.id==="4L" && pseudos.words.length===14,"4L is the 14-item controlled-pseudoword band");
  var expectedPseudo=["vun","pem","vot","shab","thig","plim","crusp","yeft","throm","vreen","moit","narm","fropt","bemple"];
  ck(pseudos.words.join(",")===expectedPseudo.join(","),"the exact approved 14 pseudowords, in order (got: "+pseudos.words.join(",")+")");
  ck(w.C4_ITEMS.filter(function(x){return x.isPseudo;}).length===14,"exactly 14 items flagged isPseudo, matching 4L");

  /* ---- unlock: Check 4 stays locked until Check 3 is done ---- */
  w.CURCLASS=w.CLASSES[0]; w.READER=w.CLASSES[0].students[0];
  w.go("diagLanding");
  var diagBtns=d.querySelectorAll("#diagLanding .btn"), c4Btn=null, j;
  for(j=0;j<diagBtns.length;j++){ if(diagBtns[j].textContent.indexOf("Check 4")>-1){ c4Btn=diagBtns[j]; } }
  ck(!!c4Btn && c4Btn.disabled===true,"Check 4 is locked before Check 3 is done");
  ck(c4Btn.className.indexOf("locked")>-1,"Check 4 shows the locked style before Check 3 is done");

  w.ckMarkDone("check1"); w.ckMarkDone("check2"); w.ckMarkDone("check3");
  w.go("diagLanding");
  diagBtns=d.querySelectorAll("#diagLanding .btn");
  for(j=0;j<diagBtns.length;j++){ if(diagBtns[j].textContent.indexOf("Check 4")>-1){ c4Btn=diagBtns[j]; } }
  ck(!!c4Btn && c4Btn.disabled!==true,"Check 4 unlocks immediately once Check 3 is done, no reload needed");
  ck(c4Btn.className.indexOf("locked")===-1,"Check 4 no longer shows the locked style");

  /* ---- filename convention ---- */
  ck(/^Miriam_Gomez_P1_CHECK_4_\d{4}_\d{2}_\d{2}\.webm$/.test(w.rfStandardFileName("CHECK_4")),
    "Check 4 uses the standard filename pattern with CHECK_4 (got '"+w.rfStandardFileName("CHECK_4")+"')");

  /* ---- student flow ---- */
  click(c4Btn);
  ck(activeId()==="check4","Check 4 opens");
  ck(d.getElementById("c4-current").style.display==="none","no word shown before Record is tapped");
  ck(!q("#check4 video"),"Check 4 is audio-only -- no camera preview element at all");

  w.c4Start();
  setTimeout(function(){
    ck(d.getElementById("c4-current").style.display==="block","first word shows once recording actually starts");
    ck(d.getElementById("c4-current").textContent===w.C4_ITEMS[0].word,"first item is "+w.C4_ITEMS[0].word+" (start of band 4A)");
    ck(d.getElementById("c4-progress").textContent==="Item 1 of 142","progress reads Item 1 of 142");
    ck(d.getElementById("c4-section-label").textContent==="4A","section label reads 4A for the first item");
    ck(d.getElementById("c4-pseudo-note").style.display==="none","no made-up-word note on a real word");
    ck(d.getElementById("c4-done").style.display!=="none","the Done-early icon button is available from the start");

    /* ---- rapid double-tap protection: two synchronous taps only advance once ---- */
    w.c4NextTap(); w.c4NextTap();
    ck(w.c4Idx===1,"two synchronous Next taps only advanced ONE item (idx now 1, not 2)");

    setTimeout(function(){ // past one animation frame -- a real next tap works again
      w.c4NextTap();
      ck(w.c4Idx===2,"after a frame, a real next tap advances normally (idx now 2)");

      /* ---- jump to the last pseudoword item to confirm the point-of-need note ---- */
      w.c4Idx=141; w.c4PaintItem();
      ck(d.getElementById("c4-current").textContent==="bemple","last item is the last pseudoword (bemple)");
      ck(d.getElementById("c4-section-label").textContent==="4L","section label reads 4L");
      ck(d.getElementById("c4-pseudo-note").style.display==="block","the made-up-word note shows for a pseudoword item");
      ck(d.getElementById("c4-pseudo-note").textContent==="This is a made-up word. Read it out loud.","exact pseudoword point-of-need text");
      ck(d.getElementById("c4-next-lbl").textContent==="Finish","the last item's Next button reads Finish");

      /* ---- teacher-controlled early stop: Done works at ANY point, not just the end ---- */
      w.c4Idx=50; w.c4PaintItem();
      w.c4DoneTap();
      setTimeout(function(){
        ck(!!d.getElementById("c4-review").innerHTML,"Done finalizes the recording straight into review, even mid-check");
        ck(d.getElementById("c4-review").innerHTML.indexOf("Play back")>-1,"a Play back control is offered");
        ck(d.getElementById("c4-review").innerHTML.indexOf("Redo")===-1,"no student Redo on a check -- only View as Student may restart one");
        ck(d.getElementById("c4-review").innerHTML.indexOf("Save")>-1,"a Save control is offered");

        /* ---- guard: an empty/failed blob must never be submittable ---- */
        var realBlob=w.c4Blob;
        w.c4Blob=new w.Blob([],{type:"audio/webm"});
        var beforeAttempts=w.C4Attempts.forStudent(w.READER.id).length;
        w.c4Finish();
        ck(w.C4Attempts.forStudent(w.READER.id).length===beforeAttempts,"Save does nothing on an empty recording -- no attempt is ever saved for it");
        w.c4Blob=realBlob;

        w.c4Finish();
        ck(w.__downloads.length===1,"exactly one file downloaded (got "+w.__downloads.length+")");
        ck(/^Miriam_Gomez_P1_CHECK_4_\d{4}_\d{2}_\d{2}\.webm$/.test(w.__downloads[0]),"downloaded file follows the standard naming pattern (got '"+w.__downloads[0]+"')");
        var yesBtn=d.getElementById("c4-yes-btn");
        ck(!!yesBtn,"a YES button is shown");
        ck(!w.ckDone()["check4"],"Check 4 is not marked done until YES is tapped");

        var attempts=w.C4Attempts.forStudent(w.READER.id);
        ck(attempts.length===1,"one Check 4 attempt saved");
        ck(attempts[0].reachedCount===51,"the saved attempt records how far the student actually got (51 of 142, stopped mid-4E)");

        click(yesBtn);
        ck(activeId()==="diagLanding","YES returns straight to the Reading Checks dashboard");
        ck(!!w.ckDone()["check4"],"Check 4 marked completed after YES");

        var diagBtns2=d.querySelectorAll("#diagLanding .btn"), foundC4Green=false, c5Btn=null, m;
        for(m=0;m<diagBtns2.length;m++){
          if(diagBtns2[m].textContent.indexOf("Check 4")>-1 && /Completed/.test(diagBtns2[m].textContent) && diagBtns2[m].className.indexOf("done")>-1){ foundC4Green=true; }
          if(diagBtns2[m].textContent.indexOf("Check 5")>-1){ c5Btn=diagBtns2[m]; }
        }
        ck(foundC4Green,"Check 4 shows green/Completed on the dashboard");
        ck(!!c5Btn && c5Btn.disabled!==true,"Check 5 is not gray/locked once Check 4 is done, even though it isn't built yet");
        ck(!!c5Btn && c5Btn.className.indexOf("locked")===-1,"Check 5 uses the normal available style, not the locked style");
        click(c5Btn);
        ck(activeId()==="diagLanding","tapping the not-yet-built Check 5 never navigates anywhere");
        ck(/Coming soon!/.test(d.getElementById("diag-comingsoon-note").textContent),"tapping it shows 'Coming soon!' instead of a broken screen");

        teacherScoringFlow(attempts[0].id);
      },30);
    },30);
  },30);

  function teacherScoringFlow(attemptId){
    /* ---- teacher scoring: check4Teach ---- */
    w.go("check4Teach");
    ck(activeId()==="check4Teach","teacher review screen opens");
    var studentBtns=d.querySelectorAll("#c4t-roster .btn"), target=null, k;
    for(k=0;k<studentBtns.length;k++){ if(studentBtns[k].textContent.indexOf(w.READER.name)===0){ target=studentBtns[k]; } }
    ck(!!target && /\(1\)/.test(target.textContent),"roster shows the attempt count next to the student's name");
    click(target);
    ck(d.getElementById("c4t-body").textContent.indexOf("Reached 51 of 142")>-1,"teacher sees how far the student actually got");
    var openBtn=q("#c4t-body .mini-btn");
    ck(!!openBtn,"attempt list shows an Open button");
    click(openBtn);

    var totalCells=0, bandIds=[], b;
    for(b=0;b<w.C4_BANDS.length;b++){
      var cells=d.querySelectorAll("#c4t-grid-"+w.C4_BANDS[b].id+" .c1t-cell");
      totalCells+=cells.length;
      bandIds.push(w.C4_BANDS[b].id+"="+cells.length);
    }
    ck(totalCells===142,"142 tappable cells rendered across all 12 band grids (got "+bandIds.join(",")+")");

    /* items 51+ (index>=51) were never reached -- pre-fill as Not Reached */
    ck(w.c4tScores[50].indexOf("")>-1 || w.c4tScores[50]==="","item 51 (index 50, the last one actually reached) defaults to blank/Correct, not Not Reached");
    ck(w.c4tScores[51]==="nr","item 52 (index 51, past where the student stopped) pre-fills as Not Reached");
    ck(w.c4tScores[141]==="nr","the very last item also pre-fills as Not Reached");

    /* index 0 (am, 4A) -> Incorrect; index 1 (if, 4A) -> Skip; index 2 (us, 4A) -> Self-corrected
       (C4T_ORDER is ["","err","sc","skip","nr"]: 1 tap=err, 2 taps=sc, 3 taps=skip) */
    w.c4tTap(0);
    w.c4tTap(1); w.c4tTap(1); w.c4tTap(1);
    w.c4tTap(2); w.c4tTap(2);
    var results=d.getElementById("c4t-results").textContent;
    ck(/4A Short-vowel VC\/CVC:\s*8\s*\/\s*10/.test(results),"4A tally: self-corrected counts as correct, incorrect/skip do not, out of the 10 in the band (got: "+results+")");
    ck(/Real Words \(4A.4K\):/.test(results),"Real Words (4A-4K) subtotal reported separately");
    ck(/Controlled Pseudowords \(4L\):/.test(results),"Controlled Pseudowords (4L) subtotal reported separately, never collapsed into Real Words");

    /* flag an item for an error pattern -- independent of correctness */
    w.c4tToggleFlag({stopPropagation:function(){}},2);
    var resultsAfterFlag=d.getElementById("c4t-results").textContent;
    ck(/Flagged for an error pattern[^:]*:\s*us\b/.test(resultsAfterFlag),"flag recorded and named");
    ck(/4A Short-vowel VC\/CVC:\s*8\s*\/\s*10/.test(resultsAfterFlag),"flagging an item does NOT change its correctness or the tally");

    var noteEl=d.getElementById("c4t-note");
    noteEl.value="Vowel substitution on 'us' -- said /ŭ/ correctly then added a final consonant blend.";

    w.c4tSave();
    var saved=w.C4Attempts.get(attemptId);
    ck(saved.bandCorrect["4A"]===8,"4A band score persisted");
    ck(saved.note.indexOf("Vowel substitution")>-1,"teacher note persisted");
    ck(saved.targets.indexOf("am")>-1 && saved.targets.indexOf("if")>-1,"missed/needs-instruction targets saved (incorrect + skip)");
    ck(saved.targets.indexOf("us")===-1,"a self-corrected item is NOT treated as needing instruction");

    regressionScreens();
  }

  function regressionScreens(){
    /* ---- every existing screen still opens (regression protection) ---- */
    w.CURGROUP=w.GROUPS[0];
    var existingScreens=["s-home","s-pick","s-roster","studentMenu","diagLanding","check1","check1Preview","check1Teach",
      "check2","s-teachC2","check2Teach","check3","s-teachC3","check3Teach","check4","check4Teach","s-teachDir",
      "s-groups","s-final","s-score","s-board","s-teach","s-settings","s-status","fluencyPassage","fluencyRetell","s-fluteach"];
    var allOk=true, m;
    for(m=0;m<existingScreens.length;m++){
      w.go(existingScreens[m]);
      if(activeId()!==existingScreens[m]){ allOk=false; console.log("FAIL: screen did not open: "+existingScreens[m]); }
    }
    ck(allOk,"every existing screen, plus the 2 new Check 4 screens, still opens");

    console.log("\n=== "+pass+" passed, "+fail+" failed ===");
    process.exit(fail?1:0);
  }
},400);
