/* (c) 2026 Miquela Daniels, AI Academy LLC. Reading Foundations. Proprietary -- do not copy or distribute.
   Mouth Video Studio list: every short video clip Mick records of her mouth making a sound.
   id    = file name (never change an id once recorded)
   set   = the set it belongs to (picker builds itself from these)
   text  = what shows big on the screen
   say   = what to say on camera (teacher cue, small text)
   Add a clip = add a line. ES5 only. */
var VIDEO_LIST = [
  /* ---- Single sounds: one clip per sound used in the Check 3 lessons ---- */
  {id:"PA_SND_01", set:"Sounds", text:"/m/",  say:"mmm (hold it) ... as in mom"},
  {id:"PA_SND_02", set:"Sounds", text:"/s/",  say:"sss (hold it) ... as in see"},
  {id:"PA_SND_03", set:"Sounds", text:"/f/",  say:"fff (hold it) ... as in five"},
  {id:"PA_SND_04", set:"Sounds", text:"/n/",  say:"nnn (hold it) ... as in no"},
  {id:"PA_SND_05", set:"Sounds", text:"/l/",  say:"lll (hold it) ... as in leg"},
  {id:"PA_SND_06", set:"Sounds", text:"/r/",  say:"rrr (hold it) ... as in run"},
  {id:"PA_SND_07", set:"Sounds", text:"/v/",  say:"vvv (hold it) ... as in five"},
  {id:"PA_SND_08", set:"Sounds", text:"/ʃ/ (sh)", say:"shhh (hold it) ... as in shut"},
  {id:"PA_SND_09", set:"Sounds", text:"/p/",  say:"/p/ (short, no uh) ... as in park"},
  {id:"PA_SND_10", set:"Sounds", text:"/t/",  say:"/t/ (short, no uh) ... as in tie"},
  {id:"PA_SND_11", set:"Sounds", text:"/k/",  say:"/k/ (short, no uh) ... as in kid"},
  {id:"PA_SND_12", set:"Sounds", text:"/b/",  say:"/b/ (short, no uh) ... as in book"},
  {id:"PA_SND_13", set:"Sounds", text:"/d/",  say:"/d/ (short, no uh) ... as in door"},
  {id:"PA_SND_14", set:"Sounds", text:"/g/",  say:"/g/ (short, no uh) ... as in gas"},
  {id:"PA_SND_15", set:"Sounds", text:"/h/",  say:"/h/ (a breath) ... as in hat"},
  {id:"PA_SND_16", set:"Sounds", text:"/w/",  say:"/w/ ... as in wet"},
  {id:"PA_SND_17", set:"Sounds", text:"/dʒ/ (j)", say:"/j/ (short, no uh) ... as in jump"},
  {id:"PA_SND_18", set:"Sounds", text:"/tʃ/ (ch)", say:"/ch/ (short, no uh) ... as in chin"},
  {id:"PA_SND_19", set:"Sounds", text:"/ă/",  say:"short a ... as in sad"},
  {id:"PA_SND_20", set:"Sounds", text:"/ĕ/",  say:"short e ... as in leg"},
  {id:"PA_SND_21", set:"Sounds", text:"/ĭ/",  say:"short i ... as in kid"},
  {id:"PA_SND_22", set:"Sounds", text:"/ŏ/",  say:"short o ... as in mop"},
  {id:"PA_SND_23", set:"Sounds", text:"/ŭ/",  say:"short u ... as in rug"},
  {id:"PA_SND_24", set:"Sounds", text:"/ē/",  say:"long e ... as in see"},
  {id:"PA_SND_25", set:"Sounds", text:"/ī/",  say:"long i ... as in tie"},
  {id:"PA_SND_26", set:"Sounds", text:"/ō/",  say:"long o ... as in no"},

  /* ---- 3A Beginning Sounds (approved lesson v0.6: model + guided practice) ---- */
  {id:"PA_3A_01", set:"3A Beginning Sounds", text:"moon",  say:"Moon. Mmmmoon. First sound: /m/."},
  {id:"PA_3A_02", set:"3A Beginning Sounds", text:"park",  say:"Park. ... First sound: /p/."},
  {id:"PA_3A_03", set:"3A Beginning Sounds", text:"rain",  say:"Rain. ... First sound: /r/."},
  {id:"PA_3A_04", set:"3A Beginning Sounds", text:"fan",   say:"Fan. Fffan. First sound: /f/."},

  /* ---- 3B Ending Sounds (lesson v0.1) ---- */
  {id:"PA_3B_01", set:"3B Ending Sounds", text:"gym",   say:"Gym. Gymmm. Last sound: /m/."},
  {id:"PA_3B_02", set:"3B Ending Sounds", text:"yes",   say:"Yes. Yesss. Last sound: /s/."},
  {id:"PA_3B_03", set:"3B Ending Sounds", text:"phone", say:"Phone. ... Last sound: /n/."},
  {id:"PA_3B_04", set:"3B Ending Sounds", text:"book",  say:"Book. ... Last sound: /k/."},
  {id:"PA_3B_05", set:"3B Ending Sounds", text:"bag",   say:"Bag. ... Last sound: /g/."},
  {id:"PA_3B_06", set:"3B Ending Sounds", text:"five",  say:"Five. ... Last sound: /v/."},

  /* ---- 3C Blending (lesson v0.1) ---- */
  {id:"PA_3C_01", set:"3C Blending", text:"mom",  say:"/m/ /ŏ/ /m/. Mmmooommm. Mom."},
  {id:"PA_3C_02", set:"3C Blending", text:"see",  say:"/s/ /ē/. Ssseee. See."},
  {id:"PA_3C_03", set:"3C Blending", text:"run",  say:"/r/ /ŭ/ /n/. ... Run."},
  {id:"PA_3C_04", set:"3C Blending", text:"mad",  say:"/m/ /ă/ /d/. ... Mad."},
  {id:"PA_3C_05", set:"3C Blending", text:"shut", say:"/sh/ /ŭ/ /t/. ... Shut."},

  /* ---- 3D Segmenting (lesson v0.1) ---- */
  {id:"PA_3D_01", set:"3D Segmenting", text:"mop",  say:"Mop. /m/ /ŏ/ /p/. Three sounds."},
  {id:"PA_3D_02", set:"3D Segmenting", text:"no",   say:"No. /n/ /ō/. Two sounds."},
  {id:"PA_3D_03", set:"3D Segmenting", text:"rug",  say:"Rug. /r/ /ŭ/ /g/. Three sounds."},
  {id:"PA_3D_04", set:"3D Segmenting", text:"wish", say:"Wish. /w/ /ĭ/ /sh/. Three sounds."}
];
if (typeof module !== "undefined" && module.exports) { module.exports = VIDEO_LIST; }
