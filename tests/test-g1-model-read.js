// Level 1 passage screens: "Listen to the passage" plays Mick's cleaned model read (PSG_1_xx), never TTS.
var fs=require('fs'), JSDOM=require('jsdom').JSDOM;
var src=fs.readFileSync('./index.html','utf8');
var html=src.replace('<script src="clips.js" defer></script>','');
var BASE="https://miqdaniels.github.io/READING-DANIELS/";
var LIST=require('../tall-list.js').filter(function(x){ return x.kind==="passage"; });
var man=JSON.parse(fs.readFileSync('./audio/tall-g1-passages-manifest.json','utf8'));
var pass=0, fail=0; function ok(c,m){ if(c){ pass++; } else { fail++; console.log("FAIL: "+m); } }
/* ---- files + manifest ---- */
ok(LIST.length===11 && man.items.length===11,"11 passages, 11 manifest items");
LIST.forEach(function(x,i){
  var f='./audio/TALL-G1/'+x.id+'.webm', m=man.items[i];
  ok(x.id==="PSG_1_"+(i<10?"0":"")+i,"id order "+x.id);
  ok(fs.existsSync(f) && fs.statSync(f).size>100000,"file exists "+x.id);
  if(fs.existsSync(f)){ var b=fs.readFileSync(f).slice(0,4); ok(b[0]===0x1a&&b[1]===0x45&&b[2]===0xdf&&b[3]===0xa3,"webm header "+x.id); }
  ok(m.id===x.id && m.label===x.label && m.words===x.words && m.webm===man.base+x.id+".webm","manifest entry "+x.id);
});
ok(fs.readdirSync('./audio/TALL-G1').filter(function(f){ return /\.webm$/.test(f); }).length===11,"no stray files in audio/TALL-G1");
ok(man.base===BASE+"audio/TALL-G1/","public base URL");
/* ---- page ---- */
function boot(url){
  return new JSDOM(html,{url:url||(BASE+"?teacher"),runScripts:"dangerously",pretendToBeVisual:true,beforeParse:function(w){
    w.scrollTo=function(){}; w.HTMLElement.prototype.scrollIntoView=function(){};
    w.__auds=[];
    w.Audio=function(src){ var a={src:src,paused:true,onended:null,onerror:null,play:function(){ a.paused=false; return Promise.resolve(); },pause:function(){ a.paused=true; }}; w.__auds.push(a); return a; };
  }}).window;
}
var w=boot(), doc=w.document, i;
function clickEl(id){ doc.getElementById(id).dispatchEvent(new w.MouseEvent("click",{bubbles:true})); }
var ps=w.passagesForLevel("FIRST");
ok(w.FLU_MODEL_AUDIO && Object.keys(w.FLU_MODEL_AUDIO).length===11,"11 clips mapped in the app");
for(i=0;i<11;i++){
  var id="PSG_1_"+(i<10?"0":"")+i, before=w.__auds.length;
  w.fluPassage=ps[i]; w.go("fluencyPassage");
  var wrap=doc.getElementById("flu-model-wrap"), btn=doc.getElementById("flu-model-btn");
  ok(wrap.style.display==="inline-flex" && btn.disabled===false,"1."+i+" Listen button shown and enabled");
  ok(/Listen/.test(doc.getElementById("flu-model-lbl").textContent),"1."+i+" button says Listen");
  ok(w.FLU_MODEL_AUDIO[i]==="audio/TALL-G1/"+id+".webm","1."+i+" maps to "+id);
  clickEl("flu-model-btn");
  var a=w.__auds[w.__auds.length-1];
  ok(w.__auds.length===before+1 && a.src===w.FLU_MODEL_AUDIO[i] && new w.URL(a.src,w.location.href).href===BASE+"audio/TALL-G1/"+id+".webm","1."+i+" tap loads "+id+" at its real URL");
  ok(a.paused===false && btn.className==="dir-listen-btn playing" && doc.getElementById("flu-model-lbl").textContent==="Playing…","1."+i+" shows Playing");
  clickEl("flu-model-btn");
  ok(a.paused===true && btn.className==="dir-listen-btn","1."+i+" tap again stops it");
}
/* plays to the end -> button resets */
w.fluPassage=ps[0]; w.go("fluencyPassage"); clickEl("flu-model-btn");
var a0=w.__auds[w.__auds.length-1]; a0.onended();
ok(doc.getElementById("flu-model-btn").className==="dir-listen-btn" && doc.getElementById("flu-model-lbl").textContent==="Listen to the passage","button resets when the read ends");
/* leaving the screen stops it */
clickEl("flu-model-btn"); var a1=w.__auds[w.__auds.length-1];
w.go("studentMenu");
ok(a1.paused===true,"going to another screen stops the model read");
/* starting the student's own recording stops it too */
w.fluPassage=ps[2]; w.go("fluencyPassage"); clickEl("flu-model-btn"); var a2=w.__auds[w.__auds.length-1];
try{ w.fluToggleRec(); }catch(e){}
ok(a2.paused===true && doc.getElementById("flu-model-btn").className==="dir-listen-btn","pressing Record stops the model read");
/* Day 2 recording path too */
w.fluDay=2; w.fluPassage=ps[3]; w.go("fluencyPassage"); clickEl("flu-model-btn"); var a3=w.__auds[w.__auds.length-1];
try{ w.fluD2ToggleRec(); }catch(e){}
ok(a3.paused===true,"Day 2 Record also stops the model read"); w.fluDay=1;
/* missing clip */
var m=boot(); var md=m.document;
delete m.FLU_MODEL_AUDIO[5];
m.fluPassage=m.passagesForLevel("FIRST")[5]; m.go("fluencyPassage");
ok(md.getElementById("flu-model-btn").disabled===true && md.getElementById("flu-model-lbl").textContent==="Not recorded yet.","missing clip: button gray and says 'Not recorded yet.'");
md.getElementById("flu-model-btn").dispatchEvent(new m.MouseEvent("click",{bubbles:true}));
ok(m.__auds.length===0,"missing clip plays nothing");
/* file listed but fails to load */
w.fluPassage=ps[6]; w.go("fluencyPassage"); clickEl("flu-model-btn");
w.__auds[w.__auds.length-1].onerror();
ok(doc.getElementById("flu-model-lbl").textContent==="Not recorded yet." && doc.getElementById("flu-model-btn").disabled===true,"clip that fails to load -> 'Not recorded yet.'");
/* PK passages: no button */
w.fluPassage=w.findPassage("PK",0); w.go("fluencyPassage");
ok(doc.getElementById("flu-model-wrap").style.display==="none","PK passages show no model-read button");
/* HOLD: students (no ?teacher) never get the model read -- hidden, and the function refuses */
var st=boot(BASE), sd=st.document;
st.fluPassage=st.passagesForLevel("FIRST")[0]; st.go("fluencyPassage");
ok(sd.getElementById("flu-model-wrap").style.display==="none","student view: no model-read button");
try{ st.fluModelToggle(); }catch(e){}
ok(st.__auds.length===0,"student view: fluModelToggle() plays nothing");
/* rules */
ok(!/speechSynthesis|SpeechSynthesisUtterance/.test(src),"no text-to-speech in the app");
ok(/<\/script>\s*<\/body>\s*<\/html>\s*$/.test(src),"index.html ends with </script></body></html>");
var script=src.slice(src.indexOf("<script>")).replace(/"(?:[^"\\\n]|\\.)*"/g,'""');
ok(!/\bconst\s|\blet\s+[a-zA-Z_$]+\s*[=;]/.test(script),"no const/let");
console.log("test-g1-model-read: "+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
