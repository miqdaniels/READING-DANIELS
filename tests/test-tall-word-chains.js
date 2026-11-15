// THE BUILD RULE, strict, NO exceptions list: in every Build chain each word changes exactly ONE tile (one sound, one tile)
// from the word before: one tile swapped, added or removed. Any step that breaks it is listed and FAILS this test.
// (Words are never changed by Claude: failures are reported to Miquela, who decides.)
var fs=require('fs'), TW=require('../tall-words-core.js');
var L=TW.normalizeLists(JSON.parse(fs.readFileSync('./data/tall-word-lists.json','utf8'))), flat=TW.flatPatterns(L), KN=TW.knownSet(L);
function key(t){ return t.snd || ("t:"+(t.say||t.g)); }
function sounds(tiles){ return tiles.filter(function(t){ return t.k!=="silent"; }).map(function(t){ return {g:key(t)}; }); }
var out={A:[],B:[],C:[]}, steps=0;
flat.forEach(function(f){
  var p=f.pattern, o={endings:TW.isEndingsPattern(p),known:KN}, i, a, b, line;
  for(i=1;i<p.build.length;i++){
    steps++; a=TW.tilesFor(p.build[i-1].w,o); b=TW.tilesFor(p.build[i].w,o);
    if(TW.oneStep(a,b)){ continue; }
    line="  "+p.id+": "+p.build[i-1].w+" -> "+p.build[i].w+"   ["+TW.tilesText(a)+"] -> ["+TW.tilesText(b)+"]";
    if(/^(ed|ing|two-part)$/.test(p.id)){ out.A.push(line); } else if(TW.oneStep(sounds(a),sounds(b))){ out.B.push(line); } else { out.C.push(line); }
  }
});
var n=out.A.length+out.B.length+out.C.length;
console.log("Build chains: "+flat.length+" patterns, "+steps+" steps checked. Steps that break the one-sound / one-tile rule: "+n);
if(out.A.length){ console.log("\nA) Not a one-sound chain by design (base + ending pairs, or unrelated words) ("+out.A.length+"):\n"+out.A.join("\n")); }
if(out.B.length){ console.log("\nB) ONE sound changes, but a vowel's SPELLING changes too, so two tiles differ ("+out.B.length+"):\n"+out.B.join("\n")); }
if(out.C.length){ console.log("\nC) More than one sound changes ("+out.C.length+"):\n"+out.C.join("\n")); }
console.log("\ntest-tall-word-chains: "+(n?"FAIL: "+n+" chain step(s) break the rule":"every Build chain passes the one-sound rule with no exceptions"));
process.exit(n?1:0);
