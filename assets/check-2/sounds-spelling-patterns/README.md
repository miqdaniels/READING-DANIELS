# Check 2 · Sounds & Spelling Patterns (60-slide deck)

Teacher-only teaching resource: **Teacher Dashboard › What to Teach Next › Check 2 › Sounds & Spelling Patterns**.
It is a viewer for the approved PowerPoint, not a rebuild of it. Teaching slides only: opening or browsing it never
changes an assessment, score, placement, unlock or any saved data.

## What is in this folder

| Path | What it is |
|---|---|
| `slides/slide-01.webp` … `slide-60.webp` | The 60 slides, **lossless WebP, 2560 × 1440** (16:9), in the deck's own order. Loaded on demand, never at app start. |
| `manifest.json` | Canonical navigation data, **read from the deck's presentation order and hyperlink relationships** (never from file names). One entry per slide: title, accessible text, the control-bar buttons, and the clickable rectangles (normalized 0–1 coordinates). |
| `manifest.js` | The same data as `window.RF_C2_SSP=…`, loaded by a `<script>` tag the first time the screen opens (works from `file://` too). Generated; do not edit. |
| `render-report.json` | How the images were made: tool versions, the font proof, per-image SHA-256 and the pixel-exact round-trip result. |
| `fonts/ComicNeue-Bold.ttf`, `fonts/OFL.txt` | Comic Neue Bold, byte-identical to the font embedded in the deck, with its SIL Open Font License. Used only on this screen. |

The 66.5 MB source deck is **not** stored in the repository. It is identified in `manifest.json → source`
(`Reading_Foundations_Original_v6.pptx`, 66,534,181 bytes, SHA-256
`8d645a15e7d640beec1a7058a76c891c723bbf067bf59e1cee674d62ad2a256d`).

## How the images were made

`tools/render-c2-ssp-slides.py` (LibreOffice → PDF → pdftocairo → lossless WebP), every step checked:

1. **Font gate** – "Comic Neue" Bold must resolve to a file byte-identical to the font embedded in the deck, or nothing is rendered.
2. **PDF** – lossless image compression, **no resolution reduction**, so every picture keeps its native pixels (the densest placed picture needs 2256 px across; images are 2560).
3. **Font proof** – every letter and digit (2,644) is drawn in Comic Neue Bold, none in another font. Only three symbols are drawn by a fallback font, because Comic Neue does not contain them: `←` and `→` (footer Previous / Next) and `⌂` (footer Home).
4. **Raster** – exactly 2560 × 1440.
5. **Lossless** – each slide is saved as lossless WebP and decoded again; every pixel must equal the PNG.

The final composition is rendered, so stacked pictures are handled exactly as PowerPoint stacks them (on slide 22, ship, the visible top picture is opaque and two obsolete pictures lie hidden beneath it; they are never shown).
Re-running the tool on the same deck reproduces all 60 images **byte for byte**.

```
python3 -I tools/render-c2-ssp-slides.py  <deck.pptx> assets/check-2/sounds-spelling-patterns/slides     # images + render-report.json
python3 -I tools/build-c2-ssp-manifest.py <deck.pptx> assets/check-2/sounds-spelling-patterns --expect-sha256 8d645a15e7d640beec1a7058a76c891c723bbf067bf59e1cee674d62ad2a256d
python3 -I tools/verify-c2-ssp-rendering.py assets/check-2/sounds-spelling-patterns                      # pixel proof of hotspot alignment
node tests/test-c2-ssp.js                                                                                # (also in npm test)
node tests/e2e-c2-ssp.js http://127.0.0.1:8765 /tmp/shots                                                # real browser, needs a static server
```

## How navigation works

* **Menu numbers are not slide numbers.** Sound entry 20 (`/sh/ · ship`) is physical slide 22; entry 21 (`/sh/ · ti · station`) is slide 23; entry 22 (`/sh/ · ci · special`) is slide 24. Physical order and `slideN.xml` numbers differ in this deck (e.g. slide 1 is `slide2.xml`, slide 59 is `slide1.xml`).
* **Seven categories, 51 sound slides:** Consonants 18 · Consonant Digraphs & Alternative Spellings 8 · Short Vowels 5 · Long Vowels & Vowel Teams 7 · Diphthongs 3 · R-Controlled Vowels 6 · Other Vowel Sounds & Patterns 4. Plus the cover, the main category menu and the seven category menus = 9 navigation slides (60 in all). The short-vowel menu is physical slide 56.
* **Category boundaries follow the deck:** the first sound's Previous and the last sound's Next return to that category's menu (they never step into another category). Home opens the main category menu.
* **Three layers of buttons, same destinations:** transparent HTML `<button>`s over the deck's own visible controls (exact deck positions, normalized so they stay aligned at any size); a control bar *below* the picture with larger buttons (≥ 44 px tall) that mirrors the footer — the way to navigate on phones and from slides whose artwork hides its own footer; and, **only on screens narrower than 640 px**, a "Choose a sound" / "Choose a category" list of 48 px buttons that repeats the menu's own entries with the deck's own labels (the deck's menu buttons are only about 20 px tall on a 390 px phone).
* **oo / moon (slide 50):** the deck's artwork picture is stacked above that slide's own Previous / category / Home / Next buttons and no link sits above it, so those buttons are neither visible nor clickable on the slide itself. The viewer places no hotspots there and says so; the bar carries the deck's real links (Previous and category → Other Vowel Sounds & Patterns menu, Home → main menu, Next → oo as in book).
* **One tap = one step.** A half-second lock after a tap (a tenth of a second for the keyboard) stops the second tap of a double tap from landing on the control in the same spot on the next slide; held-down arrow keys do not run on.
* **Nothing is stored** and no history entries are added; Browser Back behaves as on every other screen of the app. **Back to Check 2** returns to the same page with the same student selected.
* **Audio and camera icons on the slides are placeholders.** They are not clickable. No audio is played or generated, and no recording exists for this deck.

## Findings about the deck itself (reported, never "fixed" here — the approved artwork is untouched)

1. **Slide 50, oo / moon:** footer buttons hidden under the artwork (see above).
2. **Wrong category name printed on eight footers** (the link behind each button still goes to the correct menu): slide 39 (long u · cube) prints DIPHTHONGS; slide 40 (ey · key) and slides 44–49 (all six R-controlled sounds) print OTHER VOWEL SOUNDS.
3. **DIGRAPHS category button, slides 21–28:** no explicit text colour and 18 pt text (the other category buttons are dark green `0B3723`, 9.61 pt), so it renders pale on a pale button.
4. **Long Vowels menu (slide 57):** entries 32 and 36 are lettered at 19 pt, the other five at 20 pt. Every other menu is uniform, including the short-vowel menu (all five buttons identical).
5. **One unused picture** (`ppt/media/image18.png`) and, on slide 22, two hidden obsolete pictures. Neither is shown.

## Not tested here

Native PowerPoint rendering (the images come from LibreOffice with the real Comic Neue Bold), Canvas, school Wi-Fi / school devices, real student use. No microphone or camera is used by this resource.
