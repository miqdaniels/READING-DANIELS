/* What to Teach Next hub (7 checks), per-check pages, and review <-> resource navigation. */
const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8').replace('<script src="clips.js" defer></script>','<script>'+fs.readFileSync('./clips.js','utf8')+'</script>');
let pass=0, fail=0; function ok(c,m){ if(c){pass++;} else {fail++; console.log("FAIL:",m);} }
const errors=[];
const w=new JSDOM(html,{url:"https://miqdaniels.github.io/READING-DANIELS/?teacher",runScripts:"dangerously",pretendToBeVisual:true,
  beforeParse(w){ w.HTMLElement.prototype.scrollIntoView=function(){}; w.scrollTo=function(){}; w.addEventListener("error",function(e){ errors.push(e.message); }); }}).window;
const d=w.document; function $(i){ return d.getElementById(i); }
function active(){ var s=d.getElementsByClassName("screen"), i; for(i=0;i<s.length;i++){ if(/active/.test(s[i].className)){ return s[i].id; } } }
function snap(){ var o={}, i, k; for(i=0;i<w.localStorage.length;i++){ k=w.localStorage.key(i); o[k]=w.localStorage.getItem(k); } return JSON.stringify(o); }
var A="stu_gomezmiriam_p1";
var sc1=[]; for(var i=0;i<52;i++) sc1.push(""); sc1[w.C1_ALL.indexOf("b")]="err";
w.localStorage.setItem("rf_check1_attempts",JSON.stringify([{id:"a1",studentId:A,date:"2026-10-01",fileName:"x",scores:sc1}]));
var before=snap();

/* dashboard */
w.go("s-home");
ok(/Teacher Dashboard/.test(d.querySelector(".teach-topbar h2").textContent),"dashboard headed Teacher Dashboard");
ok(/What to Teach Next/.test($("tn-feature").textContent),"What to Teach Next featured on dashboard");
var titles=Array.prototype.map.call(d.querySelectorAll("#teacher-doors .teach-cat-title"),function(h){ return h.textContent; });
ok(titles.join("|")==="Students|Assessment & Scoring|Recordings|Reports|Practice|Settings","six dashboard sections in order");
var reviews=Array.prototype.map.call(d.querySelectorAll(".cat-scoring .teach-tile-label"),function(l){ return l.textContent; });
ok(["Check 1 Review","Check 2 Review","Check 3 Review","Check 4 Review","Check 5 Review","Check 6 Review","Check 6B Review","Check 6C Review","Check 7 Review","Fluency Review"].every(function(x){ return reviews.indexOf(x)>-1; }),"every assessment review (incl. 6B, 6C, Fluency) still on the dashboard");
/* feature button + Teach Next tile both open the hub */
$("tn-feature-btn").click(); ok(active()==="teachNext","featured button opens the hub");
w.go("s-home"); Array.prototype.filter.call(d.querySelectorAll("#s-home .teach-tile"),function(b){ return /Teach Next/.test(b.textContent); })[0].click();
ok(active()==="teachNext","Practice > Teach Next opens the hub (not Check 1 directly)");
ok(/Select a reading check to access instructional resources, practice materials, and targeted rechecks\./.test($("teachNext").textContent),"hub subtitle exact");
var cards=Array.prototype.map.call(d.querySelectorAll(".tn-card .tn-title"),function(t){ return t.textContent; });
ok(cards.join("|")==="Check 1 — Letter Identification|Check 2 — Letter-Sound Knowledge|Check 3 — Phonemic Awareness|Check 4 — Decoding|Check 5 — Automatic Word Recognition|Check 6 — Morphological Awareness & Word Analysis|Check 7 — Multisyllabic Word Analysis","seven hub cards titled exactly");
ok(d.querySelectorAll(".tn-card").length===7,"exactly seven cards");

/* routing */
function card(n){ return d.querySelector('.tn-card[data-check="'+n+'"]'); }
card(1).click(); ok(active()==="c1Next" && !!$("c1n-forma-pdf") && !!$("c1n-ml-toggle") && !!$("c1n-dl-upper"),"Check 1 card -> Check 1 resources (slides, mini-lesson, rechecks)");
w.go("teachNext"); card(2).click(); ok(active()==="c2Next" && !!$("c2n-teacher-pdf") && !!$("c2n-student-docx"),"Check 2 card -> Check 2 sound cards");
var rev={3:["check3Teach"],4:["check4Teach"],5:["check5Teach"],6:["check6Teach","check6bTeach","check6cTeach"],7:["check7Teach"]};
[3,4,5,6,7].forEach(function(n){
  w.go("teachNext"); card(n).click();
  ok(active()==="tnCheck","Check "+n+" card -> its own landing page");
  ok($("tn-check-title").textContent.indexOf("Check "+n)===0,"Check "+n+" page titled");
  ok($("tn-check-status").textContent==="Instructional resources are being developed for this check.","Check "+n+" says resources are being developed (exact)");
  ok(d.querySelectorAll("#tn-check-reviews button").length===rev[n].length,"Check "+n+" lists its review link(s)");
  ok(!d.querySelector("#tnCheck a[download]") && !/download/i.test($("tnCheck").textContent.replace(/Back to[^]*/,"")),"Check "+n+": no invented downloads");
  d.querySelector("#tn-check-reviews button").click(); ok(active()===rev[n][0],"Check "+n+" review link opens "+rev[n][0]);
});

/* navigation buttons + review round trip keeps student/class */
w.go("check1Teach");
Array.prototype.filter.call(d.querySelectorAll("#c1t-roster button"),function(b){ return /Miriam/.test(b.textContent); })[0].click();
ok(w.C1T_STU===A,"student selected in Check 1 Review");
Array.prototype.filter.call(d.querySelectorAll("#check1Teach > .wrap > button"),function(b){ return /What to Teach Next/.test(b.textContent); })[0].click();
ok(active()==="c1Next" && w.C1N_STU===A && /Miriam/.test($("c1n-student-note").textContent),"review -> Check 1 page carries the student and missed-letter targets");
ok(!!d.querySelector(".c1n-prac"),"student-specific slide recommendations still shown");
var nav=Array.prototype.map.call(d.querySelectorAll("#c1Next .tn-nav button"),function(b){ return b.textContent; });
ok(nav.join("|")==="Back to What to Teach Next|Back to Teacher Dashboard|Return to Student Review","three nav buttons incl. Return to Student Review when entered from a review");
d.querySelector("#c1Next .tn-nav .pill-btn-primary").click();
ok(active()==="check1Teach" && w.C1T_STU===A && /Miriam/.test($("c1t-body").textContent),"Return to Student Review restores the same review with the same student");
w.go("c1Next"); d.querySelectorAll("#c1Next .tn-nav button")[0].click(); ok(active()==="teachNext","Back to What to Teach Next works");
w.tnHub(); card(1).click(); var nav2=Array.prototype.map.call(d.querySelectorAll("#c1Next .tn-nav button"),function(b){ return b.textContent; });
ok(nav2.join("|")==="Back to What to Teach Next|Back to Teacher Dashboard","from the hub there is no Return to Student Review");
d.querySelectorAll("#c1Next .tn-nav button")[1].click(); ok(active()==="s-home","Back to Teacher Dashboard works");
/* every review screen has a working What to Teach Next */
var map={check1Teach:"c1Next",check2Teach:"c2Next",check3Teach:"tnCheck",check4Teach:"tnCheck",check5Teach:"tnCheck",check6Teach:"tnCheck",check6bTeach:"tnCheck",check6cTeach:"tnCheck",check7Teach:"tnCheck"};
Object.keys(map).forEach(function(r){ w.go(r); var b=Array.prototype.filter.call(d.querySelectorAll("#"+r+" > .wrap > button"),function(x){ return /What to Teach Next/.test(x.textContent); })[0];
  ok(!!b,r+" has a What to Teach Next button"); if(b){ b.click(); ok(active()===map[r],r+" -> "+map[r]);
    if(r!=="check1Teach"&&r!=="check2Teach"){ d.querySelector("#tnCheck .tn-nav .pill-btn-primary").click(); ok(active()===r,r+": Return to Student Review comes back"); } } });
/* Check 2 student carry-over */
var sc2=w.C2_ITEMS.map(function(){ return ""; }); sc2[w.C2_ITEMS.map(function(x){return x.section+x.letter;}).indexOf("2Aq")]="err"; sc2[1]="err";
w.localStorage.setItem("rf_check2_attempts",JSON.stringify([{id:"c2a",studentId:A,date:"2026-10-02",fileName:"y",scores:sc2,c2aCorrect:1,c2bCorrect:1,c2cCorrect:1}]));
w.go("check2Teach"); Array.prototype.filter.call(d.querySelectorAll("#c2t-roster button"),function(b){ return /Miriam/.test(b.textContent); })[0].click();
Array.prototype.filter.call(d.querySelectorAll("#check2Teach > .wrap > button"),function(b){ return /What to Teach Next/.test(b.textContent); })[0].click();
ok(w.C2N_STU===A && d.querySelectorAll(".c2n-target").length===1,"review -> Check 2 page keeps the student and the verified card recommendation");
/* nothing saved changed by navigating; no JS errors; ES5 and ending */
ok(JSON.parse(w.localStorage.getItem("rf_check1_attempts"))[0].scores.join()===sc1.join(),"Check 1 scores untouched by all this navigation");
ok(errors.length===0,"no JavaScript errors ("+errors.join("; ")+")");
ok(!/=>/.test(html.slice(html.indexOf("What to Teach Next: hub for all seven"),html.indexOf("What to Teach Next: hub for all seven")+9000)),"hub code is ES5 (no arrow functions)");
ok(/<\/script>\s*<\/body>\s*<\/html>\s*$/.test(html),"index.html ends with </script></body></html>");
console.log("teach-next-hub: "+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
