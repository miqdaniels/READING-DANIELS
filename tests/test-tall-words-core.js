// TALL Word Builder core: data loader, tile splitter (hand-check list + EVERY word in data/tall-word-lists.json),
// tile -> SND clip mapping, chain highlight, distractors (one sound, never just -s), WRD ids.
var fs=require('fs');
var TW=require('../tall-words-core.js'), AUD=require('../tall-audio.js');
var raw=JSON.parse(fs.readFileSync('./data/tall-word-lists.json','utf8'));
var pass=0, fail=0; function ok(c,m){ if(c){ pass++; } else { fail++; console.log("FAIL: "+m); } }
var src=fs.readFileSync('./tall-words-core.js','utf8');
ok(/<\/script>/.test(src)===false && src.indexOf("=>")<0 && !/(^|[;{}\s(])(const|let)\s+[A-Za-z_$]/.test(src.replace(/"(?:[^"\\\n]|\\.)*"/g,'""')),"core is ES5 (no arrows, const, let)");
ok(!/speechSynthesis|SpeechSynthesisUtterance/.test(src),"no text-to-speech");

/* ---- 1. loader accepts the likely shapes of Miquela's JSON ---- */
var a=TW.normalizeLists({groups:[{id:"g1",title:"G",patterns:[{id:"x",title:"X",build:["sat*","sad"],read:[{word:"has",star:true},{w:"what",heart:true,tricky:"a"}]}]}],heartSets:[{id:"h",title:"H",words:["the"]}]});
ok(a.groups[0].patterns[0].build[0].first100===true && a.groups[0].patterns[0].build[1].first100===false,"string star = first100");
ok(a.groups[0].patterns[0].read[0].w==="has" && a.groups[0].patterns[0].read[0].first100===true,"object word/star keys");
ok(a.groups[0].patterns[0].read[1].heart===true && a.groups[0].patterns[0].read[1].tricky==="a","heart + tricky flags");
ok(a.heart[0].words[0].heart===true,"heart set words are heart words");
var b=TW.normalizeLists({Groups:[{name:"G",Patterns:[{name:"P",Build:["at"],Read:["in"]}]}]});
ok(b.groups[0].patterns[0].title==="P" && b.groups[0].patterns[0].build[0].w==="at","capitalised keys accepted");
var L=TW.normalizeLists(raw), flat=TW.flatPatterns(L);
ok(flat.length===11 && L.groups.length===2,"seed data: 11 patterns in 2 groups");

/* ---- 2. HAND-CHECK LIST: expected tiles written by hand ---- */
var HAND={
 sat:"s a t", box:"b o x", this:"th i s", shut:"sh u t", chin:"ch i n", whip:"wh i p", back:"b a ck", long:"l o ng", thing:"th i ng",
 check:"ch e ck", wish:"w i sh", whiff:"wh i ff", wham:"wh a m", much:"m u ch", "with":"w i th", bath:"b a th", rush:"r u sh", neck:"n e ck",
 moth:"m o th", match:"m a tch", kick:"k i ck", ship:"sh i p", pen:"p e n", rang:"r a ng", fish:"f i sh", cash:"c a sh", mash:"m a sh",
 cake:"c a_e k", time:"t i_e m", home:"h o_e m", use:"u_e s", bike:"b i_e k", these:"th e_e s", cube:"c u_e b", make:"m a_e k", bathe:"b a_e th", plate:"p l a_e t",
 rain:"r ai n", play:"p l ay", feet:"f ee t", team:"t ea m", key:"k ey", boat:"b oa t", snow:"s n ow", cow:"c ow", food:"f oo d", look:"l oo k",
 "new":"n ew", night:"n igh t", out:"ou t", saw:"s aw", ball:"b all", boy:"b oy", coin:"c oi n", small:"s m all",
 car:"c ar", fork:"f or k", her:"h er", bird:"b ir d", turn:"t ur n", hair:"h air", care:"c are", here:"h ere", their:"th eir", ear:"ear", more:"m ore",
 queen:"qu ee n", judge:"j u dge", bell:"b e ll", miss:"m i ss", buzz:"b u zz", off:"o ff", sing:"s i ng", bank:"b a n k", ink:"i n k",
 he:"h e", go:"g o", my:"m y", why:"wh y", happy:"h a pp y", city:"c i t y", gem:"g e m", get:"g e t", yes:"y e s", jam:"j a m", zip:"z i p", van:"v a n",
 hop:"h o p", web:"w e b", dog:"d o g", bus:"b u s", sun:"s u n", cup:"c u p", duck:"d u ck", sock:"s o ck", luck:"l u ck"
};
Object.keys(HAND).forEach(function(w){ ok(TW.tilesText(TW.splitWord(w)).replace(/ +/g," ")===HAND[w],"hand-check "+w+" -> "+HAND[w]+" (got "+TW.tilesText(TW.splitWord(w))+")"); });
var HAND_END={ cats:"c a t s", boxes:"b o x es", jumped:"j u m p ed", hopping:"h o pp ing", wished:"w i sh ed", running:"r u nn ing", dogs:"d o g s", bags:"b a g s" };
Object.keys(HAND_END).forEach(function(w){ ok(TW.tilesText(TW.splitWord(w,{endings:true}))===HAND_END[w],"hand-check (endings) "+w+" -> "+HAND_END[w]+" (got "+TW.tilesText(TW.splitWord(w,{endings:true}))+")"); });
/* without the endings flag, "is", "bed", "sing", "his" are NOT cut */
ok(TW.tilesText(TW.splitWord("is"))==="i s" && TW.tilesText(TW.splitWord("bed"))==="b e d" && TW.tilesText(TW.splitWord("his"))==="h i s","'is', 'bed', 'his' are not mistaken for endings");
/* the tile types the user listed are all single tiles */
["th","sh","ch","wh","ck","ng","tch","igh"].forEach(function(g){ ok(TW.splitWord({th:"bath",sh:"ship",ch:"chin",wh:"whip",ck:"back",ng:"ring",tch:"match",igh:"night"}[g]).some(function(t){ return t.g===g; }),"digraph/trigraph one tile: "+g); });
["a_e","i_e","o_e","u_e","e_e"].forEach(function(g){ var w={ "a_e":"cake","i_e":"time","o_e":"home","u_e":"cube","e_e":"these"}[g]; var t=TW.splitWord(w).filter(function(x){ return x.g===g; })[0]; ok(!!t && t.k==="split","silent e = split tile "+g); });
ok(TW.tilesToWord(TW.splitWord("cake"))==="cake" && TW.tilesToWord(TW.splitWord("these"))==="these" && TW.tilesToWord(TW.splitWord("use"))==="use","a split tile puts the e back: cake, these, use");
["ee","ea","ey","ay","ai","oa","ow","oo","ew","ar","or","ore","er","ir","ur","air","are","ere","eir","ear","ou","aw","all","oi","oy"].forEach(function(g){
  var ex={ee:"feet",ea:"team",ey:"key",ay:"play",ai:"rain",oa:"boat",ow:"cow",oo:"food",ew:"new",ar:"car",or:"fork",ore:"more",er:"her",ir:"bird",ur:"turn",air:"hair",are:"care",ere:"here",eir:"their",ear:"hear",ou:"out",aw:"saw",all:"ball",oi:"coin",oy:"boy"}[g];
  ok(TW.splitWord(ex).some(function(t){ return t.g===g; }),"vowel team / r-controlled one tile: "+g);
});
ok(TW.splitWord("boxes",{endings:true}).pop().g==="es" && TW.splitWord("hopping",{endings:true}).pop().g==="ing" && TW.splitWord("jumped",{endings:true}).pop().g==="ed" && TW.splitWord("cats",{endings:true}).pop().g==="s","endings -s -es -ed -ing are one tile each");

/* ---- 3. tile -> SND clip ---- */
function snd(word,g,opts){ var t=TW.tilesFor(word,opts), i; for(i=0;i<t.length;i++){ if(t[i].g===g){ return t[i].snd; } } return "none"; }
["this","that","than","then","them","with","these","those","there","their"].forEach(function(w){ ok(snd(w,"th")==="SND_10" || (w==="these"||w==="those"?snd(w,"th")==="SND_10":false),"voiced th = SND_10 in "+w); });
["thin","bath","path","math","moth","thing","think"].forEach(function(w){ ok(snd(w,"th")==="SND_09","quiet th = SND_09 in "+w); });
ok(snd("sat","s")==="SND_11" && snd("sat","a")==="SND_25" && snd("sat","t")==="SND_03","sat -> SND_11, SND_25, SND_03");
ok(snd("cake","c")==="SND_05" && snd("city","c")==="SND_11" && snd("gem","g")==="SND_16" && snd("get","g")==="SND_06","hard/soft c and g");
ok(snd("book","oo")==="SND_36" && snd("food","oo")==="SND_35" && snd("snow","ow")==="SND_33" && snd("cow","ow")==="SND_43","oo short/long, ow long-o / ow");
ok(snd("happy","y")==="SND_31" && snd("my","y")==="SND_32" && snd("yes","y")==="SND_23" && snd("he","e")==="SND_31" && snd("go","o")==="SND_33","y and open-syllable vowels");
ok(snd("has","s")==="SND_12" && snd("cats","s",{endings:true})==="SND_11" && snd("dogs","s",{endings:true})==="SND_12","s = /s/ or /z/");
ok(snd("jumped","ed",{endings:true})==="SND_03" && snd("hugged","ed",{endings:true})==="SND_04","-ed = /t/ or /d/");
ok(snd("cake","a_e")==="SND_30" && snd("time","i_e")==="SND_32" && snd("home","o_e")==="SND_33" && snd("cube","u_e")==="SND_34" && snd("these","e_e")==="SND_31","silent e tiles -> long vowel clips");
ok(snd("night","igh")==="SND_32" && snd("match","tch")==="SND_15" && snd("back","ck")==="SND_05" && snd("long","ng")==="SND_19" && snd("shop","sh")==="SND_13" && snd("whip","wh")==="SND_22","digraph/trigraph clips");
ok(snd("car","ar")==="SND_37" && snd("fork","or")==="SND_38" && snd("bird","ir")==="SND_39" && snd("hair","air")==="SND_40" && snd("here","ere")==="SND_41" && snd("there","ere")==="SND_40" && snd("saw","aw")==="SND_42" && snd("ball","all")==="SND_42" && snd("out","ou")==="SND_43" && snd("boy","oy")==="SND_44","r-controlled, aw/all, ou, oy clips");
/* tiles with NO single clip play nothing and show the sound as text */
var nx=TW.tilesFor("box").filter(function(t){ return t.g==="x"; })[0], ni=TW.tilesFor("hopping",{endings:true}).filter(function(t){ return t.g==="ing"; })[0], nq=TW.tilesFor("queen")[0], ne=TW.tilesFor("boxes",{endings:true}).filter(function(t){ return t.g==="es"; })[0];
ok(nx.clip===null && nx.say==="/ks/" && ni.clip===null && ni.say==="/ing/" && nq.clip===null && nq.say==="/kw/" && ne.clip===null && ne.say==="/iz/","x, -ing, qu, -es: no clip, sound shown in text");
ok(TW.tilesFor("what").every(function(t){ return t.clip===null; }),"heart/irregular words have no sound tiles");

/* ---- 4. EVERY word in data/tall-word-lists.json ---- */
var allTiles={}, bad=[], noclip=[], wordsSeen=0;
flat.forEach(function(f){
  var p=f.pattern, opts={endings:TW.isEndingsPattern(p)};
  ["build","read"].forEach(function(k){ p[k].forEach(function(w){
    wordsSeen++;
    var t=TW.tilesFor(w.w,opts);
    if(!t.length || TW.tilesToWord(t)!==TW.wordKey(w.w)){ bad.push(p.id+": "+w.w+" -> "+TW.tilesText(t)); }
    if(!w.heart){ t.forEach(function(x){ if(x.k==="irr"){ bad.push(p.id+": "+w.w+" has an unsplit letter"); } allTiles[x.g]=1; if(x.clip && !AUD[x.clip]){ noclip.push(w.w+":"+x.clip); } }); }
  }); });
});
ok(wordsSeen===220,"checked all 220 words (11 patterns x (10 build + 10 read))");
ok(bad.length===0,"every word splits into tiles that rebuild the word"+(bad.length?" :: "+bad.join("; "):""));
ok(noclip.length===0,"every tile's SND_xx_S clip exists in the Sounds List"+(noclip.length?" :: "+noclip.join(", "):""));
var ALLOWED={}; "b c d f g h j k l m n p q r s t v w x y z a e i o u th sh ch wh ck ng tch igh qu a_e i_e o_e u_e e_e ee ea ey ay ai oa ow oo ew ar or ore er ir ur air are ere eir ear ou aw all oi oy dge s es ed ing ff ll ss zz tt pp bb dd gg mm nn rr e".split(" ").forEach(function(g){ ALLOWED[g]=1; });
var odd=Object.keys(allTiles).filter(function(g){ return !ALLOWED[g]; });
ok(odd.length===0,"every tile is on the approved tile list"+(odd.length?" :: "+odd.join(","):""));

/* ---- 5. chain rule: each build word changes ONE sound from the one before ---- */
/* known data issues in the approved seed (reported to Miquela): this -> thin and when -> wet each change TWO sounds */
var KNOWN={ "th:thin":1, "wh:wet":1 };
var viol=[];
flat.forEach(function(f){
  var p=f.pattern, i, prev, cur, d;
  ok(p.build.length===10 && p.read.length===10,p.id+": 10 build + 10 read");
  for(i=1;i<p.build.length;i++){
    prev=TW.tilesFor(p.build[i-1].w,{endings:TW.isEndingsPattern(p)}); cur=TW.tilesFor(p.build[i].w,{endings:TW.isEndingsPattern(p)});
    d = prev.length===cur.length ? TW.diffCount(prev,cur) : (Math.abs(prev.length-cur.length)===1 ? 1 : 99);
    if(d!==1 && !KNOWN[p.id+":"+p.build[i].w]){ viol.push(p.id+": "+p.build[i-1].w+" -> "+p.build[i].w); }
  }
});
ok(viol.length===0,"each build word changes one sound from the word before"+(viol.length?" :: "+viol.join("; "):""));
/* highlight: the one box that changed */
function ci(a,b){ return TW.changedIndex(TW.tilesFor(a),TW.tilesFor(b)); }
ok(ci("sat","sad")===2 && ci("sad","mad")===0 && ci("mad","map")===2 && ci("sit","sip")===2 && ci("hot","hop")===2 && ci("bus","but")===2 && ci("lip","lid")===2,"highlight = the changed box (end / beginning)");
ok(ci("pin","pan")===1 && ci("top","tip")===1 && ci("sad","sod")===1,"highlight = the changed middle box");
ok(ci("at","sat")===0 && ci("shop","hop")===0,"added / merged first tile -> the first box is highlighted");

/* ---- 6. distractors: same pattern, one sound apart, never just -s ---- */
var rng=(function(){ var s=12345; return function(){ s=(s*1103515245+12345)&0x7fffffff; return s/0x7fffffff; }; })();
var targets=0, dBad=[], noFirst=0, noLast=0;
flat.forEach(function(f){
  var p=f.pattern, pool=TW.patternPool(p), opts={endings:TW.isEndingsPattern(p)}, ts=TW.gameTargets(p,opts), poolKeys={};
  pool.forEach(function(w){ poolKeys[TW.wordKey(w.w)]=1; });
  ts.forEach(function(w){
    var tt=TW.tilesFor(w.w,opts), n, ds, nb=TW.neighbors(w.w,pool,opts);
    var canFirst=nb.some(function(x){ return x.pos!==0; }), canLast=nb.some(function(x){ return x.pos!==tt.length-1; });
    for(n=3;n<=5;n++){
      ds=TW.pickDistractors(w.w,pool,n,rng,opts); targets++;
      if(ds.length<2){ dBad.push(p.id+":"+w.w+" has "+ds.length+" distractors"); continue; }
      ds.forEach(function(d){
        var dt=TW.tilesFor(d.w,opts);
        if(!poolKeys[TW.wordKey(d.w)]){ dBad.push(p.id+": "+w.w+" distractor "+d.w+" not from the pattern"); }
        if(TW.diffCount(tt,dt)!==1){ dBad.push(p.id+": "+w.w+" vs "+d.w+" differ by more than one sound"); }
        if(TW.wordKey(d.w)===TW.wordKey(w.w) || TW.wordKey(d.w)===TW.wordKey(w.w)+"s" || TW.wordKey(w.w)===TW.wordKey(d.w)+"s"){ dBad.push(p.id+": "+w.w+" vs "+d.w+" is only a final -s"); }
      });
      /* no guessing from one letter: if a wrong answer that keeps the first (last) letter exists, the round includes one */
      if(canFirst && !ds.some(function(d){ return TW.tilesFor(d.w,opts)[0].g===tt[0].g; })){ noFirst++; }
      if(canLast && !ds.some(function(d){ var x=TW.tilesFor(d.w,opts); return x[x.length-1].g===tt[tt.length-1].g; })){ noLast++; }
    }
  });
});
ok(targets>100,"many game targets exist across the seed patterns ("+targets+" tested)");
ok(dBad.length===0,"every distractor is from the pattern and differs by exactly one sound, never only -s"+(dBad.length?" :: "+dBad.slice(0,6).join("; "):""));
ok(noFirst===0 && noLast===0,"no guessing from one letter: rounds always keep a wrong answer that shares the first / last tile when one exists ("+noFirst+" / "+noLast+" misses)");
ok(TW.pickDistractors("cats",[{w:"cats"},{w:"cat"},{w:"cat"},{w:"cab"},{w:"cap"}],4,rng,{endings:true}).every(function(d){ return d.w!=="cat"; }),"cat is never offered against cats (final -s only)");

/* ---- 7. WRD_ ids: unique, one per word ---- */
var uw=TW.uniqueWords(L), ids={}, dup=false;
uw.forEach(function(w){ if(ids[w.id]){ dup=true; } ids[w.id]=1; });
ok(!dup && uw.length>0 && uw.every(function(w){ return /^WRD_[a-z]+$/.test(w.id); }),"WRD_ ids are unique");
var distinct={}; flat.forEach(function(f){ f.pattern.build.concat(f.pattern.read).forEach(function(w){ distinct[TW.wordKey(w.w)]=1; }); });
ok(uw.length===Object.keys(distinct).length,"one WRD_ id for every distinct word ("+uw.length+")");
ok(TW.wordId("Sat")==="WRD_sat" && uw.some(function(w){ return w.id==="WRD_what" && w.heart; }),"WRD_sat; 'what' stays a heart word");
console.log("test-tall-words-core: "+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
