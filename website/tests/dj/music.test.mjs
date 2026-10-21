import test from "node:test";
import assert from "node:assert/strict";
import {
  noteToHz,
  clampBpm,
  stepDuration,
  crossfadeGains,
  sweepToFilter,
  eqToDb,
} from "../../src/assets/js/dj/music.js";

test("noteToHz maps scale degrees and octaves", () => {
  assert.equal(noteToHz(0), 110);
  assert.equal(noteToHz(5), 220);
  assert.ok(Math.abs(noteToHz(1) - 110 * 2 ** (3 / 12)) < 1e-9);
  assert.equal(noteToHz(0, 1), 220);
});

test("clampBpm clamps and handles non-finite", () => {
  assert.equal(clampBpm(60), 90);
  assert.equal(clampBpm(200), 140);
  assert.equal(clampBpm(NaN), 120);
});

test("stepDuration is seconds per 16th", () => {
  assert.equal(stepDuration(120), 0.125);
});

test("crossfadeGains is equal power", () => {
  assert.deepEqual(crossfadeGains(0), { a: 1, b: 0 });
  const end = crossfadeGains(1);
  assert.ok(Math.abs(end.a) < 1e-9);
  assert.equal(end.b, 1);
  const mid = crossfadeGains(0.3);
  assert.ok(Math.abs(mid.a ** 2 + mid.b ** 2 - 1) < 1e-9);
});

test("sweepToFilter maps sweep to filter", () => {
  assert.equal(sweepToFilter(0).type, "off");
  const lo = sweepToFilter(-1);
  assert.equal(lo.type, "lowpass");
  assert.ok(Math.abs(lo.freq - 200) < 1e-6);
  const hi = sweepToFilter(1);
  assert.equal(hi.type, "highpass");
  assert.ok(Math.abs(hi.freq - 6000) < 1e-6);
  assert.deepEqual(sweepToFilter(5), hi);
});

test("eqToDb maps -24..+6 dB", () => {
  assert.equal(eqToDb(-1), -24);
  assert.equal(eqToDb(1), 6);
  assert.equal(eqToDb(0), 0);
});
