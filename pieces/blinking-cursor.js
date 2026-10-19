/* blinking-cursor: a minimal big prompt, a short word typed and erased, a block cursor blinking. */
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
  slug: "blinking-cursor",
  name: "Blinking Cursor",
  category: "lettering",
  note: "A minimal prompt in big block type where a short word is typed and erased beside a blinking block cursor.",
  tags: ["cursor", "prompt", "terminal", "minimal", "readme"],
  cols: 56, rows: 9, fps: 20,
  palette: palette(["#e6edf3", "#7ee787", "#8b949e", "#d2a8ff", "#79c0ff"]),
};

const WORDS = ["HELLO", "SHIP", "BUILD", "DEPLOY", "YES"];

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  let clock = 0;
  const plans = WORDS.map((w) => {
    const p = { w, start: clock, wait: 1.4, type: w.length * 0.16, hold: 1.8, erase: w.length * 0.07 };
    p.dur = p.wait + p.type + p.hold + p.erase + 0.3;
    clock += p.dur;
    return p;
  });
  const total = clock;
  const put = (c, x, y, co) => {
    const gl = glyph(c);
    for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) if (gl[j][i] === "#") g.set(x + i, y + j, "█", co);
  };
  return (t) => {
    g.clear();
    const tt = ((t % total) + total) % total;
    const p = plans.find((q) => tt >= q.start && tt < q.start + q.dur) || plans[0];
    const lt = tt - p.start;
    let n = 0, busy = false;
    if (lt < p.wait) n = 0;
    else if (lt < p.wait + p.type) { n = Math.floor((lt - p.wait) / 0.16) + 1; busy = true; }
    else if (lt < p.wait + p.type + p.hold) n = p.w.length;
    else { n = Math.max(0, p.w.length - Math.floor((lt - p.wait - p.type - p.hold) / 0.07) - 1); busy = n > 0; }
    n = Math.min(n, p.w.length);
    g.text(2, 0, "~/site", "4");
    g.text(9, 0, "on", "2");
    g.text(12, 0, "main", "3");
    put(">", 2, 2, "1");
    for (let i = 0; i < n; i++) put(p.w[i], 9 + i * 6, 2, "0");
    if (busy || (tt % 1.06) < 0.53) for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) g.set(9 + n * 6 + i, 2 + j, "█", "1");
    return g.frame();
  };
}
