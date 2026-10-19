/* neon-sign-flicker: a neon tube sign on a brick wall that buzzes, glows and flickers. */
import { Grid, palette, noise2 } from "../lib/kit.js";

/* 5x5 block font, drawn fresh for this piece. */
const FONT = {
  A: " ### |#   #|#####|#   #|#   #", B: "#### |#   #|#### |#   #|#### ", C: " ####|#    |#    |#    | ####",
  D: "#### |#   #|#   #|#   #|#### ", E: "#####|#    |#### |#    |#####", F: "#####|#    |#### |#    |#    ",
  G: " ####|#    |#  ##|#   #| ####", H: "#   #|#   #|#####|#   #|#   #", I: "#####|  #  |  #  |  #  |#####",
  J: "  ###|    #|    #|#   #| ### ", K: "#   #|#  # |###  |#  # |#   #", L: "#    |#    |#    |#    |#####",
  M: "#   #|## ##|# # #|#   #|#   #", N: "#   #|##  #|# # #|#  ##|#   #", O: " ### |#   #|#   #|#   #| ### ",
  P: "#### |#   #|#### |#    |#    ", Q: " ### |#   #|# # #|#  # | ## #", R: "#### |#   #|#### |#  # |#   #",
  S: " ####|#    | ### |    #|#### ", T: "#####|  #  |  #  |  #  |  #  ", U: "#   #|#   #|#   #|#   #| ### ",
  V: "#   #|#   #|#   #| # # |  #  ", W: "#   #|#   #|# # #|## ##|#   #", X: "#   #| # # |  #  | # # |#   #",
  Y: "#   #| # # |  #  |  #  |  #  ", Z: "#####|   # |  #  | #   |#####",
  0: " ### |#   #|#   #|#   #| ### ", 1: "  #  | ##  |  #  |  #  | ### ", 2: " ### |#   #|  ## | #   |#####",
  3: "#### |    #| ### |    #|#### ", 4: "#   #|#   #|#####|    #|    #", 5: "#####|#    |#### |    #|#### ",
  6: " ### |#    |#### |#   #| ### ", 7: "#####|    #|   # |  #  |  #  ", 8: " ### |#   #| ### |#   #| ### ",
  9: " ### |#   #| ####|    #| ### ", "!": "  #  |  #  |  #  |     |  #  ", "?": " ### |#   #|  ## |     |  #  ",
  ".": "     |     |     |     |  #  ", ",": "     |     |     |  #  | #   ", ":": "     |  #  |     |  #  |     ",
  "-": "     |     | ### |     |     ", "#": " # # |#####| # # |#####| # # ", ">": "#    | #   |  #  | #   |#    ",
  "'": "  #  |  #  |     |     |     ", " ": "     |     |     |     |     ",
};
const GL = {};
for (const k in FONT) GL[k] = FONT[k].split("|");
const glyph = (c) => GL[c] || GL[" "];

export const meta = {
  slug: "neon-sign-flicker",
  name: "Neon Sign Flicker",
  category: "lettering",
  note: "A two line neon tube sign glowing on a brick wall, buzzing and flickering with one tired letter.",
  tags: ["neon", "sign", "night", "hero", "wallpaper"],
  cols: 80, rows: 25, fps: 24,
  palette: palette([
    "#ffe3f8", "#ff5ad8", "#5e1a52", "#33102e", "#4a2440",          // 0-4 pink: hot, tube, glow, far glow, dead tube
    "#e0fcff", "#38e1ff", "#0f4a5a", "#0a2a33", "#1f3a44",          // 5-9 cyan
    "#2b1613", "#361c18", "#1a1210", "#22140f",                      // a-d brick
  ]),
};

const LINES = [["OPEN", 0], ["LATE", 5]];
const SX = 3, SY = 2;
const BITS = { 0: "•", 1: "┃", 2: "┃", 3: "┃", 4: "━", 8: "━", 12: "━", 10: "┏", 6: "┓", 9: "┗", 5: "┛", 11: "┣", 7: "┫", 14: "┳", 13: "┻", 15: "╋" };
const hash = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  // brick wall
  const wallC = [], wallK = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const course = Math.floor(y / 2), mortar = y % 2 === 1;
    const joint = (x + (course % 2) * 4) % 8 === 0;
    const n = noise2(x * 0.4, y * 0.7, 3);
    wallC.push(mortar ? "▁" : joint ? "▏" : n > 0.55 ? "▓" : "▒");
    wallK.push(mortar || joint ? "c" : n > 0.5 ? "b" : n > 0.3 ? "a" : "d");
  }
  // tubes per letter: cells with a box-drawing char, and glow cells with intensity
  const letters = [];
  LINES.forEach(([word, base], li) => {
    const w = (word.length - 1) * 16 + 4 * SX + 1;
    const x0 = Math.floor((cols - w) / 2), y0 = 3 + li * 11;
    [...word].forEach((c, k) => {
      const gl = glyph(c);
      const on = (i, j) => i >= 0 && j >= 0 && i < 5 && j < 5 && gl[j][i] === "#";
      const bits = new Map(), diag = new Map();
      const add = (x, y, b) => bits.set(x + "," + y, (bits.get(x + "," + y) || 0) | b);
      const lx = x0 + k * 16;
      for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) if (on(i, j)) {
        const X = lx + i * SX, Y = y0 + j * SY;
        add(X, Y, 0);
        if (on(i + 1, j)) { add(X, Y, 8); for (let s = 1; s < SX; s++) add(X + s, Y, 12); add(X + SX, Y, 4); }
        if (on(i, j + 1)) { add(X, Y, 2); for (let s = 1; s < SY; s++) add(X, Y + s, 3); add(X, Y + SY, 1); }
        for (const dx of [-1, 1]) if (on(i + dx, j + 1) && !on(i + dx, j) && !on(i, j + 1)) {
          diag.set((X + dx) + "," + (Y + 1), dx > 0 ? "╲" : "╱");
          diag.set((X + dx * 2) + "," + (Y + 1), dx > 0 ? "╲" : "╱");
        }
      }
      const tubes = [];
      for (const [key, b] of bits) { const [x, y] = key.split(",").map(Number); if (!diag.has(key)) tubes.push([x, y, BITS[b] || "━"]); }
      for (const [key, ch] of diag) { const [x, y] = key.split(",").map(Number); tubes.push([x, y, ch]); }
      const glow = new Map();
      for (const [x, y] of tubes) for (let dy = -2; dy <= 2; dy++) for (let dx = -4; dx <= 4; dx++) {
        const d = Math.hypot(dx / 2, dy);
        if (d > 1.7) continue;
        const k2 = (x + dx) + "," + (y + dy);
        glow.set(k2, Math.max(glow.get(k2) || 0, 1 - d / 2.0));
      }
      letters.push({ tubes, glow: [...glow].map(([key, v]) => [...key.split(",").map(Number), v]), base, id: li * 10 + k });
    });
  });
  const TIRED = 11;   // the A in LATE
  return (t) => {
    g.clear();
    for (let i = 0; i < cols * rows; i++) { g.ch[i] = wallC[i]; g.co[i] = wallK[i]; }
    const slot = Math.floor(t * 12);
    const buzzAll = hash(slot, 1) < 0.035;
    const burst = hash(Math.floor(t / 2.3), 4) < 0.55;
    const states = letters.map((L) => {
      if (buzzAll) return 0.4;
      if (L.id === TIRED) {
        if (!burst) return 1;
        return noise2(t * 9, L.id) > 0.42 ? 1 : 0;
      }
      return hash(slot, L.id + 7) < 0.012 ? 0 : 1;
    });
    // glow first, then tubes on top
    letters.forEach((L, i) => {
      const s = states[i];
      if (!s) return;
      const b = L.base;
      for (const [x, y, v] of L.glow) {
        if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
        const e = v * s;
        if (e > 0.5) g.set(x, y, "█", String(b + 2));
        else if (e > 0.2) g.set(x, y, "█", String(b + 3));
      }
    });
    letters.forEach((L, i) => {
      const s = states[i], b = L.base;
      for (const [x, y, ch] of L.tubes) g.set(x, y, ch, s === 1 ? String(b + (hash(x * 3 + y, slot) < 0.2 ? 0 : 1)) : s ? String(b + 2) : String(b === 0 ? 4 : 9));
    });
    return g.frame();
  };
}
