const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8').replace('<script src="clips.js" defer></script>','<script>'+fs.readFileSync('./clips.js','utf8')+'</script>');

/* TEACHER SIDE: tiles, categories, restored theme picker, thicker
   palette-aware borders, one-screen layout. Layout/look only -- every
   tile must still open exactly what it opened before, and every
   category must still be exactly what it was.

   jsdom note: body{background:var(--paper)} can't be read back through
   getComputedStyle(body).backgroundColor here, because jsdom doesn't
   resolve a custom property that was set on an ANCESTOR (<html>, via
   applyTheme()'s r.style.setProperty calls) back down through a
   var(--paper) reference on a DIFFERENT element (body) -- a jsdom CSS
   engine gap, not a real-browser one. So the actual page-background
   color is instead verified the same way applyTheme() itself sets it:
   reading documentElement.style.getPropertyValue('--paper') and the
   data-palette/data-mode attributes it also sets. Colors that come from
   a literal hex value in a stylesheet rule (every tile's own
   border/background/icon color) resolve fine and are checked directly. */
function rgb(hex){
  var n=parseInt(hex.slice(1),16);
  return "rgb("+((n>>16)&255)+", "+((n>>8)&255)+", "+(n&255)+")";
}
function makeDom(url){
  return new JSDOM(html,{url:url,runScripts:"dangerously",pretendToBeVisual:true,
    beforeParse(w){ w.HTMLElement.prototype.scrollIntoView=function(){}; w.scrollTo=function(){}; }
  });
}
function activeId(d){ var s=d.getElementsByClassName("screen"); for(var i=0;i<s.length;i++) if(/active/.test(s[i].className)) return s[i].id; return null; }
function click(w,el){ el.dispatchEvent(new w.Event("click",{bubbles:true})); }

setTimeout(function(){
  let pass=0,fail=0;
  function ck(c,m){ if(c){pass++;} else {fail++; console.log("FAIL:",m);} }

  var dom=makeDom("https://miqdaniels.github.io/READING-DANIELS/?teacher");
  var w=dom.window, d=w.document;

  /* ---- 1) the 16 tiles, in order, each with its category, label, and
     the SAME destination it always had (Check 5 Review is new for the
     Check 5 build -- everything else is unchanged; Check 5 needs no
     recorder tile since it has no per-item recorded prompts) ---- */
  var expect=[
    {label:"Add Student",       cat:"cat-students",   kind:"go",      target:"s-teachStudents"},
    {label:"Student View",      cat:"cat-students",   kind:"fn",      target:"enterViewAsStudent"},
    {label:"Check 1 Review",    cat:"cat-scoring",    kind:"go",      target:"check1Teach"},
    {label:"Check 2 Review",    cat:"cat-scoring",    kind:"go",      target:"check2Teach"},
    {label:"Check 3 Review",    cat:"cat-scoring",    kind:"go",      target:"check3Teach"},
    {label:"Check 4 Review",    cat:"cat-scoring",    kind:"go",      target:"check4Teach"},
    {label:"Check 5 Review",    cat:"cat-scoring",    kind:"go",      target:"check5Teach"},
    {label:"Check 6 Review",    cat:"cat-scoring",    kind:"go",      target:"check6Teach"},
    {label:"Check 6B Review",   cat:"cat-scoring",    kind:"go",      target:"check6bTeach"},
    {label:"Fluency Review",    cat:"cat-scoring",    kind:"go",      target:"s-fluteach"},
    {label:"Record Words",      cat:"cat-recordings", kind:"go",      target:"s-teach"},
    {label:"Check 2 Prompts",   cat:"cat-recordings", kind:"go",      target:"s-teachC2"},
    {label:"Check 3 Prompts",   cat:"cat-recordings", kind:"go",      target:"s-teachC3"},
    {label:"Directions Audio",  cat:"cat-recordings", kind:"go",      target:"s-teachDir"},
    {label:"Group Locks",       cat:"cat-practice",   kind:"go",      target:"s-teachGroupLocks"},
    {label:"Scoreboard",        cat:"cat-reports",    kind:"go",      target:"s-board"},
    {label:"Settings",          cat:"cat-settings",   kind:"go",      target:"s-settings"},
    {label:"Reset Demo Data",   cat:"cat-settings",   kind:"fn",      target:"vasReset"}
  ];
  var tiles=d.querySelectorAll("#teacher-doors .teach-tile");
  ck(tiles.length===18,"exactly 18 tiles (17 previous + Check 6B Review, nothing else lost or invented) -- got "+tiles.length);

  var i;
  for(i=0;i<tiles.length;i++){
    (function(tile,exp){
      var label=tile.querySelector(".teach-tile-label").textContent;
      ck(label===exp.label,"tile "+(i+1)+" label is '"+exp.label+"' (got '"+label+"')");
      ck(tile.className.indexOf(exp.cat)>-1,"'"+exp.label+"' carries category class "+exp.cat);
      ck(!!tile.querySelector(".teach-tile-icon"),"'"+exp.label+"' has an icon");
      var words=exp.label.split(" ").length;
      ck(words>=1 && words<=3,"'"+exp.label+"' is 1-3 words, not a long bar of text");
      if(exp.kind==="go"){
        w.go("s-home");
        click(w,tile);
        ck(activeId(d)===exp.target,"'"+exp.label+"' still opens "+exp.target+" (got "+activeId(d)+")");
      }
    })(tiles[i],expect[i]);
  }

  /* Student View and Reset still do exactly what they did (function-call
     tiles, not go() -- confirmed directly, matching the pre-redesign
     onclick handlers verbatim) */
  w.go("s-home");
  var svTile=null, rdTile=null;
  for(i=0;i<tiles.length;i++){
    var lbl=tiles[i].querySelector(".teach-tile-label").textContent;
    if(lbl==="Student View"){ svTile=tiles[i]; }
    if(lbl==="Reset Demo Data"){ rdTile=tiles[i]; }
  }
  click(w,svTile);
  ck(w.VIEW_AS_STUDENT===true,"Student View tile still calls enterViewAsStudent()");
  w.exitViewAsStudent();
  w.go("s-home");
  click(w,rdTile);
  ck(/Cleared/.test(d.getElementById("vas-reset-msg").textContent),"Reset Demo Data tile still calls vasReset()");

  /* ---- categories are grouped under their own small headers, in the
     required order, and are wrapped so they can sit side by side ---- */
  var headers=d.querySelectorAll("#teacher-doors .teach-cat-title");
  var headerText=[]; for(i=0;i<headers.length;i++){ headerText.push(headers[i].textContent); }
  ck(headerText.join("|")==="Students|Scoring|Recordings|Practice|Reports|Settings","all 6 category headers present, in the requested order (got: "+headerText.join(", ")+")");
  var catBlocks=d.querySelectorAll("#teacher-doors .teach-cat-block");
  ck(catBlocks.length===6,"each category is its own block (for side-by-side layout), got "+catBlocks.length);
  var catsWrap=d.querySelector("#teacher-doors .teach-cats-wrap");
  ck(!!catsWrap && catsWrap.contains(catBlocks[0]) && catsWrap.contains(catBlocks[5]),"all 6 category blocks sit inside one flex-wrap container");
  ck(w.getComputedStyle(catsWrap).display==="flex" && w.getComputedStyle(catsWrap).flexWrap==="wrap","that container is a flex-wrap row, so categories flow side by side where there's room");

  /* ---- hover/tap only darkens the border, no shadow, no big color swing
     (jsdom can't simulate a real :hover, so this checks the rule exists
     in the stylesheet source instead) ---- */
  ck(/\.teach-tile:hover,[^{]*\{border-color:[^;]+;?\}/.test(html),"a light-mode hover/active rule darkens the tile border");
  ck(/body\.teacher-dark \.teach-tile:hover,[^{]*\{border-color:[^;]+;?\}/.test(html),"a dark-mode hover/active rule darkens the tile border too");
  ck(!/\.teach-tile:hover[^}]*box-shadow/.test(html) && !/\.teach-tile:active[^}]*box-shadow/.test(html),"no shadow added on hover/tap");

  /* ---- 2) tiles: white with dark text on every theme, thicker (2px)
     border in a darker shade of whichever theme is picked, category
     color lives only on the icon -- default boot theme is navy/light ---- */
  ck(d.documentElement.getAttribute("data-palette")==="navy","boots on the navy theme by default");
  ck(d.documentElement.getAttribute("data-mode")==="light","boots in light mode by default");
  var iconPalette={
    "cat-students":"#3b74c9", "cat-scoring":"#1f8a4c", "cat-recordings":"#7c4fc4",
    "cat-practice":"#c96a2e", "cat-reports":"#a8860a", "cat-settings":"#6b7280"
  };
  var cat;
  for(cat in iconPalette){
    var el=d.querySelector("."+cat);
    ck(!!el,"a tile with category "+cat+" exists");
    var cs=w.getComputedStyle(el);
    ck(cs.backgroundColor==="rgb(255, 255, 255)",cat+" tile is white on the navy theme, not a pastel fill (got "+cs.backgroundColor+")");
    ck(cs.borderWidth==="2px","2px border on "+cat+" (thicker than before, got "+cs.borderWidth+")");
    ck(cs.borderColor===rgb("#16304F"),cat+"'s border is navy's own darker shade (accentPress) in light mode (got "+cs.borderColor+")");
    ck(cs.borderRadius==="12px","12px rounded corners on "+cat);
    var iconColor=w.getComputedStyle(el.querySelector(".teach-tile-icon")).color;
    ck(iconColor===rgb(iconPalette[cat]),cat+"'s icon carries the category color (got "+iconColor+")");
    var textColor=w.getComputedStyle(el.querySelector(".teach-tile-label")).color;
    ck(textColor!==iconColor,cat+"'s text is a different color than its icon (label text is NOT category-colored)");
    var labelFontPx=parseFloat(w.getComputedStyle(el.querySelector(".teach-tile-label")).fontSize);
    ck(labelFontPx>=14,cat+"'s label text is at least 14px (got "+labelFontPx+"px)");
  }
  var anyTile=d.querySelector(".teach-tile");
  var lightModeColor=w.getComputedStyle(anyTile).color;
  ck(lightModeColor==="rgb(51, 54, 60)","tile text is a dark gray ink color in light mode, on every theme (got "+lightModeColor+")");
  /* category header color comes from var(--ink-soft), which is restored/
     driven by the theme picker -- jsdom won't resolve that var() this many
     elements deep (a jsdom gap, see the top-of-file note), so this checks
     the same thing applyTheme() itself sets: the variable's actual value */
  ck(d.querySelector(".teach-cat-title").getAttribute("class").indexOf("teach-cat-title")>-1,"category headers use the shared .teach-cat-title style");
  ck(d.documentElement.style.getPropertyValue("--ink-soft")===w.PALETTES.navy.light.inkSoft,"...whose color variable is the theme's own readable ink-soft (navy/light)");

  /* ---- 3) RESTORE THE THEME PICKER: tapping a swatch really does change
     the page theme (documentElement's own CSS variables + attributes),
     it's remembered, and the tile borders follow the new theme too ---- */
  var swBtns=d.querySelectorAll("#swatches .sw");
  ck(swBtns.length===5,"all 5 theme swatches are present");
  var roseIdx=-1, k; for(k=0;k<w.PAL_ORDER.length;k++){ if(w.PAL_ORDER[k]==="rose"){ roseIdx=k; } }
  click(w,swBtns[roseIdx]);
  ck(d.documentElement.getAttribute("data-palette")==="rose","tapping the Dusty Rose swatch actually changes the theme (data-palette)");
  ck(d.documentElement.style.getPropertyValue("--paper")===w.PALETTES.rose.light.paper,"the page background variable updates to Dusty Rose's own paper color");
  ck(w.getComputedStyle(anyTile).borderColor===rgb("#8E4A5B"),"tile borders switch to Dusty Rose's own darker shade too (got "+w.getComputedStyle(anyTile).borderColor+")");
  ck(JSON.parse(w.localStorage.getItem("slider_settings")).palette==="rose","the theme choice is saved (localStorage)");
  ck(w.getComputedStyle(anyTile).backgroundColor==="rgb(255, 255, 255)","tiles stay white even on the Dusty Rose theme");
  ck(w.getComputedStyle(anyTile).color==="rgb(51, 54, 60)","tile text stays dark gray even on the Dusty Rose theme");

  /* the global Dark/Light button (pre-existing, shared with every screen
     in the app) also still works, independently of the teacher-only
     sun/moon toggle */
  var modeBtn=d.getElementById("mode-btn");
  click(w,modeBtn);
  ck(d.documentElement.getAttribute("data-mode")==="dark","the header's Dark/Light button still switches to dark mode");
  ck(d.documentElement.style.getPropertyValue("--paper")===w.PALETTES.rose.dark.paper,"...using Dusty Rose's OWN dark paper color");
  click(w,modeBtn); // back to light for the rest of this test
  ck(d.documentElement.getAttribute("data-mode")==="light","toggling it back returns to light mode");

  /* back to navy for the remaining checks, same as a fresh boot */
  var navyIdx=-1; for(k=0;k<w.PAL_ORDER.length;k++){ if(w.PAL_ORDER[k]==="navy"){ navyIdx=k; } }
  click(w,d.querySelectorAll("#swatches .sw")[navyIdx]);

  /* ---- 4) the teacher-only dark toggle: still works, still teacher-side
     only, and now uses the SAME (currently-picked) theme's dark colors
     instead of a fixed scheme of its own ---- */
  var themeBtn=d.getElementById("teach-theme-btn");
  ck(!!themeBtn,"a sun/moon toggle button exists");
  ck(d.getElementById("teach-theme-icon").textContent.indexOf("☀")>-1,"starts on the sun (light) icon");
  ck(d.body.className.indexOf("teacher-dark")===-1,"body is not in tile-dark mode yet");

  click(w,themeBtn);
  ck(d.body.className.indexOf("teacher-dark")>-1,"tapping the toggle turns tile-dark mode on");
  ck(d.getElementById("teach-theme-icon").textContent.indexOf("\u{1F319}")>-1,"icon switches to the moon");
  ck(w.localStorage.getItem("rf_teacher_dark")==="1","the teacher-only dark preference is saved to localStorage");
  ck(d.documentElement.getAttribute("data-mode")==="dark","the teacher toggle paints the page in dark mode too (still navy)");
  ck(d.documentElement.style.getPropertyValue("--paper")===w.PALETTES.navy.dark.paper,"...using navy's own dark colors (not a separate fixed scheme)");

  var studentsTileDark=d.querySelector(".cat-students");
  var csDark=w.getComputedStyle(studentsTileDark);
  ck(csDark.backgroundColor===rgb("#1d222b"),"Students tile turns dark gray in tile-dark mode (got "+csDark.backgroundColor+")");
  ck(csDark.backgroundColor!=="rgb(255, 255, 255)","the dark tile is NOT still white");
  ck(csDark.borderColor===rgb("#4F7FB8"),"the tile border becomes navy's own LIGHTER shade in dark mode (got "+csDark.borderColor+")");
  var darkIconColor=w.getComputedStyle(studentsTileDark.querySelector(".teach-tile-icon")).color;
  ck(darkIconColor===rgb("#7fb0ef"),"the icon still carries its (brighter, dark-mode) category color (got "+darkIconColor+")");
  var darkTileTextColor=w.getComputedStyle(studentsTileDark.querySelector(".teach-tile-label")).color;
  ck(/rgb\(2[0-4][0-9], 2[0-4][0-9], 2[0-5][0-9]\)/.test(darkTileTextColor),"tile text turns light-colored in dark mode (got "+darkTileTextColor+")");

  /* switching the theme WHILE the teacher toggle is on keeps following
     the new theme's own dark colors, not the old one's */
  click(w,swBtns[roseIdx]);
  ck(w.getComputedStyle(studentsTileDark).borderColor===rgb("#C77E8E"),"switching themes while tile-dark is on re-follows the NEW theme's dark border shade (got "+w.getComputedStyle(studentsTileDark).borderColor+")");
  ck(d.documentElement.style.getPropertyValue("--paper")===w.PALETTES.rose.dark.paper,"...and the page background follows too");
  click(w,swBtns[navyIdx]); // back to navy

  /* reload -- a fresh DOM/localStorage-backed session remembers the choice */
  var dom2=makeDom("https://miqdaniels.github.io/READING-DANIELS/?teacher");
  dom2.window.localStorage.setItem("rf_teacher_dark", w.localStorage.getItem("rf_teacher_dark"));
  setTimeout(function(){
    var w2=dom2.window, d2=w2.document;
    /* the fresh boot already ran before we could seed localStorage above in
       the same tick on some engines, so re-apply once explicitly, exactly
       like a real page load would (loadTeacherDark() + applyTeacherDarkClass()
       both already ran during boot; this just re-asserts determinism) */
    w2.loadTeacherDark();
    w2.applyTeacherDarkClass("s-home");
    ck(w2.TEACHER_DARK===true,"a fresh load reads the remembered dark preference");
    ck(d2.body.className.indexOf("teacher-dark")>-1,"a fresh load re-applies tile-dark mode on the teacher home screen");

    /* ---- dark mode never reaches a student screen, even mid Student View --
       and leaves the theme picker's OWN saved mode alone underneath ---- */
    w2.enterViewAsStudent();
    ck(activeId(d2)==="s-pick","Student View opens the real student class-hour screen");
    ck(d2.body.className.indexOf("teacher-dark")===-1,"the class-hour screen (a real student screen) is NOT tile-dark, even with the teacher preference on");
    ck(d2.documentElement.getAttribute("data-mode")==="light","...and shows the ACTUAL saved light/dark preference (light), not the teacher-only override");
    w2.buildClasses();
    var classBtns=d2.querySelectorAll("#class-list .btn");
    click(w2,classBtns[0]);
    ck(activeId(d2)==="s-roster","reached the roster inside Student View");
    ck(d2.body.className.indexOf("teacher-dark")===-1,"the roster screen is NOT tile-dark either");
    w2.exitViewAsStudent();
    ck(activeId(d2)==="s-home","Exit returns to the teacher home");
    ck(d2.body.className.indexOf("teacher-dark")>-1,"...where tile-dark mode is back, since the preference was never actually turned off");
    ck(d2.documentElement.getAttribute("data-mode")==="dark","...and the page is dark again too");

    /* ---- plain student URL: teacher dark mode can't reach it at all ---- */
    var domS=makeDom("https://miqdaniels.github.io/READING-DANIELS/");
    domS.window.localStorage.setItem("rf_teacher_dark","1");
    setTimeout(function(){
      var wS=domS.window, dS=wS.document;
      wS.loadTeacherDark(); wS.applyTeacherDarkClass(activeId(dS));
      ck(activeId(dS)==="s-pick","plain student URL opens straight to the class-hour screen");
      ck(dS.body.className.indexOf("teacher-dark")===-1,"even with the teacher's dark preference saved, the student URL never shows tile-dark mode");
      ck(dS.documentElement.getAttribute("data-mode")==="light","...and shows the real saved (light) mode, not the teacher override");

      console.log("\n=== "+pass+" passed, "+fail+" failed ===");
      process.exit(fail?1:0);
    },400);
  },400);
},400);
