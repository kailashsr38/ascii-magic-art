/* gyroscope-rings: three nested gimbal rings turning on their pivots around a fast spinning rotor. */
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

const GOLD = gradient(["#1c1204", "#5a3c0c", "#b07a1c", "#f0c050", "#fff2c0", "#ffffff"], 12);
const STEEL = gradient(["#0c1016", "#2a3440", "#5c6c80", "#a8b8cc", "#eef4fa", "#ffffff"], 12);
const COP = gradient(["#1a0a06", "#5a2412", "#b0552c", "#f09a6a", "#ffe0cc", "#ffffff"], 12);
export const meta = {
  slug: "gyroscope-rings",
  name: "Gimbal Gyroscope",
  category: "solids",
  note: "A gyroscope of three nested gold, steel and copper rings, each turning on its own pivot around a fast spinning rotor disc.",
  tags: ["3d", "gyroscope", "rings", "gimbal", "loader", "hero"],
  cols: 70, rows: 36, fps: 30,
  palette: palette([...GOLD, ...STEEL, ...COP, "#0a0c12"]),
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  // a ring (torus) in the xy plane: major radius R, tube r
  const ring = (R, r, nu, nv) => {
    const P = [], N = [];
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
      const u = (i / nu) * TAU, v = (j / nv) * TAU;
      const n = [Math.cos(u) * Math.cos(v), Math.sin(u) * Math.cos(v), Math.sin(v)];
      P.push([Math.cos(u) * R + n[0] * r, Math.sin(u) * R + n[1] * r, n[2] * r * 1.6]); N.push(n);
    }
    return { P, N };
  };
  const rings = [ring(1.55, 0.09, 360, 14), ring(1.22, 0.09, 300, 14), ring(0.9, 0.09, 240, 14)];
  // rotor: a flat disc with a rim, plus an axle
  const rotor = { P: [], N: [], s: [] };
  for (let i = 0; i < 64; i++) for (let j = 0; j < 14; j++) {
    const a = (i / 64) * TAU, rr = 0.1 + (j / 13) * 0.55;
    for (const side of [-1, 1]) { rotor.P.push([Math.cos(a) * rr, Math.sin(a) * rr, side * 0.06]); rotor.N.push([0, 0, side]); rotor.s.push(Math.floor(i / 8) & 1); }
  }
  for (let i = 0; i < 80; i++) for (let j = 0; j < 4; j++) {
    const a = (i / 80) * TAU, z = -0.06 + j * 0.04;
    rotor.P.push([Math.cos(a) * 0.65, Math.sin(a) * 0.65, z]); rotor.N.push([Math.cos(a), Math.sin(a), 0]); rotor.s.push(2);
  }
  for (let j = 0; j < 40; j++) { rotor.P.push([0, 0, -0.95 + j * 0.0475]); rotor.N.push([0.7, 0.7, 0]); rotor.s.push(2); }
  const D = 6, SC = 16;
  const draw = (m, obj, fam, stripes) => {
    for (let i = 0; i < obj.P.length; i++) {
      const p = app(m, obj.P[i]);
      let n = app(m, obj.N[i]);
      if (n[2] > 0) n = [-n[0], -n[1], -n[2]];
      const k = D / (p[2] + D);
      let l = lit(n, 0.16, 0.7, 26);
      if (stripes && obj.s[i] === 1) l *= 0.62;
      const f = stripes && obj.s[i] === 2 ? 1 : fam;
      g.setZ(cols / 2 + p[0] * k * SC, rows / 2 - p[1] * k * SC * 0.5, k, blk(l), KEYS[f * 12 + Math.min(11, Math.floor((0.05 + l * 0.95) * 12))]);
    }
  };
  return (t) => {
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const d = Math.hypot((x - cols / 2) / 36, (y - rows / 2) / 18);
      if (d > 0.9 && ((x + y) & 1)) g.set(x, y, "░", KEYS[36]);
    }
    const view = mat(0.35, 0, 0);
    const a1 = t * 0.5, a2 = t * 0.83, a3 = t * 1.21;
    const mOuter = mul(view, mat(0, a1, 0));                       // outer ring turns on the vertical
    const mMid = mul(mOuter, mat(a2, Math.PI / 2, 0));             // middle ring pivots on the outer's horizontal pins
    const mIn = mul(mMid, mat(0, a3 * 0.6 + 0.6, 0));              // inner ring pivots inside the middle
    const mRot = mul(mIn, mat(0, Math.PI / 2, t * 9));             // rotor spins fast on the inner ring's axis
    draw(mOuter, rings[0], 0, false);
    draw(mMid, rings[1], 1, false);
    draw(mIn, rings[2], 2, false);
    draw(mRot, rotor, 0, true);
    // fixed stand: a post under the outer ring and a weighted foot
    const yb = Math.round(rows / 2 + 1.62 * SC * 0.5 * (D / (D + 0.0)) * Math.cos(0.35));
    for (let y = yb; y < rows - 2; y++) g.setZ(cols / 2, y, -1, "█", KEYS[16]), g.setZ(cols / 2 - 1, y, -1, "▓", KEYS[15]);
    for (let x = -9; x <= 9; x++) { g.setZ(cols / 2 + x, rows - 2, -1, "▀", KEYS[Math.abs(x) < 6 ? 17 : 15]); g.setZ(cols / 2 + x, rows - 1, -1, "▀", KEYS[14]); }
    return g.frame();
  };
}
