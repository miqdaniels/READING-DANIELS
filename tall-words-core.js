/* TALL Word Builder -- shared core (c) 2026 Miquela Daniels, AI Academy LLC. Proprietary -- do not copy or distribute.
   Pure logic, no DOM. Used by tall-words.html (student page), tall-studio.html (WRD_ recording ids) and the tests.
   ES5 only. Teacher's own recorded voice only -- there is NO text-to-speech anywhere.

   DATA FORMAT (data/tall-word-lists.json). The loader (normalizeLists) is deliberately tolerant:
     { groups:[ { id, title, patterns:[ { id, title, spelling, build:[word x10], read:[word x10] } ] } ],
       heartSets:[ { id, title, words:[word] } ] }
     word = "sat" | "sat*" (star = First 100) | { w | word | text, first100 | star, heart, tricky }
   Flags: first100 -> small star; heart -> heart word (own list, tricky part underlined). */
var TW = (function(){
  var VOWELS = "aeiou";
  function isV(c){ return !!c && VOWELS.indexOf(c) > -1; }

  /* ---------------- ids ---------------- */
  function slug(s){ return String(s||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,""); }
  function wordKey(w){ return String(w||"").toLowerCase().replace(/[^a-z]/g,""); }
  function wordId(w){ var s = String(w||"").replace(/^\s+|\s+$/g,""); if(s === "I"){ return "WRD_I"; } return "WRD_" + s.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z-]/g,""); }
  /* THE one lookup for a word's recorded clip (Word Builder, games, Read lists, Dictation, Flash-Write, passage + academic words). "" = not recorded yet. */
  function wordClip(w, map){ map = map || (typeof window !== "undefined" ? window.TALL_WORD_AUDIO : null); return (map && map[wordId(w)]) || ""; }

  /* ---------------- data loader ---------------- */
  function normWord(x){
    var o = { w:"", first100:false, heart:false, tricky:"" }, s, m;
    if(typeof x === "string"){
      s = x;
      if(/[★*]/.test(s)){ o.first100 = true; }
      if(/heart/i.test(s)){ o.heart = true; }
      m = s.match(/[A-Za-z']+/); o.w = m ? m[0] : "";
    } else if(x && typeof x === "object"){
      o.w = String(x.w || x.word || x.text || x.display || "");
      o.first100 = !!(x.first100 || x.f100 || x.star || x.isFirst100 || x.first_100);
      o.heart = !!(x.heart || x.isHeart || x.heartWord || x.heart_word);
      o.tricky = String(x.tricky || x.underline || x.trickyPart || "");
    }
    return o;
  }
  function normList(a){ var out = [], i, w; a = a || []; for(i=0;i<a.length;i++){ w = normWord(a[i]); if(w.w){ out.push(w); } } return out; }
  function normPattern(p, gi, pi){
    var title = String(p.title || p.name || p.pattern || p.id || ("Pattern " + (pi+1)));
    return { id: String(p.id || slug(title) || ("p" + gi + "-" + pi)), title: title, spelling: String(p.spelling || p.grapheme || p.pattern || ""),
             build: normList(p.build || p.Build || p.chain), read: normList(p.read || p.Read || p.list) };
  }
  function normalizeLists(raw){
    var out = { title: String((raw && raw.title) || "TALL Word Lists"), groups: [], heart: [] }, gs, g, i, j, ps, hs, h, G;
    raw = raw || {};
    gs = raw.groups || raw.Groups || [];
    if(!gs.length && (raw.patterns || raw.Patterns)){
      /* flat list: each pattern names its own group ("group":"G1","groupTitle":"Short Vowels") -> groups in order of first appearance */
      var flatPs = raw.patterns || raw.Patterns, byId = {}, k2, fp, gid;
      for(k2=0;k2<flatPs.length;k2++){
        fp = flatPs[k2]; gid = String(fp.group || fp.groupId || "g1");
        if(!byId[gid]){ byId[gid] = { id: gid, title: String(fp.groupTitle || fp.group_title || fp.group || "Patterns"), patterns: [] }; gs.push(byId[gid]); }
        byId[gid].patterns.push(fp);
      }
    }
    for(i=0;i<gs.length;i++){
      g = gs[i]; ps = g.patterns || g.Patterns || []; G = { id: String(g.id || ("g" + (i+1))), title: String(g.title || g.name || ("Group " + (i+1))), patterns: [] };
      for(j=0;j<ps.length;j++){ G.patterns.push(normPattern(ps[j], i, j)); G.patterns[j].groupTitle = G.title; }
      out.groups.push(G);
    }
    hs = raw.heartSets || raw.heart_sets || raw.heart || raw.heartWords || [];
    for(i=0;i<hs.length;i++){
      h = hs[i]; if(h && !h.words && h.list){ h.words = h.list; }
      var hn = (h.set !== undefined && h.set !== null) ? h.set : (i + 1);
      out.heart.push({ id: String(h.id || ("heart-" + hn)), title: String(h.title || h.name || ("Heart words " + hn)), words: normList(h.words).map(function(w){ w.heart = true; return w; }) });
    }
    return out;
  }
  /* flat list of patterns in teaching order: [{group, pattern, index}] */
  function flatPatterns(lists){
    var out = [], i, j;
    for(i=0;i<lists.groups.length;i++){ for(j=0;j<lists.groups[i].patterns.length;j++){ out.push({ group: lists.groups[i], pattern: lists.groups[i].patterns[j], index: out.length }); } }
    return out;
  }
  /* every unique word -> one WRD_ id, in the set (pattern / heart set) where it first appears. Never duplicates. */
  function uniqueWords(lists){
    var seen = {}, out = [], i, j, k, ps, p, arr, w, id, add;
    add = function(w, setId, setTitle, groupTitle){
      id = wordId(w.w);
      if(!id || id === "WRD_" || seen[id]){ if(seen[id]){ if(w.first100){ seen[id].first100 = true; } if(w.heart){ seen[id].heart = true; if(w.tricky){ seen[id].tricky = w.tricky; } } } return; }
      seen[id] = { id: id, w: w.w, first100: !!w.first100, heart: !!w.heart, tricky: w.tricky || "", setId: setId, setTitle: setTitle, groupTitle: groupTitle };
      out.push(seen[id]);
    };
    ps = flatPatterns(lists);
    for(i=0;i<ps.length;i++){
      p = ps[i].pattern;
      for(k=0;k<2;k++){ arr = k === 0 ? p.build : p.read; for(j=0;j<arr.length;j++){ add(arr[j], p.id, p.title, ps[i].group.title); } }
    }
    for(i=0;i<lists.heart.length;i++){ for(j=0;j<lists.heart[i].words.length;j++){ add(lists.heart[i].words[j], lists.heart[i].id, lists.heart[i].title, "Heart words"); } }
    return out;
  }

  /* ---------------- the tile splitter ----------------
     ONE TILE PER SOUND. Digraphs/trigraphs = one tile; x (/ks/) = one tile; silent e = split tile (a_e ...);
     vowel teams + r-controlled = one tile; doubled consonants = one tile; endings (-s -es -ed -ing) = one tile. */
  var TRI = ["tch", "dge", "igh", "air", "ear", "eir", "eer"];
  var TRI_END = ["ere", "ore", "are", "ire", "ure"];           /* r-controlled + e, only at the END of a word */
  var TWO = ["th","sh","ch","wh","ck","ng","ph","qu","kn","wr","ee","ea","ey","ay","ai","oa","ow","oo","ew","oi","oy","ou","aw","ar","or","er","ir","ur"];
  var NOT_DOUBLE = { a:1, e:1, i:1, o:1, u:1 };
  /* words that do not follow the patterns (heart words) -- letters only, no sound tiles */
  var IRREGULAR = {};
  ("the a of to do who you your are were was said says what where's have give live love come some done gone none one once only any many been does goes could would should " +
   "they their's from put pull full push bush two eye eyes friend people because again against says sure sugar water other another mother brother " +
   "heart height whose whole whom").split(/\s+/).forEach(function(w){ IRREGULAR[w] = 1; });
  /* the one "put/full" group is /oo/ short; keep them irregular-free where the data lists them as taught */
  var SHORT_OO = { book:1, look:1, good:1, foot:1, wood:1, cook:1, took:1, hook:1, stood:1, wool:1, hood:1, shook:1, brook:1, crook:1, put:1, pull:1, full:1, push:1, bush:1 };
  var LONG_O_OW = { snow:1, grow:1, show:1, know:1, low:1, slow:1, own:1, blow:1, flow:1, yellow:1, window:1, below:1, row:1, throw:1, bowl:1, glow:1, crow:1, blown:1, shown:1, grown:1, known:1, thrown:1, flown:1, mow:1, tow:1 };
  var SHORT_E_EA = { head:1, bread:1, dead:1, breath:1, ready:1, heavy:1, weather:1, sweat:1, instead:1, health:1, spread:1, thread:1, tread:1, meant:1 };
  var EAR_AIR = { bear:1, wear:1, pear:1, swear:1 };
  var EAR_ER = { learn:1, early:1, earth:1, heard:1, search:1, earn:1, pearl:1 };
  var ERE_AIR = { there:1, where:1 };
  var HARD_G = { get:1, give:1, gift:1, girl:1, begin:1, together:1, target:1, gear:1, geese:1, anger:1, finger:1, hunger:1, tiger:1 };
  var VOICED_TH = { "this":1, that:1, than:1, then:1, them:1, "with":1, these:1, those:1, there:1, their:1, they:1, the:1, "other":1, mother:1, brother:1, father:1, "weather":1, "together":1, "bathe":1, "breathe":1, "smooth":1 };
  var Z_S = { is:1, has:1, his:1, as:1, these:1, those:1, does:1, easy:1, music:1, busy:1, "please":1, "because":1, "was":1, hose:1, noise:1, reason:1, jersey:1, rose:1, nose:1, choose:1, cheese:1 };
  /* a final s after a vowel or a voiced sound is /z/ (toys, keys, news, hugs); these end in /s/ anyway */
  var S_FINAL = { bus:1, "this":1, us:1, yes:1, plus:1, gas:1, focus:1, bonus:1, virus:1, chorus:1, campus:1, circus:1 };
  var CH_K = { school:1, chorus:1, echo:1, ache:1, stomach:1, mechanic:1, chaos:1, character:1 };       /* ch = /k/ */
  var WA_O = { want:1, wash:1, watch:1, swan:1, wand:1, wasp:1, squad:1, wallet:1, swamp:1 };          /* a after w = short o */
  var WOR_ER = { word:1, words:1, work:1, world:1, worm:1, worth:1, worse:1, worry:1 };               /* or after w = /er/ */
  var OVERRIDE = { tired:["t", "ire", "d"], scared:["s", "c", "are", "d"] };                                                         /* spellings the splitter cannot see */
  var U_E_OO = { rule:1, june:1, flute:1, prune:1, ruler:1, "rude":1, "tune":0 };
  var OPEN_LONG = { he:"e", me:"e", we:"e", be:"e", she:"e", "he's":"e", go:"o", no:"o", so:"o", hi:"i", my:"y", by:"y", why:"y", fly:"y", try:"y", cry:"y", dry:"y", sky:"y", spy:"y", shy:"y" };

  function vowelLetters(w){ var n = 0, i; for(i=0;i<w.length;i++){ if(isV(w.charAt(i))){ n++; } } return n; }
  function startsWith(s, i, t){ return s.substr(i, t.length) === t; }

  function splitBase(w){
    var n = w.length, i = 0, tiles = [], lim = n, rest, k, c, silent = false, t, j, found, nxt, prv;
    /* silent-e split tile: V C e at the end, one vowel letter, one consonant (or th/sh/ch) between */
    if(n >= 3 && w.charAt(n-1) === "e"){
      var m = w.match(/([aeiou])(th|sh|ch|[bcdfghjklmnpstvxz])e$/);      /* one consonant (never w/y/q) between */
      if(m){
        var vi = n - 1 - m[2].length - 1, before = w.charAt(vi - 1);
        if(!(vi > 0 && isV(before)) && m[2] !== "r"){ silent = { vi: vi, v: m[1] }; lim = n - 1; }
      }
    }
    while(i < lim){
      rest = w.slice(i, lim);
      if(silent && i === silent.vi){ tiles.push({ g: silent.v + "_e", k: "split", v: silent.v }); i++; continue; }
      /* "all" (ball, call, small) */
      if(rest === "all" && (i === 0 || !isV(w.charAt(i-1)))){ tiles.push({ g: "all", k: "team" }); i += 3; continue; }
      /* r-controlled + e at the end of the word (here, more, care) */
      found = null;
      for(k=0;k<TRI_END.length;k++){ if(rest === TRI_END[k] || rest === TRI_END[k] + "d" || rest === TRI_END[k] + "s"){ found = TRI_END[k]; break; } }
      if(found){ tiles.push({ g: found, k: "r" }); i += 3; continue; }
      /* "alk" = the /aw/ sound (talk, walk, chalk): one tile "al" */
      if(startsWith(rest, 0, "alk")){ tiles.push({ g: "al", k: "team" }); i += 2; continue; }
      found = null;
      for(k=0;k<TRI.length;k++){ if(startsWith(rest, 0, TRI[k])){ found = TRI[k]; break; } }
      if(found){ tiles.push({ g: found, k: /^(air|ear|eir|eer)$/.test(found) ? "r" : (found === "igh" ? "team" : "cons") }); i += found.length; continue; }
      found = null;
      for(k=0;k<TWO.length;k++){ if(startsWith(rest, 0, TWO[k])){ found = TWO[k]; break; } }
      if(found){
        /* "ar/or/er/ir/ur" only when not followed by another vowel-making pattern we do not handle; keep simple */
        tiles.push({ g: found, k: (/^(th|sh|ch|wh|ck|ng|ph|qu|kn|wr)$/.test(found) ? "cons" : (/^(ar|or|er|ir|ur)$/.test(found) ? "r" : "team")) }); i += 2; continue;
      }
      c = rest.charAt(0);
      if(!isV(c) && c === rest.charAt(1) && c !== "c"){ tiles.push({ g: c + c, k: "dbl" }); i += 2; continue; }
      if(c === "n" && rest.charAt(1) === "k"){ tiles.push({ g: "n", k: "nasal" }); i++; continue; }
      if(c === "x"){ tiles.push({ g: "x", k: "x" }); i++; continue; }
      if(c === "e" && i === lim - 1 && i > 0 && !isV(w.charAt(i-1)) && vowelLetters(w) >= 2){ tiles.push({ g: "e", k: "silent" }); i++; continue; }
      tiles.push({ g: c, k: isV(c) ? "v" : (c === "y" ? "y" : "c") }); i++;
    }
    return tiles;
  }

  /* endings: only for words in an "endings" pattern (opts.endings) -- otherwise 'is', 'bed', 'sing' would be split wrongly */
  function hasVowelLetter(w){ return /[aeiou]/.test(w); }
  /* base word is another word in the lists (looked <- look, stopped <- stop, called <- call) */
  function baseKnown(base, known){ if(!known){ return false; } return !!(known[base] || (/(.)\1$/.test(base) && known[base.slice(0, -1)]) || known[base + "e"]); }
  function findSuffix(w, opts){
    var base;
    if(opts.endings){
      if(/ing$/.test(w) && w.length > 4){ return "ing"; }
      if(/ed$/.test(w) && w.length > 3){ return "ed"; }
      if(/(x|s|z|sh|ch)es$/.test(w) && w.length > 4){ return "es"; }
      if(/s$/.test(w) && !/ss$/.test(w) && w.length > 2){ return "s"; }
      return "";
    }
    /* outside an Endings pattern only a real inflection is cut: -ing after a base with a vowel; -ed after t/d or a known base */
    if(/ing$/.test(w) && w.length >= 5){ base = w.slice(0, -3); if((base.length >= 3 && hasVowelLetter(base)) || (base.length === 2 && opts.known && opts.known[base])){ return "ing"; } }
    if(/ed$/.test(w) && w.length > 4){ base = w.slice(0, -2); if(base.length >= 3 && hasVowelLetter(base) && (/[td]ed$/.test(w) || baseKnown(base, opts.known))){ return "ed"; } }
    return "";
  }
  function splitWord(word, opts){
    var w = wordKey(word), tiles, base, suf, i, ov;
    opts = opts || {};
    if(!w){ return []; }
    if(OVERRIDE[w]){ ov = OVERRIDE[w]; tiles = []; for(i=0;i<ov.length;i++){ tiles.push({ g: ov[i], k: ov[i].length > 1 ? "r" : "c" }); } tiles.baseWord = w; return tiles; }
    if(IRREGULAR[w] && !opts.force){ tiles = w.split("").map(function(c){ return { g: c, k: "irr" }; }); tiles.baseWord = w; return tiles; }
    suf = findSuffix(w, opts);
    base = suf ? w.slice(0, w.length - suf.length) : w;
    if(suf && IRREGULAR[base]){ tiles = base.split("").map(function(c){ return { g: c, k: "irr" }; }); }
    else { tiles = splitBase(base); }
    if(suf){ tiles.push({ g: suf, k: "end" }); }
    tiles.baseWord = base;       /* the sounds of a word with an ending come from its BASE word (going <- go) */
    return tiles;
  }
  function tilesText(tiles){ var o = [], i; for(i=0;i<tiles.length;i++){ o.push(tiles[i].g); } return o.join(" "); }
  /* put a split tile back: [c][a_e][k] -> "cake" */
  function tilesToWord(tiles){
    var s = "", i, t, e = false, placed = false;
    for(i=0;i<tiles.length;i++){
      t = tiles[i];
      if(t.k === "end" && e && !placed){ s += "e"; placed = true; }
      if(t.k === "split"){ s += t.g.charAt(0); e = true; } else { s += t.g; }
    }
    return (e && !placed) ? s + "e" : s;
  }

  /* ---------------- tile -> sound clip (SND_xx_S) ----------------
     Returns { snd: "SND_25" | null, say: "short a" }. snd === null means "no single clip": play NOTHING and show
     the sound in text (never text-to-speech). */
  var CONS = { b:"SND_02", d:"SND_04", f:"SND_07", h:"SND_24", j:"SND_16", k:"SND_05", l:"SND_20", m:"SND_17", n:"SND_18", p:"SND_01", r:"SND_21", t:"SND_03", v:"SND_08", w:"SND_22", z:"SND_12", q:"SND_05" };
  var SAY = { SND_01:"/p/", SND_02:"/b/", SND_03:"/t/", SND_04:"/d/", SND_05:"/k/", SND_06:"/g/", SND_07:"/f/", SND_08:"/v/", SND_09:"/th/ (quiet)", SND_10:"/th/ (voiced)", SND_11:"/s/", SND_12:"/z/", SND_13:"/sh/", SND_14:"/zh/", SND_15:"/ch/", SND_16:"/j/", SND_17:"/m/", SND_18:"/n/", SND_19:"/ng/", SND_20:"/l/", SND_21:"/r/", SND_22:"/w/", SND_23:"/y/", SND_24:"/h/", SND_25:"short a", SND_26:"short e", SND_27:"short i", SND_28:"short o", SND_29:"short u", SND_30:"long a", SND_31:"long e", SND_32:"long i", SND_33:"long o", SND_34:"long u", SND_35:"long oo", SND_36:"short oo", SND_37:"/ar/", SND_38:"/or/", SND_39:"/er/", SND_40:"/air/", SND_41:"/ear/", SND_42:"/aw/", SND_43:"/ow/", SND_44:"/oi/", SND_45:"schwa" };
  var VOICELESS_END = { SND_01:1, SND_05:1, SND_07:1, SND_09:1, SND_11:1, SND_13:1, SND_15:1, SND_03:1 };

  function soundForTile(tiles, idx, word){
    var t = tiles[idx], g = t.g, w = wordKey(t.k === "end" ? word : (tiles.baseWord || word)), pv, snd = null, say = "", open, nxt = tiles[idx+1], nx = nxt ? (nxt.k === "split" ? nxt.v : nxt.g) : "";
        switch(g){
      case "th": snd = VOICED_TH[w] ? "SND_10" : "SND_09"; break;
      case "sh": snd = "SND_13"; break;
      case "ch": snd = CH_K[w] ? "SND_05" : "SND_15"; break;
      case "tch": snd = "SND_15"; break;
      case "eer": snd = "SND_41"; break;
      case "al": snd = "SND_42"; break;
      case "dge": snd = "SND_16"; break;
      case "wh": snd = "SND_22"; break;
      case "ck": snd = "SND_05"; break;
      case "ng": snd = "SND_19"; break;
      case "ph": snd = "SND_07"; break;
      case "qu": say = "/kw/"; break;
      case "kn": snd = "SND_18"; break;
      case "wr": snd = "SND_21"; break;
      case "x": say = "/ks/"; break;
      case "a_e": snd = "SND_30"; break;
      case "e_e": snd = "SND_31"; break;
      case "i_e": snd = "SND_32"; break;
      case "o_e": snd = "SND_33"; break;
      case "u_e": snd = U_E_OO[w] ? "SND_35" : "SND_34"; break;
      case "ee": case "ey": snd = "SND_31"; break;
      case "ea": snd = SHORT_E_EA[w] ? "SND_26" : "SND_31"; break;
      case "ay": case "ai": snd = "SND_30"; break;
      case "igh": snd = "SND_32"; break;
      case "oa": snd = "SND_33"; break;
      case "ow": snd = LONG_O_OW[w] ? "SND_33" : "SND_43"; break;
      case "ou": snd = "SND_43"; break;
      case "oo": snd = SHORT_OO[w] ? "SND_36" : "SND_35"; break;
      case "ew": snd = "SND_35"; break;
      case "aw": case "all": snd = "SND_42"; break;
      case "oi": case "oy": snd = "SND_44"; break;
      case "ar": snd = (idx > 0 && tiles[idx-1].g === "w") ? "SND_38" : "SND_37"; break;
      case "or": snd = WOR_ER[w] ? "SND_39" : "SND_38"; break;
      case "ore": snd = "SND_38"; break;
      case "er": case "ir": case "ur": snd = "SND_39"; break;
      case "air": case "eir": case "are": snd = "SND_40"; break;
      case "ere": snd = ERE_AIR[w] ? "SND_40" : "SND_41"; break;
      case "ear": snd = EAR_AIR[w] ? "SND_40" : (EAR_ER[w] ? "SND_39" : "SND_41"); break;
      case "ire": say = "/ire/"; break;
      case "ure": say = "/ure/"; break;
      case "s": case "es": case "ed": case "ing":
        if(t.k !== "end"){
          if(g !== "s"){ snd = null; break; }
          if(Z_S[w]){ snd = "SND_12"; break; }
          pv = idx > 0 ? soundForTile(tiles, idx - 1, word).snd : null;
          snd = (idx === tiles.length - 1 && pv && !VOICELESS_END[pv] && !S_FINAL[w]) ? "SND_12" : "SND_11";
          break;
        }
        pv = idx > 0 ? soundForTile(tiles, idx - 1, word).snd : null;
        if(g === "s"){ snd = (pv && VOICELESS_END[pv]) ? "SND_11" : "SND_12"; }
        else if(g === "ed"){ var pg = tiles[idx-1] ? tiles[idx-1].g : ""; if(pg === "t" || pg === "d"){ say = "/id/"; } else { snd = (pv && VOICELESS_END[pv] && pv !== "SND_03") ? "SND_03" : "SND_04"; } }
        else if(g === "es"){ say = "/iz/"; }
        else { say = "/ing/"; }
        break;
      case "silent": case "e": if(t.k === "silent"){ say = "silent e"; break; } /* falls through */
      default:
        if(t.k === "irr"){ snd = null; say = ""; break; }
        if(t.k === "dbl"){ g = g.charAt(0); }
        if(t.k === "nasal"){ snd = "SND_19"; break; }
        var silentSoft = idx === tiles.length - 1 && idx > 0 && tiles[idx-1].k === "split" && /e$/.test(w);   /* office, face, huge, page */
        if(g === "c"){ snd = (/^[eiy]/.test(nx) || silentSoft) ? "SND_11" : "SND_05"; break; }
        if(g === "g"){ snd = (!HARD_G[w] && (/^[eiy]/.test(nx) || silentSoft)) ? "SND_16" : "SND_06"; break; }
        if(g === "s"){ snd = Z_S[w] ? "SND_12" : "SND_11"; break; }
        if(g === "y"){
          /* start of a word = consonant y; at the end: long i in a one-vowel-less word (my, why), long e after a vowel (happy) */
          if(idx === 0){ snd = "SND_23"; }
          else if(idx === tiles.length - 1){ snd = vowelLetters(w) > 0 ? "SND_31" : "SND_32"; }
          else { snd = "SND_23"; }
          break;
        }
        if(CONS[g]){ snd = CONS[g]; break; }
        if(isV(g)){
          open = OPEN_LONG[w];
          if(open && ((g === "e" && open === "e") || (g === "o" && open === "o") || (g === "i" && open === "i"))){ snd = { e:"SND_31", o:"SND_33", i:"SND_32" }[open]; break; }
          if(g === "a" && WA_O[w] && idx > 0 && (tiles[idx-1].g === "w" || tiles[idx-1].g === "qu")){ snd = "SND_28"; break; }
          snd = { a:"SND_25", e:"SND_26", i:"SND_27", o:"SND_28", u: (SHORT_OO[w] ? "SND_36" : "SND_29") }[g];
          break;
        }
    }
    if(snd && !say){ say = SAY[snd] || ""; }
    return { snd: snd, say: say };
  }
  /* full tile objects for a word: [{g, k, snd, say, clip}] where clip is the SND id with _S */
  function tilesFor(word, opts){
    var tiles = splitWord(word, opts), i, s;
    for(i=0;i<tiles.length;i++){ s = soundForTile(tiles, i, word); tiles[i].snd = s.snd; tiles[i].say = s.say; tiles[i].clip = s.snd ? (s.snd + "_S") : null; }
    return tiles;
  }

  /* ---------------- chain: which box changed ---------------- */
  function sameTile(a, b){ return a.g === b.g; }
  /* index of the ONE box that changes from prev to cur (equal length: the differing box; inserted/removed: the new box) */
  function changedIndex(prev, cur){
    var i, n, a = 0, b;
    if(!prev || !cur){ return -1; }
    if(prev.length === cur.length){
      for(i=0;i<cur.length;i++){ if(!sameTile(prev[i], cur[i])){ return i; } }
      return -1;
    }
    n = Math.min(prev.length, cur.length);
    while(a < n && sameTile(prev[a], cur[a])){ a++; }
    b = 0; while(b < n - a && sameTile(prev[prev.length - 1 - b], cur[cur.length - 1 - b])){ b++; }
    return a;
  }
  function diffCount(a, b){
    var i, c = 0;
    if(a.length !== b.length){ return 99; }
    for(i=0;i<a.length;i++){ if(!sameTile(a[i], b[i])){ c++; } }
    return c;
  }

  /* ---------------- game words + distractors ----------------
     Wrong answers: from the SAME pattern, same number of tiles, differ by exactly ONE sound, never just a plural
     / final -s (cat/cats, bus/buss), and never a pair that sounds the same. */
  function patternPool(p){
    var seen = {}, out = [], i, k, arr, key;
    for(k=0;k<2;k++){ arr = k === 0 ? p.build : p.read; for(i=0;i<arr.length;i++){ key = wordKey(arr[i].w); if(key && !seen[key] && !arr[i].heart){ seen[key] = 1; out.push(arr[i]); } } }
    return out;
  }
  function isPluralPair(a, b){ a = wordKey(a); b = wordKey(b); return a + "s" === b || b + "s" === a || a + "es" === b || b + "es" === a; }
  function neighbors(target, pool, opts){
    var tt = tilesFor(target, opts), out = [], i, ct, d, same, j;
    for(i=0;i<pool.length;i++){
      if(wordKey(pool[i].w) === wordKey(target)){ continue; }
      if(isPluralPair(target, pool[i].w)){ continue; }
      ct = tilesFor(pool[i].w, opts);
      if(ct.length !== tt.length){ continue; }
      d = -1; same = true;
      for(j=0;j<tt.length;j++){ if(tt[j].g !== ct[j].g){ if(d !== -1){ d = -2; break; } d = j; } }
      if(d < 0){ continue; }
      if(tt[d].snd && ct[d].snd && tt[d].snd === ct[d].snd){ continue; }  /* sounds the same */
      out.push({ w: pool[i].w, pos: d, tiles: ct, rec: pool[i] });
    }
    return out;
  }
  /* pick n-1 distractors, spread over positions, and (when possible) keep the first and last tile shared with at
     least one wrong answer so the answer can never be guessed from one letter */
  function pickDistractors(target, pool, n, rand, opts){
    var nb = neighbors(target, pool, opts), tt = tilesFor(target, opts), chosen = [], used = {}, i, j, cand, pos, want;
    rand = rand || Math.random;
    function shuffle(a){ var k, r, t; for(k=a.length-1;k>0;k--){ r = Math.floor(rand() * (k+1)); t = a[k]; a[k] = a[r]; a[r] = t; } return a; }
    shuffle(nb);
    /* want a wrong answer that keeps the FIRST tile (change later), one that keeps the LAST tile (change earlier) */
    var keepFirst = nb.filter(function(x){ return x.pos !== 0; }), keepLast = nb.filter(function(x){ return x.pos !== tt.length - 1; });
    function take(x){ if(x && !used[x.w]){ used[x.w] = 1; chosen.push(x); } }
    take(keepFirst[0]); take(keepLast[0]);
    for(i=0;i<nb.length && chosen.length < n - 1;i++){ take(nb[i]); }
    return chosen.slice(0, n - 1);
  }
  /* words that can be a game target = have at least 2 valid wrong answers in their pattern */
  function gameTargets(p, opts){
    var pool = patternPool(p), out = [], i;
    for(i=0;i<pool.length;i++){ if(neighbors(pool[i].w, pool, opts).length >= 2){ out.push(pool[i]); } }
    return out;
  }
  /* every word in the lists (build + read + heart), as a lookup: lets the splitter see that "looked" is look + ed */
  function knownSet(lists){
    var k = {}, i, j, g, ps, p, h, add;
    add = function(a){ var x; for(x=0;x<a.length;x++){ if(a[x].w){ k[wordKey(a[x].w)] = 1; } } };
    for(i=0;i<lists.groups.length;i++){ ps = lists.groups[i].patterns; for(j=0;j<ps.length;j++){ p = ps[j]; add(p.build); add(p.read); } }
    for(i=0;i<lists.heart.length;i++){ add(lists.heart[i].words); }
    return k;
  }
  /* the Build rule: from one word to the next, exactly ONE tile is swapped, added or removed */
  function oneStep(a, b){
    var s, l, i, j, ok;
    if(a.length === b.length){ return diffCount(a, b) === 1; }
    if(Math.abs(a.length - b.length) !== 1){ return false; }
    s = a.length < b.length ? a : b; l = a.length < b.length ? b : a;
    for(i=0;i<l.length;i++){
      ok = true;
      for(j=0;j<s.length;j++){ if(s[j].g !== l[j < i ? j : j + 1].g){ ok = false; break; } }
      if(ok){ return true; }
    }
    return false;
  }
  function isEndingsPattern(p){ return /ending|inflect|suffix/i.test((p.id || "") + " " + (p.title || "") + " " + (p.groupTitle || "")); }

  /* ---------------- progress (per student, localStorage) ---------------- */
  var PROG_KEY = "rf_tw_progress";
  function progLoad(store){ try{ var r = store.getItem(PROG_KEY); return r ? JSON.parse(r) : {}; }catch(e){ return {}; } }
  function progSave(store, all){ try{ store.setItem(PROG_KEY, JSON.stringify(all)); }catch(e){} }
  function progStudent(all, sid){ if(!all[sid]){ all[sid] = { patterns: {}, unlockAll: false, sound: true }; } return all[sid]; }
  function progPattern(st, pid){ if(!st.patterns[pid]){ st.patterns[pid] = { buildDone: false, buildIdx: 0, read: {}, dictRight: 0, dictTotal: 0, games: {} }; } return st.patterns[pid]; }

  return {
    wordKey: wordKey, wordId: wordId, wordClip: wordClip, slug: slug, normalizeLists: normalizeLists, flatPatterns: flatPatterns, uniqueWords: uniqueWords,
    splitWord: splitWord, tilesFor: tilesFor, tilesText: tilesText, tilesToWord: tilesToWord, soundForTile: soundForTile,
    changedIndex: changedIndex, diffCount: diffCount, patternPool: patternPool, neighbors: neighbors, pickDistractors: pickDistractors,
    gameTargets: gameTargets, isEndingsPattern: isEndingsPattern, knownSet: knownSet, oneStep: oneStep, SAY: SAY, IRREGULAR: IRREGULAR,
    progLoad: progLoad, progSave: progSave, progStudent: progStudent, progPattern: progPattern, PROG_KEY: PROG_KEY
  };
})();
if(typeof window !== "undefined"){ window.TW = TW; }
if(typeof module !== "undefined" && module.exports){ module.exports = TW; }
