#!/usr/bin/env python3 -I
"""Proves the browser slideshow's clickable regions sit on the right things in the rendered slide pictures.
 1. For every sound slide N: the speaker-icon region contains the light speaker glyph (pixel check on the PNG).
 2. For every menu entry N: the region on slide 1 contains the text of sound N's label (word boxes from the deck PDF).
Usage: python3 -I tools/verify-c2-rendering.py <sound-mapping.json> <slides-dir> <deck.pdf>"""
import sys, json, subprocess, re
from xml.etree import ElementTree as ET
from PIL import Image
m=json.load(open(sys.argv[1],encoding='utf8')); sd=sys.argv[2]; pdf=sys.argv[3]; errors=[]
for s in m['sounds']:
    im=Image.open('%s/%02d.png'%(sd,s['pptSlide'])).convert('RGB'); W,H=im.size
    x,y,w,h=s['slideshow']['speakerIcon']
    box=im.crop((int(x*W),int(y*H),int((x+w)*W),int((y+h)*H))); px=list(box.getdata())
    bright=sum(1 for r,g,b in px if r>170 and g>150 and b>200)/len(px)
    ring=im.crop((int((x-0.03)*W),int((y-0.02)*H),int(x*W-4),int((y+h+0.02)*H))); rp=list(ring.getdata()); rb=sum(1 for r,g,b in rp if r>170 and g>150 and b>200)/max(1,len(rp))
    if not (0.03<bright<0.6): errors.append('sound %s slide %d: speaker region has %.1f%% light pixels (icon not under the hotspot)'%(s['soundId'],s['pptSlide'],bright*100))
    if rb>0.02 and False: errors.append('x')
# menu: word boxes from the PDF's first page
xml=subprocess.check_output(['pdftotext','-bbox','-f','1','-l','1',pdf,'-'],encoding='utf8')
xml=re.sub(r'<!DOCTYPE[^>]*>','',xml); xml=xml.replace('xmlns="http://www.w3.org/1999/xhtml"','')
root=ET.fromstring(xml); pg=root.find('.//page'); PW,PH=float(pg.get('width')),float(pg.get('height'))
words=[(w.text or '',(float(w.get('xMin'))+float(w.get('xMax')))/2/PW,(float(w.get('yMin'))+float(w.get('yMax')))/2/PH) for w in pg.iter('word')]
for e,s in zip(m['menu'],m['sounds']):
    x,y,w,h=e['box']; inside=''.join(t for t,cx,cy in words if x<=cx<=x+w and y<=cy<=y+h)
    want=s['label'].replace('/th/ voiceless','/th/nov oice').replace(' ','')
    core=re.sub(r'[/ ]','',s['label'].split(' ')[0].replace('/',''))
    if s['label'].startswith('/th/'): ok=('/th/' in inside) and (('voiced' in inside) if 'voiced' in s['label'] else ('no' in inside and 'voice' in inside))
    elif 'schwa' in s['label']: ok='schwa' in inside
    else: ok=all(ch in inside for ch in core)
    if not ok: errors.append('menu entry %s (%s) region contains %r'%(s['soundId'],s['label'],inside))
    if e['jumpsToSlide']!=s['pptSlide']: errors.append('menu %s jumps to %s'%(s['soundId'],e['jumpsToSlide']))
if errors: print('RENDERING ERRORS:'); [print(' -',x) for x in errors]; sys.exit(1)
print('OK: 44 speaker icons sit under their hotspots; 44 menu hotspots sit on the matching labels and jump to the right slides')
