/* savanna-sunset: acacia trees silhouetted on a huge setting sun while giraffes and elephants walk past. */
import { Grid, palette, gradient, KEYS, fbm, rng, clamp } from "../lib/kit.js";

const P = [];
const add = (a) => { const o = P.length; P.push(...a); return o; };
const SKY = add(gradient(["#2a0a20", "#6a1420", "#b42a18", "#e8581a", "#f8902a", "#ffc24a"], 16));
const SUN = add(gradient(["#ff9a2a", "#ffc850", "#ffe890", "#fff8d0"], 5));
const DARK = add(["#140606", "#2a0c08", "#4a1a0c", "#6a2a10"]);
const BIRD = add(["#3a0c0c"]);

export const meta = {
  slug: "savanna-sunset",
  name: "Savanna Sunset",
  category: "landscapes",
  note: "Acacia trees stand black against a huge orange sun while giraffes and elephants walk across the plain.",
  tags: ["nature", "sunset", "africa", "animals", "wallpaper", "hero"],
  cols: 104, rows: 36, fps: 15,
  palette: palette(P),
};

const GIRAFFE = [
`          ▄█▄
          ██▀
         ██
        ██
  ▄▄▄▄▄██
 ████████
 ▐█▀▀▀▀█▌
 █ ▌   █▐
 ▌ ▐   ▌ ▌`,
`          ▄█▄
          ██▀
         ██
        ██
  ▄▄▄▄▄██
 ████████
 ▐█▀▀▀▀█▌
 ▐▌ █ ▐▌█
  ▌ ▌ ▌ ▌`];
const ELEPHANT = [
`  ▄▄████▄▄
 ██████████▄
▐██████████▀█
▐█████████ ▐▌
 █▌█▌  █▌█ ▐
 ▌ ▐   ▌ ▐`,
`  ▄▄████▄▄
 ██████████▄
▐██████████▀█
▐█████████ ▐▌
 ▐█ █▌ ▐█ █▐
  ▌ ▐   ▌ ▐`];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(8);
  const hz = 26, sx = 54, sy = 22, sr = 15;
  const ground = Array.from({ length: cols }, (_, x) => hz + Math.round(fbm(x * 0.05, 1, 2, 3) * 2 - 1));
  const trees = [[18, 1.0], [80, 1.3], [94, 0.7], [40, 0.6]];
  const birds = Array.from({ length: 7 }, (_, i) => [i * 3 - (i % 2) * 1.5, Math.abs(i - 3) * 1.0, r() * 6]);
  const drawTree = (tx, s) => {
    const by = ground[Math.max(0, Math.min(cols - 1, tx))];
    const th = Math.round(9 * s), top = by - th;
    for (let y = top; y < by; y++) g.set(tx, y, "█", KEYS[DARK]);
    // forked branches
    const bw = Math.round(6 * s);
    g.line(tx, top + 3, tx - bw, top, "▀", KEYS[DARK]);
    g.line(tx, top + 2, tx + bw, top - 1, "▀", KEYS[DARK]);
    g.line(tx, top + 1, tx + 2, top - 1, "█", KEYS[DARK]);
    // flat, wide canopy
    const cw = Math.round(14 * s), cy = top - 1;
    for (let y = cy - Math.max(1, Math.round(2 * s)); y <= cy; y++) for (let x = tx - cw; x <= tx + cw; x++) {
      const e = Math.abs(x - tx) / cw + (cy - y) * 0.35 / s;
      const n = fbm(x * 0.4, y * 0.8, 2, tx);
      if (e < 0.85 + n * 0.35) g.set(x, y, e > 0.9 ? "▄" : "█", KEYS[DARK]);
    }
  };
  return (t) => {
    g.clear();
    // fiery sky, banded with thin haze
    for (let y = 0; y <= hz; y++) for (let x = 0; x < cols; x++) {
      const c = fbm(x * 0.02 + t * 0.03, y * 0.35, 3, 2);
      const glow = Math.exp(-Math.hypot((x - sx) / 2, y - sy) / 16);
      const v = clamp(0.1 + (y / hz) * 0.55 + glow * 0.45 + (c - 0.5) * 0.25);
      g.set(x, y, c > 0.6 ? "▓" : v > 0.7 ? "█" : "▒", KEYS[SKY + clamp(Math.floor(v * 16), 0, 15)]);
    }
    // the huge sun, crossed by drifting haze bands
    for (let y = sy - sr; y <= hz; y++) for (let x = sx - sr * 2; x <= sx + sr * 2; x++) {
      const d = Math.hypot((x - sx) / (sr * 2), (y - sy) / sr);
      if (d > 1) continue;
      const band = Math.sin(y * 1.3 - t * 0.6 + fbm(x * 0.05 + t * 0.1, y * 0.2, 2, 9) * 2);
      if (band > 0.82 && y > sy - sr * 0.4) { g.set(x, y, "▒", KEYS[SKY + 12]); continue; }
      const v = clamp(1 - d * 0.8 + (y - sy) * 0.01);
      g.set(x, y, d > 0.94 ? "▓" : "█", KEYS[SUN + clamp(Math.floor(v * 5), 0, 4)]);
    }
    // birds in a loose V crossing the sun
    const bx = ((t * 3) % (cols + 30)) - 15, by = 7 + Math.sin(t * 0.3) * 2;
    for (const [ox, oy, ph] of birds) g.text(bx + ox, by + oy, Math.sin(t * 6 + ph) > 0 ? "v" : "-", KEYS[BIRD]);
    // ground and grass silhouette
    for (let x = 0; x < cols; x++) for (let y = ground[x]; y < rows; y++) {
      const d = (y - ground[x]) / (rows - ground[x]);
      const n = fbm(x * 0.1, y * 0.4, 2, 6);
      const glow = Math.exp(-(((x - sx) / 40) ** 2)) * (1 - d);
      const v = clamp(glow * 0.8 + (n - 0.5) * 0.4 + (Math.sin(x * 0.3 + y * 2.1) > 0.7 ? 0.15 : 0));
      g.set(x, y, v > 0.5 ? "▓" : v > 0.25 ? "▒" : "█", KEYS[DARK + clamp(Math.floor(v * 4), 0, 3)]);
    }
    for (let x = 0; x < cols; x++) {
      const h = fbm(x * 0.6, 3, 2, 4);
      const sway = Math.sin(t * 2 + x * 0.3) > 0.5;
      if (h > 0.45) g.set(x, ground[x] - 1, sway ? "/" : "|", KEYS[DARK]);
      if (h > 0.62) g.set(x + (sway ? 1 : 0), ground[x] - 2, "'", KEYS[DARK]);
    }
    for (const [tx, s] of trees) drawTree(tx, s);
    // animals: two giraffes and a pair of elephants on a slow walk
    const step = Math.floor(t * 3) % 2;
    const span = cols + 40;
    const gx = ((t * 2.2) % span) - 20;
    g.block(Math.round(gx), hz - 9, GIRAFFE[step], KEYS[DARK]);
    g.block(Math.round(gx) - 14, hz - 8, GIRAFFE[1 - step], KEYS[DARK]);
    const ex = ((t * 1.6 + 60) % span) - 20;
    g.block(Math.round(ex), hz - 5, ELEPHANT[step], KEYS[DARK]);
    g.block(Math.round(ex) - 15, hz - 5, ELEPHANT[1 - step], KEYS[DARK]);
    return g.frame();
  };
}
