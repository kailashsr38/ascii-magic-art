/* coverage-report: a code coverage table whose bars fill, then the rows re-sort from lowest to highest coverage. */
import { Grid, palette, clamp } from "../lib/kit.js";

export const meta = {
  slug: "coverage-report",
  name: "Coverage Report",
  category: "screens",
  note: "A code coverage report where per-file bars fill up, colour by threshold and then re-sort so the weakest files rise to the top.",
  tags: ["coverage", "tests", "terminal", "developer", "ci", "dashboard"],
  cols: 84, rows: 25, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60"]),
};

const FILES = [
  ["src/api/handlers.ts", 412, 0.91], ["src/api/middleware.ts", 138, 0.97], ["src/auth/session.ts", 221, 0.84],
  ["src/auth/tokens.ts", 96, 0.99], ["src/billing/invoice.ts", 340, 0.72], ["src/billing/tax.ts", 188, 0.58],
  ["src/db/migrations.ts", 154, 0.41], ["src/db/pool.ts", 77, 0.88], ["src/jobs/scheduler.ts", 263, 0.66],
  ["src/search/index.ts", 301, 0.79], ["src/utils/dates.ts", 64, 1.0], ["src/utils/retry.ts", 52, 0.94],
  ["src/webhooks/sign.ts", 89, 0.83], ["src/webhooks/deliver.ts", 176, 0.54],
];
const PERIOD = 12;
const col = (p) => (p >= 0.9 ? "2" : p >= 0.7 ? "9" : p >= 0.5 ? "4" : "5");

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  const sorted = FILES.map((f, i) => i).sort((a, b) => FILES[a][2] - FILES[b][2]);
  const rankOf = new Array(FILES.length);
  sorted.forEach((fi, r) => (rankOf[fi] = r));
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    g.box(0, 0, W, H, "round", "7");
    g.text(2, 0, " coverage · ledger-api ", "1");
    const sortP = clamp((lt - 5.5) / 1.2);
    const sp = sortP * sortP * (3 - 2 * sortP);
    const back = clamp((lt - 10.8) / 0.8);
    const ord = sp * (1 - back);
    g.text(2, 1, "File".padEnd(28), "0");
    g.text(30, 1, "Stmts", "0"); g.text(37, 1, "Miss", "0");
    g.text(44, 1, "Cover" + (ord > 0.5 ? " ▲" : "  "), ord > 0.5 ? "3" : "0");
    g.text(53, 1, "Bar", "0");
    g.hline(1, W - 2, 2, "─", "8");
    let totS = 0, totM = 0;
    FILES.forEach(([name, stmts, cov], i) => {
      const y = Math.round(3 + i + (rankOf[i] - i) * ord);
      const p = cov * clamp((lt - 0.4 - i * 0.12) / 1.6);
      const miss = Math.round(stmts * (1 - p));
      totS += stmts; totM += miss;
      const dir = name.lastIndexOf("/") + 1;
      g.text(2, y, name.slice(0, dir), "7"); g.text(2 + dir, y, name.slice(dir), "0");
      g.text(30, y, String(stmts).padStart(5), "1");
      g.text(37, y, String(miss).padStart(4), miss > 50 ? "4" : "1");
      g.text(43, y, (Math.round(p * 1000) / 10).toFixed(1).padStart(5) + "%", col(p));
      const bw = 26, n = Math.round(p * bw);
      g.text(53, y, "█".repeat(n), col(p)); g.text(53 + n, y, "░".repeat(bw - n), "8");
      if (cov < 0.6 && p >= cov - 0.001) g.text(W - 4, y, "!", "5");
    });
    const yT = 3 + FILES.length;
    g.hline(1, W - 2, yT, "─", "8");
    const tp = 1 - totM / totS;
    g.text(2, yT + 1, "TOTAL", "0");
    g.text(30, yT + 1, String(totS).padStart(5), "0"); g.text(37, yT + 1, String(totM).padStart(4), "0");
    g.text(43, yT + 1, (tp * 100).toFixed(1).padStart(5) + "%", col(tp));
    const bw = 26, n = Math.round(tp * bw);
    g.text(53, yT + 1, "█".repeat(n), col(tp)); g.text(53 + n, yT + 1, "░".repeat(bw - n), "8");
    if (lt > 2.6) {
      const ok = tp >= 0.75;
      g.text(2, yT + 3, ok ? "✓" : "✗", ok ? "2" : "5");
      g.text(4, yT + 3, `required coverage of 75% ${ok ? "reached" : "not reached"}, total ${(tp * 100).toFixed(2)}%`, ok ? "2" : "5");
      g.text(2, yT + 4, "legend:", "1");
      [[">=90", "2"], [">=70", "9"], [">=50", "4"], ["<50", "5"]].forEach(([l, c], k) => { g.text(10 + k * 9, yT + 4, "■", c); g.text(12 + k * 9, yT + 4, l, "1"); });
      if (ord > 0.5) g.text(50, yT + 4, "sorted by cover, ascending", "3");
    }
    return g.frame();
  };
}
