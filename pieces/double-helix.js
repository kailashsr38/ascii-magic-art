/* double-helix: two glossy strands twisting around each other, joined by coloured base pairs. */
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

const SA = gradient(["#071a33", "#174f8f", "#3d9bff", "#bfe2ff"], 10);
const SB = gradient(["#331407", "#8f3f17", "#ff8a3d", "#ffe0bf"], 10);
const PAIRS = ["#7ee787", "#ff7b72", "#ffd166", "#d2a8ff"];
export const meta = {
  slug: "double-helix",
  name: "Double Helix",
  category: "solids",
  note: "Two glossy strands twisting around each other like DNA, joined by coloured base pairs and depth-sorted as they turn.",
  tags: ["3d", "dna", "science", "loader", "hero"],
  cols: 52, rows: 36, fps: 30,
  palette: palette([...SA, ...SB, ...PAIRS]),   // 0-9 blue strand, a-j orange strand, k-n pairs
};

const RAMP = ".:-=+*#%@";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const R = 0.85, TR = 0.17, TW = 1.75, Y0 = -2.05, Y1 = 2.05, OFF = Math.PI * 0.82;
  const NS = 520, NR = 14;
  const D = 6, SC = 16;
  const P = (v) => { const k = D / (v[2] + D); return [cols / 2 + v[0] * k * SC, rows / 2 - v[1] * k * SC * 0.5, k]; };
  return (t) => {
    g.clear();
    const spin = t * 0.9, tilt = 0.12;
    const ct = Math.cos(tilt), st = Math.sin(tilt);
    const view = ([x, y, z]) => [x * ct - y * st, x * st + y * ct, z];   // gentle lean
    for (let strand = 0; strand < 2; strand++) {
      const base = strand ? 10 : 0;
      for (let i = 0; i <= NS; i++) {
        const y = Y0 + ((Y1 - Y0) * i) / NS;
        const a = y * TW + spin + strand * OFF;
        const c = [Math.cos(a) * R, y, Math.sin(a) * R];
        // tube around the curve: radial and a vertical-ish binormal
        const rad = [Math.cos(a), 0, Math.sin(a)];
        const tan = unit([-Math.sin(a) * R * TW, 1, Math.cos(a) * R * TW]);
        const bin = cross(tan, rad);
        for (let j = 0; j < NR; j++) {
          const b = (j / NR) * TAU, cb = Math.cos(b), sb = Math.sin(b);
          const n = view([rad[0] * cb + bin[0] * sb, rad[1] * cb + bin[1] * sb, rad[2] * cb + bin[2] * sb]);
          if (n[2] > 0.3) continue;
          const p = view([c[0] + (rad[0] * cb + bin[0] * sb) * TR, c[1] + (rad[1] * cb + bin[1] * sb) * TR, c[2] + (rad[2] * cb + bin[2] * sb) * TR]);
          const s = P(p), l = lightOf(n, 0.22, 0.8, 20);
          g.setZ(s[0], s[1], s[2], RAMP[Math.min(8, Math.floor((0.1 + l * 0.9) * 9))], KEYS[base + Math.min(9, Math.floor((0.1 + l * 0.9) * 10))]);
        }
      }
    }
    // base pairs: rungs from one strand to the other, two colours meeting in the middle
    for (let r = 0; r < 18; r++) {
      const y = Y0 + 0.11 + r * 0.225;
      const a = y * TW + spin;
      const A = view([Math.cos(a) * R, y, Math.sin(a) * R]), B = view([Math.cos(a + OFF) * R, y, Math.sin(a + OFF) * R]);
      const sa = P(A), sb = P(B);
      const kind = (r * 7 + 3) % 4, k1 = KEYS[20 + kind], k2 = KEYS[20 + (kind ^ 1)];
      const n = Math.max(2, Math.ceil(Math.abs(sb[0] - sa[0]) * 1.5));
      for (let s = 1; s < n; s++) {
        const f = s / n;
        g.setZ(sa[0] + (sb[0] - sa[0]) * f, sa[1] + (sb[1] - sa[1]) * f, sa[2] + (sb[2] - sa[2]) * f - 0.004, "=", f < 0.5 ? k1 : k2);
      }
    }
    return g.frame();
  };
}
