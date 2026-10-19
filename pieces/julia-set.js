/* julia-set: a filled Julia set that morphs as its constant c traces the edge of the Mandelbrot cardioid. */
import { Grid, palette, gradient, KEYS, clamp, TAU } from "../lib/kit.js";

const RAMP = gradient(["#12041e", "#3a0a5a", "#8a1a8a", "#e0408a", "#ff9a5a", "#ffe08a", "#fffbe8"], 20);
const pal = palette([...RAMP, "#2a0c48", "#40186a"]); // interior shades
const NR = RAMP.length;

export const meta = {
  slug: "julia-set",
  name: "Julia Set",
  category: "algorithms",
  note: "A Julia set that morphs between spirals, dendrites and dust as its constant c traces the edge of the main cardioid.",
  tags: ["fractal", "math", "morph", "wallpaper", "hero"],
  cols: 84, rows: 36, fps: 24,
  palette: pal,
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const IN1 = KEYS[NR], IN2 = KEYS[NR + 1];
  const maxIt = 110;
  return (t) => {
    // c rides just around the edge of the main cardioid, where Julia sets are richest
    const a = 0.6 + t * 0.21;
    const rr = 1.0 + 0.045 * Math.sin(a * 2.3);
    const cr = rr * (Math.cos(a) / 2 - Math.cos(2 * a) / 4), ci = rr * (Math.sin(a) / 2 - Math.sin(2 * a) / 4);
    const step = 3.4 / cols;
    for (let y = 0; y < rows; y++) {
      const y0 = (y - rows / 2 + 0.5) * step * 2;
      for (let x = 0; x < cols; x++) {
        let zr = (x - cols / 2 + 0.5) * step, zi = y0, i = 0, zr2 = zr * zr, zi2 = zi * zi;
        while (i < maxIt && zr2 + zi2 < 64) { zi = 2 * zr * zi + ci; zr = zr2 - zi2 + cr; zr2 = zr * zr; zi2 = zi * zi; i++; }
        if (i >= maxIt) { g.set(x, y, (x + y) % 2 ? "▓" : "▒", (x + y) % 2 ? IN2 : IN1); continue; }
        const nu = i + 1 - Math.log2(Math.log2(zr2 + zi2) / 2);
        const v = clamp(Math.pow(nu / 28, 0.5));
        g.set(x, y, v < 0.18 ? "░" : v < 0.32 ? "▒" : v < 0.5 ? "▓" : "█", KEYS[Math.min(NR - 1, Math.floor(v * NR))]);
      }
    }
    return g.frame();
  };
}
