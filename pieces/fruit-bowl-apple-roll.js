/* fruit-bowl-apple-roll: a heaped fruit bowl on a sunny table; an apple is set on top, wobbles, tumbles off and rolls away. */
import { Grid, palette, gradient, KEYS, fbm, noise2, clamp, smooth, lerp } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const WALL = add(gradient(["#3a4a2a", "#56683a", "#748a4c", "#94aa62", "#b8c880"], 6));
const TABLE = add(gradient(["#4a2a12", "#7a4a22", "#a8703a", "#cc9a5a"], 5));
const BOWL = add(gradient(["#1a3a6a", "#2a5aa0", "#4a84d0", "#8ab8f0", "#d4ecff"], 6));
const APPLE = add(["#5a0a0a", "#a01414", "#d42a20", "#ff6a4a", "#ffd0c0"]);
const ORANGE = add(["#a84a08", "#e07a10", "#ffa830", "#ffd27a"]);
const BANANA = add(["#a8840a", "#e8c420", "#fff070", "#5a4010"]);
const GRAPE = add(["#2a0a3a", "#5a1a6a", "#8a3aa0", "#c48ad8"]);
const PEAR = add(["#6a8a14", "#a8c430", "#dcec7a"]);
const STEM = add(["#3a2410", "#4a8a2a"]);
const SUN = add(["#fff4c8", "#ffe8a0"]);

export const meta = {
  slug: "fruit-bowl-apple-roll",
  name: "Fruit Bowl Apple Roll",
  category: "food",
  note: "A heaped blue fruit bowl of oranges, bananas, grapes and a pear on a sunny table; an apple is set on top, wobbles, tumbles off and rolls away.",
  tags: ["fruit", "still life", "kitchen", "healthy", "food", "cute"],
  cols: 78, rows: 34, fps: 24,
  palette: palette(P),
};

const PER = 9;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = 30, rimY = 19, bowlBot = 27, tableY = 27;
  const ball = (x0, y0, r, base, n, lx = -0.4, ly = -0.5) => {
    for (let y = Math.floor(y0 - r / 2 - 1); y <= y0 + r / 2 + 1; y++) for (let x = Math.floor(x0 - r - 1); x <= x0 + r + 1; x++) {
      const dx = (x - x0) / r, dy = (y - y0) / (r / 2);
      const d = dx * dx + dy * dy;
      if (d > 1) continue;
      const nz = Math.sqrt(1 - d);
      const lit = clamp(nz * 0.55 - dx * lx * 0.5 - dy * ly * 0.5 + 0.1);
      g.set(x, y, "█", KEYS[base + Math.min(n - 1, Math.floor(lit * n))]);
    }
  };
  return (t) => {
    const p = ((t % PER) + PER) % PER;
    // olive wall with a patch of window sun, wooden table
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      if (y < tableY - 6) {
        const sun = x > 44 && x < 70 && y > 2 && y < 18 && (x - 44) % 9 !== 0 && (y - 2) % 6 !== 0;
        const v = clamp(0.3 + fbm(x * 0.05, y * 0.1, 2) * 0.35 + (sun ? 0.35 : 0));
        g.set(x, y, sun ? "▓" : "▒", KEYS[sun ? SUN + ((x + y) % 2) : WALL + Math.min(5, Math.floor(v * 6))]);
      } else {
        const v = clamp(0.35 + fbm(x * 0.03, y * 1.1, 2) * 0.55 - (y - tableY + 6) * 0.03);
        g.set(x, y, y === tableY - 6 ? "▄" : "█", KEYS[TABLE + Math.min(4, Math.floor(v * 5))]);
      }
    }
    // fruit heaped above the rim (behind the bowl front)
    ball(cx + 9, 16, 5, ORANGE, 4);
    ball(cx - 9, 16.5, 5, ORANGE, 4);
    // grapes
    for (let i = 0; i < 14; i++) {
      const gx = cx + 14 + (i % 4) * 2 - Math.floor(i / 4), gy = 13 + Math.floor(i / 4);
      g.set(gx, gy, "█", KEYS[GRAPE + (i % 3 === 0 ? 3 : i % 2 ? 2 : 1)]); g.set(gx + 1, gy, "█", KEYS[GRAPE + 1]);
    }
    g.set(cx + 18, 12, "▄", KEYS[STEM + 1]);
    ball(cx - 2, 15, 6, ORANGE, 4);
    // pear leaning on the left
    for (let y = 9; y <= 18; y++) {
      const f = (y - 9) / 9;
      const w = f < 0.35 ? 1.5 + f * 4 : 3 + Math.sin((f - 0.35) / 0.65 * Math.PI * 0.8) * 2.4;
      for (let x = Math.floor(cx - 16 - w); x <= cx - 16 + w; x++) g.set(x, y, "█", KEYS[PEAR + (x < cx - 16 - w / 3 ? 2 : x < cx - 16 + w / 2 ? 1 : 0)]);
    }
    g.set(cx - 16, 8, "▌", KEYS[STEM]);
    // banana curve across the front of the heap
    for (let i = 0; i <= 30; i++) {
      const f = i / 30, x = cx - 14 + f * 28, y = 18 - Math.sin(f * Math.PI) * 2.2;
      const th = Math.sin(f * Math.PI) * 1.4 + 0.4;
      for (let k = 0; k <= th; k++) g.set(Math.round(x), Math.round(y) + k, "█", KEYS[BANANA + (k === 0 ? 2 : 1)]);
    }
    g.set(cx - 15, 18, "█", KEYS[BANANA + 3]); g.set(cx + 15, 18, "█", KEYS[BANANA + 3]);
    // bowl
    for (let y = rimY - 1; y <= bowlBot; y++) {
      const f = (y - rimY + 1) / (bowlBot - rimY + 1);
      const w = 22 * Math.sqrt(Math.max(0, 1 - f * f * 0.8));
      for (let x = Math.floor(cx - w); x <= Math.ceil(cx + w); x++) {
        const u = (x - cx) / w;
        if (Math.abs(u) > 1) continue;
        let lit = clamp(Math.sqrt(1 - u * u) * 0.5 + 0.3 - u * 0.3 - f * 0.2);
        if (y === rimY - 1) lit = 0.95;
        if (y === rimY + 2 && (x % 4 < 2)) lit = 0.85;
        g.set(x, y, "█", KEYS[BOWL + Math.min(5, Math.floor(lit * 6))]);
      }
    }
    // the apple: dropped onto the heap, wobbles, tumbles off and rolls away
    let ax, ay, spin;
    if (p < 0.6) { const f = p / 0.6; ax = cx + 4; ay = lerp(-4, 9, f * f); spin = 0; }
    else if (p < 2.6) { const w = Math.sin((p - 0.6) * 9) * Math.exp(-(p - 0.6) * 0.4) * 0.8 + (p - 0.6) * 0.5; ax = cx + 4 + w; ay = 9; spin = w * 0.4; }
    else if (p < 3.4) { const f = (p - 2.6) / 0.8; ax = lerp(cx + 5, cx + 26, f); ay = 9 + (f * f) * (tableY - 9 - 3.5) - Math.sin(f * Math.PI) * 2; spin = f * 3; }
    else { const f = clamp((p - 3.4) / 5.6); const d = 1 - (1 - f) * (1 - f); ax = cx + 26 + d * 32; ay = tableY - 3.5 + (f < 0.1 ? -Math.sin(f / 0.1 * Math.PI) * 1.2 : 0); spin = 3 + d * 9; }
    // shadow on the table
    if (ay > tableY - 6) for (let x = Math.round(ax) - 4; x <= Math.round(ax) + 4; x++) g.set(x, tableY - 1, "█", KEYS[TABLE]);
    ball(ax, ay, 4.5, APPLE, 5, -0.5, -0.6);
    // stem and leaf turn with the roll
    const sxp = Math.round(ax + Math.sin(spin) * 3), syp = Math.round(ay - Math.cos(spin) * 2.2);
    if (Math.cos(spin) > -0.3) {
      g.set(sxp, syp, "█", KEYS[STEM]);
      g.set(sxp + (Math.cos(spin) > 0 ? 1 : -1), syp - (Math.cos(spin) > 0.5 ? 1 : 0), "▀", KEYS[STEM + 1]);
    }
    return g.frame();
  };
}
