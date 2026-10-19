/* comet: a bright comet crossing the night sky above dark hills, dust and ion tails streaming away from the sun. */
import { Grid, palette, gradient, KEYS, fbm, rng, clamp, TAU } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("sky", gradient(["#03050f", "#081030", "#101c4a", "#1c2a62", "#2c3a74"], 10));
add("milky", gradient(["#1c2050", "#383c78", "#6066a0"], 4));
add("star", ["#8a98d8", "#ffffff"]);
add("dust", gradient(["#2a2a44", "#6a5a5a", "#b0906a", "#e8c890", "#fff0c8", "#ffffff"], 12));
add("ion", gradient(["#10285a", "#2050a8", "#4a8ae0", "#8ac8ff", "#d8f0ff"], 8));
add("hill", ["#04050a", "#0a0d18", "#151c30"]);

export const meta = {
  slug: "comet",
  name: "Comet Crossing",
  category: "cosmos",
  note: "A bright comet glides across a starry sky above dark hills, its curved dust tail and straight blue ion tail streaming behind.",
  tags: ["comet", "night-sky", "stars", "wallpaper", "hero"],
  cols: 100, rows: 36, fps: 24,
  palette: palette(all),
};

const K = (n, i) => KEYS[G[n] + i];
const SH = "░▒▓█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(53);
  const stars = Array.from({ length: 170 }, () => [Math.floor(r() * cols), Math.floor(r() * rows), r() * TAU, r()]);
  const hills = Array.from({ length: cols }, (_, x) => Math.round(rows - 3 - 4 * fbm(x * 0.045, 1, 3, 3)));
  const trees = Array.from({ length: 14 }, () => [Math.floor(r() * cols), 2 + Math.floor(r() * 3)]);
  const base = new Float32Array(cols * rows), milk = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    base[x + y * cols] = fbm(x * 0.04, y * 0.1, 3, 2);
    const band = Math.exp(-(((y - 6 - x * 0.18) / 5) ** 2));
    milk[x + y * cols] = band * fbm(x * 0.09, y * 0.2, 4, 7);
  }
  const PER = 16;
  const D = [0.94, -0.34];               // tails point up-right, away from a sun low on the left
  return (t) => {
    g.clear();
    const f = (t % PER) / PER;
    const hx = cols + 6 - f * (cols + 82), hy = 21 - f * 6 + Math.sin(f * Math.PI) * -3;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const i = x + y * cols;
      const v = clamp(base[i] * 0.55 + (y / rows) * 0.35 - 0.05);
      g.set(x, y, v > 0.45 ? "▒" : "░", K("sky", Math.min(9, Math.floor(v * 10))));
      if (milk[i] > 0.32) g.set(x, y, milk[i] > 0.5 ? "▒" : "░", K("milky", Math.min(3, Math.floor((milk[i] - 0.3) * 8))));
    }
    for (const [sx, sy, ph, b] of stars) {
      const tw = 0.5 + 0.5 * Math.sin(t * (1 + b * 3) + ph);
      if (tw > 0.25) g.set(sx, sy, b > 0.88 && tw > 0.6 ? "+" : b > 0.5 ? "·" : ".", K("star", b > 0.6 ? 1 : 0));
    }
    // the comet: coma, curved dust tail, straight ion tail
    const x0 = Math.max(0, Math.floor(hx - 6)), y0 = 0;
    for (let y = y0; y < rows; y++) for (let x = x0; x < cols; x++) {
      const dx = x + 0.5 - hx, dy = (y + 0.5 - hy) * 2;
      const s = dx * D[0] + dy * D[1], p = -dx * D[1] + dy * D[0];
      const rr = Math.hypot(dx, dy);
      const coma = Math.exp(-rr / 3.2) * 1.8;
      let dust = 0, ion = 0;
      if (s > -1) {
        const sp = Math.max(0, s);
        const pc = p - 0.006 * sp * sp;
        const w = 1.8 + sp * 0.26;
        const streak = fbm(sp * 0.05 - t * 0.4, (pc / w) * 2.5, 3, 4);
        dust = Math.exp(-((pc / w) ** 2)) * Math.exp(-sp / 42) * (0.6 + 0.9 * streak);
        const wi = 0.9 + sp * 0.06;
        const knot = fbm(sp * 0.12 - t * 1.6, p * 0.6, 2, 9);
        ion = Math.exp(-(((p + 1.2) / wi) ** 2)) * Math.exp(-sp / 40) * (0.4 + 0.9 * knot);
      }
      const I = Math.max(coma, dust);
      if (I > 0.1 && I >= ion * 0.8) g.set(x, y, SH[Math.min(3, Math.floor(I * 4))], K("dust", Math.min(11, Math.floor(I * 11))));
      else if (ion > 0.14) g.set(x, y, SH[Math.min(3, Math.floor(ion * 3.6))], K("ion", Math.min(7, Math.floor(ion * 9))));
    }
    if (hx > -2 && hx < cols + 2) g.set(hx, hy, "●", K("dust", 11));
    // hills and pines in silhouette
    for (let x = 0; x < cols; x++) for (let y = hills[x]; y < rows; y++) g.set(x, y, y === hills[x] ? "▄" : "█", K("hill", y === hills[x] ? 2 : 1));
    for (const [tx, th] of trees) for (let k = 0; k <= th; k++) {
      const y = hills[tx] - k;
      g.set(tx, y, k === th ? "▲" : "█", K("hill", 0));
      if (k < th - 1) { g.set(tx - 1, y, "▟", K("hill", 0)); g.set(tx + 1, y, "▙", K("hill", 0)); }
    }
    return g.frame();
  };
}
