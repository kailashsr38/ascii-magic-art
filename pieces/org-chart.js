/* org-chart: an organisation tree drawing itself from the top down, connectors growing into boxes. */
import { Grid, palette, clamp } from "../lib/kit.js";

export const meta = {
  slug: "org-chart",
  name: "Org Chart",
  category: "explainers",
  note: "An organisation chart drawing itself from the top down, connectors growing out of each box into the teams below.",
  tags: ["org-chart", "tree", "hierarchy", "diagram", "team"],
  cols: 100, rows: 20, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#f2cc60", "#79c0ff", "#7ee787", "#d2a8ff", "#ffa657", "#6e7681", "#ffffff"]),
};

const dirOf = (a, b) => (b[0] > a[0] ? "R" : b[0] < a[0] ? "L" : b[1] > a[1] ? "D" : "U");
const CORNER = { DL: "╯", DR: "╰", LD: "╭", RD: "╮" };
function cellsOf(pts) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    let [x, y] = out[out.length - 1];
    const [tx, ty] = pts[i];
    while (x !== tx || y !== ty) { x += Math.sign(tx - x); y += Math.sign(ty - y); out.push([x, y]); }
  }
  return out;
}

const TEAMS = [
  ["Infra", "14 ppl", 0], ["Product", "22 ppl", 0], ["Data", "9 ppl", 0],
  ["Finance", "6 ppl", 1], ["Legal", "3 ppl", 1],
  ["Sales", "18 ppl", 2], ["Support", "11 ppl", 2], ["People", "5 ppl", 2],
];
const VPS = [["CTO", "R. Okafor", "4"], ["CFO", "L. Moreau", "5"], ["COO", "S. Tanaka", "6"]];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const W = 11, H = 4;
  const teamX = TEAMS.map((tm, i) => 1 + i * 12 + tm[2]);
  const tc = (i) => teamX[i] + Math.floor(W / 2);
  const vpC = VPS.map((_, v) => { const kids = TEAMS.map((t, i) => [t, i]).filter(([t]) => t[2] === v).map(([, i]) => tc(i)); return Math.round((Math.min(...kids) + Math.max(...kids)) / 2); });
  const ceoC = vpC[1];
  const Y = [0, 7, 14];
  const box = (cx, y, w, title, name, co, p) => {
    if (p <= 0) return;
    const x = cx - Math.floor(w / 2);
    g.box(x, y, w, H, "round", p < 1 ? "8" : co);
    const n = Math.floor(clamp(p * 1.5) * title.length);
    g.text(x + Math.floor((w - title.length) / 2), y + 1, title.slice(0, n), p < 1 ? "1" : "0");
    if (p > 0.6) g.text(x + Math.floor((w - name.length) / 2), y + 2, name, "1");
  };
  const conns = (px, py, kids, prog, co) => {
    const ym = py + H + 1;
    let mid = false;
    for (const cx of kids) {
      const cells = cellsOf([[px, py + H], [px, ym], [cx, ym], [cx, ym + 1]]);
      const n = Math.floor(prog * cells.length);
      for (let k = 0; k < n; k++) {
        const [x, y] = cells[k];
        const din = k ? dirOf(cells[k - 1], cells[k]) : "D";
        const dout = k < cells.length - 1 ? dirOf(cells[k], cells[k + 1]) : "D";
        g.set(x, y, din === dout ? (din === "D" ? "│" : "─") : CORNER[din + dout], co);
      }
      if (n === cells.length) g.set(cx, ym + 1, "▼", co);
      if (cx === px) mid = true;
    }
    if (prog >= 0.3 && kids.length > 1) g.set(px, ym, mid ? "┼" : "┴", co);
  };
  return (t) => {
    g.clear();
    const LOOP = 11, lt = t % LOOP;
    const at = (t0, d) => clamp((lt - t0) / d);
    box(ceoC, Y[0], 15, "CEO", "A. Lindqvist", "3", at(-0.3, 0.6));
    conns(ceoC, Y[0], vpC, at(0.7, 1.2), "8");
    VPS.forEach(([title, name, co], v) => {
      box(vpC[v], Y[1], 13, title, name, co, at(1.9 + v * 0.15, 0.6));
      const kids = TEAMS.map((tm, i) => [tm, i]).filter(([tm]) => tm[2] === v).map(([, i]) => tc(i));
      conns(vpC[v], Y[1], kids, at(2.7 + v * 0.3, 1.2), "8");
    });
    TEAMS.forEach(([title, size, v], i) => box(tc(i), Y[2], W, title, size, VPS[v][2], at(3.9 + v * 0.3 + (i % 3) * 0.12, 0.6)));
    const total = TEAMS.reduce((a, tm) => a + parseInt(tm[1]), 0) + 4;
    g.hline(0, cols - 1, rows - 2, "─", "2");
    g.text(1, rows - 1, "Kestrel Labs", "0");
    g.text(15, rows - 1, "org chart", "1");
    const shown = TEAMS.filter((tm, i) => at(3.9 + tm[2] * 0.3 + (i % 3) * 0.12, 0.6) >= 1).reduce((a, tm) => a + parseInt(tm[1]), 0) + (lt > 2.5 ? 4 : 1);
    g.text(cols - 16, rows - 1, String(shown).padStart(3) + " / " + total + " people", "1");
    return g.frame();
  };
}
