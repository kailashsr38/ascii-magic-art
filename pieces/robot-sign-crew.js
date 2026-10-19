/* robot-sign-crew: a squad of little drones carries blocks from a depot and builds a sign, then takes it apart. */
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
  slug: "robot-sign-crew",
  name: "Drone Sign Crew",
  category: "lettering",
  note: "A crew of tiny drones ferries blocks from a depot to build a big OPEN sign on a blueprint, then carries it all back.",
  tags: ["robots", "drones", "build", "hero", "letters", "construction"],
  cols: 92, rows: 30, fps: 30,
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#1c3a5e", "#3d6fa8", "#ffa657", "#ffd166", "#7ee787", "#ff7b72", "#5c4a2e", "#a07a44"]),
};

const N = 9, D = 1.15, HOLD = 2.4;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const W = "OPEN", PX = 4, PY = 2, GAP = 1;
  const pw = W.length * (5 * PX + PX * GAP) - PX * GAP;
  const X0 = Math.floor((cols - pw) / 2), Y0 = 3;
  const blocks = [];
  [...W].forEach((c, k) => {
    const gl = glyph7(c);
    for (let j = 0; j < 7; j++) for (let i = 0; i < 5; i++) if (gl[j][i] === "#") blocks.push([X0 + (k * 6 + i) * PX, Y0 + j * PY, j, k]);
  });
  // bottom rows first, alternating from the middle out so the crew spreads
  blocks.sort((a, b) => b[1] - a[1] || Math.abs(a[0] - cols / 2) - Math.abs(b[0] - cols / 2));
  const depots = [[10, rows - 4], [cols - 13, rows - 4]];
  const B = Math.ceil(blocks.length / N) * D + 0.4;
  const CYC = 2 * B + 2 * HOLD;
  const placedAt = blocks.map((_, k) => Math.floor(k / N) * D + D / 2);
  return (t) => {
    g.clear();
    const c = ((t % CYC) + CYC) % CYC;
    // timeline time: build forward, hold, play backward, hold empty
    const s = c < B ? c : c < B + HOLD ? B : c < 2 * B + HOLD ? 2 * B + HOLD - c : 0;
    const lit = c >= B && c < B + HOLD;
    // blueprint grid and target pixels
    for (let y = 1; y < rows - 4; y += 2) for (let x = 1; x < cols - 1; x += 4) g.set(x, y, "·", "2");
    for (const [x, y] of blocks) { g.text(x, y, "░░░░".slice(0, PX), "3"); g.text(x, y + 1, "░░░░".slice(0, PX), "3"); }
    // ground and depots with crates
    g.hline(0, cols - 1, rows - 2, "▀", "9");
    g.hline(0, cols - 1, rows - 1, "▒", "9");
    depots.forEach(([dx, dy], di) => {
      g.text(dx - 2, dy + 1, "╘════════╛", "1");
      const left = blocks.length - blocks.filter((_, k) => s >= placedAt[k]).length;
      const h = Math.min(3, Math.ceil((left / blocks.length) * 3 + 0.01) * (left > 0 ? 1 : 0));
      for (let r = 0; r < h; r++) g.text(dx - 1, dy - r, "▓▓▓▓ ▓▓▓".slice(0, 8), "a");
      g.text(dx - 1, dy + 2 > rows - 1 ? rows - 1 : dy + 2, di ? "DEPOT B" : "DEPOT A", "1");
    });
    // placed blocks
    blocks.forEach(([x, y], k) => {
      if (s < placedAt[k]) return;
      const fresh = s - placedAt[k] < 0.25 && !lit;
      const co = lit ? "6" : fresh ? "0" : "5";
      g.text(x, y, "████".slice(0, PX), co);
      g.text(x, y + 1, "████".slice(0, PX), co);
    });
    // drones
    for (let r = 0; r < N; r++) {
      const job = Math.floor(s / D) * N + r;
      const u = (s % D) / D;
      const k = Math.min(job, blocks.length - 1);
      const active = job < blocks.length && s < B - 0.3;
      const [dx, dy] = depots[r % 2];
      const home = [dx + 3 + ((r >> 1) % 3) * 2 - 2, dy - 4 - (r % 3)];
      let x, y, carry = false;
      if (!active) { x = home[0] + Math.sin(t * 2 + r) * 1; y = home[1] - 1 + Math.sin(t * 3 + r * 2) * 0.6; }
      else {
        const [bx, by] = blocks[k];
        const a = u < 0.5 ? u * 2 : (1 - u) * 2;
        const e = a * a * (3 - 2 * a);
        x = home[0] + (bx + 1 - home[0]) * e;
        y = home[1] + (by - 3 - home[1]) * e - Math.sin(Math.PI * e) * 5;
        carry = u < 0.5;
        if (c >= B + HOLD) carry = !carry; // taking blocks home on the way back
      }
      x = Math.round(x); y = Math.round(y);
      const blade = Math.floor(t * 20 + r) % 2 ? "═╦═" : "─┬─";
      g.text(x - 1, y, blade, "1");
      g.text(x - 1, y + 1, "[", "1"); g.set(x, y + 1, "●", r % 3 === 0 ? "7" : r % 3 === 1 ? "8" : "6"); g.set(x + 1, y + 1, "]", "1");
      if (carry && active) { g.text(x - 1, y + 2, "▓▓▓▓".slice(0, PX), "5"); }
    }
    return g.frame();
  };
}
