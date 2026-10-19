/* cuckoo-clock: a carved wooden cuckoo clock whose bird pops out to call each time the hour comes round. */
import { Grid, palette, gradient, KEYS, noise2, clamp, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const WALL = add(["#3a2a1e", "#4a3626", "#5a4430", "#6e5640", "#8a6e4e"]);
const WOOD = add(gradient(["#2a1408", "#4a2410", "#6a3818", "#8e5226", "#b4703a", "#d4945a"], 10));
const ROOF = add(["#3a1a0c", "#5a2a14", "#7a3c1e"]);
const LEAF = add(["#2a4a1a", "#3e6a26", "#5a8a36"]);
const FACE = add(["#f4e8cc", "#d8c8a4", "#1a1008", "#a8842a"]);
const BRASS = add(gradient(["#5a3e10", "#9a7020", "#d4a838", "#ffe08a"], 6));
const BIRD = add(["#e8d4a0", "#c84a2a", "#ffd23a", "#3a2a1a"]);
const TXT = add(["#fff4d4"]);

export const meta = {
  slug: "cuckoo-clock",
  name: "Cuckoo Clock",
  category: "things",
  note: "A carved wooden cuckoo clock ticks on a warm wall, pendulum swinging and pinecone weights on their chains, and the little bird pops out to call on the hour.",
  tags: ["clock", "cuckoo", "wood", "time", "cozy", "loader"],
  cols: 64, rows: 38, fps: 24,
  palette: palette(P),
};

const PER = 9;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = 32;
  return (t) => {
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const stripe = x % 8 < 4;
      const motif = x % 8 === 6 && y % 4 === 1;
      g.set(x, y, motif ? "◆" : stripe ? "█" : "▓", KEYS[WALL + (motif ? 4 : stripe ? 1 : 2)]);
    }
    const p = ((t % PER) + PER) % PER;
    // roof with shingles and carved leaves
    for (let y = 3; y <= 10; y++) {
      const w = 6 + (y - 3) * 3.1;
      for (let x = Math.ceil(cx - w); x <= cx + w; x++) {
        const sh = (x + (y % 2) * 2) % 4 === 0;
        g.set(x, y, y === 10 ? "▀" : sh ? "▓" : "█", KEYS[ROOF + (y === 10 ? 2 : sh ? 0 : 1 + (y % 2))]);
      }
    }
    for (let k = -3; k <= 3; k++) {
      const x = cx + k * 3, y = 2 + Math.abs(k) * 0.9;
      g.text(x - 1, y, "▄█▄", KEYS[LEAF + (k % 2 ? 1 : 2)]);
    }
    g.text(cx - 2, 1, "▄██▄", KEYS[WOOD + 7]); g.set(cx + 2, 1, "►", KEYS[BIRD + 2]);
    // house body
    for (let y = 11; y <= 27; y++) for (let x = cx - 17; x <= cx + 17; x++) {
      const n = noise2(x * 0.3, y * 0.9, 4);
      const grain = Math.sin(y * 1.7 + n * 3) > 0.6;
      const edge = x === cx - 17 || x === cx + 17 || y === 27;
      g.set(x, y, grain ? "▓" : "█", KEYS[WOOD + (edge ? 1 : Math.min(9, 3 + Math.floor(n * 4) - (grain ? 1 : 0)))]);
    }
    // carved side scrolls and ledge
    for (const s of [-1, 1]) for (let y = 13; y <= 25; y += 3) g.text(cx + s * 15 - 1, y, "(@)", KEYS[WOOD + 7]);
    g.hline(cx - 19, cx + 19, 27, "▀", KEYS[WOOD + 8]);
    // door and the bird
    const open = p < 2 ? Math.min(1, p / 0.25, (2 - p) / 0.3) : 0;
    g.fill(cx - 3, 11, 6, 3, "█", KEYS[WOOD]);
    if (open > 0) {
      g.fill(cx - 3, 11, 6, 3, " ", KEYS[WOOD]);
      g.text(cx - 6 - Math.round(open * 2), 11, "▐▓", KEYS[WOOD + 5]); g.text(cx - 6 - Math.round(open * 2), 12, "▐▓", KEYS[WOOD + 5]);
      g.text(cx + 4 + Math.round(open * 2), 11, "▓▌", KEYS[WOOD + 5]); g.text(cx + 4 + Math.round(open * 2), 12, "▓▌", KEYS[WOOD + 5]);
      const out = Math.round(open * 2);
      const beak = Math.floor(p * 4) % 2 === 0;
      const by = 12 - out;
      g.text(cx - 2, by, "▄██▄", KEYS[BIRD]);
      g.text(cx - 3, by + 1, "◄███▀", KEYS[BIRD + 1]);
      g.set(cx - 1, by, "●", KEYS[BIRD + 3]);
      g.set(cx - 4, by + (beak ? 0 : 1), beak ? "<" : "◄", KEYS[BIRD + 2]);
      if (open > 0.8) {
        const call = Math.floor(p / 0.5) % 2 === 0 ? "CUCKOO!" : "       ";
        g.text(cx - 18, 7, call, KEYS[TXT]);
        g.text(cx + 12, 7, call, KEYS[TXT]);
      }
    } else {
      g.text(cx - 3, 11, "▐▀▀▀▀▌", KEYS[WOOD + 6]);
      g.set(cx + 1, 12, "●", KEYS[BRASS + 3]);
    }
    // clock face
    const fy = 19.5, fr = 8;
    for (let y = Math.floor(fy - fr / 2) - 1; y <= fy + fr / 2 + 1; y++) for (let x = cx - fr - 1; x <= cx + fr + 1; x++) {
      const d = Math.hypot(x + 0.5 - cx, (y + 0.5 - fy) * 2);
      if (d <= fr) g.set(x, y, "█", KEYS[FACE + (d > fr - 1.2 ? 1 : 0)]);
      else if (d <= fr + 1.2) g.set(x, y, "█", KEYS[BRASS + 2]);
    }
    for (let h = 0; h < 12; h++) {
      const a = (h / 12) * TAU - Math.PI / 2;
      g.set(cx + Math.cos(a) * (fr - 1.6), fy + Math.sin(a) * (fr - 1.6) / 2, h % 3 === 0 ? "■" : "·", KEYS[FACE + 2]);
    }
    const mins = p / PER;
    const hour = Math.floor(t / PER);
    const ma = mins * TAU - Math.PI / 2, ha = ((hour % 12) + mins) / 12 * TAU - Math.PI / 2;
    g.line(cx, fy, cx + Math.cos(ha) * 4, fy + Math.sin(ha) * 2, "█", KEYS[FACE + 2]);
    g.line(cx, fy, cx + Math.cos(ma) * 6.2, fy + Math.sin(ma) * 3.1, "▓", KEYS[FACE + 3]);
    g.set(cx, fy, "●", KEYS[BRASS + 1]);
    // pendulum
    const sw = Math.sin(t * TAU / 1.4) * 0.38;
    const px = cx + Math.sin(sw) * 9, py = 28 + Math.cos(sw) * 4.5;
    g.line(cx, 28, px, py, (x) => (sw > 0.1 ? "\\" : sw < -0.1 ? "/" : "│"), KEYS[BRASS + 2]);
    g.text(Math.round(px) - 2, Math.round(py), "▄██▄", KEYS[BRASS + 3]);
    g.text(Math.round(px) - 2, Math.round(py) + 1, "▀██▀", KEYS[BRASS + 1]);
    g.text(Math.round(px) - 1, Math.round(py), "▓▓", KEYS[LEAF + 1]);
    // chains and pinecone weights, one lowering while the other is wound up
    const wl = 31 + Math.sin(t * 0.25) * 2.5, wr = 31 - Math.sin(t * 0.25) * 2.5;
    for (const [x, wy] of [[cx - 11, wl], [cx + 11, wr]]) {
      for (let y = 28; y < wy; y++) g.set(x, y, (y + Math.floor(wy * 2)) % 2 ? "o" : "8", KEYS[BRASS + 2]);
      for (let k = 0; k < 5; k++) g.text(x - (k < 4 ? 1 : 0), wy + k, k < 4 ? "▓█▓" : "▀", KEYS[WOOD + (k % 2 ? 3 : 5)]);
    }
    return g.frame();
  };
}
