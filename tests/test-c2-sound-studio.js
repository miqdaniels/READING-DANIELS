/* Check 2: 44-sound slideshow + Teacher Sound Recording Studio (logic, in jsdom with a fake
   microphone/recorder; real-browser checks live in tests/e2e-c2-sound-studio.js). */
const fs=require('fs'), crypto=require('crypto');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8').replace('<script src="clips.js" defer></script>','<script>'+fs.readFileSync('./clips.js','utf8')+'</script>');
let pass=0, fail=0; function ok(c,m){ if(c){pass++;} else {fail++; console.log("FAIL:",m);} }
const inv=JSON.parse(fs.readFileSync('check2-slides/sounds.json','utf8'));
const PPTX="check2-slides/Reading_Foundations_Check_2_Royal_Purple_44_Sounds_Audio_Ready.pptx";
const state={ gum:0, deny:false, played:[], recStarts:0, downloads:[] };
const w=new JSDOM(html,{url:"https://miqdaniels.github.io/READING-DANIELS/?teacher",runScripts:"dangerously",pretendToBeVisual:true,
  beforeParse(w){
    w.HTMLElement.prototype.scrollIntoView=function(){}; w.scrollTo=function(){};
    class FakeRec{ constructor(s,o){ this.state="inactive"; this.mimeType=(o&&o.mimeType)||"audio/webm;codecs=opus"; }
      start(){ this.state="recording"; state.recStarts++; }
      stop(){ this.state="inactive"; var self=this; if(this.ondataavailable) this.ondataavailable({data:new w.Blob([new Uint8Array([1,2,3,4,5,6,7,8])],{type:this.mimeType})}); if(this.onstop) this.onstop(); } }
    FakeRec.isTypeSupported=function(t){ return /webm/.test(t); };
    w.MediaRecorder=FakeRec;
    Object.defineProperty(w.navigator,'mediaDevices',{value:{getUserMedia:function(){ state.gum++; if(state.deny){ var e=new Error("x"); e.name="NotAllowedError"; return Promise.reject(e); } return Promise.resolve({getTracks:function(){ return [{stop:function(){}}]; }}); }},configurable:true});
    w.URL.createObjectURL=function(){ return "blob:x"; }; w.URL.revokeObjectURL=function(){};
    w.Audio=function(u){ this.u=u; this.play=function(){ state.played.push(u); return Promise.resolve(); }; this.pause=function(){}; };
    var rc=w.document.createElement.bind(w.document);
    w.document.createElement=function(t){ var el=rc(t); if(t==="a"){ el.click=function(){ if(el.download){ state.downloads.push(el.download); } }; } return el; };
  }}).window;
const d=w.document; function $(i){ return d.getElementById(i); }
function active(){ var s=d.getElementsByClassName("screen"), i; for(i=0;i<s.length;i++){ if(/active/.test(s[i].className)){ return s[i].id; } } }
function snap(){ var o={}, i, k; for(i=0;i<w.localStorage.length;i++){ k=w.localStorage.key(i); o[k]=w.localStorage.getItem(k); } return JSON.stringify(o); }
function tick(ms){ return new Promise(function(r){ setTimeout(r,ms||30); }); }
function key(k){ d.dispatchEvent(new w.KeyboardEvent("keydown",{key:k,bubbles:true})); }
w.localStorage.setItem("rf_check1_attempts",JSON.stringify([{id:"a",studentId:"stu_gomezmiriam_p1",date:"2026-10-01",scores:Array(52).fill("")}]));
w.localStorage.setItem("rf_check2_attempts",JSON.stringify([{id:"b",studentId:"stu_gomezmiriam_p1",date:"2026-10-02",scores:["err"]}]));
const diagBefore=snap();

(async function(){
 /* ---- approved deck: untouched file, 45 slides, 44 sounds in deck order ---- */
 ok(crypto.createHash("sha256").update(fs.readFileSync(PPTX)).digest("hex")==="41bafb8be9059bbfb0aea31d14a02d28e96754309799a99547513c8157cce318","approved PowerPoint in repo is byte-identical to the supplied file");
 ok(inv.slideCount===45 && inv.slides.length===45 && inv.slides[0].kind==="menu" && inv.slides.slice(1).every(function(s){ return s.kind==="sound"; }),"deck inventory: 45 slides = 1 menu + 44 sound slides");
 var pngs=0, wide=true; for(var i=1;i<=45;i++){ var f="check2-slides/slides/"+(i<10?"0":"")+i+".png"; if(fs.existsSync(f)){ pngs++; if(fs.readFileSync(f).readUInt32BE(16)<1920) wide=false; } }
 ok(pngs===45 && wide,"45 rendered slide images, each at least 1920px wide");
 var D=w.C2S_DATA;
 ok(D.sounds.length===44 && D.menu.length===44,"app data has 44 sounds and 44 menu hotspots");
 ok(D.sounds.every(function(s,k){ var r=inv.slides[k+1]; return s.symbol===r.symbol && s.spelling===r.spelling && s.keyword===r.keyword && s.cue===r.cue && s.category===r.category; }),"app sound list matches the deck slide-for-slide, in order");
 ok(inv.slides[0].menu.every(function(m,k){ return m.jump===k+2 && m.label===inv.slides[k+1].symbol.split(" ")[0] || m.jump===k+2; }),"deck menu item N jumps to slide N+1");
 ok(inv.slides.slice(1).every(function(s,k){ return s.prev.jump===(k+2)-1 && s.menuBtn.jump===1 && s.next.jump===((k+2)===45?1:(k+3)); }),"deck Previous/Next/Menu jumps match what the viewer implements");
 var navSame=function(key){ return inv.slides.slice(1).every(function(s){ return JSON.stringify(s[key].box)===JSON.stringify(inv.slides[1][key].box); }); };
 ok(navSame("prev")&&navSame("menuBtn")&&navSame("next"),"nav button positions are identical on every sound slide");
 ok(D.sounds.length===44 && new Set(D.sounds.map(function(x){ return x.file; })).size===44,"44 unique recording file names");
 var names=[]; for(i=1;i<=44;i++){ names.push(w.c2sBase(i)); } ok(new Set(names).size===44 && names[0]==="c2_sound_01_b" && names[43]==="c2_sound_44_schwa" && names[20]==="c2_sound_21_th-voiceless","file names unique and based on slide order");

 /* ---- dashboard location ---- */
 w.go("teachNext"); d.querySelector('.tn-card[data-check="2"]').click();
 ok(active()==="c2Next" && /Interactive 44-Sound Slideshow/.test($("c2n-slideshow").textContent) && /Teacher Sound Recording Studio/.test($("c2n-slideshow").textContent),"Check 2 page shows both new resources");
 ok($("c2n-open-slideshow").textContent==="Open Slideshow" && $("c2n-dl-pptx").textContent==="Download PowerPoint" && $("c2n-dl-pptx").getAttribute("href")==="check2-slides/Reading_Foundations_Check_2_Royal_Purple_44_Sounds_Audio_Ready.pptx" && $("c2n-dl-pptx").hasAttribute("download"),"Open Slideshow + Download PowerPoint (original file link)");
 ok($("c2n-open-studio").textContent==="Record or manage sound audio","studio entry button");
 ok(!!$("c2n-teacher-pdf") && !!$("c2n-student-docx") && !!$("c2n-howto"),"existing sound cards, student cards and directions still on the page");
 ok(d.querySelectorAll("#teachNext .tn-card").length===7,"hub still has 7 cards (no duplicate Check 2 page)");

 /* ---- slideshow ---- */
 $("c2n-open-slideshow").click();
 ok(active()==="c2Show" && $("c2sh-img").getAttribute("src")==="check2-slides/slides/01.png","slideshow opens on the sound menu (slide 1)");
 ok(d.querySelectorAll("#c2sh-hot .c2sh-menu").length===44,"menu has 44 clickable sounds");
 var allOk=true; for(i=1;i<=44;i++){ w.c2shOpen(1); d.querySelectorAll("#c2sh-hot .c2sh-menu")[i-1].click(); var src=$("c2sh-img").getAttribute("src"); if(src!=="check2-slides/slides/"+(i+1<10?"0":"")+(i+1)+".png" || $("c2sh-img").getAttribute("alt").indexOf(D.sounds[i-1].symbol)<0){ allOk=false; } }
 ok(allOk,"every menu item opens the correct slide (image + alt text name the right sound)");
 w.c2shOpen(2); ok(!!d.querySelector('#c2sh-hot [aria-label="Previous"]') && !!d.querySelector('#c2sh-hot [aria-label="Sound Menu"]') && !!d.querySelector('#c2sh-hot [aria-label="Next"]') && d.querySelectorAll("#c2sh-hot .c2sh-speaker").length===1,"sound slide has Previous, Sound Menu, Next and one speaker icon");
 d.querySelector('#c2sh-hot [aria-label="Next"]').click(); ok($("c2sh-img").getAttribute("src").slice(-6)==="03.png","slide Next button -> slide 3");
 d.querySelector('#c2sh-hot [aria-label="Previous"]').click(); ok($("c2sh-img").getAttribute("src").slice(-6)==="02.png","slide Previous button -> slide 2");
 d.querySelector('#c2sh-hot [aria-label="Previous"]').click(); ok($("c2sh-img").getAttribute("src").slice(-6)==="01.png","Previous on first sound -> menu (as in the deck)");
 w.c2shOpen(2); d.querySelector('#c2sh-hot [aria-label="Sound Menu"]').click(); ok($("c2sh-img").getAttribute("src").slice(-6)==="01.png","slide Sound Menu button -> menu");
 w.c2shOpen(45); d.querySelector('#c2sh-hot [aria-label="Next"]').click(); ok($("c2sh-img").getAttribute("src").slice(-6)==="01.png","Next on the last sound -> menu (as in the deck)");
 w.c2shOpen(5); $("c2sh-next").click(); ok($("c2sh-img").getAttribute("src").slice(-6)==="06.png","page Next button");
 $("c2sh-prev").click(); $("c2sh-prev").click(); ok($("c2sh-img").getAttribute("src").slice(-6)==="04.png","page Previous button");
 key("ArrowRight"); ok($("c2sh-img").getAttribute("src").slice(-6)==="05.png","arrow key right"); key("ArrowLeft"); ok($("c2sh-img").getAttribute("src").slice(-6)==="04.png","arrow key left");
 $("c2sh-menu").click(); ok($("c2sh-img").getAttribute("src").slice(-6)==="01.png" && $("c2sh-prev").disabled,"page Sound Menu button; Previous disabled on the menu");
 var cnt=0; for(i=1;i<=45;i++){ w.c2shOpen(i); cnt++; } ok(cnt===45 && $("c2sh-count").textContent.indexOf("45")>-1,"all 45 slides reachable");
 w.c2shOpen(2); $("c2sh-full").click(); ok(true,"Full screen button does not throw without the Fullscreen API (real fullscreen checked in Chromium)");

 /* ---- speaker: no recording -> subtle message, nothing plays; never autoplays ---- */
 state.played.length=0; w.c2shOpen(2);
 await tick(); ok(state.played.length===0,"opening a slide plays nothing");
 d.querySelector("#c2sh-hot .c2sh-speaker").click(); await tick();
 ok(/Audio not recorded yet/.test($("c2sh-msg").textContent) && state.played.length===0,"missing recording: 'Audio not recorded yet', no sound, no substitute");

 /* ---- studio: opens, nothing records until Record is clicked ---- */
 w.go("c2Studio"); await tick();
 ok(active()==="c2Studio" && state.gum===0 && state.recStarts===0,"studio opens without touching the microphone");
 ok(d.querySelectorAll("#c2st-list .c2st-item").length===44 && $("c2st-progress").textContent==="0 of 44 Sounds Recorded.","44 sounds listed, progress 0 of 44");
 var firstLabels=Array.prototype.map.call(d.querySelectorAll("#c2st-list .c2st-sym"),function(e){ return e.textContent; }); ok(firstLabels.join("|")===D.sounds.map(function(s){return s.symbol;}).join("|"),"studio list is in slideshow order");
 ok(/Sound 1 of 44/.test($("c2st-panel").textContent) && /bat/.test($("c2st-panel").textContent) && /Lips together\. Voice on\./.test($("c2st-panel").textContent) && /Spelling/.test($("c2st-panel").textContent),"detail shows number, symbol, spelling, keyword and articulation cue");
 ok(/“buh”/.test(d.querySelector("#c2Studio .tn-info").textContent),"reminder about not adding a vowel (buh)");
 ok(["c2st-record","c2st-stop","c2st-listen","c2st-save","c2st-again","c2st-prev","c2st-next"].every(function(id){ return !!$(id); }),"Record, Stop, Listen, Save Recording, Record Again, Previous Sound, Next Sound present");
 ok($("c2st-stop").disabled && $("c2st-listen").disabled && $("c2st-save").disabled && $("c2st-again").disabled && $("c2st-prev").disabled,"Stop/Listen/Save/Record Again/Previous disabled at the start");
 ok(/Not recorded/.test($("c2st-status").textContent),"status: Not recorded");
 w.c2stSelect(12); ok(/Sound 12 of 44/.test($("c2st-panel").textContent) && /\/r\//.test($("c2st-panel").textContent),"can jump to any sound (no forced order)");
 d.querySelector('.c2st-item[data-n="7"]').click(); ok(/Sound 7 of 44/.test($("c2st-panel").textContent) && !!$("c2st-flag"),"list click selects; ambiguous sounds show a 'Review before recording' flag");
 ok(["7","21","22","24","34","36","44","37","38"].every(function(n){ return !!w.C2S_FLAGS[n]; }),"flags exist for the ambiguous sounds (j, th x2, zh, yoo, short oo, schwa, oi, ow)");

 /* ---- record -> stop -> listen -> save ---- */
 w.c2stSelect(1); $("c2st-record").click(); await tick();
 ok(state.gum===1 && state.recStarts===1,"Record asks for the microphone once and starts recording");
 ok(!!d.querySelector(".c2st-recdot") && /Recording/.test($("c2st-status").textContent) && $("c2st-record").disabled && !$("c2st-stop").disabled,"clear recording indicator; Stop enabled, Record disabled");
 w.c2stSelect(2); ok(/Sound 1 of 44/.test($("c2st-panel").textContent) && /Stop the recording/.test($("c2st-note").textContent),"cannot switch sounds mid-recording");
 $("c2st-stop").click(); await tick();
 ok(/Draft/.test($("c2st-status").textContent) && !$("c2st-listen").disabled && !$("c2st-save").disabled,"after Stop: draft, Listen and Save enabled");
 ok(/audio\/webm/.test($("c2st-format").textContent),"actual audio format reported (audio/webm;codecs=opus)");
 state.played.length=0; $("c2st-listen").click(); await tick(); ok(state.played.length===1,"Listen plays the draft back");
 ok($("c2st-progress").textContent==="0 of 44 Sounds Recorded.","a draft does not count as saved");
 $("c2st-save").click(); await tick(30);
 ok(/Recorded/.test($("c2st-status").textContent) && $("c2st-progress").textContent==="1 of 44 Sounds Recorded." && d.querySelector('.c2st-item[data-n="1"]').className.indexOf("done")>-1,"Save Recording stores it; progress 1 of 44; list marks it");
 ok(/c2_sound_01_b\.webm/.test($("c2st-note").textContent),"save message shows the file name");
 /* record again replaces only on save */
 $("c2st-again").click(); await tick(); ok(state.recStarts===2 && /Recording/.test($("c2st-status").textContent),"Record Again starts a new take"); $("c2st-stop").click(); await tick(); $("c2st-save").click(); await tick(30);
 ok($("c2st-progress").textContent==="1 of 44 Sounds Recorded.","re-recording replaces the same sound (still 1 of 44)");
 /* record sound 12 and 44 out of order */
 w.c2stSelect(12); $("c2st-record").click(); await tick(); $("c2st-stop").click(); await tick(); $("c2st-save").click(); await tick(30);
 w.c2stSelect(44); $("c2st-record").click(); await tick(); $("c2st-stop").click(); await tick(); $("c2st-save").click(); await tick(30);
 ok($("c2st-progress").textContent==="3 of 44 Sounds Recorded.","out-of-order recording works (3 of 44)");
 ok(/memory|Warning: this browser cannot keep recordings/.test($("c2st-storage").textContent),"if the browser has no IndexedDB the studio says recordings will not persist (jsdom has none)");

 /* ---- slideshow speaker with a recording plays that sound once ---- */
 w.c2shOpen(13); state.played.length=0; await tick(); ok(state.played.length===0,"slide 13 (sound 12 /r/) opened: no autoplay");
 d.querySelector("#c2sh-hot .c2sh-speaker").click(); await tick(); ok(state.played.length===1 && /Playing \/r\/ \(sound 12\)/.test($("c2sh-msg").textContent),"speaker on a recorded sound plays it once and names the sound");
 w.c2shOpen(3); d.querySelector("#c2sh-hot .c2sh-speaker").click(); await tick(); ok(/Audio not recorded yet/.test($("c2sh-msg").textContent) && state.played.length===1,"neighboring unrecorded sound still says 'not recorded yet'");
 var stopped=0; var origStop=w.stopAllAudio; w.stopAllAudio=function(){ stopped++; return origStop(); }; w.c2shStep(1); ok(stopped>=1,"navigating to another slide stops any playing audio");

 /* ---- export: ZIP + manifest ---- */
 w.go("c2Studio"); await tick();
 var captured=null; var origDl=w.downloadBlob; w.downloadBlob=function(b,n){ captured={blob:b,name:n}; };
 await tick(); $("c2st-export").click(); await tick(150);
 ok(captured && /^Reading_Foundations_Check2_Sound_Audio_\d{4}_\d{2}_\d{2}\.zip$/.test(captured.name),"export file name ("+(captured&&captured.name)+")");
 var buf=await new Promise(function(r){ var fr=new w.FileReader(); fr.onload=function(){ r(fr.result); }; fr.readAsArrayBuffer(captured.blob); });
 var z=w.c2zParse(buf); var names2=z.files.map(function(f){ return f.name; }).sort();
 ok(z.error==="" && names2.join(",")==="README.txt,audio/c2_sound_01_b.webm,audio/c2_sound_12_r.webm,audio/c2_sound_44_schwa.webm,manifest.json","ZIP holds manifest, README and exactly the 3 recorded files ("+names2+")");
 var man=JSON.parse(w.c2sBytesToText(z.files.filter(function(f){ return f.name==="manifest.json"; })[0].data));
 ok(man.sounds.length===44 && man.recordedCount===3 && man.sounds[0].file==="audio/c2_sound_01_b.webm" && man.sounds[11].symbol==="/r/" && man.sounds[11].slide===13 && man.sounds[1].recorded===false && man.sounds[1].file===null,"manifest maps every sound (slide number, symbol, file) and marks unrecorded ones");
 ok(man.sounds.every(function(s,k){ return s.number===k+1 && s.symbol===D.sounds[k].symbol; }),"manifest order and symbols match the deck");
 var tmp="/tmp/c2zip_test.zip"; fs.writeFileSync(tmp,Buffer.from(buf)); var out=require("child_process").spawnSync("unzip",["-tq",tmp],{encoding:"utf8"}); ok(/No errors detected/.test(out.stdout),"the ZIP passes an independent unzip integrity check");
 /* ---- import into a clean store (new window) ---- */
 var w2=new JSDOM(html,{url:"https://miqdaniels.github.io/READING-DANIELS/?teacher",runScripts:"dangerously",pretendToBeVisual:true,beforeParse:function(x){ x.HTMLElement.prototype.scrollIntoView=function(){}; x.scrollTo=function(){}; x.URL.createObjectURL=function(){return "blob:x";}; }}).window;
 var d2=w2.document; w2.go("c2Studio"); await tick();
 function fileInput(win,input,blob,name){ var f=new win.File([blob],name); Object.defineProperty(input,"files",{value:[f],configurable:true}); input.onchange(); }
 fileInput(w2,d2.getElementById("c2st-import-file"),new w2.Blob([new Uint8Array(buf)]),"x.zip"); await tick(150);
 ok(/Found 3 recordings/.test(d2.getElementById("c2st-note").textContent) && !!d2.getElementById("c2st-import-go"),"import previews 'Found 3 recordings' and waits for confirmation");
 ok(d2.getElementById("c2st-progress").textContent==="0 of 44 Sounds Recorded.","nothing is restored before confirming");
 d2.getElementById("c2st-import-go").click(); await tick(150);
 ok(d2.getElementById("c2st-progress").textContent==="3 of 44 Sounds Recorded." && w2.eval("C2ST_SAVED[12]&&C2ST_SAVED[44]&&C2ST_SAVED[1]?1:0")===1,"import restores the 3 recordings to the right sounds");
 var rec12=await w2.C2SStore.get(12); var rec44=await w2.C2SStore.get(44); ok(rec12 && rec44 && rec12.size===8 && rec44.n===44 && w2.c2sBase(rec12.n)==="c2_sound_12_r","restored audio is attached to the correct sound numbers");
 /* wrong files */
 fileInput(w2,d2.getElementById("c2st-import-file"),new w2.Blob([new Uint8Array([1,2,3])]),"junk.zip"); await tick(100); ok(/not a ZIP/.test(d2.getElementById("c2st-note").textContent),"a non-ZIP file is rejected with a message");
 var evil=w.c2zBuild([{name:"manifest.json",data:w.c2zUtf8(JSON.stringify({app:"reading-foundations-check2-sound-audio",sounds:[{number:12,symbol:"/WRONG/",recorded:true,file:"audio/c2_sound_12_r.webm",mimeType:"audio/webm"},{number:99,symbol:"/x/",recorded:true,file:"audio/c2_sound_99_x.webm"}]}))},{name:"audio/c2_sound_12_r.webm",data:new Uint8Array([9,9,9])}]);
 var ebuf=await new Promise(function(r){ var fr=new w.FileReader(); fr.onload=function(){ r(fr.result); }; fr.readAsArrayBuffer(evil); });
 fileInput(w2,d2.getElementById("c2st-import-file"),new w2.Blob([new Uint8Array(ebuf)]),"bad.zip"); await tick(100); ok(/No usable recordings/.test(d2.getElementById("c2st-note").textContent),"entries that do not match the sound inventory are skipped, not imported");
 fileInput(w2,d2.getElementById("c2st-import-file"),new w2.Blob([new Uint8Array(buf)]),"x.zip"); await tick(100); d2.getElementById("c2st-import-cancel").click(); await tick(); ok(/cancelled/.test(d2.getElementById("c2st-note").textContent),"Cancel leaves everything unchanged");

 /* ---- microphone permission handling ---- */
 w.go("c2Studio"); await tick(); state.deny=true; w.c2stSelect(5); $("c2st-record").click(); await tick(50);
 ok(/microphone is blocked/.test($("c2st-note").textContent) && !d.querySelector(".c2st-recdot") && state.recStarts===4,"permission denied: clear message, nothing records");
 state.deny=false;

 /* ---- nothing diagnostic or student-related changed ---- */
 ok(snap()===diagBefore,"all localStorage (students, scores, Check 1/2 data, backups) identical to before — recordings never touch it");
 ok(JSON.stringify(Object.keys(JSON.parse(diagBefore)).filter(function(k){ return /sound|c2s/i.test(k); }))==="[]","no sound-audio keys in localStorage");
 ok(w.C2_ITEMS.length===31,"Check 2 assessment is still 31 items");
 ok(!/speechSynthesis|SpeechSynthesisUtterance/.test(html.slice(html.indexOf("Check 2: 44-Sound Slideshow"),html.indexOf("Check 2: 44-Sound Slideshow")+30000)),"no text-to-speech in the new code");
 ok(!/=>/.test(html.slice(html.indexOf("Check 2: 44-Sound Slideshow"),html.indexOf("Check 2: 44-Sound Slideshow")+30000)) && !/\bconst |\blet /.test(html.slice(html.indexOf("Check 2: 44-Sound Slideshow"),html.indexOf("Check 2: 44-Sound Slideshow")+30000).replace(/[a-z ]*let [a-z]/g,"")),"new code is ES5");
 ok(/<\/script>\s*<\/body>\s*<\/html>\s*$/.test(html),"index.html ends with </script></body></html>");
 console.log("c2-sound-studio: "+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
})();
