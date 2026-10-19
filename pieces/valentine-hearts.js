/* valentine-hearts: shaded hearts of every size floating up through a warm rose haze. */
import { Grid, palette, gradient, KEYS, fbm, clamp, rng, fract } from "../lib/kit.js";

const BG = gradient(["#1e0410", "#3e0a20", "#66122f", "#8e1e40", "#b8344f"], 10);  // 0..9
const RED = gradient(["#5a0414", "#a80a2a", "#e0203e", "#ff5a6a", "#ffb0b8", "#fff0f2"], 8); // 10..17
const PINK = gradient(["#5a1438", "#a82a6a", "#e8509a", "#ff8ac0", "#ffd0e6", "#fff4fa"], 8); // 18..25
const pal = palette([...BG, ...RED, ...PINK]);

export const meta = {
  slug: "valentine-hearts",
  name: "Valentine Hearts",
  category: "occasions",
  note: "Shaded red and pink hearts of every size float upwards and sway through a warm rose haze.",
  tags: ["valentine", "love", "hearts", "romantic", "wallpaper", "hero"],
  cols: 80, rows: 32, fps: 20,
  palette: pal,
};

const SH = " ░▒▓█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(14);
  const hearts = Array.from({ length: 13 }, (_, i) => ({
    s: 1.6 + r() * 4.8, x: 4 + r() * (cols - 8), ph: r(), sp: 0, sw: r() * 6.28, fam: r() < 0.55 ? 10 : 18,
  })).sort((a, b) => a.s - b.s);
  hearts.forEach((h) => (h.sp = 0.05 + 0.05 * (h.s / 6)));    // bigger, nearer hearts rise faster
  const tiny = Array.from({ length: 34 }, () => [r() * cols, r(), 0.04 + r() * 0.05, r() * 6.28, r() < 0.5 ? 10 : 18]);
  return (t) => {
    g.clear();
    // rose haze with soft bokeh
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const n = fbm(x * 0.06, y * 0.13 - t * 0.12, 3);
      const v = clamp(0.2 + (1 - y / rows) * 0.25 + (n - 0.5) * 0.6);
      g.set(x, y, SH[1 + Math.min(3, Math.floor(v * 4))], KEYS[Math.min(9, Math.floor(v * 10))]);
    }
    for (const [x0, ph, sp, sw, fam] of tiny) {
      const y = rows + 2 - fract(t * sp + ph) * (rows + 4);
      const x = x0 + Math.sin(t * 1.3 + sw) * 2;
      g.set(x, y, Math.sin(t * 3 + sw) > 0 ? "♥" : "•", KEYS[fam + 3 + (Math.sin(t * 2 + sw) > 0.5 ? 1 : 0)]);
    }
    for (const h of hearts) {
      const travel = rows + h.s * 3;
      const cy = rows + h.s * 1.5 - fract(t * h.sp + h.ph) * travel;
      const cx = h.x + Math.sin(t * 0.9 + h.sw) * 2.5;
      const sx = h.s * 2.1, sy = h.s;
      const near = clamp(h.s / 6);
      for (let y = Math.floor(cy - sy * 1.3); y <= Math.ceil(cy + sy * 1.3); y++) {
        if (y < 0 || y >= rows) continue;
        for (let x = Math.floor(cx - sx * 1.3); x <= Math.ceil(cx + sx * 1.3); x++) {
          const u = (x - cx) / sx, w = -(y - cy) / sy + 0.15;
          const a = u * u + w * w - 1;
          const f = a * a * a - u * u * w * w * w;
          if (f > 0) continue;
          const depth = clamp(-f * 6);
          const lit = clamp(0.35 + depth * 0.35 - u * 0.25 + w * 0.2 + (Math.hypot(u + 0.45, w - 0.45) < 0.25 ? 0.4 : 0));
          const lv = Math.min(7, Math.floor(lit * 6 * (0.6 + 0.4 * near) + 1));
          g.set(x, y, depth < 0.05 ? "▓" : "█", KEYS[h.fam + lv]);
        }
      }
    }
    return g.frame();
  };
}
