/* metaballs: glowing blobs drifting, merging and splitting like liquid. */
import { Grid, palette, gradient, KEYS } from "../lib/kit.js";

const BG = gradient(["#05030f", "#140a33", "#2a1060"], 6);                          // 0-5
const BLOB = gradient(["#5a1aa8", "#c2249c", "#ff4f6a", "#ff9a3d", "#ffe27a", "#fffbe6"], 18); // 6-n

export const meta = {
  slug: "metaballs",
  name: "Metaballs",
  category: "demoscene",
  note: "Glowing blobs drifting across the screen, merging and splitting like hot liquid.",
  tags: ["blobs", "liquid", "demoscene", "lava", "hero", "wallpaper"],
  cols: 88, rows: 30, fps: 30,
  palette: palette([...BG, ...BLOB]),
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const balls = [
    [0.31, 0.47, 0, 1.1, 7.5], [0.23, 0.37, 1.7, 0.4, 6.2], [0.41, 0.29, 3.1, 2.2, 8.5],
    [0.17, 0.53, 4.4, 5.0, 5.4], [0.37, 0.19, 2.2, 3.7, 6.8], [0.27, 0.43, 5.5, 0.9, 4.6],
  ];
  const bx = new Float32Array(balls.length), by = new Float32Array(balls.length), br = new Float32Array(balls.length);
  return (t) => {
    g.clear();
    balls.forEach(([fx, fy, px, py, r], i) => {
      bx[i] = cols / 2 + Math.sin(t * fx * 2 + px) * cols * 0.36;
      by[i] = rows + Math.sin(t * fy * 2 + py + i * 1.3) * rows * 0.8;   // y in half-cell units
      br[i] = r * (1 + 0.15 * Math.sin(t * 1.3 + i));
    });
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      let f = 0;
      const yy = y * 2;
      for (let i = 0; i < 6; i++) {
        const dx = x - bx[i], dy = yy - by[i];
        f += (br[i] * br[i]) / (dx * dx + dy * dy + 0.5);
      }
      if (f >= 1) {
        const v = Math.min(1, (f - 1) / 2.6);
        const k = Math.min(17, Math.floor(v * 18));
        const edge = f < 1.18;
        g.set(x, y, edge ? "▓" : "█", KEYS[6 + k]);
      } else {
        const v = f;
        const band = Math.floor(f * 8) % 2 === 0;
        g.set(x, y, v > 0.6 ? "▒" : v > 0.12 ? "░" : band ? "·" : ":", v > 0.6 ? KEYS[6] : KEYS[Math.min(5, 1 + Math.floor(v * 6))]);
      }
    }
    return g.frame();
  };
}
