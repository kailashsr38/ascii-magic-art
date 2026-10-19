/* message-queue: producers enqueue jobs, a FIFO buffer fills during a burst, and workers drain it. */
import { Grid, palette, clamp, rng } from "../lib/kit.js";

export const meta = {
  slug: "message-queue",
  name: "Job Queue Workers",
  category: "explainers",
  note: "Three producers push jobs into a FIFO queue that swells during a traffic burst while three workers pull from the head, process each job and drain the backlog, with a live depth chart below.",
  tags: ["queue", "workers", "async", "diagram", "backend", "dashboard"],
  cols: 100, rows: 28, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#79c0ff", "#7ee787", "#ffa657", "#ff7b72", "#d2a8ff", "#ffffff", "#56d4dd", "#f2cc60", "#6e7681"]),
};

const PROD = [["orders-api", "3", 2], ["checkout", "7", 8], ["webhooks", "5", 14]];
const WORK = [["worker-1", 2], ["worker-2", 8], ["worker-3", 14]];
const KIND = ["send-receipt", "resize-image", "sync-stock", "charge-card", "notify-slack", "index-order"];

function cellsOf(pts) {
  const out = [pts[0].slice()];
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
  const LOOP = 32, MOVE = 0.45;
  const r = rng(7);
  const jobs = [];
  // arrivals: steady, then a burst from 7s to 13s, quiet tail so it drains by the end
  let id = 3100;
  for (let ts = 0.2; ts < 25; ) {
    const burst = ts > 7 && ts < 13;
    const p = Math.floor(r() * 3);
    jobs.push({ id: id++, p, tp: ts, kind: KIND[Math.floor(r() * KIND.length)], work: 1.3 + r() * 1.6 });
    ts += burst ? 0.18 + r() * 0.22 : 0.8 + r() * 0.9;
  }
  // FIFO with three workers
  const free = [0, 0, 0];
  for (const j of jobs) {
    j.te = j.tp + MOVE;
    let w = 0;
    for (let k = 1; k < 3; k++) if (free[k] < free[w]) w = k;
    j.tt = Math.max(j.te, free[w]);
    j.w = w; j.ts = j.tt + MOVE; j.td = j.ts + j.work;
    free[w] = j.td;
  }
  // depth history every 0.25 s
  const HN = Math.ceil(LOOP / 0.25);
  const depth = new Array(HN).fill(0);
  for (let i = 0; i < HN; i++) {
    const tt = i * 0.25;
    depth[i] = jobs.filter((j) => j.te <= tt && j.tt > tt).length;
  }
  const QX = 28, QW = 44, QY = 7;
  const inRoutes = PROD.map(([, , y]) => cellsOf([[16, y + 1], [21, y + 1], [21, QY + 2], [QX - 1, QY + 2]]));
  const outRoutes = WORK.map(([, y]) => cellsOf([[QX + QW, QY + 2], [76, QY + 2], [76, y + 1], [80, y + 1]]));
  const glyph = (cells, i) => {
    const a = cells[Math.max(0, i - 1)], c = cells[i], b = cells[Math.min(cells.length - 1, i + 1)];
    const h1 = a[1] === c[1] && a[0] !== c[0], h2 = b[1] === c[1] && b[0] !== c[0];
    if (i === 0 || i === cells.length - 1) return "─";
    if (h1 && h2) return "─";
    if (!h1 && !h2) return "│";
    if (h1) return b[1] > c[1] ? "┐" : "┘";
    return a[1] < c[1] ? "└" : "┌";
  };
  return (t) => {
    g.clear();
    const lt = t % LOOP;
    // routes
    const drawRoute = (cells) => cells.forEach((c, i) => g.set(c[0], c[1], glyph(cells, i), "b"));
    inRoutes.forEach(drawRoute);
    outRoutes.forEach(drawRoute);
    g.set(21, 3, "┐", "b"); g.set(21, QY + 2, "┼", "b"); g.set(21, 15, "┘", "b");
    g.set(76, 3, "┌", "b"); g.set(76, QY + 2, "┼", "b"); g.set(76, 15, "└", "b");
    // producers
    PROD.forEach(([name, co, y], i) => {
      const recent = jobs.some((j) => j.p === i && lt >= j.tp && lt - j.tp < 0.35);
      g.box(1, y, 15, 4, recent ? "heavy" : "round", co);
      g.text(3, y + 1, name, "0");
      const sent = jobs.filter((j) => j.p === i && j.tp <= lt).length;
      g.text(3, y + 2, "sent " + sent, "1");
    });
    // moving jobs
    for (const j of jobs) {
      if (lt >= j.tp && lt < j.te) {
        const R = inRoutes[j.p], k = Math.round(((lt - j.tp) / MOVE) * (R.length - 1));
        g.set(R[k][0], R[k][1], "■", PROD[j.p][1]);
      }
      if (lt >= j.tt && lt < j.ts) {
        const R = outRoutes[j.w], k = Math.round(((lt - j.tt) / MOVE) * (R.length - 1));
        g.set(R[k][0], R[k][1], "■", PROD[j.p][1]);
      }
    }
    // queue
    const waiting = jobs.filter((j) => j.te <= lt && j.tt > lt);
    const hot = waiting.length > 8;
    g.box(QX, QY, QW, 5, "heavy", hot ? "5" : "9");
    g.text(QX + 2, QY, " queue: jobs ", "0");
    g.text(QX + QW - 9, QY, " FIFO ", "1");
    const SLOTS = 13;
    for (let s = 0; s < SLOTS; s++) {
      const x = QX + QW - 4 - s * 3;
      const j = waiting[s];
      if (j) { g.text(x, QY + 1, "┌┐", PROD[j.p][1]); g.text(x, QY + 2, "██", PROD[j.p][1]); g.text(x, QY + 3, "└┘", PROD[j.p][1]); }
      else g.text(x, QY + 2, "··", "2");
    }
    if (waiting.length > SLOTS) g.text(QX + 1, QY + 2, "+" + (waiting.length - SLOTS), "5");
    g.text(QX + 2, QY + 5, "tail", "1");
    g.text(QX + QW - 6, QY + 5, "head", "1");
    g.text(QX + 16, QY + 5, ("depth " + waiting.length).padEnd(9), hot ? "5" : "0");
    // workers
    WORK.forEach(([name, y], w) => {
      const j = jobs.find((q) => q.w === w && q.ts <= lt && q.td > lt);
      g.box(81, y, 19, 4, j ? "heavy" : "round", j ? "4" : "b");
      g.text(83, y, " " + name + " ", j ? "4" : "1");
      if (j) {
        const f = clamp((lt - j.ts) / j.work);
        g.text(83, y + 1, "#" + j.id, PROD[j.p][1]);
        g.text(89, y + 1, j.kind.length > 9 ? j.kind.slice(0, 7) + ".." : j.kind, "1");
        const W = 15, n = Math.round(f * W);
        for (let k = 0; k < W; k++) g.set(83 + k, y + 2, k < n ? "█" : "░", k < n ? "4" : "2");
      } else g.text(83, y + 1, "idle", "1");
    });
    // depth chart
    const CY = 19, CH = 6, CW = 96;
    g.text(1, CY - 1, "queue depth, last 24 s", "1");
    const maxD = 14;
    const now = Math.floor(lt / 0.25);
    for (let c = 0; c < CW; c++) {
      const idx = now - (CW - 1 - c);
      const d = depth[((idx % HN) + HN) % HN];
      const hgt = (Math.min(d, maxD) / maxD) * CH;
      for (let k = 0; k < CH; k++) {
        const v = hgt - k;
        const ch = v >= 1 ? "█" : v > 0.5 ? "▄" : v > 0 ? "▁" : null;
        if (ch) g.set(2 + c, CY + CH - 1 - k, ch, d > 8 ? "5" : "9");
      }
    }
    g.hline(2, 97, CY + CH, "─", "2");
    const done = jobs.filter((j) => j.td <= lt).length;
    g.text(1, 0, "async jobs", "0");
    g.text(13, 0, "processed " + done, "4");
    g.text(30, 0, hot ? "● burst, backlog growing" : "● steady", hot ? "5" : "4");
    return g.frame();
  };
}
