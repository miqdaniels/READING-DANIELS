const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8');

const dom=new JSDOM(html,{url:"https://miqdaniels.github.io/READING-DANIELS/",runScripts:"dangerously",pretendToBeVisual:true,
  beforeParse(w){ w.HTMLElement.prototype.scrollIntoView=function(){}; w.scrollTo=function(){}; }
});
const w=dom.window, d=w.document;

let pass=0,fail=0;
function ck(c,m){ if(c){pass++;} else {fail++; console.log("FAIL:",m);} }

ck(d.title==="Reading Foundations","browser tab title is Reading Foundations (got '"+d.title+"')");

w.CURCLASS=w.CLASSES[0]; w.READER=w.CLASSES[0].students[0]; w.CURGROUP=w.GROUPS[0];
var studentScreens=["s-home","s-pick","s-roster","studentMenu","s-groups","s-final","s-score","s-board","s-status","fluencyPassage","fluencyRetell","diagLanding","check1"];
var i;
for(i=0;i<studentScreens.length;i++){
  w.go(studentScreens[i]);
  var h1=d.querySelector("header.app h1");
  ck(!!h1 && h1.textContent==="Reading Foundations","'Reading Foundations' shows at the top of "+studentScreens[i]+" (got '"+(h1?h1.textContent:null)+"')");
}

console.log("\n=== "+pass+" passed, "+fail+" failed ===");
process.exit(fail?1:0);
