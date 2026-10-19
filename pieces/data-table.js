/* data-table: a service table re-sorting by column while a selection bar walks the rows. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "data-table",
  name: "Data Table",
  category: "screens",
  note: "A service status table that re-sorts by a new column every few seconds while a selection bar walks the rows.",
  tags: ["table", "dashboard", "admin", "app", "data"],
  cols: 82, rows: 21, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60"]),
};

const ROWS = [
  ["api-gateway", "eu-west-1", 4821, 112, 0.02, 99.99, 0],
  ["auth", "us-east-1", 3190, 64, 0.01, 99.98, 0],
  ["billing-svc", "eu-west-1", 742, 388, 1.84, 98.72, 1],
  ["search", "ap-south-1", 2115, 241, 0.12, 99.91, 0],
  ["web-app", "us-west-2", 6033, 96, 0.04, 99.97, 0],
  ["worker", "eu-central-1", 418, 1520, 4.61, 96.30, 2],
  ["notifications", "us-east-1", 1287, 143, 0.09, 99.94, 0],
  ["media-cdn", "ap-east-1", 9402, 38, 0.00, 100.0, 0],
  ["reports", "eu-west-1", 96, 802, 0.66, 99.40, 1],
  ["ledger", "us-east-2", 1540, 177, 0.03, 99.96, 0],
];
const COLS = [["Service", 15], ["Region", 14], ["Req/s", 8], ["p95 ms", 10], ["Err %", 9], ["Uptime", 9], ["Status", 11]];
const SORTS = [[2, -1], [3, 1], [4, -1], [0, 1], [5, -1]];
const STEP = 3.2;
const ease = (v) => { v = Math.max(0, Math.min(1, v)); return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2; };
const ST = [["● healthy", "2"], ["● degraded", "4"], ["● down", "5"]];

function rank(si) {
  const [c, d] = SORTS[si];
  const idx = ROWS.map((_, i) => i).sort((a, b) => {
    const va = ROWS[a][c], vb = ROWS[b][c];
    return (typeof va === "string" ? va.localeCompare(vb) : va - vb) * d;
  });
  const r = []; idx.forEach((row, pos) => (r[row] = pos));
  return r;
}

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols;
  const RK = SORTS.map((_, i) => rank(i));
  const N = SORTS.length;
  return (t) => {
    g.clear();
    const lt = t % (N * STEP);
    const si = Math.floor(lt / STEP), f = lt % STEP;
    const prev = RK[(si + N - 1) % N], cur = RK[si];
    const e = ease(f / 0.7);
    g.box(0, 0, W, meta.rows, "round", "7");
    g.text(2, 0, " Services ", "0");
    g.text(W - 22, 0, " ● live · 10 rows ", "2");
    let x = 2;
    COLS.forEach(([name, w], ci) => {
      const on = ci === SORTS[si][0];
      g.text(x, 1, name, on ? "3" : "1");
      if (on) g.set(x + name.length + 1, 1, SORTS[si][1] < 0 ? "▼" : "▲", "3");
      x += w;
    });
    g.hline(1, W - 2, 2, "─", "7");
    const sel = Math.floor(t * 1.6) % ROWS.length;
    // selection bar rides the rank slot
    g.fill(1, 3 + sel * 1 + 0, W - 2, 1, "░", "8");
    g.set(1, 3 + sel, "▌", "3");
    ROWS.forEach((r, i) => {
      const y = Math.round(3 + prev[i] + (cur[i] - prev[i]) * e);
      const moving = prev[i] !== cur[i] && e < 1;
      const isSel = cur[i] === sel && !moving;
      let x = 2;
      const vals = [r[0], r[1], r[2].toLocaleString("en-US"), String(r[3]), r[4].toFixed(2), r[5].toFixed(2) + "%"];
      vals.forEach((v, ci) => {
        const w = COLS[ci][1];
        const s = ci >= 2 ? v.padStart(w - 2) : v;
        let c = ci === 0 ? "0" : "1";
        if (ci === 3 && r[3] > 500) c = "4";
        if (ci === 4 && r[4] > 1) c = "5";
        if (isSel) c = ci === 0 ? "3" : "0";
        if (moving) c = "6";
        for (let k = 0; k < s.length; k++) if (s[k] !== " ") g.set(x + k, y, s[k], c);
        x += w;
      });
      const [label, sc] = ST[r[6]];
      g.text(x, y, label, sc);
    });
    g.hline(1, W - 2, 14, "─", "7");
    const [sc, sd] = SORTS[si];
    g.text(2, 15, `sorted by ${COLS[sc][0].toLowerCase()} ${sd < 0 ? "descending" : "ascending"}`, "1");
    g.text(W - 30, 15, "page 1 of 3   ← prev  next →", "1");
    // summary chips
    g.text(2, 17, "Total req/s", "1"); g.text(2, 18, "35,644", "0");
    g.text(18, 17, "Avg p95", "1"); g.text(18, 18, "352 ms", "0");
    g.text(32, 17, "Incidents", "1"); g.text(32, 18, "2 open", "5");
    const spark = "▁▂▃▅▄▆▅▇▆▅▃▄▅▆▇▆▅▄▆▇█▆▅▄▃▅▆";
    const off = Math.floor(t * 4);
    for (let k = 0; k < 28; k++) g.set(48 + k, 18, spark[(k + off) % spark.length], "3");
    g.text(48, 17, "traffic, last 30 min", "1");
    return g.frame();
  };
}
