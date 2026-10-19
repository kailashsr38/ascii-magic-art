/* flip-dot-display: a mechanical flip dot board whose discs flip over in waves to show the next word. */
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
  slug: "flip-dot-display",
  name: "Flip Dot Board",
  category: "lettering",
  note: "A mechanical flip dot board whose yellow discs turn over in a sweeping wave each time it changes to the next word.",
  tags: ["flip dot", "sign", "transit", "hero", "dashboard", "mechanical"],
  cols: 124, rows: 21, fps: 30,
  palette: palette(["#ffd23f", "#2a2d31", "#8a7a2a", "#5a5f66", "#14171b", "#c9d1d9", "#3a3f46", "#8b949e"]),
};

const MSGS = ["HELLO", "OPEN", "12:45", "MAGIC", "GO"];
const DW = 60, DH = 16, HOLD = 2.6, FLIP = 1.1;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const boards = MSGS.map((m) => {
    const b = new Uint8Array(DW * DH);
    const w = m.length * 12 - 2, x0 = Math.floor((DW - w) / 2);
    [...m].forEach((c, k) => {
      const gl = glyph7(c);
      for (let j = 0; j < 7; j++) for (let i = 0; i < 5; i++) if (gl[j][i] === "#")
        for (let a = 0; a < 2; a++) for (let d = 0; d < 2; d++) b[x0 + k * 12 + i * 2 + d + (1 + j * 2 + a) * DW] = 1;
    });
    return b;
  });
  const X0 = 2, Y0 = 2;
  const PER = HOLD + FLIP;
  return (t) => {
    g.clear();
    const n = MSGS.length, cyc = ((t % (PER * n)) + PER * n) % (PER * n);
    const mi = Math.floor(cyc / PER), lt = cyc - mi * PER;
    const now = boards[mi], prev = boards[(mi + n - 1) % n];
    g.box(0, 0, cols, rows, "double", "6");
    g.text(3, rows - 2, "ROUTE 7 · CENTRAL", "7");
    g.text(cols - 15, rows - 2, "◆ FLIP DOT", "7");
    for (let y = 0; y < DH; y++) for (let x = 0; x < DW; x++) {
      const i = x + y * DW;
      // wave front sweeps left to right with a slight diagonal
      const at = ((x + y * 0.6) / (DW + DH * 0.6)) * (FLIP - 0.15);
      let on = now[i];
      let ch = "●";
      if (lt < FLIP && now[i] !== prev[i]) {
        const d = lt - at;
        if (d < 0) on = prev[i];
        else if (d < 0.1) { ch = d < 0.05 ? "▐" : "│"; on = 2; }
      }
      g.set(X0 + x * 2, Y0 + y, ch, on === 1 ? "0" : on === 2 ? "2" : "1");
      g.set(X0 + x * 2 + 1, Y0 + y, " ");
    }
    return g.frame();
  };
}
