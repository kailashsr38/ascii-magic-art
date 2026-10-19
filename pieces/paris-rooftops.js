/* paris-rooftops: zinc rooftops and chimneys at twilight, an iron tower far off. */
import { Grid, palette, gradient, KEYS, fbm, rng, clamp } from "../lib/kit.js";

const P = [];
const add = (a) => { const o = P.length; P.push(...a); return o; };
const SKY = add(gradient(["#121638", "#2a2c66", "#5b3f80", "#a85a80", "#e9876a", "#f8c47c"], 16));
const FAR = add(gradient(["#2a2148", "#3d2f5c"], 3));
const TOW = add(["#1a1330", "#33284c", "#ffdf8a", "#fff6d0"]);
const ZINC = add(gradient(["#343e5a", "#5d6886", "#8e9ab8"], 6));
const STONE = add(gradient(["#3e3552", "#6b5d78", "#8e7f96"], 4));
const WIN = add(["#221c36", "#e09a42", "#ffcf72", "#fff0b8"]);
const CHIM = add(["#4c3a52", "#7a5662", "#b8664a"]);
const SMOKE = add(gradient(["#4a4566", "#8a84a4", "#b3aec6"], 4));
const STAR = add(["#e8e6ff"]);

export const meta = {
  slug: "paris-rooftops",
  name: "Paris Rooftops",
  category: "landscapes",
  note: "Zinc rooftops, chimney smoke and lit windows at twilight, with an iron tower on the far skyline.",
  tags: ["city", "twilight", "rooftops", "wallpaper", "hero"],
  cols: 100, rows: 36, fps: 20,
  palette: palette(P),
};

const SH = " ░▒▓█";
const k = (o, n, v) => KEYS[o + clamp(Math.floor(v * n), 0, n - 1)];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(31);
  const horizon = 23;
  const stars = Array.from({ length: 30 }, () => [Math.floor(r() * cols), Math.floor(r() * 8), r() * 6.28]);
  // far skyline height per column
  const far = Array.from({ length: cols }, (_, x) => 20 + Math.floor(fbm(x * 0.09, 3, 3, 5) * 4) - (Math.floor(x / 5) % 3 === 0 ? 1 : 0));
  // near buildings
  const bld = [];
  for (let x = 0; x < cols;) {
    const w = 11 + Math.floor(r() * 8), top = 22 + Math.floor(r() * 5);
    const ch = [];
    const nc = 1 + Math.floor(r() * 3);
    for (let i = 0; i < nc; i++) ch.push({ x: x + 2 + Math.floor(r() * (w - 5)), h: 2 + Math.floor(r() * 2), smoke: r() < 0.6, ph: r() * 10 });
    bld.push({ x, w, top, ch, seed: Math.floor(r() * 1e6) });
    x += w;
  }
  const winRand = Array.from({ length: cols * rows }, () => [r(), r() * 20 + 6, r() * 50]);
  return (t) => {
    g.clear();
    // twilight sky with drifting cloud streaks
    for (let y = 0; y < horizon + 4; y++) for (let x = 0; x < cols; x++) {
      const c = fbm(x * 0.03 + t * 0.03, y * 0.3, 4, 2);
      const sun = Math.exp(-(((x - 30) / 40) ** 2)) * 0.12;
      const v = clamp(y / (horizon + 2) + (c - 0.5) * 0.35 + sun);
      const ch = c > 0.62 ? "▓" : c > 0.48 ? "▒" : "░";
      g.set(x, y, v > 0.7 ? (c > 0.55 ? "█" : "▓") : ch, k(SKY, 16, v + (c > 0.62 ? 0.08 : 0)));
    }
    for (const [sx, sy, ph] of stars) { const tw = Math.sin(t * 1.4 + ph); if (tw > 0.2) g.set(sx, sy, tw > 0.8 ? "*" : "·", KEYS[STAR]); }
    // iron tower silhouette
    const tx = 76, ty = 2, tb = 22;
    for (let y = ty; y <= tb; y++) {
      const s = (y - ty) / (tb - ty), w = 0.4 + 8 * Math.pow(s, 2.3);
      const l = Math.round(tx - w), rr = Math.round(tx + w);
      for (let x = l; x <= rr; x++) {
        const edge = x === l || x === rr;
        const arch = s > 0.78 && Math.abs(x - tx) < (s - 0.78) * 22 && Math.abs(x - tx) < w - 1.5;
        if (arch) continue;
        const lat = (x + y) % 2 === 0 ? "╳" : "▓";
        g.set(x, y, edge ? (w > 2 ? (x === l ? "/" : "\\") : "█") : w < 1.5 ? "█" : lat, KEYS[TOW + (edge || w < 1.5 ? 0 : 1)]);
      }
      if (Math.abs(s - 0.42) < 0.03 || Math.abs(s - 0.72) < 0.03) for (let x = l - 1; x <= rr + 1; x++) g.set(x, y, "▀", KEYS[TOW]);
    }
    g.set(tx, ty - 1, "│", KEYS[TOW]);
    if (Math.sin(t * 3) > 0) g.set(tx, ty - 2, "●", KEYS[TOW + 3]);
    else g.set(tx, ty - 2, "•", KEYS[TOW + 2]);
    // far rooftops
    for (let x = 0; x < cols; x++) for (let y = far[x]; y < rows; y++) {
      const lit = (x * 7 + y * 13) % 17 === 0 && Math.sin(t * 0.3 + x) > -0.3;
      g.set(x, y, lit ? "▪" : "▓", lit ? KEYS[WIN + 1] : KEYS[FAR + ((x + y) % 3 === 0 ? 1 : 0)]);
    }
    // near buildings with mansard roofs
    for (const b of bld) {
      const roofH = 4;
      for (const c of b.ch) for (let y = b.top - c.h; y < b.top + 1; y++) {
        g.set(c.x, y, "█", KEYS[CHIM]); g.set(c.x + 1, y, "▓", KEYS[CHIM + 1]);
        if (y === b.top - c.h) { g.set(c.x, y - 1, "▄", KEYS[CHIM + 2]); g.set(c.x + 1, y - 1, "▄", KEYS[CHIM + 2]); }
      }
      for (let j = 0; j < roofH; j++) {
        const y = b.top + j, inset = roofH - 1 - j;
        for (let x = b.x + inset; x < b.x + b.w - inset; x++) {
          const seam = (x - b.x) % 2 === 0;
          const v = 1 - j / roofH * 0.8 + (seam ? 0.1 : -0.1);
          g.set(x, y, j === 0 ? "▄" : seam ? "▓" : "▒", k(ZINC, 6, v * 0.95));
        }
        if (inset > 0) { g.set(b.x + inset - 1, y, "▗", k(ZINC, 6, 0.3)); g.set(b.x + b.w - inset, y, "▖", k(ZINC, 6, 0.3)); }
      }
      // dormers
      for (let x = b.x + 3; x < b.x + b.w - 3; x += 4) {
        const wr = winRand[x + b.top * cols];
        const on = wr[0] < 0.55 && Math.sin(t / wr[1] * 6.28 + wr[2]) > -0.6;
        g.set(x, b.top + 1, "▄", k(ZINC, 6, 0.9));
        g.set(x, b.top + 2, on ? "█" : "▓", KEYS[WIN + (on ? 2 : 0)]);
      }
      // facade
      g.hline(b.x, b.x + b.w - 1, b.top + roofH, "▀", KEYS[STONE + 3]);
      for (let y = b.top + roofH + 1; y < rows; y++) for (let x = b.x; x < b.x + b.w; x++) {
        const lx = x - b.x, ly = y - (b.top + roofH + 1);
        const isWin = lx % 4 >= 2 && lx < b.w - 1 && ly % 3 < 2;
        if (isWin) {
          const wr = winRand[(b.x + Math.floor(lx / 4) * 4) + (b.top + Math.floor(ly / 3) * 3) * cols];
          const on = wr[0] < 0.62 && Math.sin(t / wr[1] * 6.28 + wr[2]) > -0.5;
          g.set(x, y, on ? (ly % 3 === 0 ? "█" : "▓") : "█", KEYS[WIN + (on ? (wr[0] < 0.2 ? 3 : 2 - (ly % 3)) : 0)]);
        } else g.set(x, y, lx === 0 ? "▌" : ly % 3 === 2 ? "▄" : "▓", KEYS[STONE + (lx === 0 ? 0 : ly % 3 === 2 ? 2 : 1)]);
      }
      // smoke
      for (const c of b.ch) if (c.smoke) for (let i = 0; i < 9; i++) {
        const age = ((t * 0.8 + c.ph + i * 0.45) % 4) / 4;
        const sx = c.x + 0.5 + age * 9 + Math.sin(t + i) * 0.8, sy = b.top - c.h - 1.5 - age * 7;
        const d = 1 - age;
        g.set(sx, sy, d > 0.6 ? "▓" : d > 0.3 ? "▒" : "░", k(SMOKE, 4, 0.3 + age * 0.7));
        if (age > 0.3) g.set(sx + 1, sy, "░", k(SMOKE, 4, age));
      }
    }
    return g.frame();
  };
}
