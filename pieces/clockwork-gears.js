/* clockwork-gears: a train of interlocking brass and steel gears turning at their true ratios. */
import { Grid, palette, gradient, KEYS, fbm, noise2, clamp, TAU } from "../lib/kit.js";

const PLATE = gradient(["#0e0c0a", "#1e1a16", "#2e2822", "#3e362c"], 6);    // 0-5
const BRASS = gradient(["#4a3010", "#8a6020", "#c8962e", "#f0c860", "#fff0b0"], 10); // 6-f
const COPPER = gradient(["#3a1608", "#7a3418", "#b85a30", "#e8905a", "#ffd0b0"], 10); // g-p
const STEEL = gradient(["#202630", "#4a5260", "#8a94a4", "#c8d0dc", "#f4f8ff"], 10);  // q-z
const pal = palette([...PLATE, ...BRASS, ...COPPER, ...STEEL, "#0a0806"]); // A hole shadow

export const meta = {
  slug: "clockwork-gears",
  name: "Clockwork Gears",
  category: "things",
  note: "A train of brass, copper and steel gears meshing tooth to gap and turning at their true ratios.",
  tags: ["gears", "machine", "steampunk", "loader", "wallpaper"],
  cols: 96, rows: 38, fps: 24,
  palette: pal,
};

const M = 1.7; // module: pitch radius = teeth * M / 2, in column units (rows count double)
// [teeth, parent index, direction from parent, metal base key index, spokes]
const SPEC = [
  [24, -1, 0, 6, 5],
  [12, 0, -0.35, 26, 0],
  [18, 1, 0.75, 16, 4],
  [10, 0, 2.7, 26, 0],
  [14, 2, -1.25, 6, 0],
  [16, 0, 1.75, 16, 4],
  [9, 2, 1.25, 26, 0],
];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  // lay out the train: each gear sits at the sum of pitch radii from its parent
  const gears = [];
  for (const [n, parent, dir, base, spokes] of SPEC) {
    const r = (n * M) / 2;
    let x = 28, y = 34;
    if (parent >= 0) { const p = gears[parent]; x = p.x + Math.cos(dir) * (p.r + r); y = p.y + Math.sin(dir) * (p.r + r); }
    gears.push({ n, r, x, y, parent, dir, base, spokes });
  }
  const plate = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const v = clamp(fbm(x * 0.05, y * 0.12, 4) * 0.8 + 0.1);
    const rivet = (x % 16 === 3 && y % 8 === 2);
    plate.push(rivet ? ["●", "3"] : [v > 0.55 ? "▒" : "░", KEYS[Math.min(5, Math.floor(v * 6))]]);
  }
  return (t) => {
    // angles: the driver turns steadily, every other gear follows tooth for gap
    gears[0].th = t * 0.45;
    for (let i = 1; i < gears.length; i++) {
      const G = gears[i], P = gears[G.parent];
      G.th = G.dir + Math.PI + (P.n * (G.dir - P.th) - Math.PI) / G.n;
    }
    for (let i = 0; i < plate.length; i++) { g.ch[i] = plate[i][0]; g.co[i] = plate[i][1]; }
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const sy = y * 2 + 1;
      for (const G of gears) {
        const dx = x + 0.5 - G.x, dy = sy - G.y;
        const d = Math.hypot(dx, dy);
        if (d > G.r + M * 0.6) continue;
        const a = Math.atan2(dy, dx);
        const tooth = Math.cos(G.n * (a - G.th));
        const edge = G.r + (tooth > 0 ? M * 0.55 : -M * 0.6);
        if (d > edge) continue;
        const rr = d / G.r;
        // spoke windows
        if (G.spokes && rr > 0.36 && rr < 0.72 && Math.cos(G.spokes * (a - G.th)) > -0.1) { g.set(x, y, "▓", "A"); break; }
        let l = 0.62 - (dx + dy * 0.6) / G.r * 0.3;
        if (d > G.r - M * 0.8) l -= 0.18;
        if (rr > 0.72 && rr < 0.8) l += 0.18;
        if (rr < 0.22) l = rr < 0.1 ? 0.95 : 0.3 + (0.22 - rr) * 2;
        l += (noise2(x * 0.5, y, 4) - 0.5) * 0.12;
        g.set(x, y, "█", KEYS[G.base + Math.min(9, Math.max(0, Math.floor(clamp(l) * 10)))]);
        break;
      }
    }
    return g.frame();
  };
}
