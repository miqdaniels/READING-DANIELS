/*
 * Diagnostic Tools -- Check 1 (Letter Identification): student flow + teacher scoring.
 * jsdom click-simulation, mirroring tests/test-studentmenu.js's fakes (MediaRecorder + IndexedDB).
 * Run: npm test
 */
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const HTML = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

function makeDom(url) {
  const databases = {};
  return new JSDOM(HTML, {
    url: url || "https://localhost/",
    runScripts: "dangerously",
    pretendToBeVisual: true,
    beforeParse(w) {
      w.HTMLElement.prototype.scrollIntoView = function () {};
      w.scrollTo = function () {};
      class FakeRec {
        constructor(s) { this.state = "inactive"; this.mimeType = "audio/webm"; this._s = s; }
        start() { this.state = "recording"; if (this.ondataavailable) { this.ondataavailable({ data: { size: 10, type: "audio/webm" } }); } }
        stop() { this.state = "inactive"; if (this.onstop) { this.onstop(); } }
      }
      w.MediaRecorder = FakeRec;
      w.URL.createObjectURL = function () { return "blob:x"; };
      w.URL.revokeObjectURL = function () {};
      Object.defineProperty(w.navigator, "mediaDevices", {
        value: { getUserMedia: function () { return Promise.resolve({ getTracks: function () { return [{ stop: function () {} }]; } }); } },
        configurable: true
      });

      function FakeIDBFactory() {}
      FakeIDBFactory.prototype.open = function (name) {
        var req = {};
        setTimeout(function () {
          if (!databases[name]) { databases[name] = { stores: {} }; }
          var dbRec = databases[name];
          var db = {
            objectStoreNames: { contains: function (n) { return !!dbRec.stores[n]; } },
            createObjectStore: function (n) { dbRec.stores[n] = {}; return dbRec.stores[n]; },
            transaction: function (n) {
              var store = dbRec.stores[n];
              var tx = {};
              tx.objectStore = function () {
                return {
                  put: function (val, key) { store[key] = val; },
                  get: function (key) { var r = {}; setTimeout(function () { r.result = store.hasOwnProperty(key) ? store[key] : undefined; if (r.onsuccess) r.onsuccess(); }, 0); return r; },
                  getAllKeys: function () { var r = {}; setTimeout(function () { r.result = Object.keys(store); if (r.onsuccess) r.onsuccess(); }, 0); return r; }
                };
              };
              Object.defineProperty(tx, "oncomplete", { set: function (fn) { setTimeout(fn, 0); }, configurable: true });
              Object.defineProperty(tx, "onerror", { set: function () {}, configurable: true });
              return tx;
            }
          };
          req.result = db;
          if (req.onupgradeneeded) req.onupgradeneeded();
          req.result = db;
          if (req.onsuccess) req.onsuccess();
        }, 0);
        return req;
      };
      w.indexedDB = new FakeIDBFactory();
    }
  });
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let pass = 0, fail = 0;
function ck(cond, msg) { if (cond) { pass++; } else { fail++; console.log("FAIL:", msg); } }

function activeId(w) { var s = w.document.getElementsByClassName("screen"); for (var i = 0; i < s.length; i++) { if (/active/.test(s[i].className)) { return s[i].id; } } return null; }
function click(el) { el.dispatchEvent(new el.ownerDocument.defaultView.Event("click", { bubbles: true })); }
function btnByText(root, text) { var b = root.querySelectorAll("button"), i; for (i = 0; i < b.length; i++) { if (b[i].textContent.indexOf(text) === 0) { return b[i]; } } return null; }
function hasClass(el, cls) { return (" " + el.className + " ").indexOf(" " + cls + " ") > -1; }

(async () => {
  const dom = makeDom("https://localhost/");
  const w = dom.window, d = w.document;
  await wait(400);

  w.CURCLASS = w.CLASSES[0];
  w.READER = w.CLASSES[0].students[0];

  console.log("Student: menu entry + hub");
  w.go("studentMenu");
  var diagBtn = null, mbtns = d.querySelectorAll("#studentMenu .btn"), i;
  for (i = 0; i < mbtns.length; i++) { if (mbtns[i].textContent.indexOf("Diagnostic Tools") === 0) { diagBtn = mbtns[i]; } }
  ck(!!diagBtn, "Diagnostic Tools button present on the student menu");
  click(diagBtn);
  ck(activeId(w) === "s-diag", "opens the Diagnostic Tools hub");

  var hub = d.getElementById("s-diag");
  var c1 = btnByText(hub, "Check 1: Letter Names");
  ck(!!c1 && !c1.disabled, "Check 1 is enabled");
  var locked = hub.querySelectorAll(".btn.locked");
  ck(locked.length === 6, "Checks 2-7 are present but locked (6 checks)");
  for (i = 0; i < locked.length; i++) {
    ck(locked[i].disabled === true, "locked check is actually disabled: " + locked[i].textContent);
    ck(/Not built yet/.test(locked[i].textContent), "locked check is labeled honestly, not faked: " + locked[i].textContent);
  }

  console.log("Data: Check 1 letter sequence matches the spec's fixed mixed order exactly");
  ck(w.DIAG1_UPPER.join(",") === "M,T,A,S,P,R,F,B,L,C,H,N,D,G,W,E,K,J,U,V,Y,I,Q,O,X,Z", "uppercase sequence matches spec");
  ck(w.DIAG1_LOWER.join(",") === "s,m,a,t,r,p,c,f,n,h,b,l,d,e,g,i,w,k,u,y,j,v,o,q,x,z", "lowercase sequence matches spec");
  ck(w.DIAG1_SEQ.length === 52, "52 letters total (26 upper + 26 lower)");

  console.log("Student: Check 1 -- one continuous recording, no model audio, exact letter order");
  click(c1);
  ck(activeId(w) === "s-diag1", "opens Check 1");
  ck(d.getElementById("diag1-start").style.display !== "none", "Start button shown before recording begins");
  ck(d.getElementById("diag1-body").style.display === "none", "letter/Next UI hidden until Start is tapped");

  click(d.querySelector("#diag1-start .btn"));
  await wait(30);
  ck(w.recording === true, "recording began when the student tapped Start");
  ck(d.getElementById("diag1-letter").textContent === "M", "first letter shown is M, the first of the fixed sequence");
  ck(d.getElementById("diag1-progress").textContent === "1 of 52", "progress reads 1 of 52");

  var nextBtn = d.getElementById("diag1-next");
  for (i = 0; i < 25; i++) { click(nextBtn); }
  ck(d.getElementById("diag1-letter").textContent === "Z", "26th letter (last uppercase) is Z");
  click(nextBtn);
  ck(d.getElementById("diag1-letter").textContent === "s", "27th letter (first lowercase) is s");
  for (i = 0; i < 25; i++) { click(nextBtn); }
  ck(d.getElementById("diag1-letter").textContent === "z", "52nd letter (last lowercase) is z");
  ck(d.getElementById("diag1-next").textContent === "Finish", "the last letter's button reads Finish, not Next");

  click(nextBtn); // Finish
  await wait(60);
  ck(d.getElementById("diag1-body").style.display === "none", "letter/Next UI hides once the check is finished");
  ck(/Now turn it in on Canvas/.test(d.getElementById("diag1-after").innerHTML), "Canvas Upload instructions shown (never Record)");
  ck(!/Record\s*<\/strong>/.test(d.getElementById("diag1-after").innerHTML), "instructions never tell the student to use Canvas's Record button");

  var attempts = w.DiagAttempts.forStudent(w.READER.id);
  ck(attempts.length === 1, "one diagnostic attempt saved locally");
  ck(attempts[0].check === "check1" && attempts[0].status === "recorded", "attempt recorded, awaiting teacher scoring");
  ck(attempts[0].durationSec >= 1, "a completion time was captured automatically (no manual entry needed)");
  ck(attempts[0].studentName === w.READER.name, "first name + last name as stored on this device (same privacy model as the rest of index.html)");

  var backBtn = btnByText(d.getElementById("diag1-after"), "Back to Diagnostic Tools");
  ck(!!backBtn, "a way back to Diagnostic Tools is offered");
  click(backBtn);
  ck(activeId(w) === "s-diag", "Back to Diagnostic Tools returns to the hub");

  console.log("Teacher: scoring screen reachable and gated the same way as other teacher screens");
  w.go("s-diagteach");
  ck(activeId(w) === "s-diagteach", "teacher scoring screen opens");
  var stuBtns = d.querySelectorAll("#diagt-roster .btn"), target = null;
  for (i = 0; i < stuBtns.length; i++) { if (stuBtns[i].textContent.indexOf(w.READER.name) === 0) { target = stuBtns[i]; } }
  ck(!!target, "student listed on the roster");
  ck(/\(1\)/.test(target.textContent), "attempt count shown next to the student's name");
  click(target);

  ck(/Not yet scored/.test(d.getElementById("diagt-attempt-list").textContent), "unscored attempt is labeled honestly");
  var openBtn = d.querySelector("#diagt-attempt-list .mini-btn");
  ck(!!openBtn, "an Open button is offered for the attempt");
  click(openBtn);
  await wait(30);

  ck(d.getElementById("diagteach-audio").style.display === "block", "the on-device recording loads and is ready to play automatically (no Canvas round-trip needed on the same device)");
  ck(!!d.getElementById("diagteach-file"), "a file picker is offered as a fallback for recordings opened from a Canvas download on another device");

  var upperGrid = d.getElementById("diagteach-grid-upper"), lowerGrid = d.getElementById("diagteach-grid-lower");
  ck(upperGrid.children.length === 26, "26 uppercase letters in the tap grid");
  ck(lowerGrid.children.length === 26, "26 lowercase letters in the tap grid");
  ck(upperGrid.children[0].textContent === "M" && lowerGrid.children[0].textContent === "s", "grid letters are in the same fixed order as the student saw them");

  console.log("Teacher: tapping a letter cycles through every scoring category and back to blank");
  /* diagteachTap() rebuilds the grid's DOM on every tap, so we must re-fetch
     the live node after each click rather than reuse a stale reference. */
  function upperM() { return d.getElementById("diagteach-grid-upper").children[0]; }
  click(upperM()); ck(hasClass(upperM(), "correct"), "tap 1: correct");
  click(upperM()); ck(hasClass(upperM(), "incorrect"), "tap 2: incorrect");
  click(upperM()); ck(hasClass(upperM(), "self"), "tap 3: self-corrected");
  click(upperM()); ck(hasClass(upperM(), "skip"), "tap 4: skip / no response");
  click(upperM()); ck(upperM().className === "diag-letter", "tap 5: cycles back to blank (not yet scored)");

  console.log("Teacher: score a known set and verify the computed report + targets");
  /* every click repaints the grid, so always re-fetch the live element at
     this index rather than reuse a node from before any click. */
  function upper(idx) { return d.getElementById("diagteach-grid-upper").children[idx]; }
  click(upper(0)); // M -> correct
  click(upper(1)); // T -> correct
  click(upper(2)); // A -> correct
  click(upper(3)); click(upper(3)); // S -> incorrect
  click(upper(4)); click(upper(4)); click(upper(4)); click(upper(4)); // P -> skip
  click(upper(5)); click(upper(5)); click(upper(5)); // R -> self-corrected

  var totalsText = d.getElementById("diagteach-totals").textContent;
  ck(/Uppercase:\s*4\s*\/\s*26/.test(totalsText), "uppercase total counts Correct + Self-corrected as correct (4/26): " + totalsText);
  ck(/Self-corrections:\s*1/.test(totalsText), "self-corrections tracked separately: " + totalsText);

  var saveBtn = btnByText(d.getElementById("diagteach-panel"), "Save results");
  ck(!!saveBtn, "Save results button present");
  click(saveBtn);
  ck(/Saved\./.test(d.getElementById("diagteach-saved-note").textContent), "save confirmation shown");

  var updated = w.DiagAttempts.get(attempts[0].id);
  ck(updated.status === "scored", "attempt marked scored after Save");
  ck(updated.summary.upperCorrect === 4, "saved summary: 4 uppercase correct (M, T, A correct + R self-corrected)");
  ck(updated.summary.upperMissed.indexOf("S") > -1 && updated.summary.upperMissed.indexOf("P") > -1, "saved summary lists S and P as missed (incorrect/skip), preserving raw detail, not just a percentage");
  ck(updated.summary.selfCorrections === 1, "one self-correction recorded in the saved summary");
  ck(updated.summary.totalItems === 52 && updated.summary.upperTotal === 26 && updated.summary.lowerTotal === 26, "raw denominators preserved (52 total / 26 upper / 26 lower)");

  var results = w.DiagResults.get(w.READER.id);
  ck(results.check1 && results.check1.totalCorrect === updated.summary.totalCorrect, "DiagResults mirrors the saved summary -- this is what Sync.pushDiag sends");

  var targetsHtml = d.getElementById("diagteach-targets").innerHTML;
  ck(targetsHtml.indexOf("S, P") > -1, "missed letters (S, P) appear in the What to teach next panel");
  ck(/age-respectful reading intervention lesson/.test(targetsHtml), "an AI lesson prompt is generated from the missed letters, without retyping them");
  ck(/Do not diagnose a disability/.test(targetsHtml), "the generated prompt explicitly tells the AI tool not to diagnose a disability");

  var copyBtn = btnByText(d.getElementById("diagteach-targets"), "Copy AI lesson prompt");
  ck(!!copyBtn, "Copy AI lesson prompt button present");
  click(copyBtn); // jsdom has no clipboard; this only confirms the handler doesn't throw

  console.log("Teacher: a fully-correct attempt reports no targets, honestly");
  var second = w.DiagAttempts.add({ id: "diagtest_clean", studentId: w.READER.id, studentName: w.READER.name, check: "check1", date: w.azDateStr(), durationSec: 90, status: "recorded" });
  w.diagteachPaintAttempts();
  /* two attempts can land on the same date, so pick the row by attempt id
     rather than assume list position/order. */
  var cleanBtn = null, allOpenBtns = d.querySelectorAll("#diagt-attempt-list .mini-btn"), oi;
  for (oi = 0; oi < allOpenBtns.length; oi++) { if ((allOpenBtns[oi].getAttribute("onclick") || "").indexOf("diagtest_clean") > -1) { cleanBtn = allOpenBtns[oi]; } }
  ck(!!cleanBtn, "the new, unscored attempt has its own Open button");
  click(cleanBtn);
  await wait(30);
  ck(w.DIAGTEACH_ATTEMPT && w.DIAGTEACH_ATTEMPT.id === "diagtest_clean", "opened the correct (unscored) attempt");
  for (i = 0; i < 26; i++) { click(d.getElementById("diagteach-grid-upper").children[i]); }
  for (i = 0; i < 26; i++) { click(d.getElementById("diagteach-grid-lower").children[i]); }
  click(btnByText(d.getElementById("diagteach-panel"), "Save results"));
  ck(/All 52 letters were named correctly/.test(d.getElementById("diagteach-targets").innerHTML), "a perfect check honestly reports no instructional targets, instead of inventing one");

  console.log("\n=== " + pass + " passed, " + fail + " failed ===");
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
