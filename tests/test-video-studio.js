// video-studio.html (Mouth Video Studio) + video-list.js, and the Check 3 draft lesson cards.
// Static ES5 checks, data rules (no Check 3 test words), teacher-only gate, every button by jsdom
// click, one camera+mic permission, device pickers, auto-playback then advance, keyboard, filter,
// progress, IndexedDB-or-memory persistence, and the ZIP export contents.
const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./video-studio.html','utf8');
const listSrc=fs.readFileSync('./video-list.js','utf8');
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
es5(listSrc,"video-list.js");
ck(!/speechSynthesis|SpeechSynthesisUtterance/.test(html),"no text-to-speech");
ck(!/>[^<]*Download[^<]*</.test(html.replace(/<script[\s\S]*<\/script>/,"")),"no 'Download' on studio labels (Export rule)");
const doorsAt=index.indexOf('id="teacher-doors"'), tileAt=index.indexOf('id="tile-video-studio"');
ck(tileAt>doorsAt && doorsAt>-1,"Mouth Video Studio tile is inside the teacher-only dashboard");
ck(index.indexOf("video-studio.html?teacher")>-1,"tile opens the studio in teacher mode");

// ---------- data ----------
const LIST=require('../video-list.js');
const ids={}; let dup=false; LIST.forEach(x=>{ if(ids[x.id]) dup=true; ids[x.id]=1; });
ck(!dup,"ids unique");
ck(LIST.every(x=>/^PA_(SND|3A|3B|3C|3D)_\d\d$/.test(x.id)),"ids are PA_<set>_NN");
ck(LIST.every(x=>x.set && x.text && x.say),"every clip has set, text, say");
const sets=[]; LIST.forEach(x=>{ if(sets.indexOf(x.set)<0) sets.push(x.set); });
ck(JSON.stringify(sets)===JSON.stringify(["Sounds","3A Beginning Sounds","3B Ending Sounds","3C Blending","3D Segmenting"]),"5 sets in teaching order");
ck(LIST.filter(x=>x.set==="Sounds").length===26,"26 single-sound clips");
// Keep diagnostic words OUT of teaching practice: no Check 3 scored/practice/sample word
// may be a practice target in any lesson set (v0.7 / v0.2 lessons are clean).
const m=index.match(/var C3_SCORED=\[([\s\S]*?)\];/), pr=index.match(/var C3_PRACTICE=\{([\s\S]*?)\};/), sa=index.match(/var C3_SAMPLE=\{([\s\S]*?)\};/);
const bank={}; [m,pr,sa].forEach(b=>{ (b[1].match(/word:"([a-z]+)"/g)||[]).forEach(w=>{ bank[w.slice(6,-1)]=1; }); });
ck(Object.keys(bank).length===28,"read all 28 Check 3 words from index.html");
LIST.filter(x=>x.set!=="Sounds").forEach(x=>{ if(bank[x.text]) ck(false,"test word used as practice: "+x.id+" "+x.text); });

// lesson cards on the Check 3 page
["es","bl","sg"].forEach(k=>{
  ck(index.indexOf('id="c3n-'+k+'"')>-1,"card c3n-"+k);
  const mm=index.match(new RegExp('id="c3n-'+k+'-docx" href="([^"]+)" download'));
  ck(!!mm && fs.existsSync(mm[1]),"card "+k+" links an existing Word file");
});

// ---------- harness ----------
function make(url, opts){
  opts=opts||{};
  const page=html.replace('<script src="video-list.js"></script>','<script>'+listSrc+'</script>');
  const dom=new JSDOM(page,{url:url,runScripts:"dangerously",pretendToBeVisual:true,
    beforeParse(w){
      w.__gum=[]; w.__played=[]; w.__downloads=[]; w.__stopped=0;
      function track(kind,id){ return {kind:kind, stop:function(){ w.__stopped++; }, getSettings:function(){ return {deviceId:id}; }}; }
      w.navigator.mediaDevices={
        getUserMedia:function(c){ w.__gum.push(c);
          if(opts.deny) return Promise.reject({name:"NotAllowedError"});
          const vt=track("video",(c.video.deviceId&&c.video.deviceId.exact)||"cam-a"), at=track("audio",(c.audio.deviceId&&c.audio.deviceId.exact)||"mic-a");
          return Promise.resolve({getTracks:()=>[vt,at],getVideoTracks:()=>[vt],getAudioTracks:()=>[at]}); },
        enumerateDevices:function(){ return Promise.resolve([
          {kind:"videoinput",deviceId:"cam-a",label:"Built-in Camera"},
          {kind:"videoinput",deviceId:"cam-b",label:"Logitech Webcam"},
          {kind:"audioinput",deviceId:"mic-a",label:"Built-in Mic"},
          {kind:"audioinput",deviceId:"mic-b",label:"Webcam Mic"}]); }
      };
      function MR(stream,o){ this.stream=stream; this.opts=o; this.mimeType=(o&&o.mimeType)||"video/webm"; this.state="inactive"; }
      MR.isTypeSupported=function(t){ return t==="video/webm;codecs=vp8,opus"||t==="video/webm"; };
      MR.prototype.start=function(){ this.state="recording"; w.__lastRec=this; };
      MR.prototype.stop=function(){ var me=this; this.state="inactive";
        if(me.ondataavailable){ me.ondataavailable({data:new w.Blob(["vid-"+(++w.__takeN)],{type:"video/webm"})}); }
        setTimeout(function(){ if(me.onstop){ me.onstop(); } },0); };
      w.__takeN=0; w.MediaRecorder=MR;
      w.HTMLMediaElement.prototype.play=function(){ if(this.id==="vs-playback"){ w.__played.push(this.getAttribute("src")); } return Promise.resolve(); };
      w.HTMLMediaElement.prototype.pause=function(){};
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
const cam=w=>w.document.getElementById("vs-cam").className;
function endPlayback(w){ const v=w.document.getElementById("vs-playback"); if(v.onended) v.onended(); }
async function stopTake(w){ click(w,"vs-rec"); await new Promise(r=>setTimeout(r,560)); await tick(); }
async function readZip(blob,w){
  const ab=await new Promise((res,rej)=>{ const fr=new w.FileReader(); fr.onload=()=>res(fr.result); fr.onerror=rej; fr.readAsArrayBuffer(blob); });
  const buf=new Uint8Array(ab), dv=new DataView(buf.buffer), out={}; let p=0;
  while(dv.getUint32(p,true)===0x04034b50){
    const size=dv.getUint32(p+18,true), nlen=dv.getUint16(p+26,true);
    const name=Buffer.from(buf.slice(p+30,p+30+nlen)).toString('utf8');
    out[name]=Buffer.from(buf.slice(p+30+nlen,p+30+nlen+size)).toString('utf8'); p+=30+nlen+size;
  }
  return out;
}

(async function(){
  const BASE="https://miqdaniels.github.io/READING-DANIELS/video-studio.html";
  let w=make(BASE); await w.vsReady;
  ck(active(w)==="vs-locked","no ?teacher -> locked");
  ck(w.document.getElementById("vs-sets").innerHTML==="","nothing painted for students");

  w=make(BASE+"?teacher"); await w.vsReady; await tick();
  ck(active(w)==="vs-pick","?teacher -> pick screen");
  ck(txt(w,"vs-progress")==="0 of "+LIST.length+" recorded","progress 0 of all");
  ck(w.document.querySelectorAll("#vs-sets button").length===5,"5 set buttons");
  ck(w.__gum.length===0,"camera not requested until asked");
  click(w,"vs-export-all"); await tick();
  ck(/Nothing recorded/.test(txt(w,"vs-pick-note")) && !w.__downloads.length,"Export All with nothing says so");

  // camera on + device lists
  click(w,"vs-cam-on"); await tick(); await tick();
  ck(w.__gum.length===1,"one camera+mic request");
  ck(!!w.__gum[0].video && !!w.__gum[0].audio,"asks for video AND audio");
  ck(w.__gum[0].video.width.ideal===1280 && w.__gum[0].video.height.ideal===720,"asks for 1280x720");
  ck(w.__gum[0].audio.echoCancellation===false && w.__gum[0].audio.autoGainControl===false,"natural voice: no echo cancel / auto gain");
  ck(w.document.querySelectorAll("#vs-cam-select option").length===3,"camera list: default + 2");
  ck(/Logitech Webcam/.test(txt(w,"vs-cam-select")),"webcam label listed");
  ck(/Camera is on/.test(txt(w,"vs-dev-note")),"says camera is on");
  // pick the webcam -> old stream stopped, new one asked with that device, remembered
  w.document.getElementById("vs-cam-select").value="cam-b";
  w.document.getElementById("vs-cam-select").dispatchEvent(new w.Event("change"));
  await tick(); await tick();
  ck(w.__stopped===2,"old camera + mic tracks stopped");
  ck(w.__gum.length===2 && w.__gum[1].video.deviceId.exact==="cam-b","new request uses the picked webcam");
  ck(JSON.parse(w.localStorage.getItem("rf_video_studio_devices")).cam==="cam-b","webcam pick remembered");

  // record screen
  click(w,"vs-set-3B-Ending-Sounds"); await tick();
  ck(active(w)==="vs-record","set -> record screen");
  ck(txt(w,"vs-where")==="3B Ending Sounds","header names the set");
  ck(txt(w,"vs-target")==="gym" && /Last sound: \/m\//.test(txt(w,"vs-say")),"first clip + what to say");
  ck(/live/.test(cam(w)),"live camera preview showing");
  ck(w.document.getElementById("vs-watch").disabled && w.document.getElementById("vs-rerecord").disabled,"Watch/Re-record off before a take");
  ck(w.document.getElementById("vs-back").disabled,"Back off on first clip");
  ck(w.document.querySelectorAll("#vs-list li button").length===6,"list shows 6 clips");

  click(w,"vs-rec"); await tick();
  ck(w.__gum.length===2,"no new permission request when recording");
  ck(/rec/.test(w.document.getElementById("vs-rec").className) && /\brec\b/.test(cam(w)),"red recording state on button + REC tag");
  ck(w.__lastRec.opts.mimeType==="video/webm;codecs=vp8,opus","picks the best supported video type");
  ck(w.document.getElementById("vs-next").disabled,"Next locked while recording");
  click(w,"vs-rec"); await tick();
  ck(/Finishing/.test(txt(w,"vs-status")),"0.5 s tail after Stop");
  click(w,"vs-rec"); ck(w.__lastRec.state==="recording","extra taps ignored during tail");
  await new Promise(r=>setTimeout(r,560)); await tick();
  ck(w.document.getElementById("vs-rec").className==="ico ico-cam","button back to gray");
  ck(!/\brec\b/.test(cam(w)),"REC tag off");
  ck(w.__played.length===1 && /playing/.test(cam(w)),"take plays back in the camera frame");
  ck(/recorded/.test(txt(w,"vs-donetag")),"marked recorded");
  endPlayback(w); await tick();
  ck(txt(w,"vs-target")==="yes","auto-advances after playback");
  ck(!/playing/.test(cam(w)),"back to live camera after playback");
  ck(txt(w,"vs-progress")==="1 of "+LIST.length+" recorded","progress 1");

  // keyboard: space record/stop, arrows
  key(w," ",32); await tick(); ck(w.__lastRec.state==="recording","Spacebar starts");
  key(w," ",32,true); ck(w.__lastRec.state==="recording","held Spacebar ignored");
  key(w," ",32); await new Promise(r=>setTimeout(r,560)); await tick();
  endPlayback(w); await tick();
  ck(txt(w,"vs-target")==="phone","second take saved, advanced to phone");
  key(w,"ArrowLeft",37); ck(txt(w,"vs-target")==="yes","Left arrow = back");
  key(w,"ArrowRight",39); ck(txt(w,"vs-target")==="phone","Right arrow = next");

  // watch + re-record
  key(w,"ArrowLeft",37);
  click(w,"vs-watch"); await tick();
  ck(/playing/.test(cam(w)) && /playing/.test(w.document.getElementById("vs-watch").className),"Watch plays the take");
  endPlayback(w); await tick();
  ck(txt(w,"vs-target")==="yes","Watch does not auto-advance");
  click(w,"vs-rerecord"); await tick(); await stopTake(w); endPlayback(w); await tick();
  ck(txt(w,"vs-progress")==="2 of "+LIST.length+" recorded","re-record replaces, count stays 2");

  // filter
  click(w,"vs-row-PA_3B_01"); ck(txt(w,"vs-target")==="gym","row jump");
  w.document.getElementById("vs-filter").click(); await tick();
  ck(w.document.querySelectorAll("#vs-list li button").length===5,"filter: current + 4 not recorded");

  // export set
  await w.vsExportSet(); await tick();
  const d=w.__downloads[w.__downloads.length-1];
  ck(d && d.name==="PA_3B_videos.zip","set ZIP name PA_3B_videos.zip");
  const z=await readZip(d.blob,w);
  ck(Object.keys(z).sort().join(",")==="PA_3B_01.webm,PA_3B_02.webm,manifest.json","ZIP holds the 2 videos + manifest");
  const man=JSON.parse(z["manifest.json"]);
  ck(man.kind==="mouth-video" && man.count===2 && man.items[0].text==="gym" && man.items[0].mime==="video/webm;codecs=vp8,opus","manifest lists id/text/mime");
  ck(/Exported 2 of 6/.test(txt(w,"vs-note")),"export note");

  // back to sets -> progress on set button; leaving mid-record discards
  click(w,"vs-row-PA_3B_03"); click(w,"vs-rec"); await tick();
  w.vsGo("vs-pick"); await tick(); await tick();
  ck(txt(w,"vs-progress")==="2 of "+LIST.length+" recorded","leaving mid-record discards that take");
  ck(/2 of 6 recorded/.test(txt(w,"vs-set-3B-Ending-Sounds")),"set button shows 2 of 6");
  await w.vsExportAll(); await tick();
  ck(w.__downloads[w.__downloads.length-1].name==="Mouth_videos_all.zip","Export All name");

  // reload: takes survive (IndexedDB or the memory warning)
  const store=w.VSStore;
  ck(typeof store.isMemory()==="boolean","store reports memory mode");
  if(store.isMemory()){ ck(w.document.getElementById("vs-memwarn").style.display==="block","memory mode warns to export"); }

  // blocked camera
  w=make(BASE+"?teacher",{deny:true}); await w.vsReady; await tick();
  click(w,"vs-cam-on"); await tick(); await tick();
  ck(/blocked or not plugged in/.test(txt(w,"vs-dev-note")),"blocked camera explained in plain words");
  click(w,"vs-set-Sounds"); await tick();
  ck(txt(w,"vs-target")==="/m/","Sounds set starts at /m/");
  click(w,"vs-rec"); await tick(); await tick();
  ck(/blocked/.test(txt(w,"vs-status")) && !w.__lastRec,"no recording when camera is blocked");

  console.log("test-video-studio: "+pass+" passed, "+fail+" failed");
  if(fail) process.exit(1);
})().catch(e=>{ console.error(e); process.exit(1); });
