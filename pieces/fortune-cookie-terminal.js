/* fortune-cookie-terminal: a shell command cracks open a fortune cookie and a paper slip slides out with an original fortune. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "fortune-cookie-terminal",
  name: "Terminal Fortune Cookie",
  category: "lettering",
  note: "A shell command cracks open a fortune cookie in the terminal, a paper slip slides out with an original fortune and lucky numbers, then the screen clears for another.",
  tags: ["terminal", "fortune", "cli", "fun", "readme", "text"],
  cols: 72, rows: 24, fps: 24,
  // 0 text, 1 muted, 2 frame, 3 prompt green, 4 path blue, 5 cookie light, 6 cookie mid, 7 cookie dark, 8 paper, 9 fortune ink, a crumbs, b red
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#7ee787", "#79c0ff", "#f0c674", "#d29a46", "#8a5a24", "#f5efe0", "#3b2f1e", "#b88a4a", "#ff7b72"]),
};

const FORTUNES = [
  ["A bug you fixed last spring", "will quietly save your Friday."],
  ["The answer arrives right after", "you stop refreshing the page."],
  ["Someone is about to read your", "README and smile at it."],
  ["Your next good idea is hiding", "inside a very boring task."],
];
const LUCKY = ["4 11 23 38 42", "7 9 16 30 44", "2 13 21 27 35", "5 8 19 33 40"];

// half a cookie, drawn left side; the right half is its mirror
const HALF = [
  "    ▄▄▄██",
  "  ▄█▓▒▓▓█",
  " █▓▒▒▒▓▓█",
  "█▓▒▒▒▒▒▓█",
  " ▀█▓▓▓▓▓█",
  "   ▀▀▀███",
];
const MIRROR = { "▄": "▄", "▀": "▀", "█": "█", "▓": "▓", "▒": "▒", " ": " " }; // the blocks are symmetric
const shadeKey = (c) => (c === "▓" ? "6" : "7");

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const CMD = "fortune --cookie";
  const P = { typeEnd: 0.6 + CMD.length * 0.07, crack: 0, slip: 0, done: 0, dur: 0 };
  P.crack = P.typeEnd + 0.9; P.slip = P.crack + 0.7; P.done = P.slip + 1.6; P.dur = P.done + 4.2;
  const total = P.dur * FORTUNES.length;
  const prompt = (y, s) => {
    g.text(2, y, "kai@desk", "3"); g.text(10, y, ":", "1"); g.text(11, y, "~", "4"); g.text(13, y, "$", "1");
    g.text(15, y, s, "0");
  };
  const drawHalf = (x0, y0, left) => {
    HALF.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        const c = left ? row[i] : MIRROR[row[row.length - 1 - i]];
        if (c === " ") continue;
        if (c === "▒") g.set(x0 + i, y0 + j, "█", "5");
        else g.set(x0 + i, y0 + j, c, c === "▄" || c === "▀" ? "6" : shadeKey(c));
      }
    });
  };
  return (t) => {
    g.clear();
    const T = ((t % total) + total) % total;
    const fi = Math.floor(T / P.dur), lt = T - fi * P.dur;
    // window
    g.box(0, 0, cols, rows, "round", "2");
    g.text(2, 1, "●", "b"); g.text(4, 1, "●", "6"); g.text(6, 1, "●", "3");
    g.text(Math.floor(cols / 2) - 4, 1, "~ zsh", "1");
    g.hline(1, cols - 2, 2, "─", "2");
    // prompt and command
    const n = Math.max(0, Math.min(CMD.length, Math.floor((lt - 0.6) / 0.07)));
    prompt(4, CMD.slice(0, n));
    if (lt < P.typeEnd + 0.3) { if (lt < P.typeEnd || (lt % 0.8) < 0.45) g.set(15 + n, 4, "▌", "0"); }
    if (lt < P.typeEnd + 0.3) return g.frame();
    g.text(2, 5, "cracking cookie " + String(fi + 1).padStart(3, "0") + "...", "1");
    // cookie: halves drift apart after the crack, with crumbs
    const cx = Math.floor(cols / 2), cy = 7;
    const sep = lt < P.crack ? (lt > P.crack - 0.3 ? ((Math.floor(lt * 30) % 2) ? 1 : 0) : 0) : Math.min(6, Math.round((lt - P.crack) * 12));
    drawHalf(cx - 9 - sep, cy, true);
    drawHalf(cx - sep * 0 + sep, cy, false);
    if (lt >= P.crack) {
      const ct = lt - P.crack;
      const crumbs = [[-2, 1.0], [1, 1.4], [-1, 0.8], [2, 1.1], [0, 1.6]];
      crumbs.forEach(([dx, sp], k) => {
        const yy = cy + 5 + Math.floor(ct * sp * 6);
        if (yy < cy + 9) g.set(cx + dx + (k % 2 ? sep : -sep) / 3, yy, k % 2 ? "·" : ".", "a");
      });
    }
    // paper slip slides out to the right from the crack
    const [l1, l2] = FORTUNES[fi];
    const SW = Math.max(l1.length, l2.length) + 4;
    if (lt >= P.slip) {
      const k = Math.min(1, (lt - P.slip) / 0.9);
      const w = Math.max(2, Math.round(SW * (k * (2 - k))));
      const sx = Math.floor((cols - SW) / 2), sy = cy + 7;
      g.text(sx, sy, "▄".repeat(w), "8");
      for (let r = 1; r <= 2; r++) {
        g.text(sx, sy + r, "█", "8");
        g.text(sx + w - 1, sy + r, "█", "8");
      }
      g.text(sx, sy + 3, "▀".repeat(w), "8");
      const txt = [l1, l2];
      txt.forEach((s, r) => { const vis = s.slice(0, Math.max(0, w - 4)); g.text(sx + 2, sy + 1 + r, vis, "0"); });
    }
    // lucky numbers and the next prompt
    if (lt >= P.done) {
      g.text(Math.floor((cols - 30) / 2), cy + 12, "lucky numbers:", "1");
      g.text(Math.floor((cols - 30) / 2) + 15, cy + 12, LUCKY[fi], "6");
      prompt(rows - 3, "");
      if ((lt % 0.9) < 0.5) g.set(15, rows - 3, "▌", "0");
    }
    return g.frame();
  };
}
