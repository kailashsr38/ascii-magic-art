/* photosynthesis-leaf: light, carbon dioxide and water going into a leaf, glucose and oxygen coming out. */
import { Grid, palette, gradient, KEYS, fbm, clamp, fract } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("sky", gradient(["#0c2440", "#123458", "#1a4670", "#245a86"], 5));
add("leaf", gradient(["#0f3d18", "#18602a", "#25803a", "#3aa048", "#62c25a", "#9adf72"], 8));
add("vein", ["#b8e890", "#e2ffb8"]);
add("stem", ["#4a7a2a", "#6a9a3a"]);
add("sun", ["#ff9a1e", "#ffd23a", "#fff4b0"]);
add("co2", ["#c8ccd4", "#ffffff"]);
add("o2", ["#4ee0ff", "#b8f6ff"]);
add("h2o", ["#3a8cff", "#9cc8ff"]);
add("glu", ["#ffa63a", "#ffd890"]);
add("ui", ["#e6edf3", "#8b949e", "#ffe066", "#0b1a2a"]);
add("soil", gradient(["#2a1a0e", "#4a301a", "#6a4626"], 3));

export const meta = {
  slug: "photosynthesis-leaf",
  name: "Photosynthesis Leaf",
  category: "science",
  note: "Sunlight, carbon dioxide and water flow into a leaf while glucose travels down the stem and oxygen drifts out, above the balanced equation.",
  tags: ["photosynthesis", "biology", "plants", "education", "science", "classroom"],
  cols: 96, rows: 30, fps: 20,
  palette: palette(all),
};

const K = (n, i = 0) => KEYS[G[n] + i];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const X0 = 28, X1 = 82, LEN = X1 - X0;
  const mid = (x) => 15 - 3 * ((x - X0) / LEN);
  const half = (x) => { const u = (x - X0) / LEN; return u <= 0 || u >= 1 ? 0 : 8 * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.8)), 0.85); };
  const tex = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) tex[x + y * cols] = fbm(x * 0.14, y * 0.3, 3, 2);
  // water/glucose path: up the stem then along the midrib
  const path = [];
  for (let y = 27; y >= 16; y--) path.push([20 + (27 - y) * 0.75, y]);
  for (let x = X0 + 1; x < X1 - 4; x++) path.push([x, mid(x)]);
  const at = (p) => path[Math.min(path.length - 1, Math.floor(p * path.length))];
  const top = (x) => Math.round(mid(x) - half(x)), bot = (x) => Math.round(mid(x) + half(x));
  return (t) => {
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = tex[x + y * cols];
      if (y >= 27) g.set(x, y, v > 0.5 ? "▓" : "▒", K("soil", Math.min(2, Math.floor(v * 3))));
      else g.set(x, y, v > 0.6 ? "▒" : "░", K("sky", Math.min(4, Math.floor(v * 4 + (y / 27) * 1.5))));
    }
    // sun
    for (let y = 0; y < 9; y++) for (let x = 0; x < 18; x++) {
      const d = Math.hypot(x - 7, (y - 3) * 2);
      if (d < 4.5) g.set(x, y, "█", K("sun", d < 2.5 ? 2 : 1));
      else if (d < 7 && (Math.round(Math.atan2(y - 3, x - 7) * 2.6) & 1)) g.set(x, y, "·", K("sun", 0));
    }
    // stem
    for (let y = 16; y < rows; y++) { const x = Math.round(20 + (27 - y) * 0.75); g.text(x - 1, y, "▐█▌", K("stem", y & 1)); }
    // leaf
    for (let x = X0; x <= X1; x++) {
      const h = half(x), c = mid(x);
      for (let y = Math.floor(c - h); y <= Math.ceil(c + h); y++) {
        const d = Math.abs(y - c);
        if (d > h) continue;
        const edge = h - d < 1;
        const vein = Math.abs(((x - X0 - d * 2.4) % 8 + 8) % 8) < 1 && d > 0.6;
        const v = tex[x + y * cols];
        if (d < 0.5) g.set(x, y, "═", K("vein", 1));
        else if (vein) g.set(x, y, d * 2.4 > 0 ? "╱" : "─", K("vein", 0));
        else g.set(x, y, edge ? "█" : v > 0.55 ? "▓" : "▒", K("leaf", clamp(Math.floor((edge ? 1 : 3) + v * 4 - (y > c ? 1 : 0)), 0, 7)));
      }
      // lower side veins point the other way
      for (let y = Math.ceil(c + 1); y < c + h - 0.5; y++) {
        const d = y - c;
        if (Math.abs(((x - X0 - d * 2.4) % 8 + 8) % 8) < 1) g.set(x, y, "╲", K("vein", 0));
      }
    }
    // light rays
    for (let k = 0; k < 7; k++) {
      const tx = 40 + k * 5, ty = top(tx) - 1;
      const p = fract(t * 0.6 + k * 0.37);
      const x = 10 + (tx - 10) * p, y = 4 + (ty - 4) * p;
      g.set(x, y, "●", K("sun", 2)); g.set(x - (tx - 10) * 0.04, y - (ty - 4) * 0.04, "•", K("sun", 1));
    }
    // carbon dioxide drifting in from the upper right
    for (let k = 0; k < 5; k++) {
      const p = fract(t * 0.12 + k / 5);
      if (p > 0.9) continue;
      const tx = 58 + k * 4, ty = top(tx) - 1;
      const x = 92 - (92 - tx) * p, y = 3 + k * 0.5 + (ty - 3 - k * 0.5) * p;
      g.text(Math.round(x) - 1, y, "CO2", K("co2", p > 0.6 ? 1 : 0));
    }
    // oxygen leaving from the underside
    for (let k = 0; k < 5; k++) {
      const p = fract(t * 0.13 + k / 5 + 0.1);
      const sx = 50 + k * 5, sy = bot(sx) + 1;
      const x = sx + (93 - sx) * p, y = sy + (22 + (k % 3) - sy) * p;
      g.text(Math.round(x), y, "O2", K("o2", p < 0.4 ? 1 : 0));
    }
    // water up, glucose down
    for (let k = 0; k < 9; k++) {
      const [x, y] = at(fract(t * 0.1 + k / 9));
      g.set(x, y, "●", K("h2o", 1));
    }
    for (let k = 0; k < 6; k++) {
      const [x, y] = at(1 - fract(t * 0.08 + k / 6 + 0.05));
      g.set(x, y, "◆", K("glu", 1));
    }
    // labels
    g.text(19, 1, "LIGHT ENERGY", K("ui", 2));
    g.text(70, 0, "CARBON DIOXIDE IN ↙", K("ui", 0));
    g.text(70, 25, "OXYGEN OUT ↘", K("o2", 1));
    g.text(25, 25, "● WATER UP FROM ROOTS", K("h2o", 1));
    g.text(25, 26, "◆ GLUCOSE TO THE PLANT", K("glu", 1));
    g.text(44, 10, "CHLOROPLASTS", K("ui", 0));
    const eq = " 6 CO2 + 6 H2O + light → C6H12O6 + 6 O2 ";
    g.text(50, 28, eq, K("ui", 0));
    g.text(50, 29, " carbon dioxide + water  → glucose + oxygen", K("ui", 1));
    g.text(1, 28, "PHOTOSYNTHESIS", K("ui", 2));
    return g.frame();
  };
}
