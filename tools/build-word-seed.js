// Seeds data/tall-word-lists.json from the Group 1 + Group 2 lists Miquela approved Nov 14, 2026 (pasted in chat).
// This is a STAND-IN: when TALL_Word-Lists_Level-1_v1.json (46 patterns, 11 groups, 4 heart sets) is available it replaces this file.
// * after a word = First 100 Daily Phrases word.  Words are kept exactly as approved.
var fs=require('fs');
function W(s){ return s.split(/\s+/).filter(Boolean).map(function(t){ var f=/★/.test(t), w=t.replace(/★/g,""); var o={w:w}; if(f){ o.first100=true; } return o; }); }
var P=function(id,title,spelling,build,read){ return {id:id,title:title,spelling:spelling,build:W(build),read:W(read)}; };
var g1=[
 P("short-a","Short a","a","at★ sat★ sad mad map cap can★ van fan tan","has★ at★ can★ sat★ bag jam hat pan dad ran"),
 P("short-i","Short i","i","it★ sit★ sip lip lid did★ dig big bin win","in★ if★ is★ him★ his★ kid zip fit cap ran"),
 P("short-o","Short o","o","mom★ mop top hop hot not★ got★ lot★ log dog","on★ got★ lot★ job box top nod sit★ big map"),
 P("short-u","Short u","u","up★ us★ bus but★ cut hut hug bug rug run","up★ us★ but★ sun fun gum cup job lot★ kid"),
 P("short-e","Short e","e","get★ net pet pen ten men met set wet web","get★ yes red leg bed pen pin ten tin set")];
var g2=[
 P("th","th","th","this★ thin than★ that★ hat bat bath path math moth","then★ them★ with★ than★ thin path math bus red got★"),
 P("sh","sh","sh","shut shot shop ship hip dip dish fish wish with★","shop cash rush shed dish that★ them★ this★ job yes"),
 P("ch","ch","ch","chin chip chop chap chat that★ than★ can★ cash mash","which★ much such rich chat chip cash fish them★ bus"),
 P("wh","wh","wh","which★ whiz whim whip ship shin thin then★ when★ wet","when★ which★ whip whiz whim whack wham whiff what★ wet"),
 P("ck","ck","ck","back pack pick★ kick sick sock rock lock luck duck","pick★ back neck deck check which★ them★ shop job yes"),
 P("ng","ng","ng","long★ song sing ring rang hang hung lung sung sang","long★ thing king wing bang back chip with★ this★ sun")];
// heart word flagged by Miquela's list: "what (heart word)" ; tricky = the letter that does not follow the pattern
g2[3].read.forEach(function(x){ if(x.w==="what"){ x.heart=true; x.tricky="a"; } });
var out={ title:"TALL Word Lists — Foundations / Level 1",
  version:"seed: Groups 1-2 only (11 patterns), approved Nov 14 2026. Replace with TALL_Word-Lists_Level-1_v1.json",
  copyright:"(c) 2026 Miquela Daniels, AI Academy LLC, TALL Teen Academy for Literacy & Language. Proprietary.",
  groups:[{id:"g1",title:"Short Vowels",patterns:g1},{id:"g2",title:"Digraphs",patterns:g2}],
  heartSets:[] };
fs.writeFileSync(__dirname+'/../data/tall-word-lists.json',JSON.stringify(out,null,1)+"\n");
console.log(g1.length+g2.length,"patterns written");
