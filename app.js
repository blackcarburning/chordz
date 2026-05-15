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
    chords:    defaults.map(c => ({ id: makeId(), root: c.root, type: c.type })),
  };
}

function createDefaultSong() {
  return {
    title:    'Untitled Song',
    bpm:      100,
    sections: [
      createSection('Verse'),
      createSection('Chorus'),
      createSection('Bridge'),
    ],
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
  song.sections.push(createSection(type));
  saveSong();
  render();
}

function removeSection(id) {
  if (song.sections.length <= 1) {
    alert('Cannot remove the only remaining section.');
    return;
  }
  song.sections = song.sections.filter(s => s.id !== id);
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

function addChord(sectionId) {
  const s = song.sections.find(s => s.id === sectionId);
  if (!s) return;
  s.chords.push({ id: makeId(), root: 0, type: 'maj' });
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
        song = parsed;
        return true;
      }
    }
  } catch (_) { /* corrupt data – start fresh */ }
  return false;
}

function resetSong() {
  if (!confirm('Clear the current song and start fresh?')) return;
  localStorage.removeItem(STORAGE_KEY);
  song = createDefaultSong();
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
        song = parsed;
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

function scheduler() {
  const ctx = getAudioCtx();
  while (nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD) {
    scheduleStep(currentStep, nextNoteTime);
    const secPerSixteenth = (60.0 / song.bpm) / 4;
    nextNoteTime += secPerSixteenth;
    currentStep   = (currentStep + 1) % STEPS;
  }
  schedulerTimer = setTimeout(scheduler, LOOKAHEAD_MS);
}

function startBeat() {
  if (isBeating) stopBeat();
  isBeating    = true;
  currentStep  = 0;
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

/** Audition a chord as an arpeggiated triangle-wave chord. */
function auditionChord(rootSemitone, typeName) {
  const ctx   = getAudioCtx();
  const ctype = chordTypeObj(typeName);
  const rootMidi = 60 + rootSemitone; // C4 base

  ctype.intervals.forEach((interval, i) => {
    const midi = rootMidi + interval;
    const freq = 440 * Math.pow(2, (midi - 69) / 12);

    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type   = 'triangle';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);

    const t = ctx.currentTime + i * 0.06;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.14, t + 0.02);
    gain.gain.setValueAtTime(0.14, t + 0.9);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 1.4);
    osc.start(t);
    osc.stop(t + 1.45);
  });
}

// =====================================================================
// RENDER
// =====================================================================

function render() {
  // Title
  const titleEl = document.getElementById('song-title');
  if (titleEl) titleEl.value = song.title || '';

  // BPM
  const bpmEl = document.getElementById('bpm-input');
  if (bpmEl) bpmEl.value = song.bpm || 100;

  // Sections
  const container = document.getElementById('sections-container');
  if (!container) return;
  container.innerHTML = '';
  song.sections.forEach(section => container.appendChild(buildSection(section)));
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
  if (rootEl) rootEl.textContent = noteName(c.root);
  if (qualEl) {
    qualEl.textContent = c.type;
    qualEl.title       = chordTypeObj(c.type).label;
  }
}

// ----- Section builder -----------------------------------------------

function buildSection(section) {
  const div = document.createElement('div');
  div.className  = 'section';
  div.dataset.id = section.id;
  div.dataset.type = section.type;

  div.appendChild(buildSectionHeader(section));
  div.appendChild(buildScaleRow(section));
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

  // Action buttons
  const actions = document.createElement('div');
  actions.className = 'section-header-actions';

  const upBtn = makeIconBtn('↑', 'Move section up',   () => moveSectionUp(section.id));
  const dnBtn = makeIconBtn('↓', 'Move section down', () => moveSectionDown(section.id));
  const rmBtn = makeIconBtn('✕', 'Remove section',    () => removeSection(section.id));
  rmBtn.classList.add('danger');
  actions.append(upBtn, dnBtn, rmBtn);

  header.append(badge, nameInput, actions);
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

  card.append(rootEl, qualEl, div1, noteRow, typeRow, xposeRow, div2, actionBar);
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
  render();

  // ----- Song title ------------------------------------------------
  document.getElementById('song-title').addEventListener('input', saveSong);

  // ----- BPM -------------------------------------------------------
  const bpmInput = document.getElementById('bpm-input');
  bpmInput.addEventListener('change', e  => updateBpm(e.target.value));
  bpmInput.addEventListener('input',  e  => updateBpm(e.target.value));
  document.getElementById('bpm-down').addEventListener('click', () => updateBpm(song.bpm - 5));
  document.getElementById('bpm-up').addEventListener('click',   () => updateBpm(song.bpm + 5));

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
