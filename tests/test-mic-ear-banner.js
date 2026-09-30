const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8').replace('<script src="clips.js" defer></script>','<script>'+fs.readFileSync('./clips.js','utf8')+'</script>');
let pass=0, fail=0;
function ok(c,m){ if(c){pass++;} else {fail++; console.log("FAIL: "+m);} }
const w=new JSDOM(html,{url:"https://miqdaniels.github.io/READING-DANIELS/?teacher",runScripts:"dangerously",pretendToBeVisual:true,beforeParse(w){ w.HTMLElement.prototype.scrollIntoView=function(){}; w.scrollTo=function(){}; }}).window;
const d=w.document;

/* MUTED mic: every Record button uses the thin gray-outline mic, no emoji, no red anywhere (Mick, 2026-09-29 -- STYLE LOCK) */
ok(html.indexOf("&#127908;")===-1,"no old emoji mic anywhere");
var recs=d.querySelectorAll(".icon-btn-record, .flu-sq-record"), i, bad=0;
for(i=0;i<recs.length;i++){ if(!recs[i].querySelector(".mic-ico")){ bad++; } }
ok(recs.length>=6 && bad===0,"every Record/Done button has the Muted mic ("+bad+" missing of "+recs.length+")");
var mic=w.getComputedStyle(d.querySelector("#flu-rec .mic-ico"));
ok(mic.backgroundColor!=="rgb(229, 57, 53)","mic circle is no longer red (got "+mic.backgroundColor+")");
ok(/\.mic-ico\{[^}]*border:2px solid var\(--ink-soft\)[^}]*background-color:transparent/.test(html),"mic circle is a thin ink-soft outline with a transparent fill, not a solid color");
ok(/\.mic-ico::before\{[^}]*mask-image:url\("data:image\/svg\+xml/.test(html),"mic glyph is drawn via a mask so it follows var(--ink-soft), not a hardcoded color");
ok(w.getComputedStyle(d.getElementById("c1-start")).backgroundColor!=="rgb(180, 83, 9)","Check 1 Record is not brown");
/* gray at rest, soft red pulse while actually recording (Mick corrected
   this 2026-09-30: "when it's recording, I do like it to turn red...
   then it goes back to gray" -- the old bright #E53935 solid-fill red
   is still gone for good; the new #c0392b ring is a deliberate, approved
   return of red for the recording state specifically). */
var css=Array.prototype.map.call(d.querySelectorAll("style"),function(s){return s.textContent;}).join("\n");
ok(css.indexOf("earPulse")===-1,"the old green earPulse animation no longer exists anywhere in the stylesheet");
ok(/\.rec-btn \.rec-dot\{[^}]*border:1px solid var\(--ink-soft\)[^}]*background-color:transparent[^}]*animation:none\}/.test(css),"teacher record mic is a plain ink-soft outline at rest, never pulsing");
ok(css.indexOf(".rec-btn.rec .rec-dot{background-color:#E53935")===-1,"teacher record mic never uses the old solid bright-red fill");
ok(/\.rec-btn\.rec \.rec-dot\{border-color:#c0392b;animation:micRecPulse/.test(css),"teacher record mic turns the approved soft red #c0392b with a pulsing ring while actually recording");
ok(/\.icon-btn-record\.rec \.mic-ico,\.flu-sq-record\.rec \.mic-ico\{border-color:#c0392b;animation:micRecPulse/.test(css),"student Record buttons turn the same soft red while actually recording");
ok(/\.rec-status:not\(\.paused\) \.rec-status-dot\{border-color:#c0392b;animation:micRecPulse/.test(css),"the 'Recording' status-line dot turns the same soft red while actually recording");

/* MUTED listen icon: thin ink-soft outline on every Listen button, no green anywhere */
ok(html.indexOf("&#128266;")===-1,"no old speaker emoji anywhere");
var ls=d.querySelectorAll(".dir-listen-btn"); bad=0;
for(i=0;i<ls.length;i++){ if(!ls[i].querySelector(".ear-ico")){ bad++; } }
ok(ls.length===18 && bad===0,"all 18 Listen buttons have the Muted ear icon");
var ear=w.getComputedStyle(d.querySelector("#dl-dir_vocab .ear-ico"));
ok(ear.backgroundColor!=="rgb(46, 158, 79)","ear circle is no longer green (got "+ear.backgroundColor+")");
ok(/\.ear-ico\{[^}]*border:2px solid var\(--ink-soft\)[^}]*background-color:transparent/.test(html),"ear circle is a thin ink-soft outline with a transparent fill, not a solid color");
ok(/\.dir-listen-btn\.playing \.dir-listen-icon\.ear-ico::before\{background-color:var\(--accent\)\}/.test(css),"while playing, the glyph switches to the theme's own accent color (never green), with no color-pulse animation");

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
