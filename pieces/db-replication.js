/* db-replication: writes land on a primary, its write-ahead log streams to three replicas, one far away and one that drops out. */
import { Grid, palette, clamp } from "../lib/kit.js";

export const meta = {
  slug: "db-replication",
  name: "Primary Replica Sync",
  category: "explainers",
  note: "Database replication where every write is appended to the primary's log and streamed to three replicas, one cross-region with visible lag and one that loses its link and then catches up in a burst.",
  tags: ["database", "replication", "wal", "diagram", "backend", "dashboard"],
  cols: 100, rows: 30, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#79c0ff", "#7ee787", "#ffa657", "#ff7b72", "#d2a8ff", "#ffffff", "#56d4dd", "#f2cc60", "#6e7681"]),
};

const OPS = ["INSERT orders", "UPDATE stock", "INSERT events", "UPDATE users", "DELETE carts", "INSERT payments", "UPDATE orders"];
// name, zone, delay, colour, x
const REPS = [["replica-1", "same zone", 0.35, "9", 2], ["replica-2", "same zone", 0.45, "3", 35], ["replica-3", "cross-region", 1.6, "7", 68]];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const LOOP = 28, WSTOP = 24.5, OUT0 = 9, OUT1 = 14.5;
  const writes = [];
  for (let k = 0, tw = 0.4; tw < WSTOP; k++) {
    writes.push({ lsn: 0x3a40 + k * 3, op: OPS[(k * 5) % OPS.length], tw });
    tw += 0.55 + ((k * 7) % 5) * 0.08;
  }
  // arrival time of each record at each replica
  const arr = REPS.map(([, , d], r) => writes.map((w, k) => {
    let a = w.tw + d;
    if (r === 1 && a > OUT0 && a < OUT1) a = OUT1 + 0.6 + (k % 40) * 0.035;
    return a;
  }));
  const hex = (n) => "0/" + n.toString(16).toUpperCase().padStart(4, "0");
  const PX = 34, PW = 34, PY = 2;
  return (t) => {
    g.clear();
    const lt = t % LOOP;
    // app
    const recentW = writes.filter((w) => w.tw <= lt);
    const wOn = recentW.length && lt - recentW[recentW.length - 1].tw < 0.25;
    g.box(1, 4, 18, 5, wOn ? "heavy" : "round", "5");
    g.text(3, 5, "app servers", "0");
    g.text(3, 6, "writes only", "1");
    g.text(3, 7, (recentW.length * 2.1).toFixed(0) + " tx", "1");
    g.hline(19, PX - 1, 6, "─", "b");
    for (const w of writes) if (lt >= w.tw - 0.35 && lt < w.tw) g.set(Math.round(19 + ((lt - w.tw + 0.35) / 0.35) * (PX - 20)), 6, "●", "5");
    // primary
    g.box(PX, PY, PW, 10, "double", "4");
    g.text(PX + 2, PY, " primary ", "4");
    g.text(PX + 2, PY + 1, "write-ahead log", "1");
    const tail = recentW.slice(-6);
    tail.forEach((w, i) => {
      const y = PY + 2 + i;
      const fresh = lt - w.tw < 0.4;
      g.text(PX + 2, y, hex(w.lsn), fresh ? "8" : "1");
      g.text(PX + 10, y, w.op, fresh ? "4" : "0");
    });
    const head = recentW.length ? recentW[recentW.length - 1] : null;
    g.text(PX + 2, PY + 8, "lsn " + (head ? hex(head.lsn) : "0/3A3D"), "4");
    // stream lines
    const BY = 15;
    g.vline(PX + 17, PY + 10, BY - 1, "│", "b");
    g.set(PX + 17, PY + 9, "╤", "4");
    g.hline(REPS[0][4] + 15, REPS[2][4] + 15, BY, "─", "b");
    g.set(PX + 17, BY, "┴", "b");
    REPS.forEach(([, , , , x], r) => {
      g.vline(x + 15, BY + 1, 18, "│", r === 1 && lt > OUT0 && lt < OUT1 ? "6" : "b");
      g.set(x + 15, BY, r === 0 ? "┌" : r === 2 ? "┐" : "┬", "b");
    });
    if (lt > OUT0 && lt < OUT1) { g.text(REPS[1][4] + 14, 17, "╳", "6"); g.text(REPS[1][4] + 17, 17, "link down", "6"); }
    // records travelling
    REPS.forEach(([, , d, co, x], r) => {
      writes.forEach((w, k) => {
        const a = arr[r][k], s = a - Math.min(d, 0.9);
        if (lt < s || lt >= a) return;
        if (r === 1 && w.tw + d > OUT0 && lt < OUT1 + 0.6) return;
        const f = (lt - s) / (a - s);
        const sx = PX + 17, ex = x + 15;
        const L1 = BY - (PY + 10), L2 = Math.abs(ex - sx), L3 = 18 - BY;
        let dd = f * (L1 + L2 + L3), px, py;
        if (dd < L1) { px = sx; py = PY + 10 + dd; } else if (dd < L1 + L2) { px = sx + Math.sign(ex - sx) * (dd - L1); py = BY; } else { px = ex; py = BY + (dd - L1 - L2); }
        g.set(Math.round(px), Math.round(py), "■", co);
      });
    });
    // replicas
    REPS.forEach(([name, zone, d, co, x], r) => {
      let applied = -1;
      for (let k = 0; k < writes.length; k++) if (arr[r][k] <= lt) applied = k;
      const pending = recentW.length - 1 - applied;
      const oldest = writes[applied + 1];
      const lagMs = pending > 0 && oldest ? Math.round((lt - oldest.tw) * 1000) : 0;
      const down = r === 1 && lt > OUT0 && lt < OUT1;
      const catching = r === 1 && lt >= OUT1 && pending > 2;
      g.box(x, 19, 30, 8, down ? "heavy" : "round", down ? "6" : co);
      g.text(x + 2, 19, " " + name + " ", co);
      g.text(x + 2, 20, zone + ", read only", "1");
      g.text(x + 2, 21, "applied", "1");
      g.text(x + 11, 21, applied >= 0 ? hex(writes[applied].lsn) : "0/3A3D", "0");
      g.text(x + 2, 22, "lag", "1");
      const lc = down ? "6" : lagMs > 1200 ? "5" : lagMs > 400 ? "a" : "4";
      g.text(x + 11, 22, (lagMs + " ms").padEnd(9), lc);
      g.text(x + 2, 23, "behind", "1");
      g.text(x + 11, 23, String(Math.max(0, pending)) + " rec", pending > 4 ? "5" : "0");
      const st = down ? "● disconnected" : catching ? "● catching up" : "● streaming";
      g.text(x + 2, 25, st, down ? "6" : catching ? "a" : "4");
    });
    g.text(1, 0, "replication", "0");
    g.text(14, 0, "async streaming, 1 primary, 3 replicas", "1");
    g.text(1, rows - 2, "reads go to replicas, so a lagging replica can return slightly old rows", "b");
    g.text(1, rows - 1, "■ log record in flight", "1");
    return g.frame();
  };
}
