/* led-matrix-scroller: a big amber LED matrix sign scrolling a message in a chunky pixel font. */
import { Grid, palette } from "../lib/kit.js";

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
  slug: "led-matrix-scroller",
  name: "LED Matrix Scroller",
  category: "lettering",
  note: "A shop window LED matrix sign with a dotted grid of dark LEDs scrolling a two colour message in a chunky pixel font.",
  tags: ["led", "sign", "banner", "scroller", "hero", "shop"],
  cols: 120, rows: 20, fps: 30,
  palette: palette(["#ffb347", "#ffd9a0", "#3a2412", "#ff5a4a", "#ffc0b0", "#3a1612", "#7ee787", "#c8ffcc", "#123a1c", "#2d333b", "#8b949e", "#3a2c1e", "#1f242c"]),
};

const MSG = [["OPEN LATE", 0], [" · ", 3], ["FRESH COFFEE", 6], [" · ", 3], ["HELLO", 0], [" · ", 3]];
const LW = 56, LH = 16, SPEED = 16;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  // one long strip of LED columns, two LEDs per font pixel
  const strip = [];
  for (const [text, base] of MSG) for (const ch of text) {
    const gl = ch === "·" ? ".....|.....|.....|..#..|.....|.....|.....".split("|") : glyph7(ch);
    for (let i = 0; i < 5; i++) for (let r = 0; r < 2; r++) {
      const colm = new Array(LH).fill(-1);
      for (let j = 0; j < 7; j++) if (gl[j][i] === "#") { colm[1 + j * 2] = base; colm[2 + j * 2] = base; }
      strip.push(colm);
    }
    strip.push(new Array(LH).fill(-1), new Array(LH).fill(-1));
  }
  const X0 = Math.floor((cols - LW * 2) / 2), Y0 = 2;
  return (t) => {
    g.clear();
    // housing
    g.box(X0 - 2, Y0 - 2, LW * 2 + 3, LH + 4, "heavy", "9");
    for (let x = X0 - 1; x < X0 + LW * 2; x++) { g.set(x, Y0 - 1, "▄", "c"); g.set(x, Y0 + LH, "▀", "c"); }
    g.set(X0 - 1, Y0 - 1, "◆", "a"); g.set(X0 + LW * 2 - 1, Y0 - 1, "◆", "a");
    g.set(X0 - 1, Y0 + LH, "◆", "a"); g.set(X0 + LW * 2 - 1, Y0 + LH, "◆", "a");
    const off = Math.floor(t * SPEED);
    for (let c = 0; c < LW; c++) {
      const colm = strip[(((c + off) % strip.length) + strip.length) % strip.length];
      for (let r = 0; r < LH; r++) {
        const b = colm[r];
        const x = X0 + c * 2, y = Y0 + r;
        if (b < 0) g.set(x, y, "·", "b");
        else {
          g.set(x, y, "●", String(b));
          // the lit dot bleeds a little light into the gap on its right
          if (colm[r] >= 0 && x + 1 < cols) g.set(x + 1, y, "·", String(b + 2));
        }
      }
    }
    return g.frame();
  };
}
