/* voxel-heart: a heart built from small lit cubes, turning slowly and beating. */
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

const RED = gradient(["#1a0206", "#4a0612", "#8e0f24", "#d8223c", "#ff5a6a", "#ffb0b8", "#ffe8ea"], 14);
export const meta = {
  slug: "voxel-heart",
  name: "Voxel Heart",
  category: "solids",
  note: "A chunky heart built from small red cubes, turning slowly and giving a double beat every couple of seconds.",
  tags: ["3d", "heart", "voxel", "love", "valentine", "hero"],
  cols: 64, rows: 32, fps: 30,
  palette: palette([...RED, "#3a0a14", "#0e0a0e", "#170e14"]),
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const H = 7;
  const inside = (x, y, z) => {
    // the classic heart surface, z up
    const a = x * x + 2.25 * y * y + z * z - 1;
    return a * a * a - x * x * z * z * z - 0.1125 * y * y * z * z * z < 0;
  };
  const vox = new Set(), key = (i, j, k) => i + j * 64 + k * 4096;
  const S = 1.3 / 6.5;
  for (let i = -H - 1; i <= H + 1; i++) for (let j = -H - 1; j <= H + 1; j++) for (let k = -H - 1; k <= H + 1; k++) {
    if (inside(i * S, j * S, k * S * 1.05 + 0.08)) vox.add(key(i + 20, j + 20, k + 20));
  }
  // exposed faces only: [corner list, normal]
  const faces = [];
  const DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  for (const v of vox) {
    const i = (v % 64) - 20, j = (Math.floor(v / 64) % 64) - 20, k = Math.floor(v / 4096) - 20;
    for (const d of DIRS) {
      if (vox.has(key(i + d[0] + 20, j + d[1] + 20, k + d[2] + 20))) continue;
      // build the quad on that side
      const c = [i + d[0] * 0.5, j + d[1] * 0.5, k + d[2] * 0.5];
      const ax = d[0] ? [0, 1, 0] : [1, 0, 0], bx = d[2] ? [0, 1, 0] : [0, 0, 1];
      const u = d[1] ? [1, 0, 0] : ax, w = d[1] ? [0, 0, 1] : bx;
      const q = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([s1, s2]) => [c[0] + (u[0] * s1 + w[0] * s2) * 0.5, c[1] + (u[1] * s1 + w[1] * s2) * 0.5, c[2] + (u[2] * s1 + w[2] * s2) * 0.5]);
      faces.push({ q, n: d, par: (i + j + k) & 1 });
    }
  }
  const D = 34, SC = 30;
  return (t) => {
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if ((x * 3 + y * 5) % 11 === 0) g.set(x, y, "·", KEYS[14]);
    const ph = t % 1.6;
    const beat = 1 + 0.07 * Math.exp(-(((ph - 0.1) / 0.07) ** 2)) + 0.045 * Math.exp(-(((ph - 0.36) / 0.07) ** 2));
    // heart z (point down) maps to screen up: tilt so the point is at the bottom
    const m = mul(mat(0, t * 0.7, 0), mat(-Math.PI / 2, 0, 0));
    const sc = beat * 1.0;
    const P = (v) => { const k = D / (v[2] + D); return [cols / 2 + v[0] * k * SC / H * 0.98 * sc, rows / 2 + 1 - v[1] * k * SC / H * 0.49 * sc, k]; };
    for (const f of faces) {
      const n = app(m, f.n);
      if (n[2] > 0.01) continue;
      const l = lit(n, 0.2, 0.5, 20) * (f.par ? 0.8 : 1);
      const W = f.q.map((v) => P(app(m, v)));
      const li = Math.min(13, Math.floor((0.05 + l * 0.95) * 14));
      const ch = blk(l), co = KEYS[li];
      tri(g, W[0], W[1], W[2], ch, co); tri(g, W[0], W[2], W[3], ch, co);
    }
    return g.frame();
  };
}
