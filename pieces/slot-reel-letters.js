/* slot-reel-letters: a slot machine whose five letter reels spin and land one by one on a word. */
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
  slug: "slot-reel-letters",
  name: "Letter Slot Reels",
  category: "lettering",
  note: "A lever pulls, five reels of big letters blur past and thunk to a stop one by one to spell a word, and coins rattle into the tray.",
  tags: ["slot machine", "reels", "casino", "hero", "letters", "spin"],
  cols: 90, rows: 30, fps: 30,
  palette: palette(["#fff8e6", "#d9cfb8", "#8a8270", "#2a2620", "#ff5a5f", "#a32a2e", "#ffd166", "#b38a2e", "#3a3f46", "#8b949e", "#1b1d22", "#7ee787"]),
};

const WORDS = ["MAGIC", "LUCKY", "HELLO"];
const PITCH = 9, WIN = 15, PER = 7.2;
const ALPHA = "QAZWSXEDCRFVTGBYHNUJMIKOLP";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  // each reel's strip holds the letter it must land on for every word
  const strips = [0, 1, 2, 3, 4].map((r) => {
    const s = [...ALPHA.slice(r * 3, r * 3 + 12)];
    WORDS.forEach((w, k) => (s[k * 4 + (r % 2)] = w[r]));
    return s;
  });
  const targets = [0, 1, 2, 3, 4].map((r) => WORDS.map((_, k) => k * 4 + (r % 2)));
  const RW = 14, GAP = 2, X0 = Math.floor((cols - 6 - (5 * RW + 4 * GAP)) / 2), Y0 = 6;
  const back = (u) => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * (u - 1) ** 3 + c1 * (u - 1) ** 2; };
  return (t) => {
    g.clear();
    const n = WORDS.length, cyc = ((t % (PER * n)) + PER * n) % (PER * n);
    const wi = Math.floor(cyc / PER), lt = cyc - wi * PER;
    // cabinet
    g.box(X0 - 3, 1, 5 * RW + 4 * GAP + 6, rows - 2, "double", "7");
    g.fill(X0 - 2, 2, 5 * RW + 4 * GAP + 4, 3, "▓", "5");
    const title = "· SPELL IT ·";
    g.text(Math.floor(cols / 2 - title.length / 2) - 3, 3, title, "6");
    for (let r = 0; r < 5; r++) {
      const strip = strips[r], N = strip.length;
      const from = targets[r][(wi + n - 1) % n], to = targets[r][wi];
      const start = 0.45, stop = 2.0 + r * 0.5;
      const dist = 3 * N + ((to - from + N) % N);
      let pos = from, speed = 0;
      if (lt > start) {
        const u = Math.min(1, (lt - start) / (stop - start));
        pos = from + dist * back(u);
        speed = u < 1 ? dist * (1 - u) * 3 : 0;
      }
      const rx = X0 + r * (RW + GAP);
      g.box(rx - 1, Y0 - 1, RW + 2, WIN + 2, "heavy", "8");
      const blur = speed > 18;
      for (let y = 0; y < WIN; y++) {
        const s = pos * PITCH + (y - Math.floor(WIN / 2)) + 3;
        const li = (((Math.floor(s / PITCH)) % N) + N) % N, ry = ((s % PITCH) + PITCH) % PITCH;
        const dist = Math.abs(y - (WIN - 1) / 2) / ((WIN - 1) / 2);
        const shade = dist > 0.8 ? "2" : dist > 0.5 ? "1" : "0";
        for (let x = 0; x < RW; x++) g.set(rx + x, Y0 + y, dist > 0.8 ? "▒" : "█", shade);
        const fy = Math.floor(ry) - 1;
        if (fy < 0 || fy > 6) { if (Math.floor(ry) === PITCH - 1) g.hline(rx, rx + RW - 1, Y0 + y, "─", "2"); continue; }
        const gl = glyph7(strip[li]);
        for (let i = 0; i < 5; i++) if (gl[fy][i] === "#") g.text(rx + 2 + i * 2, Y0 + y, blur ? "▒▒" : "██", blur ? "9" : dist > 0.5 ? "5" : "4");
      }
    }
    // payline
    const py = Y0 + Math.floor(WIN / 2);
    g.set(X0 - 2, py, "►", "6"); g.set(X0 + 5 * RW + 4 * GAP + 1, py, "◄", "6");
    // lever
    const lx = X0 + 5 * RW + 4 * GAP + 4;
    const pull = lt < 0.45 ? Math.sin((lt / 0.45) * Math.PI) : 0;
    const top = Math.round(4 + pull * 9);
    for (let y = top + 1; y <= 14; y++) g.set(lx, y, "┃", "9");
    g.set(lx, top, "●", "4");
    g.text(lx - 1, 15, "▐█▌", "8");
    // coin tray and coins once every reel has stopped
    const ty = rows - 4;
    g.text(X0 + 20, ty + 1, "╰" + "─".repeat(32) + "╯", "7");
    const won = lt - 4.3;
    const msg = won > 0 ? "WINNER  ·  " + WORDS[wi] : "GOOD LUCK";
    g.text(Math.floor(cols / 2 - msg.length / 2) - 2, Y0 + WIN + 1, msg, won > 0 ? "b" : "9");
    if (won > 0) for (let k = 0; k < 14; k++) {
      const dt = won - k * 0.12;
      if (dt < 0) continue;
      const cx = X0 + 25 + ((k * 7) % 22), y = Y0 + WIN + 2 + dt * dt * 30;
      g.set(cx, Math.min(y, ty), y < ty ? "●" : "▄", "6");
    }
    return g.frame();
  };
}
