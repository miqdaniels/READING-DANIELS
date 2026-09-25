# Master Spec

**Status:** Content-approval tracking only. Nothing described below has been built yet.
**How this works:** Content is approved check-by-check ahead of the staged build. Each entry here is applied only when the build reaches that check — this file is the source of truth for what was approved, not an instruction to start building.

**Scope note:** This spec (letters, phonics blending/segmentation) does not overlap with the rest of this repo's app (`index.html`), which is a 7th–8th grade vocabulary/fluency tool with no phonics or letter-sounds component. This file was added here because no other location was specified — move it if it belongs in a different project/repo.

---

## CHECK 1 — Letter lists

Approved as written in the spec (letter lists/order themselves not re-transcribed here — see the spec they were approved from).

**Font rule:** Use a font where capital I and lowercase l look clearly different, and where lowercase a and g use the simple handwriting shapes (single-story a and g).

**Before building the rest:** show a screenshot of all 52 letters (26 uppercase + 26 lowercase) in the chosen font for approval.

---

## CHECK 2 — Letter order + teacher answer key

Letter order approved as written in the spec.

**Teacher answer key:**
- **c** — /k/ is correct; /s/ = mark "Alternate sound" (not wrong)
- **g** — /g/ is correct; /j/ = mark "Alternate sound" (not wrong)
- **x** — /ks/
- **q** — /kw/
- **y** — /y/ as in "yes"
- **Short vowels are the target:** a (apple), i (itch), o (octopus), e (echo), u (up). A long vowel = mark "Alternate vowel sound."
- **Accent is never an error** (e.g., b/v sounding similar).

---

## CHECK 3 — Blending (corrected) + Segmentation

**Correction — removes duplicate words:**
- Blending: replace "sun" (/s/-/ŭ/-/n/) with **"mop"** (/m/-/ŏ/-/p/)
- Blending: replace "fish" (/f/-/ĭ/-/sh/) with **"ship"** (/sh/-/ĭ/-/p/)

**Segmentation items** (original, developmental pilot items — QC before commercial release):
1. up → /ŭ/ /p/ (2 sounds)
2. sock → /s/ /ŏ/ /k/ (3 sounds)
3. chin → /ch/ /ĭ/ /n/ (3 sounds, digraph)
4. jump → /j/ /ŭ/ /m/ /p/ (4 sounds)
5. frog → /f/ /r/ /ŏ/ /g/ (4 sounds, blend)

**Duplicate check:** verified by script — words across Check 3 (mop, ship, up, sock, chin, jump, frog) are all unique, no repeats. ✓
