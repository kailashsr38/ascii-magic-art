/* crystal-grains: crystals nucleate in a cooling melt and grow until they lock into a Voronoi mosaic of grains. */
import { Grid, palette, gradient, KEYS, rng, fbm, clamp } from "../lib/kit.js";

const HUES = ["#9a6ae0", "#4ac8d8", "#e8a84a", "#e06a9a", "#6ae0a0", "#8aa8d8", "#d8d06a"];
const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
HUES.forEach((h, i) => add("h" + i, gradient(["#08080e", h, "#ffffff"], 7).slice(2, 6)));
add("bound", ["#020204", "#0c0c14"]);
add("front", ["#d8f4ff", "#ffffff"]);
add("melt", gradient(["#04060e", "#0a1022", "#121c36", "#1a2a4a"], 4));

export const meta = {
  slug: "crystal-grains",
  name: "Crystal Grain Growth",
  category: "algorithms",
  note: "Crystals nucleate one by one in a cooling melt and grow outward until they lock together into a mosaic of grains, each with its own lattice angle.",
  tags: ["voronoi", "crystal", "growth", "mineral", "wallpaper", "hero"],
  cols: 96, rows: 34, fps: 24,
  palette: palette(all),
};

const K = (n, i) => KEYS[G[n] + i];
const P = 15, GROW = 11, NN = 46;
const LAT = ["─", "╱", "│", "╲"];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const N = cols * rows;
  const arr = new Float32Array(N), own = new Int16Array(N), bnd = new Uint8Array(N);
  let cyc = -1;
  const nx = new Float32Array(NN), ny = new Float32Array(NN), nb = new Float32Array(NN), ns = new Float32Array(NN), na = new Float32Array(NN), nh = new Uint8Array(NN);
  const build = (c) => {
    const r = rng(c * 613 + 29);
    for (let i = 0; i < NN; i++) {
      nx[i] = r() * cols; ny[i] = r() * rows * 2; nb[i] = Math.pow(r(), 1.4) * GROW * 0.75;
      ns[i] = 3.2 + r() * 2.4; na[i] = r() * Math.PI; nh[i] = Math.floor(r() * HUES.length);
    }
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      let best = 1e9, o = 0;
      for (let i = 0; i < NN; i++) {
        const v = nb[i] + Math.hypot(x + 0.5 - nx[i], y * 2 + 1 - ny[i]) / ns[i];
        if (v < best) { best = v; o = i; }
      }
      arr[x + y * cols] = best; own[x + y * cols] = o;
    }
    let mx = 0; for (let i = 0; i < N; i++) if (arr[i] > mx) mx = arr[i];
    const sc = GROW / Math.max(mx, 1e-3); for (let i = 0; i < N; i++) arr[i] *= sc;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const i = x + y * cols, o = own[i];
      bnd[i] = (x + 1 < cols && own[i + 1] !== o) || (y + 1 < rows && own[i + cols] !== o) ? 1 : 0;
    }
  };
  return (t) => {
    const c = Math.floor(t / P), p = t - c * P;
    if (c !== cyc) { cyc = c; build(c); }
    const melt = p > P - 1.2 ? (p - (P - 1.2)) / 1.2 : 0; // remelt sweeps down at the end
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const i = x + y * cols;
      const a = arr[i];
      if (a > p || y < melt * rows * 1.05) {
        const m = fbm(x * 0.08 + t * 0.15, y * 0.16, 2, 3);
        g.set(x, y, m > 0.55 ? "▒" : "░", K("melt", Math.min(3, Math.floor(m * 4.5))));
        continue;
      }
      const o = own[i];
      const age = p - a;
      if (age < 0.3) { g.set(x, y, age < 0.15 ? "█" : "▓", K("front", age < 0.15 ? 1 : 0)); continue; }
      if (bnd[i]) { g.set(x, y, "█", K("bound", 0)); continue; }
      const ang = na[o];
      const ph = ((x + 0.5 - nx[o]) * Math.sin(ang) - (y * 2 + 1 - ny[o]) * Math.cos(ang)) / 2.2;
      const stripe = ((ph % 1) + 1) % 1 < 0.45;
      const facet = Math.cos(Math.atan2(y * 2 + 1 - ny[o], x + 0.5 - nx[o]) * 3 + ang * 2) * 0.5 + 0.5;
      const lv = Math.min(3, Math.floor(facet * 2.2 + (stripe ? 1 : 0)));
      const li = ((Math.round((-ang / Math.PI) * 4) % 4) + 4) % 4;
      g.set(x, y, stripe ? LAT[li] : lv > 1 ? "▓" : "▒", K("h" + nh[o], lv));
    }
    return g.frame();
  };
}
