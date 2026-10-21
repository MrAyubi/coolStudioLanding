// DOM bindings for the DJ deck's sliders: knobs, the crossfader and the XY pad.
// The pure helpers at the top have no DOM access so Node tests can import this
// module; everything touching the DOM lives inside the bind functions.

const DRAG_RANGE = 150; // px of vertical drag that sweeps a knob end to end
// A press is a tap if it barely moved and was short; a double tap is a second
// press soon after a tap's release, near where the tap was.
const TAP_MAX_MOVE = 4; // px
const TAP_MAX_MS = 250;
const DOUBLE_TAP_GAP_MS = 300; // from the tap's release to the next pointerdown
const DOUBLE_TAP_MAX_DIST = 10; // px between the two presses
const STEP_KEYS = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'PageUp', 'PageDown', 'Home', 'End'];

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const round = (v) => Math.round(v * 1e4) / 1e4; // stops float drift (0.5 + 0.05)

// Dragging up raises the value; `range` px covers the whole 0–1 span.
export function dragToValue(startValue, startY, y, range = DRAG_RANGE) {
  return round(clamp01(startValue + (startY - y) / range));
}

// Where `pos` falls along a track starting at `start` and `length` long.
export function positionToValue(pos, start, length) {
  if (!(length > 0)) return 0;
  return round(clamp01((pos - start) / length));
}

export function stepValue(value, key, step = 0.05) {
  const next = {
    ArrowUp: value + step,
    ArrowRight: value + step,
    ArrowDown: value - step,
    ArrowLeft: value - step,
    PageUp: value + 0.1,
    PageDown: value - 0.1,
    Home: 0,
    End: 1,
  }[key];
  return next === undefined ? value : round(clamp01(next));
}

// prev: the last completed press { x, y, upTime, moved, duration } (or null);
// next: the new pointerdown { x, y, time }. Times share one clock (e.timeStamp).
export function isDoubleTap(prev, next) {
  if (!prev || prev.moved > TAP_MAX_MOVE || prev.duration > TAP_MAX_MS) return false;
  const gap = next.time - prev.upTime;
  if (gap < 0 || gap > DOUBLE_TAP_GAP_MS) return false;
  return Math.hypot(next.x - prev.x, next.y - prev.y) <= DOUBLE_TAP_MAX_DIST;
}

const hasModifier = (e) => e.ctrlKey || e.metaKey || e.altKey;

// One pointer at a time, captured so a release outside the element (or the
// window) still ends the drag. onEnd(e, released) runs once per drag;
// `released` is false for a cancel or lost capture. Returns an unbind function.
function trackPointer(el, onStart, onMove, onEnd = () => {}) {
  let id = null;
  const down = (e) => {
    if (id !== null || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault(); // no text selection or scrolling while dragging
    el.focus({ preventScroll: true });
    if (onStart(e) === false) return; // gesture handled, no drag
    id = e.pointerId;
    try {
      el.setPointerCapture(id);
    } catch (err) {
      // The pointer is already gone. Without capture a release outside the
      // element would never reach us and `id` would block every later press.
      id = null;
      onEnd(e, false);
    }
  };
  const move = (e) => {
    if (e.pointerId === id) onMove(e);
  };
  const end = (e) => {
    if (e.pointerId !== id) return;
    id = null;
    onEnd(e, e.type === 'pointerup');
  };
  const listeners = {
    pointerdown: down,
    pointermove: move,
    pointerup: end,
    pointercancel: end,
    lostpointercapture: end,
  };
  Object.entries(listeners).forEach(([type, fn]) => el.addEventListener(type, fn));
  return () => Object.entries(listeners).forEach(([type, fn]) => el.removeEventListener(type, fn));
}

// A 0–1 slider. Vertical knobs drag relative to where the pointer went down;
// a horizontal one (axis 'x', e.g. the crossfader) follows the pointer along
// its track, `inset` px in from each end. Double-click/tap resets to the default.
export function bindKnob(el, opts) {
  const { onChange, valueText, axis = 'y', inset = 0 } = opts;
  const defaultValue = opts.defaultValue ?? opts.value;
  let value = round(clamp01(opts.value));
  let startValue = value;
  let startY = 0;
  let press = null; // the press in progress: { x, y, time, moved }
  let lastTap = null; // the last completed press, for isDoubleTap

  const render = () => {
    el.setAttribute('aria-valuenow', String(value));
    el.style.setProperty('--value', String(value));
    if (valueText) el.setAttribute('aria-valuetext', valueText(value));
  };
  const set = (v) => {
    const next = round(clamp01(v));
    if (next === value) return;
    value = next;
    render();
    onChange(value);
  };
  const trackMove = (e) => {
    if (press) press.moved = Math.max(press.moved, Math.hypot(e.clientX - press.x, e.clientY - press.y));
  };
  const fromX = (e) => {
    const rect = el.getBoundingClientRect();
    return positionToValue(e.clientX, rect.left + inset, rect.width - 2 * inset);
  };

  const unbindPointer = trackPointer(
    el,
    (e) => {
      const next = { x: e.clientX, y: e.clientY, time: e.timeStamp };
      const double = isDoubleTap(lastTap, next);
      lastTap = null;
      if (double) {
        set(defaultValue);
        return false;
      }
      press = { ...next, moved: 0 };
      if (axis === 'x') set(fromX(e));
      startValue = value;
      startY = e.clientY;
      return true;
    },
    (e) => {
      trackMove(e);
      set(axis === 'x' ? fromX(e) : dragToValue(startValue, startY, e.clientY));
    },
    (e, released) => {
      if (released && press) {
        trackMove(e);
        const { x, y, time, moved } = press;
        lastTap = { x, y, upTime: e.timeStamp, moved, duration: e.timeStamp - time };
      }
      press = null;
    },
  );
  const onKey = (e) => {
    if (hasModifier(e) || !STEP_KEYS.includes(e.key)) return;
    e.preventDefault(); // arrows and paging would otherwise scroll the page
    set(stepValue(value, e.key));
  };
  el.addEventListener('keydown', onKey);
  render();

  return () => {
    unbindPointer();
    el.removeEventListener('keydown', onKey);
  };
}

// Two-axis pad: x left→right, y bottom→top (top = 1). Arrow keys nudge the
// puck while the pad has focus. Starts from the element's --x / --y.
export function bindXY(el, onChange) {
  const initial = (name) => clamp01(parseFloat(el.style.getPropertyValue(name)) || 0);
  let x = initial('--x');
  let y = initial('--y');

  const set = (nx, ny) => {
    nx = round(clamp01(nx));
    ny = round(clamp01(ny));
    if (nx === x && ny === y) return;
    x = nx;
    y = ny;
    el.style.setProperty('--x', String(x));
    el.style.setProperty('--y', String(y));
    onChange(x, y);
  };
  const fromPointer = (e) => {
    const rect = el.getBoundingClientRect();
    set(
      positionToValue(e.clientX, rect.left, rect.width),
      1 - positionToValue(e.clientY, rect.top, rect.height),
    );
  };

  const unbindPointer = trackPointer(el, fromPointer, fromPointer);
  const onKey = (e) => {
    if (hasModifier(e)) return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') set(stepValue(x, e.key), y);
    else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') set(x, stepValue(y, e.key));
    else return;
    e.preventDefault();
  };
  el.addEventListener('keydown', onKey);

  return () => {
    unbindPointer();
    el.removeEventListener('keydown', onKey);
  };
}
