/* dijkstra-path: Dijkstra's algorithm settling a weighted grid graph node by node, then tracing the shortest path. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "dijkstra-path",
  name: "Dijkstra Shortest Path",
  category: "explainers",
  note: "Dijkstra's algorithm on a weighted graph, popping the closest node from the priority queue, relaxing each edge and updating distances, then lighting the shortest route from A to O.",
  tags: ["graph", "algorithm", "shortest-path", "diagram", "education", "computer-science"],
  cols: 96, rows: 27, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#79c0ff", "#7ee787", "#ffa657", "#ff7b72", "#d2a8ff", "#ffffff", "#56d4dd", "#f2cc60", "#6e7681"]),
};

const L = "ABCDEFGHIJKLMNO";
const EDGES = [
  [0, 1, 4], [1, 2, 2], [2, 3, 7], [3, 4, 3], [5, 6, 1], [6, 7, 6], [7, 8, 2], [8, 9, 5], [10, 11, 3], [11, 12, 4], [12, 13, 1], [13, 14, 2],
  [0, 5, 2], [1, 6, 5], [2, 7, 3], [3, 8, 1], [4, 9, 6], [5, 10, 7], [6, 11, 2], [7, 12, 8], [8, 13, 3], [9, 14, 1],
];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const NX = (n) => 5 + (n % 5) * 21, NY = (n) => 3 + Math.floor(n / 5) * 8;
  // run Dijkstra and record events
  const adj = Array.from({ length: 15 }, () => []);
  EDGES.forEach(([a, b, w], e) => { adj[a].push([b, w, e]); adj[b].push([a, w, e]); });
  const dist = new Array(15).fill(Infinity), prev = new Array(15).fill(-1), done = new Array(15).fill(false);
  dist[0] = 0;
  const events = [{ type: "init", dist: dist.slice(), done: done.slice(), pq: [0] }];
  while (true) {
    let u = -1;
    for (let i = 0; i < 15; i++) if (!done[i] && dist[i] < Infinity && (u < 0 || dist[i] < dist[u])) u = i;
    if (u < 0) break;
    done[u] = true;
    const pq = () => [...Array(15).keys()].filter((i) => !done[i] && dist[i] < Infinity).sort((a, b) => dist[a] - dist[b]);
    events.push({ type: "pop", u, dist: dist.slice(), done: done.slice(), pq: pq() });
    for (const [v, w, e] of adj[u]) {
      if (done[v]) continue;
      const nd = dist[u] + w, better = nd < dist[v];
      if (better) { dist[v] = nd; prev[v] = u; }
      events.push({ type: "relax", u, v, e, nd, better, dist: dist.slice(), done: done.slice(), pq: pq() });
    }
  }
  const path = [];
  for (let n = 14; n >= 0; n = prev[n]) path.unshift(n);
  const pathEdges = new Set();
  for (let i = 1; i < path.length; i++) pathEdges.add(EDGES.findIndex(([a, b]) => (a === path[i - 1] && b === path[i]) || (b === path[i - 1] && a === path[i])));
  const STEP = 0.42, RUN = events.length * STEP, TRACE = path.length * 0.35, LOOP = RUN + TRACE + 3;
  return (t) => {
    g.clear();
    const lt = t % LOOP;
    const ei = Math.min(events.length - 1, Math.floor(lt / STEP));
    const ev = events[ei];
    const tracing = lt >= RUN;
    const traced = tracing ? Math.floor((lt - RUN) / 0.35) + 1 : 0;
    const onPath = (e) => { if (!tracing) return false; const idx = [...pathEdges].indexOf(e); return idx >= 0 && idx < traced - 1; };
    // edges
    EDGES.forEach(([a, b, w], e) => {
      const active = !tracing && ev.type === "relax" && ev.e === e;
      const p = onPath(e);
      const co = p ? "5" : active ? (ev.better ? "4" : "6") : ev.done[a] && ev.done[b] ? "1" : "b";
      const horiz = NY(a) === NY(b);
      if (horiz) {
        g.hline(NX(a) + 3, NX(b) - 3, NY(a), p || active ? "━" : "─", co);
        const mx = (NX(a) + NX(b)) >> 1;
        g.text(mx, NY(a) - 1, String(w), p ? "5" : active ? "8" : "1");
      } else {
        g.vline(NX(a), NY(a) + 2, NY(b) - 2, p || active ? "┃" : "│", co);
        g.text(NX(a) + 2, (NY(a) + NY(b)) >> 1, String(w), p ? "5" : active ? "8" : "1");
      }
    });
    // nodes
    for (let n = 0; n < 15; n++) {
      const x = NX(n), y = NY(n);
      const cur = !tracing && (ev.type === "pop" || ev.type === "relax") && ev.u === n;
      const tgt = !tracing && ev.type === "relax" && ev.v === n;
      const inPath = tracing && path.indexOf(n) >= 0 && path.indexOf(n) < traced;
      const co = inPath ? "5" : cur ? "a" : tgt ? (ev.better ? "4" : "6") : ev.done[n] ? "4" : ev.dist[n] < Infinity ? "9" : "b";
      g.box(x - 2, y - 1, 5, 3, cur || inPath ? "heavy" : ev.done[n] ? "light" : "round", co);
      g.set(x, y, L[n], cur || inPath ? "8" : "0");
      const d = ev.dist[n];
      const lab = d === Infinity ? "--" : String(d);
      g.text(x + 3, y - 1, lab, d === Infinity ? "2" : ev.done[n] ? "4" : "9");
    }
    g.text(NX(0) - 4, NY(0), "▶", "3");
    // panel
    const PY = 22;
    g.hline(0, cols - 1, PY, "─", "2");
    g.text(1, PY + 1, "priority queue", "1");
    let x = 17;
    ev.pq.slice(0, 9).forEach((n, i) => {
      const s = L[n] + "(" + ev.dist[n] + ")";
      g.text(x, PY + 1, s, i === 0 ? "a" : "9");
      x += s.length + 2;
    });
    if (!ev.pq.length) g.text(17, PY + 1, "empty", "b");
    g.text(1, PY + 2, "settled", "1");
    g.text(17, PY + 2, [...Array(15).keys()].filter((n) => ev.done[n]).map((n) => L[n]).join(" "), "4");
    let msg, mc = "0";
    if (tracing) { msg = "shortest A → O = " + dist[14] + "   " + path.map((n) => L[n]).join(" → "); mc = "5"; }
    else if (ev.type === "init") msg = "start at A with distance 0, every other node unknown";
    else if (ev.type === "pop") msg = "pop " + L[ev.u] + ", its distance " + ev.dist[ev.u] + " is now final";
    else { msg = "relax " + L[ev.u] + " → " + L[ev.v] + ": " + ev.dist[ev.u] + " + " + EDGES[ev.e][2] + " = " + ev.nd + (ev.better ? "  shorter, update" : "  not shorter, keep"); mc = ev.better ? "4" : "6"; }
    g.text(1, PY + 4, msg, mc);
    g.text(1, 0, "dijkstra", "0");
    g.text(11, 0, "source A, target O, weights on edges", "1");
    return g.frame();
  };
}
