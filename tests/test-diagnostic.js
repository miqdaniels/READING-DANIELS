const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8');

const dom=new JSDOM(html,{url:"https://miqdaniels.github.io/READING-DANIELS/",runScripts:"dangerously",pretendToBeVisual:true,
  beforeParse(w){
    w.HTMLElement.prototype.scrollIntoView=function(){};
    w.scrollTo=function(){};
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

setTimeout(function(){
  let pass=0,fail=0;
  function ck(c,m){ if(c){pass++;} else {fail++; console.log("FAIL:",m);} }

  /* ---- every existing screen still opens ---- */
  var existingScreens=["s-home","s-pick","s-roster","studentMenu","s-groups","s-final","s-score","s-board","s-teach","s-settings","s-status","fluencyPassage","fluencyRetell","s-fluteach"];
  w.CURCLASS=w.CLASSES[0]; w.READER=w.CLASSES[0].students[0]; w.CURGROUP=w.GROUPS[0];
  var i;
  for(i=0;i<existingScreens.length;i++){
    w.go(existingScreens[i]);
    ck(activeId()===existingScreens[i], "existing screen still opens: "+existingScreens[i]);
  }

  /* ---- Check 1 letter data matches the spec exactly ---- */
  ck(w.C1_UPPER.length===26,"26 uppercase letters ("+w.C1_UPPER.length+")");
  ck(w.C1_LOWER.length===26,"26 lowercase letters ("+w.C1_LOWER.length+")");
  ck(w.C1_UPPER.join(" ")==="M T A S P R F B L C H N D G W E K J U V Y I Q O X Z","uppercase sequence matches spec exactly");
  ck(w.C1_LOWER.join(" ")==="s m a t r p c f n h b l d e g i w k u y j v o q x z","lowercase sequence matches spec exactly");
  var upSet={}, lowSet={}, dupU=false, dupL=false;
  for(i=0;i<26;i++){ if(upSet[w.C1_UPPER[i]]){ dupU=true; } upSet[w.C1_UPPER[i]]=1; if(lowSet[w.C1_LOWER[i]]){ dupL=true; } lowSet[w.C1_LOWER[i]]=1; }
  ck(!dupU,"no duplicate uppercase letters");
  ck(!dupL,"no duplicate lowercase letters");

  /* ---- navigation shell: studentMenu -> Diagnostic Tools -> Check 1 preview ---- */
  w.go("studentMenu");
  var diagBtn=menuBtn("#studentMenu","Diagnostic Tools");
  ck(!!diagBtn,"Diagnostic Tools button present on studentMenu");

  setTimeout(function(){ // clear navGuard's window from the go("studentMenu") above
    click(diagBtn);
    ck(activeId()==="diagLanding","Diagnostic Tools opens diagLanding");

    var c1Btn=menuBtn("#diagLanding","Check 1");
    ck(!!c1Btn,"Check 1 button present on diagLanding");
    ck(c1Btn.disabled!==true,"Check 1 is enabled (approved for build)");
    var c2Btn=menuBtn("#diagLanding","Check 2");
    ck(!!c2Btn && c2Btn.disabled===true,"Check 2 is disabled (content not finalized yet)");
    var c3Btn=menuBtn("#diagLanding","Check 3");
    ck(!!c3Btn && c3Btn.disabled===true,"Check 3 is disabled (content not finalized yet)");
    ['Check 4','Check 5','Check 6','Check 7'].forEach(function(label){
      var b=menuBtn("#diagLanding",label);
      ck(!!b && b.disabled===true,label+" is disabled (architecture only, not finalized)");
    });

    setTimeout(function(){
      click(c1Btn);
      ck(activeId()==="check1","Check 1 opens the real assessment screen");

      /* ---- the standalone font-legibility preview screen still renders correctly (no longer button-reachable, kept for reference) ---- */
      w.go("check1Preview");
      var upperCells=d.querySelectorAll("#c1-upper .c1-cell");
      var lowerCells=d.querySelectorAll("#c1-lower .c1-cell");
      ck(upperCells.length===26,"26 uppercase cells rendered");
      ck(lowerCells.length===26,"26 lowercase cells rendered");
      ck(upperCells[0].textContent==="M" && upperCells[25].textContent==="Z","uppercase grid follows the fixed order (first M, last Z)");
      ck(lowerCells[0].textContent==="s" && lowerCells[25].textContent==="z","lowercase grid follows the fixed order (first s, last z)");
      var fontFamily=w.getComputedStyle(upperCells[0]).fontFamily||"";
      ck(fontFamily.toLowerCase().indexOf("andika")>-1,"Check 1 stimuli use the Andika assessment font (got '"+fontFamily+"')");

      /* ---- Back navigation ---- */
      w.go("diagLanding");
      var back2=menuBtn("#diagLanding","← Back");
      click(back2);
      ck(activeId()==="studentMenu","Back from diagLanding returns to studentMenu");

      console.log("\n=== "+pass+" passed, "+fail+" failed ===");
      process.exit(fail?1:0);
    },460);
  },460);
},400);
