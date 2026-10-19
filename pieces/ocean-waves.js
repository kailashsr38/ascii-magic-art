/* ocean-waves: side view of swells rolling toward the shore, cresting, curling over and breaking into foam. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const SKY = add(gradient(["#3a7cc4", "#64a2dc", "#9cc8ea", "#d0e6f4"], 10));
const CLOUD = add(gradient(["#d4e4f0", "#ffffff"], 2));
const FAR = add(gradient(["#3a6a94", "#2e5a84", "#244a72"], 4));
const SEA = add(gradient(["#03182e", "#082c52", "#0e4a78", "#1a6c98", "#2a92b4", "#4ab8cc", "#86dcdc"], 14));
const FOAM = add(gradient(["#9ad0dc", "#d4f0f4", "#ffffff"], 3));
const SAND = add(gradient(["#7a5a30", "#b49058", "#dcc08a"], 4));

export const meta = {
  slug: "ocean-waves",
  name: "Breaking Waves",
  category: "weather",
  note: "A side view of ocean swells rolling toward shore, steepening, curling over and breaking into white foam.",
  tags: ["ocean", "waves", "sea", "surf", "wallpaper", "hero"],
  cols: 100, rows: 34, fps: 24,
  palette: palette(P),
};

const SH = " ░▒▓█";
const WL = 50, SPEED = 9;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const hz = 11, still = 22;
  const r = rng(4);
  const spray = Array.from({ length: 50 }, () => [r(), r(), r()]);
  const surf = new Float32Array(cols), phase = new Float32Array(cols), amp = new Float32Array(cols);
  return (t) => {
    g.clear();
    for (let y = 0; y < hz; y++) for (let x = 0; x < cols; x++) {
      const c = fbm(x * 0.04 + t * 0.04, y * 0.3, 3, 6);
      const v = clamp(0.15 + (y / hz) * 0.8);
      if (c > 0.6 && y < hz - 2) g.set(x, y, c > 0.67 ? "█" : "▓", KEYS[CLOUD + (c > 0.65 ? 1 : 0)]);
      else g.set(x, y, SH[1 + Math.min(2, Math.floor(v * 3))], KEYS[SKY + Math.min(9, Math.floor(v * 10))]);
    }
    for (let x = 0; x < cols; x++) {
      const shoal = clamp((x - 4) / (cols - 30));
      const A = 1.6 + shoal * 5.2;
      const Q = 0.25 + shoal * 0.55;
      let best = -1e9, bestPh = 0;
      for (let s = -1; s <= 1; s += 0.02) {
        const th = ((x - t * SPEED) / WL + s * 0.5) * TAU;
        const X = x + s * WL * 0.5 - Q * (WL / TAU) * Math.sin(th);
        if (Math.abs(X - x) < 0.6) { const h = A * Math.cos(th); if (h > best) { best = h; bestPh = th; } }
      }
      if (best === -1e9) best = 0;
      surf[x] = still - best - 2 * shoal;
      phase[x] = ((bestPh / TAU) % 1 + 1) % 1;
      amp[x] = shoal;
    }
    for (let y = hz; y < rows; y++) for (let x = 0; x < cols; x++) {
      if (y >= surf[x]) continue;
      const n = noise2(x * 0.3 - t, y * 2, 3);
      g.set(x, y, n > 0.8 ? "~" : y === hz ? "▄" : n > 0.4 ? "▓" : "█", KEYS[FAR + Math.min(3, Math.floor((y - hz) / 3))]);
    }
    for (let x = 0; x < cols; x++) {
      const s = surf[x];
      const front = phase[x] > 0.5 && phase[x] < 0.98;
      for (let y = Math.max(hz, Math.floor(s)); y < rows; y++) {
        const depth = y - s;
        const n = fbm(x * 0.09 - t * 0.6, y * 0.4, 3, 2);
        const v = clamp(0.92 - depth * 0.045 + (n - 0.5) * 0.35 + (front && depth < 5 ? 0.12 * amp[x] : 0));
        g.set(x, y, depth < 0.8 ? "▄" : n > 0.6 ? "≈" : n > 0.45 ? "~" : "▓", KEYS[SEA + Math.min(13, Math.floor(v * 14))]);
      }
      const ph = phase[x], sh = amp[x];
      if (sh > 0.5 && (ph > 0.78 || ph < 0.1)) {
        const wash = Math.round(1 + sh * 4);
        for (let k = 0; k < wash; k++) {
          const nn = noise2(x * 0.6 + t * 3, k * 0.8 + t * 5, 9);
          if (nn > 0.2) g.set(x, Math.floor(s) + k, nn > 0.55 ? "█" : "▓", KEYS[FOAM + (k < 2 ? 2 : 1)]);
        }
      } else if (ph > 0.05 && ph < 0.4 && sh > 0.4 && noise2(x * 0.5 - t, 3, 3) < (0.4 - ph) * 2) {
        g.set(x, Math.floor(s), "~", KEYS[FOAM + 1]);
        g.set(x, Math.floor(s) + 1, "-", KEYS[FOAM]);
      }
    }
    for (let x = 1; x < cols - 1; x++) {
      if (!(surf[x] <= surf[x - 1] && surf[x] < surf[x + 1])) continue;
      const sh = amp[x];
      if (sh < 0.45) continue;
      const Rr = 1 + sh * 2.8;
      const ccx = x + Rr * 2, ccy = surf[x] + Rr;
      for (let th = Math.PI; th > -0.6; th -= 0.08) {
        const lx = ccx + Math.cos(th) * Rr * 2, ly = ccy - Math.sin(th) * Rr;
        g.set(lx, ly, "█", KEYS[th < 0.6 ? FOAM + 2 : SEA + 12]);
        g.set(lx, ly + 1, "▓", KEYS[th < 0.6 ? FOAM + 1 : SEA + 10]);
      }
      for (let yy = Math.ceil(ccy - Rr + 1.5); yy < ccy + Rr; yy++) for (let xx = Math.ceil(ccx - Rr * 2 + 2); xx < ccx + Rr * 2 - 1; xx++) {
        if (Math.hypot((xx - ccx) / 2, yy - ccy) < Rr - 1.2) g.set(xx, yy, "▓", KEYS[SEA + 2]);
      }
      for (const [a0, b0, c0] of spray) {
        const a = (t * (1 + c0) + a0) % 1;
        if (b0 > sh) continue;
        g.set(ccx + Rr * 2 + a * 6 * (0.5 + b0), ccy - Rr - Math.sin(a * Math.PI) * 3 * (0.5 + c0), a < 0.5 ? "▒" : "░", KEYS[FOAM + 2]);
      }
    }
    for (let x = cols - 16; x < cols; x++) {
      const top = rows - 1 - Math.floor((x - (cols - 16)) * 0.4);
      for (let y = top; y < rows; y++) if (y > surf[x] + 2 || y >= rows - 1) g.set(x, y, noise2(x, y, 5) > 0.5 ? "▓" : "█", KEYS[SAND + Math.min(3, rows - y)]);
    }
    return g.frame();
  };
}
