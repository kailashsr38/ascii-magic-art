/* stencil-spray-reveal: a spray can zigzags over a card stencil on a brick wall, the stencil peels off to reveal the word. */
import { Grid, palette, noise2 } from "../lib/kit.js";

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
  slug: "stencil-spray-reveal",
  name: "Stencil Spray Paint",
  category: "lettering",
  note: "A spray can zigzags over a card stencil taped to a brick wall, the stencil peels away to reveal the painted word, and a roller paints it over.",
  tags: ["graffiti", "spray", "street", "hero", "letters", "reveal"],
  cols: 96, rows: 28, fps: 30,
  palette: palette([
    "#5a3a30", "#4a2f27", "#3a241e", "#2a1a16",      // 0-3 brick
    "#d8cdb8", "#b8ac95", "#8c826f",                  // 4-6 stencil card
    "#ff4fa3", "#ff9bd0", "#9e2a66",                  // 7-9 pink paint
    "#3fe0c0", "#a5fff0", "#1f7f6e",                  // a-c teal paint
    "#e6edf3", "#8b949e", "#c0c0c0", "#ff7b72", "#5a5f66",   // d-h can, roller
  ]),
};

const WORDS = [["HELLO", 7], ["MAGIC", 10]];
const IN = 0.7, SPRAY = 5, PEEL = 0.8, HOLD = 2, ROLL = 1.2;
const PER = IN + SPRAY + PEEL + HOLD + ROLL;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const M = WORDS.map(([w]) => textMask(w, 3, 2, 3));
  const W = M[0].w, H = M[0].h;
  const X0 = Math.floor((cols - W) / 2), Y0 = Math.floor((rows - H) / 2);
  const SX0 = X0 - 4, SY0 = Y0 - 3, SW = W + 8, SH = H + 6;
  // spray path: horizontal zigzag passes over the stencil
  const passes = 5, path = (u) => {
    const p = u * passes, k = Math.min(passes - 1, Math.floor(p)), f = p - k;
    const x = SX0 + 2 + (k % 2 ? 1 - f : f) * (SW - 4);
    return [x, SY0 + 2 + (k + 0.5) * ((SH - 4) / passes)];
  };
  const paintT = new Float32Array(cols * rows).fill(1e9);
  for (let s = 0; s <= 3000; s++) {
    const u = s / 3000, [px, py] = path(u), tt = u * SPRAY;
    for (let y = Math.floor(py - 3); y <= py + 3; y++) for (let x = Math.floor(px - 6); x <= px + 6; x++) {
      if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
      if (((x - px) / 5.5) ** 2 + ((y - py) / 2.6) ** 2 > 1) continue;
      const i = x + y * cols;
      if (tt < paintT[i]) paintT[i] = tt;
    }
  }
  const wall = [], wk = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const course = Math.floor(y / 2), mortar = y % 2 === 1, joint = (x + (course % 2) * 5) % 10 === 0;
    const n = noise2(x * 0.3, y * 0.5, 2);
    wall.push(mortar ? "▁" : joint ? "▕" : n > 0.6 ? "▓" : "▒");
    wk.push(mortar || joint ? "3" : n > 0.55 ? "0" : n > 0.35 ? "1" : "2");
  }
  return (t) => {
    g.clear();
    const n = WORDS.length, cyc = ((t % (PER * n)) + PER * n) % (PER * n);
    const wi = Math.floor(cyc / PER), c = cyc - wi * PER;
    const m = M[wi], [, base] = WORDS[wi];
    const k0 = String.fromCharCode, col = (o) => "0123456789abcdefgh"[base + o];
    for (let i = 0; i < cols * rows; i++) { g.ch[i] = wall[i]; g.co[i] = wk[i]; }
    const sprayT = c - IN;
    const peel = c < IN + SPRAY ? 0 : Math.min(1, (c - IN - SPRAY) / PEEL);
    const rollX = c > PER - ROLL ? ((c - (PER - ROLL)) / ROLL) * (cols + 6) - 3 : -99;
    // paint that reached the wall through the cut outs, plus a little overspray
    if (sprayT > 0) for (let y = 0; y < H; y++) for (let x = -1; x <= W; x++) {
      const gx = X0 + x, gy = Y0 + y, i = gx + gy * cols;
      if (gx < 0 || gx >= cols || paintT[i] > sprayT || gx < rollX) continue;
      if (m.at(x, y)) g.set(gx, gy, "█", col(paintT[i] > sprayT - 0.25 ? 1 : 0));
      else if (peel > 0 && (m.at(x - 1, y) || m.at(x + 1, y)) && (gx * 7 + gy * 13) % 5 === 0) g.set(gx, gy, "·", col(0));
    }
    // the card stencil: slides in, collects paint, then peels up and away
    const off = c < IN ? Math.round((1 - c / IN) * -(SH + 2)) : Math.round(-peel * (SH + SY0 + 2));
    if (peel < 1) for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) {
      const gx = SX0 + x, gy = SY0 + y + off;
      if (gy < 0 || gy >= rows) continue;
      const mx = x - 4, my = y - 3;
      if (m.at(mx, my)) continue; // cut out
      const edge = x === 0 || y === 0 || x === SW - 1 || y === SH - 1;
      const pt = paintT[SX0 + x + (SY0 + y) * cols];
      const painted = sprayT > pt;
      g.set(gx, gy, painted ? ((gx + gy) % 3 ? "▓" : "▒") : edge ? "▓" : "█", painted ? col(2) : edge ? "6" : "4");
      if ((x < 3 || x > SW - 4) && (y < 2 || y > SH - 3)) g.set(gx, gy, "▒", "5"); // tape
    }
    // the can and its spray cone
    if (sprayT > 0 && sprayT < SPRAY) {
      const [px, py] = path(sprayT / SPRAY);
      const cx = Math.round(px + 6), cy = Math.round(py - 6);
      for (let s = 0; s < 14; s++) {
        const f = ((t * 7 + s * 0.29) % 1), a = (s * 2.39) % 1 - 0.5;
        g.set(cx - 1 - f * 6 + a * f * 3, cy + 4 + f * 3 + a * f * 2, f > 0.6 ? "•" : "·", col(1));
      }
      g.text(cx, cy, "▄█▄", "e"); g.set(cx + 1, cy - 1, "▪", "g");
      for (let r = 1; r < 5; r++) g.text(cx, cy + r, r === 2 ? "███" : "▐█▌", r === 2 ? col(0) : "d");
    }
    // the roller painting the wall clean for the next word
    if (rollX > -10) {
      const rx = Math.round(rollX);
      for (let y = 0; y < rows; y++) for (let x = Math.max(0, rx - 1); x <= Math.min(cols - 1, rx); x++) { g.set(x, y, "█", x === rx ? "h" : "2"); }
      g.vline(rx + 1, 0, rows - 1, "▌", "f");
    }
    return g.frame();
  };
}
