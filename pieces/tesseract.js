/* tesseract: a 4D hypercube rotating through the fourth dimension, projected down to the screen. */
import { Grid, palette, gradient, KEYS } from "../lib/kit.js";

/* tiny 3D kit for this piece: view space has +z away from the viewer. */
const LIGHT = (() => { const v = [-0.72, 0.55, -0.42], l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; })();
/** Lambert plus a specular glint, 0..1, for a unit view-space normal. */
function lightOf(n, amb = 0.1, spec = 0.55, pw = 18) {
  const d = n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2];
  const rz = 2 * d * n[2] - LIGHT[2];
  const s = d > 0 && rz < 0 ? Math.pow(-rz, pw) : 0;
  return Math.min(1, amb + Math.max(0, d) * (1 - amb) * 0.78 + s * spec * 0.6);
}
/** Filled triangle in screen cells with a depth test; points are [x, y, depth], larger depth is nearer. */
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
const rx = ([x, y, z], a) => { const c = Math.cos(a), s = Math.sin(a); return [x, y * c - z * s, y * s + z * c]; };
const ry = ([x, y, z], a) => { const c = Math.cos(a), s = Math.sin(a); return [x * c + z * s, y, -x * s + z * c]; };
const rz = ([x, y, z], a) => { const c = Math.cos(a), s = Math.sin(a); return [x * c - y * s, x * s + y * c, z]; };
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
/** Draw a mesh: V in view space, F as index lists (fans), each face lit flat. Normals face away from the origin when orient is set. */
function mesh(g, V, F, P, paint, edgeCo, orient = true) {
  const S = V.map(P);
  for (let f = 0; f < F.length; f++) {
    const idx = F[f];
    let n = unit(cross(sub(V[idx[1]], V[idx[0]]), sub(V[idx[2]], V[idx[0]])));
    const c = [0, 0, 0];
    for (const i of idx) { c[0] += V[i][0] / idx.length; c[1] += V[i][1] / idx.length; c[2] += V[i][2] / idx.length; }
    if (orient && n[0] * c[0] + n[1] * c[1] + n[2] * c[2] < 0) n = [-n[0], -n[1], -n[2]];
    const [ch, co] = paint(lightOf(n), f, n);
    for (let i = 1; i + 1 < idx.length; i++) tri(g, S[idx[0]], S[idx[i]], S[idx[i + 1]], ch, co);
    if (edgeCo) for (let i = 0; i < idx.length; i++) {
      const a = S[idx[i]], b = S[idx[(i + 1) % idx.length]];
      seg(g, a, b, slopeChar(b[0] - a[0], b[1] - a[1]), edgeCo, 0.012);
    }
  }
}

const W = gradient(["#38e1ff", "#7a8cff", "#c45cff", "#ff5ad8"], 10);
export const meta = {
  slug: "tesseract",
  name: "Tesseract",
  category: "solids",
  note: "A four dimensional hypercube turning through the fourth axis, its inner and outer cubes swapping places as it projects down.",
  tags: ["3d", "4d", "hypercube", "math", "hero"],
  cols: 60, rows: 30, fps: 30,
  palette: palette([...W, "#ffffff", "#2f5a7a", "#6a3a7a"]),   // 0-9 by w, a vertex, b c dim
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const V4 = [];
  for (let i = 0; i < 16; i++) V4.push([i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1, i & 8 ? 1 : -1]);
  const E = [];
  for (let i = 0; i < 16; i++) for (let b = 0; b < 4; b++) { const j = i ^ (1 << b); if (j > i) E.push([i, j]); }
  const D = 6, SC = 13.5;
  const P = (v) => { const k = D / (v[2] + D); return [cols / 2 + v[0] * k * SC, rows / 2 - v[1] * k * SC * 0.5, k]; };
  return (t) => {
    g.clear();
    const a = t * 0.55, b = t * 0.31;
    const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
    const ws = [];
    const V = V4.map(([x, y, z, w]) => {
      // rotate in the xw and yz/zw planes
      let x1 = x * ca - w * sa, w1 = x * sa + w * ca;
      let z1 = z * cb - w1 * sb, w2 = z * sb + w1 * cb;
      ws.push(w2);
      const k4 = 2.6 / (3.2 - w2);
      return rx(ry([x1 * k4, y * k4, z1 * k4], t * 0.22 + 0.5), 0.38);
    });
    const S = V.map(P);
    const wk = (w) => KEYS[Math.max(0, Math.min(9, Math.round(((w + 1.75) / 3.5) * 9)))];
    // edges coloured by their position along w, dimmer on the far side
    for (const [i, j] of E) {
      const A = S[i], B = S[j];
      const ch = slopeChar(B[0] - A[0], B[1] - A[1]);
      const n = Math.max(1, Math.ceil(Math.max(Math.abs(B[0] - A[0]), Math.abs(B[1] - A[1])) * 1.5));
      for (let s = 0; s <= n; s++) {
        const f = s / n, z = A[2] + (B[2] - A[2]) * f, w = ws[i] + (ws[j] - ws[i]) * f;
        g.setZ(A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f, z, ch, z < 0.985 ? (w < 0 ? "b" : "c") : wk(w));
      }
    }
    for (let i = 0; i < 16; i++) g.setZ(S[i][0], S[i][1], S[i][2] + 0.05, "●", ws[i] > 0 ? "a" : wk(ws[i]));
    return g.frame();
  };
}
