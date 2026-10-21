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
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);
  const g = env(ctx, time, 0.9, 0.38);
  osc.connect(g);
  g.connect(dest);
  osc.start(time);
  osc.stop(time + 0.4);
  cleanup(osc, [osc, g]);
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

export function bass(ctx, dest, time, hz, dur) {
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(hz, time);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.value = 4;
  filter.frequency.setValueAtTime(Math.min(900, hz * 8), time);
  filter.frequency.exponentialRampToValueAtTime(Math.max(120, hz * 2), time + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, time);
  g.gain.linearRampToValueAtTime(0.45, time + 0.01);
  g.gain.setValueAtTime(0.45, time + Math.max(0.011, dur - 0.05));
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur + 0.05);
  osc.connect(filter);
  filter.connect(g);
  g.connect(dest);
  osc.start(time);
  osc.stop(time + dur + 0.08);
  cleanup(osc, [osc, filter, g]);
}

export function chord(ctx, dest, time, hzs, dur) {
  const g = ctx.createGain();
  const peak = Math.min(0.5, 0.6 / Math.max(1, hzs.length));
  const attack = Math.min(0.03, dur / 4);
  g.gain.setValueAtTime(0.0001, time);
  g.gain.linearRampToValueAtTime(peak, time + attack);
  g.gain.setValueAtTime(peak, time + Math.max(attack, dur - 0.1));
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur + 0.15);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 2200;
  filter.Q.value = 0.7;
  filter.connect(g);
  g.connect(dest);
  const oscs = [];
  hzs.forEach((hz) => {
    [-6, 6].forEach((detune) => {
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
  if (oscs.length) cleanup(oscs[0], [...oscs, filter, g]);
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
