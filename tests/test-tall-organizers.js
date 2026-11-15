// tall-organizers.html: data used as is, 5W+H drag/tap match (wrong drop slides back, gray boxes), Order It (shuffled, never in order, Check marks),
// 1-Minute Talk screen, "Not recorded yet" (no TTS). jsdom, real site URL.
var fs=require('fs'), JSDOM=require('jsdom').JSDOM;
var html=fs.readFileSync('./tall-organizers.html','utf8'), aud=fs.readFileSync('./tall-org-audio.js','utf8');
var raw=JSON.parse(fs.readFileSync('./data/tall-organizers.json','utf8'));
var BASE="https://miqdaniels.github.io/READING-DANIELS/";
var pass=0, fail=0; function ok(c,m){ if(c){ pass++; } else { fail++; console.log("FAIL: "+m); } }
ok(/<\/script><\/body><\/html>\s*$/.test(html),"page ends with </script></body></html>");
var code=html.slice(html.indexOf("<script>\n/* ====")).replace(/"(?:[^"\\\n]|\\.)*"/g,'""').replace(/'(?:[^'\\\n]|\\.)*'/g,"''");
ok(code.indexOf("=>")<0 && !/(^|[;{}\s(])(const|let)\s+[A-Za-z_$]/.test(code) && !/`/.test(code),"ES5 only");
ok(!/speechSynthesis|SpeechSynthesisUtterance/.test(html),"no text-to-speech");
ok(/0F766E|--tall-teal/.test(html) && /Montserrat/.test(html) && /Atkinson Hyperlegible Next/.test(html),"Level 1 teal + Montserrat + Atkinson");
ok(raw.passages.length===11 && raw.passages.every(function(p){ return p.boxes.length===6 && p.order.length===4; }),"data: 11 passages, 6 boxes, 4 order sentences");
function make(clips){
  var page=html.replace('<script src="tall-org-audio.js"></script>','<script>var TALL_ORG_AUDIO='+(clips||"{}")+';window.TALL_ORG_AUDIO=TALL_ORG_AUDIO;</script>');
  return new JSDOM(page,{url:BASE+"tall-organizers.html",runScripts:"dangerously",pretendToBeVisual:true,beforeParse:function(win){
    win.scrollTo=function(){}; win.OG_DATA_RAW=raw; win.__played=[];
    win.Audio=function(src){ var a={src:src,onerror:null,play:function(){ win.__played.push(src); return Promise.resolve(); },pause:function(){}}; return a; };
  }}).window;
}
function $(w,id){ return w.document.getElementById(id); }
function click(w,id){ $(w,id).dispatchEvent(new w.MouseEvent("click",{bubbles:true})); }
function active(w){ var s=w.document.querySelectorAll(".screen.active"); return s.length===1?s[0].id:"?"; }
var w=make();
ok(active(w)==="og-pick" && w.document.querySelectorAll("#og-passages .pcard").length===11,"picker lists the 11 passages");
/* passage 1.0: no Who -> gray box */
click(w,"og-p-0"); ok(active(w)==="og-match","opens 5W+H");
ok(/gray/.test($(w,"og-box-who").className) && /does not tell us who/.test($(w,"og-box-who").textContent),"1.0 Who is gray: This passage does not tell us who.");
ok(w.document.querySelectorAll("#og-cards .acard").length===5,"5 answer cards for 1.0");
/* tap a card (no clip yet) = Not recorded yet, no audio, no TTS */
click(w,"og-card-what"); ok(/Not recorded yet/.test($(w,"og-nr-what").textContent) && w.__played.length===0,"no clip: 'Not recorded yet' and nothing plays");
/* wrong box: card slides back */
click(w,"og-box-when"); ok(!/filled/.test($(w,"og-box-when").className) && !!$(w,"og-card-what") && /Try another/.test($(w,"og-match-note").textContent),"wrong box: card goes back, gentle message");
/* right box by tap */
click(w,"og-card-what"); click(w,"og-box-what"); ok(/filled/.test($(w,"og-box-what").className) && !$(w,"og-card-what") && /You need water to live/.test($(w,"og-box-what").textContent),"right box: card placed");
/* drag a card into the right box */
(function(){
  var c=$(w,"og-card-when"); w.document.elementFromPoint=function(){ return $(w,"og-box-when"); };
  w.ogDown({button:0,clientX:5,clientY:5,currentTarget:c},"card","When");
  w.document.dispatchEvent(new w.MouseEvent("pointermove",{clientX:60,clientY:60,bubbles:true}));
  w.document.dispatchEvent(new w.MouseEvent("pointerup",{clientX:60,clientY:60,bubbles:true}));
  ok(/filled/.test($(w,"og-box-when").className),"dragging the When card into its box places it");
  var c2=$(w,"og-card-where"); w.document.elementFromPoint=function(){ return $(w,"og-box-why"); };
  w.ogDown({button:0,clientX:5,clientY:5,currentTarget:c2},"card","Where");
  w.document.dispatchEvent(new w.MouseEvent("pointermove",{clientX:60,clientY:60,bubbles:true}));
  w.document.dispatchEvent(new w.MouseEvent("pointerup",{clientX:60,clientY:60,bubbles:true}));
  ok(!/filled/.test($(w,"og-box-why").className) && !!$(w,"og-card-where") && !w.document.querySelector(".ghost"),"a wrong drop slides the card back (no ghost left)");
})();
w.SUPPRESS=false; /* in a browser the timer clears this right after the drag */
ok($(w,"og-match-next").style.display==="none","Next hidden until every card is placed");
click(w,"og-card-where"); click(w,"og-box-where"); click(w,"og-card-why"); click(w,"og-box-why"); click(w,"og-card-how"); click(w,"og-box-how");
ok($(w,"og-match-next").style.display!=="none" && /All matched/.test($(w,"og-match-note").textContent),"all matched: Next shown");
click(w,"og-match-next"); ok(active(w)==="og-order" && /Put the steps in order/.test($(w,"og-order-dir").textContent),"Order It with the passage's own direction");
/* never already in order; many shuffles */
var distinct={}, k, inorder=0;
for(k=0;k<30;k++){ w.ogToOrder(); var o=w.O.order.join(""); distinct[o]=1; if(o==="0123"){ inorder++; } }
ok(inorder===0 && Object.keys(distinct).length>=8,"Order It is shuffled every time and never already in order ("+Object.keys(distinct).length+" orders)");
/* check marks, tap-swap until correct */
w.ogToOrder();
function slotText(i){ return $(w,"og-ocard-"+i).textContent; }
click(w,"og-order-check"); ok(w.document.querySelectorAll(".oslot.wrong").length>0 && w.document.querySelectorAll(".oslot.right").length+w.document.querySelectorAll(".oslot.wrong").length===4 && /spots are right/.test($(w,"og-order-note").textContent),"Check shows which spots are right");
var i, guard=0;
while(guard++<10){ for(i=0;i<4;i++){ if(w.O.order[i]!==i){ var j=w.O.order.indexOf(i); click(w,"og-slot-"+i); click(w,"og-slot-"+j); break; } } if(w.O.order.join("")==="0123"){ break; } }
ok(w.O.order.join("")==="0123","tapping a card then a spot swaps them");
click(w,"og-order-check"); ok(/That is the order/.test($(w,"og-order-note").textContent) && $(w,"og-order-next").style.display!=="none","correct order: Next appears");
/* drag in Order It */
w.ogToOrder(); (function(){ var a=0,b=1; var before=w.O.order.slice(); w.document.elementFromPoint=function(){ return $(w,"og-slot-1"); };
  w.ogDown({button:0,clientX:5,clientY:5,currentTarget:$(w,"og-ocard-0")},"ocard",0);
  w.document.dispatchEvent(new w.MouseEvent("pointermove",{clientX:60,clientY:60,bubbles:true}));
  w.document.dispatchEvent(new w.MouseEvent("pointerup",{clientX:60,clientY:60,bubbles:true}));
  ok(w.O.order[0]===before[1] && w.O.order[1]===before[0],"dragging a sentence onto another spot swaps them"); })();
/* done screen */
w.SUPPRESS=false; click(w,"og-order-check"); w.O.order=[0,1,2,3]; click(w,"og-order-check"); click(w,"og-order-next");
ok(active(w)==="og-done" && /1-Minute Talk/.test(w.document.querySelector("#og-done h2").textContent) && w.document.querySelectorAll("#og-talk .obox").length===6 && /You need water to live/.test($(w,"og-talk").textContent) && /does not tell us who/.test($(w,"og-talk").textContent),"1-Minute Talk screen shows the filled 5W+H, Who gray");
/* every passage opens; counts of gray boxes match null q; clip ids; a clip plays when it exists */
var wa=make('{"ORG_1_01_who":"audio/x.mp3","ORG_1_01_s1":"audio/y.mp3"}');
click(wa,"og-p-1"); ok(w.orgId({id:"1.10"},"how")==="ORG_1_10_how" && w.orgId({id:"1.0"},"s2")==="ORG_1_00_s2" && w.orgId({id:"1.1"},"who")==="ORG_1_01_who","clip ids ORG_<passage>_<who..how|s1..s4>");
click(wa,"og-card-who"); ok(wa.__played.length===1 && /x\.mp3/.test(wa.__played[0]),"a recorded answer plays on tap");
raw.passages.forEach(function(p,ix){ var w2=make(); w2.document.getElementById("og-p-"+ix).dispatchEvent(new w2.MouseEvent("click",{bubbles:true})); var nulls=p.boxes.filter(function(b){return !b.q}).length; ok(w2.document.querySelectorAll(".obox.gray").length===nulls && w2.document.querySelectorAll("#og-cards .acard").length===6-nulls,"passage "+p.id+": "+nulls+" gray box(es), "+(6-nulls)+" cards"); });
/* teacher tile */
var idx=fs.readFileSync('./index.html','utf8'); ok(/id="tile-tall-organizers"[^>]*tall-organizers\.html/.test(idx),"teacher dashboard has an Organizers tile");
console.log("test-tall-organizers: "+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
