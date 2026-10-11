/* Check 1 "What to Teach Next": slides viewer, missed-letter recommendations,
   print sheet, and proof that viewing changes nothing saved. */
const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8').replace('<script src="clips.js" defer></script>','<script>'+fs.readFileSync('./clips.js','utf8')+'</script>');
let pass=0, fail=0;
function ok(c,m){ if(c){pass++;} else {fail++; console.log("FAIL: "+m);} }
const w=new JSDOM(html,{url:"https://miqdaniels.github.io/READING-DANIELS/?teacher",runScripts:"dangerously",pretendToBeVisual:true,
  beforeParse(w){ w.HTMLElement.prototype.scrollIntoView=function(){}; w.scrollTo=function(){}; w.__prints=0; w.print=function(){ w.__prints++; }; }}).window;
const d=w.document;
function $(id){ return d.getElementById(id); }
function snap(){ var o={}, i, k; for(i=0;i<w.localStorage.length;i++){ k=w.localStorage.key(i); o[k]=w.localStorage.getItem(k); } return JSON.stringify(o); }
function key(k){ d.dispatchEvent(new w.KeyboardEvent("keydown",{key:k,bubbles:true})); }

/* ---- static: files exist, 13+13 PNGs, sharp, pptx real ---- */
const SET={upper:"Reading_Foundations_Uppercase_A-Z_13_Approved_Slides.pptx", lower:"Reading_Foundations_Approved_Lowercase_A_to_Z_13_Slides.pptx"};
["upper","lower"].forEach(function(s){
  var n=0, allSharp=true;
  for(var i=1;i<=13;i++){
    var f="check1-slides/"+s+"/"+(i<10?"0":"")+i+".png";
    if(fs.existsSync(f)){ n++; var b=fs.readFileSync(f); if(b.readUInt32BE(16)<1920 || b.toString("latin1",1,4)!=="PNG"){ allSharp=false; } }
  }
  ok(n===13,s+": 13 PNG slides on disk"); ok(allSharp,s+": every slide is a real PNG at least 1920px wide");
  var p="check1-slides/"+SET[s]; ok(fs.existsSync(p)&&fs.statSync(p).size>1e6,s+": original .pptx is in the repo");
  var zip=fs.readFileSync(p); ok(zip.toString("latin1",0,2)==="PK",s+": .pptx is a real zip/pptx");
});

/* ---- no student: page opens, nothing student-specific ---- */
var snap0=snap();
w.go("s-home");
var tile=Array.prototype.filter.call(d.querySelectorAll("#s-home .teach-tile"),function(b){ return /Teach Next/.test(b.textContent); })[0];
ok(!!tile,"Practice section has the Teach Next tile");
ok(tile && tile.closest(".teach-cat-block").querySelector(".teach-cat-title").textContent==="Practice","tile sits under Practice");
tile.click();
ok(/active/.test($("c1Next").className),"tile opens the What to Teach Next page");
ok(/No student picked/.test($("c1n-student-note").textContent),"no student: says none picked");
ok($("c1n-practice").innerHTML==="","no student: no Letters-to-practice list");
ok(!$("c1n-print-btn"),"no student: no print button");
ok($("c1n-viewer").style.display==="none","slides closed until opened");
ok(/How to use these slides/.test($("c1Next").textContent),"directions on the page");
ok(/Teach only the letters the student missed, not all 26\. These slides teach letter NAMES\. Letter sounds are Check 2\./.test($("c1Next").textContent),"directions closing lines exact");
ok(/Paper practice \(optional\)/.test($("c1Next").textContent),"paper practice text present");
ok(/© 2026 Miquela Daniels \/ AI Academy LLC\. All rights reserved\./.test($("c1Next").textContent),"copyright footer");
ok($("c1n-dl-upper").getAttribute("href")==="check1-slides/"+SET.upper && $("c1n-dl-upper").hasAttribute("download"),"uppercase Download PowerPoint link");
ok($("c1n-dl-lower").getAttribute("href")==="check1-slides/"+SET.lower && $("c1n-dl-lower").hasAttribute("download"),"lowercase Download PowerPoint link");
ok(fs.existsSync("check1-slides/"+$("c1n-dl-upper").getAttribute("href").split("/").pop())&&fs.existsSync("check1-slides/"+$("c1n-dl-lower").getAttribute("href").split("/").pop()),"both download links point to real files");

/* ---- walk each slideshow ---- */
var PU=["A–B","C–D","E–F","G–H","I–J","K–L","M–N","O–P","Q–R","S–T","U–V","W–X","Y–Z"];
["upper","lower"].forEach(function(s){
  $("c1n-open-"+s).click();
  var pairs=d.querySelectorAll("#c1n-pairs .c1n-pair"), labels=[];
  pairs.forEach(function(b){ labels.push(b.textContent); });
  var exp=PU.map(function(x){ return s==="upper"?x:x.toLowerCase(); });
  ok(pairs.length===13 && labels.join("|")===exp.join("|"),s+": 13 pair buttons in order "+exp.join(" "));
  ok($("c1n-img").getAttribute("src")==="check1-slides/"+s+"/01.png","opens on slide 1");
  ok($("c1n-prev").disabled && !$("c1n-next").disabled,"Previous disabled on first slide");
  $("c1n-next").click(); ok($("c1n-img").getAttribute("src")==="check1-slides/"+s+"/02.png","Next goes to slide 2");
  $("c1n-prev").click(); ok($("c1n-img").getAttribute("src")==="check1-slides/"+s+"/01.png","Previous goes back to 1");
  key("ArrowRight"); ok($("c1n-img").getAttribute("src")==="check1-slides/"+s+"/02.png","ArrowRight works");
  key("ArrowLeft"); ok($("c1n-img").getAttribute("src")==="check1-slides/"+s+"/01.png","ArrowLeft works");
  pairs[12].click();
  ok($("c1n-img").getAttribute("src")==="check1-slides/"+s+"/13.png" && /Slide 13 of 13/.test($("c1n-count").textContent)&&$("c1n-count").textContent.indexOf(exp[12])>-1,s+": jump to "+exp[12]+" = slide 13");
  ok($("c1n-next").disabled,"Next disabled on last slide");
  key("ArrowRight"); ok($("c1n-img").getAttribute("src")==="check1-slides/"+s+"/13.png","no overrun past 13");
  var order=true; for(var i=0;i<13;i++){ pairs[i].click(); if($("c1n-img").getAttribute("src")!=="check1-slides/"+s+"/"+(i<9?"0":"")+(i+1)+".png" || $("c1n-count").textContent.indexOf(exp[i])<0){ order=false; } }
  ok(order,s+": all 13 slides in the right order");
  ok(typeof $("c1n-full").onclick!=="undefined" || $("c1n-full").getAttribute("onclick"),"Full screen button present");
  $("c1n-full").click(); /* jsdom has no Fullscreen API; must not throw */
});
$("c1n-close").click(); ok($("c1n-viewer").style.display==="none","Close slides hides viewer");
key("ArrowRight"); ok(true,"arrow keys harmless with viewer closed");

/* ---- score Miriam as missing B, G, p, m through the real review screen ---- */
var sid="stu_gomezmiriam_p1";
w.localStorage.setItem("rf_check1_attempts",JSON.stringify([{id:"att1",studentId:sid,date:"2026-10-01T10:00:00.000Z",fileName:"x.webm"}]));
w.go("check1Teach");
Array.prototype.filter.call(d.querySelectorAll("#c1t-roster button"),function(b){ return /Miriam/.test(b.textContent); })[0].click();
w.c1tOpenAttempt("att1");
var cells=d.querySelectorAll("#c1t-upper-grid .c1t-cell, #c1t-lower-grid .c1t-cell"), want={0:"B",1:"G"}, tapped=[];
Array.prototype.forEach.call(cells,function(c,i){ });
function tapLetter(upper,L){ var grid=d.querySelectorAll(upper?"#c1t-upper-grid .c1t-cell":"#c1t-lower-grid .c1t-cell"); Array.prototype.filter.call(grid,function(c){ return c.textContent===L; })[0].click(); }
/* before scoring: not scored yet */
w.c1nGo(sid);
ok(/Not scored yet/.test($("c1n-student-note").textContent),"picked but unscored: says Not scored yet");
ok($("c1n-practice").innerHTML==="" && !$("c1n-print-btn"),"unscored: no list, no print button");
ok(d.querySelectorAll("#c1n-pairs .c1n-pair").length===13||$("c1n-open-upper"),"unscored: full slide picker still available");
$("c1n-open-lower").click(); ok($("c1n-pairs").children.length===13,"unscored: can open any slide by hand");

w.go("check1Teach");
Array.prototype.filter.call(d.querySelectorAll("#c1t-roster button"),function(b){ return /Miriam/.test(b.textContent); })[0].click();
w.c1tOpenAttempt("att1");
tapLetter(true,"B"); tapLetter(true,"G"); tapLetter(false,"p"); tapLetter(false,"m");
tapLetter(false,"s"); tapLetter(false,"s"); /* err -> sc: self-corrected counts as correct */
w.c1tSave();
var saved=JSON.parse(w.localStorage.getItem("rf_check1_attempts"))[0];
ok(saved.scores.length===52 && saved.missedUpper.join("")==="BG" && saved.missedLower.slice().sort().join("")==="mp","Check 1 saved B,G / m,p as missed");

/* ---- the Check 1 Review button opens the same page with that student ---- */
var before=snap();
var btn=Array.prototype.filter.call(d.querySelectorAll("#check1Teach > .wrap > button"),function(b){ return /What to Teach Next/.test(b.textContent); })[0];
ok(!!btn,"Check 1 Review has a What to Teach Next button");
btn.click();
ok(/active/.test($("c1Next").className),"review button opens the same page");
ok(/scored/.test($("c1n-student-note").textContent) && !/Not scored/.test($("c1n-student-note").textContent),"scored student recognized");
var prac=Array.prototype.map.call(d.querySelectorAll(".c1n-prac"),function(b){ return b.getAttribute("data-set")+":"+b.getAttribute("data-slide"); });
ok(prac.join(",")==="upper:1,upper:4,lower:7,lower:8","recommends exactly Upper 1 (A–B), Upper 4 (G–H), Lower 7 (m–n), Lower 8 (o–p) -> got "+prac.join(","));
var txt=$("c1n-practice").textContent;
ok(/missed B/.test(txt)&&/missed G/.test(txt)&&/missed m/.test(txt)&&/missed p/.test(txt),"labels name the exact missed letters");
ok(!/missed s|missed S/.test(txt),"self-corrected letter is not recommended");
ok(!/missed A|missed a|missed b|missed g|missed P|missed M/.test(txt),"no guessed partner letters (B miss never means b)");
d.querySelectorAll(".c1n-prac")[3].click();
ok($("c1n-img").getAttribute("src")==="check1-slides/lower/08.png","practice button opens lowercase slide 8 (o–p)");
d.querySelectorAll(".c1n-prac")[0].click();
ok($("c1n-img").getAttribute("src")==="check1-slides/upper/01.png","practice button opens uppercase slide 1");

/* ---- print: only the missed letters, short name ---- */
ok(!!$("c1n-print-btn"),"print button shows for scored student with misses");
$("c1n-print-btn").click(); ok(w.__prints===1,"print button calls window.print");
var pr=$("c1n-print");
var bigs=Array.prototype.map.call(pr.querySelectorAll(".c1np-big"),function(e){ return e.textContent; });
ok(bigs.join("")==="BGmp","print sheet shows only B G m p (found "+bigs.join("")+")");
var rows=pr.querySelectorAll(".c1np-row"); ok(rows.length===2,"uppercase and lowercase on separate rows");
ok(rows[0].querySelectorAll(".c1np-big").length===2 && rows[1].querySelectorAll(".c1np-big").length===2,"two per row");
ok(pr.querySelectorAll(".c1np-cell")[0].querySelectorAll(".c1np-line").length>=3,"writing lines under each letter");
ok(/Miriam G\./.test(pr.textContent) && !/Gomez/.test(pr.textContent),"first name + last initial only");
ok(/@media print/.test(html.slice(html.indexOf("#c1n-print{display:none}"))),"print stylesheet present");

/* ---- nothing saved changed from viewing ---- */
d.querySelectorAll(".c1n-pair")[5].click(); $("c1n-next").click(); $("c1n-full").click(); $("c1n-close").click();
var after=snap();
ok(before===after,"opening/viewing/printing slides changed no saved data (whole localStorage identical)");
ok(JSON.parse(w.localStorage.getItem("rf_check1_attempts"))[0].scores.join()===saved.scores.join(),"student's Check 1 scores identical before/after");

/* ---- all-correct student & other student unaffected ---- */
w.localStorage.setItem("rf_check1_attempts",JSON.stringify([{id:"a2",studentId:"stu_guerrerooneiver_p1",date:"2026-10-02",scores:Array(52).fill(""),fileName:"y"}]));
w.c1nGo("stu_guerrerooneiver_p1");
ok(/No missed letters/.test($("c1n-practice").textContent) && !$("c1n-print-btn"),"all correct: says so, no print button");
w.c1nGo(null); ok($("c1n-practice").innerHTML==="" && !$("c1n-print-btn"),"clearing the student hides list and print");

ok(html.trim().slice(-26)==="</script>\n</body>\n</html>" || /<\/script>\s*<\/body>\s*<\/html>\s*$/.test(html),"index.html still ends with </script></body></html>");
console.log("check1-next: "+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
