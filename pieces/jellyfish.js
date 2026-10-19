/* jellyfish: glowing jellyfish pulsing upward through the deep, long tentacles trailing behind. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const DEEP = add(gradient(["#01030c", "#030a1e", "#061634", "#0c2450", "#16366a"], 12));
const PINK = add(gradient(["#5a1a5a", "#8a2a7a", "#c04aa0", "#ea7ac4", "#ffb4e4", "#fff0fa"], 10));
const CYAN = add(gradient(["#103a5a", "#1a6a8a", "#2aa0b4", "#5ad0d4", "#a4f0ec", "#f0fffc"], 10));
const AMBER = add(gradient(["#5a2a10", "#9a4a18", "#d47a2a", "#f4aa4a", "#ffd890", "#fff6dc"], 10));
const SNOW = add(["#4a6a8a", "#8aa8c4"]);

export const meta = {
  slug: "jellyfish",
  name: "Jellyfish",
  category: "animals",
  note: "Glowing jellyfish pulse slowly upward through the deep blue, their long tentacles trailing and swaying behind them.",
  tags: ["jellyfish", "ocean", "underwater", "glow", "calm", "wallpaper"],
  cols: 84, rows: 38, fps: 24,
  palette: palette(P),
};

const SH = " ░▒▓█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(61);
  const snow = Array.from({ length: 80 }, () => [r() * cols, r() * rows, 0.3 + r() * 0.8, r() * TAU]);
  const jellies = [
    { x: 40, S: 9, ph: 0.0, sp: 1.3, off: 10, pal: PINK, n: 9 },
    { x: 16, S: 6, ph: 0.4, sp: 1.0, off: 35, pal: CYAN, n: 7 },
    { x: 68, S: 6.5, ph: 0.7, sp: 1.15, off: 52, pal: AMBER, n: 7 },
  ];
  const span = rows + 40;
  return (t) => {
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const ray = Math.max(0, Math.sin((x - y * 0.5) * 0.12 + t * 0.15)) ** 6 * (1 - y / rows) * 0.25;
      const n = fbm(x * 0.04, y * 0.08 + t * 0.05, 3, 3);
      const v = clamp(0.75 - (y / rows) * 0.55 + ray + (n - 0.5) * 0.3);
      g.set(x, y, SH[1 + Math.min(3, Math.floor((v + n * 0.3) * 3.2))], KEYS[DEEP + Math.min(11, Math.floor(v * 12))]);
    }
    for (const [sx, sy, sp, ph] of snow) {
      const y = (sy + t * sp) % rows;
      g.set(sx + Math.sin(t * 0.5 + ph) * 1.5, y, "·", KEYS[SNOW + (sp > 0.8 ? 1 : 0)]);
    }
    for (const j of jellies) {
      const p = (t * 0.55 + j.ph) % 1;
      const c = p < 0.25 ? Math.sin((p / 0.25) * Math.PI / 2) : 1 - (p - 0.25) / 0.75;
      const travel = (t * j.sp * 1.6 + j.off) % span;
      const by = rows + 14 - travel - c * 0.8;
      const bx = j.x + Math.sin(t * 0.3 + j.ph * 9) * 4;
      const W = j.S * (1 - 0.22 * c), H = j.S * 0.85 * (1 + 0.18 * c);
      for (let i = 0; i < j.n; i++) {
        const rimx = bx + ((i / (j.n - 1)) * 2 - 1) * W * 1.7;
        const len = j.S * 2.2 + (i % 3) * 3;
        let prev = rimx;
        for (let k = 1; k <= len; k++) {
          const lag = k * 0.18;
          const x = rimx + Math.sin(k * 0.32 - t * 2.4 + i * 1.3) * k * 0.12 * (1 + 0.5 * Math.sin(t * 0.7 + i)) + (rimx - bx) * (k / len) * -0.25 * (1 - c * 0.5);
          const y = by + k;
          const dx = x - prev; prev = x;
          const ch = dx > 0.25 ? "\\" : dx < -0.25 ? "/" : k % 4 === 0 ? ":" : "|";
          g.set(x, y, ch, KEYS[j.pal + Math.max(1, 4 - Math.floor(k / len * 4))]);
        }
      }
      for (let a = 0; a < 4; a++) {
        const ox = bx + (a - 1.5) * W * 0.35;
        for (let k = 1; k < j.S * 1.4; k++) {
          const x = ox + Math.sin(k * 0.5 - t * 2 + a) * (1 + k * 0.08);
          g.set(x, by + k, k % 2 ? "▓" : "▒", KEYS[j.pal + 3 + (k < 3 ? 1 : 0)]);
        }
      }
      for (let y = Math.floor(by - H); y <= by + 0.5; y++) for (let x = Math.floor(bx - W * 2); x <= bx + W * 2; x++) {
        const dx = (x - bx) / (W * 2), dy = (y - by) / H;
        const d = Math.hypot(dx, dy);
        if (d > 1 || dy > 0.15) continue;
        const rim = d > 0.82 || dy > -0.12;
        const inner = Math.hypot(dx * 1.6, (dy + 0.45) * 1.6) < 0.5;
        const v = clamp(rim ? 0.9 : inner ? 0.75 : 0.35 + (1 - d) * 0.3 + noise2(x * 0.5, y * 0.8 + t, 4) * 0.2);
        const ch = rim ? (dy > -0.12 ? "▀" : "█") : inner ? "▓" : "▒";
        g.set(x, y, ch, KEYS[j.pal + Math.min(9, Math.floor(v * 10))]);
      }
    }
    return g.frame();
  };
}
