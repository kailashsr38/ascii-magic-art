/* piano-roll-scroll: a sequencer piano roll, bass, chord and melody notes scrolling past a playhead that lights the keys. */
import { Grid, palette, gradient, KEYS, rng, clamp } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const BG = add(["#14161b", "#191c22", "#1f232a", "#2a2f38", "#3a404c"]);
const TRK = add(["#5aa8ff", "#b08aff", "#ffa64a", "#5ae0a0"]);
const TRD = add(["#2a5a8a", "#5a4a8a", "#8a5a2a", "#2a7a5a"]);
const UI = add(["#e6edf3", "#8b949e", "#484f58", "#ffffff", "#f2f2f2", "#16181c", "#ff5a5a", "#c8ccd4"]);

export const meta = {
  slug: "piano-roll-scroll",
  name: "Piano Roll Scroll",
  category: "music",
  note: "A piano roll editor scrolls bass, chord and melody notes past the playhead, lighting each key on the side keyboard as it plays, with a velocity lane below.",
  tags: ["daw", "midi", "sequencer", "piano", "composer", "dashboard"],
  cols: 100, rows: 38, fps: 30,
  palette: palette(P),
};

const LO = 40, HI = 69, GY = 2, KW = 8, PH = 30, CPB = 8; // cols per beat
const BPM = 96, LOOP = 16; // beats
const BLACK = [1, 3, 6, 8, 10];
const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function song() {
  const r = rng(77), notes = [];
  const chords = [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 55, 59]];
  const roots = [45 + 12, 41 + 12, 43 + 12, 40 + 12];
  chords.forEach((c, b) => {
    c.forEach((p) => notes.push([b * 4, 4, p, 1, 0.55]));
    for (let k = 0; k < 4; k++) notes.push([b * 4 + k, k === 3 ? 0.5 : 0.75, roots[b] - 12 + (k === 2 ? 7 : 0), 0, k === 0 ? 0.95 : 0.7]);
  });
  const scale = [64, 67, 69, 67, 64, 62, 60, 62, 69, 65];
  let beat = 0;
  const rhythm = [1, 0.5, 0.5, 1, 1, 0.5, 0.5, 0.5, 0.5, 1, 1, 1.5, 0.5, 1, 1, 0.5, 1.5, 2];
  let i = 0;
  while (beat < LOOP - 0.01) {
    const len = Math.min(rhythm[i % rhythm.length], LOOP - beat);
    const p = scale[Math.floor(r() * scale.length)];
    if (r() > 0.12) notes.push([beat, len * 0.9, p, 2, 0.5 + r() * 0.5]);
    beat += len; i++;
  }
  for (let b = 0; b < LOOP; b += 0.5) if ((b * 2) % 4 === 2) notes.push([b, 0.25, 49, 3, 0.4 + r() * 0.3]);
  return notes.filter((n) => n[2] >= LO && n[2] <= HI);
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const NOTES = song();
  const rowOf = (p) => GY + (HI - p);
  const VY0 = GY + (HI - LO) + 2, VY1 = rows - 3;
  return (t) => {
    g.clear();
    const now = (t * BPM) / 60; // beats elapsed
    const loopBeat = now % LOOP;
    const playing = new Map();
    // background lanes and grid lines
    for (let p = LO; p <= HI; p++) {
      const y = rowOf(p), blk = BLACK.includes(p % 12);
      for (let x = KW; x < cols; x++) {
        const beatAt = now + (x - PH) / CPB;
        const bi = Math.round(beatAt * 4);
        const onLine = Math.abs(beatAt * 4 - bi) * CPB / 4 < 0.5;
        let co = blk ? KEYS[BG] : KEYS[BG + 1], ch = "░";
        if (onLine) {
          if (bi % 16 === 0) { co = KEYS[BG + 4]; ch = "│"; } else if (bi % 4 === 0) { co = KEYS[BG + 3]; ch = "│"; } else { co = KEYS[BG + 2]; ch = "┊"; }
        }
        g.set(x, y, ch, co);
      }
    }
    // notes
    for (const [st, len, p, tr, vel] of NOTES) {
      for (let k = -1; k <= 2; k++) {
        const s = st + (Math.floor(now / LOOP) + k) * LOOP;
        const x0 = Math.round(PH + (s - now) * CPB), x1 = Math.round(PH + (s + len - now) * CPB) - 1;
        if (x1 < KW || x0 >= cols) continue;
        const on = now >= s && now < s + len;
        if (on) playing.set(p, tr);
        const y = rowOf(p);
        for (let x = Math.max(KW, x0); x <= Math.min(cols - 1, x1); x++) {
          g.set(x, y, x === x0 ? "▐" : "█", on ? KEYS[UI + 3] : KEYS[TRK + tr]);
        }
        if (x0 >= KW && x0 < cols && x1 - x0 >= 2) {
          const nm = NAMES[p % 12];
          if (x1 - x0 >= nm.length + 1) g.text(x0 + 1, y, nm, on ? KEYS[TRK + tr] : KEYS[TRD + tr]);
          const h = Math.max(1, Math.round(vel * (VY1 - VY0 + 1)));
          for (let j = 0; j < h; j++) g.set(x0, VY1 - j, j === h - 1 ? "●" : "│", on ? KEYS[UI + 3] : KEYS[TRK + tr]);
        }
      }
    }
    // velocity lane floor and ruler
    g.hline(KW, cols - 1, VY0 - 1, "─", KEYS[UI + 2]);
    g.text(0, VY0 - 1, "VELOCITY", KEYS[UI + 1]);
    for (let x = KW; x < cols; x++) {
      const beatAt = now + (x - PH) / CPB;
      const b = Math.round(beatAt);
      if (Math.abs(beatAt - b) * CPB < 0.5) {
        if (b % 4 === 0) { const s = String(Math.floor((((b % LOOP) + LOOP) % LOOP) / 4) + 1) + "." + "1"; g.text(x, 0, s, KEYS[UI]); g.set(x, 1, "┬", KEYS[UI + 1]); }
        else g.set(x, 1, "╷", KEYS[UI + 2]);
      } else if (g.get(x, 1) === " ") g.set(x, 1, "─", KEYS[UI + 2]);
    }
    // keyboard
    for (let p = LO; p <= HI; p++) {
      const y = rowOf(p), blk = BLACK.includes(p % 12);
      const pl = playing.has(p);
      const base = blk ? KEYS[UI + 5] : KEYS[UI + 4];
      for (let x = 0; x < KW; x++) g.set(x, y, "█", pl ? KEYS[TRK + playing.get(p)] : base);
      if (blk) for (let x = 5; x < KW; x++) g.set(x, y, "█", KEYS[UI + 7]);
      if (p % 12 === 0) g.text(1, y, "C" + (Math.floor(p / 12) - 1), pl ? KEYS[UI + 5] : KEYS[UI + 2]);
      g.set(KW - 1, y, "▕", KEYS[UI + 2]);
    }
    // playhead
    for (let y = 0; y <= VY1; y++) if (y !== VY0 - 1) {
      const c = g.get(PH, y);
      if (c === " " || c === "░" || c === "┊" || c === "│" || c === "─") g.set(PH, y, "│", KEYS[UI + 6]);
    }
    g.set(PH, 0, "▼", KEYS[UI + 6]);
    // status bar
    const sy = rows - 1;
    g.fill(0, sy, cols, 1, " ", KEYS[UI + 1]);
    const bar = Math.floor(loopBeat / 4) + 1, bt = Math.floor(loopBeat % 4) + 1, tk = Math.floor((loopBeat % 1) * 960);
    g.text(1, sy, `► ${String(bar).padStart(3, "0")}.${bt}.${String(tk).padStart(3, "0")}`, KEYS[UI + 6]);
    g.text(18, sy, `${BPM} BPM   4/4   LOOP 1-5   SNAP 1/16`, KEYS[UI + 1]);
    g.set(60, sy, "■", KEYS[TRK]); g.text(62, sy, "BASS", KEYS[TRK]);
    g.set(68, sy, "■", KEYS[TRK + 1]); g.text(70, sy, "PAD", KEYS[TRK + 1]);
    g.set(75, sy, "■", KEYS[TRK + 2]); g.text(77, sy, "LEAD", KEYS[TRK + 2]);
    g.set(83, sy, "■", KEYS[TRK + 3]); g.text(85, sy, "PERC", KEYS[TRK + 3]);
    return g.frame();
  };
}
