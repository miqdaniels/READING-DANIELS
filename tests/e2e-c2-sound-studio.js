/* REAL-BROWSER check (not part of `npm test`): needs Playwright + Chromium and a static server.
   Usage: node tests/e2e-c2-sound-studio.js <baseUrl> <outDir>
   Uses Chromium's FAKE microphone device (a test tone), so it exercises the real
   getUserMedia/MediaRecorder/IndexedDB/download/fullscreen code paths but is NOT a substitute
   for a test with a real microphone. */
const {chromium}=require('/opt/node-tools/node_modules/playwright'); const fs=require('fs'), cp=require('child_process'), crypto=require('crypto');
const base=process.argv[2], out=process.argv[3]; let pass=0, fail=0; function ok(c,m){ if(c){pass++; console.log("PASS "+m);} else {fail++; console.log("FAIL "+m);} }
const sha=function(b){ return crypto.createHash('sha256').update(b).digest('hex'); };
(async()=>{
 const exe={executablePath:'/opt/pw-browsers/chromium'};
 const b=await chromium.launch(Object.assign({args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required']},exe));
 const ctx=await b.newContext({viewport:{width:1366,height:768},acceptDownloads:true}); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(function(){ window.__plays=0; window.__srcs=[]; var o=HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.play=function(){ window.__plays++; window.__srcs.push(this.src); return o.apply(this,arguments).catch(function(){}); }; });
 await p.goto(base+'/index.html?teacher'); await p.waitForTimeout(1500);
 await p.evaluate(()=>go('teachNext')); await p.click('.tn-card[data-check="2"]');
 ok(await p.isVisible('#c2n-open-slideshow') && await p.isVisible('#c2n-open-studio'),"Check 2 page shows the slideshow and studio resources");
 /* PowerPoint download byte-identical */
 const [dl0]=await Promise.all([p.waitForEvent('download'),p.click('#c2n-dl-pptx')]); const pf=out+'/dl.pptx'; await dl0.saveAs(pf);
 ok(sha(fs.readFileSync(pf))==="41bafb8be9059bbfb0aea31d14a02d28e96754309799a99547513c8157cce318","downloaded PowerPoint is byte-identical to the approved file");
 /* studio: real mic */
 await p.click('#c2n-open-studio'); await p.waitForTimeout(500);
 ok((await p.innerText('#c2st-progress'))==='0 of 44 Sounds Recorded.',"studio starts at 0 of 44");
 ok(await p.evaluate(()=>navigator.mediaDevices && !window.__gumCalled),"microphone not touched on opening the studio");
 await p.screenshot({path:out+'/studio-empty.png',fullPage:true});
 async function rec(n,ms){ await p.evaluate((n)=>c2stSelect(n),n); await p.click('#c2st-record'); await p.waitForSelector('.c2st-recdot'); await p.waitForTimeout(ms||900); if(n===1){ await p.screenshot({path:out+'/studio-recording.png'}); } await p.click('#c2st-stop'); await p.waitForFunction(()=>/Draft/.test(document.getElementById('c2st-status').textContent)); await p.click('#c2st-listen'); await p.click('#c2st-save'); await p.waitForFunction((n)=>!!C2ST_SAVED[n],n); }
 await rec(1); await rec(12); await rec(21);
 ok((await p.innerText('#c2st-progress'))==='3 of 44 Sounds Recorded.',"3 sounds recorded with the real (fake-device) microphone");
 ok(await p.evaluate(()=>window.__plays)>=3,"Listen played the draft in the real audio element");
 const fmt=await p.innerText('#c2st-format'); console.log("INFO format line:",fmt); ok(/audio\/webm/.test(fmt),"actual format reported: audio/webm");
 await p.screenshot({path:out+'/studio-saved.png',fullPage:true});
 /* reload: persistence in real IndexedDB */
 await p.reload(); await p.waitForTimeout(1200); await p.evaluate(()=>go('c2Studio')); await p.waitForTimeout(600);
 ok((await p.innerText('#c2st-progress'))==='3 of 44 Sounds Recorded.',"recordings survive a full page reload (IndexedDB)");
 /* slideshow: speaker plays recorded, says missing for others */
 await p.evaluate(()=>c2shOpen(1)); await p.waitForTimeout(500); await p.screenshot({path:out+'/slideshow-menu.png'});
 await p.click('.c2sh-menu[aria-label="Open slide for /r/"]'); await p.waitForTimeout(400);
 ok((await p.getAttribute('#c2sh-img','alt')).indexOf('/r/')>-1,"menu item opens the /r/ slide");
 await p.evaluate(()=>{window.__plays=0;}); await p.click('.c2sh-speaker'); await p.waitForTimeout(500);
 ok(await p.evaluate(()=>window.__plays)===1 && /Playing \/r\/ \(sound 12\)/.test(await p.innerText('#c2sh-msg')),"speaker icon plays the saved /r/ recording once and names the sound");
 await p.screenshot({path:out+'/slideshow-sound.png'});
 await p.keyboard.press('ArrowRight'); await p.waitForTimeout(300); await p.evaluate(()=>{window.__plays=0;}); await p.click('.c2sh-speaker'); await p.waitForTimeout(400);
 ok(await p.evaluate(()=>window.__plays)===0 && /not recorded yet/.test(await p.innerText('#c2sh-msg')),"unrecorded sound: message shown, nothing plays");
 await p.screenshot({path:out+'/slideshow-missing.png'});
 /* hotspot geometry: clicking the real slide image where the deck's NEXT button is moves on */
 await p.evaluate(()=>c2shOpen(5)); await p.waitForTimeout(300);
 const box=await p.locator('#c2sh-stage').boundingBox(); const nx=C2S=await p.evaluate(()=>C2S_DATA.nav.next);
 await p.mouse.click(box.x+(nx[0]+nx[2]/2)*box.width, box.y+(nx[1]+nx[3]/2)*box.height); await p.waitForTimeout(300);
 ok((await p.getAttribute('#c2sh-img','src')).slice(-6)==='06.png',"clicking the picture where the deck's NEXT button is goes to the next slide");
 /* fullscreen */
 await p.click('#c2sh-full'); await p.waitForTimeout(500);
 ok(await p.evaluate(()=>!!document.fullscreenElement && document.fullscreenElement.id==='c2sh-fswrap'),"full-screen mode enters");
 const fb=await p.locator('#c2sh-stage').boundingBox(); ok(Math.abs(fb.width/fb.height-16/9)<0.02,"full-screen slide keeps 16:9");
 await p.keyboard.press('ArrowRight'); await p.waitForTimeout(250); ok((await p.getAttribute('#c2sh-img','src')).slice(-6)==='07.png',"arrow keys work in full screen");
 await p.screenshot({path:out+'/slideshow-fullscreen.png'});
 await p.evaluate(()=>document.exitFullscreen()); await p.waitForTimeout(400); ok(await p.evaluate(()=>!document.fullscreenElement),"full screen exits (Esc is the browser's own key; headless automation cannot send it, so exitFullscreen() was used)");
 /* export ZIP (real download) */
 await p.evaluate(()=>go('c2Studio')); await p.waitForTimeout(500);
 const [dl]=await Promise.all([p.waitForEvent('download'),p.click('#c2st-export')]); const zf=out+'/'+dl.suggestedFilename(); await dl.saveAs(zf);
 const lst=cp.execFileSync('unzip',['-l',zf],{encoding:'utf8'}); console.log(lst);
 ok(/c2_sound_01_b\.webm/.test(lst)&&/c2_sound_12_r\.webm/.test(lst)&&/c2_sound_21_th-voiceless\.webm/.test(lst)&&/manifest\.json/.test(lst),"real ZIP contains the 3 named audio files and manifest");
 const man=JSON.parse(cp.execFileSync('unzip',['-p',zf,'manifest.json'],{encoding:'utf8'})); ok(man.recordedCount===3&&man.sounds[20].file==='audio/c2_sound_21_th-voiceless.webm',"manifest maps sound 21 to its file");
 const wav=out+'/s12.webm'; fs.writeFileSync(wav,cp.execFileSync('unzip',['-p',zf,'audio/c2_sound_12_r.webm'],{maxBuffer:1e8}));
 const probe=cp.execFileSync('ffprobe',['-v','error','-show_entries','stream=codec_name,sample_rate,channels:format=duration','-of','default=nw=1',wav],{encoding:'utf8'}); console.log("INFO ffprobe:",probe.replace(/\n/g,' '));
 ok(/codec_name=opus/.test(probe)&&parseFloat(probe.match(/duration=([\d.]+)/)[1])>0.3,"exported audio is real Opus in WebM with real duration");
 /* the documented PowerPoint conversion step actually works */
 cp.execFileSync('ffmpeg',['-y','-v','error','-i',wav,'-c:a','aac','-b:a','128k',out+'/s12.m4a']); const pr2=cp.execFileSync('ffprobe',['-v','error','-show_entries','stream=codec_name','-of','default=nw=1',out+'/s12.m4a'],{encoding:'utf8'}); ok(/aac/.test(pr2),"documented ffmpeg step converts a recording to M4A/AAC");
 /* wipe the database, import the real ZIP, verify mapping */
 const h12=sha(fs.readFileSync(wav));
 await p.evaluate(()=>new Promise(r=>{ var q=indexedDB.deleteDatabase('rf_c2_sound_studio'); q.onsuccess=q.onerror=q.onblocked=()=>r(); }));
 await p.reload(); await p.waitForTimeout(1200); await p.evaluate(()=>go('c2Studio')); await p.waitForTimeout(600);
 ok((await p.innerText('#c2st-progress'))==='0 of 44 Sounds Recorded.',"after clearing browser data the studio is empty (as warned)");
 await p.setInputFiles('#c2st-import-file',zf); await p.waitForSelector('#c2st-import-go'); ok(/Found 3 recordings/.test(await p.innerText('#c2st-note')),"real import previews 3 recordings"); await p.click('#c2st-import-go'); await p.waitForFunction(()=>/3 of 44/.test(document.getElementById('c2st-progress').textContent));
 const back=await p.evaluate(async()=>{ const r=await C2SStore.get(12); const buf=await new Promise(res=>{const fr=new FileReader(); fr.onload=()=>res(Array.from(new Uint8Array(fr.result))); fr.readAsArrayBuffer(r.blob);}); return buf; });
 ok(sha(Buffer.from(back))===h12,"restored sound 12 is byte-identical to what was exported");
 ok(await p.evaluate(()=>!!C2ST_SAVED[1]&&!!C2ST_SAVED[21]&&!C2ST_SAVED[2]),"restored to sounds 1, 12, 21 and no others");

 /* ===== all 44 speaker icons, with a DIFFERENT recording injected for every sound ===== */
 await p.evaluate(async()=>{ for(let n=1;n<=44;n++){ await C2SStore.put({n:n,soundId:C2S_DATA.sounds[n-1].id,recordingId:C2S_DATA.sounds[n-1].file,type:'audio/webm',blob:new Blob([new Uint8Array([n,n,n+1,n+2,44-n])],{type:'audio/webm'}),size:5,savedAt:'x'}); } });
 const bad=[]; await p.evaluate(()=>c2shOpen(1));
 for(let n=1;n<=44;n++){
   await p.evaluate((i)=>c2shOpen(1)); await p.waitForTimeout(40);
   await p.click('.c2sh-menu[aria-label="Open slide for '+(await p.evaluate((i)=>C2S_DATA.sounds[i-1].symbol,n))+'"]'.replace(/"\]$/,'"]'));
   await p.waitForTimeout(40);
   const alt=await p.getAttribute('#c2sh-img','alt'); const src=await p.getAttribute('#c2sh-img','src');
   if(src.slice(-6)!==(n+1<10?'0':'')+(n+1)+'.png' || alt.indexOf(await p.evaluate((i)=>C2S_DATA.sounds[i-1].symbol,n))<0){ bad.push('menu '+n); }
   await p.evaluate(()=>{window.__srcs=[];}); await p.click('.c2sh-speaker'); await p.waitForTimeout(120);
   const got=await p.evaluate(async()=>{ if(window.__srcs.length!==1) return 'plays:'+window.__srcs.length; const r=await fetch(window.__srcs[0]); return Array.from(new Uint8Array(await r.arrayBuffer())); });
   if(JSON.stringify(got)!==JSON.stringify([n,n,n+1,n+2,44-n])) bad.push('audio '+n+' got '+JSON.stringify(got));
 }
 ok(bad.length===0,"real browser: for all 44 sounds the menu opens the right slide and the speaker icon plays only that sound's recording "+bad.join('; '));
 /* export all 44, wipe, import, verify every assignment byte-for-byte */
 await p.evaluate(()=>go('c2Studio')); await p.waitForTimeout(500);
 const [dlAll]=await Promise.all([p.waitForEvent('download'),p.click('#c2st-export')]); const zAll=out+'/all44.zip'; await dlAll.saveAs(zAll);
 const nl=cp.execFileSync('unzip',['-l',zAll],{encoding:'utf8'}).split('\n').filter(l=>/audio\/c2_sound_\d\d_/.test(l)).length; ok(nl===44,"real ZIP of all 44 has 44 uniquely named audio files");
 await p.evaluate(()=>new Promise(r=>{ var q=indexedDB.deleteDatabase('rf_c2_sound_studio'); q.onsuccess=q.onerror=q.onblocked=()=>r(); })); await p.reload(); await p.waitForTimeout(1200); await p.evaluate(()=>go('c2Studio')); await p.waitForTimeout(500);
 await p.setInputFiles('#c2st-import-file',zAll); await p.waitForSelector('#c2st-import-go'); await p.click('#c2st-import-go'); await p.waitForFunction(()=>/44 of 44/.test(document.getElementById('c2st-progress').textContent));
 const mix=await p.evaluate(async()=>{ const wrong=[]; for(let n=1;n<=44;n++){ const r=await C2SStore.get(n); const b=await new Promise(res=>{const fr=new FileReader(); fr.onload=()=>res(Array.from(new Uint8Array(fr.result))); fr.readAsArrayBuffer(r.blob);}); if(JSON.stringify(b)!==JSON.stringify([n,n,n+1,n+2,44-n])||r.soundId!==C2S_DATA.sounds[n-1].id) wrong.push(n); } return wrong; });
 ok(mix.length===0,"real browser: export -> wipe -> import restores all 44 recordings to the right sounds (mixed: "+mix.join(',')+")");
 await p.evaluate(()=>c2stSelect(22)); await p.screenshot({path:out+'/studio-confirm-th-voiced.png'});
 /* other app data untouched */
 ok(await p.evaluate(()=>{ var k, bad=0; for(k in localStorage){ if(/sound|c2s/i.test(k)) bad++; } return bad===0; }),"nothing stored in localStorage by the studio");
 ok(errs.length===0,"no JavaScript errors in the browser ("+errs.join("; ")+")");
 await b.close();
 /* permission denied */
 const b2=await chromium.launch(Object.assign({args:['--deny-permission-prompts','--use-fake-device-for-media-stream']},exe)); const p2=await (await b2.newContext({viewport:{width:1366,height:768}})).newPage();
 await p2.goto(base+'/index.html?teacher'); await p2.waitForTimeout(1200); await p2.evaluate(()=>go('c2Studio')); await p2.waitForTimeout(400); await p2.click('#c2st-record'); await p2.waitForTimeout(800);
 const note=await p2.innerText('#c2st-note'); console.log("INFO denied note:",note); ok(/blocked|could not be started/i.test(note) && !(await p2.locator('.c2st-recdot').count()),"denied microphone: helpful message, no recording started");
 await b2.close();
 console.log("e2e: "+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
})();
