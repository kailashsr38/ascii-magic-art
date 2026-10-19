/* state-machine: a fetch state machine whose active state moves along labelled transitions. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "state-machine",
  name: "State Machine",
  category: "explainers",
  note: "A data fetching state machine where the active state lights up and a token runs each labelled transition, through errors and retries.",
  tags: ["state-machine", "fsm", "diagram", "frontend", "docs"],
  cols: 80, rows: 25, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#79c0ff", "#7ee787", "#ff7b72", "#ffa657", "#d2a8ff", "#ffffff", "#6e7681"]),
};

const CORNER = { RD: "╮", RU: "╯", LD: "╭", LU: "╰", DR: "╰", DL: "╯", UR: "╭", UL: "╮" };
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

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const S = {
    idle: [2, 10, 14, "idle", "1"],
    loading: [28, 10, 16, "loading", "3"],
    ready: [58, 4, 16, "ready", "4"],
    error: [58, 17, 16, "error", "5"],
    retrying: [28, 17, 16, "retrying", "6"],
  };
  const T = {
    fetch: [cellsOf([[16, 11], [27, 11]]), "FETCH", 19, 10],
    success: [cellsOf([[44, 11], [51, 11], [51, 5], [57, 5]]), "RESOLVE", 43, 8],
    fail: [cellsOf([[51, 12], [51, 15], [65, 15], [65, 16]]), "REJECT", 53, 14],
    retry: [cellsOf([[57, 18], [44, 18]]), "RETRY", 48, 17],
    again: [cellsOf([[36, 16], [36, 13]]), "after 2s", 38, 14],
    reset: [cellsOf([[66, 3], [66, 1], [9, 1], [9, 9]]), "INVALIDATE", 30, 0],
  };
  const RUN = [["fetch", "loading"], ["success", "ready"], ["reset", "idle"], ["fetch", "loading"], ["fail", "error"], ["retry", "retrying"], ["again", "loading"], ["success", "ready"], ["reset", "idle"]];
  const MOVE = 0.8, STAY = 1.1, SLOT = MOVE + STAY, LOOP = RUN.length * SLOT;
  return (t) => {
    g.clear();
    const lt = t % LOOP;
    const i = Math.floor(lt / SLOT), st = Math.max(0, lt - i * SLOT);
    const moving = st < MOVE;
    const prevState = i ? RUN[i - 1][1] : "idle";
    const state = moving ? prevState : RUN[i][1];
    const edge = moving ? RUN[i][0] : null;
    for (const [k, [cells, label, lx, ly]] of Object.entries(T)) {
      const on = k === edge;
      const co = on ? "6" : "9";
      for (let n = 0; n < cells.length; n++) {
        const [x, y] = cells[n];
        if (n === cells.length - 1) { g.set(x, y, HEAD[dirOf(cells[n - 1], cells[n])], on ? "6" : "1"); continue; }
        const din = n ? dirOf(cells[n - 1], cells[n]) : dirOf(cells[n], cells[n + 1]);
        const dout = dirOf(cells[n], cells[n + 1]);
        g.set(x, y, din === dout ? (din === "R" || din === "L" ? "─" : "│") : CORNER[din + dout], co);
      }
      g.text(lx, ly, label, on ? "8" : "1");
    }
    g.set(51, 11, "┤", edge === "success" || edge === "fail" ? "6" : "9");
    for (const [k, [x, y, w, label, co]] of Object.entries(S)) {
      const on = k === state;
      g.box(x, y, w, 3, on ? "double" : "round", on ? co : "1");
      g.text(x + Math.floor((w - label.length) / 2), y + 1, label, on ? "8" : "0");
      if (on) { g.set(x + 2, y + 1, "●", co); }
    }
    if (moving) {
      const cells = T[edge][0];
      const k = Math.min(cells.length - 1, Math.floor((st / MOVE) * cells.length));
      if (k > 0) g.set(cells[k - 1][0], cells[k - 1][1], "•", "6");
      g.set(cells[k][0], cells[k][1], "●", "8");
    }
    // context panel
    const attempts = i >= 4 && i < 8 ? (i >= 6 ? 2 : 1) : i >= 8 ? 0 : (i >= 1 && i < 3 ? 1 : 0);
    g.hline(0, cols - 1, rows - 3, "─", "2");
    g.text(1, rows - 2, "state", "1");
    g.text(7, rows - 2, state, S[state][4] === "1" ? "0" : S[state][4]);
    g.text(18, rows - 2, "event", "1");
    g.text(24, rows - 2, moving ? T[edge][1] : "-", moving ? "6" : "1");
    g.text(38, rows - 2, "attempts", "1");
    g.text(47, rows - 2, String(attempts), "0");
    g.text(52, rows - 2, "data", "1");
    g.text(57, rows - 2, state === "ready" ? "{ items: 24 }" : state === "error" ? "503 timeout" : "null", state === "ready" ? "4" : state === "error" ? "5" : "1");
    return g.frame();
  };
}
