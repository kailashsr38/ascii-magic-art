/* spirograph: hypotrochoid curves drawn by a rolling wheel, layered in colour, then wiped for a new set. */
import { Grid, palette } from "../lib/kit.js";

const pal = palette([
  "#ff5a9a", "#3ad0ff", "#ffd23f", "#7dff8a", "#b07aff", "#ff8a3a", // 0-5 inks
  "#5a6080", "#2a2e48", "#ffffff",                                 // 6 gear, 7 ring, 8 pen
]);

export const meta = {
  slug: "spirograph",
  name: "Spirograph",
  category: "algorithms",
  note: "A toothed wheel rolls inside a ring, its pen tracing hypotrochoid curves layered in colour, then a fresh set begins.",
  tags: ["hypotrochoid", "curves", "math", "loader"],
  cols: 80, rows: 36, fps: 30,
  palette: pal,
};

// [R, r, d]: integer R and r so every curve closes
const SETS = [
  [[8, 5, 4.2], [7, 3, 4.5], [11, 7, 3.2]],
  [[9, 4, 3.4], [10, 3, 2.5], [13, 8, 6]],
  [[12, 5, 4.5], [7, 2, 2.6], [11, 4, 5.5]],
];
const DRAW = 4.4, HOLD = 2.6;
const P = DRAW * 3 + HOLD;
const QUAD = " ▘▝▀▖▌▞▛▗▚▐▜▄▙▟█";
const gcd = (a, b) => (b ? gcd(b, a % b) : a);

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const DW = cols * 2, DH = rows * 2, CX = cols / 2, CY = rows, RAD = rows - 1.5;
  // pre-rasterise every curve into an ordered list of dots
  const curves = SETS.map((set, si) => set.map(([R, r, d], ci) => {
    const turns = r / gcd(R, r);
    const k = RAD / (R - r + d);
    const n = Math.floor(700 * turns);
    const dots = [];
    let lx = null, ly = null;
    for (let i = 0; i <= n; i++) {
      const th = (i / n) * turns * Math.PI * 2;
      const x = CX + ((R - r) * Math.cos(th) + d * Math.cos(((R - r) / r) * th)) * k;
      const y = CY + ((R - r) * Math.sin(th) - d * Math.sin(((R - r) / r) * th)) * k;
      if (lx !== null) {
        const st = Math.max(1, Math.ceil(Math.hypot((x - lx) * 2, y - ly)));
        for (let q = 1; q <= st; q++) dots.push([lx + ((x - lx) * q) / st, ly + ((y - ly) * q) / st, th]);
      } else dots.push([x, y, th]);
      lx = x; ly = y;
    }
    return { R, r, d, k, dots, col: String((si * 3 + ci) % 6) };
  }));
  const mask = new Uint8Array(cols * rows), cc = new Array(cols * rows).fill("0");
  const dot = (x, y, c) => {
    const ix = Math.floor(x * 2), iy = Math.floor(y);
    if (ix < 0 || iy < 0 || ix >= DW || iy >= DH) return;
    const ci = (ix >> 1) + (iy >> 1) * cols;
    mask[ci] |= 1 << ((ix & 1) + (iy & 1) * 2); cc[ci] = c;
  };
  return (t) => {
    const cyc = Math.floor(t / P), c = t - cyc * P;
    const set = curves[cyc % curves.length];
    mask.fill(0);
    let cur = null, curIdx = 0;
    for (let i = 0; i < 3; i++) {
      const s = set[i];
      const f = Math.min(1, Math.max(0, (c - i * DRAW) / DRAW));
      if (f <= 0) continue;
      const m = Math.floor(f * (s.dots.length - 1));
      for (let j = 0; j <= m; j++) dot(s.dots[j][0], s.dots[j][1], s.col);
      if (f < 1) { cur = s; curIdx = m; }
    }
    g.clear();
    for (let i = 0; i < mask.length; i++) if (mask[i]) { g.ch[i] = QUAD[mask[i]]; g.co[i] = cc[i]; }
    // the fixed ring and, while drawing, the rolling wheel with its pen arm
    const ringR = cur ? cur.R * cur.k : RAD;
    for (let a = 0; a < 360; a += 2) {
      const x = CX + Math.cos((a * Math.PI) / 180) * (ringR + 1), y = (CY + Math.sin((a * Math.PI) / 180) * (ringR + 1)) / 2;
      if (g.get(x, y) === " ") g.set(x, y, "·", "7");
    }
    if (cur) {
      const [px, py, th] = cur.dots[curIdx];
      const wx = CX + (cur.R - cur.r) * cur.k * Math.cos(th), wy = CY + (cur.R - cur.r) * cur.k * Math.sin(th);
      const wr = cur.r * cur.k;
      for (let a = 0; a < 360; a += 6) {
        const x = wx + Math.cos((a * Math.PI) / 180) * wr, y = (wy + Math.sin((a * Math.PI) / 180) * wr) / 2;
        if (g.get(x, y) === " ") g.set(x, y, "·", "6");
      }
      g.line(wx, wy / 2, px, py / 2, (x, y) => (g.get(x, y) === " " ? "·" : g.get(x, y)), "6");
      g.set(wx, wy / 2, "+", "6");
      g.set(px, py / 2, "●", "8");
    }
    return g.frame();
  };
}
