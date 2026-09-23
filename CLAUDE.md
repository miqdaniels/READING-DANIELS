# Reading Foundations — Project Handoff

**For:** Mick (Miquela Daniels) — 7th–8th grade ELD teacher, Fremont Junior High, Mesa AZ
**Purpose of this file:** Bring a fresh Claude (Claude Code or a new chat) fully up to speed so it can keep building this app without re-learning everything.
**Pro tip:** In Claude Code, save this as `CLAUDE.md` in the repo root. Claude Code reads that file automatically at the start of every session, so the context loads itself.

---

## What this is

A reading-intervention web app for junior-high English learners who cannot yet read. One self-contained `index.html`. A student hears a word in the teacher's own recorded voice, hears it used in a sentence, slides a finger-pacer that lights each word, reads it aloud, does a set number of practice reads, then records one **final read** of the whole group and turns that file in through Canvas.

The whole thing is built around one idea from the research: teaching older struggling readers to attack multisyllable words through the *system* (morphology, chunks), not by memorizing a word list.

---

## Live links

- **Repo:** https://github.com/miqdaniels/READING-DANIELS
- **Student app:** https://miqdaniels.github.io/READING-DANIELS
- **Teacher view:** https://miqdaniels.github.io/READING-DANIELS/?teacher

---

## Hard rules — do not break these

1. **ES5 JavaScript only.** `var` and `for` loops. **No** arrow functions, **no** `const`/`let`. Old Chromebooks choke otherwise.
2. **The file must end with `</script></body></html>`.** If it doesn't, every button silently dies.
3. **Test with jsdom click-simulation** before handing back any change. Screens are string IDs (e.g. `"s-final"`); tests navigate with `go("s-id")` and check the DOM. See the test files section.
4. **No text-to-speech, ever.** Every clip is Mick's own recorded voice. If a word isn't recorded, the app says so honestly — it does not fake audio.
5. **Dignity first.** This is for teenagers. No elementary/baby imagery, no cutesy tone. They read the same real curriculum as everyone else, just with more scaffolding.
6. **Canvas submission = Upload, never Record.** Students submit the final read with "Add file → Upload files." The file is `.webm`. If the Canvas assignment has "Restrict Upload File Types" on, `webm` must be in the list — or turn the restriction off.
7. **Don't invent scoring/assessment you can't actually run.** If real pronunciation scoring can't be done without an outside service (the district blocks those), don't fake a score.

Mick's working style: verdict/grade first, skip preamble, execution over explanation, one step at a time.

---

## How the file is built

Single `index.html`, ~15 MB. It's large because **all 140 audio clips (70 words × word + sentence) are baked directly into the file** as base64 data URLs. This makes it work on any device with nothing to load from a server — the trade-off is a big file and a slow first load.

**Screens (string IDs):**
`s-home`, `s-pick` (choose class), `s-roster` (tap your name), `s-menu` (student menu: Fluency / Vocabulary / Reading Comprehension), `s-fluency` and `s-comp` (placeholders — "coming soon"), `s-groups` (Vocabulary = the Unit 1 groups), `s-read` (the practice slide/read), `s-final` (final read), `s-score` (student earnings), `s-board` (teacher leaderboard), `s-teach` (teacher recorder), `s-settings`, `s-status`. Navigation is `go("s-id")`; each screen has a paint/enter hook inside `go()`.

**The 70 words** are in 10 groups: Personal Narrative 1 & 2, Language Arts, Science, Math, Art, Media, and Unit 1 Core 1/2/3. Groups unlock in order — finishing one grays it out and opens the next.

### Key systems inside index.html

- **Teacher recorder** (`s-teach` / `enterTeach`): walks all 70 words, records the word and the sentence separately, shows a green dot per recorded row, has a jump list. Recordings save to the browser's IndexedDB on that machine, then get **exported as JSON**.
- **Audio baking:** the exported JSON is merged into `window.BAKED_CLIPS` near the top of the script. Keys are `word_<slug>` and `sent_<slug>`; values are full `data:audio/webm;base64,...` strings. Newer clips overwrite older ones by key, so the newest export always wins. **All 70 words are currently baked (140 clips).**
- **Gamification** (fully built and tested):
  - `PTS = { word:1, sent:3, wordBlue:2, sentBlue:6, final:10, finalBlue:20 }` — hear a word 1, hear the sentence 3, finish a group's final read 10 (Home/blue = double). No points for sliding.
  - **Anti-spam:** each event pays **once per word per day** (`award()` checks a per-day claim ledger). Mashing a button earns nothing extra. Resets at Arizona midnight (AZ = no DST, fixed -7).
  - **School vs Home:** points earned after 4 PM AZ ("Home"/blue) are worth **double**. Before 4 PM ("School"/green) are normal.
  - Star badge on the reading screen shows today's total; tapping it opens `s-score` (daily goal = 40, progress bar, School/Home split).
  - `s-board` = teacher leaderboard: team standings (medals) + top-5 students, with a class picker. Teams are assigned per student in Settings.
- **Chunked final read** (`s-final`): the final-read screen highlights whole **phrases** one at a time instead of single words, to train the eye to hold groups of words. `FCHUNKS` maps each of the 70 words to an array of phrase strings that rejoin to the exact original sentence (no commas or characters added). `FSEQ` is the flat walk order; `fAdvance()` moves the yellow highlight.
  - **Two modes, teacher-chosen per student in Settings:** **Tap** (default — student taps "Next phrase" at their own speed) and **Pacer** (phrases auto-advance on a timer `700 + 430×wordcount` ms, with a **Pause** button to breathe). Tap is for beginners who need control; Pacer is an earned upgrade for kids ready to build speed.
- **Settings** (`s-settings`): practice-reads count (1–3), per-student Tap/Pacer toggle, per-student team assignment.

### Storage keys (localStorage, per device)
- `slider_settings` — the Settings object (reads count, palette, mode, `pacer{id}`, `team{id}`).
- `rf_groups_<readerId>` — which groups each student has finished.
- `points_data` — gamification totals + daily claim ledger, per student, per date.
- `rf_sync_codes` — class codes this device knows, `{p1:"K7P2"}` (cloud sync, below).
- Fresh teacher recordings live in **IndexedDB** on that machine until exported/baked.

### Cloud sync (built — needs Vercel setup to go live)
- `api/sync.js` = Vercel serverless function. Stores one Redis hash per class (`rf:<classId>` → `{studentId: json}`) in **Upstash Redis** over its REST API (env `KV_REST_API_URL` / `KV_REST_API_TOKEN`, set automatically when Upstash is added from the Vercel Storage tab).
- Class codes live **only** in the Vercel env var `CLASS_CODES="p1=XXXX,p3=YYYY,p7=ZZZZ"`, never in the page. A code only unlocks its own class's student ids.
- Client `Sync` module in index.html: localStorage stays the instant save; on tapping a name it pulls + merges (union of claims, totals recomputed — never double-pays, never loses points), then every `savePoints`/`gMarkDone` pushes (debounced). Today's claim ledger goes up in full; older days as totals only.
- Students get the code from the Canvas link `https://<app>.vercel.app/?c=CODE` (remembered per device), or type it in the box on the roster. Teacher enters all codes once in Settings → Class codes; the Scoreboard then pulls every student's device.
- Sync is **off on github.io** (no API there) — that copy behaves exactly as before.
- Still local-only: teacher Settings (reads count, Tap/Pacer, teams). Pacer set on the teacher's machine does not reach a student's Chromebook yet.

---

## The two-direction workflow (important, easy to mix up)

- **Recordings JSON travels TO Claude to be baked.** The teacher recorder exports a JSON snapshot; Claude merges it into `window.BAKED_CLIPS`. Each export is a full snapshot, so re-recorded words overwrite automatically — no need to track which ones changed. (In Claude Code this is smoother: the export lands on the same machine, so Claude Code can bake it directly with no copy-paste.)
- **The HTML travels TO GitHub.** Claude edits `index.html`; it gets pushed to the repo, and GitHub Pages redeploys.
- These go in **opposite directions.** The recordings JSON never goes to GitHub.

**Order that avoids the classic mistake:** upload/pull the newest `index.html` first, hard-refresh (Ctrl+Shift+R), *then* record — so you're always recording against the corrected sentence text, not an old copy.

---

## Testing

Tests are jsdom click-simulation in Node, in `tests/`. Run all with `npm install` then `npm test` from the repo root. Give jsdom a real `url:` (e.g. the Pages URL) or `localStorage` silently no-ops and points/progress tests will look broken when they aren't.
- `tests/test-final.js` — chunked final read: tap, pacer, pause.
- `tests/test-points.js` — earning, anti-spam, badge, earnings screen, leaderboard.
- `tests/test-roster.js` — first-hour Test Student (no PIN, off the scoreboard).
- `tests/test-menu.js` — name tap → `s-menu`; each menu button opens the right screen; back buttons.
- `tests/test-sync.js` — end-to-end cloud sync: real index.html ↔ real `api/sync.js` ↔ in-memory fake Redis; two devices, teacher scoreboard, offline catch-up, github.io stays off.

Static checks before shipping: file ends with `</script></body></html>`, no `=>`, no real `const`/`let` in code (the words may legitimately appear inside a sentence), and the audio clip count is intact (140).

---

## Status — done and working

- All 70 words recorded (140 clips) in Mick's voice, baked in.
- All sentence text reviewed and rewritten where needed.
- Gamification: earning, anti-spam, School/Home double, daily goal, student earnings screen, teacher team leaderboard — built and tested.
- Chunked final read with Tap/Pacer + Pause + roomier spacing — built and tested.
- Canvas `.webm` upload path confirmed.

## Pending / next builds (rough priority)

1. **Server-backed student saves via Vercel** — CODE BUILT (see Cloud sync above); remaining: Vercel project + Upstash + `CLASS_CODES`, then test on school Wi-Fi. Build a sync layer so progress + points follow a kid across devices. **Build it with no student login** (details in the storage section).
2. **Words-correct-per-minute scoring tool** (teacher-facing, build separately): the teacher plays back a student's recorded read and taps each error one at a time; the tool times the read and computes words-correct-per-minute. A real fluency measure the teacher drives by hand — NOT automated pronunciation scoring, which we never fake.
3. "Test Student" slot on each roster (visible, no PIN) so Mick can demo without using a real kid.
3. Syllable-split slide for the longest words (syllables, not phonemes); start with *anticipated, abbreviations, chronological, realization*. Needs chunk recordings.
4. Per-word audio for the non-target words in a sentence (right now it replays the whole sentence — honest fallback, disclosed on the Status page).
5. Two-door welcome screen: foundations path vs. Bridges Unit 1.
6. Sentence-types lesson reusing the same vocabulary (structure type was tagged per sentence, so it's pre-sorted).
8. Status screen text is stale (still references "27 words" — should say 70).
9. **Idea to explore, unverified:** auto-filing the final read into Canvas (e.g. via a Canvas integration/MCP) so students don't upload manually. Until it's proven to work within district policy, the manual **Upload** path stays. Do not build on this assumption.
10. Open offers: rewrite *exponent* to match the shared "two to the third power" example; optionally name the *radicand* in the radical sentence. Changing any sentence text means re-recording that clip.

---

## Storage: the current limitation and the chosen fix (Vercel + a database)

**Today's limitation.** Everything a student earns and completes lives in **that browser on that device** (localStorage keys above). So:
- Clearing browser data, or switching device/browser, **wipes a student's points and group progress.**
- The leaderboard on any one machine only counts kids who worked **on that machine**.
- The **final read itself is always safe** — it downloads and goes to Canvas, so the graded artifact never depends on localStorage. Only the motivational/progress layer is local.

Firebase was ruled out earlier over district site-blocking. **Vercel is the chosen path instead.** A student on a district laptop reached `vercel.app` with no block (tested once, off the school network — still worth re-confirming on the actual school Wi-Fi during school hours before full rollout).

**Architecture to build:**
- **Vercel hosts the site; a database stores the data.** Vercel alone does not persist app data — its serverless filesystem is ephemeral. Pair it with a database (pick one at build time — a serverless Postgres/KV option on the free tier is fine). Mental model: Vercel = the server, the database = the filing cabinet.
- **Local + server mirror.** Keep localStorage exactly as it is for instant local saves, and add a thin sync layer: on load, pull the student's saved blob from the server and hydrate localStorage; on each save, write through to the server too. Last-write-wins is fine for a single student.

**How student identity should work — build it this way (no login):**
- **No accounts, no passwords.** Students do NOT sign in. Requiring logins would break this for junior-highers and likely trip district data-privacy rules.
- Identity = **tap your name on the class roster** (already how `s-pick` works) **+ a short class code** so two same-name kids in different classes don't collide. The server key is simply `class-code + student-id`.
- The public app URL (e.g. `reading-foundations.vercel.app`) loads for anyone with no sign-in — same as GitHub Pages does now. The sign-in screen at bare `vercel.app` is Vercel's own dashboard for the builder (Mick), not the app.

**Before/at build time, still to confirm (don't skip):**
- Re-test that the deployed `*.vercel.app` app URL loads on a student device on the **school network during school hours**.
- Vercel's free **Hobby** tier is **personal, non-commercial use only** — fine for classroom use; the day this is sold or licensed (AI Academy LLC), it needs a paid plan.
- Storing identifiable student progress on a third-party server may need **district data-privacy sign-off** (FERPA / minors' data). Keep stored data minimal (a name/first-name + progress, no sensitive info).

---

## Setup notes for Claude Code + GitHub

- Claude Code has **native git** — it commits and pushes on its own once installed and authenticated, so editing `index.html` and pushing to the repo replaces the manual upload entirely. GitHub Pages redeploys automatically on push.
- You do **not** need the GitHub MCP for that — native git handles the auto-push. A GitHub connector works too; either is fine. The MCP mainly adds GitHub API features (issues, PRs) this project doesn't use.
- Rough setup: install Claude Code, sign in with the Anthropic account, `git clone` the repo locally, and authorize GitHub pushing (a GitHub sign-in or a personal access token with repo/contents write). Node.js 18+ recommended if any MCP servers or hooks get added later.
- The 15 MB file is fine for Claude Code as long as edits are **targeted** (find-and-replace on specific blocks), not full-file rewrites.
- **Vercel deploy:** connect the GitHub repo to a Vercel project once; after that every push auto-deploys to the `*.vercel.app` URL. GitHub Pages can keep running in parallel until the Vercel version is ready. The database gets added inside the Vercel project (Storage tab) when the sync layer is built.
