/* Mini-lesson observations (rf_c1_minilesson) in Settings > Data Management
   backup/restore. Fictional/roster ids only. */
const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8').replace('<script src="clips.js" defer></script>','<script>'+fs.readFileSync('./clips.js','utf8')+'</script>');
const w=new JSDOM(html,{url:"https://miqdaniels.github.io/READING-DANIELS/?teacher",runScripts:"dangerously",pretendToBeVisual:true,
  beforeParse(win){ win.HTMLElement.prototype.scrollIntoView=function(){}; win.scrollTo=function(){};
    win.__downloads=[]; var rc=win.document.createElement.bind(win.document);
    win.document.createElement=function(t){ var el=rc(t); if(t==="a"){ el.click=function(){ if(el.download){ win.__downloads.push(el.download); } }; } return el; };
    win.URL.createObjectURL=function(){return "blob:x";}; win.URL.revokeObjectURL=function(){}; }}).window;
const d=w.document; let pass=0, fail=0;
function ok(c,m){ if(c){pass++;} else {fail++; console.log("FAIL:",m);} }
function ls(k){ return w.localStorage.getItem(k); }
var A="stu_gomezmiriam_p1", B="stu_guerrerooneiver_p1";

/* seed Check 1 scored attempt for A (misses b,g,p) */
var sc=[]; for(var i=0;i<52;i++) sc.push(""); ["b","g","p"].forEach(function(L){ sc[w.C1_ALL.indexOf(L)]="err"; });
w.localStorage.setItem("rf_check1_attempts",JSON.stringify([{id:"a1",studentId:A,date:"2026-10-01",fileName:"x",scores:sc,uppercaseCorrect:26,lowercaseCorrect:23,missedUpper:[],missedLower:["g","p","b"]}]));
/* record observations through the REAL mini-lesson UI */
w.go("check1Teach"); w.c1nGo(A); d.getElementById("c1n-ml-toggle").click();
function mark(key,m){ d.querySelector('.c1n-ml-target[data-key="'+key+'"] [data-mark="'+m+'"]').click(); }
mark("L:b","correct"); mark("L:g","needs"); mark("L:p","needs");
d.getElementById("c1n-pick-toggle").click(); d.querySelector('[data-pick="U:B"]').click(); mark("U:B","needs");
w.c1nGo(B); d.getElementById("c1n-ml-toggle").click(); d.getElementById("c1n-pick-toggle").click(); d.querySelector('[data-pick="L:m"]').click(); mark("L:m","correct");
var miniOrig=ls("rf_c1_minilesson"), attOrig=ls("rf_check1_attempts"), setOrig=ls("slider_settings");
ok(!!miniOrig && JSON.parse(miniOrig)[A].marks["L:g"]==="needs" && JSON.parse(miniOrig)[B].marks["L:m"]==="correct","observations recorded for 2 students");

/* ---- export includes them; format otherwise unchanged ---- */
w.go("dataMgmt"); w.dmDoExport();
ok(w.__downloads.length===1 && /^Reading_Foundations_Teacher_Backup_/.test(w.__downloads[0]),"export button still downloads one backup file");
var bk=w.tdBuildBackup();
ok(bk.rfBackupId==="READING_FOUNDATIONS_TEACHER_BACKUP" && bk.backupVersion===1 && bk.schemaVersion===1,"backup/schema version unchanged (1/1)");
ok(["attempts","groupOverrides","settings","fluencyPlacement","fluencyCycle","teacherPrefs"].every(function(k){ return k in bk.data; }),"all pre-existing sections still present");
ok(JSON.stringify(bk.data.miniLesson)===JSON.stringify(JSON.parse(miniOrig)),"backup carries rf_c1_minilesson exactly");
ok(bk.counts.miniLessonStudents===2 && /Mini-lesson notes \(students\): 2/.test(d.getElementById("dm-export-result").textContent),"export result shows mini-lesson count");
ok(JSON.stringify(bk.data.attempts.rf_check1_attempts)===attOrig.replace(/\s/g,"")||JSON.stringify(bk.data.attempts.rf_check1_attempts)===JSON.stringify(JSON.parse(attOrig)),"Check 1 attempts exported unchanged");
ok(ls("rf_check1_attempts")===attOrig,"export did not alter Check 1 data");
var json=JSON.stringify(bk);

/* ---- full cycle: wipe -> import -> restored ---- */
w.localStorage.removeItem("rf_c1_minilesson"); w.localStorage.removeItem("rf_check1_attempts");
ok(ls("rf_c1_minilesson")===null,"(wiped)");
var parsed=JSON.parse(json);
ok(w.tdValidateBackup(parsed).ok,"backup validates");
var sum=w.tdRunImport(parsed);
ok(sum.miniLesson.added===2 && sum.miniLesson.conflicts===0,"import adds both students' observations (added "+sum.miniLesson.added+")");
ok(ls("rf_c1_minilesson")===JSON.stringify(JSON.parse(miniOrig)) || JSON.stringify(JSON.parse(ls("rf_c1_minilesson")))===JSON.stringify(JSON.parse(miniOrig)),"observations restored identically");
ok(ls("rf_check1_attempts")!==null && JSON.parse(ls("rf_check1_attempts"))[0].scores.join()===sc.join(),"Check 1 scores restored identically via existing path");
/* restored marks show in the real UI */
w.c1nGo(A); d.getElementById("c1n-ml-toggle").click();
ok(d.querySelector('.c1n-ml-target[data-key="L:g"] [data-mark="needs"]').className.indexOf("on")>-1 && d.querySelector('.c1n-ml-target[data-key="U:B"]'),"restored marks and hand-picked letters appear in the mini-lesson");

/* ---- merge rules ---- */
var sum2=w.tdRunImport(parsed);
ok(sum2.miniLesson.added===0 && sum2.miniLesson.skippedDup===2 && sum2.miniLesson.conflicts===0,"importing twice: duplicates ignored, nothing doubled");
var cur=JSON.parse(ls("rf_c1_minilesson")); cur[A].marks["L:g"]="correct"; w.localStorage.setItem("rf_c1_minilesson",JSON.stringify(cur));
var before=ls("rf_c1_minilesson"); var sum3=w.tdRunImport(parsed);
ok(sum3.miniLesson.conflicts===1 && ls("rf_c1_minilesson")===before,"differing local notes are skipped and reported, never overwritten");
var onlyB=JSON.parse(before); delete onlyB[B]; w.localStorage.setItem("rf_c1_minilesson",JSON.stringify(onlyB));
var sum4=w.tdRunImport(parsed); var after=JSON.parse(ls("rf_c1_minilesson"));
ok(sum4.miniLesson.added===1 && after[B] && after[A].marks["L:g"]==="correct","merge adds the missing student and keeps existing notes");

/* ---- old-format backup (no miniLesson field) still imports; bad entries ignored ---- */
var old=JSON.parse(json); delete old.data.miniLesson; delete old.counts.miniLessonStudents;
ok(w.tdValidateBackup(old).ok,"older backup without mini-lesson field still validates");
var b4=ls("rf_c1_minilesson"); var s5=w.tdRunImport(old);
ok(s5.miniLesson.added===0 && ls("rf_c1_minilesson")===b4,"older backup imports without touching mini-lesson notes");
var badB=JSON.parse(json); badB.data.miniLesson={ "stu_x":"junk", "stu_y":{manual:"no",marks:{}}, "stu_z":null };
var s6=w.tdRunImport(badB); ok(s6.miniLesson.skippedBad===3 && s6.miniLesson.added===0,"malformed entries ignored, not imported");

/* ---- UI import path shows the line; Check 1 untouched throughout ---- */
w.localStorage.removeItem("rf_c1_minilesson");
w.go("dataMgmt"); w.DM_PENDING_BACKUP=JSON.parse(json); var a1=ls("rf_check1_attempts"); w.dmContinueImport();
ok(/Mini-lesson notes:\s*2 added/.test(d.getElementById("dm-import-result").textContent),"import result shows mini-lesson summary");
ok(ls("rf_check1_attempts")===a1,"Check 1 attempts unchanged by the import UI path");
ok(/<\/script>\s*<\/body>\s*<\/html>\s*$/.test(html),"index.html still ends with </script></body></html>");
console.log("minilesson-backup: "+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
