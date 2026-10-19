/* ripple-pond: raindrops falling into a still pond, each spreading circular ripples that cross and fade. */
import { Grid, palette, gradient, KEYS, fbm, clamp, TAU } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("water", gradient(["#021018", "#04202e", "#0a3446", "#12505e", "#1e6e78", "#3a9298", "#7ac4c4", "#d8f6f2"], 16));
add("pad", gradient(["#0a2a0e", "#1e5a1e", "#3a8a2e", "#7ab84a"], 4));
add("flower", ["#ff9ac8", "#ffe0ee"]);
add("drop", ["#bfefff", "#ffffff"]);

export const meta = {
  slug: "ripple-pond",
  name: "Ripple Pond",
  category: "motion-lab",
  note: "Drops fall into a still pond between lily pads, and their circular ripples spread, cross and fade.",
  tags: ["ripples", "water", "rain", "pond", "calm", "wallpaper"],
  cols: 96, rows: 34, fps: 24,
  palette: palette(all),
};

const K = (n, i) => KEYS[G[n] + i];
const SH = "░▒▓█";
const hash = (i, s) => { let h = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b) ^ s; h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const GAP = 0.6, LIFE = 4.5, V = 9, KW = 1.3;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const pads = [[14, 7, 7], [80, 25, 8], [70, 6, 5], [22, 27, 6]];
  const base = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) base[x + y * cols] = fbm(x * 0.05, y * 0.12, 3, 5);
  const dropAt = (i) => [8 + hash(i, 1) * (cols - 16), (3 + hash(i, 2) * (rows - 6)) * 2, i * GAP + hash(i, 3) * 0.4, 0.6 + hash(i, 4) * 0.6];
  return (t) => {
    g.clear();
    const live = [];
    const i1 = Math.floor(t / GAP);
    for (let i = i1 - Math.ceil(LIFE / GAP) - 1; i <= i1 + 1; i++) {
      const d = dropAt(i);
      const age = t - d[2];
      if (age >= 0 && age < LIFE) live.push([d[0], d[1], age, d[3]]);
    }
    const h = (px, py) => {
      let s = 0;
      for (const [dx, dy, age, a] of live) {
        const r = Math.hypot(px - dx, py - dy);
        const front = V * age;
        const u = r - front;
        if (u > 2 || u < -14) continue;
        const env = Math.exp(-(((u + 4) / 5) ** 2)) * Math.exp(-age * 0.7) * a;
        s += env * Math.sin(u * KW) / Math.sqrt(1 + r * 0.12);
      }
      return s;
    };
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const px = x + 0.5, py = (y + 0.5) * 2;
      const h0 = h(px, py), hx = h(px + 1, py), hy = h(px, py + 2);
      const slope = (h0 - hx) * 0.8 + (h0 - hy) * 1.1;
      const b = base[x + y * cols];
      const v = clamp(0.38 + (b - 0.5) * 0.35 + (y / rows) * 0.12 + slope * 0.9);
      const spec = slope > 0.45 ? 1 : 0;
      g.set(x, y, spec ? "▓" : SH[Math.min(2, Math.floor(v * 3.2))], K("water", Math.min(15, Math.floor(v * 16) + spec * 2)));
    }
    // lily pads bob on the swell
    for (const [px, py, pr] of pads) {
      const bob = h(px, py * 2) * 0.5;
      for (let y = Math.floor(py - pr / 2); y <= py + pr / 2; y++) for (let x = Math.floor(px - pr); x <= px + pr; x++) {
        const nx = (x + 0.5 - px) / pr, ny = (y + 0.5 - py - bob) / (pr / 2);
        const q = nx * nx + ny * ny;
        if (q > 1) continue;
        const notch = Math.atan2(ny, nx);
        if (notch > 0.2 && notch < 0.75 && q > 0.05) continue;
        const v = clamp(0.4 + (1 - q) * 0.5 - ny * 0.25);
        g.set(x, y, q > 0.8 ? "▓" : "█", K("pad", Math.min(3, Math.floor(v * 4))));
      }
    }
    g.set(pads[1][0] - 2, pads[1][1] - 1, "▲", K("flower", 0));
    g.set(pads[1][0] - 1, pads[1][1] - 1, "●", K("flower", 1));
    g.set(pads[1][0], pads[1][1] - 1, "▲", K("flower", 0));
    // falling drops just before they hit, and the splash
    for (let i = i1 - 1; i <= i1 + 2; i++) {
      const [dx, dy, ti] = dropAt(i);
      const pre = ti - t;
      if (pre > 0 && pre < 0.35) {
        const y = dy / 2 - pre * 30;
        g.set(dx, y, "│", K("drop", 0)); g.set(dx, y + 1, "•", K("drop", 1));
      } else if (pre <= 0 && pre > -0.18) {
        g.set(dx, dy / 2, "*", K("drop", 1)); g.set(dx - 1, dy / 2 - 1, "'", K("drop", 0)); g.set(dx + 1, dy / 2 - 1, "'", K("drop", 0));
      }
    }
    return g.frame();
  };
}
