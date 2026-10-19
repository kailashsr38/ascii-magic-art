/* flowchart: boxes and a decision diamond, with a token travelling the arrows and a run log. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "flowchart",
  name: "Flowchart",
  category: "explainers",
  note: "An order flowchart of boxes and a decision diamond, with a token travelling the arrows, looping back on an error and logging each step.",
  tags: ["flowchart", "diagram", "process", "docs", "readme"],
  cols: 88, rows: 26, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#79c0ff", "#7ee787", "#ff7b72", "#ffa657", "#ffffff", "#d2a8ff", "#6e7681"]),
};

const CORNER = { "RD": "╮", "RU": "╯", "LD": "╭", "LU": "╰", "DR": "╰", "DL": "╯", "UR": "╭", "UL": "╮" };
const HEAD = { R: "▶", L: "◀", D: "▼", U: "▲" };
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
function drawPath(g, cells, co) {
  for (let k = 0; k < cells.length; k++) {
    const [x, y] = cells[k];
    if (k === cells.length - 1) { g.set(x, y, HEAD[dirOf(cells[k - 1], cells[k])], co); continue; }
    const din = k ? dirOf(cells[k - 1], cells[k]) : dirOf(cells[k], cells[k + 1]);
    const dout = dirOf(cells[k], cells[k + 1]);
    g.set(x, y, din === dout ? (din === "R" || din === "L" ? "─" : "│") : CORNER[din + dout], co);
  }
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const X = 18;
  const BOX = {
    start: [X - 7, 0, 15, 3, "Start", "round"],
    read: [X - 9, 5, 19, 3, "Read order", "light"],
    charge: [X - 9, 18, 19, 3, "Charge card", "light"],
    done: [X - 7, 23, 15, 3, "Done", "round"],
    error: [37, 11, 18, 3, "Show error", "light"],
  };
  const DY = 10;   // diamond top row
  const E = {
    a: cellsOf([[X, 3], [X, 4]]),
    b: cellsOf([[X, 8], [X, 9]]),
    no: cellsOf([[X + 5, DY + 2], [36, DY + 2]]),
    back: cellsOf([[46, 10], [46, 6], [28, 6]]),
    yes: cellsOf([[X, DY + 6], [X, 17]]),
    c: cellsOf([[X, 21], [X, 22]]),
  };
  // a run: invalid order first, loops back, then passes
  const STEPS = [
    ["a", "read", "read order #4821"], ["b", "dia", "validate fields"], ["no", "error", "missing postcode"],
    ["back", "read", "retry order #4821"], ["b", "dia", "validate fields"], ["yes", "charge", "charge $42.50"],
    ["c", "done", "order complete"],
  ];
  const TRAVEL = 0.9, DWELL = 0.8, SLOT = TRAVEL + DWELL;
  const LOOP = STEPS.length * SLOT + 2.2;
  return (t) => {
    g.clear();
    const lt = t % LOOP;
    const si = Math.min(STEPS.length - 1, Math.floor(lt / SLOT));
    const st = Math.max(0, lt - si * SLOT);
    const finished = lt > STEPS.length * SLOT;
    const moving = !finished && st < TRAVEL;
    const activeNode = finished ? "done" : moving ? (si ? STEPS[si - 1][1] : "start") : STEPS[si][1];
    const activeEdge = moving ? STEPS[si][0] : null;
    // edges
    for (const [k, cells] of Object.entries(E)) drawPath(g, cells, k === activeEdge ? "6" : k === "no" || k === "back" ? "9" : "1");
    g.text(X + 8, DY + 1, "no", "5");
    g.text(X + 2, DY + 6, "yes", "4");
    // boxes
    for (const [k, [x, y, w, h, label, style]] of Object.entries(BOX)) {
      const on = k === activeNode;
      const co = on ? (k === "error" ? "5" : k === "done" ? "4" : "3") : "1";
      g.box(x, y, w, h, on ? (style === "round" ? "round" : "heavy") : style, co);
      g.text(x + Math.floor((w - label.length) / 2), y + 1, label, on ? "7" : "0");
    }
    // diamond
    const on = activeNode === "dia";
    const dc = on ? "8" : "1";
    const D = [[X - 1, "╱╲"], [X - 3, "╱    ╲"], [X - 5, "╱        ╲"], [X - 5, "╲        ╱"], [X - 3, "╲    ╱"], [X - 1, "╲╱"]];
    D.forEach(([x, s], r) => { for (let i = 0; i < s.length; i++) if (s[i] !== " ") g.set(x + i, DY + r, s[i], dc); });
    g.text(X - 3, DY + 2, "valid?", on ? "7" : "0");
    // token
    if (moving) {
      const cells = E[activeEdge];
      const p = st / TRAVEL;
      const k = Math.min(cells.length - 1, Math.floor(p * cells.length));
      if (k > 0) g.set(cells[k - 1][0], cells[k - 1][1], "•", "6");
      g.set(cells[k][0], cells[k][1], "●", "7");
    }
    // run log
    const LX = 58;
    g.box(LX, 0, cols - LX, rows, "round", "2");
    g.text(LX + 2, 0, " run log ", "0");
    g.text(LX + 2, 2, "job", "1"); g.text(LX + 6, 2, "checkout-flow", "3");
    g.hline(LX + 1, cols - 2, 3, "─", "2");
    const shown = finished ? STEPS.length : si + (moving ? 0 : 1);
    for (let i = 0; i < shown; i++) {
      const y = 5 + i * 2;
      const secs = 12 + Math.round(i * SLOT * 10) / 10;
      g.text(LX + 2, y, "0:" + secs.toFixed(1).padStart(4, "0"), "1");
      const bad = STEPS[i][1] === "error";
      g.text(LX + 9, y, bad ? "✗" : "✓", bad ? "5" : "4");
      g.text(LX + 11, y, STEPS[i][2].slice(0, cols - LX - 13), i === shown - 1 ? "0" : "1");
    }
    if (finished) g.text(LX + 2, rows - 2, "passed in " + (STEPS.length * SLOT).toFixed(1) + "s", "4");
    else g.text(LX + 2, rows - 2, "running" + ".".repeat(1 + Math.floor(t * 3) % 3), "6");
    return g.frame();
  };
}
