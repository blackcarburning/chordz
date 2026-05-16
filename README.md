# Chordz – Chord & Song Structure Builder

A browser-based, dependency-free web app for building chord progressions and song structures with a live beat.

## What it does

* **Song sections** – Create and arrange Verse / Chorus / Bridge / Middle 8 / Change / Outro / Custom sections, each with its own chord progression and scale.
* **Chord editor** – Each chord card shows the root note and chord quality. Arrow buttons (▲▼) step the root note, cycle the chord type, or transpose the chord.
* **Full chord palette** – maj, min, 5, 6, m6, 7, maj7, m7, mMaj7, dim, dim7, m7b5, aug, sus2, sus4, add9, 9, m9, maj9, 11, 13.
* **Chord audition** – Click ♫ on any chord card to hear it through a small Web Audio 2-oscillator synth.
* **Scales** – Each section has a configurable scale root and type (Major, Natural Minor, Harmonic Minor, Melodic Minor, Major Pentatonic, Minor Pentatonic, Blues, Dorian, Phrygian, Lydian, Mixolydian, Aeolian, Locrian, Chromatic). The notes in the chosen scale are shown inline.
* **Transposition** – Transpose individual chords or the whole song up/down by semitone without wrapping at 12; note labels stay readable and show octave/semitone offsets when needed.
* **Playback modes** – `Edit` mode loops the selected section (via per-section radio button). `Song` mode plays the full arrangement once from start to finish.
* **Go to / scrub head** – In Song mode, jump to any beat position with the timeline slider. Current section/chord/beat is shown live, including arranger slot/repeat context when arranger entries are used.
* **Chord lengths** – Every chord defaults to `4` beats (1 bar) and can be changed to any beat length.
* **Per-segment repeats (chord + bass)** – Each chord segment has `Chord x` and `Bass x` repeat selectors (`1`, `2`, `4`) so you can subdivide the same segment into repeated hits independently for chord and bass.
* **2-oscillator chord + bass synths** – Separate chord and bass synth panels with presets, ADSR, filter cutoff, resonance, oscillator mix/detune defaults, and bass enable/disable.
* **Collapsible synth controls** – Chord and bass synth panels can be collapsed/expanded to keep the interface tidy without losing settings.
* **Per-instrument reverb wet/dry** – Chord and bass synth cards each include a dedicated reverb wet control so ambience can be shaped independently.
* **Mixer section** – Dedicated mixer controls for chord level, bass level, and overall output level.
* **UI order update** – Synth controls appear above the arranger; the arranger panel sits below them for cleaner workflow.
* **DAW-style arrangement lanes** – Each section shows chord and bass lanes with beat-proportional blocks. Drag blocks to reorder the progression and the chord cards update to match.
* **Draggable arranger** – Add section entries, set repeat counts per entry, and drag to reorder song playback order. Song mode follows arranger entries/repeats when present, and falls back to section order when arranger is empty.
* **Section transitions** – Optional per-section crash cymbal at section start and roll at section end.
* **Beat** – A kick/snare/hi-hat beat plays via the Web Audio API at the selected BPM. Adjust BPM with the +/− buttons or type directly.
* **Song naming + recents** – A song title box is always visible, and an **Open most recent** dropdown lists recent songs with last-updated timestamps.
* **Persistence** – Songs are saved automatically to browser storage and the most recently edited/opened song is restored on load. Export/import includes song metadata (title/id/timestamp), sections/chords, chord lengths, chord+bass repeats, synth settings, per-instrument reverb, mixer levels, DAW ordering, crash/roll options, arranger order/repeats, playback mode, and sound selections.

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
