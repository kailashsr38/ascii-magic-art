/* fern-fractal: self-similar fern fronds unrolling from tight fiddleheads on the forest floor. */
import { Grid, palette, gradient, KEYS, fbm, noise2, clamp } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const BG = add(gradient(["#030c09", "#071812", "#0d261b", "#153424", "#1f4430", "#2c563e"], 10));
const FERN = add(gradient(["#1e6a22", "#2f8a2a", "#4aa832", "#72c63e", "#a4e05a", "#d8f890"], 12));
const STEM = add(gradient(["#2a4a16", "#4a6a1e", "#7a8a2a"], 3));
const FLOOR = add(gradient(["#0c0a06", "#241a0e", "#3a2c16", "#4e4020"], 5));

export const meta = {
  slug: "fern-fractal",
  name: "Fern Fractal",
  category: "weather",
  note: "Self-similar fern fronds unroll from tight fiddleheads on the forest floor, leaflet by leaflet, and sway in the damp air.",
  tags: ["fern", "fractal", "plant", "growth", "generative", "wallpaper"],
  cols: 90, rows: 38, fps: 20,
  palette: palette(P),
};

const CYCLE = 15;
const dirCh = (c, s) => { const ac = Math.abs(c), as = Math.abs(s); return ac < 0.38 ? "|" : as < 0.33 ? "-" : c * s > 0 ? "/" : "\\"; };

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const baseY = rows - 3;
  const fronds = [
    { x: 46, ang: 1.6, len: 31, lag: 0, side: 1 },
    { x: 18, ang: 1.85, len: 21, lag: 5, side: 1 },
    { x: 72, ang: 1.3, len: 22, lag: 10, side: -1 },
  ];
  const put = (wx, wy, ch, k) => g.set(Math.round(wx * 2), Math.round(baseY - wy), ch, KEYS[k]);
  const walk = (x, y, ang, len, curl, side, depth, G, tipBoost) => {
    const steps = Math.max(3, Math.floor(len * (depth ? 1.6 : 1.9)));
    const ds = len / steps;
    let alt = 1;
    for (let i = 0; i < steps; i++) {
      const u = i / steps;
      ang += side * curl * Math.pow(u, 3) * 4 * ds / len;
      const c = Math.cos(ang), s = Math.sin(ang);
      x += c * ds; y += s * ds;
      const tip = u > 0.8 && curl > 1;
      if (depth === 0) {
        put(x, y, dirCh(c, s), STEM + (u > 0.7 ? 2 : 1));
        if (u > 0.06 && u < 0.97 && i % 2 === 0) {
          alt = -alt;
          const pl = len * 0.46 * Math.min(1, 0.45 + u * 2.2) * Math.pow(1 - u, 0.9);
          if (pl > 0.6) walk(x, y, ang + alt * 1.3, pl, curl * 0.9, alt * side * -1 * -1 * (alt > 0 ? -1 : 1), 1, G, u);
        }
      } else {
        const w = Math.max(0, (1 - u) * Math.min(1.4, len * 0.22));
        const lum = clamp(0.35 + tipBoost * 0.35 + (1 - u) * 0.15 + (tip ? 0.3 : 0) + (1 - G) * 0.3);
        const k = FERN + Math.min(11, Math.floor(lum * 12));
        put(x, y, dirCh(c, s), k);
        if (w > 0.25) {
          const nx = -s, ny = c;
          for (let q = 1; q <= Math.ceil(w * 2); q++) {
            const d = (q / 2);
            if (d > w + 0.2) break;
            const ch = d < w * 0.6 ? "▓" : "▒";
            put(x + nx * d * 0.6 + c * d * 0.25, y + ny * d * 0.6 + s * d * 0.25, ch, k);
            put(x - nx * d * 0.6 + c * d * 0.25, y - ny * d * 0.6 + s * d * 0.25, ch, k);
          }
        }
      }
    }
  };
  return (t) => {
    g.clear();
    for (let yy = 0; yy < rows; yy++) for (let xx = 0; xx < cols; xx++) {
      const m = fbm(xx * 0.05 + t * 0.04, yy * 0.1, 3, 4);
      const v = clamp(0.25 + (1 - yy / rows) * 0.3 + (m - 0.4) * 0.9);
      g.set(xx, yy, v > 0.6 ? "▓" : v > 0.4 ? "▒" : "░", KEYS[BG + Math.min(9, Math.floor(v * 10))]);
    }
    for (let yy = 0; yy < rows; yy++) {
      const sh = fbm(yy * 0.2, t * 0.1, 2, 6);
      if (sh > 0.6) for (let xx = 0; xx < cols; xx++) if ((xx + yy * 3) % 5 === 0) g.set(xx, yy, "/", KEYS[BG + 7]);
    }
    for (const f of fronds) {
      const p = (t + 7 + f.lag) % CYCLE;
      const G = p < 9 ? 1 - Math.pow(1 - p / 9, 2) : p < 13 ? 1 : 1 - (p - 13) / 2;
      const len = f.len * (0.2 + 0.8 * G);
      const curl = 9 * Math.pow(1 - G, 1.3) + 0.5;
      const sway = Math.sin(t * 0.9 + f.lag) * 0.05;
      walk(f.x / 2, 0, f.ang + sway, len, curl, f.side, 0, G, 0);
    }
    for (let xx = 0; xx < cols; xx++) for (let yy = baseY + 1; yy < rows; yy++) {
      const n = noise2(xx * 0.6, yy, 2);
      g.set(xx, yy, n > 0.6 ? "▓" : "▒", KEYS[FLOOR + Math.min(4, Math.floor(n * 5))]);
    }
    for (let xx = 0; xx < cols; xx++) if (noise2(xx * 0.8, 9, 3) > 0.45) g.set(xx, baseY, noise2(xx, 2) > 0.5 ? "," : "'", KEYS[STEM]);
    return g.frame();
  };
}
