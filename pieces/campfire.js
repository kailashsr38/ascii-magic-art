/* campfire: a crackling campfire in a stone ring, flames licking up and sparks drifting into the night. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const BG = add(gradient(["#05070f", "#0d1124", "#22162a", "#4a2218", "#7a3a16"], 12));
const GND = add(gradient(["#0a0806", "#22150c", "#4a2a14", "#7a4a22"], 8));
const STONE = add(gradient(["#1c1c22", "#3e3a40", "#7a6458", "#b08a6a"], 6));
const LOG = add(gradient(["#2a1408", "#5a3018", "#8a5430", "#c08850"], 6));
const FIRE = add(gradient(["#4a0a04", "#a01c06", "#e04a0a", "#ff8a1a", "#ffc84a", "#fff4c0"], 14));
const STAR = add(["#cfd8ff"]);

export const meta = {
  slug: "campfire",
  name: "Campfire",
  category: "weather",
  note: "A campfire in a ring of stones, flames licking over crossed logs and sparks drifting up into the night.",
  tags: ["fire", "camping", "night", "cozy", "hero", "wallpaper"],
  cols: 80, rows: 34, fps: 24,
  palette: palette(P),
};

const SH = " ░▒▓█";
const FR = " .:*+▒▓█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = 40, base = 26, H = 19;
  const r = rng(5);
  const stars = Array.from({ length: 40 }, () => [Math.floor(r() * cols), Math.floor(r() * 9), r() * TAU]);
  const sparks = Array.from({ length: 46 }, () => ({ x: (r() - 0.5) * 14, life: 1.6 + r() * 1.6, ph: r(), sp: 6 + r() * 6, sw: r() * TAU }));
  const stones = [];
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * TAU + 0.2;
    stones.push([cx + Math.cos(a) * 17, base + 1.5 + Math.sin(a) * 3.2, 2.4 + r() * 1.2, Math.sin(a)]);
  }
  stones.sort((a, b) => a[3] - b[3]);
  const logs = [[cx - 15, base + 2, cx + 6, base - 3, 1.4], [cx + 15, base + 2, cx - 6, base - 3, 1.4], [cx - 9, base + 3, cx + 10, base + 3, 1.2]];
  const capsule = (x0, y0, x1, y1, rad, near) => {
    const minx = Math.floor(Math.min(x0, x1) - rad * 2), maxx = Math.ceil(Math.max(x0, x1) + rad * 2);
    const miny = Math.floor(Math.min(y0, y1) - rad), maxy = Math.ceil(Math.max(y0, y1) + rad);
    const dx = x1 - x0, dy = (y1 - y0) * 2, L2 = dx * dx + dy * dy;
    for (let y = miny; y <= maxy; y++) for (let x = minx; x <= maxx; x++) {
      const px = x - x0, py = (y - y0) * 2;
      const u = clamp((px * dx + py * dy) / L2);
      const ex = px - u * dx, ey = py - u * dy;
      const d = Math.hypot(ex, ey) / (rad * 2);
      if (d < 1) {
        const lit = clamp(0.9 - (ey / (rad * 2)) * 0.5 - d * 0.4 + near);
        const end = u < 0.04 || u > 0.96;
        g.set(x, y, end ? "@" : d > 0.7 ? "▓" : "█", KEYS[LOG + Math.min(5, Math.floor(lit * 6) + (end ? 1 : 0))]);
      }
    }
  };
  return (t) => {
    g.clear();
    const flick = 0.85 + 0.15 * Math.sin(t * 11) * Math.sin(t * 7.3);
    for (let y = 0; y < base - 2; y++) for (let x = 0; x < cols; x++) {
      const d = Math.hypot((x - cx) / 2, (y - base + 6) * 1.1);
      const glow = Math.exp(-d / 13) * flick;
      const n = fbm(x * 0.06, y * 0.12 - t * 0.2, 3, 2);
      const v = clamp(glow * 1.1 + (n - 0.5) * 0.25 + 0.08);
      g.set(x, y, SH[1 + Math.min(3, Math.floor((v + n * 0.3) * 3.5))], KEYS[BG + Math.min(11, Math.floor(v * 12))]);
    }
    for (const [sx, sy, ph] of stars) if (Math.sin(t * 1.3 + ph) > -0.2) g.set(sx, sy, "·", KEYS[STAR]);
    for (let y = base - 2; y < rows; y++) for (let x = 0; x < cols; x++) {
      const d = Math.hypot((x - cx) / 2.6, (y - base) * 1.4);
      const glow = Math.exp(-d / 9) * flick;
      const n = noise2(x * 0.5, y * 0.9, 4);
      const v = clamp(glow + n * 0.25);
      g.set(x, y, n > 0.7 ? "▒" : n > 0.35 ? "▓" : "░", KEYS[GND + Math.min(7, Math.floor(v * 8))]);
    }
    const drawStones = (back) => {
      for (const [sx, sy, sr, side] of stones) {
        if ((side < 0) !== back) continue;
        for (let y = Math.floor(sy - sr * 0.5); y <= sy + sr * 0.5; y++) for (let x = Math.floor(sx - sr); x <= sx + sr; x++) {
          const d = Math.hypot((x - sx) / sr, (y - sy) / (sr * 0.5));
          if (d < 1) {
            const lit = clamp(0.8 - (y - sy + sr * 0.5) / sr * 0.6 + (back ? 0.2 : 0) - d * 0.2);
            g.set(x, y, d > 0.8 ? "▓" : "█", KEYS[STONE + Math.min(5, Math.floor(lit * 6))]);
          }
        }
      }
    };
    drawStones(true);
    for (let y = base - H; y <= base + 1; y++) {
      const hy = (base + 1 - y) / (H + 1);
      const sway = Math.sin(t * 2.1 + y * 0.25) * hy * 3;
      const w = Math.pow(1 - hy, 0.7) * 12 + 1;
      for (let x = Math.floor(cx - 16); x <= cx + 16; x++) {
        const dx = (x - cx - sway) / w;
        if (Math.abs(dx) > 1.4) continue;
        const n = fbm(x * 0.17, y * 0.22 + t * 4.2, 3, 3);
        const I = (1 - dx * dx) * (1.3 - hy * 1.05) + (n - 0.5) * 1.3 - hy * 0.25;
        if (I < 0.1) continue;
        const v = clamp(I);
        g.set(x, y, FR[Math.min(7, 1 + Math.floor(v * 7))], KEYS[FIRE + Math.min(13, Math.floor(v * 14))]);
      }
    }
    for (const L of logs) capsule(L[0], L[1], L[2], L[3], L[4], 0.15 * flick);
    drawStones(false);
    for (const s of sparks) {
      const a = (t / s.life + s.ph) % 1;
      const y = base - 4 - a * s.sp * s.life * 1.4;
      const x = cx + s.x * (1 + a) + Math.sin(t * 3 + s.sw) * a * 4;
      if (y < 0) continue;
      g.set(x, y, a < 0.4 ? "*" : a < 0.75 ? "·" : ".", KEYS[FIRE + Math.max(4, 13 - Math.floor(a * 10))]);
    }
    return g.frame();
  };
}
