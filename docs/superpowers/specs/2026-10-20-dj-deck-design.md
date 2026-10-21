# DJ Deck — Design Spec

Date: 2026-10-20 (revised: built inside this project as its own page)

## Purpose

A DJ-set page for the Cool Studio website. A visitor with no DJ experience can open it, press start, move a few controls and make music that sounds good. It keeps the core DJ idea: two decks, blended with a crossfader, EQ, filter and effects. Inspired by the live-synthesized, cursor-driven audio on dkton.at (Web Audio synth, pentatonic scale, pointer position mapped to audio parameters).

## Scope

In scope:
- Two decks playing synthesized, step-sequenced tracks.
- Shared master tempo and clock, so decks are always in sync (no beatmatching).
- Beginner-friendly mixer controls (see Controls).
- A standalone page, `dj.html`, built like `studio-intro.html`.

Out of scope (YAGNI): user-uploaded tracks, beat detection, recording/export, MIDI, bundled audio samples, Howler. A `Track` interface keeps room for sample-based tracks later.

## Project fit (from website/CLAUDE.md)

- Stack: vanilla JS, SCSS, GSAP, Parcel. `npm run build` builds `src/*.html`, so a new `src/dj.html` is picked up automatically. nginx already serves extensionless URLs (`/dj` and `/dj.html`).
- Page pattern: same as `studio-intro.html` — own HTML entry, own stylesheet, `<script type="module">`, a "Press to start" screen (browsers block audio until a gesture; do not autostart).
- SCSS: BEM naming (`dj__element--modifier`), reuse variables from `base.scss` (`$orange-bg`, `$font-dark`, `$font-light`, `$red-vintage`, `$yelliw-vintage`, `$pastile-purple`, `$dark-orange`) and the `fluid()` helper and `$bp-phone` breakpoint; fonts from the existing design system (`streetOfRage`, Poppins).
- Browser targets: Safari/iOS 14+, Chrome 87+. Use `window.AudioContext || window.webkitAudioContext`; avoid APIs newer than that range. Do not remove `browserslist`.
- Audio: raw Web Audio (the site does not use Howler).
- Uncommitted work in the tree (`offerSplit.js` and several `.scss` files) is not touched.

## Files

New:
```
website/src/dj.html                      # page entry (Parcel picks it up via src/*.html)
website/src/assets/js/djDeck.js          # page bootstrap + UI wiring
website/src/assets/js/dj/engine.js       # clock, scheduler, master bus, effects
website/src/assets/js/dj/synth.js        # drum, bass, chord and pluck voices
website/src/assets/js/dj/tracks.js       # preset tracks (pattern data)
website/src/assets/js/dj/music.js        # pure helpers: scale/frequency, tempo clamp, crossfade curve
website/src/assets/styles/dj.scss        # page styles, linked from dj.html like studioStory.scss
website/tests/dj/*.test.mjs              # Node checks for the pure logic
```
Modified (minimal): optionally one link to `dj.html` from the main page (see Open decisions). No other existing file changes.

Splitting the engine into small files keeps each unit independently understandable and testable.

## Page flow

1. Load shows a "Press to start" screen (same wording and role as `studio-intro.html`'s start screen).
2. On click, tap or key press: create/resume the AudioContext, remove the overlay, show the mixer.
3. Mixer is usable immediately; both decks are stopped until play is pressed (deck A has a default track preloaded in the selector).
4. Audio pauses when `document.hidden` and resumes on return.
5. Leaving the page needs no cleanup beyond context suspension (standalone page).

## Audio engine

**Clock.** One AudioContext, one master clock. Look-ahead scheduler: a 25 ms `setInterval` schedules events up to ~100 ms ahead using `ctx.currentTime`. 16 steps per bar (16th notes), tempo shared by both decks. Tempo changes affect subsequent steps only (no glitches).

**Key.** A minor pentatonic (A C D E G) for everything, so any pair of tracks is harmonically compatible.

**Track model.**
```js
Track = {
  id, name, style, suggestedBpm,
  layers: { drums, bass, chords, lead }  // each: 16 steps (null or event)
}
```
- drums: kick/snare/hat steps, voiced from oscillators and decaying noise.
- bass: monophonic, sine/saw with lowpass.
- chords: 2–3 note stabs/pads from the scale.
- lead: pluck voice modelled on dkton.at's `pluck` (triangle + detuned saw + short bandpassed noise attack, lowpass sweeping closed, fast attack, ~1 s decay).
- ~6 presets (house, breaks, dub, ambient, electro, minimal). The shared master tempo is what plays; `suggestedBpm` is only a hint in the selector.

**Per-deck chain.**
layers → layer gains (mute pads) → 3-band EQ (low shelf, peaking mid, high shelf) → sweep filter → deck gain → crossfader gain → master bus.

- Sweep filter: one knob. Centre = off; left = lowpass sweeping down; right = highpass sweeping up.
- Crossfader: equal-power curve (`cos`/`sin`).

**Master bus.** Shared delay and convolution reverb (generated noise-decay impulse, as on dkton.at) as send effects, then a limiter (`DynamicsCompressor`), then `destination`.

**Safety against bad sound.** Fixed key, limiter on master, all parameter changes via `setTargetAtTime` (no clicks), EQ and filter ranges capped.

## Controls

Per deck: play/stop, volume, EQ (low/mid/high), sweep filter, 4 layer-mute pads (drums, bass, chords, lead), track selector.

Global: crossfader, master tempo (90–140 BPM), "drop" button (bass and drums cut for one bar, then re-enter), effects XY pad (x = delay amount, y = reverb amount; pointer position drives it as on dkton.at; drag on touch).

Input: pointer events (mouse and touch); knobs and faders respond to drag and arrow keys; keyboard shortcuts for play/stop, crossfade and drop; every control has an ARIA role and label.

## Visuals

- Two platters spun with GSAP, speed following tempo, with a subtle beat pulse.
- Level meters per deck and master, from `AnalyserNode`; a small waveform of master output.
- Look matches the site: retro/arcade palette from `base.scss` variables, with the dark-on-orange feel of the rest of the site rather than a generic club theme.
- Responsive: usable at phone width (stacked decks, 16 px gutters, no horizontal scroll) using `$bp-phone`. Respects `prefers-reduced-motion` (platters and pulses stop; audio unaffected).

## Error handling

- Autoplay blocked: the start screen is the gate; if the context is still suspended after the gesture, retry resume on the next interaction.
- No Web Audio support: show a short message instead of the mixer.
- Context suspended mid-session: resume on next interaction.

## Testing

- Pure logic in `dj/music.js` (scale/frequency math, tempo clamp, equal-power crossfade, step timing) checked with Node scripts (`node --test`).
- Scheduler timing checked with an `OfflineAudioContext` render in the browser: events land on the step grid.
- UI and audio verified by hand in the browser pane against the dev server: play both decks, move every control, confirm no clicks, no clipping, sensible meters.
- Phone-width and reduced-motion checks; Safari-14-compatible syntax check via a production build (`npm run build`) succeeding.
- Leak check: no timers left running after the page hides.

## Open decisions (defaults chosen)

- Entry point: add a link to `dj.html` somewhere on the main page. Default: no change to `index.html` until you say where (footer is the natural place). The page works at `/dj` regardless.
- Key A minor pentatonic; tempo range 90–140 BPM.
- Visual theme follows the site's existing palette and fonts.
