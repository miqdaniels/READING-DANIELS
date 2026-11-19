// Builds tall-list.js. Sounds come from the table Mick approved (SND_01-45).
// Passages come from index.html's PASSAGES (Grade 1 = v3 PDF order, 1.0 Water first).
var fs=require('fs');
var src=fs.readFileSync(__dirname+'/../index.html','utf8');
var T={stop:"Short and crisp. No ‘uh’ after it.",hold:"Hold the sound about 2 seconds.",vowel:"Say it clearly, about 1 second.",quick:"Quick and light.",breath:"Just a breath of air.",schwa:"Quick, lazy \u2018uh.\u2019 Mouth relaxed. Don\u2019t hold it."};
var S=[
["/p/","p","pen","stop"],["/b/","b","bag","stop"],["/t/","t","ten","stop"],["/d/","d","dog","stop"],["/k/","c, k, ck","cap","stop"],["/g/","g","gum","stop"],
["/f/","f, ph","fan","hold"],["/v/","v","van","hold"],["/th/ (quiet)","th","thin","hold"],["/th/ (voiced)","th","that","hold"],["/s/","s, c","sit","hold"],["/z/","z, s","zip","hold"],
["/sh/","sh","shop","hold"],["/zh/","s","usually","hold"],["/ch/","ch, tch","chat","stop"],["/j/","j, g","job","stop"],["/m/","m","mom","hold"],["/n/","n","net","hold"],
["/ng/","ng","long","hold"],["/l/","l","leg","hold"],["/r/","r","red","hold"],["/w/","w","win","quick"],["/y/","y","yes","quick"],["/h/","h","hat","breath"],
["short a","a","at","vowel"],["short e","e","egg","vowel"],["short i","i","it","vowel"],["short o","o","on","vowel"],["short u","u","up","vowel"],
["long a","a_e, ai, ay","made","vowel"],["long e","ee, ea, e","team","vowel"],["long i","i_e, igh, y","time","vowel"],["long o","o_e, oa, o","home","vowel"],["long u","u_e","use","vowel"],
["long oo","oo","food","vowel"],["short oo","oo","look","vowel"],["/ar/","ar","car","vowel"],["/or/","or","fork","vowel"],["/er/","er, ir, ur","her","vowel"],
["/air/","air, ere, eir","hair","vowel"],["/ear/","ear, ere","ear","vowel"],["/aw/","aw, a(ll)","saw","vowel"],["/ow/","ou, ow","out","vowel"],["/oi/","oy, oi","boy","vowel"],["/\u0259/","a, e, o, u","sofa","schwa"]];

// Sound-type labels shown small and gray (teachers, not kids). Index = sound number - 1.
var TAGS=[
["Stop"],["Stop"],["Stop"],["Stop"],["Stop","Digraph (ck)"],["Stop"],
["Fricative","Digraph (ph)"],["Fricative"],["Fricative","Digraph (th)"],["Fricative","Digraph (th)"],["Fricative","Soft c (c)"],["Fricative"],
["Fricative","Digraph (sh)"],["Fricative"],["Affricate","Digraph (ch)","Trigraph (tch)"],["Affricate","Soft g (g)"],["Nasal"],["Nasal"],
["Nasal","Digraph (ng)"],["Liquid"],["Liquid"],["Glide"],["Glide"],["Breath"],
["Short vowel"],["Short vowel"],["Short vowel"],["Short vowel"],["Short vowel"],
["Long vowel","Silent e (a_e)","Vowel team (ai, ay)"],["Long vowel","Vowel team (ee, ea)"],["Long vowel","Silent e (i_e)","Vowel team (igh)"],["Long vowel","Silent e (o_e)","Vowel team (oa)"],["Long vowel","Silent e (u_e)"],
["Vowel team (oo)"],["Vowel team (oo)"],["R-controlled"],["R-controlled"],["R-controlled"],
["R-controlled"],["R-controlled"],["Other vowel"],["Diphthong"],["Diphthong"],
["Schwa","Unstressed vowel"]];
// Extra key words (clips SND_xx_W2, SND_xx_W3): one word per additional spelling.
var EXTRA={
 5:[["kid","k",["Stop"]],["duck","ck",["Stop","Digraph (ck)"]]],
 7:[["graph","ph",["Fricative","Digraph (ph)"]]],
 11:[["cell","c",["Fricative","Soft c (c)"]]],
 12:[["is","s",["Fricative"]]],
 15:[["match","tch",["Affricate","Trigraph (tch)"]]],
 16:[["gem","g",["Affricate","Soft g (g)"]]],
 30:[["rain","ai",["Long vowel","Vowel team (ai)"]],["day","ay",["Long vowel","Vowel team (ay)"]]],
 31:[["feet","ee",["Long vowel","Vowel team (ee)"]],["me","e",["Long vowel"]]],
 32:[["night","igh",["Long vowel","Vowel team (igh)"]],["my","y",["Long vowel"]]],
 33:[["boat","oa",["Long vowel","Vowel team (oa)"]],["go","o",["Long vowel"]]],
 39:[["bird","ir",["R-controlled"]],["turn","ur",["R-controlled"]]],
 40:[["where","ere",["R-controlled"]],["their","eir",["R-controlled"]]],
 41:[["here","ere",["R-controlled"]]],
 42:[["ball","a(ll)",["Other vowel"]]],
 43:[["cow","ow",["Diphthong"]]],
 44:[["coin","oi",["Diphthong"]]]
};
var out=[],i;
function p2(n){ return (n<10?"0":"")+n; }
for(i=0;i<S.length;i++){
  var id="SND_"+p2(i+1), s=S[i];
  out.push({id:id+"_S",set:"TALL Sounds",kind:"sound",label:s[0]+" – sound only",sound:s[0],spell:s[1],key:s[2],tip:T[s[3]],tags:TAGS[i],say:"Say the SOUND only"});
  out.push({id:id+"_W",set:"TALL Sounds",kind:"word",label:s[2]+" – key word ("+s[0]+")",sound:s[0],spell:s[1],key:s[2],tip:T[s[3]],tags:TAGS[i],say:"Say the KEY WORD"});
  var ex=EXTRA[i+1]||[], e;
  for(e=0;e<ex.length;e++){
    out.push({id:id+"_W"+(e+2),set:"TALL Sounds",kind:"word",label:ex[e][0]+" \u2013 extra key word ("+s[0]+", "+ex[e][1]+")",sound:s[0],spell:ex[e][1],key:ex[e][0],tip:T[s[3]],tags:ex[e][2],say:"Say the KEY WORD",extra:true});
  }
}
// Passages: evaluated straight from index.html's PASSAGES (Grade 1 / "FIRST"), which is the v3 PDF in
// fixed lines. Nothing is retyped here. rows = one entry per printed line (t plain, m bold markup,
// n running word count, p = first line of a paragraph).
var vm=require('vm');
var ctx={escapeHtml:function(x){return x;}}; vm.createContext(ctx);
vm.runInContext(src.slice(src.indexOf('var LEVELS=['),src.indexOf('var ARCHIVE_SEPT_GRADE1')),ctx);
var G1=ctx.PASSAGES.filter(function(q){return q.level==="FIRST";}).sort(function(a,b){return a.sub-b.sub;});
if(G1.length!==11){ throw new Error("expected 11 Grade 1 passages"); }
for(i=0;i<G1.length;i++){
  var q=G1[i];
  out.push({id:"PSG_1_"+p2(q.sub),set:"TALL Grade 1 Passages Read-Aloud",kind:"passage",label:"1."+q.sub+" "+q.title,title:q.title,words:q.totalWords,paras:q.paragraphs.slice(),
    rows:q.lines.map(function(r){return {t:r.markup.replace(/\*\*/g,""),m:r.markup,n:r.n,p:r.first?1:0};}),say:"Read the whole passage aloud"});
}
var js="/* Reading Foundations -- TALL recording list (tall-studio.html).\n * (c) 2026 Miquela Daniels, AI Academy LLC. Proprietary -- do not copy or distribute.\n * GENERATED by tools/build-tall-list.js -- passage text, lines and counts come from index.html (the v3 PDF) unchanged. ES5 only. */\nvar TALL_LIST = [\n";
for(i=0;i<out.length;i++){ js+="  "+JSON.stringify(out[i])+(i<out.length-1?",":"")+"\n"; }
js+="];\nif(typeof window!==\"undefined\"){ window.TALL_LIST = TALL_LIST; }\nif(typeof module!==\"undefined\" && module.exports){ module.exports = TALL_LIST; }\n";
fs.writeFileSync(__dirname+'/../tall-list.js',js);
console.log(out.length+" clips");
