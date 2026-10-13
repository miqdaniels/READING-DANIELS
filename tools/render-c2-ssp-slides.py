#!/usr/bin/env python3
"""Renders the approved "Sounds & Spelling Patterns" deck to lossless WebP slide images, exactly as the
images in assets/check-2/sounds-spelling-patterns/slides/ were made. It never edits the .pptx.

Usage:  python3 -I tools/render-c2-ssp-slides.py <deck.pptx> <out-dir> [--work DIR] [--jobs N] [--fonts DIR]

Needs on PATH: soffice (LibreOffice), pdftocairo / pdffonts / pdftohtml / pdfinfo (poppler), fc-match / fc-scan.
Pipeline (every step is checked, any failure stops the run):
  1. FONT GATE   Comic Neue Bold must resolve (fontconfig) to a file that is byte-identical to the font embedded in
                 the deck. If it does not, the run STOPS: no slide is rendered with a substitute font.
  2. PDF         LibreOffice -> PDF with lossless image compression and NO resolution reduction, so every embedded
                 picture keeps its native pixel dimensions (the densest picture needs 2256 px across; we render 2560).
  3. FONT PROOF  every letter and digit in the PDF must be drawn in ComicNeue-Bold. Characters the font does not
                 contain (the arrows and house symbol printed on the footers) are listed, not hidden.
  4. RASTER      pdftocairo at exactly 2560x1440 (smooth interpolation), 16:9, one PNG per slide, in --work.
  5. LOSSLESS    each PNG is saved as lossless WebP and decoded again; every pixel must be identical to the PNG.
Writes <out-dir>/slide-NN.webp and <out-dir>/../render-report.json (tool versions, font proof, per-slide hashes)."""
import sys, os, io, re, json, glob, shutil, struct, hashlib, zipfile, argparse, subprocess, collections, tempfile
from concurrent.futures import ProcessPoolExecutor
import xml.etree.ElementTree as ET
from PIL import Image, ImageChops

W, H, PAGES = 2560, 1440, 60


def sha(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''): h.update(b)
    return h.hexdigest()


def run(cmd, **kw):
    return subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, **kw).stdout.decode('utf8', 'replace')


def eot_font_data(blob):
    """The font program inside a PowerPoint .fntdata (an uncompressed, unencrypted EOT container)."""
    eot_size, font_size, version, flags = struct.unpack('<IIII', blob[:16])
    if flags & 0x4: sys.exit('embedded font is MTX-compressed; cannot compare it byte for byte')
    data = blob[-font_size:]
    return bytes(b ^ 0x50 for b in data) if flags & 0x10000000 else data


def raster_range(args):
    pdf, prefix, a, b = args
    subprocess.run(['pdftocairo', '-png', '-scale-to-x', str(W), '-scale-to-y', str(H), '-f', str(a), '-l', str(b), pdf, prefix], check=True,
                   stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    return a, b


def to_webp(args):
    n, png, out = args
    im = Image.open(png).convert('RGB')
    im.save(out, 'WEBP', lossless=True, quality=100, method=4)
    back = Image.open(out).convert('RGB')
    return {'slide': n, 'file': os.path.basename(out), 'width': back.width, 'height': back.height, 'bytes': os.path.getsize(out),
            'pixelExactVsPng': ImageChops.difference(im, back).getbbox() is None, 'sha256': sha(out), 'sourcePngSha256': sha(png)}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('deck'); ap.add_argument('out'); ap.add_argument('--work'); ap.add_argument('--jobs', type=int, default=4)
    ap.add_argument('--fonts', help='folder holding ComicNeue-Bold.ttf to install for this run (optional; the system font is used otherwise)')
    a = ap.parse_args()
    work = a.work or tempfile.mkdtemp(prefix='rf-ssp-render-')
    os.makedirs(work, exist_ok=True); os.makedirs(a.out, exist_ok=True)
    deck_sha = sha(a.deck)
    z = zipfile.ZipFile(a.deck)

    # ---- 1. font gate ----
    emb = {}
    for part, key in (('ppt/fonts/RFComicNeueBold.fntdata', 'bold'), ('ppt/fonts/RFComicNeueRegular.fntdata', 'regular')):
        emb[key] = eot_font_data(z.read(part))
    if a.fonts:
        for f in ('ComicNeue-Bold.ttf', 'ComicNeue-Regular.ttf'):
            d = os.path.expanduser('~/.fonts'); os.makedirs(d, exist_ok=True); shutil.copy(os.path.join(a.fonts, f), d)
        run(['fc-cache', '-f'])
    resolved = run(['fc-match', '-f', '%{file}', 'Comic Neue:bold']).strip()
    if not resolved or hashlib.sha256(open(resolved, 'rb').read()).hexdigest() != hashlib.sha256(emb['bold']).hexdigest():
        sys.exit('FONT BLOCKER: "Comic Neue" Bold resolves to %r, which is not the font embedded in the deck. Install the supplied ComicNeue-Bold.ttf '
                 '(see --fonts). Nothing was rendered: no substitute font is ever used.' % resolved)
    font_report = {'resolvedBoldFile': resolved, 'resolvedBoldSha256': sha(resolved), 'embeddedBoldSha256': hashlib.sha256(emb['bold']).hexdigest(), 'identicalToEmbedded': True}
    charset = set()
    for tok in run(['fc-scan', '--format', '%{charset}\n', resolved]).split():
        lo, _, hi = tok.partition('-'); charset.update(range(int(lo, 16), int(hi or lo, 16) + 1))

    # ---- 2. PDF (lossless, no downsampling) ----
    pdf_dir = os.path.join(work, 'pdf'); os.makedirs(pdf_dir, exist_ok=True)
    opts = ('pdf:impress_pdf_Export:{"UseLosslessCompression":{"type":"boolean","value":"true"},"ReduceImageResolution":{"type":"boolean","value":"false"},'
            '"Quality":{"type":"long","value":"100"},"ExportNotesPages":{"type":"boolean","value":"false"},"ExportHiddenSlides":{"type":"boolean","value":"true"}}')
    run(['soffice', '--headless', '-env:UserInstallation=file://' + os.path.join(work, 'lo_profile'), '--convert-to', opts, '--outdir', pdf_dir, a.deck])
    pdf = glob.glob(os.path.join(pdf_dir, '*.pdf'))[0]
    info = run(['pdfinfo', pdf])
    pages = int(re.search(r'Pages:\s+(\d+)', info).group(1))
    if pages != PAGES: sys.exit('PDF has %d pages, expected %d' % (pages, PAGES))

    # ---- 3. font proof ----
    xml = run(['pdftohtml', '-xml', '-i', '-q', '-stdout', pdf])
    root = ET.fromstring(xml)
    fam = dict((f.get('id'), f.get('family').split('+')[-1]) for f in root.iter('fontspec'))
    drawn = collections.defaultdict(collections.Counter)
    for t in root.iter('text'):
        for ch in ''.join(t.itertext()):
            if not ch.isspace(): drawn[fam.get(t.get('font'), '?')][ch] += 1
    letters_elsewhere = sum(n for f, c in drawn.items() if 'ComicNeue' not in f for ch, n in c.items() if ch.isalnum())
    if letters_elsewhere: sys.exit('FONT BLOCKER: %d letters/digits were drawn in a font other than Comic Neue Bold: %s' % (letters_elsewhere, dict((f, dict(c)) for f, c in drawn.items())))
    fallback = dict((f, dict((ch, n) for ch, n in c.items())) for f, c in drawn.items() if 'ComicNeue' not in f)
    for f, c in fallback.items():
        for ch in c:
            if ord(ch) in charset: sys.exit('FONT BLOCKER: %r is in Comic Neue Bold but was drawn in %s' % (ch, f))
    font_report.update({'fontsInPdf': sorted(set(fam.values())), 'lettersAndDigitsInComicNeueBold': sum(n for f, c in drawn.items() if 'ComicNeue' in f for ch, n in c.items() if ch.isalnum()),
                        'lettersAndDigitsInAnyOtherFont': 0,
                        'charactersNotInComicNeueBoldDrawnByFallbackFont': dict((f, dict(('U+%04X %s' % (ord(ch), ch), n) for ch, n in c.items())) for f, c in fallback.items())})

    # ---- 4. raster at exactly 2560x1440 ----
    png_dir = os.path.join(work, 'png'); os.makedirs(png_dir, exist_ok=True)
    step = -(-PAGES // a.jobs); jobs = [(pdf, os.path.join(png_dir, 's'), i, min(i + step - 1, PAGES)) for i in range(1, PAGES + 1, step)]
    with ProcessPoolExecutor(a.jobs) as ex: list(ex.map(raster_range, jobs))
    pngs = sorted(glob.glob(os.path.join(png_dir, 's-*.png')))
    if len(pngs) != PAGES: sys.exit('expected %d PNGs, found %d' % (PAGES, len(pngs)))

    # ---- 5. lossless WebP with a pixel-exact round trip ----
    with ProcessPoolExecutor(a.jobs) as ex:
        rows = list(ex.map(to_webp, [(n, pngs[n - 1], os.path.join(a.out, 'slide-%02d.webp' % n)) for n in range(1, PAGES + 1)]))
    bad = [r['slide'] for r in rows if not r['pixelExactVsPng'] or (r['width'], r['height']) != (W, H)]
    if bad: sys.exit('lossless round trip or size check failed for slides %s' % bad)

    pv = subprocess.run(['pdftocairo', '-v'], stdout=subprocess.PIPE, stderr=subprocess.STDOUT).stdout.decode('utf8', 'replace').strip().split('\n')[0]
    report = {'deckSha256': deck_sha, 'tools': {'libreoffice': run(['soffice', '--version']).strip().split('\n')[0], 'poppler': pv},
              'settings': {'pdfLosslessCompression': True, 'pdfReduceImageResolution': False, 'rasterWidth': W, 'rasterHeight': H, 'rasterizer': 'pdftocairo (cairo, smooth interpolation)',
                           'webp': 'lossless, method 4, round-tripped and compared pixel by pixel with the PNG'},
              'font': font_report, 'slides': rows, 'totalWebpBytes': sum(r['bytes'] for r in rows)}
    json.dump(report, open(os.path.join(os.path.dirname(os.path.abspath(a.out)), 'render-report.json'), 'w'), indent=1, ensure_ascii=False)
    print('OK  %d slides, %dx%d lossless WebP, all pixel-exact vs PNG, %.1f MB total' % (PAGES, W, H, report['totalWebpBytes'] / 1e6))
    print('    font: Comic Neue Bold == embedded font; %d letters/digits in Comic Neue Bold, 0 in any other font; fallback glyphs: %s' % (
        font_report['lettersAndDigitsInComicNeueBold'], font_report['charactersNotInComicNeueBoldDrawnByFallbackFont']))
    return 0


if __name__ == '__main__':
    sys.exit(main())
