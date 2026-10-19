/* dragon-curve: a strip folded in half again and again, unfolding into the Heighway dragon. */
import { Grid, palette, gradient, KEYS } from "../lib/kit.js";

const HUES = gradient(["#ffffff", "#ffe45a", "#ff9a3a", "#ff4a6a", "#d04aff", "#6a6aff", "#3ab0ff", "#3affc0", "#8aff5a", "#ffe45a", "#ff9a3a", "#ff4a6a", "#d04aff"], 13);
const pal = palette([...HUES, "#16182a"]);
const BG = KEYS[13];

export const meta = {
  slug: "dragon-curve",
  name: "Dragon Curve",
  category: "algorithms",
  note: "A line folded in half over and over, each fold swinging out a new copy until the Heighway dragon appears.",
  tags: ["fractal", "folding", "math", "wallpaper"],
  cols: 84, rows: 36, fps: 30,
  palette: pal,
};

const STAGES = 12, FOLD = 1.05, HOLD = 2.5, START = 1;
const P = (STAGES - START) * FOLD + HOLD;
const QUAD = " ▘▝▀▖▌▞▛▗▚▐▜▄▙▟█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const DW = cols * 2, DH = rows * 2; // quadrant blocks: 2x2 per cell
  const MAXN = (1 << STAGES) + 1;
  const xs = new Float64Array(MAXN), ys = new Float64Array(MAXN), gen = new Uint8Array(MAXN);
  const ax = new Float64Array(MAXN), ay = new Float64Array(MAXN);
  const mask = new Uint8Array(cols * rows), cc = new Uint8Array(cols * rows);
  const plot = (x, y, c) => {
    const ix = x | 0, iy = y | 0;
    if (ix < 0 || iy < 0 || ix >= DW || iy >= DH) return;
    const ci = (ix >> 1) + (iy >> 1) * cols;
    mask[ci] |= 1 << ((ix & 1) + (iy & 1) * 2); cc[ci] = c;
  };
  return (t) => {
    const c = t % P;
    const k = Math.min(STAGES - 1, START + Math.floor(c / FOLD));
    const f = c >= (STAGES - START) * FOLD ? 1 : Math.min(1, ((c % FOLD) / FOLD) * 1.25);
    const ease = f * f * (3 - 2 * f);
    // build the curve up to stage k fully folded
    let n = 2;
    xs[0] = 0; ys[0] = 0; xs[1] = 1; ys[1] = 0; gen[0] = 0; gen[1] = 0;
    for (let s = 0; s < k; s++) {
      const px = xs[n - 1], py = ys[n - 1];
      for (let j = n - 2; j >= 0; j--) { const dx = xs[j] - px, dy = ys[j] - py; xs[n] = px - dy; ys[n] = py + dx; gen[n] = s + 1; n++; }
    }
    // the next fold, part way: a reversed copy swung about the end point
    let m = n;
    for (let i = 0; i < n; i++) { ax[i] = xs[i]; ay[i] = ys[i]; }
    const ang = (ease * Math.PI) / 2, ca = Math.cos(ang), sa = Math.sin(ang);
    const px = xs[n - 1], py = ys[n - 1];
    for (let j = n - 2; j >= 0; j--) { const dx = xs[j] - px, dy = ys[j] - py; ax[m] = px + dx * ca - dy * sa; ay[m] = py + dx * sa + dy * ca; gen[m] = k + 1; m++; }
    // fit to the dot canvas
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (let i = 0; i < m; i++) { if (ax[i] < x0) x0 = ax[i]; if (ax[i] > x1) x1 = ax[i]; if (ay[i] < y0) y0 = ay[i]; if (ay[i] > y1) y1 = ay[i]; }
    const CW = cols, CH = rows * 2;
    const sc = Math.min((CW - 3) / Math.max(1e-6, x1 - x0), (CH - 3) / Math.max(1e-6, y1 - y0));
    const ox = CW / 2 - ((x0 + x1) / 2) * sc, oy = CH / 2 - ((y0 + y1) / 2) * sc;
    mask.fill(0);
    for (let i = 0; i < m - 1; i++) {
      const sx = (ax[i] * sc + ox) * 2, sy = ay[i] * sc + oy, ex = (ax[i + 1] * sc + ox) * 2, ey = ay[i + 1] * sc + oy;
      const steps = Math.max(1, Math.ceil(Math.max(Math.abs(ex - sx), Math.abs(ey - sy))));
      const co = gen[Math.max(i, 1)];
      for (let q = 0; q <= steps; q++) plot(sx + ((ex - sx) * q) / steps, sy + ((ey - sy) * q) / steps, co);
    }
    g.clear();
    for (let i = 0; i < mask.length; i++) {
      if (mask[i]) { g.ch[i] = QUAD[mask[i]]; g.co[i] = KEYS[Math.min(12, cc[i])]; }
      else if ((i % cols + ((i / cols) | 0)) % 4 === 0) { g.ch[i] = "·"; g.co[i] = BG; }
    }
    return g.frame();
  };
}
