/* boiling-pasta-pot: a big pot at a rolling boil, spaghetti swirling as a wooden spoon stirs, bubbles bursting and steam pouring up. */
import { Grid, palette, gradient, KEYS, fbm, noise2, clamp, rng, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const WALL = add(gradient(["#1a1e22", "#262c32", "#343c44", "#46505a"], 5));
const POT = add(gradient(["#22262c", "#3e444c", "#646c78", "#98a2ae", "#d0d8e2", "#ffffff"], 8));
const WATER = add(gradient(["#3a5a64", "#5a8088", "#86aab0", "#b8d4d8", "#eef8fa"], 6));
const PASTA = add(["#c8a040", "#ecca6a", "#fff0b0"]);
const SPOON = add(["#5a3014", "#9a5e2a", "#d0965a"]);
const STOVE = add(["#08080a", "#18181c", "#2a2a30"]);
const FLAME = add(["#1a3aa8", "#3a7aff", "#a8d8ff"]);
const STEAM = add(gradient(["#4a5458", "#7e8a8e", "#b8c2c4", "#eef2f2"], 5));

export const meta = {
  slug: "boiling-pasta-pot",
  name: "Boiling Pasta Pot",
  category: "food",
  note: "A big steel pot at a rolling boil, spaghetti swirling as a wooden spoon stirs, bubbles bursting across the surface and steam pouring up.",
  tags: ["pasta", "cooking", "kitchen", "steam", "dinner", "food"],
  cols: 76, rows: 38, fps: 24,
  palette: palette(P),
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const R = rng(13);
  const cx = 38, sy = 17, rx = 26, ry = 6.2, potBot = 31, stoveY = 32;
  const bubbles = Array.from({ length: 30 }, () => ({ a: R() * TAU, r: Math.sqrt(R()) * 0.85, per: 0.6 + R() * 1.1, ph: R() }));
  const strands = Array.from({ length: 9 }, (_, i) => ({ r: 0.2 + (i / 9) * 0.65, a: R() * TAU, len: 1.4 + R() * 1.2, w: R() * 3 }));
  const dens = new Float32Array(cols * sy);
  return (t) => {
    const swirl = t * 0.9;
    // dark tiled kitchen wall
    for (let y = 0; y < stoveY; y++) for (let x = 0; x < cols; x++) {
      const grout = y % 4 === 3 || x % 8 === 0;
      const v = clamp(0.3 + fbm(x * 0.05, y * 0.1, 2) * 0.4 - (grout ? 0.2 : 0));
      g.set(x, y, grout ? "▒" : "█", KEYS[WALL + Math.min(4, Math.floor(v * 5))]);
    }
    for (let y = stoveY; y < rows; y++) for (let x = 0; x < cols; x++) g.set(x, y, y === stoveY ? "▀" : "█", KEYS[STOVE + (y === stoveY ? 2 : y === stoveY + 1 ? 1 : 0)]);
    for (let x = cx - 18; x <= cx + 18; x++) {
      const f = noise2(x * 0.6, t * 6, 2);
      g.set(x, stoveY - 1, f > 0.55 ? "▲" : "█", KEYS[FLAME + (f > 0.6 ? 2 : f > 0.35 ? 1 : 0)]);
    }
    // pot body
    for (let y = sy; y < potBot; y++) for (let x = cx - rx; x <= cx + rx; x++) {
      const u = (x - cx) / rx;
      let v = clamp(Math.sqrt(1 - u * u) * 0.55 + 0.25 - u * 0.25 - (y - sy) * 0.005);
      if (Math.abs(u + 0.55) < 0.05) v = 1;
      g.set(x, y, "█", KEYS[POT + Math.min(7, Math.floor(v * 8))]);
    }
    for (const s of [-1, 1]) for (let k = 0; k < 5; k++) g.set(cx + s * (rx + 1 + k), sy + 3, "█", KEYS[POT + 1]);
    // the water surface: rolling boil with swirling spaghetti
    for (let y = Math.floor(sy - ry); y <= Math.ceil(sy + ry); y++) for (let x = cx - rx; x <= cx + rx; x++) {
      const nx = (x - cx) / rx, ny = (y - sy) / ry;
      const e = nx * nx + ny * ny;
      if (e > 1) continue;
      if (e > 0.84) { g.set(x, y, "█", KEYS[POT + (y < sy ? 3 : 6)]); continue; }
      const a = Math.atan2(ny, nx), r = Math.sqrt(e);
      const churn = fbm(nx * 4 + t * 0.6, ny * 4 - t * 0.9, 2);
      let k = WATER + Math.min(5, Math.floor(clamp(0.3 + churn * 0.5 - ny * 0.15) * 6));
      // spaghetti: arcs sweeping round with the swirl
      for (const s of strands) {
        let da = ((a - s.a - swirl + Math.PI) % TAU + TAU) % TAU - Math.PI;
        if (da > 0 && da < s.len && Math.abs(r - s.r - Math.sin(da * 3 + s.w + t) * 0.05) < 0.035) { k = PASTA + (da < 0.3 ? 2 : 1); break; }
      }
      g.set(x, y, "█", KEYS[k]);
    }
    // bubbles swelling and bursting
    for (const b of bubbles) {
      const ph = ((t / b.per + b.ph) % 1);
      const x = Math.round(cx + Math.cos(b.a + swirl * 0.5) * b.r * rx * 0.92), y = Math.round(sy + Math.sin(b.a + swirl * 0.5) * b.r * ry * 0.92);
      if (ph < 0.8) {
        g.set(x, y, "█", KEYS[WATER + 5]);
        if (ph > 0.3) { g.set(x + 1, y, "█", KEYS[WATER + 4]); g.set(x - 1, y, "█", KEYS[WATER + 3]); }
      } else g.set(x, y - 1, "°", KEYS[WATER + 5]);
    }
    // wooden spoon circling the pot
    const sa = swirl, tipX = cx + Math.cos(sa) * rx * 0.45, tipY = sy + Math.sin(sa) * ry * 0.45;
    const hx = tipX + 14 + Math.cos(sa) * 4, hy = tipY - 14;
    g.line(tipX, tipY, hx, hy, "█", KEYS[SPOON + 1]);
    g.line(tipX + 1, tipY, hx + 1, hy, "▓", KEYS[SPOON + 2]);
    for (let y = -1; y <= 1; y++) for (let x = -2; x <= 2; x++) if (Math.abs(x) + Math.abs(y) < 3) g.set(Math.round(tipX) + x, Math.round(tipY) + y, "█", KEYS[SPOON + (x < 0 ? 2 : 0)]);
    // heavy steam pouring up and drifting
    dens.fill(0);
    const sb = Math.floor(sy - ry) + 1;
    for (let y = 0; y < sb; y++) {
      const hgt = (sb - y) / sb;
      for (let k = 0; k < 5; k++) {
        const xc = cx - 18 + k * 9 + Math.sin(y * 0.3 + t * 1.4 + k * 1.7) * (1 + hgt * 4) + (noise2(y * 0.15 + t * 0.5, k * 2, 6) - 0.5) * 9 * hgt + hgt * 5;
        const w = 2 + hgt * 4;
        for (let x = Math.max(0, Math.floor(xc - w * 2.2)); x <= Math.min(cols - 1, xc + w * 2.2); x++)
          dens[x + y * cols] += Math.exp(-(((x - xc) / w) ** 2)) * (0.5 + 0.5 * noise2(x * 0.22, y * 0.45 + t * 2.4, k)) * (1 - hgt * 0.75);
      }
    }
    for (let i = 0; i < cols * sb; i++) if (dens[i] > 0.2) {
      const v = clamp(dens[i] * 0.9);
      g.set(i % cols, (i / cols) | 0, v > 0.65 ? "▓" : v > 0.4 ? "▒" : "░", KEYS[STEAM + Math.min(4, Math.floor(v * 5))]);
    }
    return g.frame();
  };
}
