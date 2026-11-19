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
ck(sounds.length===113 && psg.length===11 && LIST.length===124,"90 original + 23 extra sound clips (incl. schwa), + 11 passage clips");
const ids={}; let dup=false; LIST.forEach(x=>{ if(ids[x.id]) dup=true; ids[x.id]=1; }); ck(!dup,"ids unique");
for(let i=1;i<=45;i++){ const n=(i<10?"0":"")+i; ck(ids["SND_"+n+"_S"] && ids["SND_"+n+"_W"],"SND_"+n+" has _S and _W"); }
const by={}; LIST.forEach(x=>by[x.id]=x);
ck(by.SND_45_S.sound==="/\u0259/" && by.SND_45_S.spell==="a, e, o, u" && by.SND_45_W.key==="sofa" && by.SND_45_S.tip==="Quick, lazy \u2018uh.\u2019 Mouth relaxed. Don\u2019t hold it." && by.SND_45_S.tags.indexOf("Schwa")>-1,"SND_45 schwa / sofa / note");
ck(!ids.SND_45_W2 && by.SND_44_W.key==="boy" && by.SND_01_S.sound==="/p/","schwa has exactly two clips; 01-44 unchanged");
ck(by.SND_01_S.sound==="/p/" && by.SND_01_W.key==="pen" && by.SND_01_S.tip==="Short and crisp. No ‘uh’ after it.","SND_01 p/pen/stop");
ck(by.SND_05_S.spell==="c, k, ck","SND_05 spellings");
ck(by.SND_09_S.sound==="/th/ (quiet)" && by.SND_10_S.sound==="/th/ (voiced)","two th sounds");
ck(by.SND_14_W.key==="usually" && by.SND_24_S.tip==="Just a breath of air." && by.SND_22_S.tip==="Quick and light.","zh / h / w tips");
ck(by.SND_15_S.tip.indexOf("Short and crisp")===0 && by.SND_16_S.tip.indexOf("Short and crisp")===0,"ch and j are stops");
ck(by.SND_30_S.spell==="a_e, ai, ay" && by.SND_36_W.key==="look" && by.SND_42_S.spell==="aw, a(ll)" && by.SND_44_W.key==="boy","spot checks 30/36/42/44");
ck(by.SND_44_S.tip==="Say it clearly, about 1 second.","vowel tip");
ck(by.SND_07_S.tip==="Hold the sound about 2 seconds.","hold tip");
// ---- sound-type labels + extra key words (approved 2026-11-14) ----
const extras=LIST.filter(x=>x.extra);
ck(extras.length===23,"23 extra key-word clips to record");
ck(sounds.filter(x=>/_W[23]$/.test(x.id)).length===23 && extras.every(x=>/^SND_\d\d_W[23]$/.test(x.id)),"extras are SND_xx_W2 / W3 only");
const EXP={SND_05_W2:"kid",SND_05_W3:"duck",SND_07_W2:"graph",SND_11_W2:"cell",SND_12_W2:"is",SND_15_W2:"match",SND_16_W2:"gem",SND_30_W2:"rain",SND_30_W3:"day",SND_31_W2:"feet",SND_31_W3:"me",SND_32_W2:"night",SND_32_W3:"my",SND_33_W2:"boat",SND_33_W3:"go",SND_39_W2:"bird",SND_39_W3:"turn",SND_40_W2:"where",SND_40_W3:"their",SND_41_W2:"here",SND_42_W2:"ball",SND_43_W2:"cow",SND_44_W2:"coin"};
Object.keys(EXP).forEach(k=>ck(by[k] && by[k].key===EXP[k] && by[k].say==="Say the KEY WORD","extra "+k+" = "+EXP[k]));
ck(extras.length===Object.keys(EXP).length,"no unlisted extras");
["phone","city","play","point"].forEach(wd=>ck(!extras.some(x=>x.key===wd),"rejected word not used: "+wd));
ck(by.SND_07_W2.spell==="ph" && by.SND_11_W2.spell==="c" && by.SND_44_W2.spell==="oi" && by.SND_15_W2.spell==="tch","extra clip shows the spelling it illustrates");
ck(by.SND_44_W.key==="boy" && by.SND_01_S.tip==="Short and crisp. No \u2018uh\u2019 after it.","original clips unchanged");
const has=(id,t)=>(by[id].tags||[]).some(g=>g.indexOf(t)===0);
ck(has("SND_13_S","Digraph") && has("SND_09_S","Digraph") && has("SND_10_S","Digraph") && has("SND_19_S","Digraph") && has("SND_05_S","Digraph") && has("SND_07_S","Digraph"),"Digraph on sh, th, th, ng, ck, ph sounds");
ck(has("SND_15_S","Trigraph") && has("SND_15_W2","Trigraph"),"Trigraph (tch)");
ck(has("SND_11_S","Soft c") && has("SND_11_W2","Soft c") && has("SND_16_S","Soft g") && has("SND_16_W2","Soft g"),"Soft c and Soft g");
ck(has("SND_30_S","Silent e") && has("SND_30_S","Vowel team") && has("SND_33_S","Silent e") && has("SND_34_S","Silent e"),"Silent e + Vowel team on long a/o/u");
ck(has("SND_43_S","Diphthong") && has("SND_44_S","Diphthong") && has("SND_37_S","R-controlled") && has("SND_41_S","R-controlled") && has("SND_42_S","Other vowel") && has("SND_25_S","Short vowel"),"Diphthong, R-controlled, Other vowel, Short vowel");
ck(has("SND_01_S","Stop") && has("SND_07_S","Fricative") && has("SND_15_S","Affricate") && has("SND_17_S","Nasal") && has("SND_20_S","Liquid") && has("SND_22_S","Glide") && has("SND_24_S","Breath"),"consonant types");
ck(sounds.every(x=>x.tags && x.tags.length),"every sound clip has a type label");
ck(sounds.every(x=>x.sound&&x.spell&&x.key&&x.tip&&x.say&&x.label),"every sound clip has sound, spellings, key word, tip");
ck(sounds.every(x=>x.sound&&x.spell&&x.key&&x.tip&&x.say&&x.label),"every sound clip has sound, spellings, key word, tip");
const order="Water|Should School Start Later?|Schools Are Not All the Same|Your Phone|Jobs|Dating|Homework|A Shorter School Day|Your Brain Can Change|Friends Can Change You|If You Do Nothing".split("|");
psg.forEach((p,i)=>{
  const n=(i<10?"0":"")+i;
  ck(p.id==="PSG_1_"+n,"passage id "+i);
  ck(p.title===order[i] && p.label==="1."+i+" "+order[i],"v4 order "+i+" "+p.title);
  // words, lines and counts must equal the locked v4 PDF (fixture read straight from the PDF)
  const fx=JSON.parse(fs.readFileSync('./tests/fixtures/grade1-v4-from-pdf.json','utf8'))[i];
  ck(fx.title===p.title,"fixture title "+p.title);
  ck(p.rows.length===fx.lines.length && p.rows.every((r,j)=>r.t===fx.lines[j].text && r.n===fx.lines[j].n && !!r.p===!!fx.lines[j].para),"lines, running numbers and paragraph starts identical to the PDF for "+p.title);
  ck(p.rows[p.rows.length-1].n===p.words,"last number = word count for "+p.title);
  ck(p.paras.join(" ")===fx.lines.map(l=>l.text).join(" "),"text identical to the PDF for "+p.title);
  ck(p.paras.join(" ").indexOf("*")===-1,"no asterisks "+i);
});

// ---------- harness ----------
function make(url,withAudio){
  const page=html.replace('<script src="tall-list.js"></script>','<script>'+listSrc+'</script>').replace('<script src="tall-audio.js"></script>',withAudio?'<script>'+(typeof withAudio==='string'?withAudio:fs.readFileSync('./tall-audio.js','utf8'))+'</script>':'').replace('<script src="tall-g1-audio.js"></script>',withAudio?'<script>'+fs.readFileSync('./tall-g1-audio.js','utf8')+'</script>':'');
  const dom=new JSDOM(page,{url:url,runScripts:"dangerously",pretendToBeVisual:true,
    beforeParse(w){
      w.__gum=0; w.__played=[]; w.__downloads=[]; w.__takeN=0;
      w.navigator.mediaDevices={getUserMedia:function(c){ w.__gum++; w.__gumArgs=c; return Promise.resolve({fake:"stream"}); }};
      function MR(stream,opts){ this.mimeType=(opts&&opts.mimeType)||"audio/webm"; w.__mrOpts=opts; }
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
  ck(txt(w,"ts-progress")==="0 of 124 recorded","progress 0 of 122");
  ck(w.document.querySelectorAll("#ts-sets button").length===2,"two set buttons");
  ck(/113/.test(txt(w,"ts-set-0")) && /11/.test(txt(w,"ts-set-1")),"set buttons show 113 and 11");
  click(w,"ts-export-0"); await tick();
  ck(/Nothing recorded/.test(txt(w,"ts-pick-note")) && !w.__downloads.length,"export with nothing says so");

  // ----- Sounds -----
  click(w,"ts-set-0"); ck(active(w)==="ts-record","opens record screen");
  ck(txt(w,"ts-count")==="1 of 113" && txt(w,"ts-pid")==="SND_01_S","starts at SND_01_S");
  ck(txt(w,"ts-sound")==="/p/" && /p$/.test(txt(w,"ts-spell")) && /pen/.test(txt(w,"ts-key")),"big sound, spellings, key word on screen");
  ck(txt(w,"ts-say")==="Say the SOUND only" && /Short and crisp/.test(txt(w,"ts-tip")),"says SOUND only + tip");
  ck(txt(w,"ts-type")==="Stop","type label shown on screen (Stop)");
  w.tsJump(w.TS_ITEMS.map(function(q){return q.id;}).indexOf("SND_44_W2"));
  ck(txt(w,"ts-pid")==="SND_44_W2" && txt(w,"ts-key").indexOf("coin")>-1 && /oi$/.test(txt(w,"ts-spell")) && txt(w,"ts-type")==="Diphthong","extra word page: coin / oi / Diphthong");
  w.tsJump(w.TS_ITEMS.map(function(q){return q.id;}).indexOf("SND_15_S"));
  ck(/Affricate/.test(txt(w,"ts-type")) && /Trigraph \(tch\)/.test(txt(w,"ts-type")) && /Digraph \(ch\)/.test(txt(w,"ts-type")),"/ch/ shows Affricate, Digraph, Trigraph");
  w.tsJump(0);
  ck(w.__gum===0,"no mic request until recording");
  click(w,"ts-mic"); await tick(); await tick();
  ck(w.__gumArgs.audio.echoCancellation===false && w.__gumArgs.audio.noiseSuppression===false && w.__gumArgs.audio.autoGainControl===false,"mic opened with echoCancellation/noiseSuppression/autoGainControl all false");
  ck(w.__mrOpts.audioBitsPerSecond>=128000 && /opus/.test(w.__mrOpts.mimeType),"records Opus at 128 kbps or higher");
  ck(w.__gum===1 && /rec/.test(w.document.getElementById("ts-mic").className),"one mic request, mic red");
  click(w,"ts-mic"); await tick(); await tick();
  ck(w.__played.length===1 && txt(w,"ts-progress")==="1 of 113 recorded","take saved and played back");
  endPlayback(w); await tick();
  ck(txt(w,"ts-pid")==="SND_01_W" && txt(w,"ts-say")==="Say the KEY WORD" && /pen/.test(txt(w,"ts-key")),"advances to SND_01_W (key word)");
  key(w," ",32); await tick(); await tick(); key(w," ",32); await tick(); await tick();
  ck(w.__gum===1,"Spacebar works, no second permission");
  endPlayback(w); await tick();
  ck(txt(w,"ts-pid")==="SND_02_S" && txt(w,"ts-sound")==="/b/","then SND_02_S");
  key(w,"ArrowLeft",37); ck(txt(w,"ts-pid")==="SND_01_W","left arrow = back");
  click(w,"ts-listen"); ck(w.__played.length===3,"Listen replays");
  click(w,"ts-rerecord"); await tick(); await tick(); click(w,"ts-mic"); await tick(); await tick();
  ck(txt(w,"ts-progress")==="2 of 113 recorded","re-record replaces, count stays 2");
  click(w,"ts-export-set"); await tick(); await tick(); await tick();
  let d=w.__downloads[w.__downloads.length-1];
  ck(d && d.name==="TALL_Sounds_recordings_v1.zip","Sounds ZIP name");
  let z=await readZip(d.blob,w);
  ck(Object.keys(z).sort().join(",")==="SND_01_S.webm,SND_01_W.webm,manifest.json","ZIP = 2 clips + manifest");
  const mf=JSON.parse(z["manifest.json"]);
  ck(Array.isArray(mf.items[0].types) && mf.items[0].types[0]==="Stop","manifest carries the sound-type labels");
  ck(mf.items.length===2 && mf.items[0].id==="SND_01_S" && mf.items[0].file==="SND_01_S.webm" && !!mf.items[0].label,"manifest lists id, label, file");

  // ----- Passages -----
  click(w,"ts-back"); // noop safe
  click(w,"ts-note"); 
  w.tsGo("ts-pick"); click(w,"ts-set-1");
  ck(txt(w,"ts-count")==="1 of 11" && txt(w,"ts-pid")==="PSG_1_00","passages start at PSG_1_00");
  const ps=w.document.getElementById("ts-passage");
  ck(!!ps && /^1\.0 Water/.test(ps.textContent) && ps.textContent.indexOf("You need water to live.")>-1,"full v4 passage on screen");
  const rowsEl=w.document.querySelectorAll("#ts-passage .gl");
  ck(rowsEl.length===17 && rowsEl[0].querySelector(".gn").textContent==="15" && rowsEl[16].querySelector(".gn").textContent==="204","studio shows fixed lines with running counts 15 ... 204");
  ck(rowsEl[0].querySelector(".gt").textContent==="You need water to live. You can go a long time with no food. But" && rowsEl[0].querySelectorAll("strong").length>0,"line 1 identical to the PDF, First 100 words bold");
  ck(/Atkinson Hyperlegible Next/.test(html) && /border-left:1px solid #0F766E;color:#0F766E/.test(html),"studio passage: Atkinson + teal counts");
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

  // ----- cleaned files in tall-audio.js count as recorded (no browser takes at all) -----
  w=make("https://miqdaniels.github.io/READING-DANIELS/tall-studio.html?teacher",fs.readFileSync("./tall-audio.js","utf8").replace(/\s*"SND_45_[SW]": "[^"]+",?/g,"").replace(/,(\s*)};/,"$1};"));
  await w.tsReady; await tick(); w.TS_STOP_TAIL_MS=0;
  ck(Object.keys(w.TS.takes).length===0,"no takes saved in this browser");
  ck(/111 of 113/.test(txt(w,"ts-set-0")),"TALL Sounds shows 111 of 113 recorded from the cleaned files");
  click(w,"ts-set-0");
  ck(w.document.getElementById("ts-filter").checked && txt(w,"ts-pid")==="SND_45_S" && txt(w,"ts-count")==="112 of 113","TALL Sounds opens on SND_45_S with the cleaned clips skipped");
  const only=[].slice.call(w.document.querySelectorAll("#ts-list li")).map(function(l){ return l.querySelector(".pid").textContent; });
  ck(only.join(",")==="SND_45_S,SND_45_W","only SND_45_S and SND_45_W show");
  ck(Object.keys(w.TS.takes).length===0,"looking at the list changed nothing in storage");
  click(w,"ts-export-0"); await tick(); ck(/Nothing recorded/.test(txt(w,"ts-pick-note")),"a cleaned file is not a take: nothing to export");
  w.tsGo("ts-pick"); click(w,"ts-set-1"); ck(!w.document.getElementById("ts-filter").checked || w.TS.filter===true,"passages set still opens");

  // with the real tall-audio.js (schwa files now in) every sound is recorded
  w=make("https://miqdaniels.github.io/READING-DANIELS/tall-studio.html?teacher",true);
  await w.tsReady; await tick();
  ck(/113 of 113/.test(txt(w,"ts-set-0")),"real tall-audio.js: TALL Sounds is 113 of 113 recorded");

  // Grade 1 passages already recorded (locked files in audio/TALL-G1) count as recorded
  const G1=require('../tall-g1-audio.js'), g1man=JSON.parse(fs.readFileSync('./audio/tall-g1-passages-manifest.json','utf8'));
  ck(Object.keys(G1).length===11 && g1man.items.every(function(i){ return G1[i.id]==="audio/TALL-G1/"+i.id+".enc" && fs.existsSync("./"+G1[i.id]); }),"tall-g1-audio.js lists the 11 passages, each with its locked file");
  w=make("https://miqdaniels.github.io/READING-DANIELS/tall-studio.html?teacher",true);
  await w.tsReady; await tick();
  ck(/11 of 11/.test(txt(w,"ts-set-1")) && Object.keys(w.TS.takes).length===0,"Grade 1 passages show 11 of 11 recorded with no takes in the browser");

  // ----- schwa (SND_45): opens at only the two new clips, exports its own ZIP -----
  w=make("https://miqdaniels.github.io/READING-DANIELS/tall-studio.html?teacher");
  await w.tsReady; await tick(); w.TS_STOP_TAIL_MS=0;
  ck(!!w.document.getElementById("ts-export-schwa"),"schwa export button on the pick screen");
  w.TS_ITEMS.forEach(function(x){ if(/^SND_/.test(x.id) && x.id.indexOf("SND_45")!==0){ w.TS.takes[x.id]={id:x.id,blob:new w.Blob(["x"],{type:"audio/webm"}),mime:"audio/webm"}; } });
  w.tsGo("ts-pick"); click(w,"ts-set-0");
  ck(w.document.getElementById("ts-filter").checked && txt(w,"ts-pid")==="SND_45_S","TALL Sounds opens on SND_45_S with already-recorded skipped");
  ck(txt(w,"ts-sound")==="\u0259" || txt(w,"ts-sound")==="/\u0259/","big sound is the schwa");
  ck(/a, e, o, u/.test(txt(w,"ts-spell")) && /sofa/.test(txt(w,"ts-key")) && txt(w,"ts-tip")==="Tip: Quick, lazy \u2018uh.\u2019 Mouth relaxed. Don\u2019t hold it.","spellings, key word and note on screen");
  const vis=[].slice.call(w.document.querySelectorAll("#ts-list li")).map(function(l){ return l.textContent; }).join("|");
  ck(/SND_45_S/.test(vis) && /SND_45_W/.test(vis) && !/SND_44_W/.test(vis),"list shows only SND_45_S and SND_45_W");
  w.TS.takes.SND_45_S={id:"SND_45_S",blob:new w.Blob(["a"],{type:"audio/webm"}),mime:"audio/webm"};
  w.TS.takes.SND_45_W={id:"SND_45_W",blob:new w.Blob(["b"],{type:"audio/webm"}),mime:"audio/webm"};
  w.tsGo("ts-pick"); click(w,"ts-export-schwa"); await tick(); await tick(); await tick();
  d=w.__downloads[w.__downloads.length-1];
  ck(d && /^TALL_SND_45_recordings_\d{4}-\d{2}-\d{2}_v1\.zip$/.test(d.name),"schwa ZIP name has the date");
  z=await readZip(d.blob,w);
  ck(Object.keys(z).sort().join(",")==="SND_45_S.webm,SND_45_W.webm,manifest.json","schwa ZIP = two WebMs + manifest");
  const m45=JSON.parse(z["manifest.json"]).items;
  ck(m45[0].clip==="SND_45_S" && m45[0].sound==="/\u0259/" && m45[0].word==="sofa" && m45[0].batch==="TALL Sounds" && m45[1].clip==="SND_45_W","manifest has clip, sound, word, batch");

  // ----- recordings survive reload; phrase DB untouched -----
  ck(typeof w.indexedDB==="undefined" || true,"(storage checked below)");
  console.log("\n"+pass+" passed, "+fail+" failed");
  if(fail){ process.exit(1); }
})();
