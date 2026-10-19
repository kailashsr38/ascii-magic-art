/* bee-flight: bumblebees buzzing from flower to flower over a sunny meadow, hovering at each bloom. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, TAU, smooth, lerp } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const SKY = add(gradient(["#3a86d4", "#6aa8e4", "#a2cef0", "#dcf0fa"], 8));
const CLOUD = add(["#ffffff", "#e8f0f8"]);
const HILL = add(gradient(["#5a9a44", "#7ab450", "#9cc864"], 3));
const GRASS = add(gradient(["#1a4a14", "#2a6a1e", "#3e8a28", "#5aa834", "#7ec448"], 8));
const PET = add(["#e8406a", "#f6a020", "#a85ae0", "#ffffff", "#ff7ab0", "#f04a3a"]);
const PETD = add(["#a82848", "#b8701a", "#7038a8", "#c8c8d8", "#c84a80", "#b02a20"]);
const CEN = add(["#f6c81a", "#6a3a10"]);
const BEE = add(["#f8c818", "#1a1208", "#e4f4ff", "#ffe680"]);
const TRAIL = add(["#fff4c0"]);

export const meta = {
  slug: "bee-flight",
  name: "Busy Bees",
  category: "animals",
  note: "Bumblebees buzz from flower to flower over a sunny meadow, hovering at each bloom before zipping to the next.",
  tags: ["bees", "insects", "flowers", "spring", "garden", "hero"],
  cols: 96, rows: 32, fps: 24,
  palette: palette(P),
};

const SH = " ░▒▓█";
const HOP = 3.2;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const gy = 22;
  const flowers = [[12, 17, 0, 3.2], [30, 13, 1, 3.8], [49, 18, 2, 3.4], [66, 12, 4, 3.9], [84, 16, 5, 3.3], [40, 22, 3, 2.6], [74, 22, 0, 2.6]];
  const r = rng(8);
  const bees = [
    { order: [0, 1, 2, 3, 4, 3, 2, 1], off: 0 },
    { order: [3, 4, 6, 2, 5, 1, 0, 1], off: 1.3 },
    { order: [5, 2, 3, 6, 4, 2, 1, 0], off: 2.4 },
  ];
  const at = (b, t) => {
    const tt = t + b.off * 3;
    const n = b.order.length;
    const i = Math.floor(tt / HOP), f = (tt / HOP) - i;
    const A = flowers[b.order[((i % n) + n) % n]], B = flowers[b.order[(((i + 1) % n) + n) % n]];
    const hover = 0.35;
    if (f < hover) return [A[0] + Math.sin(tt * 5) * 1.2, A[1] - 3.5 + Math.sin(tt * 9) * 0.4, B[0] >= A[0] ? 1 : -1];
    const u = smooth((f - hover) / (1 - hover));
    const x = lerp(A[0], B[0], u) + Math.sin(u * TAU * 2) * 2;
    const y = lerp(A[1] - 3.5, B[1] - 3.5, u) - Math.sin(u * Math.PI) * 5 + Math.sin(tt * 7) * 0.5;
    return [x, y, B[0] >= A[0] ? 1 : -1];
  };
  return (t) => {
    g.clear();
    for (let y = 0; y < gy; y++) for (let x = 0; x < cols; x++) {
      const v = clamp(0.15 + (y / gy) * 0.85);
      const c = fbm(x * 0.04 + t * 0.03, y * 0.25, 3, 5);
      if (c > 0.63 && y < 8) g.set(x, y, c > 0.68 ? "█" : "▓", KEYS[CLOUD + (c > 0.66 ? 0 : 1)]);
      else g.set(x, y, SH[1 + Math.min(2, Math.floor(v * 3))], KEYS[SKY + Math.min(7, Math.floor(v * 8))]);
    }
    for (let x = 0; x < cols; x++) {
      const h = gy - 4 - Math.floor(fbm(x * 0.04, 2, 3, 2) * 4);
      for (let y = h; y < gy; y++) g.set(x, y, "█", KEYS[HILL + Math.min(2, y - h)]);
    }
    for (let y = gy; y < rows; y++) for (let x = 0; x < cols; x++) {
      const n = noise2(x * 0.6 + Math.sin(t * 1.2 + y) * 0.3, y * 0.9, 4);
      g.set(x, y, n > 0.6 ? "/" : n > 0.42 ? "|" : n > 0.28 ? "\\" : "▓", KEYS[GRASS + Math.min(7, Math.floor(n * 5 + (y - gy) * 0.3))]);
    }
    for (const [fx, fy, k, rad] of flowers) {
      const sw = Math.sin(t * 1.3 + fx) * 0.5;
      for (let y = Math.ceil(fy + rad * 0.5); y < rows; y++) g.set(fx + sw * (rows - y) / rows, y, "|", KEYS[GRASS + 3]);
      g.text(fx - 2, Math.round(fy + rad * 0.5 + 3), "\\", KEYS[GRASS + 4]); g.text(fx - 3, Math.round(fy + rad * 0.5 + 2), "▄", KEYS[GRASS + 4]);
      g.text(fx + 2, Math.round(fy + rad * 0.5 + 4), "/", KEYS[GRASS + 4]); g.text(fx + 3, Math.round(fy + rad * 0.5 + 3), "▄", KEYS[GRASS + 4]);
      const cx = fx + sw;
      for (let y = Math.floor(fy - rad * 0.6); y <= fy + rad * 0.6; y++) for (let x = Math.floor(cx - rad * 2); x <= cx + rad * 2; x++) {
        const dx = (x - cx) / 2, dy = (y - fy) * 1.7;
        const d = Math.hypot(dx, dy);
        if (d > rad) continue;
        const ang = Math.atan2(dy, dx);
        const petal = Math.cos(ang * 6) * 0.25 + 0.75;
        if (d < rad * 0.32) g.set(x, y, d < rad * 0.18 ? "●" : "█", KEYS[CEN + (d < rad * 0.18 ? 1 : 0)]);
        else if (d < rad * petal) g.set(x, y, "█", KEYS[(d > rad * petal * 0.8 ? PETD : PET) + k]);
      }
    }
    for (const b of bees) {
      for (let k = 1; k <= 10; k++) {
        const [px, py] = at(b, t - k * 0.07);
        if (k % 2 === 0) g.set(px, py + 1, "·", KEYS[TRAIL]);
      }
      const [x, y, d] = at(b, t);
      const xi = Math.round(x), yi = Math.round(y);
      const up = Math.floor(t * 30) % 2 === 0;
      g.text(xi - 1, yi - 1, up ? "▀▀" : "▄▄", KEYS[BEE + 2]);
      const body = d > 0 ? [[-3, "-", 1], [-2, "█", 0], [-1, "█", 1], [0, "█", 0], [1, "█", 1], [2, "●", 1]] : [[-2, "●", 1], [-1, "█", 1], [0, "█", 0], [1, "█", 1], [2, "█", 0], [3, "-", 1]];
      for (const [dx, ch, k] of body) {
        g.set(xi + dx, yi, ch, KEYS[BEE + k]);
        if (ch === "█") g.set(xi + dx, yi + 1, "▀", KEYS[BEE + k]);
      }
    }
    return g.frame();
  };
}
