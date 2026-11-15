# TALL word lists (data/tall-word-lists.json)

The Word Builder page (`tall-words.html`), the recording studio (`tall-studio.html`, WRD_ clips) and the tests all read this ONE file.
Update the lists here; no code changes needed.

```
{ "groups": [ { "id": "g1", "title": "Short Vowels",
                "patterns": [ { "id": "short-a", "title": "Short a", "spelling": "a",
                                "build": [ word x10 ],      // one-sound-change chain
                                "read":  [ word x10 ] } ] } ],
  "heartSets": [ { "id": "heart-1", "title": "Heart words 1", "words": [ word, ... ] } ] }
word = "sat" | "sat*" (star = First 100 Daily Phrases word) |
       { "w": "what", "first100": true, "heart": true, "tricky": "a" }
```
The loader also accepts `word`/`text` for `w`, `star` for `first100`, capitalised keys (`Groups`, `Build`, `Read`) and a flat `patterns` list.
Pattern ids must be unique (progress is saved by pattern id). The `ending`/`inflect`/`suffix` words in a pattern id or title turn on ending tiles (-s -es -ed -ing).

**Currently:** `TALL_Word-Lists_Level-1_v3.json` (Nov 15, 2026): 46 patterns in 10 groups + 4 heart-word sets, installed byte-for-byte.
Its shape: `{version, note, patterns:[{group:"G1", groupTitle:"Short Vowels", id:"short a", title, build:[...], read:[...]}], heartWords:[{set:1, words:[...]}]}`
with each word `{w, first100, heart, academic}`. To update the lists, replace this file; nothing else needs to change.

Things the tests check on every word: it splits into tiles that rebuild the word, every tile is on the approved tile list, every tile's
SND_xx_S clip exists, 10 Build + 10 Read per pattern. **The Build rule is checked strictly in `tests/test-tall-word-chains.js` with NO exceptions list**: from one word to the next exactly one tile is swapped, added or removed. Any step that breaks it is listed (grouped by cause) and fails that test. Words are never changed by Claude.

Word audio: Miquela's own recordings only (never text-to-speech). Put cleaned `WRD_<word>.webm` clips in `audio/TALL-W/`, then run
`node tools/build-word-audio-map.js` to refresh `tall-word-audio.js`. Until a word is there the app says "Not recorded yet."
Roster: `node tools/build-tall-roster.js` refreshes `tall-roster.js` from index.html if the class lists change.


## Build chains (2026-11-15)
Every Build list is a one-tile chain (`node tests/test-tall-word-chains.js`, no exceptions). Where a spelling pair cannot be joined in one step (oi/oy, ey and ee/ea, two-syllable First 100 words) the unjoinable words live in that pattern's Read list.
