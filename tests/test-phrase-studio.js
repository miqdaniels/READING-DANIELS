// recording-studio.html (Phrase Recording Studio) + recordings-list.js.
// Static ES5 checks, exact phrase data, teacher-only gate, every button by jsdom click,
// one mic permission for the whole session, auto-playback then advance, keyboard,
// filter, progress, IndexedDB-or-memory persistence, and the ZIP export contents.
const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./recording-studio.html','utf8');
const listSrc=fs.readFileSync('./recordings-list.js','utf8');
const index=fs.readFileSync('./index.html','utf8');

let pass=0,fail=0;
function ck(c,m){ if(c){pass++;} else {fail++; console.log("FAIL:",m);} }

// ---------- static checks ----------
ck(/<\/script><\/body><\/html>\s*$/.test(html),"studio ends with </script></body></html>");
function es5(src,label){
  const s=src.replace(/"(?:[^"\\\n]|\\.)*"/g,'""').replace(/'(?:[^'\\\n]|\\.)*'/g,"''");
  ck(s.indexOf("=>")<0,label+": no arrow functions");
  ck(!/(^|[;{}\s(])(const|let)\s+[A-Za-z_$]/.test(s),label+": no const/let");
  ck(!/`/.test(s),label+": no template literals");
}
es5(html.slice(html.indexOf("<script>"),html.lastIndexOf("</script>")),"studio script");
es5(listSrc,"recordings-list.js");
ck(index.indexOf("recording-studio.html?teacher")>-1,"teacher dashboard links to the studio");
// the dashboard tile sits inside #teacher-doors (only shown on ?teacher)
const doorsAt=index.indexOf('id="teacher-doors"'), tileAt=index.indexOf('id="tile-phrase-studio"');
ck(doorsAt>-1 && tileAt>doorsAt,"studio tile is inside the teacher-only dashboard");

// ---------- data ----------
const ALL=require('../recordings-list.js');
ck(ALL.length===200,"200 phrases total (Level 1 + Level 2)");
const LIST=ALL.filter(x=>x.level===1), LIST2=ALL.filter(x=>x.level===2);
ck(LIST.length===100,"100 Level 1 phrases");
ck(LIST2.length===100,"100 Level 2 phrases");
const ids={}; let dup=false; ALL.forEach(x=>{ if(ids[x.id]) dup=true; ids[x.id]=1; });
ck(!dup,"ids are unique");
ck(LIST[0].id==="L1_S01_P01" && LIST[99].id==="L1_S10_P10","ids run L1_S01_P01..L1_S10_P10");
LIST.forEach((x,i)=>{
  const s=Math.floor(i/10)+1, p=i%10+1;
  const want="L1_S"+(s<10?"0":"")+s+"_P"+(p<10?"0":"")+p;
  if(x.id!==want||x.set!=="1."+s||x.level!==1) ck(false,"id/set order at "+i);
  const frag=!/[.?!]$/.test(x.text);
  if(x.type!==(frag?"fragment":"sentence")) ck(false,"type for "+x.id);
  if(frag && x.text.charAt(0)!==x.text.charAt(0).toLowerCase()) ck(false,"fragment lowercase "+x.id);
});
const byId={}; LIST.forEach(x=>byId[x.id]=x);
ck(byId.L1_S01_P01.text==="the end of the day","fragment kept lowercase, no period");
ck(byId.L1_S01_P06.text==="a text from his mom" && byId.L1_S01_P06.type==="fragment","S01_P06 matches the slideshow (Mick, 2026-11-05)");
ck(byId.L1_S09_P04.text==="She came in first, and they all looked at her.","comma kept");
ck(byId.L1_S10_P08.text==="When I first came here, I did not know many people.","long phrase exact");
ck(LIST.filter(x=>x.type==="fragment").length===14,"14 fragments");
// Level 2: approved list (Mick + team review, 2026-11-05)
ck(LIST2[0].id==="L2_S01_P01" && LIST2[99].id==="L2_S10_P10","ids run L2_S01_P01..L2_S10_P10");
LIST2.forEach((x,i)=>{
  const s=Math.floor(i/10)+1, p=i%10+1;
  const want="L2_S"+(s<10?"0":"")+s+"_P"+(p<10?"0":"")+p;
  if(x.id!==want||x.set!=="2."+s) ck(false,"L2 id/set order at "+i);
  const frag=!/[.?!]$/.test(x.text);
  if(x.type!==(frag?"fragment":"sentence")) ck(false,"L2 type for "+x.id);
  if(frag && x.text.charAt(0)!==x.text.charAt(0).toLowerCase() && x.text.indexOf("I ")!==0) ck(false,"L2 fragment lowercase "+x.id);
});
const b2={}; LIST2.forEach(x=>b2[x.id]=x);
ck(b2.L2_S01_P01.text==="just the two of us" && b2.L2_S01_P01.type==="fragment","L2 fragment stays lowercase, no period");
ck(b2.L2_S01_P03.text==="What do you think?","L2 question mark kept");
ck(b2.L2_S01_P07.text==="an old phone","L2_S01_P07 = an old phone");
ck(b2.L2_S02_P10.text==="because I said so" && b2.L2_S02_P10.type==="fragment","fragment with I stays a fragment");
ck(b2.L2_S09_P01.text==="I can hear you, but I cannot see you.","cannot");
ck(b2.L2_S10_P08.text==="Before I came here, I did not live in a big house.","big house swap");
ck(b2.L2_S10_P10.text==="Because we play together, we are good friends.","Because opener");
ck(LIST2.filter(x=>x.type==="fragment").length===24,"24 Level 2 fragments");

// ---------- harness ----------
function make(url){
  const page=html.replace('<script src="recordings-list.js"></script>','<script>'+listSrc+'</script>');
  const dom=new JSDOM(page,{url:url,runScripts:"dangerously",pretendToBeVisual:true,
    beforeParse(w){
      w.__gum=0; w.__played=[]; w.__downloads=[];
      w.navigator.mediaDevices={getUserMedia:function(){ w.__gum++; return Promise.resolve({fake:"stream"}); }};
      function MR(stream,opts){ this.stream=stream; this.mimeType=(opts&&opts.mimeType)||"audio/webm"; this.state="inactive"; }
      MR.isTypeSupported=function(t){ return t==="audio/webm;codecs=opus"||t==="audio/webm"; };
      MR.prototype.start=function(){ this.state="recording"; w.__lastRec=this; };
      MR.prototype.stop=function(){ var me=this; this.state="inactive";
        if(me.ondataavailable){ me.ondataavailable({data:new w.Blob(["take-"+(++w.__takeN)],{type:"audio/webm"})}); }
        setTimeout(function(){ if(me.onstop){ me.onstop(); } },0); };
      w.__takeN=0;
      w.MediaRecorder=MR;
      w.Audio=function(url){ var a={src:url,paused:true,onended:null,
        play:function(){ a.paused=false; w.__played.push(url); w.__lastAudio=a; return Promise.resolve(); },
        pause:function(){ a.paused=true; }}; return a; };
      w.URL.createObjectURL=function(b){ w.__lastBlob=b; return "blob:"+Math.random(); };
      w.URL.revokeObjectURL=function(){};
      w.HTMLAnchorElement.prototype.click=function(){ w.__downloads.push({name:this.download,blob:w.__lastBlob}); };
    }
  });
  return dom.window;
}
const tick=()=>new Promise(r=>setTimeout(r,5));
function click(w,id){ const el=w.document.getElementById(id); if(!el){ ck(false,"missing #"+id); return; } el.dispatchEvent(new w.MouseEvent("click",{bubbles:true})); }
function key(w,k,code,rep){ w.document.dispatchEvent(new w.KeyboardEvent("keydown",{key:k,keyCode:code,repeat:!!rep,bubbles:true,cancelable:true})); }
const active=w=>{ const a=w.document.querySelector(".screen.active"); return a&&a.id; };
const txt=(w,id)=>w.document.getElementById(id).textContent;
function endPlayback(w){ const a=w.__lastAudio; if(a&&a.onended) a.onended(); }

// read a stored ZIP back (stored method only)
async function readZip(blob,w){
  const ab=await new Promise((res,rej)=>{ const fr=new w.FileReader(); fr.onload=()=>res(fr.result); fr.onerror=rej; fr.readAsArrayBuffer(blob); });
  const buf=new Uint8Array(ab), dv=new DataView(buf.buffer), out={};
  let p=0;
  while(dv.getUint32(p,true)===0x04034b50){
    const size=dv.getUint32(p+18,true), nlen=dv.getUint16(p+26,true);
    const name=Buffer.from(buf.slice(p+30,p+30+nlen)).toString('utf8');
    out[name]=Buffer.from(buf.slice(p+30+nlen,p+30+nlen+size)).toString('utf8');
    p+=30+nlen+size;
  }
  return out;
}

(async function(){
  // ----- teacher gate -----
  let w=make("https://miqdaniels.github.io/READING-DANIELS/recording-studio.html");
  await w.rsReady; await tick();
  ck(active(w)==="rs-locked","no ?teacher -> locked screen");
  ck(w.document.getElementById("rs-levels").innerHTML==="","no pickers painted for students");

  w=make("https://miqdaniels.github.io/READING-DANIELS/recording-studio.html?teacher");
  await w.rsReady; await tick();
  ck(w.RS_STOP_TAIL_MS===500,"stop keeps recording 0.5 s by default");
  w.RS_STOP_TAIL_MS=0;   // walkthrough below runs without the tail; tail has its own section
  ck(active(w)==="rs-pick","?teacher -> pick screen");
  ck(txt(w,"rs-progress")==="0 of 100 recorded","progress starts 0 of 100");
  ck(w.document.querySelectorAll("#rs-levels button").length===2,"two level buttons (Level 1, Level 2)");
  ck(w.document.querySelectorAll("#rs-sets button").length===10,"10 set buttons");
  ck(txt(w,"rs-set-1-10").indexOf("Set 1.10")===0,"Set 1.10 sorts last and is labeled");
  ck(w.document.querySelectorAll("#rs-sets button")[9].id==="rs-set-1-10","set order 1.1..1.10");
  click(w,"rs-level-1"); ck(active(w)==="rs-pick","level click keeps pick screen");
  click(w,"rs-export-all"); await tick();
  ck(/Nothing recorded/.test(txt(w,"rs-pick-note")) && w.__downloads.length===0,"Export All with nothing says so, no file");

  // ----- open Set 1.4 -----
  click(w,"rs-set-1-4"); await tick();
  ck(active(w)==="rs-record","set click -> record screen");
  ck(txt(w,"rs-where")==="Set 1.4","header says Set 1.4");
  ck(txt(w,"rs-phrase")==="my phone number","first phrase shown big");
  ck(txt(w,"rs-count")==="1 of 10","1 of 10");
  ck(w.document.getElementById("rs-listen").disabled,"Listen disabled before a take");
  ck(w.document.getElementById("rs-rerecord").disabled,"Re-record disabled before a take");
  ck(w.document.getElementById("rs-back").disabled,"Back disabled on first phrase");
  ck(w.document.querySelectorAll("#rs-list li button").length===10,"list view has 10 rows");

  // ----- record with the mic button -----
  click(w,"rs-mic"); await tick();
  ck(w.RS.recording===true,"mic click starts recording");
  ck(w.document.getElementById("rs-mic").className.indexOf("rec")>-1,"mic shows recording state");
  ck(w.document.getElementById("rs-next").disabled,"Next locked while recording");
  ck(w.__lastRec.mimeType==="audio/webm;codecs=opus","records webm/opus");
  click(w,"rs-mic"); await tick(); await tick();
  ck(w.RS.recording===false,"second mic click stops");
  ck(w.document.getElementById("rs-mic").className==="ico ico-mic","mic back to gray");
  ck(!!w.RS.takes.L1_S04_P01,"take saved for L1_S04_P01");
  ck(w.__played.length===1,"auto-plays the take once");
  ck(txt(w,"rs-phrase")==="my phone number","stays on phrase during playback");
  endPlayback(w); await tick();
  ck(txt(w,"rs-phrase")==="no way out","after playback -> next phrase");
  ck(txt(w,"rs-progress")==="1 of 100 recorded","progress 1 of 100");
  ck(w.document.getElementById("rs-row-L1_S04_P01").textContent.indexOf("✓")>-1,"checkmark in list");

  // ----- keyboard: spacebar record, held key ignored, arrows -----
  key(w," ",32); await tick();
  ck(w.RS.recording===true,"Spacebar starts recording");
  key(w," ",32,true); await tick();
  ck(w.RS.recording===true,"held Spacebar (repeat) ignored");
  key(w,"ArrowRight",39); ck(txt(w,"rs-phrase")==="no way out","Right arrow ignored while recording");
  key(w," ",32); await tick(); await tick();
  ck(!!w.RS.takes.L1_S04_P02,"Spacebar stop saves L1_S04_P02");
  endPlayback(w); await tick();
  ck(txt(w,"rs-phrase")==="Who called you?","advanced to phrase 3");
  key(w,"ArrowLeft",37); ck(txt(w,"rs-phrase")==="no way out","Left arrow = back");
  key(w,"ArrowRight",39); ck(txt(w,"rs-phrase")==="Who called you?","Right arrow = next");
  ck(w.__gum===1,"mic permission asked only ONCE for many takes");

  // ----- Back / Next buttons, Listen, Re-record -----
  click(w,"rs-back"); ck(txt(w,"rs-phrase")==="no way out","Back button");
  ck(!w.document.getElementById("rs-listen").disabled,"Listen enabled on recorded phrase");
  const before=w.__played.length;
  click(w,"rs-listen"); await tick();
  ck(w.__played.length===before+1,"Listen plays the take");
  endPlayback(w); await tick();
  ck(txt(w,"rs-phrase")==="no way out","manual Listen does NOT advance");
  const oldBlob=w.RS.takes.L1_S04_P02.blob;
  click(w,"rs-rerecord"); await tick();
  ck(w.RS.recording===true,"Re-record starts recording");
  click(w,"rs-mic"); await tick(); await tick();
  ck(w.RS.takes.L1_S04_P02.blob!==oldBlob,"Re-record replaces the old take");
  ck(Object.keys(w.RS.takes).length===2,"still 2 takes (replaced, not added)");
  endPlayback(w); await tick();
  click(w,"rs-next"); ck(txt(w,"rs-phrase")==="Come sit down with us.","Next button");

  // ----- tapping mic during auto-playback cancels advance -----
  click(w,"rs-mic"); await tick(); click(w,"rs-mic"); await tick(); await tick();
  ck(!!w.RS.takes.L1_S04_P04,"recorded P04");
  const pend=w.__lastAudio;
  click(w,"rs-mic"); await tick();            // re-take right away during playback
  ck(w.RS.recording===true && pend.paused,"mic during playback stops playback and records");
  if(pend.onended) pend.onended(); await tick();
  ck(txt(w,"rs-phrase")==="Come sit down with us.","stale playback does not advance");
  click(w,"rs-mic"); await tick(); await tick(); endPlayback(w); await tick();
  ck(txt(w,"rs-phrase")==="the first day of school","advance after the fresh take");

  // ----- jump from list, filter -----
  click(w,"rs-row-L1_S04_P09");
  ck(txt(w,"rs-phrase")==="You may come with us.","list row jumps to phrase");
  const f=w.document.getElementById("rs-filter"); f.checked=true; f.dispatchEvent(new w.Event("change",{bubbles:true}));
  ck(w.document.querySelectorAll("#rs-list li button").length===7,"filter shows only 7 not-yet-recorded");
  click(w,"rs-row-L1_S04_P05"); click(w,"rs-back");
  ck(txt(w,"rs-phrase")==="Who called you?","with filter on, Back skips recorded P04 to unrecorded P03");
  click(w,"rs-back"); ck(txt(w,"rs-phrase")==="Who called you?","no unrecorded phrase before it -> stays");
  ck(w.document.getElementById("rs-back").disabled,"Back disabled when nothing earlier is unrecorded");
  f.checked=false; f.dispatchEvent(new w.Event("change",{bubbles:true}));
  ck(w.document.querySelectorAll("#rs-list li button").length===10,"filter off shows all 10");

  // ----- last phrase: no advance past end -----
  click(w,"rs-row-L1_S04_P10");
  ck(w.document.getElementById("rs-next").disabled,"Next disabled on last phrase");
  click(w,"rs-mic"); await tick(); click(w,"rs-mic"); await tick(); await tick(); endPlayback(w); await tick();
  ck(txt(w,"rs-phrase")==="It made my day.","stays on last phrase after its take");
  ck(/still need a recording/.test(txt(w,"rs-status")),"end-of-set message counts what is left");

  // ----- Export Set ZIP -----
  click(w,"rs-export-set"); await new Promise(r=>setTimeout(r,30));
  const dl=w.__downloads[w.__downloads.length-1];
  ck(dl && dl.name==="L1_S04_recordings.zip","Export Set file name");
  const z=await readZip(dl.blob,w);
  const names=Object.keys(z).sort();
  ck(names.join(",")==="L1_S04_P01.webm,L1_S04_P02.webm,L1_S04_P04.webm,L1_S04_P10.webm,manifest.json","ZIP holds files named by id + manifest");
  const man=JSON.parse(z["manifest.json"]);
  ck(man.count===4 && man.items[0].text==="my phone number","manifest lists ids and text");
  ck(/^take-\d+$/.test(z["L1_S04_P01.webm"]),"audio bytes intact in ZIP");
  ck(/Exported 4 of 10/.test(txt(w,"rs-note")),"export note");

  // ----- Sets button back to pick, counts show -----
  click(w,"rs-record") ; // harmless
  w.document.querySelector("#rs-record .topbar .btn").dispatchEvent(new w.MouseEvent("click",{bubbles:true}));
  ck(active(w)==="rs-pick","Sets button -> pick screen");
  ck(/4 of 10 recorded/.test(txt(w,"rs-set-1-4")),"Set 1.4 card shows 4 of 10");
  ck(txt(w,"rs-progress")==="4 of 100 recorded","overall progress 4 of 100");
  click(w,"rs-export-all"); await new Promise(r=>setTimeout(r,30));
  const all=w.__downloads[w.__downloads.length-1];
  ck(all.name==="Phrase_recordings_all.zip","Export All file name");
  ck(Object.keys(await readZip(all.blob,w)).length===5,"Export All = 4 takes + manifest");

  // ----- Level 2 picker, progress, Export Set name -----
  click(w,"rs-level-2"); await tick();
  ck(w.document.querySelectorAll("#rs-sets button").length===10,"Level 2 shows 10 set buttons");
  ck(w.document.querySelectorAll("#rs-sets button")[0].id==="rs-set-2-1" && w.document.querySelectorAll("#rs-sets button")[9].id==="rs-set-2-10","Level 2 sets 2.1..2.10 in order");
  ck(txt(w,"rs-progress")==="0 of 100 recorded","Level 2 progress counts only Level 2");
  click(w,"rs-set-2-1"); await tick();
  ck(txt(w,"rs-where")==="Set 2.1" && txt(w,"rs-phrase")==="just the two of us","Set 2.1 opens on its first phrase");
  // ----- the 0.5 s stop tail (real timer) -----
  w.RS_STOP_TAIL_MS=500;
  click(w,"rs-mic"); await tick();
  ck(w.RS.recording===true,"L2 record starts");
  click(w,"rs-mic"); await tick();
  ck(w.RS.stopping===true && w.__lastRec.state==="recording","after Stop, still recording during the tail");
  ck(w.document.getElementById("rs-mic").className.indexOf("rec")>-1,"mic stays red during the tail");
  ck(/Finishing/.test(txt(w,"rs-status")),"status says Finishing");
  click(w,"rs-mic"); key(w," ",32); await tick();
  ck(w.RS.stopping===true && !w.RS.takes.L2_S01_P01,"extra taps during the tail are ignored (no new take)");
  ck(txt(w,"rs-phrase")==="just the two of us","still on the same phrase during the tail");
  await new Promise(r=>setTimeout(r,300));
  ck(w.__lastRec.state==="recording","still recording at 0.3 s");
  await new Promise(r=>setTimeout(r,300)); await tick();
  ck(w.RS.recording===false && w.RS.stopping===false && w.__lastRec.state==="inactive","recorder stops after 0.5 s");
  ck(!!w.RS.takes.L2_S01_P01,"tail take saved as L2_S01_P01");
  ck(w.document.getElementById("rs-mic").className==="ico ico-mic","mic back to gray after the tail");
  endPlayback(w); await tick();
  ck(txt(w,"rs-phrase")==="It went well.","advances to L2_S01_P02 after playback");
  // Spacebar stop also gets the tail
  key(w," ",32); await tick(); key(w," ",32); await tick();
  ck(w.RS.stopping===true && w.__lastRec.state==="recording","Spacebar stop also keeps recording during the tail");
  await new Promise(r=>setTimeout(r,560)); await tick();
  ck(!!w.RS.takes.L2_S01_P02,"Spacebar tail take saved");
  endPlayback(w); await tick();
  ck(txt(w,"rs-progress")==="2 of 100 recorded","Level 2 progress 2 of 100");
  // leaving the screen during the tail keeps the take
  click(w,"rs-mic"); await tick(); click(w,"rs-mic"); await tick();
  w.document.querySelector("#rs-record .topbar .btn").dispatchEvent(new w.MouseEvent("click",{bubbles:true})); await tick(); await tick();
  ck(!!w.RS.takes.L2_S01_P03 && w.RS.stopping===false,"leaving during the tail still keeps the take");
  click(w,"rs-set-2-1"); await tick();
  click(w,"rs-export-set"); await new Promise(r=>setTimeout(r,30));
  const dl2=w.__downloads[w.__downloads.length-1];
  ck(dl2 && dl2.name==="L2_S01_recordings.zip","Level 2 Export Set file name");
  const z2=await readZip(dl2.blob,w);
  ck(Object.keys(z2).sort().join(",")==="L2_S01_P01.webm,L2_S01_P02.webm,L2_S01_P03.webm,manifest.json","L2 ZIP = 3 takes + manifest");
  ck(JSON.parse(z2["manifest.json"]).items[1].text==="It went well.","L2 manifest text exact");
  ck(!!w.RS.takes.L1_S04_P01 && !!w.RS.takes.L1_S04_P10,"Level 1 takes untouched by Level 2 work");
  click(w,"rs-level-1"); ck(txt(w,"rs-progress")==="4 of 100 recorded","Level 1 progress still 4 of 100");

  // ----- persistence: jsdom has no IndexedDB -> memory fallback, and it warns -----
  ck(w.RSStore.isMemory()===true,"memory fallback used in jsdom");
  ck(w.document.getElementById("rs-memwarn").style.display==="block","warns when storage is not available");
  const got=await w.RSStore.all();
  ck(got.length===7,"store holds every take (4 Level 1 + 3 Level 2)");

  // ----- persistence with a fake IndexedDB survives a reload -----
  const fakeDB={};
  function fakeIDB(w2){
    w2.indexedDB={open:function(){ var r={}; setTimeout(function(){
      var db={transaction:function(){ var t={objectStore:function(){ return {
        put:function(rec){ fakeDB[rec.id]=rec; setTimeout(function(){ t.oncomplete&&t.oncomplete(); },0); },
        getAll:function(){ var q={}; setTimeout(function(){ q.result=Object.keys(fakeDB).map(function(k){return fakeDB[k];}); q.onsuccess&&q.onsuccess(); },0); return q; }
      }; }}; return t; }, createObjectStore:function(){} };
      r.result=db; r.onupgradeneeded&&r.onupgradeneeded(); r.onsuccess&&r.onsuccess(); },0); return r; }};
  }
  let w2=make("https://miqdaniels.github.io/READING-DANIELS/recording-studio.html?teacher");
  // indexedDB must exist before boot -> rebuild with it injected
  const page=html.replace('<script src="recordings-list.js"></script>','<script>'+listSrc+'</script>');
  function makeIDB(){ return new JSDOM(page,{url:"https://miqdaniels.github.io/READING-DANIELS/recording-studio.html?teacher",runScripts:"dangerously",
    beforeParse(x){ fakeIDB(x); x.navigator.mediaDevices={getUserMedia:function(){return Promise.resolve({});}};
      function MR(){ this.mimeType="audio/webm"; } MR.isTypeSupported=function(){return true;};
      MR.prototype.start=function(){}; MR.prototype.stop=function(){ var me=this; me.ondataavailable({data:new x.Blob(["k"])}); setTimeout(function(){me.onstop();},0); };
      x.MediaRecorder=MR; x.Audio=function(){ return {play:function(){return Promise.resolve();},pause:function(){}}; };
      x.URL.createObjectURL=function(){return "blob:y";}; x.URL.revokeObjectURL=function(){}; }}).window; }
  w2=makeIDB(); await w2.rsReady; await tick(); w2.RS_STOP_TAIL_MS=0;
  click(w2,"rs-set-1-7"); await tick();
  click(w2,"rs-mic"); await tick(); click(w2,"rs-mic"); await tick(); await tick(); await tick();
  ck(!!fakeDB.L1_S07_P01 && w2.RSStore.isMemory()===false,"take written to IndexedDB");
  const w3=makeIDB(); await w3.rsReady; await tick(); await tick();
  ck(txt(w3,"rs-progress")==="1 of 100 recorded","after reload, the take is still there");
  ck(/1 of 10 recorded/.test(txt(w3,"rs-set-1-7")),"set card remembers it");

  console.log("test-phrase-studio: "+pass+" passed, "+fail+" failed");
  if(fail) process.exit(1);
})().catch(e=>{ console.log("CRASH",e); process.exit(1); });
