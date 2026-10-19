/* split-pane-session: a terminal multiplexer with three busy panes and a status bar. */
import { Grid, palette, rng } from "../lib/kit.js";

export const meta = {
  slug: "split-pane-session",
  name: "Split Pane Multiplexer",
  category: "screens",
  note: "A terminal multiplexer split into a streaming server log, a live resource meter and a test watcher, with focus hopping between panes.",
  tags: ["tmux", "terminal", "developer", "logs", "dashboard", "hero"],
  cols: 104, rows: 32, fps: 20,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60", "#56d4dd"]),
};

const ROUTES = ["GET /api/orders", "GET /api/orders/8812", "POST /api/cart", "GET /healthz", "GET /api/search?q=lamp", "PUT /api/users/41", "GET /static/app.js", "DELETE /api/cart/3"];
const TESTS = ["cart adds item", "cart merges duplicates", "checkout totals tax", "search ranks exact", "orders paginate", "users update email", "auth refresh token", "webhooks retry 3x"];

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  const LW = 60, TH = 18;
  const logLine = (n) => {
    const r = rng(n * 131 + 7);
    const route = ROUTES[Math.floor(r() * ROUTES.length)];
    const s = r() < 0.06 ? 500 : r() < 0.12 ? 404 : route.startsWith("POST") ? 201 : 200;
    const ms = Math.floor(2 + Math.pow(r(), 3) * 400);
    return [route, s, ms];
  };
  return (t) => {
    g.clear();
    const focus = Math.floor(t / 4) % 3;
    const bc = (i) => (i === focus ? "2" : "8");
    // pane borders
    g.box(0, 0, LW, TH, "light", bc(0));
    g.box(LW, 0, W - LW, TH, "light", bc(1));
    g.box(0, TH, W, H - TH - 1, "light", bc(2));
    g.text(2, 0, " 0: server ", bc(0) === "2" ? "2" : "1");
    g.text(LW + 2, 0, " 1: meter ", bc(1) === "2" ? "2" : "1");
    g.text(2, TH, " 2: tests --watch ", bc(2) === "2" ? "2" : "1");
    // pane 0: log stream
    const N = Math.floor(t * 6);
    for (let i = 0; i < TH - 2; i++) {
      const n = N - (TH - 3) + i;
      const [route, s, ms] = logLine(n);
      const y = 1 + i;
      const sec = 41 * 60 + Math.floor(n / 6);
      g.text(2, y, `09:${String(Math.floor(sec / 60) % 60).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`, "7");
      g.text(11, y, String(s), s >= 500 ? "5" : s >= 400 ? "9" : "2");
      const [m, p] = route.split(" ");
      g.text(15, y, m.padEnd(6), "6"); g.text(22, y, p.slice(0, 24), "0");
      g.text(47, y, (ms + "ms").padStart(6), ms > 200 ? "4" : "1");
    }
    // pane 1: meters
    const MX = LW + 2;
    const r1 = (k) => 0.5 + 0.45 * Math.sin(t * (0.7 + k * 0.23) + k * 2.1) * Math.sin(t * 0.31 + k);
    for (let c = 0; c < 4; c++) {
      const v = Math.max(0.05, r1(c));
      const y = 2 + c;
      g.text(MX, y, `cpu${c}`, "a");
      const bw = 26, n = Math.round(v * bw);
      g.text(MX + 5, y, "█".repeat(n), v > 0.8 ? "5" : v > 0.5 ? "9" : "2"); g.text(MX + 5 + n, y, "░".repeat(bw - n), "8");
      g.text(MX + 33, y, String(Math.round(v * 100)).padStart(3) + "%", "1");
    }
    g.text(MX, 7, "mem ", "a"); g.text(MX + 5, 7, "█".repeat(17), "3"); g.text(MX + 22, 7, "░".repeat(9), "8"); g.text(MX + 33, 7, "  66%", "1");
    g.text(MX, 9, "rps", "1");
    // sparkline of request rate
    const SP = "▁▂▃▄▅▆▇█";
    for (let i = 0; i < 38; i++) {
      const v = 0.5 + 0.35 * Math.sin((t * 4 + i) * 0.35) + 0.15 * Math.sin((t * 4 + i) * 1.3);
      g.set(MX + i, 10, SP[Math.max(0, Math.min(7, Math.floor(v * 8)))], "3");
    }
    g.text(MX, 12, "p50", "1"); g.text(MX + 5, 12, `${(14 + Math.sin(t) * 3).toFixed(0)}ms`, "0");
    g.text(MX + 14, 12, "p99", "1"); g.text(MX + 19, 12, `${(210 + Math.sin(t * 0.6) * 60).toFixed(0)}ms`, "4");
    g.text(MX, 13, "err", "1"); g.text(MX + 5, 13, `${(0.6 + Math.abs(Math.sin(t * 0.4))).toFixed(1)}%`, "5");
    g.text(MX + 14, 13, "conn", "1"); g.text(MX + 19, 13, String(180 + Math.floor(Math.sin(t * 0.8) * 40)), "0");
    g.text(MX, 15, "uptime 12d 04:18", "7");
    // pane 2: test watcher cycling
    const cyc = 6, k = t % cyc, run = Math.floor(t / cyc);
    const done = Math.min(TESTS.length, Math.floor(k / 0.4));
    g.text(2, TH + 1, k < 0.6 ? "change detected: src/cart.ts, re-running 8 tests" : `run #${run + 31}`, k < 0.6 ? "9" : "1");
    TESTS.forEach((name, i) => {
      const y = TH + 2 + (i % 4), x = 2 + Math.floor(i / 4) * 50;
      if (i < done) {
        const fail = run % 3 === 1 && i === 2;
        g.text(x, y, fail ? "✗" : "✓", fail ? "5" : "2");
        g.text(x + 2, y, name, fail ? "5" : "0");
        g.text(x + 30, y, `${(3 + ((i * 17) % 40))}ms`, "7");
      } else if (i === done) g.text(x, y, "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"[Math.floor(t * 12) % 10] + " " + name, "3");
      else g.text(x, y, "· " + name, "7");
    });
    if (done >= TESTS.length) {
      const fail = run % 3 === 1;
      g.text(2, TH + 7, fail ? "Tests  1 failed | 7 passed (8)" : "Tests  8 passed (8)", fail ? "5" : "2");
      g.text(40, TH + 7, "Duration 412ms", "1");
    }
    g.text(2, TH + 9, "watching for file changes, press h for help", "7");
    // status bar
    g.fill(0, H - 1, W, 1, "▀", "8");
    g.text(0, H - 1, "[dev]", "2");
    ["0:server", "1:meter", "2:tests"].forEach((n, i) => g.text(7 + i * 11, H - 1, n + (i === focus ? "*" : " "), i === focus ? "0" : "1"));
    const sec = 9 * 3600 + 41 * 60 + Math.floor(t);
    g.text(W - 26, H - 1, `"build-07" ${String(Math.floor(sec / 3600)).padStart(2, "0")}:${String(Math.floor(sec / 60) % 60).padStart(2, "0")} 18-Oct-26`, "9");
    return g.frame();
  };
}
