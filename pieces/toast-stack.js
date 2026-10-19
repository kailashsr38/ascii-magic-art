/* toast-stack: notification toasts sliding into a corner, stacking and timing out. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "toast-stack",
  name: "Toast Stack",
  category: "screens",
  note: "Notification toasts slide into the corner of an app, stack up, count down and slide away.",
  tags: ["notification", "toast", "app", "dashboard", "alert"],
  cols: 80, rows: 24, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#21262d"]),
};

const TOASTS = [
  ["2", "✓", "Deployment complete", "api-gateway is live on prod-eu-1"],
  ["5", "✗", "Build failed", "3 type errors in billing.ts"],
  ["3", "•", "New comment", "Maya replied to your review"],
  ["4", "▲", "Disk usage at 87%", "volume /data on db-02"],
  ["2", "✓", "Payment received", "$480.00 from Northwind Ltd"],
  ["6", "↑", "Upload finished", "12 files, 284 MB to assets/"],
  ["3", "•", "Sync complete", "1,204 records from CRM"],
  ["4", "▲", "Certificate expiring", "api.example.dev in 6 days"],
];
const GAP = 1.5, LIFE = 5.6, N = TOASTS.length, PERIOD = N * GAP;
const fit = (s, w) => (s.length <= w ? s : s.slice(0, Math.max(0, w - 2)) + "..");
const ease = (v) => { v = Math.max(0, Math.min(1, v)); return v * v * (3 - 2 * v); };

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  const page = (t) => {
    g.box(0, 0, W, H, "round", "7");
    g.text(2, 1, "■ Console", "1"); g.text(W - 26, 1, "[ Search...      ]", "8");
    g.text(W - 6, 1, "kai", "1");
    g.hline(1, W - 2, 2, "─", "8");
    ["Overview", "Deployments", "Services", "Logs", "Billing", "Settings"].forEach((s, i) => g.text(2, 4 + i * 2, (i === 1 ? "▌ " : "  ") + s, i === 1 ? "0" : "7"));
    g.vline(16, 3, H - 2, "│", "8");
    g.text(19, 4, "Deployments", "0"); g.text(19, 5, "Recent releases across all environments", "7");
    for (let i = 0; i < 6; i++) {
      const y = 7 + i * 2;
      g.text(19, y, "●", i === 1 ? "5" : "7");
      g.text(21, y, ["api-gateway", "billing-svc", "web-app", "worker", "auth", "search"][i], "7");
      g.text(35, y, ["prod-eu-1", "staging", "prod-us-2", "prod-eu-1", "staging", "prod-us-1"][i], "8");
      g.text(47, y, "▒".repeat(8 + ((i * 5) % 9)), "9");
    }
  };
  return (t) => {
    g.clear();
    page(t);
    const lt = t % PERIOD;
    const items = [];
    for (let i = -N; i < N; i++) {
      const born = i * GAP, age = lt - born;
      if (age < 0 || age > LIFE + 0.5) continue;
      const enter = ease(age / 0.35), exit = ease((age - LIFE) / 0.4);
      items.push({ d: TOASTS[((i % N) + N) % N], age, enter, exit, pres: enter * (1 - exit) });
    }
    items.sort((a, b) => a.age - b.age); // newest first
    let stack = 0;
    for (const it of items) {
      const [c, icon, title, msg] = it.d;
      const tw = 36, th = 4;
      const slide = (1 - it.enter) * (tw + 4) + it.exit * (tw + 4);
      const x = Math.round(W - tw - 2 + slide), y = Math.round(H - 2 - th - stack);
      stack += th * it.pres;
      g.fill(x, y, tw, th, " ");
      g.box(x, y, tw, th, "round", "7");
      g.set(x + 2, y + 1, icon, c);
      g.text(x + 4, y + 1, fit(title, tw - 8), "0");
      g.text(x + tw - 3, y + 1, "×", "1");
      g.text(x + 4, y + 2, fit(msg, tw - 6), "1");
      const left = Math.max(0, 1 - it.age / LIFE), n = Math.round(left * (tw - 2));
      for (let k = 0; k < n; k++) g.set(x + 1 + k, y + th - 1, "━", c);
    }
    // toasts slide off-screen under the app frame: redraw its right edge on top
    g.fill(W - 1, 0, 1, H, " ");
    g.vline(W - 1, 1, H - 2, "│", "7"); g.set(W - 1, 0, "╮", "7"); g.set(W - 1, H - 1, "╯", "7");
    return g.frame();
  };
}
