/* klein-bottle: the classic bottle-shaped Klein bottle, its neck passing through its own side, turning slowly. */
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

const OUT = gradient(["#140620", "#3c1260", "#7a2aa8", "#c46ae0", "#f4c8ff", "#ffffff"], 12);
const INN = gradient(["#04161a", "#0c3e48", "#1a7a84", "#4cc4c4", "#b8f4ee", "#ffffff"], 12);
export const meta = {
  slug: "klein-bottle",
  name: "Klein Bottle",
  category: "solids",
  note: "A Klein bottle turning slowly, its narrow neck curling back through the side to join the base, the two sides of the one surface lit violet and teal.",
  tags: ["3d", "klein", "topology", "math", "hero"],
  cols: 72, rows: 36, fps: 30,
  palette: palette([...OUT, ...INN, "#0a0612", "#120a1e"]),
};

function bottle(u, v) {
  const cu = Math.cos(u), su = Math.sin(u), cv = Math.cos(v), sv = Math.sin(v);
  const c2 = cu * cu, c3 = c2 * cu, c4 = c2 * c2, c5 = c4 * cu, c6 = c4 * c2, c7 = c6 * cu;
  const x = -(2 / 15) * cu * (3 * cv - 30 * su + 90 * c4 * su - 60 * c6 * su + 5 * cu * cv * su);
  const y = -(1 / 15) * su * (3 * cv - 3 * c2 * cv - 48 * c4 * cv + 48 * c6 * cv - 60 * su + 5 * cu * cv * su
    - 5 * c3 * cv * su - 80 * c5 * cv * su + 80 * c7 * cv * su);
  const z = (2 / 15) * (3 + 5 * cu * su) * sv;
  return [x, y, z];
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const NU = 230, NV = 70;
  const pts = [], nrm = [], par = [];
  let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
  for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) {
    const u = ((i + 0.5) / NU) * Math.PI, v = (j / NV) * TAU;
    const p = bottle(u, v), e = 1e-3;
    const du = sub(bottle(u + e, v), bottle(u - e, v)), dv = sub(bottle(u, v + e), bottle(u, v - e));
    pts.push(p); nrm.push(unit(cross(du, dv))); par.push(u / Math.PI);
    for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], p[k]); mx[k] = Math.max(mx[k], p[k]); }
  }
  const c = [(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2];
  const sc = 2 / Math.max(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]);
  for (const p of pts) for (let k = 0; k < 3; k++) p[k] = (p[k] - c[k]) * sc;
  const D = 6, SC = 31;
  return (t) => {
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if ((x + y * 3) % 7 === 0) g.set(x, y, "·", KEYS[24]);
    // bottle stands upright (its y axis), swings on y and rocks a little
    const m = mul(mat(0.22 + 0.1 * Math.sin(t * 0.4), 0, 0.08 * Math.sin(t * 0.31)), mat(0, t * 0.6, 0));
    for (let i = 0; i < pts.length; i++) {
      const p = app(m, pts[i]);
      let n = app(m, nrm[i]);
      let side = 0;
      if (n[2] > 0) { n = [-n[0], -n[1], -n[2]]; side = 1; }
      const k = D / (p[2] + D);
      const sx = cols / 2 + p[0] * k * SC, sy = rows / 2 - p[1] * k * SC * 0.5;
      const l = lit(n, 0.2, 0.6, 24);
      const band = (Math.floor(par[i] * 18) & 1) ? 0.9 : 1;
      const li = Math.min(11, Math.floor((0.06 + l * band * 0.94) * 12));
      g.setZ(sx, sy, k, blk(l * band), KEYS[side * 12 + li]);
    }
    return g.frame();
  };
}
