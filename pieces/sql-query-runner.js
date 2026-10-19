/* sql-query-runner: a database console where a query is typed, executed and the result grid streams in. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "sql-query-runner",
  name: "SQL Query Runner",
  category: "screens",
  note: "A database console types a SQL query with highlighting, runs it and fills a result grid with rows and timing.",
  tags: ["sql", "database", "query", "developer", "table", "terminal"],
  cols: 90, rows: 26, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60", "#a5d6ff"]),
};

const KW = new Set(["SELECT", "FROM", "JOIN", "ON", "WHERE", "GROUP", "BY", "ORDER", "DESC", "LIMIT", "AS", "AND", "COUNT", "SUM", "ROUND"]);
const QUERIES = [
  { sql: ["SELECT c.country, COUNT(*) AS orders,", "       ROUND(SUM(o.total), 2) AS revenue", "FROM orders o JOIN customers c ON c.id = o.customer_id", "WHERE o.created_at >= '2026-09-01'", "GROUP BY c.country ORDER BY revenue DESC LIMIT 8;"],
    cols: [["country", 14], ["orders", 10], ["revenue", 14]],
    rows: [["Germany", 1842, 214930.5], ["United States", 1619, 198402.1], ["France", 1104, 120877.0], ["Brazil", 987, 88412.75], ["Japan", 802, 97310.4], ["India", 774, 41208.9], ["Canada", 612, 70155.3], ["Spain", 590, 52044.6]], ms: 38 },
  { sql: ["SELECT status, COUNT(*) AS n", "FROM shipments", "WHERE carrier_id = 4 AND eta < now()", "GROUP BY status ORDER BY n DESC;"],
    cols: [["status", 16], ["n", 10]],
    rows: [["delivered", 12034], ["in_transit", 2211], ["delayed", 318], ["returned", 76], ["lost", 4]], ms: 12 },
];
const SEG = 10;

function hl(line) {
  const out = [];
  const re = /('[^']*'|\w+|[^\w']+)/g; let m;
  while ((m = re.exec(line))) {
    const w = m[0];
    let c = "0";
    if (KW.has(w.toUpperCase()) && /^[A-Z]+$/.test(w)) c = "6";
    else if (w[0] === "'") c = "a";
    else if (/^\d+$/.test(w)) c = "4";
    else if (/^[^\w]+$/.test(w)) c = "1";
    for (const ch of w) out.push([ch, c]);
  }
  return out;
}

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  const HL = QUERIES.map((q) => q.sql.map(hl));
  return (t) => {
    g.clear();
    const lt = t % (SEG * QUERIES.length);
    const qi = Math.floor(lt / SEG), f = lt % SEG;
    const q = QUERIES[qi];
    const total = q.sql.join("").length;
    const typed = Math.min(total, Math.floor(Math.max(0, f - 0.4) / 0.03));
    const runT = 0.4 + total * 0.03 + 0.4;
    const running = f >= runT && f < runT + 0.8;
    const shown = f >= runT + 0.8 ? Math.min(q.rows.length, Math.floor((f - runT - 0.8) / 0.09) + 1) : 0;
    g.box(0, 0, W, H, "round", "7");
    g.text(2, 0, " analytics @ db-replica-2 ", "0");
    g.text(W - 20, 0, " ● connected ", "2");
    // editor
    let left = typed, cy = 2, cx = 7;
    HL[qi].forEach((line, i) => {
      g.text(2, 2 + i, String(i + 1).padStart(3), "7");
      const n = Math.max(0, Math.min(line.length, left));
      for (let k = 0; k < n; k++) g.set(7 + k, 2 + i, line[k][0], line[k][1]);
      if (left > 0 && left <= line.length) { cy = 2 + i; cx = 7 + n; }
      left -= line.length;
    });
    if (typed < total && Math.floor(lt * 4) % 2 === 0) g.set(cx, cy, "▏", "3");
    const by = 8;
    g.hline(1, W - 2, by, "─", "8");
    g.text(3, by, running ? " ⠿ Running... " : " ► Run  Ctrl+Enter ", running ? "4" : typed >= total ? "2" : "1");
    if (shown) g.text(W - 34, by, ` ${q.rows.length} rows · ${q.ms} ms · read only `, "1");
    if (running) {
      const p = (f - runT) / 0.8;
      for (let k = 0; k < W - 6; k++) g.set(3 + k, by + 2, k < p * (W - 6) ? "━" : "─", k < p * (W - 6) ? "4" : "8");
      return g.frame();
    }
    if (!shown) { g.text(3, by + 2, "Results will appear here", "7"); return g.frame(); }
    // grid
    const gy = by + 2;
    let x = 3;
    const xs = [];
    g.text(x, gy, "#", "7"); x += 4;
    q.cols.forEach(([n, w]) => { xs.push(x); g.text(x, gy, n, "3"); x += w + 2; });
    g.hline(3, x, gy + 1, "─", "8");
    for (let r = 0; r < shown; r++) {
      const row = q.rows[r], y = gy + 2 + r;
      g.text(3, y, String(r + 1), "7");
      row.forEach((v, ci) => {
        const w = q.cols[ci][1];
        const s = typeof v === "number" ? (Number.isInteger(v) ? v.toLocaleString("en-US") : v.toLocaleString("en-US", { minimumFractionDigits: 2 })).padStart(w) : v;
        g.text(xs[ci], y, s, typeof v === "number" ? "4" : "0");
      });
      // inline bar for last numeric col
      const lastV = row[row.length - 1], maxV = Math.max(...q.rows.map((rr) => rr[rr.length - 1]));
      const bw = Math.round((lastV / maxV) * 20);
      for (let k = 0; k < 20; k++) g.set(x + 2 + k, y, k < bw ? "▆" : " ", "8");
      for (let k = 0; k < bw; k++) g.set(x + 2 + k, y, "▆", "3");
    }
    return g.frame();
  };
}
