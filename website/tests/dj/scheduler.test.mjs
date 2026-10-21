import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createScheduler } from '../../src/assets/js/dj/scheduler.js';
import { stepDuration } from '../../src/assets/js/dj/music.js';

const EPS = 1e-9;

// Advance the fake clock to `to` in small increments, ticking like a real timer.
function advance(ctx, s, to, dt = 0.025) {
  while (ctx.currentTime < to - EPS) {
    ctx.currentTime = Math.min(to, ctx.currentTime + dt);
    s.tick();
  }
}

function harness(opts = {}) {
  const ctx = { currentTime: 0 };
  const steps = [];
  const timers = { set: 0, cleared: 0, active: new Set(), nextId: 1 };
  const setTimer = () => {
    const id = timers.nextId++;
    timers.set++;
    timers.active.add(id);
    return id;
  };
  const clearTimer = (id) => {
    if (timers.active.delete(id)) timers.cleared++;
  };
  const bpmRef = { bpm: 120 };
  const s = createScheduler({
    ctx,
    getBpm: () => bpmRef.bpm,
    onStep: (index, time) => steps.push({ index, time }),
    setTimer,
    clearTimer,
    ...opts,
  });
  return { ctx, steps, timers, s, bpmRef };
}

test('120 BPM, 1 s: 9 steps at 0.05 + k*0.125, indexes 0..8, no duplicates', () => {
  const { ctx, steps, s } = harness();
  s.start();
  advance(ctx, s, 1.0);
  assert.equal(steps.length, 9);
  steps.forEach((st, k) => {
    assert.equal(st.index, k);
    assert.ok(Math.abs(st.time - (0.05 + k * 0.125)) < EPS);
  });
  assert.equal(s.nextStepIndex, 9);
  assert.equal(s.running, true);
});

test('tempo change affects only later steps; indexes contiguous', () => {
  const { ctx, steps, s, bpmRef } = harness();
  s.start();
  advance(ctx, s, 0.5);
  const before = steps.length;
  const snapshot = steps.map((x) => ({ ...x }));
  bpmRef.bpm = 140;
  advance(ctx, s, 1.5);
  assert.ok(steps.length > before);
  assert.deepEqual(steps.slice(0, before), snapshot);
  steps.forEach((st, k) => assert.equal(st.index, k % 16));
  const d140 = stepDuration(140);
  for (let k = before; k < steps.length - 1; k++) {
    assert.ok(Math.abs(steps[k + 1].time - steps[k].time - d140) < EPS);
  }
  // the gap from the last 120 BPM step to the first new one was set when that step was scheduled
  assert.ok(Math.abs(steps[before - 1].time - snapshot[before - 1].time) < EPS);
});

test('index wraps 0..15', () => {
  const { ctx, steps, s } = harness();
  s.start();
  advance(ctx, s, 3);
  assert.ok(steps.length > 16);
  assert.equal(steps[16].index, 0);
});

test('start twice creates one timer; stop clears and tick emits nothing', () => {
  const { ctx, steps, timers, s } = harness();
  s.start();
  s.start();
  assert.equal(timers.active.size, 1);
  s.stop();
  assert.equal(timers.active.size, 0);
  assert.equal(s.running, false);
  const n = steps.length;
  ctx.currentTime = 5;
  s.tick();
  assert.equal(steps.length, n);
});

test('stop then start leaves one timer and restarts at index 0', () => {
  const { ctx, steps, timers, s } = harness();
  s.start();
  advance(ctx, s, 0.5);
  s.stop();
  s.start();
  assert.equal(timers.active.size, 1);
  const last = steps[steps.length - 1];
  assert.equal(last.index, 0);
  assert.ok(Math.abs(last.time - 0.55) < EPS);
});

test('start() ticks immediately', () => {
  const { steps, s } = harness();
  s.start();
  assert.equal(steps.length, 1);
  assert.equal(steps[0].index, 0);
});

test('10 s jump re-anchors; nothing in the past, bounded catch-up', () => {
  const { ctx, steps, s } = harness();
  s.start();
  advance(ctx, s, 0.2);
  const n = steps.length;
  const nextIdx = s.nextStepIndex;
  ctx.currentTime = 10.2;
  s.tick();
  const added = steps.slice(n);
  assert.ok(added.length >= 1);
  assert.ok(added.length <= Math.ceil(0.25 / stepDuration(120)));
  assert.equal(added[0].index, nextIdx);
  assert.ok(Math.abs(added[0].time - 10.25) < EPS);
  for (const st of added) assert.ok(st.time >= 10.2 - EPS);
});

test('late steps within maxCatchUp are never emitted in the past', () => {
  const { ctx, steps, s } = harness();
  s.start();
  const n = steps.length;
  ctx.currentTime = 0.2; // next step 0.175 is already past but within catch-up
  s.tick();
  for (const st of steps.slice(n)) assert.ok(st.time >= 0.2 - EPS);
});
