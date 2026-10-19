/* sunrise-horizon: the sun rises over a flat sea horizon as the sky shifts from night to dawn to day. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const TOPC = ["#04061a", "#141238", "#2c2a64", "#3e4c94", "#3a6ab4", "#3a82cc", "#3a8ad8"];
const LOWC = ["#0a0c26", "#3a1a4a", "#a03a5a", "#f07a3a", "#ffb060", "#f4d8a0", "#cfe6f4"];
const SEAT = ["#05081a", "#1a1430", "#4a2a4a", "#6a4050", "#4a6a8a", "#2e6a9a", "#1e5a90"];
const SEAB = ["#02040c", "#0a0a1c", "#1a1830", "#24304a", "#1e3e64", "#1a4a7a", "#164a80"];
const SKYK = TOPC.map((c, i) => add(gradient([c, LOWC[i]], 5)));
const SEAK = SEAT.map((c, i) => add(gradient([c, SEAB[i]], 3)));
const SUN = add(gradient(["#ff7a2a", "#ffb04a", "#ffe08a", "#fff8dc"], 4));
const STAR = add(["#e0e4ff"]);
const BAYER = [[0, 0.5], [0.75, 0.25]];

export const meta = {
  slug: "sunrise-horizon",
  name: "Sunrise Horizon",
  category: "weather",
  note: "The sun climbs over a flat sea horizon while the sky shifts from deep night through dawn pinks to clear day.",
  tags: ["sunrise", "dawn", "sky", "sea", "hero", "wallpaper"],
  cols: 96, rows: 34, fps: 20,
  palette: palette(P),
};

const CYCLE = 26;
const SH = " ░▒▓█";
const h01 = (x, y) => { let h = Math.imul(x * 374761393 + y * 668265263, 1274126177); h ^= h >>> 15; return ((h >>> 0) % 1000) / 1000; };

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const hz = 21, sx = 48;
  const r = rng(8);
  const stars = Array.from({ length: 60 }, () => [Math.floor(r() * cols), Math.floor(r() * 15), r() * TAU]);
  return (t) => {
    g.clear();
    const p = ((t + CYCLE * 0.2) % CYCLE) / CYCLE;
    const e = 0.5 - 0.5 * Math.cos(p * TAU);
    const sunY = hz + 5 - e * 19;
    const light = clamp(e * 1.15);
    const tf = light * 5.999;
    for (let y = 0; y < hz; y++) {
      for (let x = 0; x < cols; x++) {
        const c = fbm(x * 0.035 + t * 0.03, y * 0.2, 3, 3);
        const d = Math.hypot((x - sx) / 2, y - sunY);
        const glow = Math.exp(-d / 10) * clamp(1.3 - Math.abs(light - 0.45) * 1.6);
        const b = BAYER[y & 1][x & 1];
        const ti = Math.min(6, Math.floor(tf + b * 0.999));
        const hj = Math.pow(y / hz, 1.4 - light * 0.5) * 4 + glow * 2 + (c - 0.5) * 1.5;
        const j = Math.max(0, Math.min(4, Math.floor(hj + b)));
        const band = c > 0.62 && y > 3 && y < hz - 3;
        g.set(x, y, band ? "▓" : SH[1 + Math.min(2, Math.floor(c * 3))], KEYS[SKYK[ti] + j]);
      }
    }
    if (light < 0.45) for (const [x, y, ph] of stars) if (Math.sin(t * 1.4 + ph) > light * 3 - 0.5) g.set(x, y, light < 0.2 ? "*" : "·", KEYS[STAR]);
    const R = 5.5;
    for (let y = Math.floor(sunY - R); y <= sunY + R; y++) {
      if (y >= hz || y < 0) continue;
      for (let x = sx - 14; x <= sx + 14; x++) {
        const d = Math.hypot((x - sx) / 2, y - sunY);
        if (d < R / 2 + 0.6) g.set(x, y, "█", KEYS[SUN + Math.min(3, Math.floor((1 - d / (R / 2 + 0.6)) * 3 + light * 1.5))]);
        else if (d < R / 2 + 2 && light > 0.05) g.set(x, y, "▒", KEYS[SUN + 1]);
      }
    }
    for (let y = hz; y < rows; y++) {
      const depth = (y - hz) / (rows - hz);
      for (let x = 0; x < cols; x++) {
        const w = fbm(x * 0.08 - t * 0.2, y * 0.7 + t * 0.15, 3, 5);
        const b = BAYER[y & 1][x & 1];
        const ti = Math.min(6, Math.floor(tf + b * 0.999));
        const k = SEAK[ti] + Math.max(0, Math.min(2, Math.floor(depth * 2.5 + (w - 0.5) * 2 + b)));
        const beam = Math.exp(-(((x - sx) / (3 + depth * 9)) ** 2)) * clamp((sunY > hz - 1 ? 0 : 1) * (0.4 + light));
        const glint = beam * (0.5 + 0.5 * Math.sin(t * 3 + x * 0.7 + y * 1.9)) * (w > 0.45 ? 1 : 0.5);
        if (glint > 0.45) g.set(x, y, glint > 0.7 ? "=" : "-", KEYS[SUN + (glint > 0.7 ? 3 : 2)]);
        else g.set(x, y, w > 0.6 ? "≈" : w > 0.4 ? "~" : "▓", KEYS[k]);
      }
    }
    for (let x = 0; x < cols; x++) g.set(x, hz, "▀", KEYS[SKYK[Math.min(6, Math.floor(tf))] + 4]);
    return g.frame();
  };
}
