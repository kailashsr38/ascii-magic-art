/* teletype-paper-roll: a teletype printing a time-sharing session onto a paper roll that feeds up out of the machine. */
import { Grid, palette, rng } from "../lib/kit.js";

export const meta = {
  slug: "teletype-paper-roll",
  name: "Teletype Paper Roll",
  category: "retro",
  note: "A teletype prints a time-sharing session onto a roll of paper, the type head running along each line, keys going down as the user types and the paper feeding upward.",
  tags: ["retro", "teletype", "printer", "terminal", "computer history", "typing"],
  cols: 80, rows: 34, fps: 24,
  palette: palette(["#f4ead0", "#2a261e", "#c8bc9c", "#8a8070", "#5a5448", "#3a3832", "#26262a", "#46464c", "#6a6a72", "#a0a0a8", "#f2cc60", "#ff7b72", "#d8cfb4", "#2c2a24"]),
};

const SCRIPT = [
  ["m", "TIME SHARING SYSTEM  LINE 07  READY"],
  ["m", "USER NUMBER--", "u", "K41207"],
  ["m", "PASSWORD--", "p", "XXXXXXXX"],
  ["m", "READY"],
  ["m", "NEW OR OLD--", "u", "OLD"],
  ["m", "OLD PROGRAM NAME--", "u", "DICE"],
  ["m", "READY"],
  ["u", "RUN"],
  ["m", ""],
  ["m", "DICE        14:22     OCT 18"],
  ["m", ""],
  ["m", "ROLL   1     3   5     TOTAL   8"],
  ["m", "ROLL   2     6   6     TOTAL  12"],
  ["m", "ROLL   3     2   4     TOTAL   6"],
  ["m", "ROLL   4     1   5     TOTAL   6"],
  ["m", ""],
  ["m", "TIME:  0.4 SECS."],
  ["m", ""],
  ["m", "READY"],
  ["u", "BYE"],
  ["m", "OFF AT 14:23   CONNECT TIME 00:01"],
];
const KEYROWS = ["1234567890-", "QWERTYUIOP", "ASDFGHJKL;", "ZXCVBNM,./"];

export default function create() {
  const W = meta.cols, H = meta.rows;
  const g = new Grid(W, H);
  const R = rng(7);
  // expand the script to timed characters
  const chars = [];
  let t = 0.6;
  SCRIPT.forEach((seg, line) => {
    let col = 0;
    for (let i = 0; i < seg.length; i += 2) {
      const who = seg[i], s = seg[i + 1];
      if (who !== "m") t += 0.5;
      for (const c of s) {
        chars.push({ line, col: col++, c, t, user: who !== "m" });
        t += who === "m" ? 0.045 : 0.13 + R() * 0.12;
      }
    }
    t += 0.25; // carriage return and line feed
  });
  const PERIOD = t + 2.5;
  const PX = 12, PW = 56, PLATEN = 20;
  return (tt) => {
    g.clear();
    const lt = tt % PERIOD;
    let n = 0;
    while (n < chars.length && chars[n].t <= lt) n++;
    const last = n ? chars[n - 1] : { line: 0, col: -1 };
    // a line feed happens shortly after the last char of a line
    let cur = last.line, headCol = last.col + 1;
    if (n < chars.length && chars[n].line > last.line && lt > last.t + 0.12) { cur = chars[n].line; headCol = 0; }
    if (n === chars.length && lt > last.t + 0.25) { cur = last.line + 1; headCol = 0; }
    // paper
    for (let y = 0; y <= PLATEN; y++) {
      for (let x = PX; x < PX + PW; x++) g.set(x, y, "█", "d");
      g.set(PX - 1, y, "▐", "2"); g.set(PX + PW, y, "▌", "2");
    }
    for (let i = 0; i < n; i++) {
      const ch = chars[i];
      const y = PLATEN - (cur - ch.line);
      if (y < 0 || y > PLATEN) continue;
      const x = PX + 3 + ch.col;
      if (x >= PX + PW - 1 || ch.c === " ") continue;
      g.set(x, y, ch.c, ch.c === "X" && SCRIPT[ch.line][2] === "p" ? "3" : "0");
      if (ch.c === "X" && SCRIPT[ch.line][2] === "p") g.set(x, y, "▓", "3");
    }
    // machine body
    for (let y = PLATEN + 1; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, "█", y === PLATEN + 1 ? "7" : "6");
    for (let y = 0; y <= PLATEN; y++) for (let x = 0; x < W; x++) if (x < PX - 5 || x > PX + PW + 4) g.set(x, y, y > PLATEN - 3 ? "█" : " ", "6");
    // platen roller and knobs
    g.text(PX - 4, PLATEN + 1, "▄" + "▄".repeat(PW + 6) + "▄", "8");
    g.text(PX - 6, PLATEN + 1, "██", "9"); g.text(PX + PW + 5, PLATEN + 1, "██", "9");
    // type head: rides under the line being printed
    const hx = PX + 3 + Math.min(headCol, PW - 5);
    g.text(hx - 1, PLATEN + 2, "▐█▌", "a");
    g.text(PX, PLATEN + 3, "▀".repeat(PW), "8");
    // keyboard, with the typed key going down
    const typing = n && chars[n - 1].user && lt - chars[n - 1].t < 0.1 ? chars[n - 1].c : "";
    KEYROWS.forEach((row, r) => {
      const y = PLATEN + 5 + r * 2;
      const x0 = 18 + r * 2;
      for (let i = 0; i < row.length; i++) {
        const down = row[i] === typing;
        g.text(x0 + i * 4, y, "(" + row[i] + ")", down ? "a" : "9");
      }
    });
    g.text(28, H - 2, "(           SPACE           )", "8");
    g.text(4, PLATEN + 5, "LINE", "8"); g.text(4, PLATEN + 6, "●", "b");
    g.text(4, PLATEN + 8, "LOC", "8"); g.text(4, PLATEN + 9, "○", "8");
    g.text(70, PLATEN + 5, "BRK", "8"); g.text(70, PLATEN + 7, "RET", "8");
    return g.frame();
  };
}
