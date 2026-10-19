/* typewriter: big block letters typed one key at a time behind a cursor, wrapping, then cleared. */
import { Grid, palette, rng } from "../lib/kit.js";

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
  slug: "typewriter",
  name: "Typewriter",
  category: "lettering",
  note: "Big block letters typed one key at a time behind a block cursor, wrapping onto new lines before the page clears.",
  tags: ["typing", "text", "hero", "terminal", "readme"],
  cols: 76, rows: 22, fps: 20,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#30363d", "#79c0ff"]),
};

const PHRASES = ["HELLO WORLD, NICE TO MEET YOU", "SHIP IT BEFORE THE COFFEE COOLS", "TYPE SLOW AND THINK FAST."];
const MAXC = 12, X0 = 2, Y0 = 2;

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const r = rng(11);
  let clock = 0;
  const plans = PHRASES.map((s) => {
    const pos = [];
    let line = 0, col = 0;
    const words = s.split(" ");
    words.forEach((w, wi) => {
      if (col > 0 && col + w.length > MAXC) { line++; col = 0; }
      for (const c of w) pos.push([c, line, col++]);
      if (wi < words.length - 1) pos.push([" ", line, col++]);
    });
    const times = [];
    let tt = 0.5;
    for (const p of pos) { tt += p[0] === " " ? 0.2 : 0.09 + r() * 0.09; times.push(tt); }
    const typedEnd = tt, hold = 2.0, erase = pos.length / 32;
    const plan = { pos, times, start: clock, typedEnd, eraseStart: typedEnd + hold, dur: typedEnd + hold + erase + 0.3 };
    clock += plan.dur;
    return plan;
  });
  const total = clock;

  const drawGlyph = (c, line, col, co) => {
    const gl = glyph(c), x = X0 + col * 6, y = Y0 + line * 6;
    for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) if (gl[j][i] === "#") g.set(x + i, y + j, "█", co);
  };

  return (t) => {
    g.clear();
    const lt0 = ((t % total) + total) % total;
    const pi = plans.findIndex((p) => lt0 >= p.start && lt0 < p.start + p.dur);
    const p = plans[pi < 0 ? 0 : pi];
    const lt = lt0 - p.start;
    let n = 0;
    while (n < p.times.length && p.times[n] <= lt) n++;
    const erasing = lt >= p.eraseStart;
    if (erasing) n = Math.max(0, p.pos.length - Math.floor((lt - p.eraseStart) * 32));
    for (let i = 0; i < n; i++) {
      const [c, line, col] = p.pos[i];
      const fresh = !erasing && lt - p.times[i] < 0.12;
      drawGlyph(c, line, col, fresh ? "4" : "0");
    }
    // cursor: solid while keys are moving, blinking while idle
    let cl, cc;
    if (n < p.pos.length) { cl = p.pos[n][1]; cc = p.pos[n][2]; }
    else { cl = p.pos[n - 1][1]; cc = p.pos[n - 1][2] + 1; }
    if (cc >= MAXC) { cl++; cc = 0; }
    const typing = (n > 0 && n < p.pos.length && !erasing) || (erasing && n > 0);
    if (typing || (lt % 1.0) < 0.55) {
      for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) g.set(X0 + cc * 6 + i, Y0 + cl * 6 + j, "█", "2");
    }
    // status bar
    g.hline(0, meta.cols - 1, 19, "─", "3");
    g.text(2, 20, erasing ? "-- DELETE --" : "-- INSERT --", erasing ? "4" : "2");
    const info = `ln ${cl + 1}, col ${cc + 1}   ${String(n).padStart(2)} chars   draft ${pi + 1}/${plans.length}`;
    g.text(meta.cols - 2 - info.length, 20, info, "1");
    return g.frame();
  };
}
