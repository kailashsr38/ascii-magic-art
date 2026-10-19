/* marquee-sign: a theatre marquee with chasing light bulbs and big scrolling letters. */
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
  slug: "marquee-sign",
  name: "Marquee Sign",
  category: "lettering",
  note: "A theatre marquee framed by chasing light bulbs, with big warm letters scrolling across the board.",
  tags: ["marquee", "sign", "lights", "banner", "hero"],
  cols: 84, rows: 17, fps: 24,
  palette: palette(["#fff3c4", "#ffd166", "#6b5320", "#ff7b72", "#7a2f2a", "#ffe8a3", "#3a2a12", "#c99a3c"]),
};

const MSG = "NOW SHOWING · THE GRAND REVUE · TONIGHT AT 8 · ";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  // perimeter bulbs in order around the frame
  const bulbs = [];
  for (let x = 1; x < cols - 1; x += 2) bulbs.push([x, 0]);
  for (let y = 1; y < rows - 1; y++) bulbs.push([cols - 1, y]);
  for (let x = cols - 2 - ((cols - 3) % 2); x >= 1; x -= 2) bulbs.push([x, rows - 1]);
  for (let y = rows - 2; y >= 1; y--) bulbs.push([0, y]);
  const glyphs = [...MSG].map((c) => (c === "·" ? ["     ", "     ", "  #  ", "     ", "     "] : glyph(c)));
  const msgW = glyphs.length * 6;
  return (t) => {
    g.clear();
    const chase = Math.floor(t * 9);
    bulbs.forEach(([x, y], i) => {
      const lit = (i + chase) % 3 === 0;
      g.set(x, y, lit ? "●" : "•", lit ? "1" : "2");
    });
    g.box(2, 1, cols - 4, rows - 2, "double", "3");
    // inner rule and captions
    const cap = "*  LIVE ON STAGE  *", cap2 = "DOORS 7:30   ·   ALL AGES";
    g.text(Math.floor((cols - cap.length) / 2), 3, cap, Math.floor(t * 2) % 2 ? "3" : "4");
    g.text(Math.floor((cols - cap2.length) / 2), rows - 4, cap2, "7");
    const off = Math.floor(t * 16) % msgW;
    for (let x = 4; x < cols - 4; x++) {
      const m = x - 4 + off;
      const gi = Math.floor(m / 6) % glyphs.length, col = m % 6;
      if (col === 5) continue;
      const gl = glyphs[gi];
      for (let j = 0; j < 5; j++) if (gl[j][col] === "#") g.set(x, 6 + j, "█", (gi + Math.floor(t * 3)) % 7 === 0 ? "0" : "5");
    }
    for (let x = 4; x < cols - 4; x++) { g.set(x, 5, "▁", "6"); g.set(x, 11, "▔", "6"); }
    return g.frame();
  };
}
