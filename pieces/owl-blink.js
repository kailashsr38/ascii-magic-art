/* owl-blink: a horned owl perched on a moonlit branch, blinking its big eyes and turning its head. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, TAU, smooth } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const SKY = add(gradient(["#050818", "#0c1430", "#182850", "#2a4070"], 10));
const MOON = add(gradient(["#c8c6a8", "#e8e4c4", "#fffbe6"], 4));
const BRANCH = add(gradient(["#1a0e06", "#33200e", "#4e341a", "#6a4a26"], 4));
const LEAF = add(["#14301a", "#22502a"]);
const FEATH = add(gradient(["#2a1a0e", "#4a2e16", "#6e4622", "#946232", "#b88446", "#d8aa6a"], 12));
const FACE = add(gradient(["#a8885a", "#c8a676", "#e4caa0"], 4));
const EYE = add(["#f4b81a", "#ffd84a", "#d86a0a"]);
const PUPIL = add(["#080402"]);
const BEAK = add(["#5a4a3a", "#8a7a64"]);
const CLAW = add(["#c8a040"]);
const STAR = add(["#d8e0ff"]);

export const meta = {
  slug: "owl-blink",
  name: "Night Owl",
  category: "animals",
  note: "A horned owl perched on a moonlit branch blinks its big yellow eyes and slowly turns its head to look around.",
  tags: ["owl", "bird", "night", "moon", "404", "hero"],
  cols: 76, rows: 38, fps: 20,
  palette: palette(P),
};

const SH = " ░▒▓█";
const KEYF = [[0, 0], [3, 0], [3.6, -1], [5.4, -1], [6, 0], [8, 0], [8.6, 1], [10.4, 1], [11, 0], [13, 0]];

function turnAt(t) {
  const p = t % 13;
  for (let i = 0; i < KEYF.length - 1; i++) {
    const [a, va] = KEYF[i], [b, vb] = KEYF[i + 1];
    if (p >= a && p < b) return va + (vb - va) * smooth((p - a) / (b - a));
  }
  return 0;
}
function blinkAt(t) {
  const p = t % 4.3;
  const one = (c) => { const d = Math.abs(p - c); return d < 0.12 ? 1 - d / 0.12 : 0; };
  return Math.max(one(1.2), Math.floor(t / 4.3) % 3 === 1 ? one(1.55) : 0);
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(13);
  const stars = Array.from({ length: 45 }, () => [Math.floor(r() * cols), Math.floor(r() * 26), r() * TAU]);
  const cx = 38;
  const ell = (ex, ey, rx, ry, fn) => {
    for (let y = Math.floor(ey - ry); y <= ey + ry; y++) for (let x = Math.floor(ex - rx); x <= ex + rx; x++) {
      const dx = (x - ex) / rx, dy = (y - ey) / ry, d = dx * dx + dy * dy;
      if (d <= 1) fn(x, y, dx, dy, d);
    }
  };
  return (t) => {
    g.clear();
    const turn = turnAt(t), blink = blinkAt(t);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const md = Math.hypot((x - 58) / 2, y - 9);
      const v = clamp(0.15 + (y / rows) * 0.35 + Math.exp(-md / 8) * 0.55 + (fbm(x * 0.05 + t * 0.02, y * 0.15, 3, 2) - 0.5) * 0.25);
      g.set(x, y, SH[1 + Math.min(3, Math.floor(v * 3.5))], KEYS[SKY + Math.min(9, Math.floor(v * 10))]);
    }
    for (const [x, y, ph] of stars) if (Math.sin(t * 1.2 + ph) > 0) g.set(x, y, "·", KEYS[STAR]);
    ell(58, 9, 14, 7, (x, y, dx, dy, d) => g.set(x, y, noise2(x * 0.3, y * 0.5, 4) > 0.65 ? "▓" : "█", KEYS[MOON + Math.min(3, Math.floor((1 - d) * 3 + 0.8 - dx * 0.4))]));
    for (let x = 0; x < cols; x++) {
      const y0 = 31 + Math.round(Math.sin(x * 0.06) * 0.8 + (x - cx) * 0.03);
      for (let k = 0; k < 3; k++) g.set(x, y0 + k, k === 0 ? "▄" : noise2(x * 0.4, k, 5) > 0.6 ? "▓" : "█", KEYS[BRANCH + (k === 0 ? 3 : 2 - k + 1)]);
      if (x % 13 === 4) { g.text(x - 1, y0 - 1, "▄█▄", KEYS[LEAF + 1]); g.text(x - 2, y0 - 2, "▄▀ ▀", KEYS[LEAF]); }
    }
    for (let y = 34; y < rows; y++) for (let x = 0; x < cols; x++) g.set(x, y, noise2(x * 0.3, y, 3) > 0.5 ? "▓" : "█", KEYS[LEAF]);
    const bcy = 23 + Math.sin(t * 1.1) * 0.15;
    ell(cx, bcy, 13, 8, (x, y, dx, dy, d) => {
      const wing = Math.abs(dx) > 0.62;
      const lit = clamp(0.55 - dy * 0.2 - dx * 0.2 + (1 - d) * 0.25);
      if (wing) g.set(x, y, (y + (dx > 0 ? x : -x)) % 3 === 0 ? "▓" : "█", KEYS[FEATH + Math.min(11, Math.floor(lit * 8))]);
      else {
        const chest = Math.hypot(dx / 0.62, (dy - 0.15) / 0.95) < 1;
        const chev = chest && (Math.round(y) + Math.round(Math.abs(x - cx) * 0.5)) % 2 === 0;
        g.set(x, y, chev ? "v" : "█", KEYS[chest ? FEATH + (chev ? 6 : 10) : FEATH + Math.min(11, Math.floor(lit * 10))]);
      }
    });
    for (const fx of [cx - 5, cx + 3]) g.text(fx, 30, "▼▼▼", KEYS[CLAW]);
    const hcx = cx + turn * 1.5, hcy = 11.5;
    const ftx = cx + turn * 5.5;
    for (const [ex, dir] of [[hcx - 9, -1], [hcx + 9, 1]]) for (let k = 0; k < 4; k++) {
      const w = 1 + Math.floor(k * 0.8);
      for (let dx = 0; dx < w; dx++) g.set(ex + dir * (3 - k) * 0.6 - dir * dx, hcy - 7 + k, "█", KEYS[FEATH + 3 + k]);
    }
    ell(hcx, hcy, 14, 6.6, (x, y, dx, dy, d) => {
      const lit = clamp(0.6 - dy * 0.3 + (1 - d) * 0.25 + noise2(x * 0.6, y, 8) * 0.15);
      g.set(x, y, noise2(x * 0.8, y * 1.2, 9) > 0.75 ? "▓" : "█", KEYS[FEATH + Math.min(11, Math.floor(lit * 10))]);
    });
    const eyes = [[ftx - 5.8, -1], [ftx + 5.8, 1]];
    for (const [ex, side] of eyes) {
      const far = clamp(side * -turn);
      const rx = 5.2 * (1 - far * 0.4);
      ell(ex, hcy + 0.3, rx, 3.6, (x, y, dx, dy, d) => g.set(x, y, d > 0.7 ? "▓" : "█", KEYS[FACE + Math.min(3, Math.floor((1 - d) * 3) + 1)]));
    }
    for (const [ex, side] of eyes) {
      const far = clamp(side * -turn);
      const rx = 3.6 * (1 - far * 0.45), ry = 2.1 * (1 - blink);
      if (ry < 0.45) { g.hline(Math.round(ex - rx), Math.round(ex + rx), Math.round(hcy + 0.3), "▀", KEYS[FEATH + 2]); continue; }
      ell(ex, hcy + 0.3, rx, ry, (x, y, dx, dy, d) => g.set(x, y, d > 0.65 ? "█" : "█", KEYS[EYE + (d > 0.7 ? 2 : dy < -0.3 ? 1 : 0)]));
      const px = ex + turn * 1.2;
      ell(px, hcy + 0.3, 1.5 * (1 - far * 0.4), Math.max(0.5, 1.0 * (1 - blink)), (x, y) => g.set(x, y, "█", KEYS[PUPIL]));
      g.set(px - 0.6, hcy - 0.4, "▪", KEYS[MOON + 3]);
      if (blink > 0.2) g.hline(Math.round(ex - rx), Math.round(ex + rx), Math.round(hcy + 0.3 - ry), "▄", KEYS[FEATH + 3]);
    }
    g.set(ftx, hcy + 2.6, "█", KEYS[BEAK + 1]);
    g.set(ftx, hcy + 3.6, "▼", KEYS[BEAK]);
    g.set(ftx - 1, hcy - 2.6, "\\", KEYS[FEATH + 1]); g.set(ftx + 1, hcy - 2.6, "/", KEYS[FEATH + 1]);
    return g.frame();
  };
}
