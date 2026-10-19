/* ice-crack-letters: frozen block letters crack from an impact, shatter into falling shards and freeze back. */
import { Grid, palette, rng, noise2 } from "../lib/kit.js";

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
  slug: "ice-crack-letters",
  name: "Shattering Ice Letters",
  category: "lettering",
  note: "Frosted ice letters spelling CHILL take a hit, crack outward, shatter into falling shards and then freeze back from the ground up.",
  tags: ["ice", "frozen", "winter", "shatter", "hero", "letters"],
  cols: 96, rows: 28, fps: 30,
  palette: palette(["#f4fcff", "#c8ecff", "#8fd3f5", "#5aa8d8", "#2f6f9e", "#1b3f5e", "#0f2233", "#e6f7ff", "#13293b", "#6fb8e0", "#ffffff"]),
};

const PER = 9.5, HIT = 1.6, CRACK = 1.4, FALL = 3.2, REFREEZE = 5.0;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const M = textMask("CHILL", 3, 2, 4);
  const X0 = Math.floor((cols - M.w) / 2), Y0 = 5;
  const R = rng(21), seeds = [];
  for (let i = 0; i < 46; i++) seeds.push([R() * M.w, R() * M.h, R()]);
  const impact = [M.w * 0.42, M.h * 0.45];
  const cells = [];
  for (let y = 0; y < M.h; y++) for (let x = 0; x < M.w; x++) {
    if (!M.at(x, y)) continue;
    let a = -1, b = -1, da = 1e9, db = 1e9;
    seeds.forEach(([sx, sy], k) => {
      const d = (sx - x) ** 2 + ((sy - y) * 1.8) ** 2;
      if (d < da) { db = da; b = a; da = d; a = k; } else if (d < db) { db = d; b = k; }
    });
    const edge = Math.sqrt(db) - Math.sqrt(da) < 1.1;
    let ch = "│";
    if (edge) {
      const vx = seeds[b][0] - seeds[a][0], vy = (seeds[b][1] - seeds[a][1]) * 1.8;
      const ang = Math.atan2(vy, vx);
      const q = ((ang / Math.PI) * 4 + 8) % 4;
      ch = q < 0.5 || q > 3.5 ? "│" : q < 1.5 ? "╱" : q < 2.5 ? "─" : "╲";
    }
    const hl = !M.at(x - 1, y) || !M.at(x, y - 1);
    cells.push({ x, y, shard: a, edge, ch, hl, crackAt: Math.hypot(x - impact[0], (y - impact[1]) * 1.8) / 28 });
  }
  const shardDelay = seeds.map(([sx, sy], k) => Math.hypot(sx - impact[0], sy - impact[1]) * 0.012 + (k % 5) * 0.06);
  const shardVx = seeds.map(([sx], k) => (sx - impact[0]) * 0.04 + (k % 3 - 1) * 0.6);
  const flakes = [];
  for (let i = 0; i < 70; i++) flakes.push([R() * cols, R() * rows, 1.5 + R() * 2.5, R() * 6]);
  return (t) => {
    g.clear();
    const c = ((t % PER) + PER) % PER;
    // night backdrop with falling snow
    for (const [fx, fy, v, ph] of flakes) {
      const y = (fy + t * v) % rows, x = (fx + Math.sin(t * 0.8 + ph) * 2 + cols) % cols;
      g.set(x, y, v > 3 ? "*" : "·", v > 3 ? "1" : "4");
    }
    g.hline(0, cols - 1, rows - 2, "▄", "4");
    g.hline(0, cols - 1, rows - 1, "█", "5");
    const groundY = rows - 3;
    for (const cl of cells) {
      const gx = X0 + cl.x, gy = Y0 + cl.y;
      const frost = noise2(cl.x * 0.6, cl.y * 0.8, 4);
      let ch = frost > 0.62 ? "▓" : "█", co = cl.hl ? "0" : frost > 0.55 ? "1" : "2";
      if (c >= HIT && c < FALL + 3) {
        const into = (c - HIT) / CRACK;
        if (cl.edge && into > cl.crackAt) { ch = cl.ch; co = "a"; }
      }
      if (c >= FALL && c < REFREEZE) {
        const dt = c - FALL - shardDelay[cl.shard];
        if (dt > 0) {
          const dy = 0.5 * 55 * dt * dt, dx = shardVx[cl.shard] * dt * 8;
          const ny = gy + dy, nx = gx + dx;
          if (ny < groundY) g.set(nx, ny, cl.edge ? "▒" : ch, cl.edge ? "3" : co);
          else if (dt < 2.4) g.set(nx + ((cl.x * 7) % 5) - 2, groundY + 1, "▄", "1");
          continue;
        }
      }
      if (c >= REFREEZE) {
        // ice grows back from the bottom of each letter
        const lvl = (c - REFREEZE) / 2.2;
        const fromBottom = (M.h - cl.y) / M.h;
        if (fromBottom > lvl + 0.05) continue;
        if (fromBottom > lvl - 0.08) { g.set(gx, gy, "░", "2"); continue; }
      }
      g.set(gx, gy, ch, co);
    }
    // the impact flash
    if (c >= HIT && c < HIT + 0.25) {
      const ix = X0 + impact[0], iy = Y0 + impact[1];
      for (let a = 0; a < 8; a++) for (let r = 2; r < 6; r++) g.set(ix + Math.cos(a * 0.785) * r * 2, iy + Math.sin(a * 0.785) * r, "·", "a");
      g.set(ix, iy, "●", "a");
    }
    return g.frame();
  };
}
