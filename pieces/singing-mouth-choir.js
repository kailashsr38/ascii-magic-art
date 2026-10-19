/* singing-mouth-choir: a cute two row choir of round singers, mouths opening and closing in four part harmony as notes float up. */
import { Grid, palette, gradient, KEYS, clamp, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const CURT = add(gradient(["#2a0610", "#4a0c1c", "#6e1428", "#941e36", "#b82c44"], 5));
const WOOD = add(gradient(["#3a1e0c", "#6a3a18", "#9a5a28", "#c88440"], 4));
const SKIN = add(["#ffd8b8", "#f0b890", "#c88a60", "#8a5a3a", "#ffe8d0"]);
const SKD = add(["#e8b898", "#d09870", "#a86a44", "#6a4028", "#ecd0b4"]);
const ROBE = add(["#5a8aff", "#ff8ab0", "#7ad8a0", "#ffc85a"]);
const ROBED = add(["#3a5aa8", "#a85a78", "#4a8a68", "#a8843a"]);
const FACE = add(["#2a1418", "#c8283a", "#ff8a9a", "#ff9ab0", "#ffffff", "#1a1a1a"]);
const NOTE = add(["#fff4a0", "#a0f0ff", "#ffb0e0", "#b0ffb8"]);
const HAIR = add(["#3a2010", "#e8c060", "#1a1a1a", "#a04a20", "#6a3a8a"]);

export const meta = {
  slug: "singing-mouth-choir",
  name: "Singing Mouth Choir",
  category: "music",
  note: "A cute choir of round faced singers in two rows, each part opening its mouth in turn for four part harmony while little notes float up from the stage.",
  tags: ["choir", "singing", "cute", "harmony", "voices", "hero"],
  cols: 100, rows: 30, fps: 30,
  palette: palette(P),
};

const BPM = 76;
// per part: phrases of [beats, open 0..1, vowel 0 = ah 1 = oh]
const PARTS = [
  [[2, 1, 0], [1, 0.7, 1], [1, 0.9, 0], [3, 1, 1], [1, 0, 0], [2, 0.8, 0], [2, 1, 1], [3, 0.9, 0], [1, 0, 0]],
  [[1, 0, 0], [1, 0.7, 0], [2, 0.8, 1], [2, 0.6, 0], [2, 0, 0], [2, 0.8, 1], [1, 0.6, 0], [1, 0.7, 0], [4, 0.8, 1]],
  [[2, 0.6, 1], [2, 0, 0], [2, 0.7, 0], [2, 0.8, 1], [1, 0.6, 0], [1, 0.6, 1], [2, 0, 0], [4, 0.7, 0]],
  [[4, 0.7, 1], [2, 0, 0], [2, 0.8, 0], [4, 0.9, 1], [2, 0, 0], [2, 0.6, 0]],
];
const LOOP = 16;

function voice(p, beat) {
  const b = ((beat % LOOP) + LOOP) % LOOP;
  let s = 0;
  for (const [d, o, v] of PARTS[p]) {
    if (b < s + d) {
      const u = (b - s) / d, len = d;
      const env = o * Math.min(1, (b - s) * 4) * Math.min(1, (s + d - b) * 3 / Math.min(1, len));
      return [clamp(env), v, u, s];
    }
    s += d;
  }
  return [0, 0, 0, 0];
}

const SINGERS = [
  // back row
  [10, 8, 0, 0], [26, 8, 1, 1], [42, 8, 0, 2], [58, 8, 1, 0], [74, 8, 0, 4], [90, 8, 1, 1],
  // front row
  [18, 18, 2, 1], [34, 18, 3, 3], [50, 18, 2, 0], [66, 18, 3, 2], [82, 18, 2, 4],
];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const curtain = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const fold = (Math.sin(x * 0.55 + Math.sin(y * 0.15) * 0.6) + 1) / 2;
    const v = clamp(fold * 0.8 + 0.15 - Math.abs(x - 50) / 200);
    curtain.push([v > 0.7 ? "█" : v > 0.4 ? "▓" : "▒", KEYS[CURT + Math.min(4, Math.floor(v * 5))]]);
  }
  const drawSinger = (cx, cy, part, look, t, beat, idx) => {
    const [a, vowel] = voice(part, beat + idx * 0.03);
    const lift = a > 0.5 ? -0.4 : 0;
    const sway = Math.sin(beat * Math.PI * 0.5 + idx) * 0.6;
    const hx = cx + sway, hy = cy + lift;
    // robe
    for (let y = Math.round(hy) + 3; y < Math.round(hy) + 11; y++) {
      const w = 6 + Math.min(2, (y - hy - 3) * 0.6);
      for (let x = Math.round(hx - w); x <= Math.round(hx + w); x++) {
        const edge = Math.abs(x - hx) > w - 1.2;
        g.set(x, y, "█", KEYS[(edge ? ROBED : ROBE) + part]);
      }
    }
    g.text(Math.round(hx) - 3, Math.round(hy) + 3, "▀▄▄▄▄▄▀", KEYS[FACE + 4]);
    // head
    for (let y = Math.floor(hy - 4); y <= Math.ceil(hy + 3); y++) for (let x = Math.floor(hx - 7); x <= Math.ceil(hx + 7); x++) {
      const d = Math.hypot((x - hx) / 6.2, (y - hy) / 3.2);
      if (d > 1) continue;
      g.set(x, y, "█", KEYS[(d > 0.82 || x > hx + 3 ? SKD : SKIN) + look]);
    }
    // hair tuft
    const hc = KEYS[HAIR + ((idx * 3) % 5)];
    if (idx % 3 === 0) g.text(Math.round(hx) - 4, Math.round(hy) - 3, "▄█████▄", hc);
    else if (idx % 3 === 1) { g.text(Math.round(hx) - 1, Math.round(hy) - 4, "▄▀", hc); }
    else g.text(Math.round(hx) - 5, Math.round(hy) - 3, "▄▄▄▄▄▄▄▄▄▄", hc);
    // eyes: happy arcs while singing, round with a blink while resting
    const ex = Math.round(hx), ey = Math.round(hy) - 1;
    const blink = ((t * 0.7 + idx * 0.37) % 3) < 0.12;
    if (a > 0.3) { g.text(ex - 3, ey, "^", KEYS[FACE]); g.text(ex + 3, ey, "^", KEYS[FACE]); }
    else if (blink) { g.text(ex - 3, ey, "-", KEYS[FACE]); g.text(ex + 3, ey, "-", KEYS[FACE]); }
    else { g.set(ex - 3, ey, "●", KEYS[FACE + 5]); g.set(ex + 3, ey, "●", KEYS[FACE + 5]); }
    g.set(ex - 5, ey + 1, "▒", KEYS[FACE + 3]); g.set(ex + 5, ey + 1, "▒", KEYS[FACE + 3]);
    // mouth
    const my = ey + 2;
    if (a < 0.15) g.text(ex - 1, my, "▀▀▀", KEYS[FACE + 1]);
    else {
      const w = vowel ? 1 : 1 + Math.round(a);
      const h = a > 0.6 ? 2 : 1;
      for (let y = 0; y < h; y++) for (let x = -w; x <= w; x++) {
        const tongue = y === h - 1 && h > 1 && Math.abs(x) < w;
        g.set(ex + x, my + y, h === 1 ? "▄" : y === 0 && Math.abs(x) === w ? "▄" : "█", tongue ? KEYS[FACE + 2] : KEYS[FACE]);
      }
      if (h > 1) g.text(ex - w, my, "▄".repeat(2 * w + 1).slice(0, 1), KEYS[FACE]);
    }
    return a;
  };
  return (t) => {
    for (let i = 0; i < curtain.length; i++) { g.ch[i] = curtain[i][0]; g.co[i] = curtain[i][1]; }
    const beat = (t * BPM) / 60;
    // spotlight pool and risers
    for (let y = 15; y < rows; y++) for (let x = 0; x < cols; x++) {
      if (y === 17 || y === 27) g.set(x, y, "▀", KEYS[WOOD + 3]);
      else if (y > 17 && y < 27 || y > 27) g.set(x, y, "█", KEYS[WOOD + (y > 27 ? 1 : 2) - ((x + y) % 7 === 0 ? 1 : 0)]);
    }
    const sing = [];
    SINGERS.slice(0, 6).forEach(([cx, cy, part, look], i) => sing.push([cx, cy, drawSinger(cx, cy, part, look, t, beat, i)]));
    SINGERS.slice(6).forEach(([cx, cy, part, look], i) => sing.push([cx, cy, drawSinger(cx, cy, part, look, t, beat, i + 6)]));
    // notes rising from singing mouths (back row notes float above heads)
    SINGERS.forEach(([cx, cy, part], i) => {
      for (let k = 0; k < 2; k++) {
        const ph = (beat * 0.35 + i * 0.29 + k * 0.5) % 1;
        const [a] = voice(part, beat - ph * 2.5);
        if (a < 0.4) continue;
        const x = Math.round(cx + 6 + Math.sin(ph * TAU + i) * 2), y = Math.round(cy - 3 - ph * 8);
        if (y < 0) continue;
        const c = KEYS[NOTE + ((i + k) % 4)];
        g.set(x + 1, y, "▄", c); g.set(x + 1, y + 1, "█", c); g.set(x, y + 2, "█", c); g.set(x + 1, y + 2, "▀", c);
      }
    });
    return g.frame();
  };
}
