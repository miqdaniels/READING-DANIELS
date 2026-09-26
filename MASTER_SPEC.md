# READING FOUNDATIONS — MASTER CLAUDE CODE BUILD SPECIFICATION

**Status:** Content-approval / build-planning document only. Nothing described below has been built yet. Content is approved section-by-section ahead of the staged build; apply each part only when the build actually reaches it.

Owner: Miquela "Miq" Daniels / AI Academy LLC
Build target: existing Reading Foundations GitHub app / current `index.html`
Pilot baseline target: Monday, October 12, 2026
Status: Developmental pilot. The Daniels Checks are original instructional diagnostic tools; they are not yet standardized, normed, or psychometrically validated.

---

## Diagnostic System at a Glance

| Check | Domain | Student Capture | Primary Output |
|---|---|---|---|
| 1 | Letter Identification | 1 audio file | Known/missed upper- & lowercase letters |
| 2 | Letter-Sound Knowledge | 1 video file | Consonant/vowel sound profile |
| 3 | Phonemic Awareness | 1 video file | Initial/final/blending/segmentation profile |
| 4 | Decoding | 1 audio file | Phonics-pattern profile |
| 5 | Automatic Word Recognition | 1 audio file | Automatic vs decoded/slow vs incorrect |
| 6 | Morphology & Word Analysis | Audio + selected response | Reading/meaning/building profile |
| 7 | Multisyllabic Word Analysis | 1 audio file | Long-word/syllable-pattern profile |

---

## ✅ CHECKS 1–3 RESOLVED: FINAL AUTHORITATIVE CONTENT (supersedes the Check 1–3 sections further below)

A later, explicit round of instructions ("READING FOUNDATIONS — FINAL CONTENT AND BUILD INSTRUCTIONS FOR CHECKS 1–3") superseded the Check 1–3 sections that follow later in this document wherever they conflict. That final round is reproduced in full immediately below. **Where the two disagree, this section wins.** The earlier Check 1–3 sections further down are kept for full context/history but are no longer authoritative.

**Build status after the final round:**
- CHECK 1 — APPROVED FOR BUILD, pending normal technical/visual QA (including the screenshot-of-all-52-letters gate below).
- CHECK 2 — APPROVED FOR BUILD, with the required teacher sound-answer key.
- CHECK 3 — APPROVED FOR BUILD, using the corrected unique-item bank and completed segmentation section below.
- CHECK 4 — APPROVED FOR BUILD. Full 142-item decoding bank received and verified (see "CHECKS 4–7 FINAL CONTENT" section below).
- CHECK 5 — APPROVED FOR BUILD. Full 120-item automatic-word-recognition bank received and verified.
- CHECK 6 — Set 4 and Set 5 of 6A corrected (see below) to remove duplicates; 6B/6C unchanged (already designed).
- CHECK 7 — Sections 7A–7E locked/verified; 7F (12 controlled pseudowords) remains an explicit placeholder pending final original QC.

### Global rules for Checks 1–3 (final)
- **Preserve, don't redesign:** keep the existing student flow, teacher scoring system, recording/download system, class-hour selection, student-name selection, and teacher-side architecture. Modify/extend only as necessary.
- **Teacher remains the scorer.** The app calculates totals and organizes results; it must NOT automatically judge student speech.
- **Student dignity:** students may be 10–14. No childish graphics, cartoon animals, elementary reward systems, "A is for apple" presentation, or student-facing grade-level labels. Clean, mature, uncluttered screens. One clear task at a time.
- **Audio/video:** never AI text-to-speech. Anything students hear is Miq's recorded human voice (add any needed teacher prompts to her existing recording system). Never play audio that gives the answer during independent assessment.
- **Teacher scoring:** the app records, stores teacher scoring, counts, calculates, identifies missed items, organizes results, and generates instructional targets. It does not determine whether pronunciation was correct.
- **Multilingual safeguard:** accent alone is not an error. A pronunciation difference from accent/language background is not automatic evidence of a reading deficit — teacher judgment controls scoring.
- **Canvas/file rule:** each check produces ONE student recording file (not per-item files). Upload via Add File → Upload, never Canvas's built-in Record.

### CHECK 1 — LETTER IDENTIFICATION (final)
**Purpose:** accurate uppercase/lowercase letter-NAME identification (not sounds).

**Student task:** one letter at a time; student says the letter name aloud; no model pronunciation, hint, picture, keyword, or answer-giving audio. **ONE CONTINUOUS AUDIO FILE** for the whole assessment — never per-letter recordings.

**Uppercase sequence (exactly, each letter once):**
M T A S P R F B L C H N D G W E K J U V Y I Q O X Z

**Lowercase sequence (exactly, each letter once):**
s m a t r p c f n h b l d e g i w k u y j v o q x z

**Font requirement:** must make individual letters visually clear, with particular attention to uppercase I, lowercase l, lowercase i, lowercase a, lowercase g. Do NOT use a font where uppercase I and lowercase l are essentially indistinguishable; verify a and g aren't unnecessarily unusual glyphs. **Before Check 1 is considered complete: visually test all 52 letter stimuli on the actual student assessment screen at the approximate Lenovo laptop viewport students will use** — a font that looks good elsewhere may not render well inside the assessment. A dedicated, highly legible assessment font for Check 1 specifically is fine rather than changing the whole app's interface.

**Teacher scoring:** Correct / Incorrect / Skip-No Response / Self-Corrected, plus teacher notes if already supported.

**Results — report separately, never just a combined number:**
- Uppercase correct / 26
- Lowercase correct / 26
- Overall correct / 52
- exact missed uppercase letters, exact missed lowercase letters, self-corrections, letters needing instruction

**What to Teach Next:** missed letters automatically populate instructional targets (teacher never retypes them) — feeding What to Teach Next, practice activities, flashcards, memory/matching, lesson-plan/slide prompts, home practice, targeted recheck.

### CHECK 2 — LETTER-SOUND KNOWLEDGE (final) — REPLACED 2026-09-26, supersedes the answer key immediately below in this same section
**This 2026-09-26 revision is authoritative for Check 2 and replaces every prior Check 2 answer key in this document, including the "26 total / short-vowel-only" version originally in this APPROVED CORRECTIONS section.** Check 2 is now **31 scored targets**, not 26, and long vowels are their own scored section (2C), not an "alternate vowel sound" folded into the short-vowel item.

**Purpose:** what sound(s) can this letter represent — a different question from Check 1's "what is this letter called." Check 2 has three related but distinct sub-tasks, reported separately:
- **2A — Consonant Sound Retrieval:** student sees a bare consonant and independently retrieves a sound for it (no keyword, no hint).
- **2B — Short-Vowel Sound Knowledge in Keyword Context:** student sees a vowel, hears Miq's recorded keyword question, and produces the short-vowel sound that vowel represents in that keyword.
- **2C — Long-Vowel Sound Knowledge in Keyword Context:** same structure as 2B, with a keyword whose vowel is long. Long-vowel knowledge is now its own scored target — it is NOT recorded as "Alternate Vowel Sound" under 2B.

Do not build all 31 as if they were one uniform construct; 2A is independent retrieval, 2B/2C are keyword-cued identification. A vowel keyword is required (not optional/decorative): showing a bare vowel and asking "what sound does this make" is genuinely ambiguous, since a vowel legitimately represents multiple sounds. The keyword disambiguates which vowel sound is being asked for; it never supplies the isolated target phoneme itself (see the "never give the student the answer" rule below).

**Recording mode: ONE CONTINUOUS VIDEO FILE (camera + microphone)** for the entire assessment (2A + 2B + 2C together) — never split into per-letter, per-section, or per-type files. Camera setup (permission, live preview, "make sure your face and mouth are visible") happens before the timer starts; the student records inside Reading Foundations itself, never inside Canvas — Canvas is upload-only, never the recording environment. Video should show the student's face/mouth clearly enough for teacher review; this is an instructional observation, not a speech-language diagnosis, and mouth position is never an automatic correctness requirement (see multilingual safeguard below).

**Content and order — 31 total scored targets:**
- **2A consonants (21), in this exact order:** m s t p f n r b c h d g l w j k v y z q x
- **2B short vowels (5), in this exact order, each cued by Miq's recorded keyword question ("Listen: *keyword*. What sound does *letter* make in *keyword*?"):** a–apple, e–edge, i–itch, o–ox, u–up
- **2C long vowels (5), same letter order, different keywords:** a–apron, e–me, i–ice, o–open, u–unicorn

*(2026-09-26 correction: short O's keyword was changed from "octopus" to "ox" — octopus is multisyllabic with several vowel sounds, adding unnecessary ambiguity. Long E's keyword was changed from "eagle" to "me" — not "even". Both changes are keyword-only; the instructional targets themselves, short /ŏ/ and long /ē/, are unchanged.)*

**Student task:** one item at a time. For 2A, the student sees a bare consonant and independently produces a sound — no picture, keyword, example word, pronunciation, mouth diagram, target sound, or hint. For 2B/2C, the student sees the vowel, hears Miq's keyword-question prompt, and produces the vowel sound the keyword calls for. No model/target sound ever plays before the student's response, in any section. If the student gives the letter name instead of a sound, teacher marks **Letter-Name Substitution**.

**Answer key (required) — 2A Consonant Sound Retrieval:**
- m /m/, s target /s/ (legitimate /z/ use may be recorded as an acceptable alternate where appropriate), t /t/, p /p/, f /f/, n /n/, r /r/, b /b/
- c target /k/, acceptable alternate /s/
- h /h/, d /d/
- g target hard g as in *go*, acceptable alternate soft g as in *giant*
- l /l/, w /w/, j sound as in *jump*, k /k/, v /v/
- y target consonant sound as in *yes*
- z /z/
- q target /kw/
- x target /ks/

Teacher judgment remains authoritative; do not automatically mark a legitimate alternate letter-sound response incorrect merely because it differs from the primary instructional target.

**Answer key — 2B Short-Vowel Sound Knowledge in Keyword Context:** a→short a (apple), e→short e (edge), i→short i (itch), o→short o (ox), u→short u (up).

**Answer key — 2C Long-Vowel Sound Knowledge in Keyword Context:** a→long a (apron), e→long e (me), i→long i (ice), o→long o (open), u→long u (unicorn). These are scored 2C targets in their own right, never recorded as an "alternate" under the matching 2B item.

**Teacher scoring — support all of:** Correct / Incorrect / Skip-No Response / Self-Corrected / Letter-Name Substitution / Acceptable Alternate Sound / **Not Reached** / Sound-Production/Articulation Observation / Teacher Note. **Not Reached is distinct from Incorrect** — it means the 5:00 administration ceiling was hit before the student reached that item, and must never be counted or displayed as a wrong answer. A "Sound-Production Observation" mark on an otherwise-correct response must never automatically feed the instructional-target list — that would conflate a pronunciation observation with an actual letter-sound-knowledge gap.

**Administration ceiling:** 5:00 hard maximum for the pilot (not a mastery threshold — no "took too long therefore doesn't know it" conclusions yet). Timer starts when the student begins the first SCORED item, never during directions, permission prompts, camera positioning, or preview. A quiet "30 seconds remaining. Keep going." notice appears at 4:30 — no alarm. At 5:00: stop item advancement, stop recording, keep every response already given, mark every remaining item **Not Reached**, finalize the recording, and continue normally to review/save.

**Results — report separately, never collapse to one number:**
- 2A Consonant Sound Retrieval — correct / 21, plus its own needs-instruction target list
- 2B Short-Vowel Sound Knowledge in Keyword Context — correct / 5, plus its own needs-instruction target list
- 2C Long-Vowel Sound Knowledge in Keyword Context — correct / 5, plus its own needs-instruction target list
- Vowels combined (2B+2C) — correct / 10
- Overall Check 2 — correct / 31
- Preserve exact item-level results, acceptable alternates, letter-name substitutions, skips, self-corrections, Not Reached items, sound-production observations, teacher notes, and total time.

**What to Teach Next:** auto-populate target letters/sounds (2A, 2B, 2C tracked separately) → explicit sound instruction, mouth-position practice where pedagogically appropriate, letter-sound cards, matching, decoding practice, AI-generated activities, home practice, targeted recheck. Teacher never retypes targets; a sound-production-only observation on an otherwise-correct item is kept out of this list (see teacher scoring above).

**Privacy/storage:** the video stays browser-local (MediaRecorder → in-memory Blob → review → download) until the student downloads and uploads it to Canvas themselves. It is never automatically stored in GitHub, Vercel, localStorage, or any Reading Foundations server. Camera and microphone tracks are released and temporary object URLs revoked once the recording workflow is exited. Only completion/progress *metadata* (not the video itself) uses the app's existing persistence architecture.

**Multilingual/dignity safeguard:** accent alone is never an error. Reading Foundations must never use Check 2 (or any Check) to diagnose dyslexia, ADHD, an articulation/speech/language disorder, a learning disability, a medical condition, or special-education eligibility — it reports observable reading performance only, and teacher judgment controls interpretation.

### CHECK 3 — PHONEMIC AWARENESS (final)
**Purpose:** hearing/manipulating individual speech sounds in spoken words — primarily auditory; the student should NOT need to read the target words (this is phonemic awareness, not printed-word decoding).

**Recording mode: ONE CONTINUOUS VIDEO FILE** for the complete scored assessment — never per-item files.

**Miq's recorded prompts required:** every Check 3 prompt goes into the teacher recording interface for Miq to record herself. No TTS, no AI voice.

**Structure:** 4 unscored practice items (one per domain: initial sound, final sound, blending, segmentation — must not duplicate any scored item, must not count toward score, exists only to confirm the student understands the task) + 20 scored items across four domains of 5 each:

**3A — Initial Sound Identification (/5):** map, fish, top, nose, bike — student identifies the first phoneme heard.

**3B — Final Sound Identification (/5):** sun, lip, bus, room, cat — student identifies the final phoneme heard.

**3C — Phoneme Blending (/5) — FINAL, corrected list (do not use "map," it duplicates 3A):**
1. /ă/–/t/ → at
2. /m/–/ē/ → me
3. /r/–/ĕ/–/d/ → red
4. /h/–/ŏ/–/p/ → hop
5. /s/–/t/–/ŏ/–/p/ → stop

**3D — Phoneme Segmentation (/5):**
1. go → /g/ /ō/ (2 phonemes)
2. van → /v/ /ă/ /n/ (3 phonemes)
3. ship → /sh/ /ĭ/ /p/ (3 phonemes, digraph)
4. best → /b/ /ĕ/ /s/ /t/ (4 phonemes)
5. flag → /f/ /l/ /ă/ /g/ (4 phonemes, initial blend)

**Uniqueness — verified:** all 20 scored target words (map, fish, top, nose, bike, sun, lip, bus, room, cat, at, me, red, hop, stop, go, van, ship, best, flag) checked programmatically — no duplicates. ✅ (Earlier drafts of this spec used "sun"/"fish" and, in one interim round, "mop"/"ship" for blending items 3–4; both are superseded by the final list above.)

**Teacher scoring:** Correct / Incorrect / Skip-No Response / Self-Corrected, optional teacher note.

**Results — report each domain separately, never collapse to one score** (a student who aces initial/final/blending but scores 1/5 on segmentation has a very different need than one scoring 4/5 evenly across all four):
- Initial Sound Identification /5, Final Sound Identification /5, Phoneme Blending /5, Phoneme Segmentation /5, Overall /20

**What to Teach Next:** identify the actual domain needing instruction (initial/final phoneme identification; blending 2/3/4 phonemes; segmenting 2/3/4 phonemes; segmenting digraphs; segmenting blends) → feeds What to Teach Next, instructional routine, practice, lesson prompt, student/home activity, targeted recheck.

**Multilingual rule:** a wrong response doesn't automatically mean the student lacks phonemic awareness. Teacher interpretation should consider whether directions were understood, whether the English word was familiar, whether the phoneme exists/differs in the student's first language, accent/pronunciation, and whether the student showed the underlying sound-manipulation skill despite pronunciation differences. Apply the multilingual/ELD lens to questionable results.

### Checks 1–3 progress monitoring (final)
Do not re-administer the full original assessment every ~2 weeks just to get another score. After instruction, **recheck the target skill** using parallel/new items measuring the same underlying skill (e.g., different four-phoneme words, not the same ones) — looking for transfer of learning, not memorization of the assessment.

### Final QA gates before calling Checks 1–3 complete
- **Check 1:** 26 unique uppercase + 26 unique lowercase letters; font distinction confirmed; Lenovo-screen rendering confirmed; audio recording; teacher scoring; target propagation.
- **Check 2:** 31 scored targets (2A 21 consonants + 2B 5 short vowels + 2C 5 long vowels); one continuous camera+mic video; teacher answer key; alternate-sound handling; letter-name substitution; Not Reached distinct from Incorrect; 4:30 warning / 5:00 hard stop; teacher override; target propagation.
- **Check 3:** four unscored practice items; exactly 20 scored items, five per domain; no duplicate scored target words; all required Miq recordings identified; one continuous video; domain-level scoring; target propagation.

---

## ✅ CHECKS 3–7: QC-CORRECTED FINAL CONTENT (supersedes the "received and verified" content that was here before)

Received as "READING FOUNDATIONS — QC-CORRECTED CHECKS 3–7." This fully replaces the earlier Check 4/5/7 word banks (they were an older draft — completely different words band-for-band). Check 3 in this round matches what was already saved (no change). Check 6 is explicitly locked/unchanged.

**On top of the uploaded document, 9 additional QC fixes were applied** (a prior round, "QC ROUND 2," flagged real-word/brand/slang/near-homophone problems in specific pseudowords, plus one Bridges-vocabulary collision — all of which were still present in the uploaded base document):
- Check 4L: replaced **foist** (real word), **zote** (Mexican Spanish slang for a dimwit + the brand name of a well-known Mexican laundry soap, Jabón Zote), **fape** (spells the special-education term FAPE), **lat** (real gym slang for "lats"), **koat** (exact homophone of "coat")
- Check 7F: replaced **prelastic** (real prefix "pre-" + the real word "plastic," which also appears in Check 4K — tests morphology, not pseudoword decoding), **monderful** (one letter from "wonderful" — inviting real-word guessing), **vosticle** (sounds anatomical; junior-high giggle risk)
- Check 5F: replaced **evidence** (a Bridges vocabulary word the student already hears in Miq's recorded voice — contaminates automatic-recognition measurement)

**Two more of the same Bridges-vocabulary problem were found proactively while cross-checking (not in the original flagged list — flagging for override if this wasn't wanted):**
- Check 5F: **process** is also a Bridges vocabulary word (Science group) — replaced
- Check 5C: **select** is also a Bridges vocabulary word (Unit 1 Core 3) — replaced

All replacement pseudowords were checked against real English words, common Mexican Spanish words/slang, and obvious brand-name patterns — none matched anything found. This isn't an exhaustive guarantee against every possible language/brand collision worldwide, only the same level of diligence applied throughout this spec.

### CHECK 3 — PHONEMIC AWARENESS (20 items — unchanged, matches the already-saved final content)
3A Initial (5): map, fish, top, nose, bike · 3B Final (5): sun, lip, bus, room, cat · 3C Blending (5): at, me, red, hop, stop · 3D Segmentation (5): go, van, ship, best, flag (see the phoneme-by-phoneme answer key already in the Checks 1–3 section above — all 5 blending items already have their prompts written out).

### CHECK 4 — DECODING INVENTORY (142 items, verified)
No model audio; one continuous AUDIO recording for the administered portion; teacher controls entry/stop; score Correct/Incorrect/Skip/Self-Corrected by band.

- 4A Short-vowel VC/CVC (10): am, if, us, cab, jet, win, mop, rug, web, quiz
- 4B Digraphs (12): chin, shed, rush, math, thud, whiz, which, sock, neck, song, thing, patch
- 4C Blends (12): grin, slip, crab, drip, snap, trim, clog, brag, fresh, plum, swim, grub
- 4D Complex closed syllables (10): cramp, swept, twelfth, shelf, crisp, grunt, frost, scalp, clasp, drift
- 4E VCe/silent-e (12): cake, eve, kite, rope, mule, grape, scene, smile, globe, flute, shade, theme
- 4F Open syllables (10): be, yo, flu, zero, solo, hero, navy, pony, baby, ruby
- 4G Vowel teams (12): mail, paint, beach, green, toast, coach, tray, gray, snow, blue, fruit, chief
- 4H R-controlled vowels (12): park, sharp, fern, verse, shirt, third, sport, north, burn, curve, porch, smart
- 4I Complex vowels/diphthongs (14): book, moon, cook, food, house, cloud, brown, town, coin, join, boy, toy, saw, draw
- 4J Inflectional endings + consonant-le (12): packs, races, filled, melted, swimming, resting, giggle, marble, puzzle, handle, middle, jungle
- 4K New two-syllable decoding words (12): velvet, signal, plastic, public, rapid, finish, visit, topic, focus, local, moment, bonus
- 4L Controlled unfamiliar pseudowords (14) — **corrected**: vun, pem, vot, shab, thig, plim, crusp, yeft, throm, vreen, moit, narm, fropt, bemple *(replaced: lat→vun, fape→yeft, zote→throm, koat→moit, foist→fropt)*

**QC:** total = 142 ✅, every band count matches ✅. Score 4L pseudowords separately from real words, per the base document's instruction.

### CHECK 5 — AUTOMATIC WORD RECOGNITION (120 items, verified unique)
Original Reading Foundations utility/complexity bank — not Fry-ordered, not a Fry derivative. Printed word only, no context/picture/definition/model audio; one continuous AUDIO recording; teacher scoring Automatic/Decoded-Slow/Incorrect-Skipped/Self-Corrected.

- 5A Core classroom connectors & pronouns (20): and, or, but, because, yet, although, while, than, who, what, where, why, how, they, them, their, we, our, you, your
- 5B Core verbs students meet constantly (20): is, are, was, were, have, has, had, do, does, did, can, could, will, would, should, may, might, must, get, know
- 5C Directions & school-task words (20) — **corrected**: read, write, say, tell, ask, answer, choose, **match**, circle, underline, complete, explain, describe, compare, show, find, use, check, turn, start *(replaced: select→match — "select" is a Bridges vocabulary word)*
- 5D Time, sequence & relationship words (20): before, after, during, until, then, next, last, today, yesterday, always, never, often, sometimes, again, between, through, around, without, within, across
- 5E High-utility content words (20): school, student, class, lesson, word, sentence, story, text, question, idea, reason, example, result, change, part, group, place, world, people, language
- 5F Adolescent academic utility (20) — **corrected**: learn, understand, decide, create, support, **context**, detail, main, similar, however, therefore, possible, **opinion**, purpose, source, subject, response, practice, review, meaning *(replaced: evidence→context, process→opinion — both are Bridges vocabulary words)*

**QC:** total = 120 ✅, all 120 verified unique across all six sets ✅, zero overlap with the Bridges vocabulary list ✅, no "oil" artifact ✅.

### CHECK 6 — MORPHOLOGY (50 words) — LOCKED, unchanged
Passed QC already; preserve exactly as-is. Set 1 Inflectional endings: jumps, wishes, jumped, landed, running, helping, faster, tallest, dogs, boxes · Set 2 Common prefixes: unhappy, unsafe, reread, replay, dislike, disagree, incorrect, impossible, preview, nonstop · Set 3 Common suffixes: helpful, careless, kindness, payment, washable, teacher, slowly, action, friendship, darkness · Set 4 Multiple morphemes: unhelpful, rereading, disagreement, carefully, unfinished, hopelessness, incorrectly, carelessness, unfairness, reusable · Set 5 Academic morphology: prediction, transportation, development, misunderstanding, information, preparation, movement, improvement, educational, organization. 6B (24 items) and 6C (12 items) unchanged — preserve as already designed.

### CHECK 7 — MULTISYLLABIC WORD ANALYSIS (90 items, verified)
One continuous AUDIO recording; printed stimuli only, no model audio; teacher scoring authoritative; accent alone is never an error.

- 7A Two-syllable words (20): sunset, picnic, rabbit, napkin, helmet, basket, music, hotel, robot, tiger, paper, open, cactus, seven, winter, market, problem, contest, number, hundred
- 7B Compound words (10): sunlight, football, weekend, bedroom, backpack, outside, upstairs, downtown, something, everyone
- 7C Syllable-pattern application (18): magnet, dentist, pumpkin, silent, basic, unit, remote, invite, rainbow, daylight, season, peanut, garden, perfect, birthday, little, purple, candle
- 7D Three-syllable words (15): animal, banana, computer, remember, important, another, tomorrow, fantastic, discover, September, attention, different, energy, family, exercise
- 7E Four-plus syllable/academic words (15): education, community, independent, opportunity, communication, population, environmental, mathematical, investigation, relationship, responsibility, electricity, democracy, geography, celebration
- 7F Original controlled pseudowords (12) — **corrected**: mepnic, ravlet, sopane, fimote, zeebon, plooder, narvish, torpune, cambrel, vantrel, plindor, vorimble *(replaced: vosticle→vantrel, prelastic→plindor, monderful→vorimble)*. Keep pseudowords isolated from real-word scoring; no definitions/pictures; not treated as vocabulary.

**QC:** 7A–7E band counts match (20+10+18+15+15=78) ✅, +12 pseudowords in 7F = 90 total ✅.

### Required final QC report (all 10 pass)
1. Check 3 = 20 items ✅ 2. Check 4 = 142 items ✅ 3. Check 5 = 120 items ✅ 4. Check 6 = 50 items ✅ 5. Check 7 = 90 items ✅ 6. Zero exact duplicates within any check ✅ 7. Zero exact duplicates across Checks 3–7 ✅ (verified by script, case-insensitive) 8. Check 4 includes controlled unfamiliar/pseudoword decoding items (4L) ✅ 9. Check 5 is not Fry-ordered and contains no "oil" artifact ✅ 10. Check 7F contains all 12 original pseudowords ✅. **Additional check run beyond the required 10:** zero overlap between any Check 3–7 word and the 70-word Bridges vocabulary list ✅ (after the process/select fixes).

### Global build rules for Checks 3–7
No AI/TTS voices; no automatic speech scoring, teacher judgment is authoritative; Miq records any needed directions/prompts (added to her existing teacher recording system); one consolidated recording file per oral check, never one file per item; first name + last initial only; no student-facing grade-equivalent labels; missed patterns/words automatically feed What to Teach Next, AI teacher prompts, practice, home support, and targeted rechecks; preserve item-level raw data and subskill scores; use new parallel items for progress monitoring whenever possible; never diagnose a disability; multilingual pronunciation/accent differences must never automatically be scored as reading deficits.

---

## 0. FIRST INSTRUCTION TO CLAUDE CODE — PRESERVE WHAT ALREADY WORKS
Before editing anything:
1. Inspect the current `index.html` and understand the existing student flow, teacher flow, audio recording library, fluency tools, vocabulary tools, scoring tools, and storage model.
2. DO NOT rebuild, replace, or remove functioning features simply because this specification describes them again.
3. Integrate the new diagnostic architecture into the existing app.
4. Preserve all existing student rosters, class-hour selection, vocabulary recordings, fluency passages, teacher scoring, and Canvas-download workflow unless a change below explicitly requires modification.
5. Make targeted edits to the current master file. Do not create a competing second app.
6. Back up the working file before major changes.
7. Test all buttons and navigation after changes.
8. The current app is a self-contained HTML app. Keep compatibility with the current architecture unless Miq explicitly approves a migration.
9. If JavaScript is added to this app, use plain ES5 JavaScript only: `var` and ordinary `for` loops; no arrow functions, `const`, or `let`.
10. The final HTML file must end correctly with `</script></body></html>`.
11. Do not put API keys, private credentials, or secrets in client-side HTML/JavaScript.
12. Use the current teacher route/pattern already built (currently accessed with the teacher query/teacher-side URL). Preserve it rather than inventing a new teacher authentication model.
13. Run the existing test workflow plus click/navigation tests before publishing. Do not push broken code.

## 1. PRODUCT PURPOSE
Reading Foundations is an original reading-intervention system for students approximately ages 10–14 who cannot read, read far below grade level, or have specific foundational reading gaps. It must work for multilingual learners and English-speaking struggling readers.

The product must:
- identify where reading breaks down;
- give the teacher usable instructional targets;
- connect assessment directly to instruction;
- support progress monitoring and rechecks;
- preserve student dignity;
- scale to a teacher who may have 20+ students working simultaneously and no aide;
- support online use and later pencil-and-paper versions;
- collect pilot data without pretending the program is already standardized or validated.

## 2. HARD RULES
1. DIGNITY FIRST. No babyish visuals, cartoon animals, "A is for apple," childish rewards, or elementary-looking presentation. Students may be teenagers working on beginning skills.
2. NO AI/TTS/ROBOT VOICES. Any instructional audio is Miq's recorded human voice.
3. NO AUTOMATIC SPEECH SCORING. Oral reading/pronunciation is scored by a human teacher. The app may count taps, calculate totals, score ordinary multiple-choice responses, and display results.
4. NO DIAGNOSIS. Never state or imply that a student has dyslexia, ADHD, a learning disability, a speech disorder, or any medical/special-education diagnosis.
5. Do not automatically recommend an IEP, evaluation, referral, or diagnosis. Those decisions belong to the school team/teacher.
6. Student identification is first name + last initial only.
7. Canvas submission is "Upload a file," never Canvas's built-in Record button.
8. Recordings should be consolidated. Do not create 26 separate files when one continuous file can capture the assessment.
9. For assessments of independent reading, do not play the answer/model before the student responds.
10. Accent alone is never an error. Multilingual pronunciation differences must not be confused with decoding failure.
11. Do not collapse language knowledge and decoding into one score when they measure different things.
12. Student-facing screens should not display humiliating grade labels. Internal teacher reports may use instructional labels where useful.
13. Keep diagnostic screens free of unnecessary scrolling. The active item must fit comfortably on a small Lenovo laptop.
14. Reading passages should be displayed without scrolling during timed reads whenever technically feasible; use width and responsive typography intelligently.
15. Preserve raw data, not only percentages.
16. Teacher controls placement, entry point, stopping, overrides, and instructional decisions.
17. All Reading Foundations content must remain original. Research sources inform the design; do not copy proprietary tests, word lists, routines, menus, passages, or copyrighted program content.

## 3. RESEARCH / QUALITY-ASSURANCE LENSES
Treat these as design-review lenses, not sources to copy.

### Ally — Reading Research / Instruction Lens
Audit the system against:
- Science of Reading / structured literacy
- LETRS-informed principles
- IES / What Works Clearinghouse adolescent reading-intervention guidance
- Florida Center for Reading Research (FCRR), especially evidence-based instructional routines and assessment-to-instruction logic
- National Center on Improving Literacy (NCIL), including adolescent literacy domains
- DIBELS 8 principles for brief screening, benchmark/progress monitoring, and instructional decision-making
- Arizona ELA foundational reading standards and Arizona 2019 ELP standards
- CAFE concepts: comprehension, accuracy, fluency, expanding vocabulary; observed reading behaviors linked to instruction
- Daily 5 concepts: authentic reading practice, independence/stamina, read to self, read to someone, word work, listening to reading, and writing
- informal reading inventory principles: graded word reading followed by oral connected-text reading

When frameworks conflict, stronger current evidence for explicit decoding/word recognition takes priority over guessing from pictures/context.

### Ella — Multilingual / ELD Lens
Audit for:
- language-development versus decoding differences;
- accent/dialect versus actual reading errors;
- vocabulary familiarity effects;
- fair interpretation for multilingual learners;
- culturally and linguistically appropriate wording;
- Arizona/border Mexican Spanish if Spanish is used;
- avoiding conclusions that turn limited English proficiency into a reading-disability inference.

## 4. STUDENT HOME FLOW
After a student chooses class hour and then first name + last initial, the student menu must clearly expose these major areas:

1. DIAGNOSTIC TOOLS / READING CHECKS
2. FLUENCY
3. VOCABULARY / WORD & SENTENCE PRACTICE (preserve existing Bridges Unit 1 implementation already built)
4. READING COMPREHENSION (architecture can be present even if content is still being developed)

Do not bury diagnostics inside fluency.

The existing vocabulary workflow should remain: Miq-recorded word/sentence audio, finger-pacer/highlighting, student reading practice, final recording of the group's sentences, download/save, Canvas upload.

## 5. DIAGNOSTIC ARCHITECTURE
Teacher decides which students need early foundational checks. A stronger reader does not have to start at Check 1.

Checks 1–7 form the Foundational Skills / Word Recognition diagnostic pathway:
1. Letter Identification
2. Letter-Sound Knowledge
3. Phonemic Awareness
4. Decoding
5. Automatic Word Recognition
6. Morphological Awareness & Word Analysis
7. Multisyllabic Word Analysis

After these, the broader system bridges into:
- Daniels Assessment / word-reading placement screener
- connected-text fluency
- retell/comprehension
- teacher observational reading conference
- future language-comprehension architecture: vocabulary, syntax, connected-text comprehension

Do NOT invent Check 8 merely to extend the numbering.

# CHECK 1 — LETTER IDENTIFICATION
## Purpose
Determine whether the student can name uppercase and lowercase English letters accurately.

## Student task
- Student sees one letter at a time.
- Student says the LETTER NAME only.
- No model audio.
- One continuous audio recording for the entire check.
- One downloadable file / one Canvas upload.

## Fixed mixed-order sequences
Uppercase:
M T A S P R F B L C H N D G W E K J U V Y I Q O X Z

Lowercase:
s m a t r p c f n h b l d e g i w k u y j v o q x z

## Font rule (approved amendment)
Use a font where capital I and lowercase l look clearly different, and where lowercase a and g use the simple handwriting shapes (single-story a and g).

**Before building the rest of Check 1: show a screenshot of all 52 letters in the chosen font for approval.**

## Teacher scoring
For each letter allow:
- Correct
- Incorrect
- Skip / no response
- Self-corrected
- Review/teacher note if already supported by current scoring UI

Report:
- uppercase correct / 26
- lowercase correct / 26
- total correct / 52
- exact missed uppercase letters
- exact missed lowercase letters
- letters needing instruction
- self-corrections
- optional completion time

Do not automatically assign a diagnosis or grade level.

## Instructional handoff
Missed letters automatically populate the teacher target list. Teacher tools later use those targets without retyping them.

# CHECK 2 — LETTER-SOUND KNOWLEDGE
## Purpose
Determine whether the student can produce the most common/basic sound associated with each letter and allow the teacher to see mouth production when needed.

## Recording mode
VIDEO, one continuous video file for the whole check.
Do not split consonants and vowels into separate student files.

## Order
21 consonants:
m s t p f n r b c h d g l w j k v y z q x

5 vowels:
a i o e u

## Student task
- One letter at a time.
- Student gives the sound, not the letter name.
- No model audio before response.
- Student camera should show the face/mouth clearly enough for teacher review.
- Save/download one video and upload one file to Canvas.

## Teacher scoring / notes
Support:
- Correct
- Incorrect
- Skip/no response
- Self-corrected
- Letter-name substitution
- Alternate vowel sound
- Sound-production/articulation observation
- Teacher note

## Teacher answer key (approved amendment)
- c = /k/ is correct; /s/ = mark "Alternate sound" (not wrong)
- g = /g/ is correct; /j/ = mark "Alternate sound" (not wrong)
- x = /ks/
- q = /kw/
- y = /y/ as in "yes"
- Short vowels are the target: a (apple), i (itch), o (octopus), e (echo), u (up). A long vowel = mark "Alternate vowel sound."
- Accent is never an error (e.g., b/v sounding similar).

Report consonant and vowel results separately as well as overall.
Do not mark accent alone as an error.
The purpose is instructional targeting, not speech diagnosis.

# CHECK 3 — PHONEMIC AWARENESS
## Purpose
Determine whether the student can hear and manipulate speech sounds independent of print.

## Important design rule
This is a SOUND assessment. Use VIDEO for the student response so the teacher can hear and, when useful, see mouth production. Miq records every teacher prompt that must be heard. No TTS.

## Structure
4 unscored practice prompts + 20 scored items:
- 5 initial-sound identification
- 5 final-sound identification
- 5 phoneme blending
- 5 phoneme segmentation

Known scored item bank (as uploaded — see the open conflict note above regarding items 3–4):
Initial sounds: map, fish, top, nose, bike
Final sounds: sun, lip, bus, room, cat
Blending:
1. /ă/ - /t/ -> at
2. /m/ - /ē/ -> me
3. /s/ - /ŭ/ - /n/ -> sun
4. /f/ - /ĭ/ - /sh/ -> fish
5. /s/ - /t/ - /ŏ/ - /p/ -> stop

**Approved correction (from an earlier round, removes duplicate words with the lists above):**
- Blending item 3: replace "sun" (/s/-/ŭ/-/n/) with **"mop"** (/m/-/ŏ/-/p/)
- Blending item 4: replace "fish" (/f/-/ĭ/-/sh/) with **"ship"** (/sh/-/ĭ/-/p/)

Segmentation: preserve the current locked Check 3 item bank if already present in the existing build/spec. If not present, use an ORIGINAL five-item progression from 2 to 4 phonemes, avoiding culturally loaded vocabulary, and flag the five items in the code comments/content data as "developmental pilot items — QC before commercial release." Do not copy DIBELS, CORE, or another published phonemic-awareness test.

**Approved segmentation items (developmental pilot — QC before commercial release):**
1. up → /ŭ/ /p/ (2 sounds)
2. sock → /s/ /ŏ/ /k/ (3 sounds)
3. chin → /ch/ /ĭ/ /n/ (3 sounds, digraph)
4. jump → /j/ /ŭ/ /m/ /p/ (4 sounds)
5. frog → /f/ /r/ /ŏ/ /g/ (4 sounds, blend)

Duplicate check across Check 3 (corrected blending: mop, ship + segmentation: up, sock, chin, jump, frog) verified by script — no repeats. If the original sun/fish blending items are used instead, re-run this check against the initial/final-sound lists above, which also contain "sun" and "fish."

Practice prompts:
Use four original practice items that teach the response format without duplicating scored items. These are practice only and must not count in the score.

## Student response
One continuous video recording for the full scored assessment, not separate files per item.

## Teacher scoring
Score each response correct/incorrect/skip/self-corrected and retain domain totals:
- Initial sound /5
- Final sound /5
- Blending /5
- Segmentation /5
- Total /20

Also retain exact missed items/skill type.
No automatic speech scoring.
No diagnosis.

# CHECK 4 — DECODING INVENTORY
## Purpose
Determine which phonics/orthographic patterns the student can use to decode printed words.

## Structure
Use the locked 12-band progression, total bank 142 items:
- 4A Short-vowel VC/CVC — 10
- 4B Digraphs — 12
- 4C Blends — 12
- 4D Complex closed syllables — 10
- 4E VCe / silent-e — 12
- 4F Open syllables — 10
- 4G Vowel teams — 14
- 4H R-controlled — 12
- 4I Complex vowels — 14
- 4J Inflectional endings + consonant-le — 12
- 4K Two-syllable decoding — 12
- 4L Multisyllabic / morphemic decoding — 12

## Item principles
- Use original Reading Foundations item banks.
- Include real words plus a limited number of carefully controlled pseudowords where useful to distinguish decoding from memorized word recognition.
- Pseudowords must be QC'd for accidental real words, names, brands, offensive meanings, and common words in students' home languages before commercial release.
- Do not copy published phonics surveys.

## Administration
- Student reads printed words independently.
- No pronunciation model/audio before response.
- One continuous audio recording for the administered portion.
- Teacher controls entry point and stopping; do not force all 142 items on every student.
- Preserve the existing locked Check 4 word bank if already present in current project files. If exact item data are not in the current file, scaffold the 12 sections and mark missing item banks clearly for Miq/ChatGPT content insertion rather than silently copying/inventing a published list.

## Teacher scoring
At minimum:
- Correct
- Incorrect
- Skip/no response
- Self-corrected

Retain results by phonics pattern, not only overall percent.
Missed patterns automatically become instructional targets.

# CHECK 5 — AUTOMATIC WORD RECOGNITION
## Purpose
Determine which high-utility words are recognized immediately versus laboriously decoded or missed.

## Important distinction
This is NOT a rote "test all Fry 600 words" assessment.
Fry/high-frequency resources may inform instructional coverage, but Reading Foundations uses its own original bank and separates automatic recognition from decoding.

## Structure
Six sets x 20 words = 120-word bank:
- 5A Essential Automatic
- 5B Common Function
- 5C Expanding Common
- 5D Connected-Text Utility
- 5E Extended High-Utility
- 5F Adolescent / Academic Utility

Sets are generally ordered by complexity/utility, NOT student-facing grade labels.

## Student task
- Printed word only.
- No picture, definition, sentence context, or model audio.
- One continuous audio recording.
- Teacher controls starting/stopping.

## Teacher scoring
- A = Automatic
- D = Decoded / Slow
- I = Incorrect / Skipped
- SC = Self-Corrected

Do not impose a fake rigid seconds threshold during the pilot. Teacher judgment distinguishes immediate recognition from visible/aural decoding effort.
Report each category separately.
Slow/decoded and incorrect words automatically populate the Target Word Bank.
Do not interpret unfamiliar English vocabulary as a decoding disability.
Phrases belong primarily in instruction/fluency, not this diagnostic.

# CHECK 6 — MORPHOLOGICAL AWARENESS & WORD ANALYSIS
## Diagnostic question
Can the student recognize, read, understand, and manipulate meaningful parts of words?

## 6A — Read It: Morphological Word Reading
50-word bank in five sets.

Set 1 — Inflectional endings:
jumps, wishes, jumped, landed, running, helping, faster, tallest, dogs, boxes

Set 2 — Common prefixes:
unhappy, unsafe, reread, replay, dislike, disagree, incorrect, impossible, preview, nonstop

Set 3 — Common suffixes:
helpful, careless, kindness, payment, washable, teacher, slowly, action, friendship, darkness

Set 4 — Base + multiple morphemes:
unhelpful, rereading, disagreement, carefully, unfinished, hopelessness, incorrectly, washable, kindness, reusable

Set 5 — Academic morphology:
prediction, transportation, disagreement, impossible, information, preparation, movement, improvement, educational, organization

Student reads independently. No model audio.
One continuous audio recording.
Teacher scoring: Correct / Incorrect / Self-corrected (and Skip if consistent with the global scoring UI).

## 6B — Understand It: Morpheme Meaning
24 selected-response items sampling:
- inflectional endings
- common prefixes
- common suffixes
- base-word recognition
- meaning changes

Miq-recorded directions/prompts may be used because this section is intended to assess morphological understanding, not make oral decoding the only barrier.
Ordinary multiple-choice answer-key scoring may be automatic.

Examples of the intended ORIGINAL item form:
- unhappy: what does `un-` contribute? -> not
- replay: what does `re-` contribute? -> again
- careless: what does `-less` contribute? -> without

Do not copy a published morphology assessment.

## 6C — Build It: Morphological Manipulation
12 selected-response/application items.

Examples of intended item form:
- Which word means "to play again"? -> replay
- Which word means "without hope"? -> hopeless
- Which word means "the state of being kind"? -> kindness

## Reporting
Do NOT collapse Check 6 into one crude percentage.
Report separately:
- Morphological Word Reading
- Inflectional Endings
- Prefixes
- Suffixes
- Multiple Morphemes
- English Morpheme Meaning
- Word Building/Application

A multilingual student may decode a word correctly without knowing its English meaning; preserve that distinction.

# CHECK 7 — MULTISYLLABIC WORD ANALYSIS
## Purpose
Determine whether the student can break an unfamiliar longer word into manageable parts, decode the parts, blend them, and pronounce the complete word.

## 7A — Two-syllable words (20)
sunset, picnic, rabbit, napkin, helmet, basket, music, hotel, robot, tiger, paper, open, cactus, seven, winter, market, problem, contest, number, hundred

## 7B — Compound words (10)
sunlight, football, weekend, bedroom, backpack, outside, upstairs, downtown, something, everyone

## 7C — Syllable-pattern application (18)
Closed: rabbit, basket, contest
Open: robot, music, hotel
VCe/silent-e: complete, mistake, inside
Vowel team: raincoat, daydream, season
R-controlled: market, perfect, corner
Consonant-le: little, purple, candle

The student does NOT need to name the syllable type. The skill is reading.

## 7D — Three-syllable words (15)
animal, banana, computer, remember, important, another, tomorrow, fantastic, discover, September, attention, different, energy, family, exercise

## 7E — Four-plus syllable / academic words (15)
information, education, community, independent, opportunity, organization, communication, population, environmental, mathematical, investigation, transportation, relationship, responsibility, electricity

## 7F — Controlled unfamiliar words (12)
Create a clearly isolated data slot for 12 original controlled pseudowords sampling:
- closed
- open
- VCe
- vowel teams
- r-controlled
- consonant-le
- mixed multisyllabic patterns

DO NOT silently copy pseudowords from a published assessment.
If the 12 final QC'd Reading Foundations pseudowords are not already in the project, leave them visibly marked as "CONTENT REQUIRED — FINAL QC BEFORE PILOT/COMMERCIAL USE" rather than inventing copyrighted content.

## Administration
- Printed word only.
- No model audio.
- One continuous audio recording for administered sections.
- Teacher controls entry/stop.
- No grade labels on student screen.

## Teacher scoring
Core:
- Correct
- SC Self-corrected
- Incorrect

Optional error-pattern flags:
- Couldn't Start
- First Part Correct
- Middle Error
- Ending Error
- Added/Omitted Syllable
- Incorrect Vowel
- Stress/Pronunciation Note

Accent alone is never an error. Meaning knowledge is not the same as decoding.

# 6. DANIELS ASSESSMENT — EXISTING WORD-READING PLACEMENT SCREENER
Preserve the existing Daniels Assessment if already built.

It is an original 10-word-per-level oral word-reading screener:
Pre-Primer through Grade 8.
Student-facing sets are labeled Set A, Set B, etc., not grade labels.
Teacher sees the real instructional level names.

Current rule:
- first list with 3+ errors is the ceiling;
- placement is the list immediately below;
- teacher may override.

Important product-language rule:
This cutoff is a developmental instructional decision rule, NOT a standardized/normed scientific cutoff. Do not label it validated until evidence supports that claim.

# 7. RECORDING RULES
- Check 1: one continuous AUDIO
- Check 2: one continuous VIDEO
- Check 3: one continuous VIDEO
- Check 4: one continuous AUDIO
- Check 5: one continuous AUDIO
- Check 6A: one continuous AUDIO; 6B/6C may use on-screen responses and Miq-recorded prompts
- Check 7: one continuous AUDIO
- Fluency: preserve existing recording flow
- Never generate dozens of Canvas files for one assessment.
- Files are saved/downloaded by the student and uploaded to Canvas. Do not assume recordings live permanently on a server.
- Claude should preserve or extend Miq's teacher-side recording library so she can record every prompt/model needed for instruction and assessment directions.

# 8. TEACHER RECORDING LIBRARY
Teacher side must support a clear recording queue/library for:
- assessment directions
- phonemic-awareness prompts
- instructional letter sounds
- phonemes
- words
- morphemes
- phrases
- sentences
- modeled reading passages when instruction requires them

Do not replace Miq's recordings with TTS.
If an assessment would be compromised by hearing the answer first, audio is directions only, not the target response.

# 9. TEACHER SCORING WORKFLOW
Claude has already built teacher-tap scoring. PRESERVE IT.

Instruction:
"Whatever scoring tool is already built, keep it. Compare it with these scoring requirements and modify/extend only where needed."

Teacher should be able to:
1. choose class/hour;
2. choose student;
3. choose assessment/recording;
4. play/pause/seek recording;
5. tap item-level scoring;
6. optionally flag error patterns;
7. save results;
8. see exact missed items/patterns;
9. see automatically generated instructional targets;
10. override any automated instructional placement/target decision.

The app counts and organizes. The teacher judges oral performance.

# 10. RESULTS → WHAT TO TEACH NEXT
This is a core product feature.

After scoring, the system should convert missed skills into structured target data. The teacher must NOT have to retype "C P R Y" or "-ful -less -ness -ment."

Teacher result screen should include clean links/buttons such as:
- What to Teach Next
- Student Practice
- Build a Lesson
- Flashcards
- Slides
- Game
- Practice Sheet
- Home Practice
- Family Communication
- AI Teacher Toolkit
- Recheck Target Skills

Keep the page clean. These may open panels/modals rather than displaying everything at once.

## AI Teacher Toolkit
Generate/copy ready-to-use prompts that automatically insert the student's actual target skills.

Example logic:
"Create a 15-minute age-respectful reading intervention lesson for a student age 10–14 who needs practice with [AUTO-POPULATED TARGETS]. Include explicit instruction, guided practice, reading, spelling/encoding when appropriate, short connected-text application, and an exit check. Do not use babyish content. Do not diagnose a disability."

The teacher can paste the prompt into ChatGPT, Gemini, Claude, or another AI tool.
Do not require the teacher to manually re-enter target data.

# 11. INSTRUCTIONAL RESPONSE / FIVE-DAY CYCLE
Reading Foundations must not stop at diagnosis.

Use this general intervention logic, adapted to the skill:
Day 1 — Explicitly teach/find the target
Day 2 — Build/manipulate/spell it when appropriate
Day 3 — Read it in words/phrases/sentences
Day 4 — Use it in age-respectful connected text/authentic reading
Day 5 — Recheck the TARGET skill

If secure -> advance.
If not secure -> another practice cycle with adjusted instruction.

Do not force every skill into exactly the same activity. Phonemic awareness, letter knowledge, decoding, automaticity, morphology, and fluency need different routines.

FCRR-style assessment-to-instruction logic may INFORM original Reading Foundations routines, but do not copy FCRR text/materials.

# 12. HOME SUPPORT
Home support appears alongside teacher results, not buried in a separate appendix.

Rules:
- short (often ~5 minutes);
- simple parent directions;
- no parent needs specialized literacy training;
- age-respectful;
- target exactly what the student is practicing;
- never diagnose;
- do not routinely lead with humiliating grade labels.

Example morphology home card:
un- = not
re- = again
-ful = full of
-less = without
Read/explain a few provided words and generate one more example.

Teachers remain responsible for sensitive conversations about actual instructional level.

# 13. TEACHER OBSERVATIONAL READING CONFERENCE — RESERVED/BUILT-IN ARCHITECTURE
Online recordings cannot fully replace watching a student read live.

Create a teacher-side place to record live small-group/individual observations without making it another mandatory foundational check.

Possible observable behaviors:
- skips endings
- guesses after first letters/sound
- loses place
- reads word-by-word
- repeated self-correction
- ignores punctuation
- accurate but very slow
- substitutes similar-looking words
- difficulty blending through the whole word
- long-word attack behavior

These observations should feed the same "What to Teach Next" system.

Future grouping feature:
Use diagnostic + observational data to suggest flexible groups by instructional need, while leaving teacher override in control.

# 14. FLUENCY / CONNECTED TEXT
Preserve the existing two-read routine:
- Day 1: one-minute cold read; teacher scores errors and WCPM
- Day 2: repeat read; timed practice
- Retell/comprehension is part of the connected-text workflow and must remain.

Track:
- words attempted
- errors
- words correct
- WCPM
- accuracy percentage
- retell/comprehension result
- passage/level
- date
- cold vs repeat read

Timed passages should fit on the student's small Lenovo screen without scrolling whenever technically feasible. Use responsive width/font size rather than tiny unreadable text.

# 15. FUTURE LANGUAGE-COMPREHENSION ARCHITECTURE
Do not build fake "Check 8/9" tonight merely to extend the series.

Reserve clear architecture for:
A. Vocabulary / oral-language knowledge
B. Syntax
C. Connected-text comprehension

Reason:
NCIL adolescent-literacy work highlights word recognition, vocabulary, morphology, syntax, and comprehension. Reading Foundations Checks 1–7 are strongest on foundational/word-recognition skills. The next major system should address language comprehension separately.

Keep these domains separate enough that a multilingual learner's English vocabulary/syntax development is not mislabeled as decoding failure.

# 16. PILOT / GROWTH DATA ARCHITECTURE
Planned baseline start: Monday, October 12, 2026.
Do NOT hard-code that date as the only allowed baseline. Each student's actual baseline date is the date their baseline is completed.

The system must be able to answer:
- Is the student growing?
- In what skill?
- How quickly?
- After how much instruction/practice?
- Which skills/routines appear to need revision?
- Are gains transferring to connected reading and comprehension?

## Three measurement layers
1. BASELINE
   Store initial skill profile by relevant domain.

2. TARGET-SKILL PROGRESS MONITORING
   Approximately every 2 weeks when practical.
   Recheck only skills actually being taught.
   Use parallel/new items measuring the same skill where possible; do not rely on memorizing the exact baseline items.

3. BROADER BENCHMARK
   Approximately every 4–6 weeks when practical.
   Sample the student's relevant broader reading profile, not necessarily every item in every check.

## Core growth variables
Store raw score + percent where applicable:
- letter identification
- letter-sound knowledge
- phonemic-awareness subskills
- decoding by pattern
- automatic word recognition: automatic/decoded/incorrect/self-corrected
- morphology subdomains
- multisyllabic word reading subdomains
- WCPM
- connected-text accuracy
- retell/comprehension
- target skills mastered
- current instructional target(s)

Do NOT create one giant "Reading Foundations Score" that hides different profiles.

## Dosage / exposure data
Automatically track, as technically feasible:
- session date
- minutes in Reading Foundations
- number of sessions
- days active
- skill/activity practiced
- activities completed
- rechecks completed
- after-school vs regular-class session if teacher chooses to tag it

This is essential for later dose-response analysis.

## Practical implementation recommendation
Reading Foundations is designed to function as a targeted intervention layer within ELA/ELD, not necessarily a replacement for core curriculum.

Initial implementation guidance:
- whole-class starting target: ~15 minutes/day, 4–5 days/week when feasible;
- students with moderate needs may require more targeted time;
- students with severe foundational gaps may need 30+ minutes/day or additional intervention;
- Miq's intensive after-school group may receive 45–60 minutes on intervention days.

IMPORTANT: 15 minutes is a practical starting recommendation, NOT a scientifically proven universal threshold. Student response to intervention should drive intensity.

# 17. GROWTH DASHBOARD
Teacher should be able to view:
- individual student
- class/hour
- entire cohort

Individual dashboard:
- baseline date
- current date
- raw baseline/current/change
- WCPM trend
- accuracy trend
- comprehension/retell trend
- automatic word-recognition trend
- target skills mastered
- current targets
- minutes/sessions of intervention
- timeline of rechecks

Class/cohort dashboard:
- number of students
- average AND median change
- distribution of growth/stable/decline
- percent mastering at least one target
- average number of targets mastered
- WCPM/accuracy/comprehension trends where applicable
- dosage summaries
- skill bottlenecks (e.g., many students repeatedly failing the same pattern)

Do not manipulate the display to "prove" success. The dashboard must make lack of growth visible too.

# 18. DATA EXPORT
Preserve raw data so a future researcher/statistician can analyze it.

Add/export-ready structure for CSV/JSON where feasible, including:
- anonymized student key (first name + last initial or safer internal ID)
- class/hour
- date
- check/subtest
- item/skill
- raw response category
- score
- target
- session minutes
- intervention activity
- recheck result

Do not export private full names.

# 19. VALIDATION LANGUAGE / CLAIMS
Reading Foundations is currently:
- research-aligned by design;
- developmental/pilot-stage;
- intended for expert review and classroom pilot testing.

Do NOT display or market the Daniels Checks as:
- standardized
- normed
- nationally validated
- diagnostic of disability
- proven to cause reading growth

Future evidence ladder:
research-aligned -> independent expert review -> pilot/usability evidence -> pre/post outcome evidence using independent measures -> larger independent efficacy studies -> possible formal evidence classification.

# 20. UI / UX
- Mature, clean, high-contrast design.
- Existing dark-mode black/gold/white/tan direction may be preserved if already in the app.
- Large readable type.
- Small Lenovo laptop friendly.
- No elementary clip art.
- Minimal cognitive load.
- One clear task at a time.
- Clear progress indicator without exposing humiliating labels.
- Teacher pages may be information-dense but should use collapsible sections/cards.
- Student recording workflow must make "Save/Download -> Canvas Upload" unmistakable.

# 21. PAPER/PENCIL FUTURE-PROOFING
The digital build should keep assessment content structured so the same checks can later generate/align with printable teacher/student sheets:
- student stimulus page/card
- teacher scoring sheet
- directions
- score summary
- instructional targets

Do not make the digital content impossible to export into clean print forms later.

# 22. CLAUDE CODE IMPLEMENTATION ORDER
Do this in controlled stages, testing after each stage:

PHASE 1 — Inspect/preserve
- inspect existing file and current features;
- identify reusable recording/scoring/data components;
- back up.

PHASE 2 — Navigation shell
- add/confirm Diagnostic Tools entry;
- add Checks 1–7 teacher/student routing;
- preserve Fluency/Vocabulary/Comprehension areas.

PHASE 3 — Assessment engines
- implement content/data structures for Checks 1–7;
- reuse generic item presentation/scoring components where possible;
- support audio/video recording mode by check;
- preserve one-file rule.

PHASE 4 — Teacher scoring/results
- extend current tap scoring;
- item-level data;
- subskill summaries;
- targets;
- teacher override.

PHASE 5 — What to Teach Next
- target propagation;
- intervention links/buttons;
- AI prompt generator;
- home support;
- recheck architecture.

PHASE 6 — Pilot data
- baseline/progress/benchmark data model;
- dosage;
- student/class/cohort growth views;
- raw export.

PHASE 7 — QA
Test:
- student hour/name selection
- every diagnostic start/next/back/finish path
- recording permissions
- audio/video file creation
- download/save
- teacher playback
- scoring persistence
- result calculations
- target propagation
- recheck
- growth charts/data
- no scrolling/clipping on Lenovo-size viewport
- existing Vocabulary and Fluency features still work
- no regressions

# 23. DO NOT INVENT MISSING PROPRIETARY CONTENT
If an exact Reading Foundations item bank referenced above is not present:
- do not copy DIBELS, San Diego Quick Assessment, CORE, Six Minute Solution, Read Naturally, CAFE menus, LETRS materials, FCRR worksheets, NCIL/AAL items, or any other proprietary assessment/program;
- create a clearly labeled placeholder/data slot;
- tell Miq exactly which ORIGINAL content is still required.

# 24. DEFINITION OF DONE FOR THIS BUILD
This build is successful when:
1. Existing working Reading Foundations features remain intact.
2. Diagnostic Tools is clearly available to students after class/name selection.
3. Checks 1–7 have functioning student flows.
4. Correct recording mode is used for each check.
5. Teacher can score recordings with the required categories.
6. Results are stored by subskill.
7. Missed skills auto-populate instructional targets.
8. Teacher sees clean What-to-Teach/Practice/Home/AI/Recheck options.
9. Pilot baseline/progress/dosage data can be stored.
10. Growth can be viewed without manufacturing a success narrative.
11. Future vocabulary/syntax/comprehension and live observational conference architecture has room to plug in.
12. The app remains age-respectful, original, human-scored, and usable by one teacher with many students.

# 25. FINAL REPORT BACK TO MIQ
After implementation, report:
- exactly what was changed;
- what was preserved;
- which Checks are fully functional;
- which original content banks are still placeholders;
- any technical limitations;
- what Miq needs to record;
- what Miq needs to test tomorrow;
- any bugs found/fixed;
- exact GitHub commit/push status if Claude Code is authorized to publish.

Do not claim completion unless the full student and teacher paths were actually tested.

---

## Amendment log

- Check 1 font rule (I vs l, single-story a/g) + screenshot-before-building gate — folded into the final Checks 1–3 section near the top of this file.
- Check 2 teacher answer key (c/g/x/q/y, short-vowel targets, accent-never-an-error) — folded into the final section.
- Check 3 blending: went through two revisions before landing — original (sun, fish) → interim correction (mop, ship) → **final (at, me, red, hop, stop)**, per the "FINAL CONTENT AND BUILD INSTRUCTIONS FOR CHECKS 1–3" round. The final list is what's authoritative; see the resolved section near the top.
- Check 3 segmentation: also revised — original approved items (up, sock, chin, jump, frog) → **final (go, van, ship, best, flag)**, per the same final round. The final list is what's authoritative.
- All 20 Check 3 scored words (final version) verified duplicate-free by script: map, fish, top, nose, bike, sun, lip, bus, room, cat, at, me, red, hop, stop, go, van, ship, best, flag.
