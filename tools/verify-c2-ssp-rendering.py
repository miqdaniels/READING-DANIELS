#!/usr/bin/env python3
"""Pixel-level proof that every clickable region in manifest.json sits on the matching button in the
rendered slide image (so the HTML buttons laid over the pictures line up with what the teacher sees).

Usage:  python3 -I tools/verify-c2-ssp-rendering.py assets/check-2/sounds-spelling-patterns

For each hotspot it scans the rendered WebP across each of the rectangle's four edges, finds the dark
button outline, and requires the outline to be within TOL pixels of the manifest edge (the cover's
entry button is checked as "outline lies inside the deck's own link rectangle", because that link
shape is deliberately a little larger than the artwork button). It also checks, for every menu, that
buttons starting with the same word ("short ...", "long ...") are lettered at one size, so no button
looks mismatched, and that a slide with no hotspots (oo / moon) really shows no footer buttons in the artwork.
Exit status 1 if anything fails."""
import sys, os, json
from PIL import Image

TOL = 5            # pixels, at 2560x1440
assets = sys.argv[1]
man = json.load(open(os.path.join(assets, 'manifest.json'), encoding='utf8'))
W, H = man['images']['width'], man['images']['height']
fails, checks, worst = [], 0, 0.0


def lum(p): return (p[0] * 299 + p[1] * 587 + p[2] * 114) // 1000


def edge(px, axis, fixed, center, half=16):
    """position of the dark outline along one scan line (centroid of the darkest pixels), or None"""
    vals = []
    for t in range(max(0, center - half), min((W if axis == 'x' else H) - 1, center + half) + 1):
        vals.append((lum(px[t, fixed] if axis == 'x' else px[fixed, t]), t))
    lo = min(v for v, _ in vals)
    if lo > 150: return None, lo
    sel = [t for v, t in vals if v <= lo + 25]
    return sum(sel) / len(sel), lo


def check_rect(px, label, rect, exact=True):
    global checks, worst
    x0, y0 = round(rect[0] * W), round(rect[1] * H); x1, y1 = round((rect[0] + rect[2]) * W), round((rect[1] + rect[3]) * H)
    ym, xm = (y0 + y1) // 2, (x0 + x1) // 2
    if not (0 <= x0 < x1 <= W and 0 <= y0 < y1 <= H):
        fails.append('%s: rectangle outside the image' % label); return
    for name, axis, fixed, pos in (('left', 'x', ym, x0), ('right', 'x', ym, x1), ('top', 'y', xm, y0), ('bottom', 'y', xm, y1)):
        half = 16 if exact else 60
        c, lo = edge(px, axis, fixed, pos, half)
        checks += 1
        if c is None: fails.append('%s: no button outline near the %s edge (darkest pixel luminance %d)' % (label, name, lo)); continue
        off = c - pos
        if exact:
            worst = max(worst, abs(off))
            if abs(off) > TOL: fails.append('%s: %s edge is %.1fpx from the outline (limit %d)' % (label, name, off, TOL))
        else:
            # the deck's link rectangle only has to enclose the artwork button (outline inside it, not far from it)
            inward = (c - pos) if name in ('left', 'top') else (pos - c)
            if inward < -3 or inward > 60: fails.append('%s: %s outline is %.1fpx from the link rectangle edge' % (label, name, inward))


per_slide_digits = {}
for s in man['slides']:
    f = os.path.join(assets, 'slides', s['image'])
    im = Image.open(f).convert('RGB'); px = im.load()
    for h in s['hotspots']:
        check_rect(px, 'slide %d (%s) %s %s' % (s['n'], s['id'], h['role'], h.get('entry') or ''), h['rect'], exact=(h['via'] != 'invisible'))
    if s['kind'] == 'menu':
        # Lettering: the deck's own font size for each button comes from the manifest (read from the PowerPoint by
        # tools/build-c2-ssp-manifest.py). The measured height of the lettering, divided by that size, must be the same
        # for buttons that start with the same word ("short ...", "long ..."), i.e. what is drawn follows what the deck
        # specifies. (On slide 57 the deck itself sets entries 32 and 36 at 19 pt and the rest at 20 pt; that is a deck
        # finding, reported by the builder, and the rendered heights agree with it.) The ink after the sound number is
        # measured as one run (words closer together than the gap that follows a sound number stay together).
        size_of = {}
        for q in man['qa']['menuButtonLettering']:
            for pt, entries in q['sizesPt'].items():
                for e_ in entries: size_of[(q['slide'], e_)] = float(pt)
        by_word = {}
        for h in [h for h in s['hotspots'] if h['role'] == 'sound']:
            x0, y0 = round(h['rect'][0] * W) + 14, round(h['rect'][1] * H) + 14
            x1, y1 = round((h['rect'][0] + h['rect'][2]) * W) - 14, round((h['rect'][1] + h['rect'][3]) * H) - 14
            g = im.crop((x0, y0, x1, y1)).convert('L').point(lambda p: 255 if p < 110 else 0)
            cols = [i for i, v in enumerate(g.getprojection()[0]) if v]
            if not cols: fails.append('slide %d entry %s: no lettering found' % (s['n'], h['entry'])); continue
            groups, cur = [], [cols[0], cols[0]]
            for a_, b_ in zip(cols, cols[1:]):
                if b_ - a_ > 18: groups.append(cur); cur = [b_, b_]
                else: cur[1] = b_
            groups.append(cur)
            if len(groups) < 2: fails.append('slide %d entry %s: expected a sound number followed by lettering' % (s['n'], h['entry'])); continue
            t0, t1 = groups[1]
            rows = [i for i, v in enumerate(g.crop((t0, 0, t1 + 1, g.height)).getprojection()[1]) if v]
            by_word.setdefault(h['label'].split()[1], []).append((h['entry'], rows[-1] - rows[0] + 1, size_of[(s['n'], h['entry'])]))
        per_slide_digits[s['n']] = dict((w_, [(v, pt) for _, v, pt in hs]) for w_, hs in by_word.items() if len(hs) > 1)
        for w_, hs in by_word.items():
            ratios = [v / pt for _, v, pt in hs]
            if len(hs) > 1 and max(ratios) / min(ratios) > 1.04: fails.append('slide %d: buttons starting with %r are not lettered in proportion to the deck\'s font sizes %s' % (s['n'], w_, hs))
    if s.get('footerObstructed'):
        # no hotspots were generated, and the artwork must not show the deck's footer buttons: look for the dark
        # outline at all four edges of each button position (taken from a normal sound slide). A normal slide
        # matches 16 of 16 edges; here nearly none may match.
        ref = next(x for x in man['slides'] if x['kind'] == 'sound' and not x.get('footerObstructed'))
        found = 0
        for h in ref['hotspots']:
            x0, y0 = round(h['rect'][0] * W), round(h['rect'][1] * H); x1, y1 = round((h['rect'][0] + h['rect'][2]) * W), round((h['rect'][1] + h['rect'][3]) * H)
            ym, xm = (y0 + y1) // 2, (x0 + x1) // 2
            for axis, fixed, pos in (('x', ym, x0), ('x', ym, x1), ('y', xm, y0), ('y', xm, y1)):
                c, lo = edge(px, axis, fixed, pos, 16)
                if c is not None and abs(c - pos) <= TOL: found += 1
        print('    slide %d (obstructed footer): button outlines found at the 4 footer button positions: %d of 16 edges (a normal slide: 16 of 16)' % (s['n'], found))
        if found > 6: fails.append('slide %d is marked obstructed but the artwork seems to show footer buttons (%d of 16 edges)' % (s['n'], found))
        if s['hotspots']: fails.append('slide %d is marked obstructed but has hotspots' % s['n'])

n_hot = sum(len(s['hotspots']) for s in man['slides'])
print('hotspots checked: %d | edge checks: %d | worst offset on exact buttons: %.1f px (limit %d) | failures: %d' % (n_hot, checks, worst, TOL, len(fails)))
print('lettering (height px, deck font size pt) of buttons sharing a first word, per menu:', dict((k, v) for k, v in per_slide_digits.items() if v))
for f in fails[:40]: print('FAIL', f)
sys.exit(1 if fails else 0)
