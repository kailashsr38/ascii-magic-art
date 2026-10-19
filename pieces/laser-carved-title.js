/* laser-carved-title: a laser cutter rasters across a brushed metal plate and engraves a glowing word. */
import { Grid, palette, gradient, noise2 } from "../lib/kit.js";

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

const HEAT = gradient(["#ffffff", "#fff2a8", "#ffb03a", "#ff5a1f", "#a3220f", "#3a1410", "#1a1414"], 10);

export const meta = {
  slug: "laser-carved-title",
  name: "Laser Engraved Plate",
  category: "lettering",
  note: "A laser head rasters across a brushed steel plate, engraving the word CRAFT with white hot cuts that cool to dark grooves.",
  tags: ["laser", "engrave", "maker", "hero", "letters", "industrial"],
  cols: 96, rows: 26, fps: 30,
  palette: palette([...HEAT, "#6f7882", "#646c75", "#5a6169", "#8b949e", "#2d333b", "#ff3b3b", "#ffd0d0"]),
};

const RATE = 95, HOLD = 2, SLIDE = 1.2;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const M = textMask("CRAFT", 3, 2, 3);
  const PX0 = 4, PY0 = 4, PW = cols - 8, PH = rows - 6;
  const X0 = PX0 + Math.floor((PW - M.w) / 2), Y0 = PY0 + Math.floor((PH - M.h) / 2);
  // serpentine raster order over the letter cells
  const order = [], cutAt = new Float32Array(M.w * M.h).fill(1e9);
  for (let y = 0; y < M.h; y++) {
    const xs = [];
    for (let x = 0; x < M.w; x++) if (M.at(x, y)) xs.push(x);
    if (y % 2) xs.reverse();
    for (const x of xs) { cutAt[x + y * M.w] = order.length / RATE; order.push([x, y]); }
  }
  const CUT = order.length / RATE, CYC = CUT + HOLD + SLIDE;
  const plate = (ox, c, carved) => {
    for (let y = PY0; y < PY0 + PH; y++) for (let x = PX0; x < PX0 + PW; x++) {
      const sx = x + ox;
      if (sx < 0 || sx >= cols) continue;
      const edge = y === PY0 || y === PY0 + PH - 1 || x === PX0 || x === PX0 + PW - 1;
      const br = noise2(x * 0.08, y * 1.7, 2) * 0.7 + noise2(x * 0.5, y * 3, 5) * 0.3;
      g.set(sx, y, edge ? "▓" : "█", edge ? "d" : br > 0.62 ? "a" : br > 0.42 ? "b" : "c");
      if ((x === PX0 + 2 || x === PX0 + PW - 3) && (y === PY0 + 1 || y === PY0 + PH - 2)) g.set(sx, y, "◆", "d");
      if (!carved) continue;
      const mx = x - X0, my = y - Y0;
      if (!M.at(mx, my)) continue;
      const age = c - cutAt[mx + my * M.w];
      if (age < 0) continue;
      const k = Math.min(9, Math.floor(age * 3.2));
      g.set(sx, y, k < 2 ? "█" : k < 6 ? "▓" : "█", "0123456789"[k]);
    }
  };
  return (t) => {
    g.clear();
    const c = ((t % CYC) + CYC) % CYC;
    // rails along the top for the laser gantry
    g.hline(0, cols - 1, 0, "═", "d");
    g.hline(0, cols - 1, rows - 1, "▀", "e");
    if (c > CUT + HOLD) {
      const u = (c - CUT - HOLD) / SLIDE, e = u * u * (3 - 2 * u);
      plate(-Math.round(e * cols), CUT + HOLD, true);
      plate(Math.round((1 - e) * cols), 0, false);
      return g.frame();
    }
    plate(0, c, true);
    if (c < CUT) {
      const k = Math.min(order.length - 1, Math.floor(c * RATE));
      const [mx, my] = order[k];
      const lx = X0 + mx, ly = Y0 + my;
      g.text(lx - 2, 0, "╤═╤", "a");
      g.text(lx - 2, 1, "[■]", "a");
      g.set(lx - 1, 1, "■", "f");
      for (let y = 2; y < ly; y++) g.set(lx - 1 + (y >= ly - 1 ? 1 : 0), y, "│", "f");
      g.set(lx, ly, "█", "g");
      // sparks spraying from the cut point
      for (let s = 0; s < 6; s++) {
        const a = -Math.PI / 2 + Math.sin(t * 31 + s * 2.1) * 1.3, r = 1 + ((t * 9 + s * 0.37) % 1) * 4;
        g.set(lx + Math.cos(a) * r * 2, ly + Math.sin(a) * r, r < 3 ? "•" : "·", r < 3 ? "1" : "3");
      }
    } else {
      g.text(cols - 16, rows - 1, " DONE  100% ", "b");
    }
    return g.frame();
  };
}
