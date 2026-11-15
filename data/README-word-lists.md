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

**Currently a SEED:** Groups 1-2 only (11 patterns), word for word from the lists approved Nov 14, 2026.
Replace with `TALL_Word-Lists_Level-1_v1.json` (46 patterns, 11 groups, 4 heart sets) when it is added.

Things the tests check on every word: it splits into tiles that rebuild the word, every tile is on the approved tile list, every tile's
SND_xx_S clip exists, each Build word changes ONE sound from the one before (known exceptions are listed in `tests/test-tall-words-core.js`),
10 Build + 10 Read per pattern.

Word audio: Miquela's own recordings only (never text-to-speech). Put cleaned `WRD_<word>.webm` clips in `audio/TALL-W/`, then run
`node tools/build-word-audio-map.js` to refresh `tall-word-audio.js`. Until a word is there the app says "Not recorded yet."
Roster: `node tools/build-tall-roster.js` refreshes `tall-roster.js` from index.html if the class lists change.
