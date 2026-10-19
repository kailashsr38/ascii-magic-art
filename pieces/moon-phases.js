/* moon-phases: the moon cycling from new to full and back, the terminator sweeping across its craters. */
import { Grid, palette, gradient, KEYS, fbm, rng, clamp, TAU } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("bg", gradient(["#020308", "#070b1e", "#0e1432", "#161c44"], 6));
add("star", ["#8090d0", "#ffffff"]);
add("moon", gradient(["#2a2a30", "#55555e", "#86868e", "#b4b2b0", "#d8d4cc", "#f2eee4", "#fffdf6"], 12));
add("earthshine", ["#0c1222", "#141c32", "#1e2840"]);
add("text", ["#8b949e", "#e6edf3"]);

export const meta = {
  slug: "moon-phases",
  name: "Moon Phases",
  category: "cosmos",
  note: "The moon waxes from new to full and wanes back again, its terminator sweeping slowly across the craters.",
  tags: ["moon", "lunar", "phases", "night", "wallpaper", "readme"],
  cols: 90, rows: 38, fps: 20,
  palette: palette(all),
};

const K = (n, i) => KEYS[G[n] + i];
const NAMES = ["NEW MOON", "WAXING CRESCENT", "FIRST QUARTER", "WAXING GIBBOUS", "FULL MOON", "WANING GIBBOUS", "LAST QUARTER", "WANING CRESCENT"];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = cols / 2, cy = 16.5, R = 30;
  const r = rng(29);
  const stars = Array.from({ length: 120 }, () => [Math.floor(r() * cols), Math.floor(r() * rows), r() * TAU, r()]);
  const craters = Array.from({ length: 26 }, () => {
    const a = r() * TAU, d = Math.sqrt(r()) * 0.9;
    return [Math.cos(a) * d, Math.sin(a) * d, 0.05 + r() * r() * 0.16];
  });
  // the moon's face never changes, so bake its albedo once
  const W = cols, H = rows;
  const alb = new Float32Array(W * H), nzs = new Float32Array(W * H), nxs = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const nx = (x + 0.5 - cx) / R, ny = ((y + 0.5 - cy) * 2) / R;
    const q = nx * nx + ny * ny;
    const i = x + y * W;
    if (q >= 1) { nzs[i] = -1; continue; }
    const nz = Math.sqrt(1 - q);
    let a = 0.78 - 0.32 * clamp((fbm(nx * 2.2 + 4, ny * 2.2 + 1, 4, 6) - 0.42) * 3);
    for (const [ccx, ccy, cr] of craters) {
      const d = Math.hypot(nx - ccx, ny - ccy) / cr;
      if (d < 0.8) a *= 0.86; else if (d < 1.1) a *= 1.12;
    }
    alb[i] = clamp(a * (0.75 + 0.25 * nz));
    nzs[i] = nz; nxs[i] = nx;
  }
  const PER = 18;
  return (t) => {
    g.clear();
    const ph = ((t / PER) % 1) * TAU;     // 0 new, PI full
    const Lx = Math.sin(ph), Lz = -Math.cos(ph);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const i = x + y * W;
      if (nzs[i] < 0) {
        const dx = x + 0.5 - cx, dy = (y + 0.5 - cy) * 2;
        const glow = Math.exp(-(Math.hypot(dx, dy) - R) / 9) * (0.5 - 0.5 * Math.cos(ph)) * 0.55;
        const v = clamp(fbm(x * 0.04, y * 0.1 + t * 0.01, 3, 4) * 0.7 - 0.12 + glow);
        g.set(x, y, v > 0.45 ? "▒" : "░", K("bg", Math.min(5, Math.floor(v * 6))));
        continue;
      }
      const lum = nxs[i] * Lx + nzs[i] * Lz;
      if (lum > 0) {
        const v = clamp(alb[i] * (0.35 + 0.75 * Math.pow(lum, 0.6)));
        g.set(x, y, v > 0.35 ? "█" : "▓", K("moon", Math.min(11, Math.floor(v * 12))));
      } else {
        const e = alb[i] > 0.6 ? 2 : alb[i] > 0.45 ? 1 : 0;
        g.set(x, y, lum > -0.08 ? "▒" : "░", K("earthshine", e));
      }
    }
    for (const [sx, sy, p, b] of stars) {
      if (g.get(sx, sy) !== "░" || nzs[sx + sy * W] >= 0) continue;
      const tw = 0.5 + 0.5 * Math.sin(t * (1 + b * 2) + p);
      g.set(sx, sy, b > 0.85 && tw > 0.5 ? "+" : tw > 0.35 ? "·" : ".", K("star", b > 0.5 ? 1 : 0));
    }
    const idx = Math.floor(((ph / TAU) * 8 + 0.5)) % 8;
    const lit = Math.round(((1 - Math.cos(ph)) / 2) * 100);
    const label = `${NAMES[idx]}  ·  ${String(lit).padStart(3)}% lit`;
    const lx = Math.floor((cols - label.length) / 2);
    g.text(lx - 2, 35, " ".repeat(label.length + 4));
    g.text(lx, 35, NAMES[idx], K("text", 1));
    g.text(lx + NAMES[idx].length, 35, label.slice(NAMES[idx].length), K("text", 0));
    // eight-step phase track
    for (let k = 0; k < 8; k++) {
      const x = Math.floor(cx - 16 + k * 4.5);
      g.text(x - 1, 33, "   ");
      g.set(x, 33, k === idx ? "●" : "○", K("text", k === idx ? 1 : 0));
    }
    return g.frame();
  };
}
