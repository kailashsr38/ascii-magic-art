/* melting-ice-cream-cone: a two-scoop waffle cone in the sun, drips running down the cone and falling into a puddle. */
import { Grid, palette, gradient, KEYS, fbm, noise2, clamp, rng } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const SKY = add(gradient(["#ff9a6a", "#ffb47e", "#ffcf96", "#ffe4b4", "#fff2d8"], 8));
const STRAW = add(gradient(["#a82a50", "#e0507a", "#ff86a6", "#ffc0d2", "#fff0f4"], 7));
const MINT = add(gradient(["#2a8a6e", "#4cbf98", "#82e0bc", "#c4f6e0", "#f0fff8"], 7));
const CONE = add(gradient(["#6a3410", "#a8601e", "#d8923e", "#f2c070"], 6));
const SPRINK = add(["#3a7aff", "#ffd23a", "#8a3aff", "#ff4a3a", "#ffffff"]);
const CHERRY = add(["#6a0a10", "#c81a28", "#ff6a6a", "#3a5a1a"]);
const GROUND = add(gradient(["#c87a58", "#e09a72", "#f2b892"], 4));

export const meta = {
  slug: "melting-ice-cream-cone",
  name: "Melting Ice Cream Cone",
  category: "food",
  note: "A strawberry and mint waffle cone melting in the afternoon sun, drips running down the cone and falling into a pink puddle.",
  tags: ["ice cream", "summer", "dessert", "cute", "food", "sticker"],
  cols: 60, rows: 38, fps: 24,
  palette: palette(P),
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const R = rng(3);
  const cx = 30, coneTop = 21, coneTip = 33;
  const sprinkles = Array.from({ length: 22 }, () => [R() * 2 - 1, R() * 1.2 - 0.9, Math.floor(R() * 5)]);
  // drips: from the mint scoop down the cone, from the strawberry scoop down over the mint
  const drips = [
    { x: cx - 8, y0: 22, max: 6, per: 5.5, ph: 0, k: MINT },
    { x: cx - 3, y0: 23, max: 9, per: 7, ph: 2.1, k: MINT },
    { x: cx + 4, y0: 23, max: 8, per: 6.2, ph: 4.3, k: MINT },
    { x: cx + 9, y0: 22, max: 4, per: 4.8, ph: 1.2, k: MINT },
    { x: cx - 6, y0: 14, max: 4, per: 5, ph: 3.3, k: STRAW },
    { x: cx + 2, y0: 15, max: 5, per: 6.4, ph: 0.7, k: STRAW },
    { x: cx + 7, y0: 14, max: 3, per: 4.4, ph: 2.6, k: STRAW },
  ];
  const groundY = 35;
  return (t) => {
    // warm sunny backdrop with drifting soft clouds
    for (let y = 0; y < groundY; y++) for (let x = 0; x < cols; x++) {
      const sun = Math.exp(-Math.hypot((x - 50) / 14, (y - 5) / 7));
      const cl = fbm(x * 0.06 - t * 0.12, y * 0.18, 3);
      const v = clamp(0.25 + y / groundY * -0.1 + sun * 0.7 + (cl > 0.58 ? 0.25 : 0));
      g.set(x, y, cl > 0.58 ? "▓" : v > 0.6 ? "█" : "▓", KEYS[SKY + Math.min(7, Math.floor(v * 8))]);
    }
    for (let y = groundY; y < rows; y++) for (let x = 0; x < cols; x++) g.set(x, y, "█", KEYS[GROUND + (y === groundY ? 2 : (x + y) % 5 === 0 ? 0 : 1)]);
    // waffle cone with a criss-cross grid
    for (let y = coneTop; y <= coneTip; y++) {
      const f = (y - coneTop) / (coneTip - coneTop);
      const w = 11 * (1 - f) + 0.6;
      for (let x = Math.floor(cx - w); x <= Math.ceil(cx + w); x++) {
        const u = (x - cx) / w;
        if (Math.abs(u) > 1) continue;
        const grid = ((x + y * 2) % 6 === 0) || ((x - y * 2 + 60) % 6 === 0);
        const lit = clamp(Math.sqrt(1 - u * u) * 0.5 + 0.35 - u * 0.25);
        g.set(x, y, "█", KEYS[CONE + (grid ? Math.max(0, Math.floor(lit * 3) - 1) : Math.min(5, 2 + Math.floor(lit * 4)))]);
      }
    }
    // puddle below the tip, rings spreading where drops land
    for (let y = groundY; y <= groundY + 2; y++) for (let x = cx - 12; x <= cx + 12; x++) {
      const d = Math.hypot((x - cx) / 11, (y - groundY - 1) / 1.6);
      if (d < 1) g.set(x, y, "█", KEYS[STRAW + (d < 0.4 ? 3 : d < 0.75 ? 2 : 1)]);
    }
    // scoops: lumpy spheres lit from the upper right
    const scoop = (sx, sy, rxx, ryy, base, seed) => {
      for (let y = Math.floor(sy - ryy - 1); y <= sy + ryy + 1; y++) for (let x = Math.floor(sx - rxx - 2); x <= sx + rxx + 2; x++) {
        const dx = (x - sx) / rxx, dy = (y - sy) / ryy;
        const lump = y > sy ? 0.13 * Math.sin(x * 1.3 + seed) : 0.05 * noise2(x * 0.5, y, seed);
        const d = Math.hypot(dx, dy) - lump;
        if (d > 1) continue;
        const nz = Math.sqrt(Math.max(0, 1 - d * d));
        const lit = clamp(nz * 0.55 + dx * 0.2 - dy * 0.25 + 0.2 + (noise2(x * 0.4, y * 0.8, seed + 3) - 0.5) * 0.15);
        g.set(x, y, "█", KEYS[base + Math.min(6, Math.floor(lit * 7))]);
      }
    };
    scoop(cx, 18.5, 13, 5.2, MINT, 1);
    scoop(cx, 10.5, 11, 5.2, STRAW, 4);
    for (const [u, v, k] of sprinkles) {
      const x = Math.round(cx + u * 9), y = Math.round(10.5 + v * 4.5);
      if (Math.hypot(u, v) < 1) g.set(x, y, "█", KEYS[SPRINK + k]);
    }
    // cherry on top
    for (let y = 3; y <= 5; y++) for (let x = cx - 3; x <= cx + 3; x++) {
      const d = Math.hypot((x - cx) / 3, (y - 4.2) / 1.5);
      if (d < 1) g.set(x, y, "█", KEYS[CHERRY + (x > cx && y < 4 ? 2 : d > 0.7 ? 0 : 1)]);
    }
    g.set(cx + 1, 2, "/", KEYS[CHERRY + 3]); g.set(cx + 2, 1, "/", KEYS[CHERRY + 3]);
    // drips grow slowly, a drop breaks off and falls
    for (const d of drips) {
      const a = ((t + d.ph) % d.per) / d.per;
      const len = Math.floor(Math.min(1, a / 0.8) * d.max);
      for (let j = 0; j <= len; j++) g.set(d.x, d.y0 + j, "█", KEYS[d.k + (j === len ? 2 : 3 + (j % 2))]);
      g.set(d.x, d.y0 + len + 1, "▀", KEYS[d.k + 2]);
      if (a > 0.8) {
        const f = (a - 0.8) / 0.2;
        const y = d.y0 + d.max + 2 + f * f * (groundY - d.y0 - d.max);
        g.set(d.x, y, "●", KEYS[d.k + 3]);
      }
    }
    return g.frame();
  };
}
