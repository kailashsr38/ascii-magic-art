/* octopus: a red octopus hovering over the reef, waving and curling its eight arms. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const SEA = add(gradient(["#031428", "#06223e", "#0a3456", "#104a70", "#1a6488", "#2a80a0"], 12));
const SAND = add(gradient(["#3a3424", "#5a5034", "#7a6c48", "#9a8a5e"], 6));
const ROCK = add(gradient(["#1a1e24", "#2e343c", "#464e56"], 3));
const WEED = add(gradient(["#1a4a2a", "#2a6a34", "#3e8a40"], 3));
const CORAL = add(["#e05a7a", "#f08a5a", "#c84aa0"]);
const SKIN = add(gradient(["#5a0e10", "#8a1a16", "#b8301e", "#d8502a", "#ee783c", "#f8a060"], 12));
const SUCK = add(["#f4c0a0", "#ffe0cc"]);
const EYE = add(["#fff4dc", "#0a0604"]);
const BUB = add(["#8ad0e4", "#e0f8ff"]);

export const meta = {
  slug: "octopus",
  name: "Octopus",
  category: "animals",
  note: "A red octopus hovers above the reef, waving and curling its eight sucker-lined arms in the blue water.",
  tags: ["octopus", "ocean", "underwater", "reef", "hero", "wallpaper"],
  cols: 86, rows: 36, fps: 24,
  palette: palette(P),
};

const SH = " ░▒▓█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const bed = 30;
  const r = rng(29);
  const weeds = Array.from({ length: 9 }, () => [Math.floor(r() * cols), 4 + Math.floor(r() * 6), r() * TAU]);
  const bubbles = Array.from({ length: 14 }, () => [r(), 0.15 + r() * 0.2, r() * TAU]);
  const disc = (cx, cy, rad, keyFn, ch) => {
    for (let y = Math.floor(cy - rad); y <= cy + rad; y++) for (let x = Math.floor(cx - rad * 2); x <= cx + rad * 2; x++) {
      const d = Math.hypot((x - cx) / 2, y - cy) / rad;
      if (d <= 1) g.set(x, y, ch ? ch(d) : d > 0.75 ? "▓" : "█", keyFn(d, x, y));
    }
  };
  return (t) => {
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const ray = Math.sin((x - y * 0.6) * 0.14 + t * 0.2) > 0.8 ? 0.12 * (1 - y / rows) : 0;
      const n = fbm(x * 0.05 + t * 0.05, y * 0.12, 3, 2);
      const v = clamp(0.85 - (y / rows) * 0.6 + ray + (n - 0.5) * 0.3);
      g.set(x, y, ray ? "▒" : SH[2 + Math.min(2, Math.floor(n * 3))], KEYS[SEA + Math.min(11, Math.floor(v * 12))]);
    }
    for (let y = bed; y < rows; y++) for (let x = 0; x < cols; x++) {
      const n = noise2(x * 0.3, y * 0.7, 5);
      g.set(x, y, n > 0.7 ? "o" : n > 0.4 ? "▓" : "█", KEYS[SAND + Math.min(5, Math.floor(n * 4 + (rows - y) * 0.3))]);
    }
    for (const [rx, rw] of [[10, 7], [70, 9]]) for (let y = bed - 4; y <= bed; y++) for (let x = rx - rw; x <= rx + rw; x++) {
      const d = Math.hypot((x - rx) / rw, (y - bed) / 4);
      if (d < 1) g.set(x, y, d > 0.8 ? "▓" : "█", KEYS[ROCK + Math.min(2, Math.floor((1 - d) * 2 + (y < bed - 2 ? 1 : 0)))]);
    }
    for (const [cx, k] of [[18, 0], [62, 1], [78, 2]]) for (let j = 0; j < 4; j++) g.text(cx - 2 + (j % 2), bed - 1 - j, j % 2 ? "Y" : "\\|/", KEYS[CORAL + k]);
    for (const [wx, h, ph] of weeds) for (let k = 0; k < h; k++) g.set(wx + Math.sin(t * 1.3 + ph + k * 0.4) * k * 0.25, bed - k, k % 2 ? "(" : ")", KEYS[WEED + Math.min(2, k >> 1)]);
    const bob = Math.sin(t * 1.1) * 0.8;
    const mx = 43 + Math.sin(t * 0.4) * 3, my = 10 + bob;
    const breathe = 1 + Math.sin(t * 2.2) * 0.04;
    const arms = [];
    for (let i = 0; i < 8; i++) {
      const base = Math.PI * (0.06 + 0.88 * (i / 7));
      let a = base, x = mx + Math.cos(base) * 8, y = my + 5 + Math.sin(base) * 1.5;
      const pts = [];
      const N = 24;
      for (let s = 0; s < N; s++) {
        const u = s / N;
        a = base + Math.sin(u * 3.2 - t * 2.1 + i * 0.9) * 0.7 * u + (i < 4 ? -1 : 1) * Math.pow(u, 3) * 2.2 * (0.6 + 0.4 * Math.sin(t * 0.8 + i));
        x += Math.cos(a) * 1.7; y += Math.sin(a) * 0.85;
        pts.push([x, y, 1.6 * (1 - u) + 0.35, a]);
      }
      arms.push({ pts, far: i % 2 === 1 });
    }
    for (const pass of [true, false]) for (const arm of arms) {
      if (arm.far !== pass) continue;
      for (let k = arm.pts.length - 1; k >= 0; k--) {
        const [x, y, rad, a] = arm.pts[k];
        disc(x, y, rad, (d, xx, yy) => KEYS[SKIN + Math.max(0, Math.min(11, Math.floor((pass ? 0.4 : 0.7) * 12 - d * 3 - (yy - y) * 0.6)))]);
        if (k % 2 === 0 && k < arm.pts.length - 3) g.set(x - Math.sin(a) * rad * 1.2, y + Math.cos(a) * rad * 0.6, "o", KEYS[SUCK + (pass ? 0 : 1)]);
      }
    }
    for (let y = Math.floor(my - 9 * breathe); y <= my + 6; y++) for (let x = Math.floor(mx - 26); x <= mx + 26; x++) {
      const dx = (x - mx) / (12 * breathe), dy = (y - my + 1.5) / (8 * breathe);
      const dd = dx * dx + dy * dy * (dy > 0 ? 1.6 : 1);
      if (dd > 1) continue;
      const spot = noise2(x * 0.5, y * 0.9, 7) > 0.72;
      const lit = clamp(0.8 - dy * 0.35 - dx * 0.15 + Math.sqrt(1 - dd) * 0.25 - (spot ? 0.25 : 0));
      g.set(x, y, spot ? "▓" : "█", KEYS[SKIN + Math.min(11, Math.floor(lit * 12))]);
    }
    for (const ex of [mx - 6, mx + 6]) {
      for (let dx = -2; dx <= 2; dx++) g.set(ex + dx, my + 3, "█", KEYS[EYE]);
      g.set(ex - 1, my + 3, "█", KEYS[EYE + 1]); g.set(ex, my + 3, "█", KEYS[EYE + 1]); g.set(ex + 1, my + 3, "█", KEYS[EYE + 1]);
      g.text(ex - 2, my + 2, "▄▄▄▄▄", KEYS[SKIN + 9]);
    }
    for (const [bx, sp, ph] of bubbles) {
      const a = (t * sp + bx) % 1;
      const y = my - 2 - a * (my + 2);
      g.set(mx + 13 + Math.sin(t * 3 + ph) + a * 6, y, a > 0.5 ? "o" : "°", KEYS[BUB + (a > 0.5 ? 1 : 0)]);
    }
    return g.frame();
  };
}
