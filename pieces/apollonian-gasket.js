/* apollonian-gasket: an Apollonian gasket of shaded pearls, the camera gliding in toward a tangency point and back out. */
import { Grid, palette, gradient, KEYS, clamp, TAU } from "../lib/kit.js";

const RAMPS = [
  ["#1a0a3a", "#3a1a7a", "#6a3ac0", "#a87af0", "#e8d8ff"],
  ["#0a2a3a", "#145a7a", "#2a9ac0", "#7ad8f0", "#e0faff"],
  ["#3a0a1a", "#7a1a3a", "#c03a6a", "#f08aa8", "#ffe0ea"],
  ["#2a2008", "#6a5014", "#b08a2a", "#f0c860", "#fff4d0"],
];
const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
RAMPS.forEach((r, i) => add("r" + i, gradient(r, 6)));
add("ring", ["#2a2a40", "#6a6a90"]);
add("gap", ["#05050a", "#0a0a14"]);

export const meta = {
  slug: "apollonian-gasket",
  name: "Apollonian Gasket",
  category: "algorithms",
  note: "An Apollonian gasket of shaded pearls, every gap filled by smaller tangent circles, while the view glides in toward a tangency point and back out.",
  tags: ["fractal", "circles", "geometry", "zoom", "wallpaper", "hero"],
  cols: 96, rows: 36, fps: 30,
  palette: palette(all),
};

const K = (n, i) => KEYS[G[n] + i];
const SH = "░▒▓█";
const P = 24;

function gasket(minR) {
  // circles as [k, x, y, gen]; k is signed curvature, the outer circle has k = -1
  const out = [];
  const O = [-1, 0, 0, 0], A = [2, 0.5, 0, 1], B = [2, -0.5, 0, 1], C = [3, 0, 2 / 3, 2], D = [3, 0, -2 / 3, 2];
  out.push(A, B, C, D);
  const refl = (c1, c2, c3, old, gen) => {
    const k = 2 * (c1[0] + c2[0] + c3[0]) - old[0];
    const kx = 2 * (c1[0] * c1[1] + c2[0] * c2[1] + c3[0] * c3[1]) - old[0] * old[1];
    const ky = 2 * (c1[0] * c1[2] + c2[0] * c2[2] + c3[0] * c3[2]) - old[0] * old[2];
    return [k, kx / k, ky / k, gen];
  };
  const rec = (c1, c2, c3, old, depth) => {
    const n = refl(c1, c2, c3, old, depth);
    if (1 / n[0] < minR || out.length > 9000) return;
    out.push(n);
    rec(c1, c2, n, c3, depth + 1); rec(c1, c3, n, c2, depth + 1); rec(c2, c3, n, c1, depth + 1);
  };
  rec(O, A, C, B, 3); rec(O, B, C, A, 3); rec(A, B, C, O, 3);
  rec(O, A, D, B, 3); rec(O, B, D, A, 3); rec(A, B, D, O, 3);
  out.sort((a, b) => a[0] - b[0]);
  return out;
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const C = gasket(0.0016);
  // zoom target: a small pearl tucked into a gap, surrounded by ever smaller ones
  let tx = 0, ty = 0, bd = 1e9;
  for (const [k, x, y] of C) {
    const r = 1 / k;
    if (r < 0.012 || r > 0.02) continue;
    const d = Math.hypot(x - 0.32, y - 0.42);
    if (d < bd) { bd = d; tx = x; ty = y; }
  }
  return (t) => {
    const ph = (1 - Math.cos((t / P) * TAU)) / 2;
    const zoom = Math.exp(ph * Math.log(26));
    const fx = tx * (1 - 1 / zoom), fy = ty * (1 - 1 / zoom);
    const rot = Math.sin((t / P) * TAU) * 0.5;
    const cr = Math.cos(rot), sr = Math.sin(rot);
    const S = rows * 0.49 * zoom; // world unit in rows (x doubles)
    g.clear(" ", " ");
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) g.set(x, y, (x + y) & 1 ? "·" : " ", K("gap", 1));
    for (let i = 0; i < C.length; i++) {
      const [k, wx, wy, gen] = C[i];
      const r = 1 / k;
      const rs = r * S;
      if (rs < 0.35) continue;
      const dx0 = wx - fx, dy0 = wy - fy;
      const sx = cols / 2 + (dx0 * cr - dy0 * sr) * S * 2, sy = rows / 2 + (dx0 * sr + dy0 * cr) * S;
      if (sx + rs * 2 < 0 || sx - rs * 2 > cols || sy + rs < 0 || sy - rs > rows) continue;
      const ramp = "r" + (gen % 4);
      const x0 = Math.max(0, Math.floor(sx - rs * 2)), x1 = Math.min(cols - 1, Math.ceil(sx + rs * 2));
      const y0 = Math.max(0, Math.floor(sy - rs)), y1 = Math.min(rows - 1, Math.ceil(sy + rs));
      if (rs < 0.8) { g.set(sx, sy, rs < 0.55 ? "•" : "●", K(ramp, 3)); continue; }
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const u = (x + 0.5 - sx) / (rs * 2), v = (y + 0.5 - sy) / rs;
        const d2 = u * u + v * v;
        if (d2 > 1) continue;
        // pearl shading lit from the upper left
        const z = Math.sqrt(1 - d2);
        const l = clamp(0.25 + 0.75 * (-u * 0.45 - v * 0.55 + z * 0.7));
        if (rs > 2 && 1 - Math.sqrt(d2) < 0.9 / rs) { g.set(x, y, "▒", K("ring", 1)); continue; }
        g.set(x, y, SH[Math.min(3, Math.floor(l * 4))], K(ramp, Math.min(5, Math.floor(l * 6))));
      }
    }
    return g.frame();
  };
}
