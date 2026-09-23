/*
 * End-to-end test for cloud sync: the real index.html (jsdom) talks to the real
 * api/sync.js handler, which talks to an in-memory fake of Upstash Redis.
 * Run: npm test
 */
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

process.env.CLASS_CODES = "p1=K7P2,p3=M4Q8,p7=T9W3";
process.env.KV_REST_API_URL = "https://fake-redis.test";
process.env.KV_REST_API_TOKEN = "tok";
const handler = require("../api/sync.js");

/* ---- fake Upstash REST ---- */
const db = new Map();
let redisUp = true;
global.fetch = async (url, opts) => {
  if (!redisUp) { return { ok: false, status: 503, json: async () => ({ error: "down" }) }; }
  const [cmd, key, field, val] = JSON.parse(opts.body);
  const h = db.get(key) || new Map(); db.set(key, h);
  let result = null;
  if (cmd === "HSET") { h.set(field, val); result = 1; }
  else if (cmd === "HGET") { result = h.has(field) ? h.get(field) : null; }
  else if (cmd === "HGETALL") { result = []; for (const [k, v] of h) { result.push(k, v); } }
  return { ok: true, status: 200, json: async () => ({ result }) };
};

/* ---- call the handler like Vercel would ---- */
async function callApi(method, url, body) {
  const u = new URL(url, "https://x.test");
  const req = { method, query: Object.fromEntries(u.searchParams), body };
  let code = 200, out = null;
  const res = { setHeader() {}, status(c) { code = c; return res; }, json(o) { out = o; return res; } };
  await handler(req, res);
  return { status: code, body: out };
}

let network = true, xhrCount = 0;
function fakeXHRClass() {
  return class {
    open(m, u) { this.m = m; this.u = u; this.readyState = 0; }
    setRequestHeader() {}
    send(body) {
      xhrCount++;
      const done = (status, text) => { this.status = status; this.responseText = text; this.readyState = 4; this.onreadystatechange && this.onreadystatechange(); };
      if (!network) { setTimeout(() => done(0, ""), 5); return; }
      callApi(this.m, this.u, body ? JSON.parse(body) : undefined)
        .then(r => setTimeout(() => done(r.status, JSON.stringify(r.body)), 5));
    }
  };
}

const HTML = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
function device(url) {
  const dom = new JSDOM(HTML, {
    url, runScripts: "dangerously", pretendToBeVisual: true,
    beforeParse(w) {
      w.XMLHttpRequest = fakeXHRClass();
      w.scrollTo = () => {};
      w.HTMLMediaElement.prototype.pause = () => {};
    }
  });
  return dom.window;
}
const wait = ms => new Promise(r => setTimeout(r, ms));

let fails = 0, passes = 0;
function ok(cond, msg) { if (cond) { passes++; console.log("  ok  " + msg); } else { fails++; console.log("  FAIL " + msg); } }
function clickName(w, name) {
  const b = [...w.document.querySelectorAll("#roster-list button")].find(x => x.textContent === name);
  b.onclick();
}
function today(w, id) { return w.todayTotals(id).total; }

(async () => {
  console.log("API");
  ok((await callApi("GET", "/api/sync?code=nope")).status === 403, "bad code is refused");
  ok((await callApi("GET", "/api/sync?code=k7p2")).body.cls === "p1", "code is case-insensitive and maps to its class");
  ok((await callApi("GET", "/api/sync?code=K7P2&id=stu_barrerayoselin_p3")).status === 403, "a p1 code cannot read a p3 student");
  ok((await callApi("POST", "/api/sync", { code: "K7P2", id: "stu_x_p3", data: {} })).status === 403, "a p1 code cannot write a p3 student");
  ok((await callApi("POST", "/api/sync", { code: "K7P2", id: "spare_p1_1", data: { points: {}, groups: { a: 1 } } })).status === 200, "spare slot can save");
  ok((await callApi("POST", "/api/sync", { code: "K7P2", id: "test_p1", data: { points: {}, groups: {} } })).status === 200, "Test Student can save");
  ok((await callApi("POST", "/api/sync", { code: "K7P2", id: "test_p3", data: { points: {}, groups: {} } })).status === 403, "p1 code cannot write p3's Test Student");

  console.log("Device A: opens class link ?c=K7P2");
  const A = device("https://reading-foundations.vercel.app/?c=K7P2");
  await wait(60);
  ok(A.Sync.enabled(), "sync is on for the vercel site");
  ok(A.Sync.codes().p1 === "K7P2", "code from the link is remembered");
  ok(A.CURCLASS && A.CURCLASS.id === "p1", "link preselects the class");
  A.go("s-roster");
  ok(A.document.getElementById("code-box").style.display === "none", "no code box when the code is already known");
  clickName(A, "Miriam Gomez");
  await wait(60);
  const MIRIAM = "stu_gomezmiriam_p1";
  let earnedA = A.gotPoints("word", "annoyed") + A.gotPoints("sentence", "annoyed");
  A.gMarkDone("Personal Narrative 1");
  ok(earnedA > 0, "earned points on device A (" + earnedA + ")");
  await wait(1400);
  const saved = JSON.parse(db.get("rf:p1").get(MIRIAM));
  ok(saved.groups["Personal Narrative 1"] === 1, "finished group reached the server");
  ok(Object.keys(saved.points).length === 1, "today's points reached the server");
  ok(/saved to your class account/.test(A.document.getElementById("sync-note").textContent), "student sees the saved note");

  console.log("Device B: bare URL, types the code on the roster");
  const B = device("https://reading-foundations.vercel.app/");
  B.go("s-pick"); B.CURCLASS = B.CLASSES[0]; B.go("s-roster");
  ok(B.document.getElementById("code-box").style.display === "flex", "code box shows when there is no code");
  B.document.getElementById("code-input").value = "t9w3"; B.rosterSaveCode(); await wait(60);
  ok(/different class/.test(B.document.getElementById("code-msg").textContent), "another class's code is rejected");
  ok(!B.Sync.codes().p7, "rejected code is not kept");
  B.document.getElementById("code-input").value = "k7p2"; B.rosterSaveCode(); await wait(60);
  ok(B.Sync.codes().p1 === "K7P2", "right code is saved");
  clickName(B, "Miriam Gomez");
  await wait(80);
  ok(today(B, MIRIAM) === earnedA, "points followed Miriam to device B");
  ok(B.gUnlocked(1), "group 2 is unlocked on device B");
  B.go("s-groups");
  ok(B.document.querySelectorAll("#group-list button")[0].innerHTML.indexOf("&#10003;") > -1 || B.document.querySelectorAll("#group-list button")[0].innerHTML.indexOf("✓") > -1, "groups screen shows the check mark");
  ok(B.gotPoints("word", "annoyed") === 0, "anti-spam holds across devices (same word, same day pays nothing)");
  const more = B.gotPoints("word", "claim");
  ok(more > 0, "a new word still pays on device B");
  await wait(1400);

  console.log("Device A again: sees what B earned");
  A.go("s-roster"); clickName(A, "Miriam Gomez"); await wait(80);
  ok(today(A, MIRIAM) === earnedA + more, "device A total includes device B's points");

  console.log("Teacher device: scoreboard pulls the whole class");
  const T = device("https://reading-foundations.vercel.app/?teacher");
  T.go("s-settings");
  ok(!!T.document.getElementById("code-p1"), "Settings lists a code box per class");
  T.document.getElementById("code-p1").value = "K7P2";
  T.saveCode("code-p1", "codemsg-p1", "p1"); await wait(60);
  T.go("s-board"); await wait(80);
  const board = T.document.getElementById("board-body").textContent;
  ok(board.indexOf("Miriam Gomez") > -1 && board.indexOf(String(earnedA + more)) > -1, "leaderboard shows Miriam's cross-device total");
  ok(/every device/.test(T.document.getElementById("board-sync").textContent), "scoreboard says it includes every device");

  console.log("Offline");
  network = false;
  const O = device("https://reading-foundations.vercel.app/?c=K7P2"); await wait(60);
  ok(!O.Sync.codes().p1, "offline link can't verify the code (nothing stored)");
  O.localStorage.setItem("rf_sync_codes", JSON.stringify({ p1: "K7P2" }));
  O.CURCLASS = O.CLASSES[0]; O.go("s-roster"); clickName(O, "Alan Mendoza"); await wait(60);
  ok(O.gotPoints("word", "route") > 0, "points still work offline");
  await wait(1400);
  ok(/Can’t reach/.test(O.document.getElementById("sync-note").textContent), "student sees an honest offline note");
  network = true;
  O.dispatchEvent(new O.Event("online")); await wait(120);
  ok(db.get("rf:p1").has("stu_mendozaalan_p1"), "catches up when the network returns");

  console.log("Merge");
  const m = A.Sync.mergePoints(
    { "2026-09-01": { green: 1, blue: 0, gEarned: { a: { w: 1 } }, bEarned: {}, finals: {} } },
    { "2026-09-01": { green: 3, blue: 0, gEarned: { b: { s: 1 } }, bEarned: {}, finals: {} }, "2026-08-01": { green: 50, blue: 4 } });
  ok(m["2026-09-01"].green === 4, "two devices' claims on one day add up, not overwrite");
  ok(m["2026-08-01"].green === 50 && m["2026-08-01"].blue === 4, "old compact days keep their totals");

  console.log("GitHub Pages copy");
  const before = xhrCount;
  const G = device("https://miqdaniels.github.io/READING-DANIELS/?c=K7P2"); await wait(40);
  ok(!G.Sync.enabled(), "sync is off on github.io");
  G.CURCLASS = G.CLASSES[0]; G.go("s-roster"); clickName(G, "Miriam Gomez"); G.gotPoints("word", "unique"); await wait(1400);
  ok(xhrCount === before, "no network calls from github.io");
  ok(G.document.getElementById("sync-note").style.display === "none", "no sync note on github.io");
  ok(G.document.getElementById("code-box").style.display !== "flex", "no code box on github.io");

  console.log("\n" + passes + " passed, " + fails + " failed");
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
