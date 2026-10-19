/* starfield-warp: stars streaking past the viewer at warp speed through a glowing tunnel of light. */
import { Grid, palette, gradient, KEYS, fbm, rng, clamp, TAU } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("bg", gradient(["#03030c", "#0a0a26", "#16124a", "#2a1a6a", "#40248a", "#5a3aa8"], 10));
add("star", gradient(["#2a3a8a", "#4a6ad0", "#8aa8ff", "#c8d8ff", "#ffffff"], 8));
add("core", gradient(["#8a6ad8", "#c8b8ff", "#ffffff"], 4));

export const meta = {
  slug: "starfield-warp",
  name: "Starfield Warp",
  category: "cosmos",
  note: "Hundreds of stars streak outward from the centre as the view punches through space at warp speed.",
  tags: ["warp", "stars", "hyperspace", "loader", "hero", "404"],
  cols: 96, rows: 36, fps: 30,
  palette: palette(all),
};

const K = (n, i) => KEYS[G[n] + i];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = cols / 2, cy = rows / 2;
  const r = rng(41);
  const N = 420;
  const stars = Array.from({ length: N }, () => {
    const a = r() * TAU, d = 0.08 + Math.sqrt(r()) * 1.2;
    return [Math.cos(a) * d, Math.sin(a) * d, r(), 0.7 + r() * 0.6];
  });
  const scale = cols * 0.22;
  const proj = (x, y, z) => [cx + (x / z) * scale, cy + (y / z) * scale * 0.5];
  const glyph = (dx, dy) => {
    const a = Math.atan2(dy * 2, dx);
    const o = Math.round(((a + Math.PI) / Math.PI) * 4) % 4;
    return "─╲│╱"[o];
  };
  return (t) => {
    g.clear();
    // tunnel glow: radial bands rushing outward
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const dx = (x + 0.5 - cx) / cols, dy = ((y + 0.5 - cy) * 2) / cols;
      const d = Math.hypot(dx, dy) + 0.02;
      const a = Math.atan2(dy, dx);
      const n = fbm(Math.cos(a) * 3 + 10, Math.sin(a) * 3 + 0.5 / d - t * 2.2, 3, 5);
      const v = clamp(0.12 + n * 0.7 * clamp(d * 3.2) + Math.exp(-d * 9) * 0.9);
      if (d < 0.06) g.set(x, y, "█", K("core", Math.min(3, Math.floor((0.06 - d) * 60))));
      else g.set(x, y, v > 0.62 ? "▓" : v > 0.36 ? "▒" : "░", K("bg", Math.min(9, Math.floor(v * 10))));
    }
    for (const [sx, sy, z0, sp] of stars) {
      const z = 0.05 + ((((z0 - t * 0.32 * sp) % 1) + 1) % 1) * 1.4;
      const [x1, y1] = proj(sx, sy, z);
      const [x0, y0] = proj(sx, sy, z + 0.05 + 0.1 * (1 - z / 1.45));
      if (x1 < -20 || x1 > cols + 20 || y1 < -20 || y1 > rows + 20) continue;
      const b = clamp(1.3 - z * 0.85);
      const col = K("star", Math.min(7, Math.floor(b * 8)));
      if (b > 0.35) g.line(x0, y0, x1, y1, glyph(x1 - x0, y1 - y0), col);
      g.set(x1, y1, b > 0.85 ? "●" : b > 0.55 ? "•" : "·", col);
    }
    return g.frame();
  };
}
