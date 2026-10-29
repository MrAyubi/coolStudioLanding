// Audio engine: two decks on one shared step grid, crossfader, master FX + limiter.
import { createScheduler } from './scheduler.js';
import { getTrack, LAYERS } from './tracks.js';
import * as synth from './synth.js';
import { noteToHz, clampBpm, stepDuration, crossfadeGains, sweepToFilter, eqToDb, swingOffset } from './music.js';

const TAU = 0.05;
const GATE_TAU = 0.02;
const LAYER_TAU = 0.015; // layer mute + drop: fast enough to land on the beat
const DROP_LEAD = 0.01; // restore this long before the re-entry step
const EDGE = { lowpass: 20000, highpass: 20 }; // transparent cutoffs
const DROP_STEPS = 16;
const DROP_LAYERS = ['drums', 'bass'];
const FEEDBACK = 0.35;
// Sidechain pump: bass and chords duck on every kick, then breathe back.
const PUMP_DEPTH = 0.35; // gain at the bottom of the duck
const PUMP_ATTACK = 0.004;
const PUMP_HOLD = 0.03;
const PUMP_RELEASE = 0.07;
const PUMPED_LAYERS = ['bass', 'chords'];
const fin = Number.isFinite;
const clamp01 = (v) => Math.min(1, Math.max(0, v));

function reverbImpulse(ctx) {
  const n = Math.round(ctx.sampleRate * 1.9);
  const buf = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < n; i++) d[i] = (2 * Math.random() - 1) * (1 - i / n) ** 2.6;
  }
  return buf;
}

export function createEngine(opts = {}) {
  const owned = !opts.audioContext;
  let ctx = opts.audioContext;
  if (owned) {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
  }
  const nodes = [];
  const node = (n) => (nodes.push(n), n);
  const set = (param, v, at = ctx.currentTime, tau = TAU) => param.setTargetAtTime(v, at, tau);
  let bpm = clampBpm(fin(opts.bpm) ? opts.bpm : 120);

  // Master bus: mix -> limiter (dry), mix -> delay/reverb sends -> limiter.
  const mix = node(ctx.createGain());
  const limiter = node(ctx.createDynamicsCompressor());
  limiter.threshold.value = -6;
  limiter.knee.value = 4;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.25;
  const delaySend = node(ctx.createGain());
  const delay = node(ctx.createDelay(1));
  const feedback = node(ctx.createGain());
  const reverbSend = node(ctx.createGain());
  const reverb = node(ctx.createConvolver());
  const masterAnalyser = node(ctx.createAnalyser());
  delaySend.gain.value = 0;
  reverbSend.gain.value = 0;
  delay.delayTime.value = 3 * stepDuration(bpm);
  feedback.gain.value = FEEDBACK; // < 1 so the echo loop decays
  reverb.buffer = reverbImpulse(ctx);
  mix.connect(limiter);
  // No connect() chaining: it returns undefined on prefixed webkitAudioContext (Safari 14.0).
  mix.connect(delaySend);
  delaySend.connect(delay);
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(limiter);
  mix.connect(reverbSend);
  reverbSend.connect(reverb);
  reverb.connect(limiter);
  limiter.connect(masterAnalyser);
  limiter.connect(opts.destination || ctx.destination);

  let dropPending = false;
  let dropRemaining = 0;
  let dropUntil = 0;
  const dropActive = () => dropPending || dropRemaining > 0;
  const internals = new Map();
  const stepListeners = new Set(); // visuals: cb(stepIndex, time) per scheduled step

  function createDeck(trackId) {
    const layerGains = {};
    const muted = {};
    const low = node(ctx.createBiquadFilter());
    const mid = node(ctx.createBiquadFilter());
    const high = node(ctx.createBiquadFilter());
    // Sweep: dry path plus one fixed-type filter per direction, crossfaded with gains,
    // so the sweep never rewires or flips a filter type under signal.
    const dry = node(ctx.createGain());
    const sweeps = {};
    ['lowpass', 'highpass'].forEach((t) => {
      const f = node(ctx.createBiquadFilter());
      const wet = node(ctx.createGain());
      f.type = t;
      f.frequency.value = EDGE[t];
      wet.gain.value = 0;
      f.connect(wet);
      sweeps[t] = { f, wet };
    });
    const gate = node(ctx.createGain());
    const gain = node(ctx.createGain());
    const xf = node(ctx.createGain());
    const analyser = node(ctx.createAnalyser());
    low.type = 'lowshelf';
    low.frequency.value = 250;
    mid.type = 'peaking';
    mid.frequency.value = 1000;
    mid.Q.value = 0.9;
    high.type = 'highshelf';
    high.frequency.value = 4000;
    gate.gain.value = 0;
    gain.gain.value = 0.8;
    const pump = node(ctx.createGain());
    pump.connect(low);
    LAYERS.forEach((l) => {
      layerGains[l] = node(ctx.createGain());
      layerGains[l].connect(PUMPED_LAYERS.includes(l) ? pump : low);
      muted[l] = false;
    });
    low.connect(mid);
    mid.connect(high);
    high.connect(dry);
    dry.connect(gate);
    Object.values(sweeps).forEach(({ f, wet }) => {
      high.connect(f);
      wet.connect(gate);
    });
    gate.connect(gain);
    gain.connect(analyser);
    gain.connect(xf);
    xf.connect(mix);
    let playing = false;

    const deck = {
      get trackId() { return trackId; },
      get isPlaying() { return playing; },
      setTrack(id) { if (getTrack(id)) trackId = id; },
      play() {
        if (playing) return;
        playing = true;
        set(gate.gain, 1, ctx.currentTime, GATE_TAU);
        if (!scheduler.running) scheduler.start();
      },
      stop() {
        if (!playing) return;
        playing = false;
        set(gate.gain, 0, ctx.currentTime, GATE_TAU);
        if (!decks.some((d) => d.isPlaying)) stopGrid();
      },
      setVolume(v) { if (fin(v)) set(gain.gain, clamp01(v)); },
      setEq(band, v) {
        const f = { low, mid, high }[band];
        if (f && fin(v)) set(f.gain, eqToDb(v));
      },
      setFilter(v) {
        if (!fin(v)) return;
        const { type, freq } = sweepToFilter(v);
        set(dry.gain, type === 'off' ? 1 : 0);
        // Inactive filters fade out and glide back to their transparent edge,
        // so a later re-enable starts open instead of from a stale cutoff.
        Object.entries(sweeps).forEach(([t, { f, wet }]) => {
          set(wet.gain, t === type ? 1 : 0);
          set(f.frequency, t === type ? freq : EDGE[t]);
        });
      },
      setLayerMuted(layer, m) {
        if (!(layer in muted)) return;
        muted[layer] = !!m;
        const dropLayer = DROP_LAYERS.includes(layer);
        if (dropLayer && dropActive()) return; // applied when the drop restores
        // A restore may already be scheduled; never insert a change before it.
        const at = dropLayer ? Math.max(ctx.currentTime, dropUntil) : ctx.currentTime;
        set(layerGains[layer].gain, m ? 0 : 1, at, LAYER_TAU);
      },
      isLayerMuted(layer) { return !!muted[layer]; },
    };
    // Grid-facing internals stay off the public Deck object.
    internals.set(deck, { layerGains, muted, xf, analyser, trigger });
    function trigger(i, gridTime, sd, dropping) {
      const track = getTrack(trackId);
      // Each deck swings its own track; the shared grid itself stays straight.
      const time = gridTime + swingOffset(i, track.swing, sd);
      LAYERS.forEach((l) => {
        if (muted[l] || (dropping && DROP_LAYERS.includes(l))) return;
        const s = track.layers[l][i];
        const dest = layerGains[l];
        if (l === 'drums') {
          if (s.includes('k')) {
            synth.kick(ctx, dest, time);
            pump.gain.setTargetAtTime(PUMP_DEPTH, time, PUMP_ATTACK);
            pump.gain.setTargetAtTime(1, time + PUMP_HOLD, PUMP_RELEASE);
          }
          if (s.includes('s')) synth.snare(ctx, dest, time);
          if (s.includes('h')) synth.hat(ctx, dest, time);
          if (s.includes('c')) synth.clap(ctx, dest, time);
          if (s.includes('p')) synth.perc(ctx, dest, time);
        } else if (s === null) {
          return;
        } else if (l === 'bass') {
          synth.bass(ctx, dest, time, noteToHz(s, -1), 1.8 * sd);
        } else if (l === 'chords') {
          synth.chord(ctx, dest, time, s.map((d) => noteToHz(d, 0)), 3.8 * sd);
        } else {
          synth.pluck(ctx, dest, time, noteToHz(s, 1));
        }
      });
    }
    return deck;
  }

  // value null = restore each layer's user mute state. cancel drops any cut/restore
  // still queued in the future (e.g. a drop cut scheduled up to one lookahead ahead).
  function setDropGains(value, time, cancel = false) {
    decks.forEach((d) => {
      const { layerGains, muted } = internals.get(d);
      DROP_LAYERS.forEach((l) => {
        const g = layerGains[l].gain;
        if (cancel) g.cancelScheduledValues(time);
        set(g, value === null ? (muted[l] ? 0 : 1) : value, time, LAYER_TAU);
      });
    });
  }

  function onStep(i, time) {
    const sd = stepDuration(bpm);
    if (dropPending) {
      dropPending = false;
      dropRemaining = DROP_STEPS;
      setDropGains(0, time);
    }
    const dropping = dropRemaining > 0;
    decks.forEach((d) => d.isPlaying && internals.get(d).trigger(i, time, sd, dropping));
    if (dropping && --dropRemaining === 0) {
      dropUntil = time + sd - DROP_LEAD;
      setDropGains(null, dropUntil);
    }
    // A throwing listener must never break scheduling.
    stepListeners.forEach((cb) => {
      try {
        cb(i, time);
      } catch (err) {
        console.error('[dj] step listener failed:', err);
      }
    });
  }

  // Count live timers so the harness can verify there is never more than one.
  const so = opts.schedulerOptions || {};
  const setT = so.setTimer || ((fn, ms) => setInterval(fn, ms));
  const clearT = so.clearTimer || ((id) => clearInterval(id));
  let timers = 0;
  const scheduler = createScheduler({
    ctx,
    getBpm: () => bpm,
    onStep,
    lookahead: so.lookahead,
    intervalMs: so.intervalMs,
    setTimer: (fn, ms) => (timers++, setT(fn, ms)),
    clearTimer: (id) => (timers--, clearT(id)),
  });

  function stopGrid() {
    scheduler.stop();
    if (dropActive() || dropUntil > ctx.currentTime) {
      dropPending = false;
      dropRemaining = 0;
      dropUntil = 0;
      setDropGains(null, ctx.currentTime, true);
    }
  }

  const decks = [createDeck('house'), createDeck('breaks')];
  const [ia, ib] = decks.map((d) => internals.get(d));
  ia.xf.gain.value = crossfadeGains(0.5).a;
  ib.xf.gain.value = crossfadeGains(0.5).b;

  let destroyed = false;
  let gridSuspended = false; // suspend() stopped a running grid
  const engine = {
    ctx,
    decks,
    analysers: { a: ia.analyser, b: ib.analyser, master: masterAnalyser },
    setBpm(v) {
      if (fin(v)) {
        bpm = clampBpm(v);
        set(delay.delayTime, 3 * stepDuration(bpm));
      }
      return bpm;
    },
    getBpm: () => bpm,
    setCrossfade(pos) {
      if (!fin(pos)) return;
      const g = crossfadeGains(pos);
      set(ia.xf.gain, g.a);
      set(ib.xf.gain, g.b);
    },
    drop() {
      if (!scheduler.running || dropActive()) return;
      dropPending = true;
    },
    setFx(x, y) {
      if (fin(x)) set(delaySend.gain, clamp01(x));
      if (fin(y)) set(reverbSend.gain, clamp01(y));
    },
    onStep(cb) {
      if (destroyed || typeof cb !== 'function') return () => {};
      stepListeners.add(cb);
      return () => stepListeners.delete(cb);
    },
    // Hiding stops the grid (no timer runs while hidden; a drop in progress is
    // cancelled and restored, as on stop) but keeps decks playing, so resume can
    // restart it from step 0. iOS can leave the context 'interrupted', so resume
    // anything that isn't running or closed.
    async resume() {
      if (gridSuspended && !destroyed) {
        gridSuspended = false;
        if (!scheduler.running && decks.some((d) => d.isPlaying)) scheduler.start();
      }
      if (ctx.state !== 'running' && ctx.state !== 'closed') await ctx.resume();
    },
    async suspend() {
      if (scheduler.running) {
        gridSuspended = true;
        stopGrid();
      }
      if (ctx.state === 'running') await ctx.suspend();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      stepListeners.clear();
      decks.forEach((d) => d.stop());
      scheduler.stop();
      nodes.forEach((n) => n.disconnect());
      if (owned) {
        try {
          const p = ctx.close();
          if (p && p.catch) p.catch(() => {});
        } catch (e) {
          // already closed
        }
      }
    },
    _debug: { get timers() { return timers; }, tick: () => scheduler.tick() },
  };
  return engine;
}
