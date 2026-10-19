/* cloud-drift: puffy white clouds drifting in layers across a deep blue summer sky. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const SKY = add(gradient(["#1458b0", "#2a74c8", "#4a92da", "#78b2e6", "#b0d2f0"], 12));
const CL = add(gradient(["#6a7a94", "#94a2b8", "#bcc6d4", "#dfe6ee", "#f6f9fc", "#ffffff"], 10));
const HILL = add(gradient(["#1e5a2a", "#2e7a32", "#4a9a3a"], 4));
const SUN = add(["#fff4c0", "#ffffff"]);

export const meta = {
  slug: "cloud-drift",
  name: "Cloud Drift",
  category: "weather",
  note: "Puffy white clouds drift in slow layers across a deep blue summer sky above distant hills.",
  tags: ["clouds", "sky", "summer", "calm", "wallpaper", "hero"],
  cols: 100, rows: 32, fps: 20,
  palette: palette(P),
};

const SH = " ░▒▓█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(14);
  const span = cols + 60;
  const clouds = Array.from({ length: 9 }, (_, i) => {
    const layer = i % 3;
    const size = 0.42 + layer * 0.22 + r() * 0.2;
    const puffs = Array.from({ length: 5 + Math.floor(r() * 4) }, (_, j, arr) => [(j - 3) * 4.2 * size + (r() - 0.5) * 3, -r() * 2.2 * size, (3 + r() * 3.2) * size]);
    return { x: (i / 9) * span + r() * 10, y: 5 + layer * 7 + r() * 3, sp: 0.8 + layer * 0.9, puffs, layer };
  }).sort((a, b) => a.layer - b.layer);
  const field = new Float32Array(cols * rows), top = new Float32Array(cols * rows);
  return (t) => {
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const sd = Math.hypot((x - 84) / 2, y - 5);
      const v = clamp(0.1 + (y / rows) * 0.75 + Math.exp(-sd / 6) * 0.5 + (noise2(x * 0.05, y * 0.2, 1) - 0.5) * 0.1);
      g.set(x, y, SH[1 + Math.min(2, Math.floor(v * 3))], KEYS[SKY + Math.min(11, Math.floor(v * 12))]);
    }
    for (let y = 3; y <= 7; y++) for (let x = 79; x <= 89; x++) if (Math.hypot((x - 84) / 2, y - 5) < 2.3) g.set(x, y, "█", KEYS[SUN + 1]);
    for (const c of clouds) {
      let cx = (c.x + t * c.sp) % span - 30;
      let minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
      for (const [px, py, pr] of c.puffs) { minx = Math.min(minx, cx + px * 2 - pr * 2); maxx = Math.max(maxx, cx + px * 2 + pr * 2); miny = Math.min(miny, c.y + py - pr); maxy = Math.max(maxy, c.y + py + pr); }
      for (let y = Math.max(0, Math.floor(miny)); y <= Math.min(rows - 1, maxy); y++) for (let x = Math.max(0, Math.floor(minx)); x <= Math.min(cols - 1, maxx); x++) {
        let f = 0, hi = -1e9;
        for (const [px, py, pr] of c.puffs) {
          const dx = (x - cx - px * 2) / 2, dy = Math.max(y - c.y - py, (y - c.y - py) * 1.0);
          const yflat = y > c.y + 0.5 ? (y - c.y - 0.5) * 2.2 : dy;
          const d = Math.hypot(dx, yflat) / pr;
          if (d < 1) { f = Math.max(f, 1 - d); hi = Math.max(hi, (c.y + py - pr * 0.4 - y) / pr); }
        }
        if (f <= 0) continue;
        const n = noise2(x * 0.35 + t * 0.1, y * 0.6, 4);
        if (f + (n - 0.5) * 0.25 < 0.05) continue;
        const shade = clamp(0.55 + hi * 0.5 + f * 0.3 + (n - 0.5) * 0.2 - (c.layer === 0 ? 0.15 : 0));
        g.set(x, y, f < 0.12 ? "▒" : f < 0.22 ? "▓" : "█", KEYS[CL + Math.min(9, Math.floor(shade * 10))]);
      }
    }
    for (let x = 0; x < cols; x++) {
      const h = rows - 2 - Math.floor(fbm(x * 0.04, 2, 3, 5) * 3);
      for (let y = h; y < rows; y++) g.set(x, y, y === h ? "▄" : "█", KEYS[HILL + Math.min(3, y - h)]);
    }
    return g.frame();
  };
}
