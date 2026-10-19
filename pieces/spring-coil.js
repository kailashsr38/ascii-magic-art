/* spring-coil: a steel coil spring hanging from a beam, bouncing a weight as it turns. */
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

const STEEL = gradient(["#0b1016", "#26323f", "#566a80", "#a7bccf", "#f2f8ff"], 12);
const BRASS = gradient(["#1a1410", "#4a3a2a", "#8f7558", "#d8c3a0"], 8);
export const meta = {
  slug: "spring-coil",
  name: "Spring Coil",
  category: "solids",
  note: "A steel coil spring hanging from a beam, stretching and recoiling under a turning weight, lit with a bright metallic glint.",
  tags: ["3d", "spring", "physics", "loader", "hero"],
  cols: 50, rows: 34, fps: 30,
  palette: palette([...STEEL, ...BRASS]),   // 0-b steel, c-j brass weight and beam
};

const RAMP = ".:-=+*#%@";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const R = 0.85, TR = 0.15, TURNS = 5, NS = 640, NR = 12;
  const D = 6, SC = 15;
  const P = (v) => { const k = D / (v[2] + D); return [cols / 2 + v[0] * k * SC, rows / 2 - v[1] * k * SC * 0.5, k]; };
  const ring = [];
  for (let j = 0; j < NR; j++) ring.push([Math.cos((j / NR) * TAU), Math.sin((j / NR) * TAU)]);
  const BOX = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
  const BOXF = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [2, 3, 7, 6], [1, 2, 6, 5], [0, 3, 7, 4]];
  return (t) => {
    g.clear();
    const bounce = Math.sin(t * 2.2);
    const yTop = 1.5;
    const H = 2.35 + bounce * 0.5;                      // spring length, the weight pulls it down
    const yBot = yTop - H;
    const A = t * 0.5, tilt = 0.24;
    const cA = Math.cos(A), sA = Math.sin(A), cT = Math.cos(tilt), sT = Math.sin(tilt);
    const view = (x, y, z) => { const x1 = x * cA + z * sA, z1 = -x * sA + z * cA; return [x1, y * cT - z1 * sT, y * sT + z1 * cT]; };
    const span = TURNS * TAU;
    for (let i = 0; i <= NS; i++) {
      const s = (i / NS) * span;
      const y = yTop - (H * i) / NS;
      const ca = Math.cos(s), sa = Math.sin(s);
      const tan = unit([-sa * R, -H / span, ca * R]);
      const rad = [ca, 0, sa];
      const bin = cross(tan, rad);
      for (const [cb, sb] of ring) {
        const nx = rad[0] * cb + bin[0] * sb, ny = rad[1] * cb + bin[1] * sb, nz = rad[2] * cb + bin[2] * sb;
        const n = view(nx, ny, nz);
        if (n[2] > 0.3) continue;
        const p = view(ca * R + nx * TR, y + ny * TR, sa * R + nz * TR);
        const sc = P(p), l = lightOf(n, 0.2, 1.0, 30);
        g.setZ(sc[0], sc[1], sc[2], RAMP[Math.min(8, Math.floor((0.1 + l * 0.9) * 9))], KEYS[Math.min(11, Math.floor((0.08 + l * 0.92) * 12))]);
      }
    }
    // the ceiling it hangs from
    const beam = Math.max(1, Math.floor(P(view(0, yTop, 0))[1] - (R * sT + TR + 0.12) * SC * 0.55) - 1);
    for (let x = 4; x < cols - 4; x++) g.set(x, beam, "▀", "f");
    for (let x = 6; x < cols - 6; x += 3) g.set(x, beam - 1, "╱", "d");
    // the weight on the end, a small lit block that turns with the spring
    const cen = view(0, yBot - 0.34, 0);
    const V = BOX.map(([x, y, z]) => view(x * 0.6, y * 0.32, z * 0.6));
    for (const f of BOXF) {
      let n = unit(cross(sub(V[f[1]], V[f[0]]), sub(V[f[2]], V[f[0]])));
      const c = f.reduce((m, i) => [m[0] + V[i][0], m[1] + V[i][1], m[2] + V[i][2]], [0, 0, 0]);
      if (n[0] * c[0] + n[1] * c[1] + n[2] * c[2] < 0) n = [-n[0], -n[1], -n[2]];
      const l = lightOf(n, 0.2, 0.6, 16);
      const S = f.map((i) => P([V[i][0] + cen[0], V[i][1] + cen[1], V[i][2] + cen[2]]));
      const ch = RAMP[Math.min(8, Math.floor((0.15 + l * 0.85) * 9))], co = KEYS[12 + Math.min(7, Math.floor((0.15 + l * 0.85) * 8))];
      tri(g, S[0], S[1], S[2], ch, co); tri(g, S[0], S[2], S[3], ch, co);
    }
    return g.frame();
  };
}
