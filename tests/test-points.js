const fs=require('fs'); const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8');
const dom=new JSDOM(html,{url:"https://miqdaniels.github.io/READING-DANIELS/",runScripts:"dangerously",pretendToBeVisual:true,
  beforeParse(w){ w.HTMLElement.prototype.scrollIntoView=function(){}; w.scrollTo=function(){}; }});
const w=dom.window,d=dom.window.document;
setTimeout(function(){
  let pass=0,fail=0; function ck(c,m){ if(c)pass++; else {fail++;console.log("FAIL:",m);} }
  try{ w.localStorage.removeItem("points_data"); }catch(e){}
  var cls=w.CLASSES[0]; var A=cls.students[0], B=cls.students[1];
  w.CURCLASS=cls;

  // Student A hears a word
  w.READER=A;
  var t0=w.todayTotals(A.id).total;
  var g1=w.award("word","imperative","");
  ck(g1>0,"hearing a word earns points ("+g1+")");
  ck(w.todayTotals(A.id).total===t0+g1,"total went up by award");
  // spam the SAME word -> earns nothing
  var g2=w.award("word","imperative","");
  ck(g2===0,"same word again earns 0 (anti-spam)");
  // sentence pays more than word
  var s1=w.award("sentence","imperative","");
  ck(s1>g1,"sentence pays more than word ("+s1+" vs "+g1+")");
  var s2=w.award("sentence","imperative","");
  ck(s2===0,"same sentence again earns 0");
  // final jackpot
  var f1=w.award("final","Personal Narrative 1","");
  ck(f1>=10,"final read jackpot ("+f1+")");
  // different word still pays
  var g3=w.award("word","horrendous","");
  ck(g3>0,"a new word still pays");

  // badge reflects total
  w.go("s-read"); w.refreshPtsBadge();
  var badge=d.getElementById("pts-badge");
  ck(badge && /\d/.test(badge.textContent),"star badge shows a number: "+(badge?JSON.stringify(badge.textContent):"none"));

  // earnings screen renders
  w.go("s-score");
  var sb=d.getElementById("score-body");
  ck(sb && /points/.test(sb.innerHTML),"earnings screen renders total");
  ck(/School/.test(sb.innerHTML)&&/Home/.test(sb.innerHTML),"earnings shows School/Home split");

  // teams + leaderboard
  w.Settings.setTeam(A.id,"Red"); w.Settings.setTeam(B.id,"Blue");
  w.READER=B; w.award("word","vast",""); w.award("sentence","vast","");
  w.go("s-board");
  var bb=d.getElementById("board-body");
  ck(bb && /Team/.test(bb.innerHTML),"leaderboard shows teams");
  var teams=w.teamStandings(cls);
  ck(teams.length>=2 && teams[0].pts>=teams[teams.length-1].pts,"teams ranked high-to-low");
  var tops=w.topStudents(cls,5);
  ck(tops.length>=2,"top students list built ("+tops.length+")");

  console.log("\n=== "+pass+" passed, "+fail+" failed ===");
  process.exit(fail?1:0);
},400);
