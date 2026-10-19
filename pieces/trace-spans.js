/* trace-spans: a distributed trace waterfall whose nested spans grow as the request runs, then a slow failing trace with a retry. */
import { Grid, palette, clamp } from "../lib/kit.js";

export const meta = {
  slug: "trace-spans",
  name: "Trace Span Waterfall",
  category: "explainers",
  note: "A distributed tracing waterfall where nested spans for each service grow along a millisecond axis as a checkout request runs, followed by a slower trace whose payment call times out and retries.",
  tags: ["tracing", "observability", "microservices", "diagram", "dashboard", "latency"],
  cols: 104, rows: 21, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#79c0ff", "#7ee787", "#ffa657", "#ff7b72", "#d2a8ff", "#ffffff", "#56d4dd", "#f2cc60", "#6e7681"]),
};

const SVC = { gateway: "3", auth: "7", cart: "9", db: "a", pricing: "4", cache: "b", tax: "4", payments: "5", "bank-gw": "5", orders: "9" };
// depth, service, op, start, dur, error
const TRACES = [
  { id: "7f3a9c1e", route: "POST /checkout", total: 420, spans: [
    [0, "gateway", "POST /checkout", 0, 420], [1, "auth", "verify token", 6, 28], [1, "cart", "load cart", 38, 74],
    [2, "db", "SELECT cart_items", 44, 52], [1, "pricing", "compute totals", 116, 88], [2, "cache", "GET rates", 120, 6],
    [2, "tax", "calc tax", 130, 66], [1, "payments", "charge card", 210, 180], [2, "bank-gw", "POST /authorize", 222, 150],
    [1, "orders", "create order", 394, 18], [2, "db", "INSERT orders", 397, 12],
  ] },
  { id: "c41b07d2", route: "POST /checkout", total: 1640, spans: [
    [0, "gateway", "POST /checkout", 0, 1640], [1, "auth", "verify token", 8, 26], [1, "cart", "load cart", 40, 70],
    [2, "db", "SELECT cart_items", 46, 50], [1, "pricing", "compute totals", 114, 92], [2, "cache", "GET rates", 118, 5],
    [1, "payments", "charge card", 210, 1380], [2, "bank-gw", "POST /authorize", 220, 1000, true], [2, "bank-gw", "retry 1", 1236, 330],
    [1, "orders", "create order", 1600, 22], [2, "db", "INSERT orders", 1604, 14],
  ] },
];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const NX = 1, BX = 38, BWID = cols - BX - 9;
  const RUN = 4.5, HOLD = 4.5, PER = RUN + HOLD, LOOP = PER * TRACES.length;
  return (t) => {
    g.clear();
    const lt = t % LOOP;
    const ti = Math.floor(lt / PER), tt = lt - ti * PER;
    const T = TRACES[ti];
    const ph = clamp(tt / RUN) * T.total;
    const running = tt < RUN;
    const scale = BWID / T.total;
    const anyErr = T.spans.some((s) => s[5] && ph >= s[3] + s[4]);
    // header
    g.text(1, 0, "trace " + T.id, "0");
    g.text(17, 0, T.route, "1");
    g.text(34, 0, T.spans.length + " spans, " + new Set(T.spans.map((s) => s[1])).size + " services", "b");
    const dur = Math.round(ph) + " ms";
    g.text(cols - 16, 0, running ? "● " + dur : (anyErr ? "! " : "✓ ") + T.total + " ms", running ? "a" : anyErr ? "5" : "4");
    // axis
    const step = T.total > 1000 ? 400 : 100;
    g.hline(BX, BX + BWID, 2, "─", "2");
    for (let ms = 0; ms <= T.total; ms += step) {
      const x = BX + Math.round(ms * scale);
      g.set(x, 2, "┬", "b");
      g.text(Math.min(x, cols - 6), 1, ms + "ms", "1");
    }
    g.text(NX, 1, "service  operation", "1");
    // spans
    T.spans.forEach(([d, svc, op, st, du, err], i) => {
      const y = 3 + i;
      const started = ph >= st;
      const co = SVC[svc];
      const tree = d === 0 ? "" : "  ".repeat(d - 1) + (T.spans.slice(i + 1).some((s) => s[0] === d) && T.spans.slice(i + 1).find((s) => s[0] <= d)[0] === d ? "├ " : "└ ");
      g.text(NX, y, tree, "2");
      const nx = NX + tree.length;
      g.text(nx, y, svc, started ? co : "2");
      g.text(nx + svc.length + 1, y, op.slice(0, BX - 2 - nx - svc.length - 1), started ? "0" : "2");
      if (!started) return;
      const len = Math.min(ph - st, du);
      const x0 = BX + Math.round(st * scale);
      const w = Math.max(1, Math.round(len * scale));
      const doneSpan = ph >= st + du;
      for (let k = 0; k < w; k++) g.set(x0 + k, y, doneSpan ? "█" : "▓", err && doneSpan ? "6" : co);
      if (doneSpan) {
        const lab = du + "ms" + (err ? " timeout" : "");
        const lx = x0 + w + 1;
        if (lx + lab.length < cols) g.text(lx, y, lab, err ? "6" : "1");
        else g.text(x0 - lab.length - 1, y, lab, err ? "6" : "1");
      }
    });
    // playhead
    if (running) {
      const px = BX + Math.round(ph * scale);
      for (let y = 3; y < 3 + T.spans.length; y++) if (g.get(px, y) === " ") g.set(px, y, "┊", "a");
    }
    // detail panel
    const DY = 3 + T.spans.length + 1;
    g.box(0, DY, cols, rows - DY, "round", "b");
    if (running) {
      g.text(2, DY, " live ", "a");
      const open = T.spans.filter((s) => ph >= s[3] && ph < s[3] + s[4]);
      g.text(2, DY + 1, "in flight:", "1");
      let x = 13;
      open.forEach((s) => { const lab = s[1] + " " + s[2]; if (x + lab.length < cols - 2) { g.text(x, DY + 1, lab, SVC[s[1]]); x += lab.length + 3; } });
      g.text(2, DY + 2, "collected " + T.spans.filter((s) => ph >= s[3] + s[4]).length + " of " + T.spans.length + " spans", "1");
    } else {
      // cycle through spans, highlight the slowest leaf
      const leafs = T.spans.map((s, i) => [s, i]).filter(([s]) => s[0] > 0);
      const [s, i] = leafs[Math.floor((tt - RUN) / 0.9) % leafs.length];
      const y = 3 + i;
      g.set(0, y, "▶", "8");
      g.text(2, DY, " span ", "0");
      g.text(2, DY + 1, s[1] + "  " + s[2], SVC[s[1]]);
      g.text(2, DY + 2, "start +" + s[3] + "ms   duration " + s[4] + "ms   " + Math.round((s[4] / T.total) * 100) + "% of trace", "1");
      g.text(2, DY + 3, s[5] ? "status ERROR  deadline exceeded after 1000ms" : "status OK", s[5] ? "6" : "4");
      g.text(60, DY + 1, "trace_id " + T.id, "b");
      g.text(60, DY + 2, "span_id " + (0x3e9a + i * 4093).toString(16), "b");
    }
    return g.frame();
  };
}
