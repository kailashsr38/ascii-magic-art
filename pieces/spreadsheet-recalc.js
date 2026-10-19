/* spreadsheet-recalc: a budget sheet where cells are edited and dependent totals ripple and recalculate. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "spreadsheet-recalc",
  name: "Spreadsheet Recalc",
  category: "screens",
  note: "A budget spreadsheet where a cell is edited, its formula bar updates and the dependent totals flash as they recalculate.",
  tags: ["spreadsheet", "table", "formula", "finance", "app", "data"],
  cols: 92, rows: 24, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60", "#1f6f3a"]),
};

const ITEMS = ["Rent", "Payroll", "Software", "Marketing", "Travel", "Equipment", "Insurance", "Utilities"];
const BASE = [
  [4200, 4200, 4200], [31500, 31500, 33800], [1240, 1310, 1310], [5200, 6800, 4100],
  [900, 2400, 1150], [0, 3600, 450], [610, 610, 610], [380, 410, 455],
];
// [row, col, new value]
const EDITS = [[3, 2, 7400], [1, 2, 36200], [4, 1, 1200], [5, 0, 2200]];
const STEP = 3.2, PERIOD = EDITS.length * STEP + 1.5;
const COLX = [3, 18, 30, 42, 54, 66, 78];
const fmt = (v) => v.toLocaleString("en-US");

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    const data = BASE.map((r) => r.slice());
    let cur = null, typed = "", ei = -1, et = 0;
    EDITS.forEach((e, i) => {
      const a = 0.4 + i * STEP;
      if (lt < a) return;
      ei = i; et = lt - a;
      const commit = 1.6;
      if (et >= commit) data[e[0]][e[1]] = e[2];
      else { cur = e; typed = String(e[2]).slice(0, Math.max(0, Math.floor((et - 0.4) / 0.12) + 1)); if (et < 0.4) typed = ""; }
    });
    const lastE = ei >= 0 ? EDITS[ei] : null;
    const flash = lastE && et >= 1.6 && et < 2.6;
    const rowTot = data.map((r) => r[0] + r[1] + r[2]);
    const colTot = [0, 1, 2].map((c) => data.reduce((a, r) => a + r[c], 0));
    const grand = colTot.reduce((a, b) => a + b, 0);
    g.box(0, 0, W, H, "round", "7");
    g.text(2, 0, " Q3 budget.sheet ", "0");
    g.text(W - 18, 0, " ● autosaved ", "2");
    // formula bar
    const ref = lastE ? "BCD"[lastE[1]] + (lastE[0] + 2) : "B2";
    g.text(2, 1, ref.padEnd(5), "3"); g.text(8, 1, "│ fx", "7");
    const fv = cur ? typed : lastE ? String(data[lastE[0]][lastE[1]]) : "4200";
    g.text(13, 1, fv, "0");
    if (cur && Math.floor(lt * 4) % 2 === 0) g.set(13 + typed.length, 1, "▏", "3");
    if (flash) g.text(40, 1, `E${lastE[0] + 2} = SUM(B${lastE[0] + 2}:D${lastE[0] + 2})`, "6");
    g.hline(1, W - 2, 2, "─", "8");
    // headers
    const hdr = ["", "A", "B", "C", "D", "E", "F"];
    const lab = ["Category", "Jul", "Aug", "Sep", "Total", "Share"];
    g.text(2, 3, " ", "7");
    // text column labels sit left, number column labels right-align over their figures
    lab.forEach((s, i) => {
      const x = COLX[i + 1], end = i === 0 ? -1 : i === 5 ? x + 5 : x + 8;
      if (i === 0) { g.text(x - 1, 3, hdr[i + 1], "7"); g.text(x + 1, 3, s, "1"); }
      else { g.text(i === 5 ? x - 1 : x, 3, hdr[i + 1], "7"); g.text(end - s.length + 1, 3, s, "1"); }
    });
    g.hline(1, W - 2, 4, "─", "8");
    for (let r = 0; r < ITEMS.length; r++) {
      const y = 5 + r;
      g.text(1, y, String(r + 2).padStart(2), "7");
      g.text(COLX[1] + 1, y, ITEMS[r], "0");
      for (let c = 0; c < 3; c++) {
        const x = COLX[c + 2];
        const isCur = cur && cur[0] === r && cur[1] === c;
        const isEdited = lastE && lastE[0] === r && lastE[1] === c && flash;
        if (isCur) { g.set(x - 1, y, "[", "3"); g.set(x + 10, y, "]", "3"); g.text(x, y, typed.padStart(9), "3"); continue; }
        g.text(x, y, fmt(data[r][c]).padStart(9), isEdited ? "2" : "0");
      }
      const dep = flash && lastE[0] === r;
      g.text(COLX[5], y, fmt(rowTot[r]).padStart(9), dep ? "9" : "1");
      const share = rowTot[r] / grand;
      const bw = Math.round(share * 30);
      g.text(COLX[6], y, (share * 100).toFixed(1).padStart(5) + "%", flash ? "9" : "1");
      for (let k = 0; k < 5; k++) g.set(COLX[6] + 7 + k, y, k < bw ? "■" : "·", k < bw ? "3" : "8");
    }
    const ty = 5 + ITEMS.length;
    g.hline(1, W - 2, ty, "─", "8");
    g.text(COLX[1] + 1, ty + 1, "Total", "0");
    colTot.forEach((v, c) => g.text(COLX[c + 2], ty + 1, fmt(v).padStart(9), flash && lastE[1] === c ? "9" : "0"));
    g.text(COLX[5], ty + 1, fmt(grand).padStart(9), flash ? "9" : "2");
    g.text(COLX[1] + 1, ty + 2, "vs plan", "1");
    const plan = 150000;
    g.text(COLX[5], ty + 2, ((grand - plan >= 0 ? "+" : "") + fmt(grand - plan)).padStart(9), grand > plan ? "5" : "2");
    // monthly bars
    g.text(3, ty + 4, "Monthly spend", "1");
    colTot.forEach((v, c) => {
      const bw = Math.round((v / 60000) * 50);
      g.text(3, ty + 5 + c, ["Jul", "Aug", "Sep"][c], "7");
      for (let k = 0; k < bw; k++) g.set(8 + k, ty + 5 + c, "█", flash && lastE[1] === c ? "9" : "3");
      g.text(9 + bw, ty + 5 + c, fmt(v), "1");
    });
    // sheet tabs
    g.text(W - 34, H - 2, "[ Budget ]  Forecast  Headcount", "1");
    return g.frame();
  };
}
