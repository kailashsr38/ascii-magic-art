/* rain-formed-word: a downpour where the drops falling through a hidden word glow, so the word is written in rain. */
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
  slug: "rain-formed-word",
  name: "Written in Rain",
  category: "lettering",
  note: "A steady downpour where every drop passing through a hidden word lights up, so the word appears written in falling rain.",
  tags: ["rain", "weather", "hero", "wallpaper", "letters", "moody"],
  cols: 100, rows: 30, fps: 30,
  palette: palette(["#e8fbff", "#9fe6ff", "#4fc3f7", "#2b7fb8", "#1a4a6e", "#12324a", "#2a3a48", "#3e5566", "#0e1a24"]),
};

const WORDS = ["RAIN", "CALM", "DRIFT"], PER = 7;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const masks = WORDS.map((w) => {
    const M = textMask(w, 3, 3, 4);
    return { M, x0: Math.floor((cols - M.w) / 2), y0: 3 };
  });
  const R = rng(4), drops = [];
  for (let x = 0; x < cols; x++) for (let k = 0; k < 7; k++) drops.push([x, R() * 60, 26 + R() * 14, 3 + Math.floor(R() * 4)]);
  return (t) => {
    g.clear();
    const n = WORDS.length, cyc = ((t % (PER * n)) + PER * n) % (PER * n);
    const wi = Math.floor(cyc / PER), lt = cyc - wi * PER;
    const { M, x0, y0 } = masks[wi];
    // the word fades in and out by how many of its drops are lit
    const vis = Math.min(1, lt / 1.2, (PER - lt) / 1.2);
    const groundY = rows - 2;
    g.hline(0, cols - 1, rows - 1, "▀", "6");
    for (let y = y0; y < y0 + M.h; y++) for (let x = x0; x < x0 + M.w; x++)
      if (M.at(x - x0, y - y0) && ((x * 13 + y * 7) % 100) / 100 < vis) g.set(x, y, "╎", "3");
    for (const [x, off, v, len] of drops) {
      const head = ((off + t * v) % (groundY + 10)) - 6;
      for (let k = 0; k < len; k++) {
        const y = Math.floor(head) - k;
        if (y < 0 || y >= groundY) continue;
        const inside = M.at(x - x0, y - y0) && ((x * 13 + y * 7 + k) % 100) / 100 < vis;
        if (inside) g.set(x, y, k === 0 ? "█" : k < 2 ? "▓" : "│", k === 0 ? "0" : k < 2 ? "1" : "2");
        else if ((x + k) % 2 === 0) g.set(x, y, k === 0 ? "╷" : "│", k === 0 ? "4" : "5");
      }
      if (head >= groundY && head < groundY + 1.2) {
        const lit = M.at(x - x0, groundY - 1 - y0) && vis > 0.5;
        g.set(x - 1, groundY, "‚".replace("‚", ","), lit ? "1" : "7");
        g.set(x + 1, groundY, "'", lit ? "1" : "7");
        g.set(x, groundY, "o", lit ? "1" : "7");
      }
    }
    // puddle reflection of the word on the ground row
    for (let x = 0; x < cols; x++) {
      if (g.get(x, groundY) === " ") g.set(x, groundY, "▁", "8");
      if (M.at(x - x0, M.h - 1) && vis > 0.3 && (x + Math.floor(t * 6)) % 3) g.set(x, rows - 1, "▀", "3");
    }
    return g.frame();
  };
}
