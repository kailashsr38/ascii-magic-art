/* hilbert-curve: a fifth-order Hilbert curve drawing itself in a rainbow, then winding back up. */
import { Grid, palette, gradient, KEYS } from "../lib/kit.js";

const HUES = gradient(["#ff4a6a", "#ff9a3a", "#ffe04a", "#5aff8a", "#3ad0ff", "#6a7aff", "#d07aff", "#ff4a6a"], 32);
const pal = palette([...HUES, "#ffffff", "#2a2e48"]);
const HEAD = KEYS[32], GRIDK = KEYS[33];

export const meta = {
  slug: "hilbert-curve",
  name: "Hilbert Curve",
  category: "algorithms",
  note: "A fifth-order Hilbert curve drawing itself corner by corner in a rainbow, then reeling back in.",
  tags: ["space-filling", "math", "fractal", "loader", "terminal"],
  cols: 68, rows: 34, fps: 30,
  palette: pal,
};

const ORDER = 5, S = 1 << ORDER, NP = S * S;
const DRAW = 9, HOLD = 1.5, ERASE = 4, P = DRAW + HOLD + ERASE;

function d2xy(d) {
  let x = 0, y = 0, t = d;
  for (let s = 1; s < S; s *= 2) {
    const rx = 1 & (t / 2), ry = 1 & (t ^ rx);
    if (ry === 0) { if (rx === 1) { x = s - 1 - x; y = s - 1 - y; } const tmp = x; x = y; y = tmp; }
    x += s * rx; y += s * ry; t = Math.floor(t / 4);
  }
  return [x, y];
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const pts = Array.from({ length: NP }, (_, i) => d2xy(i));
  const ox = 2, oy = 1;
  const glyph = (i) => {
    const [x, y] = pts[i];
    const dirs = new Set();
    for (const j of [i - 1, i + 1]) {
      if (j < 0 || j >= NP) continue;
      const [a, b] = pts[j];
      dirs.add(a > x ? "R" : a < x ? "L" : b > y ? "D" : "U");
    }
    const has = (d) => dirs.has(d);
    if (has("L") && has("R")) return "━";
    if (has("U") && has("D")) return "┃";
    if (has("D") && has("R")) return "┏";
    if (has("D") && has("L")) return "┓";
    if (has("U") && has("R")) return "┗";
    if (has("U") && has("L")) return "┛";
    return has("L") || has("R") ? "━" : "┃";
  };
  const glyphs = pts.map((_, i) => glyph(i));
  const LIGHT = { "━": "─", "┃": "│", "┏": "┌", "┓": "┐", "┗": "└", "┛": "┘" };
  const ghost = glyphs.map((c) => LIGHT[c] || c);
  return (t) => {
    const c = t % P;
    let lo = 0, hi;
    if (c < DRAW) hi = Math.floor((c / DRAW) * (NP - 1));
    else if (c < DRAW + HOLD) hi = NP - 1;
    else { hi = NP - 1; lo = Math.floor(((c - DRAW - HOLD) / ERASE) * NP); }
    g.clear();
    for (let i = 0; i < NP; i++) {
      const [x, y] = pts[i];
      g.set(ox + x * 2, oy + y, ghost[i], GRIDK);
      if (i < NP - 1 && pts[i + 1][1] === y) g.set(ox + Math.min(x, pts[i + 1][0]) * 2 + 1, oy + y, "─", GRIDK);
    }
    const shift = Math.floor(t * 6);
    for (let i = lo; i <= hi && i < NP; i++) {
      const [x, y] = pts[i];
      const co = KEYS[(Math.floor(i / 32) + shift) % 32];
      g.set(ox + x * 2, oy + y, glyphs[i], co);
      if (i < hi) {
        const [a, b] = pts[i + 1];
        if (b === y) g.set(ox + Math.min(x, a) * 2 + 1, oy + y, "━", co);
      }
    }
    const hd = c < DRAW + HOLD ? hi : lo;
    if (hd < NP) { const [x, y] = pts[hd]; g.set(ox + x * 2, oy + y, glyphs[hd], HEAD); }
    return g.frame();
  };
}
