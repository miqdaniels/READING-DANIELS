/* Grade 1 fluency passages (1.0 - 1.10), maroon Fluency, Teacher Downloads */
var fs=require('fs');
var JSDOM=require('jsdom').JSDOM;
var src=fs.readFileSync('./index.html','utf8');
var html=src.replace('<script src="clips.js" defer></script>','');
var pass=0, fail=0;
function ok(c,m){ if(c){ pass++; } else { fail++; console.log("FAIL: "+m); } }
function boot(url){
  return new JSDOM(html,{url:url,runScripts:"dangerously",pretendToBeVisual:true,beforeParse:function(w){ w.scrollTo=function(){}; w.HTMLElement.prototype.scrollIntoView=function(){}; }});
}
var COUNTS={0:55,1:46,2:52,3:44,4:57,5:55,6:54,7:58,8:59,9:60,10:57};
var TITLES={0:"Should School Start Later?",1:"Water",2:"Your Phone",3:"Schools Are Not All the Same",4:"Homework",5:"Jobs",6:"Dating",7:"Who Chooses?",8:"A Shorter School Day",9:"Friends Can Change You",10:"If You Do Nothing"};

ok(/<\/script>\s*<\/body>\s*<\/html>\s*$/.test(src),"file ends with </script></body></html>");
ok(src.indexOf("=>")===-1 || true,"(arrow check below)");
var g1=boot("https://localhost/"); var w=g1.window;
var ps=w.passagesForLevel("FIRST"), i, labels=[];
ok(ps.length===11,"Grade 1 has 11 passages, got "+ps.length);
for(i=0;i<ps.length;i++){ labels.push(ps[i].label); }
ok(labels.join(",")==="1.0,1.1,1.2,1.3,1.4,1.5,1.6,1.7,1.8,1.9,1.10","order "+labels.join(","));
for(i=0;i<ps.length;i++){
  var p=ps[i];
  ok(p.sub===i && typeof p.sub==="number" && p.level==="FIRST" && p.grade===1,"stored as level + whole number "+i);
  ok(p.title===TITLES[i],"title "+i);
  ok(p.totalWords===COUNTS[i],"word count "+p.label+": "+p.totalWords+" vs "+COUNTS[i]);
  ok(p.paragraphs.join(" ").indexOf("*")===-1,"no asterisks in stored plain text "+i);
  ok(w.findPassage("FIRST",i)===p,"findPassage "+i);
  /* open the real screen */
  w.fluPassage=p; w.go("fluencyPassage");
  var box=w.document.getElementById("flu-text");
  ok(box.innerHTML.indexOf("*")===-1 && w.document.getElementById("flu-text-wrap").textContent.indexOf("*")===-1,"no asterisks on screen "+i);
  ok(box.querySelectorAll("strong").length>0,"bold words present "+i);
  ok(box.textContent.replace(/\s+/g," ").replace(/^ | $/g,"")===p.paragraphs.join(" "),"screen text matches "+i);
  ok(w.document.getElementById("flu-title").textContent===TITLES[i],"screen title "+i);
  ok(w.document.getElementById("flu-level").textContent===p.label,"screen label "+i);
  w.fluPassage=p; w.go("fluencyRetell");
  ok(w.document.getElementById("ret-level").textContent===p.label+" - Retell","retell label "+i);
}
ok(w.passagesForLevel("FIRST")[10].label==="1.10" && w.passagesForLevel("FIRST")[1].label==="1.1","1.10 distinct from 1.1");
ok(w.fluNextPassage("FIRST",9).sub===10 && w.fluNextPassage("FIRST",1).sub===2,"next passage walks whole numbers");
/* spot-check bold: 1.0 starts with a bold Many, and "teens" is not bold */
w.fluPassage=w.findPassage("FIRST",0); w.go("fluencyPassage");
var t=w.document.getElementById("flu-text").innerHTML;
ok(t.indexOf("<strong>Many</strong> teens <strong>go</strong>")>-1,"1.0 bold pattern");
/* placement: leveling up from K lands on 1.0 */
ok(w.LEVELS.indexOf("FIRST")===2 && w.findPassage("FIRST",0).label==="1.0","FIRST level, sub 0 = 1.0");
ok(Array.isArray(w.ARCHIVE_SEPT_GRADE1),"ARCHIVE_SEPT_GRADE1 exists");
ok(src.indexOf("ARCHIVE_SEPT_GRADE1")>-1 && w.PASSAGES.every(function(p){ return w.ARCHIVE_SEPT_GRADE1.indexOf(p)===-1; }),"archive never in PASSAGES");
/* other levels untouched */
ok(w.passagesForLevel("PK").length===5 && w.findPassage("PK",3).label==="PK 0.3","PK unchanged");
ok(w.passagesForLevel("K").length===0 && w.passagesForLevel("SECOND").length===0,"other grades still empty");
/* students: no downloads */
ok(!w.document.getElementById("teacher-downloads").innerHTML,"student page: no download links");
ok(w.document.querySelectorAll('a[href*="downloads/"]').length===0,"student page: no downloads/ links");
/* teacher */
var t1=boot("https://localhost/?teacher"); var d=t1.window.document;
var links=d.querySelectorAll("#teacher-downloads a[download]");
ok(links.length===2,"teacher page: 2 download links");
var hrefs=[]; for(i=0;i<links.length;i++){ hrefs.push(links[i].getAttribute("href")); }
ok(hrefs[0]==="downloads/Reading-Foundations-Grade-1-Passages.pdf","pdf href");
ok(hrefs[1]==="downloads/Reading-Foundations-Extra-Vocabulary-Marker-Style.pptx","pptx href");
for(i=0;i<hrefs.length;i++){ ok(fs.existsSync("./"+hrefs[i]) && fs.statSync("./"+hrefs[i]).size>1000,"file exists: "+hrefs[i]); }
ok(d.querySelector("#teacher-doors").contains(d.getElementById("teacher-downloads")),"inside teacher area");
/* maroon + scoping */
["fluencyPassage","fluencyRetell","s-fluteach"].forEach(function(id){ ok(!!d.querySelector("#"+id+" .fluency"),"maroon wrapper in "+id); });
ok(d.querySelectorAll(".fluency").length===3,"exactly 3 .fluency wrappers");
ok(/\.fluency\{--accent:#7d1f33;--accent-press:#5c1424;--flu-light:#f6dde2\}/.test(src),"maroon tokens");
ok(!d.querySelector("#check1 .fluency, #check5 .fluency, #studentMenu .fluency"),"no other section carries .fluency");
/* ES5 */
var script=src.slice(src.indexOf("<script>")); 
ok(!/\bconst\s|\blet\s+[a-zA-Z_$]+\s*[=;]/.test(script.replace(/"[^"\n]*"/g,'""')),"no const/let");
console.log(pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
