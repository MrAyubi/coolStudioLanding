import { stepDuration, clampBpm } from './music.js';

const EPS = 1e-9;
const START_OFFSET = 0.05;

export function createScheduler({
  ctx,
  getBpm,
  onStep,
  lookahead = 0.1,
  intervalMs = 25,
  setTimer = (fn, ms) => setInterval(fn, ms),
  clearTimer = (id) => clearInterval(id),
  maxCatchUp = 0.25,
} = {}) {
  let timerId = null;
  let nextTime = 0;
  let stepIndex = 0;

  function tick() {
    if (timerId === null) return;
    const now = ctx.currentTime;
    if (nextTime < now - maxCatchUp - EPS) {
      // Long stall (e.g. hidden tab): re-anchor instead of replaying.
      nextTime = now + START_OFFSET;
    }
    while (nextTime < now + lookahead - EPS) {
      const time = nextTime;
      const index = stepIndex;
      nextTime += stepDuration(clampBpm(getBpm()));
      stepIndex = (stepIndex + 1) % 16;
      // Never hand Web Audio a time in the past; it would play late in a burst.
      if (time >= now - EPS) onStep(index, time);
    }
  }

  function stop() {
    if (timerId !== null) {
      clearTimer(timerId);
      timerId = null;
    }
  }

  function start() {
    stop();
    stepIndex = 0;
    nextTime = ctx.currentTime + START_OFFSET;
    timerId = setTimer(tick, intervalMs);
    tick();
  }

  return {
    start,
    stop,
    tick,
    get running() {
      return timerId !== null;
    },
    get nextStepIndex() {
      return stepIndex;
    },
  };
}
