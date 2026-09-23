// teacher-tap.html: teacher-driven WCPM scoring. Static checks, data sync with index.html,
// tapping + arithmetic, save/history/delete, file-name prefill, export + restore.
const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./teacher-tap.html','utf8');
const index=fs.readFileSync('./index.html','utf8');

let pass=0,fail=0;
function ck(c,m){ if(c){pass++;} else {fail++; console.log("FAIL:",m);} }

// ---------- static checks ----------
ck(/<\/script>\s*<\/body>\s*<\/html>\s*$/.test(html),"file ends with </script></body></html>");
const script=html.slice(html.indexOf("<script>"),html.lastIndexOf("</script>"));
ck(script.indexOf("=>")<0,"no arrow functions");
ck(!/(^|[;{}\s(])(const|let)\s+[A-Za-z_$]/.test(script.replace(/"(?:[^"\\]|\\.)*"/g,'""')),"no const/let in code");
ck(!/`/.test(script),"no template literals");
const storeStart=script.indexOf("/* ---------- ScoreStore"), storeEnd=script.indexOf("})();",storeStart);
const outside=script.slice(0,storeStart)+script.slice(storeEnd);
ck(storeStart>0 && outside.indexOf("localStorage")<0,"only ScoreStore touches localStorage");

// ---------- data matches index.html ----------
const lines=index.split('\n');
function block(start){ let i=lines.findIndex(l=>l.indexOf(start)===0), out=[]; for(;i<lines.length;i++){ out.push(lines[i]); if(/^\];/.test(lines[i])) break; } return out.join('\n'); }
const IX=new Function(block('var SENTENCES')+block('var GROUPS')+block('var CLASSES')+';return {S:SENTENCES,G:GROUPS,C:CLASSES};')();
function h(s){ let x=5381; for(let i=0;i<s.length;i++){ x=((x*33)^s.charCodeAt(i))>>>0; } return x.toString(36); }
function short(n){ const p=n.split(' '); if(p.length<2||p[0]==="Student") return n; return p[0]+' '+p[p.length-1].charAt(0)+'.'; }

// privacy: no full names and no index.html student ids anywhere in the page
IX.C.forEach(c=>c.students.forEach(s=>{
  if(/^spare_/.test(s.id)) return;
  ck(html.indexOf(s.id)<0,"no index id in page: "+s.id);
  const last=s.name.split(' ').slice(1).join(' ');
  ck(!new RegExp("\\b"+last.replace(/[-]/g,"\\-")+"\\b").test(html),"no last name in page: "+last);
}));

const dom=new JSDOM(html,{url:"https://miqdaniels.github.io/READING-DANIELS/teacher-tap.html",runScripts:"dangerously",pretendToBeVisual:true,
  beforeParse(w){
    w.HTMLMediaElement.prototype.pause=function(){};
    w.HTMLMediaElement.prototype.load=function(){};
    w.URL.createObjectURL=function(b){ w.__lastBlob=b; return "blob:x"; };
    w.URL.revokeObjectURL=function(){};
    w.HTMLAnchorElement.prototype.click=function(){ w.__downloads=(w.__downloads||[]).concat([this.download]); };
    w.confirm=function(){ return true; };
  }
});
const w=dom.window, d=w.document, $=id=>d.getElementById(id);

// PASSAGES == index groups in order, same sentences; ROSTER keys + short names
ck(w.PASSAGES.length===IX.G.length,"passage count matches groups");
IX.G.forEach((g,gi)=>{
  const want=IX.S.filter(s=>s.grp===g.name).map(s=>s.sentence);
  const got=w.PASSAGES[gi];
  ck(got && got.grp===g.name && JSON.stringify(got.sentences)===JSON.stringify(want),"passage text matches index.html: "+g.name);
});
ck(w.ROSTER.length===IX.C.length,"class count matches");
IX.C.forEach((c,ci)=>{
  const r=w.ROSTER[ci];
  ck(r.id===c.id && r.students.length===c.students.length,"roster size matches: "+c.id);
  c.students.forEach((s,si)=>{
    ck(r.students[si].k===c.id+"-"+h(s.id),"key for "+c.id+"#"+si);
    ck(r.students[si].n===short(s.name),"short name for "+c.id+"#"+si+" = "+r.students[si].n);
  });
});

function statVal(label){ const ks=d.querySelectorAll('#stats .stat'); for(const s of ks){ if(s.querySelector('.k').textContent===label) return s.querySelector('.v').textContent; } return null; }

// ---------- tapping + arithmetic ----------
$("sel-class").value="p1"; w.pickClass();
$("sel-grp").value="Personal Narrative 1"; w.pickGroup();
const total=w.WORDS.length;
const pn1=IX.S.filter(s=>s.grp==="Personal Narrative 1").map(s=>s.sentence).join(" ").split(" ").length;
ck(total===pn1,"word count = passage words ("+total+")");
ck(d.querySelectorAll('#passage .w').length===total,"one tappable button per word");
ck($("btn-save").disabled,"save blocked with no student");
$("sel-stu").value=w.ROSTER[0].students[0].k; w.paintResult();
ck($("btn-save").disabled,"save blocked with no stop time");
$("in-start").value="2"; $("in-end").value="62"; w.paintResult();   // exactly 60 s
ck(!$("btn-save").disabled,"save allowed once student + time set");
ck(statVal("Words correct / min")===String(total),"no errors: WCPM = words in 60s");
w.tapWord(0); w.tapWord(5); w.tapWord(10);
ck(statVal("Errors")==="3","3 errors marked");
ck($("w5").className.indexOf("err")>=0,"error word styled");
w.tapWord(5);
ck(statVal("Errors")==="2","tap again undoes an error");
ck(statVal("Words correct / min")===String(total-2),"WCPM = correct words per minute");
$("in-end").value="32"; w.paintResult();                               // 30 s -> doubles
ck(statVal("Words correct / min")===String((total-2)*2),"WCPM scales with time");
ck(statVal("Reading time")==="0:30","reading time shown");
ck(statVal("Accuracy")===String(Math.round((total-2)*1000/total)/10)+"%","accuracy");
// last word read: stop at word index 7 -> 8 words read, error at 10 dropped
w.setTapMode("last"); w.tapWord(7);
ck(statVal("Words read")==="8 of "+total,"last word caps words read");
ck(statVal("Errors")==="1","errors after the last word are dropped");
ck($("w12").className.indexOf("after")>=0,"words after last are grayed");
w.setTapMode("err"); w.tapWord(12);
ck(statVal("Errors")==="1","can't mark an error after the last word");
$("in-end").value="1"; w.paintResult();
ck($("btn-save").disabled,"stop before start blocks save");
$("in-end").value="32"; w.paintResult();

// Set to now reads the player position
Object.defineProperty($("player"),"currentTime",{value:12.34,writable:true,configurable:true});
w.markTime("start"); ck($("in-start").value==="12.3","Set to now fills start");
$("in-start").value="2"; w.paintResult();

// ---------- save + history ----------
w.saveScore();
let saved=JSON.parse(w.localStorage.getItem("rf_wcpm_scores")||"[]");
ck(saved.length===1,"one score saved");
const r0=saved[0]||{};
ck(r0.wcpm===Math.round(7/0.5) && r0.read===8 && r0.errors===1 && r0.secs===30,"saved numbers ("+JSON.stringify([r0.wcpm,r0.read,r0.errors,r0.secs])+")");
ck(r0.name===w.ROSTER[0].students[0].n && r0.stu===w.ROSTER[0].students[0].k,"saved with short name + key only");
ck(JSON.stringify(r0.errWords)==='["It"]',"error words saved");
ck(/Saved:/.test($("save-note").textContent),"save confirmation shown");
ck($("sel-stu").value==="" && $("in-end").value==="" && w.LAST===-1 && Object.keys(w.ERR).length===0,"cleared for next student");
ck(d.querySelectorAll('#history tbody tr').length===1,"history shows the score");

// ---------- file-name prefill ----------
w.fillFromFileName("MiriamGomez_Personal_Narrative_2.webm");
ck($("sel-grp").value==="Personal Narrative 2","group from file name");
ck($("sel-class").value==="p1" && $("sel-stu").value===w.ROSTER[0].students[0].k,"student from file name");
ck(/Check before saving/.test($("pick-note").textContent),"prefill is flagged for the teacher to check");
w.fillFromFileName("gomezmiriam_12345_678_MiriamGomez_Unit_1_Core_1-1.webm");
ck($("sel-grp").value==="Unit 1 Core 1","group from Canvas-renamed file");
$("sel-stu").value=""; w.fillFromFileName("Student1_Math.webm");
ck($("sel-stu").value==="" && $("sel-grp").value==="Math","ambiguous student left blank");

// second score in another class for filters/export
$("sel-class").value="p3"; w.pickClass();
$("sel-grp").value="Math"; w.pickGroup();
$("sel-stu").value=w.ROSTER[1].students[0].k; $("in-start").value="0"; $("in-end").value="45"; w.paintResult();
w.saveScore();
ck(JSON.parse(w.localStorage.getItem("rf_wcpm_scores")).length===2,"second score saved");
$("sel-hist").value="p3"; w.paintHistory();
ck(d.querySelectorAll('#history tbody tr').length===1,"history filters by class");
$("sel-hist").value="all"; w.paintHistory();
ck(d.querySelectorAll('#history tbody tr').length===2,"history shows all");

// ---------- export ----------
w.exportBackup();
ck(/^fluency-scores-\d{4}-\d{2}-\d{2}\.json$/.test(w.__downloads[w.__downloads.length-1]),"backup file name has no student info");
saved=JSON.parse(w.localStorage.getItem("rf_wcpm_scores"));
const bk=JSON.parse(w.backupText(saved));
ck(bk.app==="fluency-tap" && bk.scores.length===2,"backup has all scores");
w.exportCSV();
ck(/\.csv$/.test(w.__downloads[w.__downloads.length-1]),"csv downloaded");
const csv=w.csvText(saved).trim().split("\r\n");
ck(csv[0]==="date,class,student,group,seconds,words_read,errors,words_correct,wcpm,accuracy_pct,error_words","csv header");
ck(csv.length===3,"csv has a row per score");
ck(w.csvCell('a,"b"')==='"a,""b"""',"csv escapes commas and quotes");

// ---------- delete ----------
w.deleteScore(saved[1].id);
ck(JSON.parse(w.localStorage.getItem("rf_wcpm_scores")).length===1,"delete removes one score");

// ---------- restore ----------
const file=new w.File([w.backupText(saved)],"fluency-scores.json",{type:"application/json"});
const inp={files:[file],value:"x"};
w.restorePick(inp);
setTimeout(function(){
  ck(JSON.parse(w.localStorage.getItem("rf_wcpm_scores")).length===2,"restore brings the deleted score back");
  ck(/1 new score added/.test($("io-note").textContent),"restore reports count ("+$("io-note").textContent+")");
  const bad=new w.File(["not json"],"x.json");
  w.restorePick({files:[bad],value:"x"});
  setTimeout(function(){
    ck(/isn.t a Fluency Tap backup/.test($("io-note").textContent),"bad file rejected");
    ck(JSON.parse(w.localStorage.getItem("rf_wcpm_scores")).length===2,"bad file changes nothing");
    console.log("test-tap: "+pass+" passed, "+fail+" failed");
    process.exit(fail?1:0);
  },50);
},50);
