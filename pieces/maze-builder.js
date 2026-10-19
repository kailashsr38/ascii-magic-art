/* maze-builder: a maze carved by a depth-first walker, flooded from the entrance and solved, then rebuilt. */
import { Grid, palette, gradient, KEYS, rng } from "../lib/kit.js";

const WALL = gradient(["#2a3a6a", "#4a3a8a", "#6a3a8a"], 6);           // 0-5
const FLOOD = gradient(["#0e4a5a", "#147a7a", "#1aa88a", "#2ad0a0"], 8); // 6-d
const pal = palette([...WALL, ...FLOOD, "#161a2e", "#7dff8a", "#2a8a4a", "#ffd23f", "#ff8a3a", "#0a0c18"]);
// e unexplored, f head, g stack, h path, i path head, j floor

export const meta = {
  slug: "maze-builder",
  name: "Maze Builder",
  category: "algorithms",
  note: "A maze carved cell by cell by a backtracking walker, flooded from the entrance, solved, then carved anew.",
  tags: ["maze", "algorithm", "pathfinding", "loader", "terminal"],
  cols: 82, rows: 35, fps: 30,
  palette: pal,
};

const MW = 20, MH = 17;
const CARVE = 10, FLOODT = 3, PATHT = 1.6, HOLD = 2;
const P = CARVE + FLOODT + PATHT + HOLD;

function build(seed) {
  const r = rng(seed);
  const GW = MW * 2 + 1, GH = MH * 2 + 1;
  const at = new Float32Array(GW * GH).fill(Infinity); // step at which each grid cell opens
  const parent = new Int32Array(MW * MH).fill(-1);
  const seen = new Uint8Array(MW * MH);
  const heads = [];
  const stack = [0];
  seen[0] = 1;
  at[1 + 1 * GW] = 0;
  heads.push(0);
  while (stack.length) {
    const c = stack[stack.length - 1];
    const cx = c % MW, cy = (c / MW) | 0;
    const nb = [];
    if (cx > 0 && !seen[c - 1]) nb.push(c - 1);
    if (cx < MW - 1 && !seen[c + 1]) nb.push(c + 1);
    if (cy > 0 && !seen[c - MW]) nb.push(c - MW);
    if (cy < MH - 1 && !seen[c + MW]) nb.push(c + MW);
    if (nb.length) {
      const n = nb[Math.floor(r() * nb.length)];
      seen[n] = 1; parent[n] = c; stack.push(n);
      const nx = n % MW, ny = (n / MW) | 0, s = heads.length;
      at[(cx + nx + 1) + (cy + ny + 1) * GW] = s;
      at[(nx * 2 + 1) + (ny * 2 + 1) * GW] = s;
      heads.push(n);
    } else { stack.pop(); if (stack.length) heads.push(stack[stack.length - 1]); }
  }
  // breadth-first flood from the entrance
  const dist = new Int32Array(MW * MH).fill(-1);
  const q = [0]; dist[0] = 0;
  const open = (a, b) => { const ax = a % MW, ay = (a / MW) | 0, bx = b % MW, by = (b / MW) | 0; return at[(ax + bx + 1) + (ay + by + 1) * GW] < Infinity; };
  for (let qi = 0; qi < q.length; qi++) {
    const c = q[qi], cx = c % MW, cy = (c / MW) | 0;
    for (const n of [cx > 0 ? c - 1 : -1, cx < MW - 1 ? c + 1 : -1, cy > 0 ? c - MW : -1, cy < MH - 1 ? c + MW : -1])
      if (n >= 0 && dist[n] < 0 && open(c, n)) { dist[n] = dist[c] + 1; q.push(n); }
  }
  const path = [];
  for (let c = MW * MH - 1; c !== -1; c = parent[c]) path.push(c);
  path.reverse();
  return { at, parent, heads, dist, maxDist: Math.max(...dist), path, GW, GH };
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  let cache = { k: -1, m: null };
  return (t) => {
    const k = Math.floor(t / P), c = t - k * P;
    if (cache.k !== k) cache = { k, m: build(k * 31 + 7) };
    const m = cache.m, GW = m.GW;
    const step = c < CARVE ? Math.floor((c / CARVE) * (m.heads.length - 1)) : m.heads.length - 1;
    const head = m.heads[step];
    const stackSet = new Set();
    if (c < CARVE) for (let h = head; h !== -1; h = m.parent[h]) stackSet.add(h);
    const fl = c < CARVE ? -1 : c < CARVE + FLOODT ? ((c - CARVE) / FLOODT) * m.maxDist : m.maxDist;
    const pathN = c < CARVE + FLOODT ? 0 : Math.ceil(Math.min(1, (c - CARVE - FLOODT) / PATHT) * m.path.length);
    const onPath = new Map();
    for (let i = 0; i < pathN; i++) onPath.set(m.path[i], i);
    for (let gy = 0; gy < rows; gy++) for (let gx = 0; gx < GW; gx++) {
      const s = m.at[gx + gy * GW];
      let ch = "█", co = KEYS[Math.min(5, Math.floor(((gx + gy * 0.6) / (GW + rows * 0.6)) * 6))];
      const isCell = gx % 2 === 1 && gy % 2 === 1;
      if (s <= step) {
        ch = " "; co = "j";
        // the maze cells this grid cell joins (one for a cell, two for a passage)
        const ax = (gx - 1) >> 1, ay = (gy - 1) >> 1;
        const a = ax + ay * MW;
        const b = gx % 2 === 0 ? a + 1 : gy % 2 === 0 ? a + MW : a;
        const cell = b;
        if (stackSet.has(a) && stackSet.has(b)) { ch = "▓"; co = "g"; }
        const dd = Math.max(m.dist[a], m.dist[b]);
        if (fl >= 0 && dd >= 0 && dd <= fl) { ch = "▒"; co = KEYS[6 + Math.min(7, Math.floor((dd / m.maxDist) * 8))]; }
        if (onPath.has(a) && onPath.has(b) && Math.abs(onPath.get(a) - onPath.get(b)) <= 1) {
          ch = "█"; co = Math.max(onPath.get(a), onPath.get(b)) === pathN - 1 && pathN < m.path.length ? "i" : "h";
        }
        if (isCell && cell === head && c < CARVE) { ch = "█"; co = "f"; }
      } else if (isCell) { ch = "▒"; co = "e"; }
      g.set(gx * 2, gy, ch, co); g.set(gx * 2 + 1, gy, ch, co);
    }
    // entrance and exit gaps
    g.set(0, 1, " ", "j"); g.set(1, 1, " ", "j");
    g.set(cols - 2, rows - 2, " ", "j"); g.set(cols - 1, rows - 2, " ", "j");
    return g.frame();
  };
}
