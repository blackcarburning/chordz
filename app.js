/* =====================================================================
   Chordz – app.js
   Browser-based chord / song-structure builder
   Dependency-free; uses Web Audio API for beat + chord audition.
   ===================================================================== */

'use strict';

// =====================================================================
// DATA – Notes, Chord Types, Scales, Section Types
// =====================================================================

/** Chromatic note names (semitone index 0 = C). */
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Chord types.  Each entry has:
 *   name      – short display label  (used as key)
 *   label     – longer description
 *   intervals – semitone offsets from root (for audition)
 */
const CHORD_TYPES = [
  { name: 'maj',   label: 'Major',             intervals: [0, 4, 7] },
  { name: 'min',   label: 'Minor',             intervals: [0, 3, 7] },
  { name: '5',     label: 'Power (5th)',        intervals: [0, 7] },
  { name: '6',     label: 'Major 6th',         intervals: [0, 4, 7, 9] },
  { name: 'm6',    label: 'Minor 6th',         intervals: [0, 3, 7, 9] },
  { name: '7',     label: 'Dominant 7th',      intervals: [0, 4, 7, 10] },
  { name: 'maj7',  label: 'Major 7th',         intervals: [0, 4, 7, 11] },
  { name: 'm7',    label: 'Minor 7th',         intervals: [0, 3, 7, 10] },
  { name: 'mMaj7', label: 'Minor-Major 7th',   intervals: [0, 3, 7, 11] },
  { name: 'dim',   label: 'Diminished',        intervals: [0, 3, 6] },
  { name: 'dim7',  label: 'Diminished 7th',    intervals: [0, 3, 6, 9] },
  { name: 'm7b5',  label: 'Half-Dim (m7♭5)',   intervals: [0, 3, 6, 10] },
  { name: 'aug',   label: 'Augmented',         intervals: [0, 4, 8] },
  { name: 'sus2',  label: 'Suspended 2nd',     intervals: [0, 2, 7] },
  { name: 'sus4',  label: 'Suspended 4th',     intervals: [0, 5, 7] },
  { name: 'add9',  label: 'Add 9',             intervals: [0, 4, 7, 14] },
  { name: '9',     label: 'Dominant 9th',      intervals: [0, 4, 7, 10, 14] },
  { name: 'm9',    label: 'Minor 9th',         intervals: [0, 3, 7, 10, 14] },
  { name: 'maj9',  label: 'Major 9th',         intervals: [0, 4, 7, 11, 14] },
  { name: '11',    label: '11th',              intervals: [0, 4, 7, 10, 14, 17] },
  { name: '13',    label: '13th',              intervals: [0, 4, 7, 10, 14, 17, 21] },
];

/**
 * Scale types.  Each entry has:
 *   name      – display name (used as key)
 *   intervals – semitone offsets from root for one octave
 */
const SCALES = [
  { name: 'Major',            intervals: [0, 2, 4, 5, 7, 9, 11] },
  { name: 'Natural Minor',    intervals: [0, 2, 3, 5, 7, 8, 10] },
  { name: 'Harmonic Minor',   intervals: [0, 2, 3, 5, 7, 8, 11] },
  { name: 'Melodic Minor',    intervals: [0, 2, 3, 5, 7, 9, 11] },
  { name: 'Major Pentatonic', intervals: [0, 2, 4, 7, 9] },
  { name: 'Minor Pentatonic', intervals: [0, 3, 5, 7, 10] },
  { name: 'Blues',            intervals: [0, 3, 5, 6, 7, 10] },
  { name: 'Dorian',           intervals: [0, 2, 3, 5, 7, 9, 10] },
  { name: 'Phrygian',         intervals: [0, 1, 3, 5, 7, 8, 10] },
  { name: 'Lydian',           intervals: [0, 2, 4, 6, 7, 9, 11] },
  { name: 'Mixolydian',       intervals: [0, 2, 4, 5, 7, 9, 10] },
  { name: 'Aeolian',          intervals: [0, 2, 3, 5, 7, 8, 10] },
  { name: 'Locrian',          intervals: [0, 1, 3, 5, 6, 8, 10] },
  { name: 'Chromatic',        intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
];

/** Valid section type strings. */
const SECTION_TYPES = ['Verse', 'Chorus', 'Bridge', 'Middle 8', 'Change', 'Outro', 'Custom'];
const PLAYBACK_MODES = ['edit', 'song'];
const CHORD_SOUND_PRESETS = [
  { id: 'piano',  label: 'Piano-ish' },
  { id: 'pad',    label: 'Pad' },
  { id: 'organ',  label: 'Organ/Square' },
  { id: 'pluck',  label: 'Pluck' },
];
const BASS_SOUND_PRESETS = [
  { id: 'sineBass',   label: 'Sine Bass' },
  { id: 'squareBass', label: 'Square Bass' },
  { id: 'sawBass',    label: 'Saw Bass' },
];

// =====================================================================
// FACTORY HELPERS
// =====================================================================

let _idSeq = 0;
function makeId() {
  return 'x' + Date.now().toString(36) + (++_idSeq).toString(36);
}

/** Starter chord progressions for new sections. */
const SECTION_DEFAULTS = {
  'Verse':    [{ root: 0, type: 'maj' }, { root: 9, type: 'min' }, { root: 5, type: 'maj' }, { root: 7, type: '7' }],
  'Chorus':   [{ root: 5, type: 'maj' }, { root: 7, type: 'maj' }, { root: 9, type: 'min' }, { root: 4, type: 'min' }],
  'Bridge':   [{ root: 2, type: 'min' }, { root: 7, type: '7' },   { root: 0, type: 'maj7' }, { root: 9, type: '7' }],
  'Middle 8': [{ root: 5, type: 'maj7' }, { root: 7, type: 'm7' }, { root: 0, type: 'maj7' }],
  'Change':   [{ root: 3, type: 'maj7' }, { root: 8, type: 'm7' }],
  'Outro':    [{ root: 0, type: 'maj' }, { root: 5, type: 'maj' }, { root: 7, type: 'maj' }],
  'Custom':   [],
};

function createSection(type) {
  const defaults = SECTION_DEFAULTS[type] || [];
  return {
    id:        makeId(),
    type:      type,
    name:      type === 'Custom' ? 'My Section' : type,
    scaleRoot: 0,           // C
    scaleType: 'Major',
    crashOnStart: false,
    rollAtEnd: false,
    chords:    defaults.map(c => ({ id: makeId(), root: c.root, type: c.type, beats: 4 })),
  };
}

function createDefaultSong() {
  const sections = [
    createSection('Verse'),
    createSection('Chorus'),
    createSection('Bridge'),
  ];
  return {
    title:    'Untitled Song',
    bpm:      100,
    playbackMode: 'edit',
    selectedSectionId: sections[0]?.id || null,
    chordSound: 'piano',
    bassEnabled: true,
    bassSound: 'sineBass',
    sections,
  };
}

// =====================================================================
// STATE – Song data model
// =====================================================================

/**
 * Song structure:
 * {
 *   title:    string,
 *   bpm:      number,
 *   sections: Section[]
 * }
 *
 * Section:
 * {
 *   id:        string,
 *   type:      string  (one of SECTION_TYPES),
 *   name:      string  (editable label),
 *   scaleRoot: number  (0–11),
 *   scaleType: string  (SCALES name),
 *   chords:    Chord[]
 * }
 *
 * Chord:
 * {
 *   id:   string,
 *   root: number  (semitone, 0–11),
 *   type: string  (CHORD_TYPES name)
 * }
 */

let song = createDefaultSong();

function clampInt(value, fallback, min, max) {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function normalizeChord(rawChord) {
  const chord = rawChord || {};
  return {
    id: chord.id || makeId(),
    root: clampInt(chord.root, 0, 0, 11),
    type: CHORD_TYPES.some(t => t.name === chord.type) ? chord.type : 'maj',
    beats: clampInt(chord.beats, 4, 1, 64),
  };
}

function normalizeSection(rawSection, fallbackType = 'Custom') {
  const section = rawSection || {};
  const type = SECTION_TYPES.includes(section.type) ? section.type : fallbackType;
  return {
    id: section.id || makeId(),
    type,
    name: section.name || type,
    scaleRoot: clampInt(section.scaleRoot, 0, 0, 11),
    scaleType: SCALES.some(s => s.name === section.scaleType) ? section.scaleType : 'Major',
    crashOnStart: Boolean(section.crashOnStart),
    rollAtEnd: Boolean(section.rollAtEnd),
    chords: (Array.isArray(section.chords) ? section.chords : []).map(normalizeChord),
  };
}

function normalizeSong(rawSong) {
  const base = createDefaultSong();
  const parsed = rawSong || {};
  const sections = (Array.isArray(parsed.sections) ? parsed.sections : base.sections).map(s => normalizeSection(s, s?.type));
  if (sections.length === 0) sections.push(createSection('Verse'));
  const selectedSectionExists = sections.some(s => s.id === parsed.selectedSectionId);
  return {
    title: typeof parsed.title === 'string' ? parsed.title : base.title,
    bpm: clampInt(parsed.bpm, base.bpm, 40, 300),
    playbackMode: PLAYBACK_MODES.includes(parsed.playbackMode) ? parsed.playbackMode : base.playbackMode,
    selectedSectionId: selectedSectionExists ? parsed.selectedSectionId : sections[0].id,
    chordSound: CHORD_SOUND_PRESETS.some(p => p.id === parsed.chordSound) ? parsed.chordSound : base.chordSound,
    bassEnabled: parsed.bassEnabled === undefined ? base.bassEnabled : Boolean(parsed.bassEnabled),
    bassSound: BASS_SOUND_PRESETS.some(p => p.id === parsed.bassSound) ? parsed.bassSound : base.bassSound,
    sections,
  };
}

// =====================================================================
// MUSIC THEORY HELPERS
// =====================================================================

function noteName(semitone) {
  return NOTES[((semitone % 12) + 12) % 12];
}

function getScaleNotes(rootSemitone, scaleName) {
  const scale = SCALES.find(s => s.name === scaleName);
  if (!scale) return [];
  return scale.intervals.map(interval => noteName(rootSemitone + interval));
}

function chordTypeObj(typeName) {
  return CHORD_TYPES.find(c => c.name === typeName) || CHORD_TYPES[0];
}

// =====================================================================
// SONG MUTATIONS  (all call saveSong + render)
// =====================================================================

function addSection(type) {
  const section = createSection(type);
  song.sections.push(section);
  if (!song.selectedSectionId) song.selectedSectionId = section.id;
  saveSong();
  render();
}

function removeSection(id) {
  if (song.sections.length <= 1) {
    alert('Cannot remove the only remaining section.');
    return;
  }
  song.sections = song.sections.filter(s => s.id !== id);
  if (song.selectedSectionId === id) {
    song.selectedSectionId = song.sections[0]?.id || null;
  }
  saveSong();
  render();
}

function moveSectionUp(id) {
  const i = song.sections.findIndex(s => s.id === id);
  if (i <= 0) return;
  [song.sections[i - 1], song.sections[i]] = [song.sections[i], song.sections[i - 1]];
  saveSong();
  render();
}

function moveSectionDown(id) {
  const i = song.sections.findIndex(s => s.id === id);
  if (i < 0 || i >= song.sections.length - 1) return;
  [song.sections[i], song.sections[i + 1]] = [song.sections[i + 1], song.sections[i]];
  saveSong();
  render();
}

function updateSectionName(id, name) {
  const s = song.sections.find(s => s.id === id);
  if (s) s.name = name;
  saveSong();
  // no full re-render needed; only the input changed
}

function updateSectionScale(id, root, type) {
  const s = song.sections.find(s => s.id === id);
  if (!s) return;
  if (root !== null) s.scaleRoot = parseInt(root, 10);
  if (type !== null) s.scaleType = type;
  saveSong();
  renderScaleDisplay(id);
}

function updateSectionOptions(id, { crashOnStart, rollAtEnd }) {
  const s = song.sections.find(s => s.id === id);
  if (!s) return;
  if (typeof crashOnStart === 'boolean') s.crashOnStart = crashOnStart;
  if (typeof rollAtEnd === 'boolean') s.rollAtEnd = rollAtEnd;
  saveSong();
}

function selectEditSection(sectionId) {
  if (!song.sections.some(s => s.id === sectionId)) return;
  song.selectedSectionId = sectionId;
  saveSong();
  updatePlaybackModeUI();
  if (isBeating && song.playbackMode === 'edit') initializePlaybackCursor();
}

function setPlaybackMode(mode) {
  if (!PLAYBACK_MODES.includes(mode)) return;
  song.playbackMode = mode;
  saveSong();
  updatePlaybackModeUI();
  if (isBeating) initializePlaybackCursor();
}

function setChordSound(soundId) {
  if (!CHORD_SOUND_PRESETS.some(p => p.id === soundId)) return;
  song.chordSound = soundId;
  saveSong();
}

function setBassEnabled(enabled) {
  song.bassEnabled = Boolean(enabled);
  saveSong();
}

function setBassSound(soundId) {
  if (!BASS_SOUND_PRESETS.some(p => p.id === soundId)) return;
  song.bassSound = soundId;
  saveSong();
}

function addChord(sectionId) {
  const s = song.sections.find(s => s.id === sectionId);
  if (!s) return;
  s.chords.push({ id: makeId(), root: 0, type: 'maj', beats: 4 });
  saveSong();
  render();
}

function removeChord(sectionId, chordId) {
  const s = song.sections.find(s => s.id === sectionId);
  if (!s) return;
  s.chords = s.chords.filter(c => c.id !== chordId);
  saveSong();
  render();
}

function mutateChord(sectionId, chordId, fn) {
  const s = song.sections.find(s => s.id === sectionId);
  if (!s) return;
  const c = s.chords.find(c => c.id === chordId);
  if (!c) return;
  fn(c);
  saveSong();
  updateChordCard(sectionId, chordId);
}

function updateChordBeats(sectionId, chordId, rawBeats) {
  mutateChord(sectionId, chordId, c => { c.beats = clampInt(rawBeats, c.beats || 4, 1, 64); });
  updateSongGoToControl();
  if (isBeating) initializePlaybackCursor();
}

function noteUp(sectionId, chordId) {
  mutateChord(sectionId, chordId, c => { c.root = (c.root + 1) % 12; });
}

function noteDown(sectionId, chordId) {
  mutateChord(sectionId, chordId, c => { c.root = (c.root + 11) % 12; });
}

function varUp(sectionId, chordId) {
  mutateChord(sectionId, chordId, c => {
    const idx = CHORD_TYPES.findIndex(t => t.name === c.type);
    c.type = CHORD_TYPES[(idx + 1) % CHORD_TYPES.length].name;
  });
}

function varDown(sectionId, chordId) {
  mutateChord(sectionId, chordId, c => {
    const idx = CHORD_TYPES.findIndex(t => t.name === c.type);
    c.type = CHORD_TYPES[(idx + CHORD_TYPES.length - 1) % CHORD_TYPES.length].name;
  });
}

function transposeChordUp(sectionId, chordId) {
  mutateChord(sectionId, chordId, c => { c.root = (c.root + 1) % 12; });
}

function transposeChordDown(sectionId, chordId) {
  mutateChord(sectionId, chordId, c => { c.root = (c.root + 11) % 12; });
}

/** Transpose the whole song (all chord roots + all section scale roots). */
function transposeSong(steps) {
  const s = ((steps % 12) + 12) % 12;
  song.sections.forEach(section => {
    section.scaleRoot = (section.scaleRoot + s) % 12;
    section.chords.forEach(chord => {
      chord.root = (chord.root + s) % 12;
    });
  });
  saveSong();
  render();
}

function updateBpm(raw) {
  const val = Math.min(300, Math.max(40, parseInt(raw, 10) || 100));
  song.bpm = val;
  const el = document.getElementById('bpm-input');
  if (el && parseInt(el.value, 10) !== val) el.value = val;
  saveSong();
}

// =====================================================================
// PERSISTENCE – localStorage + JSON export/import
// =====================================================================

const STORAGE_KEY = 'chordz_song_v1';

function saveSong() {
  const titleEl = document.getElementById('song-title');
  if (titleEl) song.title = titleEl.value || song.title;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(song));
  } catch (_) { /* quota exceeded – silently ignore */ }
}

function loadSong() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Basic sanity check
      if (parsed && Array.isArray(parsed.sections)) {
        song = normalizeSong(parsed);
        return true;
      }
    }
  } catch (_) { /* corrupt data – start fresh */ }
  return false;
}

function resetSong() {
  if (!confirm('Clear the current song and start fresh?')) return;
  localStorage.removeItem(STORAGE_KEY);
  song = normalizeSong(createDefaultSong());
  render();
}

function exportJSON() {
  saveSong();
  const json = JSON.stringify(song, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = sanitizeFilename(song.title || 'song') + '.chordz.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importJSON() {
  const input    = document.createElement('input');
  input.type     = 'file';
  input.accept   = 'application/json,.json';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!parsed || !Array.isArray(parsed.sections)) throw new Error('Invalid song file.');
        song = normalizeSong(parsed);
        saveSong();
        render();
      } catch (err) {
        alert('Import failed: ' + err.message);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function sanitizeFilename(str) {
  return str.replace(/[^a-z0-9_\-]/gi, '_').toLowerCase().replace(/__+/g, '_').slice(0, 60) || 'song';
}

// =====================================================================
// AUDIO – Web Audio API beat scheduler + chord audition
// =====================================================================

let audioCtx      = null;
let schedulerTimer = null;
let nextNoteTime   = 0;
let currentStep    = 0;
let isBeating      = false;
let songEndedPending = false;
let playbackCursor = {
  sectionIndex: 0,
  chordIndex: 0,
  beatInChord: 0,
  beatInSection: 0,
  songBeatIndex: 0,
};

const STEPS          = 16;    // 16th-note steps per bar
const LOOKAHEAD_MS   = 25;    // scheduler poll interval
const SCHEDULE_AHEAD = 0.1;   // seconds to schedule ahead

/**
 * Beat pattern (16 steps = 1 bar).
 * kick:  beats 1 and 3 (steps 0, 8)
 * snare: beats 2 and 4 (steps 4, 12)
 * hihat: every 8th note  (steps 0,2,4,6,8,10,12,14)
 */
const BEAT_PATTERN = {
  kick:  [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
  snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
  hihat: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
};

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

/* --- Drum synths --- */

function playKick(time) {
  const ctx  = getAudioCtx();
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.setValueAtTime(120, time);
  osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.45);
  gain.gain.setValueAtTime(1.2, time);
  gain.gain.exponentialRampToValueAtTime(0.01, time + 0.45);
  osc.start(time);
  osc.stop(time + 0.45);
}

function playSnare(time) {
  const ctx = getAudioCtx();
  const dur = 0.14;

  // White-noise burst
  const bufLen = Math.floor(ctx.sampleRate * dur);
  const buf    = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data   = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

  const noise      = ctx.createBufferSource();
  noise.buffer     = buf;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type  = 'highpass';
  noiseFilter.frequency.value = 1200;
  const noiseGain  = ctx.createGain();
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noiseGain.gain.setValueAtTime(0.75, time);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, time + dur);
  noise.start(time);
  noise.stop(time + dur);

  // Low-tone thud
  const osc     = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type      = 'triangle';
  osc.connect(oscGain);
  oscGain.connect(ctx.destination);
  osc.frequency.setValueAtTime(190, time);
  osc.frequency.exponentialRampToValueAtTime(80, time + 0.08);
  oscGain.gain.setValueAtTime(0.5, time);
  oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.08);
  osc.start(time);
  osc.stop(time + 0.08);
}

function playHiHat(time) {
  const ctx  = getAudioCtx();
  const dur  = 0.04;
  const bufLen = Math.floor(ctx.sampleRate * dur);
  const buf    = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data   = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
  const noise  = ctx.createBufferSource();
  noise.buffer = buf;
  const filt   = ctx.createBiquadFilter();
  filt.type    = 'highpass';
  filt.frequency.value = 7000;
  const gain   = ctx.createGain();
  noise.connect(filt);
  filt.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.22, time);
  gain.gain.exponentialRampToValueAtTime(0.01, time + dur);
  noise.start(time);
  noise.stop(time + dur);
}

function scheduleStep(step, time) {
  if (BEAT_PATTERN.kick[step])  playKick(time);
  if (BEAT_PATTERN.snare[step]) playSnare(time);
  if (BEAT_PATTERN.hihat[step]) playHiHat(time);
}

function playCrash(time) {
  const ctx = getAudioCtx();
  const dur = 0.8;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - (i / len) * 0.3);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 3500;
  const gain = ctx.createGain();
  src.connect(hp);
  hp.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.55, time);
  gain.gain.exponentialRampToValueAtTime(0.01, time + dur);
  src.start(time);
  src.stop(time + dur);
}

function playRoll(time) {
  const hitSpacing = 0.06;
  for (let i = 0; i < 6; i++) playSnare(time + i * hitSpacing);
}

function frequencyFromMidi(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function playTone(freq, time, preset, role = 'chord') {
  const ctx = getAudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  let attack = 0.01;
  let hold = 0.6;
  let sustain = 0.12;
  let release = 0.32;
  let volume = role === 'bass' ? 0.18 : 0.14;
  osc.type = 'triangle';
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(role === 'bass' ? 900 : 1800, time);

  if (preset === 'pad') {
    osc.type = 'sawtooth';
    attack = 0.08; hold = 0.9; sustain = 0.1; release = 0.5; volume = 0.09;
    filter.frequency.setValueAtTime(1200, time);
  } else if (preset === 'organ') {
    osc.type = 'square';
    attack = 0.008; hold = 0.65; sustain = 0.11; release = 0.2; volume = 0.11;
    filter.frequency.setValueAtTime(2400, time);
  } else if (preset === 'pluck') {
    osc.type = 'triangle';
    attack = 0.005; hold = 0.2; sustain = 0.05; release = 0.18; volume = 0.14;
    filter.frequency.setValueAtTime(2200, time);
  } else if (preset === 'squareBass') {
    osc.type = 'square';
    attack = 0.008; hold = 0.28; sustain = 0.09; release = 0.18; volume = 0.2;
    filter.frequency.setValueAtTime(500, time);
  } else if (preset === 'sawBass') {
    osc.type = 'sawtooth';
    attack = 0.01; hold = 0.35; sustain = 0.09; release = 0.22; volume = 0.17;
    filter.frequency.setValueAtTime(420, time);
  } else if (preset === 'sineBass') {
    osc.type = 'sine';
    attack = 0.01; hold = 0.32; sustain = 0.08; release = 0.18; volume = 0.22;
    filter.frequency.setValueAtTime(350, time);
  }

  const end = time + attack + hold + release;
  osc.frequency.setValueAtTime(freq, time);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(volume, time + attack);
  gain.gain.setValueAtTime(sustain, time + attack + hold);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + attack + hold + release);
  osc.start(time);
  osc.stop(end);
}

function playChordNotes(rootSemitone, typeName, when) {
  const ctype = chordTypeObj(typeName);
  const rootMidi = 60 + rootSemitone;
  ctype.intervals.forEach(interval => {
    playTone(frequencyFromMidi(rootMidi + interval), when, song.chordSound || 'piano', 'chord');
  });
}

function playBassNote(rootSemitone, when) {
  const bassMidi = 36 + rootSemitone;
  playTone(frequencyFromMidi(bassMidi), when, song.bassSound || 'sineBass', 'bass');
}

function getSectionBeatLength(section) {
  return section.chords.reduce((sum, c) => sum + (c.beats || 4), 0);
}

function buildSongBeatMap() {
  const map = [];
  song.sections.forEach((section, sectionIndex) => {
    section.chords.forEach((chord, chordIndex) => {
      const beats = chord.beats || 4;
      for (let beatInChord = 0; beatInChord < beats; beatInChord++) {
        map.push({ sectionIndex, chordIndex, beatInChord });
      }
    });
  });
  return map;
}

function updateSongGoToControl() {
  const slider = document.getElementById('song-go-to');
  if (!slider) return;
  const map = buildSongBeatMap();
  slider.max = Math.max(map.length - 1, 0);
  slider.value = Math.min(parseInt(slider.value || '0', 10), parseInt(slider.max, 10));
}

function formatPlaybackPosition(sectionIndex, chordIndex, beatInChord) {
  const section = song.sections[sectionIndex];
  if (!section) return 'Position: —';
  const chord = section.chords[chordIndex];
  if (!chord) return `Position: ${section.name} • (no chords)`;
  return `Position: ${section.name} • ${noteName(chord.root)}${chord.type} • beat ${beatInChord + 1}/${chord.beats || 4}`;
}

function updatePlaybackPositionUI(sectionIndex, chordIndex, beatInChord, songBeatIndex) {
  const positionEl = document.getElementById('playback-position');
  if (positionEl) positionEl.textContent = formatPlaybackPosition(sectionIndex, chordIndex, beatInChord);
  const slider = document.getElementById('song-go-to');
  if (slider && song.playbackMode === 'song') slider.value = String(songBeatIndex);
  const label = document.getElementById('song-go-to-label');
  if (label) {
    const section = song.sections[sectionIndex];
    const chord = section?.chords[chordIndex];
    if (section && chord) {
      label.textContent = `${section.name} → ${noteName(chord.root)}${chord.type} (beat ${beatInChord + 1})`;
    } else if (section) {
      label.textContent = `${section.name} → rest`;
    } else {
      label.textContent = 'Start';
    }
  }
}

function setSongPositionFromSlider(rawValue) {
  const map = buildSongBeatMap();
  if (!map.length) return;
  const idx = Math.max(0, Math.min(map.length - 1, clampInt(rawValue, 0, 0, map.length - 1)));
  const point = map[idx];
  playbackCursor.sectionIndex = point.sectionIndex;
  playbackCursor.chordIndex = point.chordIndex;
  playbackCursor.beatInChord = point.beatInChord;
  const section = song.sections[point.sectionIndex];
  let sectionOffset = 0;
  for (let i = 0; i < point.chordIndex; i++) sectionOffset += section.chords[i].beats || 4;
  playbackCursor.beatInSection = sectionOffset + point.beatInChord;
  playbackCursor.songBeatIndex = idx;
  updatePlaybackPositionUI(playbackCursor.sectionIndex, playbackCursor.chordIndex, playbackCursor.beatInChord, playbackCursor.songBeatIndex);
}

function initializePlaybackCursor() {
  const mode = song.playbackMode || 'edit';
  if (mode === 'song') {
    setSongPositionFromSlider(document.getElementById('song-go-to')?.value || 0);
    return;
  }
  let idx = song.sections.findIndex(s => s.id === song.selectedSectionId);
  if (idx < 0) idx = 0;
  playbackCursor.sectionIndex = idx;
  playbackCursor.chordIndex = 0;
  playbackCursor.beatInChord = 0;
  playbackCursor.beatInSection = 0;
  playbackCursor.songBeatIndex = 0;
  updatePlaybackPositionUI(playbackCursor.sectionIndex, 0, 0, 0);
}

function advancePlaybackCursor() {
  const mode = song.playbackMode || 'edit';
  const section = song.sections[playbackCursor.sectionIndex];
  if (!section) return;
  const chord = section.chords[playbackCursor.chordIndex];
  if (!chord) return;

  playbackCursor.beatInChord += 1;
  playbackCursor.beatInSection += 1;
  if (mode === 'song') playbackCursor.songBeatIndex += 1;

  if (playbackCursor.beatInChord >= (chord.beats || 4)) {
    playbackCursor.beatInChord = 0;
    playbackCursor.chordIndex += 1;
  }

  if (playbackCursor.chordIndex >= section.chords.length) {
    if (mode === 'edit') {
      playbackCursor.chordIndex = 0;
      playbackCursor.beatInChord = 0;
      playbackCursor.beatInSection = 0;
      return;
    }
    playbackCursor.sectionIndex += 1;
    playbackCursor.chordIndex = 0;
    playbackCursor.beatInChord = 0;
    playbackCursor.beatInSection = 0;
    if (playbackCursor.sectionIndex >= song.sections.length) {
      playbackCursor.sectionIndex = song.sections.length - 1;
      songEndedPending = true;
    }
  }
}

function scheduleMusicalBeat(time) {
  if (!song.sections.length) return;
  const section = song.sections[playbackCursor.sectionIndex];
  if (!section) return;
  if (!section.chords.length) {
    updatePlaybackPositionUI(playbackCursor.sectionIndex, 0, 0, playbackCursor.songBeatIndex);
    if ((song.playbackMode || 'edit') === 'song') {
      playbackCursor.sectionIndex += 1;
      playbackCursor.chordIndex = 0;
      playbackCursor.beatInChord = 0;
      playbackCursor.beatInSection = 0;
      if (playbackCursor.sectionIndex >= song.sections.length) {
        playbackCursor.sectionIndex = song.sections.length - 1;
        songEndedPending = true;
      }
    }
    return;
  }
  const chord = section.chords[playbackCursor.chordIndex];
  if (!chord) return;

  if (playbackCursor.beatInSection === 0 && section.crashOnStart) playCrash(time);
  if (playbackCursor.beatInChord === 0) {
    playChordNotes(chord.root, chord.type, time);
    if (song.bassEnabled) playBassNote(chord.root, time);
  }

  const sectionBeats = getSectionBeatLength(section);
  if (section.rollAtEnd && playbackCursor.beatInSection === sectionBeats - 1) {
    playRoll(time);
  }

  updatePlaybackPositionUI(playbackCursor.sectionIndex, playbackCursor.chordIndex, playbackCursor.beatInChord, playbackCursor.songBeatIndex);
  advancePlaybackCursor();

  if (songEndedPending) {
    songEndedPending = false;
    const delay = Math.max(0, (time - getAudioCtx().currentTime) * 1000);
    setTimeout(() => {
      stopBeat();
      stopIndicatorFlash();
      const pos = document.getElementById('playback-position');
      if (pos) pos.textContent += ' • End';
    }, delay + 20);
  }
}

function scheduler() {
  const ctx = getAudioCtx();
  while (nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD) {
    scheduleStep(currentStep, nextNoteTime);
    if (currentStep % 4 === 0 && isBeating) scheduleMusicalBeat(nextNoteTime);
    const secPerSixteenth = (60.0 / song.bpm) / 4;
    nextNoteTime += secPerSixteenth;
    currentStep   = (currentStep + 1) % STEPS;
  }
  schedulerTimer = setTimeout(scheduler, LOOKAHEAD_MS);
}

function startBeat() {
  if (isBeating) stopBeat();
  isBeating    = true;
  songEndedPending = false;
  currentStep  = 0;
  initializePlaybackCursor();
  nextNoteTime = getAudioCtx().currentTime + 0.05;
  scheduler();
  document.getElementById('beat-start').disabled = true;
  document.getElementById('beat-stop').disabled  = false;
  document.getElementById('beat-indicator').classList.add('playing');
}

function stopBeat() {
  isBeating = false;
  if (schedulerTimer !== null) { clearTimeout(schedulerTimer); schedulerTimer = null; }
  document.getElementById('beat-start').disabled = false;
  document.getElementById('beat-stop').disabled  = true;
  document.getElementById('beat-indicator').classList.remove('playing');
}

/** Audition a chord as an arpeggiated chord using the selected chord sound. */
function auditionChord(rootSemitone, typeName) {
  const ctype = chordTypeObj(typeName);
  const rootMidi = 60 + rootSemitone; // C4 base

  ctype.intervals.forEach((interval, i) => {
    const t = getAudioCtx().currentTime + i * 0.06;
    playTone(frequencyFromMidi(rootMidi + interval), t, song.chordSound || 'piano', 'chord');
  });
}

// =====================================================================
// RENDER
// =====================================================================

function render() {
  song = normalizeSong(song);

  // Title
  const titleEl = document.getElementById('song-title');
  if (titleEl) titleEl.value = song.title || '';

  // BPM
  const bpmEl = document.getElementById('bpm-input');
  if (bpmEl) bpmEl.value = song.bpm || 100;

  const modeEl = document.getElementById('playback-mode-select');
  if (modeEl) modeEl.value = song.playbackMode || 'edit';

  const chordSoundEl = document.getElementById('chord-sound-select');
  if (chordSoundEl && chordSoundEl.options.length === 0) {
    CHORD_SOUND_PRESETS.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.label;
      chordSoundEl.appendChild(opt);
    });
  }
  if (chordSoundEl) chordSoundEl.value = song.chordSound || 'piano';

  const bassSoundEl = document.getElementById('bass-sound-select');
  if (bassSoundEl && bassSoundEl.options.length === 0) {
    BASS_SOUND_PRESETS.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.label;
      bassSoundEl.appendChild(opt);
    });
  }
  if (bassSoundEl) bassSoundEl.value = song.bassSound || 'sineBass';

  const bassEnabledEl = document.getElementById('bass-enabled');
  if (bassEnabledEl) bassEnabledEl.checked = Boolean(song.bassEnabled);

  // Sections
  const container = document.getElementById('sections-container');
  if (!container) return;
  container.innerHTML = '';
  song.sections.forEach(section => container.appendChild(buildSection(section)));
  updateSongGoToControl();
  updatePlaybackModeUI();
  initializePlaybackCursor();
}

function updatePlaybackModeUI() {
  const isEdit = (song.playbackMode || 'edit') === 'edit';
  document.querySelectorAll('.section-play-select').forEach(el => {
    el.style.display = isEdit ? 'inline-flex' : 'none';
  });
  const editHelp = document.getElementById('playback-help-edit');
  const songHelp = document.getElementById('playback-help-song');
  if (editHelp) editHelp.style.display = isEdit ? 'block' : 'none';
  if (songHelp) songHelp.style.display = isEdit ? 'none' : 'block';
  const slider = document.getElementById('song-go-to');
  if (slider) slider.disabled = isEdit;
}

/** Partial re-render: update only the scale notes display for one section. */
function renderScaleDisplay(sectionId) {
  const s = song.sections.find(s => s.id === sectionId);
  if (!s) return;
  const el = document.getElementById('scale-notes-' + sectionId);
  if (el) el.textContent = getScaleNotes(s.scaleRoot, s.scaleType).join('  ');
}

/** Partial re-render: update only the note/type labels on one chord card. */
function updateChordCard(sectionId, chordId) {
  const s = song.sections.find(s => s.id === sectionId);
  if (!s) return;
  const c = s.chords.find(c => c.id === chordId);
  if (!c) return;
  const rootEl = document.getElementById('root-' + chordId);
  const qualEl = document.getElementById('qual-' + chordId);
  const beatsEl = document.getElementById('beats-' + chordId);
  if (rootEl) rootEl.textContent = noteName(c.root);
  if (qualEl) {
    qualEl.textContent = c.type;
    qualEl.title       = chordTypeObj(c.type).label;
  }
  if (beatsEl) beatsEl.value = c.beats || 4;
}

// ----- Section builder -----------------------------------------------

function buildSection(section) {
  const div = document.createElement('div');
  div.className  = 'section';
  div.dataset.id = section.id;
  div.dataset.type = section.type;

  div.appendChild(buildSectionHeader(section));
  div.appendChild(buildScaleRow(section));
  div.appendChild(buildSectionOptionsRow(section));
  div.appendChild(buildChordsArea(section));
  return div;
}

function buildSectionHeader(section) {
  const header = document.createElement('div');
  header.className = 'section-header';

  // Type badge
  const badge = document.createElement('span');
  badge.className   = 'section-type-badge';
  badge.textContent = section.type;

  // Editable name
  const nameInput = document.createElement('input');
  nameInput.className   = 'section-name-input';
  nameInput.type        = 'text';
  nameInput.value       = section.name || section.type;
  nameInput.placeholder = 'Section name…';
  nameInput.setAttribute('aria-label', 'Section name');
  nameInput.addEventListener('input', () => updateSectionName(section.id, nameInput.value));

  const playSelect = document.createElement('label');
  playSelect.className = 'section-play-select';
  const radio = document.createElement('input');
  radio.type = 'radio';
  radio.name = 'edit-play-section';
  radio.value = section.id;
  radio.checked = song.selectedSectionId === section.id;
  radio.addEventListener('change', () => selectEditSection(section.id));
  const radioText = document.createElement('span');
  radioText.textContent = 'Edit play';
  playSelect.append(radio, radioText);

  // Action buttons
  const actions = document.createElement('div');
  actions.className = 'section-header-actions';

  const upBtn = makeIconBtn('↑', 'Move section up',   () => moveSectionUp(section.id));
  const dnBtn = makeIconBtn('↓', 'Move section down', () => moveSectionDown(section.id));
  const rmBtn = makeIconBtn('✕', 'Remove section',    () => removeSection(section.id));
  rmBtn.classList.add('danger');
  actions.append(upBtn, dnBtn, rmBtn);

  header.append(badge, playSelect, nameInput, actions);
  return header;
}

function buildScaleRow(section) {
  const row = document.createElement('div');
  row.className = 'scale-row';

  const lbl = document.createElement('label');
  lbl.textContent = 'Scale:';

  const rootSel = document.createElement('select');
  rootSel.className = 'scale-root-select';
  rootSel.setAttribute('aria-label', 'Scale root note');
  NOTES.forEach((n, idx) => {
    const opt   = document.createElement('option');
    opt.value   = idx;
    opt.textContent = n;
    if (idx === section.scaleRoot) opt.selected = true;
    rootSel.appendChild(opt);
  });
  rootSel.addEventListener('change', () => updateSectionScale(section.id, rootSel.value, null));

  const typeSel = document.createElement('select');
  typeSel.className = 'scale-type-select';
  typeSel.setAttribute('aria-label', 'Scale type');
  SCALES.forEach(sc => {
    const opt   = document.createElement('option');
    opt.value   = sc.name;
    opt.textContent = sc.name;
    if (sc.name === section.scaleType) opt.selected = true;
    typeSel.appendChild(opt);
  });
  typeSel.addEventListener('change', () => updateSectionScale(section.id, null, typeSel.value));

  const notes = document.createElement('span');
  notes.className   = 'scale-notes';
  notes.id          = 'scale-notes-' + section.id;
  notes.textContent = getScaleNotes(section.scaleRoot, section.scaleType).join('  ');

  row.append(lbl, rootSel, typeSel, notes);
  return row;
}

function buildSectionOptionsRow(section) {
  const row = document.createElement('div');
  row.className = 'section-options-row';

  const crashLabel = document.createElement('label');
  crashLabel.className = 'checkbox-inline';
  const crashCb = document.createElement('input');
  crashCb.type = 'checkbox';
  crashCb.checked = Boolean(section.crashOnStart);
  crashCb.addEventListener('change', () => updateSectionOptions(section.id, { crashOnStart: crashCb.checked }));
  crashLabel.append(crashCb, document.createTextNode('Crash at start'));

  const rollLabel = document.createElement('label');
  rollLabel.className = 'checkbox-inline';
  const rollCb = document.createElement('input');
  rollCb.type = 'checkbox';
  rollCb.checked = Boolean(section.rollAtEnd);
  rollCb.addEventListener('change', () => updateSectionOptions(section.id, { rollAtEnd: rollCb.checked }));
  rollLabel.append(rollCb, document.createTextNode('Roll at end'));

  row.append(crashLabel, rollLabel);
  return row;
}

function buildChordsArea(section) {
  const area = document.createElement('div');
  area.className = 'chords-area';

  section.chords.forEach(chord => area.appendChild(buildChordCard(chord, section.id)));

  const addBtn = document.createElement('button');
  addBtn.className   = 'add-chord-btn';
  addBtn.textContent = '+ Add Chord';
  addBtn.addEventListener('click', () => addChord(section.id));
  area.appendChild(addBtn);

  return area;
}

// ----- Chord card builder --------------------------------------------

function buildChordCard(chord, sectionId) {
  const card = document.createElement('div');
  card.className    = 'chord-card';
  card.setAttribute('aria-label', noteName(chord.root) + chord.type + ' chord');

  // Root note (large display)
  const rootEl = document.createElement('div');
  rootEl.className   = 'chord-root';
  rootEl.id          = 'root-' + chord.id;
  rootEl.textContent = noteName(chord.root);

  // Chord quality
  const qualEl = document.createElement('div');
  qualEl.className   = 'chord-qual';
  qualEl.id          = 'qual-' + chord.id;
  qualEl.textContent = chord.type;
  qualEl.title       = chordTypeObj(chord.type).label;

  const div1 = document.createElement('div');
  div1.className = 'chord-divider';

  // Note ↑↓ row
  const noteRow = buildCtrlRow(
    'Note',
    () => noteUp(sectionId, chord.id),
    () => noteDown(sectionId, chord.id),
    'Root note up', 'Root note down'
  );

  // Type ↑↓ row
  const typeRow = buildCtrlRow(
    'Type',
    () => varUp(sectionId, chord.id),
    () => varDown(sectionId, chord.id),
    'Chord type up', 'Chord type down'
  );

  // Transpose ↑↓ row
  const xposeRow = buildCtrlRow(
    'Xpose',
    () => transposeChordUp(sectionId, chord.id),
    () => transposeChordDown(sectionId, chord.id),
    'Transpose up', 'Transpose down'
  );

  const div2 = document.createElement('div');
  div2.className = 'chord-divider';

  const beatsRow = document.createElement('div');
  beatsRow.className = 'beats-row';
  const beatsLabel = document.createElement('label');
  beatsLabel.textContent = 'Beats';
  beatsLabel.setAttribute('for', 'beats-' + chord.id);
  const beatsInput = document.createElement('input');
  beatsInput.id = 'beats-' + chord.id;
  beatsInput.className = 'beats-input';
  beatsInput.type = 'number';
  beatsInput.min = '1';
  beatsInput.max = '64';
  beatsInput.step = '1';
  beatsInput.value = chord.beats || 4;
  beatsInput.setAttribute('aria-label', 'Chord beats');
  beatsInput.addEventListener('change', () => updateChordBeats(sectionId, chord.id, beatsInput.value));
  beatsInput.addEventListener('input', () => updateChordBeats(sectionId, chord.id, beatsInput.value));
  beatsRow.append(beatsLabel, beatsInput);

  // Action bar: audition + remove
  const actionBar = document.createElement('div');
  actionBar.className = 'chord-action-bar';

  const audBtn = document.createElement('button');
  audBtn.className   = 'audition-btn';
  audBtn.textContent = '♫';
  audBtn.title       = 'Play chord';
  audBtn.setAttribute('aria-label', 'Play chord');
  audBtn.addEventListener('click', () => auditionChord(chord.root, chord.type));

  const rmBtn = document.createElement('button');
  rmBtn.className   = 'remove-chord-btn';
  rmBtn.textContent = '✕';
  rmBtn.title       = 'Remove chord';
  rmBtn.setAttribute('aria-label', 'Remove chord');
  rmBtn.addEventListener('click', () => removeChord(sectionId, chord.id));

  actionBar.append(audBtn, rmBtn);

  card.append(rootEl, qualEl, div1, noteRow, typeRow, xposeRow, div2, beatsRow, actionBar);
  return card;
}

/** Build a label + ▲ + ▼ control row. */
function buildCtrlRow(labelText, onUp, onDown, upTitle, downTitle) {
  const row = document.createElement('div');
  row.className = 'ctrl-row';

  const lbl = document.createElement('span');
  lbl.className   = 'ctrl-row-label';
  lbl.textContent = labelText;

  const upBtn = document.createElement('button');
  upBtn.className   = 'arrow-btn';
  upBtn.textContent = '▲';
  upBtn.title       = upTitle;
  upBtn.setAttribute('aria-label', upTitle);
  upBtn.addEventListener('click', onUp);

  const downBtn = document.createElement('button');
  downBtn.className   = 'arrow-btn';
  downBtn.textContent = '▼';
  downBtn.title       = downTitle;
  downBtn.setAttribute('aria-label', downTitle);
  downBtn.addEventListener('click', onDown);

  row.append(lbl, upBtn, downBtn);
  return row;
}

/** Small icon button helper. */
function makeIconBtn(text, title, onClick) {
  const btn = document.createElement('button');
  btn.className   = 'icon-btn';
  btn.textContent = text;
  btn.title       = title;
  btn.setAttribute('aria-label', title);
  btn.addEventListener('click', onClick);
  return btn;
}

// =====================================================================
// BEAT INDICATOR FLASH  (visual pulse on every kick step)
// =====================================================================

let _flashInterval = null;

function startIndicatorFlash() {
  const secPerSixteenth = () => (60.0 / song.bpm) / 4;
  _flashInterval = setInterval(() => {
    if (!isBeating) return;
    const ind = document.getElementById('beat-indicator');
    if (!ind) return;
    ind.classList.add('flash');
    setTimeout(() => ind.classList.remove('flash'), 60);
  }, secPerSixteenth() * 1000 * 4); // flash on each beat
}

function stopIndicatorFlash() {
  if (_flashInterval !== null) { clearInterval(_flashInterval); _flashInterval = null; }
}

// =====================================================================
// EVENT LISTENERS & BOOT
// =====================================================================

document.addEventListener('DOMContentLoaded', () => {

  // ----- Load saved song or use defaults ---------------------------
  loadSong();
  song = normalizeSong(song);
  render();

  // ----- Song title ------------------------------------------------
  document.getElementById('song-title').addEventListener('input', saveSong);

  // ----- BPM -------------------------------------------------------
  const bpmInput = document.getElementById('bpm-input');
  bpmInput.addEventListener('change', e  => updateBpm(e.target.value));
  bpmInput.addEventListener('input',  e  => updateBpm(e.target.value));
  document.getElementById('bpm-down').addEventListener('click', () => updateBpm(song.bpm - 5));
  document.getElementById('bpm-up').addEventListener('click',   () => updateBpm(song.bpm + 5));

  // ----- Playback mode / sounds / bass -----------------------------
  document.getElementById('playback-mode-select').addEventListener('change', e => setPlaybackMode(e.target.value));
  document.getElementById('chord-sound-select').addEventListener('change', e => setChordSound(e.target.value));
  document.getElementById('bass-sound-select').addEventListener('change', e => setBassSound(e.target.value));
  document.getElementById('bass-enabled').addEventListener('change', e => setBassEnabled(e.target.checked));
  document.getElementById('song-go-to').addEventListener('input', e => {
    setSongPositionFromSlider(e.target.value);
    if (isBeating && song.playbackMode === 'song') initializePlaybackCursor();
  });

  // ----- Beat controls ---------------------------------------------
  document.getElementById('beat-start').addEventListener('click', () => {
    startBeat();
    startIndicatorFlash();
  });
  document.getElementById('beat-stop').addEventListener('click', () => {
    stopBeat();
    stopIndicatorFlash();
  });

  // ----- Global transpose ------------------------------------------
  document.getElementById('transpose-down').addEventListener('click', () => transposeSong(-1));
  document.getElementById('transpose-up').addEventListener('click',   () => transposeSong(1));

  // ----- Song actions ----------------------------------------------
  document.getElementById('save-btn').addEventListener('click',   () => { saveSong(); showSaved(); });
  document.getElementById('export-btn').addEventListener('click', exportJSON);
  document.getElementById('import-btn').addEventListener('click', importJSON);
  document.getElementById('new-btn').addEventListener('click',    resetSong);

  // ----- Add section -----------------------------------------------
  document.getElementById('add-section-btn').addEventListener('click', () => {
    const type = document.getElementById('section-type-select').value;
    addSection(type);
  });
});

/** Brief visual confirmation that the song was saved. */
function showSaved() {
  const btn = document.getElementById('save-btn');
  const orig = btn.textContent;
  btn.textContent = '✓ Saved';
  btn.disabled = true;
  setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 1200);
}
