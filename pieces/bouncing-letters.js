/* bouncing-letters: block letters drop in one by one and bounce to rest on a floor. */
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
  slug: "bouncing-letters",
  name: "Bouncing Letters",
  category: "lettering",
  note: "Block letters drop in one at a time, bounce with a little squash and settle on the floor before falling away.",
  tags: ["text", "bounce", "playful", "hero", "banner"],
  cols: 72, rows: 21, fps: 30,
  palette: palette(["#79c0ff", "#7ee787", "#ffa657", "#ff7b72", "#d2a8ff", "#ffd166", "#30363d", "#1c2128", "#8b949e"]),
};

const TEXT = "HELLO WORLD";
const CYC = 9.5, GAP = 0.22, REST = 12;     // REST = top row of a resting letter

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const H2 = rows * 2;
  const buf = new Array(cols * H2);
  // precompute one drop: height above rest (rows) sampled every 1/120 s
  const DT = 1 / 120, table = [];
  let h = 15, v = 0;
  for (let i = 0; i < 120 * 3; i++) {
    table.push(h);
    v -= 70 * DT; h += v * DT;
    if (h < 0) { h = 0; v = -v * 0.5; if (v < 2) v = 0; }
  }
  const height = (tau) => (tau < 0 ? 99 : table[Math.min(table.length - 1, Math.floor(tau / DT))]);
  const X0 = Math.floor((cols - (TEXT.length * 6 - 1)) / 2);
  return (t) => {
    g.clear();
    buf.fill(undefined);
    const lt = ((t % CYC) + CYC) % CYC;
    for (let x = 0; x < cols; x++) g.set(x, REST + 5, "▀", "6");
    for (let x = 0; x < cols; x++) g.set(x, REST + 6, (x % 4 === 0) ? "·" : " ", "7");
    [...TEXT].forEach((c, k) => {
      if (c === " ") return;
      const co = "012345"[k % 6];
      const tau = lt - 0.3 - k * GAP;
      let hh = height(tau);
      const exit = lt - 7.2 - k * 0.08;
      let squash = 0;
      if (exit > 0) hh = -(0.5 * 70 * exit * exit);           // floor opens, letters fall away
      else if (hh < 0.25 && tau > 0.2 && tau < 2.2) {
        // short squash on each landing
        const vNow = Math.abs(height(tau + 0.02) - hh) / 0.02;
        squash = vNow > 3 ? 1 : 0;
      }
      if (hh > 30) return;
      const top2 = Math.round((REST - hh) * 2);
      const gl = glyph(c), x = X0 + k * 6;
      for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) if (gl[j][i] === "#") {
        for (let s = 0; s < 2; s++) {
          let yy = top2 + j * 2 + s;
          if (squash) yy = top2 + 1 + Math.floor((j * 2 + s) * 0.9);
          if (yy >= 0 && yy < H2) buf[x + i + yy * cols] = co;
        }
      }
      // shadow on the floor
      if (exit <= 0) {
        const w = Math.max(1, Math.round(5 - hh / 3.5));
        const sx = x + Math.floor((5 - w) / 2);
        for (let i = 0; i < w; i++) g.set(sx + i, REST + 5, "█", "6");
      }
    });
    for (let y = 0; y < REST + 5; y++) for (let x = 0; x < cols; x++) {
      const a = buf[x + 2 * y * cols], b = buf[x + (2 * y + 1) * cols];
      if (a && b) g.set(x, y, "█", a);
      else if (a) g.set(x, y, "▀", a);
      else if (b) g.set(x, y, "▄", b);
    }
    // letters falling through the floor show below it
    for (let y = REST + 6; y < rows; y++) for (let x = 0; x < cols; x++) {
      const a = buf[x + 2 * y * cols], b = buf[x + (2 * y + 1) * cols];
      if (a || b) g.set(x, y, a && b ? "█" : a ? "▀" : "▄", a || b);
    }
    return g.frame();
  };
}
