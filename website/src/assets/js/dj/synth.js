// Stateless Web Audio voices. Each schedules nodes on ctx starting at `time`,
// routes into `dest`, and disconnects itself when the longest source ends.

const noiseCache = new WeakMap();

function noiseBuffer(ctx) {
  let buf = noiseCache.get(ctx);
  if (!buf) {
    buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 1), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    noiseCache.set(ctx, buf);
  }
  return buf;
}

// Disconnect every node once `src` (the longest-running source) ends.
function cleanup(src, nodes) {
  src.onended = () => nodes.forEach((n) => n.disconnect());
}

function env(ctx, time, peak, dur) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, time);
  g.gain.linearRampToValueAtTime(peak, time + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  return g;
}

function noiseVoice(ctx, dest, time, { type, freq, q, peak, dur }) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = freq;
  filter.Q.value = q;
  const g = env(ctx, time, peak, dur);
  src.connect(filter);
  filter.connect(g);
  g.connect(dest);
  src.start(time);
  src.stop(time + dur + 0.02);
  cleanup(src, [src, filter, g]);
}

export function kick(ctx, dest, time) {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(165, time);
  osc.frequency.exponentialRampToValueAtTime(42, time + 0.16);
  const g = env(ctx, time, 0.72, 0.48);
  osc.connect(g);
  g.connect(dest);
  osc.start(time);
  osc.stop(time + 0.5);
  cleanup(osc, [osc, g]);
  // Click: the beater hitting the skin, so the kick cuts through a busy mix.
  noiseVoice(ctx, dest, time, { type: 'highpass', freq: 2500, q: 0.7, peak: 0.18, dur: 0.012 });
}

export function snare(ctx, dest, time) {
  noiseVoice(ctx, dest, time, { type: 'bandpass', freq: 1800, q: 0.8, peak: 0.5, dur: 0.2 });
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(190, time);
  osc.frequency.exponentialRampToValueAtTime(120, time + 0.08);
  const g = env(ctx, time, 0.3, 0.12);
  osc.connect(g);
  g.connect(dest);
  osc.start(time);
  osc.stop(time + 0.14);
  cleanup(osc, [osc, g]);
}

export function hat(ctx, dest, time) {
  noiseVoice(ctx, dest, time, { type: 'highpass', freq: 7000, q: 0.7, peak: 0.25, dur: 0.06 });
}

// Clap: three quick noise bursts then a short tail, like hands that don't
// quite land together.
export function clap(ctx, dest, time) {
  [0, 0.011, 0.022].forEach((t) => {
    noiseVoice(ctx, dest, time + t, { type: 'bandpass', freq: 1200, q: 1.2, peak: 1.2, dur: 0.03 });
  });
  noiseVoice(ctx, dest, time + 0.033, { type: 'bandpass', freq: 1100, q: 0.9, peak: 1.05, dur: 0.16 });
}

// Percussion: a conga-like tuned skin with a short noise slap on top.
export function perc(ctx, dest, time) {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(330, time);
  osc.frequency.exponentialRampToValueAtTime(240, time + 0.06);
  const g = env(ctx, time, 0.5, 0.22);
  osc.connect(g);
  g.connect(dest);
  osc.start(time);
  osc.stop(time + 0.24);
  cleanup(osc, [osc, g]);
  noiseVoice(ctx, dest, time, { type: 'highpass', freq: 3000, q: 0.7, peak: 0.12, dur: 0.02 });
}

// Soft-clip curve for the bass grit (tanh-shaped, computed once per context).
const driveCache = new WeakMap();
function driveCurve(ctx) {
  let curve = driveCache.get(ctx);
  if (!curve) {
    curve = new Float32Array(1024);
    for (let i = 0; i < curve.length; i++) {
      const x = (i / (curve.length - 1)) * 2 - 1;
      curve[i] = Math.tanh(3 * x) / Math.tanh(3);
    }
    driveCache.set(ctx, curve);
  }
  return curve;
}

export function bass(ctx, dest, time, hz, dur) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, time);
  g.gain.linearRampToValueAtTime(1, time + 0.01);
  g.gain.setValueAtTime(1, time + Math.max(0.011, dur - 0.05));
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur + 0.05);
  g.connect(dest);

  // Grit: a driven saw through a closing lowpass.
  const saw = ctx.createOscillator();
  saw.type = 'sawtooth';
  saw.frequency.setValueAtTime(hz, time);
  const drive = ctx.createWaveShaper();
  drive.curve = driveCurve(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.value = 4;
  filter.frequency.setValueAtTime(Math.min(1200, hz * 10), time);
  filter.frequency.exponentialRampToValueAtTime(Math.max(140, hz * 2.5), time + dur);
  const sawLevel = ctx.createGain();
  sawLevel.gain.value = 0.2;
  saw.connect(drive);
  drive.connect(filter);
  filter.connect(sawLevel);
  sawLevel.connect(g);

  // Sub: a pure sine at the same pitch for the weight you feel more than hear.
  const sub = ctx.createOscillator();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(hz, time);
  const subLevel = ctx.createGain();
  subLevel.gain.value = 0.32;
  sub.connect(subLevel);
  subLevel.connect(g);

  [saw, sub].forEach((o) => {
    o.start(time);
    o.stop(time + dur + 0.08);
  });
  cleanup(saw, [saw, drive, filter, sawLevel, sub, subLevel, g]);
}

// Supersaw: five detuned saws per note for the wide, bright EDM pad.
const SUPERSAW_DETUNE = [-14, -7, 0, 7, 14];

export function chord(ctx, dest, time, hzs, dur) {
  if (!hzs.length) return;
  const g = ctx.createGain();
  const peak = 0.75 / (hzs.length * SUPERSAW_DETUNE.length);
  const attack = Math.min(0.03, dur / 4);
  g.gain.setValueAtTime(0.0001, time);
  g.gain.linearRampToValueAtTime(peak, time + attack);
  g.gain.setValueAtTime(peak, time + Math.max(attack, dur - 0.1));
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur + 0.15);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 3600;
  filter.Q.value = 0.7;
  filter.connect(g);
  g.connect(dest);
  const oscs = [];
  hzs.forEach((hz) => {
    SUPERSAW_DETUNE.forEach((detune) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = hz;
      osc.detune.value = detune;
      osc.connect(filter);
      osc.start(time);
      osc.stop(time + dur + 0.17);
      oscs.push(osc);
    });
  });
  cleanup(oscs[0], [...oscs, filter, g]);
}

// Port of the dkton.at pluck.
export function pluck(ctx, dest, time, hz) {
  const level = 0.26;
  const out = ctx.createGain();
  out.gain.setValueAtTime(0.0001, time);
  out.gain.linearRampToValueAtTime(level, time + 0.008);
  out.gain.exponentialRampToValueAtTime(0.0001, time + 1.15);

  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 3.2;
  lp.frequency.setValueAtTime(9 * hz, time);
  lp.frequency.exponentialRampToValueAtTime(Math.max(180, 2.2 * hz), time + 0.55);

  const tri = ctx.createOscillator();
  tri.type = 'triangle';
  tri.frequency.value = hz;
  const saw = ctx.createOscillator();
  saw.type = 'sawtooth';
  saw.frequency.value = hz;
  saw.detune.value = 7;
  const sawGain = ctx.createGain();
  sawGain.gain.value = 0.26;
  tri.connect(lp);
  saw.connect(sawGain);
  sawGain.connect(lp);
  lp.connect(out);
  out.connect(dest);

  const nSrc = ctx.createBufferSource();
  nSrc.buffer = noiseBuffer(ctx);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 6 * hz;
  bp.Q.value = 0.9;
  const nGain = ctx.createGain();
  nGain.gain.setValueAtTime(0.16, time);
  nGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.14);
  nSrc.connect(bp);
  bp.connect(nGain);
  nGain.connect(out);

  tri.start(time);
  saw.start(time);
  nSrc.start(time);
  nSrc.stop(time + 0.16);
  tri.stop(time + 1.2);
  saw.stop(time + 1.2);
  cleanup(tri, [tri, saw, sawGain, lp, nSrc, bp, nGain, out]);
}
