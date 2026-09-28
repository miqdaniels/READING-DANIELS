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

  /* ---- every recorded directions script is <=2 sentences, EXCEPT a few
     screens that carry an explicit, exact, longer wording per an explicit
     later specification (Check 2's before-2B/before-2C transitions, and
     Check 3's opening directions + its before-3C one-liner) ---- */
  var LONGER_OK={dir_check2_before2b:true, dir_check2_before2c:true, dir_check3_open:true, dir_check3_3c:true};
  var defs=w.DIRECTIONS_DEFS, i;
  ck(defs.length===13,"all 13 directions scripts are present (got "+defs.length+")");
  for(i=0;i<defs.length;i++){
    var n=sentenceCount(defs[i].script);
    if(!LONGER_OK[defs[i].key]){
      ck(n<=2,"'"+defs[i].label+"' script is at most 2 sentences (got "+n+": \""+defs[i].script+"\")");
    }
    ck(!/\bconsonants?\b/i.test(defs[i].script),"'"+defs[i].label+"' script never says \"consonant\"");
  }

  /* ---- exact wording for the three Check 2 screens, as specified ---- */
  ck(defs.filter(function(x){return x.key==="dir_check2_open";})[0].script==="Look at the letter. Say the sound.","Check 2 opening script matches exactly");
  ck(defs.filter(function(x){return x.key==="dir_check2_before2b";})[0].script==="Now you will hear a word. Look at the letter. Say the sound it makes in that word.","before-2B script matches exactly");
  ck(defs.filter(function(x){return x.key==="dir_check2_before2c";})[0].script==="Last part. Look at the letter. Listen to the word. Say the sound it makes in that word.","before-2C script matches exactly");

  /* ---- exact wording for the 5 Check 3 directions scripts, as specified ---- */
  ck(defs.filter(function(x){return x.key==="dir_check3_open";})[0].script==="Listen carefully. Answer out loud. You can listen one more time if you need to. Tap Next when you’re ready.","Check 3 opening script matches exactly");
  ck(defs.filter(function(x){return x.key==="dir_check3_3a";})[0].script==="Tell me the first sound.","Check 3 before-3A script matches exactly");
  ck(defs.filter(function(x){return x.key==="dir_check3_3b";})[0].script==="Tell me the last sound.","Check 3 before-3B script matches exactly");
  ck(defs.filter(function(x){return x.key==="dir_check3_3c";})[0].script==="Listen to the sounds. Put them together. Say the word.","Check 3 before-3C script matches exactly");
  ck(defs.filter(function(x){return x.key==="dir_check3_3d";})[0].script==="Listen to the word. Say every sound you hear.","Check 3 before-3D script matches exactly");
  ck(defs.filter(function(x){return x.key==="dir_check4";})[0].script==="Read each word out loud.","Check 4 script matches exactly");

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
  ck(trans2b==="Now you will hear a word. Look at the letter. Say the sound it makes in that word.","before-2B on-screen text matches exactly");
  ck(trans2c==="Last part. Look at the letter. Listen to the word. Say the sound it makes in that word.","before-2C on-screen text matches exactly");
  ck(!/\bconsonants?\b/i.test(trans2b) && !/\bconsonants?\b/i.test(trans2c),"the transition screens never say \"consonant\"");

  /* ---- Check 3's on-screen directions text (exempt like Check 2's
     transitions/Fluency above -- these are exact, later-specified wording) ---- */
  w.go("check3");
  var c3Text=d.querySelector("#c3-setup .lede").textContent;
  ck(c3Text.replace(/\s+/g," ").replace(/^\s+|\s+$/g,"")==="Listen carefully. Answer out loud. You can listen one more time if you need to. Tap Next when you’re ready.","Check 3's on-screen opening text matches exactly");
  ck(!/\bconsonants?\b/i.test(c3Text),"Check 3's opening on-screen directions never say \"consonant\"");
  ck(w.C3_SECTIONS[0].introText==="Tell me the first sound." && w.C3_SECTIONS[1].introText==="Tell me the last sound."
    && w.C3_SECTIONS[2].introText==="Listen to the sounds. Put them together. Say the word." && w.C3_SECTIONS[3].introText==="Listen to the word. Say every sound you hear.",
    "all 4 Check 3 domain one-liners match exactly");

  /* Fluency's Day 1/3 directions are an explicit, exact, later-specified
     wording (3 short sentences) -- exempt from the 2-sentence rule the
     same way the Check 2 transitions are, but still checked verbatim. */
  w.READER=w.CLASSES[0].students[5]; w.CURCLASS=w.CLASSES[0];
  w.fluOpen();
  var fluText=d.getElementById("flu-directions").textContent;
  ck(fluText==="Read the passage out loud. You have one minute. The recording stops by itself.","Fluency Day 1/3 on-screen directions match exactly");
  ck(!/\bconsonants?\b/i.test(fluText),"Fluency's on-screen directions never say \"consonant\"");

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

  /* ---- Check 4's on-screen directions text ---- */
  w.go("check4");
  var c4Text=d.getElementById("c4-intro").textContent;
  ck(sentenceCount(c4Text)<=2,"Check 4's on-screen directions are at most 2 sentences (got \""+c4Text+"\")");
  ck(!/\bconsonants?\b/i.test(c4Text),"Check 4's on-screen directions never say \"consonant\"");
  ck(c4Text.replace(/\s+/g," ").replace(/^\s+|\s+$/g,"")==="Read each word out loud. Tap Next after each one.","Check 4's on-screen opening text matches exactly");
  var c4PseudoText=d.getElementById("c4-pseudo-note").textContent;
  ck(sentenceCount(c4PseudoText)<=2,"Check 4's pseudoword point-of-need text is at most 2 sentences (got \""+c4PseudoText+"\")");
  ck(c4PseudoText==="This is a made-up word. Read it out loud.","Check 4's pseudoword text matches exactly");

  /* ---- "consonant" never appears on any STUDENT screen (teacher-only
     scoring screens like check2Teach still say it for Miq's own
     reference, which is fine -- students never see those) ---- */
  var studentScreens=["s-pick","s-roster","s-confirm","studentMenu","diagLanding","check1","check2","check3","check4","s-groups","s-final","s-read","fluencyPassage","fluencyRetell","s-score","s-board","s-status"];
  var j;
  for(j=0;j<studentScreens.length;j++){
    w.go(studentScreens[j]);
    ck(!/\bconsonants?\b/i.test(d.getElementById(studentScreens[j]).textContent),"'"+studentScreens[j]+"' never says \"consonant\"");
  }

  console.log("\n=== "+pass+" passed, "+fail+" failed ===");
  process.exit(fail?1:0);
},400);
