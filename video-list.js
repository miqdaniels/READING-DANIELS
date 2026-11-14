/* (c) 2026 Miquela Daniels, AI Academy LLC. Reading Foundations. Proprietary -- do not copy or distribute.
   Mouth Video Studio list: every short video clip Mick records of her mouth making a sound.
   id    = file name (never change an id once recorded)
   set   = the set it belongs to (picker builds itself from these)
   text  = what shows big on the screen
   say   = what to say on camera (teacher cue, small text)
   Add a clip = add a line. ES5 only. */
var VIDEO_LIST = [
  /* ---- The 44 TALL sounds (same SND_01-44 ids as the TALL Recording Studio). One clip per sound. ---- */
  {id:"SND_01", set:"Sounds", text:"/p/", say:"/p/  (p) ... as in pen. Tip: Short and crisp. No 'uh' after it."},
  {id:"SND_02", set:"Sounds", text:"/b/", say:"/b/  (b) ... as in bag. Tip: Short and crisp. No 'uh' after it."},
  {id:"SND_03", set:"Sounds", text:"/t/", say:"/t/  (t) ... as in ten. Tip: Short and crisp. No 'uh' after it."},
  {id:"SND_04", set:"Sounds", text:"/d/", say:"/d/  (d) ... as in dog. Tip: Short and crisp. No 'uh' after it."},
  {id:"SND_05", set:"Sounds", text:"/k/", say:"/k/  (c, k, ck) ... as in cap. Tip: Short and crisp. No 'uh' after it."},
  {id:"SND_06", set:"Sounds", text:"/g/", say:"/g/  (g) ... as in gum. Tip: Short and crisp. No 'uh' after it."},
  {id:"SND_07", set:"Sounds", text:"/f/", say:"/f/  (f, ph) ... as in fan. Tip: Hold the sound about 2 seconds."},
  {id:"SND_08", set:"Sounds", text:"/v/", say:"/v/  (v) ... as in van. Tip: Hold the sound about 2 seconds."},
  {id:"SND_09", set:"Sounds", text:"/th/ (quiet)", say:"/th/ (quiet)  (th) ... as in thin. Tip: Hold the sound about 2 seconds."},
  {id:"SND_10", set:"Sounds", text:"/th/ (voiced)", say:"/th/ (voiced)  (th) ... as in that. Tip: Hold the sound about 2 seconds."},
  {id:"SND_11", set:"Sounds", text:"/s/", say:"/s/  (s, c) ... as in sit. Tip: Hold the sound about 2 seconds."},
  {id:"SND_12", set:"Sounds", text:"/z/", say:"/z/  (z, s) ... as in zip. Tip: Hold the sound about 2 seconds."},
  {id:"SND_13", set:"Sounds", text:"/sh/", say:"/sh/  (sh) ... as in shop. Tip: Hold the sound about 2 seconds."},
  {id:"SND_14", set:"Sounds", text:"/zh/", say:"/zh/  (s) ... as in usually. Tip: Hold the sound about 2 seconds."},
  {id:"SND_15", set:"Sounds", text:"/ch/", say:"/ch/  (ch, tch) ... as in chat. Tip: Short and crisp. No 'uh' after it."},
  {id:"SND_16", set:"Sounds", text:"/j/", say:"/j/  (j, g) ... as in job. Tip: Short and crisp. No 'uh' after it."},
  {id:"SND_17", set:"Sounds", text:"/m/", say:"/m/  (m) ... as in mom. Tip: Hold the sound about 2 seconds."},
  {id:"SND_18", set:"Sounds", text:"/n/", say:"/n/  (n) ... as in net. Tip: Hold the sound about 2 seconds."},
  {id:"SND_19", set:"Sounds", text:"/ng/", say:"/ng/  (ng) ... as in long. Tip: Hold the sound about 2 seconds."},
  {id:"SND_20", set:"Sounds", text:"/l/", say:"/l/  (l) ... as in leg. Tip: Hold the sound about 2 seconds."},
  {id:"SND_21", set:"Sounds", text:"/r/", say:"/r/  (r) ... as in red. Tip: Hold the sound about 2 seconds."},
  {id:"SND_22", set:"Sounds", text:"/w/", say:"/w/  (w) ... as in win. Tip: Quick and light."},
  {id:"SND_23", set:"Sounds", text:"/y/", say:"/y/  (y) ... as in yes. Tip: Quick and light."},
  {id:"SND_24", set:"Sounds", text:"/h/", say:"/h/  (h) ... as in hat. Tip: Just a breath of air."},
  {id:"SND_25", set:"Sounds", text:"short a", say:"short a  (a) ... as in at. Tip: Say it clearly, about 1 second."},
  {id:"SND_26", set:"Sounds", text:"short e", say:"short e  (e) ... as in egg. Tip: Say it clearly, about 1 second."},
  {id:"SND_27", set:"Sounds", text:"short i", say:"short i  (i) ... as in it. Tip: Say it clearly, about 1 second."},
  {id:"SND_28", set:"Sounds", text:"short o", say:"short o  (o) ... as in on. Tip: Say it clearly, about 1 second."},
  {id:"SND_29", set:"Sounds", text:"short u", say:"short u  (u) ... as in up. Tip: Say it clearly, about 1 second."},
  {id:"SND_30", set:"Sounds", text:"long a", say:"long a  (a_e, ai, ay) ... as in made. Tip: Say it clearly, about 1 second."},
  {id:"SND_31", set:"Sounds", text:"long e", say:"long e  (ee, ea, e) ... as in team. Tip: Say it clearly, about 1 second."},
  {id:"SND_32", set:"Sounds", text:"long i", say:"long i  (i_e, igh, y) ... as in time. Tip: Say it clearly, about 1 second."},
  {id:"SND_33", set:"Sounds", text:"long o", say:"long o  (o_e, oa, o) ... as in home. Tip: Say it clearly, about 1 second."},
  {id:"SND_34", set:"Sounds", text:"long u", say:"long u  (u_e) ... as in use. Tip: Say it clearly, about 1 second."},
  {id:"SND_35", set:"Sounds", text:"long oo", say:"long oo  (oo) ... as in food. Tip: Say it clearly, about 1 second."},
  {id:"SND_36", set:"Sounds", text:"short oo", say:"short oo  (oo) ... as in look. Tip: Say it clearly, about 1 second."},
  {id:"SND_37", set:"Sounds", text:"/ar/", say:"/ar/  (ar) ... as in car. Tip: Say it clearly, about 1 second."},
  {id:"SND_38", set:"Sounds", text:"/or/", say:"/or/  (or) ... as in fork. Tip: Say it clearly, about 1 second."},
  {id:"SND_39", set:"Sounds", text:"/er/", say:"/er/  (er, ir, ur) ... as in her. Tip: Say it clearly, about 1 second."},
  {id:"SND_40", set:"Sounds", text:"/air/", say:"/air/  (air, ere, eir) ... as in hair. Tip: Say it clearly, about 1 second."},
  {id:"SND_41", set:"Sounds", text:"/ear/", say:"/ear/  (ear, ere) ... as in ear. Tip: Say it clearly, about 1 second."},
  {id:"SND_42", set:"Sounds", text:"/aw/", say:"/aw/  (aw, a(ll)) ... as in saw. Tip: Say it clearly, about 1 second."},
  {id:"SND_43", set:"Sounds", text:"/ow/", say:"/ow/  (ou, ow) ... as in out. Tip: Say it clearly, about 1 second."},
  {id:"SND_44", set:"Sounds", text:"/oi/", say:"/oi/  (oy, oi) ... as in boy. Tip: Say it clearly, about 1 second."},

  /* ---- 3A Beginning Sounds (lesson v0.7: models + guided practice) ---- */
  {id:"PA_3A_01", set:"3A Beginning Sounds", text:"moon",  say:"Moon. Mmmmoon. First sound: /m/."},
  {id:"PA_3A_02", set:"3A Beginning Sounds", text:"sock",  say:"Sock. Ssssock. First sound: /s/."},
  {id:"PA_3A_03", set:"3A Beginning Sounds", text:"park",  say:"Park. ... First sound: /p/."},
  {id:"PA_3A_04", set:"3A Beginning Sounds", text:"ball",  say:"Ball. ... First sound: /b/."},
  {id:"PA_3A_05", set:"3A Beginning Sounds", text:"rain",  say:"Rain. ... First sound: /r/."},
  {id:"PA_3A_06", set:"3A Beginning Sounds", text:"fan",   say:"Fan. Fffan. First sound: /f/."},

  /* ---- 3B Ending Sounds (lesson v0.2) ---- */
  {id:"PA_3B_01", set:"3B Ending Sounds", text:"gym",   say:"Gym. Gymmm. Last sound: /m/."},
  {id:"PA_3B_02", set:"3B Ending Sounds", text:"yes",   say:"Yes. Yesss. Last sound: /s/."},
  {id:"PA_3B_03", set:"3B Ending Sounds", text:"phone", say:"Phone. ... Last sound: /n/."},
  {id:"PA_3B_04", set:"3B Ending Sounds", text:"book",  say:"Book. ... Last sound: /k/."},
  {id:"PA_3B_05", set:"3B Ending Sounds", text:"bag",   say:"Bag. ... Last sound: /g/."},
  {id:"PA_3B_06", set:"3B Ending Sounds", text:"dime",  say:"Dime. Dimmme. Last sound: /m/."},

  /* ---- 3C Blending (lesson v0.2) ---- */
  {id:"PA_3C_01", set:"3C Blending", text:"mom",  say:"/m/ /ŏ/ /m/. Mmmooommm. Mom."},
  {id:"PA_3C_02", set:"3C Blending", text:"nice", say:"/n/ /ī/ /s/. Nnniiisss. Nice."},
  {id:"PA_3C_03", set:"3C Blending", text:"see",  say:"/s/ /ē/. ... See."},
  {id:"PA_3C_04", set:"3C Blending", text:"run",  say:"/r/ /ŭ/ /n/. ... Run."},
  {id:"PA_3C_05", set:"3C Blending", text:"mad",  say:"/m/ /ă/ /d/. ... Mad."},
  {id:"PA_3C_06", set:"3C Blending", text:"shut", say:"/sh/ /ŭ/ /t/. ... Shut."},

  /* ---- 3D Segmenting (lesson v0.2) ---- */
  {id:"PA_3D_01", set:"3D Segmenting", text:"mop",  say:"Mop. /m/ /ŏ/ /p/. Three sounds."},
  {id:"PA_3D_02", set:"3D Segmenting", text:"no",   say:"No. /n/ /ō/. Two sounds."},
  {id:"PA_3D_03", set:"3D Segmenting", text:"cab",  say:"Cab. /k/ /ă/ /b/. Three sounds."},
  {id:"PA_3D_04", set:"3D Segmenting", text:"rug",  say:"Rug. /r/ /ŭ/ /g/. Three sounds."},
  {id:"PA_3D_05", set:"3D Segmenting", text:"wish", say:"Wish. /w/ /ĭ/ /sh/. Three sounds."}
];
if (typeof module !== "undefined" && module.exports) { module.exports = VIDEO_LIST; }
