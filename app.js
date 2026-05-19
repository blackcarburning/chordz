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
const PLAYBACK_MODES = ['edit', 'song', 'looping'];
const BASS_PITCH_MODES = ['linked', 'free'];
const STRING_PITCH_MODES = ['linked', 'free'];
const NOTE_REPEAT_OPTIONS = [1, 2, 4, 8, 16, 32];
const START_BEAT_OPTIONS = [1, 2, 3, 4];
const CHORD_NOTE_COUNT_OPTIONS = Array.from({ length: 16 }, (_, index) => index + 1);
const ARP_MODES = ['off', 'up', 'down', 'upDown', 'outsideIn', 'insideOut', 'upSkip', 'downSkip'];
const ARP_MODE_OPTIONS = [
  { value: 'off', text: 'Off' },
  { value: 'up', text: 'Up' },
  { value: 'down', text: 'Down' },
  { value: 'upDown', text: 'Up and down' },
  { value: 'outsideIn', text: 'Outside in' },
  { value: 'insideOut', text: 'Inside out' },
  { value: 'upSkip', text: 'Up skip' },
  { value: 'downSkip', text: 'Down skip' },
];
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
const DRUM_LANE_DEFAULT_VARIANTS = Object.freeze({
  kick: Object.freeze({ oscType: 'sine', startFreq: 120, endFreq: 40, pitchTime: 0.12, peak: 1.05, attack: 0.004, decay: 0.35, stop: 0.35 }),
  snare: Object.freeze({
    noiseDuration: 0.16, noiseCutoff: 1600, noisePeak: 0.65, noiseAttack: 0.002, noiseDecay: 0.14,
    toneType: 'triangle', toneStartFreq: 220, toneEndFreq: 110, tonePitchTime: 0.08, tonePeak: 0.36, toneAttack: 0.002, toneDecay: 0.09, toneStop: 0.09,
  }),
  closedHat: Object.freeze({ noiseDuration: 0.05, cutoff: 7000, peak: 0.2, attack: 0.001, decay: 0.045 }),
  openHat: Object.freeze({ noiseDuration: 0.45, cutoff: 5000, peak: 0.28, attack: 0.002, decay: 0.4 }),
  hiTom: Object.freeze({ oscType: 'sine', startFreq: 260, endFreq: 150, pitchTime: 0.15, peak: 0.75, attack: 0.003, decay: 0.22, stop: 0.25 }),
  midTom: Object.freeze({ oscType: 'sine', startFreq: 190, endFreq: 100, pitchTime: 0.18, peak: 0.75, attack: 0.003, decay: 0.28, stop: 0.32 }),
  lowTom: Object.freeze({ oscType: 'sine', startFreq: 130, endFreq: 65, pitchTime: 0.22, peak: 0.8, attack: 0.004, decay: 0.34, stop: 0.38 }),
  ride: Object.freeze({
    oscType: 'square', partialFrequencies: [560, 845, 1174, 1523, 1780],
    partialGain: 0.04, peak: 0.18, attack: 0.002, decay: 0.28, partialDuration: 0.3,
  }),
});
const DRUM_LANE_SOUND_CHOICES = Object.freeze({
  kick: Object.freeze([
    Object.freeze({ id: 'kickClassic', label: 'Classic (Default)', variant: Object.freeze({}) }),
    Object.freeze({ id: 'kickDeep', label: 'Deep', variant: Object.freeze({ startFreq: 108, endFreq: 34, pitchTime: 0.18, peak: 1.12, decay: 0.42 }) }),
    Object.freeze({ id: 'kickTight', label: 'Tight', variant: Object.freeze({ startFreq: 135, endFreq: 55, pitchTime: 0.08, peak: 0.95, decay: 0.22 }) }),
    Object.freeze({ id: 'kickPunch', label: 'Punch', variant: Object.freeze({ oscType: 'triangle', startFreq: 150, endFreq: 48, peak: 1.18, attack: 0.002, decay: 0.28 }) }),
    Object.freeze({ id: 'kickSoft', label: 'Soft', variant: Object.freeze({ startFreq: 112, endFreq: 44, peak: 0.82, attack: 0.006, decay: 0.31 }) }),
    Object.freeze({ id: 'kickClick', label: 'Click', variant: Object.freeze({ oscType: 'square', startFreq: 180, endFreq: 65, pitchTime: 0.05, peak: 0.88, decay: 0.18, stop: 0.2 }) }),
    Object.freeze({ id: 'kickBoom', label: 'Boom', variant: Object.freeze({ oscType: 'triangle', startFreq: 100, endFreq: 30, pitchTime: 0.22, peak: 1.1, decay: 0.5, stop: 0.5 }) }),
    Object.freeze({ id: 'kickThump', label: 'Thump', variant: Object.freeze({ startFreq: 126, endFreq: 42, pitchTime: 0.14, peak: 1.03, attack: 0.003, decay: 0.3 }) }),
    Object.freeze({ id: 'kickSub', label: 'Sub', variant: Object.freeze({ startFreq: 92, endFreq: 28, pitchTime: 0.24, peak: 1.05, decay: 0.56, stop: 0.56 }) }),
    Object.freeze({ id: 'kickElectro', label: 'Electro', variant: Object.freeze({ oscType: 'triangle', startFreq: 165, endFreq: 58, pitchTime: 0.1, peak: 0.93, decay: 0.24 }) }),
  ]),
  snare: Object.freeze([
    Object.freeze({ id: 'snareClassic', label: 'Classic (Default)', variant: Object.freeze({}) }),
    Object.freeze({ id: 'snareTight', label: 'Tight', variant: Object.freeze({ noiseDuration: 0.12, noiseCutoff: 2100, noisePeak: 0.52, noiseDecay: 0.1, toneStartFreq: 260, toneEndFreq: 140, tonePeak: 0.24, toneDecay: 0.065 }) }),
    Object.freeze({ id: 'snareBody', label: 'Body', variant: Object.freeze({ noiseCutoff: 1200, noisePeak: 0.58, toneType: 'sine', toneStartFreq: 180, toneEndFreq: 90, tonePeak: 0.46, toneDecay: 0.12, toneStop: 0.12 }) }),
    Object.freeze({ id: 'snareCrisp', label: 'Crisp', variant: Object.freeze({ noiseDuration: 0.11, noiseCutoff: 2800, noisePeak: 0.72, noiseDecay: 0.085, tonePeak: 0.22 }) }),
    Object.freeze({ id: 'snareFat', label: 'Fat', variant: Object.freeze({ noiseDuration: 0.2, noiseCutoff: 1100, noisePeak: 0.66, noiseDecay: 0.18, toneType: 'triangle', toneStartFreq: 170, toneEndFreq: 80, tonePeak: 0.52, toneDecay: 0.16, toneStop: 0.16 }) }),
    Object.freeze({ id: 'snareBrush', label: 'Brush', variant: Object.freeze({ noiseDuration: 0.22, noiseCutoff: 2300, noisePeak: 0.48, noiseAttack: 0.004, noiseDecay: 0.2, tonePeak: 0.17, toneDecay: 0.07 }) }),
    Object.freeze({ id: 'snareSnap', label: 'Snap', variant: Object.freeze({ noiseDuration: 0.09, noiseCutoff: 3200, noisePeak: 0.78, noiseDecay: 0.07, toneStartFreq: 280, toneEndFreq: 155, tonePitchTime: 0.055, tonePeak: 0.2, toneDecay: 0.055, toneStop: 0.06 }) }),
    Object.freeze({ id: 'snareRing', label: 'Ring', variant: Object.freeze({ noiseCutoff: 1500, noisePeak: 0.5, toneType: 'sine', toneStartFreq: 240, toneEndFreq: 118, tonePitchTime: 0.11, tonePeak: 0.48, toneDecay: 0.2, toneStop: 0.2 }) }),
    Object.freeze({ id: 'snareNoise', label: 'Noise', variant: Object.freeze({ noiseDuration: 0.24, noiseCutoff: 1900, noisePeak: 0.8, noiseDecay: 0.22, tonePeak: 0.12, toneDecay: 0.05, toneStop: 0.06 }) }),
    Object.freeze({ id: 'snareElectronic', label: 'Electronic', variant: Object.freeze({ noiseDuration: 0.09, noiseCutoff: 2600, noisePeak: 0.34, noiseDecay: 0.08, toneType: 'square', toneStartFreq: 310, toneEndFreq: 170, tonePitchTime: 0.06, tonePeak: 0.4, toneDecay: 0.11, toneStop: 0.11 }) }),
  ]),
  closedHat: Object.freeze([
    Object.freeze({ id: 'closedHatClassic', label: 'Classic (Default)', variant: Object.freeze({}) }),
    Object.freeze({ id: 'closedHatTight', label: 'Tight', variant: Object.freeze({ noiseDuration: 0.03, cutoff: 8400, peak: 0.17, decay: 0.028 }) }),
    Object.freeze({ id: 'closedHatBright', label: 'Bright', variant: Object.freeze({ cutoff: 9600, peak: 0.25, decay: 0.04 }) }),
    Object.freeze({ id: 'closedHatDusty', label: 'Dusty', variant: Object.freeze({ noiseDuration: 0.07, cutoff: 5600, peak: 0.19, attack: 0.002, decay: 0.055 }) }),
    Object.freeze({ id: 'closedHatSoft', label: 'Soft', variant: Object.freeze({ cutoff: 6500, peak: 0.13, attack: 0.002, decay: 0.06 }) }),
    Object.freeze({ id: 'closedHatChick', label: 'Chick', variant: Object.freeze({ noiseDuration: 0.028, cutoff: 9000, peak: 0.22, decay: 0.02 }) }),
    Object.freeze({ id: 'closedHatThin', label: 'Thin', variant: Object.freeze({ noiseDuration: 0.038, cutoff: 10500, peak: 0.18, decay: 0.032 }) }),
    Object.freeze({ id: 'closedHatGrit', label: 'Grit', variant: Object.freeze({ noiseDuration: 0.065, cutoff: 6200, peak: 0.24, decay: 0.07 }) }),
    Object.freeze({ id: 'closedHatMetal', label: 'Metal', variant: Object.freeze({ noiseDuration: 0.055, cutoff: 8800, peak: 0.23, decay: 0.05 }) }),
    Object.freeze({ id: 'closedHatDigital', label: 'Digital', variant: Object.freeze({ noiseDuration: 0.04, cutoff: 11000, peak: 0.2, attack: 0.0007, decay: 0.03 }) }),
  ]),
  openHat: Object.freeze([
    Object.freeze({ id: 'openHatClassic', label: 'Classic (Default)', variant: Object.freeze({}) }),
    Object.freeze({ id: 'openHatShort', label: 'Short', variant: Object.freeze({ noiseDuration: 0.24, cutoff: 5800, peak: 0.22, decay: 0.2 }) }),
    Object.freeze({ id: 'openHatWide', label: 'Wide', variant: Object.freeze({ noiseDuration: 0.62, cutoff: 5600, peak: 0.31, decay: 0.58 }) }),
    Object.freeze({ id: 'openHatBright', label: 'Bright', variant: Object.freeze({ noiseDuration: 0.42, cutoff: 7600, peak: 0.28, decay: 0.36 }) }),
    Object.freeze({ id: 'openHatWashed', label: 'Washed', variant: Object.freeze({ noiseDuration: 0.74, cutoff: 4800, peak: 0.33, attack: 0.003, decay: 0.7 }) }),
    Object.freeze({ id: 'openHatSoft', label: 'Soft', variant: Object.freeze({ noiseDuration: 0.38, cutoff: 4300, peak: 0.2, attack: 0.003, decay: 0.34 }) }),
    Object.freeze({ id: 'openHatAiry', label: 'Airy', variant: Object.freeze({ noiseDuration: 0.56, cutoff: 8600, peak: 0.24, decay: 0.52 }) }),
    Object.freeze({ id: 'openHatTrash', label: 'Trash', variant: Object.freeze({ noiseDuration: 0.52, cutoff: 5200, peak: 0.36, decay: 0.46 }) }),
    Object.freeze({ id: 'openHatTight', label: 'Tight', variant: Object.freeze({ noiseDuration: 0.3, cutoff: 6800, peak: 0.26, decay: 0.24 }) }),
    Object.freeze({ id: 'openHatDigital', label: 'Digital', variant: Object.freeze({ noiseDuration: 0.34, cutoff: 9800, peak: 0.21, attack: 0.001, decay: 0.28 }) }),
  ]),
  hiTom: Object.freeze([
    Object.freeze({ id: 'hiTomClassic', label: 'Classic (Default)', variant: Object.freeze({}) }),
    Object.freeze({ id: 'hiTomPunch', label: 'Punch', variant: Object.freeze({ oscType: 'triangle', startFreq: 300, endFreq: 175, pitchTime: 0.12, peak: 0.84, decay: 0.2 }) }),
    Object.freeze({ id: 'hiTomRound', label: 'Round', variant: Object.freeze({ startFreq: 245, endFreq: 135, pitchTime: 0.18, peak: 0.72, decay: 0.27, stop: 0.28 }) }),
    Object.freeze({ id: 'hiTomShort', label: 'Short', variant: Object.freeze({ startFreq: 280, endFreq: 170, pitchTime: 0.1, peak: 0.71, decay: 0.16, stop: 0.18 }) }),
    Object.freeze({ id: 'hiTomDeep', label: 'Deep', variant: Object.freeze({ startFreq: 220, endFreq: 120, pitchTime: 0.2, peak: 0.78, decay: 0.31, stop: 0.32 }) }),
    Object.freeze({ id: 'hiTomHard', label: 'Hard', variant: Object.freeze({ oscType: 'square', startFreq: 320, endFreq: 185, peak: 0.58, attack: 0.002, decay: 0.14, stop: 0.16 }) }),
    Object.freeze({ id: 'hiTomSoft', label: 'Soft', variant: Object.freeze({ startFreq: 250, endFreq: 150, peak: 0.62, attack: 0.006, decay: 0.24 }) }),
    Object.freeze({ id: 'hiTomRetro', label: 'Retro', variant: Object.freeze({ oscType: 'triangle', startFreq: 290, endFreq: 140, pitchTime: 0.16, peak: 0.68, decay: 0.21 }) }),
    Object.freeze({ id: 'hiTomTone', label: 'Tone', variant: Object.freeze({ oscType: 'sine', startFreq: 340, endFreq: 200, pitchTime: 0.09, peak: 0.76, decay: 0.18 }) }),
    Object.freeze({ id: 'hiTomElectro', label: 'Electro', variant: Object.freeze({ oscType: 'square', startFreq: 360, endFreq: 210, pitchTime: 0.07, peak: 0.52, decay: 0.12, stop: 0.14 }) }),
  ]),
  midTom: Object.freeze([
    Object.freeze({ id: 'midTomClassic', label: 'Classic (Default)', variant: Object.freeze({}) }),
    Object.freeze({ id: 'midTomPunch', label: 'Punch', variant: Object.freeze({ oscType: 'triangle', startFreq: 220, endFreq: 120, pitchTime: 0.14, peak: 0.82, decay: 0.24 }) }),
    Object.freeze({ id: 'midTomRound', label: 'Round', variant: Object.freeze({ startFreq: 175, endFreq: 92, pitchTime: 0.22, peak: 0.73, decay: 0.32, stop: 0.36 }) }),
    Object.freeze({ id: 'midTomShort', label: 'Short', variant: Object.freeze({ startFreq: 210, endFreq: 118, pitchTime: 0.12, peak: 0.68, decay: 0.18, stop: 0.22 }) }),
    Object.freeze({ id: 'midTomDeep', label: 'Deep', variant: Object.freeze({ startFreq: 160, endFreq: 78, pitchTime: 0.24, peak: 0.76, decay: 0.38, stop: 0.42 }) }),
    Object.freeze({ id: 'midTomHard', label: 'Hard', variant: Object.freeze({ oscType: 'square', startFreq: 250, endFreq: 130, pitchTime: 0.11, peak: 0.56, decay: 0.16, stop: 0.19 }) }),
    Object.freeze({ id: 'midTomSoft', label: 'Soft', variant: Object.freeze({ startFreq: 185, endFreq: 96, peak: 0.66, attack: 0.006, decay: 0.3 }) }),
    Object.freeze({ id: 'midTomRetro', label: 'Retro', variant: Object.freeze({ oscType: 'triangle', startFreq: 230, endFreq: 106, pitchTime: 0.18, peak: 0.7, decay: 0.28 }) }),
    Object.freeze({ id: 'midTomTone', label: 'Tone', variant: Object.freeze({ oscType: 'sine', startFreq: 260, endFreq: 140, pitchTime: 0.1, peak: 0.74, decay: 0.21 }) }),
    Object.freeze({ id: 'midTomElectro', label: 'Electro', variant: Object.freeze({ oscType: 'square', startFreq: 280, endFreq: 160, pitchTime: 0.08, peak: 0.5, decay: 0.14, stop: 0.16 }) }),
  ]),
  lowTom: Object.freeze([
    Object.freeze({ id: 'lowTomClassic', label: 'Classic (Default)', variant: Object.freeze({}) }),
    Object.freeze({ id: 'lowTomPunch', label: 'Punch', variant: Object.freeze({ oscType: 'triangle', startFreq: 150, endFreq: 78, pitchTime: 0.18, peak: 0.88, decay: 0.3 }) }),
    Object.freeze({ id: 'lowTomRound', label: 'Round', variant: Object.freeze({ startFreq: 120, endFreq: 58, pitchTime: 0.26, peak: 0.8, decay: 0.42, stop: 0.46 }) }),
    Object.freeze({ id: 'lowTomShort', label: 'Short', variant: Object.freeze({ startFreq: 140, endFreq: 80, pitchTime: 0.14, peak: 0.74, decay: 0.22, stop: 0.24 }) }),
    Object.freeze({ id: 'lowTomSub', label: 'Sub', variant: Object.freeze({ startFreq: 105, endFreq: 45, pitchTime: 0.3, peak: 0.86, decay: 0.54, stop: 0.58 }) }),
    Object.freeze({ id: 'lowTomHard', label: 'Hard', variant: Object.freeze({ oscType: 'square', startFreq: 170, endFreq: 90, pitchTime: 0.12, peak: 0.58, decay: 0.18, stop: 0.2 }) }),
    Object.freeze({ id: 'lowTomSoft', label: 'Soft', variant: Object.freeze({ startFreq: 125, endFreq: 66, peak: 0.68, attack: 0.006, decay: 0.36 }) }),
    Object.freeze({ id: 'lowTomRetro', label: 'Retro', variant: Object.freeze({ oscType: 'triangle', startFreq: 160, endFreq: 70, pitchTime: 0.22, peak: 0.76, decay: 0.34 }) }),
    Object.freeze({ id: 'lowTomTone', label: 'Tone', variant: Object.freeze({ oscType: 'sine', startFreq: 185, endFreq: 98, pitchTime: 0.12, peak: 0.74, decay: 0.26 }) }),
    Object.freeze({ id: 'lowTomElectro', label: 'Electro', variant: Object.freeze({ oscType: 'square', startFreq: 200, endFreq: 110, pitchTime: 0.09, peak: 0.52, decay: 0.16, stop: 0.18 }) }),
  ]),
  ride: Object.freeze([
    Object.freeze({ id: 'rideClassic', label: 'Classic (Default)', variant: Object.freeze({}) }),
    Object.freeze({ id: 'rideBright', label: 'Bright', variant: Object.freeze({ partialFrequencies: [650, 950, 1330, 1700, 2040], partialGain: 0.045, peak: 0.2, decay: 0.3 }) }),
    Object.freeze({ id: 'rideDry', label: 'Dry', variant: Object.freeze({ partialFrequencies: [520, 760, 1030, 1320, 1600], partialGain: 0.036, peak: 0.15, decay: 0.22 }) }),
    Object.freeze({ id: 'rideBell', label: 'Bell', variant: Object.freeze({ partialFrequencies: [820, 1210, 1650, 2140, 2610], partialGain: 0.038, peak: 0.22, decay: 0.26 }) }),
    Object.freeze({ id: 'rideWash', label: 'Wash', variant: Object.freeze({ partialFrequencies: [500, 730, 980, 1230, 1490], partialGain: 0.043, peak: 0.19, decay: 0.42, partialDuration: 0.46 }) }),
    Object.freeze({ id: 'rideSoft', label: 'Soft', variant: Object.freeze({ partialFrequencies: [540, 800, 1100, 1460, 1760], partialGain: 0.03, peak: 0.13, attack: 0.003, decay: 0.24 }) }),
    Object.freeze({ id: 'rideMetal', label: 'Metal', variant: Object.freeze({ oscType: 'square', partialFrequencies: [710, 1010, 1390, 1810, 2200], partialGain: 0.05, peak: 0.21, decay: 0.31 }) }),
    Object.freeze({ id: 'rideThin', label: 'Thin', variant: Object.freeze({ partialFrequencies: [640, 920, 1270, 1620, 1940], partialGain: 0.032, peak: 0.16, decay: 0.2 }) }),
    Object.freeze({ id: 'rideDark', label: 'Dark', variant: Object.freeze({ partialFrequencies: [430, 620, 860, 1110, 1360], partialGain: 0.048, peak: 0.2, decay: 0.36, partialDuration: 0.42 }) }),
    Object.freeze({ id: 'rideDigital', label: 'Digital', variant: Object.freeze({ partialFrequencies: [900, 1320, 1860, 2410, 2960], partialGain: 0.03, peak: 0.17, attack: 0.0015, decay: 0.19 }) }),
  ]),
});

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

const LFO_PATTERN_COUNT = 10;
const LFO_SHAPE_OPTIONS = [
  { value: 'sine', label: 'Sine' },
  { value: 'triangle', label: 'Triangle' },
  { value: 'down', label: 'Ramp Down' },
  { value: 'up', label: 'Ramp Up' },
  { value: 'square', label: 'Gate' },
  { value: 'pump', label: 'Pump' },
  { value: 'custom', label: 'Custom' },
];
const LFO_RATE_OPTIONS = [
  { value: 0.25, label: '1/16' },
  { value: 0.5, label: '1/8' },
  { value: 1, label: '1/4' },
  { value: 2, label: '1/2' },
  { value: 4, label: '1 bar' },
];
const LFO_TIMING_OPTIONS = [
  { value: 'straight', label: 'Straight' },
  { value: 'dotted', label: 'Dotted' },
  { value: 'triplet', label: 'Triplet' },
];
const LFO_PRESET_NAMES = [
  'LFO Off', 'Pump 1/4', 'Gate 1/8',
  'Pattern 4', 'Pattern 5', 'Pattern 6', 'Pattern 7', 'Pattern 8', 'Pattern 9', 'Pattern 10',
];
const LFO_CUSTOM_POINT_COUNT = 17;

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
  string: {
    lushStrings: {
      label: 'Lush Strings',
      osc1Type: 'sawtooth',
      osc2Type: 'triangle',
      osc3Type: 'sawtooth',
      osc4Type: 'triangle',
      osc2Interval: 7,
      detune: 6,
      mix: 0.48,
      attack: 0.08,
      decay: 0.34,
      sustain: 0.78,
      release: 0.9,
      cutoff: 2200,
      resonance: 1.2,
      volume: 0.14,
    },
    softStrings: {
      label: 'Soft Strings',
      osc1Type: 'triangle',
      osc2Type: 'sine',
      osc3Type: 'triangle',
      osc4Type: 'sine',
      osc2Interval: 12,
      detune: 4,
      mix: 0.42,
      attack: 0.12,
      decay: 0.42,
      sustain: 0.72,
      release: 1.1,
      cutoff: 1800,
      resonance: 0.9,
      volume: 0.13,
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

const STRING_SOUND_PRESETS = [
  { id: 'lushStrings', label: 'Lush Strings' },
  { id: 'softStrings', label: 'Soft Strings' },
  { id: 'custom', label: 'Custom' },
];

const DELAY_SUBDIVISION_OPTIONS = [
  { value: 0.25, label: '1/16' },
  { value: 0.5, label: '1/8' },
  { value: 1, label: '1/4' },
  { value: 2, label: '1/2' },
];

const DELAY_FEEL_OPTIONS = [
  { value: 'straight', label: 'Straight' },
  { value: 'dotted', label: 'Dotted' },
  { value: 'triplet', label: 'Triplet' },
];

const DRUM_DISTORTION_MODELS = [
  { value: 'softClip', label: 'Soft clip' },
  { value: 'hardClip', label: 'Hard clip' },
  { value: 'foldback', label: 'Foldback' },
  { value: 'tube', label: 'Tube / asym' },
];

const DRUM_FILTER_TYPES = [
  { value: 'lowpass', label: 'Low-pass' },
  { value: 'highpass', label: 'High-pass' },
  { value: 'bandpass', label: 'Band-pass' },
];

const DRUM_FILTER_SLOPE_OPTIONS = [
  { value: 12, label: '12 dB/oct' },
  { value: 24, label: '24 dB/oct' },
  { value: 48, label: '48 dB/oct' },
  { value: 96, label: '96 dB/oct' },
];

const FILTER_POLE_OPTIONS = [
  { value: 1, label: '1-pole / 6 dB' },
  { value: 2, label: '2-pole / 12 dB' },
  { value: 4, label: '4-pole / 24 dB' },
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

const LEGACY_STRING_PRESET_MAP = {};

const SYNTH_UI_FIELDS = [
  { key: 'transpose', label: 'Transpose', min: -24, max: 24, step: 1, format: value => `${value > 0 ? '+' : ''}${Math.round(value)} st` },
  { key: 'osc2Interval', label: 'Osc2 Int', min: -24, max: 24, step: 1, format: value => `${Math.round(value)} st` },
  { key: 'detune', label: 'Detune', min: -60, max: 60, step: 1, format: value => `${value > 0 ? '+' : ''}${Math.round(value)}¢` },
  { key: 'mix', label: 'Mix', min: 0, max: 1, step: 0.01, format: value => Math.round(value * 100) + '%' },
  { key: 'attack', label: 'A', min: 0.005, max: 1.5, step: 0.005, format: value => value.toFixed(2) + 's' },
  { key: 'decay', label: 'D', min: 0.02, max: 2.0, step: 0.01, format: value => value.toFixed(2) + 's' },
  { key: 'sustain', label: 'S', min: 0.0, max: 1.0, step: 0.01, format: value => Math.round(value * 100) + '%' },
  { key: 'release', label: 'R', min: 0.05, max: 2.5, step: 0.01, format: value => value.toFixed(2) + 's' },
  { key: 'cutoff', label: 'Cut', min: 120, max: 6000, step: 10, format: value => Math.round(value) + ' Hz' },
  { key: 'resonance', label: 'Q', min: 0.2, max: 12, step: 0.1, format: value => value.toFixed(1) },
  { key: 'distortion', label: 'Drive', min: 0, max: 1, step: 0.01, format: value => Math.round(value * 100) + '%' },
  { key: 'delayMix', label: 'Delay Mix', min: 0, max: 1, step: 0.01, format: value => Math.round(value * 100) + '%' },
  { key: 'delayFeedback', label: 'Delay Amt', min: 0, max: 0.88, step: 0.01, format: value => Math.round(value * 100) + '%' },
  { key: 'delayFilterCutoff', label: 'Delay Cut', min: 300, max: 8000, step: 10, format: value => Math.round(value) + ' Hz' },
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

function getPresetLibrary(kind) {
  if (kind === 'bass') return SYNTH_PRESET_LIBRARY.bass;
  if (kind === 'string') return SYNTH_PRESET_LIBRARY.string;
  return SYNTH_PRESET_LIBRARY.chord;
}

function getDefaultPresetId(kind) {
  if (kind === 'bass') return 'roundBass';
  if (kind === 'string') return 'lushStrings';
  return 'warmPad';
}

function getLegacyPresetMap(kind) {
  if (kind === 'bass') return LEGACY_BASS_PRESET_MAP;
  if (kind === 'string') return LEGACY_STRING_PRESET_MAP;
  return LEGACY_CHORD_PRESET_MAP;
}

function resolvePresetId(kind, rawPreset) {
  const library = getPresetLibrary(kind);
  if (rawPreset === 'custom') return 'custom';
  const mapped = getLegacyPresetMap(kind)[rawPreset] || rawPreset;
  return library[mapped] ? mapped : getDefaultPresetId(kind);
}

function createSynthSettings(kind, presetId) {
  const resolvedPreset = resolvePresetId(kind, presetId);
  const defaultPreset = resolvedPreset === 'custom'
    ? getDefaultPresetId(kind)
    : resolvedPreset;
  const preset = getPresetLibrary(kind)[defaultPreset];
  const settings = {
    preset: resolvedPreset,
    osc1Type: preset.osc1Type,
    osc2Type: preset.osc2Type,
    osc2Interval: preset.osc2Interval,
    detune: preset.detune,
    mix: preset.mix,
    transpose: 0,
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
    filterPoles: 1,
    delaySubdivisionBeats: 0.5,
    delayFeel: 'straight',
    delayMix: 0,
    delayFeedback: 0.25,
    delayFilterCutoff: 2800,
    filterLfoEnabled: false,
    filterLfoDepth: 0,
  };
  if (kind === 'string') {
    settings.osc3Type = preset.osc3Type || preset.osc1Type;
    settings.osc4Type = preset.osc4Type || preset.osc2Type;
  }
  return settings;
}

function normalizeFilterPoles(value, fallback = 1) {
  const parsed = clampInt(value, fallback, 1, 4);
  if (parsed >= 4) return 4;
  if (parsed >= 2) return 2;
  return 1;
}

function normalizeDelaySubdivision(value, fallback = 0.5) {
  const allowed = DELAY_SUBDIVISION_OPTIONS.map(option => option.value);
  const parsed = clampNumber(value, fallback, 0.25, 2);
  return allowed.includes(parsed) ? parsed : fallback;
}

function normalizeDelayFeel(value, fallback = 'straight') {
  const valid = DELAY_FEEL_OPTIONS.map(option => option.value);
  return valid.includes(value) ? value : fallback;
}

function normalizeDrumDistortionModel(value, fallback = 'softClip') {
  const valid = DRUM_DISTORTION_MODELS.map(option => option.value);
  return valid.includes(value) ? value : fallback;
}

function normalizeDrumFilterType(value, fallback = 'lowpass') {
  const valid = DRUM_FILTER_TYPES.map(option => option.value);
  return valid.includes(value) ? value : fallback;
}

function normalizeDrumFilterSlope(value, fallback = 12) {
  const parsed = clampInt(value, fallback, 12, 96);
  if (parsed >= 96) return 96;
  if (parsed >= 48) return 48;
  if (parsed >= 24) return 24;
  return 12;
}

function normalizeSynthSettings(kind, rawSynth, legacyPreset) {
  const synth = rawSynth || {};
  const presetId = resolvePresetId(kind, synth.preset || legacyPreset);
  const base = createSynthSettings(kind, presetId === 'custom'
    ? (legacyPreset || getDefaultPresetId(kind))
    : presetId);

  const normalized = {
    preset: presetId,
    osc1Type: OSC_TYPES.includes(synth.osc1Type) ? synth.osc1Type : base.osc1Type,
    osc2Type: OSC_TYPES.includes(synth.osc2Type) ? synth.osc2Type : base.osc2Type,
    osc2Interval: clampInt(synth.osc2Interval, base.osc2Interval, -24, 24),
    detune: clampNumber(synth.detune, base.detune, -60, 60),
    mix: clampNumber(synth.mix, base.mix, 0, 1),
    transpose: clampInt(synth.transpose, base.transpose, -24, 24),
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
    filterPoles: normalizeFilterPoles(synth.filterPoles, base.filterPoles),
    delaySubdivisionBeats: normalizeDelaySubdivision(synth.delaySubdivisionBeats, base.delaySubdivisionBeats),
    delayFeel: normalizeDelayFeel(synth.delayFeel, base.delayFeel),
    delayMix: clampNumber(synth.delayMix, base.delayMix, 0, 1),
    delayFeedback: clampNumber(synth.delayFeedback, base.delayFeedback, 0, 0.88),
    delayFilterCutoff: clampNumber(synth.delayFilterCutoff, base.delayFilterCutoff, 300, 8000),
    filterLfoEnabled: Boolean(synth.filterLfoEnabled),
    filterLfoDepth: clampNumber(synth.filterLfoDepth, base.filterLfoDepth, 0, 1),
  };
  if (kind === 'string') {
    normalized.osc3Type = OSC_TYPES.includes(synth.osc3Type) ? synth.osc3Type : base.osc3Type;
    normalized.osc4Type = OSC_TYPES.includes(synth.osc4Type) ? synth.osc4Type : base.osc4Type;
  }

  if (presetId !== 'custom' && synth.preset === 'custom') normalized.preset = 'custom';
  return normalized;
}

function createSection(type, drumPatternId = null, lfoPatternId = null) {
  const defaults = SECTION_DEFAULTS[type] || [];
  return {
    id: makeId(),
    type,
    name: type === 'Custom' ? 'My Section' : type,
    scaleRoot: 0,
    scaleType: 'Major',
    crashOnStart: false,
    rollAtEnd: false,
    chords: defaults.map(chord => createChord(chord.root - 12, chord.type, drumPatternId, lfoPatternId)),
  };
}

function createDefaultSong() {
  const now = Date.now();
  const drumPatterns = Array.from({ length: DRUM_PATTERN_COUNT }, (_, i) => createDefaultDrumPattern(i));
  const lfoPatterns = Array.from({ length: LFO_PATTERN_COUNT }, (_, i) => createDefaultLfoPattern(i));
  const defaultPatternId = drumPatterns[0].id;
  const defaultLfoPatternId = lfoPatterns[0].id;
  const sections = [
    createSection('Verse', defaultPatternId, defaultLfoPatternId),
    createSection('Chorus', defaultPatternId, defaultLfoPatternId),
    createSection('Bridge', defaultPatternId, defaultLfoPatternId),
  ];
  return {
    id: makeId(),
    title: 'Untitled Song',
    updatedAt: now,
    bpm: 100,
    playbackMode: 'edit',
    selectedSectionId: sections[0]?.id || null,
    bassPitchMode: 'linked',
    stringPitchMode: 'linked',
    chordSound: 'warmPad',
    chordSynth: createSynthSettings('chord', 'warmPad'),
    bassEnabled: true,
    bassSound: 'roundBass',
    bassSynth: createSynthSettings('bass', 'roundBass'),
    stringEnabled: false,
    stringSound: 'lushStrings',
    stringSynth: createSynthSettings('string', 'lushStrings'),
    drumPatterns,
    lfoPatterns,
    mixer: {
      chordVolume: 0.9,
      bassVolume: 0.9,
      stringVolume: 0.9,
      drumsVolume: 0.9,
      masterVolume: 0.95,
    },
    reverb: {
      chordWet: 0.2,
      bassWet: 0.16,
      stringWet: 0.22,
    },
    drumFx: {
      distortionEnabled: false,
      distortionModel: 'softClip',
      distortionDrive: 0,
      filterEnabled: false,
      filterType: 'lowpass',
      filterCutoff: 20000,
      filterResonance: 0.7,
      filterSlope: 12,
      filterLfoEnabled: false,
      filterLfoPatternId: defaultLfoPatternId,
      filterLfoDepth: 0,
      reverbMix: 0,
      reverbSize: 0.35,
      reverbDecay: 0.45,
    },
    arranger: [],
    sections,
  };
}

function normalizeRepeat(value, fallback = 1) {
  const repeat = clampInt(value, fallback, 1, 32);
  return NOTE_REPEAT_OPTIONS.includes(repeat) ? repeat : fallback;
}

function normalizeStartBeat(value, fallback = 1) {
  return clampInt(value, fallback, 1, 4);
}

function createChord(root = DEFAULT_CHORD_ROOT, type = 'maj', drumPatternId = null, lfoPatternId = null, lfoAssignments = null) {
  const normalizedRoot = normalizeSemitone(root, DEFAULT_CHORD_ROOT);
  const normalizedType = CHORD_TYPES.some(entry => entry.name === type) ? type : 'maj';
  const chordLfoPatternId = typeof lfoAssignments?.chord === 'string' ? lfoAssignments.chord : lfoPatternId;
  const bassLfoPatternId = typeof lfoAssignments?.bass === 'string' ? lfoAssignments.bass : lfoPatternId;
  const stringLfoPatternId = typeof lfoAssignments?.string === 'string' ? lfoAssignments.string : lfoPatternId;
  return {
    id: makeId(),
    root: normalizedRoot,
    bassRoot: normalizedRoot,
    stringRoot: normalizedRoot,
    type: normalizedType,
    beats: 4,
    chordRepeat: 1,
    bassRepeat: 1,
    stringRepeat: 1,
    noteCount: clampInt(chordTypeObj(normalizedType).intervals.length, 3, 1, 16),
    startBeat: 1,
    loopEnabled: false,
    arpMode: 'off',
    drumPatternId,
    lfoPatternId,
    chordLfoPatternId,
    bassLfoPatternId,
    stringLfoPatternId,
    bassIn: true,
    chordsIn: true,
    drumsIn: true,
    stringsIn: true,
  };
}

function emptyDrumGrid() {
  const grid = {};
  DRUM_LANES.forEach(lane => { grid[lane.key] = Array(16).fill(0); });
  return grid;
}

function getDrumLaneSoundChoices(laneKey) {
  return Array.isArray(DRUM_LANE_SOUND_CHOICES[laneKey]) ? DRUM_LANE_SOUND_CHOICES[laneKey] : [];
}

function getDefaultDrumLaneSoundId(laneKey) {
  return getDrumLaneSoundChoices(laneKey)[0]?.id || null;
}

function normalizeDrumPatternLaneSounds(rawLaneSounds) {
  const source = rawLaneSounds && typeof rawLaneSounds === 'object' ? rawLaneSounds : {};
  const laneSounds = {};
  DRUM_LANES.forEach(lane => {
    const choices = getDrumLaneSoundChoices(lane.key);
    const defaultSoundId = choices[0]?.id || null;
    const rawSoundId = source[lane.key];
    laneSounds[lane.key] = choices.some(choice => choice.id === rawSoundId)
      ? rawSoundId
      : defaultSoundId;
  });
  return laneSounds;
}

function getDrumLaneSoundId(pattern, laneKey) {
  if (!pattern || !laneKey) return getDefaultDrumLaneSoundId(laneKey);
  const soundId = pattern.laneSounds?.[laneKey];
  return normalizeDrumPatternLaneSounds({ [laneKey]: soundId })[laneKey];
}

function resolveDrumSoundVariant(laneKey, soundId) {
  const laneDefaults = DRUM_LANE_DEFAULT_VARIANTS[laneKey] || {};
  const choices = getDrumLaneSoundChoices(laneKey);
  const resolvedChoice = choices.find(choice => choice.id === soundId) || choices[0];
  return Object.assign({}, laneDefaults, resolvedChoice?.variant || {});
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
    laneSounds: normalizeDrumPatternLaneSounds(null),
  };
}

function createDefaultLfoPattern(index) {
  const defaults = index === 1
    ? { enabled: true, depth: 1, rateBeats: 1, shape: 'pump', timingFeel: 'straight', smoothing: 0.18, phase: 0 }
    : index === 2
      ? { enabled: true, depth: 0.72, rateBeats: 0.5, shape: 'square', timingFeel: 'straight', smoothing: 0.04, phase: 0 }
      : { enabled: false, depth: 0.85, rateBeats: 1, shape: 'sine', timingFeel: 'straight', smoothing: 0.08, phase: 0 };
  return {
    id: makeId(),
    name: LFO_PRESET_NAMES[index] || `Pattern ${index + 1}`,
    ...defaults,
    customPoints: createDefaultLfoCustomPoints(),
  };
}

function normalizeDrumPatterns(rawPatterns) {
  const result = [];
  const source = Array.isArray(rawPatterns) ? rawPatterns : [];
  // Preserve all patterns from saved data; if empty, seed defaults
  const count = Math.max(source.length, DRUM_PATTERN_COUNT);
  for (let i = 0; i < count; i++) {
    const raw = source[i];
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
        laneSounds: normalizeDrumPatternLaneSounds(raw.laneSounds),
      });
    } else {
      result.push(createDefaultDrumPattern(i));
    }
  }
  return result;
}

function normalizeLfoRate(value, fallback = 1) {
  const allowed = LFO_RATE_OPTIONS.map(option => option.value);
  const parsed = clampNumber(value, fallback, 0.25, 4);
  return allowed.includes(parsed) ? parsed : fallback;
}

function normalizeLfoShape(value, fallback = 'sine') {
  const valid = LFO_SHAPE_OPTIONS.map(option => option.value);
  return valid.includes(value) ? value : fallback;
}

function normalizeLfoTimingFeel(value, fallback = 'straight') {
  const valid = LFO_TIMING_OPTIONS.map(option => option.value);
  return valid.includes(value) ? value : fallback;
}

function createDefaultLfoCustomPoints() {
  const maxIndex = Math.max(1, LFO_CUSTOM_POINT_COUNT - 1);
  return Array.from({ length: LFO_CUSTOM_POINT_COUNT }, (_, index) => ({
    x: index / maxIndex,
    y: 1,
  }));
}

function sampleLfoPointY(points, x) {
  if (!Array.isArray(points) || !points.length) return 1;
  const clampedX = clampNumber(x, 0, 0, 1);
  if (points.length === 1) return clampNumber(points[0]?.y, 1, 0, 1);
  if (clampedX <= points[0].x) return points[0].y;
  if (clampedX >= points[points.length - 1].x) return points[points.length - 1].y;
  const xEpsilon = 0.000001;
  for (let index = 1; index < points.length; index++) {
    const prev = points[index - 1];
    const next = points[index];
    if (clampedX > next.x + xEpsilon) continue;
    if (Math.abs(clampedX - next.x) <= xEpsilon) {
      let finalIndex = index;
      while (
        finalIndex + 1 < points.length
        && Math.abs(points[finalIndex + 1].x - next.x) <= xEpsilon
      ) {
        finalIndex += 1;
      }
      return clampNumber(points[finalIndex].y, 1, 0, 1);
    }
    const span = Math.max(0.000001, next.x - prev.x);
    const mix = (clampedX - prev.x) / span;
    return prev.y + (next.y - prev.y) * mix;
  }
  return points[points.length - 1].y;
}

function normalizeLfoCustomPoints(rawPoints, fallback = null) {
  const fallbackPoints = Array.isArray(fallback) && fallback.length
    ? fallback
    : createDefaultLfoCustomPoints();
  const parsed = Array.isArray(rawPoints)
    ? rawPoints
      .map(point => ({
        x: clampNumber(point?.x, NaN, 0, 1),
        y: clampNumber(point?.y, NaN, 0, 1),
      }))
      .filter(point => Number.isFinite(point.x) && Number.isFinite(point.y))
      .sort((a, b) => a.x - b.x)
    : [];
  const source = parsed.length >= 2 ? parsed : normalizeLfoCustomPoints(fallbackPoints, null);
  if (!source.length) return createDefaultLfoCustomPoints();
  const first = source[0];
  const last = source[source.length - 1];
  const withBounds = source.slice();
  if (first.x > 0) withBounds.unshift({ x: 0, y: first.y });
  if (last.x < 1) withBounds.push({ x: 1, y: last.y });
  return withBounds.map(point => ({
    x: clampNumber(point.x, 0, 0, 1),
    y: clampNumber(point.y, 1, 0, 1),
  }));
}

function normalizeLfoPattern(raw, index = 0) {
  const fallback = createDefaultLfoPattern(index);
  return {
    id: typeof raw?.id === 'string' && raw.id.trim() ? raw.id : makeId(),
    name: typeof raw?.name === 'string' && raw.name.trim() ? raw.name.trim() : fallback.name,
    enabled: Boolean(raw?.enabled),
    depth: clampNumber(raw?.depth, fallback.depth, 0, 1),
    rateBeats: normalizeLfoRate(raw?.rateBeats, fallback.rateBeats),
    shape: normalizeLfoShape(raw?.shape, fallback.shape),
    timingFeel: normalizeLfoTimingFeel(raw?.timingFeel, fallback.timingFeel),
    smoothing: clampNumber(raw?.smoothing, fallback.smoothing, 0, 1),
    phase: clampNumber(raw?.phase, fallback.phase, 0, 0.999),
    customPoints: normalizeLfoCustomPoints(raw?.customPoints, fallback.customPoints),
  };
}

function normalizeLfoPatterns(rawPatterns) {
  const result = [];
  const source = Array.isArray(rawPatterns) ? rawPatterns : [];
  // Preserve all patterns from saved data; if empty, seed defaults
  const count = Math.max(source.length, LFO_PATTERN_COUNT);
  for (let i = 0; i < count; i++) {
    const raw = source[i];
    result.push(normalizeLfoPattern(raw, i));
  }
  return result;
}

// =====================================================================
// STATE – Song data model
// =====================================================================

let song = createDefaultSong();
let songVersion = 0;
const synthPanelExpanded = { chord: true, bass: true, string: true };
let editingDrumPatternId = null;
let editingLfoPatternId = null;
let copiedChordConfig = null;
let copiedSectionConfig = null;
let copiedDrumPatternConfig = null;
let copiedLfoPatternConfig = null;
let activePitchTarget = null;
let activeLoopTarget = null;
let debugPanelOpen = false;
let debugRefreshTimer = null;
let songEndTimeout = null;

const debugState = {
  logs: [],
  maxLogs: 80,
  counters: {
    voicesCreated: 0,
    voicesEnded: 0,
    nodeCleanups: 0,
    schedulerTicks: 0,
  },
};

const activeAudioNodes = new Set();
let activeVoiceCount = 0;
const noiseBufferCache = new Map();

function setActivePitchTarget(sectionId, chordId, kind = 'chord') {
  if (!sectionId || !chordId) return;
  activePitchTarget = {
    sectionId,
    chordId,
    kind: kind === 'bass' ? 'bass' : kind === 'string' ? 'string' : 'chord',
  };
}

function getActivePitchTarget() {
  if (!activePitchTarget) return null;
  const section = song.sections.find(entry => entry.id === activePitchTarget.sectionId);
  if (!section) {
    activePitchTarget = null;
    return null;
  }
  const chord = section.chords.find(entry => entry.id === activePitchTarget.chordId);
  if (!chord) {
    activePitchTarget = null;
    return null;
  }
  return {
    sectionId: section.id,
    chordId: chord.id,
    kind: activePitchTarget.kind === 'bass' ? 'bass' : activePitchTarget.kind === 'string' ? 'string' : 'chord',
  };
}

function getActiveLoopTarget() {
  if (!activeLoopTarget) return null;
  const section = song.sections.find(entry => entry.id === activeLoopTarget.sectionId);
  if (!section) {
    activeLoopTarget = null;
    return null;
  }
  const chord = section.chords.find(entry => entry.id === activeLoopTarget.chordId);
  if (!chord) {
    activeLoopTarget = null;
    return null;
  }
  return {
    sectionId: section.id,
    chordId: chord.id,
  };
}

function clearActiveLoopTarget() {
  if (!activeLoopTarget) return;
  activeLoopTarget = null;
  updatePlaybackHighlights();
}

function deepClone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function getDefaultDrumPatternId() {
  return song.drumPatterns?.[0]?.id || null;
}

function getDefaultLfoPatternId() {
  return song.lfoPatterns?.[0]?.id || null;
}

function getValidDrumPatternId(patternId, fallback = getDefaultDrumPatternId()) {
  if (song.drumPatterns?.some(pattern => pattern.id === patternId)) return patternId;
  return fallback;
}

function getValidLfoPatternId(patternId, fallback = getDefaultLfoPatternId()) {
  if (song.lfoPatterns?.some(pattern => pattern.id === patternId)) return patternId;
  return fallback;
}

function getValidDrumFilterLfoPatternId(patternId, fallback = getDefaultLfoPatternId()) {
  return getValidLfoPatternId(patternId, fallback);
}

function getDrumPatternById(patternId) {
  const patterns = song.drumPatterns || [];
  if (!patterns.length) return null;
  const resolvedId = getValidDrumPatternId(patternId, patterns[0].id);
  return patterns.find(pattern => pattern.id === resolvedId) || patterns[0];
}

function getLfoPatternById(patternId) {
  const patterns = song.lfoPatterns || [];
  if (!patterns.length) return null;
  const resolvedId = getValidLfoPatternId(patternId, patterns[0].id);
  return patterns.find(pattern => pattern.id === resolvedId) || patterns[0];
}

function getDrumFilterLfoPattern() {
  const fallbackId = getDefaultLfoPatternId();
  const patternId = getValidDrumFilterLfoPatternId(song.drumFx?.filterLfoPatternId, fallbackId);
  return getLfoPatternById(patternId || fallbackId);
}

function getChordDrumPatternId(chord, fallback = getDefaultDrumPatternId()) {
  return getValidDrumPatternId(chord?.drumPatternId, fallback);
}

function getChordLfoPatternId(chord, fallback = getDefaultLfoPatternId()) {
  return getChordPartLfoPatternId(chord, 'chord', fallback);
}

function getChordPartLfoPatternId(chord, kind = 'chord', fallback = getDefaultLfoPatternId()) {
  const key = kind === 'bass'
    ? 'bassLfoPatternId'
    : kind === 'string'
      ? 'stringLfoPatternId'
      : 'chordLfoPatternId';
  const partPatternId = getValidLfoPatternId(chord?.[key], null);
  const legacyPatternId = getValidLfoPatternId(chord?.lfoPatternId, fallback);
  return partPatternId || legacyPatternId;
}

function refreshDrumPatternOptionLabels(patternId, name) {
  document.querySelectorAll(`option[value="${patternId}"]`).forEach(option => {
    option.textContent = name;
  });
}

function refreshLfoPatternOptionLabels(patternId, name) {
  document.querySelectorAll(`option[value="${patternId}"]`).forEach(option => {
    option.textContent = name;
  });
}

function refreshAllChordDrumDropdowns() {
  const patterns = song.drumPatterns || [];
  document.querySelectorAll('select[id^="drum-pattern-"]').forEach(select => {
    if (select.id === 'drum-pattern-select') return; // skip the sequencer editor selector
    const currentValue = select.value;
    select.innerHTML = '';
    patterns.forEach(pattern => {
      const option = document.createElement('option');
      option.value = pattern.id;
      option.textContent = pattern.name;
      if (pattern.id === currentValue) option.selected = true;
      select.appendChild(option);
    });
  });
}

function refreshAllChordLfoDropdowns() {
  const patterns = song.lfoPatterns || [];
  ['lfo-pattern-chord-', 'lfo-pattern-bass-', 'lfo-pattern-string-', 'drum-filter-lfo-pattern-select'].forEach(prefix => {
    document.querySelectorAll(`select[id^="${prefix}"]`).forEach(select => {
      const currentValue = select.value;
      select.innerHTML = '';
      patterns.forEach(pattern => {
        const option = document.createElement('option');
        option.value = pattern.id;
        option.textContent = pattern.name;
        if (pattern.id === currentValue) option.selected = true;
        select.appendChild(option);
      });
    });
  });
}

function cloneChordForClipboard(chord) {
  if (!chord) return null;
  const {
    id,
    drumPatternId,
    lfoPatternId,
    chordLfoPatternId,
    bassLfoPatternId,
    stringLfoPatternId,
    ...copied
  } = normalizeChord(chord, getDefaultDrumPatternId(), getDefaultLfoPatternId());
  return deepClone(copied);
}

function cloneSectionForClipboard(section) {
  if (!section) return null;
  const normalized = normalizeSection(section, section.type, getDefaultDrumPatternId(), getDefaultLfoPatternId());
  return deepClone(normalized);
}

function cloneSectionForInsert(section) {
  if (!section) return null;
  const cloned = normalizeSection(deepClone(section), section.type, getDefaultDrumPatternId(), getDefaultLfoPatternId());
  cloned.id = makeId();
  cloned.chords = (cloned.chords || []).map(chord => normalizeChord({ ...deepClone(chord), id: makeId() }, getDefaultDrumPatternId(), getDefaultLfoPatternId()));
  return cloned;
}

function getCopiedSectionConfiguration() {
  return copiedSectionConfig
    ? normalizeSection(deepClone(copiedSectionConfig), copiedSectionConfig.type, getDefaultDrumPatternId(), getDefaultLfoPatternId())
    : null;
}

function updateSectionClipboardActionState() {
  const hasSection = Boolean(copiedSectionConfig);
  document.querySelectorAll('button[data-requires-section-copy="true"]').forEach(button => {
    button.disabled = !hasSection;
    const enabledTitle = button.dataset.titleEnabled || button.title;
    const emptyTitle = button.dataset.titleEmpty || 'Copy a section first';
    button.title = hasSection ? enabledTitle : emptyTitle;
  });
}

function applySectionSettingsOnly(sourceSection, targetSection) {
  if (!sourceSection || !targetSection) return;
  targetSection.scaleRoot = sourceSection.scaleRoot;
  targetSection.scaleType = sourceSection.scaleType;
  targetSection.crashOnStart = sourceSection.crashOnStart;
  targetSection.rollAtEnd = sourceSection.rollAtEnd;
  const sourceChords = Array.isArray(sourceSection.chords) ? sourceSection.chords : [];
  targetSection.chords.forEach((targetChord, index) => {
    const sourceChord = sourceChords[index];
    if (!sourceChord) return;
    const targetId = targetChord.id;
    const preservedRoot = targetChord.root;
    const preservedType = targetChord.type;
    const preservedBassRoot = targetChord.bassRoot;
    const preservedStringRoot = targetChord.stringRoot;
    const normalized = normalizeChord({
      ...deepClone(sourceChord),
      id: targetId,
      root: preservedRoot,
      type: preservedType,
      bassRoot: preservedBassRoot,
      stringRoot: preservedStringRoot,
    }, getDefaultDrumPatternId(), getDefaultLfoPatternId());
    Object.assign(targetChord, normalized, {
      id: targetId,
      root: preservedRoot,
      type: preservedType,
      bassRoot: preservedBassRoot,
      stringRoot: preservedStringRoot,
    });
  });
}

function cloneDrumPatternForClipboard(pattern) {
  if (!pattern) return null;
  return deepClone({
    name: pattern.name,
    grid: pattern.grid,
    laneSounds: normalizeDrumPatternLaneSounds(pattern.laneSounds),
  });
}

function cloneLfoPatternForClipboard(pattern) {
  if (!pattern) return null;
  const { id, ...copied } = normalizeLfoPattern(pattern);
  return deepClone(copied);
}

function getPreferredEditingChord(section) {
  if (!section) return null;
  const pitchTarget = getActivePitchTarget();
  if (pitchTarget?.sectionId === section.id) {
    const pitchChord = section.chords.find(chord => chord.id === pitchTarget.chordId);
    if (pitchChord) return pitchChord;
  }
  const loopTarget = getActiveLoopTarget();
  if (loopTarget?.sectionId === section.id) {
    const loopChord = section.chords.find(chord => chord.id === loopTarget.chordId);
    if (loopChord) return loopChord;
  }
  return section.chords[0] || null;
}

function getPreferredEditingDrumPatternId() {
  const selectedSection = song.sections.find(section => section.id === song.selectedSectionId) || song.sections[0];
  const preferredChord = getPreferredEditingChord(selectedSection);
  return getChordDrumPatternId(preferredChord, getDefaultDrumPatternId());
}

function getPreferredEditingLfoPatternId() {
  const selectedSection = song.sections.find(section => section.id === song.selectedSectionId) || song.sections[0];
  const preferredChord = getPreferredEditingChord(selectedSection);
  return getChordLfoPatternId(preferredChord, getDefaultLfoPatternId());
}

function setPlaybackCursorFromPoint(point, songBeatIndex) {
  if (!point) return;
  playbackCursor.sequenceIndex = point.sequenceIndex;
  playbackCursor.sectionIndex = point.sectionIndex;
  playbackCursor.chordIndex = point.chordIndex;
  playbackCursor.beatInChord = point.beatInChord;
  playbackCursor.beatInSection = point.beatInSection;
  playbackCursor.arrangerEntryId = point.arrangerEntryId;
  playbackCursor.arrangerEntryIndex = point.arrangerEntryIndex;
  playbackCursor.arrangerRepeatIndex = point.arrangerRepeatIndex;
  playbackCursor.songBeatIndex = songBeatIndex;
}

function findSongBeatPointForChord(sectionId, chordId, map = buildSongBeatMap()) {
  if (!sectionId || !chordId || !map.length) return null;
  const sectionIndex = song.sections.findIndex(entry => entry.id === sectionId);
  if (sectionIndex < 0) return null;
  const chordIndex = song.sections[sectionIndex]?.chords?.findIndex(entry => entry.id === chordId);
  if (chordIndex < 0) return null;
  const index = map.findIndex(point => point.sectionIndex === sectionIndex && point.chordIndex === chordIndex && point.beatInChord === 0);
  if (index < 0) return null;
  return { index, point: map[index] };
}

function movePlaybackToActiveLoopTarget({ rescheduleAudio = false } = {}) {
  const loopTarget = getActiveLoopTarget();
  if (!loopTarget || !usesSongTimelineMode(song.playbackMode || 'edit')) return false;
  const targetPoint = findSongBeatPointForChord(loopTarget.sectionId, loopTarget.chordId);
  if (!targetPoint) return false;
  setPlaybackCursorFromPoint(targetPoint.point, targetPoint.index);
  songEndedPending = false;
  if (rescheduleAudio && isBeating) flushScheduledNotes({ restartPlayback: true });
  updatePlaybackPositionUI(playbackCursor.sectionIndex, playbackCursor.chordIndex, playbackCursor.beatInChord, playbackCursor.songBeatIndex);
  return true;
}

function setActiveLoopTarget(sectionId, chordId, { retargetPlayback = false } = {}) {
  if (!sectionId || !chordId) return;
  const section = song.sections.find(entry => entry.id === sectionId);
  if (!section || !section.chords.some(entry => entry.id === chordId)) return;
  activeLoopTarget = { sectionId, chordId };
  updatePlaybackHighlights();
  const mode = song.playbackMode || 'edit';
  if (mode === 'looping') movePlaybackToActiveLoopTarget({ rescheduleAudio: retargetPlayback && isBeating });
}

function normalizeChord(rawChord, fallbackDrumPatternId = null, fallbackLfoPatternId = null) {
  const chord = rawChord || {};
  const loopEnabled = chord.loopEnabled !== undefined ? chord.loopEnabled : chord.cycle;
  const arpMode = ARP_MODES.includes(chord.arpMode) ? chord.arpMode : 'off';
  const normalizedRoot = normalizeSemitone(chord.root, 0);
  const type = CHORD_TYPES.some(entry => entry.name === chord.type) ? chord.type : 'maj';
  const defaultNoteCount = clampInt(chordTypeObj(type).intervals.length, 3, 1, 16);
  const chordRepeat = normalizeRepeat(chord.chordRepeat, 1);
  const legacyLfoPatternId = typeof chord.lfoPatternId === 'string' && chord.lfoPatternId.trim()
    ? chord.lfoPatternId
    : fallbackLfoPatternId;
  return {
    id: chord.id || makeId(),
    root: normalizedRoot,
    bassRoot: normalizeSemitone(chord.bassRoot, normalizedRoot),
    stringRoot: normalizeSemitone(chord.stringRoot, normalizedRoot),
    type,
    beats: clampInt(chord.beats, 4, 1, 64),
    chordRepeat,
    bassRepeat: normalizeRepeat(chord.bassRepeat, 1),
    stringRepeat: normalizeRepeat(chord.stringRepeat, chordRepeat),
    noteCount: clampInt(chord.noteCount, defaultNoteCount, 1, 16),
    startBeat: normalizeStartBeat(chord.startBeat, 1),
    loopEnabled: Boolean(loopEnabled),
    arpMode,
    drumPatternId: typeof chord.drumPatternId === 'string' && chord.drumPatternId.trim()
      ? chord.drumPatternId
      : fallbackDrumPatternId,
    lfoPatternId: legacyLfoPatternId,
    chordLfoPatternId: typeof chord.chordLfoPatternId === 'string' && chord.chordLfoPatternId.trim()
      ? chord.chordLfoPatternId
      : legacyLfoPatternId,
    bassLfoPatternId: typeof chord.bassLfoPatternId === 'string' && chord.bassLfoPatternId.trim()
      ? chord.bassLfoPatternId
      : legacyLfoPatternId,
    stringLfoPatternId: typeof chord.stringLfoPatternId === 'string' && chord.stringLfoPatternId.trim()
      ? chord.stringLfoPatternId
      : legacyLfoPatternId,
    bassIn: chord.bassIn === undefined ? true : Boolean(chord.bassIn),
    chordsIn: chord.chordsIn === undefined ? true : Boolean(chord.chordsIn),
    drumsIn: chord.drumsIn === undefined ? true : Boolean(chord.drumsIn),
    stringsIn: chord.stringsIn === undefined ? true : Boolean(chord.stringsIn),
  };
}

function normalizeSection(rawSection, fallbackType = 'Custom', fallbackDrumPatternId = null, fallbackLfoPatternId = null) {
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
    chords: (Array.isArray(section.chords) ? section.chords : [])
      .map(chord => normalizeChord(chord, fallbackDrumPatternId, fallbackLfoPatternId)),
  };
}

function normalizeSong(rawSong) {
  const base = createDefaultSong();
  const parsed = rawSong || {};

  const drumPatterns = normalizeDrumPatterns(parsed.drumPatterns);
  const validPatternIds = new Set(drumPatterns.map(p => p.id));
  const defaultPatternId = drumPatterns[0].id;
  const lfoPatterns = normalizeLfoPatterns(parsed.lfoPatterns);
  const validLfoPatternIds = new Set(lfoPatterns.map(pattern => pattern.id));
  const defaultLfoPatternId = lfoPatterns[0].id;

  const sections = (Array.isArray(parsed.sections) ? parsed.sections : base.sections)
    .map(section => {
      const legacyPatternId = validPatternIds.has(section?.drumPatternId)
        ? section.drumPatternId
        : defaultPatternId;
      const legacyLfoPatternId = validLfoPatternIds.has(section?.lfoPatternId)
        ? section.lfoPatternId
        : defaultLfoPatternId;
      const normalized = normalizeSection(section, section?.type, legacyPatternId, legacyLfoPatternId);
      return {
        ...normalized,
        chords: normalized.chords.map(chord => ({
          ...(() => {
            const resolvedDrumPatternId = validPatternIds.has(chord.drumPatternId) ? chord.drumPatternId : legacyPatternId;
            const resolvedLegacyLfoPatternId = validLfoPatternIds.has(chord.lfoPatternId) ? chord.lfoPatternId : legacyLfoPatternId;
            const resolvePartLfoPatternId = value => validLfoPatternIds.has(value) ? value : resolvedLegacyLfoPatternId;
            return {
              ...chord,
              drumPatternId: resolvedDrumPatternId,
              lfoPatternId: resolvedLegacyLfoPatternId,
              chordLfoPatternId: resolvePartLfoPatternId(chord.chordLfoPatternId),
              bassLfoPatternId: resolvePartLfoPatternId(chord.bassLfoPatternId),
              stringLfoPatternId: resolvePartLfoPatternId(chord.stringLfoPatternId),
            };
          })(),
        })),
      };
    });
  if (sections.length === 0) {
    const defaultSection = createSection('Verse', defaultPatternId, defaultLfoPatternId);
    sections.push(defaultSection);
  }
  const selectedSectionExists = sections.some(section => section.id === parsed.selectedSectionId);
  const chordSound = resolvePresetId('chord', parsed.chordSound || parsed.chordSynth?.preset || base.chordSound);
  const bassSound = resolvePresetId('bass', parsed.bassSound || parsed.bassSynth?.preset || base.bassSound);
  const stringSound = resolvePresetId('string', parsed.stringSound || parsed.stringSynth?.preset || base.stringSound);
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
    stringPitchMode: STRING_PITCH_MODES.includes(parsed.stringPitchMode) ? parsed.stringPitchMode : base.stringPitchMode,
    chordSound,
    chordSynth: normalizeSynthSettings('chord', parsed.chordSynth, chordSound),
    bassEnabled: parsed.bassEnabled === undefined ? base.bassEnabled : Boolean(parsed.bassEnabled),
    bassSound,
    bassSynth: normalizeSynthSettings('bass', parsed.bassSynth, bassSound),
    stringEnabled: parsed.stringEnabled === undefined ? base.stringEnabled : Boolean(parsed.stringEnabled),
    stringSound,
    stringSynth: normalizeSynthSettings('string', parsed.stringSynth, stringSound),
    drumPatterns,
    lfoPatterns,
    mixer: {
      chordVolume: clampNumber(parsed.mixer?.chordVolume, base.mixer.chordVolume, 0, 1),
      bassVolume: clampNumber(parsed.mixer?.bassVolume, base.mixer.bassVolume, 0, 1),
      stringVolume: clampNumber(parsed.mixer?.stringVolume, base.mixer.stringVolume, 0, 1),
      drumsVolume: clampNumber(parsed.mixer?.drumsVolume, base.mixer.drumsVolume, 0, 1),
      masterVolume: clampNumber(parsed.mixer?.masterVolume, base.mixer.masterVolume, 0, 1),
    },
    reverb: {
      chordWet: clampNumber(parsed.reverb?.chordWet, base.reverb.chordWet, 0, 1),
      bassWet: clampNumber(parsed.reverb?.bassWet, base.reverb.bassWet, 0, 1),
      stringWet: clampNumber(parsed.reverb?.stringWet, base.reverb.stringWet, 0, 1),
    },
    drumFx: {
      distortionEnabled: parsed.drumFx?.distortionEnabled === undefined
        ? base.drumFx.distortionEnabled
        : Boolean(parsed.drumFx.distortionEnabled),
      distortionModel: normalizeDrumDistortionModel(parsed.drumFx?.distortionModel, base.drumFx.distortionModel),
      distortionDrive: clampNumber(parsed.drumFx?.distortionDrive, base.drumFx.distortionDrive, 0, 1),
      filterEnabled: parsed.drumFx?.filterEnabled === undefined
        ? base.drumFx.filterEnabled
        : Boolean(parsed.drumFx.filterEnabled),
      filterType: normalizeDrumFilterType(parsed.drumFx?.filterType, base.drumFx.filterType),
      filterCutoff: clampNumber(parsed.drumFx?.filterCutoff, base.drumFx.filterCutoff, 20, 20000),
      filterResonance: clampNumber(parsed.drumFx?.filterResonance, base.drumFx.filterResonance, 0.2, 12),
      filterSlope: normalizeDrumFilterSlope(parsed.drumFx?.filterSlope, base.drumFx.filterSlope),
      filterLfoEnabled: parsed.drumFx?.filterLfoEnabled === undefined
        ? base.drumFx.filterLfoEnabled
        : Boolean(parsed.drumFx.filterLfoEnabled),
      filterLfoPatternId: validLfoPatternIds.has(parsed.drumFx?.filterLfoPatternId)
        ? parsed.drumFx.filterLfoPatternId
        : defaultLfoPatternId,
      filterLfoDepth: clampNumber(parsed.drumFx?.filterLfoDepth, base.drumFx.filterLfoDepth, 0, 1),
      reverbMix: clampNumber(parsed.drumFx?.reverbMix, base.drumFx.reverbMix, 0, 1),
      reverbSize: clampNumber(parsed.drumFx?.reverbSize, base.drumFx.reverbSize, 0, 1),
      reverbDecay: clampNumber(parsed.drumFx?.reverbDecay, base.drumFx.reverbDecay, 0, 1),
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

function getChordStringRoot(chord) {
  if ((song.stringPitchMode || 'linked') !== 'free') return chord.root;
  return normalizeSemitone(chord.stringRoot, chord.root);
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

function beatOffsetToSeconds(beats) {
  return (60 / song.bpm) * Math.max(0, Number.isFinite(Number(beats)) ? Number(beats) : 0);
}

// =====================================================================
// SONG MUTATIONS
// =====================================================================

function commitSong({
  rerender = false,
  refreshCursor = false,
  flushNoteBuffer = false,
  snapToChordStart = false,
  preserveDrumPhase = false,
} = {}) {
  songVersion += 1;
  saveSong();
  applyAudioMixSettings();
  const shouldRefreshCursor = refreshCursor && isBeating && !preserveDrumPhase;
  if (shouldRefreshCursor) initializePlaybackCursor();
  if (flushNoteBuffer || shouldRefreshCursor) {
    flushScheduledNotes({
      restartPlayback: isBeating,
      snapToChordStart: snapToChordStart || shouldRefreshCursor,
      preserveDrumPhase,
      clearDrumNodes: !preserveDrumPhase,
    });
  }
  if (rerender) {
    render({ preservePlaybackCursor: preserveDrumPhase });
    return;
  }
  updateSongGoToControl();
  updatePlaybackHighlights();
}

function handleSchedulingParameterChange({ rerender = false, refreshCursor = false } = {}) {
  commitSong({
    rerender,
    refreshCursor,
    flushNoteBuffer: true,
    preserveDrumPhase: true,
  });
}

function handleSynthParameterChange({ rerender = false, refreshCursor = false } = {}) {
  commitSong({ rerender, refreshCursor });
}

function snapPlaybackCursorToChordStart() {
  const mode = song.playbackMode || 'edit';
  if (usesSongTimelineMode(mode)) {
    const map = buildSongBeatMap();
    if (!map.length) return;
    const currentIndex = Math.max(0, Math.min(map.length - 1, playbackCursor.songBeatIndex));
    const currentPoint = map[currentIndex];
    if (!currentPoint) return;
    const targetIndex = Math.max(0, currentIndex - currentPoint.beatInChord);
    const targetPoint = map[targetIndex] || currentPoint;
    setPlaybackCursorFromPoint(targetPoint, targetIndex);
  } else {
    const beatInChord = Math.max(0, clampInt(playbackCursor.beatInChord, 0, 0, 63));
    playbackCursor.beatInSection = Math.max(0, playbackCursor.beatInSection - beatInChord);
    playbackCursor.beatInChord = 0;
  }
  updatePlaybackPositionUI(playbackCursor.sectionIndex, playbackCursor.chordIndex, playbackCursor.beatInChord, playbackCursor.songBeatIndex);
}

function addSection(type) {
  const section = createSection(type, getDefaultDrumPatternId(), getDefaultLfoPatternId());
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
  renderNavigationRibbon();
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
  editingDrumPatternId = getPreferredEditingDrumPatternId();
  editingLfoPatternId = getPreferredEditingLfoPatternId();
  commitSong();
  updatePlaybackModeUI();
  updatePlaybackHighlights();
  renderDrumSequencer();
  renderSynthRack();
  if (isBeating && song.playbackMode === 'edit') {
    initializePlaybackCursor();
    flushScheduledNotes({ restartPlayback: true });
  }
}

function setPlaybackMode(mode) {
  if (!PLAYBACK_MODES.includes(mode)) return;
  song.playbackMode = mode;
  if (mode !== 'looping') clearActiveLoopTarget();
  commitSong();
  updatePlaybackModeUI();
  if (isBeating) {
    if (mode === 'looping' && getActiveLoopTarget()) movePlaybackToActiveLoopTarget({ rescheduleAudio: true });
    else {
      initializePlaybackCursor();
      flushScheduledNotes({ restartPlayback: true });
    }
  }
}

function setSynthPreset(kind, presetId) {
  if (presetId === 'custom') return;
  const resolved = resolvePresetId(kind, presetId);
  if (kind === 'bass') {
    song.bassSound = resolved;
    song.bassSynth = createSynthSettings('bass', resolved);
  } else if (kind === 'string') {
    song.stringSound = resolved;
    song.stringSynth = createSynthSettings('string', resolved);
  } else {
    song.chordSound = resolved;
    song.chordSynth = createSynthSettings('chord', resolved);
  }
  handleSynthParameterChange();
  renderSynthRack();
}

function setBassEnabled(enabled) {
  song.bassEnabled = Boolean(enabled);
  commitSong({ flushNoteBuffer: true, preserveDrumPhase: true });
}

function setBassPitchMode(mode) {
  if (!BASS_PITCH_MODES.includes(mode)) return;
  song.bassPitchMode = mode;
  commitSong({ rerender: true, refreshCursor: true, flushNoteBuffer: true, preserveDrumPhase: true });
}

function setStringEnabled(enabled) {
  song.stringEnabled = Boolean(enabled);
  commitSong({ flushNoteBuffer: true, preserveDrumPhase: true });
}

function setStringPitchMode(mode) {
  if (!STRING_PITCH_MODES.includes(mode)) return;
  song.stringPitchMode = mode;
  commitSong({ rerender: true, refreshCursor: true, flushNoteBuffer: true, preserveDrumPhase: true });
}

function setSynthPanelExpanded(kind, expanded) {
  if (kind !== 'chord' && kind !== 'bass' && kind !== 'string') return;
  synthPanelExpanded[kind] = Boolean(expanded);
  renderSynthRack();
}

function getSynthByKind(kind) {
  if (kind === 'bass') return song.bassSynth;
  if (kind === 'string') return song.stringSynth;
  return song.chordSynth;
}

function markSynthAsCustom(kind) {
  const synth = getSynthByKind(kind);
  if (!synth) return;
  synth.preset = 'custom';
  if (kind === 'bass') song.bassSound = 'custom';
  else if (kind === 'string') song.stringSound = 'custom';
  else song.chordSound = 'custom';
  const presetSelect = document.getElementById(`${kind}-preset-select`);
  if (presetSelect) presetSelect.value = 'custom';
}

function updateSynthField(kind, fieldKey, value) {
  const synth = getSynthByKind(kind);
  const field = SYNTH_UI_FIELDS.find(entry => entry.key === fieldKey);
  if (!synth || !field) return;
  const clamped = clampNumber(value, synth[fieldKey], field.min, field.max);
  synth[fieldKey] = field.step >= 1 ? Math.round(clamped) : clamped;
  if (fieldKey === 'cutoff' || fieldKey === 'resonance') {
    applySynthFilterSettingsToActiveVoices(kind);
  }
  markSynthAsCustom(kind);
  handleSynthParameterChange();
}

function updateSynthSelectField(kind, fieldKey, value) {
  const synth = getSynthByKind(kind);
  if (!synth) return;
  if (fieldKey === 'filterPoles') {
    synth.filterPoles = normalizeFilterPoles(value, synth.filterPoles);
    applySynthFilterSettingsToActiveVoices(kind);
  }
  else if (fieldKey === 'delaySubdivisionBeats') synth.delaySubdivisionBeats = normalizeDelaySubdivision(Number(value), synth.delaySubdivisionBeats);
  else if (fieldKey === 'delayFeel') synth.delayFeel = normalizeDelayFeel(value, synth.delayFeel);
  else return;
  markSynthAsCustom(kind);
  handleSynthParameterChange();
}

function updateSynthFilterLfoField(kind, fieldKey, value) {
  const synth = getSynthByKind(kind);
  if (!synth) return;
  if (fieldKey === 'filterLfoEnabled') {
    synth.filterLfoEnabled = Boolean(value);
    if (!synth.filterLfoEnabled) {
      // Restore base cutoff when filter LFO is disabled
      applySynthFilterSettingsToActiveVoices(kind);
    }
  } else if (fieldKey === 'filterLfoDepth') {
    synth.filterLfoDepth = clampNumber(value, synth.filterLfoDepth, 0, 1);
  } else {
    return;
  }
  markSynthAsCustom(kind);
  handleSynthParameterChange();
}

function updateSynthWaveform(kind, fieldKey, value) {
  if (!OSC_TYPES.includes(value)) return;
  if (!['osc1Type', 'osc2Type', 'osc3Type', 'osc4Type'].includes(fieldKey)) return;
  const synth = getSynthByKind(kind);
  if ((fieldKey === 'osc3Type' || fieldKey === 'osc4Type') && kind !== 'string') return;
  if (!synth) return;
  synth[fieldKey] = value;
  markSynthAsCustom(kind);
  handleSynthParameterChange();
  renderSynthRack();
}

function addChord(sectionId) {
  const section = song.sections.find(entry => entry.id === sectionId);
  if (!section) return;
  const inheritedPatternId = getChordDrumPatternId(section.chords[section.chords.length - 1], getDefaultDrumPatternId());
  const inheritedLfoPatternId = getChordPartLfoPatternId(section.chords[section.chords.length - 1], 'chord', getDefaultLfoPatternId());
  const inheritedBassLfoPatternId = getChordPartLfoPatternId(section.chords[section.chords.length - 1], 'bass', inheritedLfoPatternId);
  const inheritedStringLfoPatternId = getChordPartLfoPatternId(section.chords[section.chords.length - 1], 'string', inheritedLfoPatternId);
  section.chords.push(createChord(
    DEFAULT_CHORD_ROOT,
    'maj',
    inheritedPatternId,
    inheritedLfoPatternId,
    {
      chord: inheritedLfoPatternId,
      bass: inheritedBassLfoPatternId,
      string: inheritedStringLfoPatternId,
    },
  ));
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
  handleSchedulingParameterChange({ rerender, refreshCursor });
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

function updateStringRepeat(sectionId, chordId, repeat) {
  mutateChord(sectionId, chordId, chord => {
    chord.stringRepeat = normalizeRepeat(repeat, chord.stringRepeat || chord.chordRepeat || 1);
  }, { refreshCursor: true });
}

function updateChordNoteCount(sectionId, chordId, noteCount) {
  mutateChord(sectionId, chordId, chord => {
    chord.noteCount = clampInt(noteCount, chord.noteCount || chordTypeObj(chord.type).intervals.length, 1, 16);
  }, { refreshCursor: true });
}

function updateChordStartBeat(sectionId, chordId, startBeat) {
  mutateChord(sectionId, chordId, chord => {
    chord.startBeat = normalizeStartBeat(startBeat, chord.startBeat || 1);
  }, { refreshCursor: true });
}

function updateChordLoopEnabled(sectionId, chordId, enabled) {
  mutateChord(sectionId, chordId, chord => {
    chord.loopEnabled = Boolean(enabled);
  });
}

function updateChordArpMode(sectionId, chordId, mode) {
  mutateChord(sectionId, chordId, chord => {
    chord.arpMode = ARP_MODES.includes(mode) ? mode : 'off';
  });
}

function setChordPartIn(sectionId, chordId, part, enabled) {
  const fieldMap = { bass: 'bassIn', chords: 'chordsIn', drums: 'drumsIn', strings: 'stringsIn' };
  const field = fieldMap[part];
  if (!field) return;
  mutateChord(sectionId, chordId, chord => {
    chord[field] = Boolean(enabled);
  });
}

function noteUp(sectionId, chordId) {
  setActivePitchTarget(sectionId, chordId, 'chord');
  mutateChord(sectionId, chordId, chord => {
    const section = song.sections.find(entry => entry.id === sectionId);
    chord.root = stepPitchBySectionScale(section, chord.root, 1);
    if ((song.bassPitchMode || 'linked') !== 'free') chord.bassRoot = chord.root;
    if ((song.stringPitchMode || 'linked') !== 'free') chord.stringRoot = chord.root;
  }, { rerender: true, refreshCursor: true });
}

function noteDown(sectionId, chordId) {
  setActivePitchTarget(sectionId, chordId, 'chord');
  mutateChord(sectionId, chordId, chord => {
    const section = song.sections.find(entry => entry.id === sectionId);
    chord.root = stepPitchBySectionScale(section, chord.root, -1);
    if ((song.bassPitchMode || 'linked') !== 'free') chord.bassRoot = chord.root;
    if ((song.stringPitchMode || 'linked') !== 'free') chord.stringRoot = chord.root;
  }, { rerender: true, refreshCursor: true });
}

function bassPitchUp(sectionId, chordId) {
  setActivePitchTarget(sectionId, chordId, 'bass');
  mutateChord(sectionId, chordId, chord => {
    if ((song.bassPitchMode || 'linked') !== 'free') return;
    const section = song.sections.find(entry => entry.id === sectionId);
    const currentBass = getChordBassRoot(chord);
    chord.bassRoot = stepPitchBySectionScale(section, currentBass, 1);
  }, { rerender: true, refreshCursor: true });
}

function bassPitchDown(sectionId, chordId) {
  setActivePitchTarget(sectionId, chordId, 'bass');
  mutateChord(sectionId, chordId, chord => {
    if ((song.bassPitchMode || 'linked') !== 'free') return;
    const section = song.sections.find(entry => entry.id === sectionId);
    const currentBass = getChordBassRoot(chord);
    chord.bassRoot = stepPitchBySectionScale(section, currentBass, -1);
  }, { rerender: true, refreshCursor: true });
}

function stringPitchUp(sectionId, chordId) {
  setActivePitchTarget(sectionId, chordId, 'string');
  mutateChord(sectionId, chordId, chord => {
    if ((song.stringPitchMode || 'linked') !== 'free') return;
    const section = song.sections.find(entry => entry.id === sectionId);
    const currentString = getChordStringRoot(chord);
    chord.stringRoot = stepPitchBySectionScale(section, currentString, 1);
  }, { rerender: true, refreshCursor: true });
}

function stringPitchDown(sectionId, chordId) {
  setActivePitchTarget(sectionId, chordId, 'string');
  mutateChord(sectionId, chordId, chord => {
    if ((song.stringPitchMode || 'linked') !== 'free') return;
    const section = song.sections.find(entry => entry.id === sectionId);
    const currentString = getChordStringRoot(chord);
    chord.stringRoot = stepPitchBySectionScale(section, currentString, -1);
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
    if ((song.stringPitchMode || 'linked') !== 'free') chord.stringRoot = chord.root;
  }, { rerender: true, refreshCursor: true });
}

function transposeChordDown(sectionId, chordId) {
  mutateChord(sectionId, chordId, chord => {
    chord.root -= 1;
    if ((song.bassPitchMode || 'linked') !== 'free') chord.bassRoot = chord.root;
    if ((song.stringPitchMode || 'linked') !== 'free') chord.stringRoot = chord.root;
  }, { rerender: true, refreshCursor: true });
}

function transposeSong(steps) {
  song.sections.forEach(section => {
    section.scaleRoot += steps;
    section.chords.forEach(chord => {
      chord.root += steps;
      chord.bassRoot = normalizeSemitone(chord.bassRoot, chord.root - steps) + steps;
      chord.stringRoot = normalizeSemitone(chord.stringRoot, chord.root - steps) + steps;
      if ((song.bassPitchMode || 'linked') !== 'free') chord.bassRoot = chord.root;
      if ((song.stringPitchMode || 'linked') !== 'free') chord.stringRoot = chord.root;
    });
  });
  commitSong({ rerender: true, refreshCursor: true, flushNoteBuffer: true, preserveDrumPhase: true });
}

function updateBpm(raw) {
  const value = Math.min(300, Math.max(40, parseInt(raw, 10) || 100));
  song.bpm = value;
  const element = document.getElementById('bpm-input');
  if (element && parseInt(element.value, 10) !== value) element.value = value;
  commitSong({ flushNoteBuffer: true, preserveDrumPhase: true });
}

function updateMixerField(field, value) {
  if (!song.mixer) return;
  if (!Object.prototype.hasOwnProperty.call(song.mixer, field)) return;
  song.mixer[field] = clampNumber(value, song.mixer[field], 0, 1);
  commitSong();
}

function updateReverbWet(kind, value) {
  if (!song.reverb) return;
  const key = kind === 'bass' ? 'bassWet' : kind === 'string' ? 'stringWet' : 'chordWet';
  song.reverb[key] = clampNumber(value, song.reverb[key], 0, 1);
  commitSong();
}

function updateDrumFxField(field, value) {
  if (!song.drumFx) return;
  if (field === 'distortionEnabled') {
    song.drumFx.distortionEnabled = Boolean(value);
  } else if (field === 'distortionModel') {
    song.drumFx.distortionModel = normalizeDrumDistortionModel(value, song.drumFx.distortionModel);
  } else if (field === 'distortionDrive') {
    song.drumFx.distortionDrive = clampNumber(value, song.drumFx.distortionDrive, 0, 1);
  } else if (field === 'filterEnabled') {
    song.drumFx.filterEnabled = Boolean(value);
  } else if (field === 'filterType') {
    song.drumFx.filterType = normalizeDrumFilterType(value, song.drumFx.filterType);
  } else if (field === 'filterCutoff') {
    song.drumFx.filterCutoff = clampNumber(value, song.drumFx.filterCutoff, 20, 20000);
  } else if (field === 'filterResonance') {
    song.drumFx.filterResonance = clampNumber(value, song.drumFx.filterResonance, 0.2, 12);
  } else if (field === 'filterSlope') {
    song.drumFx.filterSlope = normalizeDrumFilterSlope(value, song.drumFx.filterSlope);
  } else if (field === 'filterLfoEnabled') {
    song.drumFx.filterLfoEnabled = Boolean(value);
  } else if (field === 'filterLfoPatternId') {
    song.drumFx.filterLfoPatternId = getValidDrumFilterLfoPatternId(value, getDefaultLfoPatternId());
  } else if (field === 'filterLfoDepth') {
    song.drumFx.filterLfoDepth = clampNumber(value, song.drumFx.filterLfoDepth, 0, 1);
  } else if (field === 'reverbMix') {
    song.drumFx.reverbMix = clampNumber(value, song.drumFx.reverbMix, 0, 1);
  } else if (field === 'reverbSize') {
    song.drumFx.reverbSize = clampNumber(value, song.drumFx.reverbSize, 0, 1);
  } else if (field === 'reverbDecay') {
    song.drumFx.reverbDecay = clampNumber(value, song.drumFx.reverbDecay, 0, 1);
  } else {
    return;
  }
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
  handleSchedulingParameterChange();
}

function updateDrumPatternName(patternId, name) {
  const pattern = getDrumPatternById(patternId);
  if (!pattern) return;
  pattern.name = name;
  commitSong();
  refreshDrumPatternOptionLabels(pattern.id, name);
}

function setDrumLaneSound(patternId, laneKey, soundId) {
  const pattern = getDrumPatternById(patternId);
  if (!pattern || !DRUM_LANES.some(lane => lane.key === laneKey)) return;
  const resolvedSoundId = normalizeDrumPatternLaneSounds({ [laneKey]: soundId })[laneKey];
  if (!resolvedSoundId || getDrumLaneSoundId(pattern, laneKey) === resolvedSoundId) return;
  pattern.laneSounds = Object.assign({}, normalizeDrumPatternLaneSounds(pattern.laneSounds), { [laneKey]: resolvedSoundId });
  handleSynthParameterChange();
}

function selectEditDrumPattern(patternId) {
  editingDrumPatternId = getValidDrumPatternId(patternId);
  renderDrumSequencer();
}

function updateChordDrumPattern(sectionId, chordId, patternId) {
  const resolvedPatternId = getValidDrumPatternId(patternId);
  if (!resolvedPatternId) return;
  mutateChord(sectionId, chordId, chord => {
    chord.drumPatternId = resolvedPatternId;
  }, { refreshCursor: true });
  editingDrumPatternId = resolvedPatternId;
  renderDrumSequencer();
}

function updateLfoPatternName(patternId, name) {
  const pattern = getLfoPatternById(patternId);
  if (!pattern) return;
  pattern.name = name;
  commitSong();
  refreshLfoPatternOptionLabels(pattern.id, pattern.name);
}

function updateLfoPatternField(patternId, key, value) {
  const pattern = getLfoPatternById(patternId);
  if (!pattern) return;
  if (key === 'enabled') pattern.enabled = Boolean(value);
  else if (key === 'depth') pattern.depth = clampNumber(value, pattern.depth, 0, 1);
  else if (key === 'rateBeats') pattern.rateBeats = normalizeLfoRate(value, pattern.rateBeats);
  else if (key === 'shape') pattern.shape = normalizeLfoShape(value, pattern.shape);
  else if (key === 'timingFeel') pattern.timingFeel = normalizeLfoTimingFeel(value, pattern.timingFeel);
  else if (key === 'smoothing') pattern.smoothing = clampNumber(value, pattern.smoothing, 0, 1);
  else if (key === 'phase') pattern.phase = clampNumber(value, pattern.phase, 0, 0.999);
  else if (key === 'customPoints') pattern.customPoints = normalizeLfoCustomPoints(value, pattern.customPoints);
  else return;
  handleSynthParameterChange();
}

function selectEditLfoPattern(patternId) {
  editingLfoPatternId = getValidLfoPatternId(patternId);
  renderSynthRack();
}

function updateChordLfoPattern(sectionId, chordId, kindOrPatternId, maybePatternId) {
  const kind = maybePatternId === undefined
    ? 'chord'
    : (kindOrPatternId === 'bass' || kindOrPatternId === 'string' ? kindOrPatternId : 'chord');
  const patternId = maybePatternId === undefined ? kindOrPatternId : maybePatternId;
  const resolvedPatternId = getValidLfoPatternId(patternId);
  if (!resolvedPatternId) return;
  mutateChord(sectionId, chordId, chord => {
    if (kind === 'bass') chord.bassLfoPatternId = resolvedPatternId;
    else if (kind === 'string') chord.stringLfoPatternId = resolvedPatternId;
    else {
      chord.lfoPatternId = resolvedPatternId;
      chord.chordLfoPatternId = resolvedPatternId;
    }
  }, { refreshCursor: true });
  editingLfoPatternId = resolvedPatternId;
  renderSynthRack();
}

function copyChordConfiguration(sectionId, chordId) {
  const section = song.sections.find(entry => entry.id === sectionId);
  const chord = section?.chords.find(entry => entry.id === chordId);
  if (!chord) return;
  copiedChordConfig = cloneChordForClipboard(chord);
}

function copySectionConfiguration(sectionId) {
  const section = song.sections.find(entry => entry.id === sectionId);
  if (!section) return;
  copiedSectionConfig = cloneSectionForClipboard(section);
  updateSectionClipboardActionState();
}

function pasteSectionSettings(sectionId) {
  const targetSection = song.sections.find(entry => entry.id === sectionId);
  if (!targetSection) return;
  const sourceSection = getCopiedSectionConfiguration();
  if (!sourceSection) {
    alert('Copy a section first.');
    return;
  }
  applySectionSettingsOnly(sourceSection, targetSection);
  handleSchedulingParameterChange({ rerender: true, refreshCursor: true });
}

function pasteSectionAll(sectionId) {
  const targetSection = song.sections.find(entry => entry.id === sectionId);
  if (!targetSection) return;
  const sourceSection = getCopiedSectionConfiguration();
  if (!sourceSection) {
    alert('Copy a section first.');
    return;
  }
  if (!confirm('Paste All will replace this section chords and settings. Continue?')) return;
  targetSection.type = sourceSection.type;
  targetSection.name = sourceSection.name;
  targetSection.scaleRoot = sourceSection.scaleRoot;
  targetSection.scaleType = sourceSection.scaleType;
  targetSection.crashOnStart = sourceSection.crashOnStart;
  targetSection.rollAtEnd = sourceSection.rollAtEnd;
  targetSection.chords = (sourceSection.chords || []).map(chord => normalizeChord({ ...deepClone(chord), id: makeId() }, getDefaultDrumPatternId(), getDefaultLfoPatternId()));
  handleSchedulingParameterChange({ rerender: true, refreshCursor: true });
}

function pasteSectionAsNewSection(afterSectionId) {
  const sourceSection = getCopiedSectionConfiguration();
  if (!sourceSection) {
    alert('Copy a section first.');
    return;
  }
  const insertedSection = cloneSectionForInsert(sourceSection);
  if (!insertedSection) return;
  const currentIndex = song.sections.findIndex(section => section.id === afterSectionId);
  if (currentIndex < 0) song.sections.push(insertedSection);
  else song.sections.splice(currentIndex + 1, 0, insertedSection);
  song.selectedSectionId = insertedSection.id;
  handleSchedulingParameterChange({ rerender: true, refreshCursor: true });
}

function pasteChordConfiguration(sectionId, chordId) {
  if (!copiedChordConfig) return;
  mutateChord(sectionId, chordId, chord => {
    const targetId = chord.id;
    const targetPatternId = getChordDrumPatternId(chord, getDefaultDrumPatternId());
    const targetChordLfoPatternId = getChordPartLfoPatternId(chord, 'chord', getDefaultLfoPatternId());
    const targetBassLfoPatternId = getChordPartLfoPatternId(chord, 'bass', targetChordLfoPatternId);
    const targetStringLfoPatternId = getChordPartLfoPatternId(chord, 'string', targetChordLfoPatternId);
    const pasted = normalizeChord({
      ...deepClone(copiedChordConfig),
      id: targetId,
      drumPatternId: targetPatternId,
      lfoPatternId: targetChordLfoPatternId,
      chordLfoPatternId: targetChordLfoPatternId,
      bassLfoPatternId: targetBassLfoPatternId,
      stringLfoPatternId: targetStringLfoPatternId,
    }, targetPatternId, targetChordLfoPatternId);
    Object.assign(chord, pasted, {
      id: targetId,
      drumPatternId: targetPatternId,
      lfoPatternId: targetChordLfoPatternId,
      chordLfoPatternId: targetChordLfoPatternId,
      bassLfoPatternId: targetBassLfoPatternId,
      stringLfoPatternId: targetStringLfoPatternId,
    });
  }, { rerender: true, refreshCursor: true });
}

function copyDrumPattern(patternId = editingDrumPatternId) {
  const pattern = getDrumPatternById(patternId);
  if (!pattern) return;
  copiedDrumPatternConfig = cloneDrumPatternForClipboard(pattern);
}

function pasteDrumPattern(patternId = editingDrumPatternId) {
  if (!copiedDrumPatternConfig) return;
  const pattern = getDrumPatternById(patternId);
  if (!pattern) return;
  const normalized = normalizeDrumPatterns([{
    id: pattern.id,
    name: copiedDrumPatternConfig.name,
    grid: copiedDrumPatternConfig.grid,
    laneSounds: copiedDrumPatternConfig.laneSounds,
  }])[0];
  pattern.name = normalized.name;
  pattern.grid = normalized.grid;
  pattern.laneSounds = normalized.laneSounds;
  editingDrumPatternId = pattern.id;
  refreshDrumPatternOptionLabels(pattern.id, pattern.name);
  handleSchedulingParameterChange();
  renderDrumSequencer();
}

function copyDrumPatternFromChord(sectionId, chordId) {
  const section = song.sections.find(entry => entry.id === sectionId);
  const chord = section?.chords.find(entry => entry.id === chordId);
  if (!chord) return;
  copyDrumPattern(getChordDrumPatternId(chord, getDefaultDrumPatternId()));
}

function pasteDrumPatternToChord(sectionId, chordId) {
  const section = song.sections.find(entry => entry.id === sectionId);
  const chord = section?.chords.find(entry => entry.id === chordId);
  if (!chord) return;
  const patternId = getChordDrumPatternId(chord, getDefaultDrumPatternId());
  if (!patternId) return;
  pasteDrumPattern(patternId);
}

function copyLfoPattern(patternId = editingLfoPatternId) {
  const pattern = getLfoPatternById(patternId);
  if (!pattern) return;
  copiedLfoPatternConfig = cloneLfoPatternForClipboard(pattern);
}

function pasteLfoPattern(patternId = editingLfoPatternId) {
  if (!copiedLfoPatternConfig) return;
  const pattern = getLfoPatternById(patternId);
  if (!pattern) return;
  const normalized = normalizeLfoPattern({
    id: pattern.id,
    ...copiedLfoPatternConfig,
  });
  Object.assign(pattern, normalized, { id: pattern.id });
  editingLfoPatternId = pattern.id;
  refreshLfoPatternOptionLabels(pattern.id, pattern.name);
  handleSynthParameterChange();
  renderSynthRack();
}

function copyLfoPatternFromChord(sectionId, chordId) {
  const section = song.sections.find(entry => entry.id === sectionId);
  const chord = section?.chords.find(entry => entry.id === chordId);
  if (!chord) return;
  copyLfoPattern(getChordLfoPatternId(chord, getDefaultLfoPatternId()));
}

function pasteLfoPatternToChord(sectionId, chordId) {
  const section = song.sections.find(entry => entry.id === sectionId);
  const chord = section?.chords.find(entry => entry.id === chordId);
  if (!chord) return;
  const patternId = getChordLfoPatternId(chord, getDefaultLfoPatternId());
  if (!patternId) return;
  pasteLfoPattern(patternId);
}

function addDrumPatternFromCurrent(sourcePatternId = editingDrumPatternId) {
  const source = getDrumPatternById(sourcePatternId);
  const rawName = prompt('Name for new drum pattern:', source ? source.name + ' copy' : 'New Pattern');
  if (rawName === null) return; // cancelled
  const name = rawName.trim() || 'New Pattern';
  const grid = {};
  DRUM_LANES.forEach(lane => {
    grid[lane.key] = source ? source.grid[lane.key].slice() : Array(16).fill(0);
  });
  const laneSounds = normalizeDrumPatternLaneSounds(source?.laneSounds);
  const newPattern = { id: makeId(), name, grid, laneSounds };
  song.drumPatterns = [...(song.drumPatterns || []), newPattern];
  editingDrumPatternId = newPattern.id;
  commitSong();
  renderDrumSequencer();
  refreshAllChordDrumDropdowns();
}

function addLfoPatternFromCurrent(sourcePatternId = editingLfoPatternId) {
  const source = getLfoPatternById(sourcePatternId);
  const rawName = prompt('Name for new LFO pattern:', source ? source.name + ' copy' : 'New LFO Pattern');
  if (rawName === null) return; // cancelled
  const name = rawName.trim() || 'New LFO Pattern';
  const newPattern = normalizeLfoPattern({ ...deepClone(source || {}), id: undefined, name });
  newPattern.id = makeId();
  song.lfoPatterns = [...(song.lfoPatterns || []), newPattern];
  editingLfoPatternId = newPattern.id;
  commitSong();
  renderSynthRack();
  refreshAllChordLfoDropdowns();
}

// =====================================================================
// PERSISTENCE – localStorage + JSON export/import
// =====================================================================

const STORAGE_KEY = 'chordz_song_v1';
const SONG_LIBRARY_KEY = 'chordz_song_library_v1';
const PROJECT_FILE_SCHEMA = 'chordz-project';
const PROJECT_FILE_VERSION = 2;
let projectFileHandle = null;

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

function ensureSongTitleForSave() {
  const titleElement = document.getElementById('song-title');
  const currentTitle = normalizeSongTitle(titleElement ? titleElement.value : song.title);
  if (currentTitle !== 'Untitled Song') return true;
  const entered = prompt('Enter a name for your song/project:', '');
  if (entered === null) return false;
  if (entered.trim()) {
    song.title = entered.trim();
    if (titleElement) titleElement.value = song.title;
  }
  return true;
}

function serializeProject(songData = song) {
  const normalizedSong = normalizeSong(songData);
  return {
    schema: PROJECT_FILE_SCHEMA,
    version: PROJECT_FILE_VERSION,
    savedAt: Date.now(),
    song: normalizedSong,
    uiState: {
      editingDrumPatternId: getValidDrumPatternId(editingDrumPatternId, normalizedSong.drumPatterns?.[0]?.id || null),
      editingLfoPatternId: getValidLfoPatternId(editingLfoPatternId, normalizedSong.lfoPatterns?.[0]?.id || null),
    },
  };
}

function normalizeProject(parsedProject) {
  if (!parsedProject || typeof parsedProject !== 'object') throw new Error('Invalid project file format.');
  const legacySong = Array.isArray(parsedProject.sections) ? parsedProject : null;
  const candidateSong = legacySong || parsedProject.song;
  if (!candidateSong || !Array.isArray(candidateSong.sections)) throw new Error('Project file does not contain song sections.');
  const normalizedSong = normalizeSong(candidateSong);
  return {
    song: normalizedSong,
    uiState: {
      editingDrumPatternId: getValidDrumPatternId(parsedProject.uiState?.editingDrumPatternId, normalizedSong.drumPatterns?.[0]?.id || null),
      editingLfoPatternId: getValidLfoPatternId(parsedProject.uiState?.editingLfoPatternId, normalizedSong.lfoPatterns?.[0]?.id || null),
    },
  };
}

function applyLoadedProject(parsedProject) {
  const normalizedProject = normalizeProject(parsedProject);
  song = normalizedProject.song;
  editingDrumPatternId = normalizedProject.uiState.editingDrumPatternId;
  editingLfoPatternId = normalizedProject.uiState.editingLfoPatternId;
  render();
  saveSong();
}

async function writeProjectToFileHandle(handle, json) {
  const writable = await handle.createWritable();
  await writable.write(json);
  await writable.close();
}

async function saveProjectFile() {
  if (!ensureSongTitleForSave()) return;
  saveSong();
  const payload = serializeProject(song);
  const json = JSON.stringify(payload, null, 2);
  const filename = sanitizeFilename(song.title || 'song') + '.chordz.json';

  if (window.showSaveFilePicker) {
    try {
      if (!projectFileHandle) {
        projectFileHandle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{ description: 'Chordz Project JSON', accept: { 'application/json': ['.json'] } }],
        });
      }
      await writeProjectToFileHandle(projectFileHandle, json);
      showSavedButtonState('project-save-btn', '✓ Project saved');
      debugLog('Saved project file: ' + (projectFileHandle?.name || filename));
      return;
    } catch (err) {
      if (err?.name === 'AbortError') return;
      if (err?.name === 'NotAllowedError') {
        projectFileHandle = null;
        alert('Save permission denied. Choose Save Project File… again to pick a location.');
        return;
      }
      alert('Save project file failed: ' + (err?.message || err));
      return;
    }
  }

  const blob = new Blob([json], { type: 'application/json' });
  downloadBlob(blob, filename);
  showSavedButtonState('project-save-btn', '✓ Project downloaded');
}

async function loadProjectFile() {
  const openFallbackInput = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json,.chordz.json';
    input.onchange = event => {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = loadEvent => {
        try {
          const parsed = JSON.parse(loadEvent.target.result);
          applyLoadedProject(parsed);
          projectFileHandle = null;
        } catch (error) {
          alert('Load project failed: ' + error.message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  if (!window.showOpenFilePicker) {
    openFallbackInput();
    return;
  }

  try {
    const [handle] = await window.showOpenFilePicker({
      multiple: false,
      types: [{ description: 'Chordz Project JSON', accept: { 'application/json': ['.json'] } }],
    });
    if (!handle) return;
    const file = await handle.getFile();
    const parsed = JSON.parse(await file.text());
    applyLoadedProject(parsed);
    projectFileHandle = handle;
  } catch (err) {
    if (err?.name === 'AbortError') return;
    alert('Load project failed: ' + (err?.message || err));
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
  const json = JSON.stringify(serializeProject(song), null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  downloadBlob(blob, sanitizeFilename(song.title || 'song') + '.chordz.json');
}

function importJSON() {
  loadProjectFile();
}

function sanitizeFilename(str) {
  return str.replace(/[^a-z0-9_\-]/gi, '_').toLowerCase().replace(/__+/g, '_').slice(0, 60) || 'song';
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function secondsToBeats(seconds) {
  const bpm = clampInt(song.bpm, 100, 40, 300);
  return Math.max(0, Number(seconds) || 0) / (60 / bpm);
}

function addHarmonicNoteEvents(target, {
  baseBeat,
  rootMidi,
  intervals,
  totalBeats,
  repeats,
  startBeat,
  arpMode = 'off',
  durationScale = 0.92,
  minDurationSeconds = 0.1,
}) {
  if (!Array.isArray(intervals) || !intervals.length) return;
  const normalizedBeats = clampInt(totalBeats, 4, 1, 64);
  const repeatCount = normalizeRepeat(repeats, 1);
  const effectiveStartBeat = Math.min(normalizedBeats, normalizeStartBeat(startBeat, 1));
  const startOffsetBeats = effectiveStartBeat - 1;
  const activeBeats = Math.max(0.25, normalizedBeats - startOffsetBeats);
  if (arpMode !== 'off') {
    const arpStepPattern = buildArpStepPattern(intervals.length, arpMode);
    if (!arpStepPattern.length) return;
    const stepBeats = 1 / repeatCount;
    const stepDurationBeats = Math.max(secondsToBeats(0.05), stepBeats * 0.88);
    const blockStartBeat = baseBeat + startOffsetBeats;
    const blockEndBeat = baseBeat + normalizedBeats;
    let step = 0;
    let hitBeat = blockStartBeat;
    while (hitBeat < blockEndBeat - 0.0001) {
      const remainingBeats = blockEndBeat - hitBeat;
      if (remainingBeats <= 0.0001) break;
      const actualDurationBeats = Math.min(
        stepDurationBeats,
        Math.max(secondsToBeats(0.04), remainingBeats * 0.95),
      );
      const intervalIndex = arpStepPattern[step % arpStepPattern.length];
      target.push({
        beat: hitBeat,
        durationBeats: actualDurationBeats,
        midi: rootMidi + intervals[intervalIndex],
      });
      step += 1;
      hitBeat += stepBeats;
    }
    return;
  }
  const hitBeats = Math.max(0.25, activeBeats / repeatCount);
  const hitDurationBeats = Math.max(secondsToBeats(minDurationSeconds), hitBeats * durationScale);
  for (let hit = 0; hit < repeatCount; hit++) {
    const hitBeat = baseBeat + startOffsetBeats + hit * hitBeats;
    intervals.forEach(interval => {
      target.push({
        beat: hitBeat,
        durationBeats: hitDurationBeats,
        midi: rootMidi + interval,
      });
    });
  }
}

function collectSongExportEvents() {
  const events = {
    notes: { chord: [], bass: [], string: [] },
    drums: [],
    lfoSteps: [],
    totalBeats: 0,
  };
  const sequence = getSongSectionSequence();
  let songBeatCursor = 0;

  sequence.forEach(sequencePoint => {
    const section = song.sections[sequencePoint.sectionIndex];
    if (!section) return;
    const sectionStartBeat = songBeatCursor;
    const sectionBeats = getSectionBeatLength(section);
    if (section.crashOnStart) {
      events.drums.push({
        beat: sectionStartBeat,
        laneKey: 'crash',
        durationBeats: secondsToBeats(0.8),
      });
    }
    let chordBeatOffset = 0;
    section.chords.forEach(chord => {
      const chordBeats = clampInt(chord.beats, 4, 1, 64);
      const chordStartBeat = getChordPlaybackStartBeat(chord, chordBeats);
      const chordNoteCount = clampInt(chord.noteCount, chordTypeObj(chord.type).intervals.length, 1, 16);
      const absoluteChordBeat = sectionStartBeat + chordBeatOffset;
      const lfoPatternIds = {
        chord: getChordPartLfoPatternId(chord, 'chord', getDefaultLfoPatternId()),
        bass: getChordPartLfoPatternId(chord, 'bass', getDefaultLfoPatternId()),
        string: getChordPartLfoPatternId(chord, 'string', getDefaultLfoPatternId()),
      };
      if (chord.chordsIn !== false) addHarmonicNoteEvents(events.notes.chord, {
        baseBeat: absoluteChordBeat,
        rootMidi: 60 + chord.root + getSynthTranspose(song.chordSynth),
        intervals: buildChordIntervals(chord.type, chordNoteCount),
        totalBeats: chordBeats,
        repeats: chord.chordRepeat || 1,
        startBeat: chordStartBeat,
        arpMode: chord.arpMode || 'off',
        durationScale: 0.92,
        minDurationSeconds: 0.1,
      });
      if (song.bassEnabled && chord.bassIn !== false) {
        addHarmonicNoteEvents(events.notes.bass, {
          baseBeat: absoluteChordBeat,
          rootMidi: 36 + getChordBassRoot(chord) + getSynthTranspose(song.bassSynth),
          intervals: [0],
          totalBeats: chordBeats,
          repeats: chord.bassRepeat || 1,
          startBeat: chordStartBeat,
          durationScale: 0.9,
          minDurationSeconds: 0.09,
        });
      }
      if (song.stringEnabled && chord.stringsIn !== false) {
        addHarmonicNoteEvents(events.notes.string, {
          baseBeat: absoluteChordBeat,
          rootMidi: 48 + getChordStringRoot(chord) + getSynthTranspose(song.stringSynth),
          intervals: buildChordIntervals(chord.type, chordNoteCount),
          totalBeats: chordBeats,
          repeats: chord.stringRepeat || chord.chordRepeat || 1,
          startBeat: chordStartBeat,
          durationScale: 0.92,
          minDurationSeconds: 0.1,
        });
      }
      const pattern = getDrumPatternById(chord.drumPatternId);
      for (let beatInChord = 0; beatInChord < chordBeats; beatInChord++) {
        const beatInSection = chordBeatOffset + beatInChord;
        const stepBase = getSectionSixteenthOffset(beatInSection);
        const beatBase = absoluteChordBeat + beatInChord;
        for (let subdivision = 0; subdivision < 4; subdivision++) {
          const step = (stepBase + subdivision) % STEPS;
          const beat = beatBase + subdivision / 4;
          events.lfoSteps.push({
            beat,
            transportStep: Math.round(beat * 4),
            lfoPatternId: lfoPatternIds.chord,
            lfoPatternIds: { ...lfoPatternIds },
          });
          if (!pattern || chord.drumsIn === false) continue;
          DRUM_LANES.forEach(lane => {
            if (!pattern.grid[lane.key]?.[step]) return;
            events.drums.push({
              beat,
              laneKey: lane.key,
              laneSoundId: getDrumLaneSoundId(pattern, lane.key),
              durationBeats: 0.125,
            });
          });
        }
      }
      chordBeatOffset += chordBeats;
    });

    if (section.rollAtEnd && sectionBeats > 0) {
      const rollStartBeat = sectionStartBeat + sectionBeats - 1;
      for (let hit = 0; hit < 6; hit++) {
        events.drums.push({
          beat: rollStartBeat + secondsToBeats(hit * 0.06),
          laneKey: 'rollSnare',
          durationBeats: secondsToBeats(0.09),
        });
      }
    }
    songBeatCursor += sectionBeats;
  });

  events.totalBeats = songBeatCursor;
  return events;
}

function createImpulseResponseForContext(ctx, seconds = 1.8, decay = 2.2) {
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

function createOfflineImpulseResponse(ctx, seconds = 1.8, decay = 2.2) {
  return createImpulseResponseForContext(ctx, seconds, decay);
}

function createOfflineRouting(ctx) {
  const master = ctx.createGain();
  master.connect(ctx.destination);
  const makeInstrumentBus = () => {
    const input = ctx.createGain();
    const dry = ctx.createGain();
    const wet = ctx.createGain();
    const preDelay = ctx.createGain();
    const delayDry = ctx.createGain();
    const delayWet = ctx.createGain();
    const delayFeedback = ctx.createGain();
    const delay = ctx.createDelay(5);
    const delayFilter = ctx.createBiquadFilter();
    const output = ctx.createGain();
    const ampLfo = ctx.createGain();
    const convolver = ctx.createConvolver();
    convolver.buffer = createOfflineImpulseResponse(ctx);
    delayFilter.type = 'lowpass';
    input.connect(dry);
    input.connect(convolver);
    convolver.connect(wet);
    dry.connect(preDelay);
    wet.connect(preDelay);
    preDelay.connect(delayDry);
    preDelay.connect(delay);
    delay.connect(delayFilter);
    delayFilter.connect(delayWet);
    delayFilter.connect(delayFeedback);
    delayFeedback.connect(delay);
    delayDry.connect(output);
    delayWet.connect(output);
    output.connect(ampLfo);
    ampLfo.connect(master);
    return { input, dry, wet, preDelay, delayDry, delayWet, delayFeedback, delay, delayFilter, output, ampLfo, convolver };
  };
  const drumsGain = ctx.createGain();
  const drumsDistortionInput = ctx.createGain();
  const drumsDistortion = ctx.createWaveShaper();
  const drumsFilterInput = ctx.createGain();
  const drumsFilterBypass = ctx.createGain();
  const drumsFilterOutput = ctx.createGain();
  const drumsReverb = ctx.createConvolver();
  const drumsDry = ctx.createGain();
  const drumsWet = ctx.createGain();
  drumsGain.connect(drumsDistortionInput);
  drumsDistortionInput.connect(drumsDistortion);
  drumsDistortion.connect(drumsFilterInput);
  drumsFilterInput.connect(drumsFilterBypass);
  drumsFilterBypass.connect(drumsFilterOutput);
  drumsFilterOutput.connect(drumsDry);
  drumsFilterOutput.connect(drumsReverb);
  drumsReverb.connect(drumsWet);
  drumsDry.connect(master);
  drumsWet.connect(master);
  return {
    master,
    chord: makeInstrumentBus(),
    bass: makeInstrumentBus(),
    string: makeInstrumentBus(),
    drums: {
      input: drumsGain,
      distortionInput: drumsDistortionInput,
      distortion: drumsDistortion,
      filterInput: drumsFilterInput,
      filterBypass: drumsFilterBypass,
      filterOutput: drumsFilterOutput,
      filterStages: [],
      filterConfigKey: '',
      reverb: drumsReverb,
      dry: drumsDry,
      wet: drumsWet,
      output: drumsGain,
      reverbSpecKey: '',
    },
  };
}

function applyDrumFxSettingsToRouting(drumsRouting, ctx, smooth = true) {
  if (!drumsRouting) return;
  const mixer = song.mixer || {};
  const drumFx = song.drumFx || {};
  const distortionEnabled = drumFx.distortionEnabled === undefined ? false : Boolean(drumFx.distortionEnabled);
  const distortionDrive = clampNumber(drumFx.distortionDrive, 0, 0, 1);
  const effectiveDrive = distortionEnabled ? distortionDrive : 0;
  const filterEnabled = Boolean(drumFx.filterEnabled);
  const filterType = normalizeDrumFilterType(drumFx.filterType, 'lowpass');
  const filterSlope = normalizeDrumFilterSlope(drumFx.filterSlope, 12);
  const filterCutoff = getDrumFilterCutoffAtTransportStep(currentStep);
  const filterResonance = clampNumber(drumFx.filterResonance, 0.7, 0.2, 12);
  const reverbMix = clampNumber(drumFx.reverbMix, 0, 0, 1);
  const reverbSize = clampNumber(drumFx.reverbSize, 0.35, 0, 1);
  const reverbDecay = clampNumber(drumFx.reverbDecay, 0.45, 0, 1);
  const model = normalizeDrumDistortionModel(drumFx.distortionModel, 'softClip');
  const setParam = smooth
    ? (param, value) => setAudioParamSmooth(param, value, ctx)
    : (param, value) => { if (param) param.value = value; };

  if (drumsRouting.output?.gain) setParam(drumsRouting.output.gain, clampNumber(mixer.drumsVolume, 0.9, 0, 1));
  if (drumsRouting.distortionInput?.gain) setParam(drumsRouting.distortionInput.gain, 1 + effectiveDrive * 2.2);
  if (drumsRouting.filterBypass?.gain) setParam(drumsRouting.filterBypass.gain, filterEnabled ? 0 : 1);
  if (drumsRouting.dry?.gain) setParam(drumsRouting.dry.gain, Math.max(0, 1 - reverbMix));
  if (drumsRouting.wet?.gain) setParam(drumsRouting.wet.gain, reverbMix);

  rebuildDrumFilterChain(drumsRouting, ctx, filterEnabled, filterType, filterSlope);
  if (drumsRouting.filterStages?.length) {
    const lastFilterIndex = drumsRouting.filterStages.length - 1;
    drumsRouting.filterStages.forEach((stage, index) => {
      stage.type = filterType;
      const stageQ = index === lastFilterIndex ? filterResonance : Math.max(0.2, filterResonance * 0.5);
      setParam(stage.frequency, filterCutoff);
      setParam(stage.Q, stageQ);
    });
  }

  if (drumsRouting.distortion) {
    drumsRouting.distortion.curve = effectiveDrive > 0.001 ? getDrumDistortionCurve(model, effectiveDrive) : null;
    drumsRouting.distortion.oversample = '2x';
  }
  if (drumsRouting.reverb) {
    const seconds = getDrumReverbImpulseSeconds(reverbSize);
    const decay = getDrumReverbImpulseDecay(reverbDecay);
    const key = `${Math.round(seconds * 1000)}:${Math.round(decay * 1000)}`;
    if (drumsRouting.reverbSpecKey !== key) {
      drumsRouting.reverb.buffer = createImpulseResponseForContext(ctx, seconds, decay);
      drumsRouting.reverbSpecKey = key;
    }
  }
}

function applyOfflineMixSettings(routing) {
  const mixer = song.mixer || {};
  const reverb = song.reverb || {};
  routing.master.gain.value = clampNumber(mixer.masterVolume, 0.95, 0, 1);
  const setBus = (kind, volume, wet, synthSettings) => {
    const bus = routing[kind];
    if (!bus) return;
    const wetMix = clampNumber(wet, 0.2, 0, 1);
    const delayMix = clampNumber(synthSettings?.delayMix, 0, 0, 1);
    const delayFeedback = clampNumber(synthSettings?.delayFeedback, 0.25, 0, 0.88);
    const delayFilterCutoff = clampNumber(synthSettings?.delayFilterCutoff, 2800, 300, 8000);
    const delaySeconds = getDelayTimeSeconds(synthSettings);
    bus.output.gain.value = clampNumber(volume, 0.9, 0, 1);
    bus.wet.gain.value = wetMix;
    bus.dry.gain.value = 1 - wetMix;
    bus.delayDry.gain.value = 1 - delayMix;
    bus.delayWet.gain.value = delayMix;
    bus.delayFeedback.gain.value = delayFeedback;
    bus.delay.delayTime.value = delaySeconds;
    bus.delayFilter.frequency.value = delayFilterCutoff;
    bus.ampLfo.gain.value = 1;
  };
  setBus('chord', mixer.chordVolume, reverb.chordWet, song.chordSynth);
  setBus('bass', mixer.bassVolume, reverb.bassWet, song.bassSynth);
  setBus('string', mixer.stringVolume, reverb.stringWet, song.stringSynth);
  applyDrumFxSettingsToRouting(routing.drums, routing.master.context, false);
}

function createNoiseBufferForContext(ctx, cache, duration) {
  const cacheKey = `${Math.round(duration * 1000)}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);
  const length = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < length; index++) data[index] = Math.random() * 2 - 1;
  cache.set(cacheKey, buffer);
  return buffer;
}

function renderSynthVoiceOffline(ctx, routing, freq, time, duration, synthSettings, kind = 'chord') {
  const voiceGain = ctx.createGain();
  const filterChain = createMultiPoleFilterChain(ctx, time, synthSettings);
  const driveAmount = clampNumber(synthSettings.distortion, 0, 0, 1);
  let shaper = null;
  if (driveAmount > 0.001) {
    shaper = ctx.createWaveShaper();
    shaper.curve = getDistortionCurve(driveAmount);
    shaper.oversample = '2x';
    filterChain.output.connect(shaper);
    shaper.connect(voiceGain);
  } else {
    filterChain.output.connect(voiceGain);
  }
  voiceGain.connect(routing[kind]?.input || ctx.destination);

  const isStringVoice = kind === 'string';
  const oscConfigs = isStringVoice
    ? [
      { type: synthSettings.osc1Type, freqOffsetCents: 0, gain: Math.max(0.03, (1 - synthSettings.mix) * 0.5) },
      { type: synthSettings.osc2Type, freqOffsetCents: synthSettings.osc2Interval * 100 + synthSettings.detune, gain: Math.max(0.03, synthSettings.mix * 0.5) },
      { type: synthSettings.osc3Type || synthSettings.osc1Type, freqOffsetCents: 1200 + synthSettings.detune * 0.5, gain: Math.max(0.03, (1 - synthSettings.mix) * 0.42) },
      { type: synthSettings.osc4Type || synthSettings.osc2Type, freqOffsetCents: 1200 + synthSettings.osc2Interval * 100 - synthSettings.detune * 0.5, gain: Math.max(0.03, synthSettings.mix * 0.42) },
    ]
    : [
      { type: synthSettings.osc1Type, freqOffsetCents: 0, gain: Math.max(0.05, 1 - synthSettings.mix) },
      { type: synthSettings.osc2Type, freqOffsetCents: synthSettings.osc2Interval * 100 + synthSettings.detune, gain: Math.max(0.05, synthSettings.mix) },
    ];
  const oscillators = [];
  const oscillatorFreqs = [];
  oscConfigs.forEach(config => {
    const oscillator = ctx.createOscillator();
    const mixGain = ctx.createGain();
    const oscillatorFreq = freq * Math.pow(2, config.freqOffsetCents / 1200);
    oscillator.type = config.type;
    oscillator.frequency.setValueAtTime(oscillatorFreq, time);
    mixGain.gain.value = config.gain;
    oscillator.connect(mixGain);
    mixGain.connect(filterChain.input);
    oscillators.push(oscillator);
    oscillatorFreqs.push(oscillatorFreq);
  });

  const modRate = clampNumber(synthSettings.modRate, 0, 0, 12);
  const modDepth = clampNumber(synthSettings.modDepth, 0, 0, 80);
  let lfo = null;
  if (modRate > 0.01 && modDepth > 0.01) {
    lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(modRate, time);
    oscillators.forEach((oscillator, index) => {
      const lfoGain = ctx.createGain();
      const depthHz = oscillatorFreqs[index] * (Math.pow(2, modDepth / 1200) - 1);
      lfoGain.gain.setValueAtTime(depthHz, time);
      lfo.connect(lfoGain);
      lfoGain.connect(oscillator.frequency);
    });
    lfo.start(time);
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
  oscillators.forEach(oscillator => {
    oscillator.start(time);
    oscillator.stop(noteEnd + 0.02);
  });
  if (lfo) lfo.stop(noteEnd + 0.02);
}

function renderDrumLaneOffline(ctx, drumsInput, noiseCache, laneKey, time, soundId = null) {
  if (laneKey === 'rollSnare') laneKey = 'snare';
  const variant = resolveDrumSoundVariant(laneKey, soundId);
  switch (laneKey) {
    case 'kick': {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(drumsInput);
      osc.type = variant.oscType || 'sine';
      osc.frequency.setValueAtTime(clampNumber(variant.startFreq, 120, 40, 260), time);
      osc.frequency.exponentialRampToValueAtTime(clampNumber(variant.endFreq, 40, 20, 180), time + clampNumber(variant.pitchTime, 0.12, 0.02, 0.6));
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(clampNumber(variant.peak, 1.05, 0.05, 1.4), time + clampNumber(variant.attack, 0.004, 0.001, 0.02));
      gain.gain.exponentialRampToValueAtTime(0.0001, time + clampNumber(variant.decay, 0.35, 0.04, 1));
      osc.start(time);
      osc.stop(time + clampNumber(variant.stop, 0.35, 0.05, 1.1));
      break;
    }
    case 'snare': {
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBufferForContext(ctx, noiseCache, clampNumber(variant.noiseDuration, 0.16, 0.02, 0.7));
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.value = clampNumber(variant.noiseCutoff, 1600, 300, 14000);
      const noiseGain = ctx.createGain();
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(drumsInput);
      noiseGain.gain.setValueAtTime(0.0001, time);
      noiseGain.gain.linearRampToValueAtTime(clampNumber(variant.noisePeak, 0.65, 0.04, 0.95), time + clampNumber(variant.noiseAttack, 0.002, 0.001, 0.03));
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, time + clampNumber(variant.noiseDecay, 0.14, 0.02, 0.8));
      noise.start(time);
      noise.stop(time + clampNumber(variant.noiseDuration, 0.16, 0.02, 0.7));

      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = variant.toneType || 'triangle';
      osc.connect(oscGain);
      oscGain.connect(drumsInput);
      osc.frequency.setValueAtTime(clampNumber(variant.toneStartFreq, 220, 40, 900), time);
      osc.frequency.exponentialRampToValueAtTime(clampNumber(variant.toneEndFreq, 110, 30, 700), time + clampNumber(variant.tonePitchTime, 0.08, 0.02, 0.5));
      oscGain.gain.setValueAtTime(0.0001, time);
      oscGain.gain.linearRampToValueAtTime(clampNumber(variant.tonePeak, 0.36, 0.02, 0.8), time + clampNumber(variant.toneAttack, 0.002, 0.001, 0.03));
      oscGain.gain.exponentialRampToValueAtTime(0.0001, time + clampNumber(variant.toneDecay, 0.09, 0.02, 0.8));
      osc.start(time);
      osc.stop(time + clampNumber(variant.toneStop, variant.toneDecay, 0.02, 0.8));
      break;
    }
    case 'closedHat': {
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBufferForContext(ctx, noiseCache, clampNumber(variant.noiseDuration, 0.05, 0.01, 0.8));
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = clampNumber(variant.cutoff, 7000, 600, 18000);
      const gain = ctx.createGain();
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(drumsInput);
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(clampNumber(variant.peak, 0.2, 0.01, 0.8), time + clampNumber(variant.attack, 0.001, 0.001, 0.03));
      gain.gain.exponentialRampToValueAtTime(0.0001, time + clampNumber(variant.decay, 0.045, 0.01, 1));
      noise.start(time);
      noise.stop(time + clampNumber(variant.noiseDuration, 0.05, 0.01, 0.8));
      break;
    }
    case 'openHat': {
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBufferForContext(ctx, noiseCache, clampNumber(variant.noiseDuration, 0.45, 0.02, 0.8));
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = clampNumber(variant.cutoff, 5000, 600, 18000);
      const gain = ctx.createGain();
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(drumsInput);
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(clampNumber(variant.peak, 0.28, 0.02, 0.9), time + clampNumber(variant.attack, 0.002, 0.001, 0.03));
      gain.gain.exponentialRampToValueAtTime(0.0001, time + clampNumber(variant.decay, 0.4, 0.01, 1));
      noise.start(time);
      noise.stop(time + clampNumber(variant.noiseDuration, 0.45, 0.02, 0.8));
      break;
    }
    case 'hiTom':
    case 'midTom':
    case 'lowTom': {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(drumsInput);
      osc.type = variant.oscType || 'sine';
      osc.frequency.setValueAtTime(clampNumber(variant.startFreq, 200, 50, 1200), time);
      osc.frequency.exponentialRampToValueAtTime(clampNumber(variant.endFreq, 100, 40, 800), time + clampNumber(variant.pitchTime, 0.2, 0.01, 0.8));
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(clampNumber(variant.peak, 0.75, 0.02, 1.2), time + clampNumber(variant.attack, 0.003, 0.001, 0.03));
      gain.gain.exponentialRampToValueAtTime(0.0001, time + clampNumber(variant.decay, 0.28, 0.02, 1));
      osc.start(time);
      osc.stop(time + clampNumber(variant.stop, 0.32, 0.02, 1.1));
      break;
    }
    case 'ride': {
      const masterGain = ctx.createGain();
      masterGain.connect(drumsInput);
      masterGain.gain.setValueAtTime(0.0001, time);
      masterGain.gain.linearRampToValueAtTime(clampNumber(variant.peak, 0.18, 0.01, 0.9), time + clampNumber(variant.attack, 0.002, 0.001, 0.03));
      masterGain.gain.exponentialRampToValueAtTime(0.0001, time + clampNumber(variant.decay, 0.28, 0.02, 1));
      const frequencies = Array.isArray(variant.partialFrequencies) && variant.partialFrequencies.length
        ? variant.partialFrequencies
        : [560, 845, 1174, 1523, 1780];
      frequencies.forEach(freq => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.value = clampNumber(variant.partialGain, 0.04, 0.005, 0.2);
        osc.type = variant.oscType || 'square';
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(time);
        osc.stop(time + clampNumber(variant.partialDuration, 0.3, 0.02, 1.2));
      });
      break;
    }
    case 'crash': {
      const source = ctx.createBufferSource();
      source.buffer = createNoiseBufferForContext(ctx, noiseCache, 0.8);
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
      gain.connect(drumsInput);
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(0.45, time + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.8);
      source.start(time);
      source.stop(time + 0.8);
      break;
    }
  }
}

function audioBufferToWavBlob(audioBuffer) {
  const channelCount = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const frameCount = audioBuffer.length;
  const bytesPerSample = 2;
  const blockAlign = channelCount * bytesPerSample;
  const dataSize = frameCount * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channelCount, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);
  const channelData = [];
  for (let channel = 0; channel < channelCount; channel++) channelData.push(audioBuffer.getChannelData(channel));
  let offset = 44;
  for (let frame = 0; frame < frameCount; frame++) {
    for (let channel = 0; channel < channelCount; channel++) {
      const sample = Math.max(-1, Math.min(1, channelData[channel][frame]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, Math.round(intSample), true);
      offset += 2;
    }
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

async function exportWAV() {
  const OfflineAudioCtor = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!OfflineAudioCtor) {
    alert('WAV export is not supported in this browser.');
    return;
  }
  saveSong();
  const exportEvents = collectSongExportEvents();
  if (exportEvents.totalBeats <= 0) {
    alert('Nothing to export. Add at least one chord beat to your song.');
    return;
  }
  const button = document.getElementById('export-wav-btn');
  const originalLabel = button?.textContent;
  if (button) {
    button.disabled = true;
    button.textContent = 'Rendering WAV…';
  }
  try {
    const tailSeconds = 4;
    const renderSeconds = Math.max(1, beatsToSeconds(exportEvents.totalBeats) + tailSeconds);
    const sampleRate = 44100;
    const frameCount = Math.ceil(renderSeconds * sampleRate);
    const ctx = new OfflineAudioCtor(2, frameCount, sampleRate);
    const routing = createOfflineRouting(ctx);
    const noiseCache = new Map();
    applyOfflineMixSettings(routing);

    const startTime = 0.05;
    const schedulePart = (entries, synthSettings, kind) => {
      const filterLfoEnabled = Boolean(synthSettings.filterLfoEnabled);
      const filterLfoDepth = clampNumber(synthSettings.filterLfoDepth, 0, 0, 1);
      const baseCutoff = clampNumber(synthSettings.cutoff, 1200, 120, 6000);
      entries.forEach(event => {
        let effectiveSynthSettings = synthSettings;
        if (filterLfoEnabled && filterLfoDepth > 0.0001 && exportEvents.lfoSteps.length) {
          // Find the LFO step at or just before this note's beat
          const noteBeat = event.beat;
          let bestStep = exportEvents.lfoSteps[0];
          for (const step of exportEvents.lfoSteps) {
            if (step.beat <= noteBeat) bestStep = step;
            else break;
          }
          if (bestStep) {
            const patternId = bestStep.lfoPatternIds?.[kind] || bestStep.lfoPatternId || getDefaultLfoPatternId();
            const pattern = getLfoPatternById(patternId);
            const lfoGain = getLfoGainAtTransportStep(pattern, bestStep.transportStep);
            const modCutoff = clampNumber(baseCutoff * (1 - filterLfoDepth + filterLfoDepth * lfoGain), baseCutoff, 120, 6000);
            effectiveSynthSettings = Object.assign({}, synthSettings, { cutoff: modCutoff });
          }
        }
        renderSynthVoiceOffline(
          ctx,
          routing,
          frequencyFromMidi(event.midi),
          startTime + beatOffsetToSeconds(event.beat),
          Math.max(0.03, beatOffsetToSeconds(event.durationBeats)),
          effectiveSynthSettings,
          kind,
        );
      });
    };
    const scheduleLfo = (steps) => {
      if (!Array.isArray(steps) || !steps.length) return;
      const bpm = clampInt(song?.bpm, 100, 40, 300);
      const stepSeconds = (60 / bpm) / 4;
      ['chord', 'bass', 'string'].forEach(kind => {
        const bus = routing[kind];
        if (!bus?.ampLfo?.gain) return;
        bus.ampLfo.gain.setValueAtTime(1, 0);
        steps.forEach(step => {
          const time = startTime + beatOffsetToSeconds(step.beat);
          const patternId = step.lfoPatternIds?.[kind] || step.lfoPatternId || getDefaultLfoPatternId();
          const pattern = getLfoPatternById(patternId);
          const smoothing = clampNumber(pattern?.smoothing, 0.08, 0, 1);
          const rampSeconds = Math.max(0.002, Math.min(stepSeconds * 0.95, 0.004 + smoothing * stepSeconds));
          const gain = getLfoGainAtTransportStep(pattern, step.transportStep);
          bus.ampLfo.gain.setValueAtTime(bus.ampLfo.gain.value, time);
          bus.ampLfo.gain.linearRampToValueAtTime(gain, time + rampSeconds);
        });
      });
    };
    const scheduleDrumFilterLfo = (steps) => {
      if (!Array.isArray(steps) || !steps.length) return;
      if (!routing.drums?.filterStages?.length) return;
      const drumFx = song.drumFx || {};
      if (!Boolean(drumFx.filterEnabled) || !Boolean(drumFx.filterLfoEnabled)) return;
      const depth = clampNumber(drumFx.filterLfoDepth, 0, 0, 1);
      if (depth <= 0.0001) return;
      const bpm = clampInt(song?.bpm, 100, 40, 300);
      const stepSeconds = (60 / bpm) / 4;
      const pattern = getDrumFilterLfoPattern();
      const smoothing = clampNumber(pattern?.smoothing, 0.08, 0, 1);
      const rampSeconds = Math.max(0.002, Math.min(stepSeconds * 0.95, 0.004 + smoothing * stepSeconds));
      steps.forEach(step => {
        const time = startTime + beatOffsetToSeconds(step.beat);
        const cutoff = getDrumFilterCutoffAtTransportStep(step.transportStep);
        routing.drums.filterStages.forEach(stage => {
          stage.frequency.setValueAtTime(stage.frequency.value, time);
          stage.frequency.linearRampToValueAtTime(cutoff, time + rampSeconds);
        });
      });
    };
    scheduleLfo(exportEvents.lfoSteps);
    scheduleDrumFilterLfo(exportEvents.lfoSteps);
    schedulePart(exportEvents.notes.chord, song.chordSynth, 'chord');
    schedulePart(exportEvents.notes.bass, song.bassSynth, 'bass');
    schedulePart(exportEvents.notes.string, song.stringSynth, 'string');
    exportEvents.drums.forEach(event => {
      renderDrumLaneOffline(
        ctx,
        routing.drums.input,
        noiseCache,
        event.laneKey,
        startTime + beatOffsetToSeconds(event.beat),
        event.laneSoundId,
      );
    });

    const renderedBuffer = await ctx.startRendering();
    const filenameBase = sanitizeFilename(song.title || 'chordz-song');
    downloadBlob(audioBufferToWavBlob(renderedBuffer), `${filenameBase}.wav`);
    debugLog(`WAV export complete (${renderSeconds.toFixed(2)}s render)`);
  } catch (error) {
    debugLog(`WAV export failed: ${error?.message || error}`, 'error');
    alert('WAV export failed: ' + (error?.message || 'Unknown error'));
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = originalLabel || '🎧 Export WAV';
    }
  }
}

const MIDI_TICKS_PER_QUARTER = 480;
const MIDI_DRUM_NOTE_MAP = {
  kick: 36,
  snare: 38,
  closedHat: 42,
  openHat: 46,
  hiTom: 50,
  midTom: 47,
  lowTom: 45,
  ride: 51,
  crash: 49,
  rollSnare: 38,
};

function encodeVarLen(value) {
  let buffer = value & 0x7f;
  const result = [];
  while ((value >>= 7)) {
    buffer <<= 8;
    buffer |= ((value & 0x7f) | 0x80);
  }
  while (true) {
    result.push(buffer & 0xff);
    if (buffer & 0x80) buffer >>= 8;
    else break;
  }
  return result;
}

function utf8Bytes(text) {
  if (window.TextEncoder) return Array.from(new TextEncoder().encode(text));
  return Array.from(unescape(encodeURIComponent(text))).map(char => char.charCodeAt(0));
}

function makeMidiTrackChunk(trackBytes) {
  const chunk = new Uint8Array(8 + trackBytes.length);
  chunk.set([0x4d, 0x54, 0x72, 0x6b], 0);
  const view = new DataView(chunk.buffer);
  view.setUint32(4, trackBytes.length, false);
  chunk.set(trackBytes, 8);
  return chunk;
}

function makeMidiHeaderChunk(trackCount) {
  const chunk = new Uint8Array(14);
  chunk.set([0x4d, 0x54, 0x68, 0x64], 0);
  const view = new DataView(chunk.buffer);
  view.setUint32(4, 6, false);
  view.setUint16(8, 1, false);
  view.setUint16(10, trackCount, false);
  view.setUint16(12, MIDI_TICKS_PER_QUARTER, false);
  return chunk;
}

function buildMidiTrackBytes(trackName, channel, noteEvents) {
  const bytes = [];
  const nameBytes = utf8Bytes(trackName);
  bytes.push(...encodeVarLen(0), 0xff, 0x03, ...encodeVarLen(nameBytes.length), ...nameBytes);
  const midiEvents = [];
  noteEvents.forEach(event => {
    const startTick = Math.max(0, Math.round(event.beat * MIDI_TICKS_PER_QUARTER));
    const durationTicks = Math.max(1, Math.round(event.durationBeats * MIDI_TICKS_PER_QUARTER));
    const endTick = startTick + durationTicks;
    midiEvents.push({ tick: startTick, type: 'on', note: event.midi, velocity: event.velocity || 96 });
    midiEvents.push({ tick: endTick, type: 'off', note: event.midi, velocity: 0 });
  });
  midiEvents.sort((a, b) => {
    if (a.tick !== b.tick) return a.tick - b.tick;
    if (a.type === b.type) return a.note - b.note;
    return a.type === 'off' ? -1 : 1;
  });
  let lastTick = 0;
  midiEvents.forEach(event => {
    const delta = event.tick - lastTick;
    bytes.push(...encodeVarLen(delta));
    const status = (event.type === 'on' ? 0x90 : 0x80) | (channel & 0x0f);
    bytes.push(status, event.note & 0x7f, event.velocity & 0x7f);
    lastTick = event.tick;
  });
  bytes.push(...encodeVarLen(0), 0xff, 0x2f, 0x00);
  return new Uint8Array(bytes);
}

function buildTempoTrackBytes() {
  const bytes = [];
  const bpm = clampInt(song.bpm, 100, 40, 300);
  const microsPerQuarter = Math.round(60000000 / bpm);
  bytes.push(
    ...encodeVarLen(0),
    0xff, 0x51, 0x03,
    (microsPerQuarter >> 16) & 0xff,
    (microsPerQuarter >> 8) & 0xff,
    microsPerQuarter & 0xff,
  );
  bytes.push(...encodeVarLen(0), 0xff, 0x2f, 0x00);
  return new Uint8Array(bytes);
}

function exportMIDI() {
  saveSong();
  const exportEvents = collectSongExportEvents();
  if (exportEvents.totalBeats <= 0) {
    alert('Nothing to export. Add at least one chord beat to your song.');
    return;
  }
  const chordTrack = exportEvents.notes.chord.map(event => ({ ...event, velocity: 92 }));
  const bassTrack = exportEvents.notes.bass.map(event => ({ ...event, velocity: 102 }));
  const stringTrack = exportEvents.notes.string.map(event => ({ ...event, velocity: 78 }));
  const drumTrack = exportEvents.drums
    .map(event => {
      const midi = MIDI_DRUM_NOTE_MAP[event.laneKey];
      if (!Number.isFinite(midi)) return null;
      return {
        beat: event.beat,
        durationBeats: Math.max(event.durationBeats || 0.1, secondsToBeats(0.03)),
        midi,
        velocity: event.laneKey === 'kick' ? 120 : event.laneKey === 'snare' || event.laneKey === 'rollSnare' ? 108 : 96,
      };
    })
    .filter(Boolean);

  const chunks = [
    makeMidiHeaderChunk(5),
    makeMidiTrackChunk(buildTempoTrackBytes()),
    makeMidiTrackChunk(buildMidiTrackBytes('Chords', 0, chordTrack)),
    makeMidiTrackChunk(buildMidiTrackBytes('Bass', 1, bassTrack)),
    makeMidiTrackChunk(buildMidiTrackBytes('Strings', 2, stringTrack)),
    makeMidiTrackChunk(buildMidiTrackBytes('Drums', 9, drumTrack)),
  ];
  const filenameBase = sanitizeFilename(song.title || 'chordz-song');
  downloadBlob(new Blob(chunks, { type: 'audio/midi' }), `${filenameBase}.mid`);
  debugLog('MIDI export complete');
}

// =====================================================================
// AUDIO – Web Audio API beat scheduler + synth engine
// =====================================================================

let audioCtx = null;
let audioRouting = null;
let schedulerTimer = null;
let schedulerGeneration = 0;
let nextNoteTime = 0;
let currentStep = 0;
let currentBeatStepBase = 0;
let currentDrumPatternId = null;
let currentChordDrumsIn = true;
let currentLfoPatternIds = { chord: null, bass: null, string: null };
let isBeating = false;
let transportState = 'stopped';
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

function getSectionSixteenthOffset(beatInSection) {
  const beat = clampInt(beatInSection, 0, 0, 1000000);
  return (beat * 4) % STEPS;
}

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
  return createImpulseResponseForContext(ctx, seconds, decay);
}

function getDelayFeelMultiplier(feel) {
  if (feel === 'dotted') return 1.5;
  if (feel === 'triplet') return 2 / 3;
  return 1;
}

function getDelayTimeSeconds(synthSettings) {
  const bpm = clampInt(song?.bpm, 100, 40, 300);
  const subdivision = normalizeDelaySubdivision(synthSettings?.delaySubdivisionBeats, 0.5);
  const feel = normalizeDelayFeel(synthSettings?.delayFeel, 'straight');
  return (60 / bpm) * subdivision * getDelayFeelMultiplier(feel);
}

function getDrumReverbImpulseSeconds(size) {
  const normalized = clampNumber(size, 0.35, 0, 1);
  return 0.25 + normalized * 2.75;
}

function getDrumReverbImpulseDecay(decay) {
  const normalized = clampNumber(decay, 0.45, 0, 1);
  return 0.8 + normalized * 4.2;
}

function getDrumFilterStageCount(slope) {
  const normalizedSlope = normalizeDrumFilterSlope(slope, 12);
  if (normalizedSlope >= 96) return 8;
  if (normalizedSlope >= 48) return 4;
  if (normalizedSlope >= 24) return 2;
  return 1;
}

function rebuildDrumFilterChain(drumsRouting, ctx, enabled, type, slope) {
  if (!drumsRouting?.filterInput || !drumsRouting?.filterOutput || !drumsRouting?.filterBypass) return;
  const configKey = `${enabled ? 1 : 0}:${type}:${slope}`;
  if (drumsRouting.filterConfigKey === configKey) return;

  disconnectNode(drumsRouting.filterInput);
  drumsRouting.filterStages?.forEach(stage => disconnectNode(stage));
  drumsRouting.filterStages = [];

  drumsRouting.filterInput.connect(drumsRouting.filterBypass);
  if (enabled) {
    const stageCount = getDrumFilterStageCount(slope);
    const stages = Array.from({ length: stageCount }, () => ctx.createBiquadFilter());
    stages.forEach((stage, index) => {
      stage.type = type;
      if (index > 0) stages[index - 1].connect(stage);
    });
    drumsRouting.filterInput.connect(stages[0]);
    stages[stages.length - 1].connect(drumsRouting.filterOutput);
    drumsRouting.filterStages = stages;
  }

  drumsRouting.filterConfigKey = configKey;
}

function applyDrumFilterCutoffToRouting(drumsRouting, cutoff, ctx, smoothing = 0.02) {
  if (!drumsRouting?.filterStages?.length) return;
  drumsRouting.filterStages.forEach(stage => {
    setAudioParamSmooth(stage.frequency, cutoff, ctx, smoothing);
  });
}

function getDrumFilterCutoffAtTransportStep(transportStep) {
  const drumFx = song.drumFx || {};
  const baseCutoff = clampNumber(drumFx.filterCutoff, 20000, 20, 20000);
  if (!Boolean(drumFx.filterEnabled)) return baseCutoff;
  if (!Boolean(drumFx.filterLfoEnabled)) return baseCutoff;
  const depth = clampNumber(drumFx.filterLfoDepth, 0, 0, 1);
  if (depth <= 0.0001) return baseCutoff;
  const pattern = getDrumFilterLfoPattern();
  const lfoGain = getLfoGainAtTransportStep(pattern, transportStep);
  return clampNumber(baseCutoff * (1 - depth + depth * lfoGain), baseCutoff, 20, 20000);
}

function applyDrumFilterLfoAtStep(time, transportStep) {
  if (!audioRouting?.drums || !audioCtx) return;
  const drumFx = song.drumFx || {};
  if (!Boolean(drumFx.filterEnabled) || !Boolean(drumFx.filterLfoEnabled)) return;
  if (!audioRouting.drums.filterStages?.length) return;
  const depth = clampNumber(drumFx.filterLfoDepth, 0, 0, 1);
  if (depth <= 0.0001) return;
  const pattern = getDrumFilterLfoPattern();
  const bpm = clampInt(song?.bpm, 100, 40, 300);
  const stepSeconds = (60 / bpm) / 4;
  const smoothing = clampNumber(pattern?.smoothing, 0.08, 0, 1);
  const rampSeconds = Math.max(0.002, Math.min(stepSeconds * 0.95, 0.004 + smoothing * stepSeconds));
  applyDrumFilterCutoffToRouting(audioRouting.drums, getDrumFilterCutoffAtTransportStep(transportStep), audioCtx, rampSeconds);
}

function getLfoShapeAmount(shape, phase) {
  const normalized = Math.max(0, Math.min(0.9999, Number(phase) || 0));
  if (shape === 'triangle') return normalized < 0.5 ? normalized * 2 : (1 - normalized) * 2;
  if (shape === 'down') return 1 - normalized;
  if (shape === 'up') return normalized;
  if (shape === 'square') return normalized < 0.5 ? 1 : 0;
  if (shape === 'pump') return Math.pow(normalized, 0.45);
  return 0.5 - 0.5 * Math.cos(normalized * Math.PI * 2);
}

function getCustomLfoShapeAmount(points, phase) {
  return clampNumber(sampleLfoPointY(points, phase), 1, 0, 1);
}

function getLfoGainAtTransportStep(pattern, transportStep) {
  const resolved = pattern || getLfoPatternById(getDefaultLfoPatternId());
  if (!resolved || !resolved.enabled) return 1;
  const depth = clampNumber(resolved.depth, 0, 0, 1);
  if (depth <= 0.0001) return 1;
  const feelMultiplier = getDelayFeelMultiplier(normalizeLfoTimingFeel(resolved.timingFeel, 'straight'));
  const cycleBeats = normalizeLfoRate(resolved.rateBeats, 1) * feelMultiplier;
  const cycleSteps = Math.max(0.25, cycleBeats * 4);
  const wrappedStep = ((Number(transportStep) || 0) % cycleSteps + cycleSteps) % cycleSteps;
  const phaseOffsetSteps = clampNumber(resolved.phase, 0, 0, 0.999) * cycleSteps;
  const phase = ((wrappedStep + phaseOffsetSteps) % cycleSteps) / cycleSteps;
  const shape = normalizeLfoShape(resolved.shape, 'sine');
  const amount = shape === 'custom'
    ? getCustomLfoShapeAmount(
      Array.isArray(resolved.customPoints) && resolved.customPoints.length
        ? resolved.customPoints
        : createDefaultLfoCustomPoints(),
      phase,
    )
    : getLfoShapeAmount(shape, phase);
  return Math.max(0.0001, (1 - depth) + depth * amount);
}

function applyAmpLfoAtStep(time, transportStep, patternIds = currentLfoPatternIds) {
  if (!audioRouting) return;
  const bpm = clampInt(song?.bpm, 100, 40, 300);
  const stepSeconds = (60 / bpm) / 4;
  const gainTargetByKind = {};
  ['chord', 'bass', 'string'].forEach(kind => {
    const patternId = typeof patternIds === 'string'
      ? patternIds
      : patternIds?.[kind] || getDefaultLfoPatternId();
    const pattern = getLfoPatternById(patternId || getDefaultLfoPatternId());
    const gainTarget = getLfoGainAtTransportStep(pattern, transportStep);
    gainTargetByKind[kind] = gainTarget;
    const smoothing = clampNumber(pattern?.smoothing, 0.08, 0, 1);
    const rampSeconds = Math.max(0.002, Math.min(stepSeconds * 0.95, 0.004 + smoothing * stepSeconds));
    const gainParam = audioRouting?.[kind]?.ampLfo?.gain;
    if (!gainParam) return;
    gainParam.cancelScheduledValues(time);
    gainParam.setValueAtTime(gainParam.value, time);
    gainParam.linearRampToValueAtTime(gainTarget, time + rampSeconds);
  }); 
  // Apply filter LFO modulation to active voices
  if (audioCtx && activeAudioNodes?.size) {
    ['chord', 'bass', 'string'].forEach(kind => {
      const synth = getSynthByKind(kind);
      if (!synth?.filterLfoEnabled) return;
      const depth = clampNumber(synth.filterLfoDepth, 0, 0, 1);
      if (depth <= 0.0001) return;
      const gainTarget = gainTargetByKind[kind] ?? 1;
      const patternId = typeof patternIds === 'string'
        ? patternIds
        : patternIds?.[kind] || getDefaultLfoPatternId();
      const pattern = getLfoPatternById(patternId || getDefaultLfoPatternId());
      const smoothing = clampNumber(pattern?.smoothing, 0.08, 0, 1);
      const rampSeconds = Math.max(0.002, Math.min(stepSeconds * 0.95, 0.004 + smoothing * stepSeconds));
      const baseCutoff = clampNumber(synth.cutoff, 1200, 120, 6000);
      const modCutoff = clampNumber(baseCutoff * (1 - depth + depth * gainTarget), baseCutoff, 120, 6000);
      activeAudioNodes.forEach(entry => {
        if (entry.kind !== 'voice' || entry.voiceKind !== kind || !entry.filterNodes?.length) return;
        entry.filterNodes.forEach(filter => {
          filter.frequency.cancelScheduledValues(time);
          filter.frequency.setValueAtTime(filter.frequency.value, time);
          filter.frequency.linearRampToValueAtTime(modCutoff, time + rampSeconds);
        });
      });
    });
  }
  applyDrumFilterLfoAtStep(time, transportStep);
}

function setAudioParamSmooth(param, value, ctx = audioCtx, ramp = 0.015) {
  if (!param) return;
  const target = Number(value);
  if (!Number.isFinite(target)) return;
  if (!ctx || !Number.isFinite(ctx.currentTime)) {
    param.value = target;
    return;
  }
  const now = ctx.currentTime;
  const next = now + Math.max(0.001, ramp);
  param.cancelScheduledValues(now);
  param.setValueAtTime(param.value, now);
  param.linearRampToValueAtTime(target, next);
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
    const preDelay = ctx.createGain();
    const delayDry = ctx.createGain();
    const delayWet = ctx.createGain();
    const delayFeedback = ctx.createGain();
    const delay = ctx.createDelay(5);
    const delayFilter = ctx.createBiquadFilter();
    const output = ctx.createGain();
    const ampLfo = ctx.createGain();
    const convolver = ctx.createConvolver();
    convolver.buffer = createImpulseResponse();
    delayFilter.type = 'lowpass';
    input.connect(dry);
    input.connect(convolver);
    convolver.connect(wet);
    dry.connect(preDelay);
    wet.connect(preDelay);
    preDelay.connect(delayDry);
    preDelay.connect(delay);
    delay.connect(delayFilter);
    delayFilter.connect(delayWet);
    delayFilter.connect(delayFeedback);
    delayFeedback.connect(delay);
    delayDry.connect(output);
    delayWet.connect(output);
    output.connect(ampLfo);
    ampLfo.connect(master);
    return { input, dry, wet, preDelay, delayDry, delayWet, delayFeedback, delay, delayFilter, output, ampLfo, convolver };
  };

  const drumsGain = ctx.createGain();
  const drumsDistortionInput = ctx.createGain();
  const drumsDistortion = ctx.createWaveShaper();
  const drumsFilterInput = ctx.createGain();
  const drumsFilterBypass = ctx.createGain();
  const drumsFilterOutput = ctx.createGain();
  const drumsReverb = ctx.createConvolver();
  const drumsDry = ctx.createGain();
  const drumsWet = ctx.createGain();
  drumsGain.connect(drumsDistortionInput);
  drumsDistortionInput.connect(drumsDistortion);
  drumsDistortion.connect(drumsFilterInput);
  drumsFilterInput.connect(drumsFilterBypass);
  drumsFilterBypass.connect(drumsFilterOutput);
  drumsFilterOutput.connect(drumsDry);
  drumsFilterOutput.connect(drumsReverb);
  drumsReverb.connect(drumsWet);
  drumsDry.connect(master);
  drumsWet.connect(master);

  audioRouting = {
    master,
    chord: makeInstrumentBus(),
    bass: makeInstrumentBus(),
    string: makeInstrumentBus(),
    drums: {
      input: drumsGain,
      distortionInput: drumsDistortionInput,
      distortion: drumsDistortion,
      filterInput: drumsFilterInput,
      filterBypass: drumsFilterBypass,
      filterOutput: drumsFilterOutput,
      filterStages: [],
      filterConfigKey: '',
      reverb: drumsReverb,
      dry: drumsDry,
      wet: drumsWet,
      output: drumsGain,
      reverbSpecKey: '',
    },
  };
  applyAudioMixSettings();
}

function applyAudioMixSettings() {
  if (!audioRouting) return;
  const mixer = song.mixer || {};
  const reverb = song.reverb || {};
  const masterVolume = clampNumber(mixer.masterVolume, 0.95, 0, 1);

  setAudioParamSmooth(audioRouting.master.gain, masterVolume);
  const setBus = (kind, volume, wet, synthSettings) => {
    const bus = audioRouting[kind];
    if (!bus) return;
    const wetMix = clampNumber(wet, 0.2, 0, 1);
    const delayMix = clampNumber(synthSettings?.delayMix, 0, 0, 1);
    const delayFeedback = clampNumber(synthSettings?.delayFeedback, 0.25, 0, 0.88);
    const delayFilterCutoff = clampNumber(synthSettings?.delayFilterCutoff, 2800, 300, 8000);
    const delaySeconds = getDelayTimeSeconds(synthSettings);
    setAudioParamSmooth(bus.output.gain, clampNumber(volume, 0.9, 0, 1));
    setAudioParamSmooth(bus.wet.gain, wetMix);
    setAudioParamSmooth(bus.dry.gain, 1 - wetMix);
    setAudioParamSmooth(bus.delayDry.gain, 1 - delayMix);
    setAudioParamSmooth(bus.delayWet.gain, delayMix);
    setAudioParamSmooth(bus.delayFeedback.gain, delayFeedback);
    setAudioParamSmooth(bus.delay.delayTime, delaySeconds);
    setAudioParamSmooth(bus.delayFilter.frequency, delayFilterCutoff);
    setAudioParamSmooth(bus.ampLfo.gain, 1);
  };

  setBus('chord', mixer.chordVolume, reverb.chordWet, song.chordSynth);
  setBus('bass', mixer.bassVolume, reverb.bassWet, song.bassSynth);
  setBus('string', mixer.stringVolume, reverb.stringWet, song.stringSynth);
  applyDrumFxSettingsToRouting(audioRouting.drums, audioCtx, true);
}

function debugLog(message, level = 'info') {
  const time = new Date().toISOString().slice(11, 19);
  debugState.logs.push(`[${time}] [${level}] ${message}`);
  if (debugState.logs.length > debugState.maxLogs) debugState.logs.splice(0, debugState.logs.length - debugState.maxLogs);
  if (debugPanelOpen) updateDebugPanelOutput();
}

function disconnectNode(node) {
  if (!node || typeof node.disconnect !== 'function') return;
  try {
    node.disconnect();
  } catch (_) {
    // no-op
  }
}

function cleanupAudioNodeEntry(entry, voiceEnded = false) {
  if (!entry || entry.cleaned) return;
  entry.cleaned = true;
  entry.nodes.forEach(disconnectNode);
  debugState.counters.nodeCleanups += entry.nodes.length;
  if (entry.kind === 'voice') {
    activeVoiceCount = Math.max(0, activeVoiceCount - 1);
    if (voiceEnded) debugState.counters.voicesEnded += 1;
  }
  activeAudioNodes.delete(entry);
}

function registerAudioNodeEntry(sources, nodes, kind = 'generic', voiceKind = null, filterNodes = null) {
  const validSources = (Array.isArray(sources) ? sources : []).filter(Boolean);
  const validNodes = (Array.isArray(nodes) ? nodes : []).filter(Boolean);
  const entry = {
    sources: validSources,
    nodes: validNodes,
    kind,
    voiceKind: kind === 'voice' ? (voiceKind || 'chord') : null,
    filterNodes: kind === 'voice' ? (Array.isArray(filterNodes) ? filterNodes.filter(Boolean) : null) : null,
    cleaned: false,
  };
  if (kind === 'voice') {
    activeVoiceCount += 1;
    debugState.counters.voicesCreated += 1;
  }
  const onEnded = () => cleanupAudioNodeEntry(entry, true);
  validSources.forEach(source => source.addEventListener('ended', onEnded, { once: true }));
  activeAudioNodes.add(entry);
  return entry;
}

function stopAndClearActiveAudioNodes({ clearVoices = true, clearDrums = true } = {}) {
  activeAudioNodes.forEach(entry => {
    if (entry.kind === 'voice' && !clearVoices) return;
    if (entry.kind === 'drum' && !clearDrums) return;
    entry.sources.forEach(source => {
      if (!source || typeof source.stop !== 'function') return;
      try {
        source.stop();
      } catch (_) {
        // already stopped
      }
    });
    cleanupAudioNodeEntry(entry, false);
  });
}

function flushScheduledNotes({
  restartPlayback = false,
  snapToChordStart = false,
  preserveDrumPhase = false,
  clearDrumNodes = true,
} = {}) {
  schedulerGeneration += 1;
  if (schedulerTimer !== null) {
    clearTimeout(schedulerTimer);
    schedulerTimer = null;
  }
  if (songEndTimeout !== null) {
    clearTimeout(songEndTimeout);
    songEndTimeout = null;
  }
  songEndedPending = false;
  stopAndClearActiveAudioNodes({ clearVoices: true, clearDrums: clearDrumNodes });
  if (!(restartPlayback && isBeating)) return;
  if (!preserveDrumPhase && snapToChordStart) snapPlaybackCursorToChordStart();
  if (!preserveDrumPhase) {
    currentStep = 0;
    currentBeatStepBase = getSectionSixteenthOffset(playbackCursor.beatInSection);
    currentDrumPatternId = null;
    currentChordDrumsIn = true;
    currentLfoPatternIds = { chord: null, bass: null, string: null };
  }
  nextNoteTime = getAudioCtx().currentTime + 0.05;
  scheduler(schedulerGeneration);
}

function getSynthTranspose(synthSettings) {
  return clampInt(synthSettings?.transpose, 0, -24, 24);
}

function applySynthFilterSettingsToActiveVoices(kind) {
  if (!audioCtx || !activeAudioNodes.size) return;
  const synth = getSynthByKind(kind);
  if (!synth) return;
  const cutoff = clampNumber(synth.cutoff, 1200, 120, 6000);
  const resonance = clampNumber(synth.resonance, 1, 0.2, 12);
  activeAudioNodes.forEach(entry => {
    if (entry.kind !== 'voice' || entry.voiceKind !== kind || !entry.filterNodes?.length) return;
    const lastFilterIndex = entry.filterNodes.length - 1;
    entry.filterNodes.forEach((filter, index) => {
      const stageQ = index === lastFilterIndex ? resonance : Math.max(0.2, resonance * 0.5);
      setAudioParamSmooth(filter.frequency, cutoff, audioCtx, 0.02);
      setAudioParamSmooth(filter.Q, stageQ, audioCtx, 0.02);
    });
  });
}

function createNoiseBuffer(duration) {
  const ctx = getAudioCtx();
  const cacheKey = `${ctx.sampleRate}:${Math.round(duration * 1000)}`;
  if (noiseBufferCache.has(cacheKey)) return noiseBufferCache.get(cacheKey);
  const length = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < length; index++) data[index] = Math.random() * 2 - 1;
  noiseBufferCache.set(cacheKey, buffer);
  return buffer;
}

function playKick(time, soundId = null) {
  const ctx = getAudioCtx();
  const dest = audioRouting?.drums?.input || ctx.destination;
  const variant = resolveDrumSoundVariant('kick', soundId);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(dest);
  osc.type = variant.oscType || 'sine';
  osc.frequency.setValueAtTime(clampNumber(variant.startFreq, 120, 40, 260), time);
  osc.frequency.exponentialRampToValueAtTime(clampNumber(variant.endFreq, 40, 20, 180), time + clampNumber(variant.pitchTime, 0.12, 0.02, 0.6));
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(clampNumber(variant.peak, 1.05, 0.05, 1.4), time + clampNumber(variant.attack, 0.004, 0.001, 0.02));
  gain.gain.exponentialRampToValueAtTime(0.0001, time + clampNumber(variant.decay, 0.35, 0.04, 1));
  registerAudioNodeEntry([osc], [osc, gain], 'drum');
  osc.start(time);
  osc.stop(time + clampNumber(variant.stop, 0.35, 0.05, 1.1));
}

function playSnare(time, soundId = null) {
  const ctx = getAudioCtx();
  const dest = audioRouting?.drums?.input || ctx.destination;
  const variant = resolveDrumSoundVariant('snare', soundId);
  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(clampNumber(variant.noiseDuration, 0.16, 0.02, 0.7));
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'highpass';
  noiseFilter.frequency.value = clampNumber(variant.noiseCutoff, 1600, 300, 14000);
  const noiseGain = ctx.createGain();
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(dest);
  noiseGain.gain.setValueAtTime(0.0001, time);
  noiseGain.gain.linearRampToValueAtTime(clampNumber(variant.noisePeak, 0.65, 0.04, 0.95), time + clampNumber(variant.noiseAttack, 0.002, 0.001, 0.03));
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, time + clampNumber(variant.noiseDecay, 0.14, 0.02, 0.8));
  registerAudioNodeEntry([noise], [noise, noiseFilter, noiseGain], 'drum');
  noise.start(time);
  noise.stop(time + clampNumber(variant.noiseDuration, 0.16, 0.02, 0.7));

  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = variant.toneType || 'triangle';
  osc.connect(oscGain);
  oscGain.connect(dest);
  osc.frequency.setValueAtTime(clampNumber(variant.toneStartFreq, 220, 40, 900), time);
  osc.frequency.exponentialRampToValueAtTime(clampNumber(variant.toneEndFreq, 110, 30, 700), time + clampNumber(variant.tonePitchTime, 0.08, 0.02, 0.5));
  oscGain.gain.setValueAtTime(0.0001, time);
  oscGain.gain.linearRampToValueAtTime(clampNumber(variant.tonePeak, 0.36, 0.02, 0.8), time + clampNumber(variant.toneAttack, 0.002, 0.001, 0.03));
  oscGain.gain.exponentialRampToValueAtTime(0.0001, time + clampNumber(variant.toneDecay, 0.09, 0.02, 0.8));
  registerAudioNodeEntry([osc], [osc, oscGain], 'drum');
  osc.start(time);
  osc.stop(time + clampNumber(variant.toneStop, variant.toneDecay, 0.02, 0.8));
}

function playClosedHat(time, soundId = null) {
  const ctx = getAudioCtx();
  const dest = audioRouting?.drums?.input || ctx.destination;
  const variant = resolveDrumSoundVariant('closedHat', soundId);
  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(clampNumber(variant.noiseDuration, 0.05, 0.01, 0.8));
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = clampNumber(variant.cutoff, 7000, 600, 18000);
  const gain = ctx.createGain();
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(clampNumber(variant.peak, 0.2, 0.01, 0.8), time + clampNumber(variant.attack, 0.001, 0.001, 0.03));
  gain.gain.exponentialRampToValueAtTime(0.0001, time + clampNumber(variant.decay, 0.045, 0.01, 1));
  registerAudioNodeEntry([noise], [noise, filter, gain], 'drum');
  noise.start(time);
  noise.stop(time + clampNumber(variant.noiseDuration, 0.05, 0.01, 0.8));
}

function playHiHat(time) { playClosedHat(time); }

function playOpenHat(time, soundId = null) {
  const ctx = getAudioCtx();
  const dest = audioRouting?.drums?.input || ctx.destination;
  const variant = resolveDrumSoundVariant('openHat', soundId);
  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(clampNumber(variant.noiseDuration, 0.45, 0.02, 0.8));
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = clampNumber(variant.cutoff, 5000, 600, 18000);
  const gain = ctx.createGain();
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(clampNumber(variant.peak, 0.28, 0.02, 0.9), time + clampNumber(variant.attack, 0.002, 0.001, 0.03));
  gain.gain.exponentialRampToValueAtTime(0.0001, time + clampNumber(variant.decay, 0.4, 0.01, 1));
  registerAudioNodeEntry([noise], [noise, filter, gain], 'drum');
  noise.start(time);
  noise.stop(time + clampNumber(variant.noiseDuration, 0.45, 0.02, 0.8));
}

function playHighTom(time, soundId = null) {
  const ctx = getAudioCtx();
  const dest = audioRouting?.drums?.input || ctx.destination;
  const variant = resolveDrumSoundVariant('hiTom', soundId);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(dest);
  osc.type = variant.oscType || 'sine';
  osc.frequency.setValueAtTime(clampNumber(variant.startFreq, 260, 50, 1200), time);
  osc.frequency.exponentialRampToValueAtTime(clampNumber(variant.endFreq, 150, 40, 800), time + clampNumber(variant.pitchTime, 0.15, 0.01, 0.8));
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(clampNumber(variant.peak, 0.75, 0.02, 1.2), time + clampNumber(variant.attack, 0.003, 0.001, 0.03));
  gain.gain.exponentialRampToValueAtTime(0.0001, time + clampNumber(variant.decay, 0.22, 0.02, 1));
  registerAudioNodeEntry([osc], [osc, gain], 'drum');
  osc.start(time);
  osc.stop(time + clampNumber(variant.stop, 0.25, 0.02, 1.1));
}

function playMidTom(time, soundId = null) {
  const ctx = getAudioCtx();
  const dest = audioRouting?.drums?.input || ctx.destination;
  const variant = resolveDrumSoundVariant('midTom', soundId);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(dest);
  osc.type = variant.oscType || 'sine';
  osc.frequency.setValueAtTime(clampNumber(variant.startFreq, 190, 50, 1200), time);
  osc.frequency.exponentialRampToValueAtTime(clampNumber(variant.endFreq, 100, 40, 800), time + clampNumber(variant.pitchTime, 0.18, 0.01, 0.8));
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(clampNumber(variant.peak, 0.75, 0.02, 1.2), time + clampNumber(variant.attack, 0.003, 0.001, 0.03));
  gain.gain.exponentialRampToValueAtTime(0.0001, time + clampNumber(variant.decay, 0.28, 0.02, 1));
  registerAudioNodeEntry([osc], [osc, gain], 'drum');
  osc.start(time);
  osc.stop(time + clampNumber(variant.stop, 0.32, 0.02, 1.1));
}

function playLowTom(time, soundId = null) {
  const ctx = getAudioCtx();
  const dest = audioRouting?.drums?.input || ctx.destination;
  const variant = resolveDrumSoundVariant('lowTom', soundId);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(dest);
  osc.type = variant.oscType || 'sine';
  osc.frequency.setValueAtTime(clampNumber(variant.startFreq, 130, 50, 1200), time);
  osc.frequency.exponentialRampToValueAtTime(clampNumber(variant.endFreq, 65, 40, 800), time + clampNumber(variant.pitchTime, 0.22, 0.01, 0.8));
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(clampNumber(variant.peak, 0.8, 0.02, 1.2), time + clampNumber(variant.attack, 0.004, 0.001, 0.03));
  gain.gain.exponentialRampToValueAtTime(0.0001, time + clampNumber(variant.decay, 0.34, 0.02, 1));
  registerAudioNodeEntry([osc], [osc, gain], 'drum');
  osc.start(time);
  osc.stop(time + clampNumber(variant.stop, 0.38, 0.02, 1.1));
}

function playRide(time, soundId = null) {
  const ctx = getAudioCtx();
  const dest = audioRouting?.drums?.input || ctx.destination;
  const variant = resolveDrumSoundVariant('ride', soundId);
  const masterGain = ctx.createGain();
  masterGain.connect(dest);
  masterGain.gain.setValueAtTime(0.0001, time);
  masterGain.gain.linearRampToValueAtTime(clampNumber(variant.peak, 0.18, 0.01, 0.9), time + clampNumber(variant.attack, 0.002, 0.001, 0.03));
  masterGain.gain.exponentialRampToValueAtTime(0.0001, time + clampNumber(variant.decay, 0.28, 0.02, 1));
  const rideOscillators = [];
  const rideNodes = [masterGain];
  const frequencies = Array.isArray(variant.partialFrequencies) && variant.partialFrequencies.length
    ? variant.partialFrequencies
    : [560, 845, 1174, 1523, 1780];
  frequencies.forEach(freq => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    g.gain.value = clampNumber(variant.partialGain, 0.04, 0.005, 0.2);
    osc.type = variant.oscType || 'square';
    osc.frequency.value = freq;
    osc.connect(g);
    g.connect(masterGain);
    rideOscillators.push(osc);
    rideNodes.push(osc, g);
    osc.start(time);
    osc.stop(time + clampNumber(variant.partialDuration, 0.3, 0.02, 1.2));
  });
  registerAudioNodeEntry(rideOscillators, rideNodes, 'drum');
}

function playDrumLane(key, time, soundId = null) {
  switch (key) {
    case 'kick':      playKick(time, soundId); break;
    case 'snare':     playSnare(time, soundId); break;
    case 'closedHat': playClosedHat(time, soundId); break;
    case 'openHat':   playOpenHat(time, soundId); break;
    case 'hiTom':     playHighTom(time, soundId); break;
    case 'midTom':    playMidTom(time, soundId); break;
    case 'lowTom':    playLowTom(time, soundId); break;
    case 'ride':      playRide(time, soundId); break;
  }
}

function scheduleStep(step, time, patternId = currentDrumPatternId) {
  if (!currentChordDrumsIn) return;
  const pattern = getDrumPatternById(patternId);
  if (!pattern) return;
  DRUM_LANES.forEach(lane => {
    if (pattern.grid[lane.key]?.[step]) playDrumLane(lane.key, time, getDrumLaneSoundId(pattern, lane.key));
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
  registerAudioNodeEntry([source], [source, highpass, bandpass, gain], 'drum');
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

function createMultiPoleFilterChain(ctx, time, synthSettings) {
  const filterPoles = normalizeFilterPoles(synthSettings?.filterPoles, 1);
  const filterCount = filterPoles === 4 ? 4 : filterPoles === 2 ? 2 : 1;
  const cutoff = clampNumber(synthSettings?.cutoff, 1200, 120, 6000);
  const resonance = clampNumber(synthSettings?.resonance, 1, 0.2, 12);
  const filters = Array.from({ length: filterCount }, () => ctx.createBiquadFilter());
  filters.forEach((filter, index) => {
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, time);
    const stageQ = index === filters.length - 1 ? resonance : Math.max(0.2, resonance * 0.5);
    filter.Q.setValueAtTime(stageQ, time);
    if (index > 0) filters[index - 1].connect(filter);
  });
  return { filters, input: filters[0], output: filters[filters.length - 1] };
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

const drumDistortionCurveCache = new Map();
function getDrumDistortionCurve(model, amount) {
  const normalizedAmount = clampNumber(amount, 0, 0, 1);
  const resolvedModel = normalizeDrumDistortionModel(model, 'softClip');
  const key = `${resolvedModel}:${Math.round(normalizedAmount * 1000)}`;
  if (drumDistortionCurveCache.has(key)) return drumDistortionCurveCache.get(key);
  const samples = 4096;
  const curve = new Float32Array(samples);
  const drive = 0.05 + normalizedAmount * 4;
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / (samples - 1) - 1;
    let y = x;
    if (resolvedModel === 'hardClip') {
      const threshold = Math.max(0.08, 1 - normalizedAmount * 0.92);
      y = Math.max(-threshold, Math.min(threshold, x));
      y /= threshold;
    } else if (resolvedModel === 'foldback') {
      const threshold = Math.max(0.08, 1 - normalizedAmount * 0.9);
      const folded = Math.abs(((x + threshold) % (4 * threshold)) - 2 * threshold) - threshold;
      y = folded / threshold;
    } else if (resolvedModel === 'tube') {
      const pre = x * (1 + normalizedAmount * 4.5);
      y = pre < 0
        ? Math.tanh(pre * (0.9 + normalizedAmount * 0.4))
        : Math.tanh(pre * (0.55 + normalizedAmount * 0.2));
    } else {
      y = Math.tanh(x * drive);
      const norm = Math.tanh(drive) || 1;
      y /= norm;
    }
    curve[i] = Math.max(-1, Math.min(1, y));
  }
  drumDistortionCurveCache.set(key, curve);
  return curve;
}

function playSynthVoice(freq, time, duration, synthSettings, kind = 'chord') {
  const ctx = getAudioCtx();
  const voiceGain = ctx.createGain();
  const filterChain = createMultiPoleFilterChain(ctx, time, synthSettings);
  const driveAmount = clampNumber(synthSettings.distortion, 0, 0, 1);
  let shaper = null;
  if (driveAmount > 0.001) {
    shaper = ctx.createWaveShaper();
    shaper.curve = getDistortionCurve(driveAmount);
    shaper.oversample = '2x';
    filterChain.output.connect(shaper);
    shaper.connect(voiceGain);
  } else {
    filterChain.output.connect(voiceGain);
  }
  voiceGain.connect(audioRouting?.[kind]?.input || ctx.destination);

  const isStringVoice = kind === 'string';
  const oscConfigs = isStringVoice
    ? [
      { type: synthSettings.osc1Type, freqOffsetCents: 0, gain: Math.max(0.03, (1 - synthSettings.mix) * 0.5) },
      { type: synthSettings.osc2Type, freqOffsetCents: synthSettings.osc2Interval * 100 + synthSettings.detune, gain: Math.max(0.03, synthSettings.mix * 0.5) },
      { type: synthSettings.osc3Type || synthSettings.osc1Type, freqOffsetCents: 1200 + synthSettings.detune * 0.5, gain: Math.max(0.03, (1 - synthSettings.mix) * 0.42) },
      { type: synthSettings.osc4Type || synthSettings.osc2Type, freqOffsetCents: 1200 + synthSettings.osc2Interval * 100 - synthSettings.detune * 0.5, gain: Math.max(0.03, synthSettings.mix * 0.42) },
    ]
    : [
      { type: synthSettings.osc1Type, freqOffsetCents: 0, gain: Math.max(0.05, 1 - synthSettings.mix) },
      { type: synthSettings.osc2Type, freqOffsetCents: synthSettings.osc2Interval * 100 + synthSettings.detune, gain: Math.max(0.05, synthSettings.mix) },
    ];
  const oscillators = [];
  const mixGains = [];
  const oscillatorFreqs = [];
  oscConfigs.forEach(config => {
    const oscillator = ctx.createOscillator();
    const mixGain = ctx.createGain();
    const oscillatorFreq = freq * Math.pow(2, config.freqOffsetCents / 1200);
    oscillator.type = config.type;
    oscillator.frequency.setValueAtTime(oscillatorFreq, time);
    mixGain.gain.value = config.gain;
    oscillator.connect(mixGain);
    mixGain.connect(filterChain.input);
    oscillators.push(oscillator);
    mixGains.push(mixGain);
    oscillatorFreqs.push(oscillatorFreq);
  });

  const modRate = clampNumber(synthSettings.modRate, 0, 0, 12);
  const modDepth = clampNumber(synthSettings.modDepth, 0, 0, 80);
  let lfo = null;
  const lfoGains = [];
  if (modRate > 0.01 && modDepth > 0.01) {
    lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(modRate, time);
    oscillators.forEach((oscillator, index) => {
      const lfoGain = ctx.createGain();
      const depthHz = oscillatorFreqs[index] * (Math.pow(2, modDepth / 1200) - 1);
      lfoGain.gain.setValueAtTime(depthHz, time);
      lfo.connect(lfoGain);
      lfoGain.connect(oscillator.frequency);
      lfoGains.push(lfoGain);
    });
    lfo.start(time);
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

  oscillators.forEach(oscillator => {
    oscillator.start(time);
    oscillator.stop(noteEnd + 0.02);
  });
  if (lfo) lfo.stop(noteEnd + 0.02);
  const sources = [...oscillators];
  const nodes = [voiceGain, ...filterChain.filters, ...oscillators, ...mixGains];
  if (shaper) nodes.push(shaper);
  if (lfo) {
    sources.push(lfo);
    nodes.push(lfo, ...lfoGains);
  }
  registerAudioNodeEntry(sources, nodes, 'voice', kind, filterChain.filters);
}

function buildArpStepPattern(noteCount, mode = 'off') {
  if (noteCount <= 0 || mode === 'off') return [];
  if (mode === 'down') return Array.from({ length: noteCount }, (_, index) => noteCount - 1 - index);
  if (mode === 'upDown') {
    const up = Array.from({ length: noteCount }, (_, index) => index);
    if (noteCount <= 2) return up;
    for (let index = noteCount - 2; index >= 1; index--) up.push(index);
    return up;
  }
  if (mode === 'outsideIn') {
    const pattern = [];
    let low = 0;
    let high = noteCount - 1;
    while (low <= high) {
      pattern.push(low);
      if (high !== low) pattern.push(high);
      low++;
      high--;
    }
    return pattern;
  }
  if (mode === 'insideOut') {
    const pattern = [];
    const middleLow = Math.floor((noteCount - 1) / 2);
    const middleHigh = Math.ceil((noteCount - 1) / 2);
    if (middleHigh !== middleLow) pattern.push(middleLow, middleHigh);
    else pattern.push(middleLow);
    for (let offset = 1; pattern.length < noteCount; offset++) {
      const left = middleLow - offset;
      const right = middleHigh + offset;
      if (right < noteCount) pattern.push(right);
      if (left >= 0) pattern.push(left);
    }
    return pattern.slice(0, noteCount);
  }
  if (mode === 'upSkip') {
    const evens = Array.from({ length: Math.ceil(noteCount / 2) }, (_, index) => index * 2).filter(index => index < noteCount);
    const odds = Array.from({ length: Math.floor(noteCount / 2) }, (_, index) => index * 2 + 1).filter(index => index < noteCount);
    return evens.concat(odds);
  }
  if (mode === 'downSkip') {
    const upSkip = buildArpStepPattern(noteCount, 'upSkip');
    return upSkip.reverse();
  }
  return Array.from({ length: noteCount }, (_, index) => index);
}

function buildChordIntervals(typeName, noteCount) {
  const baseIntervals = chordTypeObj(typeName).intervals.slice();
  if (!baseIntervals.length) return [];
  const count = clampInt(noteCount, baseIntervals.length, 1, 16);
  const result = [];
  let octave = 0;
  while (result.length < count) {
    for (let index = 0; index < baseIntervals.length && result.length < count; index++) {
      result.push(baseIntervals[index] + octave * 12);
    }
    octave += 1;
  }
  return result;
}

function playChordNotes(rootSemitone, typeName, when, beats = 4, repeats = 1, startBeat = 1, arpMode = 'off', noteCount = 3) {
  const intervals = buildChordIntervals(typeName, noteCount);
  const rootMidi = 60 + rootSemitone + getSynthTranspose(song.chordSynth);
  const totalBeats = clampInt(beats, 4, 1, 64);
  const repeatCount = normalizeRepeat(repeats, 1);
  const effectiveStartBeat = Math.min(totalBeats, normalizeStartBeat(startBeat, 1));
  const startOffsetBeats = effectiveStartBeat - 1;
  const activeBeats = Math.max(0.25, totalBeats - startOffsetBeats);
  if (arpMode !== 'off' && intervals.length) {
    const arpStepPattern = buildArpStepPattern(intervals.length, arpMode);
    const stepCount = arpStepPattern.length;
    if (!stepCount) return;
    // In arp mode, chordRepeat (repeats param / Chord X) controls arp speed:
    // repeats=1 → quarter-note arp, repeats=2 → eighth-note arp, repeats=4 → sixteenth-note, etc.
    const stepBeats = 1 / repeatCount;
    const stepSeconds = beatOffsetToSeconds(stepBeats);
    const noteDuration = Math.max(0.05, stepSeconds * 0.88);
    const blockStartTime = when + beatOffsetToSeconds(startOffsetBeats);
    const blockEndTime = when + beatOffsetToSeconds(totalBeats);
    let step = 0;
    let hitTime = blockStartTime;
    while (hitTime < blockEndTime - 0.01) {
      const remaining = blockEndTime - hitTime;
      if (remaining <= 0.01) break;
      const actualDuration = Math.min(noteDuration, Math.max(0.04, remaining * 0.95));
      playSynthVoice(
        frequencyFromMidi(rootMidi + intervals[arpStepPattern[step % stepCount]]),
        hitTime,
        actualDuration,
        song.chordSynth,
        'chord',
      );
      step++;
      hitTime += stepSeconds;
    }
    return;
  }
  const hitBeats = Math.max(0.25, activeBeats / repeatCount);
  const hitDuration = Math.max(0.1, beatsToSeconds(hitBeats) * 0.92);
  for (let hit = 0; hit < repeatCount; hit++) {
    const hitTime = when + beatOffsetToSeconds(startOffsetBeats + hit * hitBeats);
    intervals.forEach(interval => {
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
  const bassMidi = 36 + rootSemitone + getSynthTranspose(song.bassSynth);
  const totalBeats = clampInt(beats, 4, 1, 64);
  const repeatCount = normalizeRepeat(repeats, 1);
  const effectiveStartBeat = Math.min(totalBeats, normalizeStartBeat(startBeat, 1));
  const startOffsetBeats = effectiveStartBeat - 1;
  const activeBeats = Math.max(0.25, totalBeats - startOffsetBeats);
  const hitBeats = Math.max(0.25, activeBeats / repeatCount);
  const hitDuration = Math.max(0.09, beatsToSeconds(hitBeats) * 0.9);
  for (let hit = 0; hit < repeatCount; hit++) {
    const hitTime = when + beatOffsetToSeconds(startOffsetBeats + hit * hitBeats);
    playSynthVoice(frequencyFromMidi(bassMidi), hitTime, hitDuration, song.bassSynth, 'bass');
  }
}

function playStringNotes(rootSemitone, typeName, when, beats = 4, repeats = 1, startBeat = 1, noteCount = 3) {
  const intervals = buildChordIntervals(typeName, noteCount);
  if (!intervals.length) return;
  const stringMidi = 48 + rootSemitone + getSynthTranspose(song.stringSynth);
  const totalBeats = clampInt(beats, 4, 1, 64);
  const repeatCount = normalizeRepeat(repeats, 1);
  const effectiveStartBeat = Math.min(totalBeats, normalizeStartBeat(startBeat, 1));
  const startOffsetBeats = effectiveStartBeat - 1;
  const activeBeats = Math.max(0.25, totalBeats - startOffsetBeats);
  const hitBeats = Math.max(0.25, activeBeats / repeatCount);
  const hitDuration = Math.max(0.1, beatsToSeconds(hitBeats) * 0.92);
  for (let hit = 0; hit < repeatCount; hit++) {
    const hitTime = when + beatOffsetToSeconds(startOffsetBeats + hit * hitBeats);
    intervals.forEach(interval => {
      playSynthVoice(
        frequencyFromMidi(stringMidi + interval),
        hitTime,
        hitDuration,
        song.stringSynth,
        'string',
      );
    });
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

function usesSongTimelineMode(mode = song.playbackMode || 'edit') {
  return mode === 'song' || mode === 'looping';
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
  if (slider && usesSongTimelineMode(song.playbackMode)) slider.value = String(songBeatIndex);

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
  setPlaybackCursorFromPoint(point, index);
  updatePlaybackPositionUI(playbackCursor.sectionIndex, playbackCursor.chordIndex, playbackCursor.beatInChord, playbackCursor.songBeatIndex);
}

function initializePlaybackCursor() {
  const mode = song.playbackMode || 'edit';
  if (usesSongTimelineMode(mode)) {
    if (mode === 'looping' && movePlaybackToActiveLoopTarget()) return;
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
  if (usesSongTimelineMode(mode)) {
    const map = buildSongBeatMap();
    if (!map.length) return;
    const currentPoint = map[playbackCursor.songBeatIndex];
    if (mode === 'looping' && currentPoint) {
      const loopTarget = getActiveLoopTarget();
      if (loopTarget) {
        const targetPoint = findSongBeatPointForChord(loopTarget.sectionId, loopTarget.chordId, map);
        const targetSection = song.sections[targetPoint?.point?.sectionIndex];
        const targetChord = targetSection?.chords?.[targetPoint?.point?.chordIndex];
        const isTargetBeat = Boolean(
          targetPoint
          && currentPoint.sectionIndex === targetPoint.point.sectionIndex
          && currentPoint.chordIndex === targetPoint.point.chordIndex,
        );
        if (targetChord?.loopEnabled && isTargetBeat && currentPoint.beatInChord + 1 >= (targetChord.beats || 4)) {
          setPlaybackCursorFromPoint(targetPoint.point, targetPoint.index);
          return;
        }
      } else {
        const section = song.sections[currentPoint.sectionIndex];
        const chord = section?.chords?.[currentPoint.chordIndex];
        if (chord?.loopEnabled && currentPoint.beatInChord + 1 >= (chord.beats || 4)) {
          const loopStartIndex = Math.max(0, playbackCursor.songBeatIndex - currentPoint.beatInChord);
          const loopPoint = map[loopStartIndex] || currentPoint;
          setPlaybackCursorFromPoint(loopPoint, loopStartIndex);
          return;
        }
      }
    }
    const nextIndex = playbackCursor.songBeatIndex + 1;
    if (nextIndex >= map.length) {
      songEndedPending = true;
      return;
    }
    const point = map[nextIndex];
    setPlaybackCursorFromPoint(point, nextIndex);
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
  if (usesSongTimelineMode(song.playbackMode || 'edit') && !buildSongBeatMap().length) {
    songEndedPending = true;
    return;
  }
  const section = song.sections[playbackCursor.sectionIndex];
  if (!section) return;

  if (!section.chords.length) {
    updatePlaybackPositionUI(playbackCursor.sectionIndex, 0, 0, playbackCursor.songBeatIndex);
    if (usesSongTimelineMode(song.playbackMode || 'edit')) advancePlaybackCursor();
    return;
  }

  const chord = section.chords[playbackCursor.chordIndex];
  if (!chord) return;

  if (playbackCursor.beatInSection === 0 && section.crashOnStart) playCrash(time);
  if (playbackCursor.beatInChord === 0) {
    const chordStartBeat = getChordPlaybackStartBeat(chord);
    const chordNoteCount = clampInt(chord.noteCount, chordTypeObj(chord.type).intervals.length, 1, 16);
    if (chord.chordsIn !== false) playChordNotes(chord.root, chord.type, time, chord.beats || 4, chord.chordRepeat || 1, chordStartBeat, chord.arpMode || 'off', chordNoteCount);
    if (song.bassEnabled && chord.bassIn !== false) playBassNote(getChordBassRoot(chord), time, chord.beats || 4, chord.bassRepeat || 1, chordStartBeat);
    if (song.stringEnabled && chord.stringsIn !== false) playStringNotes(
      getChordStringRoot(chord),
      chord.type,
      time,
      chord.beats || 4,
      chord.stringRepeat || chord.chordRepeat || 1,
      chordStartBeat,
      chordNoteCount,
    );
  }

  const sectionBeats = getSectionBeatLength(section);
  if (section.rollAtEnd && playbackCursor.beatInSection === sectionBeats - 1) playRoll(time);

  updatePlaybackPositionUI(playbackCursor.sectionIndex, playbackCursor.chordIndex, playbackCursor.beatInChord, playbackCursor.songBeatIndex);
  advancePlaybackCursor();

  if (songEndedPending) {
    songEndedPending = false;
    const delay = Math.max(0, (time - getAudioCtx().currentTime) * 1000);
    if (songEndTimeout !== null) clearTimeout(songEndTimeout);
    songEndTimeout = setTimeout(() => {
      stopBeat({ resetPosition: true, nextState: 'ended', logMessage: 'Playback ended' });
      songEndTimeout = null;
    }, delay + 20);
  }
}

function scheduler(generation = schedulerGeneration) {
  if (generation !== schedulerGeneration || !isBeating) {
    schedulerTimer = null;
    return;
  }
  const ctx = getAudioCtx();
  debugState.counters.schedulerTicks += 1;
  while (nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD) {
    const transportStep = currentStep;
    const beatSubdivision = currentStep % 4;
    if (beatSubdivision === 0) {
      currentBeatStepBase = getSectionSixteenthOffset(playbackCursor.beatInSection);
      const section = song.sections[playbackCursor.sectionIndex];
      const chord = section?.chords?.[playbackCursor.chordIndex];
      currentDrumPatternId = getChordDrumPatternId(chord, getDefaultDrumPatternId());
      currentChordDrumsIn = chord?.drumsIn !== false;
      currentLfoPatternIds = {
        chord: getChordPartLfoPatternId(chord, 'chord', getDefaultLfoPatternId()),
        bass: getChordPartLfoPatternId(chord, 'bass', getDefaultLfoPatternId()),
        string: getChordPartLfoPatternId(chord, 'string', getDefaultLfoPatternId()),
      };
    }
    applyAmpLfoAtStep(nextNoteTime, transportStep, currentLfoPatternIds);
    scheduleStep((currentBeatStepBase + beatSubdivision) % STEPS, nextNoteTime, currentDrumPatternId);
    if (beatSubdivision === 0 && isBeating) scheduleMusicalBeat(nextNoteTime);
    const secondsPerSixteenth = (60 / song.bpm) / 4;
    nextNoteTime += secondsPerSixteenth;
    currentStep = (currentStep + 1) % STEPS;
  }
  if (isBeating && generation === schedulerGeneration) {
    schedulerTimer = setTimeout(() => scheduler(generation), LOOKAHEAD_MS);
  }
  else schedulerTimer = null;
}

function updateTransportControls() {
  const startButton = document.getElementById('beat-start');
  const pauseButton = document.getElementById('beat-pause');
  const stopButton = document.getElementById('beat-stop');
  const indicator = document.getElementById('beat-indicator');
  if (startButton) {
    const isPaused = transportState === 'paused' && !isBeating;
    startButton.disabled = isBeating;
    startButton.textContent = isPaused ? '▶ Resume' : '▶ Beat';
    startButton.setAttribute('aria-label', isPaused ? 'Resume beat' : 'Start beat');
  }
  if (pauseButton) pauseButton.disabled = !isBeating;
  if (stopButton) stopButton.disabled = !isBeating && transportState !== 'paused';
  if (indicator) indicator.classList.toggle('playing', isBeating);
}

function resetPlaybackPositionToStart() {
  const mode = song.playbackMode || 'edit';
  if (usesSongTimelineMode(mode)) {
    const slider = document.getElementById('song-go-to');
    if (slider) slider.value = '0';
    setSongPositionFromSlider(0);
  } else {
    initializePlaybackCursor();
  }
}

function haltPlaybackAudio() {
  isBeating = false;
  flushScheduledNotes();
  stopIndicatorFlash();
}

function startBeat() {
  if (isBeating) return;
  const resumeFromPause = transportState === 'paused';
  isBeating = true;
  transportState = 'playing';
  songEndedPending = false;
  schedulerGeneration += 1;
  if (!resumeFromPause) initializePlaybackCursor();
  currentStep = getSectionSixteenthOffset(playbackCursor.beatInSection);
  currentBeatStepBase = getSectionSixteenthOffset(playbackCursor.beatInSection);
  currentDrumPatternId = null;
  currentChordDrumsIn = true;
  currentLfoPatternIds = { chord: null, bass: null, string: null };
  nextNoteTime = getAudioCtx().currentTime + 0.05;
  debugLog(resumeFromPause ? 'Playback resumed' : 'Playback started');
  scheduler(schedulerGeneration);
  startIndicatorFlash();
  updateTransportControls();
  updatePlaybackHighlights();
}

function pauseBeat() {
  if (!isBeating) return;
  haltPlaybackAudio();
  transportState = 'paused';
  debugLog('Playback paused');
  updateTransportControls();
  updatePlaybackHighlights();
}

function stopBeat({ resetPosition = true, nextState = 'stopped', logMessage = 'Playback stopped' } = {}) {
  haltPlaybackAudio();
  if (resetPosition) resetPlaybackPositionToStart();
  transportState = nextState;
  debugLog(logMessage);
  updateTransportControls();
  lastHighlightedChordId = null;
  updatePlaybackHighlights();
}

function auditionChord(rootSemitone, typeName) {
  const chordType = chordTypeObj(typeName);
  const rootMidi = 60 + rootSemitone + getSynthTranspose(song.chordSynth);
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

  // Ensure editingDrumPatternId is valid; prefer the focused chord in the selected section
  if (!editingDrumPatternId || !patterns.some(p => p.id === editingDrumPatternId)) {
    editingDrumPatternId = getPreferredEditingDrumPatternId() || patterns[0].id;
  }
  const pattern = patterns.find(p => p.id === editingDrumPatternId);

  // Header
  const header = document.createElement('div');
  header.className = 'drum-seq-header';
  const title = document.createElement('h2');
  title.textContent = '🥁 Drum Sequencer';
  const helpText = document.createElement('p');
  helpText.className = 'drum-seq-help';
  helpText.textContent = '8-lane 16th-note grid • Click steps to toggle on/off • Each chord can use a different pattern (set on the chord cards below)';
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

  const patternCopyButton = document.createElement('button');
  patternCopyButton.type = 'button';
  patternCopyButton.className = 'mini-action-btn';
  patternCopyButton.textContent = 'Copy';
  patternCopyButton.title = 'Copy the currently edited drum pattern';
  patternCopyButton.setAttribute('aria-label', 'Copy the currently edited drum pattern');
  patternCopyButton.addEventListener('click', () => copyDrumPattern(editingDrumPatternId));

  const patternPasteButton = document.createElement('button');
  patternPasteButton.type = 'button';
  patternPasteButton.className = 'mini-action-btn';
  patternPasteButton.textContent = 'Paste';
  patternPasteButton.title = 'Paste the copied drum pattern into the currently edited pattern';
  patternPasteButton.setAttribute('aria-label', 'Paste the copied drum pattern into the currently edited pattern');
  patternPasteButton.addEventListener('click', () => pasteDrumPattern(editingDrumPatternId));

  const patternSaveNewButton = document.createElement('button');
  patternSaveNewButton.type = 'button';
  patternSaveNewButton.className = 'mini-action-btn';
  patternSaveNewButton.textContent = '+ Save as new pattern';
  patternSaveNewButton.title = 'Save current drum pattern as a new named pattern in the list';
  patternSaveNewButton.setAttribute('aria-label', 'Save current drum pattern as a new named pattern');
  patternSaveNewButton.addEventListener('click', () => addDrumPatternFromCurrent(editingDrumPatternId));

  controlsRow.append(patternLabel, nameLabel, patternCopyButton, patternPasteButton, patternSaveNewButton);

  const drumFx = buildDrumFxControls();

  // Grid container
  const grid = document.createElement('div');
  grid.className = 'drum-seq-grid';

  // Step numbers header row
  const numbersRow = document.createElement('div');
  numbersRow.className = 'drum-seq-lane';
  const spacer = document.createElement('span');
  spacer.className = 'drum-seq-lane-label';
  numbersRow.appendChild(spacer);
  const soundSpacer = document.createElement('span');
  soundSpacer.className = 'drum-seq-lane-sound-spacer';
  numbersRow.appendChild(soundSpacer);
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

    const laneSoundSelect = document.createElement('select');
    laneSoundSelect.className = 'drum-seq-lane-sound-select';
    laneSoundSelect.setAttribute('aria-label', `${lane.label} sound`);
    const selectedSoundId = getDrumLaneSoundId(pattern, lane.key);
    getDrumLaneSoundChoices(lane.key).forEach(choice => {
      const option = document.createElement('option');
      option.value = choice.id;
      option.textContent = choice.label;
      if (choice.id === selectedSoundId) option.selected = true;
      laneSoundSelect.appendChild(option);
    });
    laneSoundSelect.addEventListener('change', () => setDrumLaneSound(editingDrumPatternId, lane.key, laneSoundSelect.value));

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

    row.append(laneLabel, laneSoundSelect, steps);
    grid.appendChild(row);
  });

  panel.append(header, controlsRow, drumFx, grid);
}

function getNavigationRibbonItems() {
  const items = [
    { targetId: 'mixer-panel', label: 'Mix', title: 'Mixer' },
    { targetId: 'drum-sequencer-panel', label: 'Drm', title: 'Drum Machine' },
    { targetId: 'synth-rack', label: 'LFO', title: 'LFO / Custom LFO' },
    { targetId: 'synth-panel-chord', label: 'Chrd', title: 'Chord synth' },
    { targetId: 'synth-panel-bass', label: 'Bass', title: 'Bass synth' },
    { targetId: 'synth-panel-string', label: 'Str', title: 'String synth' },
  ];
  song.sections.forEach((section, index) => {
    const fullLabel = (section.name || section.type || `Section ${index + 1}`).trim();
    items.push({
      targetId: `section-${section.id}`,
      label: fullLabel,
      title: fullLabel,
    });
  });
  return items;
}

function renderNavigationRibbon() {
  const ribbon = document.getElementById('navigation-ribbon');
  if (!ribbon) return;
  ribbon.innerHTML = '';
  const items = getNavigationRibbonItems();
  items.forEach(item => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'navigation-ribbon-btn';
    button.textContent = item.label;
    button.title = item.title;
    button.setAttribute('aria-label', `Jump to ${item.title}`);
    button.addEventListener('click', () => {
      const target = document.getElementById(item.targetId);
      if (!target) return;
      target.scrollIntoView({ block: 'start', inline: 'nearest' });
    });
    ribbon.appendChild(button);
  });
}

function render({ preservePlaybackCursor = false } = {}) {
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
  renderNavigationRibbon();
  updateSectionClipboardActionState();
  updateSongGoToControl();
  updatePlaybackModeUI();
  if (!(preservePlaybackCursor && isBeating)) initializePlaybackCursor();
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
  help.textContent = 'Balance chord, bass, string, and drum levels. Drum-machine-only distortion/filter/reverb is in the Drum Sequencer panel.';

  const controls = document.createElement('div');
  controls.className = 'mixer-controls';
  controls.append(
    buildMixerSlider('Chords', song.mixer.chordVolume, value => updateMixerField('chordVolume', value)),
    buildMixerSlider('Bass', song.mixer.bassVolume, value => updateMixerField('bassVolume', value)),
    buildMixerSlider('Strings', song.mixer.stringVolume, value => updateMixerField('stringVolume', value)),
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

function buildDrumFxControls() {
  const drumFx = song.drumFx || {};
  const wrap = document.createElement('div');
  wrap.className = 'drum-fx-controls';

  const title = document.createElement('div');
  title.className = 'drum-fx-title';
  title.textContent = 'Drum FX (drum machine only)';

  const distortionCard = document.createElement('div');
  distortionCard.className = 'drum-fx-card';
  const distortionTop = document.createElement('div');
  distortionTop.className = 'drum-fx-card-top';
  const distortionLabel = document.createElement('span');
  distortionLabel.textContent = 'Distortion';
  const distortionEnabledLabel = document.createElement('label');
  distortionEnabledLabel.className = 'checkbox-inline';
  const distortionEnabledInput = document.createElement('input');
  distortionEnabledInput.type = 'checkbox';
  distortionEnabledInput.checked = Boolean(drumFx.distortionEnabled);
  distortionEnabledInput.setAttribute('aria-label', 'Drum distortion enabled');
  distortionEnabledInput.addEventListener('change', () => updateDrumFxField('distortionEnabled', distortionEnabledInput.checked));
  distortionEnabledLabel.append(distortionEnabledInput, document.createTextNode('On'));
  distortionTop.append(distortionLabel, distortionEnabledLabel);

  const distortionGrid = document.createElement('div');
  distortionGrid.className = 'drum-fx-card-grid';
  distortionGrid.append(
    buildSynthSelectControl(
      'Model',
      normalizeDrumDistortionModel(drumFx.distortionModel, 'softClip'),
      DRUM_DISTORTION_MODELS,
      'Drum distortion model',
      value => updateDrumFxField('distortionModel', value),
    ),
    buildDrumFxSlider(
      'Drive',
      drumFx.distortionDrive,
      value => `${Math.round(value * 100)}%`,
      'Drum distortion drive',
      value => updateDrumFxField('distortionDrive', value),
    ),
  );
  distortionCard.append(distortionTop, distortionGrid);

  const filterCard = document.createElement('div');
  filterCard.className = 'drum-fx-card';
  const filterTop = document.createElement('div');
  filterTop.className = 'drum-fx-card-top';
  const filterLabel = document.createElement('span');
  filterLabel.textContent = 'Filter';
  const filterEnabledLabel = document.createElement('label');
  filterEnabledLabel.className = 'checkbox-inline';
  const filterEnabledInput = document.createElement('input');
  filterEnabledInput.type = 'checkbox';
  filterEnabledInput.checked = Boolean(drumFx.filterEnabled);
  filterEnabledInput.setAttribute('aria-label', 'Drum filter enabled');
  filterEnabledInput.addEventListener('change', () => updateDrumFxField('filterEnabled', filterEnabledInput.checked));
  filterEnabledLabel.append(filterEnabledInput, document.createTextNode('On'));
  filterTop.append(filterLabel, filterEnabledLabel);

  const filterLfoPatternId = getValidDrumFilterLfoPatternId(drumFx.filterLfoPatternId, getDefaultLfoPatternId());
  const filterLfoPatternSelect = buildSynthSelectControl(
    'LFO pattern',
    filterLfoPatternId || '',
    (song.lfoPatterns || []).map(pattern => ({ value: pattern.id, label: pattern.name })),
    'Drum filter LFO pattern',
    value => updateDrumFxField('filterLfoPatternId', value),
  );
  const filterLfoPatternSelectInput = filterLfoPatternSelect.querySelector('select');
  if (filterLfoPatternSelectInput) filterLfoPatternSelectInput.id = 'drum-filter-lfo-pattern-select';
  const filterGrid = document.createElement('div');
  filterGrid.className = 'drum-fx-card-grid';
  filterGrid.append(
    buildSynthSelectControl(
      'Type',
      normalizeDrumFilterType(drumFx.filterType, 'lowpass'),
      DRUM_FILTER_TYPES,
      'Drum filter type',
      value => updateDrumFxField('filterType', value),
    ),
    buildSynthSelectControl(
      'Slope',
      String(normalizeDrumFilterSlope(drumFx.filterSlope, 12)),
      DRUM_FILTER_SLOPE_OPTIONS.map(option => ({ value: String(option.value), label: option.label })),
      'Drum filter slope',
      value => updateDrumFxField('filterSlope', value),
    ),
    buildDrumFxRangeSlider(
      'Cutoff',
      drumFx.filterCutoff,
      20,
      20000,
      10,
      value => `${Math.round(value)} Hz`,
      'Drum filter cutoff',
      value => updateDrumFxField('filterCutoff', value),
    ),
    buildDrumFxRangeSlider(
      'Q',
      drumFx.filterResonance,
      0.2,
      12,
      0.1,
      value => value.toFixed(1),
      'Drum filter resonance',
      value => updateDrumFxField('filterResonance', value),
    ),
    filterLfoPatternSelect,
  );

  const filterLfoRow = document.createElement('div');
  filterLfoRow.className = 'drum-fx-inline-row';
  const filterLfoEnabledLabel = document.createElement('label');
  filterLfoEnabledLabel.className = 'checkbox-inline';
  filterLfoEnabledLabel.textContent = 'LFO';
  const filterLfoEnabledInput = document.createElement('input');
  filterLfoEnabledInput.type = 'checkbox';
  filterLfoEnabledInput.checked = Boolean(drumFx.filterLfoEnabled);
  filterLfoEnabledInput.setAttribute('aria-label', 'Drum filter LFO enabled');
  filterLfoEnabledInput.addEventListener('change', () => updateDrumFxField('filterLfoEnabled', filterLfoEnabledInput.checked));
  filterLfoEnabledLabel.prepend(filterLfoEnabledInput);
  filterLfoRow.append(
    filterLfoEnabledLabel,
    buildDrumFxSlider(
      'LFO depth',
      drumFx.filterLfoDepth,
      value => `${Math.round(value * 100)}%`,
      'Drum filter LFO depth',
      value => updateDrumFxField('filterLfoDepth', value),
    ),
  );
  filterCard.append(filterTop, filterGrid, filterLfoRow);

  const reverbCard = document.createElement('div');
  reverbCard.className = 'drum-fx-card';
  const reverbTop = document.createElement('div');
  reverbTop.className = 'drum-fx-card-top';
  const reverbLabel = document.createElement('span');
  reverbLabel.textContent = 'Reverb (end of drum chain)';
  reverbTop.append(reverbLabel);
  const reverbGrid = document.createElement('div');
  reverbGrid.className = 'drum-fx-card-grid';
  reverbGrid.append(
    buildDrumFxSlider(
      'Mix',
      drumFx.reverbMix,
      value => `${Math.round(value * 100)}%`,
      'Drum reverb mix',
      value => updateDrumFxField('reverbMix', value),
    ),
    buildDrumFxSlider(
      'Size',
      drumFx.reverbSize,
      value => `${Math.round(value * 100)}%`,
      'Drum reverb size',
      value => updateDrumFxField('reverbSize', value),
    ),
    buildDrumFxSlider(
      'Decay',
      drumFx.reverbDecay,
      value => `${Math.round(value * 100)}%`,
      'Drum reverb decay',
      value => updateDrumFxField('reverbDecay', value),
    ),
  );
  reverbCard.append(reverbTop, reverbGrid);

  wrap.append(title, distortionCard, filterCard, reverbCard);
  return wrap;
}

function buildDrumFxSlider(labelText, value, format, ariaLabel, onInput) {
  const row = document.createElement('label');
  row.className = 'synth-slider';
  const top = document.createElement('div');
  top.className = 'synth-slider-top';
  const label = document.createElement('span');
  label.textContent = labelText;
  const valueText = document.createElement('span');
  valueText.className = 'synth-slider-value';
  const clamped = clampNumber(value, 0, 0, 1);
  valueText.textContent = format(clamped);
  top.append(label, valueText);

  const input = document.createElement('input');
  input.type = 'range';
  input.min = '0';
  input.max = '1';
  input.step = '0.01';
  input.value = String(clamped);
  input.setAttribute('aria-label', ariaLabel);
  input.addEventListener('input', () => {
    const next = clampNumber(input.value, clamped, 0, 1);
    valueText.textContent = format(next);
    onInput(next);
  });
  row.append(top, input);
  return row;
}

function buildDrumFxRangeSlider(labelText, value, min, max, step, format, ariaLabel, onInput) {
  const row = document.createElement('label');
  row.className = 'synth-slider';
  const top = document.createElement('div');
  top.className = 'synth-slider-top';
  const label = document.createElement('span');
  label.textContent = labelText;
  const valueText = document.createElement('span');
  valueText.className = 'synth-slider-value';
  const clamped = clampNumber(value, min, min, max);
  valueText.textContent = format(clamped);
  top.append(label, valueText);

  const input = document.createElement('input');
  input.type = 'range';
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(clamped);
  input.setAttribute('aria-label', ariaLabel);
  input.addEventListener('input', () => {
    const next = clampNumber(input.value, clamped, min, max);
    valueText.textContent = format(next);
    onInput(next);
  });
  row.append(top, input);
  return row;
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
  if (!editingLfoPatternId || !song.lfoPatterns?.some(pattern => pattern.id === editingLfoPatternId)) {
    editingLfoPatternId = getPreferredEditingLfoPatternId() || getDefaultLfoPatternId();
  }
  rack.appendChild(buildLfoPatternCard());
  rack.appendChild(buildSynthCard('chord'));
  rack.appendChild(buildSynthCard('bass'));
  rack.appendChild(buildSynthCard('string'));
}

function buildLfoCustomShapeEditor(pattern) {
  const wrapper = document.createElement('div');
  wrapper.className = 'lfo-custom-editor';

  const header = document.createElement('div');
  header.className = 'lfo-custom-editor-top';
  const title = document.createElement('span');
  title.textContent = 'Custom shape (4 beats)';
  const resetButton = document.createElement('button');
  resetButton.type = 'button';
  resetButton.className = 'mini-action-btn';
  resetButton.textContent = 'Reset';
  resetButton.title = 'Reset custom LFO shape';
  header.append(title, resetButton);

  const canvas = document.createElement('canvas');
  canvas.className = 'lfo-custom-canvas';
  canvas.width = 520;
  canvas.height = 180;
  canvas.setAttribute('aria-label', 'Custom amplitude LFO drawing grid');

  const hint = document.createElement('p');
  hint.className = 'synth-subtitle';
  hint.textContent = 'Drag a yellow handle to move it in time and level; drag elsewhere to draw freely.';

  const gridPadding = { left: 14, right: 14, top: 10, bottom: 20 };
  let points = normalizeLfoCustomPoints(pattern.customPoints);
  if (!Array.isArray(pattern.customPoints) || pattern.customPoints.length !== points.length) {
    pattern.customPoints = points;
  }
  const indexMax = Math.max(1, points.length - 1);

  const getCanvasMetrics = () => ({
    width: canvas.width,
    height: canvas.height,
    left: gridPadding.left,
    right: canvas.width - gridPadding.right,
    top: gridPadding.top,
    bottom: canvas.height - gridPadding.bottom,
  });

  const pointToCanvas = point => {
    const metrics = getCanvasMetrics();
    const drawWidth = Math.max(1, metrics.right - metrics.left);
    const drawHeight = Math.max(1, metrics.bottom - metrics.top);
    return {
      x: metrics.left + point.x * drawWidth,
      y: metrics.top + (1 - point.y) * drawHeight,
    };
  };

  const draw = () => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const metrics = getCanvasMetrics();
    const drawWidth = Math.max(1, metrics.right - metrics.left);
    const drawHeight = Math.max(1, metrics.bottom - metrics.top);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.fillRect(metrics.left, metrics.top, drawWidth, drawHeight);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let beat = 0; beat <= 4; beat++) {
      const x = metrics.left + (beat / 4) * drawWidth;
      ctx.beginPath();
      ctx.moveTo(x, metrics.top);
      ctx.lineTo(x, metrics.bottom);
      ctx.stroke();
    }
    for (let row = 0; row <= 4; row++) {
      const y = metrics.top + (row / 4) * drawHeight;
      ctx.beginPath();
      ctx.moveTo(metrics.left, y);
      ctx.lineTo(metrics.right, y);
      ctx.stroke();
    }

    ctx.strokeStyle = '#7b61ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach((point, index) => {
      const pos = pointToCanvas(point);
      if (index === 0) ctx.moveTo(pos.x, pos.y);
      else ctx.lineTo(pos.x, pos.y);
    });
    ctx.stroke();

    ctx.fillStyle = '#f5a623';
    points.forEach(point => {
      const pos = pointToCanvas(point);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const setPoints = nextPoints => {
    const normalized = normalizeLfoCustomPoints(nextPoints, points);
    points = normalized;
    const wasCustom = pattern.shape === 'custom';
    updateLfoPatternField(pattern.id, 'customPoints', normalized);
    if (!wasCustom) {
      // Auto-switch shape to custom when user draws/drags; rebuild UI to reflect
      updateLfoPatternField(pattern.id, 'shape', 'custom');
      renderSynthRack();
    } else {
      draw();
    }
  };

  const eventToPoint = event => {
    const rect = canvas.getBoundingClientRect();
    const px = clampNumber(event.clientX - rect.left, 0, 0, rect.width);
    const py = clampNumber(event.clientY - rect.top, 0, 0, rect.height);
    return {
      x: rect.width > 0 ? px / rect.width : 0,
      y: rect.height > 0 ? 1 - (py / rect.height) : 1,
    };
  };

  const HANDLE_HIT_RADIUS = 12;

  const findHandleAtEvent = event => {
    const rect = canvas.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    const scaleX = canvas.width / Math.max(1, rect.width);
    const scaleY = canvas.height / Math.max(1, rect.height);
    const cx = px * scaleX;
    const cy = py * scaleY;
    let bestIndex = -1;
    let bestDist = HANDLE_HIT_RADIUS * Math.max(scaleX, scaleY);
    points.forEach((point, index) => {
      const pos = pointToCanvas(point);
      const dist = Math.sqrt((cx - pos.x) ** 2 + (cy - pos.y) ** 2);
      if (dist < bestDist) {
        bestDist = dist;
        bestIndex = index;
      }
    });
    return bestIndex;
  };

  // dragMode: null | 'handle' | 'draw'
  let dragMode = null;
  let activeHandleIndex = -1;
  let lastDrawIndex = null;
  let lastDrawY = null;

  const applyHandleDrag = event => {
    if (activeHandleIndex < 0 || activeHandleIndex >= points.length) return;
    const normalized = eventToPoint(event);
    const lastIndex = Math.max(0, points.length - 1);
    const targetY = clampNumber(normalized.y, 1, 0, 1);
    const nextPoints = points.map(point => ({ x: point.x, y: point.y }));
    const previousX = activeHandleIndex > 0 ? nextPoints[activeHandleIndex - 1].x : 0;
    const nextX = activeHandleIndex < lastIndex ? nextPoints[activeHandleIndex + 1].x : 1;
    let targetX = nextPoints[activeHandleIndex].x;
    if (activeHandleIndex === 0) targetX = 0;
    else if (activeHandleIndex === lastIndex) targetX = 1;
    else targetX = clampNumber(normalized.x, targetX, previousX, nextX);
    nextPoints[activeHandleIndex].x = targetX;
    nextPoints[activeHandleIndex].y = targetY;
    setPoints(nextPoints);
  };

  const applyDrawPaint = (event, isStart = false) => {
    const normalized = eventToPoint(event);
    const targetIndex = Math.max(0, Math.min(indexMax, Math.round(normalized.x * indexMax)));
    const targetY = clampNumber(normalized.y, 1, 0, 1);
    const nextPoints = points.map(point => ({ x: point.x, y: point.y }));
    if (isStart || lastDrawIndex === null || lastDrawY === null) {
      nextPoints[targetIndex].y = targetY;
    } else {
      const step = targetIndex >= lastDrawIndex ? 1 : -1;
      const steps = Math.max(1, Math.abs(targetIndex - lastDrawIndex));
      for (let index = 0; index <= steps; index++) {
        const offset = index * step;
        const pointIndex = lastDrawIndex + offset;
        const mix = index / steps;
        nextPoints[pointIndex].y = clampNumber(lastDrawY + (targetY - lastDrawY) * mix, targetY, 0, 1);
      }
    }
    lastDrawIndex = targetIndex;
    lastDrawY = targetY;
    setPoints(nextPoints);
  };

  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    canvas.setPointerCapture(event.pointerId);
    const hitIndex = findHandleAtEvent(event);
    if (hitIndex >= 0) {
      dragMode = 'handle';
      activeHandleIndex = hitIndex;
      applyHandleDrag(event);
    } else {
      dragMode = 'draw';
      lastDrawIndex = null;
      lastDrawY = null;
      applyDrawPaint(event, true);
    }
  });
  canvas.addEventListener('pointermove', event => {
    if (!dragMode) return;
    if (dragMode === 'handle') {
      applyHandleDrag(event);
    } else {
      applyDrawPaint(event);
    }
  });
  const stopDrag = event => {
    if (!dragMode) return;
    dragMode = null;
    activeHandleIndex = -1;
    lastDrawIndex = null;
    lastDrawY = null;
    if (event && canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  };
  canvas.addEventListener('pointerup', stopDrag);
  canvas.addEventListener('pointercancel', stopDrag);

  resetButton.addEventListener('click', () => setPoints(createDefaultLfoCustomPoints()));
  draw();

  wrapper.append(header, canvas, hint);
  return wrapper;
}

function buildLfoPatternCard() {
  const card = document.createElement('section');
  card.className = 'synth-card';
  const pattern = getLfoPatternById(editingLfoPatternId);
  if (!pattern) return card;

  const header = document.createElement('div');
  header.className = 'synth-card-header';
  const titleWrap = document.createElement('div');
  titleWrap.className = 'synth-title-wrap';
  const title = document.createElement('h2');
  title.textContent = 'Amp LFO patterns';
  const subtitle = document.createElement('p');
  subtitle.className = 'synth-subtitle';
  subtitle.textContent = 'Tempo-synced amplitude shaping assigned per chord';
  titleWrap.append(title, subtitle);
  header.appendChild(titleWrap);

  const controlsGrid = document.createElement('div');
  controlsGrid.className = 'synth-controls-grid';
  controlsGrid.appendChild(buildSynthSelectControl(
    'Edit pattern',
    pattern.id,
    (song.lfoPatterns || []).map(item => ({ value: item.id, label: item.name })),
    'Edit amplitude LFO pattern',
    value => selectEditLfoPattern(value),
  ));
  controlsGrid.appendChild(buildSynthSelectControl(
    'Shape',
    normalizeLfoShape(pattern.shape, 'sine'),
    LFO_SHAPE_OPTIONS,
    'Amplitude LFO shape',
    value => {
      updateLfoPatternField(pattern.id, 'shape', value);
      renderSynthRack();
    },
  ));
  controlsGrid.appendChild(buildSynthSelectControl(
    'Rate',
    String(normalizeLfoRate(pattern.rateBeats, 1)),
    LFO_RATE_OPTIONS.map(option => ({ value: String(option.value), label: option.label })),
    'Amplitude LFO rate',
    value => updateLfoPatternField(pattern.id, 'rateBeats', Number(value)),
  ));
  controlsGrid.appendChild(buildSynthSelectControl(
    'Timing',
    normalizeLfoTimingFeel(pattern.timingFeel, 'straight'),
    LFO_TIMING_OPTIONS,
    'Amplitude LFO timing feel',
    value => updateLfoPatternField(pattern.id, 'timingFeel', value),
  ));

  const nameRow = document.createElement('label');
  nameRow.className = 'synth-slider';
  const nameTop = document.createElement('div');
  nameTop.className = 'synth-slider-top';
  const nameLabel = document.createElement('span');
  nameLabel.textContent = 'Name';
  nameTop.appendChild(nameLabel);
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.value = pattern.name;
  nameInput.setAttribute('aria-label', 'LFO pattern name');
  nameInput.addEventListener('input', () => updateLfoPatternName(pattern.id, nameInput.value));
  nameRow.append(nameTop, nameInput);
  controlsGrid.appendChild(nameRow);

  const saveNewLfoBtn = document.createElement('button');
  saveNewLfoBtn.type = 'button';
  saveNewLfoBtn.className = 'mini-action-btn';
  saveNewLfoBtn.textContent = '+ Save as new LFO pattern';
  saveNewLfoBtn.title = 'Save current LFO pattern settings as a new named pattern';
  saveNewLfoBtn.addEventListener('click', () => addLfoPatternFromCurrent(pattern.id));
  controlsGrid.appendChild(saveNewLfoBtn);

  const enabledRow = document.createElement('label');
  enabledRow.className = 'checkbox-inline synth-toggle';
  const enabledInput = document.createElement('input');
  enabledInput.type = 'checkbox';
  enabledInput.checked = Boolean(pattern.enabled);
  enabledInput.addEventListener('change', () => updateLfoPatternField(pattern.id, 'enabled', enabledInput.checked));
  enabledRow.append(enabledInput, document.createTextNode('Enabled'));
  controlsGrid.appendChild(enabledRow);

  [
    { key: 'depth', label: 'Depth', format: value => `${Math.round(value * 100)}%` },
    { key: 'smoothing', label: 'Smooth', format: value => `${Math.round(value * 100)}%` },
    { key: 'phase', label: 'Phase', format: value => `${Math.round(value * 100)}%` },
  ].forEach(field => {
    const row = document.createElement('label');
    row.className = 'synth-slider';
    const top = document.createElement('div');
    top.className = 'synth-slider-top';
    const label = document.createElement('span');
    label.textContent = field.label;
    const value = document.createElement('span');
    value.className = 'synth-slider-value';
    value.textContent = field.format(pattern[field.key]);
    top.append(label, value);
    const input = document.createElement('input');
    input.type = 'range';
    input.min = '0';
    input.max = '1';
    input.step = '0.01';
    input.value = String(pattern[field.key]);
    input.setAttribute('aria-label', `LFO pattern ${field.key}`);
    input.addEventListener('input', () => {
      value.textContent = field.format(Number(input.value));
      updateLfoPatternField(pattern.id, field.key, input.value);
    });
    row.append(top, input);
    controlsGrid.appendChild(row);
  });

  card.append(header, controlsGrid);
  card.appendChild(buildLfoCustomShapeEditor(pattern));
  return card;
}

function buildSynthCard(kind) {
  const synth = kind === 'bass' ? song.bassSynth : kind === 'string' ? song.stringSynth : song.chordSynth;
  const presetOptions = kind === 'bass' ? BASS_SOUND_PRESETS : kind === 'string' ? STRING_SOUND_PRESETS : CHORD_SOUND_PRESETS;
  const expanded = synthPanelExpanded[kind] !== false;

  const card = document.createElement('section');
  card.id = `synth-panel-${kind}`;
  card.className = `synth-card synth-card-${kind}`;
  if (!expanded) card.classList.add('collapsed');

  const header = document.createElement('div');
  header.className = 'synth-card-header';

  const titleWrap = document.createElement('div');
  titleWrap.className = 'synth-title-wrap';
  const title = document.createElement('h2');
  title.textContent = kind === 'bass' ? 'Bass synth' : kind === 'string' ? 'String synth' : 'Chord synth';
  const subtitle = document.createElement('p');
  subtitle.className = 'synth-subtitle';
  subtitle.textContent = kind === 'string'
    ? '4 osc • transpose • ADSR • multi-pole filter • delay • drive • mod • tone • reverb'
    : '2 osc • transpose • ADSR • multi-pole filter • delay • drive • mod • tone • reverb';
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
  } else if (kind === 'string') {
    const stringToggle = document.createElement('label');
    stringToggle.className = 'checkbox-inline synth-toggle';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = Boolean(song.stringEnabled);
    checkbox.addEventListener('change', () => setStringEnabled(checkbox.checked));
    stringToggle.append(checkbox, document.createTextNode('Enabled'));
    controls.appendChild(stringToggle);

    const pitchModeLabel = document.createElement('label');
    pitchModeLabel.className = 'synth-select-row';
    const pitchModeText = document.createElement('span');
    pitchModeText.textContent = 'Pitch mode';
    const pitchModeSelect = document.createElement('select');
    pitchModeSelect.setAttribute('aria-label', 'String pitch mode');
    [
      { value: 'linked', label: 'Linked (follow chord)' },
      { value: 'free', label: 'Free (independent string)' },
    ].forEach(option => {
      const element = document.createElement('option');
      element.value = option.value;
      element.textContent = option.label;
      pitchModeSelect.appendChild(element);
    });
    pitchModeSelect.value = song.stringPitchMode || 'linked';
    pitchModeSelect.addEventListener('change', () => setStringPitchMode(pitchModeSelect.value));
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
    if (kind === 'string') {
      controlsGrid.appendChild(buildSynthSelectControl(
        'Osc 3 Wave',
        synth.osc3Type,
        OSC_TYPES,
        'string oscillator 3 waveform',
        value => updateSynthWaveform(kind, 'osc3Type', value),
      ));
      controlsGrid.appendChild(buildSynthSelectControl(
        'Osc 4 Wave',
        synth.osc4Type,
        OSC_TYPES,
        'string oscillator 4 waveform',
        value => updateSynthWaveform(kind, 'osc4Type', value),
      ));
    }
    controlsGrid.appendChild(buildSynthSelectControl(
      'Filter slope',
      String(normalizeFilterPoles(synth.filterPoles, 1)),
      FILTER_POLE_OPTIONS.map(option => ({ value: String(option.value), label: option.label })),
      `${kind} filter slope`,
      value => updateSynthSelectField(kind, 'filterPoles', value),
    ));
    controlsGrid.appendChild(buildSynthSelectControl(
      'Delay time',
      String(normalizeDelaySubdivision(synth.delaySubdivisionBeats, 0.5)),
      DELAY_SUBDIVISION_OPTIONS.map(option => ({ value: String(option.value), label: option.label })),
      `${kind} delay subdivision`,
      value => updateSynthSelectField(kind, 'delaySubdivisionBeats', value),
    ));
    controlsGrid.appendChild(buildSynthSelectControl(
      'Delay feel',
      normalizeDelayFeel(synth.delayFeel, 'straight'),
      DELAY_FEEL_OPTIONS.map(option => ({ value: option.value, label: option.label })),
      `${kind} delay feel`,
      value => updateSynthSelectField(kind, 'delayFeel', value),
    ));
    SYNTH_UI_FIELDS.forEach(field => controlsGrid.appendChild(buildSynthSlider(kind, synth, field)));
    controlsGrid.appendChild(buildReverbSlider(kind));
    controlsGrid.appendChild(buildFilterLfoControls(kind, synth));

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
    const normalizedOption = typeof optionValue === 'object' && optionValue !== null
      ? optionValue
      : { value: optionValue, label: optionValue };
    const option = document.createElement('option');
    option.value = String(normalizedOption.value);
    option.textContent = normalizedOption.label;
    select.appendChild(option);
  });
  select.value = String(currentValue);
  select.addEventListener('change', () => onChange(select.value));
  row.append(top, select);
  return row;
}

function buildReverbSlider(kind) {
  const key = kind === 'bass' ? 'bassWet' : kind === 'string' ? 'stringWet' : 'chordWet';
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

function buildFilterLfoControls(kind, synth) {
  const wrap = document.createElement('div');
  wrap.className = 'synth-slider filter-lfo-controls';
  wrap.style.gridColumn = '1 / -1';

  const top = document.createElement('div');
  top.className = 'synth-slider-top';
  const label = document.createElement('span');
  label.textContent = 'Filter LFO';

  const enabledLabel = document.createElement('label');
  enabledLabel.className = 'checkbox-inline';
  const enabledInput = document.createElement('input');
  enabledInput.type = 'checkbox';
  enabledInput.checked = Boolean(synth.filterLfoEnabled);
  enabledInput.setAttribute('aria-label', `${kind} filter LFO enabled`);
  enabledInput.addEventListener('change', () => {
    updateSynthFilterLfoField(kind, 'filterLfoEnabled', enabledInput.checked);
    depthInput.disabled = !enabledInput.checked;
    depthValue.style.opacity = enabledInput.checked ? '' : '0.4';
  });
  enabledLabel.append(enabledInput, document.createTextNode('On'));
  top.append(label, enabledLabel);

  const depthRow = document.createElement('div');
  depthRow.style.display = 'flex';
  depthRow.style.alignItems = 'center';
  depthRow.style.gap = '0.5rem';
  const depthLabel = document.createElement('span');
  depthLabel.textContent = 'Depth';
  depthLabel.style.fontSize = '0.75rem';
  depthLabel.style.color = 'var(--text-muted)';
  const depthValue = document.createElement('span');
  depthValue.className = 'synth-slider-value';
  depthValue.textContent = `${Math.round(synth.filterLfoDepth * 100)}%`;
  if (!synth.filterLfoEnabled) depthValue.style.opacity = '0.4';
  const depthInput = document.createElement('input');
  depthInput.type = 'range';
  depthInput.min = '0';
  depthInput.max = '1';
  depthInput.step = '0.01';
  depthInput.value = String(synth.filterLfoDepth);
  depthInput.disabled = !synth.filterLfoEnabled;
  depthInput.style.flex = '1';
  depthInput.setAttribute('aria-label', `${kind} filter LFO depth`);
  depthInput.addEventListener('input', () => {
    depthValue.textContent = `${Math.round(Number(depthInput.value) * 100)}%`;
    updateSynthFilterLfoField(kind, 'filterLfoDepth', depthInput.value);
  });
  depthRow.append(depthLabel, depthInput, depthValue);

  wrap.append(top, depthRow);
  return wrap;
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
  const isSong = (song.playbackMode || 'edit') === 'song';
  const isLooping = (song.playbackMode || 'edit') === 'looping';
  const editHelp = document.getElementById('playback-help-edit');
  const songHelp = document.getElementById('playback-help-song');
  const loopingHelp = document.getElementById('playback-help-looping');
  if (editHelp) editHelp.style.display = isEdit ? 'block' : 'none';
  if (songHelp) songHelp.style.display = isSong ? 'block' : 'none';
  if (loopingHelp) loopingHelp.style.display = isLooping ? 'block' : 'none';
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
  const stringRootElement = document.getElementById('string-root-' + chordId);
  const stringOffsetElement = document.getElementById('string-offset-' + chordId);
  const qualityElement = document.getElementById('qual-' + chordId);
  const beatsElement = document.getElementById('beats-' + chordId);
  const startBeatElement = document.getElementById('start-beat-' + chordId);
  const chordRepeatElement = document.getElementById('chord-repeat-' + chordId);
  const bassRepeatElement = document.getElementById('bass-repeat-' + chordId);
  const stringRepeatElement = document.getElementById('string-repeat-' + chordId);
  const noteCountElement = document.getElementById('note-count-' + chordId);
  const loopEnabledElement = document.getElementById('loop-enabled-' + chordId);
  const arpModeElement = document.getElementById('arp-mode-' + chordId);
  const drumPatternElement = document.getElementById('drum-pattern-' + chordId);
  const lfoPatternElement = document.getElementById('lfo-pattern-' + chordId);
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
  const stringRoot = getChordStringRoot(chord);
  if (stringRootElement) stringRootElement.textContent = `String ${noteName(stringRoot)}`;
  if (stringOffsetElement) {
    const offset = formatPitchOffset(stringRoot);
    stringOffsetElement.textContent = offset || 'Base';
  }
  if (qualityElement) {
    qualityElement.textContent = chord.type;
    qualityElement.title = chordTypeObj(chord.type).label;
  }
  if (beatsElement) beatsElement.value = chord.beats || 4;
  if (startBeatElement) startBeatElement.value = String(normalizeStartBeat(chord.startBeat, 1));
  if (chordRepeatElement) chordRepeatElement.value = String(chord.chordRepeat || 1);
  if (bassRepeatElement) bassRepeatElement.value = String(chord.bassRepeat || 1);
  if (stringRepeatElement) stringRepeatElement.value = String(chord.stringRepeat || chord.chordRepeat || 1);
  if (noteCountElement) noteCountElement.value = String(clampInt(chord.noteCount, chordTypeObj(chord.type).intervals.length, 1, 16));
  if (loopEnabledElement) loopEnabledElement.checked = Boolean(chord.loopEnabled);
  if (arpModeElement) arpModeElement.value = ARP_MODES.includes(chord.arpMode) ? chord.arpMode : 'off';
  if (drumPatternElement) drumPatternElement.value = getChordDrumPatternId(chord, getDefaultDrumPatternId()) || '';
  if (lfoPatternElement) lfoPatternElement.value = getChordLfoPatternId(chord, getDefaultLfoPatternId()) || '';
  [
    { part: 'chords', field: 'chordsIn' },
    { part: 'bass', field: 'bassIn' },
    { part: 'drums', field: 'drumsIn' },
    { part: 'strings', field: 'stringsIn' },
  ].forEach(({ part, field }) => {
    const btn = document.getElementById(`part-in-${part}-${chordId}`);
    if (!btn) return;
    const isIn = chord[field] !== false;
    btn.classList.toggle('active', isIn);
    btn.setAttribute('aria-pressed', String(isIn));
    btn.title = `${part.charAt(0).toUpperCase() + part.slice(1)} ${isIn ? 'In (click to mute for this chord)' : 'Out (click to unmute for this chord)'}`;
  });
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
  container.id = 'section-' + section.id;
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
  radio.setAttribute('aria-label', `Edit section ${section.name || section.type}`);
  radio.checked = song.selectedSectionId === section.id;
  radio.addEventListener('change', () => selectEditSection(section.id));
  const radioText = document.createElement('span');
  radioText.textContent = 'Edit Section';
  playSelect.append(radio, radioText);

  const actions = document.createElement('div');
  actions.className = 'section-header-actions';
  const copyButton = document.createElement('button');
  copyButton.type = 'button';
  copyButton.className = 'mini-action-btn';
  copyButton.textContent = 'Copy Section';
  copyButton.title = 'Copy this section';
  copyButton.setAttribute('aria-label', 'Copy this section');
  copyButton.addEventListener('click', () => copySectionConfiguration(section.id));

  const pasteSettingsButton = document.createElement('button');
  pasteSettingsButton.type = 'button';
  pasteSettingsButton.className = 'mini-action-btn';
  pasteSettingsButton.textContent = 'Paste Settings';
  pasteSettingsButton.dataset.requiresSectionCopy = 'true';
  pasteSettingsButton.dataset.titleEnabled = 'Paste copied section settings (keeps this section name and chord roots/types)';
  pasteSettingsButton.dataset.titleEmpty = 'Copy a section first';
  pasteSettingsButton.title = pasteSettingsButton.dataset.titleEnabled;
  pasteSettingsButton.setAttribute('aria-label', 'Paste copied section settings');
  pasteSettingsButton.addEventListener('click', () => pasteSectionSettings(section.id));

  const pasteAllButton = document.createElement('button');
  pasteAllButton.type = 'button';
  pasteAllButton.className = 'mini-action-btn';
  pasteAllButton.textContent = 'Paste All';
  pasteAllButton.dataset.requiresSectionCopy = 'true';
  pasteAllButton.dataset.titleEnabled = 'Paste all copied section data (replaces this section chords/settings)';
  pasteAllButton.dataset.titleEmpty = 'Copy a section first';
  pasteAllButton.title = pasteAllButton.dataset.titleEnabled;
  pasteAllButton.setAttribute('aria-label', 'Paste all copied section data');
  pasteAllButton.addEventListener('click', () => pasteSectionAll(section.id));

  const pasteNewButton = document.createElement('button');
  pasteNewButton.type = 'button';
  pasteNewButton.className = 'mini-action-btn';
  pasteNewButton.textContent = 'Paste as New';
  pasteNewButton.dataset.requiresSectionCopy = 'true';
  pasteNewButton.dataset.titleEnabled = 'Insert copied section as a new section after this one';
  pasteNewButton.dataset.titleEmpty = 'Copy a section first';
  pasteNewButton.title = pasteNewButton.dataset.titleEnabled;
  pasteNewButton.setAttribute('aria-label', 'Paste copied section as new section');
  pasteNewButton.addEventListener('click', () => pasteSectionAsNewSection(section.id));

  const upButton = makeIconBtn('↑', 'Move section up', () => moveSectionUp(section.id));
  const downButton = makeIconBtn('↓', 'Move section down', () => moveSectionDown(section.id));
  const removeButton = makeIconBtn('✕', 'Remove section', () => removeSection(section.id));
  removeButton.classList.add('danger');
  actions.append(copyButton, pasteSettingsButton, pasteAllButton, pasteNewButton, upButton, downButton, removeButton);

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

  const drumPatternHint = document.createElement('span');
  drumPatternHint.className = 'section-drum-pattern-field';
  drumPatternHint.textContent = 'Drums per chord below';

  const beatsSummary = document.createElement('span');
  beatsSummary.className = 'section-beat-summary';
  beatsSummary.textContent = `${getSectionBeatLength(section)} beats total`;

  row.append(crashLabel, rollLabel, drumPatternHint, beatsSummary);
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
  block.addEventListener('click', () => {
    if ((song.playbackMode || 'edit') === 'looping') setActiveLoopTarget(section.id, chord.id, { retargetPlayback: isBeating });
    focusNoteEditorForChord(section.id, chord.id, laneType === 'bass' ? 'bass' : 'chord');
  });

  return block;
}

function focusNoteEditorForChord(sectionId, chordId, kind) {
  setActivePitchTarget(sectionId, chordId, kind);
  if (song.selectedSectionId !== sectionId) selectEditSection(sectionId);
  const card = document.getElementById('chord-card-' + chordId);
  if (!card) return;
  const selector = kind === 'bass'
    ? '.ctrl-row[data-note-editor-kind="bass"] .arrow-btn:not(:disabled)'
    : kind === 'string'
      ? '.ctrl-row[data-note-editor-kind="string"] .arrow-btn:not(:disabled)'
    : '.ctrl-row[data-note-editor-kind="chord"] .arrow-btn:not(:disabled)';
  const target = card.querySelector(selector) || document.getElementById(
    kind === 'bass' ? 'bass-preset-select' : kind === 'string' ? 'string-preset-select' : 'chord-preset-select',
  );
  if (target && typeof target.focus === 'function') target.focus();
}

function handlePitchArrowKey(event) {
  if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  const activeElement = document.activeElement;
  if (activeElement && activeElement.closest && activeElement.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]')) return;
  const target = getActivePitchTarget();
  if (!target) return;
  event.preventDefault();
  if (target.kind === 'bass') {
    if (event.key === 'ArrowUp') bassPitchUp(target.sectionId, target.chordId);
    else bassPitchDown(target.sectionId, target.chordId);
    return;
  }
  if (target.kind === 'string') {
    if (event.key === 'ArrowUp') stringPitchUp(target.sectionId, target.chordId);
    else stringPitchDown(target.sectionId, target.chordId);
    return;
  }
  if (event.key === 'ArrowUp') noteUp(target.sectionId, target.chordId);
  else noteDown(target.sectionId, target.chordId);
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
  card.addEventListener('click', event => {
    if (
      (song.playbackMode || 'edit') === 'looping'
      && !event.target?.closest?.('button, input, select, label')
    ) {
      setActiveLoopTarget(sectionId, chord.id, { retargetPlayback: isBeating });
    }
    if (event.target?.closest?.('.ctrl-row[data-note-editor-kind="bass"]')) {
      setActivePitchTarget(sectionId, chord.id, 'bass');
      return;
    }
    if (event.target?.closest?.('.ctrl-row[data-note-editor-kind="string"]')) {
      setActivePitchTarget(sectionId, chord.id, 'string');
      return;
    }
    setActivePitchTarget(sectionId, chord.id, 'chord');
  });

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

  const stringRoot = getChordStringRoot(chord);
  const stringRootElement = document.createElement('div');
  stringRootElement.className = 'chord-bass-root';
  stringRootElement.id = 'string-root-' + chord.id;
  stringRootElement.textContent = `String ${noteName(stringRoot)}`;

  const stringOffsetElement = document.createElement('div');
  stringOffsetElement.className = 'chord-bass-offset';
  stringOffsetElement.id = 'string-offset-' + chord.id;
  stringOffsetElement.textContent = formatPitchOffset(stringRoot) || 'Base';

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
    {
      disabled: (song.bassPitchMode || 'linked') !== 'free',
      disabledTitle: 'Enable Free bass mode to adjust bass pitch',
    },
  );
  bassRow.dataset.noteEditorKind = 'bass';
  bassRow.addEventListener('click', () => focusNoteEditorForChord(sectionId, chord.id, 'bass'));
  const stringRow = buildCtrlRow(
    'String',
    () => stringPitchUp(sectionId, chord.id),
    () => stringPitchDown(sectionId, chord.id),
    'String note up',
    'String note down',
    {
      disabled: (song.stringPitchMode || 'linked') !== 'free',
      disabledTitle: 'Enable Free string mode to adjust string pitch',
    },
  );
  stringRow.dataset.noteEditorKind = 'string';
  stringRow.addEventListener('click', () => focusNoteEditorForChord(sectionId, chord.id, 'string'));
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

  const noteCountRow = document.createElement('div');
  noteCountRow.className = 'beats-row';
  const noteCountLabel = document.createElement('label');
  noteCountLabel.textContent = 'Notes';
  noteCountLabel.setAttribute('for', 'note-count-' + chord.id);
  const noteCountSelect = document.createElement('select');
  noteCountSelect.id = 'note-count-' + chord.id;
  noteCountSelect.className = 'repeat-select';
  noteCountSelect.setAttribute('aria-label', 'Chord note count');
  CHORD_NOTE_COUNT_OPTIONS.forEach(value => {
    const option = document.createElement('option');
    option.value = String(value);
    option.textContent = String(value);
    if (value === clampInt(chord.noteCount, chordTypeObj(chord.type).intervals.length, 1, 16)) option.selected = true;
    noteCountSelect.appendChild(option);
  });
  noteCountSelect.addEventListener('change', () => updateChordNoteCount(sectionId, chord.id, noteCountSelect.value));
  noteCountRow.append(noteCountLabel, noteCountSelect);

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

  const stringRepeatLabel = document.createElement('label');
  stringRepeatLabel.textContent = 'String x';
  stringRepeatLabel.setAttribute('for', 'string-repeat-' + chord.id);
  const stringRepeatSelect = document.createElement('select');
  stringRepeatSelect.id = 'string-repeat-' + chord.id;
  stringRepeatSelect.className = 'repeat-select';
  NOTE_REPEAT_OPTIONS.forEach(value => {
    const option = document.createElement('option');
    option.value = String(value);
    option.textContent = String(value);
    if (value === (chord.stringRepeat || chord.chordRepeat || 1)) option.selected = true;
    stringRepeatSelect.appendChild(option);
  });
  stringRepeatSelect.addEventListener('change', () => updateStringRepeat(sectionId, chord.id, stringRepeatSelect.value));

  const chordRepeatWrap = document.createElement('div');
  chordRepeatWrap.className = 'repeat-field';
  chordRepeatWrap.append(chordRepeatLabel, chordRepeatSelect);

  const bassRepeatWrap = document.createElement('div');
  bassRepeatWrap.className = 'repeat-field';
  bassRepeatWrap.append(bassRepeatLabel, bassRepeatSelect);

  const stringRepeatWrap = document.createElement('div');
  stringRepeatWrap.className = 'repeat-field';
  stringRepeatWrap.append(stringRepeatLabel, stringRepeatSelect);

  repeatRow.append(chordRepeatWrap, bassRepeatWrap, stringRepeatWrap);

  const articulationRow = document.createElement('div');
  articulationRow.className = 'repeat-row';

  const loopWrap = document.createElement('label');
  loopWrap.className = 'checkbox-inline chord-loop-toggle';
  const loopEnabledInput = document.createElement('input');
  loopEnabledInput.type = 'checkbox';
  loopEnabledInput.id = 'loop-enabled-' + chord.id;
  loopEnabledInput.checked = Boolean(chord.loopEnabled);
  loopEnabledInput.setAttribute('aria-label', 'Loop this chord in looping mode');
  loopEnabledInput.addEventListener('change', () => updateChordLoopEnabled(sectionId, chord.id, loopEnabledInput.checked));
  loopWrap.append(loopEnabledInput, document.createTextNode('Loop'));

  const arpModeWrap = document.createElement('div');
  arpModeWrap.className = 'repeat-field';
  const arpModeLabel = document.createElement('label');
  arpModeLabel.textContent = 'Arp';
  arpModeLabel.setAttribute('for', 'arp-mode-' + chord.id);
  const arpModeSelect = document.createElement('select');
  arpModeSelect.id = 'arp-mode-' + chord.id;
  arpModeSelect.className = 'repeat-select';
  ARP_MODE_OPTIONS.forEach(optionConfig => {
    const option = document.createElement('option');
    option.value = optionConfig.value;
    option.textContent = optionConfig.text;
    if ((chord.arpMode || 'off') === optionConfig.value) option.selected = true;
    arpModeSelect.appendChild(option);
  });
  arpModeSelect.addEventListener('change', () => updateChordArpMode(sectionId, chord.id, arpModeSelect.value));
  arpModeWrap.append(arpModeLabel, arpModeSelect);

  articulationRow.append(loopWrap, arpModeWrap);

  const drumPatternRow = document.createElement('div');
  drumPatternRow.className = 'chord-inline-row';

  const drumPatternWrap = document.createElement('div');
  drumPatternWrap.className = 'repeat-field';
  const drumPatternLabel = document.createElement('label');
  drumPatternLabel.textContent = 'Drums';
  drumPatternLabel.setAttribute('for', 'drum-pattern-' + chord.id);
  const drumPatternSelect = document.createElement('select');
  drumPatternSelect.id = 'drum-pattern-' + chord.id;
  drumPatternSelect.className = 'repeat-select';
  drumPatternSelect.setAttribute('aria-label', 'Drum pattern for this chord');
  (song.drumPatterns || []).forEach(pattern => {
    const option = document.createElement('option');
    option.value = pattern.id;
    option.textContent = pattern.name;
    if (pattern.id === getChordDrumPatternId(chord, getDefaultDrumPatternId())) option.selected = true;
    drumPatternSelect.appendChild(option);
  });
  drumPatternSelect.addEventListener('change', () => updateChordDrumPattern(sectionId, chord.id, drumPatternSelect.value));
  drumPatternWrap.append(drumPatternLabel, drumPatternSelect);

  const drumPatternActions = document.createElement('div');
  drumPatternActions.className = 'mini-action-group';

  const copyDrumButton = document.createElement('button');
  copyDrumButton.type = 'button';
  copyDrumButton.className = 'mini-action-btn';
  copyDrumButton.textContent = 'Copy';
  copyDrumButton.title = 'Copy this chord drum pattern';
  copyDrumButton.setAttribute('aria-label', 'Copy this chord drum pattern');
  copyDrumButton.addEventListener('click', () => copyDrumPatternFromChord(sectionId, chord.id));

  const pasteDrumButton = document.createElement('button');
  pasteDrumButton.type = 'button';
  pasteDrumButton.className = 'mini-action-btn';
  pasteDrumButton.textContent = 'Paste';
  pasteDrumButton.title = 'Paste the copied drum pattern into this chord drum pattern';
  pasteDrumButton.setAttribute('aria-label', 'Paste the copied drum pattern into this chord drum pattern');
  pasteDrumButton.addEventListener('click', () => pasteDrumPatternToChord(sectionId, chord.id));

  drumPatternActions.append(copyDrumButton, pasteDrumButton);
  drumPatternRow.append(drumPatternWrap, drumPatternActions);

  const lfoPatternRow = document.createElement('div');
  lfoPatternRow.className = 'repeat-row';
  const buildLfoSelectField = (labelText, controlId, kind) => {
    const wrap = document.createElement('div');
    wrap.className = 'repeat-field';
    const label = document.createElement('label');
    label.textContent = labelText;
    label.setAttribute('for', controlId);
    const select = document.createElement('select');
    select.id = controlId;
    select.className = 'repeat-select';
    select.setAttribute('aria-label', `${labelText} pattern for this chord`);
    (song.lfoPatterns || []).forEach(pattern => {
      const option = document.createElement('option');
      option.value = pattern.id;
      option.textContent = pattern.name;
      if (pattern.id === getChordPartLfoPatternId(chord, kind, getDefaultLfoPatternId())) option.selected = true;
      select.appendChild(option);
    });
    select.addEventListener('change', () => updateChordLfoPattern(sectionId, chord.id, kind, select.value));
    wrap.append(label, select);
    return wrap;
  };
  lfoPatternRow.append(
    buildLfoSelectField('Chord LFO', 'lfo-pattern-chord-' + chord.id, 'chord'),
    buildLfoSelectField('Bass LFO', 'lfo-pattern-bass-' + chord.id, 'bass'),
    buildLfoSelectField('String LFO', 'lfo-pattern-string-' + chord.id, 'string'),
  );

  const lfoPatternActions = document.createElement('div');
  lfoPatternActions.className = 'mini-action-group';

  const copyLfoButton = document.createElement('button');
  copyLfoButton.type = 'button';
  copyLfoButton.className = 'mini-action-btn';
  copyLfoButton.textContent = 'Copy';
  copyLfoButton.title = 'Copy this chord amplitude LFO pattern';
  copyLfoButton.setAttribute('aria-label', 'Copy this chord amplitude LFO pattern');
  copyLfoButton.addEventListener('click', () => copyLfoPatternFromChord(sectionId, chord.id));

  const pasteLfoButton = document.createElement('button');
  pasteLfoButton.type = 'button';
  pasteLfoButton.className = 'mini-action-btn';
  pasteLfoButton.textContent = 'Paste';
  pasteLfoButton.title = 'Paste the copied amplitude LFO pattern into this chord pattern';
  pasteLfoButton.setAttribute('aria-label', 'Paste the copied amplitude LFO pattern into this chord pattern');
  pasteLfoButton.addEventListener('click', () => pasteLfoPatternToChord(sectionId, chord.id));

  lfoPatternActions.append(copyLfoButton, pasteLfoButton);
  const lfoRowWrap = document.createElement('div');
  lfoRowWrap.className = 'chord-inline-row';
  lfoRowWrap.append(lfoPatternRow, lfoPatternActions);

  const partToggleRow = document.createElement('div');
  partToggleRow.className = 'part-toggle-row';
  [
    { part: 'chords', label: 'Chords', field: 'chordsIn' },
    { part: 'bass', label: 'Bass', field: 'bassIn' },
    { part: 'drums', label: 'Drums', field: 'drumsIn' },
    { part: 'strings', label: 'Strings', field: 'stringsIn' },
  ].forEach(({ part, label, field }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = `part-in-${part}-${chord.id}`;
    btn.className = 'part-in-btn' + (chord[field] !== false ? ' active' : '');
    btn.textContent = label;
    btn.title = `${label} ${chord[field] !== false ? 'In (click to mute for this chord)' : 'Out (click to unmute for this chord)'}`;
    btn.setAttribute('aria-label', `Toggle ${label} for this chord`);
    btn.setAttribute('aria-pressed', String(chord[field] !== false));
    btn.addEventListener('click', () => {
      const currentVal = btn.classList.contains('active');
      setChordPartIn(sectionId, chord.id, part, !currentVal);
    });
    partToggleRow.appendChild(btn);
  });

  const actionBar = document.createElement('div');
  actionBar.className = 'chord-action-bar';

  const auditionButton = document.createElement('button');
  auditionButton.className = 'audition-btn';
  auditionButton.textContent = '♫';
  auditionButton.title = 'Play chord';
  auditionButton.setAttribute('aria-label', 'Play chord');
  auditionButton.addEventListener('click', () => auditionChord(chord.root, chord.type));

  const copyChordButton = document.createElement('button');
  copyChordButton.type = 'button';
  copyChordButton.className = 'mini-action-btn';
  copyChordButton.textContent = 'Copy';
  copyChordButton.title = 'Copy this chord configuration';
  copyChordButton.setAttribute('aria-label', 'Copy this chord configuration');
  copyChordButton.addEventListener('click', () => copyChordConfiguration(sectionId, chord.id));

  const pasteChordButton = document.createElement('button');
  pasteChordButton.type = 'button';
  pasteChordButton.className = 'mini-action-btn';
  pasteChordButton.textContent = 'Paste';
  pasteChordButton.title = 'Paste the copied chord configuration';
  pasteChordButton.setAttribute('aria-label', 'Paste the copied chord configuration');
  pasteChordButton.addEventListener('click', () => pasteChordConfiguration(sectionId, chord.id));

  const removeButton = document.createElement('button');
  removeButton.className = 'remove-chord-btn';
  removeButton.textContent = '✕';
  removeButton.title = 'Remove chord';
  removeButton.setAttribute('aria-label', 'Remove chord');
  removeButton.addEventListener('click', () => removeChord(sectionId, chord.id));

  actionBar.append(auditionButton, copyChordButton, pasteChordButton, removeButton);
  card.append(
    rootElement,
    offsetElement,
    bassRootElement,
    bassOffsetElement,
    stringRootElement,
    stringOffsetElement,
    qualityElement,
    divider1,
    noteRow,
    bassRow,
    stringRow,
    typeRow,
    transposeRow,
    divider2,
    beatsRow,
    startBeatRow,
    noteCountRow,
    repeatRow,
    articulationRow,
    drumPatternRow,
    lfoRowWrap,
    partToggleRow,
    actionBar,
  );
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
    upButton.title = options.disabledTitle || 'Control unavailable';
  }
  upButton.addEventListener('click', onUp);

  const downButton = document.createElement('button');
  downButton.className = 'arrow-btn';
  downButton.textContent = '▼';
  downButton.title = downTitle;
  downButton.setAttribute('aria-label', downTitle);
  if (options.disabled) {
    downButton.disabled = true;
    downButton.title = options.disabledTitle || 'Control unavailable';
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
  document.querySelectorAll('.arrangement-block.loop-target, .chord-card.loop-target').forEach(element => element.classList.remove('loop-target'));
  const loopTarget = getActiveLoopTarget();
  if (loopTarget) {
    document.getElementById(`arrangement-chords-${loopTarget.chordId}`)?.classList.add('loop-target');
    document.getElementById(`arrangement-bass-${loopTarget.chordId}`)?.classList.add('loop-target');
    document.getElementById(`chord-card-${loopTarget.chordId}`)?.classList.add('loop-target');
  }
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
  stopIndicatorFlash();
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

function getCurrentPlaybackPoint() {
  const section = song.sections[playbackCursor.sectionIndex];
  const chord = section?.chords?.[playbackCursor.chordIndex];
  return {
    sectionName: section?.name || '—',
    sectionIndex: playbackCursor.sectionIndex,
    chordName: chord ? `${formatPitchLabel(chord.root)}${chord.type}` : '—',
    chordIndex: playbackCursor.chordIndex,
    beatInChord: playbackCursor.beatInChord + 1,
    chordBeats: chord?.beats || 0,
  };
}

function buildDebugSnapshotText() {
  const point = getCurrentPlaybackPoint();
  const mode = song.playbackMode || 'edit';
  const ctxState = audioCtx ? audioCtx.state : 'not-created';
  return [
    `time=${new Date().toISOString()}`,
    `transport isBeating=${isBeating} mode=${mode} bpm=${song.bpm}`,
    `scheduler timerActive=${schedulerTimer !== null} nextNoteTime=${nextNoteTime.toFixed(4)} currentStep=${currentStep}`,
    `playback section="${point.sectionName}" sectionIndex=${point.sectionIndex} chord="${point.chordName}" chordIndex=${point.chordIndex} beat=${point.beatInChord}/${point.chordBeats || '—'}`,
    `audioContext state=${ctxState} sampleRate=${audioCtx?.sampleRate || '—'}`,
    `voices active=${activeVoiceCount} trackedAudioNodes=${activeAudioNodes.size}`,
    `counters voicesCreated=${debugState.counters.voicesCreated} voicesEnded=${debugState.counters.voicesEnded} nodeCleanups=${debugState.counters.nodeCleanups} schedulerTicks=${debugState.counters.schedulerTicks}`,
    `chordSynth transpose=${getSynthTranspose(song.chordSynth)} preset=${song.chordSynth?.preset || '—'}`,
    `bassSynth transpose=${getSynthTranspose(song.bassSynth)} preset=${song.bassSynth?.preset || '—'} enabled=${Boolean(song.bassEnabled)}`,
    '',
    '[recent logs]',
    ...(debugState.logs.length ? debugState.logs.slice(-25) : ['(no logs yet)']),
  ].join('\n');
}

function updateDebugPanelOutput() {
  const output = document.getElementById('debug-output');
  if (!output) return;
  output.value = buildDebugSnapshotText();
}

function setDebugPanelOpen(open) {
  debugPanelOpen = Boolean(open);
  const panel = document.getElementById('debug-panel');
  const toggle = document.getElementById('debug-toggle');
  if (!panel || !toggle) return;
  panel.classList.toggle('open', debugPanelOpen);
  panel.hidden = !debugPanelOpen;
  toggle.setAttribute('aria-expanded', String(debugPanelOpen));
  toggle.textContent = debugPanelOpen ? '🐞 Debug ▾' : '🐞 Debug ▸';
  if (debugRefreshTimer !== null) {
    clearInterval(debugRefreshTimer);
    debugRefreshTimer = null;
  }
  if (debugPanelOpen) {
    updateDebugPanelOutput();
    debugRefreshTimer = setInterval(updateDebugPanelOutput, 400);
  }
}

function copyDebugOutput() {
  const output = document.getElementById('debug-output');
  if (!output) return;
  const text = output.value || buildDebugSnapshotText();
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(
      () => debugLog('Debug snapshot copied'),
      () => {
        output.select();
        document.execCommand('copy');
        debugLog('Debug snapshot copied');
      },
    );
    return;
  }
  output.select();
  document.execCommand('copy');
  debugLog('Debug snapshot copied');
}

// =====================================================================
// AUTOSAVE – internal localStorage + optional File System Access API
// =====================================================================

const AUTOSAVE_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
let autosaveFileHandle = null; // FileSystemFileHandle if user granted permission
let autosaveTimer = null;

function internalAutosave() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeSong(song)));
    saveSongToLibrary(song);
    debugLog('Autosaved to localStorage');
  } catch (_) {
    debugLog('Autosave failed (localStorage quota?)', 'warn');
  }
}

async function autosaveToFile() {
  if (!autosaveFileHandle) return;
  try {
    const writable = await autosaveFileHandle.createWritable();
    const json = JSON.stringify(normalizeSong(song), null, 2);
    await writable.write(json);
    await writable.close();
    debugLog('Autosaved to file: ' + autosaveFileHandle.name);
  } catch (err) {
    debugLog('File autosave failed: ' + (err?.message || err), 'warn');
    if (err?.name === 'NotAllowedError') {
      // Permission revoked – clear handle so we don't keep failing
      autosaveFileHandle = null;
      updateAutosaveFileButtonLabel();
    }
  }
}

async function chooseAutosaveFile() {
  if (!window.showSaveFilePicker) {
    alert('Your browser does not support the File System Access API. Use Export JSON for manual saves.');
    return;
  }
  try {
    autosaveFileHandle = await window.showSaveFilePicker({
      suggestedName: (sanitizeFilename(song.title || 'song') || 'song') + '.autosave.chordz.json',
      types: [{ description: 'Chordz JSON', accept: { 'application/json': ['.json'] } }],
    });
    updateAutosaveFileButtonLabel();
    debugLog('Autosave file chosen: ' + autosaveFileHandle.name);
    // Write immediately after choosing
    await autosaveToFile();
  } catch (err) {
    if (err?.name !== 'AbortError') debugLog('File picker error: ' + (err?.message || err), 'warn');
  }
}

function updateAutosaveFileButtonLabel() {
  const btn = document.getElementById('autosave-file-btn');
  if (!btn) return;
  if (autosaveFileHandle) {
    btn.textContent = '💾 Autosave file: ' + autosaveFileHandle.name;
    btn.title = 'Click to change autosave file location';
  } else {
    btn.textContent = '💾 Choose autosave file…';
    btn.title = 'Choose a file to auto-save your song to every 10 minutes (File System Access API)';
  }
}

function runAutosaveCycle() {
  internalAutosave();
  if (autosaveFileHandle) autosaveToFile();
}

function startAutosaveTimer() {
  if (autosaveTimer) clearInterval(autosaveTimer);
  autosaveTimer = setInterval(runAutosaveCycle, AUTOSAVE_INTERVAL_MS);
}

// =====================================================================
// EVENT LISTENERS & BOOT
// =====================================================================

document.addEventListener('DOMContentLoaded', () => {
  loadSong();
  song = normalizeSong(song);
  render();
  debugLog('App loaded');
  document.addEventListener('keydown', handlePitchArrowKey);
  window.addEventListener('error', event => debugLog(`Error: ${event.message}`, 'error'));
  window.addEventListener('unhandledrejection', event => debugLog(`Unhandled rejection: ${event.reason}`, 'error'));

  document.getElementById('debug-toggle').addEventListener('click', () => setDebugPanelOpen(!debugPanelOpen));
  document.getElementById('debug-close').addEventListener('click', () => setDebugPanelOpen(false));
  document.getElementById('debug-refresh').addEventListener('click', updateDebugPanelOutput);
  document.getElementById('debug-copy').addEventListener('click', copyDebugOutput);
  document.getElementById('debug-clear-log').addEventListener('click', () => {
    debugState.logs = [];
    updateDebugPanelOutput();
  });
  setDebugPanelOpen(false);

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
    if (isBeating && usesSongTimelineMode(song.playbackMode)) flushScheduledNotes({ restartPlayback: true });
  });

  document.getElementById('beat-start').addEventListener('click', () => {
    startBeat();
  });
  document.getElementById('beat-pause').addEventListener('click', () => {
    pauseBeat();
  });
  document.getElementById('beat-stop').addEventListener('click', () => {
    stopBeat();
  });

  document.getElementById('transpose-down').addEventListener('click', () => transposeSong(-1));
  document.getElementById('transpose-up').addEventListener('click', () => transposeSong(1));

  document.getElementById('save-btn').addEventListener('click', () => {
    if (!ensureSongTitleForSave()) return;
    saveSong();
    showSaved();
  });
  document.getElementById('project-save-btn').addEventListener('click', saveProjectFile);
  document.getElementById('project-load-btn').addEventListener('click', loadProjectFile);
  document.getElementById('export-btn').addEventListener('click', exportJSON);
  document.getElementById('export-wav-btn').addEventListener('click', exportWAV);
  document.getElementById('export-midi-btn').addEventListener('click', exportMIDI);
  document.getElementById('import-btn').addEventListener('click', importJSON);
  document.getElementById('new-btn').addEventListener('click', resetSong);

  const autosaveFileBtn = document.getElementById('autosave-file-btn');
  if (autosaveFileBtn) {
    autosaveFileBtn.addEventListener('click', chooseAutosaveFile);
    updateAutosaveFileButtonLabel();
  }

  startAutosaveTimer();
  updateTransportControls();

  document.getElementById('add-section-btn').addEventListener('click', () => {
    const type = document.getElementById('section-type-select').value;
    addSection(type);
  });
});

function showSaved() {
  showSavedButtonState('save-btn', '✓ Saved');
}

function showSavedButtonState(buttonId, label = '✓ Saved') {
  const button = document.getElementById(buttonId);
  if (!button) return;
  const original = button.textContent;
  button.textContent = label;
  button.disabled = true;
  setTimeout(() => {
    button.textContent = original;
    button.disabled = false;
  }, 1200);
}
