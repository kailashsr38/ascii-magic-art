/* asteroid-belt: lumpy cratered asteroids tumbling past at different depths, lit by a distant sun. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, TAU } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("bg", gradient(["#030308", "#0a0a1c", "#161430", "#261c40", "#3a2448"], 8));
add("star", ["#8a90c0", "#ffffff"]);
add("rock", gradient(["#141010", "#2e2620", "#4e4236", "#76644e", "#a08a6c", "#c8b494", "#ece0c4"], 14));
add("far", ["#3a3440", "#5a5260", "#8a8090"]);
add("sun", gradient(["#4a2a20", "#a86a3a", "#f0b870", "#fff0d0"], 6));

export const meta = {
  slug: "asteroid-belt",
  name: "Asteroid Belt",
  category: "cosmos",
  note: "Lumpy, cratered asteroids tumble past at different depths, lit warm from one side by a distant sun.",
  tags: ["asteroids", "rocks", "parallax", "wallpaper", "hero"],
  cols: 100, rows: 36, fps: 24,
  palette: palette(all),
};

const K = (n, i) => KEYS[G[n] + i];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(83);
  const L = (() => { const v = [-0.75, -0.35, 0.55]; const l = Math.hypot(...v); return v.map((a) => a / l); })();
  const stars = Array.from({ length: 140 }, () => [Math.floor(r() * cols), Math.floor(r() * rows), r() * TAU, r()]);
  const span = cols + 40;
  const rocks = Array.from({ length: 20 }, (_, i) => {
    const d = 0.25 + (i / 19) * 0.75 + r() * 0.05;
    return { d, x0: r() * span, y: 3 + r() * (rows - 6), R: 1.6 + d * d * 10, spin: (r() - 0.5) * 1.6, ph: r() * TAU, seed: i * 7 + 1, bob: r() * TAU };
  }).sort((a, b) => a.d - b.d);
  const dust = Array.from({ length: 60 }, () => [r() * span, r() * rows, 0.1 + r() * 0.2]);
  const bgn = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) bgn[x + y * cols] = fbm(x * 0.035, y * 0.08, 4, 40);

  return (t) => {
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const sd = Math.hypot(x + 3, (y + 2) * 2);
      const sunG = Math.exp(-sd / 12) * 1.1;
      const v = clamp(bgn[x + y * cols] * 0.9 - 0.12 + sunG * 0.5);
      if (sd < 4) g.set(x, y, "█", K("sun", 5 - Math.min(5, Math.floor(sd * 1.2))));
      else if (sunG > 0.35) g.set(x, y, sunG > 0.55 ? "▓" : "▒", K("sun", Math.min(5, Math.floor(sunG * 6))));
      else g.set(x, y, v > 0.5 ? "▒" : "░", K("bg", Math.min(7, Math.floor(v * 8))));
    }
    for (const [sx, sy, ph, b] of stars) {
      if (g.get(sx, sy) !== "░") continue;
      const tw = 0.5 + 0.5 * Math.sin(t * (1 + b * 2) + ph);
      g.set(sx, sy, b > 0.85 && tw > 0.5 ? "+" : tw > 0.35 ? "·" : ".", K("star", b > 0.5 ? 1 : 0));
    }
    for (const [dx, dy, sp] of dust) {
      const x = ((dx - t * sp * 20) % span + span) % span - 20;
      g.set(x, dy, sp > 0.2 ? "•" : "·", K("far", sp > 0.22 ? 2 : 1));
    }
    for (const k of rocks) {
      const sp = k.d * 9;
      const px = ((k.x0 - t * sp) % span + span) % span - 20;
      const py = k.y + Math.sin(t * 0.3 + k.bob) * 1.2 * k.d;
      const a = k.ph + t * k.spin, ca = Math.cos(a), sa = Math.sin(a);
      const ry = k.R * 0.5;
      const dim = 0.45 + 0.55 * k.d;
      for (let y = Math.floor(py - ry * 1.35); y <= py + ry * 1.35; y++)
        for (let x = Math.floor(px - k.R * 1.35); x <= px + k.R * 1.35; x++) {
          const ux = (x + 0.5 - px) / k.R, uy = ((y + 0.5 - py) * 2) / k.R;
          // rotate into the rock's own frame so the outline and craters tumble
          const lx = ux * ca + uy * sa, ly = -ux * sa + uy * ca;
          const ang = Math.atan2(ly, lx);
          const lump = 1 + 0.3 * (noise2(Math.cos(ang) * 1.5 + k.seed, Math.sin(ang) * 1.5, k.seed) - 0.5) * 2 + 0.12 * Math.cos(ang * 2);
          const q = (lx * lx + ly * ly) / (lump * lump);
          if (q >= 1) continue;
          const nz = Math.sqrt(1 - q);
          const nx = ux / lump, ny = uy / lump;
          const crater = fbm(lx * 2.4 + k.seed, ly * 2.4, 3, k.seed);
          const bump = (crater - 0.5) * 0.9;
          const lum = clamp((nx * L[0] + ny * L[1] + nz * L[2]) * 0.95 + bump * 0.6 + 0.05);
          const v = clamp(lum * dim);
          g.set(x, y, v > 0.5 ? "█" : v > 0.3 ? "▓" : v > 0.12 ? "▒" : "░", K("rock", Math.min(13, Math.floor(v * 14))));
        }
    }
    return g.frame();
  };
}
