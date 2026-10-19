/* text-scramble: random block letters settling into a phrase, then scrambling into the next. */
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
  slug: "text-scramble",
  name: "Text Scramble",
  category: "lettering",
  note: "Random block letters churn and settle one slot at a time into a phrase, then scramble away into the next.",
  tags: ["text", "scramble", "hero", "headline", "terminal"],
  cols: 72, rows: 14, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#30363d", "#2f6f45", "#79c0ff"]),
};

const PHRASES = ["HELLO WORLD", "SHIP IT", "ASCII ART", "DECODE ME", "NIGHT SHIFT"];
const SLOTS = 11, PER = 4.2;
const POOL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#?";
const hash = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const padded = PHRASES.map((p) => { const l = Math.floor((SLOTS - p.length) / 2); return (" ".repeat(l) + p).padEnd(SLOTS); });
  const X0 = 3, Y0 = 3;
  return (t) => {
    g.clear();
    const cyc = PHRASES.length * PER;
    const tt = ((t % cyc) + cyc) % cyc;
    const pi = Math.floor(tt / PER), lt = tt - pi * PER;
    const target = padded[pi];
    const step = Math.floor(t * 18);
    let settled = 0;
    for (let s = 0; s < SLOTS; s++) {
      const resolveAt = 0.25 + (s / SLOTS) * 1.5 + hash(s, pi) * 0.35;
      const leaveAt = 3.3 + s * 0.05;
      let c, co, on = "█";
      if (lt >= resolveAt && lt < leaveAt) {
        c = target[s]; co = lt - resolveAt < 0.18 ? "2" : "0"; settled++;
      } else {
        // only churn where a letter is, was or will be
        const prev = padded[(pi + PHRASES.length - 1) % PHRASES.length][s], next = padded[(pi + 1) % PHRASES.length][s];
        const busy = target[s] !== " " || (lt < resolveAt && prev !== " ") || (lt >= leaveAt && next !== " ");
        if (!busy) continue;
        c = POOL[Math.floor(hash(s * 31 + step, 7) * POOL.length)];
        co = hash(s, step) > 0.5 ? "4" : "3"; on = "▓";
      }
      const gl = glyph(c), x = X0 + s * 6;
      for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) if (gl[j][i] === "#") g.set(x + i, Y0 + j, on, co);
    }
    // caption line with a progress meter
    g.hline(3, 68, 10, "─", "3");
    g.text(3, 12, "> resolving", "1");
    g.text(15, 12, `"${PHRASES[pi].toLowerCase()}"`, "5");
    const k = Math.round((settled / SLOTS) * 10);
    const meter = "[" + "■".repeat(k) + "·".repeat(10 - k) + "]";
    g.text(68 - meter.length - 6, 12, meter, settled >= SLOTS ? "2" : "1");
    g.text(63, 12, `${pi + 1}/${PHRASES.length}`, "1");
    return g.frame();
  };
}
