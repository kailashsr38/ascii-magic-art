/* butterfly: an orange and black butterfly flapping along a looping path over a flower garden. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const SKY = add(gradient(["#4a8ad4", "#7ab0e4", "#aed0f0", "#dcecf8"], 10));
const HILL = add(gradient(["#4a8a3a", "#6aa648", "#8cc05a"], 4));
const GRASS = add(gradient(["#1a4a14", "#2a6a1e", "#3e8a28", "#5aa834"], 6));
const WING = add(gradient(["#b84a08", "#e06a10", "#f68a1e", "#ffae3a", "#ffcc6a"], 8));
const INK = add(["#140c08", "#2a1a10"]);
const SPOT = add(["#fff6e0"]);
const FLOW = add(["#e84a6a", "#f6d040", "#b06ae0", "#ffffff", "#f48a3a", "#ff7ab4"]);
const TRAIL = add(["#e8f0ff"]);

export const meta = {
  slug: "butterfly",
  name: "Butterfly",
  category: "animals",
  note: "An orange and black butterfly flaps its patterned wings along a looping path above a flower garden.",
  tags: ["butterfly", "insect", "garden", "spring", "summer", "hero"],
  cols: 96, rows: 34, fps: 24,
  palette: palette(P),
};

const SH = " ░▒▓█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(30);
  const meadow = 25;
  const flowers = Array.from({ length: 22 }, () => [Math.floor(r() * cols), meadow + 1 + Math.floor(r() * 7), Math.floor(r() * 6), r() * TAU]);
  const S = 7.6;
  const lobes = [[0.58, -0.38, 0.62, 0.46, -0.35], [0.42, 0.42, 0.44, 0.4, 0.3]];
  const pos = (t) => [48 + Math.sin(t * 0.42) * 24 + Math.sin(t * 1.1) * 4, 14 + Math.sin(t * 0.84) * 2.5 + Math.cos(t * 0.5) * 1];
  return (t) => {
    g.clear();
    for (let y = 0; y < meadow; y++) for (let x = 0; x < cols; x++) {
      const c = fbm(x * 0.04 + t * 0.04, y * 0.2, 3, 2);
      const v = clamp(0.15 + (y / meadow) * 0.8 + (c > 0.62 ? 0.25 : 0));
      g.set(x, y, c > 0.62 ? "▓" : SH[1 + Math.min(2, Math.floor(v * 3))], KEYS[SKY + Math.min(9, Math.floor(v * 10))]);
    }
    for (let x = 0; x < cols; x++) {
      const h = meadow - 3 - Math.floor(fbm(x * 0.04, 3, 3, 3) * 4);
      for (let y = h; y < meadow; y++) g.set(x, y, "█", KEYS[HILL + Math.min(3, y - h)]);
    }
    for (let y = meadow; y < rows; y++) for (let x = 0; x < cols; x++) {
      const n = noise2(x * 0.5 + Math.sin(t + y) * 0.2, y * 0.8, 4);
      g.set(x, y, n > 0.6 ? "/" : n > 0.4 ? "|" : n > 0.25 ? "\\" : "▓", KEYS[GRASS + Math.min(5, Math.floor(n * 4 + (y - meadow) * 0.2))]);
    }
    for (const [fx, fy, k, ph] of flowers) {
      const sw = Math.round(Math.sin(t * 1.5 + ph) * 0.6);
      g.set(fx + sw, fy, "@", KEYS[FLOW + 1]);
      g.set(fx + sw - 1, fy, "(", KEYS[FLOW + k]); g.set(fx + sw + 1, fy, ")", KEYS[FLOW + k]);
      g.set(fx + sw, fy - 1, "▄", KEYS[FLOW + k]); g.set(fx + sw, fy + 1, "▀", KEYS[FLOW + k]);
      g.set(fx, fy + 2, "|", KEYS[GRASS + 4]);
    }
    for (let k = 1; k < 26; k++) {
      const [tx, ty] = pos(t - k * 0.09);
      if (k % 3 === 0) g.set(tx, ty + 3, "·", KEYS[TRAIL]);
    }
    const [bx, by0] = pos(t);
    const flapA = Math.sin(t * 9);
    const flap = 0.12 + 0.88 * Math.abs(flapA);
    const by = by0 - flapA * 0.6;
    const W = Math.ceil(S * 2.4 * 1.15);
    for (let y = Math.floor(by - S); y <= by + S; y++) for (let x = Math.floor(bx - W); x <= bx + W; x++) {
      const side = x < bx ? -1 : 1;
      const u = Math.abs(x - bx) / (2 * S * flap), v = (y - by) / S;
      if (u > 1.25) continue;
      let inside = 0, edge = 1, lobeI = 0;
      lobes.forEach(([cx, cy, rx, ry, rot], i) => {
        const dx = u - cx, dy = v - cy;
        const ca = Math.cos(rot), sa = Math.sin(rot);
        const ex = (dx * ca + dy * sa) / rx, ey = (-dx * sa + dy * ca) / ry;
        const d = Math.hypot(ex, ey);
        if (d < 1 && (!inside || d < edge)) { inside = 1; edge = d; lobeI = i; }
      });
      if (!inside) continue;
      const ang = Math.atan2(v, u);
      const vein = Math.abs(Math.sin(ang * 4.5 + lobeI)) < 0.16 && edge > 0.3;
      const border = edge > 0.7;
      const spot = border && edge > 0.76 && edge < 0.9 && noise2(x * 0.9, y * 1.7, 5) > 0.62;
      if (spot) g.set(x, y, "●", KEYS[SPOT]);
      else if (border || vein) g.set(x, y, "█", KEYS[INK + (border ? 0 : 1)]);
      else {
        const lit = clamp(0.62 - edge * 0.45 - v * 0.15 + flap * 0.1 - lobeI * 0.12);
        g.set(x, y, "█", KEYS[WING + Math.min(7, Math.floor(lit * 8))]);
      }
    }
    for (let y = Math.round(by - 3); y <= by + 4; y++) g.set(bx, y, y < by - 1 ? "●" : "█", KEYS[INK + 1]);
    g.set(bx - 1, by - 4, "\\", KEYS[INK]); g.set(bx + 1, by - 4, "/", KEYS[INK]);
    g.set(bx - 2, by - 5, "●", KEYS[INK]); g.set(bx + 2, by - 5, "●", KEYS[INK]);
    return g.frame();
  };
}
