// DJ deck page: start gate, engine lifecycle and the no-Web-Audio fallback.
// Nothing makes sound until the visitor presses start (browsers block audio
// until a user gesture). Controls are wired separately; this file exports nothing.
import { createEngine } from './dj/engine.js';
import { TRACKS } from './dj/tracks.js';

// Keys that shouldn't start the deck (focus navigation, modifiers, and Esc,
// which browsers don't count as a user gesture).
const IGNORED_START_KEYS = ['Tab', 'Escape', 'Shift', 'Control', 'Alt', 'Meta'];
const DEFAULT_TRACKS = { a: 'house', b: 'breaks' };
const UNSUPPORTED_TEXT = "Your browser can't play this. Try a recent Chrome, Firefox or Safari.";

let engine = null;
let failed = false; // createEngine threw; the page now shows the fallback

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
