/* architecture-map: client, CDN, load balancer, services and data stores with traffic flowing. */
import { Grid, palette, fbm } from "../lib/kit.js";

export const meta = {
  slug: "architecture-map",
  name: "Architecture Map",
  category: "explainers",
  note: "A system architecture map from clients through a CDN and load balancer to services and data stores, with requests flowing along every link.",
  tags: ["architecture", "system-design", "diagram", "cloud", "docs"],
  cols: 96, rows: 26, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#79c0ff", "#7ee787", "#ffa657", "#d2a8ff", "#56d4dd", "#f778ba", "#ffffff", "#f2cc60", "#6e7681"]),
};

const dirOf = (a, b) => (b[0] > a[0] ? "R" : b[0] < a[0] ? "L" : b[1] > a[1] ? "D" : "U");
const CORNER = { RD: "╮", RU: "╯", LD: "╭", LU: "╰", DR: "╰", DL: "╯", UR: "╭", UL: "╮" };
function cellsOf(pts) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    let [x, y] = out[out.length - 1];
    const [tx, ty] = pts[i];
    while (x !== tx || y !== ty) { x += Math.sign(tx - x); y += Math.sign(ty - y); out.push([x, y]); }
  }
  return out;
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  // name, x, y, w, sub, colour
  const N = {
    client: [1, 10, 13, "web, mobile", "3"],
    cdn: [20, 10, 11, "edge cache", "7"],
    lb: [37, 10, 15, "round robin", "5"],
    api: [58, 3, 14, "3 pods", "4"],
    auth: [58, 10, 14, "2 pods", "4"],
    search: [58, 17, 14, "2 pods", "4"],
    db: [81, 3, 14, "primary", "6"],
    cache: [81, 10, 14, "in-memory", "8"],
    index: [81, 17, 14, "full text", "a"],
  };
  const LABEL = { client: "Clients", cdn: "CDN", lb: "Load bal.", api: "api", auth: "auth", search: "search", db: "Database", cache: "Cache", index: "Index" };
  const mid = (k) => N[k][1] + 1;
  const right = (k) => N[k][0] + N[k][2];
  const left = (k) => N[k][0] - 1;
  const EDGES = [
    ["client", "cdn", cellsOf([[right("client"), 11], [left("cdn"), 11]]), "3", 2.4],
    ["cdn", "lb", cellsOf([[right("cdn"), 11], [left("lb"), 11]]), "7", 1.6],
    ["lb", "api", cellsOf([[right("lb"), 11], [54, 11], [54, 4], [left("api"), 4]]), "5", 0.9],
    ["lb", "auth", cellsOf([[right("lb"), 11], [left("auth"), 11]]), "5", 0.4],
    ["lb", "search", cellsOf([[right("lb"), 11], [54, 11], [54, 18], [left("search"), 18]]), "5", 0.3],
    ["api", "db", cellsOf([[right("api"), 4], [left("db"), 4]]), "6", 0.7],
    ["auth", "cache", cellsOf([[right("auth"), 11], [left("cache"), 11]]), "8", 0.4],
    ["search", "index", cellsOf([[right("search"), 18], [left("index"), 18]]), "a", 0.3],
  ];
  return (t) => {
    g.clear();
    // links
    for (const [, , cells] of EDGES) {
      for (let k = 0; k < cells.length; k++) {
        const [x, y] = cells[k];
        if (k === cells.length - 1) { g.set(x, y, "─", "b"); continue; }
        const din = k ? dirOf(cells[k - 1], cells[k]) : dirOf(cells[k], cells[k + 1]);
        const dout = dirOf(cells[k], cells[k + 1]);
        const prev = g.get(x, y);
        let ch = din === dout ? (din === "R" || din === "L" ? "─" : "│") : CORNER[din + dout];
        if (prev === "│" && ch === "─") ch = "┼";
        if ((prev === "─" || prev === "┼") && (ch === "╮" || ch === "╯")) ch = "┤";
        if (prev === "─" && ch === "│") ch = "┼";
        g.set(x, y, ch, "b");
      }
    }
    // packets
    EDGES.forEach(([, , cells, co, rate], e) => {
      const L = cells.length, speed = 14;
      const gap = Math.max(3, Math.round(6 / rate));
      const off = Math.floor(t * speed + e * 3.7);
      for (let k = off % gap; k < L; k += gap) {
        const burst = fbm(t * 0.7 + k * 0.05, e * 3, 2, 5);
        if (burst < 0.3) continue;
        g.set(cells[k][0], cells[k][1], "●", co);
        if (k > 0) g.set(cells[k - 1][0], cells[k - 1][1], "•", co);
      }
    });
    // nodes
    for (const [k, [x, y, w, sub, co]] of Object.entries(N)) {
      const load = fbm(t * 0.6, x * 0.3, 2, 9);
      g.box(x, y, w, 3, k === "db" || k === "cache" || k === "index" ? "double" : "round", co);
      g.text(x + 2, y + 1, LABEL[k], "0");
      const dotOn = Math.sin(t * 4 + x) > 0;
      g.set(x + w - 3, y + 1, dotOn ? "●" : "○", load > 0.62 ? "5" : "4");
      g.text(x + 1, y + 3, sub, "1");
    }
    // throughput labels
    const rps = (base, s) => (base * (0.9 + 0.2 * fbm(t * 0.5, s, 2, 1))).toFixed(1) + "k rps";
    g.text(right("api") + 1, 2, rps(1.9, 3), "1");
    g.text(right("auth") + 1, 9, rps(4.2, 4), "1");
    g.text(right("search") + 1, 16, rps(0.6, 5), "1");
    g.text(right("client") - 13, 15, "in " + rps(12.4, 1), "3");
    g.text(1, 0, "production", "0");
    g.text(12, 0, "eu-central", "1");
    g.text(cols - 34, 0, "●", "4"); g.text(cols - 32, 0, "healthy", "1");
    g.text(cols - 22, 0, "p99", "1"); g.text(cols - 18, 0, String(180 + Math.round(fbm(t * 0.4, 7, 2, 2) * 60)) + " ms", "0");
    g.hline(0, cols - 1, rows - 3, "─", "2");
    g.text(1, rows - 2, "●", "3"); g.text(3, rows - 2, "request", "1");
    g.text(13, rows - 2, "●", "6"); g.text(15, rows - 2, "query", "1");
    g.text(23, rows - 2, "●", "8"); g.text(25, rows - 2, "cache read", "1");
    g.text(38, rows - 2, "deploy v2.14.3  3 min ago", "1");
    return g.frame();
  };
}
