/* penrose-growth: a Penrose rhombus tiling assembles itself tile by tile outward from a moving seed point. */
import { Grid, palette, gradient, KEYS, clamp, TAU } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("thick", gradient(["#1a2a5a", "#2a4a9a", "#3a6ad0", "#6a9af0"], 4));
add("thin", gradient(["#5a1a3a", "#9a2a5a", "#d04a7a", "#f08aa8"], 4));
add("edge", ["#3a4060", "#8a90b0", "#e8ecff"]);
add("front", ["#ffe08a", "#fff6d0"]);
add("void", ["#05060c", "#0c0e1a"]);

export const meta = {
  slug: "penrose-growth",
  name: "Penrose Growth",
  category: "algorithms",
  note: "A Penrose tiling of thick and thin rhombuses assembles itself tile by tile, spreading outward from a seed point that moves each round.",
  tags: ["penrose", "tiling", "aperiodic", "geometry", "wallpaper", "hero"],
  cols: 96, rows: 36, fps: 24,
  palette: palette(all),
};

const K = (n, i) => KEYS[G[n] + i];
const PHI = (1 + Math.sqrt(5)) / 2;
const P = 13, GROW = 9.5;

function tiles(levels) {
  let tri = [];
  for (let i = 0; i < 10; i++) {
    let b = [Math.cos(((2 * i - 1) * Math.PI) / 10), Math.sin(((2 * i - 1) * Math.PI) / 10)];
    let c = [Math.cos(((2 * i + 1) * Math.PI) / 10), Math.sin(((2 * i + 1) * Math.PI) / 10)];
    if (i % 2 === 0) [b, c] = [c, b];
    tri.push([0, [0, 0], b, c]);
  }
  const mix = (p, q, f) => [p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f];
  for (let l = 0; l < levels; l++) {
    const out = [];
    for (const [k, A, B, C] of tri) {
      if (k === 0) {
        const Pp = mix(A, B, 1 / PHI);
        out.push([0, C, Pp, B], [1, Pp, C, A]);
      } else {
        const Q = mix(B, A, 1 / PHI), R = mix(B, C, 1 / PHI);
        out.push([1, R, C, A], [1, Q, R, B], [0, R, Q, A]);
      }
    }
    tri = out;
  }
  return tri;
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const N = cols * rows;
  const S = Math.hypot(cols / 2, rows) * 1.02;
  const tri = tiles(4);
  const segs = [];
  const kind = new Int8Array(N).fill(-1), edge = new Uint8Array(N);
  const keyX = new Float32Array(N), keyY = new Float32Array(N), shade = new Float32Array(N);
  const toW = (x, y) => [(x + 0.5 - cols / 2) / S, ((y + 0.5 - rows / 2) * 2) / S];
  const segD = (p, a, b) => {
    const vx = b[0] - a[0], vy = b[1] - a[1];
    const f = clamp(((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / (vx * vx + vy * vy));
    return Math.hypot(p[0] - a[0] - vx * f, p[1] - a[1] - vy * f);
  };
  const ew = 0.55 / S;
  for (const [k, A, B, C] of tri) {
    const xs = [A, B, C].map((p) => p[0] * S + cols / 2), ys = [A, B, C].map((p) => (p[1] * S) / 2 + rows / 2);
    const x0 = Math.max(0, Math.floor(Math.min(...xs)) - 1), x1 = Math.min(cols - 1, Math.ceil(Math.max(...xs)));
    const y0 = Math.max(0, Math.floor(Math.min(...ys)) - 1), y1 = Math.min(rows - 1, Math.ceil(Math.max(...ys)));
    // the rhombus is keyed by the middle of its shared base BC, so both halves appear together
    const mx = (B[0] + C[0]) / 2, my = (B[1] + C[1]) / 2;
    const sc = (p) => [p[0] * S + cols / 2, (p[1] * S) / 2 + rows / 2];
    segs.push([mx, my, ...sc(C), ...sc(A)], [mx, my, ...sc(A), ...sc(B)]);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const p = toW(x, y);
      const d1 = (B[0] - A[0]) * (p[1] - A[1]) - (B[1] - A[1]) * (p[0] - A[0]);
      const d2 = (C[0] - B[0]) * (p[1] - B[1]) - (C[1] - B[1]) * (p[0] - B[0]);
      const d3 = (A[0] - C[0]) * (p[1] - C[1]) - (A[1] - C[1]) * (p[0] - C[0]);
      const neg = d1 < 0 || d2 < 0 || d3 < 0, pos = d1 > 0 || d2 > 0 || d3 > 0;
      if (neg && pos) continue;
      const i = x + y * cols;
      kind[i] = k; keyX[i] = mx; keyY[i] = my;
      const e = Math.min(segD(p, C, A), segD(p, A, B));
      edge[i] = e < ew ? 2 : e < ew * 2.2 ? 1 : 0;
      const oa = Math.atan2(C[1] - B[1], C[0] - B[0]);
      shade[i] = (((Math.round(oa / (Math.PI / 5)) % 5) + 5) % 5) / 4;
    }
  }
  return (t) => {
    const cyc = Math.floor(t / P), p = t - cyc * P;
    const sa = cyc * 2.39996;
    const ox = Math.cos(sa) * 0.35, oy = Math.sin(sa) * 0.25;
    const R = p < GROW ? (p / GROW) * 1.5 : p < P - 1 ? 9 : 1.5 * (1 - (p - (P - 1)));
    for (let i = 0; i < N; i++) {
      const x = i % cols, y = (i - x) / cols;
      if (kind[i] < 0) { g.set(x, y, "·", K("void", 0)); continue; }
      const d = Math.hypot(keyX[i] - ox, keyY[i] - oy);
      const age = (R - d) * 6;
      if (age < 0) { g.set(x, y, (x + y) & 1 ? "·" : " ", K("void", 1)); continue; }
      if (age < 0.35) { g.set(x, y, "▓", K("front", 0)); continue; }
      const lv = Math.min(3, Math.floor(shade[i] * 3.99));
      g.set(x, y, lv > 1 ? "▓" : "▒", K(kind[i] ? "thick" : "thin", lv));
    }
    for (const [mx, my, x0, y0, x1, y1] of segs) {
      const age = (R - Math.hypot(mx - ox, my - oy)) * 6;
      if (age < 0) continue;
      const a = Math.atan2(-(y1 - y0) * 2, x1 - x0);
      const ch = DIRS[((Math.round(a / (Math.PI / 4)) % 4) + 4) % 4];
      g.line(x0, y0, x1, y1, ch, age < 0.35 ? K("front", 1) : K("edge", age < 1.2 ? 2 : 1));
    }
    return g.frame();
  };
}
const DIRS = ["─", "╱", "│", "╲"];
