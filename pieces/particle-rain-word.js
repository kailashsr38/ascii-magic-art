/* particle-rain-word: grains rain down and pile up into a big word, then pour away to make room for the next. */
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

const WORDS = ["HELLO", "BUILD", "MAGIC"];
const PER = 8, G = 70;
const COLS = gradient(["#ffd166", "#ff8c5a", "#ff5a8a", "#a46bff", "#5a8cff"], 14);

export const meta = {
  slug: "particle-rain-word",
  name: "Particle Rain Lettering",
  category: "lettering",
  note: "Bright grains rain from the top and pile up into a big block word, hold for a beat, then pour off the bottom for the next word.",
  tags: ["particles", "title", "hero", "intro", "letters"],
  cols: 100, rows: 26, fps: 30,
  palette: palette([...COLS, "#fff6dc", "#3a3550", "#24202f"]),
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const words = WORDS.map((w, wi) => {
    const M = textMask(w, 3, 2, 3);
    const x0 = Math.floor((cols - M.w) / 2), y0 = 6;
    const R = rng(11 + wi * 7);
    const parts = [];
    for (let y = 0; y < M.h; y++) for (let x = 0; x < M.w; x++) if (M.at(x, y)) {
      const ty = y0 + y, from = -1 - R() * 14;
      const land = ((M.h - 1 - y) / M.h) * 3.2 + R() * 1.1 + (x / M.w) * 0.4;
      const fall = Math.sqrt((2 * (ty - from)) / G);
      parts.push({ x: x0 + x, ty, from, t0: land - fall, land, out: 5.6 + R() * 1.3 + ((M.h - y) / M.h) * 0.3, co: KEYS7(Math.floor(((x0 + x) / cols) * 13 + (y / M.h) * 3)) });
    }
    return parts;
  });
  const flood = rng(5), drift = [];
  for (let i = 0; i < 70; i++) drift.push([flood() * cols, flood() * 40, 6 + flood() * 10]);
  return (t) => {
    g.clear();
    const cyc = ((t % (PER * WORDS.length)) + PER * WORDS.length) % (PER * WORDS.length);
    const wi = Math.floor(cyc / PER), lt = cyc - wi * PER;
    // faint background drizzle of stray grains
    for (const [x, o, v] of drift) {
      const y = ((o + t * v) % (rows + 6)) - 3;
      g.set(x, y, "·", "f");
    }
    // floor
    g.hline(0, cols - 1, rows - 2, "▁", "g");
    for (const p of words[wi]) {
      if (lt < p.t0) continue;
      if (lt < p.land) {
        const dt = lt - p.t0, y = p.from + 0.5 * G * dt * dt;
        g.set(p.x, y, "•", "e");
        if (dt > 0.12) g.set(p.x, y - 1, "│", p.co);
      } else if (lt < p.out) {
        const age = lt - p.land;
        g.set(p.x, p.ty, age < 0.12 ? "▓" : "█", age < 0.12 ? "e" : p.co);
      } else {
        const dt = lt - p.out, y = p.ty + 0.5 * G * dt * dt;
        if (y < rows - 2) { g.set(p.x, y, "█", p.co); if (dt > 0.1) g.set(p.x, y - 1, "▒", p.co); }
        else if (y < rows + 3) g.set(p.x + ((p.ty * 7 + p.x) % 3) - 1, rows - 2, "▄", p.co);
      }
    }
    return g.frame();
  };
}
function KEYS7(i) { return "0123456789abcd"[Math.max(0, Math.min(13, i))]; }
