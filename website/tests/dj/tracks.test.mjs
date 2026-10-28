import test from "node:test";
import assert from "node:assert/strict";
import {
  LAYERS,
  TRACKS,
  getTrack,
  validateTrack,
  KINDS,
  layersWithSound,
} from "../../src/assets/js/dj/tracks.js";

const clone = (t) => JSON.parse(JSON.stringify(t));

test("all presets are valid", () => {
  for (const t of TRACKS) assert.deepEqual(validateTrack(t), [], t.id);
});

test("ids are unique and cover the original six plus eight new genres", () => {
  const ids = TRACKS.map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual([...ids].sort(), [
    "afrobeat", "ambient", "breaks", "disco", "dub", "electro", "hiphop",
    "house", "latin", "lofi", "minimal", "synthwave", "techno", "trance",
  ]);
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

test("drum steps accept clap (c) and percussion (p)", () => {
  const t = clone(TRACKS[0]);
  t.layers.drums[0] = "kc";
  t.layers.drums[1] = "p";
  assert.deepEqual(validateTrack(t), []);
});

test("swing is optional and must be between 0 and 0.35", () => {
  const t = clone(TRACKS[0]);
  delete t.swing;
  assert.deepEqual(validateTrack(t), []);
  t.swing = 0.2;
  assert.deepEqual(validateTrack(t), []);
  for (const bad of [-0.1, 0.5, "0.2", NaN]) {
    t.swing = bad;
    assert.ok(validateTrack(t).some((m) => /swing/.test(m)), String(bad));
  }
});

test("the swung genres actually swing and the original six stay straight", () => {
  for (const id of ["hiphop", "lofi", "afrobeat"]) assert.ok(getTrack(id).swing > 0, id);
  for (const id of ["house", "breaks", "dub", "ambient", "electro", "minimal"]) {
    assert.ok(!getTrack(id).swing, id);
  }
});

test("latin and afrobeat use the percussion voice, hip-hop and disco use the clap", () => {
  const uses = (id, ch) => getTrack(id).layers.drums.some((s) => s.includes(ch));
  assert.ok(uses("latin", "p") && uses("afrobeat", "p"));
  assert.ok(uses("hiphop", "c") && uses("disco", "c"));
});

test("every track is a beat, melody or full track, split as agreed", () => {
  assert.deepEqual(KINDS, ["beat", "melody", "full"]);
  const byKind = (k) => TRACKS.filter((t) => t.kind === k).map((t) => t.id).sort();
  assert.deepEqual(byKind("beat"), ["afrobeat", "breaks", "hiphop", "latin", "techno"]);
  assert.deepEqual(byKind("melody"), ["ambient", "lofi", "synthwave", "trance"]);
  assert.deepEqual(byKind("full"), ["disco", "dub", "electro", "house", "minimal"]);
});

test("layersWithSound lists only layers that have at least one note or hit", () => {
  assert.deepEqual(layersWithSound(getTrack("techno")), ["drums", "bass"]);
  assert.deepEqual(layersWithSound(getTrack("trance")), ["chords", "lead"]);
  assert.deepEqual(layersWithSound(getTrack("house")), ["drums", "bass", "chords", "lead"]);
});

test("validateTrack enforces each kind's layers", () => {
  const beat = clone(getTrack("techno"));
  beat.layers.lead[3] = 5;
  assert.ok(validateTrack(beat).some((m) => /kind/.test(m)), "beat with a lead note");

  const melody = clone(getTrack("trance"));
  melody.layers.drums[0] = "k";
  assert.ok(validateTrack(melody).some((m) => /kind/.test(m)), "melody with a kick");

  const full = clone(getTrack("house"));
  full.layers.chords = full.layers.chords.map(() => null);
  assert.ok(validateTrack(full).some((m) => /kind/.test(m)), "full track missing chords");

  const unknown = clone(getTrack("house"));
  unknown.kind = "solo";
  assert.ok(validateTrack(unknown).some((m) => /kind/.test(m)), "unknown kind");
});
