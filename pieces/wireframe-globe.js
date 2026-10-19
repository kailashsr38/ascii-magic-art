/* wireframe-globe: a latitude and longitude wire sphere turning on a tilted axis. */
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

const FRONT = gradient(["#1f6f5a", "#3fbf8f", "#9ff5cf", "#eafff5"], 8);
export const meta = {
  slug: "wireframe-globe",
  name: "Wireframe Globe",
  category: "solids",
  note: "A wire sphere of latitude and longitude lines turning on a tilted axis, near lines bright and far lines dim behind.",
  tags: ["3d", "globe", "world", "loader", "hero"],
  cols: 60, rows: 30, fps: 30,
  palette: palette([...FRONT, "#173a4a", "#0e2230", "#0a1820", "#ffd166"]),   // 0-7 front, 8 back, 9 shell, a shell dark, b equator
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = cols / 2, cy = rows / 2, RR = 13.4, RC = RR * 2;
  // points along every wire, in the globe's own frame, tagged as latitude or longitude
  const wires = [];
  for (let la = -60; la <= 60; la += 30) {
    const phi = (la * Math.PI) / 180, n = Math.ceil(260 * Math.cos(phi)) + 20;
    for (let i = 0; i < n; i++) { const a = (i / n) * TAU; wires.push(Math.cos(phi) * Math.cos(a), Math.sin(phi), Math.cos(phi) * Math.sin(a), -Math.sin(a), 0, Math.cos(a), la === 0 ? 2 : 0); }
  }
  for (let lo = 0; lo < 180; lo += 30) {
    const th = (lo * Math.PI) / 180;
    for (let i = 0; i < 260; i++) { const b = (i / 260) * TAU; wires.push(Math.cos(b) * Math.cos(th), Math.sin(b), Math.cos(b) * Math.sin(th), -Math.sin(b) * Math.cos(th), Math.cos(b), -Math.sin(b) * Math.sin(th), 1); }
  }
  const tilt = 0.41, ct = Math.cos(tilt), st = Math.sin(tilt);
  return (t) => {
    g.clear();
    // a faint shell so the globe reads as a ball
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const nx = (x + 0.5 - cx) / RC, ny = -(y + 0.5 - cy) / RR, r2 = nx * nx + ny * ny;
      if (r2 < 1) { const l = lightOf([nx, ny, -Math.sqrt(1 - r2)], 0, 0, 1); g.setZ(x, y, -1, l > 0.45 ? "░" : " ", l > 0.6 ? "9" : "a"); }
    }
    const A = t * 0.6, cA = Math.cos(A), sA = Math.sin(A);
    for (let i = 0; i < wires.length; i += 7) {
      const x0 = wires[i] * cA + wires[i + 2] * sA, z = -wires[i] * sA + wires[i + 2] * cA, y0 = wires[i + 1];
      const x = x0 * ct - y0 * st, y = x0 * st + y0 * ct;        // tilt the axis
      const tx0 = wires[i + 3] * cA + wires[i + 5] * sA, ty0 = wires[i + 4];
      const tx = tx0 * ct - ty0 * st, ty = tx0 * st + ty0 * ct;
      const sx = cx + x * RC, sy = cy - y * RR, kind = wires[i + 6];
      if (z < 0) {
        const f = Math.min(7, Math.floor((-z * 0.75 + 0.25) * 8));
        g.setZ(sx, sy, 2 - z, slopeChar(tx * RC, -ty * RR), kind === 2 ? "b" : KEYS[f]);
      } else g.setZ(sx, sy, 1 - z, "·", "8");
    }
    return g.frame();
  };
}
