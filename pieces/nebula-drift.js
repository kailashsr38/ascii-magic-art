/* nebula-drift: a colourful gas cloud slowly swirling, bright young stars glowing inside it. */
import { Grid, palette, gradient, KEYS, fbm, rng, clamp, TAU } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("teal", gradient(["#03060e", "#06223a", "#0a4a5a", "#1a8a8a", "#5ad0c0", "#c8fff0"], 10));
add("mag", gradient(["#06030e", "#2a0a3a", "#6a1a6a", "#b8307a", "#f07a9a", "#ffd8e0"], 10));
add("gold", gradient(["#0a0604", "#3a1a0a", "#8a3a14", "#d8702a", "#ffb860", "#fff0c8"], 10));
add("star", ["#a8b8ff", "#ffffff"]);

export const meta = {
  slug: "nebula-drift",
  name: "Nebula Drift",
  category: "cosmos",
  note: "A teal, magenta and gold nebula swirls slowly in deep space while young stars twinkle inside it.",
  tags: ["nebula", "space", "stars", "wallpaper", "hero", "background"],
  cols: 100, rows: 38, fps: 20,
  palette: palette(all),
};

const K = (n, i) => KEYS[G[n] + i];
const SH = "░▒▓█";
const HUES = ["teal", "mag", "gold"];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = cols / 2, cy = rows / 2;
  const r = rng(97);
  const stars = Array.from({ length: 150 }, () => [Math.floor(r() * cols), Math.floor(r() * rows), r() * TAU, r()]);
  const big = Array.from({ length: 6 }, () => [4 + Math.floor(r() * (cols - 8)), 3 + Math.floor(r() * (rows - 6)), r() * TAU]);
  return (t) => {
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      // a gentle swirl around the centre, faster near the middle
      const dx = (x - cx) / cols, dy = ((y - cy) * 2) / cols;
      const rr = Math.hypot(dx, dy);
      const a = t * 0.02 + (0.5 * Math.sin(t * 0.09)) / (0.3 + rr);
      const ca = Math.cos(a), sa = Math.sin(a);
      const px = (dx * ca - dy * sa) * 5 + t * 0.03, py = (dx * sa + dy * ca) * 5;
      const qx = fbm(px, py, 3, 1), qy = fbm(px + 5.2, py + 1.3, 3, 2);
      const d = fbm(px + 3 * qx, py + 3 * qy, 4, 3);
      const h = fbm(px * 0.6 + qx * 1.5 + 9, py * 0.6 + 4, 2, 4);
      const dens = clamp((d - 0.3) * 2.1);
      const hue = h < 0.42 ? 0 : h < 0.56 ? 1 : 2;
      const v = clamp(dens * (0.8 + qy * 0.5));
      g.set(x, y, SH[Math.min(3, Math.floor(v * 4.4))], K(HUES[hue], Math.min(9, Math.floor(0.6 + v * 9.5))));
    }
    for (const [sx, sy, ph, b] of stars) {
      if (g.get(sx, sy) === "█" || g.get(sx, sy) === "▓") continue;
      const tw = 0.5 + 0.5 * Math.sin(t * (0.8 + b * 2) + ph);
      if (tw > 0.3) g.set(sx, sy, b > 0.8 && tw > 0.7 ? "*" : tw > 0.6 ? "·" : ".", K("star", b > 0.5 ? 1 : 0));
    }
    for (const [sx, sy, ph] of big) {
      const p = 0.6 + 0.4 * Math.sin(t * 1.1 + ph);
      g.set(sx, sy, "●", K("star", 1));
      if (p > 0.45) {
        g.set(sx - 1, sy, "─", K("star", 0)); g.set(sx + 1, sy, "─", K("star", 0));
        g.set(sx, sy - 1, "│", K("star", 0)); g.set(sx, sy + 1, "│", K("star", 0));
      }
      if (p > 0.8) { g.set(sx - 2, sy, "·", K("star", 0)); g.set(sx + 2, sy, "·", K("star", 0)); }
    }
    return g.frame();
  };
}
