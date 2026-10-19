/* sort-race: bubble sort and quicksort side by side on the same shuffled bars, counting comparisons and swaps. */
import { Grid, palette, rng } from "../lib/kit.js";

export const meta = {
  slug: "sort-race",
  name: "Bubble vs Quick Sort",
  category: "explainers",
  note: "Bubble sort and quicksort race on the same shuffled bars, highlighting each comparison, swap and pivot, so quicksort finishes and waits while bubble sort is still carrying large values to the end.",
  tags: ["sorting", "algorithm", "education", "diagram", "computer-science", "readme"],
  cols: 100, rows: 26, fps: 30,
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#79c0ff", "#7ee787", "#ffa657", "#ff7b72", "#d2a8ff", "#ffffff", "#56d4dd", "#f2cc60", "#6e7681", "#4d6a8a"]),
};

const N = 22, H = 18;

function bubble(a0) {
  const a = a0.slice(), ops = [];
  let cmp = 0, sw = 0;
  for (let end = N - 1; end > 0; end--) {
    let swapped = false;
    for (let i = 0; i < end; i++) {
      cmp++;
      const s = a[i] > a[i + 1];
      if (s) { [a[i], a[i + 1]] = [a[i + 1], a[i]]; sw++; swapped = true; }
      ops.push({ a: a.slice(), hi: [i, i + 1], swap: s, sorted: N - end, cmp, sw });
    }
    if (!swapped) break;
  }
  ops.push({ a: a.slice(), hi: [], swap: false, sorted: N, cmp, sw, done: true });
  return ops;
}
function quick(a0) {
  const a = a0.slice(), ops = [], fixed = new Set();
  let cmp = 0, sw = 0;
  const rec = (lo, hi) => {
    if (lo > hi) return;
    if (lo === hi) { fixed.add(lo); return; }
    const p = a[hi];
    let i = lo;
    for (let j = lo; j < hi; j++) {
      cmp++;
      const s = a[j] < p;
      if (s) { if (i !== j) { [a[i], a[j]] = [a[j], a[i]]; sw++; } i++; }
      ops.push({ a: a.slice(), hi: [j, i], pivot: hi, range: [lo, hi], swap: s && i - 1 !== j, fixed: new Set(fixed), cmp, sw });
    }
    [a[i], a[hi]] = [a[hi], a[i]]; sw++;
    fixed.add(i);
    ops.push({ a: a.slice(), hi: [i], pivot: i, range: [lo, hi], swap: true, fixed: new Set(fixed), cmp, sw });
    rec(lo, i - 1); rec(i + 1, hi);
  };
  rec(0, N - 1);
  for (let k = 0; k < N; k++) fixed.add(k);
  ops.push({ a: a.slice(), hi: [], fixed: new Set(fixed), cmp, sw, done: true });
  return ops;
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const SEEDS = [3, 17, 29];
  const RACES = SEEDS.map((sd) => {
    const r = rng(sd), a = Array.from({ length: N }, (_, i) => i + 1);
    for (let i = N - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    const b = bubble(a), q = quick(a);
    return { b, q, len: b.length };
  });
  const RATE = 26, HOLD = 2.5;
  const durs = RACES.map((R) => R.len / RATE + HOLD);
  const LOOP = durs.reduce((x, y) => x + y, 0);
  const drawPanel = (x0, title, op, kind, steps, total) => {
    const W = 48;
    g.box(x0, 1, W, rows - 2, op.done ? "heavy" : "round", op.done ? "4" : "b");
    g.text(x0 + 2, 1, " " + title + " ", "0");
    g.text(x0 + W - 14, 1, kind === "b" ? " O(n^2) " : " O(n log n) ", "1");
    const base = 2 + H;
    for (let i = 0; i < N; i++) {
      const v = op.a[i];
      const h = Math.round((v / N) * (H - 1)) + 1;
      let co = "c";
      if (kind === "b" && i >= N - op.sorted) co = "4";
      if (kind === "q") {
        if (op.fixed && op.fixed.has(i)) co = "4";
        else if (op.range && i >= op.range[0] && i <= op.range[1]) co = "3";
      }
      if (op.done) co = "4";
      if (!op.done && op.hi.includes(i)) co = op.swap ? "5" : "a";
      if (!op.done && kind === "q" && i === op.pivot) co = "7";
      const x = x0 + 2 + i * 2;
      for (let k = 0; k < h; k++) g.set(x, base - k, "█", co);
    }
    g.text(x0 + 2, rows - 4, "compares " + String(op.cmp).padStart(3), "0");
    g.text(x0 + 18, rows - 4, "swaps " + String(op.sw).padStart(3), "0");
    g.text(x0 + 2, rows - 3, op.done ? "✓ sorted in " + steps + " steps" : "step " + steps + " / " + total, op.done ? "4" : "1");
  };
  return (t) => {
    g.clear();
    let lt = t % LOOP, ri = 0;
    while (lt >= durs[ri]) { lt -= durs[ri]; ri++; }
    const R = RACES[ri];
    const step = Math.floor(lt * RATE);
    const bi = Math.min(R.b.length - 1, step), qi = Math.min(R.q.length - 1, step);
    drawPanel(1, "bubble sort", R.b[bi], "b", bi + 1, R.b.length);
    drawPanel(51, "quicksort", R.q[qi], "q", qi + 1, R.q.length);
    g.text(1, 0, "sorting race  " + N + " values, same shuffle", "0");
    g.text(48, 0, "■", "a"); g.text(50, 0, "compare", "1");
    g.text(59, 0, "■", "5"); g.text(61, 0, "swap", "1");
    g.text(67, 0, "■", "7"); g.text(69, 0, "pivot", "1");
    g.text(76, 0, "■", "4"); g.text(78, 0, "in place", "1");
    return g.frame();
  };
}
