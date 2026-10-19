/* constellation-word: stars on a sky chart light up and get joined, line by line, until they spell a word. */
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
  slug: "constellation-word",
  name: "Constellation Lettering",
  category: "lettering",
  note: "On a drifting star chart, bright stars light up and are joined line by line until the constellation spells a word, then it fades into the next.",
  tags: ["stars", "night", "space", "hero", "letters", "wallpaper"],
  cols: 100, rows: 30, fps: 24,
  palette: palette(["#ffffff", "#fff2c4", "#9fc3ff", "#5a7fc0", "#2a3d66", "#1a2440", "#ffd166", "#26304a", "#12182a"]),
};

const WORDS = ["DREAM", "LIGHT", "HELLO"], PER = 8.5;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const SX = 3.4, SY = 2.3;
  const R = rng(17);
  const plans = WORDS.map((w) => {
    const span = (w.length - 1) * 6 + 4;
    const ox = (cols - span * SX) / 2, oy = 7;
    const segs = [], stars = new Map();
    for (const s of wordStrokes(w, 6)) {
      // keep corners and a few points along curves as the stars
      const keep = s.filter((_, i) => i === 0 || i === s.length - 1 || s.length < 6 || i % 4 === 0);
      for (let i = 0; i < keep.length; i++) {
        const p = [Math.round(ox + keep[i][0] * SX), Math.round(oy + keep[i][1] * SY)];
        stars.set(p.join(","), p);
        if (i) segs.push([[Math.round(ox + keep[i - 1][0] * SX), Math.round(oy + keep[i - 1][1] * SY)], p]);
      }
    }
    return { segs, stars: [...stars.values()].sort((a, b) => a[0] - b[0]) };
  });
  const sky = [];
  for (let i = 0; i < 260; i++) sky.push([R() * cols * 2, R() * rows, R()]);
  return (t) => {
    g.clear();
    const n = WORDS.length, cyc = ((t % (PER * n)) + PER * n) % (PER * n);
    const wi = Math.floor(cyc / PER), lt = cyc - wi * PER;
    // chart grid: drifting meridians and parallels
    const drift = t * 0.8;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const mx = (x + drift) % 20, py = (y + 2) % 8;
      if (mx < 1 && y % 3 === 0) g.set(x, y, "·", "7");
      else if (py === 0 && (x + Math.floor(drift)) % 5 === 0) g.set(x, y, "·", "7");
      else g.set(x, y, " ", " ");
    }
    for (const [sx, sy, b] of sky) {
      const x = (((sx - drift * (0.6 + b * 0.4)) % (cols * 2)) + cols * 2) % (cols * 2);
      if (x < cols) g.set(x, sy, b > 0.92 ? "+" : b > 0.6 ? "·" : ".", b > 0.92 ? "2" : b > 0.6 ? "3" : "4");
    }
    const P = plans[wi];
    const fade = lt > PER - 1.2 ? (PER - lt) / 1.2 : 1;
    // joining lines, drawn in order
    const nl = P.segs.length, shown = Math.min(nl, Math.max(0, ((lt - 1.2) / 3.6) * nl));
    for (let k = 0; k < Math.ceil(shown); k++) {
      const [[ax, ay], [bx, by]] = P.segs[k];
      const part = Math.min(1, shown - k);
      if ((k * 37) % 100 / 100 > fade) continue;
      const ex = ax + (bx - ax) * part, ey = ay + (by - ay) * part;
      const L = Math.max(Math.abs(ex - ax) / 1, Math.abs(ey - ay) * 2);
      const sl = (by - ay) * 2 / ((bx - ax) || 0.001);
      const lc = Math.abs(sl) < 0.5 ? "─" : Math.abs(sl) > 3 ? "│" : sl > 0 ? "╲" : "╱";
      for (let s = 1; s < L; s += 1) { const f = s / L; g.set(ax + (ex - ax) * f, ay + (ey - ay) * f, lc, "2"); }
    }
    // the stars, appearing left to right
    P.stars.forEach(([x, y], k) => {
      const on = lt > (k / P.stars.length) * 1.2;
      if (!on || (k * 53) % 100 / 100 > fade) return;
      const big = (x * 7 + y * 3) % 5 === 0;
      g.set(x, y, big ? "●" : "•", big ? "0" : "1");
    });
    // a shooting star crossing now and then
    const sp = (t % 6) / 0.9;
    if (sp < 1) {
      const x0 = 10 + ((Math.floor(t / 6) * 37) % 60), y0 = 2;
      for (let k = 0; k < 6; k++) g.set(x0 + (sp * 30) - k * 2, y0 + (sp * 8) - k * 0.5, k ? "·" : "•", k ? "3" : "0");
    }
    g.text(2, rows - 1, "CHART " + (wi + 1) + " · " + WORDS[wi].split("").join(" "), "3");
    return g.frame();
  };
}
