/* ransom-note-letters: cut out magazine letters in clashing styles that keep getting swapped for new clippings. */
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
  slug: "ransom-note-letters",
  name: "Ransom Note Cutouts",
  category: "lettering",
  note: "Big letters cut from magazines in clashing colours and sizes, taped on a desk, each one flipping over now and then for a fresh clipping.",
  tags: ["collage", "magazine", "cutout", "hero", "letters", "playful"],
  cols: 96, rows: 28, fps: 24,
  palette: palette(["#ece6d8", "#1b1b1b", "#f2d16b", "#d94b4b", "#ffffff", "#262626", "#4a7fd9", "#fff2a8", "#bdb8aa", "#7ee787", "#16341f", "#ff8fc7", "#3a2b1f", "#2e2218", "#d8cfa8"]),
};

// scrap colour, letter colour
const STYLES = [["0", "1"], ["2", "1"], ["3", "4"], ["5", "4"], ["6", "7"], ["8", "1"], ["9", "a"], ["b", "1"], ["4", "3"]];
const LINES = ["HELLO", "WORLD"];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const slots = [];
  LINES.forEach((w, li) => [...w].forEach((ch, k) => {
    const R = rng(100 + li * 10 + k);
    slots.push({ ch, cx: Math.floor(cols / 2 + (k - (w.length - 1) / 2) * 18), cy: 7 + li * 13, per: 2.6 + R() * 2.6, off: R() * 5, seed: li * 10 + k });
  }));
  const look = (s, gen) => {
    const R = rng(s.seed * 97 + gen * 13 + 1);
    const st = STYLES[Math.floor(R() * STYLES.length)];
    const sx = R() < 0.5 ? 2 : R() < 0.5 ? 3 : 1, bold = R() < 0.4;
    return { st, sx, bold, padX: 1 + Math.floor(R() * 2), padY: R() < 0.5 ? 1 : 2, dy: Math.floor(R() * 3) - 1, dx: Math.floor(R() * 3) - 1, tape: R() < 0.6, seed: Math.floor(R() * 1e6) };
  };
  const hj = (a, b) => ((a * 2654435761) ^ (b * 40503)) >>> 0;
  const drawScrap = (s, L, squash) => {
    const lw = 5 * L.sx + (L.bold ? 1 : 0), w = lw + L.padX * 2, h = 7 + L.padY * 2;
    const x0 = s.cx - Math.floor(w / 2) + L.dx, y0 = s.cy - Math.floor(h / 2) + L.dy;
    const gl = glyph7(s.ch);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const fx = (x - w / 2) * squash + w / 2;
      if (Math.abs(x - w / 2) > (w / 2) * squash) continue;
      const gx = x0 + x, gy = y0 + y;
      const edge = x === 0 || y === 0 || x === w - 1 || y === h - 1;
      const hh = hj(L.seed + x, y) % 7;
      if (edge && hh === 0) continue; // ragged scissor edge
      let ch = edge && hh < 3 ? (y === 0 ? "▄" : y === h - 1 ? "▀" : x === 0 ? "▐" : "▌") : "█", co = L.st[0];
      const lx = Math.floor((fx - L.padX) / L.sx), ly = y - L.padY;
      const lx2 = Math.floor((fx - L.padX - 1) / L.sx);
      const inL = (i) => i >= 0 && i < 5 && ly >= 0 && ly < 7 && gl[ly][i] === "#";
      if (inL(lx) || (L.bold && inL(lx2))) { ch = "█"; co = L.st[1]; }
      g.set(gx, gy, ch, co);
    }
    if (L.tape && squash > 0.9) g.text(x0 + Math.floor(w / 2) - 2, y0 - 1, "▒▒▒▒", "e");
    // drop shadow
    for (let y = 1; y <= h; y++) if (g.get(x0 + w, y0 + y) !== "█" || true) g.set(x0 + Math.round(w / 2 + (w / 2) * squash), y0 + y, "▓", "d");
  };
  return (t) => {
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) g.set(x, y, (x * 3 + y * 7) % 11 === 0 ? "▓" : "█", (x + y * 5) % 13 === 0 ? "d" : "c");
    for (const s of slots) {
      const p = (t + s.off) / s.per, gen = Math.floor(p), f = p - gen;
      const FL = 0.09;
      if (f < FL) {
        const u = f / FL;
        const L = u < 0.5 ? look(s, gen - 1) : look(s, gen);
        drawScrap(s, L, Math.max(0.08, Math.abs(Math.cos(u * Math.PI))));
      } else drawScrap(s, look(s, gen), 1);
    }
    return g.frame();
  };
}
