/* binary-tree: values inserting into a binary search tree, the comparison path lighting up each time. */
import { Grid, palette, clamp } from "../lib/kit.js";

export const meta = {
  slug: "binary-tree",
  name: "Binary Search Tree",
  category: "explainers",
  note: "Values inserting into a binary search tree one by one, each comparison lighting the path down before the new node drops into place.",
  tags: ["tree", "bst", "algorithm", "data-structures", "diagram", "education"],
  cols: 80, rows: 22, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#79c0ff", "#7ee787", "#ffa657", "#d2a8ff", "#ffffff", "#6e7681", "#f2cc60"]),
};

const KEYS = [50, 25, 75, 37, 12, 87, 62, 43, 6, 68, 31, 93, 18, 56, 81];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  // positions: root centre, offsets halve per level
  const pos = new Map(), parent = new Map(), paths = [];
  const OFF = [20, 10, 5];
  const LY = [3, 8, 13, 18];
  for (const k of KEYS) {
    let x = 39, d = 0, cur = null;
    const path = [];
    let node = pos.size ? KEYS[0] : null;
    while (node !== null) {
      path.push(node);
      const [nx] = pos.get(node);
      const goLeft = k < node;
      x = nx + (goLeft ? -OFF[d] : OFF[d]);
      cur = node; d++;
      const next = [...pos.keys()].find((c) => parent.get(c) === node && (c < node) === goLeft);
      node = next === undefined ? null : next;
    }
    pos.set(k, [x, d]);
    if (cur !== null) parent.set(k, cur);
    paths.push(path);
  }
  const STEP = 0.32, DROP = 0.5;
  const dur = paths.map((p) => p.length * STEP + DROP + 0.3);
  const starts = [];
  let acc = 0;
  for (const d of dur) { starts.push(acc); acc += d; }
  const LOOP = acc + 2.5;
  const drawEdge = (a, b, co) => {
    const [ax, ad] = pos.get(a), [bx, bd] = pos.get(b);
    const y0 = LY[ad] + 1, y1 = LY[bd] - 1;
    const left = bx < ax;
    for (let x = Math.min(ax, bx) + 1; x < Math.max(ax, bx); x++) g.set(x, y0, "─", co);
    g.set(bx, y0, left ? "╭" : "╮", co);
    for (let y = y0 + 1; y <= y1; y++) g.set(bx, y, "│", co);
    const j = g.get(ax, y0);
    g.set(ax, y0, (left && j === "╰") || (!left && j === "╯") || j === "┴" ? "┴" : left ? "╯" : "╰", co);
  };
  const drawNode = (k, co, txtCo, style) => {
    const [x, d] = pos.get(k);
    const s = String(k).padStart(2);
    g.text(x - 2, LY[d], style === "hot" ? "[" + s + "]" : "(" + s + ")", co);
    g.text(x - 1, LY[d], s, txtCo);
  };
  return (t) => {
    g.clear();
    const lt = (t + starts[4]) % LOOP;
    let i = 0;
    while (i < KEYS.length - 1 && lt >= starts[i + 1]) i++;
    const allDone = lt >= acc;
    const local = Math.max(0, lt - starts[i]);
    const path = paths[i];
    const visit = allDone ? path.length : Math.min(path.length, Math.floor(local / STEP) + 1);
    const placed = allDone || local >= path.length * STEP + DROP;
    // edges of the tree so far
    for (let j = 1; j <= i; j++) {
      if (j === i && !placed) continue;
      const k = KEYS[j];
      const onPath = !allDone && j === i;
      drawEdge(parent.get(k), k, onPath ? "5" : "8");
    }
    // path edges light up as comparisons happen
    if (!allDone) for (let s = 1; s < visit; s++) drawEdge(path[s - 1], path[s], "5");
    for (let j = 0; j < (placed ? i + 1 : i); j++) {
      const k = KEYS[j];
      const hot = !allDone && path.slice(0, visit).includes(k);
      const isNew = !allDone && j === i;
      drawNode(k, isNew ? "4" : hot ? "5" : "1", isNew ? "7" : hot ? "7" : "0", hot ? "hot" : "");
    }
    // the incoming value
    const k = KEYS[i];
    if (!allDone && !placed) {
      const atNode = path.length ? path[Math.min(visit, path.length) - 1] : null;
      let x = 39, y = 0;
      if (atNode !== null) { const [nx, nd] = pos.get(atNode); x = nx + (k < atNode ? -4 : 4); y = LY[nd] - 1; }
      if (local >= path.length * STEP) {
        const [tx, td] = pos.get(k);
        const u = clamp((local - path.length * STEP) / DROP);
        x = Math.round(x + (tx - x) * u); y = Math.round(y + (LY[td] - y) * u);
      }
      g.text(x - 2, Math.max(0, y), "[" + String(k).padStart(2) + "]", "4");
      if (atNode !== null && local < path.length * STEP) {
        const [nx, nd] = pos.get(atNode);
        g.text(nx + (k < atNode ? -9 : 4), LY[nd] + 1, k < atNode ? k + " < " + atNode : k + " > " + atNode, "9");
      }
    }
    g.text(0, 0, "insert", "1");
    g.text(7, 0, allDone ? "done" : String(k), allDone ? "4" : "4");
    g.text(0, 1, "size " + (placed ? i + 1 : i) + "  height " + (Math.max(...KEYS.slice(0, placed ? i + 1 : Math.max(1, i)).map((q) => pos.get(q)[1])) + 1), "1");
    g.text(cols - 26, 0, "in-order", "1");
    const ins = KEYS.slice(0, placed ? i + 1 : i).sort((a, b) => a - b);
    const io = ins.join(" ");
    g.text(Math.max(0, cols - io.length - 1), 1, io, "3");
    return g.frame();
  };
}
