// tall-sounds.html: the student "TALL Sounds" page (grid of 44, card view, play buttons, extras, missing clips).
const fs=require('fs'); const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./tall-sounds.html','utf8');
const listSrc=fs.readFileSync('./tall-list.js','utf8'), audSrc=fs.readFileSync('./tall-audio.js','utf8');
const LIST=require('../tall-list.js'), AUD=require('../tall-audio.js');
const BASE="https://miqdaniels.github.io/READING-DANIELS/";
let pass=0,fail=0; function ck(c,m){ if(c){pass++;} else {fail++; console.log("FAIL:",m);} }

// ---------- static ----------
ck(/<\/script><\/body><\/html>\s*$/.test(html),"ends with </script></body></html>");
const code=html.slice(html.indexOf("<script>"),html.lastIndexOf("</script>")).replace(/"(?:[^"\\\n]|\\.)*"/g,'""').replace(/'(?:[^'\\\n]|\\.)*'/g,"''");
ck(code.indexOf("=>")<0,"no arrow functions");
ck(!/(^|[;{}\s(])(const|let)\s+[A-Za-z_$]/.test(code),"no const/let");
ck(!/`/.test(code),"no template literals");
ck(!/speechSynthesis|SpeechSynthesisUtterance/.test(html),"no text-to-speech");
ck(!/localStorage|sessionStorage|indexedDB|getUserMedia|MediaRecorder/.test(html),"nothing stored, no mic");
ck(!/[Ss]core|points|\bquiz\b/.test(html.replace(/<style>[\s\S]*?<\/style>/,"").replace(/<!--[\s\S]*?-->/g,"")),"no scoring on the page");
ck(html.indexOf("#0F766E")>-1 && /font-family:"Poppins"/.test(html),"TALL teal + Poppins");
ck(!/fonts\.googleapis|fonts\.gstatic/.test(html),"font is bundled, not fetched from Google");
["400","600","700"].forEach(w=>ck(fs.existsSync("./assets/fonts/poppins/poppins-latin-"+w+"-normal.woff2"),"font file "+w));
ck(/<meta name="robots" content="noindex, nofollow">/.test(html),"noindex like the other pages");

// ---------- harness ----------
function make(opts){
  opts=opts||{};
  const page=html.replace('<script src="tall-list.js"></script>','<script>'+listSrc+'</script>').replace('<script src="tall-audio.js"></script>','<script>'+(opts.audioSrc||audSrc)+'</script>');
  return new JSDOM(page,{url:BASE+"tall-sounds.html",runScripts:"dangerously",pretendToBeVisual:true,
    beforeParse(w){
      w.__played=[]; w.__auds=[]; w.scrollTo=function(){};
      w.Audio=function(src){ const a={src:src,paused:true,onended:null,onerror:null,
        play:function(){ a.paused=false; w.__played.push(new w.URL(src,w.location.href).href); return Promise.resolve(); },
        pause:function(){ a.paused=true; }}; w.__auds.push(a); return a; };
    }}).window;
}
const $=(w,id)=>w.document.getElementById(id);
const txt=(w,id)=>$(w,id).textContent;
function click(w,id){ const el=$(w,id); if(!el){ ck(false,"missing #"+id); return; } el.dispatchEvent(new w.MouseEvent("click",{bubbles:true})); }
function key(w,k,c){ w.document.dispatchEvent(new w.KeyboardEvent("keydown",{key:k,keyCode:c,bubbles:true})); }
const active=w=>{ const a=w.document.querySelector(".screen.active"); return a&&a.id; };
const clipUrl=id=>BASE+"audio/TALL/"+id+".webm";

// ---------- grid ----------
let w=make();
ck(active(w)==="tsd-grid","opens on the grid");
const tiles=[].slice.call(w.document.querySelectorAll("#tsd-tiles .tile"));
ck(tiles.length===44,"44 sound cards");
const sounds=LIST.filter(x=>/^SND_\d\d_S$/.test(x.id));
ck(sounds.length===44 && tiles.every((t,i)=>t.id==="tsd-tile-"+sounds[i].id.slice(0,6)),"cards in SND_01..SND_44 order");
ck(tiles[0].textContent.indexOf("p")>-1 && /\/p\//.test(tiles[0].textContent),"card 1 shows p and /p/");
ck(/a_e \/ ai \/ ay/.test(tiles[29].textContent),"long a card shows a_e / ai / ay");
ck(/\/th\/ \(quiet\)/.test(tiles[8].textContent) && /\/th\/ \(voiced\)/.test(tiles[9].textContent),"two th cards told apart");
ck(w.__played.length===0,"nothing plays until a button is tapped");

// ---------- open a card, press each button ----------
click(w,"tsd-tile-SND_30");
ck(active(w)==="tsd-card","tap a card opens it");
ck(txt(w,"tsd-spell")==="a_e / ai / ay","spellings big: a_e / ai / ay");
ck(txt(w,"tsd-type")==="Long vowel · Silent e (a_e) · Vowel team (ai, ay)","sound type shown small and gray");
ck(txt(w,"tsd-word")==="made" && txt(w,"tsd-pos")==="30 of 44","key word in text + position");
click(w,"tsd-play-s"); ck(w.__played[0]===clipUrl("SND_30_S"),"Hear the sound loads SND_30_S");
click(w,"tsd-play-w"); ck(w.__played[1]===clipUrl("SND_30_W"),"Hear the word loads SND_30_W");
ck(w.__auds[0].paused===true,"starting a new clip stops the previous one");
const ex=w.document.querySelectorAll("#tsd-extras .erow");
ck(ex.length===2 && /rain/.test(ex[0].textContent) && /\(ai\)/.test(ex[0].textContent) && /day/.test(ex[1].textContent) && /\(ay\)/.test(ex[1].textContent),"extra words: rain (ai), day (ay)");
click(w,"tsd-play-SND_30_W2"); ck(w.__played[2]===clipUrl("SND_30_W2"),"rain plays SND_30_W2");
click(w,"tsd-play-SND_30_W3"); ck(w.__played[3]===clipUrl("SND_30_W3"),"day plays SND_30_W3");
ck(w.__played.length===4 && w.__played.every(u=>/\.webm$/.test(u)),"only recorded .webm clips played");

// sound with one extra, and one with none
click(w,"tsd-all"); ck(active(w)==="tsd-grid","All sounds returns to the grid");
click(w,"tsd-tile-SND_44"); ck(txt(w,"tsd-spell")==="oy / oi" && /Diphthong/.test(txt(w,"tsd-type")),"oy / oi + Diphthong on the last card");
ck(w.document.querySelectorAll("#tsd-extras .erow").length===1 && /coin/.test(txt(w,"tsd-extras")),"/oi/ has one extra word: coin");
click(w,"tsd-play-SND_44_W2"); ck(w.__played[w.__played.length-1]===clipUrl("SND_44_W2"),"coin plays SND_44_W2");
click(w,"tsd-all"); click(w,"tsd-tile-SND_01");
ck(w.document.querySelectorAll("#tsd-extras .erow").length===0 && $(w,"tsd-extras").style.display==="none","sound with no extras shows no extra section");
ck(txt(w,"tsd-word")==="pen" && /Stop/.test(txt(w,"tsd-type")),"p: word pen, type Stop");

// ---------- previous / next ----------
ck($(w,"tsd-prev").disabled===true && $(w,"tsd-next").disabled===false,"Previous disabled on the first sound");
click(w,"tsd-next"); ck(txt(w,"tsd-pos")==="2 of 44" && txt(w,"tsd-word")==="bag","Next -> /b/ bag");
click(w,"tsd-prev"); ck(txt(w,"tsd-pos")==="1 of 44","Previous -> back to /p/");
key(w,"ArrowRight",39); ck(txt(w,"tsd-pos")==="2 of 44","right arrow = next");
key(w,"ArrowLeft",37); ck(txt(w,"tsd-pos")==="1 of 44","left arrow = previous");
click(w,"tsd-all"); click(w,"tsd-tile-SND_44");
ck($(w,"tsd-next").disabled===true && $(w,"tsd-prev").disabled===false,"Next disabled on the last sound");

// ---------- every one of the 44 cards: right S and W clip ----------
let bad=0;
for(let i=1;i<=44;i++){
  const n="SND_"+(i<10?"0":"")+i;
  click(w,"tsd-all"); click(w,"tsd-tile-"+n);
  const before=w.__played.length;
  click(w,"tsd-play-s"); click(w,"tsd-play-w");
  if(w.__played[before]!==clipUrl(n+"_S") || w.__played[before+1]!==clipUrl(n+"_W")) bad++;
  const exs=LIST.filter(x=>x.id.indexOf(n+"_W")===0 && x.extra);
  exs.forEach(e=>{ click(w,"tsd-play-"+e.id); if(w.__played[w.__played.length-1]!==clipUrl(e.id)) bad++; });
  if(w.document.querySelectorAll("#tsd-extras .erow").length!==exs.length) bad++;
}
ck(bad===0,"all 44 cards: _S, _W and every extra play the right clip id");

// ---------- missing clips: say so, never speak ----------
const trimmed=audSrc.replace(/\s*"SND_05_S": "[^"]+",?\n/,"\n").replace(/\s*"SND_30_W2": "[^"]+",?\n/,"\n");
let m=make({audioSrc:trimmed});
click(m,"tsd-tile-SND_05");
ck($(m,"tsd-play-s").disabled===true && txt(m,"tsd-msg-s")==="Not recorded yet.","no _S file -> 'Not recorded yet.' and button off");
ck($(m,"tsd-play-w").disabled===false && txt(m,"tsd-msg-w")==="","the word clip still works");
click(m,"tsd-play-s"); ck(m.__played.length===0,"a missing clip plays nothing");
click(m,"tsd-all"); click(m,"tsd-tile-SND_30");
ck(txt(m,"tsd-msg-SND_30_W2")==="Not recorded yet." && $(m,"tsd-play-SND_30_W2").disabled===true && $(m,"tsd-play-SND_30_W3").disabled===false,"missing extra word clip says Not recorded yet.");
// file listed but fails to load (404)
w=make(); click(w,"tsd-tile-SND_02"); click(w,"tsd-play-w");
w.__auds[w.__auds.length-1].onerror();
ck(txt(w,"tsd-msg-w")==="Not recorded yet." && $(w,"tsd-play-w").disabled===true,"clip that fails to load -> 'Not recorded yet.'");

console.log("test-tall-sounds-page: "+pass+" passed, "+fail+" failed"); if(fail){ process.exit(1); }
