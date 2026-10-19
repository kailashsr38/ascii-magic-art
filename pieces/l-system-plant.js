/* l-system-plant: a Lindenmayer system plant growing from the soil, swaying, blossoming, then regrowing. */
import { Grid, palette, gradient, KEYS, clamp } from "../lib/kit.js";

const STEM = gradient(["#5a3418", "#8a5a2a", "#6a8a2a", "#3aaa3a", "#6ade4a", "#b8ff7a"], 7); // 0-6 by branch depth
const pal = palette([...STEM, "#ff7ab6", "#ffd0e6", "#3a2414", "#6a4422", "#2a5a1e", "#0c1018", "#141a26"]);
// 7 blossom, 8 blossom light, 9 soil dark, a soil, b grass, c sky dark, d sky

export const meta = {
  slug: "l-system-plant",
  name: "L-System Plant",
  category: "algorithms",
  note: "A Lindenmayer system plant growing branch by branch from the soil, swaying in a breeze and blossoming before it regrows.",
  tags: ["fractal", "plant", "growth", "nature", "wallpaper"],
  cols: 80, rows: 38, fps: 24,
  palette: pal,
};

const VARIANTS = [
  { axiom: "X", rules: { X: "F+[[X]-X]-F[-X]+X", F: "FF" }, iter: 5, angle: 25 },
  { axiom: "X", rules: { X: "F[+X]F[-X]+X", F: "FF" }, iter: 6, angle: 21 },
  { axiom: "X", rules: { X: "F[+X][-X]FX", F: "FF" }, iter: 6, angle: 26 },
];
const GROW = 9, BLOOM = 3.5, P = GROW + BLOOM;
const QUAD = " ▘▝▀▖▌▞▛▗▚▐▜▄▙▟█";

function build(v) {
  let s = v.axiom;
  for (let i = 0; i < v.iter; i++) { let o = ""; for (const c of s) o += v.rules[c] || c; s = o; }
  const segs = [], tips = [];
  const st = [];
  let x = 0, y = 0, a = -Math.PI / 2, dist = 0, depth = 0;
  const da = (v.angle * Math.PI) / 180;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "F") { const nx = x + Math.cos(a), ny = y + Math.sin(a); segs.push([x, y, nx, ny, dist, depth]); x = nx; y = ny; dist++; }
    else if (c === "+") a += da;
    else if (c === "-") a -= da;
    else if (c === "[") { st.push([x, y, a, dist, depth]); depth++; }
    else if (c === "]") { [x, y, a, dist, depth] = st.pop(); }
    else if (c === "X" && s[i + 1] === "]") tips.push([x, y, dist]);
  }
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, maxD = 0, maxDepth = 0;
  for (const [ax, ay, bx, by, d, dp] of segs) {
    x0 = Math.min(x0, ax, bx); x1 = Math.max(x1, ax, bx); y0 = Math.min(y0, ay, by); y1 = Math.max(y1, ay, by);
    maxD = Math.max(maxD, d + 1); maxDepth = Math.max(maxDepth, dp);
  }
  return { segs, tips, x0, x1, y0, y1, maxD, maxDepth };
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const plants = VARIANTS.map(build);
  const DW = cols * 2, DH = (rows - 3) * 2; // quadrant blocks; plant laid out in column units (W = cols, H = DH)
  const mask = new Uint8Array(cols * rows), cc = new Uint8Array(cols * rows);
  const plot = (x, y, c) => {
    const ix = Math.round(x), iy = Math.round(y);
    if (ix < 0 || iy < 0 || ix >= DW || iy >= DH) return;
    const ci = (ix >> 1) + (iy >> 1) * cols;
    mask[ci] |= 1 << ((ix & 1) + (iy & 1) * 2); if (c >= cc[ci]) cc[ci] = c;
  };
  return (t) => {
    const cyc = Math.floor(t / P), c = t - cyc * P;
    const pl = plants[cyc % plants.length];
    const sc = Math.min((cols * 0.92) / (pl.x1 - pl.x0), (DH * 0.97) / (pl.y1 - pl.y0));
    const ox = cols / 2 - ((pl.x0 + pl.x1) / 2) * sc, oy = DH - 1 - pl.y1 * sc;
    const G = Math.pow(Math.min(1, c / GROW), 0.85) * pl.maxD + (c > GROW ? 1 : 0);
    const wind = Math.sin(t * 1.1) * 0.6 + Math.sin(t * 2.7) * 0.25;
    const H = (pl.y1 - pl.y0) * sc;
    const tx = (x, y) => { const h = clamp((DH - 1 - y) / H); return x + wind * 3.5 * h * h; };
    mask.fill(0); cc.fill(0);
    for (const [ax, ay, bx, by, d, dp] of pl.segs) {
      if (d >= G) continue;
      const f = Math.min(1, G - d);
      const sx = ax * sc + ox, sy = ay * sc + oy;
      const ex = (ax + (bx - ax) * f) * sc + ox, ey = (ay + (by - ay) * f) * sc + oy;
      const n = Math.max(1, Math.ceil(Math.hypot((ex - sx) * 2, ey - sy)));
      const col = Math.min(6, Math.round((dp / Math.max(1, pl.maxDepth)) * 6));
      for (let q = 0; q <= n; q++) { const y = sy + ((ey - sy) * q) / n, xx = tx(sx + ((ex - sx) * q) / n, y) * 2; plot(xx, y, col); if (dp < 2) plot(xx + 1, y, col); }
    }
    // sky, then the plant
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const i = x + y * cols;
      if (mask[i]) { g.ch[i] = QUAD[mask[i]]; g.co[i] = KEYS[cc[i]]; }
      else { g.ch[i] = (x * 3 + y * 7) % 11 === 0 ? "·" : " "; g.co[i] = y < rows / 2 ? "c" : "d"; }
    }
    // blossoms open on the tips once the plant is grown
    if (c > GROW * 0.8) {
      const k = clamp((c - GROW * 0.8) / 2);
      pl.tips.forEach(([x, y, d], i) => {
        if ((i * 7) % 5 > 1 || (i % 97) / 97 > k) return;
        const py = y * sc + oy, px = tx(x * sc + ox, py);
        g.set(px, py / 2, i % 3 ? "•" : "●", i % 2 ? "7" : "8");
      });
    }
    // soil and grass
    for (let x = 0; x < cols; x++) {
      g.set(x, rows - 3, (x * 5) % 3 ? "▄" : "▖", "b");
      g.set(x, rows - 2, "▓", (x * 7) % 5 ? "a" : "9");
      g.set(x, rows - 1, "▓", "9");
    }
    return g.frame();
  };
}
