const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8').replace('<script src="clips.js" defer></script>','<script>'+fs.readFileSync('./clips.js','utf8')+'</script>');
let pass=0, fail=0;
function ok(c,m){ if(c){pass++;} else {fail++; console.log("FAIL: "+m);} }
const w=new JSDOM(html,{url:"https://miqdaniels.github.io/READING-DANIELS/?teacher",runScripts:"dangerously",pretendToBeVisual:true,beforeParse(w){ w.HTMLElement.prototype.scrollIntoView=function(){}; w.scrollTo=function(){}; }}).window;
const d=w.document;

/* ONE mic: every Record button uses the red-circle mic, no emoji mic left */
ok(html.indexOf("&#127908;")===-1,"no old emoji mic anywhere");
var recs=d.querySelectorAll(".icon-btn-record, .flu-sq-record"), i, bad=0;
for(i=0;i<recs.length;i++){ if(!recs[i].querySelector(".mic-ico")){ bad++; } }
ok(recs.length>=6 && bad===0,"every Record/Done button has the red mic ("+bad+" missing of "+recs.length+")");
var mic=w.getComputedStyle(d.querySelector("#flu-rec .mic-ico"));
ok(mic.backgroundColor==="rgb(229, 57, 53)","mic circle is red");
ok(/\.mic-ico\{[^}]*background-image:url\("data:image\/svg\+xml/.test(html),"mic circle has the white mic drawing");
ok(w.getComputedStyle(d.getElementById("c1-start")).backgroundColor!=="rgb(180, 83, 9)","Check 1 Record is not brown");
/* pulses while recording */
var css=Array.prototype.map.call(d.querySelectorAll("style"),function(s){return s.textContent;}).join("\n");
ok(/\.icon-btn-record\.rec \.mic-ico[^{]*\{animation:micPulse/.test(css),"Record mic pulses while recording");
ok(/\.rec-status \.rec-status-dot\{animation:micPulse/.test(css),"Recording status mic pulses (Check 2/3 video)");
ok(/\.rec-btn\.rec \.rec-dot\{animation:micPulse/.test(css),"teacher record mic pulses");

/* ONE listen icon: green ear on every Listen button */
ok(html.indexOf("&#128266;")===-1,"no old speaker emoji anywhere");
var ls=d.querySelectorAll(".dir-listen-btn"); bad=0;
for(i=0;i<ls.length;i++){ if(!ls[i].querySelector(".ear-ico")){ bad++; } }
ok(ls.length===18 && bad===0,"all 18 Listen buttons have the green ear");
var ear=w.getComputedStyle(d.querySelector(".dir-listen-btn .ear-ico"));
ok(ear.backgroundColor==="rgb(46, 158, 79)","ear circle is green");
ok(/\.dir-listen-btn\.playing \.dir-listen-icon\.ear-ico\{animation:earPulse/.test(css),"ear pulses while directions play");

/* Listen sits beside its directions */
var wraps=d.querySelectorAll(".dir-listen-wrap"); bad=0;
for(i=0;i<wraps.length;i++){ var r=wraps[i].parentNode; if(r.className!=="dir-row"){ bad++; } else if(!r.lastElementChild || r.lastElementChild.className.indexOf("dir-listen-wrap")>-1){ bad++; } }
ok(bad===0,"every Listen button is in a row with its directions ("+bad+" off)");
var c1row=d.getElementById("dl-dir_check1").parentNode;
ok(c1row.lastElementChild.id==="c1-intro","Check 1: Listen is right beside 'Say each letter's name...'");
ok(c1row.firstElementChild.id==="dl-dir_check1","Check 1: Listen on the left of the words");

/* Student View bar: theme color, not brown */
ok(/\.vas-banner\{background:var\(--accent-press\);background:color-mix\(in srgb,var\(--accent\) 62%,#000\)/.test(css),"banner = darker shade of the chosen theme");
ok(/html\[data-mode="dark"\] \.vas-banner\{background:var\(--accent\);background:color-mix\(in srgb,var\(--accent\) 55%,#fff\)/.test(css),"dark mode banner = lighter shade");
w.eval('Settings.setPalette ? Settings.setPalette("aqua") : 0; applyTheme();');
w.eval('enterViewAsStudent()');
var bg=w.getComputedStyle(d.getElementById("vas-banner")).backgroundColor;
ok(bg!=="rgb(180, 83, 9)","banner is no longer brown (got "+bg+")");
ok(w.getComputedStyle(d.getElementById("vas-banner")).display==="flex","banner still shows in Student View");

console.log("\n=== "+pass+" passed, "+fail+" failed ===");
process.exit(fail?1:0);
