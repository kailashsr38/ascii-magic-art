/* neural-forward-pass: a small network classifying pixel shapes, activations lighting up layer by layer. */
import { Grid, palette, gradient, clamp, rng } from "../lib/kit.js";

export const meta = {
  slug: "neural-forward-pass",
  name: "Neural Net Forward Pass",
  category: "explainers",
  note: "A small neural network reading a pixel shape, with signals travelling along weighted connections, each neuron shading by its activation layer after layer, and a softmax bar chart naming the shape.",
  tags: ["neural-network", "machine-learning", "ai", "diagram", "education", "readme"],
  cols: 104, rows: 30, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#79c0ff", "#7ee787", "#ffa657", "#ff7b72", "#d2a8ff", "#ffffff", "#56d4dd", "#f2cc60", "#6e7681", "#1f2a36", "#2a3b4d", ...gradient(["#4a4f57", "#ffa657", "#fff1b8"], 6)]),
};

const SHAPES = {
  ring: ["..###..", ".#...#.", "#.....#", "#.....#", "#.....#", ".#...#.", "..###.."],
  square: ["#######", "#.....#", "#.....#", "#.....#", "#.....#", "#.....#", "#######"],
  triangle: ["...#...", "...#...", "..#.#..", "..#.#..", ".#...#.", ".#...#.", "#######"],
  cross: ["#.....#", ".#...#.", "..#.#..", "...#...", "..#.#..", ".#...#.", "#.....#"],
};
const CLASSES = ["ring", "square", "triangle", "cross"];
const ORDER = ["triangle", "ring", "cross", "square"];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const SIZES = [7, 9, 9, 4];
  const LX = [26, 44, 62, 80];
  const ys = SIZES.map((n, l) => Array.from({ length: n }, (_, i) => (l === 0 ? 7 + i * 2 : Math.round(3 + ((i + 0.5) / n) * 24))));
  const r = rng(21);
  const W = [];
  for (let l = 0; l < 3; l++) W.push(Array.from({ length: SIZES[l] }, () => Array.from({ length: SIZES[l + 1] }, () => r() * 2 - 1)));
  // activations per sample: input from row sums, hidden from weights, output forced towards the label
  const acts = ORDER.map((name) => {
    const img = SHAPES[name];
    const a0 = img.map((row) => row.split("").filter((c) => c === "#").length / 7);
    const out = [a0];
    for (let l = 0; l < 2; l++) {
      const prev = out[l];
      out.push(Array.from({ length: SIZES[l + 1] }, (_, j) => {
        let s = 0; for (let i = 0; i < prev.length; i++) s += prev[i] * W[l][i][j];
        return clamp(1 / (1 + Math.exp(-s * 2.2)));
      }));
    }
    const lab = CLASSES.indexOf(name);
    const logits = CLASSES.map((c, k) => (k === lab ? 3.2 : 0.4 * Math.sin(k * 2.1 + lab)));
    const ex = logits.map(Math.exp), sum = ex.reduce((a, b) => a + b, 0);
    out.push(ex.map((e) => e / sum));
    return out;
  });
  // precompute edge cells
  const edges = [];
  for (let l = 0; l < 3; l++) for (let i = 0; i < SIZES[l]; i++) for (let j = 0; j < SIZES[l + 1]; j++) {
    const x0 = LX[l] + 2, y0 = ys[l][i], x1 = LX[l + 1] - 2, y1 = ys[l + 1][j];
    const n = x1 - x0, cells = [];
    for (let k = 0; k <= n; k += 1) cells.push([x0 + k, Math.round(y0 + ((y1 - y0) * k) / n)]);
    edges.push({ l, i, j, w: W[l][i][j], cells });
  }
  const SHADE = " ░▒▓█";
  const PER = 5, LOOP = PER * ORDER.length;
  return (t) => {
    g.clear();
    const lt = t % LOOP;
    const si = Math.floor(lt / PER), st = lt - si * PER;
    const name = ORDER[si], A = acts[si];
    // layer progress: input lit at 0.4, transitions at 0.6..1.4, 1.4..2.2, 2.2..3.0
    const lit = (l) => st >= 0.5 + l * 0.8;
    const trans = (l) => clamp((st - 0.5 - l * 0.8) / 0.8);
    // edges
    for (const e of edges) {
      const strong = Math.abs(e.w) > 0.45;
      const src = A[e.l][e.i];
      const done = trans(e.l) >= 1 && lit(e.l);
      const on = done && strong && src > 0.25;
      const co = on ? (e.w > 0 ? "3" : "5") : strong ? "b" : "2";
      const ch = "·";
      for (let k = 0; k < e.cells.length; k += 2) { const [x, y] = e.cells[k]; if (g.get(x, y) === " ") g.set(x, y, ch, co); }
      const f = trans(e.l);
      if (f > 0 && f < 1 && strong && src > 0.2) {
        const k = Math.floor(f * (e.cells.length - 1));
        for (let q = Math.max(0, k - 3); q <= k; q++) { const [x, y] = e.cells[q]; g.set(x, y, q === k ? "●" : "•", e.w > 0 ? "3" : "5"); }
      }
    }
    // neurons
    SIZES.forEach((n, l) => {
      for (let i = 0; i < n; i++) {
        const y = ys[l][i], x = LX[l];
        const a = lit(l) ? A[l][i] : 0;
        const lvl = Math.min(5, Math.floor(a * 5.99));
        const co = !lit(l) ? "b" : l === 3 ? (A[3][i] > 0.5 ? "4" : "e") : "efghij"[lvl];
        g.text(x - 1, y, lit(l) ? "▐█▌" : "▐░▌", co);
      }
    });
    // input image
    g.text(1, 1, "input 7x7", "1");
    SHAPES[name].forEach((row, y) => {
      for (let x = 0; x < 7; x++) {
        const on = row[x] === "#";
        g.text(2 + x * 2, 7 + y * 2, on ? "██" : "··", on ? "0" : "2");
        g.text(2 + x * 2, 8 + y * 2, on ? "██" : "  ", on ? "0" : "2");
      }
      g.text(17, 7 + y * 2, "→", lit(0) ? "1" : "2");
    });
    // layer labels
    const LBL = ["row sums", "hidden 1", "hidden 2", "softmax"];
    LBL.forEach((s, l) => g.text(LX[l] - (s.length >> 1), 28, s, lit(l) ? "0" : "b"));
    g.text(LX[1] - 3, 1, "ReLU-ish", "b");
    // outputs
    const op = clamp((st - 2.9) / 0.6);
    CLASSES.forEach((c, k) => {
      const y = ys[3][k];
      const p = A[3][k] * op;
      g.text(84, y, c.padEnd(9), lit(3) ? (A[3][k] > 0.5 ? "4" : "0") : "b");
      const BW = 8, m = Math.round(p * BW);
      for (let q = 0; q < BW; q++) g.set(93 + q, y, q < m ? "█" : "░", q < m ? (A[3][k] > 0.5 ? "4" : "1") : "2");
      if (op > 0) g.text(93, y + 1, (p * 100).toFixed(0) + "%", "1");
    });
    if (st > 3.6) {
      g.text(84, 1, "prediction", "1");
      g.text(84, 2, "✓ " + name, "4");
    }
    return g.frame();
  };
}
