/* network-topology: routers joined by links, with packets hopping along shortest paths. */
import { Grid, palette, rng } from "../lib/kit.js";

export const meta = {
  slug: "network-topology",
  name: "Network Topology",
  category: "explainers",
  note: "A mesh of routers and links with coloured packets hopping node to node along their routes, each link glowing as traffic passes.",
  tags: ["network", "topology", "graph", "diagram", "infrastructure"],
  cols: 84, rows: 26, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#79c0ff", "#7ee787", "#ffa657", "#f778ba", "#d2a8ff", "#ffffff", "#6e7681", "#56d4dd"]),
};

const NODES = [
  ["gw", 6, 12], ["r1", 20, 4], ["r2", 22, 20], ["r3", 38, 11], ["r4", 46, 3], ["r5", 50, 21],
  ["r6", 62, 11], ["db", 77, 4], ["s1", 78, 13], ["s2", 74, 22],
];
const LINKS = [[0, 1], [0, 2], [1, 3], [2, 3], [1, 4], [3, 4], [3, 5], [2, 5], [4, 6], [3, 6], [5, 6], [6, 7], [6, 8], [5, 9], [6, 9], [4, 7]];
const COLS = "3456a7";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const adj = NODES.map(() => []);
  LINKS.forEach(([a, b], i) => { adj[a].push([b, i]); adj[b].push([a, i]); });
  const bfs = (s, d) => {
    const prev = new Array(NODES.length).fill(-1), q = [s];
    prev[s] = s;
    while (q.length) { const u = q.shift(); for (const [v] of adj[u]) if (prev[v] < 0) { prev[v] = u; q.push(v); } }
    const path = [d];
    while (path[0] !== s) path.unshift(prev[path[0]]);
    return path;
  };
  const r = rng(4);
  const ROUTES = [];
  for (let i = 0; i < 40; i++) {
    const a = r() < 0.5 ? 0 : Math.floor(r() * NODES.length);
    let b = 7 + Math.floor(r() * 3);
    if (r() < 0.3) b = Math.floor(r() * 7);
    if (a === b) b = (b + 4) % NODES.length;
    ROUTES.push([i * 0.33, bfs(a, b), COLS[i % COLS.length]]);
  }
  const HOP = 0.55, LOOP = 40 * 0.33;
  const linkOf = (a, b) => LINKS.findIndex(([x, y]) => (x === a && y === b) || (x === b && y === a));
  const lit = new Float32Array(LINKS.length);
  const litCo = new Array(LINKS.length).fill("9");
  return (t) => {
    g.clear();
    lit.fill(0);
    const lt = t % LOOP;
    const pk = [];
    for (const [ts, path, co] of ROUTES) {
      for (const off of [0, LOOP]) {
        const age = lt + off - ts;
        const dur = (path.length - 1) * HOP;
        if (age < 0 || age > dur + 0.4) continue;
        const h = Math.min(path.length - 2, Math.floor(age / HOP));
        const f = Math.min(1, (age - h * HOP) / HOP);
        const a = NODES[path[h]], b = NODES[path[h + 1]];
        if (age <= dur) {
          pk.push([a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f, co]);
          const li = linkOf(path[h], path[h + 1]);
          lit[li] = 1; litCo[li] = co;
        } else pk.push([b[1], b[2], co, true]);
      }
    }
    LINKS.forEach(([a, b], i) => {
      const A = NODES[a], B = NODES[b];
      const dx = Math.abs(B[1] - A[1]), dy = Math.abs(B[2] - A[2]) * 2;
      const ch = dy < dx * 0.35 ? "─" : dx < dy * 0.35 ? "│" : (B[1] - A[1]) * (B[2] - A[2]) > 0 ? "╲" : "╱";
      g.line(A[1], A[2], B[1], B[2], lit[i] ? "•" : ch, lit[i] ? litCo[i] : "9");
    });
    for (const [x, y, co, arrived] of pk) {
      if (arrived) continue;
      g.set(Math.round(x), Math.round(y), "●", co);
    }
    NODES.forEach(([name, x, y]) => {
      const hit = pk.some(([px, py, , arr]) => arr && px === x && py === y);
      const busy = pk.filter(([px, py]) => Math.abs(px - x) < 4 && Math.abs(py - y) < 2).length;
      const co = hit ? "8" : busy ? "3" : "1";
      g.text(x - 2, y - 1, "╭───╮", co);
      g.text(x - 2, y, "│", co); g.text(x + 2, y, "│", co);
      g.text(x - 1, y, name.padEnd(3), hit ? "8" : "0");
      g.text(x - 2, y + 1, "╰───╯", co);
    });
    g.text(1, 0, "topology", "0");
    g.text(1, 1, "10 nodes  16 links", "1");
    g.text(1, rows - 1, "packets in flight", "1");
    g.text(19, rows - 1, String(pk.filter((p) => !p[3]).length).padStart(2), "5");
    return g.frame();
  };
}
