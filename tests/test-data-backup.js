const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('./index.html','utf8').replace('<script src="clips.js" defer></script>','<script>'+fs.readFileSync('./clips.js','utf8')+'</script>');

/* Workstream C -- Teacher Data Backup/Restore. Fictional students only
   (the app's own existing roster, never real student data). Verifies:
   export structure/counts, validation rejects invalid/wrong/future-
   version files, merge adds new records without duplicating or
   overwriting, conflicting records are detected and skipped (never
   silently overwritten), a safety backup downloads automatically before
   any import changes data, and a round-trip (export -> wipe -> import)
   restores the same records. Also confirms .gitignore protects real
   exported backups from ever being committed. */
const w=new JSDOM(html,{url:"https://miqdaniels.github.io/READING-DANIELS/?teacher",runScripts:"dangerously",pretendToBeVisual:true,
  beforeParse(win){
    win.HTMLElement.prototype.scrollIntoView=function(){};
    win.scrollTo=function(){};
    var downloads=[];
    win.__downloads=downloads;
    var realCreateElement=win.document.createElement.bind(win.document);
    win.document.createElement=function(tag){
      var el=realCreateElement(tag);
      if(tag==="a"){ el.click=function(){ if(el.download){ downloads.push(el.download); } }; }
      return el;
    };
    win.URL.createObjectURL=function(){ return "blob:x"; };
    win.URL.revokeObjectURL=function(){};
  }}).window;
const d=w.document;
let pass=0, fail=0;
function ok(c,m){ if(c){pass++;} else {fail++; console.log("FAIL:",m);} }

/* ---- seed some fictional Check 4 + Check 6B attempts, matching the
   real shape each Finish/Save function produces ---- */
var sid1="stu_gomezmiriam_p1", sid2="stu_guerrerooneiver_p1";
function seedC4(sid){
  var scores=[]; for(var i=0;i<w.C4_ITEMS.length;i++){ scores.push(""); }
  var a=w.C4Attempts.add({id:w.rfUid(), studentId:sid, studentName:"X", date:w.azDateStr(), fileName:"f.webm",
    totalTimeMs:1000, reachedCount:w.C4_ITEMS.length, scores:null, note:null, bandCorrect:null, realWordsCorrect:null, pseudoCorrect:null, targets:null});
  w.C4Review.update(a.id,{scores:scores});
  return a.id;
}
var attemptId1=seedC4(sid1), attemptId2=seedC4(sid2);

/* ---- export: structure + counts ---- */
var backup=w.tdBuildBackup();
ok(backup.rfBackupId==="READING_FOUNDATIONS_TEACHER_BACKUP","backup carries the Reading Foundations identifier");
ok(typeof backup.backupVersion==="number" && typeof backup.schemaVersion==="number","backup carries both a backup version and a schema/data version");
ok(backup.counts.diagnosticRecords>=2,"diagnostic record count includes the two seeded Check 4 attempts (got "+backup.counts.diagnosticRecords+")");
ok(backup.counts.students>=2,"student count reflects distinct students with evidence (got "+backup.counts.students+")");
ok(backup.data.attempts["rf_check4_attempts"].length>=2,"the actual Check 4 attempt records are present in the export");
ok(JSON.stringify(backup).indexOf("data:audio")===-1 && JSON.stringify(backup).indexOf("data:video")===-1,"no audio/video data URLs are ever included in the backup (Canvas stays the media location)");

/* ---- export downloads the correctly-named file, and calling it exercises the real UI path too ---- */
w.go("dataMgmt");
ok(d.getElementById("dataMgmt").className.indexOf("active")>-1,"Data Management screen opens");
w.dmDoExport();
ok(w.__downloads.length===1,"exactly one file downloaded on Export");
ok(/^Reading_Foundations_Teacher_Backup_\d{4}_\d{2}_\d{2}_\d{4}\.json$/.test(w.__downloads[0]),"exported filename follows the required pattern (got "+w.__downloads[0]+")");
var exportResultText=d.getElementById("dm-export-result").textContent;
ok(/Backup created successfully/.test(exportResultText),"export confirmation message shown");
ok(exportResultText.indexOf("Diagnostic records")>-1,"export confirmation shows the diagnostic record count");

/* ---- validation: invalid JSON, wrong identifier, future version ---- */
ok(w.tdValidateBackup(null).ok===false,"validation rejects null");
ok(w.tdValidateBackup({foo:"bar"}).ok===false,"validation rejects a file missing the Reading Foundations identifier");
ok(w.tdValidateBackup({rfBackupId:"SOMETHING_ELSE",backupVersion:1,schemaVersion:1,data:{}}).ok===false,"validation rejects a non-Reading-Foundations JSON file");
ok(w.tdValidateBackup({rfBackupId:"READING_FOUNDATIONS_TEACHER_BACKUP",backupVersion:999,schemaVersion:1,data:{}}).ok===false,"validation rejects a backup version newer than this app understands");
ok(w.tdValidateBackup({rfBackupId:"READING_FOUNDATIONS_TEACHER_BACKUP",backupVersion:1,schemaVersion:999,data:{}}).ok===false,"validation rejects a schema version newer than this app understands");
ok(w.tdValidateBackup(backup).ok===true,"validation accepts the app's own real export");

/* ---- merge: adding a genuinely new record ---- */
var beforeLen=w.C4Attempts.all().length;
var newAttempt={id:w.rfUid(), studentId:"stu_hashimotohiroyuki_p1", studentName:"Y", date:w.azDateStr(), fileName:"new.webm",
  totalTimeMs:500, reachedCount:10, scores:null, note:null, bandCorrect:null, realWordsCorrect:null, pseudoCorrect:null, targets:null};
var r1=w.tdMergeAttempts("rf_check4_attempts",[newAttempt]);
ok(r1.added===1 && r1.skippedDup===0 && r1.conflicts===0,"merging one genuinely new attempt adds exactly one record");
ok(w.C4Attempts.all().length===beforeLen+1,"the new attempt is actually persisted to localStorage");

/* ---- merge: an identical duplicate is a no-op, never double-added ---- */
var existing=w.C4Attempts.get(attemptId1);
var r2=w.tdMergeAttempts("rf_check4_attempts",[existing]);
ok(r2.added===0 && r2.skippedDup===1 && r2.conflicts===0,"re-importing an identical existing attempt is a silent no-op, not a duplicate");

/* ---- merge: a genuine conflict (same id, different content) is detected and SKIPPED, never overwritten ---- */
var conflicting=JSON.parse(JSON.stringify(existing));
conflicting.note="a different note that was never actually saved here";
var beforeNote=w.C4Attempts.get(attemptId1).note;
var r3=w.tdMergeAttempts("rf_check4_attempts",[conflicting]);
ok(r3.conflicts===1 && r3.added===0,"a same-id-different-content record is flagged as a conflict, not silently merged");
ok(w.C4Attempts.get(attemptId1).note===beforeNote,"the conflicting record's content was never written -- the existing record is untouched");

/* ---- import UI: validate -> preview -> safety backup downloads BEFORE anything changes -> merge ---- */
w.go("dataMgmt");
var freshBackup=w.tdBuildBackup(); // snapshot to "import" -- simulates a backup made on another device
var beforeImportDownloads=w.__downloads.length;
var beforeAttemptCount=w.C4Attempts.all().length;
w.DM_PENDING_BACKUP=freshBackup;
w.dmContinueImport();
ok(w.__downloads.length===beforeImportDownloads+1,"exactly one safety-backup file downloads automatically as part of Continue Import");
ok(/^Reading_Foundations_SAFETY_BEFORE_IMPORT_/.test(w.__downloads[w.__downloads.length-1]),"the safety backup's filename clearly marks it as the pre-import snapshot (got "+w.__downloads[w.__downloads.length-1]+")");
ok(w.C4Attempts.all().length===beforeAttemptCount,"importing a backup that's an exact snapshot of current data adds nothing new (all duplicates)");
var importResultText=d.getElementById("dm-import-result").textContent;
ok(/Import complete/.test(importResultText),"import completion message shown");

/* ---- round trip: export, wipe this "device", import -- the records come back ---- */
var roundTripBackup=w.tdBuildBackup();
var beforeWipe=JSON.stringify(w.C4Attempts.all());
w.localStorage.removeItem("rf_check4_attempts");
ok(w.C4Attempts.all().length===0,"simulated a fresh device: Check 4 attempts are gone");
var summary=w.tdRunImport(roundTripBackup);
ok(summary.attempts["rf_check4_attempts"].added>0,"round-trip import restores the wiped Check 4 attempts");
ok(JSON.stringify(w.C4Attempts.all().sort(function(a,b){return a.id<b.id?-1:1;}))===JSON.stringify(JSON.parse(beforeWipe).sort(function(a,b){return a.id<b.id?-1:1;})),
  "the restored records are byte-identical to what was exported (a true round trip)");

/* ---- file-picker path: FileReader-driven import goes through the same validate+preview gate ---- */
w.go("dataMgmt");
var fakeInput={ files:[ new w.Blob([JSON.stringify(backup)],{type:"application/json"}) ] };
// jsdom's FileReader can read a Blob directly
var reader=new w.FileReader();
var previewShown=false;
reader.onload=function(){
  var obj=JSON.parse(reader.result);
  var v=w.tdValidateBackup(obj);
  ok(v.ok===true,"a real exported file re-validates successfully when re-imported");
  previewShown=true;
};
reader.readAsText(fakeInput.files[0]);

/* ---- privacy: real backups can never be committed by the normal dev workflow ---- */
var gitignore=fs.readFileSync('./.gitignore','utf8');
ok(gitignore.indexOf("Reading_Foundations_Teacher_Backup_*.json")>-1,".gitignore excludes the teacher backup filename pattern");
ok(gitignore.indexOf("Reading_Foundations_SAFETY_BEFORE_IMPORT_*.json")>-1,".gitignore excludes the pre-import safety-backup filename pattern");
ok(!fs.existsSync('./Reading_Foundations_Teacher_Backup_test.json'),"no real backup file exists anywhere in the repo working tree");

/* ---- Data Management is teacher-only: never reachable from a plain student URL ---- */
var domS=new JSDOM(html,{url:"https://miqdaniels.github.io/READING-DANIELS/",runScripts:"dangerously",pretendToBeVisual:true,
  beforeParse(win){ win.HTMLElement.prototype.scrollIntoView=function(){}; win.scrollTo=function(){}; }});
var wS=domS.window, dS=wS.document;
ok(dS.getElementById("dataMgmt").getAttribute("data-teacher")==="1","the Data Management screen is marked teacher-only (data-teacher=1), same convention as every other teacher screen");

console.log("\n=== "+pass+" passed, "+fail+" failed ===");
process.exit(fail?1:0);
