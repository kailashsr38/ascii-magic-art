/* amber-ledger-spreadsheet: an amber monochrome spreadsheet where figures are typed in, totals recalculate and a bar graph is drawn. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "amber-ledger-spreadsheet",
  name: "Amber Ledger Spreadsheet",
  category: "retro",
  note: "An amber screen spreadsheet where the cell pointer moves to a figure, a new value is typed on the entry line, the totals recalculate and the sheet flips to a bar graph.",
  tags: ["retro", "spreadsheet", "amber", "finance", "data", "terminal"],
  cols: 82, rows: 25, fps: 20,
  palette: palette(["#ffc24a", "#e09a20", "#9a6410", "#4a300a", "#ffe6a8", "#2a1a06"]),
};

const ITEMS = ["Rent", "Groceries", "Heating", "Telephone", "Car", "Savings"];
const BASE = [[1950, 1950, 1950, 1950], [820, 790, 860, 910], [410, 180, 120, 395], [96, 102, 99, 110], [340, 515, 280, 300], [300, 300, 300, 600]];
const EDITS = [
  { at: 1.0, r: 1, c: 1, v: 905, s: "905" },
  { at: 5.0, r: 2, c: 3, v: 520, s: "520" },
  { at: 9.0, r: 5, c: 2, v: 450, s: "450" },
];
const GRAPH = 13.5, PERIOD = 19;
const fmt = (n) => n.toLocaleString("en-US");

export default function create() {
  const W = meta.cols, H = meta.rows;
  const g = new Grid(W, H);
  const CW = 10, X0 = 4;
  const colX = (c) => X0 + c * CW;
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    const v = BASE.map((r) => r.slice());
    let cur = { r: 0, c: 1 }, entry = "", typingEdit = null, lastCommit = -9;
    for (const e of EDITS) {
      const moveT = e.at, typeT = e.at + 1.0, commitT = typeT + e.s.length * 0.25 + 0.4;
      if (lt >= moveT) {
        const k = Math.min(1, (lt - moveT) / 0.9);
        cur = { r: Math.round(cur.r + (e.r - cur.r) * k), c: Math.round(cur.c + (e.c - cur.c) * k) };
      }
      if (lt >= typeT && lt < commitT) { typingEdit = e; entry = e.s.slice(0, Math.floor((lt - typeT) / 0.25) + 1); }
      if (lt >= commitT) { v[e.r][e.c] = e.v; lastCommit = commitT; }
    }
    const recalc = lt - lastCommit < 0.7;
    const rowT = v.map((r) => r.reduce((a, b) => a + b, 0));
    const colT = [0, 1, 2, 3].map((c) => v.reduce((a, r) => a + r[c], 0));
    const grand = rowT.reduce((a, b) => a + b, 0);
    // top lines
    const cellName = "ABCDEFG"[cur.c + 1] + (cur.r + 5);
    if (lt < GRAPH) {
      g.text(0, 0, cellName + ": (V) " + fmt(v[cur.r][cur.c]), "0");
      g.text(0, 1, typingEdit ? entry : "", "4");
      if (typingEdit && Math.floor(lt * 4) % 2 === 0) g.set(entry.length, 1, "█", "0");
    } else g.text(0, 0, "GRAPH: BAR   RANGE B5..E10", "0");
    g.text(W - 8, 0, typingEdit ? "VALUE" : recalc ? "CALC " : "READY", recalc ? "4" : "1");
    // column header
    g.fill(0, 2, W, 1, "▄", "3");
    for (let c = 0; c < 7; c++) g.text(colX(c) + 4, 2, "ABCDEFG"[c], "0");
    for (let r = 0; r < 20; r++) g.text(0, 3 + r, String(r + 1).padStart(3), "2");
    if (lt < GRAPH) {
      const put = (r, c, s, co, right = true) => g.text(colX(c) + (right ? CW - 1 - s.length : 0), 3 + r, s, co);
      put(0, 0, "HOUSEHOLD BUDGET 1987", "0", false);
      ["Q1", "Q2", "Q3", "Q4", "TOTAL"].forEach((h, i) => put(2, i + 1, h, "0"));
      for (let c = 0; c < 6; c++) put(3, c, "-".repeat(CW - 1), "3", false);
      ITEMS.forEach((name, r) => {
        put(4 + r, 0, name, "1", false);
        for (let c = 0; c < 4; c++) put(4 + r, c + 1, fmt(v[r][c]), "1");
        put(4 + r, 5, fmt(rowT[r]), recalc ? "4" : "0");
      });
      for (let c = 0; c < 6; c++) put(10, c, "=".repeat(CW - 1), "3", false);
      put(11, 0, "TOTAL", "0", false);
      for (let c = 0; c < 4; c++) put(11, c + 1, fmt(colT[c]), recalc ? "4" : "0");
      put(11, 5, fmt(grand), recalc ? "4" : "0");
      put(13, 0, "Monthly", "1", false);
      put(13, 5, fmt(Math.round(grand / 12)), recalc ? "4" : "1");
      put(14, 0, "Heat share", "1", false);
      put(14, 5, ((rowT[2] / grand) * 100).toFixed(1) + "%", recalc ? "4" : "1");
      // the cell pointer
      const px = colX(cur.c + 1), py = 3 + 4 + cur.r;
      for (let x = px; x < px + CW - 1; x++) if (g.get(x, py) === " ") g.set(x, py, "▒", "2");
      for (let x = px; x < px + CW - 1; x++) if (g.get(x, py) !== "▒") g.set(x, py, g.get(x, py), "4");
    } else {
      // bar graph of quarter totals, each item stacked as its own shade
      const k = Math.min(1, (lt - GRAPH) / 1.5);
      const SH = ["█", "▓", "▒", "░", "▓", "█"], CO = ["0", "1", "0", "1", "2", "4"];
      const maxT = Math.max(...colT);
      const base = 20;
      for (let q = 0; q < 4; q++) {
        let y = base;
        const x = 12 + q * 15;
        for (let r = 0; r < 6; r++) {
          const hgt = (v[r][q] / maxT) * 15 * k;
          const y1 = base - ((v.slice(0, r + 1).reduce((a, rr) => a + rr[q], 0)) / maxT) * 15 * k;
          for (let yy = Math.round(y1); yy < Math.round(y); yy++) g.text(x, 3 + yy - 3, SH[r].repeat(8), CO[r]);
          y = y1; void hgt;
        }
        g.text(x + 3, 21, "Q" + (q + 1), "0");
        if (k >= 1) g.text(x + 1, Math.round(y) - 1, fmt(colT[q]).padStart(6), "4");
      }
      g.hline(10, 72, 20, "─", "2");
      ITEMS.forEach((name, r) => g.text(74, 6 + r * 2, SH[r] + SH[r] + " " + name.slice(0, 4), CO[r]));
    }
    return g.frame();
  };
}
