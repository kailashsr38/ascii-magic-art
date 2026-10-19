/* goldfish-tank: goldfish gliding through a planted aquarium, bubbles streaming up from the air stone. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const WALL = add(gradient(["#1a1614", "#2a2420", "#3a322a"], 4));
const WATER = add(gradient(["#062a3a", "#0a4058", "#125a74", "#1e7890", "#3496a8", "#5ab4bc"], 12));
const GLASS = add(["#9ac8d4", "#d4eef4"]);
const FRAME = add(gradient(["#1a1a1e", "#34343a", "#5a5a62"], 3));
const GRAVEL = add(["#a8743a", "#6a4a2a", "#d8b07a", "#8a8a7a", "#c45a3a", "#4a3a2a"]);
const PLANT = add(gradient(["#1a5a1e", "#2e7e26", "#4ea232", "#7ac448"], 6));
const FISH = add(gradient(["#b8320a", "#e0540e", "#f47a1a", "#ffa040", "#ffd08a"], 8));
const BUB = add(["#a8e0ec", "#ffffff"]);
const ROCK = add(gradient(["#2a2e34", "#4a5058", "#6a7078"], 3));
const DARK = add(["#101010"]);

export const meta = {
  slug: "goldfish-tank",
  name: "Goldfish Tank",
  category: "animals",
  note: "Goldfish glide back and forth through a planted aquarium while bubbles stream up from the air stone.",
  tags: ["fish", "aquarium", "water", "pets", "calm", "wallpaper"],
  cols: 84, rows: 34, fps: 24,
  palette: palette(P),
};

const SH = " ░▒▓█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const X0 = 3, X1 = 80, Y0 = 3, Y1 = 28, surf = 5, bed = 25;
  const r = rng(21);
  const bubbles = Array.from({ length: 26 }, (_, i) => [i % 2 ? 66 : 67, r(), 0.18 + r() * 0.12, r() * TAU]);
  const plants = [[10, 14, 0], [15, 10, 1], [56, 12, 2], [72, 16, 3], [76, 9, 4], [30, 7, 5]];
  const fish = [
    { cx: 40, A: 24, w: 0.3, ph: 0, cy: 12, s: 1.6 },
    { cx: 42, A: 22, w: 0.24, ph: 2.3, cy: 19, s: 1.3 },
    { cx: 38, A: 20, w: 0.38, ph: 4.4, cy: 8.5, s: 1.0 },
  ];
  const gravel = Array.from({ length: (X1 - X0) * 4 }, () => Math.floor(r() * 6));
  const drawFish = (f, t) => {
    const a = t * f.w + f.ph;
    const fx = f.cx + Math.sin(a) * f.A;
    const vx = Math.cos(a);
    const d = vx >= 0 ? 1 : -1;
    const turn = Math.max(0.35, Math.pow(Math.abs(vx), 0.35));
    const fy = f.cy + Math.sin(t * 0.7 + f.ph) * 2;
    const rx = 5 * f.s * turn, ry = 2.1 * f.s;
    const wag = Math.sin(t * 9 + f.ph);
    for (let k = 1; k <= Math.round(4 * f.s); k++) {
      const tx = fx - d * (rx + k - 1);
      const hh = 0.6 + k * 0.55 * f.s;
      const off = wag * k * 0.25;
      for (let y = Math.round(fy - hh + off); y <= Math.round(fy + hh + off); y++) g.set(tx, y, k > 2 && Math.abs(y - fy - off) < 0.6 ? "▒" : "▓", KEYS[FISH + (k > 2 ? 1 : 2)]);
    }
    for (let y = Math.floor(fy - ry - 1); y <= fy + ry; y++) for (let x = Math.floor(fx - rx - 1); x <= fx + rx + 1; x++) {
      const dx = (x - fx) / rx, dy = (y - fy) / ry;
      const dd = dx * dx + dy * dy;
      if (dd > 1) continue;
      const lit = clamp(0.6 - dy * 0.35 + dx * d * 0.1 + Math.sqrt(1 - dd) * 0.3);
      g.set(x, y, dd > 0.75 ? "▓" : "█", KEYS[FISH + Math.min(7, Math.floor(lit * 8))]);
    }
    g.set(fx - d * 1, fy - ry - 0.5, "▄", KEYS[FISH + 2]);
    g.set(fx, fy - ry - 0.5, "▄", KEYS[FISH + 1]);
    g.set(fx + d * (rx - 1.6), fy - 0.6, "●", KEYS[DARK]);
    g.set(fx + d * (rx + 0.6), fy + 0.2, d > 0 ? ">" : "<", KEYS[FISH + 4]);
    g.set(fx - d * 0.5, fy + ry - 0.2, d > 0 ? "\\" : "/", KEYS[FISH + 3]);
  };
  return (t) => {
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) g.set(x, y, "▓", KEYS[WALL + Math.min(3, Math.floor(noise2(x * 0.1, y * 0.2, 1) * 4))]);
    for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) {
      if (y < surf) { g.set(x, y, "░", KEYS[GLASS]); continue; }
      const depth = (y - surf) / (bed - surf);
      const caust = noise2(x * 0.25 + t * 0.4, y * 0.5 - t * 0.3, 5);
      const v = clamp(0.95 - depth * 0.7 + (caust > 0.62 ? 0.18 : 0) + (noise2(x * 0.05, y * 0.1, 2) - 0.5) * 0.2);
      g.set(x, y, caust > 0.7 && depth < 0.6 ? "▒" : "▓", KEYS[WATER + Math.min(11, Math.floor(v * 12))]);
    }
    for (let x = X0; x <= X1; x++) g.set(x, surf, noise2(x * 0.4 + t * 1.5, 1, 3) > 0.5 ? "~" : "-", KEYS[GLASS + 1]);
    for (let y = bed; y <= Y1; y++) for (let x = X0; x <= X1; x++) {
      const k = gravel[(x - X0) + (y - bed) * (X1 - X0)];
      g.set(x, y, k % 2 ? "●" : "▓", KEYS[GRAVEL + k]);
    }
    for (let y = bed - 3; y <= bed; y++) for (let x = 22; x <= 36; x++) {
      const d = Math.hypot((x - 29) / 7, (y - bed) / 3.2);
      if (d < 1) g.set(x, y, d > 0.8 ? "▓" : "█", KEYS[ROCK + Math.min(2, Math.floor((1 - d) * 2 + (y < bed - 1 ? 1 : 0)))]);
    }
    g.text(64, bed, "▄▄▄▄", KEYS[ROCK + 1]);
    for (const [px, h, i] of plants) {
      for (let k = 0; k < h; k++) {
        const y = bed - k;
        const sway = Math.sin(t * 1.2 + i + k * 0.3) * (k / h) * 2.2;
        const x = px + sway;
        g.set(x, y, "|", KEYS[PLANT + 1]);
        if (k % 2 === 1) { g.set(x - 1, y, i % 2 ? "(" : "<", KEYS[PLANT + 2 + (k % 3 ? 0 : 1)]); g.set(x + 1, y - 1, i % 2 ? ")" : ">", KEYS[PLANT + 3]); }
        if (k % 3 === 0) { g.set(x - 2, y - 1, "▓", KEYS[PLANT + 2]); g.set(x + 2, y, "▓", KEYS[PLANT + 4]); }
      }
      g.set(px + Math.sin(t * 1.2 + i) * 2.2, bed - h, "*", KEYS[PLANT + 5]);
    }
    for (const f of fish) drawFish(f, t);
    for (const [bx, ph, sp, w] of bubbles) {
      const a = (t * sp + ph) % 1;
      const y = bed - 1 - a * (bed - surf - 1);
      const x = bx + Math.sin(t * 3 + w + a * 6) * 1.2;
      g.set(x, y, a > 0.6 ? "O" : a > 0.25 ? "o" : "°", KEYS[BUB + (a > 0.5 ? 1 : 0)]);
    }
    g.box(X0 - 1, Y0 - 1, X1 - X0 + 3, Y1 - Y0 + 3, "heavy", KEYS[FRAME + 2]);
    for (let y = Y0; y < Y1; y += 1) if (noise2(1, y * 0.3, 4) > 0.7) g.set(X0, y, "│", KEYS[GLASS + 1]);
    for (let y = Y1 + 2; y < rows; y++) for (let x = 0; x < cols; x++) g.set(x, y, y === Y1 + 2 ? "▀" : "█", KEYS[FRAME + (y === Y1 + 2 ? 1 : 0)]);
    return g.frame();
  };
}
