/* kinetic-word-slam: punchy kinetic type where big words zoom in from the camera and slam down with a shake. */
import { Grid, palette, rng } from "../lib/kit.js";

/* 5x7 block font, drawn fresh for this piece. */
const FONT7 = {
  A: ".###.|#...#|#...#|#####|#...#|#...#|#...#", B: "####.|#...#|#...#|####.|#...#|#...#|####.",
  C: ".###.|#...#|#....|#....|#....|#...#|.###.", D: "####.|#...#|#...#|#...#|#...#|#...#|####.",
  E: "#####|#....|#....|####.|#....|#....|#####", F: "#####|#....|#....|####.|#....|#....|#....",
  G: ".###.|#...#|#....|#.###|#...#|#...#|.####", H: "#...#|#...#|#...#|#####|#...#|#...#|#...#",
  I: "#####|..#..|..#..|..#..|..#..|..#..|#####", J: "..###|...#.|...#.|...#.|#..#.|#..#.|.##..",
  K: "#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#", L: "#....|#....|#....|#....|#....|#....|#####",
  M: "#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#", N: "#...#|##..#|#.#.#|#.#.#|#..##|#...#|#...#",
  O: ".###.|#...#|#...#|#...#|#...#|#...#|.###.", P: "####.|#...#|#...#|####.|#....|#....|#....",
  Q: ".###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#", R: "####.|#...#|#...#|####.|#.#..|#..#.|#...#",
  S: ".###.|#...#|#....|.###.|....#|#...#|.###.", T: "#####|..#..|..#..|..#..|..#..|..#..|..#..",
  U: "#...#|#...#|#...#|#...#|#...#|#...#|.###.", V: "#...#|#...#|#...#|#...#|#...#|.#.#.|..#..",
  W: "#...#|#...#|#...#|#.#.#|#.#.#|##.##|#...#", X: "#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#",
  Y: "#...#|#...#|.#.#.|..#..|..#..|..#..|..#..", Z: "#####|....#|...#.|..#..|.#...|#....|#####",
  0: ".###.|#...#|#..##|#.#.#|##..#|#...#|.###.", 1: "..#..|.##..|..#..|..#..|..#..|..#..|.###.",
  2: ".###.|#...#|....#|...#.|..#..|.#...|#####", 3: "####.|....#|....#|.###.|....#|....#|####.",
  4: "...#.|..##.|.#.#.|#..#.|#####|...#.|...#.", 5: "#####|#....|####.|....#|....#|#...#|.###.",
  6: ".###.|#....|#....|####.|#...#|#...#|.###.", 7: "#####|....#|...#.|..#..|.#...|.#...|.#...",
  8: ".###.|#...#|#...#|.###.|#...#|#...#|.###.", 9: ".###.|#...#|#...#|.####|....#|....#|.###.",
  ":": ".....|..#..|..#..|.....|..#..|..#..|.....", "!": "..#..|..#..|..#..|..#..|..#..|.....|..#..",
  ".": ".....|.....|.....|.....|.....|.....|..#..", "-": ".....|.....|.....|.###.|.....|.....|.....",
  "?": ".###.|#...#|....#|...#.|..#..|.....|..#..", "'": "..#..|..#..|.....|.....|.....|.....|.....",
  " ": ".....|.....|.....|.....|.....|.....|.....",
};
const GL7 = {};
for (const k in FONT7) GL7[k] = FONT7[k].split("|");
const glyph7 = (c) => GL7[c] || GL7[" "];
/* Rasterise a word: each font pixel becomes sx by sy cells, letters gap cells apart. */
function textMask(word, sx = 1, sy = 1, gap = 1) {
  const cw = 5 * sx + gap, w = word.length * cw - gap, h = 7 * sy;
  const m = new Uint8Array(w * h), li = new Int16Array(w * h).fill(-1);
  [...word].forEach((c, k) => {
    const gl = glyph7(c);
    for (let j = 0; j < 7; j++) for (let i = 0; i < 5; i++) if (gl[j][i] === "#")
      for (let a = 0; a < sy; a++) for (let b = 0; b < sx; b++) { const p = k * cw + i * sx + b + (j * sy + a) * w; m[p] = 1; li[p] = k; }
  });
  return { w, h, m, li, at: (x, y) => (x >= 0 && y >= 0 && x < w && y < h ? m[x + y * w] : 0) };
}

export const meta = {
  slug: "kinetic-word-slam",
  name: "Kinetic Word Slam",
  category: "lettering",
  note: "Big words zoom in from the camera one beat at a time and slam into place with a screen shake and a burst of dust.",
  tags: ["kinetic", "promo", "hero", "intro", "letters", "bold"],
  cols: 100, rows: 28, fps: 30,
  palette: palette(["#ffffff", "#ffd166", "#ff5a5f", "#7ee787", "#79c0ff", "#8b949e", "#3a3f4a", "#d2a8ff", "#202530"]),
};

const SEQ = [["MAKE", "0"], ["IT", "1"], ["BOLD", "2"], ["SHIP", "4"], ["IT", "3"], ["NOW", "7"]];
const BEAT = 1.05;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const masks = SEQ.map(([w]) => textMask(w, 1, 1, 1));
  const R = rng(8), dust = [];
  for (let i = 0; i < 40; i++) dust.push([R() * 2 - 1, R() * 0.6 + 0.2, R()]);
  const draw = (M, scale, cx, cy, ch, co) => {
    const cw = scale * 3, chh = scale * 1.5; // cells per font pixel
    const w = M.w * cw, h = M.h * chh;
    const x0 = Math.floor(cx - w / 2), y0 = Math.floor(cy - h / 2);
    const xa = Math.max(0, x0), xb = Math.min(cols - 1, x0 + w), ya = Math.max(0, y0), yb = Math.min(rows - 1, y0 + h);
    for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++)
      if (M.at(Math.floor((x - x0) / cw), Math.floor((y - y0) / chh))) g.set(x, y, ch, co);
    return [x0, y0, w, h];
  };
  return (t) => {
    g.clear();
    const n = SEQ.length, cyc = ((t % (BEAT * n)) + BEAT * n) % (BEAT * n);
    const i = Math.floor(cyc / BEAT), lt = cyc - i * BEAT;
    const [, co] = SEQ[i];
    const M = masks[i], prev = masks[(i + n - 1) % n];
    const IN = 0.22;
    const fit = Math.min((cols - 6) / (M.w * 3), (rows - 6) / (M.h * 1.5), 2.6);
    let shakeX = 0, shakeY = 0;
    if (lt > IN) { const d = lt - IN; const a = Math.exp(-d * 9) * 3; shakeX = Math.round(Math.sin(d * 70) * a); shakeY = Math.round(Math.cos(d * 55) * a * 0.5); }
    const cx = cols / 2 + shakeX, cy = rows / 2 + shakeY;
    // speed lines while the word flies in
    if (lt < IN) {
      for (let k = 0; k < 36; k++) {
        const a = (k / 36) * Math.PI * 2 + i, r0 = 8 + (1 - lt / IN) * 30;
        for (let r = r0; r < r0 + 8; r += 1) g.set(cols / 2 + Math.cos(a) * r * 2, rows / 2 + Math.sin(a) * r * 0.9, "·", "5");
      }
      // the previous word shrinks away behind
      const ps = Math.max(0.2, Math.min((cols - 6) / (prev.w * 3), (rows - 6) / (prev.h * 1.5), 2.6) * (1 - lt / IN));
      draw(prev, ps, cols / 2, rows / 2, "▒", "6");
    }
    const e = lt < IN ? lt / IN : 1;
    const scale = fit * (1 + (1 - e) * (1 - e) * 5);
    if (lt >= IN) draw(M, fit, cx + 1, cy + 1, "▓", "8");
    const box = draw(M, scale, cx, cy, lt < IN ? "▓" : "█", co);
    // dust burst from the base on impact
    if (lt > IN && lt < IN + 0.7) {
      const d = lt - IN, base = box[1] + box[3];
      for (const [vx, vy, s] of dust) {
        const x = cols / 2 + vx * (box[2] / 2 + d * 50 * (0.5 + s)), y = base - vy * d * 30 + d * d * 30;
        if (y < base + 1) g.set(x, y, d < 0.3 ? "▒" : "░", "5");
      }
    }
    // beat ticker at the bottom
    for (let k = 0; k < n; k++) g.text(cols / 2 - n * 2 + k * 4, rows - 1, k === i ? "■" : "□", k === i ? co : "6");
    return g.frame();
  };
}
