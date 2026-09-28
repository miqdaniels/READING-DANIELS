const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8').replace('<script src="clips.js" defer></script>','<script>'+fs.readFileSync('./clips.js','utf8')+'</script>');

/* SCORE REPORTS: All Students table on the Scoreboard screen.
   - Top 5 ("Top readers") + Teams stay exactly as they were (points-based,
     untouched logic) -- only NEW content is added below them.
   - All Students lists every real/activated student in the selected class
     hour, "Not yet" for anyone with no SCORED fluency read yet.
   - Only reads with scored===true AND real wordsRead/errors count (Day 1
     cold reads auto-score; anything else needs the teacher's explicit
     "Score this read").
   - Columns sort on tap; a name tap expands that student's full scored
     history, oldest to newest.
   - A class-hour row (including "All classes") switches which students
     show, independent of the pre-existing Teams/Top-readers picker. */
function makeDom(){
  return new JSDOM(html,{url:"https://miqdaniels.github.io/READING-DANIELS/?teacher",runScripts:"dangerously",pretendToBeVisual:true,
    beforeParse(w){ w.HTMLElement.prototype.scrollIntoView=function(){}; w.scrollTo=function(){}; }
  });
}
function activeId(d){ var s=d.getElementsByClassName("screen"); for(var i=0;i<s.length;i++) if(/active/.test(s[i].className)) return s[i].id; return null; }
function click(w,el){ el.dispatchEvent(new w.Event("click",{bubbles:true})); }
function realCount(w,cls){ return cls.students.filter(function(s){ return !w.isPlaceholder(s) || s.activated; }).length; }

setTimeout(function(){
  let pass=0,fail=0;
  function ck(c,m){ if(c){pass++;} else {fail++; console.log("FAIL:",m);} }

  var dom=makeDom();
  var w=dom.window, d=w.document;

  w.go("s-board");
  ck(activeId(d)==="s-board","Scoreboard opens");

  /* ---- 1) Top 5 / Teams section is completely untouched ---- */
  ck(/Teams|No teams set/.test(d.getElementById("board-body").innerHTML),"Teams section still renders");
  ck(/Top readers/.test(d.getElementById("board-body").innerHTML),"Top readers heading is still there, unchanged");
  var boardClassBtns=d.querySelectorAll("#board-class button");
  ck(boardClassBtns.length===w.CLASSES.length,"the ORIGINAL class picker (Teams/Top readers) still has exactly one button per class, no 'All classes' added to it");

  /* ---- 2) All Students: every real/activated student listed, "Not yet"
     for anyone with no scored read ---- */
  var stu0=w.CLASSES[0]; // First hour
  var expectCount=realCount(w,stu0);
  var rows=d.querySelectorAll("#allstu-body tr");
  ck(rows.length===expectCount,"lists every real/activated student in First hour (got "+rows.length+", expected "+expectCount+")");
  var i, sawNotYet=false;
  for(i=0;i<rows.length;i++){ if(/Not yet/.test(rows[i].textContent)){ sawNotYet=true; } }
  ck(sawNotYet,"students with no scored read show 'Not yet'");
  ck(!/spare_/.test(d.getElementById("allstu-body").innerHTML),"un-activated placeholder slots are not listed by their spare_ id/name");

  /* ---- 3) only Score-marked reads with real numbers count ---- */
  var stu=stu0.students[0]; // Miriam G.
  w.FluAttempts.add({id:"unscored1", studentId:stu.id, studentName:stu.name, level:"PK", sub:0, passageId:"PK_0", title:"x", date:"2026-09-05", day:2, scored:false, wordsRead:50, errors:2, retellWords:null, decision:null, retellSaved:false});
  w.FluAttempts.add({id:"noNumbersYet", studentId:stu.id, studentName:stu.name, level:"PK", sub:0, passageId:"PK_0", title:"x", date:"2026-09-06", day:1, scored:true, wordsRead:null, errors:null, retellWords:null, decision:null, retellSaved:false});
  w.allStuPaintTable();
  var row=null, rr=d.querySelectorAll("#allstu-body tr");
  for(i=0;i<rr.length;i++){ if(rr[i].textContent.indexOf(stu.name)===0){ row=rr[i]; } }
  ck(!!row && /Not yet/.test(row.textContent),"an unscored read and a Score-marked-but-not-yet-graded read do NOT count as a score yet");

  w.FluAttempts.add({id:"first", studentId:stu.id, studentName:stu.name, level:"PK", sub:0, passageId:"PK_0", title:"x", date:"2026-09-01", day:1, scored:true, wordsRead:60, errors:5, retellWords:null, decision:null, retellSaved:false});
  w.FluAttempts.add({id:"latest", studentId:stu.id, studentName:stu.name, level:"PK", sub:1, passageId:"PK_1", title:"x", date:"2026-09-20", day:1, scored:true, wordsRead:70, errors:2, retellWords:null, decision:null, retellSaved:false});
  w.allStuPaintTable();
  rr=d.querySelectorAll("#allstu-body tr"); row=null;
  for(i=0;i<rr.length;i++){ if(rr[i].textContent.indexOf(stu.name)===0){ row=rr[i]; } }
  ck(!!row,"Miriam G.'s row is found after adding two real scored reads");
  var cells=row.querySelectorAll("td");
  ck(cells[1].textContent==="PK 0.1","Passage level column shows the LATEST scored read's level (PK 0.1)");
  ck(cells[2].textContent==="68","WCPM column shows the latest scored read's words-correct-per-minute (70-2=68)");
  ck(cells[3].textContent==="97.1%","Accuracy column shows the latest scored read's accuracy");
  ck(cells[4].textContent==="2026-09-20","Date column shows the latest scored read's date");
  ck(cells[5].textContent==="+13","Growth shows the change from the first scored read (68-55=+13)");

  /* ---- 4) sorting -- start from a column OTHER than name/asc so the
     first tap below is genuinely "a fresh tap on Student", not an
     immediate reversal of whatever the default already was ---- */
  w.ALLSTU_SORT={col:"date",dir:"desc"}; w.allStuPaintTable();
  w.allStuSort("name");
  ck(w.ALLSTU_SORT.col==="name" && w.ALLSTU_SORT.dir==="asc","a fresh tap on the Student header sorts A-Z");
  var names=[]; rr=d.querySelectorAll("#allstu-body tr"); for(i=0;i<rr.length;i++){ names.push(rr[i].querySelectorAll("td")[0].textContent.replace(/[▲▼▴▾]/g,"").replace(/\s+$/,"")); }
  var sortedNames=names.slice().sort();
  ck(names.join("|")===sortedNames.join("|"),"...and the rows are actually in A-Z order");
  w.allStuSort("name");
  ck(w.ALLSTU_SORT.dir==="desc","tapping the same header again reverses the sort");

  w.allStuSort("wcpm");
  ck(w.ALLSTU_SORT.col==="wcpm" && w.ALLSTU_SORT.dir==="desc","a fresh tap on WCPM sorts highest to lowest by default");
  rr=d.querySelectorAll("#allstu-body tr");
  ck(rr[0].textContent.indexOf(stu.name)===0,"the student with the highest WCPM (68) sorts to the top");

  /* ---- 5) tap a name -> see all scored reads, oldest to newest ---- */
  ck(!w.ALLSTU_EXPANDED[stu.id],"not expanded yet");
  var nameCell=null; rr=d.querySelectorAll("#allstu-body tr"); for(i=0;i<rr.length;i++){ if(rr[i].textContent.indexOf(stu.name)===0){ nameCell=rr[i].querySelector(".allstu-name"); } }
  click(w,nameCell);
  ck(w.ALLSTU_EXPANDED[stu.id]===true,"tapping the name expands that student");
  var detailRow=d.querySelector(".allstu-detail-row");
  ck(!!detailRow,"a detail row appears");
  var lines=detailRow.querySelectorAll(".allstu-detail-line");
  ck(lines.length===2,"shows both of Miriam's real scored reads (got "+lines.length+")");
  ck(lines[0].textContent.indexOf("2026-09-01")===0,"oldest scored read listed first");
  ck(lines[1].textContent.indexOf("2026-09-20")===0,"newest scored read listed last");
  click(w,nameCell);
  ck(w.ALLSTU_EXPANDED[stu.id]===false,"tapping the name again collapses it");

  /* ---- 6) class-hour row, including All classes, switches students
     shown -- independent of the Teams/Top-readers picker ---- */
  var allStuClassBtns=d.querySelectorAll("#allstu-class button");
  ck(allStuClassBtns.length===w.CLASSES.length+1,"class-hour row has one button per class plus All classes (got "+allStuClassBtns.length+")");
  ck(/All classes/.test(allStuClassBtns[allStuClassBtns.length-1].textContent),"the last button is All classes");

  click(w,allStuClassBtns[1]); // Third hour
  ck(w.ALLSTU_CLS===1,"switching to Third hour updates state");
  var expectCount3=realCount(w,w.CLASSES[1]);
  ck(d.querySelectorAll("#allstu-body tr").length===expectCount3,"Third hour shows its own roster (got "+d.querySelectorAll("#allstu-body tr").length+", expected "+expectCount3+")");
  ck(d.querySelectorAll("#board-class button")[0].className.indexOf("on")>-1 || w.BOARDCLS===0,"the ORIGINAL Teams/Top-readers picker is untouched by switching the All Students class (still on First hour)");

  click(w,allStuClassBtns[allStuClassBtns.length-1]); // All classes
  ck(w.ALLSTU_CLS===-1,"All classes sets the sentinel state");
  var expectAll=0, ci; for(ci=0;ci<w.CLASSES.length;ci++){ expectAll+=realCount(w,w.CLASSES[ci]); }
  ck(d.querySelectorAll("#allstu-body tr").length===expectAll,"All classes lists every real/activated student across every class hour (got "+d.querySelectorAll("#allstu-body tr").length+", expected "+expectAll+")");

  /* ---- 7) professional look: matches the shared theme-aware styling.
     jsdom drops the WHOLE border shorthand from computed style once any
     part of it (here, var(--line)) can't resolve across elements the way
     it would in a real browser (the same gap noted at the top of this
     file), so the 1px border is checked in the stylesheet source
     instead, alongside the vars it reuses so it stays theme/dark-mode
     aware for free, exactly like every other teacher-side panel. ---- */
  ck(/\.allstu-table-wrap\{[^}]*border:1px solid var\(--line\)/.test(html),"the table has a thin (1px) border, in the shared theme-aware line color");
  ck(/\.allstu-table-wrap\{[^}]*background:var\(--panel\)/.test(html),"the table panel uses the shared theme-aware background (works with every theme and dark mode)");
  ck(/\.allstu-table td\{[^}]*color:var\(--ink\)/.test(html),"table text uses the shared theme-aware ink color");
  var wrap=d.getElementById("allstu-table-wrap");
  var cs=w.getComputedStyle(wrap);
  ck(cs.overflowY==="auto" || cs.overflow==="auto","only the table itself scrolls when a class is long (overflow-y auto), not the whole page");
  ck(cs.maxHeight!=="none" && cs.maxHeight!=="","a max-height caps the table so it can actually need to scroll instead of pushing the page down (got '"+cs.maxHeight+"')");

  console.log("\n=== "+pass+" passed, "+fail+" failed ===");
  process.exit(fail?1:0);
},400);
