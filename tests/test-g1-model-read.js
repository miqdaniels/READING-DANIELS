// Level 1 model read (Mick's voice): LOCKED until the TEACHER unlocks it, per student, per passage.
// jsdom with the real site URL, real WebCrypto, a fake network that serves clips encrypted with a TEST PIN.
// (The real files' PIN is never in the repo. Set RF_PIN=<real pin> to also check the real files decrypt.)
var fs=require('fs'), nodeCrypto=require('crypto'), JSDOM=require('jsdom').JSDOM;
var src=fs.readFileSync('./index.html','utf8');
var html=src.replace('<script src="clips.js" defer></script>','');
var BASE="https://miqdaniels.github.io/READING-DANIELS/";
var TEST_PIN="test-pin1";
var pass=0, fail=0; function ok(c,m){ if(c){ pass++; } else { fail++; console.log("FAIL: "+m); } }
function sleep(ms){ return new Promise(function(r){ setTimeout(r,ms); }); }

/* ---------- static: the files, the format, the rules ---------- */
var LIST=require('../tall-list.js').filter(function(x){ return x.kind==="passage"; });
var man=JSON.parse(fs.readFileSync('./audio/tall-g1-passages-manifest.json','utf8'));
ok(LIST.length===11 && man.items.length===11,"11 passages, 11 manifest items");
LIST.forEach(function(x,i){
  var f='./audio/TALL-G1/'+x.id+'.enc', m=man.items[i];
  ok(fs.existsSync(f) && fs.statSync(f).size>100000,"locked file exists "+x.id);
  if(fs.existsSync(f)){ var b=fs.readFileSync(f).slice(28,32); ok(!(b[0]===0x1a&&b[1]===0x45&&b[2]===0xdf&&b[3]===0xa3),"file is ciphertext, not plain webm "+x.id); }
  ok(m.id===x.id && m.label===x.label && m.enc===man.base+x.id+".enc","manifest "+x.id);
});
ok(fs.readdirSync('./audio/TALL-G1').every(function(f){ return /\.enc$/.test(f); }) && fs.readdirSync('./audio/TALL-G1').length===11,"audio/TALL-G1 holds ONLY the 11 locked files (no plain .webm to link to)");
ok(!/\.webm/.test(src.slice(src.indexOf("Level 1 MODEL READ"),src.indexOf("Level 1 passage screens use two more Google fonts"))),"app code never references a plain clip");
ok(src.split('"rf_g1_unlock"').length===3,"unlock storage is only touched by g1mAll / g1mSaveUnlock");
ok(!/speechSynthesis|SpeechSynthesisUtterance/.test(src),"no text-to-speech");
ok(/<\/script>\s*<\/body>\s*<\/html>\s*$/.test(src),"index.html ends with </script></body></html>");
var scr=src.slice(src.indexOf("<script>")).replace(/"(?:[^"\\\n]|\\.)*"/g,'""');
ok(!/\bconst\s|\blet\s+[a-zA-Z_$]+\s*[=;]/.test(scr) && scr.indexOf("=>")<0,"ES5: no const/let/arrow functions");
if(process.env.RF_PIN){
  var okReal=0; LIST.forEach(function(x){ try{
    var b=fs.readFileSync('./audio/TALL-G1/'+x.id+'.enc'), pin=process.env.RF_PIN.toLowerCase().replace(/[^a-z0-9]/g,"");
    var k=nodeCrypto.pbkdf2Sync(pin,b.slice(0,16),200000,32,'sha256'), d=nodeCrypto.createDecipheriv('aes-256-gcm',k,b.slice(16,28)); d.setAuthTag(b.slice(b.length-16));
    var p=Buffer.concat([d.update(b.slice(28,b.length-16)),d.final()]); if(p[0]===0x1a&&p[1]===0x45) okReal++; }catch(e){} });
  ok(okReal===11,"REAL files all decrypt with the real PIN (RF_PIN)");
}

/* ---------- fake network: clips locked with the TEST PIN ---------- */
function lock(plain,pin){
  var salt=nodeCrypto.randomBytes(16), iv=nodeCrypto.randomBytes(12), key=nodeCrypto.pbkdf2Sync(pin.toLowerCase().replace(/[^a-z0-9]/g,""),salt,200000,32,'sha256');
  var c=nodeCrypto.createCipheriv('aes-256-gcm',key,iv), ct=Buffer.concat([c.update(plain),c.final(),c.getAuthTag()]);
  return Buffer.concat([salt,iv,ct]);
}
var FAKE={}, i;
for(i=0;i<11;i++){ FAKE["audio/TALL-G1/PSG_1_"+(i<10?"0":"")+i+".enc"]=lock(Buffer.concat([Buffer.from([0x1a,0x45,0xdf,0xa3]),Buffer.from("model-read-"+i)]),TEST_PIN); }
delete FAKE["audio/TALL-G1/PSG_1_09.enc"];      /* one passage with no clip yet */

function boot(url,storage,session){
  var calls={fetch:[],audio:[],blobs:[]};
  var w=new JSDOM(html,{url:url||BASE,runScripts:"dangerously",pretendToBeVisual:true,beforeParse:function(win){
    win.scrollTo=function(){}; win.HTMLElement.prototype.scrollIntoView=function(){};
    Object.defineProperty(win,'crypto',{value:nodeCrypto.webcrypto,configurable:true});
    var k; if(storage){ for(k in storage){ win.localStorage.setItem(k,storage[k]); } }
    if(session){ for(k in session){ win.sessionStorage.setItem(k,session[k]); } }
    win.fetch=function(u){ if(/\.enc$/.test(String(u))){ calls.fetch.push(u); } var key=String(u).replace(BASE,""), b=FAKE[key];
      return Promise.resolve(b?{ok:true,status:200,arrayBuffer:function(){ return Promise.resolve(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)); }}:{ok:false,status:404}); };
    win.URL.createObjectURL=function(bl){ calls.blobs.push(bl); return "blob:test/"+calls.blobs.length; }; win.URL.revokeObjectURL=function(){};
    win.Audio=function(u){ var a={src:u,paused:true,onended:null,onerror:null,play:function(){ a.paused=false; return Promise.resolve(); },pause:function(){ a.paused=true; }}; calls.audio.push(a); return a; };
  }}).window;
  w.__calls=calls; return w;
}
function el(w,id){ return w.document.getElementById(id); }
function click(w,id){ el(w,id).dispatchEvent(new w.MouseEvent("click",{bubbles:true})); }
function open(w,student,sub,day){ w.READER=student?{id:student,name:student}:null; w.fluDay=day; w.fluPassage=w.passagesForLevel("FIRST")[sub]; w.go("fluencyPassage"); }
function typePin(w,pin){ el(w,"flu-unlock-pin").value=pin; click(w,"flu-unlock-go"); }
function snapshot(w){ var o={}, i, k; for(i=0;i<w.localStorage.length;i++){ k=w.localStorage.key(i); o[k]=w.localStorage.getItem(k); } return o; }
function waitFor(fn,ms){ var t=new Date().getTime(); return new Promise(function(res){ (function poll(){ if(fn()||new Date().getTime()-t>(ms||8000)){ res(); } else { setTimeout(poll,25); } })(); }); }
var LOCKED="Your teacher unlocks this after your cold read";
var ANA="stu_ana_p1", BEN="stu_ben_p1";

(async function(){
  /* 1. LOCKED BEFORE the cold read: no button at all on a cold-read screen */
  var w=boot();
  open(w,ANA,0,1);
  ok(el(w,"flu-model-wrap").style.display==="none" && el(w,"flu-unlock").style.display==="none","Day 1 cold read: no model-read button, no PIN box");
  open(w,ANA,0,3);
  ok(el(w,"flu-model-wrap").style.display==="none","Day 3 cold read: no model-read button");
  try{ w.fluModelToggle(); }catch(e){} await sleep(30);
  ok(w.__calls.fetch.length===0 && w.__calls.audio.length===0,"cold read: calling the player directly fetches and plays nothing");
  ok(!/PSG_1_00/.test(w.document.documentElement.outerHTML.replace(/<script[\s\S]*?<\/script>/g,"")),"clip file name is nowhere in the page markup");

  /* 2. STILL LOCKED after the cold read is saved (recording/stopping/saving/submitting never unlock) */
  w.READER={id:ANA,name:ANA}; w.FluCycle.set(ANA,1,"FIRST",0);
  w.fluAdvanceDay();                                   /* what saving the cold read does */
  ok(w.FluCycle.get(ANA).day===2,"saving the cold read moves the student to Day 2");
  open(w,ANA,0,2);
  ok(el(w,"flu-model-wrap").style.display==="inline-flex" && el(w,"flu-model-btn").disabled===true && el(w,"flu-model-lbl").textContent===LOCKED,"Day 2: button shows, LOCKED, says 'Your teacher unlocks this after your cold read'");
  ok(el(w,"flu-unlock").style.display==="block","Day 2: a small 'Teacher unlock' is available");
  click(w,"flu-model-btn"); try{ w.fluModelToggle(); }catch(e){} await sleep(30);
  ok(w.__calls.fetch.length===0 && w.__calls.audio.length===0,"student taps / calls the player: still nothing plays");
  ok(!w.localStorage.getItem("rf_g1_unlock"),"nothing was unlocked in storage");
  typePin(w,"");
  ok(!w.localStorage.getItem("rf_g1_unlock"),"empty PIN unlocks nothing");

  /* 3. WRONG PIN fails; slow-down after 3 wrong tries */
  click(w,"flu-unlock-open"); typePin(w,"not-the-pin"); await waitFor(function(){ return /did not work/.test(el(w,"flu-unlock-msg").textContent); });
  ok(/did not work/.test(el(w,"flu-unlock-msg").textContent) && !w.localStorage.getItem("rf_g1_unlock"),"wrong PIN fails and unlocks nothing");
  ok(el(w,"flu-model-btn").disabled===true,"still locked after a wrong PIN");
  typePin(w,"another-bad"); await waitFor(function(){ return /did not work/.test(el(w,"flu-unlock-msg").textContent) && w.document.getElementById("flu-unlock-pin").value===""; });
  typePin(w,"third-bad"); await waitFor(function(){ return /Wait \d+ seconds/.test(el(w,"flu-unlock-msg").textContent); });
  ok(/Wait 30 seconds/.test(el(w,"flu-unlock-msg").textContent),"3rd wrong PIN -> 'Wait 30 seconds' (no guessing)");
  var fetchesBefore=w.__calls.fetch.length;
  typePin(w,TEST_PIN); await sleep(60);
  ok(/Too many tries/.test(el(w,"flu-unlock-msg").textContent) && w.__calls.fetch.length===fetchesBefore && !w.localStorage.getItem("rf_g1_unlock"),"during the wait even the RIGHT PIN is refused");

  /* 4. RIGHT PIN unlocks ONLY that student + that passage */
  var w2=boot();
  open(w2,ANA,0,2); click(w2,"flu-unlock-open"); typePin(w2,TEST_PIN);
  await waitFor(function(){ return el(w2,"flu-model-btn").disabled===false; });
  ok(el(w2,"flu-model-btn").disabled===false && el(w2,"flu-model-lbl").textContent==="Listen to the passage" && el(w2,"flu-unlock").style.display==="none","right PIN: passage 1.0 unlocked for Ana");
  ok(Object.keys(JSON.parse(w2.localStorage.getItem("rf_g1_unlock"))).join()===ANA+"|0","only Ana + passage 1.0 is recorded");
  open(w2,ANA,1,2);
  ok(el(w2,"flu-model-btn").disabled===true && el(w2,"flu-model-lbl").textContent===LOCKED,"Ana's OTHER passage (1.1) is still locked");
  open(w2,BEN,0,2);
  ok(el(w2,"flu-model-btn").disabled===true && el(w2,"flu-model-lbl").textContent===LOCKED,"ANOTHER student (Ben) on 1.0 is still locked");
  w2.READER={id:BEN,name:BEN}; w2.fluModelToggle(); await sleep(30);
  ok(w2.__calls.audio.length===0,"Ben cannot play Ana's unlock");

  /* 5. Unlocked student: plays the right clip, as many times as they want */
  open(w2,ANA,0,2);
  var before=w2.__calls.fetch.length;
  click(w2,"flu-model-btn"); await waitFor(function(){ return w2.__calls.audio.length===1; });
  ok(w2.__calls.fetch[w2.__calls.fetch.length-1]==="audio/TALL-G1/PSG_1_00.enc","play loads PSG_1_00 (locked file) for passage 1.0");
  ok(w2.__calls.audio.length===1 && w2.__calls.audio[0].paused===false && el(w2,"flu-model-lbl").textContent==="Playing…","plays");
  var bl=w2.__calls.blobs[0]; var txt=Buffer.from(await new Promise(function(r){ var fr=new w2.FileReader(); fr.onload=function(){ r(fr.result); }; fr.readAsArrayBuffer(bl); })).toString("latin1");
  ok(txt.indexOf("model-read-0")>-1,"what plays is the decrypted clip for 1.0");
  w2.__calls.audio[0].onended(); ok(el(w2,"flu-model-lbl").textContent==="Listen to the passage","button resets when the read ends");
  click(w2,"flu-model-btn"); await waitFor(function(){ return w2.__calls.audio.length===2; }); w2.__calls.audio[1].onended();
  click(w2,"flu-model-btn"); await waitFor(function(){ return w2.__calls.audio.length===3; });
  ok(w2.__calls.audio.length===3,"as many plays as they want (3 plays, no PIN again)");
  click(w2,"flu-model-btn"); ok(w2.__calls.audio[2].paused===true,"tap while playing stops it");

  /* 6. SURVIVES A REFRESH (new page, same saved storage) */
  var saved=snapshot(w2);
  var w3=boot(BASE,saved);
  open(w3,ANA,0,2);
  ok(el(w3,"flu-model-btn").disabled===false && el(w3,"flu-model-lbl").textContent==="Listen to the passage","after a refresh Ana's 1.0 is still unlocked");
  click(w3,"flu-model-btn"); await waitFor(function(){ return w3.__calls.audio.length===1; });
  ok(w3.__calls.audio.length===1,"and it plays after the refresh");
  open(w3,BEN,0,2); ok(el(w3,"flu-model-btn").disabled===true,"after a refresh Ben is still locked");
  /* an unlock that is only a flag (no real key) does nothing: storage edits cannot unlock */
  var fake={}; fake["rf_g1_unlock"]=JSON.stringify({"stu_cy_p1|0":"AAAA"});
  var w4=boot(BASE,fake); open(w4,"stu_cy_p1",0,2); click(w4,"flu-model-btn"); await sleep(150);
  ok(w4.__calls.audio.length===0,"a faked unlock entry cannot play anything (no real key)");

  /* 7. Unlock on a cold-read screen is impossible; Day 2 only */
  var w5=boot(BASE,saved); open(w5,ANA,0,1);
  ok(el(w5,"flu-model-wrap").style.display==="none","even an unlocked passage shows no button on a cold-read screen");
  try{ w5.fluModelToggle(); }catch(e){} await sleep(60);
  ok(w5.__calls.audio.length===0,"and the player refuses on a cold-read screen");

  /* 8. TEACHER VIEW always plays (PIN once per browser session) */
  var t=boot(BASE+"?teacher");
  open(t,null,2,1);
  ok(el(t,"flu-model-wrap").style.display==="inline-flex" && el(t,"flu-model-btn").disabled===false,"teacher view: Listen is available on any screen");
  click(t,"flu-model-btn");
  ok(el(t,"flu-unlock-form").style.display==="inline" && t.__calls.audio.length===0,"teacher view: asks for the PIN first (clips are locked)");
  typePin(t,"wrong-one"); await waitFor(function(){ return /did not work/.test(el(t,"flu-unlock-msg").textContent); });
  ok(t.__calls.audio.length===0,"teacher view: wrong PIN plays nothing");
  typePin(t,TEST_PIN); await waitFor(function(){ return t.__calls.audio.length===1; });
  ok(t.__calls.audio.length===1 && t.__calls.fetch[t.__calls.fetch.length-1]==="audio/TALL-G1/PSG_1_02.enc","teacher PIN plays passage 1.2");
  open(t,null,5,1); click(t,"flu-model-btn"); await waitFor(function(){ return t.__calls.audio.length===2; });
  ok(t.__calls.audio.length===2 && t.__calls.fetch[t.__calls.fetch.length-1]==="audio/TALL-G1/PSG_1_05.enc","teacher view: next passage plays with no PIN retyped");
  ok(!t.localStorage.getItem("rf_g1_unlock"),"the teacher's own playing unlocks nothing for students");
  /* teacher unlocks a student from the student's screen (PIN on the student's Chromebook, student view) */

  /* 9. Missing clip */
  var m=boot(BASE+"?teacher",null,{rf_g1_teacher_pin:"testpin1"});
  open(m,null,9,1); click(m,"flu-model-btn"); await waitFor(function(){ return el(m,"flu-model-lbl").textContent==="Not recorded yet."; });
  ok(el(m,"flu-model-lbl").textContent==="Not recorded yet." && el(m,"flu-model-btn").disabled===true && m.__calls.audio.length===0,"missing clip: 'Not recorded yet.'");

  /* 10. PK passages: nothing */
  var pk=boot(); pk.READER={id:ANA,name:ANA}; pk.fluDay=2; pk.fluPassage=pk.findPassage("PK",0); pk.go("fluencyPassage");
  ok(el(pk,"flu-model-wrap").style.display==="none" && el(pk,"flu-unlock").style.display==="none","PK passages: no model read, no PIN box");

  console.log("test-g1-model-read: "+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
})();
