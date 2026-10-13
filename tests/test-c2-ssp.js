/* Check 2 > Sounds & Spelling Patterns: manifest + assets, the viewer's logic in jsdom (fake Image loader, so no
   network), and proof that nothing else in the app was touched. Real-browser checks (layout at desktop / tablet /
   phone, hotspot alignment on screen, real keyboard focus, fullscreen, blocked requests) live in
   tests/e2e-c2-ssp.js, and pixel alignment against the rendered slides in tools/verify-c2-ssp-rendering.py.
   Optional extra: RF_SSP_PPTX=/path/to/Reading_Foundations_Original_v6.pptx rebuilds the manifest from the deck
   (needs python3 + Pillow) and requires it to match the committed one byte for byte. */
const fs=require('fs'), path=require('path'), crypto=require('crypto'), cp=require('child_process');
const {JSDOM}=require('jsdom'); const acorn=require('acorn');
const html=fs.readFileSync('./index.html','utf8').replace('<script src="clips.js" defer></script>','<script>'+fs.readFileSync('./clips.js','utf8')+'</script>');
const A='assets/check-2/sounds-spelling-patterns';
let pass=0, fail=0; function ok(c,m){ if(c){pass++;} else {fail++; console.log("FAIL:",m);} }
const sha=function(f){ return crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'); };
const man=JSON.parse(fs.readFileSync(A+'/manifest.json','utf8'));
const S={}; man.slides.forEach(function(s){ S[s.id]=s; });
const byN={}; man.slides.forEach(function(s){ byN[s.n]=s; });
const CATS=[['consonants','Consonants',18],['digraphs','Consonant Digraphs & Alternative Spellings',8],['short-vowels','Short Vowels',5],['long-vowels','Long Vowels & Vowel Teams',7],['diphthongs','Diphthongs',3],['r-controlled','R-Controlled Vowels',6],['other-vowels','Other Vowel Sounds & Patterns',4]];

/* ================= 1. manifest: counts, order, labels, destinations (data read from the deck) ================= */
ok(man.slides.length===60 && man.counts.slides===60 && man.counts.instructional===51 && man.counts.navigation===9,"60 slides = 51 instructional + 9 navigation");
ok(man.slides.every(function(s,i){ return s.n===i+1 && s.image==='slide-'+(i<9?'0':'')+(i+1)+'.webp'; }),"slides listed in physical order 1..60, one image each");
const kinds={}; man.slides.forEach(function(s){ kinds[s.kind]=(kinds[s.kind]||0)+1; });
ok(kinds.cover===1 && kinds['main-menu']===1 && kinds.menu===7 && kinds.sound===51,"1 cover, 1 main menu, 7 category menus, 51 sound slides");
ok(JSON.stringify(man.categories.map(function(c){ return [c.key,c.title,c.count]; }))===JSON.stringify(CATS),"seven categories, exact titles, counts 18/8/5/7/3/6/4 in the deck's order");
ok(CATS.every(function(c){ return man.slides.filter(function(s){ return s.kind==='sound'&&s.category===c[0]; }).length===c[2]; }),"every category really holds that many sound slides");
ok(man.source.sha256==='8d645a15e7d640beec1a7058a76c891c723bbf067bf59e1cee674d62ad2a256d' && man.source.bytes===66534181 && man.source.slides===60,"manifest names the verified deck (SHA-256 8d645a15...)");
/* menu numbers are NOT physical slide numbers */
const sounds=man.slides.filter(function(s){ return s.kind==='sound'; });
ok(sounds.every(function(s){ return s.id==='sound-'+(s.entry<10?'0':'')+s.entry; }) && sounds.map(function(s){ return s.entry; }).join()===Array.from({length:51},function(_,i){ return i+1; }).join(),"sound entries are exactly 1..51 in order");
ok(S['sound-01'].n===3 && S['sound-20'].n===22 && S['sound-21'].n===23 && S['sound-22'].n===24 && S['sound-51'].n===53,"menu sound number != physical slide: sound 1 is slide 3, sound 20 is slide 22, 51 is slide 53");
ok(man.slides.filter(function(s){ return s.kind==='menu'; }).every(function(m){ return m.hotspots.filter(function(h){ return h.role==='sound'; }).every(function(h){ return byN[h.slide].id===h.to && byN[h.slide].entry===h.entry; }); }),"every menu entry's destination slide really is that sound");
ok(byN[59].deckPart==='slide1.xml' && byN[1].deckPart==='slide2.xml' && byN[40].deckPart==='slide54.xml',"order comes from the deck's presentation order, not file names (slide 59 is slide1.xml, slide 40 is slide54.xml)");
/* ship / station / special */
const m55=byN[55], e55={}; m55.hotspots.forEach(function(h){ if(h.role==='sound'){ e55[h.entry]=h; } });
ok(m55.id==='menu-digraphs' && Object.keys(e55).join()==='19,20,21,22,23,24,25,26',"digraphs menu is slide 55 with entries 19-26");
ok(e55[20].label==='20 /sh/ · ship' && e55[20].to==='sound-20' && e55[20].slide===22,"entry 20 shows /sh/ · ship and opens slide 22");
ok(e55[21].label==='21 /sh/ · ti · station' && e55[21].to==='sound-21' && e55[21].slide===23,"entry 21 shows /sh/ · ti · station and opens slide 23 (ship was not deleted as a duplicate)");
ok(e55[22].label==='22 /sh/ · ci · special' && e55[22].to==='sound-22' && e55[22].slide===24,"entry 22 shows /sh/ · ci · special and opens slide 24");
ok(S['sound-20'].word==='ship' && S['sound-21'].word==='station' && S['sound-22'].word==='special' && S['sound-21'].title==='Sound 21: /sh/, spelled ti, as in station',"sound slides 20/21/22 are ship, station, special; accessible titles name the spelling");
/* short vowel menu = slide 56, five equal buttons */
const m56=byN[56], sv=m56.hotspots.filter(function(h){ return h.role==='sound'; });
ok(m56.id==='menu-short-vowels' && sv.length===5 && sv.map(function(h){ return h.label; }).join('|')==='27 short a · apple|28 short e · egg|29 short i · igloo|30 short o · octopus|31 short u · umbrella',"short-vowel menu is physical slide 56 with its five sound buttons");
ok(sv.every(function(h){ return h.rect[2]===sv[0].rect[2] && h.rect[3]===sv[0].rect[3]; }),"all five short-vowel buttons have identical size");
const lt=man.qa.menuButtonLettering.filter(function(q){ return q.slide===56; })[0];
ok(lt.identicalLettering && Object.keys(lt.sizesPt).join()==='20.0' && lt.otherSettings.typeface==='Comic Neue' && lt.otherSettings.b==='1',"deck sets all five short-vowel buttons in identical lettering (Comic Neue Bold, 20 pt)");
/* controls: category boundaries and destinations */
function dest(s,role){ var c=s.controls.filter(function(x){ return x.role===role; })[0]; return c&&c.to; }
let boundaryOk=true, adjOk=true;
CATS.forEach(function(c){
  const lst=sounds.filter(function(s){ return s.category===c[0]; }), menu='menu-'+c[0];
  lst.forEach(function(s,i){
    const prev=i===0?menu:lst[i-1].id, next=i===lst.length-1?menu:lst[i+1].id;
    if(dest(s,'previous')!==prev || dest(s,'next')!==next){ adjOk=false; }
    if(dest(s,'category')!==menu || dest(s,'home')!=='menu-main'){ boundaryOk=false; }
  });
});
ok(adjOk,"every sound slide's Previous/Next goes to its neighbour in the same category; the first goes back to the category menu and the last on to the category menu (no stepping into another category)");
ok(boundaryOk,"every sound slide's category button opens its own category menu and Home opens the main category menu");
ok(dest(S['sound-38'],'next')==='menu-long-vowels' && dest(S['sound-37'],'next')==='sound-38' && dest(S['sound-39'],'previous')==='menu-diphthongs',"ey/key (last long-vowel slide) does not step into diphthongs; ow/cow's Previous returns to the diphthongs menu");
const menuIds=CATS.map(function(c){ return 'menu-'+c[0]; });
ok(menuIds.every(function(id,i){ const s=S[id]; return dest(s,'previous')===(i===0?'menu-main':menuIds[i-1]) && dest(s,'next')===(i===6?'menu-main':menuIds[i+1]) && dest(s,'home')==='menu-main' && dest(s,'all-categories')==='menu-main'; }),"category menus chain Previous/Next through the seven menus and Home / All Categories return to the main menu");
ok(dest(S['menu-main'],'previous')==='cover' && dest(S['menu-main'],'home')==='cover' && dest(S['menu-main'],'sound-list')==='menu-consonants' && dest(S['menu-main'],'next')==='menu-consonants',"main menu: Previous/Home -> cover, Sound List/Next -> Consonants menu (as the deck links them)");
ok(S.cover.controls.length===1 && dest(S.cover,'enter')==='menu-main' && S.cover.hotspots.length===1,"cover has the one entry action, to the main menu");
ok(S['menu-main'].hotspots.filter(function(h){ return h.role==='category'; }).map(function(h){ return h.to; }).join()===menuIds.join(),"main menu offers the seven categories in order");
/* oo / moon: footer hidden by the artwork in the deck */
const moon=S['sound-48'];
ok(moon.n===50 && moon.footerObstructed===true && moon.hotspots.length===0 && moon.controls.length===4,"oo/moon (slide 50): artwork hides the deck's footer, so no overlay hotspots, but all four controls are kept for the HTML bar");
ok(dest(moon,'previous')==='menu-other-vowels' && dest(moon,'category')==='menu-other-vowels' && dest(moon,'home')==='menu-main' && dest(moon,'next')==='sound-49',"oo/moon controls follow the links hidden under its picture");
ok(sounds.filter(function(s){ return s.id!=='sound-48'; }).every(function(s){ return s.hotspots.length===4 && !s.footerObstructed; }),"every other sound slide has its four footer hotspots");
/* geometry sanity */
function inside(r){ return r[0]>=0 && r[1]>=0 && r[2]>0 && r[3]>0 && r[0]+r[2]<=1 && r[1]+r[3]<=1; }
function overlaps(a,b){ return a[0]<b[0]+b[2] && b[0]<a[0]+a[2] && a[1]<b[1]+b[3] && b[1]<a[1]+a[3]; }
ok(man.slides.every(function(s){ return s.hotspots.every(function(h){ return inside(h.rect); }); }),"all 291 hotspot rectangles lie inside the slide (normalized 0-1)");
ok(man.slides.reduce(function(n,s){ return n+s.hotspots.length; },0)===291 && man.slides.reduce(function(n,s){ return n+s.controls.length; },0)===237,"291 hotspots and 237 bar controls in total");
ok(man.slides.every(function(s){ return s.hotspots.every(function(h,i){ return s.hotspots.every(function(g,j){ return i===j || !overlaps(h.rect,g.rect); }); }); }),"no two hotspots on a slide overlap");
ok(man.slides.every(function(s){ return s.hotspots.every(function(h){ return h.aria && h.aria.length>3 && h.to && S[h.to]; }); }) && man.slides.every(function(s){ return s.controls.every(function(c){ return c.aria && c.label && S[c.to] && S[c.to].n===c.slide; }); }),"every hotspot and control has a descriptive accessible label and a real destination");
/* QA findings recorded about the deck itself (reported, never fixed) */
ok(man.qa.linkDeviations.length===0,"no navigation link in the deck deviates from the category structure");
ok(man.qa.printedCategoryLabelMismatches.map(function(x){ return x.slide; }).join()==='39,40,44,45,46,47,48,49' && man.qa.printedCategoryLabelMismatches.every(function(x){ return x.buttonLinksTo==='menu-'+x.category; }),"deck finding recorded: 8 footers print the wrong category name but still link to the right menu");
ok(man.qa.footerStyleOutliers.length===1 && man.qa.footerStyleOutliers[0].slides.join()==='21,22,23,24,25,26,27,28' && man.qa.footerStyleOutliers[0].categoryButtonTextStyle.color===null,"deck finding recorded: DIGRAPHS category buttons (slides 21-28) have no explicit text colour");
ok(man.qa.layeredPictures.length===1 && man.qa.layeredPictures[0].slide===22 && man.qa.layeredPictures[0].visibleTop==='image24.png' && man.qa.layeredPictures[0].topIsFullyOpaque && man.qa.layeredPictures[0].hiddenUnderneath.join()==='image25.png,image26.png',"layered artwork on slide 22 (ship): top picture is opaque, two obsolete pictures lie hidden beneath it (they are not shown)");
ok(man.qa.menuButtonLettering.filter(function(q){ return !q.identicalLettering; }).map(function(q){ return q.slide; }).join()==='57',"deck finding recorded: only the Long Vowels menu mixes 19 pt and 20 pt button lettering");

/* ================= 2. assets: lossless 2560x1440 WebP, font + licence, deck NOT in the repo ================= */
function webp(buf){ if(buf.toString('ascii',0,4)!=='RIFF'||buf.toString('ascii',8,12)!=='WEBP'){ return null; } const f=buf.toString('ascii',12,16);
  if(f!=='VP8L'){ return {fourcc:f}; } const b=[buf[21],buf[22],buf[23],buf[24]]; return {fourcc:f, w:1+(((b[1]&0x3F)<<8)|b[0]), h:1+(((b[3]&0xF)<<10)|(b[2]<<2)|((b[1]&0xC0)>>6))}; }
let allWebp=true, total=0; man.slides.forEach(function(s){ const f=A+'/slides/'+s.image; if(!fs.existsSync(f)){ allWebp=false; return; } const b=fs.readFileSync(f); total+=b.length; const i=webp(b); if(!i||i.fourcc!=='VP8L'||i.w!==2560||i.h!==1440){ allWebp=false; } });
ok(allWebp,"all 60 slide images exist and are LOSSLESS WebP (VP8L) at 2560x1440 (no JPEG, no lossy WebP, no reduced size)");
ok(total===man.images.totalBytes && man.images.format==='WebP, lossless' && man.images.width===2560 && man.images.height===1440,"manifest records the image set ("+(total/1e6).toFixed(1)+" MB)");
ok(fs.readdirSync(A+'/slides').length===60,"exactly 60 files in the slides folder");
ok(sha(A+'/fonts/ComicNeue-Bold.ttf')==='3e7e5fccfd7e0788f317b43312151c1bd5cf058c9697a8d83eac3939050bd61e' && fs.existsSync(A+'/fonts/OFL.txt') && /SIL OPEN FONT LICENSE/.test(fs.readFileSync(A+'/fonts/OFL.txt','utf8')),"Comic Neue Bold is the supplied font (identical to the deck's embedded font) and its licence travels with it");
ok(!fs.readdirSync(A).some(function(f){ return /\.pptx$/i.test(f); }) && !/(href|src)=["'][^"']*Original_v6\.pptx/.test(html),"the 66.5 MB source deck is not stored in the repository, and nothing in the app links to it");
const wrap=fs.readFileSync(A+'/manifest.js','utf8'), pre='window.RF_C2_SSP=';
ok(wrap.indexOf(pre)>0 && JSON.stringify(JSON.parse(wrap.slice(wrap.indexOf(pre)+pre.length).replace(/;\s*$/,'')))===JSON.stringify(man),"manifest.js (the file the app loads) carries exactly the same data as manifest.json");
if(process.env.RF_SSP_PPTX){
  const tmp=fs.mkdtempSync('/tmp/ssp-rebuild-'); fs.symlinkSync(path.resolve(A+'/slides'),tmp+'/slides');
  const r=cp.spawnSync('python3',['-I','tools/build-c2-ssp-manifest.py',process.env.RF_SSP_PPTX,tmp,'--expect-sha256',man.source.sha256],{encoding:'utf8'});
  ok(r.status===0 && fs.readFileSync(tmp+'/manifest.json','utf8')===fs.readFileSync(A+'/manifest.json','utf8'),"rebuilding the manifest from the deck reproduces the committed manifest byte for byte");
} else { console.log("(skipped: set RF_SSP_PPTX to rebuild the manifest from the deck)"); }

/* ================= 3. the viewer inside the app (jsdom, fake image loader) ================= */
const errors=[], st={ loaded:[], failing:{}, writes:0 };
const w=new JSDOM(html,{url:"https://miqdaniels.github.io/READING-DANIELS/?teacher",runScripts:"dangerously",pretendToBeVisual:true,
  beforeParse(w){
    w.HTMLElement.prototype.scrollIntoView=function(){}; w.scrollTo=function(){};
    w.addEventListener("error",function(e){ errors.push(e.message); });
    w.Image=function(){ const self=this; this.onload=null; this.onerror=null; let src="";
      Object.defineProperty(this,"src",{ get:function(){ return src; }, set:function(v){ src=v; const f=v.split("/").pop();
        setTimeout(function(){ if(st.failing[f]){ if(self.onerror){ self.onerror(); } } else { st.loaded.push(f); if(self.onload){ self.onload(); } } },0); } }); };
    const ss=w.Storage.prototype.setItem; w.Storage.prototype.setItem=function(){ st.writes++; return ss.apply(this,arguments); };
    const rs=w.Storage.prototype.removeItem; w.Storage.prototype.removeItem=function(){ st.writes++; return rs.apply(this,arguments); };
  }}).window;
const d=w.document; function $(i){ return d.getElementById(i); }
function active(){ var s=d.getElementsByClassName("screen"), i; for(i=0;i<s.length;i++){ if(/active/.test(s[i].className)){ return s[i].id; } } }
function tick(ms){ return new Promise(function(r){ setTimeout(r,ms||8); }); }
function snap(){ var o={}, i, k; for(i=0;i<w.localStorage.length;i++){ k=w.localStorage.key(i); o[k]=w.localStorage.getItem(k); } return JSON.stringify(o); }
function hots(){ return Array.prototype.slice.call(d.querySelectorAll("#ssp-hot .ssp-hot")); }
function ctls(){ return Array.prototype.slice.call(d.querySelectorAll("#ssp-ctl button")); }
function pointer(el){ w.SSP.lockUntil=0; el.dispatchEvent(new w.MouseEvent("click",{bubbles:true,cancelable:true,detail:1})); }
function pointerNoReset(el){ el.dispatchEvent(new w.MouseEvent("click",{bubbles:true,cancelable:true,detail:1})); }
function key(k,o){ const ev=new w.KeyboardEvent("keydown",Object.assign({key:k,bubbles:true,cancelable:true},o||{})); const notCancelled=d.dispatchEvent(ev); return !notCancelled; }
function cur(){ return w.SSP.cur; }
function ctl(role){ return ctls().filter(function(b){ return b.getAttribute("data-role")===role; })[0]; }
function hot(to){ return hots().filter(function(b){ return b.getAttribute("data-to")===to; })[0]; }
const sleepLock=function(){ return tick(560); };

(async function(){
  /* nothing from the new resource loads when the app opens or when Check 2's page opens */
  await tick(30);
  ok(st.loaded.length===0 && !w.RF_C2_SSP && !w.SSP.byId,"opening the app loads no slide images and no slide list");
  w.eval(wrap);                                                   /* what the on-demand <script> would define */

  /* ---- Check 2 page: new card, existing resources untouched ---- */
  w.go("teachNext"); d.querySelector('.tn-card[data-check="2"]').click();
  ok(active()==="c2Next" && !!$("c2n-ssp") && $("c2n-ssp").querySelector(".step-eyebrow").textContent==="Sounds & Spelling Patterns" && $("c2n-open-ssp").textContent==="Open Sounds & Spelling Patterns","What to Teach Next > Check 2 shows the new \"Sounds & Spelling Patterns\" card");
  const cardText=$("c2n-ssp").textContent.replace(/\s+/g," ");
  ok(/Teaching slides only/.test(cardText) && /does not change any assessment, score, or placement/.test(cardText) && /placeholders/.test(cardText),"card says: teaching slides only, changes no assessment, audio/camera icons are placeholders");
  ok(!!$("c2n-student") && !!$("c2n-slideshow") && !!$("c2n-open-slideshow") && !!$("c2n-dl-pptx") && !!$("c2n-open-studio") && !!$("c2n-resources") && !!$("c2n-teacher-pdf") && !!$("c2n-student-docx") && !!$("c2n-howto"),"existing Check 2 cards (student picker, 44-sound slideshow, studio, printable cards, directions) are all still there");
  ok(d.querySelectorAll("#teachNext .tn-card").length===7,"hub still has its 7 check cards");
  ok($("c2Ssp").getAttribute("data-teacher")==="1" && (html.match(/sspOpen\(/g)||[]).length===2,"the viewer is a teacher-only screen, opened only from the Check 2 card (no student-side entry point)");
  /* pick a student on the Check 2 page so we can prove the selection survives */
  const A1="stu_gomezmiriam_p1";
  Array.prototype.filter.call(d.querySelectorAll("#c2n-roster button"),function(b){ return /Miriam/.test(b.textContent); })[0].click();
  const selBefore=[w.C2N_STU, w.C2N_CLS]; ok(selBefore[0]===A1,"a student is selected on the Check 2 page before opening the viewer");
  const hist=w.history.length, diagBefore=snap(); st.writes=0;

  /* ---- open: cover ---- */
  $("c2n-open-ssp").click(); await tick();
  ok(active()==="c2Ssp" && cur()==="cover" && $("ssp-stage").getAttribute("data-n")==="1" && $("ssp-info").textContent==="Slide 1 of 60 · Cover","opens on the cover (slide 1 of 60)");
  ok($("ssp-img").getAttribute("src")===A+"/slides/slide-01.webp" && $("ssp-img").alt==="Slide 1 of 60. Cover.","cover image is the lossless slide-01.webp");
  ok(hots().length===1 && hots()[0].getAttribute("aria-label")==="Explore the sounds: Choose a sound category" && ctls().length===1 && ctls()[0].textContent.trim()==="Explore the Sounds","cover: the deck's entry action as an overlay button and in the control bar");
  ok(st.loaded.slice().sort().join()==="slide-01.webp,slide-02.webp","only the cover and the slide one step away were loaded");
  ok($("ssp-back").textContent.trim()==="← Back to Check 2" && $("ssp-back-bottom").textContent.trim()==="← Back to Check 2" && !$("ssp-back").closest("#ssp-stage"),"a \"Back to Check 2\" button sits outside the artwork (top and bottom)");
  ok(/Check 2/.test(d.querySelector("#c2Ssp .crumb").textContent) && d.querySelector("#ssp-bottom-nav")!==null,"breadcrumb names Check 2; the bottom button row is protected from the shared tn-nav repaint");
  w.go("c2Ssp"); await tick(); ok(d.querySelector("#ssp-bottom-nav #ssp-back-bottom")!==null,"the bottom Back button survives re-entering the screen");

  /* ---- walk the whole deck by clicking: every menu, every sound selector ---- */
  pointer(hot("menu-main")); await tick();
  ok(cur()==="menu-main" && hots().length===11 && hots().filter(function(h){ return h.getAttribute("data-role")==="category"; }).length===7,"cover -> main menu: 7 category buttons + 4 footer buttons");
  ok(Array.prototype.map.call(d.querySelectorAll("#ssp-list button"),function(b){ return b.getAttribute("data-to"); }).join()===menuIds.join() && d.querySelector("#ssp-list .ssp-list-title").textContent==="Choose a category","the main menu also offers its 7 categories as large buttons (shown on narrow screens only)");
  const seen={ menus:0, sounds:0 }; const order=[];
  for(const c of CATS){
    pointer(hot("menu-"+c[0])); await tick(); seen.menus++;
    const here=S["menu-"+c[0]], entries=hots().filter(function(h){ return h.getAttribute("data-role")==="sound"; }).map(function(h){ return h.getAttribute("data-to"); });
    ok(cur()==="menu-"+c[0] && entries.length===c[2] && hots().length===c[2]+4 && $("ssp-info").textContent.indexOf(c[1]+" menu")>-1,"menu \""+c[1]+"\": "+c[2]+" sound buttons + 4 footer buttons");
    ok(Array.prototype.map.call(d.querySelectorAll("#ssp-list button"),function(b){ return b.getAttribute("data-to")+"="+b.textContent; }).join("|")===entries.map(function(id){ return id+"="+S[id].menuText; }).join("|"),"menu \""+c[1]+"\": the large-button list repeats its "+c[2]+" entries with the deck's own labels, in order");
    for(const id of entries){
      pointer(hot(id)); await tick(); seen.sounds++; order.push(id);
      const s=S[id];
      if(cur()!==id || $("ssp-img").getAttribute("src")!==A+"/slides/"+s.image || hots().length!==(id==="sound-48"?0:4)){ ok(false,"sound "+id+" did not open correctly"); }
      pointer(ctl("category")); await tick();                              /* back to the menu to pick the next sound */
      if(cur()!=="menu-"+c[0]){ ok(false,"category control from "+id+" did not return to its menu"); }
    }
    pointer(ctl("home")); await tick(); pointer(hot("menu-"+c[0])); await tick();
    pointer(ctl("home")); await tick();
  }
  ok(seen.menus===7 && seen.sounds===51 && new Set(order).size===51,"clicked through all 7 category menus and opened all 51 sounds from their menu buttons");

  /* ---- Previous / Next walk and category boundaries (bar buttons) ---- */
  for(const c of CATS){
    const lst=sounds.filter(function(s){ return s.category===c[0]; });
    pointer(hot("menu-"+c[0])); await tick();
    pointer(hot(lst[0].id)); await tick();
    pointer(ctl("previous")); await tick();
    if(cur()!=="menu-"+c[0]){ ok(false,"Previous on the first "+c[0]+" slide did not return to its menu"); }
    pointer(hot(lst[0].id)); await tick();
    for(let i=1;i<lst.length;i++){ pointer(ctl("next")); await tick(); if(cur()!==lst[i].id){ ok(false,c[0]+": Next did not reach "+lst[i].id); } }
    pointer(ctl("next")); await tick();
    ok(cur()==="menu-"+c[0],"\""+c[1]+"\": Next from the last slide returns to its category menu (does not enter the next category)");
    pointer(ctl("home")); await tick();
  }
  /* ---- ship / station / special through the real buttons ---- */
  pointer(hot("menu-digraphs")); await tick();
  const labels=hots().filter(function(h){ return /^sound-(20|21|22)$/.test(h.getAttribute("data-to")); }).map(function(h){ return h.getAttribute("data-to")+" => "+h.getAttribute("aria-label"); });
  ok(labels.join(" | ")==="sound-20 => Open sound 20: /sh/ as in ship | sound-21 => Open sound 21: /sh/, spelled ti, as in station | sound-22 => Open sound 22: /sh/, spelled ci, as in special","the digraphs menu's buttons are labelled ship, station, special with their /sh/ spellings");
  ok(hots().every(function(h){ return !h.hasAttribute("title"); }),"on-slide buttons carry one accessible name each (no duplicate title)");
  pointer(d.querySelector('#ssp-list [data-to="sound-21"]')); await tick();
  ok(cur()==="sound-21" && $("ssp-list").innerHTML==="" && d.querySelector("#ssp-list button")===null,"a button from the large-button list opens its sound, and sound slides show no list");
  pointer(ctl("category")); await tick();
  pointer(hot("sound-20")); await tick();
  ok($("ssp-stage").getAttribute("data-n")==="22" && $("ssp-img").alt==="Slide 22 of 60. Sound 20: /sh/ as in ship." && $("ssp-info").textContent==="Slide 22 of 60 · Sound 20 of 51 · Consonant Digraphs & Alternative Spellings (2 of 8)","ship opens physical slide 22");
  pointer(ctl("next")); await tick(); ok($("ssp-stage").getAttribute("data-n")==="23" && /station/.test($("ssp-img").alt),"Next from ship is station (slide 23)");
  pointer(ctl("next")); await tick(); ok($("ssp-stage").getAttribute("data-n")==="24" && /special/.test($("ssp-img").alt),"then special (slide 24)");

  /* ---- oo / moon: the deck's footer is hidden by its artwork, the HTML bar still navigates ---- */
  pointer(ctl("home")); await tick(); pointer(hot("menu-other-vowels")); await tick(); pointer(hot("sound-48")); await tick();
  ok(cur()==="sound-48" && hots().length===0 && $("ssp-note").hidden===false && /covers the deck/.test($("ssp-note").textContent) && ctls().map(function(b){ return b.textContent.trim(); }).join("|")==="Previous|Category Menu|Home|Next","oo/moon (slide 50): no overlay buttons, a visible note explains why, the four bar buttons are present");
  ok(ctl("next").getAttribute("aria-label")==="Next: Sound 49: oo as in book" && ctl("previous").getAttribute("aria-label")==="Previous: Other Vowel Sounds & Patterns menu","oo/moon bar buttons carry descriptive labels naming where they go");
  pointer(ctl("next")); await tick(); ok(cur()==="sound-49" && $("ssp-note").hidden===true,"Next -> oo/book (slide 51); the note disappears on other slides");
  pointer(ctl("previous")); await tick(); ok(cur()==="sound-48","Previous returns to oo/moon");
  pointer(ctl("category")); await tick(); ok(cur()==="menu-other-vowels","Category Menu from oo/moon opens the Other Vowel Sounds & Patterns menu");
  pointer(hot("sound-48")); await tick(); pointer(ctl("previous")); await tick(); ok(cur()==="menu-other-vowels","Previous from oo/moon (first in its category) returns to that menu");
  pointer(hot("sound-48")); await tick(); pointer(ctl("home")); await tick(); ok(cur()==="menu-main","Home from oo/moon opens the main category menu");

  /* ---- keyboard ---- */
  w.SSP.lockUntil=0; w.SSP.cur="cover"; w.sspShow("cover",true); await tick();
  ok(key("ArrowLeft")===false && cur()==="cover","ArrowLeft on the cover does nothing and does not swallow the key");
  w.SSP.lockUntil=0; ok(key("ArrowRight")===true && cur()==="menu-main","ArrowRight on the cover = the deck's Explore action");
  await sleepLock(); w.sspShow("sound-20",true); await tick();
  key("ArrowRight"); await tick(); ok(cur()==="sound-21","ArrowRight = Next");
  await sleepLock(); key("ArrowLeft"); await tick(); ok(cur()==="sound-20","ArrowLeft = Previous");
  await sleepLock(); w.sspShow("sound-26",true); await tick(); key("ArrowRight"); await tick(); ok(cur()==="menu-digraphs","ArrowRight on the last digraph returns to the digraphs menu (category boundary)");
  await sleepLock(); w.sspShow("sound-20",true); await tick();
  ok(key("ArrowRight",{ctrlKey:true})===false && key("ArrowRight",{shiftKey:true})===false && key("ArrowRight",{altKey:true})===false && key("ArrowRight",{metaKey:true})===false && cur()==="sound-20","modified arrow keys are ignored");
  w.SSP.lockUntil=0; ok(key("ArrowRight",{repeat:true})===true && cur()==="sound-20","a held-down key (auto-repeat) does not run on through slides");
  const inp=d.createElement("input"); d.body.appendChild(inp); inp.focus(); w.SSP.lockUntil=0;
  inp.dispatchEvent(new w.KeyboardEvent("keydown",{key:"ArrowRight",bubbles:true,cancelable:true})); ok(cur()==="sound-20","arrow keys typed in a text box are ignored"); inp.remove();
  w.SSP.lockUntil=0; key("ArrowRight"); await tick(); const afterKey=cur(); w.go("c2Next"); w.SSP.lockUntil=0; key("ArrowRight"); await tick(); ok(afterKey==="sound-21" && cur()==="sound-21","keys do nothing once the viewer is left");
  /* focus: keyboard use keeps the focus ring where the user is */
  w.go("c2Ssp"); await tick(); w.sspShow("sound-20",true); await tick();
  ctl("next").focus(); w.SSP.lockUntil=0; ctl("next").click(); await tick();
  ok(cur()==="sound-21" && d.activeElement===ctl("next"),"after pressing Next with the keyboard, focus stays on the Next button of the new slide");
  hots()[1].focus(); w.SSP.lockUntil=0; hots()[1].click(); await tick();
  ok(d.activeElement===$("ssp-stage"),"after using an on-slide button, focus moves to the slide area (not lost)");

  /* ---- rapid taps: one tap = one step ---- */
  w.sspShow("menu-main",true); await tick(); w.SSP.lockUntil=0;
  pointerNoReset(ctl("next")); pointerNoReset(ctl("next")); await tick();
  ok(cur()==="menu-consonants" && /ssp-busy/.test($("ssp-viewer").className),"double tap on Next (main menu) opens the Consonants menu once - the second tap does not fall through to the Digraphs menu");
  pointerNoReset(hots().filter(function(h){ return h.getAttribute("data-role")==="next"; })[0]); await tick(); ok(cur()==="menu-consonants","a third tap during the brief lock is ignored too");
  await sleepLock(); ok(!/ssp-busy/.test($("ssp-viewer").className),"the lock releases by itself (about half a second)");
  pointerNoReset(ctl("next")); await tick(); ok(cur()==="menu-digraphs","a deliberate tap after the lock navigates again");
  await sleepLock(); w.sspShow("sound-20",true); await tick(); w.SSP.lockUntil=0;
  ctl("next").click(); ctl("next").click(); ctl("next").click(); await tick(); ok(cur()==="sound-21","three quick keyboard activations still move exactly one slide");

  /* ---- cache + preload stay small ---- */
  ok(Object.keys(w.SSP.cache).length<=8 && st.loaded.length>=1,"image cache stays small ("+Object.keys(w.SSP.cache).length+" held after visiting all 60 slides)");

  /* ---- missing assets: message in the stage, bar still works, Try again ---- */
  await sleepLock(); st.failing["slide-31.webp"]=1; delete w.SSP.cache["slide-31.webp"];
  w.SSP.lockUntil=0; w.sspShow("sound-29",true); await tick(); await tick();
  ok(cur()==="sound-29" && $("ssp-msg").hidden===false && $("ssp-msg").getAttribute("data-kind")==="fail" && /could not be loaded/.test($("ssp-msg").textContent) && /Try again/.test($("ssp-msg").textContent) && /slide-31\.webp/.test($("ssp-msg").textContent),"a missing picture shows a plain message naming the file, with Try again");
  ok(ctls().length===4 && ctl("next").disabled!==true,"the bar below the slide still works while a picture is missing");
  w.SSP.lockUntil=0; ctl("next").click(); await tick(); await tick(); ok(cur()==="sound-30" && $("ssp-msg").hidden===true,"moving on to the next slide clears the message");
  w.SSP.lockUntil=0; ctl("previous").click(); await tick(); await tick(); ok($("ssp-msg").getAttribute("data-kind")==="fail","coming back to the missing slide shows the message again");
  delete st.failing["slide-31.webp"]; d.querySelector("#ssp-msg button").click(); await tick(); await tick();
  ok($("ssp-msg").hidden===true && $("ssp-img").getAttribute("src")===A+"/slides/slide-31.webp","Try again loads the picture once it is available");
  /* a picture that fails after loading (display <img> error) */
  w.SSP.lockUntil=0; w.sspShow("sound-31",true); await tick(); $("ssp-img").onerror(); ok($("ssp-msg").getAttribute("data-kind")==="fail","if the displayed picture itself fails, the same message appears");
  w.sspShow("sound-31",true); await tick();

  /* ---- slide list fails to load: message, Back still works, retry ---- */
  w.go("c2Next"); delete w.RF_C2_SSP; w.SSP.byId=null; w.SSP.load="idle"; w.SSP.cache={}; w.SSP.order=[];
  d.head.querySelectorAll('script[src*="manifest.js"]').forEach(function(s){ s.remove(); });
  w.sspOpen(); await tick();
  const sc=d.head.querySelector('script[src*="manifest.js"]');
  ok(!!sc && sc.getAttribute("src")===A+"/manifest.js" && w.SSP.load==="loading","the slide list is requested only when the screen opens (a <script> tag, so it works from file:// too)");
  sc.onerror(); await tick();
  ok($("ssp-msg").hidden===false && $("ssp-msg").getAttribute("data-kind")==="fatal" && /could not be loaded/.test($("ssp-msg").textContent) && hots().length===0 && ctls().length===0 && $("ssp-list").innerHTML==="" && $("ssp-info").textContent==="","if the slide list is missing the screen says so plainly");
  ok(!!$("ssp-back") && !$("ssp-back").disabled && !!$("ssp-back-bottom"),"Back to Check 2 is still available");
  d.querySelector("#ssp-msg button").click(); await tick();
  const sc2=d.head.querySelector('script[src*="manifest.js"]');
  ok(!!sc2 && /manifest\.js\?retry=1$/.test(sc2.getAttribute("src")),"Try again asks for the slide list again");
  w.eval(wrap); sc2.onload(); await tick(); await tick();
  ok(cur()==="cover" && $("ssp-msg").hidden===true && hots().length===1 && $("ssp-info").textContent==="Slide 1 of 60 · Cover","once the slide list arrives the viewer opens on the cover");

  /* ---- back to Check 2: same page, same student, nothing saved ---- */
  $("ssp-back").click(); await tick();
  ok(active()==="c2Next" && w.C2N_STU===selBefore[0] && w.C2N_CLS===selBefore[1],"Back to Check 2 returns to the Check 2 page with the same class and student selected");
  const chosen=Array.prototype.filter.call(d.querySelectorAll("#c2n-roster button"),function(b){ return /primary/.test(b.className); });
  ok(chosen.length===1 && /Miriam/.test(chosen[0].textContent) && !!$("c2n-ssp") && !!$("c2n-open-slideshow"),"the selected student is still highlighted and the page is intact");
  w.sspOpen(); await tick(); $("ssp-back-bottom").click(); await tick(); ok(active()==="c2Next","the bottom Back button works too");
  w.sspOpen(); await tick(); d.querySelector("#c2Ssp .crumb a:nth-child(3)").click(); await tick(); ok(active()==="c2Next","the breadcrumb's Check 2 link works too");
  ok(w.SSP.lockTimer===null && !/ssp-busy/.test($("ssp-viewer").className),"leaving the viewer clears its lock");
  ok(st.writes===0 && snap()===diagBefore,"browsing the whole deck wrote nothing to storage; Check 1 / Check 2 / all saved data identical");
  ok(w.history.length===hist,"no browser-history entries were added (the app keeps none, so Back behaves as on every other screen)");
  ok(errors.length===0,"no JavaScript errors ("+errors.join("; ")+")");

  /* ================= 4. static: ES5, scope of the new font, no audio/storage code, file ending ================= */
  const script=html.match(/<script>([\s\S]*?)<\/script>/g).map(function(s){ return s.replace(/^<script>|<\/script>$/g,""); });
  let es5=true; script.forEach(function(s){ try{ acorn.parse(s,{ecmaVersion:5}); }catch(e){ es5=false; console.log("ES5 parse error:",e.message); } });
  ok(es5,"the whole page script still parses as ES5 (no arrow functions, let or const)");
  const a=html.indexOf("Check 2: Sounds & Spelling Patterns (teacher-only)"), b=html.indexOf('/* ---------- Check 1: "What to Teach Next" (teacher-only)');
  const mine=html.slice(a,b); ok(mine.length>3000 && !/=>|\bconst\s|\blet\s/.test(mine),"the new viewer code is ES5 only");
  ok(!/new Audio|Audio\(|getUserMedia|MediaRecorder|speechSynthesis|localStorage|sessionStorage|indexedDB|XMLHttpRequest|fetch\(/.test(mine),"the viewer has no audio, speech, camera/microphone, storage or network code of its own (the icons on the slides are placeholders)");
  const cssA=html.indexOf("/* ===== Check 2: Sounds & Spelling Patterns (60-slide deck as lossless images"), cssB=html.indexOf("#c1n-print{display:none}");
  const reF=/font-family:[^;}]*Comic Neue/g; let mf; const offs=[]; while((mf=reF.exec(html))){ offs.push(mf.index); }
  ok(offs.length>=3 && offs.every(function(o){ return o>cssA && o<cssB; }),"Comic Neue Bold is used only inside this resource's CSS block (the rest of the app keeps its fonts)");
  ok(/@font-face\{font-family:"Comic Neue";font-weight:700;[^}]*ComicNeue-Bold\.ttf/.test(html),"Comic Neue is self-hosted (weight 700) from the assets folder");
  ok(/<\/script>\s*<\/body>\s*<\/html>\s*$/.test(html),"index.html ends with </script></body></html>");
  console.log("c2-ssp: "+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
})().catch(function(e){ console.log("TEST CRASH:",e&&e.stack||e); process.exit(1); });
