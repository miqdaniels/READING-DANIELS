const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8');

/* Regression test for "class-hour button needs several taps." Root cause
   was CSS: .btn had an unguarded :hover rule and no touch-action, which on
   touch browsers can make the FIRST tap only simulate :hover (some touch
   browsers treat a hoverable-looking element that way) -- the real click
   doesn't fire until a second tap. jsdom doesn't model that touch/hover
   quirk (a dispatched click always fires the handler once), so this test
   can't reproduce the CSS bug itself -- what it DOES prove is that the JS
   side has no separate bug of its own (duplicate handlers, a stale guard,
   a re-render race) that would need more than one click, run repeatedly
   to rule out anything intermittent. The CSS fix (see index.html <style>)
   is what actually fixes the real-device symptom. */
const dom=new JSDOM(html,{url:"https://miqdaniels.github.io/READING-DANIELS/",runScripts:"dangerously",pretendToBeVisual:true,
  beforeParse(w){
    w.HTMLElement.prototype.scrollIntoView=function(){};
    w.scrollTo=function(){};
  }
});
const w=dom.window, d=w.document;
function activeId(){ var s=d.getElementsByClassName("screen"); for(var i=0;i<s.length;i++) if(/active/.test(s[i].className)) return s[i].id; return null; }
function click(el){ el.dispatchEvent(new w.Event("click",{bubbles:true})); }

setTimeout(function(){
  let pass=0,fail=0,round=0;
  function ck(c,m){ if(c){pass++;} else {fail++; console.log("FAIL:",m);} }

  function runRound(){
    round++;
    w.go("s-pick");
    w.buildClasses();
    var classBtns=d.querySelectorAll("#class-list .btn");
    ck(classBtns.length===w.CLASSES.length,"round "+round+": all class-hour buttons rendered");
    var target=classBtns[round%classBtns.length];
    var label=target.textContent;
    click(target); // exactly ONE simulated click
    ck(activeId()==="s-roster","round "+round+": a single tap on '"+label+"' moved to the roster screen");
    ck(w.CURCLASS && w.CURCLASS.label===label,"round "+round+": the correct class hour was selected");

    if(round<10){
      setTimeout(runRound,460); // clear of navGuard's 400ms window, like a real next tap
    } else {
      console.log("\n=== "+pass+" passed, "+fail+" failed ===");
      process.exit(fail?1:0);
    }
  }
  runRound();
},400);
