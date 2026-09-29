const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./test.html','utf8');

let pass=0,fail=0;
function ck(c,m){ if(c){pass++;} else {fail++; console.log("FAIL:",m);} }

// ---------- static checks ----------
ck(/<\/script>\s*<\/body>\s*<\/html>\s*$/.test(html),"file ends with </script></body></html>");
const script=html.slice(html.indexOf("<script>"),html.lastIndexOf("</script>"));
ck(script.indexOf("=>")<0,"no arrow functions");
ck(!/\bconst\s/.test(script),"no const");
ck(!/\blet\s/.test(script),"no let");
ck(script.indexOf("MediaRecorder")<0,"no recording (no MediaRecorder)");
ck(script.indexOf("fetch(")<0 && script.indexOf("XMLHttpRequest")<0,"no network upload calls");
ck(script.indexOf("localStorage")<0 && script.indexOf("indexedDB")<0,"nothing saved to storage");

// ---------- DOM + behavior checks ----------
const dom=new JSDOM(html,{url:"https://miqdaniels.github.io/READING-DANIELS/test.html",runScripts:"dangerously",pretendToBeVisual:true});
const w=dom.window, d=w.document;

var h1=d.querySelector("h1");
ck(!!h1 && h1.textContent==="READING FOUNDATIONS FOR TEENS","big title shows (got '"+(h1?h1.textContent:null)+"')");
var byline=d.querySelector(".byline");
ck(!!byline && byline.textContent==="by AI Academy","byline shows under the title (got '"+(byline?byline.textContent:null)+"')");
var msg=d.querySelector(".msg");
ck(!!msg && msg.textContent.indexOf("If you can see this, the link works!")===0,"big message shows (got '"+(msg?msg.textContent:null)+"')");

var micBtn=d.getElementById("micBtn");
ck(!!micBtn,"mic button exists");
ck(!!micBtn && w.getComputedStyle(micBtn).backgroundColor==="rgb(224, 35, 61)","mic button is red");
ck(!!micBtn && parseInt(w.getComputedStyle(micBtn).borderRadius,10)>0,"mic button has rounded corners (not a circle/plain square)");

// tap flow: permission denied
var deniedCalled=false;
w.navigator.mediaDevices={ getUserMedia:function(){ deniedCalled=true; return Promise.reject(new Error("denied")); } };
micBtn.dispatchEvent(new w.Event("click"));
ck(deniedCalled,"tapping the mic button asks for mic permission (getUserMedia called)");

setTimeout(function(){
  var statusEl=d.getElementById("status");
  ck(statusEl.className==="err","a blocked permission shows an honest error, not a fake success");
  ck(!micBtn.disabled,"button re-enables after a permission error so the student can try again");

  // tap flow: permission granted -> loud audio -> success message, no recording started
  var fakeAnalyser={
    fftSize:1024,
    getByteTimeDomainData:function(arr){ var i; for(i=0;i<arr.length;i++){ arr[i]=250; } }
  };
  var fakeCtx={
    createMediaStreamSource:function(){ return { connect:function(){} }; },
    createAnalyser:function(){ return fakeAnalyser; }
  };
  w.AudioContext=function(){ return fakeCtx; };
  w.navigator.mediaDevices={ getUserMedia:function(){ return Promise.resolve({}); } };
  var rafCb=null;
  w.requestAnimationFrame=function(cb){ rafCb=cb; };

  micBtn.dispatchEvent(new w.Event("click"));

  setTimeout(function(){
    var statusEl2=d.getElementById("status");
    ck(statusEl2.className==="ok" && /Your mic works!/.test(statusEl2.textContent),"loud mic input shows 'Your mic works!' (got '"+statusEl2.textContent+"')");
    var barFill=d.getElementById("barFill");
    ck(barFill.style.width!=="0%" && barFill.style.width!=="","the level bar moves when the student talks (width="+barFill.style.width+")");
    ck(typeof rafCb==="function","the level loop only re-checks via requestAnimationFrame, it never records");

    // pure-function checks for the level math itself
    var silentArr=new Uint8Array(1024); var j; for(j=0;j<silentArr.length;j++){ silentArr[j]=128; }
    ck(w.rfComputeLevel(silentArr)===0,"silence (flat midpoint, byte value 128) computes to a 0 level");
    var loudArr=new Uint8Array(1024); var i; for(i=0;i<loudArr.length;i++){ loudArr[i]=250; }
    ck(w.rfComputeLevel(loudArr)>18,"loud input computes to a level above the success threshold");

    console.log("\n=== "+pass+" passed, "+fail+" failed ===");
    process.exit(fail?1:0);
  },0);
},0);
