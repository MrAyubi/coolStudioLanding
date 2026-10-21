import test from "node:test";
import assert from "node:assert/strict";
import {
  dragToValue,
  stepValue,
  positionToValue,
  isDoubleTap,
} from "../../src/assets/js/dj/controls.js";

test("dragToValue maps a vertical drag to a clamped 0–1 value", () => {
  assert.equal(dragToValue(0.5, 300, 150), 1); // up 150 px adds 1, clamped
  assert.equal(dragToValue(0.5, 300, 450), 0); // down 150 px subtracts 1, clamped
  assert.equal(dragToValue(0.2, 100, 100), 0.2);
  assert.equal(dragToValue(0.5, 300, 285), 0.6);
  assert.equal(dragToValue(0.5, 300, 250, 100), 1);
});

test("stepValue handles arrows, paging, Home/End and other keys", () => {
  assert.equal(stepValue(0.5, "ArrowUp"), 0.55);
  assert.equal(stepValue(0.5, "ArrowRight"), 0.55);
  assert.equal(stepValue(0.5, "ArrowDown"), 0.45);
  assert.equal(stepValue(0.5, "ArrowLeft"), 0.45);
  assert.equal(stepValue(0.98, "ArrowUp"), 1);
  assert.equal(stepValue(0.02, "ArrowDown"), 0);
  assert.equal(stepValue(0.5, "PageUp"), 0.6);
  assert.equal(stepValue(0.5, "PageDown"), 0.4);
  assert.equal(stepValue(0.5, "Home"), 0);
  assert.equal(stepValue(0.5, "End"), 1);
  assert.equal(stepValue(0.5, "a"), 0.5);
  assert.equal(stepValue(0.5, "ArrowUp", 0.1), 0.6);
});

test("stepValue does not drift over repeated steps", () => {
  let v = 0;
  for (let i = 0; i < 7; i++) v = stepValue(v, "ArrowUp");
  assert.equal(v, 0.35);
});

test("positionToValue maps a pointer position along a track", () => {
  assert.equal(positionToValue(150, 100, 200), 0.25);
  assert.equal(positionToValue(50, 100, 200), 0);
  assert.equal(positionToValue(400, 100, 200), 1);
  assert.equal(positionToValue(150, 100, 0), 0); // zero-size track
});

// prev: the last completed press { x, y, upTime, moved, duration }; next: a pointerdown { x, y, time }.
const tap = (over = {}) => ({ x: 100, y: 100, upTime: 1000, moved: 0, duration: 80, ...over });
const down = (over = {}) => ({ x: 100, y: 100, time: 1150, ...over });

test("isDoubleTap: two quick taps at the same spot", () => {
  assert.equal(isDoubleTap(tap(), down()), true);
  assert.equal(isDoubleTap(tap(), down({ x: 106, y: 106 })), true); // within 10 px
});

test("isDoubleTap: quick presses 40 px apart are not a double tap", () => {
  assert.equal(isDoubleTap(tap(), down({ x: 140 })), false);
});

test("isDoubleTap: a drag followed by a quick tap is not a double tap", () => {
  assert.equal(isDoubleTap(tap({ moved: 20 }), down()), false);
});

test("isDoubleTap: a long press is not a tap", () => {
  assert.equal(isDoubleTap(tap({ duration: 400 }), down()), false);
});

test("isDoubleTap: taps 400 ms apart are not a double tap", () => {
  assert.equal(isDoubleTap(tap(), down({ time: 1400 })), false);
});

test("isDoubleTap: no previous tap", () => {
  assert.equal(isDoubleTap(null, down()), false);
});
