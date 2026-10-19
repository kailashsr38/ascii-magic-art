/* wave-text: big block letters riding a sine wave, drawn in half-cell steps for smooth motion. */
import { Grid, palette, gradient, KEYS } from "../lib/kit.js";

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

const WAVE = gradient(["#3b6fd8", "#4fb3ff", "#7ee7e0", "#e6fbff"], 10);
export const meta = {
  slug: "wave-text",
  name: "Wave Text",
  category: "lettering",
  note: "Big block letters bob along a travelling sine wave, brightening at each crest, with shadows that shrink as they rise.",
  tags: ["text", "wave", "hero", "banner", "readme"],
  cols: 76, rows: 20, fps: 30,
  palette: palette([...WAVE, "#1b2440", "#2a3658"]),   // 0-9 wave, a shadow, b floor
};

const TEXT = "HELLO WORLD";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const H2 = rows * 2;
  const top = new Array(cols * H2);
  const X0 = Math.floor((cols - (TEXT.length * 6 - 1)) / 2);
  // columns that hold ink, with their glyph column bits
  const cols5 = [];
  [...TEXT].forEach((c, k) => {
    const gl = glyph(c);
    for (let i = 0; i < 5; i++) cols5.push({ x: X0 + k * 6 + i, lx: X0 + k * 6 + 2, bits: [0, 1, 2, 3, 4].map((j) => gl[j][i] === "#") });
  });
  return (t) => {
    g.clear();
    top.fill(undefined);
    // floor and shadow
    for (let x = 0; x < cols; x++) g.set(x, 17, "▀", "b");
    for (const c of cols5) {
      const ph = t * 3.2 - c.lx * 0.075 - (c.x - c.lx) * 0.02;
      const off = Math.sin(ph) * 2.8;                        // in cells
      const hy = Math.round((7 + off) * 2);                // top of glyph in half rows
      const lift = (off + 2.8) / 5.6;                        // 0 low .. 1 high
      const key = KEYS[Math.min(9, Math.floor((1 - lift) * 7 + 2.5 + Math.cos(ph) * 0.8))];
      for (let j = 0; j < 5; j++) if (c.bits[j]) {
        for (let h = 0; h < 2; h++) {
          const y = hy + j * 2 + h;
          if (y >= 0 && y < H2) top[c.x + y * cols] = key;
        }
      }
      if (c.bits.some(Boolean)) {
        const w = 1 - lift;
        if (w > 0.35) g.set(c.x, 17, w > 0.7 ? "█" : "▄", "a");
      }
    }
    for (let y = 0; y < rows - 4; y++) for (let x = 0; x < cols; x++) {
      const a = top[x + 2 * y * cols], b = top[x + (2 * y + 1) * cols];
      if (a === undefined && b === undefined) continue;
      const ia = a !== undefined && a !== "s", ib = b !== undefined && b !== "s";
      if (ia && ib) g.set(x, y, "█", a);
      else if (ia) g.set(x, y, "▀", a);
      else if (ib) g.set(x, y, "▄", b);
      else g.set(x, y, a && b ? "█" : a ? "▀" : "▄", "a");
    }
    return g.frame();
  };
}
