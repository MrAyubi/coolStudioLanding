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

// Track kinds keep mixing simple: put a "beat" on one deck and a "melody" on
// the other. "full" tracks carry all four layers and work on their own.
export const KINDS = ["beat", "melody", "full"];
const KIND_LAYERS = {
  beat: ["drums", "bass"],
  melody: ["chords", "lead"],
  full: LAYERS,
};

const SILENT = "- - - - - - - - - - - - - - - -";

// Chord shapes in A minor pentatonic degrees:
// 0,1,3 = Am · 1,3,4 = C · 2,4,5 = Dsus4 · 0,2,4 = A sus stack · 0,2 = A5
export const TRACKS = [
  // ── Full: all four layers ──────────────────────────────────────────────────
  {
    id: "house",
    name: "Night Drive",
    style: "House",
    kind: "full",
    suggestedBpm: 124,
    layers: {
      drums: drums("k - h - ks - h - k - h - ks - h h"),
      bass: notes("0 - - 0 - - 0 - 2 - - 2 - - 1 -"),
      chords: chords("0,2,4 - - - - - 0,2,4 - 1,3,5 - - - - - - -"),
      lead: notes("- - 7 - - 5 - - - - 8 - 7 - - -"),
    },
  },
  {
    id: "electro",
    name: "Neon Circuit",
    style: "Electro",
    kind: "full",
    suggestedBpm: 128,
    layers: {
      drums: drums("k - h - s - h k k - h - s - h -"),
      bass: notes("0 - 0 - 3 - 0 - 0 - 5 - 3 - 0 -"),
      chords: chords("- - - - 0,2,4 - - - - - - - 1,3,5 - - -"),
      lead: notes("7 - 9 - 7 - 5 - 8 - 7 - 5 - 3 -"),
    },
  },
  {
    id: "disco",
    name: "Mirror Ball",
    style: "Disco-funk",
    kind: "full",
    suggestedBpm: 118,
    layers: {
      drums: drums("k h - h kc h - h k h - h kc h - h"),
      bass: notes("0 - 5 - - 0 - 3 0 - 5 - 4 - 3 -"),
      chords: chords("- - 1,3,4 - - - 1,3,4 - - - 0,1,3 - - - - -"),
      lead: notes("- - - - 8 - - 7 - - - - 6 - 5 -"),
    },
  },
  {
    id: "minimal",
    name: "Tiny Room",
    style: "Minimal",
    kind: "full",
    suggestedBpm: 118,
    layers: {
      drums: drums("k - - - - - h - k - - - - - h -"),
      bass: notes("- - 0 - - - - - - - - 2 - - - -"),
      chords: chords("- - - - - - - - - - - - - - 0,2 -"),
      lead: notes("- - - - - 6 - - - - - - - - 7 -"),
    },
  },
  {
    id: "dub",
    name: "Deep Echo",
    style: "Dub",
    kind: "full",
    suggestedBpm: 100,
    layers: {
      drums: drums("k - - - - - h - - - k - s - - h"),
      bass: notes("0 - 0 - - 0 - - 1 - - 0 - - 3 -"),
      chords: chords("- - - - - - 0,2,4 - - - - - - - - -"),
      lead: notes("- - - - - - - - - - - - 5 - - -"),
    },
  },

  // ── Beat: drums and bass only ──────────────────────────────────────────────
  {
    id: "breaks",
    name: "Broken Glass",
    style: "Breakbeat",
    kind: "beat",
    suggestedBpm: 132,
    layers: {
      drums: drums("k - h k s - h k - k h - s h - h"),
      bass: notes("0 - - 0 - 3 - 0 - 0 2 - - 4 3 -"),
      chords: chords(SILENT),
      lead: notes(SILENT),
    },
  },
  {
    id: "techno",
    name: "Warehouse",
    style: "Techno",
    kind: "beat",
    suggestedBpm: 130,
    layers: {
      drums: drums("k - h - kc - h p k - h - kc - h h"),
      bass: notes("- 0 0 0 - 0 0 0 - 0 0 0 - 2 0 3"),
      chords: chords(SILENT),
      lead: notes(SILENT),
    },
  },
  {
    id: "hiphop",
    name: "Block Party",
    style: "Hip-hop",
    kind: "beat",
    suggestedBpm: 92,
    swing: 0.18,
    layers: {
      drums: drums("k - h - sc - h k - - k h sc - h k"),
      bass: notes("0 - - 0 - - - 3 - 2 0 - - - 4 -"),
      chords: chords(SILENT),
      lead: notes(SILENT),
    },
  },
  {
    id: "afrobeat",
    name: "Lagos Sun",
    style: "Afrobeat",
    kind: "beat",
    suggestedBpm: 108,
    swing: 0.12,
    layers: {
      drums: drums("k - p h s p - h k p - h s p p h"),
      bass: notes("0 - - 2 - 0 - 3 - 3 2 - 0 - 4 -"),
      chords: chords(SILENT),
      lead: notes(SILENT),
    },
  },
  {
    id: "latin",
    name: "Clave Heat",
    style: "Latin",
    kind: "beat",
    suggestedBpm: 112,
    layers: {
      // 3-2 son clave on the percussion: steps 0, 3, 6, 10, 12
      drums: drums("kp - h p - h p - k h p - p h - h"),
      bass: notes("- - 0 0 - - 3 - - - 2 0 - - 4 -"),
      chords: chords(SILENT),
      lead: notes(SILENT),
    },
  },

  // ── Melody: chords and lead only ───────────────────────────────────────────
  {
    id: "ambient",
    name: "Slow Light",
    style: "Ambient",
    kind: "melody",
    suggestedBpm: 90,
    layers: {
      drums: drums(SILENT),
      bass: notes(SILENT),
      chords: chords("0,1,3 - - - - - - - 1,3,4 - - - 2,4,5 - - -"),
      lead: notes("- - - - 7 - - - 8 - - - 6 - 5 -"),
    },
  },
  {
    id: "lofi",
    name: "Rainy Window",
    style: "Lo-fi",
    kind: "melody",
    suggestedBpm: 90,
    swing: 0.24,
    layers: {
      drums: drums(SILENT),
      bass: notes(SILENT),
      chords: chords("0,1,3 - - 0,1,3 - - - - 2,4,5 - - - 1,3,4 - 1,3,4 -"),
      lead: notes("- - 7 - - 6 - 5 - - - - 8 - 7 6"),
    },
  },
  {
    id: "trance",
    name: "Skyline",
    style: "Trance",
    kind: "melody",
    suggestedBpm: 138,
    layers: {
      drums: drums(SILENT),
      bass: notes(SILENT),
      chords: chords("0,1,3 - - - - - - - 1,3,4 - - - 2,4,5 - - -"),
      lead: notes("5 6 8 5 6 8 5 6 8 5 6 8 9 8 6 5"),
    },
  },
  {
    id: "synthwave",
    name: "Night Runner",
    style: "Synthwave",
    kind: "melody",
    suggestedBpm: 110,
    layers: {
      drums: drums(SILENT),
      bass: notes(SILENT),
      chords: chords("0,1,3 - - 0,1,3 - - 0,1,3 - 1,3,4 - - 1,3,4 - - 2,4,5 -"),
      lead: notes("- - 8 - 7 - 6 - 5 - 7 - 8 - 9 -"),
    },
  },
];
export function getTrack(id) {
  return TRACKS.find((t) => t.id === id);
}

const isDegree = (d) => Number.isInteger(d) && d >= 0 && d <= MAX_DEGREE;

const hasSound = (step) => step !== null && step !== "";

// The layers of `track` that play at least one note or hit, in LAYERS order.
export function layersWithSound(track) {
  return LAYERS.filter((l) => (track.layers[l] || []).some(hasSound));
}

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
  if (!KINDS.includes(track.kind)) {
    bad(`kind ${JSON.stringify(track.kind)} must be one of ${KINDS.join(", ")}`);
  } else if (problems.length === 0) {
    const want = KIND_LAYERS[track.kind].join(",");
    const got = layersWithSound(track).join(",");
    if (got !== want) bad(`kind ${track.kind} needs exactly layers ${want}, has ${got || "none"}`);
  }
  return problems;
}
