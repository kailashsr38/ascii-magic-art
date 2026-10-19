/* wind-grass: a field of tall grass bending and shimmering as gusts roll across it. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const SKY = add(gradient(["#2f6fb8", "#5a96d6", "#94bfe8", "#d4e8f6"], 10));
const CLOUD = add(gradient(["#b8c8dc", "#e4ecf4", "#ffffff"], 3));
const HILL = add(gradient(["#3a6a4a", "#5a8a5a", "#80a866"], 4));
const BASE = add(gradient(["#0e2a10", "#1a4016", "#2a5a1c", "#3e7424"], 6));
const BLADE = add(gradient(["#2e6a1e", "#4c8a26", "#78aa34", "#a8c84c", "#d6e48a", "#f2f6c8"], 12));

export const meta = {
  slug: "wind-grass",
  name: "Wind Through Grass",
  category: "weather",
  note: "A field of tall grass bends and shimmers silver as gusts of wind roll across it under a summer sky.",
  tags: ["grass", "wind", "field", "summer", "calm", "wallpaper"],
  cols: 96, rows: 32, fps: 24,
  palette: palette(P),
};

const SH = " ░▒▓█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const field = 12;
  const r = rng(31);
  const jit = Array.from({ length: cols * rows }, () => r());
  const hill = Array.from({ length: cols }, (_, x) => field - 1 - Math.floor(fbm(x * 0.03, 2, 3, 3) * 4));
  const gust = (x, y, t) => fbm(x * 0.035 - t * 0.55, y * 0.06 + t * 0.05, 3, 2);
  return (t) => {
    g.clear();
    for (let y = 0; y < field; y++) for (let x = 0; x < cols; x++) {
      const c = fbm(x * 0.045 - t * 0.12, y * 0.25, 4, 7);
      const v = clamp(0.2 + (y / field) * 0.6);
      if (c > 0.56) g.set(x, y, c > 0.66 ? "█" : c > 0.6 ? "▓" : "▒", KEYS[CLOUD + Math.min(2, Math.floor((c - 0.56) * 22))]);
      else g.set(x, y, SH[1 + Math.min(2, Math.floor(v * 3))], KEYS[SKY + Math.min(9, Math.floor(v * 10))]);
    }
    for (let x = 0; x < cols; x++) for (let y = hill[x]; y < field + 1; y++) g.set(x, y, "▓", KEYS[HILL + Math.min(3, y - hill[x])]);
    for (let y = field; y < rows; y++) for (let x = 0; x < cols; x++) {
      const G = gust(x, y, t);
      const v = clamp(0.2 + (G - 0.4) * 1.4 + ((y - field) / (rows - field)) * 0.25);
      g.set(x, y, v > 0.55 ? "▓" : "█", KEYS[BASE + Math.min(5, Math.floor(v * 6))]);
    }
    for (let y = field; y < rows; y++) {
      const d = (y - field) / (rows - field);
      const H = 1 + Math.floor(d * 6.5);
      const step = d < 0.3 ? 1 : 1;
      for (let x = -6; x < cols; x += step) {
        const j = jit[((x + 6) % cols) + y * cols];
        if (d < 0.5 && j < 0.3) continue;
        const bx = x + j * 0.9;
        const G = gust(bx, y, t);
        const bend = (G - 0.35) * 2.6 + Math.sin(t * 2.3 + x * 0.4 + y) * 0.12;
        const h = H * (0.75 + j * 0.5);
        for (let k = 1; k <= h; k++) {
          const u = k / h;
          const off = bend * u * u * h * 0.9;
          const slope = bend * 2 * u * 0.9;
          const ch = k >= h - 0.5 && j > 0.75 ? "'" : slope > 0.55 ? "/" : slope < -0.45 ? "\\" : slope > 0.25 ? ")" : "|";
          const lum = clamp(u * 0.55 + (G - 0.4) * 1.2 + d * 0.2);
          g.set(bx + off, y - k + 1, ch, KEYS[BLADE + Math.min(11, Math.floor(lum * 12))]);
        }
      }
    }
    return g.frame();
  };
}
