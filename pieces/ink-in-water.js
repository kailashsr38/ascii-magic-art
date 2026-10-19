/* ink-in-water: drops of coloured ink fall into clear water and bloom into curling mushroom plumes. */
import { Grid, palette, gradient, KEYS, fbm, rng, clamp } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("water", gradient(["#d4eaee", "#bcdce4", "#a4cad6", "#8ab6c6"], 4));
add("i0", gradient(["#b8cce4", "#7a90cc", "#4a52b0", "#2a2a8a", "#141660", "#0a0a34"], 8));
add("i1", gradient(["#e8bcc8", "#d8788e", "#c03a5a", "#90183a", "#600a24", "#300410"], 8));
add("i2", gradient(["#b0e0d4", "#5ab8a4", "#1a8a7a", "#0a6058", "#063c38", "#021e1c"], 8));
add("surf", ["#ffffff", "#8ab4c4"]);

export const meta = {
  slug: "ink-in-water",
  name: "Ink in Water",
  category: "demoscene",
  note: "Drops of indigo, crimson and teal ink fall into clear water and bloom into curling mushroom plumes that slowly dissolve.",
  tags: ["ink", "water", "fluid", "organic", "calm", "wallpaper"],
  cols: 96, rows: 34, fps: 24,
  palette: palette(all),
};

const K = (n, i) => KEYS[G[n] + i];
const P = 15, ND = 5, LIFE = 14;
const SH = "░▒▓█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const H = rows * 2;
  const drops = [];
  return (t) => {
    // the active drops: each slot k re-drops every P seconds at a new place
    drops.length = 0;
    for (let k = 0; k < ND; k++) {
      const off = (k * P) / ND;
      const n = Math.floor((t + off) / P);
      const a = t + off - n * P;
      if (a > LIFE) continue;
      const r = rng(n * 131 + k * 17 + 5);
      const x0 = 10 + r() * (cols - 20);
      const depth = H * (0.5 + r() * 0.3);
      const yh = 3 + depth * (1 - Math.exp(-a / 2.4));
      const spread = 2 + Math.sqrt(a) * 3.2;
      const fade = clamp(a / 0.25) * clamp((LIFE - a) / 4);
      drops.push({ x0, yh, a, spread, fade, ink: (n + k) % 3, seed: n * 7 + k, drift: (r() - 0.5) * 0.8 });
    }
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        let tot = 0, best = 0, bi = 0;
        for (const d of drops) {
          const sy = y * 2 + 1;
          if (Math.abs(x - d.x0) > d.spread * 2.6 + 8 || sy > d.yh + d.spread + 8) continue;
          // swirl the space so the plume curls
          const wx = (fbm(x * 0.07 + d.seed, sy * 0.06 - d.a * 0.12, 2, 3) - 0.5) * (6 + d.a * 1.8);
          const wy = (fbm(x * 0.07 + 40, sy * 0.06 + d.seed - d.a * 0.1, 2, 9) - 0.5) * (4 + d.a * 1.2);
          const px = x + wx - d.x0 - d.drift * d.a, py = sy + wy;
          // two rolled lobes of the vortex ring
          const ly = py - d.yh, lw = d.spread * 0.85;
          const lr = d.spread * 0.55;
          const l1 = Math.exp(-((px - lw) ** 2 + ly * ly) / (lr * lr));
          const l2 = Math.exp(-((px + lw) ** 2 + ly * ly) / (lr * lr));
          const cap = Math.exp(-(px * px) / (lr * lr * 1.6) - ((ly + lr * 0.5) ** 2) / (lr * lr * 0.5)) * 0.8;
          // the thin stem left behind the falling drop
          const stem = py < d.yh && py > 0 ? Math.exp(-(px * px) / (1.2 + d.a * 0.5)) * 0.65 * clamp(py / d.yh + 0.25) : 0;
          const v = (l1 + l2 + cap + stem) * d.fade * (1.25 - d.a / LIFE * 0.6);
          tot += v;
          if (v > best) { best = v; bi = d.ink; }
        }
        if (y === 0) { g.set(x, y, (x + Math.floor(t * 3)) % 4 ? "≈" : "~", K("surf", (x + Math.floor(t * 3)) % 4 ? 1 : 0)); continue; }
        if (tot < 0.07) {
          const wv = Math.min(3, Math.floor(y / rows * 4));
          g.set(x, y, "█", K("water", wv));
          continue;
        }
        const lv = clamp(tot * 0.7);
        g.set(x, y, lv < 0.25 ? "▓" : "█", K("i" + bi, Math.min(7, Math.floor(lv * 8))));
      }
    }
    return g.frame();
  };
}
