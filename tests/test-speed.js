const fs=require('fs');
const {JSDOM}=require('jsdom');

/* SPEED FIX. Root cause: all 150 recorded audio/video clips (base64) lived
   in ONE giant inline <script> statement inside index.html -- a single
   ~17MB line the browser's JS engine had to fully parse before ANY app
   code (including the class/name/menu screens) could run. On a fast
   machine that's still a multi-second block; on a school Chromebook it's
   worse, and it happens every time the page loads. Nothing was actually
   slow per-tap -- go()/buildClasses()/buildRoster() etc. were always
   fast -- the delay was the browser still finishing that one enormous
   parse, which just happened to land wherever the student's next tap was.

   Fix: the clips moved out to their own file (clips.js) loaded with
   <script defer>, so the browser can parse and start running the (now
   small) app script immediately -- the class-hour, name, and menu
   screens are tappable right away. clips.js keeps loading in the
   background; every read of window.BAKED_CLIPS was already null-safe, so
   audio just becomes available a moment later instead of blocking
   everything else.

   This test loads ONLY the small main file (no clips.js) -- the exact
   worst-case "clips.js hasn't finished loading yet" moment -- and proves
   navigation is fast regardless. */
const html=fs.readFileSync('./index.html','utf8');

function now(){ var t=process.hrtime(); return t[0]*1000+t[1]/1e6; }

var t0=now();
const dom=new JSDOM(html,{url:"https://miqdaniels.github.io/READING-DANIELS/",runScripts:"dangerously",pretendToBeVisual:true,
  beforeParse(w){ w.HTMLElement.prototype.scrollIntoView=function(){}; w.scrollTo=function(){}; }
});
var t1=now();
const parseMs=t1-t0;

const w=dom.window, d=w.document;
function click(el){ el.dispatchEvent(new w.Event("click",{bubbles:true})); }
function activeId(){ var s=d.getElementsByClassName("screen"); for(var i=0;i<s.length;i++) if(/active/.test(s[i].className)) return s[i].id; return null; }

setTimeout(function(){
  let pass=0,fail=0;
  function ck(c,m){ if(c){pass++;} else {fail++; console.log("FAIL:",m);} }

  console.log("index.html (no clips.js) parse+eval:", parseMs.toFixed(1)+"ms");
  ck(parseMs<2000,"the main app file alone parses in well under 2s (got "+parseMs.toFixed(1)+"ms) -- it no longer carries the 17MB of baked clips");
  ck(w.window.BAKED_CLIPS===undefined,"window.BAKED_CLIPS is not yet populated -- clips.js (deferred) hasn't run in this test, exactly like the first instant on a real page load");

  var a,b;

  a=now(); w.go("s-pick"); w.buildClasses(); b=now();
  var t_pickReady=b-a;

  var classBtns=d.querySelectorAll("#class-list .btn");
  a=now(); click(classBtns[0]); b=now();
  var t_classToRoster=b-a;
  ck(activeId()==="s-roster","class-hour tap reaches the roster");
  console.log("class hour -> names:", t_classToRoster.toFixed(2)+"ms");
  ck(t_classToRoster<500,"class hour -> names is under 500ms (got "+t_classToRoster.toFixed(2)+"ms)");

  var nameBtns=d.querySelectorAll("#roster-list .btn"), target=null, i;
  for(i=0;i<nameBtns.length;i++){ if(!nameBtns[i].disabled){ target=nameBtns[i]; break; } }
  a=now(); click(target); b=now();
  var t_rosterToConfirm=b-a;
  ck(activeId()==="s-confirm","name tap reaches the confirm screen");

  a=now(); click(d.getElementById("confirm-yes-btn")); b=now();
  var t_confirmToMenu=b-a;
  ck(activeId()==="studentMenu","Yes reaches the student menu");
  var t_nameToTools=t_rosterToConfirm+t_confirmToMenu;
  console.log("name -> reading tools (confirm + menu):", t_nameToTools.toFixed(2)+"ms");
  ck(t_nameToTools<500,"name -> reading tools is under 500ms (got "+t_nameToTools.toFixed(2)+"ms)");

  /* a few more screens, for good measure -- none of them should ever be slow */
  var screens=["s-groups","check1","check2","fluencyPassage","fluencyRetell","diagLanding","s-score","s-board"];
  var slowest=0, slowestId=null;
  for(i=0;i<screens.length;i++){
    a=now(); w.go(screens[i]); b=now();
    if(b-a>slowest){ slowest=b-a; slowestId=screens[i]; }
    ck(b-a<500,"go('"+screens[i]+"') is under 500ms (got "+(b-a).toFixed(2)+"ms)");
  }
  console.log("slowest of the rest:", slowestId, slowest.toFixed(2)+"ms");

  console.log("\n=== "+pass+" passed, "+fail+" failed ===");
  process.exit(fail?1:0);
},50);
