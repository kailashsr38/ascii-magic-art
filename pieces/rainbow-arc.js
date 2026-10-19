/* rainbow-arc: a shower passes over green hills, the clouds part and a rainbow arcs across the sky. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, TAU, lerp } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const GREY = add(gradient(["#3a4250", "#5a6474", "#848e9c", "#b0b8c2"], 8));
const BLUE = add(gradient(["#2e72c4", "#5a9ade", "#8ec0ec", "#cce4f6"], 8));
const CLOUD = add(gradient(["#6a7280", "#a8b0bc", "#e8eef4", "#ffffff"], 6));
const HILL = add(gradient(["#1a4a1e", "#2e6a26", "#4a8c30", "#76b040"], 8));
const RAIN = add(["#8aa0c0", "#c8d8ec"]);
const BOW = ["#e8403a", "#f48a2e", "#f6d23a", "#5cc048", "#3a8ae0", "#4a4ab8", "#8a4ac0"];
const BOWK = add(BOW);
const BOWD = add(BOW.map((h) => gradient(["#8090a8", h], 3)[1]));
const SUN = add(["#ffe680", "#fff6c8"]);

export const meta = {
  slug: "rainbow-arc",
  name: "Rainbow After Rain",
  category: "weather",
  note: "A rain shower drifts past over green hills, the clouds part and a full rainbow arcs across the clearing sky.",
  tags: ["rainbow", "rain", "weather", "sky", "hero", "wallpaper"],
  cols: 96, rows: 34, fps: 20,
  palette: palette(P),
};

const CYCLE = 18;
const SH = " ░▒▓█";
const h01 = (x, y) => { let h = Math.imul(x * 374761393 + y * 668265263, 1274126177); h ^= h >>> 15; return ((h >>> 0) % 1000) / 1000; };

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(12);
  const drops = Array.from({ length: 220 }, () => [r() * (cols + 20), r(), 0.8 + r() * 0.5]);
  const hill = Array.from({ length: cols }, (_, x) => 24 - Math.floor(fbm(x * 0.03, 1, 3, 2) * 6) + Math.floor(Math.max(0, Math.sin(x * 0.05)) * 2));
  const cx = 48, cy = 31, R0 = 26;
  return (t) => {
    g.clear();
    const p = (t + 7) % CYCLE;
    const clear = clamp((p - 3.5) / 3) * (1 - clamp((p - 15.5) / 2.5));
    const rain = 1 - clamp((p - 2.5) / 3) + clamp((p - 15) / 2.5);
    const bow = clamp((p - 5.5) / 3) * (1 - clamp((p - 13.5) / 2));
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = clamp(0.25 + (y / rows) * 0.7);
      const blue = h01(x, y) < clear;
      g.set(x, y, SH[1 + Math.min(2, Math.floor(v * 3))], KEYS[(blue ? BLUE : GREY) + Math.min(7, Math.floor(v * 8))]);
    }
    if (clear > 0.3) {
      for (let y = 1; y < 8; y++) for (let x = 74; x < 92; x++) {
        const d = Math.hypot((x - 83) / 2, y - 4);
        if (d < 2.6) g.set(x, y, "█", KEYS[SUN + 1]);
        else if (d < 3.6 && clear > 0.6) g.set(x, y, "▒", KEYS[SUN]);
      }
    }
    if (bow > 0) for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const d = Math.hypot((x - cx) / 2, (y - cy) * 1.0) * 1.0;
      const band = (R0 - d) / 1.1;
      if (band < 0 || band >= 7) continue;
      const b = Math.floor(band);
      const ang = Math.atan2(cy - y, (x - cx) / 2);
      const reveal = clamp(bow * 1.6 - Math.abs(ang - Math.PI / 2) / (Math.PI / 2) * 0.6);
      if (reveal <= 0) continue;
      const strong = reveal > 0.6;
      g.set(x, y, strong ? "█" : reveal > 0.3 ? "▓" : "▒", KEYS[(strong ? BOWK : BOWD) + b]);
    }
    for (let y = 0; y < 12; y++) for (let x = 0; x < cols; x++) {
      const drift = t * 1.2;
      const c = fbm(x * 0.05 - drift * 0.05 * (1 + clear * 3), y * 0.2, 4, 7);
      const thr = 0.42 + clear * 0.2 + (y / 12) * 0.12;
      if (c > thr) {
        const v = clamp((c - thr) * 4 + clear * 0.5 - y * 0.03);
        g.set(x, y, v > 0.6 ? "█" : v > 0.3 ? "▓" : "▒", KEYS[CLOUD + Math.min(5, Math.floor(v * 4 + clear * 2))]);
      }
    }
    if (rain > 0.02) for (const [dx, ph, sp] of drops) {
      if (ph > rain) continue;
      const y = ((ph * 7 + t * sp * 1.5) % 1) * 26 + 6;
      const x = Math.round(dx - y * 0.2 - t * 2) % (cols + 20);
      const xx = x < 0 ? x + cols + 20 : x;
      if (y < hill[Math.min(cols - 1, Math.max(0, xx))]) { g.set(xx, y, "/", KEYS[RAIN + 1]); g.set(xx + 1, y - 1, "'", KEYS[RAIN]); }
    }
    for (let x = 0; x < cols; x++) for (let y = hill[x]; y < rows; y++) {
      const n = fbm(x * 0.1, y * 0.4, 2, 5);
      const v = clamp(0.4 + clear * 0.35 - (y - hill[x]) * 0.03 + (n - 0.5) * 0.6);
      g.set(x, y, y === hill[x] ? "▄" : n > 0.55 ? "▓" : "█", KEYS[HILL + Math.min(7, Math.floor(v * 8))]);
    }
    return g.frame();
  };
}
