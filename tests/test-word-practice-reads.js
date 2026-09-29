const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8').replace('<script src="clips.js" defer></script>','<script>'+fs.readFileSync('./clips.js','utf8')+'</script>');

/* Word Practice (Bridges Unit 1) -- Mick, 2026-09-30: replaces the old
   "N identical whole-sentence practice reads" (a Settings toggle, 1-3,
   now removed) with a FIXED 3-read progression before the recording
   read, each stage a different slider granularity so a student's focus
   narrows from word, to Fry-style phrase chunk, to the whole sentence:
     Read 1 -- one small slider under EACH WORD
     Read 2 -- one slider under each phrase chunk (reuses FCHUNKS, the
               same phrase groups the chunked final read already uses)
     Read 3 -- the original single slider across the WHOLE sentence
   Record is untouched. */
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
  }
});
const w=dom.window, d=w.document;
function activeId(){ var s=d.getElementsByClassName("screen"); for(var i=0;i<s.length;i++) if(/active/.test(s[i].className)) return s[i].id; return null; }
function click(el){ el.dispatchEvent(new w.Event("click",{bubbles:true})); }
function q(sel){ return d.querySelector(sel); }

setTimeout(function(){
  let pass=0,fail=0;
  function ck(c,m){ if(c){pass++;} else {fail++; console.log("FAIL:",m);} }

  /* ---- the old Settings control is gone (it no longer means anything) ---- */
  w.go("s-settings");
  ck(!q("#seg-reads"),"the old 'Practice reads before recording' control no longer exists in Settings");
  ck(typeof w.Settings.reads!=="function","Settings.reads() is removed (nothing reads it anymore)");
  ck(typeof w.Settings.setReads!=="function","Settings.setReads() is removed");
  ck(typeof w.setReads!=="function","the global setReads() wrapper is removed");

  /* ---- fixed stage list, no more Settings-driven count ---- */
  ck(JSON.stringify(w.buildStages())==='["listen","read1","read2","read3","record"]',
    "buildStages() always returns the fixed 5-stage list (got "+JSON.stringify(w.buildStages())+")");

  /* ---- start Word Practice on Personal Narrative 1, word 1 (imperative) ---- */
  w.CURCLASS=w.CLASSES[0]; w.READER=w.CLASSES[0].students[0];
  w.CURGROUP=w.GROUPS[0]; // Personal Narrative 1: imperative, horrendous, insecurity, "my jaw dropped to the floor", sporting
  w.rStart();
  ck(activeId()==="s-read","Word Practice opens");
  ck(w.rStages[w.rStage]==="listen","starts on the listen stage");

  w.rAdvance();
  ck(w.rStages[w.rStage]==="read1","advances to read1");
  var wordSegs=d.querySelectorAll("#read-body .mini-seg-row-words .mini-seg-text");
  ck(wordSegs.length===w.TN,"read1 shows exactly one mini-slider per word (got "+wordSegs.length+", TN="+w.TN+")");
  ck(wordSegs[0].textContent===w.TOK[0].text,"the first word segment's text matches the first token (got '"+wordSegs[0].textContent+"')");
  ck(!!q("#r1-pacer-0"),"the first word has its own slider track");
  ck(q("#r1-pacer-0").className.indexOf("mini-done")===-1,"a word's slider starts NOT done");

  /* ---- dragging a word's own slider to the end marks only THAT word done ---- */
  w.rMiniApply("r1",0,1);
  ck(q("#r1-text-0").className.indexOf("mini-done")>-1,"word 0 is marked done after its slider reaches the end");
  ck(q("#r1-pacer-0").className.indexOf("mini-done")>-1,"word 0's track also shows the done state");
  ck(q("#r1-text-1").className.indexOf("mini-done")===-1,"word 1 is NOT marked done just because word 0 was (each word's slider is independent)");
  w.rMiniApply("r1",1,0.5);
  ck(q("#r1-text-1").className.indexOf("active")>-1 && q("#r1-text-1").className.indexOf("mini-done")===-1,
    "a word mid-drag (ratio 0.5) shows the active state, not done yet");

  /* ---- read2: one slider per Fry-style phrase chunk, reusing the real FCHUNKS data ---- */
  w.rAdvance();
  ck(w.rStages[w.rStage]==="read2","advances to read2");
  var expectedChunks=w.FCHUNKS["imperative"];
  ck(Array.isArray(expectedChunks) && expectedChunks.length>1,"the item bank actually has real FCHUNKS data for this word to test against");
  var chunkSegs=d.querySelectorAll("#read-body .mini-seg-row-chunks .mini-seg-text");
  ck(chunkSegs.length===expectedChunks.length,"read2 shows exactly one mini-slider per phrase chunk (got "+chunkSegs.length+", expected "+expectedChunks.length+")");
  ck(chunkSegs[0].textContent===expectedChunks[0],"the first chunk segment's text matches FCHUNKS exactly (got '"+chunkSegs[0].textContent+"')");
  ck(chunkSegs[0].textContent+" "+chunkSegs[1].textContent+" "+chunkSegs[2].textContent==="It was imperative for me to make a good impression on my first day.",
    "the chunks rejoin to the exact original sentence, same guarantee FCHUNKS already had for the final read");
  w.rMiniApply("r2",0,1);
  ck(q("#r2-text-0").className.indexOf("mini-done")>-1,"a chunk slider can be marked done the same way a word slider can");

  /* ---- read3: the ORIGINAL whole-sentence slider, completely unchanged ---- */
  w.rAdvance();
  ck(w.rStages[w.rStage]==="read3","advances to read3");
  ck(!!q("#pacer") && !!q("#pfill") && !!q("#knob"),"read3 uses the same #pacer/#pfill/#knob the whole-sentence slider always used");
  ck(!q("#read-body .mini-seg-row"),"read3 has no per-word or per-chunk mini-sliders -- just the one whole-sentence slider");
  ck(q("#read-body .sentence").textContent.indexOf("imperative")>-1,"the full sentence is still shown for read3");

  /* ---- record: completely untouched by any of this ---- */
  w.rAdvance();
  ck(w.rStages[w.rStage]==="record","advances to record");
  ck(!!q("#r-rec") && !!q("#r-play"),"the Record/Play back controls are still exactly where they were");

  /* ---- moving to the NEXT word resets everything fresh -- no bleed-through
     from the previous word's done-slider state ---- */
  w.rNextSentence();
  ck(w.rStages[w.rStage]==="listen","a new word starts back on listen");
  w.rAdvance();
  ck(w.rStages[w.rStage]==="read1","...then read1 again, for the new word");
  ck(q("#r1-text-0").className.indexOf("mini-done")===-1,"the new word's first slider starts fresh, not done (no leak from the previous word)");
  ck(q("#r1-text-0").textContent===w.TOK[0].text,"the new word's own tokens are shown, not the old word's");

  /* ---- the full flow through to the chunked final read still works ---- */
  w.rPrevSentence(); // back to word 1 to finish the group quickly
  w.rEnterSentence();
  var steps=0;
  while(w.gPos<w.GIDXS.length-1 && steps<40){
    while(w.rStages[w.rStage]!=="record" && steps<40){ w.rAdvance(); steps++; }
    w.rNextSentence();
    steps++;
  }
  while(w.rStages[w.rStage]!=="record" && steps<50){ w.rAdvance(); steps++; }
  ck(w.rStages[w.rStage]==="record","walked all the way to record on the last word of the group");
  w.rToFinal();
  ck(activeId()==="s-final","Final read screen opens after the last word's record stage, same as before");

  /* ---- every existing screen still opens (regression protection) ---- */
  var existingScreens=["s-home","s-pick","s-roster","studentMenu","diagLanding","check1","check2","check3","check4","check5",
    "s-groups","s-final","s-score","s-board","s-teach","s-settings","s-status","s-read"];
  var allOk=true, m;
  for(m=0;m<existingScreens.length;m++){
    w.go(existingScreens[m]);
    if(activeId()!==existingScreens[m]){ allOk=false; console.log("FAIL: screen did not open: "+existingScreens[m]); }
  }
  ck(allOk,"every existing screen still opens");

  console.log("\n=== "+pass+" passed, "+fail+" failed ===");
  process.exit(fail?1:0);
},400);
