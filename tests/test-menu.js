/* Student menu: name tap -> s-menu; Fluency / Vocabulary / Reading Comprehension each open the right screen. */
const fs = require("fs"), path = require("path"), { JSDOM } = require("jsdom");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const dom = new JSDOM(html, { url: "https://miqdaniels.github.io/READING-DANIELS/", runScripts: "dangerously", pretendToBeVisual: true,
  beforeParse(w) { w.HTMLElement.prototype.scrollIntoView = function () {}; w.scrollTo = function () {}; } });
const w = dom.window, d = w.document;
let pass = 0, fail = 0;
function ck(c, m) { if (c) { pass++; } else { fail++; console.log("FAIL:", m); } }
function activeId() { const s = d.querySelectorAll(".screen.active"); return s.length === 1 ? s[0].id : "(" + s.length + " active)"; }
function click(el) { el.dispatchEvent(new w.MouseEvent("click", { bubbles: true })); }
function toMenu() {
  w.go("s-pick"); d.querySelectorAll("#class-list button")[0].onclick();
  [...d.querySelectorAll("#roster-list button")].find(b => b.textContent === "Miriam Gomez").onclick();
}

setTimeout(function () {
  toMenu();
  ck(activeId() === "s-menu", "tapping a name opens s-menu (got " + activeId() + ")");
  ck(d.getElementById("menu-who").textContent === "Miriam Gomez", "menu shows the reader's name");
  const btns = [...d.querySelectorAll("#s-menu .menu-btn")];
  ck(btns.map(b => b.textContent).join("|") === "Fluency|Vocabulary|Reading Comprehension", "three buttons in order: " + btns.map(b => b.textContent).join("|"));

  click(d.getElementById("menu-fluency"));
  ck(activeId() === "s-fluency", "Fluency opens s-fluency");
  ck(/Fluency passages coming soon\./.test(d.getElementById("s-fluency").textContent), "Fluency placeholder text");
  click([...d.querySelectorAll("#s-fluency button")].find(b => /Back to menu/.test(b.textContent)));
  ck(activeId() === "s-menu", "Fluency back button returns to menu");

  click(d.getElementById("menu-comp"));
  ck(activeId() === "s-comp", "Reading Comprehension opens s-comp");
  ck(/Reading Comprehension coming soon\./.test(d.getElementById("s-comp").textContent), "Comprehension placeholder text");
  click([...d.querySelectorAll("#s-comp button")].find(b => /Back to menu/.test(b.textContent)));
  ck(activeId() === "s-menu", "Comprehension back button returns to menu");

  click(d.getElementById("menu-vocab"));
  ck(activeId() === "s-groups", "Vocabulary opens the Unit 1 groups screen");
  ck(d.querySelectorAll("#group-list button").length === w.GROUPS.length, "groups list is built (" + d.querySelectorAll("#group-list button").length + " groups)");
  ck(d.getElementById("group-who").textContent === "Miriam Gomez", "groups screen still knows the reader");
  click([...d.querySelectorAll("#s-groups button")].find(b => /Menu/.test(b.textContent)));
  ck(activeId() === "s-menu", "groups screen back button returns to menu");

  click(d.querySelector("#s-menu .crumb a"));
  ck(activeId() === "s-roster", "Change reader returns to the name list");

  w.READER = null; w.go("s-menu");
  ck(activeId() === "s-roster", "menu with no reader falls back to the name list");

  console.log("\n=== " + pass + " passed, " + fail + " failed ===");
  process.exit(fail ? 1 : 0);
}, 300);
