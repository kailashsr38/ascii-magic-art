/* burning-title: big ember letters with real flames licking up from every edge. */
import { Grid, palette, gradient, fbm, noise2 } from "../lib/kit.js";

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

const FIRE = gradient(["#2a0a06", "#6b1408", "#b8300c", "#ee6a12", "#ffb03a", "#ffe7a0", "#fffbe8"], 16);

export const meta = {
  slug: "burning-title",
  name: "Burning Title",
  category: "lettering",
  note: "The word IGNITE glows like hot coals while turbulent flames curl up from every letter into the dark.",
  tags: ["fire", "flames", "title", "hero", "intro", "letters"],
  cols: 112, rows: 32, fps: 24,
  palette: palette([...FIRE, "#1a0d0a", "#3a1a10", "#ff8c3a", "#ffcf6a"]),
};

const CH = " .:-=+*%#▒▓█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const M = textMask("IGNITE", 3, 2, 3);
  const X0 = Math.floor((cols - M.w) / 2), Y0 = rows - M.h - 2;
  // distance (in rows) from each cell down to the nearest letter cell beneath it
  const dist = new Float32Array(cols * rows).fill(99);
  const inL = new Uint8Array(cols * rows);
  for (let x = 0; x < cols; x++) {
    let d = 99;
    for (let y = rows - 1; y >= 0; y--) {
      const on = M.at(x - X0, y - Y0);
      if (on) { d = 0; inL[x + y * cols] = 1; } else d += 1;
      dist[x + y * cols] = d;
    }
  }
  return (t) => {
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const i = x + y * cols;
      if (inL[i]) {
        const n = noise2(x * 0.35, y * 0.5 - t * 1.5, 7);
        const k = 9 + Math.floor(n * 7);
        g.set(x, y, n > 0.62 ? "▓" : "█", KEYS15(k));
        continue;
      }
      // flames: sway sideways with height, rise and break up with noise
      const sway = (noise2(y * 0.12 - t * 0.9, t * 0.3, 3) - 0.5) * 6;
      const sx = Math.round(x + sway * Math.min(1, dist[i] / 8));
      const d = sx >= 0 && sx < cols ? dist[sx + y * cols] : 99;
      if (d > 22) { const s = fbm(x * 0.05, y * 0.1 + t * 0.4, 2, 9); if (s > 0.58) g.set(x, y, "·", "g"); continue; }
      const turb = fbm(x * 0.16, y * 0.22 + t * 3.2, 3, 1);
      const reach = 7 + 13 * fbm(x * 0.07, t * 0.8, 2, 4);
      const v = (1 - d / reach) * 1.0 + (turb - 0.5) * 0.8;
      if (v <= 0.05) { if (turb > 0.72 && d < 18) g.set(x, y, "'", "h"); continue; }
      const k = Math.min(15, Math.floor(v * 15));
      g.set(x, y, CH[Math.min(CH.length - 1, 1 + Math.floor(v * (CH.length - 1)))], KEYS15(k));
    }
    // a rising ember now and then
    for (let e = 0; e < 14; e++) {
      const life = ((t * 0.6 + e * 0.37) % 1.6) / 1.6;
      const ex = X0 + ((e * 37) % M.w) + Math.sin(life * 9 + e) * 3;
      const ey = Y0 - life * (Y0 + 2);
      g.set(ex, ey, life < 0.5 ? "•" : "·", life < 0.5 ? "i" : "h");
    }
    return g.frame();
  };
}
function KEYS15(i) { return "0123456789abcdef"[Math.max(0, Math.min(15, i))]; }
