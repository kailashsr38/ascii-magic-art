/* punch-card-keypunch: a keypunch punching a program into 80-column cards, one statement per card. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "punch-card-keypunch",
  name: "Keypunch Card Deck",
  category: "retro",
  note: "A keypunch types a short program onto 80-column cards, the holes appearing column by column before each finished card slides off to the stacker.",
  tags: ["retro", "punch card", "programming", "computer history", "readme", "terminal"],
  cols: 90, rows: 25, fps: 24,
  palette: palette(["#efe3c0", "#d8c99e", "#b8a87e", "#8a7a56", "#e6edf3", "#8b949e", "#f2cc60", "#7ee787", "#ff7b72", "#484f58", "#30363d", "#79c0ff"]),
};

const PROG = [
  "C     SUM OF THE FIRST HUNDRED SQUARES",
  "      ISUM = 0",
  "      DO 10 I = 1, 100",
  "   10 ISUM = ISUM + I*I",
  "      PRINT 20, ISUM",
  "   20 FORMAT (I12)",
  "      END",
];
// punch rows: 0 = row 12, 1 = row 11, 2 = row 0, 3..11 = rows 1..9
const code = (c) => {
  if (c === " ") return [];
  if (c >= "0" && c <= "9") return [c === "0" ? 2 : 2 + +c];
  if (c >= "A" && c <= "I") return [0, 2 + (c.charCodeAt(0) - 64)];
  if (c >= "J" && c <= "R") return [1, 2 + (c.charCodeAt(0) - 73)];
  if (c >= "S" && c <= "Z") return [2, 2 + (c.charCodeAt(0) - 81)];
  return { "+": [0, 8, 10], "=": [8, 10], "*": [1, 6, 10], "(": [0, 7, 10], ")": [1, 7, 10], ",": [2, 5, 10], ".": [0, 5, 10], "-": [1], "/": [2, 3] }[c] || [];
};
const RATE = 0.045, SLIDE = 0.7, HOLD = 0.4;

export default function create() {
  const W = meta.cols, H = meta.rows;
  const g = new Grid(W, H);
  const cards = PROG.map((l, i) => {
    const full = l.padEnd(72) + "SUMS" + String((i + 1) * 10).padStart(4, "0");
    const typedLen = l.length;
    const dur = typedLen * RATE + 0.5 + 8 * RATE; // statement, skip to 73, sequence number
    return { full, typedLen, dur };
  });
  let acc = 0;
  for (const c of cards) { c.t0 = acc; acc += c.dur + HOLD + SLIDE; }
  const PERIOD = acc + 0.6;
  // columns punched by time k into a card
  const colsDone = (c, k) => {
    const a = c.typedLen * RATE;
    if (k < a) return Math.floor(k / RATE);
    if (k < a + 0.5) return c.typedLen + Math.floor(((k - a) / 0.5) * (72 - c.typedLen));
    return Math.min(80, 72 + Math.floor((k - a - 0.5) / RATE));
  };
  const drawCard = (c, x0, done) => {
    const y0 = 4;
    g.fill(x0, y0, 82, 14, "█", "0");
    g.set(x0, y0, " "); g.set(x0 + 1, y0, "▄", "0"); // cut corner
    for (let col = 0; col < 80; col++) {
      for (let r = 2; r < 12; r++) {
        const yy = y0 + 1 + r;
        if (col % 10 === 9) g.set(x0 + 1 + col, yy, "▓", "1");
      }
      if (col >= done) continue;
      const ch = c.full[col];
      for (const r of code(ch)) g.set(x0 + 1 + col, y0 + 1 + r, " ");
      if (ch !== " ") g.set(x0 + 1 + col, y0 - 1, ch, "4");
    }
    // field rules for the statement area
    g.set(x0 + 6, y0 + 13, "▀", "3"); g.set(x0 + 73, y0 + 13, "▀", "3");
  };
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    let ci = cards.length - 1;
    for (let i = 0; i < cards.length; i++) if (lt >= cards[i].t0) ci = i;
    const c = cards[ci];
    const k = lt - c.t0;
    const done = colsDone(c, k);
    const slideK = Math.max(0, (k - c.dur - HOLD) / SLIDE);
    const X0 = 3;
    // header and ruler
    g.text(0, 0, "KEYPUNCH", "6");
    g.text(10, 0, "PROGRAM SUMSQ", "5");
    g.text(26, 0, "CARD " + (ci + 1) + " OF " + cards.length, "5");
    g.text(42, 0, "COLUMN " + String(Math.min(80, done + 1)).padStart(2), "4");
    g.text(56, 0, done < c.typedLen ? "PUNCH" : done < 72 ? "SKIP " : "DUP SEQ", done < 72 && done >= c.typedLen ? "6" : "7");
    for (let col = 0; col < 80; col++) g.set(X0 + 1 + col, 1, (col + 1) % 10 === 0 ? String(((col + 1) / 10) % 10) : col % 10 === 4 ? "+" : "·", "9");
    if (slideK <= 0) {
      drawCard(c, X0, done);
      if (done < 80) { g.set(X0 + 1 + done, 2, "▼", "6"); g.set(X0 + 1 + done, 18, "▲", "6"); }
    } else {
      const s = Math.min(1, slideK);
      const e = s * s * (3 - 2 * s);
      drawCard(c, X0 - Math.round(e * 92), 80);
      const nx = ci + 1 < cards.length ? cards[ci + 1] : null;
      if (nx) drawCard(nx, X0 + Math.round((1 - e) * 92), 0);
    }
    // stacker: cards already punched, edge on, plus the program listing so far
    g.text(0, 20, "STACKER", "5");
    const stacked = ci + (slideK >= 1 ? 1 : 0);
    for (let i = 0; i < cards.length; i++) g.text(9 + i * 3, 20, "▐█▌", i < stacked ? "1" : "a");
    g.text(32, 20, "HOPPER", "5");
    for (let i = 0; i < cards.length; i++) g.text(39 + i * 3, 20, "▐█▌", i >= ci + 1 ? "0" : "a");
    g.box(0, 21, W, 4, "light", "a");
    const prev = ci > 0 ? PROG[ci - 1] : "";
    g.text(2, 22, ("prev  " + prev).slice(0, W - 4), "5");
    g.text(2, 23, ("this  " + PROG[ci].slice(0, Math.min(done, PROG[ci].length))).slice(0, W - 4), "4");
    if (done < c.typedLen && Math.floor(lt * 4) % 2 === 0) g.set(8 + done, 23, "█", "6");
    return g.frame();
  };
}
