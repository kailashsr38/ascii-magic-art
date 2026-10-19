/* holi-colors: clouds of coloured powder bursting over a dancing crowd. */
import { Grid, palette, gradient, KEYS, fbm, clamp, fract, rng } from "../lib/kit.js";

const BG = gradient(["#fff1dc", "#ffd9c2", "#ffc2c8", "#f7b0d6"], 8);             // 0..7
const HUES = ["#ff1f8e", "#ffd400", "#19c46a", "#1e88ff", "#ff6a00", "#9b3df0"];
const HK = [];
for (const h of HUES) HK.push(...gradient(["#ffe8f0", h], 6).slice(1));       // 6 hues x 5 levels: 8..37
const pal = palette([...BG, ...HK, "#2a1530", "#140a18", "#3e2440", "#fdf6ec", "#d9cfc4"]); // 38 dark, 39 hair, 40 silhouette, 41 white, 42 white shade

export const meta = {
  slug: "holi-colors",
  name: "Holi Colours",
  category: "occasions",
  note: "Clouds of pink, yellow, green, blue, orange and violet powder burst and drift over a dancing crowd in white.",
  tags: ["holi", "festival", "colour", "spring", "hero", "wallpaper"],
  cols: 96, rows: 34, fps: 20,
  palette: pal,
};

const SH = " ░▒▓█";
const hk = (h, lv) => KEYS[8 + h * 5 + Math.max(0, Math.min(4, lv))];
const hash = (n) => fract(Math.sin(n * 12.9898 + 4.1) * 43758.5453);

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const P = 6, NB = 9;
  const r = rng(5);
  const people = [];
  for (let x = 5; x < cols - 3; x += 10 + Math.floor(r() * 3)) people.push({ x, h: 25 + Math.floor(r() * 3), ph: r() * 6.28, sp: 2 + r() * 2, c1: Math.floor(r() * 6), c2: Math.floor(r() * 6) });
  const dirs = Array.from({ length: 14 }, (_, i) => [Math.cos(i / 14 * 6.283), Math.sin(i / 14 * 6.283), 0.6 + r() * 0.8]);
  return (t) => {
    g.clear();
    // warm sky
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const n = fbm(x * 0.04 + t * 0.05, y * 0.1, 2);
      const v = clamp(y / rows * 0.8 + (n - 0.5) * 0.5);
      g.set(x, y, n > 0.58 ? "▓" : "█", KEYS[Math.min(7, Math.floor(v * 8))]);
    }
    // powder bursts
    const bursts = [];
    for (let i = 0; i < NB; i++) {
      const tt = t + i * (P / NB);
      const n = Math.floor(tt / P), a = tt - n * P;
      const s = n * 7 + i;
      bursts.push({
        cx: 10 + hash(s) * (cols - 20), cy: 8 + hash(s + 0.5) * 12 - a * 1.2, a, h: (i + n) % 6,
        rad: 4 + 18 * (1 - Math.exp(-a * 1.3)),
        fade: clamp(a / 0.25) * (1 - clamp((a - 2.6) / 2.6)), seed: s % 50,
      });
    }
    const best = new Float32Array(cols * rows), bh = new Int8Array(cols * rows).fill(-1);
    for (const b of bursts) {
      if (b.fade <= 0) continue;
      const x0 = Math.max(0, Math.floor(b.cx - b.rad * 1.4)), x1 = Math.min(cols - 1, Math.ceil(b.cx + b.rad * 1.4));
      const y0 = Math.max(0, Math.floor(b.cy - b.rad * 0.75)), y1 = Math.min(rows - 1, Math.ceil(b.cy + b.rad * 0.75));
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const d = Math.hypot((x - b.cx) / 1.2, (y - b.cy) * 2) / b.rad;
        if (d > 1.35) continue;
        const n = fbm(x * 0.13 + b.seed, y * 0.26 - b.a * 0.4, 2);
        const v = ((1 - d) * 1.3 + (n - 0.5) * 1.4) * b.fade;
        const i = x + y * cols;
        if (v > best[i]) { best[i] = v; bh[i] = b.h; }
      }
    }
    for (let i = 0; i < cols * rows; i++) {
      const v = best[i];
      if (v < 0.08) continue;
      g.set(i % cols, Math.floor(i / cols), SH[1 + Math.min(3, Math.floor(v * 3.2))], hk(bh[i], Math.floor(v * 5)));
    }
    // flying specks
    for (const b of bursts) {
      if (b.fade <= 0.1) continue;
      for (const [dx, dy, sp] of dirs) {
        const d = (b.rad + 2) * sp * 1.15;
        g.set(b.cx + dx * d * 1.2, b.cy + dy * d * 0.5 + b.a * 0.8, b.a < 1.5 ? "•" : "·", hk(b.h, 4));
      }
    }
    // the crowd, seen from behind, arms up, splashed with colour
    for (const p of people) {
      const bob = Math.sin(t * p.sp + p.ph) > 0 ? 0 : 1;
      const hy = p.h + bob;
      const wave = Math.sin(t * p.sp * 1.3 + p.ph);
      const lx = p.x - 4 - (wave > 0 ? 1 : 0), rx = p.x + 4 + (wave < 0 ? 1 : 0);
      g.line(p.x - 3, hy + 2, lx, hy - 3, "█", KEYS[40]);
      g.line(p.x + 3, hy + 2, rx, hy - 3, "█", KEYS[40]);
      g.set(lx, hy - 4, "●", hk(p.c1, 4));
      g.set(rx, hy - 4, "●", hk(p.c2, 4));
      g.text(p.x - 1, hy - 2, "▄█▄", KEYS[39]);
      g.text(p.x - 2, hy - 1, "█████", KEYS[39]);
      g.text(p.x - 1, hy, "▀█▀", KEYS[39]);
      for (let y = hy + 1; y < rows; y++) for (let x = p.x - 3; x <= p.x + 3; x++) {
        if (y === hy + 1 && (x === p.x - 3 || x === p.x + 3)) { g.set(x, y, "▄", KEYS[40]); continue; }
        if (y > hy + 3 && (x === p.x - 3 || x === p.x + 3)) continue;
        const n = fbm(x * 0.5 + p.ph * 3, y * 0.8, 2);
        const splash = n > 0.6 ? hk(p.c1, 3) : n < 0.3 ? hk(p.c2, 3) : null;
        g.set(x, y, splash ? "▓" : "█", splash || KEYS[40]);
      }
    }
    return g.frame();
  };
}
