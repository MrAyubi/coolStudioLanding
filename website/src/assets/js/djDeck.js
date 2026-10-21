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

async function start(root) {
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
    start(root);
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
