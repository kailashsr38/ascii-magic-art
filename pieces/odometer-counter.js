/* odometer-counter: rolling digit wheels counting up, each carry rolling the next wheel over. */
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
  slug: "odometer-counter",
  name: "Odometer Counter",
  category: "lettering",
  note: "Six rolling digit wheels count up like a car odometer, every carry turning the next wheel over.",
  tags: ["counter", "odometer", "numbers", "dashboard", "stats"],
  cols: 62, rows: 14, fps: 30,
  palette: palette(["#f0f3f6", "#a8b1bb", "#5c6570", "#30363d", "#ff7b72", "#a8483f", "#5e2a26", "#8b949e", "#ffa657"]),
};

const N = 6, W = 8;

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const X0 = 4, Y0 = 2;   // window rows Y0+1 .. Y0+7
  const shadeW = ["2", "1", "0", "0", "0", "1", "2"], shadeR = ["6", "5", "4", "4", "4", "5", "6"];
  return (t) => {
    g.clear();
    const v = 199970 + t * 1.6;
    g.box(X0 - 1, Y0, N * W + 1, 9, "heavy", "3");
    for (let k = 1; k < N; k++) {
      const x = X0 - 1 + k * W;
      g.set(x, Y0, "┳", "3"); g.set(x, Y0 + 8, "┻", "3");
      for (let y = Y0 + 1; y < Y0 + 8; y++) g.set(x, y, "┃", "3");
    }
    for (let k = 0; k < N; k++) {
      const place = N - 1 - k;                     // 0 = units, rightmost
      const p10 = Math.pow(10, place);
      const base = Math.floor(v / p10) % 10;
      let pos;
      if (place === 0) pos = v % 10;
      else { const f = (v % p10) - (p10 - 1); pos = base + (f > 0 ? f : 0); }
      const red = place === 0;
      const xw = X0 + k * W + 1;
      for (let r = 0; r < 7; r++) {
        const P = pos * 6 + (r - 1);
        const cell = Math.floor(P), d = ((Math.floor(cell / 6) % 10) + 10) % 10, gr = ((cell % 6) + 6) % 6;
        if (gr === 5) continue;
        const row = glyph(String(d))[gr];
        for (let i = 0; i < 5; i++) if (row[i] === "#") g.set(xw + i, Y0 + 1 + r, r === 0 || r === 6 ? "▓" : "█", red ? shadeR[r] : shadeW[r]);
      }
    }
    g.text(X0 + N * W + 1, Y0 + 7, "km", "7");
    const trip = (412.3 + t * 0.16).toFixed(1);
    g.text(X0 - 1, Y0 + 10, "TOTAL", "7");
    g.text(X0 + 7, Y0 + 10, "TRIP " + trip.padStart(6) + " km", "8");
    const sp = 96 + Math.round(Math.sin(t * 0.7) * 3);
    g.text(X0 + N * W - 10, Y0 + 10, `${sp} km/h`, "7");
    return g.frame();
  };
}
