/* decode-reveal: a phrase decrypting column by column out of a field of cipher noise. */
import { Grid, palette } from "../lib/kit.js";

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
  slug: "decode-reveal",
  name: "Decode Reveal",
  category: "lettering",
  note: "A field of cipher noise gives way column by column as a block letter phrase decrypts out of it.",
  tags: ["decrypt", "hacker", "text", "hero", "terminal"],
  cols: 90, rows: 22, fps: 24,
  palette: palette(["#0f2e1c", "#1a4a2c", "#2c7a46", "#7ee787", "#e9ffe9", "#8b949e", "#30363d", "#ffa657"]),
};

const PHRASES = ["ACCESS GRANTED", "HELLO WORLD", "KEY ACCEPTED"];
const NOISE = "01#%&*+=<>/\\[]{}$?!:;ABCDEFXYZ";
const PER = 7.5;
const hash = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const BY0 = 7, BY1 = 13;            // band rows that hold the phrase (glyph rows 8..12)
  const masks = PHRASES.map((p) => {
    const m = new Uint8Array(cols * rows);
    const x0 = Math.floor((cols - (p.length * 6 - 1)) / 2);
    [...p].forEach((c, k) => {
      const gl = glyph(c);
      for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) if (gl[j][i] === "#") m[x0 + k * 6 + i + (BY0 + 1 + j) * cols] = 1;
    });
    return { m, x0, x1: x0 + p.length * 6 - 1 };
  });
  return (t) => {
    g.clear();
    const cyc = PHRASES.length * PER, tt = ((t % cyc) + cyc) % cyc;
    const pi = Math.floor(tt / PER), lt = tt - pi * PER;
    const { m, x0, x1 } = masks[pi];
    const span = x1 - x0 + 1;
    const front = x0 - 2 + ((lt - 0.4) / 3.2) * (span + 4);          // reveal front, left to right
    const back = lt > 6.2 ? x1 + 2 - ((lt - 6.2) / 1.0) * (span + 4) : Infinity; // re-encrypt, right to left
    const step = Math.floor(t * 14);
    for (let y = 1; y < rows - 2; y++) for (let x = 0; x < cols; x++) {
      const i = x + y * cols;
      const inBand = y >= BY0 && y <= BY1 && x >= x0 - 2 && x <= x1 + 2;
      const open = inBand && x < front && x < back;
      if (open) {
        if (m[i]) g.set(x, y, "█", Math.abs(x - front) < 1.5 ? "4" : "3");
        else if (y === BY0 || y === BY1) g.set(x, y, "─", "6");
        continue;
      }
      const h = hash(i, Math.floor(step * (0.3 + hash(i, 1) * 0.7)));
      if (h < 0.28) continue;
      const near = inBand ? 1 : 0;
      const col = Math.abs(x - front) < 1.5 && inBand ? "4" : h > 0.93 ? "3" : h > 0.7 || near ? "2" : h > 0.45 ? "1" : "0";
      g.set(x, y, NOISE[Math.floor(hash(i * 7, step) * NOISE.length)], col);
    }
    // the bright scan column
    if (front > x0 - 2 && front < x1 + 2) for (let y = BY0; y <= BY1; y++) g.set(Math.floor(front), y, "▓", "4");
    // status line
    const p = Math.max(0, Math.min(1, (front - x0) / span));
    const k = Math.round(p * 20);
    g.text(2, 0, `> session 0x${(0x7f3a + pi * 4111).toString(16)}  cipher aes-256  block ${pi + 1}/${PHRASES.length}`, "5");
    g.text(2, rows - 1, "decrypting [", "5");
    g.text(14, rows - 1, "█".repeat(k), "3");
    g.text(14 + k, rows - 1, "░".repeat(20 - k), "6");
    g.text(34, rows - 1, "] " + String(Math.round(p * 100)).padStart(3) + "%", "5");
    if (p >= 1 && back === Infinity) g.text(42, rows - 1, "  OK  " + PHRASES[pi].toLowerCase(), "7");
    return g.frame();
  };
}
