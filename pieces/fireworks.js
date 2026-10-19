/* fireworks: rockets climbing over a night city and bursting into coloured shells. */
import { Grid, palette, gradient, KEYS, hsl, rng, clamp, TAU } from "../lib/kit.js";

const SKY = gradient(["#050818", "#0e1636", "#1c2a5c", "#34407a"], 8);            // 0-7
const HUESET = [0, 30, 50, 120, 190, 280, 320];
const SHELL = HUESET.flatMap((h) => [hsl(h, 95, 82), hsl(h, 95, 62), hsl(h, 85, 42), hsl(h, 75, 26)]); // 8.. (7x4 = 28)
const CITY = ["#05060b", "#0c0f1a", "#ffd27a", "#ffb04a", "#9fd3ff"];

export const meta = {
  slug: "fireworks",
  name: "Fireworks",
  category: "demoscene",
  note: "Rockets climbing over a night city skyline and bursting into coloured, falling shells.",
  tags: ["fireworks", "celebration", "new year", "night", "hero", "wallpaper"],
  cols: 96, rows: 34, fps: 30,
  palette: palette([...SKY, ...SHELL, ...CITY]),
};

const H = (n, k) => {
  let h = (n * 374761393 + k * 668265263 + 977) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const CK = 8 + 28;
  const r = rng(5);
  // skyline
  const sky = new Int8Array(cols);
  for (let x = 0; x < cols;) {
    const w = 3 + Math.floor(r() * 7), h = 3 + Math.floor(r() * 8);
    for (let i = 0; i < w && x < cols; i++, x++) sky[x] = h;
  }
  const win = Array.from({ length: cols * rows }, () => r());
  const stars = Array.from({ length: 50 }, () => [Math.floor(r() * cols), Math.floor(r() * rows * 0.6), r() * 6]);
  const EVERY = 0.38, RISE = 1.2, FADE = 2.4, G = 7;
  const glow = new Float32Array(cols * rows);
  return (t) => {
    g.clear();
    glow.fill(0);
    const shells = [];
    const i1 = Math.floor(t / EVERY);
    for (let i = i1 - 10; i <= i1; i++) {
      const t0 = i * EVERY;
      const age = t - t0;
      if (age < 0 || age > RISE + FADE) continue;
      const bx = 10 + H(i, 1) * (cols - 20), by = 4 + H(i, 2) * rows * 0.35;
      const hue = Math.floor(H(i, 3) * 7), hue2 = Math.floor(H(i, 7) * 7);
      shells.push({ i, age, bx, by, hue, hue2, sx: bx + (H(i, 4) - 0.5) * 12, n: 60 + Math.floor(H(i, 5) * 30), sp: 10 + H(i, 6) * 8 });
    }
    // light from bursts on the sky
    for (const s of shells) {
      const ba = s.age - RISE;
      if (ba < 0 || ba > 1.2) continue;
      const k = (1 - ba / 1.2) * 1.2;
      for (let y = 0; y < rows; y++) for (let x = Math.max(0, Math.floor(s.bx - 30)); x < Math.min(cols, s.bx + 30); x++) {
        const d = Math.hypot((x - s.bx) / 2, y - s.by);
        glow[x + y * cols] += k * Math.exp(-d / 8);
      }
    }
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = clamp(0.25 + (y / rows) * 0.5 + glow[x + y * cols] * 0.6);
      g.set(x, y, v > 0.55 ? "▒" : "░", KEYS[Math.min(7, Math.floor(v * 8))]);
    }
    for (const [sx, sy, ph] of stars) if (Math.sin(t * 2 + ph) > 0) g.set(sx, sy, "·", KEYS[7]);
    for (const s of shells) {
      if (s.age < RISE) {
        const f = s.age / RISE, e = 1 - (1 - f) * (1 - f);
        const x = s.sx + (s.bx - s.sx) * e, y = rows - 1 + (s.by - rows + 1) * e;
        for (let k = 1; k < 5; k++) {
          const fe = Math.max(0, f - k * 0.04), ee = 1 - (1 - fe) * (1 - fe);
          g.set(s.sx + (s.bx - s.sx) * ee, rows - 1 + (s.by - rows + 1) * ee, k < 2 ? ":" : "·", KEYS[8 + 4 * 1 + 2]);
        }
        g.set(x, y, "▲", KEYS[8 + 4 * 2]);
        continue;
      }
      const a = s.age - RISE;
      const fade = a / FADE;
      for (let p = 0; p < s.n; p++) {
        const th = (p / s.n) * TAU + H(s.i, p + 20) * 0.2;
        const sp = s.sp * (p % 2 ? 0.45 + 0.2 * H(s.i, p + 90) : 0.85 + 0.15 * H(s.i, p + 90));
        const drag = (1 - Math.exp(-2.2 * a)) / 2.2;
        const x = s.bx + Math.cos(th) * sp * drag * 2;
        const y = s.by + Math.sin(th) * sp * drag + 0.5 * G * a * a * 0.6;
        const hue = p % 3 === 0 ? s.hue2 : s.hue;
        const lvl = Math.min(3, Math.floor(fade * 4 + (H(s.i, p) > 0.7 ? 0.5 : 0)));
        const ch = fade < 0.2 ? "●" : fade < 0.45 ? "*" : fade < 0.7 ? "+" : "·";
        if (fade > 0.6 && Math.sin(t * 40 + p) > 0.3) continue;  // crackle as it dies
        // short trail behind each star
        const a2 = Math.max(0, a - 0.12), d2 = (1 - Math.exp(-2.2 * a2)) / 2.2;
        g.set(s.bx + Math.cos(th) * sp * d2 * 2, s.by + Math.sin(th) * sp * d2 + 0.5 * G * a2 * a2 * 0.6, "·", KEYS[8 + hue * 4 + Math.min(3, lvl + 1)]);
        g.set(x, y, ch, KEYS[8 + hue * 4 + lvl]);
      }
    }
    // city skyline with lit windows
    for (let x = 0; x < cols; x++) {
      const h = sky[x];
      for (let k = 0; k < h; k++) {
        const y = rows - 1 - k;
        const lit = (x % 2 === 0) && (k % 2 === 1) && win[x + y * cols] > 0.55 && k < h - 1;
        g.set(x, y, lit ? "▪" : "█", lit ? KEYS[CK + 2 + (win[x + y * cols] > 0.85 ? 2 : win[x + y * cols] > 0.7 ? 1 : 0)] : KEYS[CK + (k === h - 1 ? 1 : 0)]);
      }
    }
    return g.frame();
  };
}
