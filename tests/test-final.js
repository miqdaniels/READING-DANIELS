const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8');

// Stub MediaRecorder + getUserMedia before script runs
const dom=new JSDOM(html,{url:"https://miqdaniels.github.io/READING-DANIELS/",runScripts:"dangerously",pretendToBeVisual:true,
  beforeParse(w){
    w.HTMLElement.prototype.scrollIntoView=function(){};
    w.scrollTo=function(){};
    class FakeRec{
      constructor(s){this.state="inactive";this.mimeType="audio/webm";this._s=s;}
      start(){this.state="recording"; if(this.ondataavailable) this.ondataavailable({data:{size:10,type:"audio/webm"}});}
      stop(){this.state="inactive"; if(this.onstop) this.onstop();}
    }
    w.MediaRecorder=FakeRec;
    w.URL.createObjectURL=function(){return "blob:x";};
    w.URL.revokeObjectURL=function(){};
    Object.defineProperty(w.navigator,'mediaDevices',{value:{getUserMedia:function(){return Promise.resolve({getTracks:function(){return [{stop:function(){}}];}});}},configurable:true});
  }
});
const w=dom.window, d=w.document;

function activeId(){ var s=d.getElementsByClassName("screen"); for(var i=0;i<s.length;i++) if(/active/.test(s[i].className)) return s[i].id; return null; }
function chunks(){ return d.querySelectorAll('#f-list .f-chunk'); }
function hl(){ var e=d.querySelectorAll('#f-list .f-hl'); return e.length?e[0].textContent:null; }

setTimeout(function(){
  let pass=0,fail=0;
  function ck(c,m){ if(c){pass++;} else {fail++; console.log("FAIL:",m);} }

  // pick class 1, student 1, enter groups
  w.CLASSES && w.go("s-pick"); w.buildClasses && w.buildClasses();
  w.CURCLASS=w.CLASSES[0]; w.READER=w.CLASSES[0].students[0];
  w.CURGROUP=w.GROUPS[0];
  w.go("s-final");

  ck(activeId()==="s-final","on s-final");
  var chs=chunks();
  ck(chs.length>0,"chunks rendered ("+chs.length+")");

  // verify chunks of first sentence rebuild it
  var g0=w.GROUPS[0].name;
  var idxs=w.groupWords(g0);
  var firstWord=w.SENTENCES[idxs[0]].word;
  var joined=(w.FCHUNKS[firstWord]||[]).join(" ");
  ck(joined===w.SENTENCES[idxs[0]].sentence,"chunk join == sentence for '"+firstWord+"'");

  // TAP MODE: start recording, advance through, check highlight moves
  ck(w.fMode==="tap","default mode tap");
  w.fStart();
  setTimeout(function(){
    var first=hl();
    ck(first!==null,"highlight shows after start ("+JSON.stringify(first)+")");
    var seqLen=w.FSEQ.length;
    // tap to second
    w.fAdvance();
    var second=hl();
    ck(second!==first,"highlight advanced on tap");
    // tap to the end -> should reach 'Done' then stop -> after panel shows
    var guard=0;
    while(w.fp < seqLen-1 && guard<500){ w.fAdvance(); guard++; }
    // one more advance finishes
    w.fAdvance();
    var after=d.getElementById("f-after").innerHTML;
    ck(/Save my file/.test(after),"reached save panel after finishing tap read");

    // PACER MODE: flip student to pacer, re-enter
    w.setPacer(w.READER.id,true);
    ck(w.Settings.pacer(w.READER.id)===true,"pacer flag set");
    w.go("s-final");
    ck(w.fMode==="pacer","mode is pacer after toggle");
    w.fStart();
    setTimeout(function(){
      var pl=d.getElementById("f-pause");
      ck(pl!==null,"pause button present in pacer mode");
      // pause + resume
      w.fTogglePause(); ck(w.fPaused===true,"paused");
      w.fTogglePause(); ck(w.fPaused===false,"resumed");
      w.fStop();

      // pacer list renders per-student toggles
      w.go("s-settings");
      var rows=d.querySelectorAll('#pacer-list .pacer-row');
      ck(rows.length>0,"pacer list rows rendered ("+rows.length+")");

      console.log("\n=== "+pass+" passed, "+fail+" failed ===");
      process.exit(fail?1:0);
    },60);
  },60);
},400);
