/* CHECK 2 SOUND-TO-SLIDE ALIGNMENT: the master mapping, the app, the approved PowerPoint and the
   teacher-verified table must all agree, and audio must always land on the right sound. */
const fs=require('fs'), cp=require('child_process'), crypto=require('crypto');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8').replace('<script src="clips.js" defer></script>','<script>'+fs.readFileSync('./clips.js','utf8')+'</script>');
let pass=0, fail=0; function ok(c,m){ if(c){pass++;} else {fail++; console.log("FAIL:",m);} }
const PPTX="check2-slides/Reading_Foundations_Check_2_Royal_Purple_44_Sounds_Audio_Ready.pptx";
const master=JSON.parse(fs.readFileSync('check2-slides/sound-mapping.json','utf8'));
/* independent copy of the teacher-verified table (typed separately from the build script) */
const TABLE="01|02|/b/|b;02|03|/k/|c;03|04|/d/|d;04|05|/f/|f;05|06|/g/|g;06|07|/h/|h;07|08|/j/|j;08|09|/l/|l;09|10|/m/|m;10|11|/n/|n;11|12|/p/|p;12|13|/r/|r;13|14|/s/|s;14|15|/t/|t;15|16|/v/|v;16|17|/w/|w;17|18|/y/|y;18|19|/z/|z;19|20|/ch/|ch;20|21|/sh/|sh;21|22|/th/ voiceless|th;22|23|/th/ voiced|th;23|24|/ng/|ng;24|25|/zh/|si;25|26|/ă/|a;26|27|/ĕ/|e;27|28|/ĭ/|i;28|29|/ŏ/|o;29|30|/ŭ/|u;30|31|/ā/|ai;31|32|/ē/|ee;32|33|/ī/|igh;33|34|/ō/|oa;34|35|/yoo/|u_e;35|36|/oo/|oo;36|37|/ʊ/|oo;37|38|/oi/|oi;38|39|/ow/|ou;39|40|/ər/|er;40|41|/ar/|ar;41|42|/or/|or;42|43|/aw/|aw;43|44|/air/|air;44|45|/ə/ schwa|a".split(";").map(function(r){ var p=r.split("|"); return {id:p[0],slide:parseInt(p[1],10),label:p[2],recheck:p[3]}; });
ok(TABLE.length===44,"verification table has 44 rows");

/* ---- 1. master mapping vs the REAL PowerPoint (rebuilt from the .pptx here) ---- */
const tmp="/tmp/c2_master_rebuild.json";
const r=cp.spawnSync("python3",["-I","tools/build-c2-sound-mapping.py",PPTX,tmp],{encoding:"utf8"});
ok(r.status===0,"mapping rebuilds cleanly from the approved .pptx ("+(r.stdout||"").trim().slice(0,90)+(r.stderr||"").slice(0,100)+")");
const rebuilt=JSON.parse(fs.readFileSync(tmp,"utf8"));
ok(JSON.stringify(rebuilt)===JSON.stringify(master),"committed sound-mapping.json is exactly what the .pptx produces (no drift)");
ok(master.source.sha256===crypto.createHash("sha256").update(fs.readFileSync(PPTX)).digest("hex") && master.source.slideCount===45,"master records the approved file's checksum and 45 slides");
ok(master.sounds.length===44 && master.menu.length===44,"44 sounds, 44 menu entries");
master.sounds.forEach(function(s,k){
  var t=TABLE[k];
  ok(s.soundId===t.id && s.pptSlide===t.slide && s.label===t.label && s.recheck.studentSpelling===t.recheck && s.recheck.sheetPosition===k+1,"sound "+t.id+": id, PPT slide "+t.slide+", label "+t.label+", recheck spelling "+t.recheck+" match the verified table");
});
ok(master.sounds.every(function(s){ return s.slideshow.slide===s.pptSlide && s.slideshow.image==="check2-slides/slides/"+(s.pptSlide<10?"0":"")+s.pptSlide+".png"; }),"every sound's browser destination is its own slide image");
ok(master.sounds.every(function(s){ return s.pptSlide===parseInt(s.soundId,10)+1; }),"sound ID + 1 = PowerPoint slide for all 44");

/* ---- 2. identity rules ---- */
function uniq(a){ return new Set(a).size===a.length; }
ok(uniq(master.sounds.map(function(s){ return s.soundId; })) && uniq(master.sounds.map(function(s){ return s.audio.recordingId; })) && uniq(master.sounds.map(function(s){ return s.audio.fileBase; })) && uniq(master.sounds.map(function(s){ return s.label; })),"sound IDs, recording IDs, file names and labels are all unique");
ok(master.sounds.every(function(s){ return /^c2_sound_\d\d_[a-z-]+$/.test(s.audio.recordingId) && s.audio.recordingId.indexOf("_"+s.soundId+"_")>-1; }),"every recording ID contains its two-digit sound ID");
var bare={}; master.sounds.forEach(function(s){ s.spellings.concat([s.recheck.studentSpelling]).forEach(function(sp){ bare[sp]=1; }); });
ok(master.sounds.every(function(s){ return !bare[s.audio.recordingId] && !bare[s.audio.fileBase]; }),"no bare spelling (th, oo, a ...) is ever used as an identifier");
var sh=master.sharedStudentSpellings; ok(JSON.stringify(sh)===JSON.stringify({th:["21","22"],a:["25","44"],oo:["35","36"]}),"shared spellings are th (21/22), a (25/44), oo (35/36), and they still have separate IDs");
function S(n){ return master.sounds[n-1]; }
ok(S(21).label==="/th/ voiceless" && S(22).label==="/th/ voiced" && S(21).audio.recordingId!==S(22).audio.recordingId && S(21).keyword!==S(22).keyword,"voiceless th and voiced th are separate sounds with separate recordings");
ok(S(35).label==="/oo/" && S(36).label==="/ʊ/" && S(35).audio.recordingId!==S(36).audio.recordingId && S(35).keyword==="moon" && S(36).keyword==="book","long /oo/ (moon) and short /ʊ/ (book) are separate");
ok(S(25).label==="/ă/" && S(44).label==="/ə/ schwa" && S(25).keyword==="apple" && S(44).keyword==="about" && S(25).audio.recordingId!==S(44).audio.recordingId,"short a and schwa are separate");
ok(S(43).label==="/air/" && S(43).pptSlide===44 && S(44).pptSlide===45 && S(43).spellings.indexOf("ear")>-1,"slide 44 is /air/ (ear is only one of its spellings) and slide 45 is schwa");
ok(!master.sounds.some(function(s){ return /ear/.test(s.label); }),"there is no separate /ear/ sound");
ok(master.discrepancies.some(function(d){ return /thin/.test(d.told||"") && /thumb/.test(d.deck||""); }),"recorded discrepancy: the verified note said 'thin' but the approved slide says 'thumb'");

/* ---- 3. the app uses exactly this mapping ---- */
const state={ played:[] }; var blobMap={}, urlN=0;
const w=new JSDOM(html,{url:"https://miqdaniels.github.io/READING-DANIELS/?teacher",runScripts:"dangerously",pretendToBeVisual:true,
  beforeParse(w){ w.HTMLElement.prototype.scrollIntoView=function(){}; w.scrollTo=function(){};
    w.URL.createObjectURL=function(b){ var u="blob:t"+(++urlN); blobMap[u]=b; return u; }; w.URL.revokeObjectURL=function(){};
    w.Audio=function(u){ this.play=function(){ state.played.push(u); return Promise.resolve(); }; this.pause=function(){}; };
    var rc=w.document.createElement.bind(w.document); w.document.createElement=function(t){ var el=rc(t); if(t==="a"){ el.click=function(){}; } return el; }; }}).window;
const d=w.document; function $(i){ return d.getElementById(i); }
function tick(ms){ return new Promise(function(r){ setTimeout(r,ms||20); }); }
function bytes(blob){ return new Promise(function(res){ var fr=new w.FileReader(); fr.onload=function(){ res(Array.prototype.slice.call(new Uint8Array(fr.result))); }; fr.readAsArrayBuffer(blob); }); }
function pattern(n){ return [n,n,n+1,n+2,44-n]; }
(async function(){
  var D=w.C2S_DATA;
  ok(D.sounds.length===44 && D.sounds.every(function(a,k){ var m=master.sounds[k]; return a.id===m.soundId && a.slide===m.pptSlide && a.symbol===m.label && a.spelling===m.spellingText && a.keyword===m.keyword && a.cue===m.teacherCue && a.file===m.audio.fileBase && a.recheck===m.recheck.studentSpelling && a.audio.every(function(v,q){ return Math.abs(v-m.slideshow.speakerIcon[q])<2e-5; }); }),"app data equals the master mapping for all 44 sounds (id, slide, label, spelling, keyword, cue, file, recheck, speaker position)");
  function near(a,b){ return a.length===b.length && a.every(function(v,k){ return Math.abs(v-b[k])<2e-5; }); }
  ok(D.menu.length===44 && D.menu.every(function(b,k){ return near(b,master.menu[k].box) && master.menu[k].jumpsToSlide===k+2; }),"app menu hotspots equal the master (each sound's hotspot jumps to slide N+1)");
  ok(near(D.nav.prev,master.nav.previous) && near(D.nav.menu,master.nav.soundMenu) && near(D.nav.next,master.nav.next),"app Previous / Sound Menu / Next hotspots equal the master");
  /* every menu item -> its own slide */
  w.go("c2Show"); var menuOk=true;
  for(var i=1;i<=44;i++){ w.c2shOpen(1); d.querySelectorAll("#c2sh-hot .c2sh-menu")[i-1].click(); if($("c2sh-img").getAttribute("src")!=="check2-slides/slides/"+(i+1<10?"0":"")+(i+1)+".png" || $("c2sh-count").textContent.indexOf("sound "+master.sounds[i-1].soundId)<0){ menuOk=false; } }
  ok(menuOk,"menu entry for each of the 44 sounds opens its own PowerPoint slide (slides 2-45)");
  /* distinct recording per sound, injected straight into storage */
  for(i=1;i<=44;i++){ await w.C2SStore.put({n:i,soundId:master.sounds[i-1].soundId,recordingId:master.sounds[i-1].audio.recordingId,type:"audio/webm",blob:new w.Blob([new Uint8Array(pattern(i))],{type:"audio/webm"}),size:5,savedAt:"x"}); }
  /* each speaker icon plays ONLY its own sound */
  var routed=0, wrong=[];
  for(i=1;i<=44;i++){
    w.c2shOpen(i+1); state.played.length=0; d.querySelector("#c2sh-hot .c2sh-speaker").click(); await tick(15);
    var u=state.played[state.played.length-1], b=u&&blobMap[u]; var got=b?await bytes(b):null;
    if(state.played.length===1 && got && JSON.stringify(got)===JSON.stringify(pattern(i))){ routed++; } else { wrong.push(i); }
  }
  ok(routed===44,"all 44 speaker icons play exactly the recording of their own sound (wrong: "+wrong.join(",")+")");
  /* th voiced / voiceless, oo pair, air / schwa checked explicitly */
  var pairs=[[21,22],[35,36],[43,44],[25,44]]; var pairOk=true;
  for(var pi=0;pi<pairs.length;pi++){ for(var q=0;q<2;q++){ var n=pairs[pi][q]; w.c2shOpen(n+1); state.played.length=0; d.querySelector("#c2sh-hot .c2sh-speaker").click(); await tick(15); var g=await bytes(blobMap[state.played[0]]); if(JSON.stringify(g)!==JSON.stringify(pattern(n))){ pairOk=false; } } }
  ok(pairOk,"th voiceless/voiced, oo long/short, /air/ vs schwa, short a vs schwa each play their own audio");
  ok(w.c2shOpen && d.querySelector("#c2sh-hot .c2sh-speaker").getAttribute("aria-label").indexOf("ə")>-1,"slide 45's speaker is labelled for schwa");
  /* a missing recording never borrows a neighbour's audio */
  await w.C2SStore.remove(22); w.c2shOpen(23); state.played.length=0; d.querySelector("#c2sh-hot .c2sh-speaker").click(); await tick(15);
  ok(state.played.length===0 && /Audio not recorded yet/.test($("c2sh-msg").textContent),"voiced th with no recording says 'Audio not recorded yet' and does NOT play voiceless th");
  await w.C2SStore.put({n:22,soundId:"22",recordingId:"c2_sound_22_th-voiced",type:"audio/webm",blob:new w.Blob([new Uint8Array(pattern(22))]),size:5,savedAt:"x"});
  /* a record whose stored number does not match the slot is refused at play time */
  await w.C2SStore.put({n:30,soundId:"31",recordingId:"x",type:"audio/webm",blob:new w.Blob([new Uint8Array([9])]),size:1,savedAt:"x"});
  /* studio: every sound shows the confirmation (ID, label, word, slide) */
  w.go("c2Studio"); await tick(40); var confOk=true;
  for(i=1;i<=44;i++){ w.c2stSelect(i); var t=$("c2st-confirm").textContent, m=master.sounds[i-1]; if(t.indexOf("Sound ID "+m.soundId)<0 || t.indexOf(m.label)<0 || t.indexOf("“"+m.keyword+"”")<0 || t.indexOf("PowerPoint slide "+m.pptSlide+" of 45")<0 || t.indexOf(m.audio.fileBase)<0){ confOk=false; } }
  ok(confOk,"for each of the 44 sounds the studio confirms ID, label, example word, PowerPoint slide and file name before recording");
  /* switching sounds in the studio never carries one sound's state to another */
  w.c2stSelect(21); ok(/thumb/.test($("c2st-panel").textContent) && !/this\b/.test($("c2st-confirm").textContent),"selecting voiceless th shows thumb, not voiced th's word");
  w.c2stSelect(22); ok(/this/.test($("c2st-confirm").textContent) && /Recorded/.test($("c2st-status").textContent),"selecting voiced th shows its own word and status");
  /* export/import round trip keeps every assignment (44 distinct recordings) */
  await w.C2SStore.put({n:30,soundId:"30",recordingId:"c2_sound_30_long-a",type:"audio/webm",blob:new w.Blob([new Uint8Array(pattern(30))]),size:5,savedAt:"x"});
  w.go("c2Studio"); await tick(40);
  var cap=null; w.downloadBlob=function(b,nm){ cap={blob:b,name:nm}; }; $("c2st-export").click(); await tick(300);
  var buf=await new Promise(function(res){ var fr=new w.FileReader(); fr.onload=function(){ res(fr.result); }; fr.readAsArrayBuffer(cap.blob); });
  var z=w.c2zParse(buf), man=JSON.parse(w.c2sBytesToText(z.files.filter(function(f){ return f.name==="manifest.json"; })[0].data));
  ok(man.recordedCount===44 && z.files.length===46 && man.manifestVersion===2,"export has 44 audio files + manifest + README");
  ok(man.sounds.every(function(s,k){ var m=master.sounds[k]; return s.soundId===m.soundId && s.slide===m.pptSlide && s.symbol===m.label && s.recordingId===m.audio.recordingId && s.file==="audio/"+m.audio.fileBase+".webm"; }),"manifest lists every sound with its ID, slide, label, recording ID and file");
  var byName={}; z.files.forEach(function(f){ byName[f.name]=f; }); var fileOk=true;
  man.sounds.forEach(function(s,k){ if(JSON.stringify(Array.prototype.slice.call(byName[s.file].data))!==JSON.stringify(pattern(k+1))){ fileOk=false; } });
  ok(fileOk,"each exported file holds the audio of ITS sound (no mixing)");
  var w2=new JSDOM(html,{url:"https://miqdaniels.github.io/READING-DANIELS/?teacher",runScripts:"dangerously",pretendToBeVisual:true,beforeParse:function(x){ x.HTMLElement.prototype.scrollIntoView=function(){}; x.scrollTo=function(){}; x.URL.createObjectURL=function(){return "blob:y";}; }}).window;
  w2.go("c2Studio"); await tick(40);
  var inp=w2.document.getElementById("c2st-import-file"); Object.defineProperty(inp,"files",{value:[new w2.File([new Uint8Array(buf)],"x.zip")],configurable:true}); inp.onchange(); await tick(300);
  w2.document.getElementById("c2st-import-go").click(); await tick(500);
  var back=true; for(i=1;i<=44;i++){ var rec=await w2.C2SStore.get(i); var gb=rec?await new Promise(function(res){ var fr=new w2.FileReader(); fr.onload=function(){ res(Array.prototype.slice.call(new Uint8Array(fr.result))); }; fr.readAsArrayBuffer(rec.blob); }):null; if(!rec || rec.n!==i || rec.soundId!==master.sounds[i-1].soundId || JSON.stringify(gb)!==JSON.stringify(pattern(i))){ back=false; } }
  ok(back,"after import every one of the 44 sounds holds its own audio under its own ID");
  /* tampered manifests are refused */
  function zipWith(mods){ var mm=JSON.parse(JSON.stringify(man)); mods(mm); return w.c2zBuild([{name:"manifest.json",data:w.c2zUtf8(JSON.stringify(mm))}].concat(z.files.filter(function(f){ return /^audio\//.test(f.name); }))); }
  async function tryImport(blob){ var bb=await new Promise(function(res){ var fr=new w.FileReader(); fr.onload=function(){ res(fr.result); }; fr.readAsArrayBuffer(blob); }); var w3=new JSDOM(html,{url:"https://miqdaniels.github.io/READING-DANIELS/?teacher",runScripts:"dangerously",pretendToBeVisual:true,beforeParse:function(x){ x.HTMLElement.prototype.scrollIntoView=function(){}; x.scrollTo=function(){}; }}).window; w3.go("c2Studio"); await tick(30); var ii=w3.document.getElementById("c2st-import-file"); Object.defineProperty(ii,"files",{value:[new w3.File([new Uint8Array(bb)],"t.zip")],configurable:true}); ii.onchange(); await tick(250); return w3.document.getElementById("c2st-note").textContent; }
  var n1=await tryImport(zipWith(function(m){ m.sounds[21].soundId="21"; }));
  ok(/Found 43 recordings.*1 skipped/.test(n1),"manifest entry with the wrong sound ID is skipped ("+n1.slice(0,70)+")");
  var n2=await tryImport(zipWith(function(m){ m.sounds[35].slide=37; m.sounds[35].slide=99; }));
  ok(/Found 43 recordings.*1 skipped/.test(n2),"manifest entry with the wrong slide number is skipped");
  var n3=await tryImport(zipWith(function(m){ m.sounds[20].recordingId="c2_sound_22_th-voiced"; }));
  ok(/Found 43 recordings.*1 skipped/.test(n3),"voiceless th claiming voiced th's recording ID is skipped");
  var n4=await tryImport(zipWith(function(m){ var t=m.sounds[34].file; m.sounds[34].file=m.sounds[35].file; m.sounds[35].file=t; }));
  ok(/Found 42 recordings.*2 skipped/.test(n4),"swapped file names between /oo/ and /ʊ/ are both skipped, never swapped silently");
  ok(w.C2_ITEMS.length===31,"Check 2 assessment untouched (31 items)");
  ok(crypto.createHash("sha256").update(fs.readFileSync(PPTX)).digest("hex")==="41bafb8be9059bbfb0aea31d14a02d28e96754309799a99547513c8157cce318","approved PowerPoint unchanged (byte-identical)");
  console.log("c2-sound-mapping: "+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
})();
