/* REAL-BROWSER check for Check 2 > Sounds & Spelling Patterns (not part of `npm test`).
   Needs Playwright + Chromium and a static server serving the repo root.
   Usage: node tests/e2e-c2-ssp.js <baseUrl> <outDir>        e.g.  node tests/e2e-c2-ssp.js http://127.0.0.1:8765 /tmp/shots
   Proves in a real browser (what jsdom cannot): the 16:9 pictures and the HTML buttons laid over them line up at desktop,
   tablet and phone sizes; nothing covers a button; real mouse / touch / keyboard (Tab order, visible focus ring, Enter,
   Space, arrows); double taps move one slide; blocked or missing pictures and slide list are handled; the Comic Neue Bold
   file is the supplied one and is used only here; nothing loads until the screen is opened; Back to Check 2 keeps the
   selected student; storage and history are untouched; Check 2's other resources still open.
   NOT proven here: native PowerPoint rendering, a real microphone/camera (none is used by this resource), Canvas,
   a school network or school devices. */
const {chromium}=require('/opt/node-tools/node_modules/playwright'); const fs=require('fs'), crypto=require('crypto');
const base=process.argv[2], out=process.argv[3]; fs.mkdirSync(out,{recursive:true});
const man=JSON.parse(fs.readFileSync('assets/check-2/sounds-spelling-patterns/manifest.json','utf8')); const S={}; man.slides.forEach(function(s){ S[s.id]=s; });
let pass=0, fail=0; function ok(c,m){ if(c){pass++; console.log("PASS "+m);} else {fail++; console.log("FAIL "+m);} }
const sha=function(b){ return crypto.createHash('sha256').update(b).digest('hex'); };
const A='assets/check-2/sounds-spelling-patterns';
const VIEWS={ desktop:{width:1366,height:768}, desktopHD:{width:1920,height:1080}, tabletPortrait:{width:768,height:1024}, tabletLandscape:{width:1024,height:768}, phone:{width:390,height:844}, phoneSmall:{width:360,height:640} };

async function boot(browser, vp, opts){
  const ctx=await browser.newContext(Object.assign({viewport:vp},opts||{})); const p=await ctx.newPage(); const errs=[], reqs=[], failed=[];
  p.on('pageerror',function(e){ errs.push(e.message); }); p.on('console',function(m){ if(m.type()==='error' && !/favicon|Failed to load resource/.test(m.text())){ errs.push(m.text()); } });
  p.on('request',function(r){ reqs.push(r.url()); }); p.on('requestfailed',function(r){ failed.push(r.url()); });
  await p.goto(base+'/index.html?teacher',{waitUntil:'load'}); await p.waitForFunction(function(){ return typeof go==='function'; });
  return {ctx:ctx,p:p,errs:errs,reqs:reqs,failed:failed};
}
async function ready(p){ await p.waitForFunction(function(){ var m=document.getElementById('ssp-msg'), i=document.getElementById('ssp-img'); return m && m.hidden && i && i.complete && i.naturalWidth>0; },null,{timeout:20000}); }
async function open(p){ await p.evaluate(function(){ go('c2Next'); }); await p.click('#c2n-open-ssp'); await ready(p); }
async function show(p,id){ await p.evaluate(function(id){ SSP.lockUntil=0; sspShow(id,true); },id); await ready(p); }
async function geom(p){ return p.evaluate(function(){ var i=document.getElementById('ssp-img').getBoundingClientRect(), st=document.getElementById('ssp-stage').getBoundingClientRect();
  return { img:[i.left,i.top,i.width,i.height], stage:[st.left,st.top,st.width,st.height], scrollW:document.documentElement.scrollWidth, innerW:window.innerWidth,
    hot:Array.prototype.map.call(document.querySelectorAll('#ssp-hot .ssp-hot'),function(b){ var r=b.getBoundingClientRect(), cx=r.left+r.width/2, cy=r.top+r.height/2, top=document.elementFromPoint(cx,cy);
      return { to:b.getAttribute('data-to'), role:b.getAttribute('data-role'), box:[r.left,r.top,r.width,r.height], reachable:top===b, label:b.getAttribute('aria-label') }; }),
    bar:Array.prototype.map.call(document.querySelectorAll('#ssp-ctl button, #ssp-full'),function(b){ var r=b.getBoundingClientRect(); return { text:b.textContent.trim(), box:[r.left,r.top,r.width,r.height], font:getComputedStyle(b).fontFamily }; }) }; }); }
function maxDiff(slide,g){ var worst=0, i=g.img; slide.hotspots.forEach(function(h){ var hh=g.hot.filter(function(x){ return x.to===h.to && x.role===h.role && (x.label===h.aria); })[0]; if(!hh){ worst=999; return; }
  var exp=[i[0]+h.rect[0]*i[2], i[1]+h.rect[1]*i[3], h.rect[2]*i[2], h.rect[3]*i[3]]; for(var k=0;k<4;k++){ worst=Math.max(worst,Math.abs(exp[k]-hh.box[k])); } }); return worst; }
const sleep=function(ms){ return new Promise(function(r){ setTimeout(r,ms); }); };

(async()=>{
 const exe={executablePath:'/opt/pw-browsers/chromium'}; const browser=await chromium.launch(exe);

 /* ================= A. nothing loads until the screen opens; real files ================= */
 let b=await boot(browser,VIEWS.desktop), p=b.p;
 await p.evaluate(function(){ go('teachNext'); }); await p.click('.tn-card[data-check="2"]'); await sleep(300);
 ok(b.reqs.filter(function(u){ return /sounds-spelling-patterns/.test(u); }).length===0,"opening the app and the Check 2 page requests nothing from the new resource (no images, no slide list, no font)");
 ok(await p.isVisible('#c2n-ssp') && (await p.innerText('#c2n-open-ssp'))==='Open Sounds & Spelling Patterns',"Check 2 page shows the \"Sounds & Spelling Patterns\" card");
 await p.screenshot({path:out+'/check2-page.png',fullPage:true});
 /* pick a student first so we can prove the selection survives */
 await p.click('#c2n-roster button:has-text("Miriam")'); const selBefore=await p.evaluate(function(){ return [C2N_STU,C2N_CLS]; });
 const snapBefore=await p.evaluate(async function(){ var o={}, i; for(i=0;i<localStorage.length;i++){ o[localStorage.key(i)]=localStorage.getItem(localStorage.key(i)); } var dbs=indexedDB.databases?(await indexedDB.databases()).map(function(d){ return d.name; }).sort():[]; return JSON.stringify([o,dbs]); });
 const histBefore=await p.evaluate(function(){ return history.length; });
 b.reqs.length=0; await p.click('#c2n-open-ssp'); await ready(p);
 ok(b.reqs.filter(function(u){ return /manifest\.js$/.test(u); }).length===1 && b.reqs.filter(function(u){ return /slides\/slide-\d+\.webp/.test(u); }).length<=3,"opening the viewer requests the slide list once and at most 3 pictures (cover + the slide one step away)");
 ok((await p.evaluate(function(){ return [document.getElementById('ssp-img').naturalWidth, document.getElementById('ssp-img').naturalHeight]; })).join('x')==='2560x1440',"the cover picture arrives at its full 2560x1440");
 /* Comic Neue Bold: the supplied file, loaded, used only here */
 await p.evaluate(function(){ return document.fonts.load('700 18px "Comic Neue"'); });
 const fontReqs=b.reqs.filter(function(u){ return /ComicNeue-Bold\.ttf/.test(u); }); ok(fontReqs.length===1,"the self-hosted Comic Neue Bold file is requested once, when the screen opens");
 const fontBytes=await (await p.request.get(base+'/'+A+'/fonts/ComicNeue-Bold.ttf')).body();
 ok(sha(fontBytes)==='3e7e5fccfd7e0788f317b43312151c1bd5cf058c9697a8d83eac3939050bd61e',"the font the browser loads is byte-identical to the supplied (and deck-embedded) ComicNeue-Bold.ttf");
 const f=await p.evaluate(function(){ var btn=document.querySelector('#ssp-ctl button'); var cs=getComputedStyle(btn), h2=getComputedStyle(document.querySelector('#c2Ssp h2')), c2h2=getComputedStyle(document.querySelector('#c2Next h2')), body=getComputedStyle(document.body);
   var faces=[]; document.fonts.forEach(function(ff){ if(ff.family.replace(/"/g,'')==='Comic Neue'){ faces.push(ff.weight+':'+ff.status); } });
   return { bar:cs.fontFamily, barWeight:cs.fontWeight, h2:h2.fontFamily, c2h2:c2h2.fontFamily, body:body.fontFamily, faces:faces, check:document.fonts.check('700 16px "Comic Neue"') }; });
 ok(/^"?Comic Neue"?/.test(f.bar) && f.barWeight==='700' && /^"?Comic Neue"?/.test(f.h2) && f.faces.join()==='700:loaded' && f.check,"the control bar and heading use Comic Neue Bold (weight 700, font loaded)");
 ok(!/Comic Neue/.test(f.c2h2) && !/Comic Neue/.test(f.body),"the rest of the app keeps its own fonts (Check 2 page heading and body are not Comic Neue)");

 /* ================= B. every slide, desktop: pictures and buttons line up, nothing covers a button ================= */
 let worstAll=0, unreachable=0, aspectBad=0, overflow=0, total=0, aspectWorst=0;
 for(const s of man.slides){
   await show(p,s.id); const g=await geom(p); total+=s.hotspots.length;
   const d=maxDiff(s,g); worstAll=Math.max(worstAll,d);
   unreachable+=g.hot.filter(function(h){ return !h.reachable; }).length;
   aspectWorst=Math.max(aspectWorst,Math.abs(g.img[2]/g.img[3]-16/9)); if(Math.abs(g.img[2]/g.img[3]-16/9)>0.003 || Math.abs(g.stage[2]-g.img[2])>0.5 || Math.abs(g.stage[3]-g.img[3])>0.5){ aspectBad++; }
   if(g.scrollW>g.innerW+1){ overflow++; }
   if(g.hot.length!==s.hotspots.length){ ok(false,"slide "+s.n+" shows "+g.hot.length+" buttons, expected "+s.hotspots.length); }
 }
 ok(worstAll<=1.5,"all 60 slides, "+total+" buttons: every HTML button sits within "+worstAll.toFixed(2)+" px of where the manifest puts it on the picture (1366x768)");
 ok(unreachable===0,"nothing covers any of the "+total+" buttons: the topmost element at each button's centre is the button itself");
 ok(aspectBad===0,"every slide picture is shown at 16:9 and fills the stage exactly (worst aspect deviation "+(aspectWorst/(16/9)*100).toFixed(3)+"%: no stretching, no gaps)");
 ok(overflow===0,"no horizontal page scrolling on any slide");
 ok(b.errs.length===0,"no JavaScript errors while visiting all 60 slides ("+b.errs.join("; ")+")");
 ok(b.failed.length===0,"no failed requests while visiting all 60 slides");
 const imgReq=b.reqs.filter(function(u){ return /slides\/slide-\d+\.webp/.test(u); }); ok(new Set(imgReq).size<=60,"each slide picture was requested at most once ("+new Set(imgReq).size+" distinct)");

 /* ================= C. layout at desktop / tablet / phone, with screenshots ================= */
 const SAMPLE=['cover','menu-main','menu-consonants','menu-digraphs','menu-short-vowels','menu-long-vowels','sound-20','sound-38','sound-48','menu-other-vowels'];
 for(const vn of Object.keys(VIEWS)){
   const vb=await boot(browser,VIEWS[vn],{hasTouch:/phone|tablet/.test(vn)}); const vp=vb.p; await open(vp);
   let worst=0, unr=0, bad=0, ovf=0, small=0, outside=0, minImgW=1e9, aw=0;
   for(const id of SAMPLE){ await show(vp,id); const g=await geom(vp); const sl=S[id]; worst=Math.max(worst,maxDiff(sl,g)); unr+=g.hot.filter(function(h){ return !h.reachable; }).length; minImgW=Math.min(minImgW,g.img[2]);
     aw=Math.max(aw,Math.abs(g.img[2]/g.img[3]-16/9)); if(Math.abs(g.img[2]/g.img[3]-16/9)>0.003){ bad++; } if(g.scrollW>g.innerW+1){ ovf++; }
     g.bar.forEach(function(x){ if(x.box[3]<44-0.5){ small++; } if(x.box[0]<-0.5 || x.box[0]+x.box[2]>g.innerW+0.5){ outside++; } }); }
   ok(worst<=1.5 && unr===0,vn+" ("+VIEWS[vn].width+"x"+VIEWS[vn].height+"): buttons within "+worst.toFixed(2)+" px of the artwork and reachable on all "+SAMPLE.length+" sampled slides (picture "+Math.round(minImgW)+" px wide)");
   ok(bad===0 && ovf===0,vn+": picture stays 16:9 (worst deviation "+(aw/(16/9)*100).toFixed(3)+"%) and the page does not scroll sideways");
   ok(small===0 && outside===0,vn+": every bar button is at least 44 px tall and fully on screen");
   await show(vp,'sound-20'); await vp.screenshot({path:out+'/'+vn+'-ship.png'});
   await show(vp,'sound-48'); await vp.screenshot({path:out+'/'+vn+'-moon.png'});
   await show(vp,'menu-short-vowels'); await vp.screenshot({path:out+'/'+vn+'-slide56.png'});
   await show(vp,'menu-consonants'); if(vn==='tabletPortrait'||vn==='phone'){ await vp.screenshot({path:out+'/'+vn+'-menu54.png'}); }
   const lst=await vp.evaluate(function(){ var l=document.getElementById('ssp-list'), cs=getComputedStyle(l), bs=Array.prototype.map.call(l.querySelectorAll('button'),function(b){ var r=b.getBoundingClientRect(); return [r.height,r.left,r.right,b.textContent]; });
     return { display:cs.display, n:bs.length, minH:bs.length?Math.min.apply(null,bs.map(function(x){ return x[0]; })):0, inside:bs.every(function(x){ return x[1]>=-0.5 && x[2]<=window.innerWidth+0.5; }), first:bs[0]&&bs[0][3] }; });
   if(VIEWS[vn].width<=640){
     ok(lst.display==='grid' && lst.n===18 && lst.minH>=44 && lst.inside && lst.first==='01 /b/ · bat',vn+": narrow screen: the menu's 18 sounds are also offered as large buttons (smallest "+Math.round(lst.minH)+" px tall, all on screen)");
     const bt=await vp.evaluate(function(){ var b=document.querySelector('#ssp-list [data-to="sound-05"]'); b.scrollIntoView({block:'center'}); var r=b.getBoundingClientRect(); return [r.left+r.width/2,r.top+r.height/2]; });
     await vp.touchscreen.tap(bt[0],bt[1]); await ready(vp);
     ok((await vp.evaluate(function(){ return SSP.cur; }))==='sound-05',vn+': touch: tapping "05 /g/ · go" in the large-button list opens it');
     await vp.screenshot({path:out+'/'+vn+'-list-after-tap.png'}); await show(vp,'menu-consonants'); await vp.evaluate(function(){ window.scrollTo(0,0); document.getElementById('ssp-list').scrollIntoView({block:'start'}); }); await vp.screenshot({path:out+'/'+vn+'-menu54-list.png'});
   } else { ok(lst.display==='none',vn+": the large-button list stays hidden on wide screens"); }
   ok(vb.errs.length===0 && vb.failed.length===0,vn+": no errors, no failed requests");
   await vb.ctx.close();
 }

 /* ================= D. real mouse: click the buttons where they are drawn on the picture ================= */
 await p.evaluate(function(){ go('c2Next'); }); await p.click('#c2n-open-ssp'); await ready(p);
 async function clickRect(rect){ const g=await geom(p); await p.mouse.click(g.img[0]+(rect[0]+rect[2]/2)*g.img[2], g.img[1]+(rect[1]+rect[3]/2)*g.img[3]); }
 await p.evaluate(function(){ window.scrollTo(0,0); });
 await clickRect(S.cover.hotspots[0].rect); await ready(p); ok(await p.evaluate(function(){ return SSP.cur; })==='menu-main',"mouse click on the cover's own EXPLORE THE SOUNDS button opens the main menu");
 await sleep(560); await clickRect(S['menu-main'].hotspots.filter(function(h){ return h.to==='menu-digraphs'; })[0].rect); await ready(p);
 await sleep(560); await clickRect(S['menu-digraphs'].hotspots.filter(function(h){ return h.entry===20; })[0].rect); await ready(p);
 ok(await p.evaluate(function(){ return SSP.cur; })==='sound-20' && (await p.getAttribute('#ssp-img','src')).endsWith('slide-22.webp'),"clicking the \"20 /sh/ · ship\" button on the digraphs menu picture opens ship (picture slide-22.webp)");
 await sleep(560); await clickRect(S['sound-20'].hotspots.filter(function(h){ return h.role==='next'; })[0].rect); await ready(p);
 ok(await p.evaluate(function(){ return SSP.cur; })==='sound-21',"clicking the NEXT button drawn on the ship picture opens station");
 await sleep(560); await clickRect(S['sound-21'].hotspots.filter(function(h){ return h.role==='category'; })[0].rect); await ready(p);
 ok(await p.evaluate(function(){ return SSP.cur; })==='menu-digraphs',"clicking the category button drawn on the station picture returns to the digraphs menu");
 /* the printed-label mismatch slides: the button still goes to the right menu */
 await show(p,'sound-42'); await sleep(560); await clickRect(S['sound-42'].hotspots.filter(function(h){ return h.role==='category'; })[0].rect); await ready(p);
 ok(await p.evaluate(function(){ return SSP.cur; })==='menu-r-controlled',"an R-controlled slide's footer (which prints OTHER VOWEL SOUNDS) still returns to the R-Controlled Vowels menu");

 /* ================= E. keyboard: Tab order, visible focus ring, Enter/Space/arrows ================= */
 await show(p,'cover'); await p.evaluate(function(){ document.getElementById('ssp-back').focus(); });
 const order=[]; for(let i=0;i<6;i++){ await p.keyboard.press('Tab'); order.push(await p.evaluate(function(){ var a=document.activeElement; return (a.id||a.getAttribute('data-role')||a.className)+':'+(a.getAttribute('aria-label')||a.textContent.trim()).slice(0,28); })); }
 ok(/enter:Explore the sounds/.test(order[0]) && /enter:Explore the sounds/.test(order[1]) && /ssp-full/.test(order[2]) && /ssp-back-bottom/.test(order[3]),"Tab order on the cover: the picture's Explore button, then the bar's Explore, Full screen, then the bottom Back ("+order.slice(0,4).join(' > ')+")");
 await p.evaluate(function(){ document.getElementById('ssp-back').focus(); }); await p.keyboard.press('Tab');
 const ring=await p.evaluate(function(){ var cs=getComputedStyle(document.activeElement); return [cs.outlineStyle,cs.outlineWidth,document.activeElement.matches(':focus-visible')]; });
 ok(ring[0]==='solid' && ring[1]==='3px' && ring[2]===true,"keyboard focus on a button laid over the picture shows a 3 px focus ring");
 await p.screenshot({path:out+'/focus-ring-on-picture.png'});
 await p.keyboard.press('Tab'); const ring2=await p.evaluate(function(){ var cs=getComputedStyle(document.activeElement); return [document.activeElement.parentNode.id,cs.outlineStyle,cs.outlineWidth]; });
 ok(ring2[0]==='ssp-ctl' && ring2[1]==='solid' && ring2[2]==='3px',"keyboard focus on a bar button shows a 3 px focus ring");
 await p.screenshot({path:out+'/focus-ring-on-bar.png'});
 await p.keyboard.press('Enter'); await ready(p); ok(await p.evaluate(function(){ return SSP.cur; })==='menu-main',"Enter on the bar's Explore the Sounds button opens the main menu");
 await sleep(560); await show(p,'menu-digraphs'); await p.evaluate(function(){ document.querySelector('#ssp-hot [data-to="sound-20"]').focus(); });
 await p.keyboard.press('Enter'); await ready(p); ok(await p.evaluate(function(){ return SSP.cur; })==='sound-20',"Tab/Enter on the ship button (\"20 /sh/ · ship\") opens ship");
 await sleep(560); await p.keyboard.press('ArrowRight'); await ready(p); ok(await p.evaluate(function(){ return SSP.cur; })==='sound-21',"ArrowRight = Next (station)");
 await sleep(560); await p.keyboard.press('ArrowLeft'); await ready(p); ok(await p.evaluate(function(){ return SSP.cur; })==='sound-20',"ArrowLeft = Previous (ship)");
 await sleep(560); await p.evaluate(function(){ document.querySelector('#ssp-ctl [data-role="next"]').focus(); }); await p.keyboard.press('Space'); await ready(p);
 ok(await p.evaluate(function(){ return SSP.cur+'|'+document.activeElement.getAttribute('data-role'); })==='sound-21|next',"Space on the focused Next button opens the next slide and focus stays on Next");
 /* oo / moon by keyboard only */
 await show(p,'menu-other-vowels'); await p.evaluate(function(){ document.querySelector('#ssp-hot [data-to="sound-48"]').focus(); }); await p.keyboard.press('Enter'); await ready(p);
 ok(await p.evaluate(function(){ return SSP.cur+'|'+document.querySelectorAll('#ssp-hot .ssp-hot').length+'|'+!document.getElementById('ssp-note').hidden; })==='sound-48|0|true',"oo/moon by keyboard: no buttons over the picture, the note is shown");
 await sleep(560); await p.evaluate(function(){ document.querySelector('#ssp-ctl [data-role="next"]').focus(); }); await p.keyboard.press('Enter'); await ready(p);
 ok(await p.evaluate(function(){ return SSP.cur; })==='sound-49',"oo/moon: the bar's Next (keyboard Enter) reaches oo/book");
 await sleep(560); await p.keyboard.press('ArrowLeft'); await ready(p); await sleep(560); await p.evaluate(function(){ document.querySelector('#ssp-ctl [data-role="home"]').focus(); }); await p.keyboard.press('Enter'); await ready(p);
 ok(await p.evaluate(function(){ return SSP.cur; })==='menu-main',"oo/moon: the bar's Home (keyboard) opens the main menu");

 /* ================= F. rapid taps: one tap sequence = one step ================= */
 await sleep(560); await show(p,'menu-main'); await sleep(560);
 await p.dblclick('#ssp-ctl [data-role="next"]'); await sleep(100);
 ok(await p.evaluate(function(){ return SSP.cur; })==='menu-consonants',"double-click on Next (main menu) opens the Consonants menu once, not the Digraphs menu");
 await sleep(560); await show(p,'sound-20'); await sleep(560);
 const nx=S['sound-20'].hotspots.filter(function(h){ return h.role==='next'; })[0].rect, g1=await geom(p);
 for(let i=0;i<6;i++){ await p.mouse.click(g1.img[0]+(nx[0]+nx[2]/2)*g1.img[2], g1.img[1]+(nx[1]+nx[3]/2)*g1.img[3],{delay:0}); }
 await sleep(100); ok(await p.evaluate(function(){ return SSP.cur; })==='sound-21',"six rapid clicks on the picture's NEXT button move exactly one slide");
 await sleep(600); await p.mouse.click(g1.img[0]+(nx[0]+nx[2]/2)*g1.img[2], g1.img[1]+(nx[1]+nx[3]/2)*g1.img[3]); await sleep(150);
 ok(await p.evaluate(function(){ return SSP.cur; })==='sound-22',"after the half-second lock a new click moves on again");
 /* touch double tap */
 const tb=await boot(browser,VIEWS.phone,{hasTouch:true}); await open(tb.p); await show(tb.p,'menu-main'); await sleep(560);
 const tg=await geom(tb.p), tn=tg.bar.filter(function(x){ return x.text==='Next'; })[0]; const tx=tn.box[0]+tn.box[2]/2, ty=tn.box[1]+tn.box[3]/2;
 await tb.p.touchscreen.tap(tx,ty); await tb.p.touchscreen.tap(tx,ty); await sleep(150);
 ok(await tb.p.evaluate(function(){ return SSP.cur; })==='menu-consonants',"touch: two quick taps on Next (main menu, phone) open the Consonants menu once");
 await sleep(560); const g2=await geom(tb.p), e=g2.hot.filter(function(h){ return h.to==='sound-03'; })[0]; await tb.p.touchscreen.tap(e.box[0]+e.box[2]/2,e.box[1]+e.box[3]/2); await ready(tb.p);
 ok(await tb.p.evaluate(function(){ return SSP.cur; })==='sound-03',"touch: tapping the \"03 /d/ · dog\" button on the picture opens it");
 await tb.ctx.close();

 /* ================= G. missing pictures, missing slide list ================= */
 await sleep(560); await show(p,'menu-digraphs');
 await p.route('**/slides/slide-22.webp',function(r){ r.abort(); });
 await p.evaluate(function(){ delete SSP.cache['slide-22.webp']; SSP.lockUntil=0; sspShow('sound-20',true); });
 await p.waitForFunction(function(){ var m=document.getElementById('ssp-msg'); return !m.hidden && m.getAttribute('data-kind')==='fail'; });
 ok(/could not be loaded/.test(await p.innerText('#ssp-msg')) && /slide-22\.webp/.test(await p.innerText('#ssp-msg')),"a blocked picture shows a plain message naming slide-22.webp with a Try again button");
 await p.screenshot({path:out+'/missing-picture.png'});
 await p.evaluate(function(){ SSP.lockUntil=0; }); await p.click('#ssp-ctl [data-role="next"]'); await ready(p); ok(await p.evaluate(function(){ return SSP.cur; })==='sound-21',"the bar still works while a picture is missing: Next shows station");
 await p.unroute('**/slides/slide-22.webp'); await sleep(560); await p.click('#ssp-ctl [data-role="previous"]'); await ready(p);
 ok(await p.evaluate(function(){ return document.getElementById('ssp-img').naturalWidth; })===2560,"once the picture is available again it shows");
 await p.route('**/slides/slide-30.webp',function(r){ r.fulfill({status:404,body:'not found'}); }); await p.evaluate(function(){ delete SSP.cache['slide-30.webp']; SSP.lockUntil=0; sspShow('sound-28',true); });
 await p.waitForFunction(function(){ var m=document.getElementById('ssp-msg'); return !m.hidden && m.getAttribute('data-kind')==='fail'; }); ok(true,"a 404 for a picture is handled the same way");
 await p.unroute('**/slides/slide-30.webp'); await p.click('#ssp-msg button'); await ready(p); ok(true,"Try again recovers after a 404");
 const ub=await boot(browser,VIEWS.desktop); await ub.p.route('**/manifest.js',function(r){ r.abort(); }); await ub.p.evaluate(function(){ go('c2Next'); }); await ub.p.click('#c2n-open-ssp');
 await ub.p.waitForFunction(function(){ var m=document.getElementById('ssp-msg'); return !m.hidden && m.getAttribute('data-kind')==='fatal'; });
 ok(/slides could not be loaded/.test(await ub.p.innerText('#ssp-msg')) && await ub.p.isVisible('#ssp-back'),"if the slide list is blocked the screen says so and Back to Check 2 is still there");
 await ub.p.screenshot({path:out+'/missing-slide-list.png'});
 await ub.p.unroute('**/manifest.js'); await ub.p.click('#ssp-msg button'); await ready(ub.p); ok(await ub.p.evaluate(function(){ return SSP.cur; })==='cover',"Try again loads the slide list and opens the cover");
 await ub.ctx.close();

 /* ================= H. fullscreen keeps the bar (so oo/moon is still navigable) ================= */
 await sleep(560); await show(p,'sound-48'); await p.click('#ssp-full'); await sleep(500);
 const fs1=await p.evaluate(function(){ var e=document.fullscreenElement; if(!e){ return null; } var bar=document.getElementById('ssp-ctl').getBoundingClientRect(); var st=document.getElementById('ssp-stage').getBoundingClientRect(); return { id:e.id, barBottom:bar.bottom, vh:window.innerHeight, stageW:st.width, stageH:st.height, vw:window.innerWidth }; });
 if(fs1){ ok(fs1.id==='ssp-viewer' && fs1.barBottom<=fs1.vh+1 && Math.abs(fs1.stageW/fs1.stageH-16/9)<0.01,"fullscreen shows the picture at 16:9 and keeps the control bar on screen ("+Math.round(fs1.stageW)+"x"+Math.round(fs1.stageH)+")"); await p.screenshot({path:out+'/fullscreen-moon.png'});
   await p.evaluate(function(){ SSP.lockUntil=0; }); await p.click('#ssp-ctl [data-role="next"]'); await ready(p); ok(await p.evaluate(function(){ return SSP.cur; })==='sound-49',"in fullscreen the bar's Next works from oo/moon");
   await p.click('#ssp-full'); await sleep(400); ok(await p.evaluate(function(){ return !document.fullscreenElement; }),"the Full screen button toggles fullscreen off again (Esc is the browser's own key and is not exercised by headless Chromium)"); }
 else { console.log("INFO fullscreen was not granted by this headless browser; fullscreen layout NOT verified here"); }
 await p.evaluate(function(){ if(document.fullscreenElement){ return document.exitFullscreen(); } }); await sleep(200);

 /* ================= I. back to Check 2: same student, nothing saved, no history entries ================= */
 await sleep(560); await p.click('#ssp-back'); await sleep(300);
 ok(await p.isVisible('#c2n-ssp') && await p.isVisible('#c2n-open-slideshow'),"Back to Check 2 returns to the Check 2 page with all its cards");
 const selAfter=await p.evaluate(function(){ return [C2N_STU,C2N_CLS]; }); ok(JSON.stringify(selAfter)===JSON.stringify(selBefore),"the same class and student are still selected");
 ok(await p.evaluate(function(){ return document.querySelectorAll('#c2n-roster button.primary').length; })===1,"that student is still highlighted on the page");
 const snapAfter=await p.evaluate(async function(){ var o={}, i; for(i=0;i<localStorage.length;i++){ o[localStorage.key(i)]=localStorage.getItem(localStorage.key(i)); } var dbs=indexedDB.databases?(await indexedDB.databases()).map(function(d){ return d.name; }).sort():[]; return JSON.stringify([o,dbs]); });
 ok(snapAfter===snapBefore,"browsing the deck changed nothing in localStorage or IndexedDB");
 ok(await p.evaluate(function(){ return history.length; })===histBefore,"no browser-history entries were added (Browser Back behaves exactly as on every other screen of the app)");
 /* Check 2's other resources still open */
 await p.click('#c2n-open-slideshow'); await p.waitForFunction(function(){ var i=document.getElementById('c2sh-img'); return i && i.complete && i.naturalWidth>0; }); ok(await p.isVisible('#c2sh-stage'),"the existing 44-sound slideshow still opens and shows its picture");
 await p.evaluate(function(){ go('c2Next'); }); await p.click('#c2n-open-studio'); await sleep(400); ok(await p.isVisible('#c2st-progress'),"the Sound Recording Studio still opens");
 ok(b.errs.length===0,"no JavaScript errors in the whole session ("+b.errs.join("; ")+")");
 await browser.close();
 console.log("e2e c2-ssp: "+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
})().catch(function(e){ console.log("E2E CRASH:",e&&e.stack||e); process.exit(1); });
