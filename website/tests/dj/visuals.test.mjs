import test from "node:test";
import assert from "node:assert/strict";
import {
  rms,
  levelToMeter,
  smoothLevel,
  rotationPeriod,
  advanceAngle,
} from "../../src/assets/js/dj/visuals.js";

const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);

test("rms of silence (128-centred bytes) is 0", () => {
  assert.equal(rms(new Uint8Array(64).fill(128)), 0);
  assert.equal(rms(new Uint8Array(0)), 0);
});

test("rms of a full-scale square wave is ~1", () => {
  const sq = Uint8Array.from({ length: 64 }, (_, i) => (i % 2 ? 0 : 255));
  near(rms(sq), 1, 0.01);
});

test("rms of a sine is ~0.707", () => {
  const n = 1024;
  const sine = Uint8Array.from({ length: n }, (_, i) => Math.round(128 + 127 * Math.sin((2 * Math.PI * 8 * i) / n)));
  near(rms(sine), Math.SQRT1_2, 0.01);
});

test("rms accepts float samples", () => {
  near(rms(Float32Array.from([0.5, -0.5, 0.5, -0.5])), 0.5);
});

test("levelToMeter maps -48..0 dB to 0..1 and clamps", () => {
  assert.equal(levelToMeter(0), 0);
  assert.equal(levelToMeter(1), 1);
  assert.equal(levelToMeter(2), 1);
  near(levelToMeter(10 ** (-24 / 20)), 0.5);
  assert.equal(levelToMeter(10 ** (-60 / 20)), 0);
});

test("smoothLevel rises instantly and decays gradually", () => {
  assert.equal(smoothLevel(0.2, 0.8, 1 / 60), 0.8);
  const next = smoothLevel(0.8, 0, 1 / 60);
  assert.ok(next < 0.8 && next > 0.7, String(next));
  near(smoothLevel(0.8, 0, 100), 0);
  assert.equal(smoothLevel(0.5, 0.5, 0), 0.5);
});

test("rotationPeriod is four beats", () => {
  assert.equal(rotationPeriod(120), 2);
  assert.equal(rotationPeriod(90), 4 * 60 / 90);
});

test("advanceAngle turns 360 degrees per period and stays in [0, 360)", () => {
  near(advanceAngle(0, 1, 120), 180);
  near(advanceAngle(350, 0.5, 120), 80);
  assert.equal(advanceAngle(42, 0, 140), 42);
});
