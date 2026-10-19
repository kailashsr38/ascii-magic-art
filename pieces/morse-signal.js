/* morse-signal: a phrase keyed out in morse, its trace scrolling past as the letters decode. */
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
  slug: "morse-signal",
  name: "Morse Signal",
  category: "lettering",
  note: "A phrase keyed out in morse code, the signal trace scrolling past a lamp while each letter decodes above it.",
  tags: ["morse", "signal", "text", "radio", "terminal"],
  cols: 76, rows: 22, fps: 30,
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#ffd166", "#5a4a1e", "#7ee787", "#79c0ff", "#1f3d2a"]),
};

const MORSE = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....", I: "..", J: ".---", K: "-.-", L: ".-..", M: "--",
  N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-", Y: "-.--", Z: "--..",
};
const PHRASES = ["HELLO WORLD", "SEND HELP", "ALL CLEAR"];
const U = 0.085;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  let clock = 0;
  const plans = PHRASES.map((p) => {
    const on = [], letters = [];
    let tt = 0.6;
    [...p].forEach((c, k) => {
      if (c === " ") { tt += 4 * U; letters.push({ c, done: tt, start: tt, k }); return; }
      const start = tt;
      [...MORSE[c]].forEach((e, i) => {
        const d = e === "." ? U : 3 * U;
        on.push([tt, tt + d]); tt += d;
        if (i < MORSE[c].length - 1) tt += U;
      });
      letters.push({ c, done: tt, start, k });
      tt += 3 * U;
    });
    const plan = { p, on, letters, start: clock, dur: tt + 2.8 };
    clock += plan.dur;
    return plan;
  });
  const total = clock;
  const isOn = (plan, lt) => plan.on.some(([a, b]) => lt >= a && lt < b);
  return (t) => {
    g.clear();
    const tt = ((t % total) + total) % total;
    const plan = plans.find((q) => tt >= q.start && tt < q.start + q.dur) || plans[0];
    const lt = tt - plan.start;
    const lit = isOn(plan, lt);
    g.text(2, 0, "TX  7.030 MHz   CW   12 WPM", "1");
    g.text(cols - 12, 0, lit ? "● KEY DOWN" : "○ KEY UP  ", lit ? "3" : "1");
    g.hline(0, cols - 1, 1, "─", "2");
    const px = Math.floor((cols - plan.p.length * 6 + 1) / 2);
    for (const L of plan.letters) {
      if (L.c === " ") continue;
      const x = px + L.k * 6;
      const done = lt >= L.done, sending = lt >= L.start && !done;
      const gl = glyph(L.c);
      if (done || sending) for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) if (gl[j][i] === "#")
        g.set(x + i, 3 + j, done ? "█" : "░", done ? (lt - L.done < 0.25 ? "5" : "0") : "2");
      // its code underneath, element by element
      const code = MORSE[L.c];
      const cx = x + Math.floor((5 - code.length) / 2);
      let et = L.start;
      [...code].forEach((e, i) => {
        if (lt >= et) g.set(cx + i, 9, e === "." ? "•" : "━", done ? "6" : "3");
        et += (e === "." ? U : 3 * U) + U;
      });
      if (sending) g.text(x, 10, "▀▀▀▀▀", "3");
    }
    // scrolling trace: the right edge is now
    const TX0 = 2, TX1 = cols - 10, colDt = 0.03;
    for (let x = TX0; x <= TX1; x++) {
      const at = lt - (TX1 - x) * colDt;
      const on = at >= 0 && isOn(plan, at);
      if (on) for (let y = 13; y <= 17; y++) g.set(x, y, "█", x === TX1 ? "3" : "5");
      else { g.set(x, 17, "▄", "7"); if ((x + Math.floor(lt / colDt)) % 4 === 0) g.set(x, 13, "·", "2"); }
    }
    // the lamp
    const LX = cols - 7;
    for (let y = 13; y <= 17; y++) for (let x = 0; x < 5; x++) {
      const d = Math.hypot((x - 2) / 2.6, (y - 15) / 2.4);
      if (d < 1) g.set(LX + x, y, lit ? (d < 0.5 ? "█" : "▓") : "░", lit ? "3" : "4");
    }
    g.hline(0, cols - 1, 19, "─", "2");
    const sent = plan.letters.filter((L) => lt >= L.done).map((L) => L.c).join("");
    g.text(2, 20, "RX> " + sent + ((t % 1) < 0.5 ? "_" : " "), "6");
    g.text(cols - 16, 20, `unit ${Math.round(U * 1000)} ms`, "1");
    return g.frame();
  };
}
