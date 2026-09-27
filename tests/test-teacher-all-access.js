const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8').replace('<script src="clips.js" defer></script>','<script>'+fs.readFileSync('./clips.js','utf8')+'</script>');
let pass=0, fail=0;
function ok(c,m){ if(c){pass++;} else {fail++; console.log("FAIL: "+m);} }
function mk(url){ return new JSDOM(html,{url:url,runScripts:"dangerously",pretendToBeVisual:true,beforeParse(w){ w.HTMLElement.prototype.scrollIntoView=function(){}; w.scrollTo=function(){}; }}).window; }

/* TEACHER (?teacher): every Check live without doing the ones before it */
var w=mk("https://miqdaniels.github.io/READING-DANIELS/?teacher");
w.READER={id:"stu_x_p1",name:"X"};
w.eval('READER={id:"stu_x_p1",name:"X"}');
ok(w.eval('ckUnlocked(2)')===true,"teacher: Check 3 open with Checks 1-2 not done");
ok(w.eval('ckUnlocked(1)')===true,"teacher: Check 2 open");
ok(w.eval('gUnlocked(4)')===true,"teacher: Word Practice group 5 open");
w.eval('paintDiagLanding()');
var btns=w.document.querySelectorAll('#diag-list button');
var locked=0; for(var i=0;i<btns.length;i++){ if(btns[i].disabled){ locked++; } }
ok(btns.length===7 && locked===0,"teacher: no grayed-out Check buttons ("+locked+" locked)");
w.eval('smEnter()');
ok(w.document.getElementById("sm-flu-btn").className.indexOf("locked")===-1,"teacher: Fluency button live");

/* Check 3 review: every name clickable, highlights, shows a message */
w.eval('go("check3Teach")');
var names=w.document.querySelectorAll('#c3t-roster button');
ok(names.length>1 && names[0].textContent.indexOf("Test Student")===0,"review: Test Student listed first");
var dis=0; for(i=0;i<names.length;i++){ if(names[i].disabled){ dis++; } }
ok(dis===0,"review: no disabled names");
names[1].click();
names=w.document.querySelectorAll('#c3t-roster button');
ok(names[1].className.indexOf("primary")>-1,"review: picked name highlighted");
ok(w.document.getElementById("c3t-body").textContent.indexOf("No Check 3 video")>-1,"review: clear empty message");
/* placeholder Student 1-3 clickable too */
var s1=null; for(i=0;i<names.length;i++){ if(/^Student 1/.test(names[i].textContent)){ s1=names[i]; } }
if(s1){ s1.click(); ok(w.document.getElementById("c3t-body").textContent.indexOf("Student 1")>-1,"review: Student 1 opens"); }

/* A Test Student run done in Student View (vas_ sandbox) shows in review */
w.localStorage.setItem("vas_rf_check3_attempts",JSON.stringify([{id:"a1",studentId:"test_student",studentName:"Test Student",date:"2026-09-27",fileName:"t.webm"}]));
w.eval('go("check3Teach")');
names=w.document.querySelectorAll('#c3t-roster button');
ok(names[0].textContent.indexOf("(1)")>-1,"review: Test Student shows 1 attempt");
names[0].click();
ok(w.document.querySelectorAll('#c3t-body .trow').length===1,"review: Test Student attempt listed");
w.eval('c3tOpenAttempt("a1")');
ok(!!w.document.getElementById("c3t-3a-grid"),"review: Test Student attempt opens for scoring");
w.eval('c3tSave()');
var saved=JSON.parse(w.localStorage.getItem("vas_rf_check3_attempts"))[0];
ok(saved.scores && saved.scores.length===20,"review: scores save back to the sandbox record");
/* same for Check 1 & 2 review */
w.eval('go("check1Teach")'); ok(w.document.querySelectorAll('#c1t-roster button')[0].textContent.indexOf("Test Student")===0,"Check 1 review: Test Student listed");
w.eval('go("check2Teach")'); ok(w.document.querySelectorAll('#c2t-roster button')[0].textContent.indexOf("Test Student")===0,"Check 2 review: Test Student listed");

/* STUDENT (no ?teacher): normal step-by-step locking unchanged */
var s=mk("https://miqdaniels.github.io/READING-DANIELS/");
s.eval('READER={id:"stu_y_p1",name:"Y"}');
ok(s.eval('ckUnlocked(2)')===false,"student: Check 3 still locked until Check 2 done");
ok(s.eval('gUnlocked(4)')===false,"student: later groups still locked");
s.eval('smEnter()');
ok(s.document.getElementById("sm-flu-btn").className.indexOf("locked")>-1,"student: Fluency still locked until checks done");

console.log("\n=== "+pass+" passed, "+fail+" failed ===");
process.exit(fail?1:0);
