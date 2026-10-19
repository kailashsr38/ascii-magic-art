/* snowfall: layered snow drifting over a pine valley at night, drifts slowly piling up. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const SKY = add(gradient(["#0a1230", "#1b2a5a", "#36508a", "#5f7cb2"], 12));
const MTN = add(gradient(["#3b4f7a", "#6d84b0", "#a8bad8"], 6));
const PINE = add(gradient(["#06140f", "#103024", "#1d4a36"], 4));
const SNOW = add(gradient(["#7f97c2", "#b4c6e4", "#e3ecfa", "#ffffff"], 8));
const FLAKE = add(["#6f85b5", "#b9c9ea", "#ffffff"]);

export const meta = {
  slug: "snowfall",
  name: "Snowfall Valley",
  category: "weather",
  note: "Three layers of snow falling over a pine valley at night while the drifts slowly pile up.",
  tags: ["snow", "winter", "night", "wallpaper", "hero", "seasonal"],
  cols: 96, rows: 34, fps: 20,
  palette: palette(P),
};

const SH = " ░▒▓█", LOW = " ▁▂▃▄▅▆▇█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(23);
  const mtn = Array.from({ length: cols }, (_, x) => 10 + Math.floor(fbm(x * 0.03, 1, 4, 3) * 9));
  const pines = Array.from({ length: 16 }, (_, i) => ({ x: Math.floor((i + 0.5) * cols / 16 + (r() - 0.5) * 4), h: 5 + Math.floor(r() * 7) }));
  const layers = [
    { n: 140, sp: 2.2, sway: 0.6, ch: ["·", "."], key: FLAKE },
    { n: 70, sp: 4.5, sway: 1.4, ch: ["•", "*"], key: FLAKE + 1 },
    { n: 32, sp: 8, sway: 2.4, ch: ["●", "*"], key: FLAKE + 2 },
  ].map((L) => ({ ...L, f: Array.from({ length: L.n }, () => [r() * cols, r() * (rows + 2), r() * TAU, 0.5 + r()]) }));
  const base = Array.from({ length: cols }, (_, x) => 3.2 + fbm(x * 0.05, 7, 3, 2) * 3);
  const pileShape = Array.from({ length: cols }, (_, x) => 1 + 3 * fbm(x * 0.07, 3, 3, 4));
  return (t) => {
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const c = fbm(x * 0.03 + t * 0.03, y * 0.12, 3, 1);
      const v = clamp(0.2 + (y / rows) * 0.55 + (c - 0.5) * 0.7);
      g.set(x, y, SH[1 + Math.min(2, Math.floor(v * 3.2))], KEYS[SKY + Math.min(11, Math.floor(v * 12))]);
    }
    for (let x = 0; x < cols; x++) for (let y = mtn[x]; y < rows; y++) {
      const cap = y - mtn[x] < 2 + noise2(x * 0.3, 1) * 2;
      g.set(x, y, cap ? "█" : "▓", KEYS[MTN + (cap ? 5 : Math.min(4, Math.floor(noise2(x * 0.2, y * 0.4, 2) * 4)))]);
    }
    const pile = 0.5 - 0.5 * Math.cos((TAU * t) / 40);
    const hgt = base.map((b, x) => b + pile * pileShape[x]);
    const sy = rows - 4;
    for (const p of pines) for (let k = 0; k < p.h + 1; k++) {
      const y = sy - p.h + k;
      const hw = Math.floor(k * 0.6 - (k % 3) * 0.4);
      for (let dx = -hw; dx <= hw; dx++) {
        const edge = dx === -hw || dx === hw;
        const snowy = edge && k % 3 === 2;
        g.set(p.x + dx, y, k === 0 ? "▲" : snowy ? "▀" : edge ? (dx < 0 ? "/" : "\\") : "▓", KEYS[snowy ? SNOW + 6 : PINE + Math.min(3, 1 + (dx > 0 ? 1 : 0) + (k % 3 === 0 ? 1 : 0))]);
      }
    }
    for (let x = 0; x < cols; x++) {
      const h = hgt[x];
      const top = rows - h;
      const ty = Math.floor(top);
      const frac = 1 - (top - ty);
      for (let y = ty + 1; y < rows; y++) {
        const dd = y - top;
        const v = clamp(0.95 - dd * 0.1 + (noise2(x * 0.4, y * 0.9, 5) - 0.5) * 0.4);
        g.set(x, y, v > 0.5 ? "█" : "▓", KEYS[SNOW + Math.min(7, Math.floor(v * 8))]);
      }
      g.set(x, ty, LOW[Math.max(1, Math.min(8, Math.round(frac * 8)))], KEYS[SNOW + 7]);
      if (noise2(x * 1.3, Math.floor(t * 3), 9) > 0.86) g.set(x, ty + 1, "*", KEYS[FLAKE + 2]);
    }
    for (const L of layers) for (const [fx, fy, ph, s] of L.f) {
      const y = (fy + t * L.sp * s) % (rows + 2) - 1;
      let x = (fx + t * 1.2 * s + Math.sin(t * 0.9 * s + ph) * L.sway) % cols;
      if (x < 0) x += cols;
      const xi = Math.floor(x);
      if (y >= rows - hgt[xi] - 0.3) continue;
      g.set(xi, y, L.ch[Math.sin(ph * 7) > 0.3 ? 1 : 0], KEYS[L.key]);
    }
    return g.frame();
  };
}
