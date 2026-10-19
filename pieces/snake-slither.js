/* snake-slither: a banded snake slithering across rippled desert sand in an S curve, leaving its track behind. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const SAND = add(gradient(["#8a5a2a", "#a87238", "#c48c4a", "#dca862", "#ecc282", "#f6dca8"], 12));
const TRACK = add(["#7a4e24", "#94622e"]);
const ROCK = add(gradient(["#4a3a2e", "#6e5a48", "#948070"], 3));
const GREEN = add(gradient(["#14301a", "#1e4a22", "#2e6a2a", "#4a8a34", "#6eaa44"], 8));
const BAND = add(gradient(["#6a5a10", "#a88a1a", "#e0c040", "#f4e07a"], 5));
const EYE = add(["#0a0a06", "#ffe680"]);
const TONGUE = add(["#e02a3a"]);
const SHADOW = add(["#6a4420"]);

export const meta = {
  slug: "snake-slither",
  name: "Slithering Snake",
  category: "animals",
  note: "A banded green snake slithers across rippled desert sand in a smooth S curve, flicking its tongue and leaving a track.",
  tags: ["snake", "reptile", "desert", "loader", "wallpaper"],
  cols: 96, rows: 32, fps: 24,
  palette: palette(P),
};

const N = 130, LAG = 0.03;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(71);
  const rocks = Array.from({ length: 7 }, () => [Math.floor(r() * cols), Math.floor(r() * rows), 1.5 + r() * 2.5]);
  const base = (tau) => [cols / 2 + Math.sin(tau * 0.32) * 34, rows / 2 + Math.sin(tau * 0.64) * 8];
  const path = (tau) => {
    const [x, y] = base(tau), [x2, y2] = base(tau + 0.01);
    const dx = (x2 - x), dy = (y2 - y) * 2, l = Math.hypot(dx, dy) || 1;
    const w = Math.sin(tau * 4.2) * 2.2;
    return [x - (dy / l) * w * 2, y + (dx / l) * w * 0.5];
  };
  return (t) => {
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const dune = fbm(x * 0.03, y * 0.06, 3, 3);
      const rip = Math.sin(x * 0.22 + y * 0.7 + dune * 6);
      const v = clamp(0.45 + (dune - 0.5) * 0.9 + rip * 0.1);
      g.set(x, y, v > 0.62 ? "▓" : "▒", KEYS[SAND + Math.min(11, Math.floor(v * 12))]);
    }
    for (const [rx, ry, rr] of rocks) for (let y = Math.floor(ry - rr / 2); y <= ry + rr / 2; y++) for (let x = Math.floor(rx - rr); x <= rx + rr; x++) {
      const d = Math.hypot((x - rx) / rr, (y - ry) / (rr / 2));
      if (d < 1) g.set(x, y, d > 0.8 ? "▓" : "█", KEYS[ROCK + Math.min(2, Math.floor((1 - d) * 2 + (y < ry ? 1 : 0)))]);
      else if (d < 1.3 && y > ry) g.set(x + 1, y, "▒", KEYS[SHADOW]);
    }
    for (let i = N; i < N + 260; i += 1) {
      const [x, y] = path(t - i * LAG);
      if (x < -2 || x > cols + 2) continue;
      const fade = (i - N) / 260;
      g.set(x, y, fade < 0.6 ? "▒" : "░", KEYS[TRACK + (fade < 0.5 ? 0 : 1)]);
      g.set(x, y + 1, "░", KEYS[TRACK + 1]);
    }
    for (let i = N; i >= 0; i -= 1) {
      const u = i / N;
      const [x, y] = path(t - i * LAG);
      if (x < -4 || x > cols + 4) continue;
      const [x2, y2] = path(t - (i + 1) * LAG);
      const ang = Math.atan2((y - y2) * 2, x - x2);
      const rad = i < 4 ? 1.9 : 1.65 * Math.pow(1 - u, 0.6) + 0.3;
      const banded = i > 10 && Math.floor(i / 8) % 3 === 0;
      for (let yy = Math.floor(y - rad); yy <= y + rad; yy++) for (let xx = Math.floor(x - rad * 2); xx <= x + rad * 2; xx++) {
        const dx = (xx - x) / 2, dy = yy - y;
        const d = Math.hypot(dx, dy) / rad;
        if (d > 1) continue;
        const side = -dx * Math.sin(ang) + dy * Math.cos(ang);
        const lit = clamp(0.65 - d * 0.35 - dy * 0.12 + (1 - u) * 0.1);
        if (banded) g.set(xx, yy, d > 0.75 ? "▓" : "█", KEYS[BAND + Math.min(4, Math.floor(lit * 5))]);
        else {
          const diamond = Math.abs(side) < 0.5 && (i % 5) < 3;
          g.set(xx, yy, d > 0.75 ? "▓" : "█", KEYS[GREEN + Math.min(7, Math.floor(lit * 8) - (diamond ? 2 : 0))]);
        }
      }
    }
    const [hx, hy] = path(t);
    const [px, py] = path(t - LAG);
    const a = Math.atan2((hy - py) * 2, hx - px);
    const fx = Math.cos(a), fy = Math.sin(a) * 0.5;
    for (let k = 1; k <= 2; k++) for (let yy = -1; yy <= 1; yy++) g.set(hx + fx * k * 1.5, hy + fy * k * 1.5 + yy * (k === 2 ? 0.5 : 1), "█", KEYS[GREEN + 6]);
    const nx = -Math.sin(a), ny = Math.cos(a) * 0.5;
    g.set(hx + fx * 2 + nx * 2.4, hy + fy * 2 + ny * 2.4, "●", KEYS[EYE]);
    g.set(hx + fx * 2 - nx * 2.4, hy + fy * 2 - ny * 2.4, "●", KEYS[EYE]);
    if ((t % 1.3) < 0.4) {
      for (let k = 4; k <= 6; k++) g.set(hx + fx * k, hy + fy * k, "─", KEYS[TONGUE]);
      g.set(hx + fx * 7, hy + fy * 7, fx > 0 ? "<" : ">", KEYS[TONGUE]);
    }
    return g.frame();
  };
}
