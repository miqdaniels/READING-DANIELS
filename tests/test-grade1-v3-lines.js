// Level 1 (Grade 1) fluency passages = the locked v3 PDF: order, text, fixed lines, running counts, fonts, teal.
// Ground truth: tests/fixtures/grade1-v3-from-pdf.json, read directly from
// TALL_Grade-1-Fluency-Passages_2026-11-11_v3.pdf (text, bold words, printed running numbers, paragraph starts).
var fs=require('fs'), JSDOM=require('jsdom').JSDOM;
var src=fs.readFileSync('./index.html','utf8');
var html=src.replace('<script src="clips.js" defer></script>','');
var FX=JSON.parse(fs.readFileSync('./tests/fixtures/grade1-v3-from-pdf.json','utf8'));
var TOTALS=[204,225,199,207,228,217,200,204,198,231,226];
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
