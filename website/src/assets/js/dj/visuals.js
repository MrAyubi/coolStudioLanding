// DJ deck visuals: spinning platters, a bar pulse, level meters and the master
// scope. One requestAnimationFrame loop drives all of it, and it only runs while
// the mixer is shown and the tab is visible. The pure helpers at the top are
// exported for the Node tests; nothing touches the DOM until startVisuals().
import gsap from 'gsap';

const BEATS_PER_TURN = 4;
const METER_FLOOR_DB = -48;
const METER_DECAY = 0.3; // s: meters fall slowly so they don't flicker
const MAX_FRAME_DT = 0.1; // s: cap a frame after a stall so nothing jumps
const PULSE_CLASS = 'dj__platter--pulse';
const PLATTER_DISC = '.dj__platter-label'; // spins; the platter keeps its shadow still

// RMS of an analyser frame: bytes are 128-centred (getByteTimeDomainData),
// floats are -1..1 (getFloatTimeDomainData).
export function rms(samples) {
  const n = samples.length;
  if (!n) return 0;
  const bytes = samples instanceof Uint8Array;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const v = bytes ? (samples[i] - 128) / 128 : samples[i];
    sum += v * v;
  }
  return Math.min(1, Math.sqrt(sum / n));
}

// RMS (0–1) to a meter height (0–1) on a dB scale from METER_FLOOR_DB to 0 dB.
export function levelToMeter(level) {
  if (!(level > 0)) return 0;
  const db = 20 * Math.log10(level);
  return Math.min(1, Math.max(0, 1 - db / METER_FLOOR_DB));
}

// Instant attack, exponential release with time constant `tau` seconds.
export function smoothLevel(prev, target, dt, tau = METER_DECAY) {
  if (target >= prev) return target;
  return target + (prev - target) * Math.exp(-dt / tau);
}

// Seconds per platter turn: one turn per four beats.
export const rotationPeriod = (bpm) => (BEATS_PER_TURN * 60) / bpm;

// Angle in degrees after `dt` seconds at `bpm`, kept in [0, 360).
export function advanceAngle(angle, dt, bpm) {
  return (angle + (360 * dt) / rotationPeriod(bpm)) % 360;
}

// Sizes a canvas's backing store to its CSS box times devicePixelRatio and
// returns a context that draws in CSS pixels.
function fitCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const bw = Math.max(1, Math.round(w * dpr));
  const bh = Math.max(1, Math.round(h * dpr));
  if (canvas.width !== bw) canvas.width = bw;
  if (canvas.height !== bh) canvas.height = bh;
  const g = canvas.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { g, w, h, color: getComputedStyle(canvas).getPropertyValue('--accent').trim() || '#e0a24d' };
}

function drawMeter(m) {
  const { g, w, h, color } = m.view;
  g.clearRect(0, 0, w, h);
  const fill = Math.round(m.value * h);
  if (fill <= 0) return;
  g.fillStyle = color;
  g.fillRect(0, h - fill, w, fill);
}

function drawScope(scope) {
  const { g, w, h, color } = scope.view;
  const data = scope.data;
  g.clearRect(0, 0, w, h);
  g.lineWidth = 2;
  g.lineJoin = 'round';
  g.strokeStyle = color;
  g.beginPath();
  const step = w / (data.length - 1);
  for (let i = 0; i < data.length; i++) {
    const y = (1 - data[i] / 255) * h;
    if (i === 0) g.moveTo(0, y);
    else g.lineTo(i * step, y);
  }
  g.stroke();
}

// Starts the visuals for `engine` inside `root` (.dj). Returns stop().
export function startVisuals(engine, root) {
  const mixer = root.querySelector('.dj__mixer');
  const deckEls = Array.from(root.querySelectorAll('.dj__deck'));
  const decks = deckEls.map((section) => {
    const key = section.dataset.deck;
    return {
      deck: engine.decks[key === 'b' ? 1 : 0],
      platter: section.querySelector('.dj__platter'),
      disc: section.querySelector(PLATTER_DISC),
      angle: 0,
    };
  });

  const meter = (canvas, analyser) => canvas && analyser && {
    canvas,
    analyser,
    data: new Uint8Array(analyser.fftSize),
    value: 0,
    view: null,
  };
  const meters = [
    ...deckEls.map((s) => meter(s.querySelector('.dj__meter'), engine.analysers[s.dataset.deck])),
    meter(root.querySelector('.dj__meter--master'), engine.analysers.master),
  ].filter(Boolean);
  const scopeCanvas = root.querySelector('.dj__scope');
  const scope = scopeCanvas && {
    canvas: scopeCanvas,
    data: new Uint8Array(engine.analysers.master.fftSize),
    view: null,
  };
  const canvases = [...meters, ...(scope ? [scope] : [])];

  // ── Reduced motion: read once, then on change ──────────────────────────────
  const motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  let reduced = !!(motionQuery && motionQuery.matches);
  const onMotionChange = (e) => {
    reduced = e.matches;
    if (reduced) decks.forEach((d) => d.platter && d.platter.classList.remove(PULSE_CLASS));
  };
  if (motionQuery) {
    if (motionQuery.addEventListener) motionQuery.addEventListener('change', onMotionChange);
    else motionQuery.addListener(onMotionChange); // Safari < 14
  }

  // ── Canvas sizing ──────────────────────────────────────────────────────────
  let needsFit = true;
  const markFit = () => { needsFit = true; };
  function fitAll() {
    needsFit = false;
    canvases.forEach((c) => { c.view = fitCanvas(c.canvas); });
  }
  window.addEventListener('resize', markFit);
  const resizeObserver = window.ResizeObserver ? new ResizeObserver(markFit) : null;
  if (resizeObserver) canvases.forEach((c) => resizeObserver.observe(c.canvas));

  // ── Frame loop ─────────────────────────────────────────────────────────────
  let rafId = null;
  let lastT = null;

  function frame(t) {
    rafId = window.requestAnimationFrame(frame);
    const dt = lastT === null ? 0 : Math.min(MAX_FRAME_DT, (t - lastT) / 1000);
    lastT = t;
    if (needsFit) fitAll();

    if (!reduced) {
      const bpm = engine.getBpm();
      decks.forEach((d) => {
        if (!d.deck.isPlaying || !d.disc) return; // stopped: hold the angle
        d.angle = advanceAngle(d.angle, dt, bpm);
        gsap.set(d.disc, { rotation: d.angle });
      });
    }

    meters.forEach((m) => {
      m.analyser.getByteTimeDomainData(m.data);
      m.value = smoothLevel(m.value, levelToMeter(rms(m.data)), dt);
      drawMeter(m);
    });
    if (scope) {
      engine.analysers.master.getByteTimeDomainData(scope.data);
      drawScope(scope);
    }
  }

  const shouldRun = () => !mixer.hidden && document.visibilityState === 'visible';
  function update() {
    if (shouldRun()) {
      if (rafId === null) {
        lastT = null;
        needsFit = true;
        rafId = window.requestAnimationFrame(frame);
      }
    } else if (rafId !== null) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }
  }
  document.addEventListener('visibilitychange', update);
  const mixerObserver = new MutationObserver(update);
  mixerObserver.observe(mixer, { attributes: true, attributeFilter: ['hidden'] });

  // ── Bar pulse: step 0 of each bar, timed to when it is heard ───────────────
  const pulseTimers = new Set();
  function pulse(platter) {
    platter.classList.remove(PULSE_CLASS);
    void platter.offsetWidth; // restart the CSS animation
    platter.classList.add(PULSE_CLASS);
  }
  const offStep = engine.onStep((stepIndex, time) => {
    if (stepIndex !== 0 || reduced) return;
    const playing = decks.filter((d) => d.deck.isPlaying && d.platter);
    if (!playing.length) return;
    const delay = Math.max(0, (time - engine.ctx.currentTime) * 1000);
    const id = setTimeout(() => {
      pulseTimers.delete(id);
      if (reduced || rafId === null) return; // hidden or reduced since scheduling
      playing.forEach((d) => pulse(d.platter));
    }, delay);
    pulseTimers.add(id);
  });
  const onPulseEnd = (e) => {
    if (e.animationName === 'dj-pulse') e.currentTarget.classList.remove(PULSE_CLASS);
  };
  decks.forEach((d) => d.platter && d.platter.addEventListener('animationend', onPulseEnd));

  update();

  return function stop() {
    if (rafId !== null) window.cancelAnimationFrame(rafId);
    rafId = null;
    offStep();
    pulseTimers.forEach(clearTimeout);
    pulseTimers.clear();
    document.removeEventListener('visibilitychange', update);
    mixerObserver.disconnect();
    window.removeEventListener('resize', markFit);
    if (resizeObserver) resizeObserver.disconnect();
    if (motionQuery) {
      if (motionQuery.removeEventListener) motionQuery.removeEventListener('change', onMotionChange);
      else motionQuery.removeListener(onMotionChange);
    }
    decks.forEach((d) => {
      if (!d.platter) return;
      d.platter.removeEventListener('animationend', onPulseEnd);
      d.platter.classList.remove(PULSE_CLASS);
    });
  };
}
