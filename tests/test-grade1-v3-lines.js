// Level 1 (Grade 1) fluency passages = the locked v3 PDF: order, text, fixed lines, running counts, fonts, teal.
// Ground truth: tests/fixtures/grade1-v3-from-pdf.json, read directly from
// TALL_Grade-1-Fluency-Passages_2026-11-11_v3.pdf (text, bold words, printed running numbers, paragraph starts).
var fs=require('fs'), JSDOM=require('jsdom').JSDOM;
var src=fs.readFileSync('./index.html','utf8');
var html=src.replace('<script src="clips.js" defer></script>','');
var FX=JSON.parse(fs.readFileSync('./tests/fixtures/grade1-v3-from-pdf.json','utf8'));
var TOTALS=[204,225,199,207,225,217,200,204,207,231,226];
var pass=0, fail=0; function ok(c,m){ if(c){ pass++; } else { fail++; console.log("FAIL: "+m); } }
var w=new JSDOM(html,{url:"https://miqdaniels.github.io/READING-DANIELS/",runScripts:"dangerously",pretendToBeVisual:true,beforeParse:function(win){ win.scrollTo=function(){}; win.HTMLElement.prototype.scrollIntoView=function(){}; }}).window;
var doc=w.document;
ok(!doc.querySelector('link[href*="Atkinson"]'),"Atkinson/Montserrat not requested at app start");
var ps=w.passagesForLevel("FIRST"), i, j;
ok(ps.length===11,"11 passages");
for(i=0;i<11;i++){
  var p=ps[i], f=FX[i], tag="1."+i+" "+f.title+": ";
  ok(p.sub===i && p.title===f.title && p.label==="1."+i,tag+"order/title/label match v3");
  ok(p.lines && p.lines.length===f.lines.length,tag+"same number of printed lines ("+f.lines.length+")");
  var cum=0, textOk=true, numOk=true, boldOk=true, paraOk=true, plainAll=[];
  for(j=0;j<f.lines.length;j++){
    var r=p.lines[j], fl=f.lines[j];
    var toks=r.markup.split(" "), plain=r.markup.replace(/\*\*/g,"");
    if(plain!==fl.text) textOk=false;
    plainAll.push(plain);
    if(r.n!==fl.n) numOk=false;                    // number must equal the number PRINTED in the PDF
    cum+=plain.split(" ").length; if(cum!==fl.n) numOk=false;   // ...and the plain word count
    if(!!r.first!==!!fl.para) paraOk=false;
    for(var k=0;k<toks.length;k++){ if((toks[k].indexOf("**")>-1?1:0)!==fl.bold[k]) boldOk=false; }
  }
  ok(textOk,tag+"every line's words identical to the PDF");
  ok(numOk,tag+"every running number equals the PDF's printed number");
  ok(boldOk,tag+"bold (First 100) words identical to the PDF");
  ok(paraOk,tag+"paragraph starts identical to the PDF");
  ok(p.lines[p.lines.length-1].n===TOTALS[i] && p.totalWords===TOTALS[i],tag+"last number = total word count = "+TOTALS[i]);
  ok(p.paragraphs.join(" ")===plainAll.join(" "),tag+"stored text = the lines joined");
  /* real screen */
  w.fluPassage=p; w.go("fluencyPassage");
  var rows=doc.querySelectorAll("#flu-text .gl");
  ok(rows.length===f.lines.length,tag+"screen shows one row per printed line");
  var sOk=true, sCum=0, lastN=-1;
  for(j=0;j<rows.length;j++){
    var gt=rows[j].querySelector(".gt").textContent, gn=rows[j].querySelector(".gn").textContent;
    sCum+=gt.split(" ").length;
    if(gt!==f.lines[j].text || gn!==String(f.lines[j].n) || String(sCum)!==gn) sOk=false;
    lastN=parseInt(gn,10);
  }
  ok(sOk,tag+"screen: each line's text and its right-hand number match the PDF");
  ok(lastN===TOTALS[i],tag+"screen: last number "+lastN+" = "+TOTALS[i]);
  ok(doc.getElementById("flu-text").querySelectorAll("p").length===0,tag+"no re-flowing <p> blocks");
  ok(doc.getElementById("flu-text").className==="flu-passage lines" && doc.getElementById("flu-title").className==="scr-title l1",tag+"Level 1 classes on text and title");
  ok(doc.getElementById("flu-text").innerHTML.indexOf("*")===-1,tag+"no asterisks");
}

/* ---- 1.8 REPLACED (approved 2026-11-15): "Your Brain Can Change", 207 words ---- */
var NEW18=["Some people say that if you did not learn to read when you were little, it is too late. But that is not true. Your brain can change at any age.",
"Your brain has a lot of paths in it. When you learn something new, your brain makes a new path. When you practice, the path gets stronger. The more you do it, the easier it gets. That is why it can be hard the first time you do it. Then one day, you do it, and it is no work at all.",
"The teen brain is good at this. It is ready to learn new things, and it will get better and better until you are in your 20s.",
"Scientists did a study with a group of women in India. They were about 30 years old, and a lot of them could not read one word. For six months, they worked on their reading. At the end, they could read like a first grader. Then the scientists looked at their brains. Their brains had changed!",
"So it is not too late for you. Your brain is ready when you are. What do you want to get good at? How many days will you work at it?"];
var p8=ps[8];
ok(p8.title==="Your Brain Can Change" && p8.label==="1.8" && p8.sub===8,"1.8 is Your Brain Can Change");
ok(p8.paragraphs.length===5 && p8.paragraphs.join(" | ")===NEW18.join(" | "),"1.8 text is exactly the approved 5 paragraphs, not one word different");
ok(p8.totalWords===207 && p8.lines[p8.lines.length-1].n===207,"1.8 last number = 207");
var phr=require('../recordings-list.js').filter(function(q){ return q.level===1; }), vocab={};
phr.forEach(function(q){ q.text.split(" ").forEach(function(t){ vocab[t.toLowerCase().replace(/[^a-z0-9']/g,"")]=1; }); });
var boldOk=true, nBold=0;
p8.lines.forEach(function(r){ r.markup.split(" ").forEach(function(t){ var isB=t.indexOf("**")>-1, inV=!!vocab[t.replace(/\*\*/g,"").toLowerCase().replace(/[^a-z0-9']/g,"")]; if(isB!==inV) boldOk=false; if(isB) nBold++; }); });
ok(boldOk && nBold>100,"1.8 bold = exactly the words in The First 100 Daily Phrases, same rule as the other passages ("+nBold+" bold)");
ok(src.indexOf("Who Chooses")===-1,"old 1.8 'Who Chooses?' is gone from the app");
ok(fs.readFileSync('./tall-list.js','utf8').indexOf("Who Chooses")===-1,"old 1.8 is gone from the recording studio list");
ok(p8.lines.map(function(r){ return r.markup.replace(/\*\*/g,"").split(" ").length; }).join(",")==="14,16,1,14,12,16,18,2,16,11,13,16,14,12,1,16,15","1.8 fixed line lengths (words per line)");

/* ---- Passage Words box (student view, like the PDF) ---- */
var PW={0:"brain \u00B7 heart \u00B7 sweat \u00B7 summer \u00B7 Arizona",1:"body \u00B7 doctors \u00B7 early \u00B7 junior high",2:"Mexico \u00B7 Japan \u00B7 uniform \u00B7 sweep \u00B7 teacher",3:"pictures \u00B7 screens \u00B7 law \u00B7 rules \u00B7 problem",4:"money \u00B7 rules \u00B7 dangerous \u00B7 neighbors \u00B7 babysit",5:"boyfriend \u00B7 girlfriend \u00B7 dating \u00B7 grades \u00B7 different",6:"homework \u00B7 teachers \u00B7 junior high",7:"morning \u00B7 afternoon \u00B7 shorter \u00B7 teachers \u00B7 Arizona",8:"brain \u00B7 practice \u00B7 scientists \u00B7 India \u00B7 stronger",9:"study \u00B7 choices \u00B7 trouble \u00B7 something \u00B7 themselves",10:"serious \u00B7 direction \u00B7 behind \u00B7 finish \u00B7 learning"};
for(i=0;i<11;i++){
  w.fluPassage=ps[i]; w.go("fluencyPassage");
  var box=doc.getElementById("flu-pwords");
  ok(box.style.display==="block" && box.textContent==="Passage Words:"+PW[i],"1."+i+" Passage Words box: "+PW[i]);
  ok(box.nextElementSibling===doc.getElementById("flu-text-wrap"),"1."+i+" box sits directly above the passage");
  ok(box.querySelector("b").textContent==="Passage Words:","1."+i+" box starts with the label Passage Words:");
}
ok(/\.flu-pwords\{[^}]*border:1px solid #0F766E/.test(src),"Passage Words box: thin teal outline");
w.fluPassage=w.findPassage("PK",0); w.go("fluencyPassage");
ok(doc.getElementById("flu-pwords").style.display==="none" && doc.getElementById("flu-pwords").textContent==="","PK passages show no Passage Words box");
/* ---- 1.4 Jobs: cannot x3, 225 words ---- */
var jobs=ps[4], jt=jobs.paragraphs.join(" ");
ok((jt.match(/\bcannot\b/g)||[]).length===3 && !/can not/.test(jt),"1.4 says cannot exactly 3 times, never 'can not'");
ok(jobs.totalWords===225 && jobs.lines[jobs.lines.length-1].n===225,"1.4 ends at 225");
/* ---- 1.8: age. stays alone on its own line (matches the PDF's style) ---- */
ok(ps[8].lines[2].markup==="age." && ps[8].lines[2].n===31,"1.8: 'age.' on its own line, count 31");
/* CSS + fonts + color */
ok(/\.flu-passage\.lines \.gl\{[^}]*white-space:nowrap/.test(src),"lines never wrap (nowrap)");
ok(/\.flu-passage\.lines \.gn\{[^}]*border-left:1px solid #0F766E;color:#0F766E/.test(src),"counts: small teal #0F766E with a thin teal line");
ok(/\.flu-passage\.lines\{[^}]*font-family:"Atkinson Hyperlegible Next"[^}]*sans-serif|\.flu-passage\.lines\{[^}]*font-family:"Atkinson Hyperlegible Next"[^}]*Arial/.test(src),"passage text: Atkinson Hyperlegible Next + fallback");
ok(/\.flu-passage\.lines strong\{font-weight:800\}/.test(src),"bold First 100 words");
ok(/#flu-title\.l1\{font-family:"Montserrat"[^}]*font-weight:800/.test(src),"title: Montserrat 800");
var lk=doc.querySelector('link[href*="Atkinson"]');
ok(!!lk && /Atkinson\+Hyperlegible\+Next:wght@400;700;800/.test(lk.href) && /Montserrat:wght@800/.test(lk.href),"opening a Level 1 passage loads both Google fonts (once)");
w.fluPassage=ps[3]; w.go("fluencyPassage");
ok(doc.querySelectorAll('link[href*="Atkinson"]').length===1,"fonts requested only once");
/* PK passages keep the old paragraph layout */
w.fluPassage=w.findPassage("PK",0); w.go("fluencyPassage");
ok(doc.querySelectorAll("#flu-text .gl").length===0 && doc.querySelectorAll("#flu-text p").length>0 && doc.getElementById("flu-text").className==="flu-passage","PK passages unchanged (paragraphs, no counts)");
ok(doc.getElementById("flu-title").className==="scr-title","PK title keeps its normal class");
/* teacher review still sees whole-number counts from the same text */
ok(ps[10].sentenceCounts[ps[10].sentenceCounts.length-1].cum===226,"1.10 sentence table also ends at 226 (closing quote not a word)");
/* ES5 + file ending */
ok(/<\/script>\s*<\/body>\s*<\/html>\s*$/.test(src),"index.html ends with </script></body></html>");
var script=src.slice(src.indexOf("<script>")).replace(/"(?:[^"\\\n]|\\.)*"/g,'""');
ok(!/\bconst\s|\blet\s+[a-zA-Z_$]+\s*[=;]/.test(script),"no const/let");
console.log("test-grade1-v3-lines: "+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
