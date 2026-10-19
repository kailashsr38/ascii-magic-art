/* chalkboard-lettering: chalk writes a big word on a green board, underlines it, then the eraser wipes it off. */
import { Grid, palette, noise2 } from "../lib/kit.js";

/* Single stroke font on a 4 by 6 box (y grows down), drawn fresh for this piece. */
function arc(cx, cy, rx, ry, a0, a1, n = 14) {
  const out = [];
  for (let i = 0; i <= n; i++) { const a = ((a0 + (a1 - a0) * (i / n)) * Math.PI) / 180; out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
  return out;
}
const STROKES = {
  A: [[[0, 6], [2, 0], [4, 6]], [[0.9, 3.6], [3.1, 3.6]]],
  B: [[[0, 6], [0, 0], [2.4, 0], ...arc(2.4, 1.5, 1.4, 1.5, -90, 90), [0, 3]], [[0, 3], [2.6, 3], ...arc(2.6, 4.5, 1.4, 1.5, -90, 90), [0, 6]]],
  C: [arc(2.2, 3, 2.2, 3, -40, -320, 18)],
  D: [[[0, 6], [0, 0], [1.6, 0], ...arc(1.6, 3, 2.4, 3, -90, 90, 16), [0, 6]]],
  E: [[[4, 0], [0, 0], [0, 6], [4, 6]], [[0, 3], [3, 3]]],
  F: [[[4, 0], [0, 0], [0, 6]], [[0, 3], [3, 3]]],
  G: [[...arc(2.1, 3, 2.1, 3, -40, -360, 18), [2.3, 3]]],
  H: [[[0, 0], [0, 6]], [[4, 0], [4, 6]], [[0, 3], [4, 3]]],
  I: [[[2, 0], [2, 6]], [[0.8, 0], [3.2, 0]], [[0.8, 6], [3.2, 6]]],
  J: [[[4, 0], [4, 4], ...arc(2, 4, 2, 2, 0, 160)]],
  K: [[[0, 0], [0, 6]], [[4, 0], [0, 3.8]], [[1.4, 2.6], [4, 6]]],
  L: [[[0, 0], [0, 6], [4, 6]]],
  M: [[[0, 6], [0, 0], [2, 3.6], [4, 0], [4, 6]]],
  N: [[[0, 6], [0, 0], [4, 6], [4, 0]]],
  O: [arc(2, 3, 2, 3, -90, 270, 22)],
  P: [[[0, 6], [0, 0], [2.4, 0], ...arc(2.4, 1.6, 1.6, 1.6, -90, 90), [0, 3.2]]],
  R: [[[0, 6], [0, 0], [2.4, 0], ...arc(2.4, 1.5, 1.6, 1.5, -90, 90), [0, 3]], [[1.8, 3], [4, 6]]],
  S: [[...arc(2, 1.5, 2, 1.5, -15, -270, 12), ...arc(2, 4.5, 2, 1.5, -90, 165, 12)]],
  T: [[[0, 0], [4, 0]], [[2, 0], [2, 6]]],
  U: [[[0, 0], [0, 4], ...arc(2, 4, 2, 2, 180, 0), [4, 0]]],
  V: [[[0, 0], [2, 6], [4, 0]]],
  W: [[[0, 0], [1, 6], [2, 2.4], [3, 6], [4, 0]]],
  X: [[[0, 0], [4, 6]], [[4, 0], [0, 6]]],
  Y: [[[0, 0], [2, 3]], [[4, 0], [2, 3], [2, 6]]],
  Z: [[[0, 0], [4, 0], [0, 6], [4, 6]]],
};
/* Lay a word out as a list of strokes in font units, letters `adv` units apart. */
function wordStrokes(word, adv = 5.6) {
  const out = [];
  [...word].forEach((c, k) => { for (const s of STROKES[c] || []) out.push(s.map(([x, y]) => [x + k * adv, y])); });
  return out;
}

export const meta = {
  slug: "chalkboard-lettering",
  name: "Chalkboard Lettering",
  category: "lettering",
  note: "A stick of chalk writes a big word on a dusty green board, underlines it, and a felt eraser wipes it away for the next one.",
  tags: ["chalk", "school", "handwriting", "hero", "letters", "classroom"],
  cols: 96, rows: 28, fps: 30,
  palette: palette(["#f4f4ea", "#d6dccf", "#a8b5a6", "#2c4a3a", "#27412f", "#22392a", "#3d5a48", "#6b4a2b", "#8a6238", "#4a3220", "#e8e0c8", "#5a6a5f"]),
};

const WORDS = ["LEARN", "IDEAS", "DRAW"];
const SX = 3.3, SY = 2.1, SPEED = 12, HOLD = 1.6, WIPE = 1.3;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const plans = WORDS.map((w) => {
    const strokes = wordStrokes(w, 5.8);
    const span = (w.length - 1) * 5.8 + 4;
    const ox = (cols - span * SX) / 2, oy = 6;
    strokes.push([[-0.3, 7.3], [span + 0.3, 7.1]]); // underline
    const pts = [];
    let time = 0, last = null;
    for (const s of strokes) {
      if (last) time += Math.hypot(s[0][0] - last[0], s[0][1] - last[1]) / (SPEED * 3) + 0.1;
      for (let i = 0; i < s.length - 1; i++) {
        const [ax, ay] = s[i], [bx, by] = s[i + 1];
        const L = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.ceil(L * 8));
        for (let k = 0; k < n; k++) { const f = k / n; pts.push([Math.round(ox + (ax + (bx - ax) * f) * SX), Math.round(oy + (ay + (by - ay) * f) * SY), time + (L * f) / SPEED]); }
        time += L / SPEED;
      }
      last = s[s.length - 1];
    }
    return { pts, dur: time };
  });
  const per = plans.map((p) => p.dur + HOLD + WIPE);
  const total = per.reduce((a, b) => a + b, 0);
  const board = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const n = noise2(x * 0.15, y * 0.3, 6);
    board.push(n > 0.62 ? "6" : n > 0.45 ? "3" : n > 0.3 ? "4" : "5");
  }
  const grit = (x, y) => ((x * 73856093) ^ (y * 19349663)) >>> 0;
  return (t) => {
    g.clear();
    let c = ((t % total) + total) % total, wi = 0;
    while (c >= per[wi]) { c -= per[wi]; wi++; }
    const P = plans[wi], prev = plans[(wi + WORDS.length - 1) % WORDS.length];
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) g.set(x, y, "█", board[x + y * cols]);
    // smudges left by the last wipe
    for (const [x, y] of prev.pts) if (grit(x, y) % 3 === 0) g.set(x, y, "▓", "b");
    const wiping = c > P.dur + HOLD;
    const ex = wiping ? ((c - P.dur - HOLD) / WIPE) * (cols + 16) - 8 : -99;
    let tip = null;
    for (const [x, y, pt] of P.pts) {
      if (pt > c) break;
      tip = [x, y];
      if (wiping && x < ex) { if (grit(x, y) % 3 === 0) g.set(x, y, "▓", "b"); continue; }
      for (let d = 0; d < 2; d++) {
        const h = grit(x + d, y) % 10;
        g.set(x + d, y, h < 6 ? "█" : h < 9 ? "▓" : "▒", h < 4 ? "0" : h < 8 ? "1" : "2");
      }
    }
    if (!wiping && c < P.dur && tip) {
      const [x, y] = tip;
      g.text(x + 1, y - 1, "▄▀", "a");
      g.text(x + 2, y - 2, "▄▀", "a");
      g.set(x + 4, y - 3, "▀", "a");
    }
    if (wiping) {
      const x = Math.round(ex), y0 = 4 + Math.round(Math.sin(c * 9) * 3);
      for (let y = y0; y < y0 + 10; y++) { g.text(x - 3, y, "████", "b"); }
      for (let y = y0; y < y0 + 10; y++) g.text(x + 1, y, "▓▓", "7");
      g.text(x - 3, y0 - 1, "▄▄▄▄▄▄", "8");
    }
    // wooden frame and chalk tray
    for (let x = 0; x < cols; x++) { g.set(x, 0, "▀", "7"); g.set(x, rows - 2, "▄", "8"); g.set(x, rows - 1, "█", "9"); }
    for (let y = 0; y < rows - 1; y++) { g.set(0, y, "█", "7"); g.set(cols - 1, y, "█", "7"); }
    g.text(8, rows - 2, "▄▄▄", "a"); g.text(14, rows - 2, "▄▄", "0"); g.text(cols - 20, rows - 2, "▄▄▄▄▄▄", "8");
    return g.frame();
  };
}
