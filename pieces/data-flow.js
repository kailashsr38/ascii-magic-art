/* data-flow: an ETL flow from three sources through a transform stage into a warehouse. */
import { Grid, palette, rng } from "../lib/kit.js";

export const meta = {
  slug: "data-flow",
  name: "ETL Data Flow",
  category: "explainers",
  note: "An ETL pipeline where raw records leave three sources, pass through clean, dedupe and join steps, and land in a warehouse as counters climb.",
  tags: ["etl", "data-pipeline", "warehouse", "diagram", "data"],
  cols: 96, rows: 24, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#ffa657", "#79c0ff", "#d2a8ff", "#7ee787", "#ff7b72", "#ffffff", "#6e7681", "#f2cc60", "#56d4dd"]),
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

const SOURCES = [["orders db", "sql, 1.2M rows", 1, "3"], ["events api", "json, 4k/s", 9, "4"], ["csv exports", "nightly files", 17, "5"]];
const STEPS = ["clean", "dedupe", "join", "enrich"];
const CYL = [
  "  ______________  ",
  " /              \\ ",
  "|\\______________/|",
  "|                |",
  "|                |",
  "|                |",
  "|                |",
  " \\______________/ ",
];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const MID = 11, TX = 38, TW = 21, WX = 74;
  const ins = SOURCES.map(([, , y]) => cellsOf([[19, y + 2], [28, y + 2], [28, MID], [TX - 1, MID]]));
  const out = cellsOf([[TX + TW, MID], [WX - 1, MID]]);
  const r = rng(8);
  const N = 90, GAP = 0.16, LOOP = N * GAP;
  const REC = [];
  for (let k = 0; k < N; k++) REC.push([k * GAP, Math.floor(r() * 3), r() < 0.12]);
  const IN = 1.1, PROC = 0.9, OUT = 0.8;
  const drawPath = (cells, co) => {
    for (let n = 0; n < cells.length; n++) {
      const [x, y] = cells[n];
      const din = n ? dirOf(cells[n - 1], cells[n]) : "R";
      const dout = n < cells.length - 1 ? dirOf(cells[n], cells[n + 1]) : "R";
      g.set(x, y, din === dout ? (din === "R" || din === "L" ? "─" : "│") : CORNER[din + dout], co);
    }
  };
  return (t) => {
    g.clear();
    const lt = t % LOOP;
    ins.forEach((c) => drawPath(c, "9"));
    drawPath(out, "9");
    g.set(28, MID, "┼", "9"); g.set(28, 3, "╮", "9"); g.set(28, 19, "╯", "9");
    g.set(TX - 1, MID, "▶", "9"); g.set(WX - 1, MID, "▶", "9");
    let loaded = 0, rejected = 0, inProc = 0;
    const procStep = Math.floor(t * 2.5) % STEPS.length;
    for (const [t0, src, drop] of REC) {
      for (const off of [0, LOOP]) {
        const age = lt + off - t0;
        if (age < 0) continue;
        if (age < IN) {
          const cells = ins[src];
          const c = cells[Math.max(0, Math.min(cells.length - 2, Math.floor((age / IN) * cells.length)))];
          g.set(c[0], c[1], "■", SOURCES[src][3]);
        } else if (age < IN + PROC) {
          inProc++;
        } else if (!drop && age < IN + PROC + OUT) {
          const c = out[Math.max(0, Math.min(out.length - 2, Math.floor(((age - IN - PROC) / OUT) * out.length)))];
          g.set(c[0], c[1], "■", "6");
        }
        if (off === 0 && age >= IN + PROC) { if (drop) rejected++; else if (age >= IN + PROC + OUT) loaded++; }
      }
    }
    // sources
    SOURCES.forEach(([name, sub, y, co]) => {
      g.box(1, y, 18, 5, "round", co);
      g.text(3, y + 1, name, "0");
      g.text(3, y + 2, sub, "1");
      const on = Math.sin(t * 3 + y) > -0.3;
      g.text(3, y + 3, on ? "● streaming" : "○ idle", on ? co : "9");
    });
    // transform stage
    g.box(TX, 4, TW, 15, "heavy", "a");
    g.text(TX + 2, 5, "transform", "8");
    g.hline(TX + 1, TX + TW - 2, 6, "─", "2");
    STEPS.forEach((s, i) => {
      const on = i === procStep;
      g.text(TX + 2, 8 + i * 2, (i + 1) + " " + s, on ? "a" : "1");
      if (on) g.text(TX + TW - 4, 8 + i * 2, "◀", "a");
    });
    const qn = Math.min(TW - 4, inProc);
    for (let k = 0; k < TW - 4; k++) g.set(TX + 2 + k, 16, k < qn ? "■" : "·", k < qn ? "3" : "2");
    g.text(TX + 2, 17, "batch " + String(inProc).padStart(2), "1");
    // warehouse cylinder
    CYL.forEach((line, i) => { for (let k = 0; k < line.length; k++) if (line[k] !== " ") g.set(WX + k, 7 + i, line[k], "b"); });
    g.text(WX + 3, 11, "warehouse", "0");
    g.text(WX + 3, 12, "fact_orders", "1");
    const fill = Math.min(1, loaded / 70);
    for (let k = 0; k < 14; k++) g.set(WX + 2 + k, 13, k < fill * 14 ? "▄" : " ", "6");
    // counters
    g.hline(0, cols - 1, rows - 2, "─", "2");
    g.text(1, rows - 1, "rows loaded", "1");
    g.text(13, rows - 1, (12408 + loaded * 37).toLocaleString("en-US"), "6");
    g.text(24, rows - 1, "rejected", "1");
    g.text(33, rows - 1, String(rejected), "7");
    g.text(40, rows - 1, "lag", "1");
    g.text(44, rows - 1, (1.2 + (inProc % 5) * 0.1).toFixed(1) + "s", "0");
    g.text(cols - 26, rows - 1, "job etl-hourly  run 2,114", "1");
    return g.frame();
  };
}
