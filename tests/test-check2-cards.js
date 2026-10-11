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
var tile=Array.prototype.filter.call(d.querySelectorAll("#s-home .teach-tile"),function(b){ return /Teach Next/.test(b.textContent); })[0];
ok(!!tile && tile.closest(".teach-cat-block").querySelector(".teach-cat-title").textContent==="Practice","Teach Next tile under Practice");
tile.click(); d.querySelector('.tn-card[data-check="2"]').click(); ok(/active/.test($("c2Next").className),"hub Check 2 card opens Check 2 resources with no student picked");
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

/* ===== student-specific recommendations (conservative mapping) ===== */
var cp=require('child_process'), haveTxt=true, cards=[];
try{
  var raw=cp.execFileSync("pdftotext",["-raw","check2-cards/"+T+".pdf","-"],{encoding:"utf8"}).split("\n").filter(function(l){ return !/READING FOUNDATIONS|CHECK 2|Reading Foundations •/.test(l) && l!==""; });
  for(var q=0;q<raw.length;q++){ if(raw[q].charAt(0)==="/"){ cards.push((raw[q-1]+" "+raw[q]).replace(/\s+/g,"")); } }
}catch(e){ haveTxt=false; }
if(haveTxt){
  ok(cards.length===44,"teacher PDF has exactly 44 cards (found "+cards.length+")");
  var okMap=true, bad=[]; Object.keys(w.C2N_CARD).forEach(function(k){
    var c=w.C2N_CARD[k], want=c[1].replace(/\s*\(.*\)\s*$/,"").replace(/\s+/g,"");
    if(cards[c[0]-1]!==want){ okMap=false; bad.push(k+" card "+c[0]+" expects "+want+" got "+cards[c[0]-1]); }
  });
  ok(okMap,"every mapped target points at the card whose spelling+sound matches in the real PDF "+bad.join("; "));
}
/* per-page card counts straight from the PDFs: 8,8,8,8,8,4 for both sets */
[T,S].forEach(function(base){
  var counts=[]; for(var pg=1;pg<=6;pg++){ try{ counts.push(cp.execFileSync("pdftotext",["-f",""+pg,"-l",""+pg,"-raw","check2-cards/"+base+".pdf","-"],{encoding:"utf8"}).split("\n").filter(function(l){ return l.charAt(0)==="/"; }).length); }catch(e){ counts.push(-1); } }
  ok(counts.join(",")==="8,8,8,8,8,4",base.indexOf("Teacher")>-1?"teacher PDF cards per page 8,8,8,8,8,4 (got "+counts+")":"student PDF cards per page 8,8,8,8,8,4 (got "+counts+")");
});
/* the 31 targets: each is either mapped to a unique card or explicitly listed as unmapped */
var items=w.C2_ITEMS, mapped=0, unmapped=[];
items.forEach(function(it){ var k=it.section+":"+it.letter; if(w.C2N_CARD[k]){ mapped++; } else { unmapped.push(k); } });
ok(items.length===31 && mapped===28 && unmapped.join(",")==="2A:c,2A:q,2A:x","28 targets mapped; c, q, x deliberately unmapped (got "+mapped+" / "+unmapped+")");
var nums=Object.keys(w.C2N_CARD).map(function(k){ return w.C2N_CARD[k][0]; }); ok(nums.length===28 && new Set(nums).size===28,"no two targets share a card");
ok(Object.keys(w.C2N_NOCARD).join(",")==="2A:c,2A:q,2A:x","unmapped list is exactly c, q, x");

/* score a student: miss b (2A), c (2A), short e (2B), long u (2C); skip m; self-correct t; not-reached rest */
var sc=items.map(function(){ return ""; }), idx=function(sec,l){ for(var z=0;z<items.length;z++){ if(items[z].section===sec&&items[z].letter===l) return z; } };
sc[idx("2A","b")]="err"; sc[idx("2A","c")]="err"; sc[idx("2B","e")]="lns"; sc[idx("2C","u")]="err"; sc[idx("2A","m")]="skip"; sc[idx("2A","t")]="sc"; sc[idx("2A","x")]="nr"; sc[idx("2A","q")]="alt";
w.localStorage.setItem("rf_check2_attempts",JSON.stringify([{id:"c2b",studentId:"stu_gomezmiriam_p1",date:"2026-10-02",fileName:"y",scores:sc,c2aCorrect:18,c2bCorrect:5,c2cCorrect:5}]));
var b4=snap();
w.go("check2Teach"); w.c2nGo("stu_gomezmiriam_p1");
ok(/active/.test($("c2Next").className) && /scored/.test($("c2n-student-note").textContent) && !/Not scored/.test($("c2n-student-note").textContent),"student scored -> recommendations shown");
var rowsT=Array.prototype.map.call(d.querySelectorAll(".c2n-target"),function(r){ return r.getAttribute("data-key"); });
ok(rowsT.join(",")==="2A:m,2A:b,2B:e,2C:u","recommends exactly m, b, short e, long u (got "+rowsT+")");
var tt=$("c2n-targets").textContent;
ok(/Card 1: b \/b\//.test(tt)&&/Card 9: m \/m\//.test(tt)&&/Card 26: e \/ĕ\/ \(short e\)/.test(tt)&&/Card 34: u, u_e, ew \/yoo\/ \(long u\)/.test(tt),"correct card shown for each target");
ok(/page 1 of 6/.test(tt)&&/page 4 of 6/.test(tt)&&/page 5 of 6/.test(tt),"page numbers correct (card 26 -> p4, card 34 -> p5)");
ok(Array.prototype.map.call(d.querySelectorAll(".c2n-nocard"),function(r){ return r.getAttribute("data-key"); }).join(",")==="2A:c","missed c listed as no single matching card");
ok(!/\bx\b/.test(tt.replace(/Missed, but no[^]*$/,"")) && d.querySelectorAll('[data-key="2A:x"]').length===0 && d.querySelectorAll('[data-key="2A:t"]').length===0 && d.querySelectorAll('[data-key="2A:q"]').length===0,"not-reached x, self-corrected t, alternate-accepted q are not recommended");
/* Check 2 Review button carries the student over */
w.go("check2Teach"); w.c2tOpenAttempt && 0; w.eval('C2T_STU="stu_gomezmiriam_p1"');
Array.prototype.filter.call(d.querySelectorAll("#check2Teach > .wrap > button"),function(b){ return /What to Teach Next/.test(b.textContent); })[0].click();
ok(w.eval("C2N_STU")==="stu_gomezmiriam_p1" && d.querySelectorAll(".c2n-target").length===4,"review button opens page with that student");
/* unscored student */
w.localStorage.setItem("rf_check2_attempts",JSON.stringify([{id:"c2c",studentId:"stu_guerrerooneiver_p1",date:"2026-10-02",fileName:"z"}]));
w.c2nGo("stu_guerrerooneiver_p1"); ok(/Not scored yet/.test($("c2n-student-note").textContent)&&d.querySelectorAll(".c2n-target").length===0,"unscored student: Not scored yet, nothing invented");
ok(!!$("c2n-teacher-pdf")&&!!$("c2n-student-docx"),"card library still available for manual choice");
ok(/Students learning English may produce certain sounds differently because of their first-language background\. Model English sounds explicitly, provide opportunities for listening and repetition, and distinguish language development from demonstrated gaps in letter-sound knowledge\./.test($("c2n-ml").textContent),"multilingual learner note exact");
/* nothing written by the recommendations */
w.localStorage.setItem("rf_check2_attempts",JSON.stringify([{id:"c2b",studentId:"stu_gomezmiriam_p1",date:"2026-10-02",fileName:"y",scores:sc,c2aCorrect:18,c2bCorrect:5,c2cCorrect:5}]));
var b5=snap(); w.c2nGo("stu_gomezmiriam_p1"); w.c2nGo(null); w.c2nGo("stu_gomezmiriam_p1");
ok(snap()===b5,"recommendations read only: no saved data changed");
ok(/<\/script>\s*<\/body>\s*<\/html>\s*$/.test(html),"index.html ends with </script></body></html>");
console.log("check2-cards: "+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
