// DJ deck page: start gate, engine lifecycle, the no-Web-Audio fallback, and
// the mapping from mixer controls to the engine. Nothing makes sound until the
// visitor presses start (browsers block audio until a user gesture). The DOM
// slider plumbing lives in dj/controls.js; this file exports nothing.
import { createEngine } from './dj/engine.js';
import { TRACKS } from './dj/tracks.js';
import { BPM_MIN, BPM_MAX } from './dj/music.js';
import { bindKnob, bindXY } from './dj/controls.js';

// Keys that shouldn't start the deck (focus navigation, modifiers, and Esc,
// which browsers don't count as a user gesture).
const IGNORED_START_KEYS = ['Tab', 'Escape', 'Shift', 'Control', 'Alt', 'Meta'];
const DEFAULT_TRACKS = { a: 'house', b: 'breaks' };
const DEFAULT_BPM = 120;
// Global shortcuts stay out of the way of focused form controls and sliders.
const SHORTCUT_IGNORE = 'button, select, input, textarea, [role="slider"], .dj__xy';
const CROSSFADER_INSET = 14; // half the 28px handle in dj.scss: its centre's travel
const UNSUPPORTED_TEXT = "Your browser can't play this. Try a recent Chrome, Firefox or Safari.";

let engine = null;
let failed = false; // createEngine threw; the page now shows the fallback

// ── Control mapping ────────────────────────────────────────────────────────
// Knobs are 0–1. Bipolar ones (filter, EQ) centre at 0.5, the engine's 0.
const toBipolar = (v) => v * 2 - 1;
const percentText = (v) => `${Math.round(v * 100)}%`;
function bipolarText(v) {
  const p = Math.round(toBipolar(v) * 100);
  if (p === 0) return 'centre';
  return `${p > 0 ? '+' : '−'}${Math.abs(p)}%`;
}
const knobToBpm = (v) => Math.round(BPM_MIN + v * (BPM_MAX - BPM_MIN));
const bpmToKnob = (bpm) => (bpm - BPM_MIN) / (BPM_MAX - BPM_MIN);

const eqKnob = (band) => ({ initial: 0.5, text: bipolarText, apply: (d, v) => d.setEq(band, toBipolar(v)) });
const DECK_KNOBS = {
  vol: { initial: 0.8, text: percentText, apply: (d, v) => d.setVolume(v) },
  filter: { initial: 0.5, text: bipolarText, apply: (d, v) => d.setFilter(toBipolar(v)) },
  high: eqKnob('high'),
  mid: eqKnob('mid'),
  low: eqKnob('low'),
};

// Wires one deck's section; returns its play/stop toggle for the shortcuts.
function wireDeck(section, deck) {
  const name = `deck ${section.dataset.deck.toUpperCase()}`;

  const play = section.querySelector('.dj__play');
  const syncPlay = () => {
    const word = deck.isPlaying ? 'Stop' : 'Play';
    play.textContent = word;
    play.setAttribute('aria-label', `${word} ${name}`);
    play.setAttribute('aria-pressed', String(deck.isPlaying));
  };
  const toggle = () => {
    if (deck.isPlaying) deck.stop();
    else deck.play();
    syncPlay();
  };
  play.setAttribute('aria-keyshortcuts', section.dataset.deck === 'a' ? 'Space' : 'Enter');
  play.addEventListener('click', toggle);
  syncPlay();

  const select = section.querySelector('.dj__track-select');
  deck.setTrack(select.value);
  select.addEventListener('change', () => deck.setTrack(select.value));

  // Pads: lit = layer playing; pressed (per their "Mute …" labels) = muted.
  section.querySelectorAll('.dj__pad[data-layer]').forEach((pad) => {
    const { layer } = pad.dataset;
    const sync = () => pad.setAttribute('aria-pressed', String(deck.isLayerMuted(layer)));
    pad.addEventListener('click', () => {
      deck.setLayerMuted(layer, !deck.isLayerMuted(layer));
      sync();
    });
    sync();
  });

  section.querySelectorAll('.dj__knob[data-control]').forEach((knob) => {
    const spec = DECK_KNOBS[knob.dataset.control];
    if (!spec) return;
    const onChange = (v) => spec.apply(deck, v);
    bindKnob(knob, { value: spec.initial, valueText: spec.text, onChange });
    onChange(spec.initial);
  });

  return toggle;
}

function wireMaster(root) {
  const tempo = root.querySelector('.dj__tempo');
  const bpmLabel = root.querySelector('.dj__tempo-bpm');
  bindKnob(tempo, {
    value: bpmToKnob(engine.getBpm()),
    defaultValue: bpmToKnob(DEFAULT_BPM),
    valueText: (v) => `${knobToBpm(v)} BPM`,
    onChange: (v) => {
      bpmLabel.textContent = String(engine.setBpm(knobToBpm(v)));
    },
  });
  bpmLabel.textContent = String(engine.getBpm());

  bindKnob(root.querySelector('.dj__crossfader'), {
    value: 0.5,
    axis: 'x',
    inset: CROSSFADER_INSET,
    onChange: (v) => engine.setCrossfade(v),
  });
  engine.setCrossfade(0.5);

  bindXY(root.querySelector('.dj__xy'), (x, y) => engine.setFx(x, y));

  const drop = root.querySelector('.dj__drop');
  drop.setAttribute('aria-keyshortcuts', 'D');
  drop.addEventListener('click', () => engine.drop());
}

// Space toggles deck A, Enter deck B, D drops.
function wireShortcuts(toggles) {
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    if (e.target instanceof Element && e.target.closest(SHORTCUT_IGNORE)) return;
    if (e.key === ' ' || e.key === 'Spacebar') toggles.a();
    else if (e.key === 'Enter') toggles.b();
    else if (e.key === 'd' || e.key === 'D') engine.drop();
    else return;
    e.preventDefault(); // Space would scroll the page
  });
}

// Runs once, right after the engine is created. Listeners added during the
// start key's own dispatch don't fire for it, so that key never toggles a deck.
function wireControls(root) {
  const toggles = {};
  root.querySelectorAll('.dj__deck').forEach((section) => {
    const key = section.dataset.deck;
    toggles[key] = wireDeck(section, engine.decks[key === 'b' ? 1 : 0]);
  });
  wireMaster(root);
  wireShortcuts(toggles);
}


function showUnsupported() {
  document.body.textContent = '';
  const message = document.createElement('p');
  message.className = 'dj__unsupported';
  message.textContent = UNSUPPORTED_TEXT;
  document.body.appendChild(message);
}

function fillTrackSelects(root) {
  root.querySelectorAll('.dj__deck').forEach((deck) => {
    const select = deck.querySelector('.dj__track-select');
    if (!select) return;
    TRACKS.forEach((track) => {
      const option = document.createElement('option');
      option.value = track.id;
      option.textContent = `${track.name} · ${track.style} (${track.suggestedBpm})`;
      select.appendChild(option);
    });
    select.value = DEFAULT_TRACKS[deck.dataset.deck];
  });
}

// Resume needs a user gesture on some browsers (iOS Safari counts click/touchend,
// not pointerdown), so a context that didn't start is retried on the next one.
function retryResume() {
  if (!engine || document.hidden || engine.ctx.state === 'running') return;
  engine.resume().catch((err) => console.warn('Audio could not start yet:', err));
}

// On touch the overlay can hide while the finger is still down, and the
// compatibility click would then land on the mixer control underneath. Swallow
// that one click; give up 500 ms after the pointer lifts (or 5 s as a fallback)
// so a later genuine click is never eaten.
function swallowStartClick() {
  let timer;
  const done = () => {
    clearTimeout(timer);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('pointerup', onUp, true);
    document.removeEventListener('pointercancel', onUp, true);
  };
  const onClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    done();
    retryResume(); // this click may be the gesture iOS needs to unlock audio
  };
  const arm = (ms) => {
    clearTimeout(timer);
    timer = setTimeout(done, ms);
  };
  const onUp = () => arm(500);
  document.addEventListener('click', onClick, true);
  document.addEventListener('pointerup', onUp, true);
  document.addEventListener('pointercancel', onUp, true);
  arm(5000);
}

async function start(root, fromPointer = false) {
  if (failed) return;
  if (engine) {
    retryResume(); // second trigger: never a second engine
    return;
  }
  try {
    engine = createEngine();
  } catch (err) {
    failed = true;
    console.error('DJ engine could not be created:', err);
    showUnsupported();
    return;
  }
  if (fromPointer) swallowStartClick();
  window.__djEngine = engine; // dev aid for debugging; later code doesn't import from here
  console.info('[dj] engine created');
  wireControls(root);

  try {
    await engine.resume();
  } catch (err) {
    console.warn('Audio could not start yet; retrying on the next tap or key press:', err);
  }

  root.querySelector('.dj__start').hidden = true;
  root.querySelector('.dj__mixer').hidden = false;
  root.querySelector('.dj__title')?.focus();
}

function initDeck() {
  const root = document.querySelector('.dj');
  if (!root) return;

  if (!(window.AudioContext || window.webkitAudioContext)) {
    showUnsupported();
    return;
  }

  fillTrackSelects(root);

  const startButton = root.querySelector('.dj__start');
  const onPointer = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    start(root, true);
  };
  startButton.addEventListener('pointerdown', onPointer);
  startButton.addEventListener('click', () => start(root));
  document.addEventListener('keydown', (e) => {
    if (!engine && !failed && !IGNORED_START_KEYS.includes(e.key)) start(root);
  });

  ['pointerdown', 'keydown', 'click', 'touchend'].forEach((type) => {
    document.addEventListener(type, retryResume, { passive: true });
  });

  document.addEventListener('visibilitychange', () => {
    if (!engine) return;
    const change = document.hidden ? engine.suspend() : engine.resume();
    change.catch((err) => console.warn('Audio could not change state:', err));
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDeck);
} else {
  initDeck();
}
