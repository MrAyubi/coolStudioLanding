// Preset tracks: 16-step patterns per layer. Pure data, Node-importable.
import { BPM_MIN, BPM_MAX } from "./music.js";

export const LAYERS = ["drums", "bass", "chords", "lead"];

const STEPS = 16;
const MAX_DEGREE = 9;

// Authoring helpers: whitespace-separated tokens, "-" is silence.
const drums = (s) => s.trim().split(/\s+/).map((t) => (t === "-" ? "" : t));
const notes = (s) => s.trim().split(/\s+/).map((t) => (t === "-" ? null : Number(t)));
// Chord tokens are degrees joined by "," e.g. "0,2,4".
const chords = (s) =>
  s.trim().split(/\s+/).map((t) => (t === "-" ? null : t.split(",").map(Number)));

export const TRACKS = [
  {
    id: "house",
    name: "Night Drive",
    style: "House",
    suggestedBpm: 124,
    layers: {
      drums: drums("k - h - ks - h - k - h - ks - h h"),
      bass: notes("0 - - 0 - - 0 - 2 - - 2 - - 1 -"),
      chords: chords("0,2,4 - - - - - 0,2,4 - 1,3,5 - - - - - - -"),
      lead: notes("- - 7 - - 5 - - - - 8 - 7 - - -"),
    },
  },
  {
    id: "breaks",
    name: "Broken Glass",
    style: "Breakbeat",
    suggestedBpm: 132,
    layers: {
      drums: drums("k - h - s - h k - k h - s - h h"),
      bass: notes("0 - - 0 - 3 - - 0 - 2 - - - 4 -"),
      chords: chords("- - 0,2,4 - - - - - - - 1,3,5 - - - - -"),
      lead: notes("- 6 - - 8 - - 6 - - - 9 - 7 - -"),
    },
  },
  {
    id: "dub",
    name: "Deep Echo",
    style: "Dub",
    suggestedBpm: 100,
    layers: {
      drums: drums("k - - - - - h - - - k - s - - h"),
      bass: notes("0 - 0 - - 0 - - 1 - - 0 - - 3 -"),
      chords: chords("- - - - - - 0,2,4 - - - - - - - - -"),
      lead: notes("- - - - - - - - - - - - 5 - - -"),
    },
  },
  {
    id: "ambient",
    name: "Slow Light",
    style: "Ambient",
    suggestedBpm: 90,
    layers: {
      drums: drums("- - - - - - h - - - - - - - h -"),
      bass: notes("0 - - - - - - - 2 - - - - - - -"),
      chords: chords("0,2,4 - - - - - - - 1,3,5 - - - - - - -"),
      lead: notes("- - - - 7 - - - - - - - 6 - 5 -"),
    },
  },
  {
    id: "electro",
    name: "Neon Circuit",
    style: "Electro",
    suggestedBpm: 128,
    layers: {
      drums: drums("k - h - s - h k k - h - s - h -"),
      bass: notes("0 - 0 - 3 - 0 - 0 - 5 - 3 - 0 -"),
      chords: chords("- - - - 0,2,4 - - - - - - - 1,3,5 - - -"),
      lead: notes("7 - 9 - 7 - 5 - 8 - 7 - 5 - 3 -"),
    },
  },
  {
    id: "minimal",
    name: "Tiny Room",
    style: "Minimal",
    suggestedBpm: 118,
    layers: {
      drums: drums("k - - - - - h - k - - - - - h -"),
      bass: notes("- - 0 - - - - - - - - 2 - - - -"),
      chords: chords("- - - - - - - - - - - - - - 0,2 -"),
      lead: notes("- - - - - 6 - - - - - - - - 7 -"),
    },
  },
];

export function getTrack(id) {
  return TRACKS.find((t) => t.id === id);
}

const isDegree = (d) => Number.isInteger(d) && d >= 0 && d <= MAX_DEGREE;

export function validateTrack(track) {
  const problems = [];
  if (!track || typeof track !== "object") return ["track is not an object"];
  const id = track.id || "?";
  const bad = (msg) => problems.push(`${id}: ${msg}`);

  if (!track.id) bad("missing id");
  if (!track.name) bad("missing name");
  if (!track.style) bad("missing style");
  const bpm = track.suggestedBpm;
  if (!Number.isFinite(bpm) || bpm < BPM_MIN || bpm > BPM_MAX) {
    bad(`suggestedBpm ${bpm} outside ${BPM_MIN}-${BPM_MAX}`);
  }

  const layers = track.layers || {};
  for (const name of LAYERS) {
    const steps = layers[name];
    if (!Array.isArray(steps)) {
      bad(`missing layer ${name}`);
      continue;
    }
    if (steps.length !== STEPS) bad(`${name} has ${steps.length} steps, expected ${STEPS}`);
    steps.forEach((step, i) => {
      if (name === "drums") {
        if (typeof step !== "string" || !/^[ksh]*$/.test(step)) {
          bad(`drums step ${i} invalid: ${JSON.stringify(step)}`);
        }
      } else if (name === "chords") {
        if (step !== null && !(Array.isArray(step) && step.length > 0 && step.every(isDegree))) {
          bad(`chords step ${i} invalid: ${JSON.stringify(step)}`);
        }
      } else if (step !== null && !isDegree(step)) {
        bad(`${name} step ${i} invalid degree: ${JSON.stringify(step)}`);
      }
    });
  }
  return problems;
}
