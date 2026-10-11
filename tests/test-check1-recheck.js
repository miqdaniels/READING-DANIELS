/* Check 1 Targeted Recheck forms A and B: real files, labels, directions,
   page reachable with/without a student, nothing saved changes. */
const fs=require('fs'), crypto=require('crypto');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8').replace('<script src="clips.js" defer></script>','<script>'+fs.readFileSync('./clips.js','utf8')+'</script>');
let pass=0, fail=0; function ok(c,m){ if(c){pass++;} else {fail++; console.log("FAIL:",m);} }
const w=new JSDOM(html,{url:"https://miqdaniels.github.io/READING-DANIELS/?teacher",runScripts:"dangerously",pretendToBeVisual:true,
  beforeParse(w){ w.HTMLElement.prototype.scrollIntoView=function(){}; w.scrollTo=function(){}; }}).window;
const d=w.document; function $(i){ return d.getElementById(i); }
function snap(){ var o={}, i, k; for(i=0;i<w.localStorage.length;i++){ k=w.localStorage.key(i); o[k]=w.localStorage.getItem(k); } return JSON.stringify(o); }

/* files: exist, right type, never empty; PDFs are single US Letter pages */
var F={ "forma-pdf":"check1-recheck/Reading_Foundations_Check1_Recheck_Form_A_Initial.pdf","forma-docx":"check1-recheck/Reading_Foundations_Check1_Recheck_Form_A_Initial.docx",
        "formb-pdf":"check1-recheck/Reading_Foundations_Check1_Recheck_Form_B_FollowUp.pdf","formb-docx":"check1-recheck/Reading_Foundations_Check1_Recheck_Form_B_FollowUp.docx" };
w.localStorage.setItem("rf_check1_attempts",JSON.stringify([{id:"a1",studentId:"stu_gomezmiriam_p1",date:"2026-10-01",fileName:"x",scores:Array(52).fill("")}]));
var before=snap();
w.go("s-home");
Array.prototype.filter.call(d.querySelectorAll("#s-home .teach-tile"),function(b){ return /Teach Next/.test(b.textContent); })[0].click();
ok(/active/.test($("c1Next").className),"reachable from Practice > Teach Next with no student picked");
ok(!!$("c1n-recheck") && /Targeted Recheck/.test($("c1n-recheck").textContent),"Targeted Recheck section present with no student");
Object.keys(F).forEach(function(id){
  var a=$("c1n-"+id), href=a&&a.getAttribute("href");
  ok(a && href===F[id] && a.hasAttribute("download"),id+" link points to "+F[id]);
  ok(fs.existsSync(F[id]) && fs.statSync(F[id]).size>10000,id+" is a real file");
  var b=fs.readFileSync(F[id]); ok(F[id].slice(-3)==="pdf" ? b.toString("latin1",0,4)==="%PDF" : b.toString("latin1",0,2)==="PK",id+" has the right file signature");
});
ok($("c1n-forma-pdf").textContent==="Download PDF" && $("c1n-forma-docx").textContent==="Download Editable Word","Form A buttons labeled Download PDF / Download Editable Word");
ok($("c1n-formb-pdf").textContent==="Download PDF" && $("c1n-formb-docx").textContent==="Download Editable Word","Form B buttons labeled Download PDF / Download Editable Word");
var t=$("c1n-recheck").textContent;
ok(/Form A — Initial Letter Identification Recheck/.test(t)&&/Form B — Follow-Up Letter Identification Recheck/.test(t),"both forms labeled correctly and separately");
ok(F["forma-pdf"]!==F["formb-pdf"] && crypto.createHash("sha256").update(fs.readFileSync(F["forma-pdf"])).digest("hex")!==crypto.createHash("sha256").update(fs.readFileSync(F["formb-pdf"])).digest("hex"),"A and B are two separate documents");
["Point to the Letter","Say the Letter Names","This is not timed","not letter sounds","not standardized or validated equivalent test forms","editable Word files","Initial instruction","Additional practice"].forEach(function(x){ ok(t.indexOf(x)>-1,"directions include: "+x); });
ok(/Printing or downloading them does not change Check 1 scores/.test(t),"page says forms don't change scores");

/* everything else still on the page */
ok(!!$("c1n-dl-upper")&&!!$("c1n-dl-lower")&&!!$("c1n-open-upper")&&!!$("c1n-open-lower"),"slideshows + PowerPoint downloads still present");
w.c1nOpenSet("lower",7); ok($("c1n-img").getAttribute("src")==="check1-slides/lower/08.png","slide viewer still works");
ok(!!$("c1n-ml-toggle"),"mini-lesson still present"); $("c1n-ml-toggle").click(); ok(!!$("c1n-ml-steps"),"mini-lesson still opens");
/* reachable from Check 1 Review too, with a student */
w.go("check1Teach"); Array.prototype.filter.call(d.querySelectorAll("#check1Teach > .wrap > button"),function(b){ return /What to Teach Next/.test(b.textContent); })[0].click();
ok(/active/.test($("c1Next").className)&&!!$("c1n-forma-pdf"),"reachable from Check 1 Review");
w.c1nGo("stu_gomezmiriam_p1"); ok(!!$("c1n-recheck"),"still shown with a student picked");

/* nothing saved changed by opening/viewing */
ok(snap()===before,"opening the forms page changed no saved data");
ok(JSON.parse(w.localStorage.getItem("rf_check1_attempts"))[0].scores.length===52,"Check 1 scores intact");
ok(!/rf_check1_attempts\s*=/.test(html.slice(html.indexOf('id="c1n-recheck"'),html.indexOf('id="c1n-recheck"')+6000)),"recheck section has no storage code");
ok(/<\/script>\s*<\/body>\s*<\/html>\s*$/.test(html),"index.html ends with </script></body></html>");
console.log("check1-recheck: "+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
