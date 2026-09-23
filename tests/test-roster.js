/* Test Student: first hour roster only, no PIN, can read + earn, never on the scoreboard. */
const fs = require("fs"), path = require("path"), { JSDOM } = require("jsdom");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const dom = new JSDOM(html, { url: "https://miqdaniels.github.io/READING-DANIELS/?teacher", runScripts: "dangerously", pretendToBeVisual: true,
  beforeParse(w) { w.HTMLElement.prototype.scrollIntoView = function () {}; w.scrollTo = function () {}; } });
const w = dom.window, d = w.document;
let pass = 0, fail = 0;
function ck(c, m) { if (c) { pass++; } else { fail++; console.log("FAIL:", m); } }
function activeId() { const s = d.querySelector(".screen.active"); return s && s.id; }

setTimeout(function () {
  w.localStorage.removeItem("points_data");
  w.go("s-pick");
  const classBtns = d.querySelectorAll("#class-list button");
  ck(classBtns.length === 3, "three classes on s-pick");
  for (let ci = 0; ci < classBtns.length; ci++) {
    classBtns[ci].onclick();
    ck(activeId() === "s-roster", "class " + ci + " opens its roster");
    const names = [...d.querySelectorAll("#roster-list button")].map(b => b.textContent);
    const want = w.CLASSES[ci].id === "p1" ? 1 : 0;
    ck(names.filter(n => n === "Test Student").length === want, w.CLASSES[ci].label + " has " + want + " Test Student");
    if (want) { const i3 = names.indexOf("Student 3"); ck(i3 > -1 && names.indexOf("Test Student") === i3 + 1, "Test Student sits right after Student 3"); }
    w.go("s-pick");
  }
  const ids = [].concat(...w.CLASSES.map(c => c.students.filter(s => s.name === "Test Student").map(s => s.id)));
  ck(ids.length === 1 && ids[0] === "test_p1", "only one Test Student in the app, id test_p1");

  // tap it: no PIN, straight to groups
  classBtns[0].onclick();
  [...d.querySelectorAll("#roster-list button")].find(b => b.textContent === "Test Student").onclick();
  ck(activeId() === "s-menu", "tapping Test Student goes straight to the menu (no PIN)");
  w.go("s-groups");
  ck(d.getElementById("group-who").textContent === "Test Student", "groups screen greets Test Student");
  const pts = w.gotPoints("word", "imperative");
  ck(pts > 0, "Test Student can earn points for the demo (" + pts + ")");
  w.go("s-score");
  ck(/\d+ points/.test(d.getElementById("score-body").textContent), "earnings screen works for Test Student");

  // real student earns less; demo still must not appear on the board
  w.READER = w.CLASSES[0].students[0]; w.gotPoints("word", "imperative");
  w.Settings.setTeam(ids[0], "A"); w.Settings.setTeam(w.CLASSES[0].students[0].id, "A");
  w.go("s-board");
  const board = d.getElementById("board-body").textContent;
  ck(board.indexOf("Test Student") === -1, "Test Student is not on the scoreboard");
  ck(board.indexOf(w.CLASSES[0].students[0].name) > -1, "real students still are");
  ck(w.teamStandings(w.CLASSES[0])[0].pts === w.todayTotals(w.CLASSES[0].students[0].id).total, "Test Student's points don't count toward a team");

  console.log("\n=== " + pass + " passed, " + fail + " failed ===");
  process.exit(fail ? 1 : 0);
}, 300);
