/* rotating-dodecahedron: a solid twelve-faced dodecahedron tumbling, each pentagon lit in its own colour. */
import { Grid, palette, gradient, KEYS } from "../lib/kit.js";

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

const FAM = [
  gradient(["#0b1a2a", "#174a6e", "#2f8fc4", "#8fd6ff", "#effaff"], 10),
  gradient(["#1e0d06", "#6a2a10", "#d0642a", "#ffb070", "#fff0e0"], 10),
  gradient(["#0c1e10", "#1e5a2c", "#3caa5a", "#a0eab0", "#f0fff2"], 10),
];
export const meta = {
  slug: "rotating-dodecahedron",
  name: "Dodecahedron",
  category: "solids",
  note: "A solid dodecahedron tumbling on three axes, its twelve pentagon faces lit in blue, amber and green with crisp edges.",
  tags: ["3d", "dodecahedron", "platonic", "loader", "hero"],
  cols: 64, rows: 32, fps: 30,
  palette: palette([...FAM[0], ...FAM[1], ...FAM[2], "#ffffff", "#c9d6e3"]),
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const p = (1 + Math.sqrt(5)) / 2, q = 1 / p;
  const V = [];
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) V.push([x, y, z]);
  for (const a of [-q, q]) for (const b of [-p, p]) { V.push([0, a, b]); V.push([a, b, 0]); V.push([b, 0, a]); }
  // faces: the five vertices nearest each icosahedron direction, sorted around it
  const dirs = [];
  for (const a of [-1, 1]) for (const b of [-p, p]) { dirs.push([0, b, a]); dirs.push([a, 0, b]); dirs.push([b, a, 0]); }
  const F = dirs.map((d) => {
    const n = unit(d);
    const ids = V.map((v, i) => [v[0] * n[0] + v[1] * n[1] + v[2] * n[2], i]).sort((A, B) => B[0] - A[0]).slice(0, 5).map((e) => e[1]);
    const u = unit(cross(n, Math.abs(n[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0])), w = cross(n, u);
    ids.sort((i, j) => Math.atan2(V[i][0] * w[0] + V[i][1] * w[1] + V[i][2] * w[2], V[i][0] * u[0] + V[i][1] * u[1] + V[i][2] * u[2])
      - Math.atan2(V[j][0] * w[0] + V[j][1] * w[1] + V[j][2] * w[2], V[j][0] * u[0] + V[j][1] * u[1] + V[j][2] * u[2]));
    return { ids, n };
  });
  // colour families so neighbours rarely match: opposite faces share a colour
  F.forEach((f, i) => (f.fam = Math.floor(i / 4) % 3));
  const D = 7, SC = 15.5;
  const P = (v) => { const k = D / (v[2] + D); return [cols / 2 + v[0] * k * SC * 0.98, rows / 2 - v[1] * k * SC * 0.5 * 0.98, k]; };
  return (t) => {
    g.clear();
    // backdrop: a soft dark vignette so the frame is never bare
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const d = Math.hypot((x - cols / 2) / cols, (y - rows / 2) / rows * 0.6);
      if (d > 0.36) g.set(x, y, "░", KEYS[0]);
    }
    const m = mat(t * 0.47 + 0.3, t * 0.71, t * 0.23);
    const W = V.map((v) => app(m, v));
    const S = W.map(P);
    for (const f of F) {
      const n = app(m, f.n);
      if (n[2] > 0.02) continue;
      const l = Math.min(0.9, lit(n, 0.32, 0.45, 26));
      const k = Math.min(8, Math.floor((0.1 + l * 0.9) * 9.4));
      const ch = blk(l), co = KEYS[f.fam * 10 + k];
      const id = f.ids;
      for (let i = 1; i + 1 < 5; i++) tri(g, S[id[0]], S[id[i]], S[id[i + 1]], ch, co);
      for (let i = 0; i < 5; i++) {
        const a = S[id[i]], b = S[id[(i + 1) % 5]];
        seg(g, a, b, slopeChar(b[0] - a[0], b[1] - a[1]), KEYS[l > 0.5 ? 30 : 31], 0.01);
      }
    }
    return g.frame();
  };
}
