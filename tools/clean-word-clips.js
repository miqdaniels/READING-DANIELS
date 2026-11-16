// Cleans Miquela's raw word takes (the unzipped Level 1 Words export) to the same standard as the phrases.
//   usage: node tools/clean-word-clips.js <raw-dir> [out-dir=audio/TALL-W] [mp3-dir=audio/TALL-W-mp3]
// Steps per clip (names are NEVER changed; WRD_xxx.webm in -> WRD_xxx.webm + WRD_xxx.mp3 out):
//   70 Hz high-pass -> noise gate -> trim dead air (keep 120 ms before, 150 ms after) -> pad 0.4 s silence at the end
//   -> measure, then -16 LUFS with a -1.5 dBTP limiter (two-pass loudnorm). WebM (Opus, mono) for the app, MP3 (128k, mono) for selling.
// Then run:  node tools/build-word-audio-map.js   to rebuild tall-word-audio.js.
var fs=require('fs'), path=require('path'), cp=require('child_process');
var raw=process.argv[2], out=process.argv[3]||path.join(__dirname,'..','audio','TALL-W'), mp3=process.argv[4]||path.join(__dirname,'..','audio','TALL-W-mp3');
if(!raw){ console.log("usage: node tools/clean-word-clips.js <raw-dir> [out-dir] [mp3-dir]"); process.exit(1); }
fs.mkdirSync(out,{recursive:true}); fs.mkdirSync(mp3,{recursive:true});
var PRE="highpass=f=70,agate=threshold=0.012:ratio=2:attack=5:release=90,silenceremove=start_periods=1:start_silence=0.12:start_threshold=-45dB:detection=peak,areverse,silenceremove=start_periods=1:start_silence=0.15:start_threshold=-45dB:detection=peak,areverse,apad=pad_dur=0.4";
function run(args){ return cp.spawnSync('ffmpeg',['-hide_banner','-nostats','-y'].concat(args),{encoding:'utf8',maxBuffer:64*1024*1024}); }
function measure(file){
  var r=run(['-i',file,'-af',PRE+',loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json','-f','null','-']), t=(r.stderr||""), m=t.match(/\{[^{}]*"input_i"[^{}]*\}/);
  return m ? JSON.parse(m[0]) : null;
}
var files=fs.readdirSync(raw).filter(function(f){ return /\.(webm|ogg|m4a|wav|mp3)$/i.test(f) && /^(WRD_|PHR_)/.test(f); }).sort(), ok=0, bad=[];
files.forEach(function(f){
  var base=f.replace(/\.[^.]+$/,""), src=path.join(raw,f), m=measure(src), ln, o1=path.join(out,base+".webm"), o2=path.join(mp3,base+".mp3"), r1, r2, chain;
  if(!m){ bad.push(f+" (could not measure)"); return; }
  ln="loudnorm=I=-16:TP=-1.5:LRA=11:measured_I="+m.input_i+":measured_LRA="+m.input_lra+":measured_TP="+m.input_tp+":measured_thresh="+m.input_thresh+":offset="+m.target_offset+":linear=true:print_format=summary";
  chain=PRE+","+ln+",alimiter=limit=0.84:level=false";
  r1=run(['-i',src,'-af',chain,'-ac','1','-c:a','libopus','-b:a','96k',o1]);
  r2=run(['-i',src,'-af',chain,'-ac','1','-c:a','libmp3lame','-b:a','128k',o2]);
  if(r1.status===0 && r2.status===0){ ok++; } else { bad.push(f+" (ffmpeg failed)"); }
});
console.log("cleaned "+ok+" of "+files.length+" clips -> "+out+" (webm) and "+mp3+" (mp3)"+(bad.length?"\nFAILED: "+bad.join(", "):""));
