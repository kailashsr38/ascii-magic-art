/* fireflies: a dusk meadow below a treeline, dozens of fireflies drifting and blinking. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const SKY = add(gradient(["#0c0c2e", "#24184a", "#4c2a62", "#8a3e66", "#d06a52", "#f0a85a"], 14));
const TREE = add(gradient(["#030606", "#071210", "#0d1c16"], 3));
const MEAD = add(gradient(["#050c08", "#0a1a10", "#123018", "#1e4622", "#2e5e2a"], 10));
const GLOW = add(gradient(["#3a5a1a", "#7a9a20", "#c8e040", "#f4ff9a", "#ffffe0"], 5));
const STAR = add(["#e6e0ff"]);

export const meta = {
  slug: "fireflies",
  name: "Firefly Meadow",
  category: "weather",
  note: "Fireflies drift and blink over a dusk meadow beneath a dark treeline and a fading sunset.",
  tags: ["fireflies", "dusk", "summer", "night", "calm", "wallpaper"],
  cols: 96, rows: 34, fps: 20,
  palette: palette(P),
};

const SH = " ░▒▓█";
const GR = "\"',|/\\";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(77);
  const treeTop = Array.from({ length: cols }, (_, x) => 9 + Math.floor(fbm(x * 0.09, 3, 4, 8) * 7 - Math.max(0, Math.sin(x * 0.21) * 2)));
  const meadow = 17;
  const stars = Array.from({ length: 30 }, () => [Math.floor(r() * cols), Math.floor(r() * 7), r() * TAU]);
  const flies = Array.from({ length: 48 }, () => ({ x: r() * cols, y: meadow - 6 + r() * (rows - meadow + 5), ph: r() * TAU, sp: 0.6 + r() * 0.9, ax: 3 + r() * 6, ay: 1 + r() * 2, bl: 1.2 + r() * 1.6, bp: r() * TAU }));
  return (t) => {
    g.clear();
    for (let y = 0; y < meadow + 2; y++) for (let x = 0; x < cols; x++) {
      const c = fbm(x * 0.03 + t * 0.02, y * 0.2, 3, 1);
      const v = clamp((y / (meadow + 2)) * 0.9 + (c - 0.5) * 0.35);
      g.set(x, y, SH[1 + Math.min(3, Math.floor(c * 3.5 + 0.5))], KEYS[SKY + Math.min(13, Math.floor(v * 14))]);
    }
    for (const [sx, sy, ph] of stars) if (Math.sin(t * 1.1 + ph) > 0) g.set(sx, sy, "·", KEYS[STAR]);
    for (let x = 0; x < cols; x++) for (let y = treeTop[x]; y < meadow + 2; y++) {
      const n = noise2(x * 0.4, y * 0.6, 2);
      g.set(x, y, y === treeTop[x] ? (n > 0.5 ? "▲" : "▄") : n > 0.7 ? "▓" : "█", KEYS[TREE + Math.min(2, Math.floor(n * 3))]);
    }
    for (let y = meadow; y < rows; y++) {
      const d = (y - meadow) / (rows - meadow);
      for (let x = 0; x < cols; x++) {
        const n = fbm(x * 0.08 - t * 0.05, y * 0.3, 3, 4);
        const sway = noise2(x * 0.15 + t * 0.4, y * 0.3, 6);
        const v = clamp(0.15 + d * 0.5 + (n - 0.5) * 0.8);
        const ch = n > 0.58 ? GR[Math.floor(sway * 6) % 6] : v > 0.5 ? "▓" : "▒";
        g.set(x, y, ch, KEYS[MEAD + Math.min(9, Math.floor(v * 10))]);
      }
    }
    for (const f of flies) {
      const x = f.x + Math.sin(t * f.sp * 0.5 + f.ph) * f.ax + Math.sin(t * f.sp * 1.3 + f.ph * 2) * 1.5;
      const y = f.y + Math.cos(t * f.sp * 0.7 + f.ph) * f.ay;
      const b = Math.sin(t * f.bl + f.bp);
      const on = clamp((b - 0.1) / 0.6);
      const xi = Math.round(x), yi = Math.round(y);
      if (on > 0.15) {
        const R = 0.8 + on * 1.3;
        for (let dy = -2; dy <= 2; dy++) for (let dx = -5; dx <= 5; dx++) {
          const d = Math.hypot(dx / 2, dy) / R;
          if (d < 1 && (dx || dy) && g.inside(xi + dx, yi + dy)) {
            const lvl = Math.floor((1 - d) * on * 2.4);
            if (lvl > 0) g.set(xi + dx, yi + dy, g.get(xi + dx, yi + dy), KEYS[GLOW + Math.min(2, lvl - 1)]);
          }
        }
        g.set(xi, yi, on > 0.6 ? "●" : "•", KEYS[GLOW + (on > 0.6 ? 4 : 3)]);
      } else g.set(xi, yi, "·", KEYS[GLOW]);
    }
    return g.frame();
  };
}
