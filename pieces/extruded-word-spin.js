/* extruded-word-spin: a chunky 3D extruded word swinging round in space, lit and depth sorted. */
import { Grid, palette, gradient, rotX, rotY } from "../lib/kit.js";

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

const FACE = gradient(["#4a1d6b", "#a03ccf", "#ff6ad5", "#ffd1f0"], 8);
const SIDE = gradient(["#0f2a4a", "#2a5f9e", "#4fa8ff", "#c8e6ff"], 8);

export const meta = {
  slug: "extruded-word-spin",
  name: "Extruded Word Spin",
  category: "lettering",
  note: "A chunky 3D extruded word swings back and forth in space with a lit pink face and deep blue sides.",
  tags: ["3d", "logo", "extrude", "hero", "intro", "letters"],
  cols: 104, rows: 32, fps: 30,
  palette: palette([...FACE, ...SIDE, "#2a2f3a", "#161a22"]),
};

const SH = "░▒▓█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const M = textMask("MAGIC", 1, 1, 1);
  const W = M.w, H = M.h, DEPTH = 1.6;
  // sample points on every exposed face of every voxel
  const pts = [];
  const S = 5;
  const add = (fx, fy, fz, n, face) => pts.push([fx - W / 2, H / 2 - fy, fz, n, face]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!M.at(x, y)) continue;
    for (let i = 0; i < S; i++) for (let j = 0; j < S; j++) {
      const u = (i + 0.5) / S, v = (j + 0.5) / S;
      add(x + u, y + v, DEPTH / 2, [0, 0, 1], 1);
      add(x + u, y + v, -DEPTH / 2, [0, 0, -1], 1);
      const w = (v - 0.5) * DEPTH;
      if (!M.at(x - 1, y)) add(x, y + u, w, [-1, 0, 0], 0);
      if (!M.at(x + 1, y)) add(x + 1, y + u, w, [1, 0, 0], 0);
      if (!M.at(x, y - 1)) add(x + u, y, w, [0, 1, 0], 0);
      if (!M.at(x, y + 1)) add(x + u, y + 1, w, [0, -1, 0], 0);
    }
  }
  const L = [0.32, 0.42, 0.85];
  return (t) => {
    g.clear();
    // floor grid scrolling under the word
    for (let y = rows - 6; y < rows; y++) {
      const k = y - (rows - 7);
      for (let x = 0; x < cols; x++) {
        const px = (x - cols / 2) / k;
        if (Math.abs(px - Math.round(px / 4) * 4) < 0.18 || (y + Math.floor(t * 4)) % 3 === 0) g.set(x, y, "·", "g");
      }
    }
    const ay = Math.sin(t * 0.9) * 0.62, ax = 0.25 + Math.sin(t * 0.6) * 0.12;
    const scale = 2.7;
    for (const [x, y, z, n, face] of pts) {
      let p = rotX(rotY([x, y, z], ay), ax);
      const nn = rotX(rotY(n, ay), ax);
      if (nn[2] < -0.05) continue;
      const k = 48 / (48 - p[2]);
      const sx = cols / 2 + p[0] * scale * k, sy = rows / 2 - 2 - p[1] * scale * 0.5 * k * 1.15;
      const lit = 0.2 + 0.8 * Math.max(0, nn[0] * L[0] + nn[1] * L[1] + nn[2] * L[2]);
      const b = Math.min(7, Math.floor(lit * 7.99));
      g.setZ(sx, sy, p[2], SH[Math.min(3, Math.floor(lit * 4))], face ? "01234567"[b] : "89abcdef"[b]);
    }
    return g.frame();
  };
}
