/* torus-knot: a glossy tube tied in a trefoil knot, turning slowly in space. */
import { Grid, palette, gradient, KEYS, TAU } from "../lib/kit.js";

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

const GLOW = gradient(["#14051f", "#4a0f5e", "#a8237a", "#ff5c7a", "#ffb36b", "#fff4d6"], 14);
export const meta = {
  slug: "torus-knot",
  name: "Torus Knot",
  category: "solids",
  note: "A glossy tube tied in a trefoil torus knot, turning slowly, lit and depth-sorted so it passes over and under itself.",
  tags: ["3d", "knot", "math", "loader", "hero"],
  cols: 64, rows: 32, fps: 30,
  palette: palette(GLOW),
};

const RAMP = ".:-=+*#%@";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const C = (s) => { const r = 2 + Math.cos(3 * s); return [r * Math.cos(2 * s) / 3, Math.sin(3 * s) / 3 * 1.1, r * Math.sin(2 * s) / 3]; };
  const NS = 1100, NR = 22, TR = 0.18;
  const pts = [];
  for (let i = 0; i < NS; i++) {
    const s = (i / NS) * TAU;
    const c = C(s), T = unit(sub(C(s + 0.001), C(s - 0.001)));
    const N1 = unit(cross(T, [0, 1, 0])), N2 = cross(T, N1);
    for (let j = 0; j < NR; j++) {
      const a = (j / NR) * TAU, ca = Math.cos(a), sa = Math.sin(a);
      const n = [N1[0] * ca + N2[0] * sa, N1[1] * ca + N2[1] * sa, N1[2] * ca + N2[2] * sa];
      pts.push(c[0] + n[0] * TR, c[1] + n[1] * TR, c[2] + n[2] * TR, n[0], n[1], n[2]);
    }
  }
  const D = 5, SC = 24;
  return (t) => {
    g.clear();
    const A = t * 0.45, B = 1.2 + Math.sin(t * 0.3) * 0.25;
    const cA = Math.cos(A), sA = Math.sin(A), cB = Math.cos(B), sB = Math.sin(B);
    for (let i = 0; i < pts.length; i += 6) {
      // rotate about y by A then about x by B, for point and normal
      let x = pts[i] * cA + pts[i + 2] * sA, z = -pts[i] * sA + pts[i + 2] * cA, y = pts[i + 1];
      const y2 = y * cB - z * sB, z2 = y * sB + z * cB;
      let nx = pts[i + 3] * cA + pts[i + 5] * sA, nz = -pts[i + 3] * sA + pts[i + 5] * cA, ny = pts[i + 4];
      const ny2 = ny * cB - nz * sB, nz2 = ny * sB + nz * cB;
      if (nz2 > 0.35) continue;                    // facing away, skip early
      const k = D / (z2 + D);
      const l = lightOf([nx, ny2, nz2], 0.22, 0.8, 24);
      g.setZ(cols / 2 + x * k * SC, rows / 2 - y2 * k * SC * 0.5, k, RAMP[Math.min(8, Math.floor((0.1 + l * 0.9) * 9))], KEYS[Math.min(13, Math.floor((0.1 + l * 0.9) * 14))]);
    }
    return g.frame();
  };
}
