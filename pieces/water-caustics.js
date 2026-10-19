/* water-caustics: shimmering light networks dancing on the floor of a tiled pool. */
import { Grid, palette, gradient, KEYS, noise2 } from "../lib/kit.js";

const POOL = gradient(["#03314a", "#05557a", "#0a7fa6", "#29a9c8", "#7fd6e6", "#e6fbff"], 20);
const GROUT = gradient(["#022538", "#04415e"], 2);

export const meta = {
  slug: "water-caustics",
  name: "Pool Caustics",
  category: "demoscene",
  note: "Shimmering networks of light dancing across the tiled floor of a swimming pool.",
  tags: ["water", "pool", "summer", "caustics", "wallpaper", "hero"],
  cols: 88, rows: 30, fps: 24,
  palette: palette([...POOL, ...GROUT]),
};

const CH = "░▒▓█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  // light gathers along the ridges of two drifting, warped noise fields
  const ridge = (x, y, seed) => {
    const n = noise2(x, y, seed) * 0.65 + noise2(x * 2.1, y * 2.1, seed + 5) * 0.35;
    return Math.pow(1 - Math.abs(n - 0.5) * 2, 12);
  };
  return (t) => {
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const wx = x * 0.09, wy = y * 0.19;
      const w1 = Math.sin(wy * 1.3 + t * 0.9) * 0.35, w2 = Math.cos(wx * 1.1 - t * 0.7) * 0.35;
      const L = ridge(wx + w1 + t * 0.12, wy + w2 - t * 0.05, 3) + ridge(wx * 1.3 - w2 - t * 0.09, wy * 1.3 + w1 + t * 0.1, 11) * 0.8;
      const base = 0.3 + 0.08 * Math.sin(wx * 0.8 + wy * 1.3 + t * 0.3);
      const v = Math.min(0.999, base + L * 0.6);
      const ripple = Math.sin(x * 0.2 + t * 1.5) * 0.35 + Math.sin(y * 0.45 - t * 1.1) * 0.35;
      const gx = x + ripple, gy = y + ripple * 0.5;
      const grout = (Math.floor(gx) % 8 === 0) || (Math.floor(gy) % 4 === 0);
      if (grout && v < 0.42) { g.set(x, y, "▒", KEYS[20 + (v > 0.3 ? 1 : 0)]); continue; }
      g.set(x, y, CH[Math.min(3, Math.floor(v * 4.2))], KEYS[Math.min(19, Math.floor(v * 20))]);
    }
    return g.frame();
  };
}
