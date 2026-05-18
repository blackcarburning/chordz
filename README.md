# Chordz – Chord & Song Structure Builder

A browser-based, dependency-free web app for building chord progressions and song structures with a live beat.

## What it does

* **Song sections** – Create and arrange Verse / Chorus / Bridge / Middle 8 / Change / Outro / Custom sections, each with its own chord progression and scale.
* **Chord + bass pitch editor** – Each chord card shows chord root/quality plus bass root. Root and bass arrows step through notes in the selected section scale (octave-aware), while Xpose still transposes by semitone.
* **Full chord palette** – maj, min, 5, 6, m6, 7, maj7, m7, mMaj7, dim, dim7, m7b5, aug, sus2, sus4, add9, 9, m9, maj9, 11, 13.
* **Chord audition** – Click ♫ on any chord card to hear it through a small Web Audio 2-oscillator synth.
* **Scales** – Each section has a configurable scale root and type (Major, Natural Minor, Harmonic Minor, Melodic Minor, Major Pentatonic, Minor Pentatonic, Blues, Dorian, Phrygian, Lydian, Mixolydian, Aeolian, Locrian, Chromatic). The notes in the chosen scale are shown inline.
* **Transposition** – Transpose individual chords or the whole song up/down by semitone without wrapping at 12; note labels stay readable and show octave/semitone offsets when needed.
* **Playback modes** – `Edit` mode loops the selected section (via per-section radio button). `Song` mode plays the full arrangement once from start to finish. `Looping` mode follows the song timeline and loops only chords with Loop enabled.
* **Go to / scrub head** – In Song or Looping mode, jump to any beat position with the timeline slider. Current section/chord/beat is shown live, including arranger slot/repeat context when arranger entries are used.
* **Chord lengths** – Every chord defaults to `4` beats (1 bar) and can be changed to any beat length.
* **Per-segment timing + repeats** – Each chord segment has a `Start` beat selector (`1st`–`4th`) plus independent `Chord x`, `Bass x`, and `String x` repeat selectors (`1`, `2`, `4`, `8`, `16`, `32`) so chord, bass, and string playback can enter later within the block while still subdividing repeats independently.
* **2-oscillator chord + bass synths** – Separate chord and bass synth panels with presets, Osc 1/Osc 2 waveform selection, per-synth transpose, ADSR, multi-pole filter slope/cutoff/resonance, tempo-synced delay (time + straight/dotted/triplet feel + mix/filter/amount), harmonic drive (distortion), simple modulation (rate/depth vibrato), and extra tone controls (Osc2 interval, detune, mix), plus bass enable/disable.
* **Per-chord Loop + Arp controls** – Every chord card has a Loop toggle and an Arp selector (`Off`, `Up`, `Down`, `Up and down`) so loop repetition and arpeggio articulation are independent.
* **Debug panel with copy output** – Open `🐞 Debug` from the header to view live transport/audio diagnostics and copy them for issue reports.
* **Linked / Free bass pitch mode** – Bass synth panel includes a global pitch mode switch: `linked` keeps bass following chord roots; `free` enables independent per-chord bass pitch controls.
* **Collapsible synth controls** – Chord and bass synth panels can be collapsed/expanded to keep the interface tidy without losing settings.
* **Per-instrument reverb wet/dry** – Chord and bass synth cards each include a dedicated reverb wet control so ambience can be shaped independently.
* **Mixer section** – Dedicated mixer controls for chord level, bass level, **drum level**, and overall output level. The Drums slider affects all drum sequencer sounds including crash and roll.

### 🥁 8-Lane Drum Sequencer

Replaces the old preset beat with a fully editable pattern-based drum sequencer:

* **8 drum lanes**: Kick, Snare, Closed Hat, Open Hat, Hi Tom, Mid Tom, Low Tom, Ride. Each produces a distinct Web Audio–generated sound.
* **16th-note grid** (16 steps = 1 bar). Steps loop automatically for section lengths longer than one bar.
* **Click any step button** to toggle it on or off. Beat-group boundaries (every 4 steps) are visually marked.
* **10 nameable pattern slots** – The song stores 10 independent patterns. Switch between them with the **Edit pattern** dropdown in the sequencer panel, then rename using the **Pattern name** field. The first three patterns come with starter grooves (Rock Beat, Funk, Ballad); the remaining seven are blank.
* **Per-section drum pattern assignment** – Each song section has a **Drum pattern** dropdown in its options row. This chooses which of the 10 patterns plays when that section is active.
* **Arranger integration** – Song-mode playback through the arranger uses the pattern assigned to the currently playing section; repeated sections use the same pattern each time.
* **Contained layout** – The sequencer is rendered in its own panel above the synth controls, with horizontal scrolling kept inside the grid area so the page layout stays stable.

* **UI order** – The drum sequencer panel appears above the synth controls for quick access during composition.
* **DAW-style arrangement lanes** – Each section shows chord and bass lanes with beat-proportional blocks and readable minimum widths in a contained horizontal scroll area. Drag blocks to reorder the progression and the chord cards update to match.
* **Draggable arranger** – Add section entries, set repeat counts per entry, and drag to reorder song playback order. Song mode follows arranger entries/repeats when present, and falls back to section order when arranger is empty.
* **Section transitions** – Optional per-section crash cymbal at section start and roll at section end.
* **Song naming + recents** – A song title box is always visible, and an **Open most recent** dropdown lists recent songs with last-updated timestamps.
* **Song export to WAV + MIDI** – Export the full arranged song (including timing/repeats/beat starts/chords/bass/strings/arps/drums) to `.wav` audio or `.mid` MIDI.
* **Persistence** – Songs are saved automatically to browser storage and the most recently edited/opened song is restored on load. Drum patterns (grids, names, and per-chord assignments) are fully persisted in browser storage. Export/import includes song metadata, sections/chords (including bass pitch roots, start beats, per-chord Loop toggles, per-chord Arp mode, and per-chord drum pattern data), bass linked/free mode, drum patterns, drummer volume, chord lengths, chord+bass+string repeats, synth settings (waveforms, transpose, multi-pole filters, tempo-synced delay, distortion, modulation, tone controls), per-instrument reverb, mixer levels, DAW ordering, crash/roll options, arranger order/repeats, playback mode, and sound selections. Older JSON files with section-level drum patterns still load successfully with safe defaults for newer fields.

## Running locally

No build step required – it is a static single-page app.

```bash
# Clone the repository
git clone https://github.com/blackcarburning/chordz.git
cd chordz

# Serve with any static file server, e.g.:
npx serve .
# or:
python3 -m http.server 8080
```

Then open `http://localhost:8080` (or the port shown) in your browser.

For this repository there is no build step or automated test suite. Manual verification is done by serving the files locally and exercising the app in the browser.

Alternatively, open `index.html` directly in a modern browser (Chrome, Firefox, Safari, Edge). Note that some browsers restrict the Web Audio API when the page is loaded via `file://`; using a local server is recommended.

## Hosting on GitHub Pages

Push the repository to GitHub and enable **Settings → Pages → Deploy from branch → main / (root)**.  
The app will be available at `https://<username>.github.io/chordz/`.

## File structure

```
index.html   – app shell and layout
style.css    – dark musical theme, responsive
app.js       – all application logic (no dependencies)
```
