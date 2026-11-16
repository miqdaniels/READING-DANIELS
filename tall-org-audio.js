/* TALL organizer audio (c) 2026 Miquela Daniels, AI Academy LLC. Maps ORG_ ids -> Miquela's recorded clips (her own voice, NEVER text-to-speech).
   ids: ORG_<passage>_<nn> (passage 1.1 -> 1_01): nn = 01..k the answers in box order (Who..How, gray boxes skipped), then k+1..k+4 the order sentences in passage order. See data/tall-org-clips.json.
   Until a clip is here the app says "Not recorded yet." ES5. */
var TALL_ORG_AUDIO = {
};
if(typeof window!=="undefined"){ window.TALL_ORG_AUDIO = TALL_ORG_AUDIO; }
if(typeof module!=="undefined"){ module.exports = TALL_ORG_AUDIO; }
