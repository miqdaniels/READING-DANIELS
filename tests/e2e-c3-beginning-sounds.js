/* REAL-BROWSER check for Check 3 > What to Teach Next > Beginning Sounds (not part of `npm test`).
   Needs Playwright + Chromium, poppler (pdfinfo/pdftotext/pdftoppm) and a static server serving the repo root.
   Usage: node tests/e2e-c3-beginning-sounds.js <baseUrl> <outDir>   e.g.  node tests/e2e-c3-beginning-sounds.js http://127.0.0.1:8765 /tmp/c3shots
   Proves what jsdom cannot: real clicks through the hub, no horizontal scroll and touch-size controls at desktop and
   tablet sizes, the print stylesheet really produces 3 / 2 / 1 Letter pages, the Word download really delivers the
   approved file, and a student session never receives the lesson. NOT proven here: a physical printer, a physical
   iPad/Chromebook, native Word rendering of the .docx. */
const {chromium}=require('/opt/node-tools/node_modules/playwright'); const fs=require('fs'), crypto=require('crypto'), cp=require('child_process');
const base=process.argv[2], out=process.argv[3]; fs.mkdirSync(out,{recursive:true});
let pass=0, fail=0; function ok(c,m){ if(c){pass++; console.log("PASS "+m);} else {fail++; console.log("FAIL "+m);} }
const SHA="edc19e537a3f48f665b0fd280d086cc96b8ac1737ddd46fb9c65d09f0ed149e9";
const VIEWS={ desktop:{width:1366,height:768}, desktopHD:{width:1920,height:1080}, tabletLandscape:{width:1024,height:768}, tabletPortrait:{width:768,height:1024}, phone:{width:390,height:844} };

async function boot(browser, vp, search){
  const ctx=await browser.newContext({viewport:vp, acceptDownloads:true}); const p=await ctx.newPage(); const errs=[];
  p.on('pageerror',function(e){ if(!/play\(\) request was interrupted/.test(e.message)){ errs.push(e.message); } }); p.on('console',function(m){ /* the 'play() interrupted by pause()' message is pre-existing: the app's own stopAllAudio() on a fast screen change, identical on the untouched code */
    if(m.type()==='error' && !/favicon|Failed to load resource|play\(\) request was interrupted/.test(m.text())){ errs.push(m.text()); } });
  await p.goto(base+'/index.html'+search,{waitUntil:'load'}); await p.waitForFunction(function(){ return typeof go==='function'; });
  return {ctx:ctx,p:p,errs:errs};
}
async function active(p){ return p.evaluate(function(){ var s=document.getElementsByClassName('screen'), i; for(i=0;i<s.length;i++){ if(/active/.test(s[i].className)){ return s[i].id; } } }); }
async function viaHub(p){ /* the real route a teacher takes */
  await p.click('#tn-feature-btn'); await p.click('.tn-card[data-check="3"]'); await p.click('#c3n-open-bs'); }
function pdfInfo(file){ var info=cp.execFileSync('pdfinfo',[file]).toString(); return { pages:+/Pages:\s+(\d+)/.exec(info)[1], size:/Page size:\s+([^\n]+)/.exec(info)[1] }; }
function pdfPage(file,n){ return cp.execFileSync('pdftotext',['-f',String(n),'-l',String(n),'-layout',file,'-']).toString().replace(/\s+/g,' '); }

(async()=>{
 const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});

 /* ---------- layouts + touch targets at every size ---------- */
 for(const name of Object.keys(VIEWS)){
   const B=await boot(browser,VIEWS[name],'?teacher'); const p=B.p;
   await viaHub(p); ok(await active(p)==='c3Bs',name+": hub -> Check 3 -> Open Beginning Sounds by real clicks");
   for(const n of [1,2,3]){
     await p.click('#c3bs-tab-'+n); await p.waitForTimeout(50);
     const m=await p.evaluate(function(n){
       var vis=document.getElementById('c3bs-panel-'+n), btns=Array.prototype.slice.call(document.querySelectorAll('#c3Bs button:not([hidden]), #c3Bs a.pill-btn')).filter(function(b){ return b.offsetParent!==null; }),
           tbl=Array.prototype.slice.call(vis.querySelectorAll('table')), small=btns.filter(function(b){ var r=b.getBoundingClientRect(); return r.height<44; }).map(function(b){ return b.id||b.textContent; }),
           clip=tbl.filter(function(t){ var r=t.getBoundingClientRect(); return r.right>window.innerWidth+1 || t.scrollWidth>t.clientWidth+1; }).length,
           ff=getComputedStyle(vis).fontFamily, h3=vis.querySelector('.c3bs-h3'), th=vis.querySelector('th');
       return { sw:document.documentElement.scrollWidth, iw:window.innerWidth, small:small, clip:clip, ff:ff, navy:getComputedStyle(h3).color, thbg:getComputedStyle(th).backgroundColor, left:getComputedStyle(vis.querySelector('td')).textAlign,
                fs:parseFloat(getComputedStyle(vis.querySelector('td')).fontSize), pad:parseFloat(getComputedStyle(vis.querySelector('td')).paddingLeft) };
     },n);
     ok(m.sw<=m.iw,name+" section "+n+": no horizontal scroll ("+m.sw+" <= "+m.iw+")");
     ok(m.small.length===0,name+" section "+n+": every control at least 44px tall"+(m.small.length?" -- "+m.small.join("|"):""));
     ok(m.clip===0,name+" section "+n+": no table cut off");
     ok(/Arial/.test(m.ff),name+" section "+n+": Arial font");
     ok(m.navy==='rgb(24, 55, 88)' && m.thbg==='rgb(24, 55, 88)',name+" section "+n+": navy headings and table headers ("+m.navy+")");
     ok(m.left==='left' && m.pad>=10 && m.fs>=(name==='phone'?16:18),name+" section "+n+": left-aligned, padded, large text ("+m.fs+"px / pad "+m.pad+")");
     await p.screenshot({path:out+'/'+name+'-section'+n+'.png',fullPage:true});
   }
   ok(B.errs.length===0,name+": no page errors ("+B.errs.join("; ")+")");
   await B.ctx.close();
 }

 /* ---------- navigation by real clicks ---------- */
 { const B=await boot(browser,VIEWS.tabletLandscape,'?teacher'); const p=B.p; await viaHub(p);
   const sel=async function(){ return p.evaluate(function(){ return [1,2,3].map(function(i){ return document.getElementById('c3bs-tab-'+i).getAttribute('aria-selected')==='true' && !document.getElementById('c3bs-panel-'+i).hidden; }).join(); }); };
   ok(await sel()==='true,false,false',"opens on section 1");
   await p.click('#c3bs-next-1'); ok(await sel()==='false,true,false',"Next section -> 2");
   await p.click('#c3bs-next-2'); ok(await sel()==='false,false,true',"Next section -> 3");
   await p.click('#c3bs-prev-3'); ok(await sel()==='false,true,false',"Previous section -> 2");
   await p.click('#c3bs-prev-2'); ok(await sel()==='true,false,false',"Previous section -> 1");
   await p.focus('#c3bs-tab-1'); await p.keyboard.press('Tab'); ok(await p.evaluate(function(){ return document.activeElement.id; })==='c3bs-tab-2',"Tab key reaches the next section tab");
   await p.keyboard.press('Enter'); ok(await sel()==='false,true,false',"Enter on a focused tab opens it");
   await p.click('#c3bs-back-check3'); ok(await active(p)==='c3Next',"Back to Check 3 resources");
   await p.click('#c3n-open-bs'); await p.click('#c3Bs .tn-nav button:nth-child(2)'); ok(await active(p)==='teachNext',"Back to What to Teach Next");
   await p.click('.tn-card[data-check="3"]'); await p.click('#c3n-open-bs'); await p.click('#c3Bs .tn-nav button:nth-child(3)'); ok(await active(p)==='s-home',"Back to Teacher Dashboard");
   await p.click('#tn-feature-btn'); await p.click('.tn-card[data-check="3"]'); await p.click('#c3Next .tn-nav button:nth-child(1)'); ok(await active(p)==='teachNext',"Check 3 page: Back to What to Teach Next");
   await p.click('.tn-card[data-check="4"]'); ok(await active(p)==='tnCheck',"Check 4 still shows its own 'being developed' page");
   ok(B.errs.length===0,"navigation: no page errors"); await B.ctx.close(); }

 /* ---------- real print layout: Letter pages ---------- */
 { const B=await boot(browser,VIEWS.desktop,'?teacher'); const p=B.p; await viaHub(p);
   await p.evaluate(function(){ window.__printed=[]; window.print=function(){ window.__printed.push(document.getElementById('c3bs-print').className); }; });
   await p.click('#c3bs-print-all'); await p.click('#c3bs-print-teach'); await p.click('#c3bs-print-obs');
   ok((await p.evaluate(function(){ return window.__printed.join(); }))==='c3bs-m-all,c3bs-m-teach,c3bs-m-obs',"real clicks on the three print buttons request all / teaching / observation-only");
   const modes={ all:3, teach:2, obs:1 };
   for(const mode of Object.keys(modes)){
     await p.evaluate(function(m){ c3bsSetMode(m); },mode); await p.emulateMedia({media:'print'});
     const f=out+'/print-'+mode+'.pdf'; await p.pdf({path:f,preferCSSPageSize:true,printBackground:true});
     const info=pdfInfo(f); ok(info.pages===modes[mode],"print mode '"+mode+"' produces exactly "+modes[mode]+" page(s) (got "+info.pages+")");
     ok(/612 x 792/.test(info.size),"print mode '"+mode+"' is US Letter ("+info.size+")");
     if(mode==='all'){
       const t1=pdfPage(f,1), t2=pdfPage(f,2), t3=pdfPage(f,3);
       ok(/BEGINNING SOUNDS/.test(t1) && /PAGE 1 OF 3/.test(t1) && /INDEPENDENT PRACTICE/.test(t1) && /hat/.test(t1) && !/TEACHER SUPPORT/.test(t1),"PDF page 1 = lesson, ends with Independent Practice, nothing from page 2");
       ok(/TEACHER SUPPORT/.test(t2) && /PAGE 2 OF 3/.test(t2) && /IMPORTANT REMINDERS/.test(t2) && /targeted rechecks/.test(t2) && /diagnostic words OUT/.test(t2) && !/OBSERVE/.test(t2),"PDF page 2 = Teacher Support, complete through the reminders");
       ok(/OBSERVATION AND NEXT STEP/.test(t3) && /PAGE 3 OF 3/.test(t3) && /NOT THE SCORED CHECK 3 DIAGNOSTIC/.test(t3) && /NOTES \/ NEXT INSTRUCTIONAL TARGET/.test(t3),"PDF page 3 = Observation and Next Step, complete through the notes lines");
       ok(/AI ACADEMY LLC/.test(t1+t2+t3) && (t1.match(/CHECK 3 • BEGINNING SOUNDS/)||[]).length===1 && (t3.match(/CHECK 3 • BEGINNING SOUNDS/)||[]).length===1,"header and footer on the printed pages");
     }
     if(mode==='obs'){ const t=pdfPage(f,1); ok(/OBSERVATION AND NEXT STEP/.test(t) && /PAGE 3 OF 3/.test(t) && !/GUIDED PRACTICE|TEACHER SUPPORT/.test(t) && /team/.test(t) && /hat/.test(t),"observation-only PDF holds just the observation sheet"); }
     if(mode==='teach'){ const t=pdfPage(f,1)+pdfPage(f,2); ok(/PAGE 1 OF 3/.test(t) && /PAGE 2 OF 3/.test(t) && !/OBSERVATION AND NEXT STEP/.test(t),"teaching-pages PDF holds pages 1-2 only"); }
     cp.execFileSync('pdftoppm',['-r','70','-png',f,out+'/print-'+mode]);
     await p.emulateMedia({media:'screen'});
   }
   /* other printing in the app is unaffected: the Check 1 print block still exists untouched */
   ok(await p.evaluate(function(){ return typeof c1nPrint==='function'; }),"Check 1 print function untouched");
   ok(B.errs.length===0,"printing: no page errors"); await B.ctx.close(); }

 /* ---------- Word download ---------- */
 { const B=await boot(browser,VIEWS.desktop,'?teacher'); const p=B.p; await viaHub(p);
   for(const sel of ['#c3bs-docx']){ const [dl]=await Promise.all([p.waitForEvent('download'),p.click(sel)]); const f=out+'/'+dl.suggestedFilename(); await dl.saveAs(f);
     ok(dl.suggestedFilename()==='Beginning_Sounds_v06_EDITABLE.docx',"lesson page download is named Beginning_Sounds_v06_EDITABLE.docx");
     ok(crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')===SHA,"downloaded .docx is byte-identical to the approved v0.6 file"); }
   await p.click('#c3bs-back-check3'); const [dl2]=await Promise.all([p.waitForEvent('download'),p.click('#c3n-bs-docx')]); await dl2.saveAs(out+'/landing.docx');
   ok(crypto.createHash('sha256').update(fs.readFileSync(out+'/landing.docx')).digest('hex')===SHA,"Check 3 resources page download is the same approved file");
   const conv=cp.spawnSync('soffice',['--headless','--convert-to','pdf','--outdir',out+'/docxpdf',out+'/landing.docx']); ok(fs.existsSync(out+'/docxpdf/landing.pdf') && pdfInfo(out+'/docxpdf/landing.pdf').pages===3,"downloaded .docx opens (LibreOffice) as a 3-page document");
   await B.ctx.close(); }

 /* ---------- student session ---------- */
 { const B=await boot(browser,VIEWS.tabletLandscape,''); const p=B.p;
   const m=await p.evaluate(function(){ return { screen:document.querySelector('.screen.active').id, panel:document.getElementById('c3bs-panel-1').textContent.trim(), print:document.getElementById('c3bs-print').innerHTML, visible:/Beginning Sounds|c3Bs/.test(document.querySelector('.screen.active').innerText) }; });
   ok(m.screen==='s-pick' && m.panel==='' && m.print==='' && !m.visible,"student session: picker shown, lesson never built, no practice words or answers in the page");
   ok(await p.evaluate(function(){ var t=[], s=document.querySelectorAll('section.screen:not([data-teacher="1"])'), i; for(i=0;i<s.length;i++){ t.push(s[i].id); } return t.length>5 && !document.querySelector('section.screen:not([data-teacher="1"]) [id^="c3bs"]'); }),"no lesson element lives inside a student screen");
   ok(B.errs.length===0,"student session: no page errors"); await B.ctx.close(); }

 /* ---------- regression smoke: every existing check screen still opens ---------- */
 { const B=await boot(browser,VIEWS.desktop,'?teacher'); const p=B.p;
   for(const id of ['check1','check2','check3','check4','check5','check6','check7','check1Teach','check2Teach','check3Teach','c1Next','c2Next','s-teachC3','teachNext']){
     await p.evaluate(function(id){ go(id); },id); ok(await active(p)===id,"existing screen "+id+" still opens"); }
   ok(B.errs.length===0,"regression: no page errors ("+B.errs.join("; ")+")"); await B.ctx.close(); }

 await browser.close();
 console.log("e2e c3 beginning sounds: "+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
})().catch(function(e){ console.log("CRASH",e); process.exit(2); });
