// Locks Mick's 11 model-read clips with the TEACHER PIN. Run on a trusted machine, never commit the PIN.
//   RF_PIN='xxxx-xxxx' node tools/encrypt-g1-audio.js <folder with PSG_1_00.webm ... PSG_1_10.webm>
// Output: audio/TALL-G1/PSG_1_xx.enc  =  salt(16) | iv(12) | AES-256-GCM ciphertext+tag.
// Key = PBKDF2-SHA256(normalized PIN, salt, 200000 iterations). Each file has its own random salt,
// so a PIN unlocks one passage at a time. Normalized PIN = lowercase letters/digits only.
var fs=require('fs'), crypto=require('crypto'), path=require('path');
var src=process.argv[2], pin=(process.env.RF_PIN||"").toLowerCase().replace(/[^a-z0-9]/g,"");
if(!src || pin.length<8){ console.error("usage: RF_PIN='8+ chars' node tools/encrypt-g1-audio.js <folder of plain .webm>"); process.exit(1); }
var out=path.join(__dirname,'..','audio','TALL-G1'), i, n=0;
/* pin-check.enc: a tiny file that only the right PIN can open (the app uses it to verify the teacher PIN
   quickly, e.g. for the cold-read reset, without downloading a whole clip). */
function lockBuf(plain){
  var salt=crypto.randomBytes(16), iv=crypto.randomBytes(12), key=crypto.pbkdf2Sync(pin,salt,200000,32,'sha256');
  var c=crypto.createCipheriv('aes-256-gcm',key,iv); return Buffer.concat([salt,iv,c.update(plain),c.final(),c.getAuthTag()]);
}
fs.writeFileSync(path.join(out,"pin-check.enc"),lockBuf(Buffer.from("rf-teacher-pin-ok")));
if(process.env.RF_CHECK_ONLY){ console.log("wrote pin-check.enc only"); process.exit(0); }
for(i=0;i<11;i++){
  var id="PSG_1_"+(i<10?"0":"")+i, plain=fs.readFileSync(path.join(src,id+".webm"));
  if(plain[0]!==0x1a||plain[1]!==0x45){ throw new Error(id+" is not a webm"); }
  var salt=crypto.randomBytes(16), iv=crypto.randomBytes(12);
  var key=crypto.pbkdf2Sync(pin,salt,200000,32,'sha256');
  var c=crypto.createCipheriv('aes-256-gcm',key,iv), ct=Buffer.concat([c.update(plain),c.final(),c.getAuthTag()]);
  fs.writeFileSync(path.join(out,id+".enc"),Buffer.concat([salt,iv,ct])); n++;
}
console.log("encrypted",n,"clips ->",out);
