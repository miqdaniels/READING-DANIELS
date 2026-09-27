const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8').replace('<script src="clips.js" defer></script>','<script>'+fs.readFileSync('./clips.js','utf8')+'</script>');

/* TEACHER SIDE REDESIGN: tiles, categories, pastel colors, dark mode.
   Layout/look only -- every tile must still open exactly what it opened
   before. This test confirms: all 12 tiles exist, in the right category,
   with the right pastel (and dark-mode) color; every tile's onclick still
   reaches its original screen/action; the sun/moon toggle flips and is
   remembered across a reload; dark mode never reaches a student screen,
   including one shown temporarily inside Student View. */
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

  /* ---- 1) the 12 tiles, in order, each with its category, label, and
     the SAME destination it always had ---- */
  var expect=[
    {label:"Add Student",       cat:"cat-students",   kind:"go",      target:"s-teachStudents"},
    {label:"Student View",      cat:"cat-students",   kind:"fn",      target:"enterViewAsStudent"},
    {label:"Check 1 Review",    cat:"cat-scoring",    kind:"go",      target:"check1Teach"},
    {label:"Check 2 Review",    cat:"cat-scoring",    kind:"go",      target:"check2Teach"},
    {label:"Fluency Review",    cat:"cat-scoring",    kind:"go",      target:"s-fluteach"},
    {label:"Record Words",      cat:"cat-recordings", kind:"go",      target:"s-teach"},
    {label:"Check 2 Prompts",   cat:"cat-recordings", kind:"go",      target:"s-teachC2"},
    {label:"Directions Audio",  cat:"cat-recordings", kind:"go",      target:"s-teachDir"},
    {label:"Group Locks",       cat:"cat-practice",   kind:"go",      target:"s-teachGroupLocks"},
    {label:"Scoreboard",        cat:"cat-reports",    kind:"go",      target:"s-board"},
    {label:"Settings",          cat:"cat-settings",   kind:"go",      target:"s-settings"},
    {label:"Reset Demo Data",   cat:"cat-settings",   kind:"fn",      target:"vasReset"}
  ];
  var tiles=d.querySelectorAll("#teacher-doors .teach-tile");
  ck(tiles.length===12,"exactly 12 tiles (nothing lost, nothing invented) -- got "+tiles.length);

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
  var msgBefore=d.getElementById("vas-reset-msg").textContent;
  click(w,rdTile);
  ck(/Cleared/.test(d.getElementById("vas-reset-msg").textContent),"Reset Demo Data tile still calls vasReset()");

  /* ---- 2) pastel colors, one per category, dark text on top ---- */
  var palette={
    "cat-students":"#cfe3fb", "cat-scoring":"#cdeeda", "cat-recordings":"#e3d6f5",
    "cat-practice":"#fbe0cf", "cat-reports":"#faf3c0", "cat-settings":"#e2e2e6"
  };
  var cat;
  for(cat in palette){
    var el=d.querySelector("."+cat);
    ck(!!el,"a tile with category "+cat+" exists");
    var cs=w.getComputedStyle(el);
    ck(cs.backgroundColor===rgb(palette[cat]),cat+" is the right pastel color (got "+cs.backgroundColor+")");
    var textColor=w.getComputedStyle(el.querySelector(".teach-tile-label")||el).color;
    ck(textColor!==cs.backgroundColor,cat+"'s text color is not the same as its background (readable)");
  }
  /* dark, low-lightness text specifically (not just "different from bg") */
  var anyTile=d.querySelector(".teach-tile");
  var lightModeColor=w.getComputedStyle(anyTile).color;
  ck(/rgb\(2[0-9], 2[0-9], 3[0-2]\)/.test(lightModeColor),"tile text is a dark ink color in light mode (got "+lightModeColor+")");

  /* ---- 3) categories are grouped under their own small headers, in the
     required order ---- */
  var headers=d.querySelectorAll("#teacher-doors .teach-cat-title");
  var headerText=[]; for(i=0;i<headers.length;i++){ headerText.push(headers[i].textContent); }
  ck(headerText.join("|")==="Students|Scoring|Recordings|Practice|Reports|Settings","all 6 category headers present, in the requested order (got: "+headerText.join(", ")+")");

  /* ---- 4) dark mode: toggle, remembered across reload, teacher-side only ---- */
  var themeBtn=d.getElementById("teach-theme-btn");
  ck(!!themeBtn,"a sun/moon toggle button exists");
  ck(d.getElementById("teach-theme-icon").innerHTML.indexOf("9728")>-1 || d.getElementById("teach-theme-icon").textContent.indexOf("☀")>-1,"starts on the sun (light) icon");
  ck(d.body.className.indexOf("teacher-dark")===-1,"body is not in dark mode yet");

  click(w,themeBtn);
  ck(d.body.className.indexOf("teacher-dark")>-1,"tapping the toggle turns dark mode on");
  ck(d.getElementById("teach-theme-icon").textContent.indexOf("\u{1F319}")>-1,"icon switches to the moon");
  ck(w.localStorage.getItem("rf_teacher_dark")==="1","dark preference is saved to localStorage");

  var studentsTileDark=d.querySelector(".cat-students");
  var csDark=w.getComputedStyle(studentsTileDark);
  ck(csDark.backgroundColor===rgb("#2c3e57"),"Students tile uses a deeper, muted blue in dark mode (got "+csDark.backgroundColor+")");
  ck(csDark.backgroundColor!==rgb(palette["cat-students"]),"the dark tile color is NOT just the light pastel again");
  var darkTileTextColor=w.getComputedStyle(studentsTileDark.querySelector(".teach-tile-label")).color;
  ck(/rgb\(2[0-4][0-9], 2[0-4][0-9], 2[0-5][0-9]\)/.test(darkTileTextColor),"tile text turns light-colored in dark mode (got "+darkTileTextColor+")");
  ck(w.getComputedStyle(d.body).backgroundColor!=="rgb(247, 249, 252)","the page background itself goes dark (no longer the light paper color)");

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
    ck(d2.body.className.indexOf("teacher-dark")>-1,"a fresh load re-applies dark mode on the teacher home screen");

    /* ---- dark mode never reaches a student screen, even mid Student View ---- */
    w2.enterViewAsStudent();
    ck(activeId(d2)==="s-pick","Student View opens the real student class-hour screen");
    ck(d2.body.className.indexOf("teacher-dark")===-1,"the class-hour screen (a real student screen) is NOT dark, even with the teacher preference on");
    w2.buildClasses();
    var classBtns=d2.querySelectorAll("#class-list .btn");
    click(w2,classBtns[0]);
    ck(activeId(d2)==="s-roster","reached the roster inside Student View");
    ck(d2.body.className.indexOf("teacher-dark")===-1,"the roster screen is NOT dark either");
    w2.exitViewAsStudent();
    ck(activeId(d2)==="s-home","Exit returns to the teacher home");
    ck(d2.body.className.indexOf("teacher-dark")>-1,"...where dark mode is back, since the preference was never actually turned off");

    /* ---- plain student URL: teacher dark mode can't reach it at all ---- */
    var domS=makeDom("https://miqdaniels.github.io/READING-DANIELS/");
    domS.window.localStorage.setItem("rf_teacher_dark","1");
    setTimeout(function(){
      var wS=domS.window, dS=wS.document;
      wS.loadTeacherDark(); wS.applyTeacherDarkClass(activeId(dS));
      ck(activeId(dS)==="s-pick","plain student URL opens straight to the class-hour screen");
      ck(dS.body.className.indexOf("teacher-dark")===-1,"even with the teacher's dark preference saved, the student URL never shows it");

      console.log("\n=== "+pass+" passed, "+fail+" failed ===");
      process.exit(fail?1:0);
    },400);
  },400);
},400);
