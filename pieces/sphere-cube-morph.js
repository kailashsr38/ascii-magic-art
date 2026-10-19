/* sphere-cube-morph: a solid that swells from a ball into a cube and back while it turns, six faces in six colours. */
import { Grid, palette, gradient, KEYS, smooth, clamp } from "../lib/kit.js";

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

const HUES = [["#2a0608", "#e8443c", "#ffd0c8"], ["#2a1a00", "#f2a230", "#fff0c8"], ["#062010", "#38c060", "#d0ffd8"],
  ["#06142a", "#2f86e0", "#c8e4ff"], ["#1a062a", "#a050e0", "#ecd0ff"], ["#1a1a1c", "#c8c8cc", "#ffffff"]];
const FAMS = HUES.map((h) => gradient([h[0], h[1], h[2]], 8));
export const meta = {
  slug: "sphere-cube-morph",
  name: "Sphere to Cube Morph",
  category: "solids",
  note: "A turning solid that swells from a smooth ball into a sharp cube and back, each of its six sides painted its own colour.",
  tags: ["3d", "morph", "sphere", "cube", "loader", "hero"],
  cols: 64, rows: 32, fps: 30,
  palette: palette([...FAMS.flat(), "#0e0e14"]),
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  // sample the cube surface on a grid per face; keep both the cube point and its sphere twin
  const N = 70, Q = [], F = [];
  const AX = [[0, 1, 2, 1], [0, 1, 2, -1], [1, 2, 0, 1], [1, 2, 0, -1], [2, 0, 1, 1], [2, 0, 1, -1]];
  AX.forEach(([a, b, c, s], fi) => {
    for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) {
      const q = [0, 0, 0];
      q[a] = (i / N) * 2 - 1; q[b] = (j / N) * 2 - 1; q[c] = s;
      Q.push(q); F.push(fi);
    }
  });
  const shape = (q, m) => {
    const l = Math.hypot(q[0], q[1], q[2]);
    const r = lerp3(q.map((v) => v / l), q, m);
    return r;
  };
  const lerp3 = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  const D = 6, SC = 19.5;
  return (t) => {
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if ((x + 2 * y) % 6 === 0) g.set(x, y, "·", KEYS[48]);
    const ph = (t % 6) / 6;
    const mm = smooth(clamp(Math.abs(ph * 2 - 1) * 1.6 - 0.3));
    const size = lerp(1.0, 0.86, mm);
    const R = mat(t * 0.5 + 0.5, t * 0.7, 0.2);
    const e = 0.02;
    for (let i = 0; i < Q.length; i++) {
      const q = Q[i];
      const p = shape(q, mm);
      // normal by finite differences along the two face axes
      const [a, b] = AX[F[i]];
      const qa = q.slice(), qb = q.slice();
      qa[a] += e; qb[b] += e;
      let n = unit(cross(sub(shape(qa, mm), p), sub(shape(qb, mm), p)));
      if (n[0] * p[0] + n[1] * p[1] + n[2] * p[2] < 0) n = [-n[0], -n[1], -n[2]];
      const v = app(R, [p[0] * size, p[1] * size, p[2] * size]);
      const nn = app(R, n);
      if (nn[2] > 0) { nn[0] = -nn[0]; nn[1] = -nn[1]; nn[2] = -nn[2]; }
      const k = D / (v[2] + D);
      const l = lit(nn, 0.3, 0.55, 24);
      g.setZ(cols / 2 + v[0] * k * SC, rows / 2 - v[1] * k * SC * 0.5, k, blk(l), KEYS[F[i] * 8 + Math.min(7, Math.floor((0.06 + l * 0.94) * 8))]);
    }
    return g.frame();
  };
}
function lerp(a, b, f) { return a + (b - a) * f; }
