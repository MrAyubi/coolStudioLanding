// Audio engine: two decks on one shared step grid, crossfader, master FX + limiter.
import { createScheduler } from './scheduler.js';
import { getTrack, LAYERS } from './tracks.js';
import * as synth from './synth.js';
import { noteToHz, clampBpm, stepDuration, crossfadeGains, sweepToFilter, eqToDb } from './music.js';

const TAU = 0.05;
const GATE_TAU = 0.02;
const DROP_TAU = 0.005;
const DROP_STEPS = 16;
const DROP_LAYERS = ['drums', 'bass'];
const FEEDBACK = 0.35;
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
  mix.connect(delaySend).connect(delay).connect(feedback).connect(delay);
  delay.connect(limiter);
  mix.connect(reverbSend).connect(reverb).connect(limiter);
  limiter.connect(masterAnalyser);
  limiter.connect(opts.destination || ctx.destination);

  let dropPending = false;
  let dropRemaining = 0;
  let dropUntil = 0;
  const dropActive = () => dropPending || dropRemaining > 0;
  const internals = new Map();

  function createDeck(trackId) {
    const layerGains = {};
    const muted = {};
    const low = node(ctx.createBiquadFilter());
    const mid = node(ctx.createBiquadFilter());
    const high = node(ctx.createBiquadFilter());
    const sweep = node(ctx.createBiquadFilter());
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
    sweep.type = 'lowpass';
    sweep.frequency.value = 20000;
    gate.gain.value = 0;
    gain.gain.value = 0.8;
    LAYERS.forEach((l) => {
      layerGains[l] = node(ctx.createGain());
      layerGains[l].connect(low);
      muted[l] = false;
    });
    low.connect(mid).connect(high).connect(gate);
    sweep.connect(gate);
    gate.connect(gain);
    gain.connect(analyser);
    gain.connect(xf).connect(mix);
    let sweepOn = false;
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
        const on = type !== 'off';
        if (on) {
          sweep.type = type;
          set(sweep.frequency, freq);
        }
        if (on !== sweepOn) {
          high.disconnect();
          high.connect(on ? sweep : gate);
          sweepOn = on;
        }
      },
      setLayerMuted(layer, m) {
        if (!(layer in muted)) return;
        muted[layer] = !!m;
        const dropLayer = DROP_LAYERS.includes(layer);
        if (dropLayer && dropActive()) return; // applied when the drop restores
        // A restore may already be scheduled; never insert a change before it.
        const at = dropLayer ? Math.max(ctx.currentTime, dropUntil) : ctx.currentTime;
        set(layerGains[layer].gain, m ? 0 : 1, at, DROP_TAU);
      },
      isLayerMuted(layer) { return !!muted[layer]; },
    };
    // Grid-facing internals stay off the public Deck object.
    internals.set(deck, { layerGains, muted, xf, analyser, trigger });
    function trigger(i, time, sd, dropping) {
      const track = getTrack(trackId);
      LAYERS.forEach((l) => {
        if (muted[l] || (dropping && DROP_LAYERS.includes(l))) return;
        const s = track.layers[l][i];
        const dest = layerGains[l];
        if (l === 'drums') {
          if (s.includes('k')) synth.kick(ctx, dest, time);
          if (s.includes('s')) synth.snare(ctx, dest, time);
          if (s.includes('h')) synth.hat(ctx, dest, time);
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

  function setDropGains(value, time) {
    decks.forEach((d) => {
      const { layerGains, muted } = internals.get(d);
      DROP_LAYERS.forEach((l) => set(layerGains[l].gain, value === null ? (muted[l] ? 0 : 1) : value, time, DROP_TAU));
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
      dropUntil = time + sd;
      setDropGains(null, dropUntil);
    }
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
    if (dropActive()) {
      dropPending = false;
      dropRemaining = 0;
      dropUntil = 0;
      setDropGains(null, ctx.currentTime);
    }
  }

  const decks = [createDeck('house'), createDeck('breaks')];
  const [ia, ib] = decks.map((d) => internals.get(d));
  ia.xf.gain.value = crossfadeGains(0.5).a;
  ib.xf.gain.value = crossfadeGains(0.5).b;

  let destroyed = false;
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
    async resume() { if (ctx.state === 'suspended') await ctx.resume(); },
    async suspend() { if (ctx.state === 'running') await ctx.suspend(); },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      decks.forEach((d) => d.stop());
      scheduler.stop();
      nodes.forEach((n) => n.disconnect());
      if (owned) ctx.close().catch(() => {});
    },
    _debug: { get timers() { return timers; }, tick: () => scheduler.tick() },
  };
  return engine;
}
