// Preset tracks: 16-step patterns per layer. Pure data, Node-importable.
import { BPM_MIN, BPM_MAX, SWING_MAX } from "./music.js";

export const LAYERS = ["drums", "bass", "chords", "lead"];

const STEPS = 16;
const MAX_DEGREE = 9;

// Authoring helpers: whitespace-separated tokens, "-" is silence.
// Drum letters: k kick, s snare, h hat, c clap, p percussion (conga-like).
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
  // ── Genre pack: chord shapes in the A minor pentatonic degrees ──────────
  // 0,1,3 = Am · 1,3,4 = C · 2,4,5 = Dsus4 · 0,2 = A5 power chord
  {
    id: "hiphop",
    name: "Block Party",
    style: "Hip-hop",
    suggestedBpm: 92,
    swing: 0.18,
    layers: {
      drums: drums("k - h - sc - h k - - k h sc - h -"),
      bass: notes("0 - - 0 - - - 3 - - 0 - - - 4 -"),
      chords: chords("0,1,3 - - - - - - - 1,3,4 - - - - - - -"),
      lead: notes("- - - - - - 7 - - - - - 5 - 6 -"),
    },
  },
  {
    id: "lofi",
    name: "Rainy Window",
    style: "Lo-fi",
    suggestedBpm: 90,
    swing: 0.24,
    layers: {
      drums: drums("k - h - s - h - - k h - s - h -"),
      bass: notes("0 - - - - - - - 1 - - - - - 2 -"),
      chords: chords("0,1,3 - - - - - - - 2,4,5 - - - 1,3,4 - - -"),
      lead: notes("- - 7 - - 6 - - - - - - 8 - 7 -"),
    },
  },
  {
    id: "techno",
    name: "Warehouse",
    style: "Techno",
    suggestedBpm: 130,
    layers: {
      drums: drums("k - h - kc - h - k - h - kc - h h"),
      bass: notes("- - 0 0 - - 0 0 - - 0 0 - - 2 0"),
      chords: chords("- - - - - - - - - - 0,2 - - - - -"),
      lead: notes("5 - - 5 - - 5 - - 5 - - 7 - - -"),
    },
  },
  {
    id: "trance",
    name: "Skyline",
    style: "Trance",
    suggestedBpm: 138,
    layers: {
      drums: drums("k - h - kc - h - k - h - kc - h -"),
      bass: notes("- - 0 - - - 0 - - - 0 - - - 0 -"),
      chords: chords("0,1,3 - - - - - - - - - - - 1,3,4 - - -"),
      lead: notes("5 6 8 5 6 8 5 6 8 5 6 8 9 8 6 5"),
    },
  },
  {
    id: "synthwave",
    name: "Night Runner",
    style: "Synthwave",
    suggestedBpm: 110,
    layers: {
      drums: drums("k - h - s - h - k - h - s - h -"),
      bass: notes("0 5 0 5 0 5 0 5 1 6 1 6 2 7 2 7"),
      chords: chords("0,1,3 - - - - - - - 1,3,4 - - - 2,4,5 - - -"),
      lead: notes("- - 8 - 7 - 6 - - - 7 - - - 5 -"),
    },
  },
  {
    id: "disco",
    name: "Mirror Ball",
    style: "Disco-funk",
    suggestedBpm: 118,
    layers: {
      drums: drums("k h - h kc h - h k h - h kc h - h"),
      bass: notes("0 - 5 - - 0 - 3 0 - 5 - 4 - 3 -"),
      chords: chords("- - 1,3,4 - - - 1,3,4 - - - 0,1,3 - - - - -"),
      lead: notes("- - - - 8 - - 7 - - - - 6 - 5 -"),
    },
  },
  {
    id: "afrobeat",
    name: "Lagos Sun",
    style: "Afrobeat",
    suggestedBpm: 108,
    swing: 0.12,
    layers: {
      drums: drums("k - p h s p - h k p - h s - p h"),
      bass: notes("0 - - 2 - 0 - - 3 - 2 - 0 - - -"),
      chords: chords("- - 1,3,4 - - - - - - - 1,3,4 - - - - -"),
      lead: notes("7 - 8 - - - - - 7 - 6 - - - - -"),
    },
  },
  {
    id: "latin",
    name: "Clave Heat",
    style: "Latin",
    suggestedBpm: 112,
    layers: {
      // 3-2 son clave on the percussion: steps 0, 3, 6, 10, 12
      drums: drums("kp - h p - h p - k h p - p h - h"),
      bass: notes("- - - 0 - - 3 - - - - 0 - - 4 -"),
      chords: chords("0,1,3 - - 0,1,3 - - 1,3,4 - - 1,3,4 - - 0,1,3 - - -"),
      lead: notes("- - 7 - 8 - - - 9 - 8 - 7 - - -"),
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
  const { swing } = track;
  if (swing !== undefined && !(Number.isFinite(swing) && swing >= 0 && swing <= SWING_MAX)) {
    bad(`swing ${JSON.stringify(swing)} outside 0-${SWING_MAX}`);
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
        if (typeof step !== "string" || !/^[kshcp]*$/.test(step)) {
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
