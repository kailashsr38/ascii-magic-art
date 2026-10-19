/* trefoil-tube: a thick candy-striped tube tied in a trefoil knot, its stripes flowing along the knot as it turns. */
import { Grid, palette, gradient, KEYS, TAU } from "../lib/kit.js";

/* small 3D kit for this piece: view space has +z away from the viewer, larger depth is nearer. */
const LT = (() => { const v = [-0.55, 0.62, -0.56], l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; })();
/** Lambert plus a specular glint, 0..1, for a unit view-space normal. */
function lit(n, amb = 0.1, sp = 0.55, pw = 22) {
  const d = n[0] * LT[0] + n[1] * LT[1] + n[2] * LT[2];
  const rz = 2 * d * n[2] - LT[2];
  const s = d > 0 && rz < 0 ? Math.pow(-rz, pw) : 0;
  return Math.min(1, amb + Math.max(0, d) * (1 - amb) * 0.88 + s * sp);
}
/** Rotation matrix from Euler angles (x, then y, then z). */
function mat(ax, ay, az) {
  const a = Math.cos(ax), b = Math.sin(ax), c = Math.cos(ay), d = Math.sin(ay), e = Math.cos(az), f = Math.sin(az);
  // R = Rz * Ry * Rx
  return [e * c, e * d * b - f * a, e * d * a + f * b, f * c, f * d * b + e * a, f * d * a - e * b, -d, c * b, c * a];
}
const mul = (m, n) => [
  m[0] * n[0] + m[1] * n[3] + m[2] * n[6], m[0] * n[1] + m[1] * n[4] + m[2] * n[7], m[0] * n[2] + m[1] * n[5] + m[2] * n[8],
  m[3] * n[0] + m[4] * n[3] + m[5] * n[6], m[3] * n[1] + m[4] * n[4] + m[5] * n[7], m[3] * n[2] + m[4] * n[5] + m[5] * n[8],
  m[6] * n[0] + m[7] * n[3] + m[8] * n[6], m[6] * n[1] + m[7] * n[4] + m[8] * n[7], m[6] * n[2] + m[7] * n[5] + m[8] * n[8]];
const app = (m, v) => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
/** Filled triangle in screen cells with a depth test; points are [x, y, depth]. */
function tri(g, a, b, c, ch, co) {
  const area = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  if (Math.abs(area) < 1e-6) return;
  const x0 = Math.max(0, Math.floor(Math.min(a[0], b[0], c[0]))), x1 = Math.min(g.cols - 1, Math.ceil(Math.max(a[0], b[0], c[0])));
  const y0 = Math.max(0, Math.floor(Math.min(a[1], b[1], c[1]))), y1 = Math.min(g.rows - 1, Math.ceil(Math.max(a[1], b[1], c[1])));
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const px = x + 0.5, py = y + 0.5;
    const w0 = ((b[0] - px) * (c[1] - py) - (b[1] - py) * (c[0] - px)) / area;
    const w1 = ((c[0] - px) * (a[1] - py) - (c[1] - py) * (a[0] - px)) / area;
    const w2 = 1 - w0 - w1;
    if (w0 < -0.02 || w1 < -0.02 || w2 < -0.02) continue;
    g.setZ(x, y, w0 * a[2] + w1 * b[2] + w2 * c[2], typeof ch === "function" ? ch(w0, w1, w2) : ch, co);
  }
}
/** A depth-tested line between projected points, nudged toward the viewer by bias. */
function seg(g, a, b, ch, co, bias = 0) {
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])) * 1.5));
  for (let i = 0; i <= n; i++) {
    const f = i / n;
    g.setZ(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f + bias, typeof ch === "function" ? ch(f) : ch, co);
  }
}
/** Character for a line drawn in screen direction dx, dy (tall cells). */
function slopeChar(dx, dy) {
  const a = Math.atan2(dy * 2, dx), s = Math.abs(Math.sin(a)), c = Math.abs(Math.cos(a));
  if (s < 0.38) return "─";
  if (c < 0.38) return "│";
  return (dx > 0) === (dy > 0) ? "╲" : "╱";
}
const BLK = "░▒▓█";
/** Block shade glyph for a light level 0..1. */
const blk = (l) => BLK[l < 0.2 ? 0 : l < 0.42 ? 1 : l < 0.68 ? 2 : 3];

const A = gradient(["#1a0408", "#5a0c1a", "#c0203a", "#ff6a7a", "#ffd0d6", "#ffffff"], 12);
const B = gradient(["#14100a", "#4a3a26", "#a08a64", "#e8dcc0", "#fffaf0", "#ffffff"], 12);
export const meta = {
  slug: "trefoil-tube",
  name: "Candy Trefoil Tube",
  category: "solids",
  note: "A fat red and cream striped tube tied in a trefoil knot, the stripes flowing around the loop while the knot slowly turns.",
  tags: ["3d", "knot", "trefoil", "tube", "loader", "hero"],
  cols: 72, rows: 34, fps: 30,
  palette: palette([...A, ...B, "#0c0a10"]),
};

const curve = (s) => [Math.sin(s) + 2 * Math.sin(2 * s), Math.cos(s) - 2 * Math.cos(2 * s), -Math.sin(3 * s)];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const NS = 420, NR = 40, R = 0.62, SCL = 0.33;
  // parallel-transport frames along the closed curve
  const C = [], T = [], N1 = [], N2 = [];
  for (let i = 0; i < NS; i++) {
    const s = (i / NS) * TAU;
    C.push(curve(s));
    T.push(unit(sub(curve(s + 1e-3), curve(s - 1e-3))));
  }
  let n = unit(cross(T[0], [0, 0, 1]));
  for (let i = 0; i < NS; i++) {
    const tt = T[i];
    const d = n[0] * tt[0] + n[1] * tt[1] + n[2] * tt[2];
    n = unit([n[0] - d * tt[0], n[1] - d * tt[1], n[2] - d * tt[2]]);
    N1.push(n); N2.push(cross(tt, n));
  }
  const P = [], NN = [], S = [];
  for (let i = 0; i < NS; i++) for (let j = 0; j < NR; j++) {
    const a = (j / NR) * TAU, ca = Math.cos(a), sa = Math.sin(a);
    const nn = [N1[i][0] * ca + N2[i][0] * sa, N1[i][1] * ca + N2[i][1] * sa, N1[i][2] * ca + N2[i][2] * sa];
    P.push([(C[i][0] + nn[0] * R) * SCL, (C[i][1] + nn[1] * R) * SCL, (C[i][2] + nn[2] * R) * SCL]);
    NN.push(nn); S.push(i / NS + j / NR * 0.08);
  }
  const D = 5, SC = 26;
  return (t) => {
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if (((x >> 1) + y) % 4 === 0) g.set(x, y, "·", KEYS[24]);
    const m = mat(0.5 + 0.25 * Math.sin(t * 0.33), t * 0.45, t * 0.12);
    const flow = t * 0.05;
    for (let i = 0; i < P.length; i++) {
      const p = app(m, P[i]), nn = app(m, NN[i]);
      if (nn[2] > 0.3) continue;
      const k = D / (p[2] + D);
      const l = lit(nn, 0.14, 0.75, 30);
      const st = Math.floor((S[i] - flow) * 24 + 1000) & 1;
      g.setZ(cols / 2 + p[0] * k * SC, rows / 2 - p[1] * k * SC * 0.5, k, blk(l), KEYS[st * 12 + Math.min(11, Math.floor((0.05 + l * 0.95) * 12))]);
    }
    return g.frame();
  };
}
