/* =====================================================================
   Chordz – app.js
   Browser-based chord / song-structure builder
   Dependency-free; uses Web Audio API for beat + synth playback.
   ===================================================================== */

'use strict';

// =====================================================================
// DATA – Notes, Chord Types, Scales, Section Types
// =====================================================================

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const OSC_TYPES = ['sine', 'triangle', 'sawtooth', 'square'];

const CHORD_TYPES = [
  { name: 'maj',   label: 'Major',             intervals: [0, 4, 7] },
  { name: 'min',   label: 'Minor',             intervals: [0, 3, 7] },
  { name: '5',     label: 'Power (5th)',       intervals: [0, 7] },
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

const SECTION_TYPES = ['Verse', 'Chorus', 'Bridge', 'Middle 8', 'Change', 'Outro', 'Custom'];
const PLAYBACK_MODES = ['edit', 'song'];
const BASS_PITCH_MODES = ['linked', 'free'];
const NOTE_REPEAT_OPTIONS = [1, 2, 4];
const START_BEAT_OPTIONS = [1, 2, 3, 4];
const RECENT_SONG_LIMIT = 8;
const DEFAULT_CHORD_ROOT = -12;

const DRUM_PATTERN_COUNT = 10;
const DRUM_LANES = [
  { key: 'kick',      label: 'Kick' },
  { key: 'snare',     label: 'Snare' },
  { key: 'closedHat', label: 'Cl. Hat' },
  { key: 'openHat',   label: 'Op. Hat' },
  { key: 'hiTom',     label: 'Hi Tom' },
  { key: 'midTom',    label: 'Mid Tom' },
  { key: 'lowTom',    label: 'Low Tom' },
  { key: 'ride',      label: 'Ride' },
];

// Pre-defined grid patterns for the first 3 slots
const DRUM_PRESET_GRIDS = [
  { // Rock Beat
    kick:      [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
    snare:     [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
    closedHat: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
    openHat:   [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1],
    hiTom:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    midTom:    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    lowTom:    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    ride:      [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
  },
  { // Funk
    kick:      [1,0,0,1, 0,0,1,0, 1,0,0,0, 0,0,1,0],
    snare:     [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
    closedHat: [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
    openHat:   [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    hiTom:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    midTom:    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    lowTom:    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    ride:      [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
  },
  { // Ballad
    kick:      [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
    snare:     [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
    closedHat: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
    openHat:   [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    hiTom:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    midTom:    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    lowTom:    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    ride:      [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
  },
];
const DRUM_PRESET_NAMES = [
  'Rock Beat', 'Funk', 'Ballad',
  'Pattern 4', 'Pattern 5', 'Pattern 6', 'Pattern 7', 'Pattern 8', 'Pattern 9', 'Pattern 10',
];

const SYNTH_PRESET_LIBRARY = {
  chord: {
    warmPad: {
      label: 'Warm Pad',
      osc1Type: 'sawtooth',
      osc2Type: 'triangle',
      osc2Interval: 0,
      detune: 8,
      mix: 0.44,
      attack: 0.12,
      decay: 0.48,
      sustain: 0.74,
      release: 0.72,
      cutoff: 1800,
      resonance: 1.4,
      volume: 0.17,
    },
    pluck: {
      label: 'Pluck',
      osc1Type: 'triangle',
      osc2Type: 'square',
      osc2Interval: 12,
      detune: 3,
      mix: 0.28,
      attack: 0.005,
      decay: 0.19,
      sustain: 0.10,
      release: 0.20,
      cutoff: 2300,
      resonance: 1.8,
      volume: 0.18,
    },
    organ: {
      label: 'Organ',
      osc1Type: 'square',
      osc2Type: 'square',
      osc2Interval: 12,
      detune: 5,
      mix: 0.50,
      attack: 0.01,
      decay: 0.14,
      sustain: 0.84,
      release: 0.28,
      cutoff: 3200,
      resonance: 0.6,
      volume: 0.15,
    },
    softKeys: {
      label: 'Soft Keys',
      osc1Type: 'triangle',
      osc2Type: 'sine',
      osc2Interval: 12,
      detune: 2,
      mix: 0.34,
      attack: 0.02,
      decay: 0.24,
      sustain: 0.46,
      release: 0.32,
      cutoff: 2100,
      resonance: 0.9,
      volume: 0.16,
    },
  },
  bass: {
    sawBass: {
      label: 'Saw Bass',
      osc1Type: 'sawtooth',
      osc2Type: 'square',
      osc2Interval: -12,
      detune: 6,
      mix: 0.32,
      attack: 0.01,
      decay: 0.16,
      sustain: 0.54,
      release: 0.20,
      cutoff: 540,
      resonance: 1.1,
      volume: 0.24,
    },
    roundBass: {
      label: 'Round Bass',
      osc1Type: 'sine',
      osc2Type: 'triangle',
      osc2Interval: -12,
      detune: 2,
      mix: 0.36,
      attack: 0.01,
      decay: 0.18,
      sustain: 0.62,
      release: 0.26,
      cutoff: 420,
      resonance: 0.7,
      volume: 0.26,
    },
    squareBass: {
      label: 'Square Bass',
      osc1Type: 'square',
      osc2Type: 'triangle',
      osc2Interval: -12,
      detune: 4,
      mix: 0.40,
      attack: 0.008,
      decay: 0.13,
      sustain: 0.52,
      release: 0.18,
      cutoff: 680,
      resonance: 1.6,
      volume: 0.23,
    },
  },
};

const CHORD_SOUND_PRESETS = [
  { id: 'warmPad', label: 'Warm Pad' },
  { id: 'pluck', label: 'Pluck' },
  { id: 'organ', label: 'Organ' },
  { id: 'softKeys', label: 'Soft Keys' },
  { id: 'custom', label: 'Custom' },
];

const BASS_SOUND_PRESETS = [
  { id: 'sawBass', label: 'Saw Bass' },
  { id: 'roundBass', label: 'Round Bass' },
  { id: 'squareBass', label: 'Square Bass' },
  { id: 'custom', label: 'Custom' },
];

const LEGACY_CHORD_PRESET_MAP = {
  piano: 'softKeys',
  pad: 'warmPad',
  organ: 'organ',
  pluck: 'pluck',
};

const LEGACY_BASS_PRESET_MAP = {
  sineBass: 'roundBass',
  sawBass: 'sawBass',
  squareBass: 'squareBass',
};

const SYNTH_UI_FIELDS = [
  { key: 'attack', label: 'A', min: 0.005, max: 1.5, step: 0.005, format: value => value.toFixed(2) + 's' },
  { key: 'decay', label: 'D', min: 0.02, max: 2.0, step: 0.01, format: value => value.toFixed(2) + 's' },
  { key: 'sustain', label: 'S', min: 0.0, max: 1.0, step: 0.01, format: value => Math.round(value * 100) + '%' },
  { key: 'release', label: 'R', min: 0.05, max: 2.5, step: 0.01, format: value => value.toFixed(2) + 's' },
  { key: 'cutoff', label: 'Cut', min: 120, max: 6000, step: 10, format: value => Math.round(value) + ' Hz' },
  { key: 'resonance', label: 'Q', min: 0.2, max: 12, step: 0.1, format: value => value.toFixed(1) },
  { key: 'distortion', label: 'Drive', min: 0, max: 1, step: 0.01, format: value => Math.round(value * 100) + '%' },
  { key: 'modRate', label: 'Mod Hz', min: 0, max: 12, step: 0.1, format: value => value.toFixed(1) + ' Hz' },
  { key: 'modDepth', label: 'Mod Depth', min: 0, max: 80, step: 1, format: value => Math.round(value) + '¢' },
];

const SECTION_DEFAULTS = {
  Verse:    [{ root: 0, type: 'maj' }, { root: 9, type: 'min' }, { root: 5, type: 'maj' }, { root: 7, type: '7' }],
  Chorus:   [{ root: 5, type: 'maj' }, { root: 7, type: 'maj' }, { root: 9, type: 'min' }, { root: 4, type: 'min' }],
  Bridge:   [{ root: 2, type: 'min' }, { root: 7, type: '7' },   { root: 0, type: 'maj7' }, { root: 9, type: '7' }],
  'Middle 8': [{ root: 5, type: 'maj7' }, { root: 7, type: 'm7' }, { root: 0, type: 'maj7' }],
  Change:   [{ root: 3, type: 'maj7' }, { root: 8, type: 'm7' }],
  Outro:    [{ root: 0, type: 'maj' }, { root: 5, type: 'maj' }, { root: 7, type: 'maj' }],
  Custom:   [],
};

// =====================================================================
// FACTORY HELPERS
// =====================================================================

let _idSeq = 0;
function makeId() {
  return 'x' + Date.now().toString(36) + (++_idSeq).toString(36);
}

function clampInt(value, fallback, min, max) {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function clampNumber(value, fallback, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function normalizeSemitone(value, fallback = 0) {
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? fallback : n;
}

function normalizePitchClass(semitone) {
  return ((semitone % 12) + 12) % 12;
}

function replacePitchClass(currentSemitone, newPitchClass) {
  const current = normalizeSemitone(currentSemitone, 0);
  const targetPitchClass = normalizePitchClass(parseInt(newPitchClass, 10));
  return current - normalizePitchClass(current) + targetPitchClass;
}

function resolvePresetId(kind, rawPreset) {
  const library = kind === 'bass' ? SYNTH_PRESET_LIBRARY.bass : SYNTH_PRESET_LIBRARY.chord;
  if (rawPreset === 'custom') return 'custom';
  const mapped = kind === 'bass'
    ? (LEGACY_BASS_PRESET_MAP[rawPreset] || rawPreset)
    : (LEGACY_CHORD_PRESET_MAP[rawPreset] || rawPreset);
  return library[mapped] ? mapped : (kind === 'bass' ? 'roundBass' : 'warmPad');
}

function createSynthSettings(kind, presetId) {
  const resolvedPreset = resolvePresetId(kind, presetId);
  const defaultPreset = resolvedPreset === 'custom'
    ? (kind === 'bass' ? 'roundBass' : 'warmPad')
    : resolvedPreset;
  const preset = (kind === 'bass' ? SYNTH_PRESET_LIBRARY.bass : SYNTH_PRESET_LIBRARY.chord)[defaultPreset];
  return {
    preset: resolvedPreset,
    osc1Type: preset.osc1Type,
    osc2Type: preset.osc2Type,
    osc2Interval: preset.osc2Interval,
    detune: preset.detune,
    mix: preset.mix,
    attack: preset.attack,
    decay: preset.decay,
    sustain: preset.sustain,
    release: preset.release,
    cutoff: preset.cutoff,
    resonance: preset.resonance,
    volume: preset.volume,
    distortion: 0,
    modRate: 0,
    modDepth: 0,
  };
}

function normalizeSynthSettings(kind, rawSynth, legacyPreset) {
  const synth = rawSynth || {};
  const presetId = resolvePresetId(kind, synth.preset || legacyPreset);
  const base = createSynthSettings(kind, presetId === 'custom'
    ? (legacyPreset || (kind === 'bass' ? 'roundBass' : 'warmPad'))
    : presetId);

  const normalized = {
    preset: presetId,
    osc1Type: OSC_TYPES.includes(synth.osc1Type) ? synth.osc1Type : base.osc1Type,
    osc2Type: OSC_TYPES.includes(synth.osc2Type) ? synth.osc2Type : base.osc2Type,
    osc2Interval: clampInt(synth.osc2Interval, base.osc2Interval, -24, 24),
    detune: clampNumber(synth.detune, base.detune, -60, 60),
    mix: clampNumber(synth.mix, base.mix, 0, 1),
    attack: clampNumber(synth.attack, base.attack, 0.005, 1.5),
    decay: clampNumber(synth.decay, base.decay, 0.02, 2.0),
    sustain: clampNumber(synth.sustain, base.sustain, 0, 1),
    release: clampNumber(synth.release, base.release, 0.05, 2.5),
    cutoff: clampNumber(synth.cutoff, base.cutoff, 120, 6000),
    resonance: clampNumber(synth.resonance, base.resonance, 0.2, 12),
    volume: clampNumber(synth.volume, base.volume, 0.03, 0.4),
    distortion: clampNumber(synth.distortion, base.distortion, 0, 1),
    modRate: clampNumber(synth.modRate, base.modRate, 0, 12),
    modDepth: clampNumber(synth.modDepth, base.modDepth, 0, 80),
  };

  if (presetId !== 'custom' && synth.preset === 'custom') normalized.preset = 'custom';
  return normalized;
}

function createSection(type) {
  const defaults = SECTION_DEFAULTS[type] || [];
  return {
    id: makeId(),
    type,
    name: type === 'Custom' ? 'My Section' : type,
    scaleRoot: 0,
    scaleType: 'Major',
    crashOnStart: false,
    rollAtEnd: false,
    drumPatternId: null,
    chords: defaults.map(chord => createChord(chord.root - 12, chord.type)),
  };
}

function createDefaultSong() {
  const now = Date.now();
  const drumPatterns = Array.from({ length: DRUM_PATTERN_COUNT }, (_, i) => createDefaultDrumPattern(i));
  const defaultPatternId = drumPatterns[0].id;
  const sections = [createSection('Verse'), createSection('Chorus'), createSection('Bridge')];
  sections.forEach(s => { s.drumPatternId = defaultPatternId; });
  return {
    id: makeId(),
    title: 'Untitled Song',
    updatedAt: now,
    bpm: 100,
    playbackMode: 'edit',
    selectedSectionId: sections[0]?.id || null,
    bassPitchMode: 'linked',
    chordSound: 'warmPad',
    chordSynth: createSynthSettings('chord', 'warmPad'),
    bassEnabled: true,
    bassSound: 'roundBass',
    bassSynth: createSynthSettings('bass', 'roundBass'),
    drumPatterns,
    mixer: {
      chordVolume: 0.9,
      bassVolume: 0.9,
      drumsVolume: 0.9,
      masterVolume: 0.95,
    },
    reverb: {
      chordWet: 0.2,
      bassWet: 0.16,
    },
    arranger: [],
    sections,
  };
}

function normalizeRepeat(value, fallback = 1) {
  const repeat = clampInt(value, fallback, 1, 4);
  return NOTE_REPEAT_OPTIONS.includes(repeat) ? repeat : fallback;
}

function normalizeStartBeat(value, fallback = 1) {
  return clampInt(value, fallback, 1, 4);
}

function createChord(root = DEFAULT_CHORD_ROOT, type = 'maj') {
  const normalizedRoot = normalizeSemitone(root, DEFAULT_CHORD_ROOT);
  return {
    id: makeId(),
    root: normalizedRoot,
    bassRoot: normalizedRoot,
    type: CHORD_TYPES.some(entry => entry.name === type) ? type : 'maj',
    beats: 4,
    chordRepeat: 1,
    bassRepeat: 1,
    startBeat: 1,
  };
}

function emptyDrumGrid() {
  const grid = {};
  DRUM_LANES.forEach(lane => { grid[lane.key] = Array(16).fill(0); });
  return grid;
}

function createDefaultDrumPattern(index) {
  const presetGrid = DRUM_PRESET_GRIDS[index];
  const grid = {};
  DRUM_LANES.forEach(lane => {
    grid[lane.key] = presetGrid ? presetGrid[lane.key].slice() : Array(16).fill(0);
  });
  return {
    id: makeId(),
    name: DRUM_PRESET_NAMES[index] || `Pattern ${index + 1}`,
    grid,
  };
}

function normalizeDrumPatterns(rawPatterns) {
  const result = [];
  for (let i = 0; i < DRUM_PATTERN_COUNT; i++) {
    const raw = Array.isArray(rawPatterns) ? rawPatterns[i] : null;
    if (raw && typeof raw === 'object') {
      const grid = {};
      DRUM_LANES.forEach(lane => {
        const rawRow = raw.grid?.[lane.key];
        grid[lane.key] = (Array.isArray(rawRow) && rawRow.length >= 16)
          ? rawRow.slice(0, 16).map(v => (v ? 1 : 0))
          : Array(16).fill(0);
      });
      result.push({
        id: typeof raw.id === 'string' && raw.id.trim() ? raw.id : makeId(),
        name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : `Pattern ${i + 1}`,
        grid,
      });
    } else {
      result.push(createDefaultDrumPattern(i));
    }
  }
  return result;
}

// =====================================================================
// STATE – Song data model
// =====================================================================

let song = createDefaultSong();
let songVersion = 0;
const synthPanelExpanded = { chord: true, bass: true };
let editingDrumPatternId = null;

function normalizeChord(rawChord) {
  const chord = rawChord || {};
  return {
    id: chord.id || makeId(),
    root: normalizeSemitone(chord.root, 0),
    bassRoot: normalizeSemitone(chord.bassRoot, normalizeSemitone(chord.root, 0)),
    type: CHORD_TYPES.some(entry => entry.name === chord.type) ? chord.type : 'maj',
    beats: clampInt(chord.beats, 4, 1, 64),
    chordRepeat: normalizeRepeat(chord.chordRepeat, 1),
    bassRepeat: normalizeRepeat(chord.bassRepeat, 1),
    startBeat: normalizeStartBeat(chord.startBeat, 1),
  };
}

function normalizeSection(rawSection, fallbackType = 'Custom') {
  const section = rawSection || {};
  const type = SECTION_TYPES.includes(section.type) ? section.type : fallbackType;
  return {
    id: section.id || makeId(),
    type,
    name: section.name || type,
    scaleRoot: normalizeSemitone(section.scaleRoot, 0),
    scaleType: SCALES.some(scale => scale.name === section.scaleType) ? section.scaleType : 'Major',
    crashOnStart: Boolean(section.crashOnStart),
    rollAtEnd: Boolean(section.rollAtEnd),
    drumPatternId: section.drumPatternId || null,
    chords: (Array.isArray(section.chords) ? section.chords : []).map(normalizeChord),
  };
}

function normalizeSong(rawSong) {
  const base = createDefaultSong();
  const parsed = rawSong || {};

  const drumPatterns = normalizeDrumPatterns(parsed.drumPatterns);
  const validPatternIds = new Set(drumPatterns.map(p => p.id));
  const defaultPatternId = drumPatterns[0].id;

  const sections = (Array.isArray(parsed.sections) ? parsed.sections : base.sections)
    .map(section => {
      const normalized = normalizeSection(section, section?.type);
      return {
        ...normalized,
        drumPatternId: validPatternIds.has(normalized.drumPatternId) ? normalized.drumPatternId : defaultPatternId,
      };
    });
  if (sections.length === 0) {
    const defaultSection = createSection('Verse');
    defaultSection.drumPatternId = defaultPatternId;
    sections.push(defaultSection);
  }
  const selectedSectionExists = sections.some(section => section.id === parsed.selectedSectionId);
  const chordSound = resolvePresetId('chord', parsed.chordSound || parsed.chordSynth?.preset || base.chordSound);
  const bassSound = resolvePresetId('bass', parsed.bassSound || parsed.bassSynth?.preset || base.bassSound);
  const sectionIds = new Set(sections.map(section => section.id));
  const arranger = Array.isArray(parsed.arranger)
    ? parsed.arranger
      .map(entry => ({
        id: entry?.id || makeId(),
        sectionId: sectionIds.has(entry?.sectionId) ? entry.sectionId : sections[0].id,
        repeats: clampInt(entry?.repeats, 1, 1, 16),
      }))
      .filter(entry => sectionIds.has(entry.sectionId))
    : base.arranger;

  return {
    id: typeof parsed.id === 'string' && parsed.id.trim() ? parsed.id : makeId(),
    title: typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title.trim() : base.title,
    updatedAt: Number.isFinite(Number(parsed.updatedAt)) ? Number(parsed.updatedAt) : Date.now(),
    bpm: clampInt(parsed.bpm, base.bpm, 40, 300),
    playbackMode: PLAYBACK_MODES.includes(parsed.playbackMode) ? parsed.playbackMode : base.playbackMode,
    selectedSectionId: selectedSectionExists ? parsed.selectedSectionId : sections[0].id,
    bassPitchMode: BASS_PITCH_MODES.includes(parsed.bassPitchMode) ? parsed.bassPitchMode : base.bassPitchMode,
    chordSound,
    chordSynth: normalizeSynthSettings('chord', parsed.chordSynth, chordSound),
    bassEnabled: parsed.bassEnabled === undefined ? base.bassEnabled : Boolean(parsed.bassEnabled),
    bassSound,
    bassSynth: normalizeSynthSettings('bass', parsed.bassSynth, bassSound),
    drumPatterns,
    mixer: {
      chordVolume: clampNumber(parsed.mixer?.chordVolume, base.mixer.chordVolume, 0, 1),
      bassVolume: clampNumber(parsed.mixer?.bassVolume, base.mixer.bassVolume, 0, 1),
      drumsVolume: clampNumber(parsed.mixer?.drumsVolume, base.mixer.drumsVolume, 0, 1),
      masterVolume: clampNumber(parsed.mixer?.masterVolume, base.mixer.masterVolume, 0, 1),
    },
    reverb: {
      chordWet: clampNumber(parsed.reverb?.chordWet, base.reverb.chordWet, 0, 1),
      bassWet: clampNumber(parsed.reverb?.bassWet, base.reverb.bassWet, 0, 1),
    },
    arranger,
    sections,
  };
}

// =====================================================================
// MUSIC THEORY HELPERS
// =====================================================================

function noteName(semitone) {
  return NOTES[normalizePitchClass(semitone)];
}

function formatPitchOffset(semitone, compact = false) {
  if (semitone === normalizePitchClass(semitone)) return '';
  const sign = semitone > 0 ? '+' : '-';
  const absolute = Math.abs(semitone);
  const octaves = Math.floor(absolute / 12);
  const semitones = absolute % 12;
  if (octaves && !semitones) return compact ? `${sign}${octaves}o` : `${sign}${octaves} oct`;
  if (octaves && semitones) {
    return compact
      ? `${sign}${octaves}o${sign}${semitones}s`
      : `${sign}${octaves} oct ${sign}${semitones} st`;
  }
  return compact ? `${sign}${semitones}s` : `${sign}${semitones} st`;
}

function formatPitchLabel(semitone, compact = false) {
  const offset = formatPitchOffset(semitone, compact);
  if (!offset) return noteName(semitone);
  return compact ? `${noteName(semitone)} ${offset}` : `${noteName(semitone)} (${offset})`;
}

function getScaleNotes(rootSemitone, scaleName) {
  const scale = SCALES.find(entry => entry.name === scaleName);
  if (!scale) return [];
  return scale.intervals.map(interval => noteName(rootSemitone + interval));
}

function getScaleDefinition(scaleName) {
  return SCALES.find(entry => entry.name === scaleName) || SCALES[0];
}

function stepPitchBySectionScale(section, currentSemitone, direction) {
  const scale = getScaleDefinition(section?.scaleType);
  const root = normalizeSemitone(section?.scaleRoot, 0);
  const current = normalizeSemitone(currentSemitone, 0);
  const dir = direction >= 0 ? 1 : -1;
  const candidates = [];
  const relative = current - root;
  const startOct = Math.floor((relative - 24) / 12);
  const endOct = Math.ceil((relative + 24) / 12);
  for (let octave = startOct; octave <= endOct; octave++) {
    scale.intervals.forEach(interval => candidates.push(root + octave * 12 + interval));
  }
  candidates.sort((a, b) => a - b);
  if (dir > 0) {
    const next = candidates.find(candidate => candidate > current);
    return next === undefined ? current + 1 : next;
  }
  for (let index = candidates.length - 1; index >= 0; index--) {
    if (candidates[index] < current) return candidates[index];
  }
  return current - 1;
}

function getChordBassRoot(chord) {
  if ((song.bassPitchMode || 'linked') !== 'free') return chord.root;
  return normalizeSemitone(chord.bassRoot, chord.root);
}

function getChordPlaybackStartBeat(chord, beats = chord?.beats || 4) {
  const totalBeats = clampInt(beats, 4, 1, 64);
  return Math.min(totalBeats, normalizeStartBeat(chord?.startBeat, 1));
}

function chordTypeObj(typeName) {
  return CHORD_TYPES.find(entry => entry.name === typeName) || CHORD_TYPES[0];
}

function beatsToSeconds(beats) {
  return (60 / song.bpm) * Math.max(1, beats || 1);
}

// =====================================================================
// SONG MUTATIONS
// =====================================================================

function commitSong({ rerender = false, refreshCursor = false } = {}) {
  songVersion += 1;
  saveSong();
  applyAudioMixSettings();
  if (rerender) {
    render();
    return;
  }
  updateSongGoToControl();
  updatePlaybackHighlights();
  if (refreshCursor && isBeating) initializePlaybackCursor();
}

function addSection(type) {
  const section = createSection(type);
  section.drumPatternId = song.drumPatterns?.[0]?.id || null;
  song.sections.push(section);
  if (!song.selectedSectionId) song.selectedSectionId = section.id;
  commitSong({ rerender: true, refreshCursor: true });
}

function removeSection(id) {
  if (song.sections.length <= 1) {
    alert('Cannot remove the only remaining section.');
    return;
  }
  song.sections = song.sections.filter(section => section.id !== id);
  song.arranger = song.arranger.filter(entry => entry.sectionId !== id);
  if (song.selectedSectionId === id) song.selectedSectionId = song.sections[0]?.id || null;
  commitSong({ rerender: true, refreshCursor: true });
}

function moveSectionUp(id) {
  const index = song.sections.findIndex(section => section.id === id);
  if (index <= 0) return;
  [song.sections[index - 1], song.sections[index]] = [song.sections[index], song.sections[index - 1]];
  commitSong({ rerender: true, refreshCursor: true });
}

function moveSectionDown(id) {
  const index = song.sections.findIndex(section => section.id === id);
  if (index < 0 || index >= song.sections.length - 1) return;
  [song.sections[index], song.sections[index + 1]] = [song.sections[index + 1], song.sections[index]];
  commitSong({ rerender: true, refreshCursor: true });
}

function updateSectionName(id, name) {
  const section = song.sections.find(entry => entry.id === id);
  if (!section) return;
  section.name = name;
  commitSong();
  renderArrangerPanel();
}

function updateSectionScale(id, root, type) {
  const section = song.sections.find(entry => entry.id === id);
  if (!section) return;
  if (root !== null) section.scaleRoot = replacePitchClass(section.scaleRoot, root);
  if (type !== null) section.scaleType = type;
  commitSong();
  renderScaleDisplay(id);
}

function updateSectionOptions(id, { crashOnStart, rollAtEnd }) {
  const section = song.sections.find(entry => entry.id === id);
  if (!section) return;
  if (typeof crashOnStart === 'boolean') section.crashOnStart = crashOnStart;
  if (typeof rollAtEnd === 'boolean') section.rollAtEnd = rollAtEnd;
  commitSong();
}

function selectEditSection(sectionId) {
  if (!song.sections.some(section => section.id === sectionId)) return;
  song.selectedSectionId = sectionId;
  const selectedSection = song.sections.find(s => s.id === sectionId);
  if (selectedSection?.drumPatternId) editingDrumPatternId = selectedSection.drumPatternId;
  commitSong();
  updatePlaybackModeUI();
  updatePlaybackHighlights();
  renderDrumSequencer();
  if (isBeating && song.playbackMode === 'edit') initializePlaybackCursor();
}

function setPlaybackMode(mode) {
  if (!PLAYBACK_MODES.includes(mode)) return;
  song.playbackMode = mode;
  commitSong();
  updatePlaybackModeUI();
  if (isBeating) initializePlaybackCursor();
}

function setSynthPreset(kind, presetId) {
  if (presetId === 'custom') return;
  const resolved = resolvePresetId(kind, presetId);
  if (kind === 'bass') {
    song.bassSound = resolved;
    song.bassSynth = createSynthSettings('bass', resolved);
  } else {
    song.chordSound = resolved;
    song.chordSynth = createSynthSettings('chord', resolved);
  }
  commitSong();
  renderSynthRack();
}

function setBassEnabled(enabled) {
  song.bassEnabled = Boolean(enabled);
  commitSong();
}

function setBassPitchMode(mode) {
  if (!BASS_PITCH_MODES.includes(mode)) return;
  song.bassPitchMode = mode;
  commitSong({ rerender: true, refreshCursor: true });
}

function setSynthPanelExpanded(kind, expanded) {
  if (kind !== 'chord' && kind !== 'bass') return;
  synthPanelExpanded[kind] = Boolean(expanded);
  renderSynthRack();
}

function updateSynthField(kind, fieldKey, value) {
  const synth = kind === 'bass' ? song.bassSynth : song.chordSynth;
  const field = SYNTH_UI_FIELDS.find(entry => entry.key === fieldKey);
  if (!synth || !field) return;
  synth[fieldKey] = clampNumber(value, synth[fieldKey], field.min, field.max);
  synth.preset = 'custom';
  if (kind === 'bass') song.bassSound = 'custom';
  else song.chordSound = 'custom';
  commitSong();
  const presetSelect = document.getElementById(`${kind}-preset-select`);
  if (presetSelect) presetSelect.value = 'custom';
}

function updateSynthWaveform(kind, fieldKey, value) {
  if (!OSC_TYPES.includes(value)) return;
  if (fieldKey !== 'osc1Type' && fieldKey !== 'osc2Type') return;
  const synth = kind === 'bass' ? song.bassSynth : song.chordSynth;
  if (!synth) return;
  synth[fieldKey] = value;
  synth.preset = 'custom';
  if (kind === 'bass') song.bassSound = 'custom';
  else song.chordSound = 'custom';
  commitSong();
  renderSynthRack();
}

function addChord(sectionId) {
  const section = song.sections.find(entry => entry.id === sectionId);
  if (!section) return;
  section.chords.push(createChord());
  commitSong({ rerender: true, refreshCursor: true });
}

function removeChord(sectionId, chordId) {
  const section = song.sections.find(entry => entry.id === sectionId);
  if (!section) return;
  section.chords = section.chords.filter(chord => chord.id !== chordId);
  commitSong({ rerender: true, refreshCursor: true });
}

function moveChordWithinSection(sectionId, draggedChordId, targetChordId, placeAfter = false) {
  const section = song.sections.find(entry => entry.id === sectionId);
  if (!section || draggedChordId === targetChordId) return;
  const fromIndex = section.chords.findIndex(chord => chord.id === draggedChordId);
  if (fromIndex < 0) return;

  const draggedChord = section.chords.splice(fromIndex, 1)[0];
  if (!targetChordId) {
    section.chords.push(draggedChord);
  } else {
    let targetIndex = section.chords.findIndex(chord => chord.id === targetChordId);
    if (targetIndex < 0) {
      section.chords.push(draggedChord);
    } else {
      if (placeAfter) targetIndex += 1;
      section.chords.splice(targetIndex, 0, draggedChord);
    }
  }

  commitSong({ rerender: true, refreshCursor: true });
}

function mutateChord(sectionId, chordId, fn, { rerender = false, refreshCursor = false } = {}) {
  const section = song.sections.find(entry => entry.id === sectionId);
  if (!section) return;
  const chord = section.chords.find(entry => entry.id === chordId);
  if (!chord) return;
  fn(chord);
  commitSong({ rerender, refreshCursor });
  if (!rerender) {
    updateChordCard(sectionId, chordId);
    renderArrangementPanel(sectionId);
  }
}

function updateChordBeats(sectionId, chordId, rawBeats) {
  mutateChord(sectionId, chordId, chord => {
    chord.beats = clampInt(rawBeats, chord.beats || 4, 1, 64);
  }, { refreshCursor: true });
}

function updateChordRepeat(sectionId, chordId, repeat) {
  mutateChord(sectionId, chordId, chord => {
    chord.chordRepeat = normalizeRepeat(repeat, chord.chordRepeat || 1);
  }, { refreshCursor: true });
}

function updateBassRepeat(sectionId, chordId, repeat) {
  mutateChord(sectionId, chordId, chord => {
    chord.bassRepeat = normalizeRepeat(repeat, chord.bassRepeat || 1);
  }, { refreshCursor: true });
}

function updateChordStartBeat(sectionId, chordId, startBeat) {
  mutateChord(sectionId, chordId, chord => {
    chord.startBeat = normalizeStartBeat(startBeat, chord.startBeat || 1);
  }, { refreshCursor: true });
}

function noteUp(sectionId, chordId) {
  mutateChord(sectionId, chordId, chord => {
    const section = song.sections.find(entry => entry.id === sectionId);
    chord.root = stepPitchBySectionScale(section, chord.root, 1);
    if ((song.bassPitchMode || 'linked') !== 'free') chord.bassRoot = chord.root;
  }, { rerender: true, refreshCursor: true });
}

function noteDown(sectionId, chordId) {
  mutateChord(sectionId, chordId, chord => {
    const section = song.sections.find(entry => entry.id === sectionId);
    chord.root = stepPitchBySectionScale(section, chord.root, -1);
    if ((song.bassPitchMode || 'linked') !== 'free') chord.bassRoot = chord.root;
  }, { rerender: true, refreshCursor: true });
}

function bassPitchUp(sectionId, chordId) {
  mutateChord(sectionId, chordId, chord => {
    if ((song.bassPitchMode || 'linked') !== 'free') return;
    const section = song.sections.find(entry => entry.id === sectionId);
    const currentBass = getChordBassRoot(chord);
    chord.bassRoot = stepPitchBySectionScale(section, currentBass, 1);
  }, { rerender: true, refreshCursor: true });
}

function bassPitchDown(sectionId, chordId) {
  mutateChord(sectionId, chordId, chord => {
    if ((song.bassPitchMode || 'linked') !== 'free') return;
    const section = song.sections.find(entry => entry.id === sectionId);
    const currentBass = getChordBassRoot(chord);
    chord.bassRoot = stepPitchBySectionScale(section, currentBass, -1);
  }, { rerender: true, refreshCursor: true });
}

function varUp(sectionId, chordId) {
  mutateChord(sectionId, chordId, chord => {
    const index = CHORD_TYPES.findIndex(entry => entry.name === chord.type);
    chord.type = CHORD_TYPES[(index + 1) % CHORD_TYPES.length].name;
  }, { rerender: true, refreshCursor: true });
}

function varDown(sectionId, chordId) {
  mutateChord(sectionId, chordId, chord => {
    const index = CHORD_TYPES.findIndex(entry => entry.name === chord.type);
    chord.type = CHORD_TYPES[(index + CHORD_TYPES.length - 1) % CHORD_TYPES.length].name;
  }, { rerender: true, refreshCursor: true });
}

function transposeChordUp(sectionId, chordId) {
  mutateChord(sectionId, chordId, chord => {
    chord.root += 1;
    if ((song.bassPitchMode || 'linked') !== 'free') chord.bassRoot = chord.root;
  }, { rerender: true, refreshCursor: true });
}

function transposeChordDown(sectionId, chordId) {
  mutateChord(sectionId, chordId, chord => {
    chord.root -= 1;
    if ((song.bassPitchMode || 'linked') !== 'free') chord.bassRoot = chord.root;
  }, { rerender: true, refreshCursor: true });
}

function transposeSong(steps) {
  song.sections.forEach(section => {
    section.scaleRoot += steps;
    section.chords.forEach(chord => {
      chord.root += steps;
      chord.bassRoot = normalizeSemitone(chord.bassRoot, chord.root - steps) + steps;
      if ((song.bassPitchMode || 'linked') !== 'free') chord.bassRoot = chord.root;
    });
  });
  commitSong({ rerender: true, refreshCursor: true });
}

function updateBpm(raw) {
  const value = Math.min(300, Math.max(40, parseInt(raw, 10) || 100));
  song.bpm = value;
  const element = document.getElementById('bpm-input');
  if (element && parseInt(element.value, 10) !== value) element.value = value;
  commitSong();
}

function updateMixerField(field, value) {
  if (!song.mixer) return;
  if (!Object.prototype.hasOwnProperty.call(song.mixer, field)) return;
  song.mixer[field] = clampNumber(value, song.mixer[field], 0, 1);
  commitSong();
}

function updateReverbWet(kind, value) {
  if (!song.reverb) return;
  const key = kind === 'bass' ? 'bassWet' : 'chordWet';
  song.reverb[key] = clampNumber(value, song.reverb[key], 0, 1);
  commitSong();
}

function addArrangerEntry(sectionId) {
  const fallbackId = song.sections[0]?.id;
  const targetSectionId = song.sections.some(section => section.id === sectionId) ? sectionId : fallbackId;
  if (!targetSectionId) return;
  song.arranger.push({
    id: makeId(),
    sectionId: targetSectionId,
    repeats: 1,
  });
  commitSong({ rerender: true, refreshCursor: true });
}

function removeArrangerEntry(entryId) {
  song.arranger = song.arranger.filter(entry => entry.id !== entryId);
  commitSong({ rerender: true, refreshCursor: true });
}

function updateArrangerEntry(entryId, updates) {
  const entry = song.arranger.find(item => item.id === entryId);
  if (!entry) return;
  if (updates.sectionId && song.sections.some(section => section.id === updates.sectionId)) entry.sectionId = updates.sectionId;
  if (updates.repeats !== undefined) entry.repeats = clampInt(updates.repeats, entry.repeats || 1, 1, 16);
  commitSong({ refreshCursor: true });
}

function moveArrangerEntry(draggedEntryId, targetEntryId, placeAfter = false) {
  if (!draggedEntryId || draggedEntryId === targetEntryId) return;
  const fromIndex = song.arranger.findIndex(entry => entry.id === draggedEntryId);
  if (fromIndex < 0) return;
  const dragged = song.arranger.splice(fromIndex, 1)[0];
  if (!targetEntryId) song.arranger.push(dragged);
  else {
    let targetIndex = song.arranger.findIndex(entry => entry.id === targetEntryId);
    if (targetIndex < 0) song.arranger.push(dragged);
    else {
      if (placeAfter) targetIndex += 1;
      song.arranger.splice(targetIndex, 0, dragged);
    }
  }
  commitSong({ rerender: true, refreshCursor: true });
}

// =====================================================================
// DRUM PATTERN MUTATIONS
// =====================================================================

function updateDrumStep(patternId, laneKey, step) {
  const pattern = song.drumPatterns?.find(p => p.id === patternId);
  if (!pattern) return;
  pattern.grid[laneKey][step] = pattern.grid[laneKey][step] ? 0 : 1;
  commitSong();
}

function updateDrumPatternName(patternId, name) {
  const pattern = song.drumPatterns?.find(p => p.id === patternId);
  if (!pattern) return;
  pattern.name = name;
  commitSong();
  // Update all <option> elements referencing this pattern's id
  document.querySelectorAll(`option[value="${patternId}"]`).forEach(opt => {
    opt.textContent = name;
  });
}

function selectEditDrumPattern(patternId) {
  if (!song.drumPatterns?.some(p => p.id === patternId)) return;
  editingDrumPatternId = patternId;
  const activeSection = song.sections.find(s => s.id === song.selectedSectionId);
  if (activeSection) {
    activeSection.drumPatternId = patternId;
    const sectionDrumSelect = document.querySelector(`.section[data-id="${activeSection.id}"] .section-drum-pattern-select`);
    if (sectionDrumSelect) sectionDrumSelect.value = patternId;
    commitSong();
  }
  renderDrumSequencer();
}

function updateSectionDrumPattern(sectionId, patternId) {
  const section = song.sections.find(s => s.id === sectionId);
  if (!section) return;
  if (!song.drumPatterns?.some(p => p.id === patternId)) return;
  section.drumPatternId = patternId;
  if (sectionId === song.selectedSectionId) {
    editingDrumPatternId = patternId;
    renderDrumSequencer();
  }
  commitSong();
}

// =====================================================================
// PERSISTENCE – localStorage + JSON export/import
// =====================================================================

const STORAGE_KEY = 'chordz_song_v1';
const SONG_LIBRARY_KEY = 'chordz_song_library_v1';

function normalizeSongTitle(rawTitle) {
  if (typeof rawTitle !== 'string') return 'Untitled Song';
  const trimmed = rawTitle.trim();
  return trimmed || 'Untitled Song';
}

function formatRecentSongTime(timestamp) {
  const date = new Date(Number(timestamp) || Date.now());
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function loadSongLibrary() {
  try {
    const raw = localStorage.getItem(SONG_LIBRARY_KEY);
    if (!raw) return { lastSongId: null, songs: [] };
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.songs)) return { lastSongId: null, songs: [] };
    const songs = parsed.songs
      .map(entry => {
        const normalized = normalizeSong(entry?.data || entry?.song || null);
        return {
          id: normalized.id,
          title: normalizeSongTitle(entry?.title || normalized.title),
          updatedAt: Number.isFinite(Number(entry?.updatedAt)) ? Number(entry.updatedAt) : Date.now(),
          data: normalized,
        };
      })
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, RECENT_SONG_LIMIT);
    const lastSongId = typeof parsed.lastSongId === 'string' ? parsed.lastSongId : songs[0]?.id || null;
    return { lastSongId, songs };
  } catch (_) {
    return { lastSongId: null, songs: [] };
  }
}

function saveSongLibrary(library) {
  localStorage.setItem(SONG_LIBRARY_KEY, JSON.stringify({
    lastSongId: library.lastSongId || null,
    songs: (library.songs || []).slice(0, RECENT_SONG_LIMIT),
  }));
}

function saveSongToLibrary(songData) {
  const library = loadSongLibrary();
  const normalized = normalizeSong(songData);
  normalized.title = normalizeSongTitle(normalized.title);
  normalized.updatedAt = Date.now();
  const existingIndex = library.songs.findIndex(entry => entry.id === normalized.id);
  const record = {
    id: normalized.id,
    title: normalized.title,
    updatedAt: normalized.updatedAt,
    data: normalized,
  };
  if (existingIndex >= 0) library.songs.splice(existingIndex, 1);
  library.songs.unshift(record);
  library.songs = library.songs
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, RECENT_SONG_LIMIT);
  library.lastSongId = normalized.id;
  saveSongLibrary(library);
}

function renderRecentSongsDropdown() {
  const select = document.getElementById('recent-song-select');
  if (!select) return;
  const library = loadSongLibrary();
  select.innerHTML = '';
  if (!library.songs.length) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No recent songs saved yet';
    select.appendChild(option);
    select.value = '';
    return;
  }
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Open most recent…';
  select.appendChild(placeholder);
  library.songs.forEach(entry => {
    const option = document.createElement('option');
    option.value = entry.id;
    option.textContent = `${normalizeSongTitle(entry.title)} — ${formatRecentSongTime(entry.updatedAt)}`;
    select.appendChild(option);
  });
  if (song.id && library.songs.some(entry => entry.id === song.id)) select.value = song.id;
  else select.value = '';
}

function openRecentSong(songId) {
  if (!songId) return;
  const library = loadSongLibrary();
  const entry = library.songs.find(item => item.id === songId);
  if (!entry?.data) return;
  song = normalizeSong(entry.data);
  render();
  saveSong();
}

function saveSong() {
  const titleElement = document.getElementById('song-title');
  song.title = normalizeSongTitle(titleElement ? titleElement.value : song.title);
  song.updatedAt = Date.now();
  if (titleElement && document.activeElement !== titleElement) titleElement.value = song.title;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(song));
    saveSongToLibrary(song);
    renderRecentSongsDropdown();
  } catch (_) {
    /* quota exceeded – silently ignore */
  }
}

function loadSong() {
  const library = loadSongLibrary();
  const preferredId = library.lastSongId || library.songs[0]?.id || null;
  const preferred = preferredId ? library.songs.find(entry => entry.id === preferredId) : library.songs[0];
  if (preferred?.data) {
    song = normalizeSong(preferred.data);
    return true;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.sections)) {
      song = normalizeSong(parsed);
      saveSongToLibrary(song);
      return true;
    }
  } catch (_) {
    /* corrupt data – start fresh */
  }
  return false;
}

function resetSong() {
  if (!confirm('Clear the current song and start fresh?')) return;
  localStorage.removeItem(STORAGE_KEY);
  song = normalizeSong(createDefaultSong());
  saveSong();
  render();
}

function exportJSON() {
  saveSong();
  const json = JSON.stringify(song, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = sanitizeFilename(song.title || 'song') + '.chordz.json';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function importJSON() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json,.json';
  input.onchange = event => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = loadEvent => {
      try {
        const parsed = JSON.parse(loadEvent.target.result);
        if (!parsed || !Array.isArray(parsed.sections)) throw new Error('Invalid song file.');
        song = normalizeSong(parsed);
        render();
        saveSong();
      } catch (error) {
        alert('Import failed: ' + error.message);
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
// AUDIO – Web Audio API beat scheduler + synth engine
// =====================================================================

let audioCtx = null;
let audioRouting = null;
let schedulerTimer = null;
let nextNoteTime = 0;
let currentStep = 0;
let isBeating = false;
let songEndedPending = false;
let playbackCursor = {
  sequenceIndex: 0,
  sectionIndex: 0,
  chordIndex: 0,
  beatInChord: 0,
  beatInSection: 0,
  arrangerEntryId: null,
  arrangerEntryIndex: null,
  arrangerRepeatIndex: 0,
  songBeatIndex: 0,
};
let lastHighlightedChordId = null;

const STEPS = 16;
const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD = 0.1;

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    setupAudioRouting();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function createImpulseResponse(seconds = 1.8, decay = 2.2) {
  const ctx = getAudioCtx();
  const length = Math.floor(ctx.sampleRate * seconds);
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < impulse.numberOfChannels; channel++) {
    const data = impulse.getChannelData(channel);
    for (let index = 0; index < length; index++) {
      const t = index / Math.max(1, length - 1);
      data[index] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay);
    }
  }
  return impulse;
}

function setupAudioRouting() {
  if (!audioCtx || audioRouting) return;
  const ctx = audioCtx;
  const master = ctx.createGain();
  master.connect(ctx.destination);

  const makeInstrumentBus = () => {
    const input = ctx.createGain();
    const dry = ctx.createGain();
    const wet = ctx.createGain();
    const output = ctx.createGain();
    const convolver = ctx.createConvolver();
    convolver.buffer = createImpulseResponse();
    input.connect(dry);
    input.connect(convolver);
    convolver.connect(wet);
    dry.connect(output);
    wet.connect(output);
    output.connect(master);
    return { input, dry, wet, output, convolver };
  };

  const drumsGain = ctx.createGain();
  drumsGain.connect(master);

  audioRouting = {
    master,
    chord: makeInstrumentBus(),
    bass: makeInstrumentBus(),
    drums: { input: drumsGain, output: drumsGain },
  };
  applyAudioMixSettings();
}

function applyAudioMixSettings() {
  if (!audioRouting) return;
  const mixer = song.mixer || {};
  const reverb = song.reverb || {};
  const masterVolume = clampNumber(mixer.masterVolume, 0.95, 0, 1);

  audioRouting.master.gain.value = masterVolume;
  const setBus = (kind, volume, wet) => {
    const bus = audioRouting[kind];
    if (!bus) return;
    const wetMix = clampNumber(wet, 0.2, 0, 1);
    bus.output.gain.value = clampNumber(volume, 0.9, 0, 1);
    bus.wet.gain.value = wetMix;
    bus.dry.gain.value = 1 - wetMix;
  };

  setBus('chord', mixer.chordVolume, reverb.chordWet);
  setBus('bass', mixer.bassVolume, reverb.bassWet);
  if (audioRouting.drums) {
    audioRouting.drums.output.gain.value = clampNumber(mixer.drumsVolume, 0.9, 0, 1);
  }
}

function createNoiseBuffer(duration) {
  const ctx = getAudioCtx();
  const length = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < length; index++) data[index] = Math.random() * 2 - 1;
  return buffer;
}

function playKick(time) {
  const ctx = getAudioCtx();
  const dest = audioRouting?.drums?.input || ctx.destination;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(dest);
  osc.frequency.setValueAtTime(120, time);
  osc.frequency.exponentialRampToValueAtTime(40, time + 0.12);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(1.05, time + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.35);
  osc.start(time);
  osc.stop(time + 0.35);
}

function playSnare(time) {
  const ctx = getAudioCtx();
  const dest = audioRouting?.drums?.input || ctx.destination;
  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(0.16);
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'highpass';
  noiseFilter.frequency.value = 1600;
  const noiseGain = ctx.createGain();
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(dest);
  noiseGain.gain.setValueAtTime(0.0001, time);
  noiseGain.gain.linearRampToValueAtTime(0.65, time + 0.002);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.14);
  noise.start(time);
  noise.stop(time + 0.16);

  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = 'triangle';
  osc.connect(oscGain);
  oscGain.connect(dest);
  osc.frequency.setValueAtTime(220, time);
  osc.frequency.exponentialRampToValueAtTime(110, time + 0.08);
  oscGain.gain.setValueAtTime(0.0001, time);
  oscGain.gain.linearRampToValueAtTime(0.36, time + 0.002);
  oscGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.09);
  osc.start(time);
  osc.stop(time + 0.09);
}

function playClosedHat(time) {
  const ctx = getAudioCtx();
  const dest = audioRouting?.drums?.input || ctx.destination;
  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(0.05);
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 7000;
  const gain = ctx.createGain();
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(0.2, time + 0.001);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.045);
  noise.start(time);
  noise.stop(time + 0.05);
}

function playHiHat(time) { playClosedHat(time); }

function playOpenHat(time) {
  const ctx = getAudioCtx();
  const dest = audioRouting?.drums?.input || ctx.destination;
  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(0.45);
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 5000;
  const gain = ctx.createGain();
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(0.28, time + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.4);
  noise.start(time);
  noise.stop(time + 0.45);
}

function playHighTom(time) {
  const ctx = getAudioCtx();
  const dest = audioRouting?.drums?.input || ctx.destination;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(dest);
  osc.frequency.setValueAtTime(260, time);
  osc.frequency.exponentialRampToValueAtTime(150, time + 0.15);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(0.75, time + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);
  osc.start(time);
  osc.stop(time + 0.25);
}

function playMidTom(time) {
  const ctx = getAudioCtx();
  const dest = audioRouting?.drums?.input || ctx.destination;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(dest);
  osc.frequency.setValueAtTime(190, time);
  osc.frequency.exponentialRampToValueAtTime(100, time + 0.18);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(0.75, time + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.28);
  osc.start(time);
  osc.stop(time + 0.32);
}

function playLowTom(time) {
  const ctx = getAudioCtx();
  const dest = audioRouting?.drums?.input || ctx.destination;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(dest);
  osc.frequency.setValueAtTime(130, time);
  osc.frequency.exponentialRampToValueAtTime(65, time + 0.22);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(0.8, time + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.34);
  osc.start(time);
  osc.stop(time + 0.38);
}

function playRide(time) {
  const ctx = getAudioCtx();
  const dest = audioRouting?.drums?.input || ctx.destination;
  const masterGain = ctx.createGain();
  masterGain.connect(dest);
  masterGain.gain.setValueAtTime(0.0001, time);
  masterGain.gain.linearRampToValueAtTime(0.18, time + 0.002);
  masterGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.28);
  [560, 845, 1174, 1523, 1780].forEach(freq => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    g.gain.value = 0.04;
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(g);
    g.connect(masterGain);
    osc.start(time);
    osc.stop(time + 0.3);
  });
}

function playDrumLane(key, time) {
  switch (key) {
    case 'kick':      playKick(time); break;
    case 'snare':     playSnare(time); break;
    case 'closedHat': playClosedHat(time); break;
    case 'openHat':   playOpenHat(time); break;
    case 'hiTom':     playHighTom(time); break;
    case 'midTom':    playMidTom(time); break;
    case 'lowTom':    playLowTom(time); break;
    case 'ride':      playRide(time); break;
  }
}

function scheduleStep(step, time) {
  const section = song.sections[playbackCursor.sectionIndex];
  const patternId = section?.drumPatternId;
  const patterns = song.drumPatterns || [];
  const pattern = patterns.find(p => p.id === patternId) || patterns[0];
  if (!pattern) return;
  DRUM_LANES.forEach(lane => {
    if (pattern.grid[lane.key]?.[step]) playDrumLane(lane.key, time);
  });
}

function playCrash(time) {
  const ctx = getAudioCtx();
  const dest = audioRouting?.drums?.input || ctx.destination;
  const source = ctx.createBufferSource();
  source.buffer = createNoiseBuffer(0.8);
  const highpass = ctx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 3500;
  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 6200;
  bandpass.Q.value = 0.7;
  const gain = ctx.createGain();
  source.connect(highpass);
  highpass.connect(bandpass);
  bandpass.connect(gain);
  gain.connect(dest);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(0.45, time + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.8);
  source.start(time);
  source.stop(time + 0.8);
}

function playRoll(time) {
  for (let index = 0; index < 6; index++) playSnare(time + index * 0.06);
}

function frequencyFromMidi(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function scheduleADSR(gainNode, time, peak, sustain, attack, decay, release, duration) {
  const attackEnd = time + Math.max(0.005, attack);
  const decayEnd = attackEnd + Math.max(0.02, decay);
  const noteEnd = time + Math.max(duration, attack + decay + release + 0.04);
  const releaseStart = Math.max(decayEnd, noteEnd - Math.max(0.05, release));
  const sustainLevel = Math.max(0.0001, peak * Math.max(0, Math.min(1, sustain)));

  gainNode.gain.cancelScheduledValues(time);
  gainNode.gain.setValueAtTime(0.0001, time);
  gainNode.gain.linearRampToValueAtTime(Math.max(0.0001, peak), attackEnd);
  gainNode.gain.linearRampToValueAtTime(sustainLevel, decayEnd);
  gainNode.gain.setValueAtTime(sustainLevel, releaseStart);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, noteEnd);
  return noteEnd;
}

const distortionCurveCache = new Map();
function getDistortionCurve(amount) {
  const normalized = Math.max(0, Math.min(1, Number(amount) || 0));
  const key = Math.round(normalized * 1000);
  if (distortionCurveCache.has(key)) return distortionCurveCache.get(key);
  const samples = 2048;
  const curve = new Float32Array(samples);
  const k = normalized * 180;
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / (samples - 1) - 1;
    curve[i] = ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(x));
  }
  distortionCurveCache.set(key, curve);
  return curve;
}

function playSynthVoice(freq, time, duration, synthSettings, kind = 'chord') {
  const ctx = getAudioCtx();
  const voiceGain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(synthSettings.cutoff, time);
  filter.Q.setValueAtTime(synthSettings.resonance, time);
  const driveAmount = clampNumber(synthSettings.distortion, 0, 0, 1);
  if (driveAmount > 0.001) {
    const shaper = ctx.createWaveShaper();
    shaper.curve = getDistortionCurve(driveAmount);
    shaper.oversample = '2x';
    filter.connect(shaper);
    shaper.connect(voiceGain);
  } else {
    filter.connect(voiceGain);
  }
  voiceGain.connect(audioRouting?.[kind]?.input || ctx.destination);

  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const mix1 = ctx.createGain();
  const mix2 = ctx.createGain();

  osc1.type = synthSettings.osc1Type;
  osc2.type = synthSettings.osc2Type;
  osc1.frequency.setValueAtTime(freq, time);
  osc2.frequency.setValueAtTime(freq * Math.pow(2, (synthSettings.osc2Interval * 100 + synthSettings.detune) / 1200), time);
  mix1.gain.value = Math.max(0.05, 1 - synthSettings.mix);
  mix2.gain.value = Math.max(0.05, synthSettings.mix);

  osc1.connect(mix1);
  osc2.connect(mix2);
  mix1.connect(filter);
  mix2.connect(filter);

  const modRate = clampNumber(synthSettings.modRate, 0, 0, 12);
  const modDepth = clampNumber(synthSettings.modDepth, 0, 0, 80);
  if (modRate > 0.01 && modDepth > 0.01) {
    const lfo = ctx.createOscillator();
    const lfoGain1 = ctx.createGain();
    const lfoGain2 = ctx.createGain();
    const depthHz1 = freq * (Math.pow(2, modDepth / 1200) - 1);
    const freq2 = freq * Math.pow(2, (synthSettings.osc2Interval * 100 + synthSettings.detune) / 1200);
    const depthHz2 = freq2 * (Math.pow(2, modDepth / 1200) - 1);
    lfo.frequency.setValueAtTime(modRate, time);
    lfoGain1.gain.setValueAtTime(depthHz1, time);
    lfoGain2.gain.setValueAtTime(depthHz2, time);
    lfo.connect(lfoGain1);
    lfo.connect(lfoGain2);
    lfoGain1.connect(osc1.frequency);
    lfoGain2.connect(osc2.frequency);
    lfo.start(time);
    lfo.stop(time + Math.max(duration, 0.1) + Math.max(0.05, synthSettings.release) + 0.05);
  }

  const noteEnd = scheduleADSR(
    voiceGain,
    time,
    synthSettings.volume,
    synthSettings.sustain,
    synthSettings.attack,
    synthSettings.decay,
    synthSettings.release,
    duration,
  );

  osc1.start(time);
  osc2.start(time);
  osc1.stop(noteEnd + 0.02);
  osc2.stop(noteEnd + 0.02);
}

function playChordNotes(rootSemitone, typeName, when, beats = 4, repeats = 1, startBeat = 1) {
  const chordType = chordTypeObj(typeName);
  const rootMidi = 60 + rootSemitone;
  const totalBeats = clampInt(beats, 4, 1, 64);
  const repeatCount = normalizeRepeat(repeats, 1);
  const effectiveStartBeat = Math.min(totalBeats, normalizeStartBeat(startBeat, 1));
  const startOffsetBeats = effectiveStartBeat - 1;
  const activeBeats = Math.max(0.25, totalBeats - startOffsetBeats);
  const hitBeats = Math.max(0.25, activeBeats / repeatCount);
  const hitDuration = Math.max(0.1, beatsToSeconds(hitBeats) * 0.92);
  for (let hit = 0; hit < repeatCount; hit++) {
    const hitTime = when + beatsToSeconds(startOffsetBeats + hit * hitBeats);
    chordType.intervals.forEach(interval => {
      playSynthVoice(
        frequencyFromMidi(rootMidi + interval),
        hitTime,
        hitDuration,
        song.chordSynth,
        'chord',
      );
    });
  }
}

function playBassNote(rootSemitone, when, beats = 4, repeats = 1, startBeat = 1) {
  const bassMidi = 36 + rootSemitone;
  const totalBeats = clampInt(beats, 4, 1, 64);
  const repeatCount = normalizeRepeat(repeats, 1);
  const effectiveStartBeat = Math.min(totalBeats, normalizeStartBeat(startBeat, 1));
  const startOffsetBeats = effectiveStartBeat - 1;
  const activeBeats = Math.max(0.25, totalBeats - startOffsetBeats);
  const hitBeats = Math.max(0.25, activeBeats / repeatCount);
  const hitDuration = Math.max(0.09, beatsToSeconds(hitBeats) * 0.9);
  for (let hit = 0; hit < repeatCount; hit++) {
    const hitTime = when + beatsToSeconds(startOffsetBeats + hit * hitBeats);
    playSynthVoice(frequencyFromMidi(bassMidi), hitTime, hitDuration, song.bassSynth, 'bass');
  }
}

function getSectionBeatLength(section) {
  return section.chords.reduce((sum, chord) => sum + (chord.beats || 4), 0);
}

function getSongSectionSequence() {
  if (Array.isArray(song.arranger) && song.arranger.length) {
    const sequence = [];
    song.arranger.forEach((entry, arrangerEntryIndex) => {
      const sectionIndex = song.sections.findIndex(section => section.id === entry.sectionId);
      if (sectionIndex < 0) return;
      const repeats = clampInt(entry.repeats, 1, 1, 16);
      for (let repeatIndex = 0; repeatIndex < repeats; repeatIndex++) {
        sequence.push({
          sectionIndex,
          arrangerEntryId: entry.id,
          arrangerEntryIndex,
          arrangerRepeatIndex: repeatIndex,
        });
      }
    });
    if (sequence.length) return sequence;
  }
  return song.sections.map((_, sectionIndex) => ({
    sectionIndex,
    arrangerEntryId: null,
    arrangerEntryIndex: null,
    arrangerRepeatIndex: 0,
  }));
}

function buildSongBeatMap() {
  const map = [];
  const sequence = getSongSectionSequence();
  sequence.forEach((sequencePoint, sequenceIndex) => {
    const section = song.sections[sequencePoint.sectionIndex];
    if (!section) return;
    let beatInSection = 0;
    section.chords.forEach((chord, chordIndex) => {
      const beats = chord.beats || 4;
      for (let beatInChord = 0; beatInChord < beats; beatInChord++) {
        map.push({
          sequenceIndex,
          sectionIndex: sequencePoint.sectionIndex,
          chordIndex,
          beatInChord,
          beatInSection: beatInSection + beatInChord,
          arrangerEntryId: sequencePoint.arrangerEntryId,
          arrangerEntryIndex: sequencePoint.arrangerEntryIndex,
          arrangerRepeatIndex: sequencePoint.arrangerRepeatIndex,
        });
      }
      beatInSection += beats;
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
  const arrangerInfo = song.arranger?.length
    ? ` • slot ${playbackCursor.arrangerEntryIndex + 1}.${playbackCursor.arrangerRepeatIndex + 1}`
    : '';
  return `Position: ${section.name}${arrangerInfo} • ${formatPitchLabel(chord.root)}${chord.type} • beat ${beatInChord + 1}/${chord.beats || 4}`;
}

function updatePlaybackPositionUI(sectionIndex, chordIndex, beatInChord, songBeatIndex) {
  const positionElement = document.getElementById('playback-position');
  if (positionElement) positionElement.textContent = formatPlaybackPosition(sectionIndex, chordIndex, beatInChord);

  const slider = document.getElementById('song-go-to');
  if (slider && song.playbackMode === 'song') slider.value = String(songBeatIndex);

  const label = document.getElementById('song-go-to-label');
  if (label) {
    const section = song.sections[sectionIndex];
    const chord = section?.chords[chordIndex];
    if (section && chord) label.textContent = `${section.name} → ${formatPitchLabel(chord.root)}${chord.type} (beat ${beatInChord + 1})`;
    else if (section) label.textContent = `${section.name} → rest`;
    else label.textContent = 'Start';
  }

  updatePlaybackHighlights();
}

function setSongPositionFromSlider(rawValue) {
  const map = buildSongBeatMap();
  if (!map.length) return;
  const index = Math.max(0, Math.min(map.length - 1, clampInt(rawValue, 0, 0, map.length - 1)));
  const point = map[index];
  playbackCursor.sequenceIndex = point.sequenceIndex;
  playbackCursor.sectionIndex = point.sectionIndex;
  playbackCursor.chordIndex = point.chordIndex;
  playbackCursor.beatInChord = point.beatInChord;
  playbackCursor.beatInSection = point.beatInSection;
  playbackCursor.arrangerEntryId = point.arrangerEntryId;
  playbackCursor.arrangerEntryIndex = point.arrangerEntryIndex;
  playbackCursor.arrangerRepeatIndex = point.arrangerRepeatIndex;
  playbackCursor.songBeatIndex = index;
  updatePlaybackPositionUI(playbackCursor.sectionIndex, playbackCursor.chordIndex, playbackCursor.beatInChord, playbackCursor.songBeatIndex);
}

function initializePlaybackCursor() {
  const mode = song.playbackMode || 'edit';
  if (mode === 'song') {
    setSongPositionFromSlider(document.getElementById('song-go-to')?.value || 0);
    return;
  }
  let sectionIndex = song.sections.findIndex(section => section.id === song.selectedSectionId);
  if (sectionIndex < 0) sectionIndex = 0;
  playbackCursor.sectionIndex = sectionIndex;
  playbackCursor.sequenceIndex = sectionIndex;
  playbackCursor.chordIndex = 0;
  playbackCursor.beatInChord = 0;
  playbackCursor.beatInSection = 0;
  playbackCursor.arrangerEntryId = null;
  playbackCursor.arrangerEntryIndex = null;
  playbackCursor.arrangerRepeatIndex = 0;
  playbackCursor.songBeatIndex = 0;
  updatePlaybackPositionUI(playbackCursor.sectionIndex, 0, 0, 0);
}

function advancePlaybackCursor() {
  const mode = song.playbackMode || 'edit';
  if (mode === 'song') {
    const map = buildSongBeatMap();
    if (!map.length) return;
    const nextIndex = playbackCursor.songBeatIndex + 1;
    if (nextIndex >= map.length) {
      songEndedPending = true;
      return;
    }
    const point = map[nextIndex];
    playbackCursor.sequenceIndex = point.sequenceIndex;
    playbackCursor.sectionIndex = point.sectionIndex;
    playbackCursor.chordIndex = point.chordIndex;
    playbackCursor.beatInChord = point.beatInChord;
    playbackCursor.beatInSection = point.beatInSection;
    playbackCursor.arrangerEntryId = point.arrangerEntryId;
    playbackCursor.arrangerEntryIndex = point.arrangerEntryIndex;
    playbackCursor.arrangerRepeatIndex = point.arrangerRepeatIndex;
    playbackCursor.songBeatIndex = nextIndex;
    return;
  }

  const section = song.sections[playbackCursor.sectionIndex];
  if (!section) return;
  const chord = section.chords[playbackCursor.chordIndex];
  if (!chord) return;

  playbackCursor.beatInChord += 1;
  playbackCursor.beatInSection += 1;

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
  if ((song.playbackMode || 'edit') === 'song' && !buildSongBeatMap().length) {
    songEndedPending = true;
    return;
  }
  const section = song.sections[playbackCursor.sectionIndex];
  if (!section) return;

  if (!section.chords.length) {
    updatePlaybackPositionUI(playbackCursor.sectionIndex, 0, 0, playbackCursor.songBeatIndex);
    if ((song.playbackMode || 'edit') === 'song') advancePlaybackCursor();
    return;
  }

  const chord = section.chords[playbackCursor.chordIndex];
  if (!chord) return;

  if (playbackCursor.beatInSection === 0 && section.crashOnStart) playCrash(time);
  if (playbackCursor.beatInChord === 0) {
    const chordStartBeat = getChordPlaybackStartBeat(chord);
    playChordNotes(chord.root, chord.type, time, chord.beats || 4, chord.chordRepeat || 1, chordStartBeat);
    if (song.bassEnabled) playBassNote(getChordBassRoot(chord), time, chord.beats || 4, chord.bassRepeat || 1, chordStartBeat);
  }

  const sectionBeats = getSectionBeatLength(section);
  if (section.rollAtEnd && playbackCursor.beatInSection === sectionBeats - 1) playRoll(time);

  updatePlaybackPositionUI(playbackCursor.sectionIndex, playbackCursor.chordIndex, playbackCursor.beatInChord, playbackCursor.songBeatIndex);
  advancePlaybackCursor();

  if (songEndedPending) {
    songEndedPending = false;
    const delay = Math.max(0, (time - getAudioCtx().currentTime) * 1000);
    setTimeout(() => {
      stopBeat();
      stopIndicatorFlash();
      const positionElement = document.getElementById('playback-position');
      if (positionElement) positionElement.textContent += ' • End';
    }, delay + 20);
  }
}

function scheduler() {
  const ctx = getAudioCtx();
  while (nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD) {
    scheduleStep(currentStep, nextNoteTime);
    if (currentStep % 4 === 0 && isBeating) scheduleMusicalBeat(nextNoteTime);
    const secondsPerSixteenth = (60 / song.bpm) / 4;
    nextNoteTime += secondsPerSixteenth;
    currentStep = (currentStep + 1) % STEPS;
  }
  schedulerTimer = setTimeout(scheduler, LOOKAHEAD_MS);
}

function startBeat() {
  if (isBeating) stopBeat();
  isBeating = true;
  songEndedPending = false;
  currentStep = 0;
  initializePlaybackCursor();
  nextNoteTime = getAudioCtx().currentTime + 0.05;
  scheduler();
  document.getElementById('beat-start').disabled = true;
  document.getElementById('beat-stop').disabled = false;
  document.getElementById('beat-indicator').classList.add('playing');
  updatePlaybackHighlights();
}

function stopBeat() {
  isBeating = false;
  if (schedulerTimer !== null) {
    clearTimeout(schedulerTimer);
    schedulerTimer = null;
  }
  document.getElementById('beat-start').disabled = false;
  document.getElementById('beat-stop').disabled = true;
  document.getElementById('beat-indicator').classList.remove('playing');
  lastHighlightedChordId = null;
  updatePlaybackHighlights();
}

function auditionChord(rootSemitone, typeName) {
  const chordType = chordTypeObj(typeName);
  const rootMidi = 60 + rootSemitone;
  chordType.intervals.forEach((interval, index) => {
    const when = getAudioCtx().currentTime + index * 0.08;
    playSynthVoice(frequencyFromMidi(rootMidi + interval), when, 0.8, song.chordSynth);
  });
}

// =====================================================================
// RENDER
// =====================================================================

function renderDrumSequencer() {
  const panel = document.getElementById('drum-sequencer-panel');
  if (!panel) return;
  panel.innerHTML = '';

  const patterns = song.drumPatterns || [];
  if (!patterns.length) return;

  // Ensure editingDrumPatternId is valid; prefer the selected section's pattern
  if (!editingDrumPatternId || !patterns.some(p => p.id === editingDrumPatternId)) {
    const selectedSection = song.sections.find(s => s.id === song.selectedSectionId);
    editingDrumPatternId = selectedSection?.drumPatternId || patterns[0].id;
  }
  const pattern = patterns.find(p => p.id === editingDrumPatternId);

  // Header
  const header = document.createElement('div');
  header.className = 'drum-seq-header';
  const title = document.createElement('h2');
  title.textContent = '🥁 Drum Sequencer';
  const helpText = document.createElement('p');
  helpText.className = 'drum-seq-help';
  helpText.textContent = '8-lane 16th-note grid • Click steps to toggle on/off • Each section can use a different pattern (set in the section options row below)';
  header.append(title, helpText);

  // Controls row: pattern selector + name input
  const controlsRow = document.createElement('div');
  controlsRow.className = 'drum-seq-controls-row';

  const patternLabel = document.createElement('label');
  patternLabel.className = 'drum-seq-label-wrap';
  const patternText = document.createElement('span');
  patternText.textContent = 'Edit pattern';
  const patternSelect = document.createElement('select');
  patternSelect.id = 'drum-pattern-select';
  patternSelect.setAttribute('aria-label', 'Select drum pattern to edit');
  patterns.forEach(p => {
    const option = document.createElement('option');
    option.value = p.id;
    option.textContent = p.name;
    if (p.id === editingDrumPatternId) option.selected = true;
    patternSelect.appendChild(option);
  });
  patternSelect.addEventListener('change', () => selectEditDrumPattern(patternSelect.value));
  patternLabel.append(patternText, patternSelect);

  const nameLabel = document.createElement('label');
  nameLabel.className = 'drum-seq-label-wrap';
  const nameText = document.createElement('span');
  nameText.textContent = 'Pattern name';
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'drum-seq-name-input';
  nameInput.value = pattern.name;
  nameInput.placeholder = 'Pattern name…';
  nameInput.setAttribute('aria-label', 'Drum pattern name');
  nameInput.addEventListener('input', () => updateDrumPatternName(editingDrumPatternId, nameInput.value));
  nameLabel.append(nameText, nameInput);

  controlsRow.append(patternLabel, nameLabel);

  // Grid container
  const grid = document.createElement('div');
  grid.className = 'drum-seq-grid';

  // Step numbers header row
  const numbersRow = document.createElement('div');
  numbersRow.className = 'drum-seq-lane';
  const spacer = document.createElement('span');
  spacer.className = 'drum-seq-lane-label';
  numbersRow.appendChild(spacer);
  const stepsWrap = document.createElement('div');
  stepsWrap.className = 'drum-seq-steps';
  for (let s = 0; s < 16; s++) {
    const num = document.createElement('span');
    num.className = 'drum-seq-step-num' + (s % 4 === 0 ? ' beat-start' : '');
    num.textContent = String(s + 1);
    stepsWrap.appendChild(num);
  }
  numbersRow.appendChild(stepsWrap);
  grid.appendChild(numbersRow);

  // Lane rows
  DRUM_LANES.forEach(lane => {
    const row = document.createElement('div');
    row.className = 'drum-seq-lane';

    const laneLabel = document.createElement('span');
    laneLabel.className = 'drum-seq-lane-label';
    laneLabel.textContent = lane.label;

    const steps = document.createElement('div');
    steps.className = 'drum-seq-steps';

    for (let s = 0; s < 16; s++) {
      const active = Boolean(pattern.grid[lane.key]?.[s]);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'drum-seq-btn' +
        (s % 4 === 0 ? ' beat-start' : '') +
        (active ? ' active' : '');
      btn.setAttribute('aria-label', `${lane.label} step ${s + 1}`);
      btn.setAttribute('aria-pressed', String(active));
      btn.title = `${lane.label} • step ${s + 1}`;
      // Capture s and lane for the closure
      const step = s;
      const laneKey = lane.key;
      btn.addEventListener('click', () => {
        updateDrumStep(editingDrumPatternId, laneKey, step);
        btn.classList.toggle('active');
        btn.setAttribute('aria-pressed', String(btn.classList.contains('active')));
      });
      steps.appendChild(btn);
    }

    row.append(laneLabel, steps);
    grid.appendChild(row);
  });

  panel.append(header, controlsRow, grid);
}

function render() {
  song = normalizeSong(song);

  const titleElement = document.getElementById('song-title');
  if (titleElement) titleElement.value = song.title || '';

  const bpmElement = document.getElementById('bpm-input');
  if (bpmElement) bpmElement.value = song.bpm || 100;

  const modeElement = document.getElementById('playback-mode-select');
  if (modeElement) modeElement.value = song.playbackMode || 'edit';

  renderRecentSongsDropdown();
  renderMixerPanel();
  renderDrumSequencer();
  renderSynthRack();
  renderArrangerPanel();

  const container = document.getElementById('sections-container');
  if (!container) return;
  container.innerHTML = '';
  song.sections.forEach(section => container.appendChild(buildSection(section)));
  updateSongGoToControl();
  updatePlaybackModeUI();
  initializePlaybackCursor();
  applyAudioMixSettings();
}

function renderMixerPanel() {
  const panel = document.getElementById('mixer-panel');
  if (!panel) return;
  panel.innerHTML = '';

  const title = document.createElement('h2');
  title.textContent = 'Mixer';
  const help = document.createElement('p');
  help.className = 'mixer-help';
  help.textContent = 'Balance chord, bass, and drum levels. Reverb wet/dry is per instrument in each synth card.';

  const controls = document.createElement('div');
  controls.className = 'mixer-controls';
  controls.append(
    buildMixerSlider('Chords', song.mixer.chordVolume, value => updateMixerField('chordVolume', value)),
    buildMixerSlider('Bass', song.mixer.bassVolume, value => updateMixerField('bassVolume', value)),
    buildMixerSlider('Drums', song.mixer.drumsVolume, value => updateMixerField('drumsVolume', value)),
    buildMixerSlider('Output', song.mixer.masterVolume, value => updateMixerField('masterVolume', value)),
  );

  panel.append(title, help, controls);
}

function buildMixerSlider(labelText, value, onInput) {
  const wrap = document.createElement('label');
  wrap.className = 'mixer-slider';

  const top = document.createElement('div');
  top.className = 'mixer-slider-top';
  const label = document.createElement('span');
  label.textContent = labelText;
  const valueText = document.createElement('span');
  valueText.className = 'mixer-slider-value';
  valueText.textContent = `${Math.round(value * 100)}%`;
  top.append(label, valueText);

  const input = document.createElement('input');
  input.type = 'range';
  input.min = '0';
  input.max = '1';
  input.step = '0.01';
  input.value = String(value);
  input.addEventListener('input', () => {
    valueText.textContent = `${Math.round(Number(input.value) * 100)}%`;
    onInput(input.value);
  });

  wrap.append(top, input);
  return wrap;
}

function renderArrangerPanel() {
  const panel = document.getElementById('arranger-panel');
  if (!panel) return;
  panel.innerHTML = '';

  const title = document.createElement('h2');
  title.textContent = 'Song Arranger';
  const help = document.createElement('p');
  help.className = 'arranger-help';
  help.textContent = 'Drag arranger rows to set Song mode order. Each row picks a section and repeat count. Empty arranger falls back to section order.';

  const addRow = document.createElement('div');
  addRow.className = 'arranger-add-row';
  const addSelect = document.createElement('select');
  addSelect.id = 'arranger-add-section';
  song.sections.forEach(section => {
    const option = document.createElement('option');
    option.value = section.id;
    option.textContent = section.name;
    addSelect.appendChild(option);
  });
  const addButton = document.createElement('button');
  addButton.className = 'action-btn';
  addButton.textContent = '+ Add to arranger';
  addButton.addEventListener('click', () => addArrangerEntry(addSelect.value));
  addRow.append(addSelect, addButton);

  const list = document.createElement('div');
  list.className = 'arranger-list';
  list.addEventListener('dragover', event => {
    event.preventDefault();
    list.classList.add('drag-over');
  });
  list.addEventListener('dragleave', () => list.classList.remove('drag-over'));
  list.addEventListener('drop', event => {
    event.preventDefault();
    list.classList.remove('drag-over');
    const draggedEntryId = event.dataTransfer.getData('text/arranger-entry-id');
    if (draggedEntryId) moveArrangerEntry(draggedEntryId, null, true);
  });

  if (!song.arranger.length) {
    const empty = document.createElement('div');
    empty.className = 'arranger-empty';
    empty.textContent = 'No arranger entries yet. Song mode will play sections top-to-bottom.';
    list.appendChild(empty);
  } else {
    song.arranger.forEach((entry, index) => list.appendChild(buildArrangerEntry(entry, index)));
  }

  panel.append(title, help, addRow, list);
}

function buildArrangerEntry(entry, index) {
  const row = document.createElement('div');
  row.className = 'arranger-entry';
  row.id = 'arranger-entry-' + entry.id;
  row.draggable = true;

  const dragHandle = document.createElement('span');
  dragHandle.className = 'arranger-drag';
  dragHandle.textContent = '↕';
  dragHandle.title = 'Drag to reorder';

  const order = document.createElement('span');
  order.className = 'arranger-order';
  order.textContent = String(index + 1);

  const sectionSelect = document.createElement('select');
  sectionSelect.className = 'arranger-section-select';
  song.sections.forEach(section => {
    const option = document.createElement('option');
    option.value = section.id;
    option.textContent = section.name;
    if (section.id === entry.sectionId) option.selected = true;
    sectionSelect.appendChild(option);
  });
  sectionSelect.addEventListener('change', () => updateArrangerEntry(entry.id, { sectionId: sectionSelect.value }));

  const repeatsSelect = document.createElement('select');
  repeatsSelect.className = 'arranger-repeat-select';
  for (let repeat = 1; repeat <= 16; repeat++) {
    const option = document.createElement('option');
    option.value = String(repeat);
    option.textContent = `x${repeat}`;
    if (repeat === (entry.repeats || 1)) option.selected = true;
    repeatsSelect.appendChild(option);
  }
  repeatsSelect.addEventListener('change', () => updateArrangerEntry(entry.id, { repeats: repeatsSelect.value }));

  const removeButton = document.createElement('button');
  removeButton.className = 'remove-chord-btn arranger-remove-btn';
  removeButton.textContent = '✕';
  removeButton.title = 'Remove arranger entry';
  removeButton.addEventListener('click', () => removeArrangerEntry(entry.id));

  row.addEventListener('dragstart', event => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/arranger-entry-id', entry.id);
    row.classList.add('dragging');
  });
  row.addEventListener('dragend', () => row.classList.remove('dragging'));
  row.addEventListener('dragover', event => {
    event.preventDefault();
    row.classList.add('drag-over');
  });
  row.addEventListener('dragleave', () => row.classList.remove('drag-over'));
  row.addEventListener('drop', event => {
    event.preventDefault();
    event.stopPropagation();
    row.classList.remove('drag-over');
    const draggedEntryId = event.dataTransfer.getData('text/arranger-entry-id');
    if (!draggedEntryId || draggedEntryId === entry.id) return;
    const rect = row.getBoundingClientRect();
    const placeAfter = event.clientY > rect.top + rect.height / 2;
    moveArrangerEntry(draggedEntryId, entry.id, placeAfter);
  });

  row.append(dragHandle, order, sectionSelect, repeatsSelect, removeButton);
  return row;
}

function renderSynthRack() {
  const rack = document.getElementById('synth-rack');
  if (!rack) return;
  rack.innerHTML = '';
  rack.appendChild(buildSynthCard('chord'));
  rack.appendChild(buildSynthCard('bass'));
}

function buildSynthCard(kind) {
  const synth = kind === 'bass' ? song.bassSynth : song.chordSynth;
  const presetOptions = kind === 'bass' ? BASS_SOUND_PRESETS : CHORD_SOUND_PRESETS;
  const expanded = synthPanelExpanded[kind] !== false;

  const card = document.createElement('section');
  card.className = `synth-card synth-card-${kind}`;
  if (!expanded) card.classList.add('collapsed');

  const header = document.createElement('div');
  header.className = 'synth-card-header';

  const titleWrap = document.createElement('div');
  titleWrap.className = 'synth-title-wrap';
  const title = document.createElement('h2');
  title.textContent = kind === 'bass' ? 'Bass synth' : 'Chord synth';
  const subtitle = document.createElement('p');
  subtitle.className = 'synth-subtitle';
  subtitle.textContent = '2 osc • wave • ADSR • filter • drive • mod • reverb';
  titleWrap.append(title, subtitle);

  const controls = document.createElement('div');
  controls.className = 'synth-header-controls';

  const collapseButton = document.createElement('button');
  collapseButton.type = 'button';
  collapseButton.className = 'action-btn synth-collapse-btn';
  collapseButton.setAttribute('aria-expanded', String(expanded));
  collapseButton.textContent = expanded ? '▾ Hide controls' : '▸ Show controls';
  collapseButton.addEventListener('click', () => setSynthPanelExpanded(kind, !expanded));
  controls.appendChild(collapseButton);

  const presetLabel = document.createElement('label');
  presetLabel.className = 'synth-select-row';
  const presetText = document.createElement('span');
  presetText.textContent = 'Preset';
  const presetSelect = document.createElement('select');
  presetSelect.id = `${kind}-preset-select`;
  presetSelect.setAttribute('aria-label', `${kind} synth preset`);
  presetOptions.forEach(option => {
    const element = document.createElement('option');
    element.value = option.id;
    element.textContent = option.label;
    presetSelect.appendChild(element);
  });
  presetSelect.value = synth.preset;
  presetSelect.addEventListener('change', () => setSynthPreset(kind, presetSelect.value));
  presetLabel.append(presetText, presetSelect);
  controls.appendChild(presetLabel);

  if (kind === 'bass') {
    const bassToggle = document.createElement('label');
    bassToggle.className = 'checkbox-inline synth-toggle';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = Boolean(song.bassEnabled);
    checkbox.addEventListener('change', () => setBassEnabled(checkbox.checked));
    bassToggle.append(checkbox, document.createTextNode('Enabled'));
    controls.appendChild(bassToggle);

    const pitchModeLabel = document.createElement('label');
    pitchModeLabel.className = 'synth-select-row';
    const pitchModeText = document.createElement('span');
    pitchModeText.textContent = 'Pitch mode';
    const pitchModeSelect = document.createElement('select');
    pitchModeSelect.setAttribute('aria-label', 'Bass pitch mode');
    [
      { value: 'linked', label: 'Linked (follow chord)' },
      { value: 'free', label: 'Free (independent bass)' },
    ].forEach(option => {
      const element = document.createElement('option');
      element.value = option.value;
      element.textContent = option.label;
      pitchModeSelect.appendChild(element);
    });
    pitchModeSelect.value = song.bassPitchMode || 'linked';
    pitchModeSelect.addEventListener('change', () => setBassPitchMode(pitchModeSelect.value));
    pitchModeLabel.append(pitchModeText, pitchModeSelect);
    controls.appendChild(pitchModeLabel);
  }

  header.append(titleWrap, controls);

  card.append(header);
  if (expanded) {
    const detailGrid = document.createElement('div');
    detailGrid.className = 'synth-detail-grid';
    detailGrid.append(
      buildSynthMetaChip('Osc 1', synth.osc1Type),
      buildSynthMetaChip('Osc 2', synth.osc2Type),
      buildSynthMetaChip('Mix', `${Math.round(synth.mix * 100)}%`),
      buildSynthMetaChip('Detune', `${synth.detune > 0 ? '+' : ''}${Math.round(synth.detune)}¢`),
    );

    const controlsGrid = document.createElement('div');
    controlsGrid.className = 'synth-controls-grid';
    controlsGrid.appendChild(buildSynthSelectControl(
      'Osc 1 Wave',
      synth.osc1Type,
      OSC_TYPES,
      `${kind} oscillator 1 waveform`,
      value => updateSynthWaveform(kind, 'osc1Type', value),
    ));
    controlsGrid.appendChild(buildSynthSelectControl(
      'Osc 2 Wave',
      synth.osc2Type,
      OSC_TYPES,
      `${kind} oscillator 2 waveform`,
      value => updateSynthWaveform(kind, 'osc2Type', value),
    ));
    SYNTH_UI_FIELDS.forEach(field => controlsGrid.appendChild(buildSynthSlider(kind, synth, field)));
    controlsGrid.appendChild(buildReverbSlider(kind));

    card.append(detailGrid, controlsGrid);
  }
  return card;
}

function buildSynthSelectControl(labelText, currentValue, options, ariaLabel, onChange) {
  const row = document.createElement('label');
  row.className = 'synth-slider synth-select-control';
  const top = document.createElement('div');
  top.className = 'synth-slider-top';
  const label = document.createElement('span');
  label.textContent = labelText;
  top.appendChild(label);

  const select = document.createElement('select');
  select.setAttribute('aria-label', ariaLabel);
  options.forEach(optionValue => {
    const option = document.createElement('option');
    option.value = optionValue;
    option.textContent = optionValue;
    select.appendChild(option);
  });
  select.value = currentValue;
  select.addEventListener('change', () => onChange(select.value));
  row.append(top, select);
  return row;
}

function buildReverbSlider(kind) {
  const key = kind === 'bass' ? 'bassWet' : 'chordWet';
  const row = document.createElement('label');
  row.className = 'synth-slider';

  const top = document.createElement('div');
  top.className = 'synth-slider-top';
  const label = document.createElement('span');
  label.textContent = 'Reverb';
  const value = document.createElement('span');
  value.className = 'synth-slider-value';
  value.textContent = `${Math.round(song.reverb[key] * 100)}% wet`;
  top.append(label, value);

  const input = document.createElement('input');
  input.type = 'range';
  input.min = '0';
  input.max = '1';
  input.step = '0.01';
  input.value = String(song.reverb[key]);
  input.setAttribute('aria-label', `${kind} reverb wet`);
  input.addEventListener('input', () => {
    value.textContent = `${Math.round(Number(input.value) * 100)}% wet`;
    updateReverbWet(kind, input.value);
  });

  row.append(top, input);
  return row;
}

function buildSynthMetaChip(labelText, valueText) {
  const chip = document.createElement('div');
  chip.className = 'synth-meta-chip';
  const label = document.createElement('span');
  label.className = 'synth-meta-label';
  label.textContent = labelText;
  const value = document.createElement('strong');
  value.textContent = valueText;
  chip.append(label, value);
  return chip;
}

function buildSynthSlider(kind, synth, field) {
  const row = document.createElement('label');
  row.className = 'synth-slider';

  const top = document.createElement('div');
  top.className = 'synth-slider-top';
  const label = document.createElement('span');
  label.textContent = field.label;
  const value = document.createElement('span');
  value.className = 'synth-slider-value';
  value.textContent = field.format(synth[field.key]);
  top.append(label, value);

  const input = document.createElement('input');
  input.type = 'range';
  input.min = String(field.min);
  input.max = String(field.max);
  input.step = String(field.step);
  input.value = String(synth[field.key]);
  input.setAttribute('aria-label', `${kind} ${field.key}`);
  input.addEventListener('input', () => {
    value.textContent = field.format(Number(input.value));
    updateSynthField(kind, field.key, input.value);
  });

  row.append(top, input);
  return row;
}

function updatePlaybackModeUI() {
  const isEdit = (song.playbackMode || 'edit') === 'edit';
  document.querySelectorAll('.section-play-select').forEach(element => {
    element.style.display = isEdit ? 'inline-flex' : 'none';
  });
  const editHelp = document.getElementById('playback-help-edit');
  const songHelp = document.getElementById('playback-help-song');
  if (editHelp) editHelp.style.display = isEdit ? 'block' : 'none';
  if (songHelp) songHelp.style.display = isEdit ? 'none' : 'block';
  const slider = document.getElementById('song-go-to');
  if (slider) slider.disabled = isEdit;
}

function renderScaleDisplay(sectionId) {
  const section = song.sections.find(entry => entry.id === sectionId);
  if (!section) return;
  const notesElement = document.getElementById('scale-notes-' + sectionId);
  if (notesElement) notesElement.textContent = getScaleNotes(section.scaleRoot, section.scaleType).join('  ');
  const offsetElement = document.getElementById('scale-offset-' + sectionId);
  if (offsetElement) {
    const offset = formatPitchOffset(section.scaleRoot);
    offsetElement.textContent = offset ? `(${offset})` : 'Base';
  }
  const rootSelect = document.getElementById('scale-root-' + sectionId);
  if (rootSelect) rootSelect.value = String(normalizePitchClass(section.scaleRoot));
}

function updateChordCard(sectionId, chordId) {
  const section = song.sections.find(entry => entry.id === sectionId);
  if (!section) return;
  const chord = section.chords.find(entry => entry.id === chordId);
  if (!chord) return;
  const rootElement = document.getElementById('root-' + chordId);
  const offsetElement = document.getElementById('root-offset-' + chordId);
  const bassRootElement = document.getElementById('bass-root-' + chordId);
  const bassOffsetElement = document.getElementById('bass-offset-' + chordId);
  const qualityElement = document.getElementById('qual-' + chordId);
  const beatsElement = document.getElementById('beats-' + chordId);
  const startBeatElement = document.getElementById('start-beat-' + chordId);
  const chordRepeatElement = document.getElementById('chord-repeat-' + chordId);
  const bassRepeatElement = document.getElementById('bass-repeat-' + chordId);
  if (rootElement) rootElement.textContent = noteName(chord.root);
  if (offsetElement) {
    const offset = formatPitchOffset(chord.root);
    offsetElement.textContent = offset || 'Base';
  }
  const bassRoot = getChordBassRoot(chord);
  if (bassRootElement) bassRootElement.textContent = `Bass ${noteName(bassRoot)}`;
  if (bassOffsetElement) {
    const offset = formatPitchOffset(bassRoot);
    bassOffsetElement.textContent = offset || 'Base';
  }
  if (qualityElement) {
    qualityElement.textContent = chord.type;
    qualityElement.title = chordTypeObj(chord.type).label;
  }
  if (beatsElement) beatsElement.value = chord.beats || 4;
  if (startBeatElement) startBeatElement.value = String(normalizeStartBeat(chord.startBeat, 1));
  if (chordRepeatElement) chordRepeatElement.value = String(chord.chordRepeat || 1);
  if (bassRepeatElement) bassRepeatElement.value = String(chord.bassRepeat || 1);
}

function renderArrangementPanel(sectionId) {
  const section = song.sections.find(entry => entry.id === sectionId);
  if (!section) return;
  const panel = document.getElementById('arrangement-' + sectionId);
  if (!panel) return;
  panel.replaceWith(buildArrangementPanel(section));
  updatePlaybackHighlights();
}

function buildSection(section) {
  const container = document.createElement('div');
  container.className = 'section';
  container.dataset.id = section.id;
  container.dataset.type = section.type;
  container.appendChild(buildSectionHeader(section));
  container.appendChild(buildScaleRow(section));
  container.appendChild(buildSectionOptionsRow(section));
  container.appendChild(buildArrangementPanel(section));
  container.appendChild(buildChordsArea(section));
  return container;
}

function buildSectionHeader(section) {
  const header = document.createElement('div');
  header.className = 'section-header';

  const badge = document.createElement('span');
  badge.className = 'section-type-badge';
  badge.textContent = section.type;

  const nameInput = document.createElement('input');
  nameInput.className = 'section-name-input';
  nameInput.type = 'text';
  nameInput.value = section.name || section.type;
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

  const actions = document.createElement('div');
  actions.className = 'section-header-actions';
  const upButton = makeIconBtn('↑', 'Move section up', () => moveSectionUp(section.id));
  const downButton = makeIconBtn('↓', 'Move section down', () => moveSectionDown(section.id));
  const removeButton = makeIconBtn('✕', 'Remove section', () => removeSection(section.id));
  removeButton.classList.add('danger');
  actions.append(upButton, downButton, removeButton);

  header.append(badge, playSelect, nameInput, actions);
  return header;
}

function buildScaleRow(section) {
  const row = document.createElement('div');
  row.className = 'scale-row';

  const label = document.createElement('label');
  label.textContent = 'Scale';

  const rootSelect = document.createElement('select');
  rootSelect.id = 'scale-root-' + section.id;
  rootSelect.className = 'scale-root-select';
  rootSelect.setAttribute('aria-label', 'Scale root note');
  NOTES.forEach((note, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = note;
    if (index === normalizePitchClass(section.scaleRoot)) option.selected = true;
    rootSelect.appendChild(option);
  });
  rootSelect.addEventListener('change', () => updateSectionScale(section.id, rootSelect.value, null));

  const typeSelect = document.createElement('select');
  typeSelect.className = 'scale-type-select';
  typeSelect.setAttribute('aria-label', 'Scale type');
  SCALES.forEach(scale => {
    const option = document.createElement('option');
    option.value = scale.name;
    option.textContent = scale.name;
    if (scale.name === section.scaleType) option.selected = true;
    typeSelect.appendChild(option);
  });
  typeSelect.addEventListener('change', () => updateSectionScale(section.id, null, typeSelect.value));

  const offset = document.createElement('span');
  offset.id = 'scale-offset-' + section.id;
  offset.className = 'scale-offset';
  offset.textContent = formatPitchOffset(section.scaleRoot) || 'Base';

  const notes = document.createElement('span');
  notes.className = 'scale-notes';
  notes.id = 'scale-notes-' + section.id;
  notes.textContent = getScaleNotes(section.scaleRoot, section.scaleType).join('  ');

  row.append(label, rootSelect, typeSelect, offset, notes);
  return row;
}

function buildSectionOptionsRow(section) {
  const row = document.createElement('div');
  row.className = 'section-options-row';

  const crashLabel = document.createElement('label');
  crashLabel.className = 'checkbox-inline';
  const crashCheckbox = document.createElement('input');
  crashCheckbox.type = 'checkbox';
  crashCheckbox.checked = Boolean(section.crashOnStart);
  crashCheckbox.addEventListener('change', () => updateSectionOptions(section.id, { crashOnStart: crashCheckbox.checked }));
  crashLabel.append(crashCheckbox, document.createTextNode('Crash at start'));

  const rollLabel = document.createElement('label');
  rollLabel.className = 'checkbox-inline';
  const rollCheckbox = document.createElement('input');
  rollCheckbox.type = 'checkbox';
  rollCheckbox.checked = Boolean(section.rollAtEnd);
  rollCheckbox.addEventListener('change', () => updateSectionOptions(section.id, { rollAtEnd: rollCheckbox.checked }));
  rollLabel.append(rollCheckbox, document.createTextNode('Roll at end'));

  // Drum pattern selector
  const drumPatternWrap = document.createElement('label');
  drumPatternWrap.className = 'section-drum-pattern-field';
  const drumPatternText = document.createElement('span');
  drumPatternText.textContent = 'Drum pattern';
  const drumPatternSelect = document.createElement('select');
  drumPatternSelect.className = 'section-drum-pattern-select';
  drumPatternSelect.setAttribute('aria-label', 'Drum pattern for this section');
  (song.drumPatterns || []).forEach(p => {
    const option = document.createElement('option');
    option.value = p.id;
    option.textContent = p.name;
    if (p.id === section.drumPatternId) option.selected = true;
    drumPatternSelect.appendChild(option);
  });
  drumPatternSelect.addEventListener('change', () => updateSectionDrumPattern(section.id, drumPatternSelect.value));
  drumPatternWrap.append(drumPatternText, drumPatternSelect);

  const beatsSummary = document.createElement('span');
  beatsSummary.className = 'section-beat-summary';
  beatsSummary.textContent = `${getSectionBeatLength(section)} beats total`;

  row.append(crashLabel, rollLabel, drumPatternWrap, beatsSummary);
  return row;
}

function buildArrangementPanel(section) {
  const panel = document.createElement('div');
  panel.className = 'arrangement-panel';
  panel.id = 'arrangement-' + section.id;

  const title = document.createElement('div');
  title.className = 'arrangement-title';
  title.innerHTML = '<strong>Arrangement</strong><span>Drag blocks to reorder this section</span>';

  const chordsLane = buildArrangementLane(section, 'chords', 'Chords');
  const bassLane = buildArrangementLane(section, 'bass', 'Bass');
  panel.append(title, chordsLane, bassLane);

  const chordTrack = chordsLane.querySelector('.arrangement-track');
  const bassTrack = bassLane.querySelector('.arrangement-track');
  if (chordTrack && bassTrack) {
    let syncing = false;
    const syncScroll = (source, target) => {
      if (syncing) return;
      syncing = true;
      target.scrollLeft = source.scrollLeft;
      syncing = false;
    };
    chordTrack.addEventListener('scroll', () => syncScroll(chordTrack, bassTrack));
    bassTrack.addEventListener('scroll', () => syncScroll(bassTrack, chordTrack));
  }
  return panel;
}

function buildArrangementLane(section, laneType, laneLabel) {
  const lane = document.createElement('div');
  lane.className = 'arrangement-lane';

  const label = document.createElement('div');
  label.className = 'arrangement-lane-label';
  label.textContent = laneLabel;

  const track = document.createElement('div');
  track.className = `arrangement-track arrangement-track-${laneType}`;
  track.dataset.sectionId = section.id;
  track.dataset.lane = laneType;
  track.addEventListener('dragover', event => {
    event.preventDefault();
    track.classList.add('drag-over');
  });
  track.addEventListener('dragleave', () => track.classList.remove('drag-over'));
  track.addEventListener('drop', event => {
    event.preventDefault();
    track.classList.remove('drag-over');
    const draggedChordId = event.dataTransfer.getData('text/chord-id');
    if (draggedChordId) moveChordWithinSection(section.id, draggedChordId, null, true);
  });

  if (!section.chords.length) {
    const empty = document.createElement('div');
    empty.className = 'arrangement-empty';
    empty.textContent = laneType === 'bass' ? 'Bass follows chord roots in linked mode (or use free mode to set bass per chord).' : 'Add chords to see the lane.';
    track.appendChild(empty);
  } else {
    section.chords.forEach((chord, index) => track.appendChild(buildArrangementBlock(section, chord, laneType, index)));
  }

  lane.append(label, track);
  return lane;
}

function buildArrangementBlock(section, chord, laneType, index) {
  const block = document.createElement('div');
  block.className = `arrangement-block arrangement-block-${laneType}`;
  block.id = `arrangement-${laneType}-${chord.id}`;
  block.draggable = true;
  const width = Math.max(112, Math.max(1, chord.beats || 4) * 34);
  block.style.flex = `0 0 ${width}px`;
  block.dataset.sectionId = section.id;
  block.dataset.chordId = chord.id;
  block.dataset.index = String(index);
  const bassRoot = getChordBassRoot(chord);
  block.title = `${formatPitchLabel(laneType === 'bass' ? bassRoot : chord.root)}${laneType === 'bass' ? ' bass' : chord.type} • ${chord.beats || 4} beats`;

  const label = document.createElement('span');
  label.className = 'arrangement-block-label';
  label.textContent = laneType === 'bass' ? noteName(bassRoot) : `${noteName(chord.root)}${chord.type}`;

  const beats = document.createElement('span');
  beats.className = 'arrangement-block-beats';
  if (laneType === 'bass') beats.textContent = `${chord.beats || 4}b • x${chord.bassRepeat || 1}`;
  else beats.textContent = `${chord.beats || 4}b • x${chord.chordRepeat || 1}`;

  block.append(label, beats);

  block.addEventListener('dragstart', event => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/chord-id', chord.id);
    event.dataTransfer.setData('text/section-id', section.id);
    block.classList.add('dragging');
  });
  block.addEventListener('dragend', () => block.classList.remove('dragging'));
  block.addEventListener('dragover', event => {
    event.preventDefault();
    block.classList.add('drag-over');
  });
  block.addEventListener('dragleave', () => block.classList.remove('drag-over'));
  block.addEventListener('drop', event => {
    event.preventDefault();
    event.stopPropagation();
    block.classList.remove('drag-over');
    const draggedChordId = event.dataTransfer.getData('text/chord-id');
    if (!draggedChordId || draggedChordId === chord.id) return;
    const rect = block.getBoundingClientRect();
    const placeAfter = event.clientX > rect.left + rect.width / 2;
    moveChordWithinSection(section.id, draggedChordId, chord.id, placeAfter);
  });
  block.addEventListener('click', () => focusNoteEditorForChord(section.id, chord.id, laneType === 'bass' ? 'bass' : 'chord'));

  return block;
}

function focusNoteEditorForChord(sectionId, chordId, kind) {
  if (song.selectedSectionId !== sectionId) selectEditSection(sectionId);
  const card = document.getElementById('chord-card-' + chordId);
  if (!card) return;
  const selector = kind === 'bass'
    ? '.ctrl-row[data-note-editor-kind="bass"] .arrow-btn:not(:disabled)'
    : '.ctrl-row[data-note-editor-kind="chord"] .arrow-btn:not(:disabled)';
  const target = card.querySelector(selector) || document.getElementById(kind === 'bass' ? 'bass-preset-select' : 'chord-preset-select');
  if (target && typeof target.focus === 'function') target.focus();
}

function buildChordsArea(section) {
  const area = document.createElement('div');
  area.className = 'chords-area';
  section.chords.forEach(chord => area.appendChild(buildChordCard(chord, section.id)));

  const addButton = document.createElement('button');
  addButton.className = 'add-chord-btn';
  addButton.textContent = '+ Add Chord';
  addButton.addEventListener('click', () => addChord(section.id));
  area.appendChild(addButton);
  return area;
}

function buildChordCard(chord, sectionId) {
  const card = document.createElement('div');
  card.className = 'chord-card';
  card.id = 'chord-card-' + chord.id;
  card.setAttribute('aria-label', `${formatPitchLabel(chord.root)}${chord.type} chord`);

  const rootElement = document.createElement('div');
  rootElement.className = 'chord-root';
  rootElement.id = 'root-' + chord.id;
  rootElement.textContent = noteName(chord.root);

  const offsetElement = document.createElement('div');
  offsetElement.className = 'chord-root-offset';
  offsetElement.id = 'root-offset-' + chord.id;
  offsetElement.textContent = formatPitchOffset(chord.root) || 'Base';

  const bassRoot = getChordBassRoot(chord);
  const bassRootElement = document.createElement('div');
  bassRootElement.className = 'chord-bass-root';
  bassRootElement.id = 'bass-root-' + chord.id;
  bassRootElement.textContent = `Bass ${noteName(bassRoot)}`;

  const bassOffsetElement = document.createElement('div');
  bassOffsetElement.className = 'chord-bass-offset';
  bassOffsetElement.id = 'bass-offset-' + chord.id;
  bassOffsetElement.textContent = formatPitchOffset(bassRoot) || 'Base';

  const qualityElement = document.createElement('div');
  qualityElement.className = 'chord-qual';
  qualityElement.id = 'qual-' + chord.id;
  qualityElement.textContent = chord.type;
  qualityElement.title = chordTypeObj(chord.type).label;

  const divider1 = document.createElement('div');
  divider1.className = 'chord-divider';

  const noteRow = buildCtrlRow('Note', () => noteUp(sectionId, chord.id), () => noteDown(sectionId, chord.id), 'Root note up (scale step)', 'Root note down (scale step)');
  noteRow.dataset.noteEditorKind = 'chord';
  noteRow.addEventListener('click', () => focusNoteEditorForChord(sectionId, chord.id, 'chord'));
  const bassRow = buildCtrlRow(
    'Bass',
    () => bassPitchUp(sectionId, chord.id),
    () => bassPitchDown(sectionId, chord.id),
    'Bass note up',
    'Bass note down',
    { disabled: (song.bassPitchMode || 'linked') !== 'free' },
  );
  bassRow.dataset.noteEditorKind = 'bass';
  bassRow.addEventListener('click', () => focusNoteEditorForChord(sectionId, chord.id, 'bass'));
  const typeRow = buildCtrlRow('Type', () => varUp(sectionId, chord.id), () => varDown(sectionId, chord.id), 'Chord type up', 'Chord type down');
  const transposeRow = buildCtrlRow('Xpose', () => transposeChordUp(sectionId, chord.id), () => transposeChordDown(sectionId, chord.id), 'Transpose up', 'Transpose down');

  const divider2 = document.createElement('div');
  divider2.className = 'chord-divider';

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

  const startBeatRow = document.createElement('div');
  startBeatRow.className = 'beats-row';
  const startBeatLabel = document.createElement('label');
  startBeatLabel.textContent = 'Start';
  startBeatLabel.setAttribute('for', 'start-beat-' + chord.id);
  const startBeatSelect = document.createElement('select');
  startBeatSelect.id = 'start-beat-' + chord.id;
  startBeatSelect.className = 'repeat-select';
  startBeatSelect.setAttribute('aria-label', 'Chord start beat');
  START_BEAT_OPTIONS.forEach(value => {
    const option = document.createElement('option');
    option.value = String(value);
    option.textContent = `${value}${value === 1 ? 'st' : value === 2 ? 'nd' : value === 3 ? 'rd' : 'th'} beat`;
    if (value === normalizeStartBeat(chord.startBeat, 1)) option.selected = true;
    startBeatSelect.appendChild(option);
  });
  startBeatSelect.addEventListener('change', () => updateChordStartBeat(sectionId, chord.id, startBeatSelect.value));
  startBeatRow.append(startBeatLabel, startBeatSelect);

  const repeatRow = document.createElement('div');
  repeatRow.className = 'repeat-row';

  const chordRepeatLabel = document.createElement('label');
  chordRepeatLabel.textContent = 'Chord x';
  chordRepeatLabel.setAttribute('for', 'chord-repeat-' + chord.id);
  const chordRepeatSelect = document.createElement('select');
  chordRepeatSelect.id = 'chord-repeat-' + chord.id;
  chordRepeatSelect.className = 'repeat-select';
  NOTE_REPEAT_OPTIONS.forEach(value => {
    const option = document.createElement('option');
    option.value = String(value);
    option.textContent = String(value);
    if (value === (chord.chordRepeat || 1)) option.selected = true;
    chordRepeatSelect.appendChild(option);
  });
  chordRepeatSelect.addEventListener('change', () => updateChordRepeat(sectionId, chord.id, chordRepeatSelect.value));

  const bassRepeatLabel = document.createElement('label');
  bassRepeatLabel.textContent = 'Bass x';
  bassRepeatLabel.setAttribute('for', 'bass-repeat-' + chord.id);
  const bassRepeatSelect = document.createElement('select');
  bassRepeatSelect.id = 'bass-repeat-' + chord.id;
  bassRepeatSelect.className = 'repeat-select';
  NOTE_REPEAT_OPTIONS.forEach(value => {
    const option = document.createElement('option');
    option.value = String(value);
    option.textContent = String(value);
    if (value === (chord.bassRepeat || 1)) option.selected = true;
    bassRepeatSelect.appendChild(option);
  });
  bassRepeatSelect.addEventListener('change', () => updateBassRepeat(sectionId, chord.id, bassRepeatSelect.value));

  const chordRepeatWrap = document.createElement('div');
  chordRepeatWrap.className = 'repeat-field';
  chordRepeatWrap.append(chordRepeatLabel, chordRepeatSelect);

  const bassRepeatWrap = document.createElement('div');
  bassRepeatWrap.className = 'repeat-field';
  bassRepeatWrap.append(bassRepeatLabel, bassRepeatSelect);

  repeatRow.append(chordRepeatWrap, bassRepeatWrap);

  const actionBar = document.createElement('div');
  actionBar.className = 'chord-action-bar';

  const auditionButton = document.createElement('button');
  auditionButton.className = 'audition-btn';
  auditionButton.textContent = '♫';
  auditionButton.title = 'Play chord';
  auditionButton.setAttribute('aria-label', 'Play chord');
  auditionButton.addEventListener('click', () => auditionChord(chord.root, chord.type));

  const removeButton = document.createElement('button');
  removeButton.className = 'remove-chord-btn';
  removeButton.textContent = '✕';
  removeButton.title = 'Remove chord';
  removeButton.setAttribute('aria-label', 'Remove chord');
  removeButton.addEventListener('click', () => removeChord(sectionId, chord.id));

  actionBar.append(auditionButton, removeButton);
  card.append(rootElement, offsetElement, bassRootElement, bassOffsetElement, qualityElement, divider1, noteRow, bassRow, typeRow, transposeRow, divider2, beatsRow, startBeatRow, repeatRow, actionBar);
  return card;
}

function buildCtrlRow(labelText, onUp, onDown, upTitle, downTitle, options = {}) {
  const row = document.createElement('div');
  row.className = 'ctrl-row';

  const label = document.createElement('span');
  label.className = 'ctrl-row-label';
  label.textContent = labelText;

  const upButton = document.createElement('button');
  upButton.className = 'arrow-btn';
  upButton.textContent = '▲';
  upButton.title = upTitle;
  upButton.setAttribute('aria-label', upTitle);
  if (options.disabled) {
    upButton.disabled = true;
    upButton.title = 'Enable Free bass mode to adjust bass pitch';
  }
  upButton.addEventListener('click', onUp);

  const downButton = document.createElement('button');
  downButton.className = 'arrow-btn';
  downButton.textContent = '▼';
  downButton.title = downTitle;
  downButton.setAttribute('aria-label', downTitle);
  if (options.disabled) {
    downButton.disabled = true;
    downButton.title = 'Enable Free bass mode to adjust bass pitch';
  }
  downButton.addEventListener('click', onDown);

  row.append(label, upButton, downButton);
  return row;
}

function makeIconBtn(text, title, onClick) {
  const button = document.createElement('button');
  button.className = 'icon-btn';
  button.textContent = text;
  button.title = title;
  button.setAttribute('aria-label', title);
  button.addEventListener('click', onClick);
  return button;
}

function updatePlaybackHighlights() {
  document.querySelectorAll('.arrangement-block.playing, .chord-card.playing, .arranger-entry.playing').forEach(element => element.classList.remove('playing'));
  if (!isBeating) return;
  const section = song.sections[playbackCursor.sectionIndex];
  const chord = section?.chords[playbackCursor.chordIndex];
  if (!chord) return;
  lastHighlightedChordId = chord.id;
  if (playbackCursor.arrangerEntryId) document.getElementById(`arranger-entry-${playbackCursor.arrangerEntryId}`)?.classList.add('playing');
  document.getElementById(`arrangement-chords-${chord.id}`)?.classList.add('playing');
  document.getElementById(`arrangement-bass-${chord.id}`)?.classList.add('playing');
  document.getElementById(`chord-card-${chord.id}`)?.classList.add('playing');
}

// =====================================================================
// BEAT INDICATOR FLASH
// =====================================================================

let _flashInterval = null;

function startIndicatorFlash() {
  const secondsPerSixteenth = () => (60 / song.bpm) / 4;
  _flashInterval = setInterval(() => {
    if (!isBeating) return;
    const indicator = document.getElementById('beat-indicator');
    if (!indicator) return;
    indicator.classList.add('flash');
    setTimeout(() => indicator.classList.remove('flash'), 60);
  }, secondsPerSixteenth() * 1000 * 4);
}

function stopIndicatorFlash() {
  if (_flashInterval !== null) {
    clearInterval(_flashInterval);
    _flashInterval = null;
  }
}

// =====================================================================
// EVENT LISTENERS & BOOT
// =====================================================================

document.addEventListener('DOMContentLoaded', () => {
  loadSong();
  song = normalizeSong(song);
  render();

  document.getElementById('song-title').addEventListener('input', saveSong);
  document.getElementById('song-title').addEventListener('blur', () => {
    const titleElement = document.getElementById('song-title');
    if (titleElement) titleElement.value = normalizeSongTitle(titleElement.value);
    saveSong();
  });
  document.getElementById('recent-song-select').addEventListener('change', event => openRecentSong(event.target.value));

  const bpmInput = document.getElementById('bpm-input');
  bpmInput.addEventListener('change', event => updateBpm(event.target.value));
  bpmInput.addEventListener('input', event => updateBpm(event.target.value));
  document.getElementById('bpm-down').addEventListener('click', () => updateBpm(song.bpm - 5));
  document.getElementById('bpm-up').addEventListener('click', () => updateBpm(song.bpm + 5));

  document.getElementById('playback-mode-select').addEventListener('change', event => setPlaybackMode(event.target.value));
  document.getElementById('song-go-to').addEventListener('input', event => {
    setSongPositionFromSlider(event.target.value);
    if (isBeating && song.playbackMode === 'song') initializePlaybackCursor();
  });

  document.getElementById('beat-start').addEventListener('click', () => {
    startBeat();
    startIndicatorFlash();
  });
  document.getElementById('beat-stop').addEventListener('click', () => {
    stopBeat();
    stopIndicatorFlash();
  });

  document.getElementById('transpose-down').addEventListener('click', () => transposeSong(-1));
  document.getElementById('transpose-up').addEventListener('click', () => transposeSong(1));

  document.getElementById('save-btn').addEventListener('click', () => { saveSong(); showSaved(); });
  document.getElementById('export-btn').addEventListener('click', exportJSON);
  document.getElementById('import-btn').addEventListener('click', importJSON);
  document.getElementById('new-btn').addEventListener('click', resetSong);

  document.getElementById('add-section-btn').addEventListener('click', () => {
    const type = document.getElementById('section-type-select').value;
    addSection(type);
  });
});

function showSaved() {
  const button = document.getElementById('save-btn');
  const original = button.textContent;
  button.textContent = '✓ Saved';
  button.disabled = true;
  setTimeout(() => {
    button.textContent = original;
    button.disabled = false;
  }, 1200);
}
