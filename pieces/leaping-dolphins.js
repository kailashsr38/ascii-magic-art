/* leaping-dolphins: a pod of dolphins arcing out of a sunset sea and splashing back in. */
import { Grid, palette, gradient, KEYS, fbm, noise2, clamp, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const SKY = add(gradient(["#2a1a4a", "#5a2a6a", "#a8406a", "#e86a5a", "#ffa85a", "#ffd88a"], 12));
const SUN = add(["#fff4c4", "#ffe08a"]);
const CLOUD = add(["#7a3a6a", "#c86a7a", "#f4a08a"]);
const SEA = add(gradient(["#06142e", "#0c2448", "#163a66", "#2a5a8a", "#5a7aa0"], 10));
const GLOW = add(["#ffb46a", "#ffd890", "#e8805a"]);
const DOL = add(gradient(["#0a1018", "#16202c", "#26343e", "#4a5a68", "#8a98a4", "#c8d0d8"], 8));
const FOAM = add(["#a4c4e4", "#ffffff"]);

export const meta = {
  slug: "leaping-dolphins",
  name: "Leaping Dolphins",
  category: "animals",
  note: "A pod of dolphins arcs out of a sunset sea one after another, flukes flicking, and splashes back under the rolling waves.",
  tags: ["dolphins", "ocean", "sunset", "sea", "animals", "hero"],
  cols: 96, rows: 32, fps: 24,
  palette: palette(P),
};

const HZ = 18;
const POD = [
  { x0: 8, span: 34, h: 13, per: 4.6, off: 0, L: 19 },
  { x0: 34, span: 30, h: 11, per: 4.6, off: 1.1, L: 16 },
  { x0: 58, span: 30, h: 12, per: 4.6, off: 2.4, L: 17 },
];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const surf = (x, t) => HZ + 9 + Math.sin(x * 0.18 - t * 1.6) * 0.5 + Math.sin(x * 0.07 + t * 0.9) * 0.4;
  return (t) => {
    g.clear();
    const sx = 70, sy = 11;
    for (let y = 0; y < HZ; y++) for (let x = 0; x < cols; x++) {
      const d = Math.hypot((x - sx) / 2, y - sy);
      const v = clamp(y / HZ + Math.exp(-d / 10) * 0.25);
      let ch = "█", co = KEYS[SKY + Math.min(11, Math.floor(v * 12))];
      if (d < 4.2) { ch = "█"; co = KEYS[SUN + (d > 3.2 ? 1 : 0)]; }
      const c = fbm((x + t * 1.2) * 0.04, y * 0.25, 3, 4);
      if (c > 0.6 && y < 11 && d > 4.5) { ch = c > 0.68 ? "█" : "▓"; co = KEYS[CLOUD + Math.min(2, Math.floor((y / 11) * 2.5 + (c - 0.6) * 4))]; }
      g.set(x, y, ch, co);
    }
    for (let y = HZ; y < rows; y++) for (let x = 0; x < cols; x++) {
      const k = (y - HZ) / (rows - HZ);
      const w = Math.sin(x * (0.25 - k * 0.12) + y * 1.7 - t * (1 + k)) + noise2(x * 0.15 + t * 0.3, y * 0.6, 2) - 0.5;
      const path = Math.abs(x - sx) < 3 + k * 10 && w > 0.3;
      g.set(x, y, w > 0.6 ? "▀" : w > 0 ? "▓" : "█", path ? KEYS[GLOW + (w > 0.8 ? 1 : 0)] : KEYS[SEA + Math.min(9, Math.floor((1 - k) * 6 + (w > 0.6 ? 3 : 0)))]);
    }
    for (const d of POD) {
      const p = (((t + d.off) % d.per) + d.per) % d.per / d.per;
      const u = p * 1.5 - 0.25;
      const x = d.x0 + u * d.span;
      const base = surf(x, t);
      const y = base + 1.5 - Math.sin(Math.PI * u) * d.h;
      const vx = d.span, vy = -Math.cos(Math.PI * u) * Math.PI * d.h * 2;
      const l = Math.hypot(vx, vy); const tx = vx / l, ty = vy / l;
      const nx = ty, ny = -tx;
      for (let s = -d.L / 2; s <= d.L / 2; s += 0.5) {
        const q = (s + d.L / 2) / d.L;
        const w = q > 0.92 ? 0.4 : 2.6 * Math.sin(Math.PI * Math.min(1, 0.12 + q * 0.95)) ** 0.8;
        const cx = x + tx * s, cy = y * 2 + ty * s;
        for (let o = -w; o <= w; o += 0.5) {
          const px = cx + nx * o, py = (cy + ny * o) / 2;
          if (py >= surf(px, t) - 0.3) continue;
          const top = o < -w * 0.15;
          g.set(px, py, "█", KEYS[DOL + (top ? 1 + Math.floor(q * 2) : o > w * 0.5 ? 5 : 3)]);
        }
        if (Math.abs(s - 0.5) < 0.3) for (let f = 1; f <= 3; f++) { const px = cx + nx * -(w + f * 0.9) - tx * f * 0.8, py = (cy + ny * -(w + f * 0.9) - ty * f * 0.8) / 2; if (py < surf(px, t) - 0.3) g.set(px, py, "█", KEYS[DOL]); }
      }
      const ex = x + tx * (d.L / 2 - 3) + nx * -0.6, ey = (y * 2 + ty * (d.L / 2 - 3) + ny * -0.6) / 2;
      if (ey < surf(ex, t) - 0.3) g.set(ex, ey, "●", KEYS[DOL]);
      const bx = x - tx * d.L / 2, by = y * 2 - ty * d.L / 2;
      for (const sg of [-1, 1]) for (let f = 0; f <= 3; f++) { const px = bx + nx * sg * f * 0.9 - tx * f * 0.4, py = (by + ny * sg * f * 0.9 - ty * f * 0.4) / 2; if (py < surf(px, t) - 0.3) g.set(px, py, "█", KEYS[DOL + 1]); }
      // splash where the dolphin breaks the surface
      for (const [ux, age] of [[d.x0, p * 1.5 - 0.0], [d.x0 + d.span, p * 1.5 - 1.0]]) {
        if (age < 0 || age > 0.35) continue;
        const a = age / 0.35;
        for (let k = 0; k < 10; k++) {
          const ang = Math.PI * (0.15 + 0.7 * (k / 9));
          const r = 1 + a * 6;
          const px = ux + Math.cos(ang) * r * 1.4, py = surf(ux, t) - Math.sin(ang) * r * 0.6 * (1 - a * 0.6);
          g.set(px, py, a < 0.5 ? "█" : a < 0.8 ? "▒" : "·", KEYS[FOAM + (k % 2)]);
        }
        g.text(ux - 4, surf(ux, t), "▀▀▀▀▀▀▀▀", KEYS[FOAM]);
      }
    }
    return g.frame();
  };
}
