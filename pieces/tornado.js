/* tornado: a twisting funnel cloud snaking across open plains, flinging dust and debris. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const SKY = add(gradient(["#121614", "#1e2622", "#2e3a34", "#465448", "#66745e"], 12));
const FUN = add(gradient(["#4a4e4a", "#686c66", "#8a8c84", "#aaac9e", "#c8c8b8", "#e8e6d6"], 12));
const DUST = add(gradient(["#3a2e20", "#6a5232", "#9a7a4a"], 4));
const FIELD = add(gradient(["#1e2a14", "#34481e", "#4e6428", "#6e7e34", "#8a8a40"], 8));
const DEB = add(["#2a1e14", "#7a5a3a", "#c8b48a"]);

export const meta = {
  slug: "tornado",
  name: "Tornado",
  category: "weather",
  note: "A twisting tornado funnel snakes across open plains under a green storm sky, flinging dust and debris around its base.",
  tags: ["tornado", "storm", "weather", "wind", "dramatic", "wallpaper"],
  cols: 96, rows: 36, fps: 24,
  palette: palette(P),
};

const SH = " ░▒▓█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const base = 9, ground = 28;
  const r = rng(19);
  const debris = Array.from({ length: 60 }, () => [r() * TAU, 3 + r() * 9, r() * 8, 1.5 + r() * 2.5, Math.floor(r() * 3)]);
  return (t) => {
    g.clear();
    const X = cols / 2 + Math.sin(t * 0.25) * 22 + Math.sin(t * 0.61) * 5;
    for (let y = 0; y < ground; y++) for (let x = 0; x < cols; x++) {
      const c = fbm(x * 0.04 + t * 0.08, y * 0.16, 4, 1);
      const swirl = y < base + 2 ? Math.exp(-Math.abs(x - X) / 25) * 0.3 : 0;
      const v = clamp(y < base + 2 ? 0.1 + c * 0.55 - swirl * 0.4 : 0.35 + (y - base) / ground * 0.35 + (c - 0.5) * 0.3);
      g.set(x, y, SH[1 + Math.min(3, Math.floor(c * 4.2))], KEYS[SKY + Math.min(11, Math.floor(v * 12))]);
    }
    for (let x = 0; x < cols; x++) {
      const h = ground - 1 - Math.floor(noise2(x * 0.08, 1, 2) * 2);
      for (let y = h; y < ground; y++) g.set(x, y, "▄", KEYS[FIELD + 1]);
      if (x % 17 === 5) { g.set(x, h - 1, "▲", KEYS[FIELD]); g.set(x, h - 2, "▲", KEYS[FIELD]); }
    }
    for (let y = ground; y < rows; y++) for (let x = 0; x < cols; x++) {
      const d = (y - ground) / (rows - ground);
      const row = Math.sin((x - cols / 2) * 0.12 / (0.3 + d) + y * 2) > 0.3;
      const n = noise2(x * 0.2, y * 0.6, 4);
      g.set(x, y, row ? "▓" : "▒", KEYS[FIELD + Math.min(7, Math.floor(d * 4 + n * 3 + (row ? 1 : 0)))]);
    }
    for (let y = base; y < ground; y++) {
      const u = (y - base) / (ground - base);
      const w = 2.5 + Math.pow(1 - u, 1.25) * 14;
      const cx = X + Math.sin(u * 3.2 - t * 1.4) * 4 * u + (u - 0.5) * 6;
      for (let x = Math.floor(cx - w - 1); x <= cx + w + 1; x++) {
        const a = (x - cx) / w;
        if (Math.abs(a) > 1) continue;
        const ph = Math.asin(a) * 2 + y * 0.6 - t * 9;
        const band = 0.5 + 0.5 * Math.sin(ph);
        const n = noise2(x * 0.3, y * 0.5 - t * 2, 6);
        const edge = 1 - Math.abs(a);
        const v = clamp(0.2 + band * 0.45 + edge * 0.25 + (n - 0.5) * 0.3 + a * 0.15);
        const ch = edge < 0.15 ? (n > 0.5 ? "▒" : "░") : band > 0.66 ? "█" : band > 0.3 ? "▓" : "▒";
        g.set(x, y, ch, KEYS[FUN + Math.min(11, Math.floor(v * 12))]);
      }
    }
    const bx = X + 3;
    for (let y = ground - 9; y < ground + 4; y++) for (let x = Math.floor(bx - 22); x <= bx + 22; x++) {
      const d = Math.hypot((x - bx) / 2.4, (y - ground + 1) * 1.3);
      const n = fbm(x * 0.2 + t * 1.5, y * 0.5, 2, 8);
      if (d / 8 + (0.5 - n) * 0.8 < 1) g.set(x, y, n > 0.6 ? "▓" : "▒", KEYS[DUST + Math.min(3, Math.floor(n * 4))]);
    }
    for (const [a0, rad, h, sp, k] of debris) {
      const a = a0 + t * sp;
      const y = ground - 1 - h - Math.sin(t * 0.7 + a0) * 1.5;
      const x = bx + Math.cos(a) * rad * 1.6;
      if (Math.sin(a) < -0.2 && Math.abs(x - bx) < 6) continue;
      g.set(x, y, ["▪", "-", "·", "/"][Math.floor(a * 2) & 3], KEYS[DEB + k]);
    }
    return g.frame();
  };
}
