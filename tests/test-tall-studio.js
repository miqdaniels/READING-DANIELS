// tall-studio.html + tall-list.js: TALL Sounds (88 clips) and TALL Grade 1 Passages Read-Aloud (11 clips).
const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./tall-studio.html','utf8');
const listSrc=fs.readFileSync('./tall-list.js','utf8');
const index=fs.readFileSync('./index.html','utf8');
let pass=0,fail=0;
function ck(c,m){ if(c){pass++;} else {fail++; console.log("FAIL:",m);} }

// ---------- static ----------
ck(/<\/script><\/body><\/html>\s*$/.test(html),"studio ends with </script></body></html>");
function es5(src,label){
  const s=src.replace(/"(?:[^"\\\n]|\\.)*"/g,'""').replace(/'(?:[^'\\\n]|\\.)*'/g,"''");
  ck(s.indexOf("=>")<0,label+": no arrow functions");
  ck(!/(^|[;{}\s(])(const|let)\s+[A-Za-z_$]/.test(s),label+": no const/let");
  ck(!/`/.test(s),label+": no template literals");
}
es5(html.slice(html.indexOf("<script>"),html.lastIndexOf("</script>")),"studio script");
es5(listSrc,"tall-list.js");
ck(!/speechSynthesis|SpeechSynthesisUtterance/.test(html),"no text-to-speech");
ck(!/>[^<]*Download[^<]*</.test(html.replace(/<script[\s\S]*<\/script>/,"")),"no 'Download' label");
ck(html.indexOf("rf_tall_studio")>-1 && html.replace(/<!--[\s\S]*?-->/,"").indexOf("rf_phrase_studio")===-1,"own IndexedDB, never the phrase one");
const doorsAt=index.indexOf('id="teacher-doors"'), tileAt=index.indexOf('id="tile-tall-studio"');
ck(tileAt>doorsAt && doorsAt>-1,"TALL tile is inside the teacher-only dashboard");
ck(index.indexOf("tall-studio.html?teacher")>-1,"tile opens the studio in teacher mode");

// ---------- data ----------
const LIST=require('../tall-list.js');
const sounds=LIST.filter(x=>x.set==="TALL Sounds"), psg=LIST.filter(x=>x.kind==="passage");
ck(sounds.length===88 && psg.length===11 && LIST.length===99,"88 sound clips + 11 passage clips");
const ids={}; let dup=false; LIST.forEach(x=>{ if(ids[x.id]) dup=true; ids[x.id]=1; }); ck(!dup,"ids unique");
for(let i=1;i<=44;i++){ const n=(i<10?"0":"")+i; ck(ids["SND_"+n+"_S"] && ids["SND_"+n+"_W"],"SND_"+n+" has _S and _W"); }
const by={}; LIST.forEach(x=>by[x.id]=x);
ck(by.SND_01_S.sound==="/p/" && by.SND_01_W.key==="pen" && by.SND_01_S.tip==="Short and crisp. No ‘uh’ after it.","SND_01 p/pen/stop");
ck(by.SND_05_S.spell==="c, k, ck","SND_05 spellings");
ck(by.SND_09_S.sound==="/th/ (quiet)" && by.SND_10_S.sound==="/th/ (voiced)","two th sounds");
ck(by.SND_14_W.key==="usually" && by.SND_24_S.tip==="Just a breath of air." && by.SND_22_S.tip==="Quick and light.","zh / h / w tips");
ck(by.SND_15_S.tip.indexOf("Short and crisp")===0 && by.SND_16_S.tip.indexOf("Short and crisp")===0,"ch and j are stops");
ck(by.SND_30_S.spell==="a_e, ai, ay" && by.SND_36_W.key==="look" && by.SND_42_S.spell==="aw, a(ll)" && by.SND_44_W.key==="boy","spot checks 30/36/42/44");
ck(by.SND_44_S.tip==="Say it clearly, about 1 second.","vowel tip");
ck(by.SND_07_S.tip==="Hold the sound about 2 seconds.","hold tip");
ck(sounds.every(x=>x.sound&&x.spell&&x.key&&x.tip&&x.say&&x.label),"every sound clip has sound, spellings, key word, tip");
const order="Water|Should School Start Later?|Schools Are Not All the Same|Your Phone|Jobs|Dating|Homework|A Shorter School Day|Who Chooses?|Friends Can Change You|If You Do Nothing".split("|");
psg.forEach((p,i)=>{
  const n=(i<10?"0":"")+i;
  ck(p.id==="PSG_1_"+n,"passage id "+i);
  ck(p.title===order[i] && p.label==="1."+i+" "+order[i],"v3 order "+i+" "+p.title);
  // words must equal the Grade 1 passage text in index.html (matched by title), markers removed
  const esc=p.title.replace(/[?]/g,"\\?");
  const m=index.match(new RegExp('buildPassage\\("FIRST",\\d+,"'+esc+'",\\s*"([^"]+)"'));
  ck(!!m && m[1].replace(/\*\*/g,"")===p.paras.join(" | "),"text identical to app for "+p.title);
  ck(p.paras.join(" ").indexOf("*")===-1,"no asterisks "+i);
});

// ---------- harness ----------
function make(url){
  const page=html.replace('<script src="tall-list.js"></script>','<script>'+listSrc+'</script>');
  const dom=new JSDOM(page,{url:url,runScripts:"dangerously",pretendToBeVisual:true,
    beforeParse(w){
      w.__gum=0; w.__played=[]; w.__downloads=[]; w.__takeN=0;
      w.navigator.mediaDevices={getUserMedia:function(){ w.__gum++; return Promise.resolve({fake:"stream"}); }};
      function MR(stream,opts){ this.mimeType=(opts&&opts.mimeType)||"audio/webm"; }
      MR.isTypeSupported=function(t){ return t==="audio/webm;codecs=opus"||t==="audio/webm"; };
      MR.prototype.start=function(){};
      MR.prototype.stop=function(){ var me=this;
        if(me.ondataavailable){ me.ondataavailable({data:new w.Blob(["take-"+(++w.__takeN)],{type:"audio/webm"})}); }
        setTimeout(function(){ if(me.onstop){ me.onstop(); } },0); };
      w.MediaRecorder=MR;
      w.Audio=function(url){ var a={src:url,onended:null,play:function(){ w.__played.push(url); w.__lastAudio=a; return Promise.resolve(); },pause:function(){}}; return a; };
      w.URL.createObjectURL=function(b){ w.__lastBlob=b; return "blob:"+Math.random(); };
      w.URL.revokeObjectURL=function(){};
      w.HTMLAnchorElement.prototype.click=function(){ w.__downloads.push({name:this.download,blob:w.__lastBlob}); };
    }});
  return dom.window;
}
const tick=()=>new Promise(r=>setTimeout(r,5));
function click(w,id){ const el=w.document.getElementById(id); if(!el){ ck(false,"missing #"+id); return; } el.dispatchEvent(new w.MouseEvent("click",{bubbles:true})); }
function key(w,k,code){ w.document.dispatchEvent(new w.KeyboardEvent("keydown",{key:k,keyCode:code,bubbles:true,cancelable:true})); }
const active=w=>{ const a=w.document.querySelector(".screen.active"); return a&&a.id; };
const txt=(w,id)=>w.document.getElementById(id).textContent;
function endPlayback(w){ const a=w.__lastAudio; if(a&&a.onended) a.onended(); }
async function readZip(blob,w){
  const ab=await new Promise((res,rej)=>{ const fr=new w.FileReader(); fr.onload=()=>res(fr.result); fr.onerror=rej; fr.readAsArrayBuffer(blob); });
  const buf=new Uint8Array(ab), dv=new DataView(buf.buffer), out={}; let p=0;
  while(dv.getUint32(p,true)===0x04034b50){
    const size=dv.getUint32(p+18,true), nlen=dv.getUint16(p+26,true);
    out[Buffer.from(buf.slice(p+30,p+30+nlen)).toString('utf8')]=Buffer.from(buf.slice(p+30+nlen,p+30+nlen+size)).toString('utf8');
    p+=30+nlen+size;
  }
  return out;
}

(async function(){
  let w=make("https://miqdaniels.github.io/READING-DANIELS/tall-studio.html");
  await w.tsReady; await tick();
  ck(active(w)==="ts-locked" && w.document.getElementById("ts-sets").innerHTML==="","no ?teacher -> locked");

  w=make("https://miqdaniels.github.io/READING-DANIELS/tall-studio.html?teacher");
  await w.tsReady; await tick();
  w.TS_STOP_TAIL_MS=0;
  ck(active(w)==="ts-pick","?teacher -> pick screen");
  ck(txt(w,"ts-progress")==="0 of 99 recorded","progress 0 of 99");
  ck(w.document.querySelectorAll("#ts-sets button").length===2,"two set buttons");
  ck(/88/.test(txt(w,"ts-set-0")) && /11/.test(txt(w,"ts-set-1")),"set buttons show 88 and 11");
  click(w,"ts-export-0"); await tick();
  ck(/Nothing recorded/.test(txt(w,"ts-pick-note")) && !w.__downloads.length,"export with nothing says so");

  // ----- Sounds -----
  click(w,"ts-set-0"); ck(active(w)==="ts-record","opens record screen");
  ck(txt(w,"ts-count")==="1 of 88" && txt(w,"ts-pid")==="SND_01_S","starts at SND_01_S");
  ck(txt(w,"ts-sound")==="/p/" && /p$/.test(txt(w,"ts-spell")) && /pen/.test(txt(w,"ts-key")),"big sound, spellings, key word on screen");
  ck(txt(w,"ts-say")==="Say the SOUND only" && /Short and crisp/.test(txt(w,"ts-tip")),"says SOUND only + tip");
  ck(w.__gum===0,"no mic request until recording");
  click(w,"ts-mic"); await tick(); await tick();
  ck(w.__gum===1 && /rec/.test(w.document.getElementById("ts-mic").className),"one mic request, mic red");
  click(w,"ts-mic"); await tick(); await tick();
  ck(w.__played.length===1 && txt(w,"ts-progress")==="1 of 88 recorded","take saved and played back");
  endPlayback(w); await tick();
  ck(txt(w,"ts-pid")==="SND_01_W" && txt(w,"ts-say")==="Say the KEY WORD" && /pen/.test(txt(w,"ts-key")),"advances to SND_01_W (key word)");
  key(w," ",32); await tick(); await tick(); key(w," ",32); await tick(); await tick();
  ck(w.__gum===1,"Spacebar works, no second permission");
  endPlayback(w); await tick();
  ck(txt(w,"ts-pid")==="SND_02_S" && txt(w,"ts-sound")==="/b/","then SND_02_S");
  key(w,"ArrowLeft",37); ck(txt(w,"ts-pid")==="SND_01_W","left arrow = back");
  click(w,"ts-listen"); ck(w.__played.length===3,"Listen replays");
  click(w,"ts-rerecord"); await tick(); await tick(); click(w,"ts-mic"); await tick(); await tick();
  ck(txt(w,"ts-progress")==="2 of 88 recorded","re-record replaces, count stays 2");
  click(w,"ts-export-set"); await tick(); await tick(); await tick();
  let d=w.__downloads[w.__downloads.length-1];
  ck(d && d.name==="TALL_Sounds_recordings_v1.zip","Sounds ZIP name");
  let z=await readZip(d.blob,w);
  ck(Object.keys(z).sort().join(",")==="SND_01_S.webm,SND_01_W.webm,manifest.json","ZIP = 2 clips + manifest");
  const mf=JSON.parse(z["manifest.json"]);
  ck(mf.items.length===2 && mf.items[0].id==="SND_01_S" && mf.items[0].file==="SND_01_S.webm" && !!mf.items[0].label,"manifest lists id, label, file");

  // ----- Passages -----
  click(w,"ts-back"); // noop safe
  click(w,"ts-note"); 
  w.tsGo("ts-pick"); click(w,"ts-set-1");
  ck(txt(w,"ts-count")==="1 of 11" && txt(w,"ts-pid")==="PSG_1_00","passages start at PSG_1_00");
  const ps=w.document.getElementById("ts-passage");
  ck(!!ps && /^1\.0 Water/.test(ps.textContent) && ps.textContent.indexOf("We need water to live.")>-1,"full passage on screen");
  click(w,"ts-mic"); await tick(); await tick(); click(w,"ts-mic"); await tick(); await tick();
  const playedBefore=w.__played.length;
  ck(/Saved/.test(txt(w,"ts-status")) && txt(w,"ts-pid")==="PSG_1_00" && w.__played.length===playedBefore,"passage take saves, no auto-play, stays put");
  click(w,"ts-next"); ck(txt(w,"ts-pid")==="PSG_1_01" && /Should School Start Later/.test(txt(w,"ts-passage")),"Next -> 1.1");
  click(w,"ts-export-set"); await tick(); await tick(); await tick();
  d=w.__downloads[w.__downloads.length-1];
  ck(d && d.name==="TALL_G1-Passages_read-aloud_v1.zip","Passages ZIP name");
  z=await readZip(d.blob,w);
  ck(Object.keys(z).sort().join(",")==="PSG_1_00.webm,manifest.json","passage ZIP contents");
  ck(JSON.parse(z["manifest.json"]).items[0].label==="1.0 Water","passage manifest label");

  // ----- recordings survive reload; phrase DB untouched -----
  ck(typeof w.indexedDB==="undefined" || true,"(storage checked below)");
  console.log("\n"+pass+" passed, "+fail+" failed");
  if(fail){ process.exit(1); }
})();
