// TALL Word Builder core: data loader, tile splitter (hand-check list + EVERY word in data/tall-word-lists.json),
// tile -> SND clip mapping, chain highlight, distractors (one sound, never just -s), WRD ids.
// The Build-chain (one-sound) rule has its own strict test: tests/test-tall-word-chains.js
var fs=require('fs');
var TW=require('../tall-words-core.js'), AUD=require('../tall-audio.js');
var raw=JSON.parse(fs.readFileSync('./data/tall-word-lists.json','utf8'));
var pass=0, fail=0; function ok(c,m){ if(c){ pass++; } else { fail++; console.log("FAIL: "+m); } }
var src=fs.readFileSync('./tall-words-core.js','utf8');
ok(src.indexOf("=>")<0 && !/(^|[;{}\s(])(const|let)\s+[A-Za-z_$]/.test(src.replace(/"(?:[^"\\\n]|\\.)*"/g,'""')),"core is ES5 (no arrows, const, let)");
ok(!/speechSynthesis|SpeechSynthesisUtterance/.test(src),"no text-to-speech");

/* ---- 1. loader accepts the likely shapes ---- */
var a=TW.normalizeLists({groups:[{id:"g1",title:"G",patterns:[{id:"x",title:"X",build:["sat*","sad"],read:[{word:"has",star:true},{w:"what",heart:true,tricky:"a"}]}]}],heartSets:[{id:"h",title:"H",words:["the"]}]});
ok(a.groups[0].patterns[0].build[0].first100===true && a.groups[0].patterns[0].build[1].first100===false,"string star = first100");
ok(a.groups[0].patterns[0].read[0].w==="has" && a.groups[0].patterns[0].read[0].first100===true,"object word/star keys");
ok(a.groups[0].patterns[0].read[1].heart===true && a.groups[0].patterns[0].read[1].tricky==="a","heart + tricky flags");
ok(a.heart[0].words[0].heart===true,"heart set words are heart words");
var b=TW.normalizeLists({Groups:[{name:"G",Patterns:[{name:"P",Build:["at"],Read:["in"]}]}]});
ok(b.groups[0].patterns[0].title==="P" && b.groups[0].patterns[0].build[0].w==="at","capitalised keys accepted");
/* the v3 file shape: flat patterns that name their own group, heartWords [{set, words}] */
var c=TW.normalizeLists({patterns:[{group:"G1",groupTitle:"One",id:"a b",title:"A",build:[{w:"at"}],read:[{w:"in"}]},{group:"G1",groupTitle:"One",id:"c",title:"C",build:[],read:[]},{group:"G2",groupTitle:"Two",id:"d",title:"D",build:[],read:[]}],heartWords:[{set:1,words:[{w:"the",first100:true}]},{set:2,words:[{w:"said"}]}]});
ok(c.groups.length===2 && c.groups[0].title==="One" && c.groups[0].patterns.length===2 && c.groups[1].id==="G2","flat patterns are grouped by their group code, in order");
ok(c.heart.length===2 && c.heart[0].id==="heart-1" && c.heart[1].title==="Heart words 2" && c.heart[0].words[0].heart===true && c.heart[0].words[0].first100===true,"heartWords [{set, words}] become heart sets");

/* ---- the real file ---- */
var L=TW.normalizeLists(raw), flat=TW.flatPatterns(L), KN=TW.knownSet(L);
function OP(p){ return { endings: TW.isEndingsPattern(p), known: KN }; }
ok(raw.version==="v3","data file is v3");
ok(flat.length===46 && L.groups.length===10,"46 patterns in 10 groups ("+flat.length+" / "+L.groups.length+")");
ok(L.heart.length===4 && L.heart.every(function(h){ return h.words.length===10 && h.words.every(function(w){ return w.heart; }); }),"4 heart-word sets of 10, all heart words");
ok(flat.every(function(f){ return f.pattern.build.length===10 && f.pattern.read.length===10; }),"every pattern has 10 Build + 10 Read");
var pids={}, dupP=false; flat.forEach(function(f){ if(pids[f.pattern.id]){ dupP=true; } pids[f.pattern.id]=1; }); ok(!dupP,"pattern ids are unique");
ok(L.groups.map(function(g){ return g.title; }).join("|")==="Short Vowels|Digraphs|Blends|Silent e|Open Syllables|Vowel Teams|R-Controlled|Endings|Two-Part Words|Level 2 Sounds","group titles in teaching order");

/* ---- 2. HAND-CHECK LIST: expected tiles written by hand (independent of the code) ---- */
var HAND={
 sat:"s a t", box:"b o x", this:"th i s", shut:"sh u t", chin:"ch i n", whip:"wh i p", back:"b a ck", long:"l o ng", thing:"th i ng",
 check:"ch e ck", wish:"w i sh", whiff:"wh i ff", much:"m u ch", "with":"w i th", bath:"b a th", rush:"r u sh", neck:"n e ck", moth:"m o th",
 match:"m a tch", kick:"k i ck", ship:"sh i p", pen:"p e n", rang:"r a ng", fish:"f i sh", cash:"c a sh", jam:"j a m", zip:"z i p", van:"v a n", dog:"d o g",
 snap:"s n a p", skip:"s k i p", spin:"s p i n", sloth:"s l o th", black:"b l a ck", clock:"c l o ck", flip:"f l i p", class:"c l a ss", drop:"d r o p", trash:"t r a sh",
 crab:"c r a b", grad:"g r a d", hand:"h a n d", best:"b e s t", text:"t e x t", jump:"j u m p", desk:"d e s k", fast:"f a s t", scrap:"s c r a p", strap:"s t r a p",
 string:"s t r i ng", strong:"s t r o ng", shrug:"sh r u g", thrill:"th r i ll", catch:"c a tch", stitch:"s t i tch", sketch:"s k e tch", scratch:"s c r a tch",
 cake:"c a_e k", time:"t i_e m", home:"h o_e m", use:"u_e s", bike:"b i_e k", these:"th e_e s", cube:"c u_e b", make:"m a_e k", bathe:"b a_e th", plate:"p l a_e t",
 game:"g a_e m", gate:"g a_e t", smile:"s m i_e l", side:"s i_e d", smoke:"s m o_e k", code:"c o_e d", huge:"h u_e g", theme:"th e_e m", scene:"s c e_e n", office:"o ff i_e c",
 he:"h e", go:"g o", my:"m y", why:"wh y", happy:"h a pp y", city:"c i t y",
 rain:"r ai n", play:"p l ay", feet:"f ee t", team:"t ea m", key:"k ey", boat:"b oa t", snow:"s n ow", cow:"c ow", food:"f oo d", look:"l oo k", "new":"n ew", night:"n igh t",
 keep:"k ee p", seat:"s ea t", day:"d ay", moon:"m oo n", book:"b oo k", high:"h igh", sigh:"s igh",
 out:"ou t", loud:"l ou d", saw:"s aw", ball:"b all", all:"all", small:"s m all", talk:"t al k", coin:"c oi n", boy:"b oy", joy:"j oy",
 car:"c ar", star:"s t ar", fork:"f or k", sort:"s or t", her:"h er", fern:"f er n", bird:"b ir d", turn:"t ur n", hair:"h air", chair:"ch air", care:"c are", share:"sh are",
 here:"h ere", where:"wh ere", their:"th eir", ear:"ear", hear:"h ear", cheer:"ch eer", deer:"d eer", more:"m ore", scared:"s c are d", square:"s qu are",
 queen:"qu ee n", judge:"j u dge", bell:"b e ll", miss:"m i ss", buzz:"b u zz", off:"o ff", sing:"s i ng", bank:"b a n k", ink:"i n k",
 phone:"ph o_e n", write:"wr i_e t", knew:"kn ew", tired:"t ire d", school:"s ch oo l", family:"f a m i l y", sunset:"s u n s e t", napkin:"n a p k i n", number:"n u m b er", after:"a f t er"
};
Object.keys(HAND).forEach(function(w){ var got=TW.tilesText(TW.splitWord(w,{known:KN})); ok(got===HAND[w],"hand-check "+w+" -> "+HAND[w]+" (got "+got+")"); });
var HAND_END={ cats:"c a t s", boxes:"b o x es", jumped:"j u m p ed", hopping:"h o pp ing", wished:"w i sh ed", running:"r u nn ing", dogs:"d o g s", bags:"b a g s",
  looked:"l oo k ed", called:"c all ed", played:"p l ay ed", jumping:"j u m p ing", shopping:"sh o pp ing", stopped:"s t o pp ed", going:"g o ing", texts:"t e x t s", classes:"c l a ss es", thinking:"th i n k ing", wanted:"w a n t ed" };
Object.keys(HAND_END).forEach(function(w){ var got=TW.tilesText(TW.splitWord(w,{endings:true,known:KN})); ok(got===HAND_END[w],"hand-check (endings) "+w+" -> "+HAND_END[w]+" (got "+got+")"); });
/* outside an Endings pattern an ending is still found when it is real, and never cut from words that merely end that way */
ok(TW.tilesText(TW.splitWord("looked",{known:KN}))==="l oo k ed" && TW.tilesText(TW.splitWord("going",{known:KN}))==="g o ing" && TW.tilesText(TW.splitWord("stopped",{known:KN}))==="s t o pp ed","real inflections are found in any pattern (looked, going, stopped)");
["is","bed","his","thing","king","sing","bring","spring","speed","need","red","shed","seed"].forEach(function(w){ ok(TW.splitWord(w,{known:KN}).every(function(t){ return t.k!=="end"; }),"'"+w+"' is not cut into word + ending"); });
["th","sh","ch","wh","ck","ng","tch","igh"].forEach(function(g){ ok(TW.splitWord({th:"bath",sh:"ship",ch:"chin",wh:"whip",ck:"back",ng:"ring",tch:"match",igh:"night"}[g]).some(function(t){ return t.g===g; }),"digraph/trigraph one tile: "+g); });
["a_e","i_e","o_e","u_e","e_e"].forEach(function(g){ var w={ "a_e":"cake","i_e":"time","o_e":"home","u_e":"cube","e_e":"these"}[g]; var t=TW.splitWord(w).filter(function(x){ return x.g===g; })[0]; ok(!!t && t.k==="split","silent e = split tile "+g); });
ok(["cake","these","use","games","cubes","homes"].every(function(w){ return TW.tilesToWord(TW.splitWord(w,{endings:true}))===w; }),"a split tile puts the e back in the right place: cake, these, use, games (e before the -s)");
["ee","ea","ey","ay","ai","oa","ow","oo","ew","ar","or","ore","er","ir","ur","air","are","ere","eir","ear","ou","aw","all","oi","oy"].forEach(function(g){
  var ex={ee:"feet",ea:"team",ey:"key",ay:"play",ai:"rain",oa:"boat",ow:"cow",oo:"food",ew:"new",ar:"car",or:"fork",ore:"more",er:"her",ir:"bird",ur:"turn",air:"hair",are:"care",ere:"here",eir:"their",ear:"hear",ou:"out",aw:"saw",all:"ball",oi:"coin",oy:"boy"}[g];
  ok(TW.splitWord(ex).some(function(t){ return t.g===g; }),"vowel team / r-controlled one tile: "+g);
});
ok(["jumped","looked","called","going","jumping"].every(function(w){ var t=TW.splitWord(w,{known:KN}), l=t[t.length-1]; return l.k==="end" && /^(ed|ing)$/.test(l.g); }) && TW.splitWord("boxes",{endings:true}).pop().g==="es" && TW.splitWord("cats",{endings:true}).pop().g==="s","endings -s -es -ed -ing are one tile each");

/* ---- 3. tile -> SND clip ---- */
function lastSnd(word){ var t=TW.tilesFor(word,{known:KN}); return t[t.length-1].snd; }
function snd(word,g,opts){ var t=TW.tilesFor(word,opts||{known:KN}), i; for(i=0;i<t.length;i++){ if(t[i].g===g){ return t[i].snd; } } return "none"; }
["this","that","than","then","them","with","these","those","there","their"].forEach(function(w){ ok(snd(w,"th")==="SND_10","voiced th = SND_10 in "+w); });
["thin","bath","path","math","moth","thing","think","theme","three"].forEach(function(w){ ok(snd(w,"th")==="SND_09","quiet th = SND_09 in "+w); });
ok(snd("sat","s")==="SND_11" && snd("sat","a")==="SND_25" && snd("sat","t")==="SND_03","sat -> SND_11, SND_25, SND_03");
ok(snd("cake","c")==="SND_05" && snd("city","c")==="SND_11" && snd("gem","g")==="SND_16" && snd("get","g")==="SND_06","hard/soft c and g");
ok(snd("office","c")==="SND_11" && snd("face","c")==="SND_11" && snd("huge","g")==="SND_16" && snd("page","g")==="SND_16" && snd("scene","c")==="SND_11","c and g before a silent e are soft (office, face, huge, page)");
ok(snd("book","oo")==="SND_36" && snd("food","oo")==="SND_35" && snd("snow","ow")==="SND_33" && snd("flown","ow")==="SND_33" && snd("cow","ow")==="SND_43","oo short/long, ow long-o / ow");
ok(snd("happy","y")==="SND_31" && snd("my","y")==="SND_32" && snd("yes","y")==="SND_23" && snd("he","e")==="SND_31" && snd("go","o")==="SND_33" && snd("going","o")==="SND_33","y and open-syllable vowels (going <- go)");
ok(snd("has","s")==="SND_12" && snd("cats","s",{endings:true})==="SND_11" && snd("dogs","s",{endings:true})==="SND_12","s = /s/ or /z/");
ok(snd("toys","s")==="SND_12" && snd("keys","s")==="SND_12" && snd("news","s")==="SND_12" && lastSnd("stairs")==="SND_12" && snd("hose","s")==="SND_12" && snd("noise","s")==="SND_12" && snd("reason","s")==="SND_12","a final s after a vowel is /z/ (toys, keys, news)");
ok(snd("bus","s")==="SND_11" && snd("this","s")==="SND_11" && snd("us","s")==="SND_11" && snd("yes","s")==="SND_11" && snd("plus","s")==="SND_11" && snd("texts","s")==="SND_11" && snd("huts","s")==="SND_11","...but bus, this, us, yes, plus, texts, huts end in /s/");
ok(snd("jumped","ed")==="SND_03" && snd("hugged","ed",{endings:true})==="SND_04" && snd("played","ed")==="SND_04" && snd("called","ed")==="SND_04","-ed = /t/ or /d/");
ok(snd("cake","a_e")==="SND_30" && snd("time","i_e")==="SND_32" && snd("home","o_e")==="SND_33" && snd("cube","u_e")==="SND_34" && snd("these","e_e")==="SND_31","silent e tiles -> long vowel clips");
ok(snd("night","igh")==="SND_32" && snd("match","tch")==="SND_15" && snd("back","ck")==="SND_05" && snd("long","ng")==="SND_19" && snd("shop","sh")==="SND_13" && snd("whip","wh")==="SND_22" && snd("judge","dge")==="SND_16","digraph/trigraph clips");
ok(snd("car","ar")==="SND_37" && snd("fork","or")==="SND_38" && snd("bird","ir")==="SND_39" && snd("hair","air")==="SND_40" && snd("here","ere")==="SND_41" && snd("there","ere")==="SND_40" && snd("saw","aw")==="SND_42" && snd("ball","all")==="SND_42" && snd("out","ou")==="SND_43" && snd("boy","oy")==="SND_44","r-controlled, aw/all, ou, oy clips");
ok(snd("cheer","eer")==="SND_41" && snd("talk","al")==="SND_42" && snd("scared","are")==="SND_40" && snd("word","or")==="SND_39" && snd("warm","ar")==="SND_38" && snd("school","ch")==="SND_05" && snd("knew","kn")==="SND_18" && snd("write","wr")==="SND_21","eer, alk, are+d, wor, war, school, kn, wr");
ok(snd("wanted","a")==="SND_28" && snd("watch","a")==="SND_28" && snd("wasp","a")==="SND_28" && snd("wag","a")==="SND_25","a after w = short o (wanted, watch), but wag stays short a");
/* tiles with NO single clip play nothing and show the sound as text */
var nx=TW.tilesFor("box").filter(function(t){ return t.g==="x"; })[0], ni=TW.tilesFor("hopping",{endings:true}).filter(function(t){ return t.g==="ing"; })[0], nq=TW.tilesFor("queen")[0], ne=TW.tilesFor("boxes",{endings:true}).filter(function(t){ return t.g==="es"; })[0], nr=TW.tilesFor("tired").filter(function(t){ return t.g==="ire"; })[0];
ok(nx.clip===null && nx.say==="/ks/" && ni.clip===null && ni.say==="/ing/" && nq.clip===null && nq.say==="/kw/" && ne.clip===null && ne.say==="/iz/" && nr.clip===null && nr.say==="/ire/","x, -ing, qu, -es, ire: no clip, sound shown in text");
ok(TW.tilesFor("what").every(function(t){ return t.clip===null; }),"heart/irregular words have no sound tiles");

/* ---- 4. EVERY word in data/tall-word-lists.json (build, read and heart sets) ---- */
var allTiles={}, bad=[], noclip=[], wordsSeen=0, irrBad=[];
flat.forEach(function(f){
  var p=f.pattern, opts=OP(p);
  ["build","read"].forEach(function(k){ p[k].forEach(function(w){
    wordsSeen++;
    var t=TW.tilesFor(w.w,opts);
    if(!t.length || TW.tilesToWord(t)!==TW.wordKey(w.w)){ bad.push(p.id+": "+w.w+" -> "+TW.tilesText(t)); }
    if(!w.heart){ t.forEach(function(x){
      if(x.k==="irr" && !TW.IRREGULAR[t.baseWord]){ irrBad.push(p.id+": "+w.w); }
      allTiles[x.g]=1; if(x.clip && !AUD[x.clip]){ noclip.push(w.w+":"+x.clip); } }); }
  }); });
});
L.heart.forEach(function(h){ h.words.forEach(function(w){ wordsSeen++; var t=TW.tilesFor(w.w,{known:KN}); if(TW.tilesToWord(t)!==TW.wordKey(w.w)){ bad.push(h.id+": "+w.w+" -> "+TW.tilesText(t)); } }); });
ok(wordsSeen===46*20+40,"checked all "+wordsSeen+" words (46 patterns x 20, plus 4 heart sets x 10)");
ok(bad.length===0,"every word splits into tiles that rebuild the word"+(bad.length?" :: "+bad.join("; "):""));
ok(irrBad.length===0,"no word is left as loose letters unless it is a heart word"+(irrBad.length?" :: "+irrBad.join("; "):""));
ok(noclip.length===0,"every tile's SND_xx_S clip exists in the Sounds List"+(noclip.length?" :: "+noclip.join(", "):""));
var ALLOWED={}; "b c d f g h j k l m n p q r s t v w x y z a e i o u th sh ch wh ck ng tch igh qu a_e i_e o_e u_e e_e ee ea ey ay ai oa ow oo ew ar or ore er ir ur air are ere eir ear ou aw all oi oy dge s es ed ing ff ll ss zz tt pp bb dd gg mm nn rr e ph kn wr eer al ire".split(" ").forEach(function(g){ ALLOWED[g]=1; });
var odd=Object.keys(allTiles).filter(function(g){ return !ALLOWED[g]; });
ok(odd.length===0,"every tile is on the tile list (the approved list + ph, kn, wr, eer, al, ire that the data needs)"+(odd.length?" :: "+odd.join(","):""));
/* the tiles Miquela listed are all present in the data, and nothing she did not list is invented beyond the documented additions */
["th","sh","ch","wh","ck","ng","tch","igh","a_e","i_e","o_e","u_e","e_e","ee","ea","ey","ay","ai","oa","ow","oo","ew","ar","or","ore","er","ir","ur","air","are","ere","eir","ear","ou","aw","all","oi","oy","s","es","ed","ing","x"].forEach(function(g){ ok(!!allTiles[g],"the data uses the "+g+" tile"); });

/* ---- 5. highlight: the one box that changed ---- */
function ci(a,b){ return TW.changedIndex(TW.tilesFor(a),TW.tilesFor(b)); }
ok(ci("sat","sad")===2 && ci("sad","mad")===0 && ci("mad","map")===2 && ci("sit","sip")===2 && ci("hot","hop")===2 && ci("bus","but")===2 && ci("lip","lid")===2,"highlight = the changed box (end / beginning)");
ok(ci("pin","pan")===1 && ci("top","tip")===1 && ci("sad","sod")===1,"highlight = the changed middle box");
ok(ci("at","sat")===0 && ci("shop","hop")===0 && ci("all","ball")===0,"added / merged first tile -> the first box is highlighted");
ok(TW.oneStep(TW.tilesFor("sat"),TW.tilesFor("sad")) && TW.oneStep(TW.tilesFor("at"),TW.tilesFor("sat")) && TW.oneStep(TW.tilesFor("sat"),TW.tilesFor("at")) && !TW.oneStep(TW.tilesFor("sat"),TW.tilesFor("bid")) && !TW.oneStep(TW.tilesFor("sat"),TW.tilesFor("sad s")),"oneStep: swap, add or remove exactly one tile");

/* ---- 6. distractors: same pattern, one sound apart, never just -s ---- */
var rng=(function(){ var s=12345; return function(){ s=(s*1103515245+12345)&0x7fffffff; return s/0x7fffffff; }; })();
var targets=0, dBad=[], noFirst=0, noLast=0, eligible=0;
flat.forEach(function(f){
  var p=f.pattern, pool=TW.patternPool(p), opts=OP(p), ts=TW.gameTargets(p,opts), poolKeys={};
  pool.forEach(function(w){ poolKeys[TW.wordKey(w.w)]=1; }); eligible+=ts.length;
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
      if(canFirst && !ds.some(function(d){ return TW.tilesFor(d.w,opts)[0].g===tt[0].g; })){ noFirst++; }
      if(canLast && !ds.some(function(d){ var x=TW.tilesFor(d.w,opts); return x[x.length-1].g===tt[tt.length-1].g; })){ noLast++; }
    }
  });
});
ok(eligible>300 && targets>900,"many game targets across all 46 patterns ("+eligible+" words, "+targets+" rounds tested)");
ok(dBad.length===0,"every distractor is from the pattern and differs by exactly one sound, never only -s"+(dBad.length?" :: "+dBad.slice(0,6).join("; "):""));
ok(noFirst===0 && noLast===0,"no guessing from one letter: rounds keep a wrong answer that shares the first / last tile when one exists ("+noFirst+" / "+noLast+" misses)");
ok(TW.pickDistractors("cats",[{w:"cats"},{w:"cat"},{w:"cat"},{w:"cab"},{w:"cap"}],4,rng,{endings:true}).every(function(d){ return d.w!=="cat"; }),"cat is never offered against cats (final -s only)");

/* ---- 7. WRD_ ids: unique, one per word (patterns + heart sets) ---- */
var uw=TW.uniqueWords(L), ids={}, dup=false;
uw.forEach(function(w){ if(ids[w.id]){ dup=true; } ids[w.id]=1; });
ok(!dup && uw.length>0 && uw.every(function(w){ return /^WRD_[A-Za-z-]+$/.test(w.id); }),"WRD_ ids are unique");
var distinct={}; flat.forEach(function(f){ f.pattern.build.concat(f.pattern.read).forEach(function(w){ distinct[TW.wordKey(w.w)]=1; }); }); L.heart.forEach(function(h){ h.words.forEach(function(w){ distinct[TW.wordKey(w.w)]=1; }); });
ok(uw.length===Object.keys(distinct).length,"one WRD_ id for every distinct word, build + read + heart ("+uw.length+")");
ok(TW.wordId("Sat")==="WRD_sat" && uw.some(function(w){ return w.id==="WRD_what" && w.heart; }),"WRD_sat; 'what' stays a heart word");
console.log("test-tall-words-core: "+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
