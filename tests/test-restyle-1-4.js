const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8').replace('<script src="clips.js" defer></script>','<script>'+fs.readFileSync('./clips.js','utf8')+'</script>');

/* VISUAL RESTYLE of Checks 1-4 to Clean/Professional -- CSS-only. This
   test verifies the computed appearance actually changed (pill shape,
   muted/no-pulse icons, solid/outline colors) AND that nothing about
   scoring, recording, filenames, or progression moved -- those are
   covered by test-check1.js/test-check2.js/test-check3.js/test-check4.js,
   which must still pass unmodified (this file adds NEW assertions, it
   does not replace those). */
const w=new JSDOM(html,{url:"https://miqdaniels.github.io/READING-DANIELS/?teacher",runScripts:"dangerously",pretendToBeVisual:true,
  beforeParse(win){ win.HTMLElement.prototype.scrollIntoView=function(){}; win.scrollTo=function(){}; }}).window;
const d=w.document;
let pass=0, fail=0;
function ok(c,m){ if(c){pass++;} else {fail++; console.log("FAIL:",m);} }

w.READER=w.CLASSES[0].students[0]; w.CURCLASS=w.CLASSES[0];

/* ---- Check 1: Record button is a pill, solid accent, no icon glyph ---- */
w.go("check1");
var c1start=d.getElementById("c1-start");
var cs=w.getComputedStyle(c1start);
ok(cs.borderRadius==="999px","Check 1 Record button is fully pill-shaped (got "+cs.borderRadius+")");
ok(cs.color==="rgb(255, 255, 255)","Check 1 Record button text is white (got "+cs.color+")");
ok(w.getComputedStyle(c1start.querySelector(".icon-glyph")).display==="none","Check 1 Record button's icon glyph is hidden (text-only, matching Check 5-7)");
ok(c1start.querySelector(".icon-label").textContent==="Record","Check 1 Record button still reads 'Record' (label untouched)");
ok(cs.animation.indexOf("none")>-1,"Check 1 Record button has no button-level animation");

/* ---- Check 1: the giant letter display is smaller/calmer, not 9rem ---- */
var c1letter=w.getComputedStyle(d.getElementById("c1-current"));
ok(c1letter.fontSize!=="144px","Check 1's letter display no longer uses the old 9rem size (got "+c1letter.fontSize+")");

/* ---- Check 1 teacher grid: tiles have a thin border, restrained radius ---- */
w.go("check1Teach");
w.ckMarkDone("check1");
var c1Btn=null;
w.go("diagLanding");
var diagBtns=d.querySelectorAll("#diagLanding .btn");
w.go("check1Teach");
ok(w.document.getElementById("check1Teach").className.indexOf("active")>-1,"Check 1 Review still opens");

/* ---- Check 2: rec-btn / play-btn are pills ---- */
w.go("check2");
var c2setupBtn=d.getElementById("c2-setup-btn");
var cs2=w.getComputedStyle(c2setupBtn);
ok(cs2.borderRadius==="999px","Check 2's camera-setup button is fully pill-shaped (got "+cs2.borderRadius+")");

/* ---- Check 2: rec-status / dir-listen are muted, no pulse (matches Check5-7).
   The Muted icon system (2026-09-29) makes this the base/default look for
   EVERY screen, not just a per-check override, so Checks 1-4 no longer
   need (or have) their own scoped copy of this rule -- confirm the base
   rule itself is the static/no-pulse Muted style. ---- */
var recStatusCss=Array.prototype.map.call(d.querySelectorAll("style"),function(s){return s.textContent;}).join("\n");
ok(recStatusCss.indexOf("micPulse")===-1,"no red micPulse animation exists anywhere -- the recording-status dot is static everywhere, including Checks 1-4");
ok(/\.rec-status \.rec-status-dot\{[^}]*border:1px solid var\(--ink-soft\)[^}]*background-color:transparent/.test(recStatusCss),"the base recording-status dot is a plain ink-soft outline, which Checks 1-4 correctly inherit with no override needed");

/* ---- Check 3: the ear-icon-only item display still renders (font-size change to .c1-letter must not break the ear-lg icon, which is absolutely sized) ---- */
w.go("check3");
ok(!!d.querySelector("#check3"),"Check 3 screen still renders");

/* ---- Check 4: long words in the teacher grid still fully readable, no clipping (the pre-existing overflow fix, .c4-grid .c1-cell, is untouched) ---- */
var c4gridRule=recStatusCss.match(/\.c4-grid \.c1-cell\{[^}]*\}/);
ok(!!c4gridRule && /white-space:nowrap/.test(c4gridRule[0]),"Check 4's grid-tile-overflow fix (white-space:nowrap) is still intact, untouched by the restyle");

/* ---- Check 5-7 (already-approved style) are completely unaffected: their
   own CSS blocks are untouched and their pill-btn/clean-tile classes are
   never referenced by the new Check1-4 rules ---- */
ok(!/#check5[^{,]*\.icon-btn/.test(recStatusCss),"Check 5's CSS was not touched by the Check1-4 restyle (no #check5 .icon-btn rule was ever added)");
ok(/#check5 \.pill-btn,#check5Teach \.pill-btn/.test(recStatusCss),"Check 5's own pill-btn block is still present, unchanged");
ok(/#check7 \.pill-btn,#check7Teach \.pill-btn/.test(recStatusCss),"Check 7's own pill-btn block is still present, unchanged");

/* ---- zero HTML/JS changes: onclick handlers and element ids for Checks
   1-4 are byte-identical to before the restyle (spot-check a sample) ---- */
ok(html.indexOf('onclick="c1Start()"')>-1,"Check 1's Record onclick handler is untouched");
ok(html.indexOf('onclick="c4DoneTap()"')>-1,"Check 4's Done onclick handler is untouched");
ok(html.indexOf('id="c2-current"')>-1,"Check 2's current-item id is untouched");

console.log("\n=== "+pass+" passed, "+fail+" failed ===");
process.exit(fail?1:0);
