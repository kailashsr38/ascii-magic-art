/* aurora-curtains: three folded ribbons of aurora sway slowly across the whole sky, rays drifting along their length. */
import { Grid, palette, gradient, KEYS, fbm, noise2, clamp } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("sky", gradient(["#02040c", "#050a1c", "#0a1430", "#102040", "#163048"], 6));
add("a0", gradient(["#06261e", "#0c5a3a", "#14a060", "#3ae688", "#a8ffc8", "#f0fff4"], 10));
add("a1", gradient(["#062030", "#0a4a62", "#1290a0", "#38d8d0", "#b0fff4", "#f4ffff"], 10));
add("a2", gradient(["#200a30", "#4a1460", "#8a2a90", "#d050b8", "#ff9ad8", "#fff0fa"], 10));
add("top", gradient(["#1a0e38", "#3a1a66", "#6a2a8a", "#a03a9a"], 4));
add("star", ["#6a7a9a", "#d8e2ff"]);
add("hill", ["#010205", "#04070e", "#0a1220"]);

export const meta = {
  slug: "aurora-curtains",
  name: "Aurora Curtains",
  category: "demoscene",
  note: "Three folded ribbons of aurora, green, teal and rose, sway slowly across the whole sky while their rays drift along each curtain.",
  tags: ["aurora", "night-sky", "ribbons", "calm", "wallpaper", "hero"],
  cols: 100, rows: 34, fps: 20,
  palette: palette(all),
};

const K = (n, i) => KEYS[G[n] + i];
const SH = " ·:░▒▓█";
const RIB = [
  { y: 26, a: 3.2, k: 0.055, w: 0.11, b: 1.6, k2: 0.13, w2: 0.07, len: 13, d: 0.35, seed: 1 },
  { y: 18, a: 2.6, k: 0.07, w: -0.08, b: 1.2, k2: 0.17, w2: 0.1, len: 8, d: -0.25, seed: 7 },
  { y: 10, a: 2.2, k: 0.045, w: 0.06, b: 1.0, k2: 0.11, w2: -0.09, len: 6, d: 0.2, seed: 13 },
];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const nr = RIB.length;
  const base = new Float32Array(nr * cols), fold = new Float32Array(nr * cols), ray = new Float32Array(nr * cols);
  const hill = new Float32Array(cols);
  for (let x = 0; x < cols; x++) hill[x] = rows - 2.2 - fbm(x * 0.05, 1.5, 3, 21) * 3.5;
  const starAt = new Uint8Array(cols * rows);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const h = noise2(x * 12.9898, y * 78.233, 3);
    if (h > 0.985) starAt[x + y * cols] = h > 0.995 ? 2 : 1;
  }
  return (t) => {
    for (let r = 0; r < nr; r++) {
      const R = RIB[r];
      for (let x = 0; x < cols; x++) {
        const p = x * R.k + t * R.w, q = x * R.k2 + t * R.w2;
        base[r * cols + x] = R.y + R.a * Math.sin(p) + R.b * Math.sin(q);
        const slope = R.a * R.k * Math.cos(p) + R.b * R.k2 * Math.cos(q);
        fold[r * cols + x] = 0.45 + Math.min(1.1, Math.abs(slope) * 3.5);
        // rays: vertical striations that slide sideways along the ribbon
        const fb = fbm(x * 0.42 - t * R.d, R.seed + t * 0.03, 3, R.seed);
        ray[r * cols + x] = 0.15 + 1.9 * fb * fb;
      }
    }
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      let best = 0, br = -1, hf = 0, sum = 0;
      for (let r = 0; r < nr; r++) {
        const h = base[r * cols + x] - y;
        const L = RIB[r].len;
        const v = h >= 0 ? Math.exp(-h / L) * (h < 1.6 ? 1.8 - h * 0.4 : 1.15) : Math.exp(h * 1.4);
        const rv = ray[r * cols + x];
        const I = v * fold[r * cols + x] * (h < 1.2 ? 0.7 + rv * 0.3 : rv);
        sum += I;
        if (I > best) { best = I; br = r; hf = clamp(h / (L * 1.6)); }
      }
      const i = x + y * cols;
      if (y >= hill[x]) {
        g.set(x, y, y - hill[x] < 1 ? "▄" : "█", K("hill", y - hill[x] < 1 ? 2 : y - hill[x] < 2 ? 1 : 0));
        continue;
      }
      const lv = clamp(sum * 0.6);
      if (lv > 0.12 && br >= 0) {
        const ch = SH[Math.min(6, 2 + Math.floor(lv * 5))];
        const co = hf > 0.62 && lv < 0.6 ? K("top", Math.min(3, Math.floor(lv * 5))) : K("a" + br, Math.min(9, Math.floor(lv * 10)));
        g.set(x, y, ch, co);
      } else {
        const sk = y / rows;
        if (starAt[i] && lv < 0.1) g.set(x, y, starAt[i] === 2 ? "•" : "·", K("star", starAt[i] - 1));
        else g.set(x, y, (x * 7 + y * 3) % 4 === 0 ? "·" : "░", K("sky", Math.min(5, Math.floor(sk * 4 + lv * 6))));
      }
    }
    return g.frame();
  };
}
