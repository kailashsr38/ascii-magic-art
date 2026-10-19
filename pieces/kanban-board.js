/* kanban-board: three columns of task cards with cards lifting and moving across. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "kanban-board",
  name: "Kanban Board",
  category: "screens",
  note: "A three column task board where cards lift, travel across and settle into place.",
  tags: ["kanban", "board", "tasks", "app", "project"],
  cols: 86, rows: 29, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60"]),
};

const CARDS = {
  A: ["Rate limit public API", "backend", "4", "KS"],
  B: ["Empty state for search", "design", "6", "LP"],
  C: ["Fix flaky login test", "bug", "5", "OH"],
  D: ["Invoice PDF export", "billing", "9", "MC"],
  E: ["Upgrade database to 16", "infra", "3", "AR"],
  F: ["Onboarding checklist", "growth", "2", "DP"],
};
const INIT = [["A", "B", "C"], ["D", "F"], ["E"]];
// every move picks the top card of its column, so the lift never crosses another card
const MOVES = [["D", 2], ["A", 1], ["A", 2], ["B", 1], ["B", 2], ["C", 1]];
const COLS = [["To do", "1"], ["In progress", "3"], ["Done", "2"]];
const MT = 1.0, REST = 0.8, LEAD = 1.0, HOLD = 1.6;
const ease = (v) => { v = Math.max(0, Math.min(1, v)); return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2; };

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  const CWID = 28, CX = (c) => 1 + c * CWID, CY0 = 7, CHt = 4, LANE = 2;
  const PERIOD = LEAD + MOVES.length * (MT + REST) + HOLD;
  const card = (id, x, y, lifted) => {
    const [title, tag, c, who] = CARDS[id];
    g.fill(x, y, CWID - 2, CHt, " ");
    g.box(x, y, CWID - 2, CHt, lifted ? "heavy" : "round", lifted ? "3" : "7");
    g.text(x + 2, y + 1, title, "0");
    g.text(x + 2, y + 2, "● " + tag, c);
    g.text(x + CWID - 7, y + 2, who, "1");
    if (lifted) for (let k = 1; k < CWID - 1; k++) g.set(x + k, y + CHt, "▀", "8");
  };
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    const cols = INIT.map((c) => c.slice());
    let moving = null;
    for (let i = 0; i < MOVES.length; i++) {
      const t0 = LEAD + i * (MT + REST);
      if (lt < t0) break;
      const [id, to] = MOVES[i];
      const from = cols.findIndex((c) => c.includes(id));
      const fromIdx = cols[from].indexOf(id);
      cols[from].splice(fromIdx, 1);
      cols[to].unshift(id);
      if (lt < t0 + MT) moving = { id, from, fromIdx, to, p: ease((lt - t0) / MT) };
    }
    g.box(0, 0, W, H, "round", "7");
    g.text(2, 1, "Sprint 42", "0"); g.text(12, 1, "· Oct 13 to Oct 24", "1");
    g.text(W - 24, 1, "KS LP OH MC AR +3", "6");
    COLS.forEach(([name, c], ci) => {
      const x = CX(ci);
      g.text(x + 1, 2, "●", c); g.text(x + 3, 2, name, "0");
      g.text(x + 4 + name.length, 2, String(cols[ci].length), "1");
      g.hline(x + 1, x + CWID - 2, 3, "─", ci === 1 ? "3" : "8");
      if (ci) g.vline(x - 1, 2, H - 2, "│", "8");
      cols[ci].forEach((id, j) => {
        if (moving && id === moving.id) return;
        let slot = j;
        // the card lifts out, travels in the lane over the headers, then drops in:
        // the source gap closes and the target gap opens while it is in the lane
        const mid = moving ? ease((moving.p - 0.3) / 0.4) : 0;
        if (moving && ci === moving.to) slot = j - 1 + mid;
        if (moving && ci === moving.from && j >= moving.fromIdx) slot = j + 1 - mid;
        const y = Math.round(CY0 + slot * (CHt + 1));
        if (y + CHt <= H - 1) card(id, x, y, false);
      });
      g.text(x + 2, H - 2, "+ Add card", "7");
    });
    if (moving) {
      const { id, from, fromIdx, to, p } = moving;
      const y0 = CY0 + fromIdx * (CHt + 1), y1 = CY0;
      const x = Math.round(CX(from) + (CX(to) - CX(from)) * ease((p - 0.3) / 0.4));
      const y = Math.round(p < 0.3 ? y0 + (LANE - y0) * ease(p / 0.3) : p < 0.7 ? LANE : LANE + (y1 - LANE) * ease((p - 0.7) / 0.3));
      card(id, x, y, true);
    }
    return g.frame();
  };
}
