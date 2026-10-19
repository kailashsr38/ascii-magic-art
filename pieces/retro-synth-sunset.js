/* retro-synth-sunset: a striped retro sun sinking behind neon mountains over a scrolling perspective grid. */
import { Grid, palette, gradient, KEYS, fbm, rng, clamp } from "../lib/kit.js";

const P = [];
const add = (a) => { const o = P.length; P.push(...a); return o; };
const SKY = add(gradient(["#0a0420", "#1e0a44", "#4a0e6a", "#8a1a7a", "#d0307a", "#ff6a6a"], 14));
const SUN = add(gradient(["#ffe85a", "#ffb03a", "#ff6a4a", "#ff2a7a", "#d0108a"], 10));
const MTN = add(["#0e0420", "#1a0834", "#2a0c4a", "#ff4ad0", "#4af0ff"]);
const FLOOR = add(gradient(["#0c0220", "#1c0638", "#2c0a50", "#3a0e60"], 4));
const GRID = add(gradient(["#6a1a8a", "#c02ad0", "#ff4af0", "#ffb0ff"], 5));
const CYAN = add(["#2ab8e0", "#8af6ff"]);
const STAR = add(["#ffd0ff", "#ffffff"]);

export const meta = {
  slug: "retro-synth-sunset",
  name: "Retro Synth Sunset",
  category: "landscapes",
  note: "A striped retro sun sinks behind neon wireframe mountains while a perspective grid scrolls toward you.",
  tags: ["retro", "synthwave", "80s", "neon", "wallpaper", "hero"],
  cols: 100, rows: 36, fps: 24,
  palette: palette(P),
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(80);
  const hz = 21, vx = 50, sx = 50, sy = 13, sr = 11;
  const stars = Array.from({ length: 45 }, () => [Math.floor(r() * cols), Math.floor(r() * 12), r() * 6.28]);
  const mtn = Array.from({ length: cols }, (_, x) => {
    const d = Math.abs(x - vx);
    const ridge = fbm(x * 0.07, 2, 3, 6) * 9 + (d > 18 ? (d - 18) * 0.12 : 0);
    return Math.round(hz - Math.max(0, ridge - (d < 20 ? (20 - d) * 0.45 : 0)));
  });
  return (t) => {
    g.clear();
    // twilight sky with a soft haze toward the horizon
    for (let y = 0; y < hz; y++) for (let x = 0; x < cols; x++) {
      const n = fbm(x * 0.04 + t * 0.02, y * 0.2, 2, 3);
      const v = clamp((y / hz) ** 1.3 + (n - 0.5) * 0.15);
      g.set(x, y, v > 0.6 ? "▓" : v > 0.3 ? "▒" : "░", KEYS[SKY + clamp(Math.floor(v * 14), 0, 13)]);
    }
    for (const [x, y, ph] of stars) if (Math.sin(t * 2 + ph) > -0.2) g.set(x, y, Math.sin(t * 2 + ph) > 0.8 ? "+" : "·", KEYS[STAR + (Math.sin(t * 2 + ph) > 0.8 ? 1 : 0)]);
    // the striped sun: bars widen toward its base and scroll downward
    for (let y = sy - sr; y < hz; y++) for (let x = sx - sr * 2; x <= sx + sr * 2; x++) {
      const d = Math.hypot((x - sx) / 2, (y - sy) * 1.0) / sr;
      if (d > 1) {
        if (d < 1.25) { const gl = (1.25 - d) * 4; if (gl > 0.3) g.set(x, y, "░", KEYS[SUN + 3]); }
        continue;
      }
      const u = (y - (sy - sr)) / (sr * 2);
      if (u > 0.3) {
        const phase = (y + t * 1.2) % 3.2;
        const gap = (u - 0.3) * 4.2;
        if (phase < gap) continue;
      }
      g.set(x, y, d > 0.95 ? "▓" : "█", KEYS[SUN + clamp(Math.floor(u * 10), 0, 9)]);
    }
    // neon wireframe mountains
    for (let x = 0; x < cols; x++) {
      for (let y = mtn[x]; y < hz; y++) {
        const wire = Math.abs(((x * 0.25 + (hz - y) * (x < vx ? 0.5 : -0.5)) % 2)) < 0.25;
        g.set(x, y, wire ? "·" : "█", KEYS[MTN + (wire ? 4 : (y - mtn[x] < 2 ? 2 : 1))]);
      }
      const a = mtn[Math.max(0, x - 1)], b = mtn[x];
      g.set(x, b, a < b ? "\\" : a > b ? "/" : "_", KEYS[MTN + 3]);
    }
    // the floor grid scrolling toward the viewer
    const speed = 1.6;
    for (let y = hz; y < rows; y++) {
      const dy = y - hz + 0.5;
      const z = 18 / dy;
      const zf = ((z + t * speed) % 1 + 1) % 1;
      const hline = zf < 0.06 * (1 + dy * 0.2);
      const near = (y - hz) / (rows - hz);
      for (let x = 0; x < cols; x++) {
        const X = (x - vx) / dy;
        const xf = ((X * 0.9 + 0.5) % 1 + 1) % 1;
        const vw = 0.45 / dy;
        const vline = xf < vw || xf > 1 - vw;
        const glow = Math.exp(-(y - hz) * 0.35);
        const sheen = Math.exp(-(((x - vx) / 14) ** 2)) * glow;
        if (hline && vline) g.set(x, y, "┼", KEYS[GRID + 4]);
        else if (hline) g.set(x, y, "─", KEYS[GRID + clamp(Math.floor(2 + near * 3), 0, 4)]);
        else if (vline) g.set(x, y, Math.abs(x - vx) < 2 ? "│" : (x < vx ? "/" : "\\"), KEYS[GRID + clamp(Math.floor(1 + near * 3), 0, 4)]);
        else g.set(x, y, sheen > 0.35 ? "▒" : "▓", sheen > 0.35 ? KEYS[SUN + 4] : KEYS[FLOOR + clamp(Math.floor(glow * 3 + near * 1.5), 0, 3)]);
      }
    }
    for (let x = 0; x < cols; x++) g.set(x, hz, "▀", KEYS[CYAN + (Math.abs(x - vx) < 30 ? 1 : 0)]);
    return g.frame();
  };
}
