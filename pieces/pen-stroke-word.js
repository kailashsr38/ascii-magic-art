/* pen-stroke-word: a fountain pen writes a big word stroke by stroke on lined paper, then the page turns. */
import { Grid, palette, rng } from "../lib/kit.js";

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
  slug: "pen-stroke-word",
  name: "Fountain Pen Lettering",
  category: "lettering",
  note: "A fountain pen draws a big word stroke by stroke in wet blue ink on ruled paper, then the page turns for the next word.",
  tags: ["handwriting", "pen", "ink", "hero", "letters", "signature"],
  cols: 96, rows: 26, fps: 30,
  palette: palette(["#f3ecd9", "#e8dfc6", "#c9d3e3", "#e7a7a0", "#1d3f8f", "#2f5fc4", "#6e8fd8", "#2a2a2a", "#c9a24a", "#8a7a5a", "#d2c6a8"]),
};

const WORDS = ["HELLO", "WRITE", "MAGIC"];
const SX = 3.2, SY = 2.05, SPEED = 13, HOLD = 1.8, TURN = 0.9;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const plans = WORDS.map((w) => {
    const strokes = wordStrokes(w, 5.7);
    const span = (w.length - 1) * 5.7 + 4;
    const ox = (cols - span * SX) / 2, oy = 5;
    const pts = [];
    let time = 0, last = null;
    for (const s of strokes) {
      if (last) time += Math.hypot(s[0][0] - last[0], s[0][1] - last[1]) / (SPEED * 2.5) + 0.12;
      for (let i = 0; i < s.length - 1; i++) {
        const [ax, ay] = s[i], [bx, by] = s[i + 1];
        const L = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.ceil(L * 8));
        for (let k = 0; k < n; k++) {
          const f = k / n;
          pts.push([ox + (ax + (bx - ax) * f) * SX, oy + (ay + (by - ay) * f) * SY, time + (L * f) / SPEED]);
        }
        time += L / SPEED;
      }
      last = s[s.length - 1];
      pts.push([ox + last[0] * SX, oy + last[1] * SY, time]);
    }
    return { pts, dur: time };
  });
  const per = plans.map((p) => p.dur + HOLD + TURN);
  const total = per.reduce((a, b) => a + b, 0);
  const R = rng(3), fibres = [];
  for (let i = 0; i < 40; i++) fibres.push([Math.floor(R() * cols), Math.floor(R() * rows)]);
  const page = (turnX) => {
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      if (x < turnX) continue;
      const ruled = (y - 3) % 4 === 0 && y > 2;
      g.set(x, y, "█", ruled ? "2" : "0");
    }
    for (const [x, y] of fibres) if (x >= turnX && g.get(x, y) === "█") g.set(x, y, "▓", "1");
    if (turnX <= 6) for (let y = 0; y < rows; y++) g.set(6, y, "│", "3");
  };
  return (t) => {
    g.clear();
    let c = ((t % total) + total) % total, wi = 0;
    while (c >= per[wi]) { c -= per[wi]; wi++; }
    const P = plans[wi];
    const turning = c > P.dur + HOLD;
    const tx = turning ? Math.floor(((c - P.dur - HOLD) / TURN) * (cols + 10)) - 10 : -1;
    // the fresh page underneath, then the written page sliding off to the left as it turns
    page(-1);
    if (turning) {
      const nx = cols - tx; // the old page's right edge
      for (let y = 0; y < rows; y++) for (let x = Math.max(0, nx); x < Math.min(cols, nx + 3); x++) g.set(x, y, x === nx ? "▌" : "░", "a");
    }
    const lim = turning ? cols - tx : cols;
    let tip = null;
    for (const [x, y, pt] of P.pts) {
      if (pt > c) { break; }
      if (x >= lim) continue;
      const wet = c - pt < 0.5 && !turning;
      g.set(x, y, "█", wet ? "5" : "4");
      if (x + 1 < lim) g.set(x + 1, y, "█", wet ? "5" : "4");
      tip = [x, y];
    }
    if (c < P.dur && tip) {
      const [x, y] = tip;
      g.set(x + 1, y - 1, "╱", "8");
      g.text(x + 2, y - 2, "╱▓", "7");
      g.text(x + 3, y - 3, "╱▓▓", "7");
      g.text(x + 5, y - 4, "▓▓", "7");
      g.text(x + 6, y - 5, "▓▓", "8");
      g.text(x + 7, y - 6, "▓", "7");
      g.set(x, y, "●", "6");
    }
    return g.frame();
  };
}
