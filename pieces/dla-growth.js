/* dla-growth: diffusion-limited aggregation, random walkers sticking one by one into a branching frost cluster. */
import { Grid, palette, gradient, KEYS, rng, clamp, TAU } from "../lib/kit.js";

const RAMP = gradient(["#1a1a6a", "#2a3aa8", "#2a74d0", "#3ab0e0", "#6ae0e8", "#b8fff0", "#ffffff"], 14);
const all = [...RAMP, "#0a0c18", "#141a30", "#3a4a70"];
const NR = RAMP.length;

export const meta = {
  slug: "dla-growth",
  name: "Diffusion Aggregation",
  category: "algorithms",
  note: "Random walkers drift in from the dark and stick on contact, building a branching frost-like cluster one particle at a time.",
  tags: ["dla", "fractal", "growth", "simulation", "frost", "wallpaper"],
  cols: 90, rows: 34, fps: 24,
  palette: palette(all),
};

const P = 22, RATE = 130;
const BG = KEYS[NR], BG2 = KEYS[NR + 1], WALK = KEYS[NR + 2];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const W = cols, H = rows * 2, cx = W >> 1, cy = H >> 1;
  const order = new Int32Array(W * H);
  let cyc = -1, lastP = 0, count = 0, rmax = 2, r = null, full = false;
  const wx = new Float32Array(6), wy = new Float32Array(6);
  const reset = (c) => {
    order.fill(0); count = 1; rmax = 2; full = false;
    order[cx + cy * W] = 1;
    r = rng(c * 101 + 7);
  };
  const stuckNear = (x, y) => {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const X = x + dx, Y = y + dy;
      if (X >= 0 && Y >= 0 && X < W && Y < H && order[X + Y * W]) return true;
    }
    return false;
  };
  const addOne = () => {
    const lim = Math.min(cx, cy) - 2;
    if (rmax >= lim) { full = true; return; }
    let a = r() * TAU, x = cx + Math.cos(a) * (rmax + 3), y = cy + Math.sin(a) * (rmax + 3);
    for (let n = 0; n < 40000; n++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d > rmax + 22) { a = r() * TAU; x = cx + Math.cos(a) * (rmax + 3); y = cy + Math.sin(a) * (rmax + 3); continue; }
      if (d > rmax + 5) { const j = d - rmax - 4, b = r() * TAU; x += Math.cos(b) * j; y += Math.sin(b) * j; continue; }
      const k = Math.floor(r() * 4);
      x += k === 0 ? 1 : k === 1 ? -1 : 0; y += k === 2 ? 1 : k === 3 ? -1 : 0;
      const ix = Math.round(x), iy = Math.round(y);
      if (ix < 1 || iy < 1 || ix >= W - 1 || iy >= H - 1) continue;
      if (!order[ix + iy * W] && stuckNear(ix, iy)) {
        order[ix + iy * W] = ++count;
        rmax = Math.max(rmax, Math.hypot(ix - cx, iy - cy));
        return;
      }
    }
  };
  return (t) => {
    const c = Math.floor(t / P), p = t - c * P;
    const want = Math.floor(Math.min(p, P - 3) * RATE * (1 + p * 0.06));
    if (c !== cyc || p < lastP) { cyc = c; reset(c); }
    lastP = p;
    while (count < want && !full) addOne();
    const fade = p > P - 2 ? (p - (P - 2)) / 2 : 0;
    const showMax = Math.floor(count * (1 - fade));
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const a = order[x + y * 2 * W], b = order[x + (y * 2 + 1) * W];
      const ta = a && a <= showMax, tb = b && b <= showMax;
      if (!ta && !tb) {
        const d = Math.hypot(x - cx, (y * 2 + 1 - cy)) / (rmax + 6);
        g.set(x, y, d < 1 ? ((x + y) & 1 ? "·" : " ") : (x * 7 + y * 3) % 5 ? " " : "·", d < 1 ? BG2 : BG);
        continue;
      }
      const o = Math.max(ta ? a : 0, tb ? b : 0);
      const f = o / Math.max(1, count);
      const recent = count - o < RATE * 0.6 && !full;
      g.set(x, y, ta && tb ? "█" : ta ? "▀" : "▄", KEYS[recent ? NR - 1 : Math.min(NR - 2, Math.floor(f * (NR - 1)))]);
    }
    // a few drifting walkers for flavour
    for (let i = 0; i < 6; i++) {
      const a = i * 1.047 + t * (0.3 + i * 0.05);
      const rr = Math.min(cy, rmax + 9 + Math.sin(t * 1.3 + i) * 3);
      wx[i] = cx + Math.cos(a) * rr; wy[i] = (cy + Math.sin(a) * rr) / 2;
      if (g.get(wx[i], wy[i]) === " " || g.get(wx[i], wy[i]) === "·") g.set(wx[i], wy[i], "•", WALK);
    }
    return g.frame();
  };
}
