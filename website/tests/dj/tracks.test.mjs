import test from "node:test";
import assert from "node:assert/strict";
import {
  LAYERS,
  TRACKS,
  getTrack,
  validateTrack,
} from "../../src/assets/js/dj/tracks.js";

const clone = (t) => JSON.parse(JSON.stringify(t));

test("all presets are valid", () => {
  for (const t of TRACKS) assert.deepEqual(validateTrack(t), [], t.id);
});

test("ids are unique and match the six styles", () => {
  const ids = TRACKS.map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual([...ids].sort(), ["ambient", "breaks", "dub", "electro", "house", "minimal"]);
  assert.deepEqual(LAYERS, ["drums", "bass", "chords", "lead"]);
});

test("suggestedBpm is within 90-140", () => {
  for (const t of TRACKS) assert.ok(t.suggestedBpm >= 90 && t.suggestedBpm <= 140, t.id);
});

test("validateTrack flags a 15-step bass", () => {
  const t = clone(TRACKS[0]);
  t.layers.bass.pop();
  assert.ok(validateTrack(t).length > 0);
});

test("validateTrack flags a bad drum character", () => {
  const t = clone(TRACKS[0]);
  t.layers.drums[0] = "x";
  assert.ok(validateTrack(t).length > 0);
});

test("validateTrack flags an out-of-range lead degree", () => {
  const t = clone(TRACKS[0]);
  t.layers.lead[0] = 12;
  assert.ok(validateTrack(t).length > 0);
});

test("validateTrack flags missing layer, bad chord step, non-integer degree", () => {
  const a = clone(TRACKS[0]);
  delete a.layers.chords;
  assert.ok(validateTrack(a).length > 0);
  const b = clone(TRACKS[0]);
  b.layers.chords[0] = 3;
  assert.ok(validateTrack(b).length > 0);
  const c = clone(TRACKS[0]);
  c.layers.bass[0] = 1.5;
  assert.ok(validateTrack(c).length > 0);
});

test("getTrack returns undefined for unknown ids", () => {
  assert.equal(getTrack("nope"), undefined);
  assert.equal(getTrack("house").id, "house");
});
