/* cinema-title-card: an old film reel counting down 3 2 1 into a THE END title card, with grain, scratches and gate weave. */
import { Grid, palette, gradient } from "../lib/kit.js";

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

const SEPIA = gradient(["#120c07", "#2e2014", "#4e3a24", "#6e5638", "#8f7650"], 8);

export const meta = {
  slug: "cinema-title-card",
  name: "Silent Film Title Card",
  category: "lettering",
  note: "An old projector reel counts down 3 2 1 with a sweeping leader, then lands on a framed THE END card full of grain, scratches and gate weave.",
  tags: ["film", "cinema", "vintage", "intro", "outro", "letters"],
  cols: 96, rows: 30, fps: 24,
  palette: palette([...SEPIA, "#f4e6c4", "#d9c49a", "#b39a6c", "#fff6e0", "#0a0705", "#c8b080", "#1a120a", "#efe0bc"]),
};

const COUNT = 3, CARD = 5.5, PER = COUNT + CARD;
const h3 = (a, b, c) => { let h = (a * 374761393 + b * 668265263 + c * 1442695041) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const digits = ["3", "2", "1"].map((d) => textMask(d, 3, 2, 0));
  const TITLE = textMask("THE END", 2, 2, 1);
  // vignette: brighter centre, dark corners
  const vig = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const dx = (x - cols / 2) / (cols / 2), dy = (y - rows / 2) / (rows / 2);
    vig.push(Math.max(0, 1 - (dx * dx * 0.7 + dy * dy * 0.9)));
  }
  return (t) => {
    g.clear();
    const c = ((t % PER) + PER) % PER;
    const frame = Math.floor(t * 24);
    const oy = h3(frame, 1, 2) < 0.12 ? 1 : 0, ox = h3(frame, 3, 4) < 0.06 ? 1 : 0;
    const counting = c < COUNT;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = vig[x + y * cols];
      const k = Math.min(7, Math.floor(v * (counting ? 6 : 7.5)));
      g.set(x, y, v > 0.55 ? "█" : v > 0.3 ? "▓" : v > 0.12 ? "▒" : "░", String(k));
    }
    const put = (x, y, ch, co) => g.set(x + ox, y + oy, ch, co);
    if (counting) {
      const i = Math.floor(c), f = c - i;
      const cx = cols / 2, cy = rows / 2;
      // leader: sweeping wedge, rings and crosshair
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        const dx = (x - cx) / 2, dy = y - cy;
        const r = Math.hypot(dx, dy);
        let a = Math.atan2(dx, -dy) / (Math.PI * 2); if (a < 0) a += 1;
        if (r < 13 && a < f) put(x, y, "▓", "a");
        if (Math.abs(r - 13) < 0.5 || Math.abs(r - 10.5) < 0.45) put(x, y, "█", "9");
      }
      g.hline(0, cols - 1, cy + oy, "─", "a"); g.vline(cx + ox, 0, rows - 1, "│", "a");
      const D = digits[i];
      for (let y = 0; y < D.h; y++) for (let x = 0; x < D.w; x++) if (D.at(x, y)) put(cx - D.w / 2 + x, cy - D.h / 2 + y, "█", "b");
    } else {
      const lt = c - COUNT;
      // ornamental frame
      const bx = 4, by = 2, bw = cols - 8, bh = rows - 4;
      g.box(bx + ox, by + oy, bw, bh, "double", "9");
      g.box(bx + 2 + ox, by + 1 + oy, bw - 4, bh - 2, "light", "a");
      for (const [x, y] of [[bx, by], [bx + bw - 1, by], [bx, by + bh - 1], [bx + bw - 1, by + bh - 1]]) put(x, y, "◆", "b");
      const tx = Math.floor((cols - TITLE.w) / 2), ty = 6;
      const reveal = Math.min(1, lt / 0.8);
      for (let y = 0; y < TITLE.h; y++) for (let x = 0; x < TITLE.w; x++) if (TITLE.at(x, y) && (x / TITLE.w) < reveal * 1.05) {
        put(tx + x + 1, ty + y + 1, "█", "c");
        put(tx + x, ty + y, "█", "b");
      }
      const sub = "A PICTURE IN TWO REELS";
      if (lt > 1) g.text(Math.floor((cols - sub.length) / 2) + ox, ty + TITLE.h + 2 + oy, sub, "9");
      g.text(Math.floor(cols / 2) - 4 + ox, ty + TITLE.h + 4 + oy, "-  ◆  -", "a");
    }
    // grain, hairs and scratches never print over the card frame
    const FR = "═║╔╗╚╝─│┌┐└┘◆";
    const film = (x, y, ch, co) => { if (!FR.includes(g.get(x, y))) g.set(x, y, ch, co); };
    // grain specks, hairs and running scratches
    for (let s = 0; s < 46; s++) {
      const x = Math.floor(h3(frame, s, 7) * cols), y = Math.floor(h3(frame, s, 9) * rows);
      const dark = h3(frame, s, 11) < 0.5;
      film(x, y, h3(frame, s, 13) < 0.7 ? "·" : "•", dark ? "e" : "b");
    }
    if (h3(Math.floor(t * 3), 5, 5) < 0.6) {
      const hx = Math.floor(h3(Math.floor(t * 3), 6, 6) * cols), hy = Math.floor(h3(Math.floor(t * 3), 7, 7) * (rows - 4));
      for (const [dx, dy, ch] of [[0, 0, "╭"], [1, 0, "╯"], [1, 1, "│"], [1, 2, "╰"], [2, 2, "╮"]]) film(hx + dx, hy + dy, ch, "e");
    }
    for (let k = 0; k < 2; k++) {
      const sx = Math.floor(((k * 0.37 + t * 0.05) % 1) * cols + Math.sin(t * 2 + k) * 2);
      if (h3(Math.floor(t * 8), k, 3) < 0.75) for (let y = 0; y < rows; y++) if (h3(frame, y, k) < 0.8) film(sx, y, "│", k ? "e" : "f");
    }
    return g.frame();
  };
}
