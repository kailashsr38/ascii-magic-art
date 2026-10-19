/* sleeping-cat: a ginger tabby curled up asleep on a cushion, breathing slowly while z's drift up. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const WALL = add(gradient(["#1a120e", "#2a1e16", "#3e2c1e", "#544028", "#6a5232"], 10));
const LAMP = add(["#8a6a3a", "#b08a4a"]);
const CUSH = add(gradient(["#3a0e1a", "#5a1628", "#7e2038", "#a43048", "#c44a5a"], 8));
const FUR = add(gradient(["#7a3a10", "#a8521a", "#cc6e24", "#e48a34", "#f4a84e", "#fcc880"], 12));
const STRIPE = add(["#5a2a0c", "#7a3a12"]);
const PINK = add(["#e88a8a", "#f4b0a8"]);
const DARK = add(["#1a0e08"]);
const ZZ = add(["#a8b8e0", "#d0dcf4", "#ffffff"]);
const WHISK = add(["#f4e8d8"]);

export const meta = {
  slug: "sleeping-cat",
  name: "Sleeping Cat",
  category: "animals",
  note: "A ginger tabby curled up asleep on a red cushion, breathing slowly as little z's drift up into the warm room.",
  tags: ["cat", "pets", "sleep", "cozy", "loader", "404"],
  cols: 80, rows: 30, fps: 20,
  palette: palette(P),
};

const SH = " ░▒▓█";
const BIGZ = ["▀▀█", "▄▀ ", "█▄▄"];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  return (t) => {
    g.clear();
    const br = Math.sin(t * 1.5);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const d = Math.hypot((x - 14) / 2, y - 3);
      const v = clamp(0.25 + Math.exp(-d / 14) * 0.6 + (fbm(x * 0.05, y * 0.1, 3, 1) - 0.5) * 0.2);
      g.set(x, y, SH[1 + Math.min(3, Math.floor(v * 4))], KEYS[WALL + Math.min(9, Math.floor(v * 10))]);
    }
    for (let y = 21; y < rows; y++) for (let x = 0; x < cols; x++) g.set(x, y, (x + y) % 4 === 0 ? "▒" : "▓", KEYS[WALL + 2 + ((x >> 2) + y) % 2]);
    for (let y = 16; y < 29; y++) for (let x = 4; x < 76; x++) {
      const d = Math.hypot((x - 40) / 36, (y - 23.5) / 5.5);
      if (d > 1) continue;
      const tuft = Math.hypot(((x - 40) % 12 + 12) % 12 - 6, (y - 23) * 2) < 1.5;
      const lit = clamp(0.8 - (y - 18) * 0.07 - d * 0.3);
      g.set(x, y, tuft ? "●" : d > 0.9 ? "▓" : "█", KEYS[CUSH + Math.min(7, Math.floor(lit * 8) - (tuft ? 2 : 0))]);
    }
    const bcx = 44, bcy = 17.5, brx = 20, bry = 6.2 * (1 + br * 0.045);
    for (let y = Math.floor(bcy - bry - 1); y <= bcy + bry; y++) for (let x = bcx - brx - 1; x <= bcx + brx + 1; x++) {
      const dx = (x - bcx) / brx, dy = (y - bcy) / bry;
      const dd = dx * dx + dy * dy;
      if (dd > 1) continue;
      const ang = Math.atan2(dy, dx);
      const stripe = Math.sin(ang * 11 + noise2(x * 0.2, y * 0.3, 2) * 2) > 0.55 && dd > 0.25;
      const lit = clamp(0.5 - dy * 0.35 - dx * 0.1 + Math.sqrt(1 - dd) * 0.35);
      g.set(x, y, stripe ? "▓" : dd > 0.85 ? "▓" : "█", stripe ? KEYS[STRIPE + (lit > 0.5 ? 1 : 0)] : KEYS[FUR + Math.min(11, Math.floor(lit * 12))]);
    }
    for (let i = 0; i <= 60; i++) {
      const u = i / 60;
      const a = -0.2 + u * 2.6;
      const x = 46 + Math.cos(a) * 21 * (1 - u * 0.25);
      const y = 19.5 + Math.sin(a) * 4.2 + u * 0.5;
      const th = 1.6 - u * 0.6;
      for (let k = -1; k <= 1; k++) {
        const yy = Math.round(y + k * th * 0.5);
        const ring = Math.floor(u * 14) % 2 === 0;
        g.set(x, yy, "█", ring ? KEYS[STRIPE + 1] : KEYS[FUR + (k < 0 ? 9 : 6)]);
      }
    }
    const hx = 25, hy = 17 + br * 0.25, hrx = 9.5, hry = 5;
    for (const [ex, dir] of [[hx - 6, -1], [hx + 5, 1]]) for (let k = 0; k < 4; k++) {
      const y = Math.round(hy - hry - 2 + k);
      const half = Math.floor(k * 0.8);
      for (let dx = -half; dx <= half + 1; dx++) g.set(ex + dx + (dir > 0 ? -k * 0.3 : k * 0.3), y, k > 0 && dx >= 0 && dx <= half ? "▓" : "█", k > 0 && dx >= 0 && dx <= half ? KEYS[PINK] : KEYS[FUR + 7]);
    }
    for (let y = Math.floor(hy - hry); y <= hy + hry; y++) for (let x = hx - hrx - 1; x <= hx + hrx + 1; x++) {
      const dx = (x - hx) / hrx, dy = (y - hy) / hry;
      const dd = dx * dx + dy * dy;
      if (dd > 1) continue;
      const lit = clamp(0.55 - dy * 0.3 + Math.sqrt(1 - dd) * 0.35);
      const forehead = dy < -0.35 && Math.abs(dx) < 0.3 && Math.round(x) % 2 === 0;
      const muzzle = dy > 0.05 && Math.abs(dx) < 0.42;
      g.set(x, y, forehead ? "▓" : "█", forehead ? KEYS[STRIPE] : KEYS[muzzle ? FUR + 11 : FUR + Math.min(11, Math.floor(lit * 12))]);
    }
    g.text(hx - 5, Math.round(hy), "\\__", KEYS[DARK]);
    g.text(hx + 3, Math.round(hy), "__/", KEYS[DARK]);
    g.text(hx - 1, Math.round(hy + 1), "▼", KEYS[PINK]);
    g.set(hx - 1, Math.round(hy + 2), "w", KEYS[DARK]);
    g.text(hx - 15, Math.round(hy + 1), "───", KEYS[WHISK]); g.text(hx - 14, Math.round(hy + 2), "──", KEYS[WHISK]);
    g.text(hx + 11, Math.round(hy + 1), "───", KEYS[WHISK]);
    for (let i = 0; i < 3; i++) {
      const a = ((t / 3.6) + i / 3) % 1;
      const zx = Math.round(hx + 9 + a * 14 + Math.sin(a * 6 + i) * 1.5), zy = Math.round(hy - 6 - a * 9);
      const key = KEYS[ZZ + (a < 0.3 ? 2 : a < 0.7 ? 1 : 0)];
      if (a > 0.45) g.block(zx, zy - 1, BIGZ.join("\n"), key);
      else g.set(zx, zy, a > 0.2 ? "Z" : "z", key);
    }
    return g.frame();
  };
}
