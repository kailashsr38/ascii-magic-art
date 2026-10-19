/* synthwave-grid: a neon grid rushing toward a striped sunset sun on the horizon. */
import { Grid, palette, gradient, KEYS, rng, clamp } from "../lib/kit.js";

const SKY = gradient(["#0b0221", "#2b0752", "#6a0f7a", "#c2217a", "#ff6a4d"], 14);   // 0-d
const SUN = gradient(["#ff2f7e", "#ff7b3d", "#ffd23f", "#fff3a0"], 8);              // e-l
const GROUND = gradient(["#160430", "#2a0a4c", "#41106a"], 4);                      // m-p
const LINE = gradient(["#6a1fb0", "#b43cff", "#ff3fd0", "#ff8ae8"], 6);             // q-v
const HILL = gradient(["#12052a", "#2a0d55"], 2);                                   // w-x

export const meta = {
  slug: "synthwave-grid",
  name: "Synthwave Grid",
  category: "demoscene",
  note: "A neon grid rushing toward a striped sunset sun, with purple hills on the horizon.",
  tags: ["synthwave", "retro", "neon", "80s", "hero", "wallpaper"],
  cols: 96, rows: 34, fps: 30,
  palette: palette([...SKY, ...SUN, ...GROUND, ...LINE, ...HILL, "#ffe9ff"]),
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const hor = Math.floor(rows * 0.5);
  const cx = cols / 2, sunY = hor - 1, sunR = 15;
  const r = rng(9);
  const stars = Array.from({ length: 40 }, () => [Math.floor(r() * cols), Math.floor(r() * (hor - 8)), r() * 6.28]);
  const hill = Array.from({ length: cols }, (_, x) => {
    const d = Math.abs(x - cx) / cx;
    return Math.max(0, 1.5 + 3.2 * d * (0.6 + 0.4 * Math.sin(x * 0.31) * Math.sin(x * 0.07 + 1)));
  });
  return (t) => {
    g.clear();
    for (let y = 0; y < hor; y++) for (let x = 0; x < cols; x++) {
      const v = y / hor;
      g.set(x, y, v > 0.7 ? "▒" : "░", KEYS[Math.min(13, Math.floor(v * 14))]);
    }
    for (const [sx, sy, ph] of stars) if (Math.sin(t * 1.8 + ph) > -0.2) g.set(sx, sy, Math.sin(t * 1.8 + ph) > 0.7 ? "+" : "·", "y");
    // sun with the classic horizontal slices
    for (let y = sunY - sunR; y <= sunY; y++) for (let x = 0; x < cols; x++) {
      const dx = (x - cx) / sunR, dy = (y - sunY) / (sunR * 0.5);
      const d = dx * dx + dy * dy;
      if (d > 1) continue;
      const h = (sunY - y) / (sunR * 0.5);
      const gapH = (1 - h) * 0.9;
      const band = ((y + Math.floor(t * 3)) % 3);
      if (h < 0.75 && band === 0 && gapH > 0.2) continue;
      g.set(x, y, d > 0.85 ? "▓" : "█", KEYS[14 + Math.min(7, Math.floor(h * 8))]);
    }
    // hills silhouette
    for (let x = 0; x < cols; x++) {
      const hh = Math.round(hill[x]);
      for (let k = 0; k < hh; k++) g.set(x, hor - 1 - k, k === hh - 1 ? "▄" : "█", KEYS[k === hh - 1 ? 33 : 32]);
    }
    // the grid: ground, then rows that hold a horizontal line, then lines to the vanishing point
    const camZ = t * 1.6;
    const kAt = (y) => (8 / (y - hor + 0.5)) * 20 / cols;
    for (let y = hor; y < rows; y++) {
      const depth = clamp((y - hor) / (rows - hor));
      if (y - hor < 2) { for (let x = 0; x < cols; x++) g.set(x, y, y === hor ? "▀" : "─", KEYS[y === hor ? 31 : 29]); continue; }
      const z0 = 8 / (y - hor + 0.5), z1 = 8 / (y - hor + 1.5);
      const lineZ = Math.floor(2 * (z0 + camZ)) !== Math.floor(2 * (z1 + camZ));
      for (let x = 0; x < cols; x++) {
        if (lineZ) g.set(x, y, "─", KEYS[26 + Math.min(5, Math.floor(clamp(0.3 + depth * 0.9) * 6))]);
        else g.set(x, y, depth < 0.3 ? "▒" : "░", KEYS[22 + Math.min(3, Math.floor((1 - depth) * 3.5))]);
      }
    }
    // lines toward the vanishing point, drawn row by row, dropped where they crowd
    for (let X = -24; X <= 24; X++) {
      for (let y = hor + 2; y < rows; y++) {
        const sp = 1 / kAt(y + 0.5);
        if (sp < 3 && X !== 0) continue;
        const xa = cx + X / kAt(y), xb = cx + X / kAt(y + 1);
        const lo = Math.round(Math.min(xa, xb)), hi = Math.round(Math.max(xa, xb));
        if (hi < 0 || lo >= cols) continue;
        const m = xb - xa;
        const ch = Math.abs(m) < 0.7 ? "│" : m < 0 ? "╱" : "╲";
        const depth = clamp((y - hor) / (rows - hor));
        const x = Math.round((xa + xb) / 2);
        {
          const cur = g.get(x, y);
          g.set(x, y, cur === "─" ? "┼" : ch, KEYS[26 + Math.min(5, Math.floor(clamp(0.35 + depth * 0.8) * 6))]);
        }
      }
    }
    return g.frame();
  };
}
