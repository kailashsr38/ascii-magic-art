/* puzzle-cube-turns: a three by three colour puzzle cube turning its layers, scrambling and then solving itself. */
import { Grid, palette, gradient, KEYS, smooth } from "../lib/kit.js";

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

const ST = [["#3a0606", "#e02a2a", "#ffb0a8"], ["#3a1a00", "#ff8a1a", "#ffd8a8"], ["#0a2a0a", "#2ab04a", "#b8f8c0"],
  ["#06143a", "#2a6ae8", "#b8d4ff"], ["#3a3200", "#f2d020", "#fff6b0"], ["#2a2a2e", "#e8e8ec", "#ffffff"]];
const FAM = ST.map((s) => gradient(s, 7));
const BODY = gradient(["#060608", "#141418", "#26262c", "#3a3a42"], 4);
export const meta = {
  slug: "puzzle-cube-turns",
  name: "Puzzle Cube Turns",
  category: "solids",
  note: "A three by three colour puzzle cube turning while its layers twist one quarter turn at a time, scrambling and then solving itself.",
  tags: ["3d", "cube", "puzzle", "loader", "game", "hero"],
  cols: 64, rows: 32, fps: 30,
  palette: palette([...FAM.flat(), ...BODY, "#0c0c12"]),
};

const DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const MOVES = [[1, 1, 1], [0, -1, 1], [2, 1, -1], [1, -1, -1], [0, 1, 1], [2, -1, 1], [1, 1, -1], [0, -1, -1]];

function axisRot(ax, a) { return mat(ax === 0 ? a : 0, ax === 1 ? a : 0, ax === 2 ? a : 0); }

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const home = [];
  for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) home.push([x, y, z]);
  const SEQ = [...MOVES, ...MOVES.slice().reverse().map(([a, l, d]) => [a, l, -d])];
  const DUR = 0.75, NM = SEQ.length;
  const ID = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  const quadF = (c, d, s) => {
    const ax = d[0] ? [0, 1, 0] : [1, 0, 0], bx = d[2] ? [0, 1, 0] : d[0] ? [0, 0, 1] : [0, 0, 1];
    const u = d[1] ? [1, 0, 0] : ax, w = d[1] ? [0, 0, 1] : (d[0] ? [0, 0, 1] : [0, 1, 0]);
    return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [c[0] + d[0] * s[0] + (u[0] * a + w[0] * b) * s[1], c[1] + d[1] * s[0] + (u[1] * a + w[1] * b) * s[1], c[2] + d[2] * s[0] + (u[2] * a + w[2] * b) * s[1]]);
  };
  const D = 9, SC = 11;
  const P = (v) => { const k = D / (v[2] + D); return [cols / 2 + v[0] * k * SC * 1.0, rows / 2 + 0.5 - v[1] * k * SC * 0.5, k]; };
  return (t) => {
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if ((x + y * 2) % 5 === 0) g.set(x, y, "·", KEYS[46]);
    const step = Math.floor(t / DUR), fr = smooth(Math.min(1, ((t % DUR) / DUR) * 1.25));
    const done = step % NM;
    const R = home.map(() => ID);
    const inLayer = (i, ax, l) => Math.round(app(R[i], home[i])[ax]) === l;
    for (let s = 0; s < done; s++) {
      const [ax, l, d] = SEQ[s];
      const q = axisRot(ax, (d * Math.PI) / 2).map(Math.round);
      for (let i = 0; i < home.length; i++) if (inLayer(i, ax, l)) R[i] = mul(q, R[i]);
    }
    const [cax, cl, cd] = SEQ[done];
    const part = axisRot(cax, (cd * Math.PI) / 2 * fr);
    const view = mul(mat(-0.52, 0, 0), mat(0, t * 0.35 + 0.6, 0));
    for (let i = 0; i < home.length; i++) {
      const M = mul(view, inLayer(i, cax, cl) ? mul(part, R[i]) : R[i]);
      const h = home[i];
      DIRS.forEach((d, di) => {
        const n = app(M, d);
        if (n[2] > 0.02) return;
        const l = lit(n, 0.25, 0.5, 20);
        const body = quadF(h, d, [0.5, 0.5]).map((v) => P(app(M, v)));
        const bc = KEYS[42 + Math.min(3, Math.floor(l * 4))];
        tri(g, body[0], body[1], body[2], "█", bc); tri(g, body[0], body[2], body[3], "█", bc);
        const outer = (d[0] && h[0] === d[0]) || (d[1] && h[1] === d[1]) || (d[2] && h[2] === d[2]);
        if (!outer) return;
        const st = quadF(h, d, [0.505, 0.4]).map((v) => P(app(M, v)));
        const co = KEYS[di * 7 + Math.min(6, Math.floor((0.1 + l * 0.9) * 7))], ch = blk(0.15 + l);
        tri(g, st[0], st[1], st[2], ch, co); tri(g, st[0], st[2], st[3], ch, co);
      });
    }
    return g.frame();
  };
}
