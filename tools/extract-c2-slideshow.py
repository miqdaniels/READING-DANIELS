#!/usr/bin/env python3 -I
"""Reads the approved Check 2 44-sound PowerPoint and writes the sound inventory
(slide order, text, and clickable regions) as JSON. Read-only: never edits the .pptx.
Usage: python3 -I tools/extract-c2-slideshow.py <deck.pptx> <out.json>"""
import sys, re, json, zipfile
from xml.etree import ElementTree as ET
NS={'a':'http://schemas.openxmlformats.org/drawingml/2006/main','p':'http://schemas.openxmlformats.org/presentationml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships','rel':'http://schemas.openxmlformats.org/package/2006/relationships'}
R='{%s}'%NS['r']
z=zipfile.ZipFile(sys.argv[1])
pres=ET.fromstring(z.read('ppt/presentation.xml'))
prels={r.get('Id'):r.get('Target') for r in ET.fromstring(z.read('ppt/_rels/presentation.xml.rels'))}
order=[prels[s.get(R+'id')].split('/')[-1] for s in pres.find('p:sldIdLst',NS)]
sz=pres.find('p:sldSz',NS); W,H=int(sz.get('cx')),int(sz.get('cy'))
def rels(name):
    return {r.get('Id'):r.get('Target') for r in ET.fromstring(z.read('ppt/slides/_rels/'+name+'.rels'))}
def box(sp):
    off=sp.find('.//a:xfrm/a:off',NS); ext=sp.find('.//a:xfrm/a:ext',NS)
    if off is None or ext is None: return None
    return [int(off.get('x'))/W,int(off.get('y'))/H,int(ext.get('cx'))/W,int(ext.get('cy'))/H]
def texts(sp): return ''.join(t.text or '' for t in sp.iter('{%s}t'%NS['a']))
def notes(name,rl):
    for t in rl.values():
        if 'notesSlide' in t:
            n=ET.fromstring(z.read('ppt/notesSlides/'+t.split('/')[-1]))
            return ' '.join(x.text or '' for x in n.iter('{%s}t'%NS['a'])).strip()
    return ''
slides=[]
for idx,name in enumerate(order,1):
    root=ET.fromstring(z.read('ppt/slides/'+name)); rl=rels(name)
    items=[]
    for sp in list(root.iter('{%s}sp'%NS['p']))+list(root.iter('{%s}pic'%NS['p'])):
        nv=sp.find('p:nvSpPr/p:cNvPr',NS)
        if nv is None: nv=sp.find('p:nvPicPr/p:cNvPr',NS)
        hl=None
        for h in sp.iter('{%s}hlinkClick'%NS['a']):
            if h.get('action')=='ppaction://hlinksldjump': hl=order.index(rl[h.get(R+'id')].split('/')[-1])+1; break
        items.append({'name':nv.get('name'),'text':texts(sp),'box':box(sp),'jump':hl})
    slides.append({'index':idx,'file':name,'items':items,'notes':notes(name,rl)})
out={'slideCount':len(slides),'slides':[]}
for s in slides:
    it=s['items']; txt=[i['text'] for i in it if i['text']]
    rec={'index':s['index'],'file':s['file'],'notes':s['notes']}
    if s['index']==1:
        rec['kind']='menu'
        rec['menu']=[{'label':i['text'],'box':i['box'],'jump':i['jump']} for i in it if i['jump'] and i['box']]
    else:
        rec['kind']='sound'
        def after(label):
            for k,t in enumerate(txt):
                if t==label and k+1<len(txt): return txt[k+1]
        rec['category']=txt[txt.index('CHOOSE A SOUND')+1] if 'CHOOSE A SOUND' in txt else txt[2]
        rec['symbol']=txt[3]
        rec['spelling']=after('COMMON SPELLINGS')
        rec['keyword']=after('AS IN')
        rec['cue']=after('TEACHER MOUTH CUE')
        rec['counter']=[t for t in txt if re.match(r'^\d\d / 44$',t)][0]
        def find(label):
            for i in it:
                if i['text']==label and i['box']: return {'box':i['box'],'jump':i['jump']}
        rec['prev']=find('PREVIOUS'); rec['menuBtn']=find('SOUND MENU'); rec['next']=find('NEXT')
        for i in it:
            if i['name'].startswith('Audio icon'): rec['audio']={'box':i['box'],'name':i['name']}
    out['slides'].append(rec)
json.dump(out,open(sys.argv[2],'w',encoding='utf8'),indent=1,ensure_ascii=False)
print('slides:',len(slides))
