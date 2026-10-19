/* spinning-coin: a gold coin with a raised star spinning on its edge above its own shadow. */
import { Grid, palette, gradient, KEYS, TAU, clamp } from "../lib/kit.js";

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

const GOLD = gradient(["#1a0e02", "#4a2c06", "#8a5a10", "#c8901c", "#f0c040", "#ffe48a", "#fff8dc", "#ffffff"], 16);
export const meta = {
  slug: "spinning-coin",
  name: "Spinning Gold Coin",
  category: "solids",
  note: "A thick gold coin with a raised star and a ridged rim spinning on its edge, its shadow stretching and shrinking on the floor below.",
  tags: ["3d", "coin", "gold", "loader", "game", "reward"],
  cols: 56, rows: 30, fps: 30,
  palette: palette([...GOLD, "#0c0b10", "#16141c", "#201d28"]),
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const R = 1, TH = 0.16;
  // a five-pointed star as a polar radius test
  const inStar = (x, y) => {
    const a = Math.atan2(y, x) + Math.PI / 2, r = Math.hypot(x, y);
    const k = (((a / TAU) * 5) % 1 + 1) % 1;
    const lim = 0.28 + 0.34 * Math.abs(k - 0.5) * 2;
    return r < lim;
  };
  const P = [], N = [], F = [];
  const NR = 34, NA = 150;
  for (const side of [-1, 1]) {
    for (let i = 0; i <= NR; i++) for (let j = 0; j < NA; j++) {
      const r = (i / NR) * R, a = (j / NA) * TAU;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      const rim = r > 0.84;
      const star = inStar(x, side * y);
      const groove = r > 0.78 && r <= 0.84;
      const z = side * (TH + (rim ? 0.05 : star ? 0.045 : groove ? -0.02 : 0));
      let n = [0, 0, side];
      if (star) n = unit([x * 0.9, y * 0.9, side]);   // a domed star catches the light
      if (groove) n = unit([-x * 0.5, -y * 0.5, side]);
      P.push([x, y, z]); N.push(n); F.push(star || rim ? 1 : 0.7);
    }
  }
  // the ridged edge
  for (let j = 0; j < 260; j++) for (let k = 0; k < 9; k++) {
    const a = (j / 260) * TAU, z = -TH - 0.05 + (k / 8) * (TH + 0.05) * 2;
    const ridge = (j & 1) ? 1 : 0.86;
    P.push([Math.cos(a) * R, Math.sin(a) * R, z]); N.push([Math.cos(a) * ridge, Math.sin(a) * ridge, 0]); F.push(1);
  }
  const D = 6, SC = 21, cy = rows / 2 - 2;
  return (t) => {
    g.clear();
    // floor gradient so the frame is never empty
    for (let y = rows - 7; y < rows; y++) for (let x = 0; x < cols; x++) g.set(x, y, "░", KEYS[17]);
    const spin = t * 1.9 + 0.6;
    const bob = Math.sin(t * 1.2) * 0.6;
    // shadow: an ellipse whose width follows the coin's projected width
    const w = Math.max(0.12, Math.abs(Math.cos(spin))) * 15 + 3;
    for (let y = rows - 6; y < rows - 1; y++) for (let x = 0; x < cols; x++) {
      const d = Math.hypot((x + 0.5 - cols / 2) / w, (y + 0.5 - (rows - 3.5)) / 1.8);
      if (d < 1) g.set(x, y, d < 0.6 ? "▓" : "▒", KEYS[16]);
    }
    const m = mat(0.12, spin, 0.06 * Math.sin(t));
    for (let i = 0; i < P.length; i++) {
      const p = app(m, P[i]);
      let n = app(m, N[i]);
      const k = D / (p[2] + D);
      if (n[2] > 0.0) continue;
      const l = lit(n, 0.18, 0.95, 18) * F[i];
      g.setZ(cols / 2 + p[0] * k * SC, cy + bob - p[1] * k * SC * 0.5, k, blk(l), KEYS[Math.min(15, Math.floor((0.08 + l * 0.92) * 16))]);
    }
    return g.frame();
  };
}
