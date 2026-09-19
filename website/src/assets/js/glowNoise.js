// ===========================================
// Glow System for .player-select
// Pure JavaScript – No jQuery – Complete
// ===========================================

// ELEMENT
const glowElement = document.querySelector(".player-select");

// CONFIG
const GLOW_MIN_SIZE = 5;
const GLOW_MAX_SIZE = 35;

const GLOW_MIN_COLOR = 120;
const GLOW_MAX_COLOR = 255;

const GLOW_MIN_TIME = 300;
const GLOW_MAX_TIME = 1500;

const STATIC_GLOW_SIZE_OFFSET = 20;
let isStaticOn = false;

// INTERNAL
let animationFrame;
let isRunning = false;

// UTILS
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function calcGlowStyle() {
  if (isStaticOn) {
    // WHITE STATIC GLOW
    const d = rand(GLOW_MIN_SIZE, GLOW_MAX_SIZE) + STATIC_GLOW_SIZE_OFFSET;
    return `0 0 ${d}px ${d}px rgba(255,255,255,0.4)`;
  } else {
    // RANDOM COLOR GLOW
    const d = rand(GLOW_MIN_SIZE, GLOW_MAX_SIZE);
    const r = rand(GLOW_MIN_COLOR, GLOW_MAX_COLOR);
    const g = rand(GLOW_MIN_COLOR, GLOW_MAX_COLOR);
    const b = rand(GLOW_MIN_COLOR, GLOW_MAX_COLOR);
    const a = rand(4, 10) / 10;
    return `0 0 ${d}px ${d}px rgba(${r},${g},${b},${a})`;
  }
}

function calcGlowDuration() {
  return isStaticOn ? GLOW_MAX_TIME : rand(GLOW_MIN_TIME, GLOW_MAX_TIME);
}

// ----------------------------
// Animation Loop
// ----------------------------
function animateGlow() {
  const target = calcGlowStyle();
  const duration = calcGlowDuration();

  glowElement.style.transition = `box-shadow ${duration}ms ease-in-out`;
  glowElement.style.boxShadow = target;

  animationFrame = setTimeout(() => {
    if (isRunning) animateGlow();
  }, duration);
}

// ----------------------------
// Public API
// ----------------------------
const glow = {
  start() {
    if (isRunning) return;
    isRunning = true;
    animateGlow();
  },

  stop() {
    isRunning = false;
    clearTimeout(animationFrame);
    glowElement.style.transition = "box-shadow 300ms ease-out";
    glowElement.style.boxShadow = "0 0 0px 0px rgba(255,255,255,0)";
  },

  setStatic(state) {
    isStaticOn = state;
  }
};

// Expose glow globally
window.glow = glow;
