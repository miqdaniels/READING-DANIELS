const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8')
  .replace('<script src="clips.js" defer></script>','<script>'+fs.readFileSync('./clips.js','utf8')+'</script>');

/* SHORT DIRECTIONS: no student directions screen may run more than two
   sentences, and the word "consonant" must never appear anywhere a
   student can see it. */
const dom=new JSDOM(html,{url:"https://miqdaniels.github.io/READING-DANIELS/",runScripts:"dangerously",pretendToBeVisual:true,
  beforeParse(w){ w.HTMLElement.prototype.scrollIntoView=function(){}; w.scrollTo=function(){}; }
});
const w=dom.window, d=w.document;

function sentenceCount(text){
  var parts=text.replace(/\s+/g," ").replace(/^\s+|\s+$/g,"").split(/[.!?]+/);
  var n=0,i; for(i=0;i<parts.length;i++){ if(parts[i].replace(/\s+/g,"")!==""){ n++; } }
  return n;
}

setTimeout(function(){
  let pass=0,fail=0;
  function ck(c,m){ if(c){pass++;} else {fail++; console.log("FAIL:",m);} }

  /* ---- every recorded directions script is <=2 sentences ---- */
  var defs=w.DIRECTIONS_DEFS, i;
  ck(defs.length===7,"all 7 directions scripts are present (got "+defs.length+")");
  for(i=0;i<defs.length;i++){
    var n=sentenceCount(defs[i].script);
    ck(n<=2,"'"+defs[i].label+"' script is at most 2 sentences (got "+n+": \""+defs[i].script+"\")");
    ck(!/\bconsonants?\b/i.test(defs[i].script),"'"+defs[i].label+"' script never says \"consonant\"");
  }

  /* ---- exact wording for the three Check 2 screens, as specified ---- */
  ck(defs.filter(function(x){return x.key==="dir_check2_open";})[0].script==="Look at the letter. Say the sound.","Check 2 opening script matches exactly");
  ck(defs.filter(function(x){return x.key==="dir_check2_before2b";})[0].script==="Listen to the word. Say the sound.","before-2B script matches exactly");
  ck(defs.filter(function(x){return x.key==="dir_check2_before2c";})[0].script==="Listen to the word. Say the sound.","before-2C script matches exactly");

  /* ---- on-screen directions text (not just the recorded scripts) ---- */
  w.READER=w.CLASSES[0].students[0]; w.CURCLASS=w.CLASSES[0]; w.CURGROUP=w.GROUPS[0];

  w.go("check1");
  var c1Text=d.getElementById("c1-intro").textContent;
  ck(sentenceCount(c1Text)<=2,"Check 1's on-screen directions are at most 2 sentences (got \""+c1Text+"\")");
  ck(!/\bconsonants?\b/i.test(c1Text),"Check 1's on-screen directions never say \"consonant\"");

  w.go("check2");
  var c2Text=d.querySelector("#c2-setup .lede").textContent;
  ck(sentenceCount(c2Text)<=2,"Check 2's opening on-screen directions are at most 2 sentences (got \""+c2Text+"\")");
  ck(!/\bconsonants?\b/i.test(c2Text),"Check 2's opening on-screen directions never say \"consonant\"");
  ck(c2Text.replace(/\s+/g," ").replace(/^\s+|\s+$/g,"")==="Look at the letter. Say the sound.","Check 2's on-screen opening text matches exactly");

  var trans2b=w.C2_TRANS_TEXT["2B"], trans2c=w.C2_TRANS_TEXT["2C"];
  ck(sentenceCount(trans2b)<=2,"before-2B on-screen text is at most 2 sentences (got \""+trans2b+"\")");
  ck(sentenceCount(trans2c)<=2,"before-2C on-screen text is at most 2 sentences (got \""+trans2c+"\")");
  ck(!/\bconsonants?\b/i.test(trans2b) && !/\bconsonants?\b/i.test(trans2c),"the transition screens never say \"consonant\"");

  w.go("fluencyPassage");
  var fluText=d.querySelectorAll("#fluencyPassage .mini-note")[0].textContent;
  ck(sentenceCount(fluText)<=2,"Fluency's on-screen directions are at most 2 sentences (got \""+fluText+"\")");

  w.fluPassage=w.findPassage(w.LEVELS[0],0);
  w.go("fluencyRetell");
  var retText=d.getElementById("ret-prompt").textContent;
  ck(sentenceCount(retText)<=2,"Retell's on-screen prompt is at most 2 sentences (got \""+retText+"\")");

  w.go("s-groups");
  var vocabText=d.querySelectorAll("#s-groups .mini-note")[0].textContent;
  ck(sentenceCount(vocabText)<=2,"Vocabulary's on-screen directions are at most 2 sentences (got \""+vocabText+"\")");

  w.go("s-final");
  var finalText=d.querySelectorAll("#s-final .mini-note")[0].textContent;
  ck(sentenceCount(finalText)<=2,"Word Practice final-read on-screen directions are at most 2 sentences (got \""+finalText+"\")");

  /* ---- "consonant" never appears on any STUDENT screen (teacher-only
     scoring screens like check2Teach still say it for Miq's own
     reference, which is fine -- students never see those) ---- */
  var studentScreens=["s-pick","s-roster","s-confirm","studentMenu","diagLanding","check1","check2","s-groups","s-final","s-read","fluencyPassage","fluencyRetell","s-score","s-board","s-status"];
  var j;
  for(j=0;j<studentScreens.length;j++){
    w.go(studentScreens[j]);
    ck(!/\bconsonants?\b/i.test(d.getElementById(studentScreens[j]).textContent),"'"+studentScreens[j]+"' never says \"consonant\"");
  }

  console.log("\n=== "+pass+" passed, "+fail+" failed ===");
  process.exit(fail?1:0);
},400);
