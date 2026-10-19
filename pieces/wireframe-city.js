/* wireframe-city: a night flight down an avenue through a wireframe city, glowing edges racing past. */
import { Grid, palette, gradient, KEYS, rng } from "../lib/kit.js";

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

const EDGE = gradient(["#0a2a3a", "#0e5a6e", "#18a0b8", "#4ee6f0", "#c8ffff"], 10);
const EDGE2 = gradient(["#2a0a30", "#5a1468", "#a02ab8", "#e85ae8", "#ffc8ff"], 10);
const SKY = gradient(["#02030a", "#060a1c", "#0e1430", "#1c1640", "#341848"], 6);
export const meta = {
  slug: "wireframe-city",
  name: "Wireframe City Flyby",
  category: "solids",
  note: "A night flight down a long avenue between wireframe towers, cyan and magenta edges racing past over a gridded street.",
  tags: ["3d", "wireframe", "city", "flyover", "synthwave", "hero"],
  cols: 100, rows: 34, fps: 30,
  palette: palette([...EDGE, ...EDGE2, ...SKY, "#04060e", "#070a16", "#121c36"]),
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const BL = 7, NB = 24;       // block length along the avenue; blocks in the repeating strip
  const r = rng(12);
  const towers = [];
  for (let j = 0; j < NB; j++) for (const side of [-1, 1]) for (let lane = 0; lane < 3; lane++) {
    const w = 2 + r() * 2.2, dpt = 2.4 + r() * 2.8;
    const h = lane === 0 ? 3 + r() * 9 : 6 + r() * 16;
    towers.push({ x: side * (5 + lane * 6.5 + r() * 1.5), z: j * BL + r() * 2, w, d: dpt, h, hue: r() < 0.3 ? 1 : 0 });
  }
  const LEN = NB * BL;
  const FOC = 30, HOR = 12;
  const P = (v) => { const z = Math.max(0.05, v[2]); return [cols / 2 + (v[0] / z) * FOC, HOR - (v[1] / z) * FOC * 0.5, 1 / z]; };
  const FACES = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [3, 2, 6, 7], [1, 2, 6, 5], [0, 3, 7, 4]];
  const EDGES = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
  return (t) => {
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      if (y <= HOR) g.set(x, y, y > HOR - 3 ? "▒" : "░", KEYS[20 + Math.min(5, Math.floor((y / HOR) * 6))]);
      else g.set(x, y, "░", KEYS[27]);
    }
    const camZ = t * 8, camY = 3.2 + 0.6 * Math.sin(t * 0.4), camX = 0.8 * Math.sin(t * 0.3);
    // street grid lines
    for (let k = 0; k < 40; k++) {
      const zw = Math.ceil(camZ / 2) * 2 + k * 2, z = zw - camZ;
      if (z < 0.6) continue;
      const a = P([-60 - camX, -camY, z]), b = P([60 - camX, -camY, z]);
      seg(g, a, b, "─", KEYS[Math.max(0, 4 - Math.floor(z / 14))], -1);
    }
    for (let lx = -36; lx <= 36; lx += 4) {
      const a = P([lx - camX, -camY, 0.8]), b = P([lx - camX, -camY, 90]);
      seg(g, a, b, lx === 0 ? "┊" : slopeChar(b[0] - a[0], b[1] - a[1]), KEYS[lx === 0 ? 13 : 2], -1);
    }
    const tilt = 0.04 * Math.sin(t * 0.3);
    for (const tw of towers) {
      let z = ((tw.z - camZ) % LEN + LEN) % LEN;
      if (z < 1.2 || z > 95) continue;
      const x0 = tw.x - camX - tw.w / 2, x1 = x0 + tw.w, y0 = -camY, y1 = tw.h - camY, z0 = z, z1 = z + tw.d;
      const V = [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]]
        .map(([x, y, zz]) => [x + y * tilt, y - x * tilt, zz]);
      const S = V.map(P);
      for (const f of FACES) { tri(g, S[f[0]], S[f[1]], S[f[2]], "░", KEYS[28]); tri(g, S[f[0]], S[f[2]], S[f[3]], "░", KEYS[28]); }
      const bright = Math.max(0, Math.min(9, Math.floor(10 - z / 9)));
      for (const [a, b] of EDGES) seg(g, S[a], S[b], slopeChar(S[b][0] - S[a][0], S[b][1] - S[a][1]), KEYS[tw.hue * 10 + bright], 0.004);
      // floor lines on the face toward the avenue
      const near = tw.x < 0 ? [1, 5] : [0, 4];
      for (let fy = 2.5; fy < tw.h - 0.5; fy += 2.5) {
        const a = P([V[near[0]][0], fy - camY, z0]), b = P([V[near[1]][0], fy - camY, z1]);
        seg(g, a, b, "·", KEYS[tw.hue * 10 + Math.max(0, bright - 3)], 0.002);
      }
    }
    return g.frame();
  };
}
