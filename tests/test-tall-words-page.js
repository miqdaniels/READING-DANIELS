// tall-words.html: student picker, group > pattern > mode/game, Build (slider) + chain highlight, Read, Dictation,
// the four games (right / wrong answers, distractors one sound apart), missing-clip messages, sound toggle,
// progress per student that survives a refresh, teacher view. jsdom, real site URL, NO text-to-speech.
var fs=require('fs'), JSDOM=require('jsdom').JSDOM;
var html=fs.readFileSync('./tall-words.html','utf8');
var core=fs.readFileSync('./tall-words-core.js','utf8'), aud=fs.readFileSync('./tall-audio.js','utf8'), roster=fs.readFileSync('./tall-roster.js','utf8');
var raw=JSON.parse(fs.readFileSync('./data/tall-word-lists.json','utf8'));
var TW=require('../tall-words-core.js');
var BASE="https://miqdaniels.github.io/READING-DANIELS/";
var pass=0, fail=0; function ok(c,m){ if(c){ pass++; } else { fail++; console.log("FAIL: "+m); } }
/* ---- static rules ---- */
ok(/<\/script><\/body><\/html>\s*$/.test(html),"page ends with </script></body></html>");
var code=html.slice(html.indexOf("<script>\n/* ====")).replace(/"(?:[^"\\\n]|\\.)*"/g,'""').replace(/'(?:[^'\\\n]|\\.)*'/g,"''");
ok(code.indexOf("=>")<0 && !/(^|[;{}\s(])(const|let)\s+[A-Za-z_$]/.test(code) && !/`/.test(code),"page script is ES5 (no arrows, const, let, template strings)");
ok(!/speechSynthesis|SpeechSynthesisUtterance/.test(html+core),"no text-to-speech anywhere");
ok(/#298646|--tall-green/.test(html) && /Montserrat/.test(html) && /Atkinson Hyperlegible Next/.test(html),"Foundations green + Montserrat + Atkinson");
ok(!/0F766E/i.test(html),"teal is not used on this Foundations page");

function make(o){
  o=o||{};
  var page=html.replace('<script src="tall-words-core.js"></script>','<script>'+core+'</script>').replace('<script src="tall-audio.js"></script>','<script>'+aud+'</script>')
    .replace('<script src="tall-word-audio.js"></script>','<script>var TALL_WORD_AUDIO={};window.TALL_WORD_AUDIO=TALL_WORD_AUDIO;</script>').replace('<script src="tall-roster.js"></script>','<script>'+roster+'</script>');
  var w=new JSDOM(page,{url:BASE+"tall-words.html"+(o.teacher?"?teacher":""),runScripts:"dangerously",pretendToBeVisual:true,beforeParse:function(win){
    win.scrollTo=function(){}; win.__TW_NO_LOOP=true; win.TW_DATA_RAW=o.data||raw; win.__played=[];
    var k; if(o.storage){ for(k in o.storage){ win.localStorage.setItem(k,o.storage[k]); } }
    win.Audio=function(src){ var a={src:src,onended:null,onerror:null,paused:true,play:function(){ a.paused=false; win.__played.push(src); return Promise.resolve(); },pause:function(){ a.paused=true; }}; return a; };
  }}).window;
  return w;
}
function $(w,id){ return w.document.getElementById(id); }
function click(w,id){ var e=$(w,id); if(!e){ ok(false,"missing #"+id); return; } e.dispatchEvent(new w.MouseEvent("click",{bubbles:true})); }
function key(w,k){ w.document.dispatchEvent(new w.KeyboardEvent("keydown",{key:k,bubbles:true,cancelable:true})); }
function active(w){ var a=w.document.querySelector(".screen.active"); return a&&a.id; }
function txt(w,id){ return $(w,id).textContent; }
function snap(w){ var o={}, i, k; for(i=0;i<w.localStorage.length;i++){ k=w.localStorage.key(i); o[k]=w.localStorage.getItem(k); } return o; }
function rec(w,words){ words.forEach(function(x){ w.TALL_WORD_AUDIO[TW.wordId(x)]="audio/TALL-W/"+TW.wordId(x)+".webm"; }); }
function recAll(w){ w.TW.uniqueWords(w.S.lists).forEach(function(x){ w.TALL_WORD_AUDIO[x.id]="audio/TALL-W/"+x.id+".webm"; }); }
function tileBtn(w,prefix,g){ var b=w.document.querySelectorAll("#"+prefix+"-bank .tile"), i; for(i=0;i<b.length;i++){ if(b[i].textContent===g){ return b[i].id; } } return null; }
function build(w,prefix,word,opts){ var t=TW.tilesFor(word,opts), i; t.forEach(function(x,i){ var id=tileBtn(w,prefix,x.g); if(!id){ ok(false,"tile "+x.g+" missing from the bank for "+word); return; } click(w,id); click(w,prefix+"-box-"+i); }); }
var ANA={cls:0,stu:0};

/* roster used by the page = the app's roster (ids and short names) */
(function(){ var idx=fs.readFileSync('./index.html','utf8'), vm=require('vm'), m=idx.match(/var CLASSES=\[[\s\S]*?\n\];/), c={}; vm.createContext(c); vm.runInContext(m[0]+";this.C=CLASSES",c);
  var R=require('../tall-roster.js'); ok(JSON.stringify(R)===JSON.stringify(c.C.map(function(k){ return {id:k.id,label:k.label,students:k.students.map(function(s){ return {id:s.id,name:s.name}; })}; })),"tall-roster.js matches the app's roster (re-run tools/build-tall-roster.js if the roster changes)");
  ok(R.every(function(k){ return k.students.every(function(s){ return !/\s[A-Z][a-z]+$/.test(s.name); }); }),"names are first name + last initial only");
  var doors=idx.indexOf('id="teacher-doors"'), tile=idx.indexOf('id="tile-tall-words"'); ok(tile>doors && doors>-1 && idx.indexOf("tall-words.html?teacher")>-1,"Word Builder tile is on the teacher dashboard"); })();
/* ---- 1. who is working; remembered after a refresh ---- */
var w=make();
ok(active(w)==="tw-who","opens on 'Who is working?'");
ok(w.document.querySelectorAll("#tw-classes button").length===3 && w.document.querySelectorAll("#tw-students button").length===10,"3 classes; class 1 lists its 10 students (first name + last initial)");
click(w,"tw-stu-stu_gomezmiriam_p1"); ok(active(w)==="tw-home" && /Miriam G\./.test(txt(w,"tw-who-label")),"pick Miriam G. -> pattern picker");
ok(JSON.parse(w.localStorage.getItem("rf_tw_student")).id==="stu_gomezmiriam_p1","student saved on this device");
var w2=make({storage:snap(w)}); ok(active(w2)==="tw-home" && /Miriam G\./.test(txt(w2,"tw-who-label")),"after a refresh the student is remembered");

/* ---- 2. picker: group > pattern; locks ---- */
var heads=[].map.call(w.document.querySelectorAll("#tw-groups h3"),function(h){ return h.textContent; });
ok(heads.join("|")==="Short Vowels|Digraphs" && w.document.querySelectorAll("#tw-groups .pcard").length===11,"Group > pattern: 2 groups, 11 pattern cards");
ok(!w.document.querySelector("#tw-pat-short-a").className.match(/locked/) && /locked/.test($(w,"tw-pat-short-i").className),"first pattern open, the next is locked");
click(w,"tw-pat-short-i"); ok(active(w)==="tw-home","a locked pattern does not open");
click(w,"tw-pat-short-a"); ok(active(w)==="tw-pattern" && txt(w,"tw-pat-title")==="Short a","open Short a");
ok(w.document.querySelectorAll("#tw-modes button").length===3 && w.document.querySelectorAll("#tw-games button").length===4,"3 practice modes + 4 games");
ok(["Word Blaster","Bubble Pop","Memory Match","Beat Your Time"].every(function(n){ return txt(w,"tw-games").indexOf(n)>-1; }),"the four games are listed");

/* ---- 3. BUILD ---- */
click(w,"tw-mode-build"); ok(active(w)==="tw-build" && w.document.querySelector("#tw-build-word").textContent.indexOf("at")===0,"Build opens on the first word: at");
ok(/Word 1 of 10/.test(txt(w,"tw-build-count")) && w.document.querySelectorAll("#tw-build-boxes .box").length===2,"2 sound boxes for 'at'");
ok(txt(w,"tw-build-hear")==="Not recorded yet." && w.__played.length===0,"word not recorded: the button says 'Not recorded yet.', nothing plays");
ok(w.document.querySelector("#tw-build-word .star") && !w.document.querySelector("#tw-build-boxes .changed"),"at is a First 100 word (small star); first word has no highlight");
var ids=[].map.call(w.document.querySelectorAll("#tw-build-bank .tile"),function(b){ return b.textContent; });
ok(ids.indexOf("a")>-1 && ids.indexOf("t")>-1 && ids.indexOf("s")>-1 && ids.length===new Set(ids).size,"tile bank: one of each tile used in the chain");
/* tap a tile = hear its sound clip */
click(w,tileBtn(w,"tw-build","a")); ok(w.__played.pop()==="audio/TALL/SND_25_S.webm" && /short a/.test(txt(w,"tw-build-say")),"tap tile 'a' plays SND_25_S (short a)");
click(w,tileBtn(w,"tw-build","t")); ok(w.__played.pop()==="audio/TALL/SND_03_S.webm","tap tile 't' plays SND_03_S");
/* wrong, then right */
click(w,tileBtn(w,"tw-build","s")); click(w,"tw-build-box-0"); click(w,tileBtn(w,"tw-build","a")); click(w,"tw-build-box-1");
ok($(w,"tw-build-box-0").className.indexOf("wrong")>-1 && $(w,"tw-build-box-1").className.indexOf("wrong")>-1 && /not right/.test(txt(w,"tw-build-note")),"wrong tiles: both boxes marked wrong");
ok($(w,"tw-build-next").style.display==="none","no Next until the word is right");
click(w,"tw-build-box-0"); click(w,"tw-build-box-1");              /* tap a filled box with nothing armed clears it */
build(w,"tw-build","at");
ok($(w,"tw-build-box-0").className.indexOf("right")>-1 && /That is the word/.test(txt(w,"tw-build-note")) && $(w,"tw-build-next").style.display!=="none","right tiles: boxes marked right, Next appears");
/* chain highlight */
click(w,"tw-build-next"); ok(/sat/.test(txt(w,"tw-build-word")) && $(w,"tw-build-box-0").className.indexOf("changed")>-1 && w.document.querySelectorAll("#tw-build-boxes .changed").length===1,"at -> sat: box 1 (the new first sound) is highlighted, only that one");
build(w,"tw-build","sat"); click(w,"tw-build-next");
ok(/sad/.test(txt(w,"tw-build-word")) && $(w,"tw-build-box-2").className.indexOf("changed")>-1 && w.document.querySelectorAll("#tw-build-boxes .changed").length===1,"sat -> sad: the last box is highlighted");
build(w,"tw-build","sad"); click(w,"tw-build-next"); build(w,"tw-build","mad"); click(w,"tw-build-next");
ok(/map/.test(txt(w,"tw-build-word")) && $(w,"tw-build-box-2").className.indexOf("changed")>-1,"mad -> map: last box");
/* hear the word when recorded */
rec(w,["map"]); click(w,"tw-build-hear"); ok(w.__played.pop()==="audio/TALL-W/WRD_map.webm","'Hear the word' plays the WRD_ clip");
/* keyboard build: arrows pick a tile, digit places, Backspace clears */
key(w,"ArrowRight"); var armed=w.B.armed; ok(!!armed && w.__played.length>0,"ArrowRight arms a tile and plays its sound");
key(w,"1"); ok(w.B.boxes[0] && w.B.boxes[0].g===armed.g,"the digit 1 places the tile in box 1");
key(w,"Backspace"); ok(!w.B.boxes[0],"Backspace clears the last filled box");
/* drag build: pointer events, drop on a box */
(function(){
  var t=tileBtn(w,"tw-build","m"), idx=parseInt($(w,t).getAttribute("data-i"),10);
  w.document.elementFromPoint=function(){ return $(w,"tw-build-box-0"); };
  w.twTileDown({button:0,clientX:10,clientY:10},idx);
  w.document.dispatchEvent(new w.MouseEvent("pointermove",{clientX:60,clientY:60,bubbles:true}));
  w.document.dispatchEvent(new w.MouseEvent("pointerup",{clientX:60,clientY:60,bubbles:true}));
  ok(w.B.boxes[0] && w.B.boxes[0].g==="m","dragging tile 'm' onto box 1 places it");
  ok(!w.document.querySelector(".ghost"),"the drag ghost is removed");
})();
click(w,"tw-build-box-0"); build(w,"tw-build","map"); click(w,"tw-build-next");
["cap","can","van","fan","tan"].forEach(function(x){ ok(new RegExp(x).test(txt(w,"tw-build-word")),"chain word "+x); build(w,"tw-build",x); if(x==="tan"){ ok(txt(w,"tw-build-next")==="Finish","last word: Finish"); } click(w,"tw-build-next"); });
ok(active(w)==="tw-result" && /Build finished/.test(txt(w,"tw-result-title")),"Build finished");
var pg=JSON.parse(w.localStorage.getItem("rf_tw_progress"))["stu_gomezmiriam_p1"].patterns["short-a"];
ok(pg.buildDone===true,"progress saved for this student: Build done");
/* next pattern unlocks; progress survives a refresh */
var w3=make({storage:snap(w)});
ok(active(w3)==="tw-home" && !/locked/.test($(w3,"tw-pat-short-i").className) && /Build ✓/.test(txt(w3,"tw-pat-short-a")),"after a refresh: Build ticked, Short i is open");
ok(/locked/.test($(w3,"tw-pat-short-o").className),"the pattern after that is still locked");
/* another student does not inherit it */
var w4=make({storage:(function(){ var s=snap(w); s.rf_tw_student=JSON.stringify({id:"stu_guerrerooneiver_p1",name:"Oneiver G."}); return s; })()});
ok(/locked/.test($(w4,"tw-pat-short-i").className),"another student's progress is separate (Short i still locked)");

/* ---- 4. READ ---- */
function openAll(st){ var o=JSON.parse(JSON.stringify(st)), pr=JSON.parse(o.rf_tw_progress||"{}"); pr.stu_gomezmiriam_p1=pr.stu_gomezmiriam_p1||{patterns:{},sound:true}; pr.stu_gomezmiriam_p1.unlockAll=true; o.rf_tw_progress=JSON.stringify(pr); return o; }
var r=make({storage:openAll(snap(w))}); click(r,"tw-pat-wh"); click(r,"tw-mode-read");
ok(active(r)==="tw-read" && r.document.querySelectorAll("#tw-read-grid .wbtn").length===10,"Read shows the 10 read words");
var whatBtn=[].filter.call(r.document.querySelectorAll("#tw-read-grid .wbtn"),function(b){ return /wh.*a.*t/.test(b.textContent) && b.querySelector("u"); })[0];
ok(!!whatBtn && whatBtn.querySelector(".heart") && whatBtn.querySelector("u").textContent==="a","heart word 'what': small heart and the tricky part (a) underlined");
ok(r.document.querySelectorAll("#tw-read-grid .star").length>=3,"First 100 words show a small star");
var first=r.document.querySelector("#tw-read-grid .wbtn"); first.dispatchEvent(new r.MouseEvent("click",{bubbles:true}));
ok(txt(r,"tw-rnr-0")==="Not recorded yet." && r.__played.length===0,"tap an unrecorded read word: 'Not recorded yet.'");
rec(r,["when"]); click(r,"tw-rw-0"); ok(r.__played.pop()==="audio/TALL-W/WRD_when.webm" && txt(r,"tw-rnr-0")==="","tap a recorded read word: plays its WRD_ clip");

/* ---- 5. DICTATION ---- */
var d=make({storage:snap(w)}); click(d,"tw-pat-short-a"); click(d,"tw-mode-dict");
ok(active(d)==="tw-pattern" && /hasn't recorded these words yet/.test(txt(d,"tw-pat-note")),"Dictation with no recorded words says so");
rec(d,["sat","sad","mad","map","cap","can","van","fan"]); click(d,"tw-mode-dict");
ok(active(d)==="tw-dict" && /skipped: not recorded yet/.test(txt(d,"tw-dict-note")) && /Word 1 of /.test(txt(d,"tw-dict-count")),"Dictation plays only recorded words and says how many were skipped");
ok(d.__played.length===1 && /WRD_/.test(d.__played[0]),"the word's WRD_ clip plays at the start");
var dw=d.B.words[0].w, dt=TW.tilesFor(dw);
ok(!new RegExp("\\b"+dw+"\\b","i").test(d.document.querySelector("#tw-dict").textContent),"the word is NOT shown in Dictation (only heard)");
click(d,"tw-dict-check"); ok(/Fill every box first/.test(txt(d,"tw-dict-note")),"Check with empty boxes asks to fill them");
/* a wrong answer: put the first tile everywhere */
var firstTile=tileBtn(d,"tw-dict",dt[0].g); dt.forEach(function(x,i){ click(d,firstTile); click(d,"tw-dict-box-"+i); });
click(d,"tw-dict-check");
ok(d.document.querySelectorAll("#tw-dict-boxes .box.right").length>=1 && d.document.querySelectorAll("#tw-dict-boxes .box.wrong").length>=1,"Check marks right and wrong boxes");
ok(new RegExp("The word is "+dw).test(txt(d,"tw-dict-note")),"a wrong word shows the answer after Check");
click(d,"tw-dict-next"); dw=d.B.words[1].w; build(d,"tw-dict",dw); click(d,"tw-dict-check");
ok(/Right\./.test(txt(d,"tw-dict-note")) && d.document.querySelectorAll("#tw-dict-boxes .box.right").length===TW.tilesFor(dw).length,"all boxes right -> 'Right.'");
var dp=JSON.parse(d.localStorage.getItem("rf_tw_progress"))["stu_gomezmiriam_p1"].patterns["short-a"];
ok(dp.dictTotal===2 && dp.dictRight===1,"dictation progress saved (1 of 2 right)");

/* ---- 6. GAMES need the teacher's word audio ---- */
var g=make({storage:snap(w)}); click(g,"tw-pat-short-a");
["blaster","bubble","memory"].forEach(function(k){ click(g,"tw-game-"+k); ok(active(g)==="tw-pattern" && /hasn't recorded these words yet/.test(txt(g,"tw-pat-note")),k+": 'Your teacher hasn't recorded these words yet.'"); });
click(g,"tw-game-time"); ok(active(g)==="tw-game" && txt(g,"tw-game-title")==="Beat Your Time","Beat Your Time needs no audio");
/* ---- Beat Your Time ---- */
ok(g.document.querySelectorAll("#tw-game-body .wbtn").length===10 && /does not check your reading/.test(txt(g,"tw-game-help")),"shows the 10 read words; says it does not score the reading");
click(g,"tw-time-btn"); ok(txt(g,"tw-time-btn")==="Done","Start -> Done");
g.G.start-=4200; click(g,"tw-time-btn"); ok(active(g)==="tw-result" && /4\.\d seconds/.test(txt(g,"tw-result-body")) && /new personal best/.test(txt(g,"tw-result-body")),"Done shows the time and a personal best");
ok(/does not score your reading/.test(txt(g,"tw-result-body")),"result says reading is not scored");
click(g,"tw-result-again"); click(g,"tw-time-btn"); g.G.start-=9000; click(g,"tw-time-btn");
ok(/Personal best: 4\.\d seconds/.test(txt(g,"tw-result-body")),"a slower second try keeps the personal best");
ok(JSON.parse(g.localStorage.getItem("rf_tw_progress"))["stu_gomezmiriam_p1"].patterns["short-a"].games.time.plays===2,"Beat Your Time plays saved");

/* ---- 7. WORD BLASTER ---- */
var b=make({storage:snap(w)}); recAll(b); click(b,"tw-pat-short-a"); click(b,"tw-game-blaster");
ok(active(b)==="tw-game" && /Word 1 of 10/.test(txt(b,"tw-game-hud")),"Blaster starts: word 1 of 10");
function opts(game){ return game.G.opts.filter(function(o){ return o.state==="live"; }); }
var G1=b.G, pat=b.S.cur.pattern, patOpts={endings:false};
ok(G1.opts.length===3 && G1.opts.filter(function(o){ return o.right; }).length===1,"3 words fall, exactly one is right");
var right=G1.opts.filter(function(o){ return o.right; })[0], tt=TW.tilesFor(right.w);
ok(G1.opts.filter(function(o){ return !o.right; }).every(function(o){ return TW.diffCount(tt,TW.tilesFor(o.w))===1; }),"wrong answers differ from the target by exactly ONE sound");
ok(G1.opts.every(function(o){ return o.w===right.w || (o.w!==right.w+"s" && right.w!==o.w+"s"); }),"never only a final -s");
ok(b.__played.length>0 && /WRD_/.test(b.__played[b.__played.length-1]),"the teacher's voice says the word (WRD_ clip)");
/* sound off -> no voice */
click(b,"tw-game-sound"); ok(txt(b,"tw-game-sound")==="Sound: off","Sound toggle: off"); var n0=b.__played.length;
b.G.pause=0; click(b,"tw-game-hear"); ok(b.__played.length===n0,"with sound off, the voice does not play"); click(b,"tw-game-sound"); ok(txt(b,"tw-game-sound")==="Sound: on","Sound toggle: on");
/* fire at the RIGHT one */
b.G.shipX=right.x; key(b,"ArrowLeft"); key(b,"ArrowRight"); b.G.shipX=right.x; key(b," "); ok(!!b.G.bolt,"Space fires a bolt");
var i; for(i=0;i<80 && b.G.bolt;i++){ b.gStep(0.05); }
ok(b.G.right===1 && b.G.streak===1 && b.G.score===10,"hit the right word: score 10, streak 1");
for(i=0;i<20;i++){ b.gStep(0.05); } ok(/Word 2 of 10/.test(txt(b,"tw-game-hud")),"next word after a short pause");
/* speeds up with streaks */
var sp0=(function(){ b.G.streak=0; return b.gSpeed(); })(), sp1=(function(){ b.G.streak=4; return b.gSpeed(); })(); ok(sp1>sp0,"falls faster as the streak grows ("+Math.round(sp0)+" -> "+Math.round(sp1)+")"); b.G.streak=1;
/* fire at a WRONG one */
var wrong=b.G.opts.filter(function(o){ return !o.right && o.state==="live"; })[0]; b.G.shipX=wrong.x; key(b," ");
for(i=0;i<80 && b.G.bolt;i++){ b.gStep(0.05); }
ok(b.G.wrong===1 && b.G.streak===0 && wrong.state==="miss","hit a wrong word: streak back to 0, that word is marked");
/* let the right word land */
var cnt=0; while(b.G.opts.some(function(o){ return o.right && o.state==="live"; }) && cnt++<400){ b.gStep(0.05); }
ok(b.G.opts.filter(function(o){ return o.right; })[0].state==="miss" && /The word was/.test(txt(b,"tw-game-note")),"if the right word lands: it is shown, no streak");
/* finish the round */
cnt=0; while(!b.G.over && cnt++<4000){ var rr=b.G.opts.filter(function(o){ return o.right && o.state==="live"; })[0]; if(rr && !b.G.bolt && b.G.pause===0){ b.G.shipX=rr.x; key(b," "); } b.gStep(0.05); }
ok(active(b)==="tw-result" && /Word Blaster/.test(txt(b,"tw-result-title")) && /words right/.test(txt(b,"tw-result-body")),"the round ends after 10 words with a result");
var bp=JSON.parse(b.localStorage.getItem("rf_tw_progress"))["stu_gomezmiriam_p1"].patterns["short-a"].games.blaster;
ok(bp.plays===1 && bp.best>0 && bp.bestStreak>=1,"score, streak and personal best saved");
/* a round has 3-5 words at the right moments */
var b2=make({storage:snap(w)}); recAll(b2); click(b2,"tw-pat-short-a"); click(b2,"tw-game-blaster"); b2.G.streak=6; b2.G.q=1; b2.gNext();
(function(){ var tgt=b2.G.heard.w, nbn=TW.neighbors(tgt,TW.patternPool(b2.S.cur.pattern),{endings:false}).length;
  ok(b2.G.opts.length===Math.min(5,1+nbn) && b2.G.opts.length>=3 && b2.G.opts.length<=5,"after a streak up to 5 words fall (as many as the pattern has one-sound neighbours for): "+b2.G.opts.length+" for "+tgt); })();

/* ---- 8. BUBBLE POP ---- */
var u=make({storage:snap(w)}); recAll(u); click(u,"tw-pat-short-a"); click(u,"tw-game-bubble");
ok(active(u)==="tw-game" && txt(u,"tw-game-title")==="Bubble Pop" && u.G.opts.length>=4,"Bubble Pop starts with 4+ bubbles");
var ur=u.G.opts.filter(function(o){ return o.right; })[0], ut=TW.tilesFor(ur.w);
ok(u.G.opts.filter(function(o){ return !o.right; }).every(function(o){ return TW.diffCount(ut,TW.tilesFor(o.w))===1; }),"bubbles: wrong words differ by exactly one sound");
for(i=0;i<5;i++){ u.gStep(0.1); } ok(u.G.opts.every(function(o){ return o.y<400; }),"bubbles float up");
var ui=u.G.opts.indexOf(ur); click(u,"tw-opt-"+ui);        /* clicking is wired through pointerdown on the field */
u.gPop(ui); ok(u.G.right===1 && u.G.score===10 && u.G.streak===1,"pop the matching bubble: score 10, streak 1");
for(i=0;i<20;i++){ u.gStep(0.05); }
var uw2=u.G.opts.filter(function(o){ return !o.right; })[0]; u.gPop(u.G.opts.indexOf(uw2)); ok(u.G.streak===0 && u.G.wrong===1,"pop a wrong bubble: streak 0");
key(u,"ArrowRight"); key(u,"Enter"); ok(u.G.opts.some(function(o){ return o.state!=="live"; }),"keyboard: arrows move, Enter pops");
u.G.opts.forEach(function(o,k){ o.state=o.state; }); var rp=u.G.opts.filter(function(o){ return o.right && o.state==="live"; })[0]; if(rp){ key(u,String(u.G.opts.indexOf(rp)+1)); ok(u.G.right>=2,"number keys pop by position"); }
cnt=0; while(!u.G.over && cnt++<4000){ var rb=u.G.opts.filter(function(o){ return o.right && o.state==="live"; })[0]; if(rb && u.G.pause===0){ u.gPop(u.G.opts.indexOf(rb)); } u.gStep(0.05); }
ok(active(u)==="tw-result" && /Bubble Pop/.test(txt(u,"tw-result-title")),"Bubble Pop round ends with a result");

/* ---- 9. MEMORY MATCH ---- */
var m=make({storage:snap(w)}); recAll(m); click(m,"tw-pat-short-a"); click(m,"tw-game-memory");
ok(m.document.querySelectorAll("#tw-game-body button").length===3 && $(m,"tw-pairs-6") && $(m,"tw-pairs-8") && $(m,"tw-pairs-10"),"Memory offers 6, 8 or 10 pairs");
click(m,"tw-pairs-6"); ok(m.document.querySelectorAll(".mcard").length===12,"6 pairs = 12 cards (written word + sound card)");
ok(m.G.cards.filter(function(c){ return c.type==="word"; }).length===6 && m.G.cards.filter(function(c){ return c.type==="sound"; }).length===6,"6 word cards + 6 sound cards");
var C=m.G.cards, a0=C.map(function(c,k){ return k; }).filter(function(k){ return C[k].type==="word"; })[0], s0=C.map(function(c,k){ return k; }).filter(function(k){ return C[k].type==="sound" && C[k].w===C[a0].w; })[0];
click(m,"tw-card-"+s0); ok(m.__played.pop()==="audio/TALL-W/"+TW.wordId(C[a0].w)+".webm","flipping a sound card plays that word's WRD_ clip");
click(m,"tw-card-"+a0); ok(C[a0].state==="done" && C[s0].state==="done" && m.G.matched===1 && m.G.streak===1 && m.G.moves===1,"a word + its sound card match");
var oth=C.map(function(c,k){ return k; }).filter(function(k){ return C[k].state==="down" && C[k].type==="word"; })[0], bad=C.map(function(c,k){ return k; }).filter(function(k){ return C[k].state==="down" && C[k].type==="sound" && C[k].w!==C[oth].w; })[0];
click(m,"tw-card-"+oth); click(m,"tw-card-"+bad); ok(m.G.lock>0 && m.G.streak===0,"a mismatch locks briefly and resets the streak");
click(m,"tw-card-"+C.map(function(c,k){ return k; }).filter(function(k){ return C[k].state==="down"; })[0]); ok(m.G.flipped.length===2,"cannot flip a third card during a mismatch");
m.gMemStep(1); ok(C[oth].state==="down" && C[bad].state==="down","mismatched cards flip back");
var guard=0; while(!m.G.over && guard++<40){ var wd=C.map(function(c,k){ return k; }).filter(function(k){ return C[k].state==="down" && C[k].type==="word"; })[0]; var sd=C.map(function(c,k){ return k; }).filter(function(k){ return C[k].state==="down" && C[k].type==="sound" && C[k].w===C[wd].w; })[0]; click(m,"tw-card-"+wd); click(m,"tw-card-"+sd); }
ok(active(m)==="tw-result" && /6 pairs in \d+ moves/.test(txt(m,"tw-result-body")),"finishing all pairs shows moves and time");
ok(JSON.parse(m.localStorage.getItem("rf_tw_progress"))["stu_gomezmiriam_p1"].patterns["short-a"].games.memory.bestMoves["6"]>=6,"personal best (fewest moves) saved per pair count");
var mk=make({storage:snap(w)}); recAll(mk); click(mk,"tw-pat-short-a"); click(mk,"tw-game-memory"); click(mk,"tw-pairs-8"); key(mk,"ArrowRight"); key(mk,"ArrowDown"); ok(mk.G.focus>0,"Memory: arrow keys move between cards");

/* ---- 10. teacher view: every pattern and game open ---- */
var t=make({teacher:true,storage:{rf_tw_student:JSON.stringify({id:"stu_guerrerooneiver_p1",name:"Oneiver G."})}});
ok(active(t)==="tw-home" && t.document.querySelectorAll("#tw-groups .pcard.locked").length===0,"?teacher: no pattern is locked");
click(t,"tw-pat-ng"); ok(active(t)==="tw-pattern" && txt(t,"tw-pat-title")==="ng","?teacher can open any pattern (ng)");
var t2=make({teacher:true}); ok(active(t2)==="tw-home" && /Teacher view/.test(txt(t2,"tw-who-label")),"?teacher without a student opens straight to the patterns");
var t3=make({teacher:true,storage:{rf_tw_student:JSON.stringify({id:"stu_guerrerooneiver_p1",name:"Oneiver G."})}}); click(t3,"tw-unlock-all"); ok(JSON.parse(t3.localStorage.getItem("rf_tw_progress")).stu_guerrerooneiver_p1.unlockAll===true,"teacher can open every pattern for a student");
var s3=make({storage:snap(t3)}); ok(s3.document.querySelectorAll("#tw-groups .pcard.locked").length===0,"that student then sees every pattern open");

/* ---- 11. data-driven: heart sets + a different JSON ---- */
var withHeart=JSON.parse(JSON.stringify(raw)); withHeart.heartSets=[{id:"h1",title:"Heart words 1",words:[{w:"the",tricky:"e"},{w:"said",tricky:"ai"}]}];
var h=make({data:withHeart,storage:{rf_tw_student:JSON.stringify({id:"x",name:"X"})}}); click(h,"tw-heart-h1");
ok(active(h)==="tw-read" && h.document.querySelectorAll("#tw-read-grid .heart").length===2 && h.document.querySelector("#tw-read-grid u").textContent==="e","a heart-word set opens as a Read list with underlined tricky parts");
click(h,"tw-rw-0"); ok(txt(h,"tw-rnr-0")==="Not recorded yet.","heart word without a clip: 'Not recorded yet.'");
console.log("test-tall-words-page: "+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
