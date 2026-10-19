/* api-request-inspector: a live network panel where API calls stream in with method, status, latency and a waterfall. */
import { Grid, palette, rng } from "../lib/kit.js";

export const meta = {
  slug: "api-request-inspector",
  name: "API Request Inspector",
  category: "screens",
  note: "A request inspector where API calls stream in with method, path, status and timing bars, and one is opened to show its headers.",
  tags: ["api", "network", "http", "developer", "inspector", "dashboard"],
  cols: 100, rows: 26, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60"]),
};

const REQ = [
  ["GET", "/v2/projects?limit=20", 200, 84, "1.2 KB"], ["POST", "/v2/auth/refresh", 200, 41, "312 B"],
  ["GET", "/v2/projects/7781/members", 200, 126, "4.8 KB"], ["PATCH", "/v2/tasks/90412", 204, 63, "0 B"],
  ["GET", "/v2/search?q=invoice", 200, 312, "18 KB"], ["POST", "/v2/uploads", 201, 742, "96 B"],
  ["GET", "/v2/tasks/90412/history", 404, 22, "88 B"], ["DELETE", "/v2/sessions/old", 204, 35, "0 B"],
  ["GET", "/v2/reports/weekly", 500, 1204, "141 B"], ["GET", "/v2/notifications", 200, 57, "2.1 KB"],
  ["PUT", "/v2/settings/theme", 200, 49, "220 B"], ["GET", "/v2/billing/usage", 429, 12, "64 B"],
];
const MC = { GET: "3", POST: "2", PATCH: "4", PUT: "4", DELETE: "5" };
const GAP = 0.55, PERIOD = REQ.length * GAP + 4.5;

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  const r = rng(4);
  const starts = REQ.map((_, i) => i * GAP + r() * 0.2);
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    g.box(0, 0, W, H, "round", "7");
    g.text(2, 0, " Network ", "0");
    const vis = REQ.map((q, i) => [q, i]).filter(([, i]) => starts[i] <= lt);
    const errs = vis.filter(([q]) => q[2] >= 400).length;
    g.text(W - 40, 0, ` ${vis.length} requests · ${errs} errors · ● rec `, errs ? "4" : "1");
    g.text(2, 1, "Filter: ", "1"); g.text(10, 1, "/v2/", "0"); g.text(16, 1, "All  XHR  JS  Img  Doc", "7");
    const hdr = [["Method", 2], ["Path", 10], ["Status", 40], ["Time", 48], ["Size", 56], ["Waterfall", 66]];
    hdr.forEach(([n, x]) => g.text(x, 3, n, "1"));
    g.hline(1, W - 2, 4, "─", "8");
    const openI = 8, openT = starts[openI] + (1204 / 1000) + 0.8;
    const panel = lt >= openT && lt < PERIOD - 0.3;
    const maxRows = panel ? 8 : 19;
    const first = Math.max(0, vis.length - maxRows);
    const span = 9;
    vis.slice(first).forEach(([q, i], k) => {
      const y = 5 + k;
      const [m, p, st, ms, sz] = q;
      const age = lt - starts[i];
      const pending = age < ms / 1000;
      const sel = panel && i === openI;
      if (sel) { g.fill(1, y, W - 2, 1, "░", "8"); g.set(1, y, "▌", "3"); }
      g.text(2, y, m, MC[m]);
      g.text(10, y, p, pending ? "1" : "0");
      if (pending) g.text(40, y, "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"[Math.floor(lt * 12) % 10] + " ...", "7");
      else {
        g.text(40, y, String(st), st >= 500 ? "5" : st >= 400 ? "4" : "2");
        g.text(48, y, (ms >= 1000 ? (ms / 1000).toFixed(2) + " s" : ms + " ms").padStart(7), ms > 500 ? "4" : "1");
        g.text(56, y, sz.padStart(7), "1");
      }
      // waterfall: bar placed by start time within the last `span` seconds
      const x0 = 66 + Math.round(((starts[i] - Math.max(0, lt - span)) / span) * (W - 70));
      const dur = Math.min(age, ms / 1000);
      const len = Math.max(1, Math.round((dur / span) * (W - 70)));
      for (let b = 0; b < len; b++) {
        const xx = x0 + b;
        if (xx >= 66 && xx < W - 2) g.set(xx, y, "█", st >= 500 ? "5" : st >= 400 ? "4" : b < 1 ? "1" : "3");
      }
    });
    if (panel) {
      const [m, p, st, ms] = REQ[openI];
      const py = 14;
      g.hline(1, W - 2, py, "─", "8");
      g.text(2, py, " Headers ", "0"); g.text(12, py, " Response ", "7"); g.text(23, py, " Timing ", "7");
      const L = [
        ["Request URL", "https://api.example.dev" + p, "0"], ["Method", m, MC[m]], ["Status", st + " Internal Server Error", "5"],
        ["x-request-id", "req_8f2c41d9a0", "1"], ["content-type", "application/json", "1"], ["retry-after", "-", "7"],
      ];
      L.forEach(([k, v, c], i) => { g.text(4, py + 2 + i, k.padEnd(14), "6"); g.text(19, py + 2 + i, v, c); });
      const T = [["DNS", 4], ["Connect", 18], ["TLS", 22], ["Waiting", 1120], ["Download", 40]];
      T.forEach(([k, v], i) => {
        const y = py + 2 + i;
        g.text(62, y, k.padEnd(9), "1");
        const bl = Math.max(1, Math.round((v / ms) * 16));
        for (let b = 0; b < bl; b++) g.set(72 + b, y, "▆", i === 3 ? "4" : "3");
        g.text(W - 9, y, (v + " ms").padStart(7), "1");
      });
    }
    return g.frame();
  };
}
