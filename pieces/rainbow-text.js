/* rainbow-text: chunky block letters with a rainbow gradient sweeping across them. */
import { Grid, palette, hsl } from "../lib/kit.js";

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

const HUES = Array.from({ length: 18 }, (_, i) => hsl(i * 20, 90, 62));
export const meta = {
  slug: "rainbow-text",
  name: "Rainbow Text",
  category: "lettering",
  note: "Chunky block letters with a full rainbow gradient sweeping across them and a bright glint passing through.",
  tags: ["rainbow", "text", "hero", "banner", "colorful"],
  cols: 70, rows: 25, fps: 30,
  palette: palette([...HUES, "#ffffff", "#2a2a35"]),   // 0-h hues, i white, j shadow
};

const LINES = ["HELLO", "WORLD"];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const KEYSET = "0123456789abcdefgh";
  // pixel mask at 2x2 per font pixel
  const mask = new Uint8Array(cols * rows);
  LINES.forEach((s, li) => {
    const w = s.length * 12 - 2, x0 = Math.floor((cols - w) / 2), y0 = 2 + li * 12;
    [...s].forEach((c, k) => {
      const gl = glyph(c);
      for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) if (gl[j][i] === "#")
        for (let u = 0; u < 2; u++) for (let v = 0; v < 2; v++) mask[x0 + (k * 6 + i) * 2 + u + (y0 + j * 2 + v) * cols] = 1;
    });
  });
  return (t) => {
    g.clear();
    const glint = ((t * 0.45) % 1.6) * (cols + rows * 2) - rows;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const i = x + y * cols;
      if (mask[i]) {
        const h = Math.floor(((x + y * 1.4) / 64 - t * 0.35) * 18);
        const k = KEYSET[((h % 18) + 18) % 18];
        const d = Math.abs(x + y * 2 - glint);
        if (d < 1.5) g.set(x, y, "█", "i");
        else if (d < 3.5) g.set(x, y, "▓", "i");
        else {
          const edge = !mask[i + cols] || !mask[i + 1];
          g.set(x, y, edge ? "▓" : "█", k);
        }
      } else if (x > 0 && y > 0 && mask[i - cols - 1]) g.set(x, y, "░", "j");
    }
    return g.frame();
  };
}
