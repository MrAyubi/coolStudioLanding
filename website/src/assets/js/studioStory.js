import starwarsTheme from 'url:../sounds/starwars.mp3';


// studio-intro.js
// Controls the .title-content crawl position.
// Nothing starts until the visitor presses the start screen (browsers block
// music without a user gesture). Auto-plays CRAWL_START_DELAY_MS after that
// start; the music comes in at AUDIO_START_DELAY_MS. While the user scrolls, the
// animation pauses and the scroll drives the position directly. When
// scrolling stops, auto-play resumes from wherever the user left off.

// ── Config ───────────────────────────────────────────────────────────────────
const CRAWL_START_DELAY_MS = 9000;  // matches $intro-delay in SCSS
const CRAWL_DURATION_MS = 120_000; // total auto-play duration
const TOP_START_PCT = 100;   // % where text begins (below stage)
const TOP_END_PCT = -170;  // % where text finishes (above stage)
const SCROLL_SENSITIVITY = 0.05; // % of travel per deltaY unit (tune to taste)
const SCROLL_RESUME_MS = 200;   // ms after last wheel event before auto-play resumes
const AUDIO_START_DELAY_MS = 4000; // change this to delay the music (ms)

// Derived: how many % to move per ms during auto-play
const SPEED_PCT_PER_MS = (TOP_START_PCT - TOP_END_PCT) / CRAWL_DURATION_MS;

// ── State ────────────────────────────────────────────────────────────────────

let currentTopPct = TOP_START_PCT;
let lastTimestamp = null;
let rafId = null;
let scrollTimer = null;
let isUserScrolling = false;
let crawlStarted = false;

// ── Helpers ──────────────────────────────────────────────────────────────────

const el = () => document.querySelector('.title-content');

function applyTop(pct) {
  const node = el();
  if (node) node.style.top = `${pct}%`;
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

// ── Auto-play loop ───────────────────────────────────────────────────────────

function tick(timestamp) {
  if (!crawlStarted || isUserScrolling) {
    lastTimestamp = null; // reset so there's no jump when resumed
    rafId = null;
    return;
  }

  if (lastTimestamp !== null) {
    const delta = timestamp - lastTimestamp;
    currentTopPct -= SPEED_PCT_PER_MS * delta;
    currentTopPct = clamp(currentTopPct, TOP_END_PCT, TOP_START_PCT);
    applyTop(currentTopPct);
  }

  lastTimestamp = timestamp;

  if (currentTopPct > TOP_END_PCT) {
    rafId = requestAnimationFrame(tick);
  } else {
    rafId = null; // crawl finished
  }
}

function startAutoPlay() {
  if (rafId) cancelAnimationFrame(rafId);
  lastTimestamp = null;
  rafId = requestAnimationFrame(tick);
}

// ── Scroll handler ───────────────────────────────────────────────────────────

function onWheel(e) {
  if (!crawlStarted) return;

  e.preventDefault(); // prevent page scroll while inside the crawl

  // Pause auto-play
  isUserScrolling = true;
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  clearTimeout(scrollTimer);

  // Scrub position
  currentTopPct -= e.deltaY * SCROLL_SENSITIVITY;
  currentTopPct = clamp(currentTopPct, TOP_END_PCT, TOP_START_PCT);
  applyTop(currentTopPct);

  // Resume auto-play after the user pauses scrolling
  scrollTimer = setTimeout(() => {
    isUserScrolling = false;
    startAutoPlay();
  }, SCROLL_RESUME_MS);
}

// ── Touch support (mobile swipe) ─────────────────────────────────────────────

let touchStartY = null;

function onTouchStart(e) {
  touchStartY = e.touches[0].clientY;
}

function onTouchMove(e) {
  if (!crawlStarted || touchStartY === null) return;
  e.preventDefault();

  const deltaY = touchStartY - e.touches[0].clientY; // positive = swipe up = scroll forward
  touchStartY = e.touches[0].clientY;

  isUserScrolling = true;
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  clearTimeout(scrollTimer);

  currentTopPct -= deltaY * SCROLL_SENSITIVITY;
  currentTopPct = clamp(currentTopPct, TOP_END_PCT, TOP_START_PCT);
  applyTop(currentTopPct);

  scrollTimer = setTimeout(() => {
    isUserScrolling = false;
    startAutoPlay();
  }, SCROLL_RESUME_MS);
}

// ── Start gate ───────────────────────────────────────────────────────────────

// Keys that shouldn't start the intro (focus navigation, modifiers, and Esc,
// which browsers don't count as a user gesture).
const IGNORED_START_KEYS = ['Tab', 'Escape', 'Shift', 'Control', 'Alt', 'Meta'];

function startIntro(stage, audio) {
  if (stage.classList.contains('is-started')) return;
  stage.classList.add('is-started'); // kicks off the CSS text + logo animations

  // iOS Safari only lets an element play if play() is first called inside the
  // user's gesture, and the real play() below runs from a timer. Calling it
  // here unlocks the element; pausing straight away keeps it silent.
  audio.play().catch(() => {});
  audio.pause();

  setTimeout(() => {
    crawlStarted = true;
    startAutoPlay();
  }, CRAWL_START_DELAY_MS);

  setTimeout(() => {
    audio.play().catch((err) => console.warn('Intro music could not start:', err));
  }, AUDIO_START_DELAY_MS);
}

// ── Init ─────────────────────────────────────────────────────────────────────

function initCrawl() {
  const stage = document.querySelector('.star-wars-intro');
  if (!stage) return;

  // Set initial position
  applyTop(currentTopPct);

  // Attach scroll / touch listeners to the crawl container only
  stage.addEventListener('wheel', onWheel, { passive: false });
  stage.addEventListener('touchstart', onTouchStart, { passive: true });
  stage.addEventListener('touchmove', onTouchMove, { passive: false });

  // Created up front so the track buffers while the start screen is showing
  const audio = new Audio(starwarsTheme);
  audio.volume = 1.0;

  const start = () => startIntro(stage, audio);
  stage.querySelector('.start-screen')?.addEventListener('click', start);
  document.addEventListener('keydown', (e) => {
    if (!IGNORED_START_KEYS.includes(e.key)) start();
  });
}

// Run after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCrawl);
} else {
  initCrawl();
}