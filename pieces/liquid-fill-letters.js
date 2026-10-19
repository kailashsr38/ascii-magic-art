/* liquid-fill-letters: hollow glass letters fill up with sloshing liquid and bubbles, then drain. */
import { Grid, palette, gradient, rng } from "../lib/kit.js";

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

const LIQ = gradient(["#7af0ff", "#2fb4e6", "#1a6fc0", "#123a7a"], 10);

export const meta = {
  slug: "liquid-fill-letters",
  name: "Liquid Fill Letters",
  category: "lettering",
  note: "Hollow glass letters spelling WATER fill up with sloshing blue liquid and rising bubbles, then drain and refill.",
  tags: ["liquid", "water", "fill", "loader", "hero", "letters"],
  cols: 92, rows: 28, fps: 30,
  palette: palette([...LIQ, "#e6f7ff", "#5c7080", "#2a3640", "#c9f6ff", "#141c22"]),
};

const PER = 9;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const M = textMask("WATER", 3, 3, 3);
  const X0 = Math.floor((cols - M.w) / 2), Y0 = Math.floor((rows - M.h) / 2);
  const wall = [];
  for (let y = -1; y <= M.h; y++) for (let x = -1; x <= M.w; x++) {
    if (M.at(x, y)) continue;
    let n = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) n += M.at(x + dx, y + dy);
    if (n) wall.push([X0 + x, Y0 + y]);
  }
  const R = rng(9), bubbles = [];
  for (let i = 0; i < 60; i++) bubbles.push([Math.floor(R() * M.w), R() * 10, 2 + R() * 4]);
  return (t) => {
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if ((x + y * 3) % 7 === 0) g.set(x, y, "·", "e");
    const c = ((t % PER) + PER) % PER;
    // level from 0 (empty) to 1 (full): fill, hold, drain
    const lv = c < 4.2 ? c / 4.2 : c < 6.2 ? 1 : c < 8.4 ? 1 - (c - 6.2) / 2.2 : 0;
    const e = lv * lv * (3 - 2 * lv);
    const slosh = (c < 4.2 ? 1 : c < 6.2 ? 1 - (c - 4.2) / 2 : 0.8) * 1.3;
    for (const [x, y] of wall) g.set(x, y, "▒", "b");
    for (let y = 0; y < M.h; y++) for (let x = 0; x < M.w; x++) {
      if (!M.at(x, y)) continue;
      const surf = M.h * (1 - e) - 0.5 + Math.sin(x * 0.18 - c * 3.2) * slosh + Math.sin(x * 0.07 + c * 1.7) * slosh * 0.6;
      const gx = X0 + x, gy = Y0 + y;
      if (y + 0.5 < surf) { g.set(gx, gy, "░", "c"); continue; }
      const depth = (y - surf) / M.h;
      if (y < surf + 0.5) g.set(gx, gy, "▄", "0");
      else if (y < surf + 1.5) g.set(gx, gy, "█", "1");
      else g.set(gx, gy, "█", String(Math.min(9, 2 + Math.floor(depth * 9))));
    }
    // bubbles rising inside the liquid
    for (const [bx, off, v] of bubbles) {
      if (!e) break;
      const by = M.h - ((off + c * v) % M.h);
      const surf = M.h * (1 - e) + 1;
      if (by > surf && M.at(bx, Math.floor(by))) g.set(X0 + bx, Y0 + by, by - surf < 2 ? "°" : "o", "d");
    }
    // a tap pouring in while filling, a drain stream while emptying
    const tapX = X0 - 6;
    g.text(tapX - 2, Y0 - 3, "═══╗", "b");
    g.set(tapX + 1, Y0 - 2, "▼", "b");
    if (c < 4.2) for (let y = Y0 - 1; y < Y0 + M.h; y++) g.set(tapX + 1, y, (y + Math.floor(c * 12)) % 3 ? "│" : "¦".replace("¦", ":"), "1");
    g.hline(X0 - 8, X0 + M.w + 1, Y0 + M.h + 1, "▀", "b");
    if (c > 6.2 && c < 8.6) for (let x = X0 + M.w + 2; x < cols; x++) g.set(x, Y0 + M.h + 1, (x + Math.floor(c * 14)) % 3 ? "≈" : "~", "2");
    return g.frame();
  };
}
