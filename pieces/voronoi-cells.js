/* voronoi-cells: drifting seed points and the Voronoi regions they claim, shaded like stained glass. */
import { Grid, palette, gradient, KEYS, rng, clamp, TAU } from "../lib/kit.js";

const HUES = ["#ff4a6a", "#ff9a3a", "#ffd23f", "#9aff5a", "#3fe0a0", "#3fd0ff", "#4a7aff", "#9a6aff", "#e06aff", "#ff6ab0", "#ffb07a", "#5affd0", "#7ab0ff", "#d0ff6a"];
const SH = HUES.flatMap((h) => gradient(["#0a0a14", h, "#ffffff"], 5).slice(1, 5)); // 4 shades each
const pal = palette([...SH, "#05050a", "#ffffff"]);
const NS = HUES.length;
const EDGE = KEYS[NS * 4], DOT = KEYS[NS * 4 + 1];

export const meta = {
  slug: "voronoi-cells",
  name: "Voronoi Cells",
  category: "algorithms",
  note: "Fourteen drifting seed points and the Voronoi regions they claim, shaded like moving stained glass.",
  tags: ["voronoi", "geometry", "math", "wallpaper", "hero"],
  cols: 92, rows: 36, fps: 24,
  palette: pal,
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(9);
  const seeds = Array.from({ length: NS }, () => ({
    cx: 8 + r() * (cols - 16), cy: 4 + r() * (rows - 8) * 2,
    ax: 6 + r() * 14, ay: 4 + r() * 10, fx: 0.08 + r() * 0.12, fy: 0.07 + r() * 0.12, p: r() * TAU,
  }));
  const sx = new Float32Array(NS), sy = new Float32Array(NS);
  return (t) => {
    for (let i = 0; i < NS; i++) {
      const s = seeds[i];
      sx[i] = clamp(s.cx + Math.sin(t * s.fx * TAU * 0.5 + s.p) * s.ax, 1, cols - 2);
      sy[i] = clamp(s.cy + Math.cos(t * s.fy * TAU * 0.5 + s.p * 1.7) * s.ay, 1, rows * 2 - 2);
    }
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const py = y * 2 + 1;
      let d1 = 1e9, d2 = 1e9, k = 0;
      for (let i = 0; i < NS; i++) {
        const dx = x - sx[i], dy = py - sy[i];
        const d = dx * dx + dy * dy;
        if (d < d1) { d2 = d1; d1 = d; k = i; } else if (d < d2) d2 = d;
      }
      const a = Math.sqrt(d1), b = Math.sqrt(d2);
      const gap = b - a;
      if (gap < 1.1) { g.set(x, y, gap < 0.55 ? " " : "░", EDGE); continue; }
      const v = clamp(1 - a / 18);
      const edge = clamp(gap / 8);
      const lvl = Math.min(3, Math.floor((v * 0.7 + edge * 0.3) * 4));
      g.set(x, y, lvl >= 3 ? "█" : lvl === 2 ? "▓" : lvl === 1 ? "▒" : "░", KEYS[k * 4 + lvl]);
    }
    for (let i = 0; i < NS; i++) g.set(Math.round(sx[i]), Math.floor(sy[i] / 2), "●", DOT);
    return g.frame();
  };
}
