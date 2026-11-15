// Teacher cold-read reset (PIN-protected): link only on cold-read screens, wrong PIN does nothing, right PIN
// discards the bad cold read (recording / unsaved take / saved attempt), logs it, gives ONE new cold read of the
// SAME passage, and NEVER unlocks the model read. jsdom, real site URL, real WebCrypto.
var fs=require('fs'), nodeCrypto=require('crypto'), JSDOM=require('jsdom').JSDOM;
var src=fs.readFileSync('./index.html','utf8');
var html=src.replace('<script src="clips.js" defer></script>','');
var BASE="https://miqdaniels.github.io/READING-DANIELS/";
var TEST_PIN="test-pin1";
var pass=0, fail=0; function ok(c,m){ if(c){ pass++; } else { fail++; console.log("FAIL: "+m); } }
function sleep(ms){ return new Promise(function(r){ setTimeout(r,ms); }); }
function lock(plain,pin){
  var salt=nodeCrypto.randomBytes(16), iv=nodeCrypto.randomBytes(12), key=nodeCrypto.pbkdf2Sync(pin.toLowerCase().replace(/[^a-z0-9]/g,""),salt,200000,32,'sha256');
  var c=nodeCrypto.createCipheriv('aes-256-gcm',key,iv); return Buffer.concat([salt,iv,c.update(plain),c.final(),c.getAuthTag()]);
}
/* static: the real PIN-check file exists and is locked; code rules */
var real=fs.readFileSync('./audio/TALL-G1/pin-check.enc');
ok(real.length>40 && real.length<200,"audio/TALL-G1/pin-check.enc is a tiny locked file");
ok(/<\/script>\s*<\/body>\s*<\/html>\s*$/.test(src),"index.html ends with </script></body></html>");
var scr=src.slice(src.indexOf("<script>")).replace(/"(?:[^"\\\n]|\\.)*"/g,'""');
ok(!/\bconst\s|\blet\s+[a-zA-Z_$]+\s*[=;]/.test(scr) && scr.indexOf("=>")<0,"ES5: no const/let/arrow functions");
ok(!/speechSynthesis|SpeechSynthesisUtterance/.test(src),"no text-to-speech");
if(process.env.RF_PIN){
  var pin=process.env.RF_PIN.toLowerCase().replace(/[^a-z0-9]/g,""), k=nodeCrypto.pbkdf2Sync(pin,real.slice(0,16),200000,32,'sha256'), d=nodeCrypto.createDecipheriv('aes-256-gcm',k,real.slice(16,28)); d.setAuthTag(real.slice(real.length-16));
  ok(Buffer.concat([d.update(real.slice(28,real.length-16)),d.final()]).toString()==="rf-teacher-pin-ok","REAL pin-check.enc opens with the real PIN (RF_PIN)");
}
var FAKE={ "audio/TALL-G1/pin-check.enc":lock(Buffer.from("rf-teacher-pin-ok"),TEST_PIN) };
function boot(storage,noCheck){
  var w=new JSDOM(html,{url:BASE,runScripts:"dangerously",pretendToBeVisual:true,beforeParse:function(win){
    win.scrollTo=function(){}; win.HTMLElement.prototype.scrollIntoView=function(){};
    Object.defineProperty(win,'crypto',{value:nodeCrypto.webcrypto,configurable:true});
    var k; if(storage){ for(k in storage){ win.localStorage.setItem(k,storage[k]); } }
    win.__fetched=[];
    win.fetch=function(u){ var key=String(u).replace(BASE,""); if(/\.enc$/.test(key)){ win.__fetched.push(key); } var b=noCheck?null:FAKE[key];
      return Promise.resolve(b?{ok:true,status:200,arrayBuffer:function(){ return Promise.resolve(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)); }}:{ok:false,status:404}); };
    win.URL.createObjectURL=function(){ return "blob:t/1"; }; win.URL.revokeObjectURL=function(){};
  }}).window;
  w.FluencyStore.put=function(){ return Promise.resolve(true); };   /* no IndexedDB in jsdom */
  w.FluencyStore.del=function(id){ w.__deleted=(w.__deleted||[]).concat([id]); return Promise.resolve(true); };
  return w;
}
function el(w,id){ return w.document.getElementById(id); }
function click(w,id){ el(w,id).dispatchEvent(new w.MouseEvent("click",{bubbles:true})); }
var ANA={id:"stu_ana_p1",name:"Ana G."}, BEN={id:"stu_ben_p1",name:"Ben H."};
function openCold(w,student,sub,day){ w.READER=student; w.fluDay=day||1; w.fluPassage=w.passagesForLevel("FIRST")[sub]; w.go("fluencyPassage"); }
function typeReset(w,pin){ if(el(w,"flu-reset-form").style.display==="none"){ click(w,"flu-reset-open"); } el(w,"flu-reset-pin").value=pin; click(w,"flu-reset-go"); }
function waitFor(fn,ms){ var t=new Date().getTime(); return new Promise(function(res){ (function poll(){ if(fn()||new Date().getTime()-t>(ms||8000)){ res(); } else { setTimeout(poll,25); } })(); }); }
function snapshot(w){ var o={}, i, k; for(i=0;i<w.localStorage.length;i++){ k=w.localStorage.key(i); o[k]=w.localStorage.getItem(k); } return o; }
function addAttempt(w,student,sub,day){ var id="flu_"+student.id+"_"+sub; w.FluAttempts.add({id:id,studentId:student.id,studentName:student.name,level:"FIRST",sub:sub,passageId:"FIRST_"+sub,title:"t",date:"2026-11-15",day:day,scored:day===1,wordsRead:null,errors:null,retellWords:null,decision:null,retellSaved:false}); return id; }

(async function(){
  /* 1. where the link shows */
  var w=boot();
  openCold(w,ANA,0,1); ok(el(w,"flu-reset").style.display==="block" && /Teacher reset/.test(el(w,"flu-reset-open").textContent),"Day 1 cold read: small 'Teacher reset' link");
  openCold(w,ANA,0,3); ok(el(w,"flu-reset").style.display==="block","Day 3 cold read: link shows");
  openCold(w,ANA,0,2); ok(el(w,"flu-reset").style.display==="none","Day 2 practice screen: no reset link");
  w.READER=null; w.fluDay=1; w.fluPassage=w.passagesForLevel("FIRST")[0]; w.go("fluencyPassage"); ok(el(w,"flu-reset").style.display==="none","teacher preview (no student): no reset link");
  var pk=boot(); pk.READER=ANA; pk.fluDay=1; pk.fluPassage=pk.findPassage("PK",0); pk.go("fluencyPassage"); ok(el(pk,"flu-reset").style.display==="block","works on any cold-read passage, e.g. PK");

  /* 2. wrong PIN does nothing; slow-down after 3 */
  w=boot(); openCold(w,ANA,0,1); var aid=addAttempt(w,ANA,0,1); w.fluAttemptId=aid; w.fluBlob={fake:1};
  typeReset(w,"not-the-pin"); await waitFor(function(){ return /did not work/.test(el(w,"flu-reset-msg").textContent); });
  ok(/did not work/.test(el(w,"flu-reset-msg").textContent),"wrong PIN: 'That PIN did not work.'");
  ok(w.FluAttempts.get(aid) && w.fluBlob && w.FluResets.all().length===0 && !w.FluRetry.get(ANA.id),"wrong PIN: nothing discarded, nothing logged, no retry marker");
  typeReset(w,"bad-two"); await waitFor(function(){ return /did not work/.test(el(w,"flu-reset-msg").textContent) && el(w,"flu-reset-pin").value===""; });
  typeReset(w,"bad-three"); await waitFor(function(){ return /Wait \d+ seconds/.test(el(w,"flu-reset-msg").textContent); });
  ok(/Wait 30 seconds/.test(el(w,"flu-reset-msg").textContent),"3rd wrong PIN: wait 30 seconds");
  var n=w.__fetched.length; typeReset(w,TEST_PIN); await sleep(60);
  ok(/Too many tries/.test(el(w,"flu-reset-msg").textContent) && w.FluAttempts.get(aid) && w.__fetched.length===n,"during the wait even the right PIN is refused");

  /* 3. right PIN, SAVED cold read -> discarded, logged, same passage again */
  w=boot(); w.FluPlace.set(ANA.id,"FIRST",0);
  w.READER=ANA; w.fluOpen();                                  /* student opens Day 1: gets 1.0, FluPlace moves on to 1.1 */
  ok(w.fluPassage.sub===0 && w.fluDay===1 && w.FluPlace.get(ANA.id).sub===1,"student opens Day 1: passage 1.0, next-up moves to 1.1");
  var benId=addAttempt(w,BEN,0,1), oldId=addAttempt(w,ANA,3,1);
  aid=addAttempt(w,ANA,0,1); w.fluAttemptId=aid;
  var unlockBefore=JSON.stringify({a:w.localStorage.getItem("rf_g1_unlock")});
  typeReset(w,TEST_PIN); await waitFor(function(){ return w.FluResets.all().length===1; });
  ok(w.FluResets.all().length===1,"right PIN: reset happened and is LOGGED");
  var lg=w.FluResets.all()[0];
  ok(lg.studentId===ANA.id && lg.passageId==="FIRST_0" && lg.stage==="saved" && lg.attemptId===aid && lg.day===1 && /^\d{4}-\d\d-\d\d$/.test(lg.date) && !!lg.at,"log: who, passage, day, what was discarded, when");
  ok(!w.FluAttempts.get(aid),"the bad saved cold read is discarded");
  ok(!!w.FluAttempts.get(benId) && !!w.FluAttempts.get(oldId),"other students' reads and Ana's other passages are untouched");
  ok((w.__deleted||[]).indexOf(aid+"_passage")>-1,"its saved recording is deleted too");
  ok(w.fluAttemptId===null && w.fluBlob===null,"nothing left in memory");
  ok(w.document.getElementById("flu-after").innerHTML==="" && el(w,"flu-active").style.display!=="none" && /reset this read/.test(el(w,"flu-state").textContent),"screen is a fresh cold read with a plain note");
  ok(w.FluRetry.get(ANA.id).sub===0 && w.FluCycle.get(ANA.id).cycleSub===0 && w.FluCycle.get(ANA.id).day===1,"student is set to redo 1.0 as a cold read");
  ok(w.localStorage.getItem("rf_g1_unlock")===null,"RESET DID NOT UNLOCK THE MODEL READ (no unlock saved)");
  w.fluDay=2; w.go("fluencyPassage"); ok(el(w,"flu-model-btn").disabled===true && /unlocks this after your cold read/.test(el(w,"flu-model-lbl").textContent),"model read is still locked on Day 2 after a reset");
  /* exactly ONE new cold read of that same passage, even if the student leaves and comes back */
  w.fluDay=1; w.READER=ANA; w.fluOpen();
  ok(w.fluPassage.sub===0 && w.FluPlace.get(ANA.id).sub===1,"coming back: same passage 1.0 again, next-up still 1.1 (not advanced twice)");
  w.fluBlob={fake:"new take"}; w.fluFinishSubmit(); await waitFor(function(){ return !w.FluRetry.get(ANA.id); });
  ok(!w.FluRetry.get(ANA.id),"saving the new cold read uses up the retry (exactly one)");
  ok(w.FluAttempts.forStudent(ANA.id).some(function(a){ return a.sub===0 && a.day===1; }),"the new cold read is saved as the real cold read of 1.0");
  w.FluCycle.set(ANA.id,1,"FIRST",0); w.fluOpen();
  ok(w.fluPassage.sub===1,"after that, the next cold read moves on to 1.1 as normal");
  /* the unlock that existed for ANOTHER passage is not changed by a reset either */
  var w2=boot({rf_g1_unlock:JSON.stringify({"stu_ana_p1|5":"QUJD"})}); openCold(w2,ANA,0,1); w2.fluBlob={x:1};
  var before=w2.localStorage.getItem("rf_g1_unlock"); typeReset(w2,TEST_PIN); await waitFor(function(){ return w2.FluResets.all().length===1; });
  ok(w2.localStorage.getItem("rf_g1_unlock")===before,"reset leaves existing unlocks exactly as they were");

  /* 4. UNSAVED take and in-progress RECORDING */
  w=boot(); openCold(w,ANA,2,3); w.fluBlob={fake:1};
  typeReset(w,TEST_PIN); await waitFor(function(){ return w.FluResets.all().length===1; });
  ok(w.FluResets.all()[0].stage==="unsaved" && w.fluBlob===null && w.FluResets.all()[0].day===3 && w.FluRetry.get(ANA.id).sub===2,"unsaved take on Day 3: discarded, logged, same passage");
  w=boot(); openCold(w,ANA,1,1); var stopped=0; w.recording=true; w.activeCtx="flu"; w.recorder={stop:function(){ stopped++; }};
  typeReset(w,TEST_PIN); await waitFor(function(){ return w.FluResets.all().length===1; });
  ok(w.FluResets.all()[0].stage==="recording" && stopped===1 && w.recording===false,"recording in progress: stopped and discarded");
  ok(w.g1rCancelled===true,"the stopped recording will be thrown away, not shown as a take");

  /* 5. teacher review shows the log */
  w=boot(); openCold(w,ANA,0,1); w.fluAttemptId=addAttempt(w,ANA,0,1); typeReset(w,TEST_PIN); await waitFor(function(){ return w.FluResets.all().length===1; });
  w.go("s-fluteach"); var box=el(w,"flut-resets").textContent;
  ok(/Cold-read resets/.test(box) && /Ana G\./.test(box) && /1\.0/.test(box) && /saved read discarded/.test(box),"teacher Fluency review lists the reset");

  /* 6. cannot check the PIN (file missing) -> says so, discards nothing */
  w=boot({},true); openCold(w,ANA,0,1); w.fluBlob={x:1}; typeReset(w,TEST_PIN); await waitFor(function(){ return /Could not check/.test(el(w,"flu-reset-msg").textContent); });
  ok(/Could not check the PIN/.test(el(w,"flu-reset-msg").textContent) && w.fluBlob && w.FluResets.all().length===0,"PIN file unreachable: no reset");
  /* Student View sandbox keeps its own log (never mixes with real data) */
  ok(/var FluResets=\(function\(\)\{\s*var KEY="rf_fluency_resets";[\s\S]*?vasK\(KEY\)/.test(src) && /var FluRetry=\(function\(\)\{\s*var KEY="rf_fluency_retry";[\s\S]*?vasK\(KEY\)/.test(src),"reset log and retry marker use the Student View sandbox keys");

  console.log("test-g1-cold-reset: "+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
})();
