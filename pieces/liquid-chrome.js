/* liquid-chrome: mercury blobs merging and splitting, shaded with a reflected studio sky like polished chrome. */
import { Grid, palette, gradient, KEYS, clamp, TAU } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("sky", gradient(["#2a3442", "#5a6e86", "#9ab4cc", "#d8e8f4", "#ffffff"], 10));
add("ground", gradient(["#0c0a0a", "#2a221e", "#54463a", "#8a7460"], 6));
add("rim", ["#05070a", "#141a22"]);
add("bg", gradient(["#0a0912", "#15122a", "#221c3e", "#322a52"], 4));
add("glint", ["#fff8e0"]);

export const meta = {
  slug: "liquid-chrome",
  name: "Liquid Chrome",
  category: "demoscene",
  note: "Mercury blobs drift, merge and split apart, shaded like polished chrome reflecting a bright sky and dark ground.",
  tags: ["metaballs", "chrome", "liquid", "metal", "hero", "wallpaper"],
  cols: 88, rows: 32, fps: 30,
  palette: palette(all),
};

const K = (n, i) => KEYS[G[n] + i];
const SH = "░▒▓█";
const BLOBS = [
  [0.21, 0.13, 0, 0.7, 0.62, 9.5], [0.17, 0.23, 1.3, 0.75, 0.55, 8], [0.13, 0.19, 2.6, 0.8, 0.7, 7],
  [0.27, 0.11, 3.9, 0.55, 0.6, 6.5], [0.11, 0.29, 5.1, 0.6, 0.5, 7.5], [0.23, 0.17, 0.7, 0.4, 0.75, 5.5],
];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const n = BLOBS.length, bx = new Float32Array(n), by = new Float32Array(n), r2 = new Float32Array(n);
  const L = [-0.45, 0.6, 0.66];
  return (t) => {
    const W = cols, H = rows * 2;
    for (let i = 0; i < n; i++) {
      const [fx, fy, ph, ax, ay, r] = BLOBS[i];
      // speeds are multiples of a base so the motion repeats every 20 s
      const w = TAU / 20;
      bx[i] = W / 2 + Math.sin(t * w * Math.round(fx * 12) + ph) * W * 0.36 * ax;
      by[i] = H / 2 + Math.cos(t * w * Math.round(fy * 12) + ph * 1.7) * H * 0.34 * ay;
      r2[i] = r * r;
    }
    for (let y = 0; y < rows; y++) {
      const sy = y * 2 + 1;
      for (let x = 0; x < cols; x++) {
        const sx = x + 0.5;
        let f = 0, gx = 0, gy = 0;
        for (let i = 0; i < n; i++) {
          const dx = sx - bx[i], dy = sy - by[i];
          const d2 = dx * dx + dy * dy + 0.5;
          const v = r2[i] / d2;
          f += v; gx += v * dx / d2; gy += v * dy / d2;
        }
        if (f < 1) {
          // dark studio backdrop with a soft contact shadow around the mercury
          const sh = clamp((f - 0.45) / 0.55);
          const lv = 0.35 + 0.5 * (1 - y / rows) * 0.6;
          const k = Math.max(0, Math.min(3, Math.floor((lv - sh * 0.5) * 4)));
          g.set(x, y, sh > 0.6 ? "·" : (x + y) & 1 ? "▒" : "░", K("bg", k));
          continue;
        }
        // surface normal from the field gradient; flatter on the top of big pools
        const h = Math.min(1, (f - 1) * 1.4);
        let nx = gx, ny = gy, nz = 0.05 + h * 0.3;
        const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
        // reflect the view ray (0,0,-1) and read the environment
        const ry = -ny * 2 * nz, rx = -nx * 2 * nz, rz = 1 - 2 * nz * nz;
        const up = ry * 0.95 + rx * 0.12 + rz * 0.0 + 0.02;
        let ch, co;
        if (f < 1.08) { ch = "▓"; co = K("rim", 1); }
        else if (up > 0.06) {
          const v = clamp(up * 1.25);
          co = K("sky", Math.min(9, Math.floor(v * 10))); ch = SH[Math.min(3, 1 + Math.floor(v * 3))];
        } else if (up > -0.1) {
          ch = "█"; co = K("rim", 0);
        } else {
          const v = clamp(-up * 1.4);
          co = K("ground", Math.min(5, Math.floor(v * 6))); ch = SH[Math.min(3, 1 + Math.floor(v * 3))];
        }
        const spec = nx * L[0] - ny * L[1] + nz * L[2];
        if (spec > 0.93) { ch = "█"; co = K("glint", 0); }
        g.set(x, y, ch, co);
      }
    }
    return g.frame();
  };
}
