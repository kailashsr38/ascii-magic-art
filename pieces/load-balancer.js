/* load-balancer: requests arriving and being spread across four servers, with live counters. */
import { Grid, palette, rng } from "../lib/kit.js";

export const meta = {
  slug: "load-balancer",
  name: "Load Balancer",
  category: "explainers",
  note: "Requests streaming into a load balancer and fanning out across four servers, each with its own request counter and connection bar.",
  tags: ["load-balancer", "servers", "devops", "diagram", "infrastructure"],
  cols: 90, rows: 25, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#79c0ff", "#7ee787", "#ffa657", "#d2a8ff", "#ffffff", "#6e7681", "#f2cc60", "#ff7b72"]),
};

const CORNER = { RD: "╮", RU: "╯", LD: "╭", LU: "╰", DR: "╰", DL: "╯", UR: "╭", UL: "╮" };
const dirOf = (a, b) => (b[0] > a[0] ? "R" : b[0] < a[0] ? "L" : b[1] > a[1] ? "D" : "U");
function cellsOf(pts) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    let [x, y] = out[out.length - 1];
    const [tx, ty] = pts[i];
    while (x !== tx || y !== ty) { x += Math.sign(tx - x); y += Math.sign(ty - y); out.push([x, y]); }
  }
  return out;
}

const SERVERS = [["web-1", 1], ["web-2", 7], ["web-3", 13], ["web-4", 19]];
const TYPES = [["GET", "4"], ["GET", "4"], ["POST", "3"], ["GET", "4"], ["PUT", "6"], ["GET", "4"], ["DEL", "a"]];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const LBY = 12, SX = 64;
  const inbound = cellsOf([[0, LBY], [21, LBY]]);
  const outs = SERVERS.map(([, y]) => cellsOf([[36, LBY], [46, LBY], [46, y + 2], [SX - 1, y + 2]]));
  const r = rng(12);
  const N = 120, GAP = 0.18, LOOP = N * GAP;
  const REQ = [];
  const busy = [0, 0, 0, 0];
  for (let k = 0; k < N; k++) {
    const t0 = k * GAP + (r() - 0.5) * 0.08;
    const ty = TYPES[Math.floor(r() * TYPES.length)];
    // least connections, ties round robin
    let best = k % 4;
    for (let s = 0; s < 4; s++) if (busy[s] < busy[best]) best = s;
    busy[best] += 1 + r() * 0.8;
    for (let s = 0; s < 4; s++) busy[s] = Math.max(0, busy[s] - 0.25);
    REQ.push([t0, best, ty]);
  }
  const IN = 0.7, OUT = 0.8, WORK = 0.9;
  return (t) => {
    g.clear();
    const lt = t % LOOP;
    // wires
    for (let x = 0; x <= 21; x++) g.set(x, LBY, "─", "8");
    outs.forEach((cells) => {
      for (let n = 0; n < cells.length; n++) {
        const [x, y] = cells[n];
        const din = n ? dirOf(cells[n - 1], cells[n]) : "R";
        const dout = n < cells.length - 1 ? dirOf(cells[n], cells[n + 1]) : "R";
        g.set(x, y, din === dout ? (din === "R" || din === "L" ? "─" : "│") : CORNER[din + dout], "8");
      }
    });
    g.set(46, LBY, "┼", "8");
    g.set(46, 9, "├", "8"); g.set(46, 15, "├", "8");
    const served = [0, 0, 0, 0], active = [0, 0, 0, 0];
    for (const [t0, s, [ty, co]] of REQ) {
      for (const off of [0, -LOOP]) {
        const age = lt - t0 - off;
        if (age < 0) continue;
        if (age < IN) {
          const c = inbound[Math.max(0, Math.min(inbound.length - 1, Math.floor((age / IN) * inbound.length)))];
          g.set(c[0], c[1], "●", co);
        } else if (age < IN + OUT) {
          const cells = outs[s];
          const c = cells[Math.max(0, Math.min(cells.length - 1, Math.floor(((age - IN) / OUT) * cells.length)))];
          g.set(c[0], c[1], "●", co);
        } else if (age < IN + OUT + WORK) active[s]++;
        if (off === 0 && age >= IN + OUT) served[s]++;
      }
    }
    // load balancer box
    g.box(22, LBY - 3, 14, 7, "double", "9");
    g.text(25, LBY - 2, "balancer", "0");
    g.text(24, LBY, "least conn", "1");
    const rps = Math.round(100 / GAP);
    g.text(25, LBY + 2, rps + " req/s", "9");
    g.text(1, LBY - 2, "incoming", "1");
    g.text(1, LBY - 1, "requests", "1");
    // servers
    SERVERS.forEach(([name, y], s) => {
      const hot = active[s] >= 3;
      g.box(SX, y, cols - SX - 1, 5, "round", hot ? "5" : "4");
      g.text(SX + 2, y + 1, name, "0");
      g.set(SX + 9, y + 1, "●", hot ? "5" : "4");
      g.text(SX + 2, y + 2, "served", "1");
      g.text(SX + 9, y + 2, String(1000 * (s + 2) + served[s]).padStart(6), "7");
      g.text(SX + 2, y + 3, "conns", "1");
      const bw = 8;
      for (let k = 0; k < bw; k++) g.set(SX + 9 + k, y + 3, k < active[s] * 2 ? "■" : "□", k < active[s] * 2 ? (hot ? "5" : "4") : "2");
    });
    // legend
    g.text(1, rows - 1, "●", "4"); g.text(3, rows - 1, "GET", "1");
    g.text(8, rows - 1, "●", "3"); g.text(10, rows - 1, "POST", "1");
    g.text(16, rows - 1, "●", "6"); g.text(18, rows - 1, "PUT", "1");
    g.text(23, rows - 1, "●", "a"); g.text(25, rows - 1, "DELETE", "1");
    const tot = served.reduce((a, b) => a + b, 0);
    g.text(cols - 22, rows - 1, "total " + String(14000 + tot).padStart(6), "1");
    return g.frame();
  };
}
