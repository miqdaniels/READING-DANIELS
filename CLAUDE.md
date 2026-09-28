# Reading Foundations — Project Handoff

**For:** Mick (Miquela Daniels) — 7th–8th grade ELD teacher, Fremont Junior High, Mesa AZ
**Purpose of this file:** Bring a fresh Claude (Claude Code or a new chat) fully up to speed so it can keep building this app without re-learning everything.
**Pro tip:** In Claude Code, save this as `CLAUDE.md` in the repo root. Claude Code reads that file automatically at the start of every session, so the context loads itself.

---

## WHERE WE LEFT OFF (2026-09-24)

**Update (2026-09-28, even latest):** Check 6B (Understand It: Morpheme Meaning) is built — a 24-item ORIGINAL selected-response assessment (4 categories x 6: Prefix Meaning, Suffix Meaning/Function, Inflectional Endings, Word-Part Meaning in Context), 3 choices per item, no recording/no camera/no mic at all, auto-scored the instant the student taps a choice (no teacher listen-and-tap step needed — the teacher-side "Check 6B Review" screen is read-only). Every base word is common/familiar so a miss can only be a morphology gap, not a vocabulary gap; correct-answer position is balanced 8/8/8 across A/B/C. **Check 6 (6A) was not touched in any way** — verified line-by-line that this entire change is pure addition (zero deletions in `index.html`). Check 6B now sits between Check 6 (6A) and Check 7 in the unlock chain, so Check 7 correctly waits on 6B being done too, not 6A alone. Check 6C (Build It) and Check 7 are still intentionally not built.

**Update (2026-09-28, latest):** Check 6 (Morphology) is built — but **only its first component, 6A ("Read It: Morphological Word Reading")**. It's a 50-word oral-reading task (5 sets of 10: Inflectional Endings, Common Prefixes, Common Suffixes, Multiple Morphemes, Academic/Derivational Morphology), one continuous audio recording, same audio-only architecture as Checks 1/4/5, in the Clean/Professional style. Teacher scoring is a simple 5-state cycle (Correct/Incorrect/Self-Corrected/Skip/Not-Reached — no Immediate/Labored split, that was a Check-5-only feature not requested here) plus its own playback-speed control (0.75x–2x, its own separate saved preference, not shared with Check 5's). **6B ("Understand It: Morpheme Meaning") and 6C ("Build It: Morphological Manipulation") are intentionally NOT built.** `MASTER_SPEC.md` only ever had 3 illustrative example items for each (not real 24-item/12-item banks), and a 2026-09-28 content-retrieval review (Ally/Ella lens) found 6C's examples read more like vocabulary/definition-matching than true morphological manipulation — that construct question needs resolving before real 6B/6C content gets written. Check 6 is still conceptually a 3-part check going forward; 6A being "done" does not mean Check 6 is complete. Also cleaned up `MASTER_SPEC.md`: the older, unlabeled Check 6 section had an obsolete duplicate word list (with the washable/kindness/disagreement/impossible collisions Mick's own QC history flagged) sitting alongside the real corrected one — that duplicate listing is now replaced with a pointer to the single authoritative bank, so this conflict can't happen again. 6B/6C's descriptions in that section are untouched.

**Update (2026-09-27):** Check 3 (Phonemic Awareness) is built and live on `main`, plus a teacher all-access pass — on `?teacher`, every screen (all Checks, all Word Practice groups, Fluency) opens without finishing the ones before it, and the Check 1/2/3 review screens now list Test Student first, highlight the picked name, and pick up Test Student runs saved in Student View's sandbox. Students (no `?teacher`) still unlock step-by-step as before.

**Update (2026-09-28):** One consistent icon system shipped — a single red pulsing mic icon on every Record button/"Recording" line, one green pulsing ear icon on every Listen/Hear button, Listen buttons now sit in a row beside their directions, and the Student View bar is now a shade of the chosen theme (darker in light mode, lighter in dark mode) instead of brown. Also added an in-place "Student View" preview button to every Check 2/3 prompt card, directions card, and word-recorder row — one tap shows the REAL student screen at that exact item (no camera/mic, nothing saved), with a "Back to teacher" banner that returns you exactly where you were. Mic/ear icons also got a thin border to match the rest of the button styling. Baked Mick's newest recordings into `clips.js`: all 12 directions clips, and all 24 Check 3 prompts (20 scored 3A/3B/3C/3D + all 4 practice items) — Check 3 is now fully recorded end to end. `clips.js` holds 186 clips. Added a worked-example "sample" (AZELLA Sample A/B style) to each Check 3 domain — right under the directions on the transition screen, a "Hear a sample" button plays a clip that says the answer out loud, modeling the task before the student's independent practice item and the 5 scored ones. Needs 4 new recordings (cup/web/bed/fun) via Check 3 Prompts' new "Sample" section.

**Update (2026-09-28, even later):** Check 5 (Automatic Word Recognition) is built and live on `main` — a 120-item printed word list across 6 locked sets (5A–5F, 20 words each), one continuous audio recording, reusing Check 1/4's audio-only mic architecture. This is also the **first screen built in the new "Clean/Professional" visual style** Mick approved: pill-shaped buttons (solid-fill primary, thin-outline secondary), small muted gray icons instead of big pulsing colored circles, plain bordered tiles sized to fit their word, light-tinted header bands. It's built as new CSS scoped to `#check5`/`#check5Teach` only — Checks 1–4 keep their exact current look untouched; rolling the new style backward to them is a separate future task Mick can authorize. Teacher scoring uses a 6-state cycle (blank = Correct/Immediate, the fast default that costs zero taps, then Labored/Decoded, Incorrect, Self-Corrected, Skip, Not-Reached) so the accuracy-vs-automaticity distinction is fully retained in the data. New for Check 5: a playback-speed control (0.75x–2x, persisted per device, never touches the original recording or the student's timing) and keyboard shortcuts (space/left/right arrow) for faster grading across 120 words. Check 6 is intentionally not built — it logically unlocks and shows "Coming soon!" like every other not-yet-built check.

**Update (2026-09-28, later):** Check 4 (Decoding Inventory) is built and live on `main` — a 142-item printed word list across 12 locked bands (4A–4L: short-vowel, digraphs, blends, complex closed syllables, VCe, open syllables, vowel teams, r-controlled, complex vowels/diphthongs, inflectional endings + consonant-le, two-syllable words, and controlled pseudowords), read one word at a time as ONE continuous audio recording (no camera, reuses Check 1's mic architecture). No model audio and no hints — directions are just "Read each word out loud. Tap Next after each one.", with a short point-of-need note ("This is a made-up word. Read it out loud.") only on the 14 pseudowords in band 4L. The teacher controls how far a student goes: a "Done" button lets scoring stop early at any item instead of forcing all 142. New "Check 4 Review" teacher screen scores each word Correct/Incorrect/Self-corrected/Skip/Not-Reached (tap to cycle), tracks Real Words (4A–4K) and Pseudowords (4L) as separate subtotals so one never hides the other, has a ◆ flag + note field for error patterns, and records total time + how many items were reached. Item bank content came from the actual QC-verified word lists (4G = 12 vowel-team words, 4L = 14 pseudowords — MASTER_SPEC.md had two stale count labels that disagreed with its own word lists; only those two numbers were corrected, nothing else touched). Check 5 is intentionally NOT built yet — it shows "Coming soon!" like Check 4 used to.

**Finished and live on `main`:**
- Fluency + Retell (a passage screen + a retell screen), reached through a new student menu (Fluency / Word Practice / Reading Comprehension-coming-soon) that now opens when a student taps their name.
- A teacher "Fluency review" screen (behind `?teacher`) with playback, teacher-entered Words read/Errors, computed WCPM/Accuracy, a recommendation, and Move up/Repeat/Move down buttons that set a student's fluency placement (`PK 0.0`–`PK 0.4` only; more levels are just data, not built yet).
- That placement (plus Settings' Pacer/Team assignments) is now **sync-ready**: `Sync.pushPlacement/pushPacer/pushTeam` push them separately from a student's own points/groups, `api/sync.js` merges fields instead of overwriting, and it's gated by an optional `TEACHER_PIN` env var (see "next step" below). A plain note on the Fluency review screen says "Levels save on this device until online sync is turned on" whenever sync is off.

**Half-done / explicitly NOT built:** the bigger "Daniels Assessment" redesign (word-list placement screener, `PK/K/1–8` levels with Cold Read + Repeat Read passages twice per level-passage, one-per-day locking) was scoped out and never started — there wasn't time in the session that reached sync-readiness. The current Fluency tab is still the earlier PK-0.0-through-0.4 design, not that one. If you want the Daniels Assessment version, that's a full rebuild of the Fluency tab's screens and data, not a small patch.

**Exact next step — turning sync on:**
1. In the Vercel dashboard: **New Project** → import this GitHub repo (`miqdaniels/READING-DANIELS`) → deploy. This gives you the `*.vercel.app` URL (update it into "Live links" below once you have it).
2. In that Vercel project → **Storage** tab → **Add** → pick **Upstash** (Redis) → connect it. This automatically sets `KV_REST_API_URL` and `KV_REST_API_TOKEN` as env vars — `api/sync.js` already reads those, nothing else to do.
3. In the project's **Settings → Environment Variables**, add `CLASS_CODES` (e.g. `p1=K7P2,p3=M4Q8,p7=T9W3` — pick your own codes) so students can link their device to their class.
4. Optional but recommended before real use: also add a `TEACHER_PIN` env var (any short string only you know). Once that's set, the server will require it on any placement/pacer/team change — the app already prompts for it in memory (never saved to disk) and retries. Skip this step and it just stays open, same as today.
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
