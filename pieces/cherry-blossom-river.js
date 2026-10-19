/* cherry-blossom-river: a river running under cherry blossom trees, petals drifting down and floating away. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, TAU } from "../lib/kit.js";

const P = [];
const grp = (hexes) => {
  const o = P.length, n = hexes.length;
  P.push(...hexes);
  return (v) => KEYS[o + (v <= 0 ? 0 : v >= 1 ? n - 1 : Math.floor(v * n))];
};
const SKY = grp(gradient(["#8fb8e8", "#bcd4f0", "#f2d6e4", "#ffe8ee"], 8));
const HILL = grp(["#9fb4cc", "#b8c6d8"]);
const BLOSSOM = grp(gradient(["#7a2c50", "#c25486", "#ee8cb4", "#ffc4dc", "#fff2f8"], 12));
const TRUNK = grp(["#2a1418", "#4a2a2a"]);
const GRASS = grp(gradient(["#2e5a2a", "#4f8a3a", "#86b850", "#b8d878"], 8));
const WATER = grp(gradient(["#1e4a78", "#3a72a8", "#6aa0d0", "#a8cff0"], 8));
const PINKW = grp(["#b0607e", "#e094b4"]);
const PETAL = grp(["#ff9cc4", "#ffd6e6", "#ffffff"]);

export const meta = {
  slug: "cherry-blossom-river",
  name: "Cherry Blossom River",
  category: "landscapes",
  note: "A quiet river flows beneath rows of cherry blossom trees as pink petals drift down and float away.",
  tags: ["spring", "sakura", "river", "flowers", "wallpaper", "hero"],
  cols: 96, rows: 36, fps: 20,
  palette: palette(P),
};

const SH = "░▒▓█";
const sh = (v) => SH[v <= 0 ? 0 : v >= 1 ? 3 : Math.floor(v * 4)];
const HZ = 12;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(31);
  const cxAt = (y) => 48 + (y - HZ) * 0.6 + Math.sin((y - HZ) * 0.12) * 3;
  const hwAt = (y) => 0.8 + (y - HZ) * 1.25;
  // trees along both banks, far to near: [x, baseY, radius]
  const trees = [];
  for (let k = 0; k < 9; k++) {
    const y = HZ + 1 + Math.pow(k / 8, 1.6) * 21;
    for (const side of [-1, 1]) {
      const rad = 1.8 + (y - HZ) * 0.75;
      trees.push([cxAt(y) + side * (hwAt(y) + 2 + rad * 0.5), y, rad, r() * 9]);
    }
  }
  trees.sort((a, b) => a[1] - b[1]);
  const water = new Int8Array(cols * rows);
  for (let y = HZ + 1; y < rows; y++) for (let x = 0; x < cols; x++) if (Math.abs(x - cxAt(y)) < hwAt(y)) water[x + y * cols] = 1;
  const falling = Array.from({ length: 70 }, () => [r() * cols, r() * rows, 1.5 + r() * 2, r() * TAU, Math.floor(r() * 3)]);
  const floating = Array.from({ length: 40 }, () => [r() * 2 - 1, r(), r() * TAU]);

  return (t) => {
    g.clear();
    // sky and far hills
    for (let y = 0; y <= HZ; y++) for (let x = 0; x < cols; x++) {
      const hill = HZ - 2 - 2.5 * fbm(x * 0.05, 3, 3, 4);
      if (y >= hill) { g.set(x, y, "▓", HILL(y > hill + 1 ? 1 : 0)); continue; }
      const v = clamp(y / HZ + (fbm(x * 0.04 - t * 0.04, y * 0.25, 3, 1) - 0.5) * 0.4);
      g.set(x, y, v > 0.4 ? "█" : "▓", SKY(v));
    }
    // banks and water
    for (let y = HZ + 1; y < rows; y++) {
      const cx = cxAt(y), hw = hwAt(y), d = (y - HZ) / (rows - HZ);
      for (let x = 0; x < cols; x++) {
        if (water[x + y * cols]) {
          const edge = hw - Math.abs(x - cx);
          const flow = fbm(x * 0.12 / (0.3 + d), y * 0.5 - t * 1.4, 3, 7);
          if (edge < 1.2 + d * 3 && flow > 0.38) g.set(x, y, flow > 0.55 ? "▓" : "▒", PINKW(flow > 0.55 ? 1 : 0));
          else {
            const v = clamp(0.2 + d * 0.35 + (flow - 0.5) * 0.9);
            g.set(x, y, flow > 0.62 ? "≈" : sh(0.6 + v * 0.4), WATER(v));
          }
        } else {
          const n = fbm(x * 0.15, y * 0.4, 3, 5);
          const v = clamp(0.25 + d * 0.4 + (n - 0.5) * 0.7);
          g.set(x, y, n > 0.6 ? "▓" : "█", GRASS(v));
          if (n > 0.68 && (x * 7 + y * 3) % 5 === 0) g.set(x, y, "▓", PETAL(0));
        }
      }
    }
    // trees: trunk then a blossom cloud that breathes in the breeze
    for (const [tx, ty, rad, s] of trees) {
      const trunkH = rad * 0.55;
      for (let j = 0; j < trunkH + 1; j++) {
        const y = ty - j, lean = Math.sin(s) * j * 0.15;
        for (let w = 0; w < Math.max(1, rad * 0.12); w++) g.set(tx + lean + w, y, "█", TRUNK(j % 2));
      }
      const cy = ty - trunkH - rad * 0.35;
      const x0 = Math.floor(tx - rad * 1.3), x1 = Math.ceil(tx + rad * 1.3);
      const y0 = Math.floor(cy - rad * 0.6), y1 = Math.ceil(cy + rad * 0.45);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        if (x < 0 || x >= cols || y < 0 || y >= rows) continue;
        const dx = (x - tx) / (rad * 1.25), dy = (y - cy) / (rad * 0.55);
        const sway = Math.sin(t * 1.2 + s + y * 0.3) * 0.08;
        const n = fbm(x * 0.35 / Math.sqrt(rad) + s + sway, y * 0.7 / Math.sqrt(rad) + t * 0.05, 3, 21);
        const dd = Math.hypot(dx, dy) - (n - 0.5) * 0.9;
        if (dd > 1) continue;
        const lit = clamp(0.35 + (n - 0.5) * 1.4 - dy * 0.3 + (1 - dd) * 0.15);
        g.set(x, y, sh(0.55 + lit * 0.5), BLOSSOM(lit));
      }
    }
    // petals floating downstream on the water
    for (const [u, p, ph] of floating) {
      const s = (t * 0.06 + p) % 1, y = HZ + 1 + s * s * (rows - HZ - 1);
      const x = cxAt(y) + u * hwAt(y) * 0.85 + Math.sin(t + ph) * 0.6;
      if (water[Math.floor(x) + Math.floor(y) * cols]) g.set(x, y, s > 0.4 ? "█" : "▓", PETAL(1));
    }
    // petals falling through the air
    for (const [x0, y0, sp, ph, c] of falling) {
      const y = (y0 + t * sp) % rows;
      const x = (((x0 + t * 2.5 + Math.sin(t * 1.7 + ph) * 2) % cols) + cols) % cols;
      g.set(x, y, c === 0 ? "█" : "▓", PETAL(c === 2 ? 2 : c));
    }
    return g.frame();
  };
}
