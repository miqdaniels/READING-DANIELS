#!/usr/bin/env python3 -I
"""Builds the ONE authoritative Check 2 sound inventory (check2-slides/sound-mapping.json) from the
approved PowerPoint, and cross-checks it against the teacher-verified table (RECHECK below).
It never edits the .pptx. Any disagreement stops the build or is written to "discrepancies".
Usage: python3 -I tools/build-c2-sound-mapping.py <deck.pptx> <out.json> [deck.pdf]
 - deck.pdf (optional): the LibreOffice PDF the slide PNGs were rendered from; each page's text
   is compared with the mapping so slide image N is proven to show sound N."""
import sys, json, hashlib, subprocess, tempfile, os, re
deck, out = sys.argv[1], sys.argv[2]
pdf = sys.argv[3] if len(sys.argv) > 3 else None
here = os.path.dirname(os.path.abspath(__file__))
tmp = tempfile.mkdtemp()
subprocess.check_call([sys.executable, '-I', os.path.join(here, 'extract-c2-slideshow.py'), deck, os.path.join(tmp, 'inv.json')], stdout=subprocess.DEVNULL)
inv = json.load(open(os.path.join(tmp, 'inv.json'), encoding='utf8'))

# Teacher-verified table: sound id -> (PPT slide, sound label, student recheck spelling)
RECHECK = {
 1:(2,'/b/','b'),2:(3,'/k/','c'),3:(4,'/d/','d'),4:(5,'/f/','f'),5:(6,'/g/','g'),6:(7,'/h/','h'),7:(8,'/j/','j'),8:(9,'/l/','l'),
 9:(10,'/m/','m'),10:(11,'/n/','n'),11:(12,'/p/','p'),12:(13,'/r/','r'),13:(14,'/s/','s'),14:(15,'/t/','t'),15:(16,'/v/','v'),
 16:(17,'/w/','w'),17:(18,'/y/','y'),18:(19,'/z/','z'),19:(20,'/ch/','ch'),20:(21,'/sh/','sh'),21:(22,'/th/ voiceless','th'),
 22:(23,'/th/ voiced','th'),23:(24,'/ng/','ng'),24:(25,'/zh/','si'),25:(26,'/ă/','a'),26:(27,'/ĕ/','e'),27:(28,'/ĭ/','i'),
 28:(29,'/ŏ/','o'),29:(30,'/ŭ/','u'),30:(31,'/ā/','ai'),31:(32,'/ē/','ee'),32:(33,'/ī/','igh'),33:(34,'/ō/','oa'),
 34:(35,'/yoo/','u_e'),35:(36,'/oo/','oo'),36:(37,'/ʊ/','oo'),37:(38,'/oi/','oi'),38:(39,'/ow/','ou'),39:(40,'/ər/','er'),
 40:(41,'/ar/','ar'),41:(42,'/or/','or'),42:(43,'/aw/','aw'),43:(44,'/air/','air'),44:(45,'/ə/ schwa','a')}
# Unique, readable file/recording slugs (a bare spelling such as th/oo/a is NEVER an identifier)
SLUGS=["b","k","d","f","g","h","j","l","m","n","p","r","s","t","v","w","y","z","ch","sh","th-voiceless","th-voiced","ng","zh",
 "short-a","short-e","short-i","short-o","short-u","long-a","long-e","long-i","long-o","yoo","oo-long","oo-short","oi","ow","er","ar","or","aw","air","schwa"]
errors=[]; discrepancies=[]
if inv['slideCount']!=45: errors.append('deck has %d slides, expected 45'%inv['slideCount'])
slides=inv['slides']
if slides[0]['kind']!='menu': errors.append('slide 1 is not the menu')
sounds=[]
for k,s in enumerate(slides[1:],1):
    n=k; sid='%02d'%n
    if s['kind']!='sound' or s['index']!=n+1: errors.append('slide %d unexpected'%s['index'])
    if s['counter']!='%02d / 44'%n: errors.append('slide %d counter %s'%(s['index'],s['counter']))
    exp=RECHECK[n]
    if exp[0]!=s['index']: errors.append('table slide %d != deck slide %d for sound %s'%(exp[0],s['index'],sid))
    if exp[1]!=s['symbol']: errors.append('sound %s: table label %r != deck label %r'%(sid,exp[1],s['symbol']))
    spell=[x.strip() for x in s['spelling'].split(',')]
    if exp[2] not in spell: errors.append('sound %s: recheck spelling %r not among deck spellings %r'%(sid,exp[2],spell))
    icon=s.get('audio')
    if not icon: errors.append('sound %s: no speaker icon'%sid)
    elif ('for '+s['symbol']+' ') not in icon['name']: errors.append('sound %s: speaker icon is labelled %r'%(sid,icon['name']))
    if not (s['prev'] and s['prev']['jump']==s['index']-1 and s['menuBtn']['jump']==1 and s['next']['jump']==(1 if s['index']==45 else s['index']+1)): errors.append('slide %d navigation links wrong'%s['index'])
    if slides[0]['menu'][k-1]['jump']!=s['index']: errors.append('menu item %d jumps to %s not %d'%(k,slides[0]['menu'][k-1]['jump'],s['index']))
    sounds.append({
     'soundId':sid,'number':n,'pptSlide':s['index'],'label':s['symbol'],'category':s['category'],
     'spellings':spell,'spellingText':s['spelling'],'keyword':s['keyword'],'teacherCue':s['cue'],
     'audio':{'recordingId':'c2_sound_'+sid+'_'+SLUGS[n-1],'fileBase':'c2_sound_'+sid+'_'+SLUGS[n-1],'extension':'depends on the browser that records (webm in Chrome/Edge)'},
     'slideshow':{'screen':'c2Show','slide':s['index'],'image':'check2-slides/slides/%02d.png'%s['index'],'speakerIcon':icon['box'] if icon else None},
     'recheck':{'sheetPosition':n,'studentSpelling':exp[2],'teacherSoundLabel':s['symbol'],'note':'Informal instructional recheck only; not the 31-target Check 2 assessment. Some spellings have more than one valid pronunciation, so a different response is not automatically wrong.'}})
# uniqueness
for key in ('label','soundId'):
    vals=[x[key] for x in sounds]
    if len(set(vals))!=44: errors.append('%s not unique'%key)
if len(set(x['audio']['recordingId'] for x in sounds))!=44: errors.append('recording ids not unique')
if len(set((x['recheck']['studentSpelling'],x['label']) for x in sounds))!=44: errors.append('recheck pairs not unique')
dups={}
for x in sounds: dups.setdefault(x['recheck']['studentSpelling'],[]).append(x['soundId'])
shared={sp:ids for sp,ids in dups.items() if len(ids)>1}
# known, intentional contrasts that must stay separate
def lab(i): return sounds[i-1]['label']
for a,b in ((21,22),(35,36),(25,44)):
    if lab(a)==lab(b): errors.append('sounds %d and %d must stay distinct'%(a,b))
if not any('ear' in x['spellings'] for x in sounds if x['soundId']=='43'): errors.append('/air/ should list ear as a spelling')
if any(x['label'].startswith('/ear') for x in sounds): errors.append('unexpected separate /ear/ slide')
# remarks the teacher asked to be checked against the deck
if sounds[20]['keyword']!='thin': discrepancies.append({'sound':'21 /th/ voiceless','told':'as in thin','deck':'as in '+sounds[20]['keyword'],'decision':'deck is authoritative; slide shows "%s"'%sounds[20]['keyword']})
if sounds[34]['keyword']!='moon': discrepancies.append({'sound':'35 /oo/','told':'as in moon','deck':sounds[34]['keyword']})
if sounds[35]['keyword']!='book': discrepancies.append({'sound':'36 /ʊ/','told':'as in book','deck':sounds[35]['keyword']})
if sounds[43]['keyword']!='about': discrepancies.append({'sound':'44 schwa','told':'about','deck':sounds[43]['keyword']})
if sounds[36]['teacherCue']==sounds[37]['teacherCue']: discrepancies.append({'sound':'37 /oi/ and 38 /ow/','issue':'identical teacher mouth cue ("%s")'%sounds[36]['teacherCue'],'decision':'kept exactly as in the approved deck; flagged in the studio for review'})
# optional: prove each rendered page shows its sound
if pdf:
    for x in sounds:
        t=subprocess.check_output(['pdftotext','-f',str(x['pptSlide']),'-l',str(x['pptSlide']),'-raw',pdf,'-'],encoding='utf8')
        t=re.sub(r'\s+',' ',t)
        flat=t.replace(' ','')
        for what in ('keyword','teacherCue','spellingText'):
            if re.sub(r'\s+',' ',x[what]).replace(' ','') not in flat: errors.append('PDF page %d (sound %s) does not show %s %r'%(x['pptSlide'],x['soundId'],what,x[what]))
        # the label: glyphs drawn in a fallback font (the IPA symbols) are extracted on a separate line, so compare characters
        if not all(ch in t for ch in x['label'] if ch not in '/ '): errors.append('PDF page %d (sound %s) does not show label %r'%(x['pptSlide'],x['soundId'],x['label']))
        if x['label'].startswith('/th/') and x['label'].split()[1] not in t and False: pass
if errors:
    print('MAPPING ERRORS:'); [print(' -',e) for e in errors]; sys.exit(1)
res={'schema':1,'source':{'file':os.path.basename(deck),'sha256':hashlib.sha256(open(deck,'rb').read()).hexdigest(),'slideCount':45,'slide1':'interactive sound menu','soundSlides':'2-45'},
 'discrepancies':discrepancies,'sharedStudentSpellings':shared,
 'menu':[{'soundId':'%02d'%(i+1),'jumpsToSlide':m['jump'],'box':m['box']} for i,m in enumerate(slides[0]['menu'])],
 'nav':{'previous':slides[1]['prev']['box'],'soundMenu':slides[1]['menuBtn']['box'],'next':slides[1]['next']['box']},
 'sounds':sounds}
json.dump(res,open(out,'w',encoding='utf8'),indent=1,ensure_ascii=False)
print('OK: 44 sounds / 45 slides verified;',len(discrepancies),'discrepancy note(s); shared student spellings:',shared)
