/* Check 1 "5-Minute Letter Identification Mini-Lesson": routine text, targets
   from real saved scores, manual targets, slide links, separate observation
   storage, and proof Check 1 data is untouched. */
const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8').replace('<script src="clips.js" defer></script>','<script>'+fs.readFileSync('./clips.js','utf8')+'</script>');
let pass=0, fail=0;
function ok(c,m){ if(c){pass++;} else {fail++; console.log("FAIL: "+m);} }
const w=new JSDOM(html,{url:"https://miqdaniels.github.io/READING-DANIELS/?teacher",runScripts:"dangerously",pretendToBeVisual:true,
  beforeParse(w){ w.HTMLElement.prototype.scrollIntoView=function(){}; w.scrollTo=function(){}; }}).window;
const d=w.document; function $(id){ return d.getElementById(id); }
function ls(k){ return w.localStorage.getItem(k); }
function rows(){ return Array.prototype.slice.call(d.querySelectorAll(".c1n-ml-target")); }
function rowLetters(){ return rows().map(function(r){ return r.getAttribute("data-key"); }); }
function mark(key,m){ d.querySelector('.c1n-ml-target[data-key="'+key.replace(/"/g,'')+'"] [data-mark="'+m+'"]').click(); }

/* ---- scored student: lowercase b, g, p missed (spec example) + uppercase none ---- */
var sid="stu_gomezmiriam_p1", sc=[]; for(var i=0;i<52;i++) sc.push("");
["b","g","p"].forEach(function(L){ sc[w.C1_ALL.indexOf(L)]="err"; });
w.localStorage.setItem("rf_check1_attempts",JSON.stringify([{id:"a1",studentId:sid,date:"2026-10-01",fileName:"x",scores:sc,uppercaseCorrect:26,lowercaseCorrect:23,missedUpper:[],missedLower:["g","p","b"]}]));
w.go("check1Teach"); w.c1nGo(sid);
ok(/active/.test($("c1Next").className),"mini-lesson lives on the What to Teach Next page");
ok(/5-Minute Letter Identification Mini-Lesson/.test($("c1n-ml-toggle").textContent),"resource labeled 5-Minute Letter Identification Mini-Lesson");
ok(!$("c1n-ml-steps"),"routine collapsed until opened (optional)");
$("c1n-ml-toggle").click();
var st=$("c1n-ml-steps").textContent;
ok(/Model \(1 min\)/.test(st)&&/Guided practice \(2 min\)/.test(st)&&/Independent practice \(1 min\)/.test(st)&&/Quick review \(1 min\)/.test(st),"4 steps with the right minutes");
ok(/without saying its name first/.test(st),"independent step: no name first");
ok(/2.4 target letters/.test($("c1n-ml").textContent)&&/not a required or research-validated dose/.test($("c1n-ml").textContent),"2-4 letters + not-a-validated-dose note");
ok(/letter NAMES only/.test($("c1n-ml").textContent)&&/Check 2/.test($("c1n-ml").textContent)&&/not a reading disability/.test($("c1n-ml").textContent),"names only, sounds belong to Check 2, no disability claim");
ok(!/sound/i.test(st),"routine steps contain no letter-sound teaching");
ok(rowLetters().join(",")==="L:b,L:g,L:p","targets are exactly the scored misses b,g,p (got "+rowLetters().join(",")+")");
var slides=rows().map(function(r){ return r.querySelector(".c1n-ml-slide").textContent; });
ok(slides.join("|")==="Slide 1: a–b|Slide 4: g–h|Slide 8: o–p","b->slide 1 a–b, g->slide 4 g–h, p->slide 8 o–p (got "+slides.join("|")+")");
ok(rows().every(function(r){ return /Lowercase/.test(r.textContent); }),"lowercase kept separate from uppercase");
rows()[2].querySelector(".c1n-ml-slide").click();
ok($("c1n-img").getAttribute("src")==="check1-slides/lower/08.png","slide link opens the real viewer at o–p");
ok(rows().every(function(r){ return r.querySelectorAll("[data-mark]").length===3; }),"3 mark choices per letter");
ok(Array.prototype.map.call(rows()[0].querySelectorAll("[data-mark]"),function(b){return b.textContent;}).join("|")==="Correct|Needs More Practice|Not Yet Checked","mark labels exact");
ok(rows().every(function(r){ return r.querySelector('[data-mark="none"]').className.indexOf("on")>-1; }),"default is Not Yet Checked");

/* ---- recording observations; Check 1 data must not change ---- */
var attBefore=ls("rf_check1_attempts"), othersBefore={}; for(var k=0;k<w.localStorage.length;k++){ var kk=w.localStorage.key(k); if(kk!=="rf_c1_minilesson"){ othersBefore[kk]=ls(kk); } }
mark("L:b","correct"); mark("L:g","needs"); mark("L:p","needs");
ok(/Still need practice:\s*g p/.test($("c1n-ml-summary").textContent),"summary lists letters still needing practice");
var saved=JSON.parse(ls("rf_c1_minilesson"));
ok(saved[sid] && saved[sid].marks["L:b"]==="correct" && saved[sid].marks["L:g"]==="needs","observations saved under their own key per student");
ok(ls("rf_check1_attempts")===attBefore,"Check 1 attempts/scores byte-identical after marking");
var changed=[]; Object.keys(othersBefore).forEach(function(x){ if(ls(x)!==othersBefore[x]) changed.push(x); });
ok(changed.length===0,"no other saved data changed (changed: "+changed.join(",")+")");
ok(JSON.parse(ls("rf_check1_attempts"))[0].scores.join()===sc.join(),"scores array identical");
ok(w.localStorage.length===Object.keys(othersBefore).length+1,"exactly one new storage key (rf_c1_minilesson)");
mark("L:g","none"); ok(JSON.parse(ls("rf_c1_minilesson"))[sid].marks["L:g"]===undefined,"Not Yet Checked clears the mark");
mark("L:g","needs");
/* persists when reopened */
w.go("s-home"); w.c1nGo(sid); $("c1n-ml-toggle").click();
ok(rows()[0].querySelector('[data-mark="correct"]').className.indexOf("on")>-1,"marks remembered after leaving and returning");

/* ---- manual extras: uppercase B added by hand stays separate from lowercase b ---- */
$("c1n-pick-toggle").click();
ok(d.querySelectorAll(".c1n-pickgrid .c1n-pair").length===52,"picker offers all 26 + 26 letters");
d.querySelector('[data-pick="U:B"]').click();
ok(rowLetters().join(",")==="L:b,L:g,L:p,U:B","hand-picked uppercase B added after scored targets, lowercase b untouched");
ok(rows()[3].querySelector(".c1n-ml-slide").textContent==="Slide 1: A–B","uppercase B -> uppercase slide 1 A–B");
ok(JSON.parse(ls("rf_check1_attempts"))[0].scores.join()===sc.join(),"manual pick does not touch scores");
d.querySelector('[data-pick="U:B"]').click(); ok(rowLetters().length===3,"hand pick can be removed");

/* ---- unscored student: nothing invented; manual only ---- */
w.localStorage.setItem("rf_check1_attempts",JSON.stringify([{id:"a2",studentId:"stu_guerrerooneiver_p1",date:"2026-10-02",fileName:"y"}]));
w.c1nGo("stu_guerrerooneiver_p1"); $("c1n-ml-toggle").click();
ok(rows().length===0 && /no saved Check 1 scores/.test($("c1n-ml").textContent),"unscored: no invented letters, says so");
ok(/Not scored yet/.test($("c1n-student-note").textContent),"unscored: Not scored yet still shown");
$("c1n-pick-toggle").click(); d.querySelector('[data-pick="L:m"]').click(); d.querySelector('[data-pick="U:Q"]').click();
ok(rowLetters().join(",")==="L:m,U:Q" || rowLetters().join(",")==="U:Q,L:m","unscored: manual picks become targets");
var m2=rows().filter(function(r){return r.getAttribute("data-key")==="L:m";})[0];
ok(m2.querySelector(".c1n-ml-slide").textContent==="Slide 7: m–n","manual lowercase m -> slide 7 m–n");
ok(!JSON.parse(ls("rf_check1_attempts"))[0].scores,"unscored attempt still has no scores");

/* ---- no student at all ---- */
w.c1nGo(null); $("c1n-ml-toggle").click(); $("c1n-pick-toggle").click(); d.querySelector('[data-pick="L:z"]').click();
ok(rowLetters().join(",")==="L:z" && /No student picked/.test($("c1n-ml").textContent),"no student: manual targets work, marks session-only");
var before=ls("rf_c1_minilesson"); mark("L:z","needs"); ok(ls("rf_c1_minilesson")===before,"no student: nothing written to storage");

/* ---- original features still there ---- */
ok(!!$("c1n-dl-upper")&&!!$("c1n-dl-lower")&&$("c1n-dl-upper").hasAttribute("download"),"Download PowerPoint links still present");
ok(/How to use these slides/.test($("c1Next").textContent),"original slide directions still present");
ok(/<\/script>\s*<\/body>\s*<\/html>\s*$/.test(html),"index.html still ends with </script></body></html>");
console.log("check1-minilesson: "+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
