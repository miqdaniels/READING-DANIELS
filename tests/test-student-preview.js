const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8').replace('<script src="clips.js" defer></script>','<script>'+fs.readFileSync('./clips.js','utf8')+'</script>');

/* Student View preview (Sept 28 2026): a one-tap "what does the student see
   for THIS exact item" peek from a teacher recorder/directions/word card --
   navigates to the real student screen, patches it to one specific item
   with the screen's own real paint functions (never a mockup/copy), shows
   a distinct banner, and returns exactly to the originating teacher screen
   on Back. Never starts a camera/mic, never saves anything. */
const dom=new JSDOM(html,{url:"https://miqdaniels.github.io/READING-DANIELS/?teacher",runScripts:"dangerously",pretendToBeVisual:true,
  beforeParse(w){
    w.HTMLElement.prototype.scrollIntoView=function(){}; w.scrollTo=function(){};
    class FakeRec{
      constructor(s,opts){ this.state="inactive"; this.mimeType=(opts&&opts.mimeType)||"video/webm"; }
      start(){ this.state="recording"; if(this.onstart){ this.onstart(); } if(this.ondataavailable){ this.ondataavailable({data:{size:12,type:this.mimeType}}); } }
      stop(){ this.state="inactive"; if(this.onstop){ this.onstop(); } }
    }
    w.MediaRecorder=FakeRec;
    w.URL.createObjectURL=function(){ return "blob:x"; };
    w.URL.revokeObjectURL=function(){};
    w.__gumCalls=0;
    Object.defineProperty(w.navigator,'mediaDevices',{value:{getUserMedia:function(){
      w.__gumCalls++;
      return Promise.resolve({ getTracks:function(){ return [{stop:function(){}}]; } });
    }}, configurable:true});
  }
});
const w=dom.window, d=w.document;
function activeId(){ var s=d.getElementsByClassName("screen"); for(var i=0;i<s.length;i++) if(/active/.test(s[i].className)) return s[i].id; return null; }
function click(el){ el.dispatchEvent(new w.Event("click",{bubbles:true})); }
function q(sel){ return d.querySelector(sel); }
function hasClass(el,cls){ return (" "+el.className+" ").indexOf(" "+cls+" ")>-1; }

setTimeout(function(){
  let pass=0,fail=0;
  function ck(c,m){ if(c){pass++;} else {fail++; console.log("FAIL:",m);} }

  /* ---- Check 3 prompt card: exact worked example ("at") ---- */
  w.go("s-teachC3");
  ck(activeId()==="s-teachC3","Check 3 prompts screen opens");
  var cards=d.querySelectorAll("#c3t-prompt-list .card"), atCard=null, i;
  for(i=0;i<cards.length;i++){ if(/“at”/.test(cards[i].textContent)){ atCard=cards[i]; } }
  ck(!!atCard,"the '“at”' prompt card is present");
  var pvBtn=null, btns=atCard.querySelectorAll(".mini-btn"), b;
  for(b=0;b<btns.length;b++){ if(/Student View/.test(btns[b].textContent)){ pvBtn=btns[b]; } }
  ck(!!pvBtn,"the 'at' card has a Student View button");
  click(pvBtn);
  ck(activeId()==="check3","tapping Student View opens the REAL check3 screen");
  ck(d.getElementById("preview-banner").style.display==="flex","the preview banner shows");
  ck(d.getElementById("c3-setup").style.display==="none" && d.getElementById("c3-assess").style.display==="block","setup/camera UI is skipped -- straight to the assess UI");
  ck(d.getElementById("c3-progress").textContent==="Item 1 of 5","shows the correct item (3C's 1st scored item -- 'at')");
  ck(d.getElementById("c3-current").textContent.indexOf("at")===-1,"the target word 'at' is never shown as text -- audio-only listening indicator");
  ck(w.__gumCalls===0,"no camera/mic permission was ever requested during preview");
  ck(!!w.C3_ITEMS[w.c3Idx] && w.C3_ITEMS[w.c3Idx].word==="at","the underlying item index really is 'at'");

  var backBtn=q("#preview-banner .vas-exit");
  ck(!!backBtn && /Back to teacher/.test(backBtn.textContent),"a Back to teacher button is offered");
  click(backBtn);
  ck(activeId()==="s-teachC3","Back returns exactly to the screen the teacher was on");
  ck(d.getElementById("preview-banner").style.display==="none","the banner hides again");

  /* ---- Check 2 prompt card ---- */
  w.go("s-teachC2");
  var idx=w.c2ItemIndexForPromptKey("c2_short_a");
  ck(idx>-1,"c2 item index resolves for a real promptKey");
  w.c2PreviewItem(idx);
  ck(activeId()==="check2","Check 2 preview opens the real check2 screen");
  ck(d.getElementById("c2-current").textContent==="a","shows the correct letter (short A)");
  ck(w.__gumCalls===0,"still no camera/mic request");
  w.exitPreview();
  ck(activeId()==="s-teachC2","Check 2 preview returns to s-teachC2");

  /* ---- Directions card: a transition screen (not just a default state) ---- */
  w.go("s-teachDir");
  var dirCards=d.querySelectorAll("#dirt-list .card"), d3d=null;
  for(i=0;i<dirCards.length;i++){ if(/before 3D/.test(dirCards[i].textContent)){ d3d=dirCards[i]; } }
  ck(!!d3d,"the before-3D directions card is present");
  var dirBtn=null, dbtns=d3d.querySelectorAll(".mini-btn");
  for(b=0;b<dbtns.length;b++){ if(/Student View/.test(dbtns[b].textContent)){ dirBtn=dbtns[b]; } }
  ck(!!dirBtn,"the before-3D card has a Student View button");
  click(dirBtn);
  ck(activeId()==="check3","directions preview opens check3");
  ck(d.getElementById("c3-transition").style.display==="block","shows the actual before-3D transition screen, not just the default setup state");
  ck(d.getElementById("c3-trans-text").textContent==="Listen to the word. Say every sound you hear.","exact transition text shown");
  w.exitPreview();
  ck(activeId()==="s-teachDir","returns to s-teachDir");

  /* ---- Word recorder row ---- */
  w.go("s-teach");
  var wordIdx=3; // an arbitrary real word, not necessarily first in its group
  w.wordPreview(wordIdx);
  ck(activeId()==="s-read","word preview opens the real Word Practice reading screen");
  ck(w.rIndex===wordIdx,"lands on the exact word tapped, not just its group's first word");
  ck(d.getElementById("read-who").textContent==="Test Student","READER falls back to Test Student so the screen has a name to show");
  w.exitPreview();
  ck(activeId()==="s-teach","returns to s-teach");
  ck(w.READER===null || w.READER===undefined,"READER is restored to whatever it was before preview (null, since no real student was picked)");

  /* ---- regression: every existing screen still opens ---- */
  w.CURGROUP=w.GROUPS[0]; w.CURCLASS=w.CLASSES[0];
  var existingScreens=["s-home","s-pick","s-roster","studentMenu","diagLanding","check1","check1Preview","check1Teach",
    "check2","s-teachC2","check2Teach","check3","s-teachC3","check3Teach","s-teachDir","s-groups","s-final","s-score",
    "s-board","s-teach","s-settings","s-status","fluencyPassage","fluencyRetell","s-fluteach"];
  var allOk=true, m;
  for(m=0;m<existingScreens.length;m++){
    w.go(existingScreens[m]);
    if(activeId()!==existingScreens[m]){ allOk=false; console.log("FAIL: screen did not open: "+existingScreens[m]); }
  }
  ck(allOk,"every existing screen still opens");

  console.log("\n=== "+pass+" passed, "+fail+" failed ===");
  process.exit(fail?1:0);
},400);
