#!/usr/bin/env python3
"""Builds the navigation manifest for Check 2 > "Sounds & Spelling Patterns" DIRECTLY from the approved
PowerPoint (presentation order + hyperlink relationships). It never edits the .pptx and never infers
order from file names (physical slide order and slideN.xml numbers differ in this deck).

Usage:  python3 -I tools/build-c2-ssp-manifest.py <deck.pptx> <asset-dir> [--expect-sha256 HEX]

  <asset-dir>   assets/check-2/sounds-spelling-patterns   (must already hold slides/slide-NN.webp)
Writes  <asset-dir>/manifest.json  (canonical, human-readable)
        <asset-dir>/manifest.js    (same data as window.RF_C2_SSP, loaded on demand; works from file://)

The build STOPS (exit 1) if the deck is not the structure the work order describes: 60 slides, 51
instructional slides in 7 categories (18/8/5/7/3/6/4), every sound reached from its category menu,
exact menu labels, 16:9 images at one size. Findings that are about the deck itself (not about this
tool) are recorded under "qa" and are never "fixed" here: the approved artwork stays as supplied.
Needs Pillow (to read image sizes / opacity)."""
import sys, os, io, re, json, hashlib, zipfile, posixpath, argparse, collections
import xml.etree.ElementTree as ET
from PIL import Image

NS = {'p': 'http://schemas.openxmlformats.org/presentationml/2006/main',
      'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
      'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
      'rel': 'http://schemas.openxmlformats.org/package/2006/relationships'}
P, A, R = '{%s}' % NS['p'], '{%s}' % NS['a'], '{%s}' % NS['r']

# The seven categories exactly as the work order lists them: (key, heading as printed on the deck's
# menu slide, display title, number of sound slides). A different deck must fail loudly, not be adapted.
EXPECTED = [
    ('consonants',   'CONSONANTS',                                   'Consonants',                                 18),
    ('digraphs',     'CONSONANT DIGRAPHS & ALTERNATIVE SPELLINGS',   'Consonant Digraphs & Alternative Spellings',  8),
    ('short-vowels', 'SHORT VOWELS',                                 'Short Vowels',                                5),
    ('long-vowels',  'LONG VOWELS & VOWEL TEAMS',                    'Long Vowels & Vowel Teams',                   7),
    ('diphthongs',   'DIPHTHONGS',                                   'Diphthongs',                                  3),
    ('r-controlled', 'R-CONTROLLED VOWELS',                          'R-Controlled Vowels',                         6),
    ('other-vowels', 'OTHER VOWEL SOUNDS & PATTERNS',                'Other Vowel Sounds & Patterns',               4)]
# What the category button printed in a sound slide's footer should say for each category.
PRINTED_OK = {'consonants': {'CONSONANTS'}, 'digraphs': {'DIGRAPHS'}, 'short-vowels': {'SHORT VOWELS'},
              'long-vowels': {'LONG VOWELS'}, 'diphthongs': {'DIPHTHONGS'}, 'r-controlled': {'R-CONTROLLED VOWELS', 'R-CONTROLLED'},
              'other-vowels': {'OTHER VOWEL SOUNDS'}}
ROLE_LABEL = {'previous': 'Previous', 'next': 'Next', 'home': 'Home', 'all-categories': 'All Categories', 'sound-list': 'Sound List'}
IMG_W, IMG_H = 2560, 1440
TOTAL, INSTRUCTIONAL = 60, 51
errors = []


def err(m): errors.append(m)


def norm(s): return ' '.join((s or '').split())


def rels_of(z, part):
    d, b = posixpath.split(part)
    rp = posixpath.join(d, '_rels', b + '.rels')
    out = {}
    if rp in z.namelist():
        for e in ET.fromstring(z.read(rp)).findall('rel:Relationship', NS):
            t = e.get('Target')
            if e.get('TargetMode') != 'External':
                t = posixpath.normpath(posixpath.join(d, t))
            out[e.get('Id')] = {'type': e.get('Type').rsplit('/', 1)[-1], 'target': t}
    return out


def read_slide(z, part, W, H):
    """Shapes of one slide in stacking order (document order = back to front)."""
    rels = rels_of(z, part)
    tree = ET.fromstring(z.read(part)).find('p:cSld/p:spTree', NS)
    if tree.find('.//p:grpSp', NS) is not None:
        err('%s contains a group shape; hotspot geometry for groups is not supported' % part)
    shapes = []
    for z_idx, el in enumerate([e for e in tree if e.tag in (P + 'sp', P + 'pic')]):
        nv = el.find('.//p:cNvPr', NS)
        xf = el.find('p:spPr/a:xfrm', NS)
        if xf is not None and (xf.get('rot') or xf.get('flipH') or xf.get('flipV')):
            err('%s shape %s is rotated/flipped; not supported' % (part, nv.get('id')))
        sh = {'z': z_idx, 'kind': 'pic' if el.tag == P + 'pic' else 'sp', 'id': nv.get('id'), 'name': nv.get('name') or '',
              'hidden': nv.get('hidden') in ('1', 'true'), 'rect': None, 'text': '', 'targets': [], 'embed': None, 'style': None}
        if xf is not None and xf.find('a:off', NS) is not None:
            o, e = xf.find('a:off', NS), xf.find('a:ext', NS)
            sh['rect'] = (int(o.get('x')) / W, int(o.get('y')) / H, int(e.get('cx')) / W, int(e.get('cy')) / H)
        for h in el.iter(A + 'hlinkClick'):
            rid, act = h.get(R + 'id'), h.get('action') or ''
            if act.endswith('hlinksldjump') and rid in rels and rels[rid]['type'] == 'slide':
                sh['targets'].append(rels[rid]['target'])
            else:
                err('%s shape %s has an unsupported hyperlink (action=%r)' % (part, nv.get('id'), act))
        if el.tag == P + 'sp':
            sh['text'] = norm(' '.join(''.join(t.text or '' for t in p.iter(A + 't')) for p in el.iter(A + 'p')))
            r = el.find('.//a:r/a:rPr', NS)
            if r is not None:
                c = r.find('a:solidFill/a:srgbClr', NS); lat = r.find('a:latin', NS)
                sh['style'] = {'sz': r.get('sz'), 'b': r.get('b'), 'color': c.get('val') if c is not None else None, 'typeface': lat.get('typeface') if lat is not None else None}
        else:
            bl = el.find('p:blipFill/a:blip', NS)
            sh['embed'] = rels[bl.get(R + 'embed')]['target'] if bl is not None and bl.get(R + 'embed') in rels else None
        shapes.append(sh)
    return shapes


def rect5(r): return [round(v, 5) for v in r]


def overlap(a, b):
    """fraction of rectangle a that rectangle b covers"""
    x0, y0 = max(a[0], b[0]), max(a[1], b[1])
    x1, y1 = min(a[0] + a[2], b[0] + b[2]), min(a[1] + a[3], b[1] + b[3])
    return 0.0 if x1 <= x0 or y1 <= y0 else ((x1 - x0) * (y1 - y0)) / (a[2] * a[3])


def blocker_of(sh, pics, overlays):
    """A picture stacked above this link shape that covers it, unless a link to the same place sits
    above that picture (the deck's own 'INVISIBLE NAVIGATION LINK' overlays). None if reachable."""
    for pc in pics:
        if pc['z'] > sh['z'] and pc['rect'] and overlap(sh['rect'], pc['rect']) >= 0.6:
            if not any(o['z'] > pc['z'] and o['targets'] == sh['targets'] and overlap(sh['rect'], o['rect']) >= 0.6 for o in overlays):
                return pc
    return None


def opaque(z, pic):
    with Image.open(io.BytesIO(z.read(pic['embed']))) as im:
        return im.mode in ('RGB', 'L') or ('A' in im.getbands() and im.getchannel('A').getextrema()[0] == 255)


def simple(v): return not isinstance(v, (dict, list)) or (isinstance(v, list) and all(not isinstance(x, (dict, list)) for x in v))


def pretty(o, level=0):
    """JSON with every control / hotspot on its own line (readable diffs); leaf records stay inline."""
    if isinstance(o, dict):
        if level >= 1 and all(simple(v) for v in o.values()):
            return json.dumps(o, ensure_ascii=False)
        pad = ' ' * (level + 1)
        return '{\n' + ',\n'.join('%s%s: %s' % (pad, json.dumps(k, ensure_ascii=False), pretty(v, level + 1)) for k, v in o.items()) + '\n' + ' ' * level + '}'
    if isinstance(o, list):
        if all(not isinstance(x, (dict, list)) for x in o):
            return json.dumps(o, ensure_ascii=False)
        pad = ' ' * (level + 1)
        return '[\n' + ',\n'.join(pad + pretty(x, level + 1) for x in o) + '\n' + ' ' * level + ']'
    return json.dumps(o, ensure_ascii=False)


def finish():
    for e in errors:
        print('ERROR:', e, file=sys.stderr)
    return 1


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('deck'); ap.add_argument('assets'); ap.add_argument('--expect-sha256')
    args = ap.parse_args()
    deck_bytes = open(args.deck, 'rb').read()
    sha = hashlib.sha256(deck_bytes).hexdigest()
    if args.expect_sha256 and sha != args.expect_sha256.lower():
        sys.exit('deck SHA-256 %s does not match expected %s' % (sha, args.expect_sha256))
    z = zipfile.ZipFile(io.BytesIO(deck_bytes))
    if z.testzip() is not None:
        sys.exit('deck zip integrity check failed')

    # ---- presentation order: from presentation.xml, never from file names ----
    pres = ET.fromstring(z.read('ppt/presentation.xml')); prels = rels_of(z, 'ppt/presentation.xml')
    sz = pres.find('p:sldSz', NS); W, H = int(sz.get('cx')), int(sz.get('cy'))
    if W * 9 != H * 16: err('slide size %dx%d EMU is not 16:9' % (W, H))
    parts = [prels[s.get(R + 'id')]['target'] for s in pres.find('p:sldIdLst', NS).findall('p:sldId', NS)]
    if len(parts) != TOTAL: err('deck has %d slides, expected %d' % (len(parts), TOTAL))
    pos_of = {p: i + 1 for i, p in enumerate(parts)}
    slides = {i + 1: read_slide(z, p, W, H) for i, p in enumerate(parts)}
    for p in parts:
        if re.search(rb'<p:sld [^>]*show="0"', z.read(p)): err('%s is a hidden slide' % p)
    if errors: return finish()

    def dest_of(sh):
        t = sh['targets'][0]
        if t not in pos_of: err('link on shape %s points outside the presentation' % sh['id']); return 1
        return pos_of[t]

    # ---- classify from the link graph (cover -> main menu -> category menus -> sounds) ----
    cover = 1
    cover_links = [sh for sh in slides[cover] if sh['targets']]
    if len(cover_links) != 1: err('cover must have exactly one link (found %d)' % len(cover_links))
    main_menu = dest_of(cover_links[0]) if cover_links else 2
    cat_buttons = [sh for sh in slides[main_menu] if sh['name'].startswith('LINK BUTTON:') and 'SOUND SLIDES' in sh['text']]
    if len(cat_buttons) != 7: err('main menu has %d category buttons, expected 7' % len(cat_buttons))
    if errors: return finish()
    cat_menu_pos = [dest_of(sh) for sh in cat_buttons]

    cats, sound_info = [], {}
    for ci, mp in enumerate(cat_menu_pos):
        heads = [sh for sh in slides[mp] if sh['name'].startswith('HEADING / INSTRUCTION:')]
        deck_heading = heads[0]['text'] if heads else ''
        exp = next((e for e in EXPECTED if e[1] == deck_heading), None)
        if not exp:
            err('menu slide %d heading %r is not one of the 7 expected categories' % (mp, deck_heading)); continue
        key, _, title, count = exp
        if ci != EXPECTED.index(exp): err('category %r is not in the expected order' % key)
        m = re.match(r'^(\d+) SOUND & SPELLING-PATTERN SLIDES$', heads[1]['text']) if len(heads) > 1 else None
        if not m or int(m.group(1)) != count: err('menu %r count line is %r, expected %d' % (key, heads[1]['text'] if len(heads) > 1 else None, count))
        entries = []
        for sh in slides[mp]:
            mm = re.match(r'^LINK BUTTON: (\d\d)\s', sh['name'])
            if mm:
                if len(sh['targets']) != 1: err('menu %r entry %s has %d links' % (key, mm.group(1), len(sh['targets']))); continue
                entries.append((int(mm.group(1)), sh))
        if len(entries) != count: err('menu %r has %d entries, expected %d' % (key, len(entries), count))
        cats.append({'key': key, 'title': title, 'deckHeading': deck_heading, 'menuPos': mp, 'count': count, 'entries': entries})
        for num, sh in entries:
            sp = dest_of(sh)
            if sp in sound_info: err('slide %d is the target of two menu entries' % sp)
            parts_ = [x.strip() for x in norm(re.sub(r'^\d\d\s*', '', sh['text'])).split('·')]
            if len(parts_) < 2 or not all(parts_): err('entry %02d text %r cannot be read' % (num, sh['text']))
            sound_info[sp] = {'entry': num, 'cat': key, 'menuText': sh['text'], 'parts': parts_}
    if sorted(v['entry'] for v in sound_info.values()) != list(range(1, INSTRUCTIONAL + 1)): err('sound entry numbers are not exactly 01..%d' % INSTRUCTIONAL)
    if len(sound_info) != INSTRUCTIONAL: err('%d sound slides found, expected %d' % (len(sound_info), INSTRUCTIONAL))
    nav_pos = {cover, main_menu} | set(cat_menu_pos)
    if set(sound_info) & nav_pos: err('a slide is both a sound slide and a navigation slide')
    bad = [n for n in range(1, TOTAL + 1) if n not in sound_info and n not in nav_pos]
    if bad: err('slides not reachable from the menus: %s' % bad)
    if errors: return finish()

    ids = {cover: 'cover', main_menu: 'menu-main'}
    for c in cats: ids[c['menuPos']] = 'menu-' + c['key']
    for n, v in sound_info.items(): ids[n] = 'sound-%02d' % v['entry']
    cat_title = {c['key']: c['title'] for c in cats}
    cat_pos = {c['key']: c['menuPos'] for c in cats}
    cat_order = [c['menuPos'] for c in cats]
    seq = {c['key']: sorted(p for p, v in sound_info.items() if v['cat'] == c['key']) for c in cats}
    for key, lst in seq.items():
        if lst != list(range(lst[0], lst[0] + len(lst))): err('category %r sound slides are not consecutive physical slides: %s' % (key, lst))

    def spoken(p):
        if len(p) == 2: return '%s as in %s' % (p[0], p[1])
        if len(p) == 3: return '%s, spelled %s, as in %s' % (p[0], p[1], p[2])
        return ', '.join(p)

    titles = {cover: 'Cover', main_menu: 'Choose a sound category'}
    for c in cats: titles[c['menuPos']] = c['title'] + ' menu'
    for n, v in sound_info.items(): titles[n] = 'Sound %d: %s' % (v['entry'], spoken(v['parts']))

    def role_of(text, is_sound):
        t = norm(re.sub('[←→⌂]', '', text)).upper()      # drop the printed arrows / house symbol
        for role, word in (('previous', 'PREVIOUS'), ('next', 'NEXT'), ('home', 'HOME'), ('all-categories', 'ALL CATEGORIES'), ('sound-list', 'SOUND LIST')):
            if t == word: return role
        return 'category' if is_sound else None

    def control(role, to_pos, cat_key=None):
        if role == 'category': label, aria = 'Category Menu', 'Category menu: %s' % cat_title[cat_key]
        else: label = ROLE_LABEL[role]; aria = '%s: %s' % (label, titles[to_pos])
        return {'role': role, 'label': label, 'aria': aria, 'to': ids[to_pos], 'slide': to_pos}

    qa = {'unusedMedia': [], 'layeredPictures': [], 'obstructedFooters': [], 'printedCategoryLabelMismatches': [],
          'footerStyleOutliers': [], 'linkDeviations': [], 'menuButtonLettering': []}
    out, cat_styles = [], {}
    for n in range(1, TOTAL + 1):
        shapes, sid = slides[n], ids[n]
        kind = 'cover' if n == cover else 'main' if n == main_menu else 'menu' if n in cat_menu_pos else 'sound'
        rec = {'n': n, 'id': sid, 'kind': {'main': 'main-menu'}.get(kind, kind), 'title': titles[n], 'image': 'slide-%02d.webp' % n,
               'deckPart': posixpath.basename(parts[n - 1]), 'alt': 'Slide %d of %d. %s.' % (n, TOTAL, titles[n]), 'controls': [], 'hotspots': []}
        visible = [sh for sh in shapes if sh['targets'] and not sh['name'].startswith('INVISIBLE') and not sh['hidden']]
        overlays = [sh for sh in shapes if sh['targets'] and sh['name'].startswith('INVISIBLE') and not sh['hidden']]
        pics = [sh for sh in shapes if sh['kind'] == 'pic']

        if kind == 'sound':
            v = sound_info[n]; cat = v['cat']; lst = seq[cat]; i = lst.index(n)
            rec.update({'category': cat, 'categoryTitle': cat_title[cat], 'entry': v['entry'], 'symbol': v['parts'][0], 'word': v['parts'][-1],
                        'menuText': v['menuText'], 'indexInCategory': i + 1, 'categoryCount': len(lst)})
            foot = sorted([sh for sh in visible if role_of(sh['text'], True)], key=lambda s: s['rect'][0])
            roles = collections.OrderedDict((role_of(sh['text'], True), sh) for sh in foot)
            if list(roles) != ['previous', 'category', 'home', 'next']: err('slide %d footer roles %s' % (n, list(roles))); continue
            want = {'previous': lst[i - 1] if i > 0 else cat_pos[cat], 'category': cat_pos[cat], 'home': main_menu,
                    'next': lst[i + 1] if i < len(lst) - 1 else cat_pos[cat]}
            blocked = []
            for role, sh in roles.items():
                dest = dest_of(sh)
                if dest != want[role]: qa['linkDeviations'].append({'slide': n, 'role': role, 'deck': dest, 'expected': want[role]})
                ov = [o for o in overlays if o['rect'] == sh['rect']]
                if ov and dest_of(ov[0]) != dest: qa['linkDeviations'].append({'slide': n, 'role': role, 'overlayDisagrees': True})
                ctl = control(role, dest, cat); rec['controls'].append(ctl)
                if blocker_of(sh, pics, overlays) is None:
                    rec['hotspots'].append(dict(ctl, rect=rect5(sh['rect']), via='visible+invisible' if ov else 'visible'))
                else:
                    blocked.append(role)
            if blocked:
                top = max((pc for pc in pics if pc['rect'] and pc['rect'][3] > 0.95), key=lambda s: s['z'])
                rec['footerObstructed'] = True
                qa['obstructedFooters'].append({'slide': n, 'id': sid, 'buttons': blocked, 'coveredBy': top['name'], 'pictureIsFullyOpaque': opaque(z, top),
                                                'effect': "the artwork picture is stacked above the deck's own Previous / category / Home / Next buttons and no link sits above it, so those buttons are neither visible nor clickable on the slide itself"})
            printed = roles['category']['text']
            if printed not in PRINTED_OK[cat]:
                qa['printedCategoryLabelMismatches'].append({'slide': n, 'id': sid, 'printedLabel': printed, 'category': cat, 'categoryTitle': cat_title[cat],
                                                             'buttonLinksTo': ids[dest_of(roles['category'])]})
            cat_styles[n] = (cat, roles['category']['style'])
        elif kind == 'cover':
            sh = (overlays or visible)[0]
            ctl = {'role': 'enter', 'label': 'Explore the Sounds', 'aria': 'Explore the sounds: %s' % titles[main_menu], 'to': ids[main_menu], 'slide': main_menu}
            rec['controls'].append(ctl); rec['hotspots'].append(dict(ctl, rect=rect5(sh['rect']), via='invisible'))
        else:
            foot = sorted([sh for sh in visible if role_of(sh['text'], False)], key=lambda s: s['rect'][0])
            roles = collections.OrderedDict((role_of(sh['text'], False), sh) for sh in foot)
            need = ['previous', 'home', 'sound-list', 'next'] if kind == 'main' else ['previous', 'home', 'all-categories', 'next']
            if list(roles) != need or len(foot) != 4: err('slide %d footer roles %s' % (n, list(roles))); continue
            if kind == 'menu':
                k = cat_order.index(n)
                want = {'previous': main_menu if k == 0 else cat_order[k - 1], 'home': main_menu, 'all-categories': main_menu,
                        'next': main_menu if k == len(cat_order) - 1 else cat_order[k + 1]}
            else:
                want = {'previous': cover, 'home': cover, 'sound-list': cat_order[0], 'next': cat_order[0]}
            for role, sh in roles.items():
                dest = dest_of(sh)
                if dest != want[role]: qa['linkDeviations'].append({'slide': n, 'role': role, 'deck': dest, 'expected': want[role]})
                if blocker_of(sh, pics, overlays) is not None: err('slide %d: %s button is covered by a picture' % (n, role))
                ctl = control(role, dest); rec['controls'].append(ctl); rec['hotspots'].append(dict(ctl, rect=rect5(sh['rect']), via='visible'))
            if kind == 'menu':
                c = next(c for c in cats if c['menuPos'] == n)
                rec.update({'category': c['key'], 'categoryTitle': c['title'], 'count': c['count'], 'firstSlide': seq[c['key']][0], 'lastSlide': seq[c['key']][-1]})
                for num, sh in c['entries']:
                    dest = dest_of(sh); v = sound_info[dest]
                    rec['hotspots'].append({'role': 'sound', 'label': v['menuText'], 'aria': 'Open sound %d: %s' % (num, spoken(v['parts'])), 'to': ids[dest],
                                            'slide': dest, 'entry': num, 'rect': rect5(sh['rect']), 'via': 'visible'})
            else:
                rec['count'] = len(cats)
                for sh, c in zip(cat_buttons, cats):
                    rec['hotspots'].append({'role': 'category', 'label': c['title'], 'aria': 'Open the %s menu (%d sounds)' % (c['title'], c['count']), 'to': 'menu-' + c['key'],
                                            'slide': c['menuPos'], 'rect': rect5(sh['rect']), 'via': 'visible'})
        if len(pics) > 1:      # stacked pictures: the picture on top is what PowerPoint shows; the rest are hidden beneath it
            top = pics[-1]
            same = all(p_['rect'] and all(abs(a - b) < 0.002 for a, b in zip(p_['rect'], top['rect'])) for p_ in pics)
            qa['layeredPictures'].append({'slide': n, 'id': sid, 'pictures': [posixpath.basename(p_['embed']) for p_ in pics], 'visibleTop': posixpath.basename(top['embed']),
                                          'hiddenUnderneath': [posixpath.basename(p_['embed']) for p_ in pics[:-1]], 'allSameFrame': same, 'topIsFullyOpaque': opaque(z, top)})
            if not (same and opaque(z, top)): err('slide %d: stacked pictures are not a clean opaque stack, so a render would blend them' % n)
        out.append(rec)
    if errors: return finish()

    # deck QA: every category button should share one text size/colour; report the outliers, never fix them
    sig = lambda s: json.dumps(s, sort_keys=True)
    majority = collections.Counter(sig(s) for _, s in cat_styles.values()).most_common(1)[0][0]
    odd = collections.OrderedDict()
    for n, (cat, s) in sorted(cat_styles.items()):
        if sig(s) != majority: odd.setdefault((cat, sig(s)), []).append(n)
    for (cat, s), ns in odd.items():
        qa['footerStyleOutliers'].append({'category': cat, 'slides': ns, 'categoryButtonTextStyle': json.loads(s), 'styleOnMostSlides': json.loads(majority),
                                          'note': 'no explicit text colour in the file (inherits a light default) and a different size, so the label renders pale on a pale button'})
    used = {sh['embed'] for n in slides for sh in slides[n] if sh['embed']}
    qa['unusedMedia'] = sorted(m for m in z.namelist() if m.startswith('ppt/media/') and m not in used)

    # menu buttons: record the deck's OWN lettering settings for every menu button (the source-level truth about
    # "consistent lettering"; pixel measurements only confirm it). The work order requires the five short-vowel
    # buttons to match, so that is asserted; any other difference is reported as found, never edited.
    for c in cats:
        by_sz = collections.OrderedDict()
        for num, sh in c['entries']: by_sz.setdefault(sh['style']['sz'], []).append(num)
        rest = collections.Counter(json.dumps(dict((k, v) for k, v in sh['style'].items() if k != 'sz'), sort_keys=True) for _, sh in c['entries'])
        rec_ = {'slide': c['menuPos'], 'id': ids[c['menuPos']], 'buttons': len(c['entries']), 'sizesPt': dict((str(int(k) / 100.0), v) for k, v in by_sz.items()),
                'identicalLettering': len(by_sz) == 1 and len(rest) == 1, 'otherSettings': json.loads(rest.most_common(1)[0][0])}
        qa['menuButtonLettering'].append(rec_)
        if c['key'] == 'short-vowels' and not rec_['identicalLettering']:
            err('short-vowel menu (slide %d): its five sound buttons are not lettered identically in the deck' % c['menuPos'])
    qa['mainMenuCategoryTitleSizesPt'] = dict((c['title'], int(sh['style']['sz']) / 100.0) for sh, c in zip(cat_buttons, cats))

    # ---- rendered images: all present, one size, 16:9 ----
    sizes = []
    for n in range(1, TOTAL + 1):
        f = os.path.join(args.assets, 'slides', 'slide-%02d.webp' % n)
        if not os.path.exists(f): err('missing image %s' % f); continue
        with Image.open(f) as im:
            if (im.width, im.height) != (IMG_W, IMG_H): err('%s is %dx%d, expected %dx%d' % (f, im.width, im.height, IMG_W, IMG_H))
        sizes.append(os.path.getsize(f))
    counts = {c['key']: len(seq[c['key']]) for c in cats}
    for key, _, _, want in EXPECTED:
        if counts.get(key) != want: err('category %s has %s slides, expected %d' % (key, counts.get(key), want))
    if sum(counts.values()) != INSTRUCTIONAL: err('instructional slides = %d' % sum(counts.values()))
    if errors: return finish()

    man = collections.OrderedDict()
    man['schema'] = 1
    man['title'] = 'Sounds & Spelling Patterns'
    man['source'] = {'filename': 'Reading_Foundations_Original_v6.pptx', 'sha256': sha, 'bytes': len(deck_bytes), 'slides': TOTAL, 'slideWidthEmu': W, 'slideHeightEmu': H,
                     'note': 'The source deck (66.5 MB) is not stored in the repository; this block identifies it. Order and links below were read from its presentation.xml and slide relationships.'}
    man['images'] = {'dir': 'slides', 'pattern': 'slide-NN.webp', 'format': 'WebP, lossless', 'width': IMG_W, 'height': IMG_H, 'aspect': '16:9', 'totalBytes': sum(sizes)}
    man['counts'] = {'slides': TOTAL, 'instructional': INSTRUCTIONAL, 'navigation': TOTAL - INSTRUCTIONAL, 'categories': counts}
    man['categories'] = [{'key': c['key'], 'title': c['title'], 'deckHeading': c['deckHeading'], 'menu': ids[c['menuPos']], 'menuSlide': c['menuPos'], 'count': len(seq[c['key']]),
                          'firstSlide': seq[c['key']][0], 'lastSlide': seq[c['key']][-1], 'entries': ['sound-%02d' % num for num, _ in c['entries']]} for c in cats]
    man['slides'] = out
    man['qa'] = qa
    open(os.path.join(args.assets, 'manifest.json'), 'w', encoding='utf8').write(pretty(man) + '\n')
    open(os.path.join(args.assets, 'manifest.js'), 'w', encoding='utf8').write(
        '/* Generated by tools/build-c2-ssp-manifest.py from manifest.json -- do not edit by hand. */\nwindow.RF_C2_SSP=' + json.dumps(man, ensure_ascii=False, separators=(',', ':')) + ';\n')
    print('OK  deck sha256 %s' % sha)
    print('    slides %d | instructional %d | navigation %d | categories %s' % (TOTAL, INSTRUCTIONAL, TOTAL - INSTRUCTIONAL, counts))
    print('    controls %d | hotspots %d' % (sum(len(s['controls']) for s in out), sum(len(s['hotspots']) for s in out)))
    print('    menu button lettering: %s' % '; '.join('slide %d %s' % (q['slide'], 'identical' if q['identicalLettering'] else 'sizes %s' % q['sizesPt']) for q in qa['menuButtonLettering']))
    print('    qa: obstructed footers on slides %s | printed-label mismatches %d | footer style outliers %s | stacked pictures on slides %s | link deviations %d | unused media %s' % (
        [o['slide'] for o in qa['obstructedFooters']], len(qa['printedCategoryLabelMismatches']), [o['slides'] for o in qa['footerStyleOutliers']],
        [o['slide'] for o in qa['layeredPictures']], len(qa['linkDeviations']), qa['unusedMedia']))
    return 0


if __name__ == '__main__':
    sys.exit(main())
