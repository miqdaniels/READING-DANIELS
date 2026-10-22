/* voice/recordings.json loader: device recording > repo file > clips.js; Listen buttons enable from the repo file. */
const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8').replace('<script src="clips.js" defer></script>','');
const voiceText=fs.readFileSync('./voice/recordings.json','utf8');
var pass=0, fail=0;
function ok(c,m){ if(c){ pass++; } else { fail++; console.log("FAIL: "+m); } }

function fakeIDB(store){
  function req(fn){ var r={}; setTimeout(function(){ r.result=fn(); if(r.onsuccess){ r.onsuccess(); } },0); return r; }
  var db={ objectStoreNames:{contains:function(){return true;}},
    transaction:function(){ var tx={}; tx.objectStore=function(){ return {
      put:function(v,k){ store[k]=v; setTimeout(function(){ if(tx.oncomplete){ tx.oncomplete(); } },0); return {}; },
      get:function(k){ return req(function(){ return store[k]; }); },
      getAllKeys:function(){ return req(function(){ return Object.keys(store); }); } }; }; return tx; } };
  return { open:function(){ var q={}; setTimeout(function(){ q.result=db; if(q.onsuccess){ q.onsuccess(); } },0); return q; } };
}
function boot(store, fetchOk){
  return new JSDOM(html,{url:"https://miqdaniels.github.io/READING-DANIELS/?teacher",runScripts:"dangerously",pretendToBeVisual:true,
    beforeParse:function(w){ w.HTMLElement.prototype.scrollIntoView=function(){}; w.scrollTo=function(){};
      w.indexedDB=fakeIDB(store);
      if(fetchOk){ w.fetch=function(u){ w.__fetched=(w.__fetched||0)+1; w.__url=u; return Promise.resolve({ok:true,json:function(){return Promise.resolve(JSON.parse(voiceText));}}); }; }
      else { w.fetch=function(){ return Promise.reject(new Error("offline")); }; } } }).window;
}
function wait(ms){ return new Promise(function(r){ setTimeout(r,ms); }); }

(async function(){
  var store={}, w=boot(store,true);
  await wait(300);
  var A=w.AudioStore;
  var b=await A.get("dir_check4");
  ok(b && b.size>1000, "dir_check4 loads from voice/recordings.json");
  ok(w.__url==="voice/recordings.json", "fetches relative path voice/recordings.json");
  await A.get("dir_check5"); await A.get("sent_annoyed");
  ok(w.__fetched===1, "repo file is fetched only once");
  var ks=await A.keys();
  ok(ks.indexOf("dir_vocab")>=0 && ks.indexOf("word_annoyed")>=0, "keys() lists repo clips");
  // device recording wins
  var mine=new w.Blob(["device-voice"],{type:"audio/webm"});
  await A.put("dir_check4",mine);
  var again=await A.get("dir_check4");
  ok(again===mine || again.size===mine.size, "recording saved on device wins over repo file");
  // Listen buttons
  var d=w.document, defs=w.DIRECTIONS_DEFS, i, gray=[], missing=[];
  for(i=0;i<defs.length;i++){ w.dirPaintButton(defs[i].key); }
  await wait(300);
  for(i=0;i<defs.length;i++){
    var btn=d.getElementById("dl-"+defs[i].key+"-btn");
    if(!btn){ missing.push(defs[i].key); continue; }
    if(btn.disabled){ gray.push(defs[i].key); }
  }
  ok(defs.length===18, "18 directions slots");
  ok(gray.length===0, "no Listen button grayed out"+(gray.length?": "+gray.join(","):""));
  console.log("grayed out: "+(gray.length?gray.join(", "):"none")+"; no Listen button in markup: "+(missing.length?missing.join(", "):"none"));
  // click simulation: tapping Listen plays (Audio stubbed)
  var played=0; w.Audio=function(){ this.play=function(){ played++; }; };
  w.URL.createObjectURL=function(){ return "blob:x"; };
  d.getElementById("dl-dir_check5-btn").click(); await wait(200);
  ok(played===1, "clicking a Listen button plays its clip");
  // repo file unreachable -> falls back without error
  var w2=boot({},false); await wait(300);
  var nb=await w2.AudioStore.get("dir_check4");
  ok(nb===null || nb===undefined, "fetch failure with no clips.js: get() resolves empty, no crash");
  console.log(pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
})();
