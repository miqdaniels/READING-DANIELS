const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8');

const dom=new JSDOM(html,{url:"https://miqdaniels.github.io/READING-DANIELS/",runScripts:"dangerously",pretendToBeVisual:true,
  beforeParse(w){ w.HTMLElement.prototype.scrollIntoView=function(){}; w.scrollTo=function(){}; }
});
const w=dom.window, d=w.document;

let pass=0,fail=0;
function ck(c,m){ if(c){pass++;} else {fail++; console.log("FAIL:",m);} }

ck(d.title==="Reading Foundations for Teens","browser tab title is 'Reading Foundations for Teens' (got '"+d.title+"')");

w.CURCLASS=w.CLASSES[0]; w.READER=w.CLASSES[0].students[0]; w.CURGROUP=w.GROUPS[0];
var studentScreens=["s-home","s-pick","s-roster","s-confirm","studentMenu","s-groups","s-final","s-score","s-board","s-status","fluencyPassage","fluencyRetell","diagLanding","check1"];
var i;
w.PENDING_STU=w.CLASSES[0].students[0];
for(i=0;i<studentScreens.length;i++){
  w.go(studentScreens[i]);
  var h1=d.querySelector("header.app h1");
  ck(!!h1 && h1.textContent==="READING FOUNDATIONS FOR TEENS","'READING FOUNDATIONS FOR TEENS' shows at the top of "+studentScreens[i]+" (got '"+(h1?h1.textContent:null)+"')");
  var byline=d.querySelector("header.app .byline");
  ck(!!byline && byline.textContent==="by AI Academy","'by AI Academy' shows under the title on "+studentScreens[i]+" (got '"+(byline?byline.textContent:null)+"')");
  ck(!h1.hasAttribute("onclick") && h1.tagName!=="A" && h1.tagName!=="BUTTON","the title itself is not tappable on "+studentScreens[i]);
  ck(!byline.hasAttribute("onclick") && byline.tagName!=="A" && byline.tagName!=="BUTTON","the byline itself is not tappable on "+studentScreens[i]);
}

console.log("\n=== "+pass+" passed, "+fail+" failed ===");
process.exit(fail?1:0);
