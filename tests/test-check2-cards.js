/* Check 2 What to Teach Next: the two approved 44-card sound-card sets. */
const fs=require('fs'), crypto=require('crypto');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8').replace('<script src="clips.js" defer></script>','<script>'+fs.readFileSync('./clips.js','utf8')+'</script>');
let pass=0, fail=0; function ok(c,m){ if(c){pass++;} else {fail++; console.log("FAIL:",m);} }
const w=new JSDOM(html,{url:"https://miqdaniels.github.io/READING-DANIELS/?teacher",runScripts:"dangerously",pretendToBeVisual:true,
  beforeParse(w){ w.HTMLElement.prototype.scrollIntoView=function(){}; w.scrollTo=function(){}; }}).window;
const d=w.document; function $(i){ return d.getElementById(i); }
function snap(){ var o={}, i, k; for(i=0;i<w.localStorage.length;i++){ k=w.localStorage.key(i); o[k]=w.localStorage.getItem(k); } return JSON.stringify(o); }
var T="Reading_Foundations_Check2_Teacher_Sound_Cards_44_Comic_Neue_Only", S="Reading_Foundations_Check2_Student_Practice_Cards_44_Comic_Neue_Only";
var L={"teacher-view":"check2-cards/"+T+".pdf","teacher-pdf":"check2-cards/"+T+".pdf","teacher-docx":"check2-cards/"+T+".docx","student-view":"check2-cards/"+S+".pdf","student-pdf":"check2-cards/"+S+".pdf","student-docx":"check2-cards/"+S+".docx"};
w.localStorage.setItem("rf_check2_attempts",JSON.stringify([{id:"c2a",studentId:"stu_gomezmiriam_p1",date:"2026-10-01",fileName:"x",scores:["err"]}]));
var before=snap();
w.go("s-home");
var tile=Array.prototype.filter.call(d.querySelectorAll("#s-home .teach-tile"),function(b){ return /Sound Cards/.test(b.textContent); })[0];
ok(!!tile && tile.closest(".teach-cat-block").querySelector(".teach-cat-title").textContent==="Practice","Sound Cards tile under Practice");
tile.click(); ok(/active/.test($("c2Next").className),"tile opens Check 2 What to Teach Next with no student picked");
var t=$("c2n-resources").textContent;
ok(/Letter-Sound Teaching and Practice/.test(t),"section labeled Letter-Sound Teaching and Practice");
ok(/Teacher Sound Cards — 44 Sounds/.test(t)&&/Student Practice Sound Cards — 44 Sounds/.test(t),"both sets labeled");
Object.keys(L).forEach(function(id){
  var a=$("c2n-"+id); ok(a && a.getAttribute("href")===L[id],id+" link -> "+L[id]);
  ok(fs.existsSync(L[id]) && fs.statSync(L[id]).size>10000,id+" is a real file");
  var b=fs.readFileSync(L[id]); ok(L[id].slice(-3)==="pdf"?b.toString("latin1",0,4)==="%PDF":b.toString("latin1",0,2)==="PK",id+" file signature");
  if(/pdf$|docx$/.test(id)){ ok(a.hasAttribute("download"),id+" is a download link"); }
});
ok($("c2n-teacher-view").getAttribute("target")==="_blank" && !$("c2n-teacher-view").hasAttribute("download"),"View opens the PDF in a new tab");
ok($("c2n-teacher-docx").textContent==="Download Editable Word" && $("c2n-student-docx").textContent==="Download Editable Word","Word buttons labeled");
ok(L["teacher-pdf"]!==L["student-pdf"],"teacher and student sets are separate files");
var how=$("c2n-howto").textContent;
ok(how.indexOf("Review the student’s Check 2 results.")>-1 && how.indexOf("Correct right away")>-1 && d.querySelectorAll("#c2n-howto li").length===9,"9-step directions");
ok(/not a required sequence/.test(how),"not-a-required-sequence note");
ok(/31 targets/.test($("c2n-note").textContent)&&/44 cards/.test($("c2n-note").textContent)&&/do not change Check 2/.test($("c2n-note").textContent),"31 vs 44 note");
/* also reachable from Check 2 Review */
w.go("check2Teach"); Array.prototype.filter.call(d.querySelectorAll("#check2Teach > .wrap > button"),function(b){ return /What to Teach Next/.test(b.textContent); })[0].click();
ok(/active/.test($("c2Next").className),"Check 2 Review button opens the same page");
/* Check 1 resources intact; nothing saved changed */
w.c1nGo(null); ok(!!$("c1n-forma-pdf")&&!!$("c1n-ml-toggle")&&!!$("c1n-dl-upper"),"Check 1 slides/mini-lesson/recheck forms still there");
ok(snap()===before,"viewing the sound cards changed no saved data");
ok(JSON.parse(w.localStorage.getItem("rf_check2_attempts"))[0].scores[0]==="err","Check 2 scores intact");
ok(w.C2_ITEMS.length===31,"Check 2 assessment still 31 items");
ok(/<\/script>\s*<\/body>\s*<\/html>\s*$/.test(html),"index.html ends with </script></body></html>");
console.log("check2-cards: "+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
