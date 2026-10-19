/* campfire-under-stars: a crackling campfire throwing sparks up toward the milky way, a tent beside it. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp } from "../lib/kit.js";

const P = [];
const add = (a) => { const o = P.length; P.push(...a); return o; };
const SKY = add(gradient(["#02030a", "#070b1e", "#101a36", "#1c2a4e"], 6));
const MW = add(gradient(["#1a1a40", "#3a2e6a", "#6a5a9a", "#a898c8", "#e8e0f8"], 6));
const STAR = add(["#6a78a0", "#c8d4ff", "#ffffff", "#ffe8c0"]);
const TREE = add(["#020306", "#060a10"]);
const FIRE = add(gradient(["#5a0a04", "#b02a08", "#ec5a10", "#ff9a2a", "#ffd25a", "#fff6c0"], 10));
const LOG = add(["#2a1608", "#5a3418", "#8a5428"]);
const GROUND = add(gradient(["#06060a", "#1a120e", "#3a2414", "#6a3e1c", "#a0602a"], 8));
const TENT = add(gradient(["#0c0c14", "#2a1e1a", "#6a3a22", "#b0602e"], 5));

export const meta = {
  slug: "campfire-under-stars",
  name: "Campfire Under Stars",
  category: "landscapes",
  note: "A crackling campfire sends sparks up toward the milky way while a tent glows in its light.",
  tags: ["night", "camping", "fire", "stars", "cozy", "wallpaper"],
  cols: 100, rows: 36, fps: 24,
  palette: palette(P),
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(17);
  const hz = 24, fx = 58, fy = 30;
  const stars = Array.from({ length: 140 }, () => [Math.floor(r() * cols), Math.floor(r() * hz), r(), r() * 6.28]);
  const trees = Array.from({ length: cols }, (_, x) => {
    const pine = Math.abs(((x * 0.37) % 1) - 0.5) * 2;
    return hz - 1 - Math.round((1 - pine) * (3 + fbm(x * 0.1, 0, 2, 5) * 6));
  });
  const sparks = Array.from({ length: 36 }, () => [r() * 6.28, 1 + r() * 2, r() * 3, r()]);
  return (t) => {
    g.clear();
    const flick = 0.85 + 0.15 * Math.sin(t * 13) * Math.sin(t * 7.3);
    // night sky with the milky way across it
    for (let y = 0; y < hz; y++) for (let x = 0; x < cols; x++) {
      const bandD = (y - (x * 0.32 - 4)) / 6;
      const n = fbm(x * 0.08 + t * 0.01, y * 0.2, 4, 3);
      const dust = Math.exp(-bandD * bandD) * (0.4 + n);
      const dark = fbm(x * 0.15, y * 0.4, 3, 9) > 0.62 && Math.abs(bandD) < 0.6;
      if (dust > 0.4 && !dark) g.set(x, y, dust > 1 ? "▓" : dust > 0.7 ? "▒" : "░", KEYS[MW + clamp(Math.floor((dust - 0.3) * 5), 0, 5)]);
      else g.set(x, y, n > 0.6 ? "░" : " ", KEYS[SKY + clamp(Math.floor(y / hz * 4 + n), 0, 5)]);
      if (g.get(x, y) === " ") g.set(x, y, "░", KEYS[SKY]);
    }
    for (const [sx, sy, b, ph] of stars) {
      const tw = 0.5 + 0.5 * Math.sin(t * 2.2 + ph);
      const v = b * 0.6 + tw * 0.4;
      if (v > 0.35) g.set(sx, sy, v > 0.85 ? "*" : v > 0.6 ? "•" : "·", KEYS[STAR + (v > 0.85 ? 2 : v > 0.6 ? 1 : 0) + (b > 0.97 ? 1 : 0)]);
    }
    // treeline silhouette
    for (let x = 0; x < cols; x++) for (let y = trees[x]; y < hz + 1; y++) g.set(x, y, "█", KEYS[TREE + (y > hz - 2 ? 1 : 0)]);
    // ground lit by the fire
    for (let y = hz; y < rows; y++) for (let x = 0; x < cols; x++) {
      const d = Math.hypot((x - fx) / 2.2, (y - fy) * 1.1);
      const n = fbm(x * 0.2, y * 0.6, 2, 4);
      const v = clamp(Math.exp(-d / 14) * flick * 1.15 + (n - 0.5) * 0.25 + (y - hz) * 0.01);
      g.set(x, y, v > 0.6 ? "▓" : v > 0.3 ? "▒" : "░", KEYS[GROUND + clamp(Math.floor(v * 8), 0, 7)]);
    }
    // tent on the left, its fire-facing side glowing
    const tx = 24, tb = 32, th = 13;
    for (let y = tb - th; y <= tb; y++) {
      const hw = (y - (tb - th)) * 1.5;
      for (let x = Math.round(tx - hw); x <= Math.round(tx + hw); x++) {
        const side = (x - tx) / Math.max(1, hw);
        const v = clamp(0.25 + side * 0.4 * flick + (y - (tb - th)) * 0.02);
        const door = Math.abs(x - tx) < (y - (tb - th)) * 0.45 && y > tb - 7;
        g.set(x, y, door ? "▒" : side > 0.9 ? "\\" : side < -0.9 ? "/" : "█", KEYS[door ? TENT : TENT + clamp(Math.floor(v * 5), 0, 4)]);
      }
    }
    g.set(tx, tb - th - 1, "│", KEYS[TENT + 1]);
    g.line(tx + 18, tb + 1, tx + 1, tb - th, "·", KEYS[TENT + 2]);
    // logs and stones
    g.text(fx - 6, fy + 1, "▄██▀▀▄▄  ▄▄▀▀██▄", KEYS[LOG + 1]);
    g.text(fx - 7, fy + 2, "●▀▀●▀▀●▀▀●▀▀●▀▀●", KEYS[GROUND + 3]);
    // the flames: a noisy teardrop that leaps and licks
    for (let y = fy - 14; y <= fy + 1; y++) for (let x = fx - 9; x <= fx + 9; x++) {
      const h = (fy + 1 - y) / 15;
      const width = (1 - h) * 8 * (0.7 + 0.3 * h) + 0.5;
      const n = noise2(x * 0.5, y * 0.45 + t * 6, 3) * 0.6 + noise2(x * 1.1, y * 0.9 + t * 9, 8) * 0.4;
      const e = 1 - Math.abs(x - fx - Math.sin(t * 3 + y * 0.4) * h * 1.5) / width;
      const v = e * 1.2 - h * 0.6 + (n - 0.5) * 0.9;
      if (v > 0.05) g.set(x, y, v > 0.7 ? "█" : v > 0.4 ? "▓" : v > 0.2 ? "▒" : "░", KEYS[FIRE + clamp(Math.floor(v * 10 * flick), 0, 9)]);
    }
    // sparks rising and fading into the stars
    for (const [ph, sp, off, sway] of sparks) {
      const life = ((t * 0.35 * sp + off) % 1);
      const x = fx + Math.sin(ph + t * 1.5) * (1 + life * 6) + (sway - 0.5) * life * 14;
      const y = fy - 6 - life * 24;
      if (Math.sin(t * 20 + ph * 7) > -0.3) g.set(x, y, life < 0.3 ? "*" : life < 0.7 ? "•" : "·", KEYS[FIRE + clamp(9 - Math.floor(life * 8), 3, 9)]);
    }
    return g.frame();
  };
}
