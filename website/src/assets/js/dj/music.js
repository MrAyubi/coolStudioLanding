export const SCALE = [0, 3, 5, 7, 10];
export const ROOT_HZ = 110;
export const BPM_MIN = 90;
export const BPM_MAX = 140;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function noteToHz(degree, octave = 0) {
  const oct = Math.floor(degree / SCALE.length);
  const idx = ((degree % SCALE.length) + SCALE.length) % SCALE.length;
  return ROOT_HZ * 2 ** ((SCALE[idx] + 12 * (oct + octave)) / 12);
}

export function clampBpm(n) {
  if (!Number.isFinite(n)) return 120;
  return clamp(n, BPM_MIN, BPM_MAX);
}

export function stepDuration(bpm) {
  return 60 / clampBpm(bpm) / 4;
}

export function crossfadeGains(pos) {
  const p = clamp(pos, 0, 1);
  return { a: Math.cos((p * Math.PI) / 2), b: Math.sin((p * Math.PI) / 2) };
}

export function sweepToFilter(v) {
  const s = clamp(v, -1, 1);
  if (Math.abs(s) < 0.04) return { type: "off", freq: 0 };
  if (s < 0) return { type: "lowpass", freq: 20000 * (200 / 20000) ** -s };
  return { type: "highpass", freq: 30 * (6000 / 30) ** s };
}

export function eqToDb(v) {
  const e = clamp(v, -1, 1);
  return e < 0 ? e * 24 : e * 6;
}
