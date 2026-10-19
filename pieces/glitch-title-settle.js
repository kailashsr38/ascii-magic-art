/* glitch-title-settle: a corrupted title tears, splits into colour channels and settles into a clean word. */
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
  slug: "glitch-title-settle",
  name: "Glitch Title Settle",
  category: "lettering",
  note: "A big title tears into sliding slices, splits into red and cyan channels and corrupted blocks, then settles into a crisp clean word.",
  tags: ["glitch", "cyber", "title", "hero", "intro", "letters"],
  cols: 100, rows: 24, fps: 30,
  palette: palette(["#ffffff", "#ff3860", "#2ee6ff", "#7a1a2e", "#145a66", "#30363d", "#8b949e", "#1a1f27", "#d2a8ff"]),
};

const WORDS = ["SIGNAL", "ASCII", "LAUNCH"], PER = 5.5;
const h3 = (a, b, c) => { let h = (a * 374761393 + b * 668265263 + c * 1442695041) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const JUNK = "▚▞░▒#@%&$/\\<>01";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const masks = WORDS.map((w) => { const M = textMask(w, 3, 2, 2); return { M, x0: Math.floor((cols - M.w) / 2), y0: Math.floor((rows - M.h) / 2) }; });
  return (t) => {
    g.clear();
    const n = WORDS.length, cyc = ((t % (PER * n)) + PER * n) % (PER * n);
    const wi = Math.floor(cyc / PER), lt = cyc - wi * PER;
    const { M, x0, y0 } = masks[wi];
    // glitch intensity: hard burst at the start, decays, a pre-burst at the end
    let I = lt < 0.25 ? 1 : Math.exp(-(lt - 0.25) * 1.9);
    if (lt > PER - 0.6) I = Math.max(I, (lt - (PER - 0.6)) / 0.6);
    if (I < 0.03) I = 0;
    const slot = Math.floor(t * 14);
    // scanlines
    for (let y = 0; y < rows; y += 2) g.hline(0, cols - 1, y, "─", "7");
    for (let y = 0; y < rows; y++) {
      const band = Math.floor((y + Math.floor(h3(slot, 9, 9) * 4)) / 3);
      const tear = h3(slot, band, 1) < I * 0.8 ? Math.round((h3(slot, band, 2) - 0.5) * 34 * I) : 0;
      const ca = Math.round(1 + I * 4);
      for (let x = 0; x < cols; x++) {
        const sx = x - x0 - tear, sy = y - y0;
        if (I === 0) {
          if (M.at(sx, sy)) g.set(x, y, "█", "0");
          else if (M.at(sx - 1, sy - 1)) g.set(x, y, "▓", "4");
          continue;
        }
        const r = M.at(sx + ca, sy), c = M.at(sx - ca, sy);
        if (r && c) g.set(x, y, "█", "0");
        else if (r) g.set(x, y, "▓", "1");
        else if (c) g.set(x, y, "▓", "2");
      }
    }
    if (I > 0) {
      // corrupted blocks
      const nb = Math.floor(I * 9);
      for (let b = 0; b < nb; b++) {
        const bx = Math.floor(h3(slot, b, 3) * cols), by = Math.floor(h3(slot, b, 4) * rows);
        const bw = 3 + Math.floor(h3(slot, b, 5) * 14), bh = 1 + Math.floor(h3(slot, b, 6) * 3);
        for (let y = by; y < by + bh; y++) for (let x = bx; x < bx + bw; x++)
          g.set(x, y, JUNK[Math.floor(h3(x, y, slot) * JUNK.length)], "12836"[(b + y) % 5]);
      }
      // a rolling static bar
      const sy = Math.floor((t * 20) % rows);
      if (I > 0.2) for (let x = 0; x < cols; x++) if (h3(x, slot, 7) < 0.6) g.set(x, sy, h3(x, slot, 8) < 0.5 ? "░" : "▒", "6");
    }
    // status line
    const label = I > 0 ? "SIGNAL  LOCKING " + "▮".replace("▮", "■").repeat(Math.max(1, Math.round((1 - I) * 10))) : "SIGNAL  LOCKED  ✓";
    g.text(2, rows - 1, label, I > 0 ? "6" : "8");
    return g.frame();
  };
}
