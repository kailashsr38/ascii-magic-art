/* clifford-attractor: a Clifford strange attractor rendered as a density map, its parameters drifting so the silk folds and reshapes. */
import { Grid, palette, gradient, KEYS, TAU } from "../lib/kit.js";

const RAMP = gradient(["#0a0a1e", "#16205a", "#1a4a8a", "#1a8aa0", "#3ac8a0", "#a8e870", "#f8e870", "#ffb04a", "#fff4e0"], 18);
const NR = RAMP.length;
const all = [...RAMP, "#06060e"];

export const meta = {
  slug: "clifford-attractor",
  name: "Clifford Attractor",
  category: "algorithms",
  note: "A Clifford strange attractor drawn as a glowing density map, its four parameters drifting so the silky folds keep reshaping themselves.",
  tags: ["attractor", "chaos", "density", "math", "wallpaper", "hero"],
  cols: 96, rows: 36, fps: 24,
  palette: palette(all),
};

const NP = 60000, P = 30;
const CH = " .·:;░▒▓█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const hist = new Float32Array(cols * rows);
  return (t) => {
    hist.fill(0);
    const w = (t / P) * TAU;
    // a parameter loop chosen so the orbit stays chaotic all the way round (no collapse to a few points)
    const a = -1.527 + 0.12 * Math.sin(w), b = 1.977 + 0.155 * Math.cos(w);
    const c = 1.582 + 0.08 * Math.sin(w * 2 + 1), d = 1.68 + 0.145 * Math.cos(w * 3 + 0.5);
    const xr = 1 + Math.abs(c), yr = 1 + Math.abs(d);
    const sx = (cols - 2) / (2 * xr), sy = (rows - 1) / (2 * yr);
    let x = 0.1, y = 0.1;
    for (let i = 0; i < NP; i++) {
      const nx = Math.sin(a * y) + c * Math.cos(a * x);
      const ny = Math.sin(b * x) + d * Math.cos(b * y);
      x = nx; y = ny;
      if (i < 20) continue;
      const ix = Math.floor(cols / 2 + x * sx), iy = Math.floor(rows / 2 + y * sy);
      if (ix >= 0 && iy >= 0 && ix < cols && iy < rows) hist[ix + iy * cols]++;
    }
    let mx = 1;
    for (let i = 0; i < hist.length; i++) if (hist[i] > mx) mx = hist[i];
    const lm = Math.log(mx + 1);
    for (let i = 0; i < hist.length; i++) {
      const xx = i % cols, yy = (i - xx) / cols;
      if (!hist[i]) { g.set(xx, yy, (xx * 5 + yy * 3) % 7 ? " " : "·", KEYS[NR]); continue; }
      const v = Math.log(hist[i] + 1) / lm;
      const k = Math.min(NR - 1, Math.floor(Math.pow(v, 1.15) * NR));
      g.set(xx, yy, CH[Math.min(CH.length - 1, 1 + Math.floor(v * (CH.length - 1)))], KEYS[k]);
    }
    return g.frame();
  };
}
