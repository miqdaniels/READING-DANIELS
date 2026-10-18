/* Check 3 > What to Teach Next > Beginning Sounds (module 1 of 4).
   Content is compared against the approved Word file itself
   (check3-lessons/Beginning_Sounds_v06_EDITABLE.docx), read straight from its XML. */
const fs=require('fs'), crypto=require('crypto'), cp=require('child_process');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8').replace('<script src="clips.js" defer></script>','<script>'+fs.readFileSync('./clips.js','utf8')+'</script>');
let pass=0, fail=0; function ok(c,m){ if(c){pass++;} else {fail++; console.log("FAIL:",m);} }
function norm(t){ return t.replace(/\s+/g," ").trim(); }
function open(search){
  const errors=[], printed=[];
  const w=new JSDOM(html,{url:"https://miqdaniels.github.io/READING-DANIELS/"+search,runScripts:"dangerously",pretendToBeVisual:true,
    beforeParse(w){ w.HTMLElement.prototype.scrollIntoView=function(){}; w.scrollTo=function(){}; w.addEventListener("error",function(e){ errors.push(e.message); });
      w.print=function(){ var el=w.document.getElementById("c3bs-print"); printed.push(el?el.className:null); }; }}).window;
  return {w:w,d:w.document,errors:errors,printed:printed};
}
function snap(w){ var o={}, i, k; for(i=0;i<w.localStorage.length;i++){ k=w.localStorage.key(i); o[k]=w.localStorage.getItem(k); } return JSON.stringify(o); }

/* ---- the approved Word file: identity + its text ---- */
const DOCX='check3-lessons/Beginning_Sounds_v06_EDITABLE.docx';
ok(crypto.createHash('sha256').update(fs.readFileSync(DOCX)).digest('hex')==="edc19e537a3f48f665b0fd280d086cc96b8ac1737ddd46fb9c65d09f0ed149e9","Word download is the approved v0.6 file, byte for byte");
const xml=cp.execFileSync('unzip',['-p',DOCX,'word/document.xml']).toString('utf8');
const chunks=[]; (xml.match(/<w:p[ >][\s\S]*?<\/w:p>/g)||[]).forEach(function(p){
  var t=(p.match(/<w:t(?: [^>]*)?>[^<]*<\/w:t>/g)||[]).map(function(x){ return x.replace(/<[^>]+>/g,""); }).join("");
  t=norm(t.replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"'));
  if(t && !/^_+$/.test(t)){ chunks.push(t); }
});
const iSup=chunks.indexOf("TEACHER SUPPORT"), iObs=chunks.indexOf("OBSERVATION AND NEXT STEP");
ok(chunks.length>80 && iSup>0 && iObs>iSup,"read "+chunks.length+" text chunks from the approved document");
const pages=[chunks.slice(0,iSup),chunks.slice(iSup,iObs),chunks.slice(iObs)];

/* ---- teacher session ---- */
const T=open("?teacher"), w=T.w, d=T.d; function $(i){ return d.getElementById(i); }
function active(){ var s=d.getElementsByClassName("screen"), i; for(i=0;i<s.length;i++){ if(/active/.test(s[i].className)){ return s[i].id; } } }
const before=snap(w);

/* hub -> Check 3 -> lesson */
w.go("teachNext"); d.querySelector('.tn-card[data-check="3"]').click();
ok(active()==="c3Next","hub Check 3 card opens the Check 3 resources page");
ok(/Beginning Sounds/.test($("c3n-bs").textContent) && /first sound in a spoken word/i.test($("c3n-bs").textContent),"Beginning Sounds card names the target");
ok($("c3n-bs-docx").getAttribute("href")===DOCX && $("c3n-bs-docx").hasAttribute("download"),"landing card links the approved Word file as a download");
ok(!/\b(Medial|Ending Sounds|Blending|Segmenting)\b/.test($("c3Next").textContent),"only Beginning Sounds is offered (no other modules built)");
$("c3n-open-bs").click(); ok(active()==="c3Bs","Open Beginning Sounds opens the lesson");
ok($("c3bs-docx").getAttribute("href")===DOCX && $("c3bs-docx").hasAttribute("download"),"lesson page links the approved Word file as a download");

/* three sections, every control */
function tabs(){ return [1,2,3].map(function(i){ return { sel:$("c3bs-tab-"+i).getAttribute("aria-selected"), hid:$("c3bs-panel-"+i).hidden }; }); }
function only(n){ return tabs().every(function(t,i){ return (i+1===n)===(t.sel==="true") && (i+1===n)===(!t.hid); }); }
ok(only(1),"opens on section 1");
ok($("c3bs-tab-1").textContent.indexOf("Beginning Sounds")>-1 && $("c3bs-tab-2").textContent.indexOf("Teacher Support")>-1 && $("c3bs-tab-3").textContent.indexOf("Observation and Next Step")>-1,"tab labels");
$("c3bs-tab-2").click(); ok(only(2),"tab 2 shows Teacher Support only");
$("c3bs-tab-3").click(); ok(only(3),"tab 3 shows Observation only");
$("c3bs-tab-1").click(); ok(only(1),"tab 1 returns");
$("c3bs-next-1").click(); ok(only(2),"Next section (1->2)");
$("c3bs-next-2").click(); ok(only(3),"Next section (2->3)");
$("c3bs-prev-3").click(); ok(only(2),"Previous section (3->2)");
$("c3bs-prev-2").click(); ok(only(1),"Previous section (2->1)");
ok(!$("c3bs-prev-1"),"no Previous on section 1");

/* screen content: all of section N's approved text is in panel N */
[1,2,3].forEach(function(n){
  var txt=norm($("c3bs-panel-"+n).textContent), miss=[];
  pages[n-1].forEach(function(c){
    if(/^CHECK 3 \/ ITEM 1 .*PAGE \d OF 3$/.test(c)){ c=c; }
    if(/^(BEGINNING SOUNDS|TEACHER SUPPORT|OBSERVATION AND NEXT STEP)$/.test(c)){ return; } /* page titles: screen title / tab */
    if(/^Student: /.test(c)){ if(txt.indexOf("Student:")<0||txt.indexOf("Date:")<0){ miss.push(c); } return; }
    if(txt.indexOf(c)<0){ miss.push(c); }
  });
  ok(miss.length===0,"screen section "+n+" matches the Word document"+(miss.length?" -- missing: "+miss.join(" || "):""));
});
ok(norm($("c3Bs").querySelector(".c3bs-title").textContent)==="Beginning Sounds","lesson title");

/* printed pages: three, in the Word document's order, matching it exactly */
var pp=d.querySelectorAll("#c3bs-print .c3bs-page");
ok(pp.length===3,"three printed pages");
pages.forEach(function(g,i){
  var txt=norm(pp[i].textContent), miss=[], from=0;
  g.forEach(function(c){
    if(/^Student: /.test(c)){ var k=txt.indexOf("Student:",from); if(k<0||txt.indexOf("Date:",k)<0){ miss.push(c); } else { from=k; } return; }
    var k2=txt.indexOf(c,from); if(k2<0){ miss.push(c); } else { from=k2; }
  });
  ok(miss.length===0,"printed page "+(i+1)+" matches the Word document, in order"+(miss.length?" -- "+miss.join(" || "):""));
});
ok(/PAGE 1 OF 3/.test(pp[0].textContent) && /PAGE 2 OF 3/.test(pp[1].textContent) && /PAGE 3 OF 3/.test(pp[2].textContent),"page labels 1/2/3 of 3");
ok(pp[2].querySelectorAll("tbody tr").length===6 && Array.prototype.map.call(pp[2].querySelectorAll("tbody td.c3bs-key"),function(x){ return x.textContent; }).join()==="team,door,lake,gum,net,hat","observation sheet lists the six approved words");
ok(pp[2].querySelectorAll("tbody td.c3bs-cmn").length===6 && pp[2].querySelectorAll("tbody td.c3bs-cmn")[0].textContent==="","C / M / N and student-response cells are blank to write in");
ok(/C = Correct independently/.test(pp[2].textContent) && /M = Correct after model/.test(pp[2].textContent) && /N = Not yet/.test(pp[2].textContent),"C / M / N key");
ok(pp[2].querySelectorAll(".c3bs-decide li").length===3 && pp[2].querySelectorAll(".c3bs-lines div").length===2,"three teacher decisions and two note lines");
ok(pp[0].querySelectorAll(".c3bs-words").length===2 && pp[0].querySelectorAll(".c3bs-steps tbody tr").length===5,"page 1: five steps, two practice charts");
ok(pp[0].querySelectorAll(".c3bs-words")[0].querySelectorAll("tbody tr").length===2 && pp[0].querySelectorAll(".c3bs-words")[1].querySelectorAll("tbody tr").length===3,"guided chart = 4 words, independent chart = 6 words");

/* printing: three buttons, three modes, resets to the full document */
$("c3bs-print-all").click(); $("c3bs-print-teach").click(); $("c3bs-print-obs").click(); $("c3bs-tab-3").click(); $("c3bs-print-obs-2").click();
ok(T.printed.join()==="c3bs-m-all,c3bs-m-teach,c3bs-m-obs,c3bs-m-obs","Print buttons ask for all / teaching pages / observation only ("+T.printed.join()+")");
ok($("c3bs-print").className==="c3bs-m-all","print mode resets to the full three-page document");
ok(/@media print\{[^]*?#c3bs-print\.c3bs-m-obs \.c3bs-page\.c3bs-p1[^]*?display:none/.test(html),"print CSS hides pages 1-2 in observation-only mode");
ok(/\.c3bs-page\+\.c3bs-page\{break-before:page/.test(html),"print CSS starts each page on a new sheet");

/* back links */
$("c3bs-back-check3").click(); ok(active()==="c3Next","Back to Check 3 resources");
$("c3n-open-bs").click(); d.querySelectorAll("#c3bs-nav button")[1].click(); ok(active()==="teachNext","Back to What to Teach Next");
w.go("c3Bs"); d.querySelectorAll("#c3bs-nav button")[2].click(); ok(active()==="s-home","Back to Teacher Dashboard");
w.go("c3Next"); ok(d.querySelectorAll("#c3Next .tn-nav button").length===2 && /Back to What to Teach Next/.test(d.querySelectorAll("#c3Next .tn-nav button")[0].textContent),"Check 3 page has back navigation");
/* re-entering resets to section 1 */
w.go("c3Bs"); $("c3bs-tab-3").click(); w.go("c3Next"); w.go("c3Bs"); ok(only(1),"re-opening the lesson starts at section 1");

/* nothing stored, nothing spoken */
ok(snap(w)===before,"viewing and printing wrote nothing to storage");
const src=html.slice(html.indexOf("Check 3 > What to Teach Next > Beginning Sounds"),html.indexOf("Check 2: 44-Sound Slideshow"));
ok(src.length>3000 && !/speechSynthesis|SpeechSynthesisUtterance|new Audio\(|AudioStore|\.play\(/.test(src),"module creates and plays no audio (no text-to-speech)");
ok(!/localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest/.test(src),"module touches no storage or network");
ok(!/=>|\bconst\s|\blet\s|`/.test(src),"module is ES5 only");
ok(T.errors.length===0,"no JavaScript errors ("+T.errors.join("; ")+")");

/* practice words are separate from the scored Check 3 bank. Known overlap in the
   approved document is reported to Mick; this pins it so any NEW overlap fails. */
const scored=w.C3_SCORED.map(function(x){ return x.word; }).concat(Object.keys(w.C3_PRACTICE).map(function(k){ return w.C3_PRACTICE[k].word; }),Object.keys(w.C3_SAMPLE).map(function(k){ return w.C3_SAMPLE[k].word; }));
const practice=[].concat.apply([],w.C3BS.guided.concat(w.C3BS.indep).map(function(r){ return [r[0],r[2]]; }));
ok(practice.length===10,"ten practice words in the module");
ok(practice.filter(function(x){ return scored.indexOf(x)>-1; }).join()==="bus","only known overlap with the Check 3 bank among practice words is 'bus' (approved document; flagged for review)");
ok(w.C3_SCORED.length===20 && w.C3_SCORED[0].word==="map","Check 3 scored bank untouched (20 items)");

/* ---- student session: no teacher answers anywhere ---- */
const S=open(""), sd=S.d;
ok(S.w.document.getElementById("s-pick").className.indexOf("active")>-1,"student session starts on the student picker");
ok(sd.getElementById("c3Next").getAttribute("data-teacher")==="1" && sd.getElementById("c3Bs").getAttribute("data-teacher")==="1","both new screens are teacher-only screens");
ok(norm(sd.getElementById("c3bs-panel-1").textContent)==="" && sd.getElementById("c3bs-print").innerHTML==="","student session never builds the practice words or answers");
const leaks=Array.prototype.filter.call(sd.querySelectorAll('[id^="c3bs"],[id^="c3n-"]'),function(el){ return !el.closest('section[data-teacher="1"]'); });
ok(leaks.length===0,"nothing from the new feature sits outside the teacher screens");
ok(!/id="c3Next"|id="c3Bs"|go\('c3Next'\)|go\('c3Bs'\)|Beginning Sounds/.test(Array.prototype.map.call(sd.querySelectorAll('section.screen:not([data-teacher="1"])'),function(s){ return s.outerHTML; }).join("")),"no student screen mentions or links the lesson");
ok(S.errors.length===0,"no JavaScript errors in student session");

ok(/<\/script>\s*<\/body>\s*<\/html>\s*$/.test(html),"index.html ends with </script></body></html>");
console.log("c3-beginning-sounds: "+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
