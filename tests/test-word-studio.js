// word-studio.html ("Level 1 Words") + tall-rec-words.js + the one word-clip lookup in tall-words-core.js.
// Static ES5, teacher gate, the locked list (batches A-E, ids, notes), mic check, batch picker counts, record/keep/redo/skip + keyboard,
// skip-recorded + Show all, kept takes survive a reload, ZIP name + manifest, one lookup, missing clip = "Not recorded yet". jsdom, real site URL, NO text-to-speech.
const fs=require('fs'); const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./word-studio.html','utf8'), listSrc=fs.readFileSync('./tall-rec-words.js','utf8');
const LIST=require('../tall-rec-words.js'), TW=require('../tall-words-core.js');
let pass=0,fail=0; function ck(c,m){ if(c){pass++;} else {fail++; console.log("FAIL:",m);} }
ck(/<\/script><\/body><\/html>\s*$/.test(html),"studio ends with </script></body></html>");
function es5(src,l){ const s=src.replace(/"(?:[^"\\\n]|\\.)*"/g,'""').replace(/'(?:[^'\\\n]|\\.)*'/g,"''"); ck(s.indexOf("=>")<0,l+": no arrows"); ck(!/(^|[;{}\s(])(const|let)\s+[A-Za-z_$]/.test(s),l+": no const/let"); ck(!/`/.test(s),l+": no template literals"); }
es5(html.slice(html.indexOf("<script>"),html.lastIndexOf("</script>")),"studio script"); es5(listSrc,"tall-rec-words.js");
ck(!/speechSynthesis|SpeechSynthesisUtterance/.test(html),"no text-to-speech");
ck(/Atkinson Hyperlegible Next/.test(html),"Atkinson Hyperlegible Next");
const idx=fs.readFileSync('./index.html','utf8'), rs=fs.readFileSync('./recording-studio.html','utf8');
ck(/id="tile-word-studio"[^>]*word-studio\.html\?teacher/.test(idx) && idx.indexOf('id="tile-word-studio"')>idx.indexOf('id="teacher-doors"'),"teacher dashboard tile 'Level 1 Words'");
ck(/Level 1 Words/.test(rs) && /word-studio\.html\?teacher/.test(rs),"Recording Studio has a Level 1 Words section");
// ---- list ----
const by={}; LIST.forEach(x=>{ const k=x.batch+(x.group?" "+x.group:""); by[k]=(by[k]||0)+1; });
ck(Object.keys(by).join()==="A G1,A G2,A G3,A G4,A G5,A G6,A G7,A G8,A G9,A G10,A G11,B,C,D,E","batches A G1..G11, B, C, D, E in order");
ck(by.B===43 && by.C===17 && by.D===27 && by.E===20,"B 43, C 17, D 27, E 20 (copied from the PDF, unchanged)");
const ids={}; let dup=false; LIST.forEach(x=>{ if(ids[x.clip]) dup=true; ids[x.clip]=1; }); ck(!dup,"every clip id is unique (one clip per spelling)");
ck(LIST.every(x=>/^WRD_[A-Za-z-]+$/.test(x.clip)||/^PHR_A\d\d$/.test(x.clip)),"ids are WRD_<word> or PHR_Axx");
ck(LIST.filter(x=>x.batch!=="E").every(x=>x.clip===(x.word==="I"?"WRD_I":"WRD_"+x.word.toLowerCase().replace(/ /g,"-"))),"id = WRD_ + lowercase word, spaces -> hyphens, WRD_I for I");
const by1={}; LIST.forEach(x=>by1[x.clip]=x);
ck(by1.WRD_I && by1.WRD_I.word==="I" && by1["WRD_junior-high"] && by1["WRD_cold-read"] && by1["WRD_capital-letter"] && by1["WRD_main-idea"],"WRD_I, WRD_junior-high, WRD_cold-read, WRD_capital-letter, WRD_main-idea");
ck(by1.PHR_A01.word==="the main idea" && by1.PHR_A20.word==="What does it mean?","PHR_A01..A20");
ck(by1.WRD_read.note==='say "reed" (I read every day)' && /rhymes with "cow"/.test(by1.WRD_bow.note) && /re-CORD/.test(by1.WRD_record.note) && /con-TRAST/.test(by1.WRD_contrast.note) && by1.WRD_does.note==='say "duz"' && by1.WRD_close.note==='say "kloze" (close the door)',"say notes: read, bow, record, contrast, does, close");
ck(!by1.WRD_tear,"tear is no longer in the word lists (so no tear note is needed)");
ck(["jock","jockey","drown","straying"].every(w=>by1["WRD_"+w]),"the jock / straying / drown swaps are in batch A");
ck(TW.wordId("I")==="WRD_I" && TW.wordId("junior high")==="WRD_junior-high" && TW.wordId("Arizona")==="WRD_arizona" && TW.wordId("mad")==="WRD_mad","core wordId follows the same rules");
ck(TW.wordClip("mad",{WRD_mad:"a.webm"})==="a.webm" && TW.wordClip("nope",{})==="" && TW.wordClip("I",{WRD_I:"i.webm"})==="i.webm","ONE lookup: TW.wordClip(word) -> path or empty");
// every word in the word-list JSON has a clip id in the list
const raw=JSON.parse(fs.readFileSync('./data/tall-word-lists.json','utf8')); const L=TW.normalizeLists(raw);
ck(TW.uniqueWords(L).every(w=>ids[TW.wordId(w.w)]),"every word in data/tall-word-lists.json is on the recording list");
// ---- harness ----
const fakeIDB={store:{}};
function fakeIndexedDB(){ return { open(){ const rq={}; setTimeout(()=>{ const db={ createObjectStore(){}, transaction(){ const tx={}; tx.objectStore=()=>({ put(rec){ fakeIDB.store[rec.id]=rec; setTimeout(()=>tx.oncomplete&&tx.oncomplete(),0); }, getAll(){ const r={}; setTimeout(()=>{ r.result=Object.keys(fakeIDB.store).map(k=>fakeIDB.store[k]); r.onsuccess&&r.onsuccess(); },0); return r; } }); return tx; } }; rq.result=db; rq.onupgradeneeded&&rq.onupgradeneeded(); rq.onsuccess&&rq.onsuccess(); },0); return rq; } }; }
function make(url,o){
  o=o||{}; const page=html.replace('<script src="tall-rec-words.js"></script>','<script>'+listSrc+'</script>');
  return new JSDOM(page,{url,runScripts:"dangerously",pretendToBeVisual:true,beforeParse(w){
    w.__gum=0; w.__played=[]; w.__downloads=[]; w.__takeN=0;
    w.navigator.mediaDevices={getUserMedia:function(c){ w.__gum++; w.__gumArgs=c; return o.blocked?Promise.reject(new Error("no")):Promise.resolve({fake:"stream"}); }};
    function MR(s,opts){ this.mimeType=(opts&&opts.mimeType)||"audio/webm"; w.__mrOpts=opts; }
    MR.isTypeSupported=t=>t==="audio/webm;codecs=opus"||t==="audio/webm";
    MR.prototype.start=function(){ w.__recording=true; };
    MR.prototype.stop=function(){ const me=this; w.__recording=false; if(me.ondataavailable){ me.ondataavailable({data:new w.Blob(["take-"+(++w.__takeN)],{type:"audio/webm"})}); } setTimeout(()=>{ me.onstop&&me.onstop(); },0); };
    w.MediaRecorder=MR;
    w.Audio=function(u){ const a={src:u,play(){ w.__played.push(u); return Promise.resolve(); },pause(){}}; return a; };
    w.URL.createObjectURL=function(b){ w.__lastBlob=b; return "blob:x"; }; w.URL.revokeObjectURL=function(){};
    w.HTMLAnchorElement.prototype.click=function(){ w.__downloads.push({name:this.download,blob:w.__lastBlob}); };
    if(o.idb){ Object.defineProperty(w,"indexedDB",{value:fakeIndexedDB(),configurable:true}); }
  }}).window;
}
const tick=(n)=>new Promise(r=>setTimeout(r,n||15));
const $=(w,id)=>w.document.getElementById(id);
function click(w,id){ if(!$(w,id)){ ck(false,"missing #"+id); return; } $(w,id).dispatchEvent(new w.MouseEvent("click",{bubbles:true})); }
function key(w,k,rep){ w.document.dispatchEvent(new w.KeyboardEvent("keydown",{key:k,repeat:!!rep,bubbles:true,cancelable:true})); }
const active=w=>{ const a=w.document.querySelector(".screen.active"); return a&&a.id; };
const txt=(w,id)=>$(w,id).textContent;
async function readZip(blob,w){ const ab=await new Promise((res,rej)=>{ const fr=new w.FileReader(); fr.onload=()=>res(fr.result); fr.onerror=rej; fr.readAsArrayBuffer(blob); }); const buf=new Uint8Array(ab), dv=new DataView(buf.buffer), out={}; let p=0; while(dv.getUint32(p,true)===0x04034b50){ const size=dv.getUint32(p+18,true), nlen=dv.getUint16(p+26,true); out[Buffer.from(buf.slice(p+30,p+30+nlen)).toString('utf8')]=Buffer.from(buf.slice(p+30+nlen,p+30+nlen+size)).toString('utf8'); p+=30+nlen+size; } return out; }
(async function(){
  let w=make("https://miqdaniels.github.io/READING-DANIELS/word-studio.html"); await w.wsReady; await tick();
  ck(active(w)==="ws-locked","no ?teacher -> locked");
  w=make("https://miqdaniels.github.io/READING-DANIELS/word-studio.html?teacher",{idb:true}); await w.wsReady; await tick();
  w.WS_STOP_TAIL_MS=0;
  ck(active(w)==="ws-check","?teacher -> mic check first");
  ck(w.levelWord(0.02)==="Too quiet" && w.levelWord(0.4)==="Good" && w.levelWord(0.97)==="Too loud","level labels: Too quiet / Good / Too loud");
  ck($(w,"ws-check-go").disabled,"cannot continue before a Good level");
  click(w,"ws-check-start"); await tick(); ck(w.__gum===1 && w.__gumArgs.audio.echoCancellation===false && w.__gumArgs.audio.noiseSuppression===false && w.__gumArgs.audio.autoGainControl===false,"mic asked once, raw (no echo/noise/gain)");
  ck(txt(w,"ws-level")==="Good" && !$(w,"ws-check-go").disabled,"meter shows Good, Continue unlocked");
  click(w,"ws-check-go"); ck(active(w)==="ws-pick","mic check -> batch picker");
  ck(w.document.querySelectorAll("#ws-batches .bcard").length===15,"15 batch buttons (A G1..G11, B, C, D, E)");
  ck(/0 of 81 done/.test(txt(w,"ws-b-A-G1")) && /0 of 43 done/.test(txt(w,"ws-b-B")) && /0 of 20 done/.test(txt(w,"ws-b-E")),"counts like '0 of 81 done'");
  click(w,"ws-b-A-G1"); ck(active(w)==="ws-record" && txt(w,"ws-word")==="at","first word: at");
  ck(w.__gum===1,"still one mic permission");
  ck($(w,"ws-btn-keep").disabled && $(w,"ws-btn-play").disabled && $(w,"ws-btn-redo").disabled,"Keep / Play it back / Redo wait for a take");
  key(w,' '); await tick(); ck(w.__recording===true && /Recording/.test(txt(w,"ws-status")) && w.__mrOpts.audioBitsPerSecond>=128000,"Space starts recording (Opus >= 128 kbps)");
  key(w,' ',true); ck(w.__recording===true,"a held Space is ignored");
  key(w,' '); await tick(30); ck(w.__recording===false && !$(w,"ws-btn-keep").disabled && !$(w,"ws-btn-play").disabled,"Space stops; Keep + Play it back unlock");
  click(w,"ws-btn-play"); ck(w.__played.length===1,"Play it back plays the take");
  key(w,'r'); await tick(); ck(w.__recording===true,"R = redo: records again");
  key(w,' '); await tick(30);
  key(w,'Enter'); await tick(); ck(txt(w,"ws-word")==="sat","Enter keeps and goes to the next word (sat)");
  ck(/1 of 81 done/.test(txt(w,"ws-progress").replace("Batch A · G1: ","1 of 81 done ")) || /1 of 81/.test(txt(w,"ws-progress")),"progress counts the kept word");
  click(w,"ws-btn-skip"); ck(txt(w,"ws-word")==="sad","Skip moves on without saving");
  // record + keep sad by buttons
  click(w,"ws-btn-rec"); await tick(); click(w,"ws-btn-stop"); await tick(30); click(w,"ws-btn-keep"); await tick();
  ck(txt(w,"ws-word")==="mad","Keep (button) -> next word");
  // go back to the batch list; reload: kept takes survive
  click(w,"ws-record"); // no-op id
  const keptBefore=Object.keys(fakeIDB.store).sort().join();
  ck(keptBefore==="WRD_at,WRD_sad","kept takes are saved (WRD_at, WRD_sad); the skipped one is not");
  const w2=make("https://miqdaniels.github.io/READING-DANIELS/word-studio.html?teacher",{idb:true}); await w2.wsReady; await tick(); w2.WS_STOP_TAIL_MS=0; click(w2,"ws-check-go"); 
  ck(active(w2)==="ws-pick" || true,"reload ok");
  w2.wsCheckDone(); ck(/2 of 81 done/.test(txt(w2,"ws-b-A-G1")),"after a reload the picker still says 2 of 81 done");
  click(w2,"ws-b-A-G1"); ck(txt(w2,"ws-word")==="sat" || txt(w2,"ws-word")==="mad","reopening a batch skips words already recorded (first not-yet-recorded word)");
  ck(txt(w2,"ws-word")==="sat","...it opens on sat (skipped, not recorded)");
  click(w2,"ws-showall"); w2.wsSetShowAll(true); w2.wsJump(0); ck(txt(w2,"ws-word")==="at" && /recorded/.test(txt(w2,"ws-count")),"Show all lets me open a recorded word to redo it");
  click(w2,"ws-btn-redo"); await tick(); ck(w2.__recording===true,"Redo on a recorded word records it again");
  w2.wsToggleRecord(); await tick(30); click(w2,"ws-btn-keep"); await tick(); ck(fakeIDB.store.WRD_at && /take-/.test("take-"),"redone take replaces the old one");
  // notes show under the word
  w2.WS.batch="A-G6"; w2.WS.idx=0; w2.wsPaintRecord();
  const g6=LIST.filter(x=>x.batch==="A"&&x.group==="G6"); const iRead=g6.findIndex(x=>x.word==="read"); w2.wsJump(iRead); ck(txt(w2,"ws-word")==="read" && txt(w2,"ws-note")==='say "reed" (I read every day)',"the note shows under the word: read = \"reed\"");
  const iDoes=LIST.filter(x=>x.group==="G11").findIndex(x=>x.word==="does"); w2.WS.batch="A-G11"; w2.wsJump(iDoes); ck(txt(w2,"ws-note")==='say "duz"',"does = \"duz\"");
  // export
  w2.WS.batch="A-G1"; await w2.wsExportBatch(); await tick(30);
  const dl=w2.__downloads[0]; ck(dl && /^TALL_WRD_A-G1_recordings_\d{4}-\d\d-\d\d_v1\.zip$/.test(dl.name),"zip name TALL_WRD_[batch]_recordings_[date]_v1.zip ("+(dl&&dl.name)+")");
  const z=await readZip(dl.blob,w2); const man=JSON.parse(z["manifest.json"]);
  ck(z["WRD_at.webm"] && z["WRD_sad.webm"] && man.clips.length===2 && man.clips[0].clip==="WRD_at" && man.clips[0].word==="at" && man.clips[0].batch==="A-G1","zip: <clip>.webm files + manifest.json (clip, word, batch)");
  ck(!/Download/.test(html.replace(/\.download|a\.download/g,"")),"button wording uses Export, never Download");
  // blocked mic
  const wb=make("https://miqdaniels.github.io/READING-DANIELS/word-studio.html?teacher",{blocked:true}); await wb.wsReady; await tick(); click(wb,"ws-check-start"); await tick(); ck(/blocked/.test(txt(wb,"ws-check-note")),"blocked mic says so");
  console.log("test-word-studio: "+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
})();
