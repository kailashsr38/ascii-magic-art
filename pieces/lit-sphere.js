/* lit-sphere: a shaded ball with a rotating striped surface, a glint and a soft floor shadow. */
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

const H1 = gradient(["#2a0608", "#8a1a1e", "#e8443c", "#ffb0a0"], 8);
const H2 = gradient(["#2a2200", "#8a6a00", "#f2c230", "#fff0b0"], 8);
const H3 = gradient(["#061428", "#14407a", "#2f86e0", "#a8d4ff"], 8);
const WH = gradient(["#26262a", "#7a7a80", "#d8d8dc", "#ffffff"], 8);
export const meta = {
  slug: "lit-sphere",
  name: "Lit Sphere",
  category: "solids",
  note: "A shaded ball with red, yellow and blue panels turning on a tilted axis, with a bright glint and a soft floor shadow.",
  tags: ["3d", "sphere", "ball", "loader", "hero"],
  cols: 60, rows: 30, fps: 30,
  palette: palette([...H1, ...H2, ...H3, ...WH, "#141418", "#1e1e24"]),   // 0-7 red, 8-f yellow, g-n blue, o-v white, w x shadow
};

const RAMP = ".:-=+*#%@";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = cols / 2, cy = 13.5, RR = 12.2, RC = RR * 2;
  const tilt = 0.42;
  const ct = Math.cos(tilt), st = Math.sin(tilt);
  return (t) => {
    g.clear();
    // floor shadow
    const sy = cy + RR + 1.6;
    for (let y = Math.floor(sy - 2); y < rows; y++) for (let x = 0; x < cols; x++) {
      const d = Math.hypot((x + 0.5 - cx - 3) / (RC * 0.85), (y + 0.5 - sy) / 2.2);
      if (d < 1) g.set(x, y, d < 0.6 ? "▒" : "░", d < 0.6 ? "x" : "w");
    }
    const spin = t * 0.9, cs = Math.cos(spin), ss = Math.sin(spin);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const nx = (x + 0.5 - cx) / RC, ny = -(y + 0.5 - cy) / RR;
      const r2 = nx * nx + ny * ny;
      if (r2 >= 1) continue;
      const nz = -Math.sqrt(1 - r2);
      const l = lightOf([nx, ny, nz], 0.24, 0.9, 30);
      // into the ball's own frame: undo tilt (about z), then spin (about y)
      const px = nx * ct + ny * st, py = -nx * st + ny * ct, pz = nz;
      const ox = px * cs - pz * ss, oz = px * ss + pz * cs;
      const lat = Math.asin(Math.max(-1, Math.min(1, py)));
      let lon = Math.atan2(oz, ox); if (lon < 0) lon += TAU;
      let base;
      if (Math.abs(lat) > 1.15) base = 24;
      else base = [0, 8, 16][Math.floor((lon / TAU) * 6) % 3];
      const edge = Math.abs(((lon / TAU) * 6) % 1 - 0.5) > 0.47 && Math.abs(lat) < 1.15;
      if (edge) base = 24;
      const ch = edge ? "░▒▓█"[Math.min(3, Math.floor(l * 4))] : RAMP[Math.min(8, Math.floor((0.1 + l * 0.9) * 9))];
      g.set(x, y, ch, KEYS[base + Math.min(7, Math.floor((0.08 + l * 0.92) * 8))]);
    }
    return g.frame();
  };
}
