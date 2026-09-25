# Reading Foundations — Project Handoff

**For:** Mick (Miquela Daniels) — 7th–8th grade ELD teacher, Fremont Junior High, Mesa AZ
**Purpose of this file:** Bring a fresh Claude (Claude Code or a new chat) fully up to speed so it can keep building this app without re-learning everything.
**Pro tip:** In Claude Code, save this as `CLAUDE.md` in the repo root. Claude Code reads that file automatically at the start of every session, so the context loads itself.

---

## WHERE WE LEFT OFF (2026-09-25)

**Finished and live on `main`:**
- **Diagnostic Tools has entered the app.** The student menu now has a fourth, first-listed button, "Diagnostic Tools," opening a hub screen (`s-diag`) that lists **Check 1: Letter Names** (working) and Checks 2–7 as plainly labeled, disabled **"Not built yet"** buttons — nothing is faked as available.
- **Check 1 (Letter Identification) is fully built end to end**, per the Daniels Checks spec: student sees the fixed mixed-order sequence (uppercase `M T A S P R F B L C H N D G W E K J U V Y I Q O X Z`, then lowercase `s m a t r p c f n h b l d e g i w k u y j v o q x z`) one letter at a time, no model audio, one continuous recording for all 52 letters, then the same Save/Download → Canvas **Upload** (never Record) instructions the final read already uses.
- A new teacher screen, **"Diagnostic Tools"** (`s-diagteach`, behind `?teacher`, next to Fluency review on the home screen), scores it: class/student picker → list of recordings → playback (pulled automatically from this device if the student recorded there, or from a file you pick if you downloaded it from Canvas on a different device) → a 52-letter tap grid. Tapping a letter cycles blank → Correct → Incorrect → Self-corrected → Skip → blank. Saving computes uppercase/lowercase/total correct, the exact missed letters (not just a percent), and self-correction count — all teacher-judged, no automatic speech scoring anywhere.
- A first, minimal **"What to teach next"** panel: missed letters are listed plainly, and a ready-to-paste AI lesson prompt is auto-built from them (so you never retype letters into ChatGPT/Claude/Gemini yourself). It explicitly tells whatever AI tool reads it not to diagnose a disability. The richer buttons from the full spec (Flashcards/Slides/Game/Practice Sheet/Home Practice/Family Communication/Recheck) are not built yet — this is just the prompt generator.
- Diagnostic results ride the **same Sync module** as placement/pacer/team: `Sync.pushDiag` sends only the teacher-scored summary (never raw audio) as a new `diag` field, gated by `TEACHER_PIN` the same way, merged server-side in `api/sync.js` without erasing points/groups/placement/pacer/team. A raw recording itself never leaves the device it was recorded on (or the device it's later opened on from a Canvas download) — only the scored summary syncs.

**Half-done / explicitly NOT built yet** (all clearly labeled as such in the app, not silently missing):
- **Checks 2–7** (Letter-Sound Knowledge, Phonemic Awareness, Decoding, Automatic Word Recognition, Morphological Awareness, Multisyllabic Word Analysis) — scoped in the master spec, not started. Checks 2 and 3 will need **video** recording, which nothing in this app does yet (everything so far, including Check 1, is audio-only).
- No growth dashboards, no CSV/JSON export of diagnostic data, no baseline/progress-monitoring/benchmark data model, no dosage tracking, no five-day instructional cycle, no teacher observational reading-conference log, no home-support cards.
- The **Daniels Assessment** word-reading placement screener referenced in the spec is still unbuilt (confirmed nothing of it exists in the code) — separate from Check 1, which is new.
- The "What to teach next" panel only has the AI prompt generator; Flashcards/Slides/Game/Practice Sheet/Home Practice/Family Communication/Recheck are not built.

**Recordings needed from you:** none for this build. Check 1 uses no model audio at all, per the spec — the student sees only the printed letter.

**Exact next step:** either (a) pilot Check 1 in a real class and see how the recording/scoring flow holds up on a Chromebook before building more, or (b) build Check 2 (Letter-Sound Knowledge) next, which is the first check needing video recording — a genuinely new capability (camera permission, video `MediaRecorder`, larger files) rather than a copy of the Check 1 pattern. Sync still isn't turned on (Vercel/Upstash/`CLASS_CODES` — see the original next-step list below), so diagnostic results, like placement, currently save per-device only until that's done.

**Turning sync on (unchanged from before, still not done):**
1. In the Vercel dashboard: **New Project** → import this GitHub repo (`miqdaniels/READING-DANIELS`) → deploy. This gives you the `*.vercel.app` URL (update it into "Live links" below once you have it).
2. In that Vercel project → **Storage** tab → **Add** → pick **Upstash** (Redis) → connect it. This automatically sets `KV_REST_API_URL` and `KV_REST_API_TOKEN` as env vars — `api/sync.js` already reads those, nothing else to do.
3. In the project's **Settings → Environment Variables**, add `CLASS_CODES` (e.g. `p1=K7P2,p3=M4Q8,p7=T9W3` — pick your own codes) so students can link their device to their class.
4. Optional but recommended before real use: also add a `TEACHER_PIN` env var (any short string only you know). Once that's set, the server will require it on any placement/pacer/team/diagnostic change — the app already prompts for it in memory (never saved to disk) and retries. Skip this step and it just stays open, same as today.
5. Re-test on the school Wi-Fi during school hours (a known open item even before this session).

---

## What this is

A reading-intervention web app for junior-high English learners who cannot yet read. One self-contained `index.html`. A student hears a word in the teacher's own recorded voice, hears it used in a sentence, slides a finger-pacer that lights each word, reads it aloud, does a set number of practice reads, then records one **final read** of the whole group and turns that file in through Canvas.

The whole thing is built around one idea from the research: teaching older struggling readers to attack multisyllable words through the *system* (morphology, chunks), not by memorizing a word list.

---

## Live links

Live site = **GitHub Pages, deployed from the `main` branch** (confirmed: the "pages build and deployment" workflow runs on every push to `main`). Changes pushed to any other branch are **not live** until they are merged into `main`. Pages usually takes 1–2 minutes to update after a push to `main`; then hard-refresh (Ctrl+Shift+R).

- **Repo:** https://github.com/miqdaniels/READING-DANIELS
- **Student app:** https://miqdaniels.github.io/READING-DANIELS/
- **Teacher view:** https://miqdaniels.github.io/READING-DANIELS/?teacher
- **Fluency Tap (teacher WCPM scoring):** https://miqdaniels.github.io/READING-DANIELS/teacher-tap.html
- **Vercel:** not set up yet (no Vercel project/URL exists). When it is, Mick will say "update the live link in CLAUDE.md" — replace the links above with the `*.vercel.app` ones.

---

## Permanent rule: end every task with this summary

At the end of every task, always tell Mick:

1. **Done:** one or two plain sentences on what changed.
2. **Tested:** whether the jsdom tests passed.
3. **Pushed:** whether it's pushed to GitHub (which branch), and the commit message.
4. **Test it here:** the full, clickable live link to the exact page to open (student app, `teacher-tap.html`, or `?teacher`, from Live links above). If the live site takes a minute to update after a push, say so.
5. **What to check:** one line on what to click to see the change.

If something isn't live yet or didn't push (e.g. it's on a branch that isn't merged into `main`), say that plainly instead of giving a link. Never end a task without this summary.

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
`s-home`, `s-pick` (choose reader), `s-groups`, `s-read` (the practice slide/read), `s-final` (final read), `s-score` (student earnings), `s-board` (teacher leaderboard), `s-roster`, `s-teach` (teacher recorder), `s-settings`, `s-status`. Navigation is `go("s-id")`; each screen has a paint/enter hook inside `go()`.

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

### Fluency Tap — `teacher-tap.html` (separate teacher-only page)
Teacher-driven words-correct-per-minute scoring. Not linked from `index.html`; `noindex`. Students never see it.
- Teacher picks class → student → word group, opens the student's final-read `.webm` (downloaded from Canvas; stays on the device, nothing uploads), sets start/stop times with **Set to now** while playing, and **taps each error** on the group's passage (tap again = undo). **Tap = last word read** caps the words read if the student stopped early.
- The app only does arithmetic: `WCPM = (words read − errors) ÷ minutes`, plus accuracy %. It never listens to or scores audio.
- File name (`MiriamGomez_Personal_Narrative_1.webm`) pre-fills group and, only if exactly one student matches, the student — flagged "check before saving".
- **Privacy:** names are first name + last initial only (`Miriam G.`). Student key = `<classId>-<djb2 hash of the index.html student id, base36>`, so no full name is stored, exported, or in any URL.
- `PASSAGES` and `ROSTER` are **copied** from `index.html` `SENTENCES`/`GROUPS`/`CLASSES`. If sentence text or the roster changes in `index.html`, update `teacher-tap.html` too — `tests/test-tap.js` fails until they match.
- **Storage:** all reads/writes go through `ScoreStore` (list/save/remove/merge, callback style) — localStorage key `rf_wcpm_scores`. Nothing else touches storage, so the cloud version (Vercel + database) replaces only `ScoreStore`'s insides.
- **Export backup (.json)**, **Export for a spreadsheet (.csv)**, **Restore from a backup** (merges by score id; never duplicates). Export file names contain only the date.

### Storage keys (localStorage, per device)
- `slider_settings` — the Settings object (reads count, palette, mode, `pacer{id}`, `team{id}`).
- `rf_groups_<readerId>` — which groups each student has finished.
- `points_data` — gamification totals + daily claim ledger, per student, per date.
- `rf_sync_codes` — class codes this device knows, `{p1:"K7P2"}` (cloud sync, below).
- `rf_wcpm_scores` — Fluency Tap saved scores (teacher-tap.html only), array of score records.
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
- `tests/test-tap.js` — Fluency Tap: static ES5/ending checks, passage + roster match index.html, no full names in the page, tapping/WCPM math, last-word cap, save/history/delete, file-name prefill, JSON/CSV export, restore.
- `tests/test-sync.js` — end-to-end cloud sync: real index.html ↔ real `api/sync.js` ↔ in-memory fake Redis; two devices, teacher scoreboard, offline catch-up, github.io stays off.

Static checks before shipping: file ends with `</script></body></html>`, no `=>`, no real `const`/`let` in code (the words may legitimately appear inside a sentence), and the audio clip count is intact (140).

---

## Status — done and working

- All 70 words recorded (140 clips) in Mick's voice, baked in.
- All sentence text reviewed and rewritten where needed.
- Gamification: earning, anti-spam, School/Home double, daily goal, student earnings screen, teacher team leaderboard — built and tested.
- Chunked final read with Tap/Pacer + Pause + roomier spacing — built and tested.
- Canvas `.webm` upload path confirmed.
- Fluency Tap (`teacher-tap.html`): teacher-driven WCPM scoring with on-device saves + export — built and tested.

## Pending / next builds (rough priority)

1. **Server-backed student saves via Vercel** — CODE BUILT (see Cloud sync above); remaining: Vercel project + Upstash + `CLASS_CODES`, then test on school Wi-Fi. Build a sync layer so progress + points follow a kid across devices. **Build it with no student login** (details in the storage section).
2. **Words-correct-per-minute scoring tool** — BUILT as `teacher-tap.html` (see Fluency Tap above), scores saved on the device with JSON/CSV export. Next: cloud sync of scores (Vercel + Vercel Storage or Supabase) by swapping `ScoreStore` — not built yet. Scoring stays teacher-driven; never automated pronunciation scoring.
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
