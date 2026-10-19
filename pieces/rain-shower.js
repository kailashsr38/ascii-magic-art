/* rain-shower: a heavy shower over a dark meadow, streaks slanting and puddles rippling. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const SKY = add(gradient(["#151c28", "#27344a", "#43577a", "#6f86a8", "#9fb2cc"], 14));
const HILL = add(gradient(["#0b1512", "#173026", "#24483a"], 5));
const GND = add(gradient(["#0a1114", "#152229", "#22394a", "#3a5a72"], 8));
const PUD = add(gradient(["#24405e", "#3f6488", "#6e94bc", "#a8c4e0"], 6));
const RAIN = add(gradient(["#5f7ea6", "#9bb8de", "#e6f0ff"], 5));

export const meta = {
  slug: "rain-shower",
  name: "Rain Shower",
  category: "weather",
  note: "A heavy shower slanting over a dark meadow, drops splashing into rippling puddles.",
  tags: ["rain", "weather", "storm", "wallpaper", "hero", "calm"],
  cols: 96, rows: 34, fps: 24,
  palette: palette(P),
};

const SH = " ░▒▓█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const horizon = 21;
  const r = rng(11);
  const puddle = new Float32Array(cols * rows);
  for (let y = horizon; y < rows; y++) for (let x = 0; x < cols; x++) {
    const d = (y - horizon) / (rows - horizon);
    puddle[x + y * cols] = fbm(x * 0.06 / (0.4 + d), y * 0.35, 3, 5);
  }
  const hill = Array.from({ length: cols }, (_, x) => horizon - 1 - Math.floor(fbm(x * 0.04, 2, 3, 9) * 5));
  const drops = Array.from({ length: 300 }, () => {
    const landY = horizon + Math.floor(Math.pow(r(), 0.8) * (rows - horizon));
    const near = (landY - horizon) / (rows - horizon);
    return { x: r() * (cols + 20) - 10, landY, near, ph: r(), period: 0.6 + r() * 0.5 - near * 0.2 };
  });
  return (t) => {
    g.clear();
    for (let y = 0; y < horizon; y++) for (let x = 0; x < cols; x++) {
      const c = fbm(x * 0.03 + t * 0.06, y * 0.14 - t * 0.02, 4, 1);
      const v = clamp(0.15 + (y / horizon) * 0.5 + (c - 0.5) * 1.1);
      g.set(x, y, SH[1 + Math.min(3, Math.floor(v * 4))], KEYS[SKY + Math.min(13, Math.floor(v * 14))]);
    }
    for (let x = 0; x < cols; x++) for (let y = hill[x]; y < horizon; y++) {
      const v = fbm(x * 0.2, y * 0.5, 2, 4);
      g.set(x, y, v > 0.55 ? "▓" : "█", KEYS[HILL + Math.min(4, Math.floor((y - hill[x]) * 0.8 + v * 2))]);
    }
    for (let y = horizon; y < rows; y++) {
      const d = (y - horizon) / (rows - horizon);
      for (let x = 0; x < cols; x++) {
        const p = puddle[x + y * cols];
        if (p > 0.56) {
          const s = noise2(x * 0.5 - t * 1.5, y * 1.3 + t, 3);
          const v = clamp((p - 0.56) * 3 + s * 0.5 + d * 0.15);
          g.set(x, y, s > 0.6 ? "≈" : s > 0.35 ? "~" : "▒", KEYS[PUD + Math.min(5, Math.floor(v * 6))]);
        } else {
          const v = clamp(p * 0.9 + d * 0.3 + noise2(x * 0.7, y * 1.1, 8) * 0.2);
          g.set(x, y, v > 0.62 ? "▓" : v > 0.42 ? "▒" : "░", KEYS[GND + Math.min(7, Math.floor(v * 8))]);
          if (y > horizon + 1 && noise2(x * 1.7, y * 2.1, 6) > 0.8) g.set(x, y, x % 2 ? "," : "'", KEYS[HILL + 4]);
        }
      }
    }
    for (const dr of drops) {
      const f = (t / dr.period + dr.ph) % 1;
      const span = dr.landY + 3;
      const lx = Math.round(dr.x + dr.landY * 0.35);
      if (f < 0.8) {
        const yh = (f / 0.8) * span - 3;
        const len = 1 + Math.floor(dr.near * 3);
        for (let k = 0; k < len; k++) {
          const y = Math.floor(yh - k);
          if (y < 0 || y > dr.landY) continue;
          const x = Math.round(dr.x + y * 0.35);
          g.set(x, y, dr.near > 0.4 ? "\\" : k ? "'" : "\\", KEYS[RAIN + Math.min(4, 1 + Math.floor(dr.near * 3) - (k ? 1 : 0))]);
        }
      } else {
        const a = (f - 0.8) / 0.2;
        const wet = puddle[Math.max(0, Math.min(cols - 1, lx)) + dr.landY * cols] > 0.56;
        const key = KEYS[RAIN + (a < 0.5 ? 4 : 2)];
        if (wet) {
          const rr = Math.round(a * (1 + dr.near * 3));
          if (rr === 0) g.set(lx, dr.landY, "o", key);
          else { g.set(lx - rr, dr.landY, "(", key); g.set(lx + rr, dr.landY, ")", key); }
        } else if (a < 0.6) {
          g.set(lx - 1, dr.landY - 1, "'", key); g.set(lx + 1, dr.landY - 1, "'", key); g.set(lx, dr.landY, ".", key);
        }
      }
    }
    return g.frame();
  };
}
