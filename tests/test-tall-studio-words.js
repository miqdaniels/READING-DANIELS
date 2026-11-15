// tall-studio.html: Word Builder words as WRD_ clips, grouped by pattern, no duplicates, recorded/total count, zips + manifests.
const fs=require('fs'); const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./tall-studio.html','utf8'), listSrc=fs.readFileSync('./tall-list.js','utf8'), coreSrc=fs.readFileSync('./tall-words-core.js','utf8');
const raw=JSON.parse(fs.readFileSync('./data/tall-word-lists.json','utf8'));
const TW=require('../tall-words-core.js');
let pass=0,fail=0; function ck(c,m){ if(c){pass++;} else {fail++; console.log("FAIL:",m);} }
ck(/<\/script><\/body><\/html>\s*$/.test(html),"studio ends with </script></body></html>");
const L=TW.normalizeLists(raw), uw=TW.uniqueWords(L);
function make(url,data){
  const page=html.replace('<script src="tall-list.js"></script>','<script>'+listSrc+'</script>').replace('<script src="tall-words-core.js"></script>','<script>'+coreSrc+'</script>');
  return new JSDOM(page,{url:url,runScripts:"dangerously",pretendToBeVisual:true,beforeParse(w){
    w.__gum=0; w.__played=[]; w.__downloads=[]; w.__takeN=0; w.TW_DATA_RAW=data||raw;
    w.navigator.mediaDevices={getUserMedia:function(){ w.__gum++; return Promise.resolve({fake:"stream"}); }};
    function MR(stream,opts){ this.mimeType=(opts&&opts.mimeType)||"audio/webm"; }
    MR.isTypeSupported=function(t){ return t==="audio/webm;codecs=opus"||t==="audio/webm"; }; MR.prototype.start=function(){};
    MR.prototype.stop=function(){ var me=this; if(me.ondataavailable){ me.ondataavailable({data:new w.Blob(["take-"+(++w.__takeN)],{type:"audio/webm"})}); } setTimeout(function(){ if(me.onstop){ me.onstop(); } },0); };
    w.MediaRecorder=MR;
    w.Audio=function(u){ var a={src:u,onended:null,play:function(){ w.__played.push(u); w.__lastAudio=a; return Promise.resolve(); },pause:function(){}}; return a; };
    w.URL.createObjectURL=function(b){ w.__lastBlob=b; return "blob:"+Math.random(); }; w.URL.revokeObjectURL=function(){};
    w.HTMLAnchorElement.prototype.click=function(){ w.__downloads.push({name:this.download,blob:w.__lastBlob}); };
  }}).window;
}
const tick=()=>new Promise(r=>setTimeout(r,5));
const $=(w,id)=>w.document.getElementById(id), txt=(w,id)=>$(w,id).textContent;
function click(w,id){ const e=$(w,id); if(!e){ ck(false,"missing #"+id); return; } e.dispatchEvent(new w.MouseEvent("click",{bubbles:true})); }
const active=w=>{ const a=w.document.querySelector(".screen.active"); return a&&a.id; };
async function readZip(blob,w){
  const ab=await new Promise((res,rej)=>{ const fr=new w.FileReader(); fr.onload=()=>res(fr.result); fr.onerror=rej; fr.readAsArrayBuffer(blob); });
  const buf=new Uint8Array(ab), dv=new DataView(buf.buffer), out={}; let p=0;
  while(dv.getUint32(p,true)===0x04034b50){ const size=dv.getUint32(p+18,true), nlen=dv.getUint16(p+26,true); out[Buffer.from(buf.slice(p+30,p+30+nlen)).toString('utf8')]=Buffer.from(buf.slice(p+30+nlen,p+30+nlen+size)).toString('utf8'); p+=30+nlen+size; }
  return out;
}
(async function(){
  const w=make("https://miqdaniels.github.io/READING-DANIELS/tall-studio.html?teacher"); await w.tsReady; await tick(); w.TS_STOP_TAIL_MS=0;
  const words=w.TS_ITEMS.filter(x=>x.kind==="wordclip");
  ck(words.length===uw.length && words.length>100,"every unique word is an item ("+words.length+")");
  const ids={}; let dup=false; w.TS_ITEMS.forEach(x=>{ if(ids[x.id]) dup=true; ids[x.id]=1; }); ck(!dup,"no duplicate ids (words included)");
  ck(words.every(x=>/^WRD_[a-z]+$/.test(x.id)) && words.every(x=>x.id===TW.wordId(x.w)),"ids are WRD_<word>");
  const distinct={}; words.forEach(x=>distinct[x.w.toLowerCase()]=1); ck(Object.keys(distinct).length===words.length,"one clip per distinct word (no word twice)");
  ck(w.TS_ITEMS.filter(x=>x.kind!=="wordclip").length===122,"the 99 sound/passage clips are all still there (122 total, unchanged)");
  ck(w.TS_ITEMS.filter(x=>x.id.indexOf("SND_")===0).length===111 && w.TS_ITEMS.filter(x=>x.id.indexOf("PSG_")===0).length===11,"sound and passage ids untouched");
  /* grouped by pattern, in teaching order */
  const sets=w.tsSets().filter(s=>s.indexOf("Words:")===0);
  const expectedSets=[]; uw.forEach(x=>{ const t="Words: "+x.groupTitle+" > "+x.setTitle; if(expectedSets.indexOf(t)<0) expectedSets.push(t); });
  ck(sets.length>=40 && JSON.stringify(sets)===JSON.stringify(expectedSets) && sets[0]==="Words: Short Vowels > Short a","word sets are grouped by pattern, in teaching order ("+sets.length+" sets)");
  ck(sets.indexOf("Words: Level 2 Sounds > oi-oy")>-1 || sets.some(s=>/Level 2 Sounds/.test(s)),"the last groups (Level 2 Sounds) are there too");
  ck(w.tsItemsIn("Words: Short Vowels > Short a").length===uw.filter(x=>x.setId==="short a").length,"a pattern's set holds the words that first appear in it");
  /* pick screen */
  ck(active(w)==="ts-pick" && $(w,"ts-words-card").style.display==="block" && txt(w,"ts-words-count")==="Words: 0 of "+words.length+" recorded","pick screen shows 'Words: 0 of N recorded'");
  ck(w.document.querySelectorAll("#ts-sets button").length===2+sets.length,"set buttons: sounds + passages + one per word pattern");
  ck(w.document.querySelectorAll("#ts-exports button").length===2,"no separate export button for each word pattern (one Export-all-words button instead)");
  /* open a word set: big word, star, heart */
  click(w,"ts-set-"+w.tsSets().indexOf("Words: Short Vowels > Short a"));
  ck(txt(w,"ts-pid")===words[0].id && txt(w,"ts-word").indexOf(words[0].w)===0 && /Say the WORD/.test(txt(w,"ts-say")) && /Short Vowels > Short a/.test(txt(w,"ts-wordset")),"record screen: the word BIG, 'Say the WORD', and its pattern");
  ck(!!w.document.querySelector("#ts-word small"),"First 100 word shows a small star");
  /* record 2 words, count goes up */
  click(w,"ts-mic"); await tick(); await tick(); click(w,"ts-mic"); await tick(); await tick();
  ck(txt(w,"ts-progress")==="1 of "+w.tsItemsIn("Words: Short Vowels > Short a").length+" recorded","header counts the open set");
  w.tsGo("ts-pick"); ck(txt(w,"ts-words-count")==="Words: 1 of "+words.length+" recorded","Words counter: 1 recorded");
  /* export the pattern set */
  click(w,"ts-set-"+w.tsSets().indexOf("Words: Short Vowels > Short a")); click(w,"ts-export-set"); await tick(); await tick(); await tick();
  let d=w.__downloads[w.__downloads.length-1]; ck(d && d.name==="TALL_Words_short-vowels-short-a_recordings_v1.zip","pattern zip name: "+(d&&d.name));
  let z=await readZip(d.blob,w); const mf=JSON.parse(z["manifest.json"]);
  ck(Object.keys(z).sort().join(",")===words[0].id+".webm,manifest.json" && mf.items[0].id===words[0].id && mf.items[0].word===words[0].w && /Short a/.test(mf.items[0].pattern) && mf.items[0].file===words[0].id+".webm","zip: WRD_ webm + manifest (id, label, file, word, pattern)");
  /* export ALL words */
  w.tsGo("ts-pick"); click(w,"ts-export-words"); await tick(); await tick(); await tick();
  d=w.__downloads[w.__downloads.length-1]; ck(d && d.name==="TALL_Words_all_recordings_v1.zip","Export all words zip name");
  z=await readZip(d.blob,w); ck(Object.keys(z).filter(k=>/\.webm$/.test(k)).length===1,"all-words zip holds the recorded words");
  /* heart word shows heart + underlined tricky part */
  const hr=JSON.parse(JSON.stringify(raw)); hr.heartSets=[{id:"h1",title:"Heart words 1",words:[{w:"said",tricky:"ai"},{w:"the",tricky:"e"}]}];
  const w2=make("https://miqdaniels.github.io/READING-DANIELS/tall-studio.html?teacher",hr); await w2.tsReady; await tick();
  const hs=w2.tsSets().filter(s=>/Heart words/.test(s)); ck(hs.length===1 && hs[0]==="Words: Heart words > Heart words 1","heart-word sets are listed too");
  click(w2,"ts-set-"+w2.tsSets().indexOf(hs[0]));
  ck(w2.document.querySelector("#ts-word u").textContent==="ai" && /♥/.test(txt(w2,"ts-word")),"heart word: heart + tricky part underlined");
  /* a word that is in two patterns is one clip, and the first100/heart flags are kept */
  const dd=make("https://miqdaniels.github.io/READING-DANIELS/tall-studio.html?teacher",{groups:[{id:"g",title:"G",patterns:[{id:"a",title:"A",build:["sat*"],read:["sat"]},{id:"b",title:"B",build:["sat"],read:["bat"]}]}]}); await dd.tsReady; await tick();
  ck(dd.TS_ITEMS.filter(x=>x.id==="WRD_sat").length===1 && dd.TS_ITEMS.filter(x=>x.id==="WRD_sat")[0].first100===true,"a word in two lists is one WRD_ clip; the star is kept");
  /* students never get the studio */
  const stu=make("https://miqdaniels.github.io/READING-DANIELS/tall-studio.html"); await stu.tsReady; ck(active(stu)==="ts-locked","no ?teacher -> locked");
  console.log("test-tall-studio-words: "+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
})();
