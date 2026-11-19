// Final cleaned TALL Sounds audio (v4): every id has a real file, ids unchanged, manifest + lookup agree.
const fs=require('fs'); const {JSDOM}=require('jsdom');
let pass=0,fail=0; function ck(c,m){ if(c){pass++;} else {fail++; console.log("FAIL:",m);} }
const ALL=require('../tall-list.js').filter(x=>x.set==="TALL Sounds");
const LIST=ALL;
const AUD=require('../tall-audio.js'), man=JSON.parse(fs.readFileSync('./audio/tall-sounds-manifest.json','utf8'));
const src=fs.readFileSync('./tall-audio.js','utf8');
ck(LIST.length===113,"113 sound clips in the list (44 sounds + extras + schwa)");
ck(Object.keys(AUD).length===113 && man.items.length===113,"113 audio entries and 113 manifest items");
LIST.forEach(x=>{
  const f='./audio/TALL/'+x.id+'.webm';
  ck(AUD[x.id]==="audio/TALL/"+x.id+".webm","lookup "+x.id);
  ck(fs.existsSync(f) && fs.statSync(f).size>2000,"file exists "+x.id);
  if(fs.existsSync(f)){ const b=fs.readFileSync(f).slice(0,4); ck(b[0]===0x1a&&b[1]===0x45&&b[2]===0xdf&&b[3]===0xa3,"webm header "+x.id); }
});
ck(fs.readdirSync('./audio/TALL').filter(f=>/\.webm$/.test(f)).length===113,"no stray files in audio/TALL");
ck(man.items.every((m,i)=>m.id===LIST[i].id && m.webm===man.base+m.id+".webm" && m.label===LIST[i].label),"manifest ids, labels, URLs match the list in order");
ck(man.base==="https://miqdaniels.github.io/READING-DANIELS/audio/TALL/","public base URL");
// ES5 only, no TTS
const s=src.replace(/"(?:[^"\\\n]|\\.)*"/g,'""');
ck(s.indexOf("=>")<0 && !/(^|[;{}\s(])(const|let)\s+[A-Za-z_$]/.test(s) && !/speechSynthesis/.test(src),"tall-audio.js ES5, no TTS");
// jsdom click-simulation with a real URL: load the file in a page and "play" a clip by id
const dom=new JSDOM('<button id="b">play</button>',{url:"https://miqdaniels.github.io/READING-DANIELS/",runScripts:"dangerously",beforeParse(w){ w.__played=[]; w.Audio=function(u){ return {play:function(){ w.__played.push(u); return Promise.resolve(); }}; }; }});
const w=dom.window; w.eval(src);
w.document.getElementById("b").addEventListener("click",function(){ new w.Audio(new w.URL(w.TALL_AUDIO.SND_44_W2,w.location.href).href).play(); });
w.document.getElementById("b").dispatchEvent(new w.MouseEvent("click",{bubbles:true}));
ck(w.__played[0]==="https://miqdaniels.github.io/READING-DANIELS/audio/TALL/SND_44_W2.webm","click plays the clean SND_44_W2 at its real URL");
console.log("test-tall-audio: "+pass+" passed, "+fail+" failed"); if(fail){ process.exit(1); }
