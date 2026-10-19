/* waterfall-canyon: a tall waterfall plunging into a canyon pool, throwing up spray and mist. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp } from "../lib/kit.js";

const P = [];
const add = (a) => { const o = P.length; P.push(...a); return o; };
const SKY = add(gradient(["#3a7ac8", "#7ab4e8", "#cfe6f6"], 6));
const ROCK = add(gradient(["#2a120c", "#5a2616", "#8e4424", "#c06a38", "#e09a5c", "#f2c48a"], 14));
const GREEN = add(["#1a3a1c", "#2e5e2a", "#4a8038"]);
const FALL = add(gradient(["#3a7aa8", "#8ac8ea", "#dff4ff", "#ffffff"], 6));
const POOL = add(gradient(["#06283a", "#0e4a5e", "#1e7a8a", "#5ab0b8"], 6));
const MIST = add(["#b8d8e4", "#e8f6fa"]);

export const meta = {
  slug: "waterfall-canyon",
  name: "Waterfall Canyon",
  category: "landscapes",
  note: "A tall waterfall drops between striped canyon walls into a green pool, throwing up spray and mist.",
  tags: ["nature", "waterfall", "canyon", "water", "wallpaper", "hero"],
  cols: 96, rows: 38, fps: 24,
  palette: palette(P),
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(9);
  const cx = 48, lip = 7, poolY = 29;
  // canyon wall profiles: the open gap narrows toward the bottom
  const leftEdge = Array.from({ length: rows }, (_, y) => Math.round(32 + y * 0.22 + (fbm(y * 0.2, 1, 3, 3) - 0.5) * 8));
  const rightEdge = Array.from({ length: rows }, (_, y) => Math.round(64 - y * 0.22 + (fbm(y * 0.2, 7, 3, 3) - 0.5) * 8));
  const fallW = 5;
  const drops = Array.from({ length: 40 }, () => [r() * 2 - 1, r() * 6.28, 0.5 + r()]);
  return (t) => {
    g.clear();
    // sky through the gap
    for (let y = 0; y < lip + 2; y++) for (let x = 0; x < cols; x++) {
      const c = fbm(x * 0.05 + t * 0.04, y * 0.3, 3, 2);
      const v = clamp(y / 10 + (c - 0.5) * 0.8);
      g.set(x, y, c > 0.6 ? "█" : c > 0.5 ? "▓" : "▒", KEYS[SKY + clamp(Math.floor((v + (c > 0.55 ? 0.4 : 0)) * 6), 0, 5)]);
    }
    // far canyon back wall behind the falls
    for (let y = lip; y < poolY; y++) for (let x = leftEdge[y]; x <= rightEdge[y]; x++) {
      const v = 0.25 + (fbm(x * 0.15, y * 0.4, 2, 8) - 0.5) * 0.4 + ((y % 4) === 0 ? -0.08 : 0);
      g.set(x, y, "▓", KEYS[ROCK + clamp(Math.floor(v * 14), 0, 13)]);
    }
    // stratified canyon walls, lit from the upper left
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const inL = x < leftEdge[y], inR = x > rightEdge[y];
      if (!inL && !inR) continue;
      const strata = Math.sin(y * 1.1 + fbm(x * 0.06, y * 0.1, 2, 5) * 5) * 0.12;
      const face = inL ? (leftEdge[y] - x) : (x - rightEdge[y]);
      const lit = inL ? 0.15 : -0.05;
      const n = fbm(x * 0.1, y * 0.35, 3, 11);
      const v = clamp(0.35 + strata + lit + (n - 0.5) * 0.5 - (face < 2 ? 0.15 : 0) - y * 0.008);
      g.set(x, y, v > 0.7 ? "█" : v > 0.45 ? "▓" : v > 0.25 ? "▒" : "░", KEYS[ROCK + clamp(Math.floor(v * 14), 0, 13)]);
      // greenery clinging to ledges
      if (fbm(x * 0.25, y * 0.8, 2, 40) > 0.7 && y > 4) g.set(x, y, n > 0.5 ? "▓" : "▒", KEYS[GREEN + (n > 0.55 ? 2 : 1)]);
    }
    // the sky edge of the cliffs: grass tops
    for (let x = 0; x < cols; x++) if (x < leftEdge[2] || x > rightEdge[2]) {
      const top = 2 + Math.round(noise2(x * 0.15, 0, 2) * 2);
      g.set(x, top, "▄", KEYS[GREEN + 1]);
      for (let y = 0; y < top; y++) {
        const c = fbm(x * 0.05 + t * 0.04, y * 0.3, 3, 2);
        g.set(x, y, "▒", KEYS[SKY + clamp(Math.floor((y / 10 + (c - 0.5) * 0.8) * 6 + 1), 0, 5)]);
      }
    }
    // river lip and the falling column
    for (let x = cx - fallW - 2; x <= cx + fallW + 2; x++) g.set(x, lip, "▀", KEYS[FALL + 1]);
    for (let y = lip + 1; y < poolY; y++) {
      const spread = fallW + (y - lip) * 0.12;
      for (let x = Math.floor(cx - spread); x <= Math.ceil(cx + spread); x++) {
        const u = (x - cx) / spread;
        if (Math.abs(u) > 1) continue;
        const streak = noise2(x * 1.3, y * 0.25 - t * 7, 5);
        const edge = 1 - Math.abs(u);
        const v = clamp(streak * 0.7 + edge * 0.5);
        g.set(x, y, v > 0.75 ? "█" : v > 0.55 ? "▓" : v > 0.35 ? "│" : "▒", KEYS[FALL + clamp(Math.floor(v * 6), 0, 5)]);
      }
    }
    // pool with rings spreading out from the falls
    for (let y = poolY; y < rows; y++) for (let x = 0; x < cols; x++) {
      if (x < leftEdge[y] - 6 || x > rightEdge[y] + 6) continue;
      const dx = (x - cx) / 2, dy = y - poolY;
      const d = Math.hypot(dx, dy * 1.5);
      const ring = Math.sin(d * 0.9 - t * 4);
      const n = fbm(x * 0.1 - t * 0.2, y * 0.4, 2, 6);
      const v = clamp(0.35 + ring * 0.15 + (n - 0.5) * 0.5 + Math.exp(-d / 8) * 0.5 - dy * 0.03);
      g.set(x, y, ring > 0.75 ? "~" : v > 0.6 ? "▓" : v > 0.35 ? "▒" : "░", KEYS[POOL + clamp(Math.floor(v * 6), 0, 5)]);
    }
    // spray droplets and a soft mist cloud at the base
    for (const [ox, ph, sp] of drops) {
      const life = ((t * sp + ph) % 1.6) / 1.6;
      const x = cx + ox * (fallW + 6) * (0.5 + life), y = poolY - Math.sin(life * Math.PI) * 5;
      g.set(x, y, life < 0.5 ? "°" : "·", KEYS[MIST + 1]);
    }
    for (let y = poolY - 7; y < poolY + 3; y++) for (let x = cx - 22; x <= cx + 22; x++) {
      const m = fbm(x * 0.12 + t * 0.3, y * 0.4 - t * 0.5, 3, 17);
      const fall = Math.exp(-(((x - cx) / 14) ** 2) - (((y - poolY) / 4) ** 2));
      const a = m * fall * 1.6;
      if (a > 0.45) g.set(x, y, a > 0.85 ? "▓" : a > 0.6 ? "▒" : "░", KEYS[MIST + (a > 0.7 ? 1 : 0)]);
    }
    return g.frame();
  };
}
