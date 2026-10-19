/* test-runner-dots: a test runner printing pass dots per file, one failure, then a summary. */
import { Grid, palette, rng } from "../lib/kit.js";

export const meta = {
  slug: "test-runner-dots",
  name: "Test Suite Dots",
  category: "screens",
  note: "A test runner that prints a dot per passing test across files, flags a failure with a diff and ends in a coloured summary.",
  tags: ["tests", "terminal", "developer", "ci", "cli", "python"],
  cols: 84, rows: 28, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60"]),
};

const FILES = [
  ["tests/test_auth.py", 18], ["tests/test_billing.py", 24], ["tests/test_cache.py", 11], ["tests/test_invoices.py", 31],
  ["tests/test_parser.py", 27], ["tests/test_queue.py", 14], ["tests/test_search.py", 22], ["tests/test_users.py", 19],
  ["tests/test_webhooks.py", 16],
];

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  const r = rng(11);
  const total = FILES.reduce((a, f) => a + f[1], 0);
  // outcome per test
  const out = [];
  FILES.forEach(([, n], fi) => {
    const a = [];
    for (let i = 0; i < n; i++) a.push(fi === 3 && i === 17 ? "F" : r() < 0.03 ? "s" : r() < 0.01 ? "x" : ".");
    out.push(a);
  });
  const STEP = 0.028;
  const RUN = 1.0 + total * STEP + FILES.length * 0.1;
  const PERIOD = RUN + 7;
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    g.box(0, 0, W, H, "round", "7");
    g.text(2, 0, " ~/ledger-service ", "1");
    g.text(2, 1, "$ ", "2"); g.text(4, 1, "test -q --cov".slice(0, Math.floor(lt / 0.05)), "0");
    if (lt < 0.8) return g.frame();
    g.text(2, 2, "==================== test session starts ====================", "0");
    g.text(2, 3, "platform linux, runner 8.3.3, plugins: cov-5.0, xdist-3.6", "1");
    g.text(2, 4, `collected ${total} items`, "0");
    let done = 0, tt = 1.0;
    let y = 6;
    let failSeen = false, skipped = 0, passed = 0;
    for (let fi = 0; fi < FILES.length; fi++) {
      const [name, n] = FILES[fi];
      if (lt < tt) break;
      g.text(2, y, name, "0");
      let x = 2 + 26;
      for (let i = 0; i < n; i++) {
        if (lt < tt) break;
        const o = out[fi][i];
        g.set(x + i, y, o, o === "." ? "2" : o === "F" ? "5" : "9");
        if (o === "F") failSeen = true; else if (o === ".") passed++; else skipped++;
        done++; tt += STEP;
      }
      g.text(W - 9, y, `[${String(Math.round((done / total) * 100)).padStart(3)}%]`, failSeen ? "5" : "2");
      tt += 0.1; y++;
    }
    if (lt >= RUN) {
      y++;
      const k = lt - RUN;
      if (k > 0.3) {
        g.text(2, y++, "========================= FAILURES ==========================", "5");
        g.text(2, y++, "____________ test_invoice_total_rounds_half_even ____________", "5");
        if (k > 0.8) {
          g.text(4, y++, "def test_invoice_total_rounds_half_even():", "1");
          g.text(4, y, ">", "5"); g.text(8, y++, "assert invoice.total(lines) == Decimal(\"10.02\")", "0");
          g.text(2, y, "E", "5"); g.text(8, y++, "AssertionError: assert Decimal('10.03') == Decimal('10.02')", "5");
          g.text(2, y++, "tests/test_invoices.py:88: AssertionError", "1");
        }
      }
      if (k > 1.6) {
        y++;
        const s = ` 1 failed, ${passed} passed, ${skipped} skipped in 4.81s `;
        const pad = Math.floor((W - 4 - s.length) / 2);
        g.text(2, y, "=".repeat(pad), "5");
        g.text(2 + pad, y, " 1 failed", "5"); g.text(2 + pad + 9, y, `, ${passed} passed`, "2"); g.text(2 + pad + 9 + `, ${passed} passed`.length, y, `, ${skipped} skipped`, "9");
        const e = 2 + pad + s.length - " in 4.81s ".length;
        g.text(e, y, " in 4.81s ", "1");
        g.text(2 + pad + s.length, y, "=".repeat(W - 4 - pad - s.length), "5");
        y++;
        if (k > 2.2) { g.text(2, ++y, "$ ", "2"); if (Math.floor(lt * 3) % 2 === 0) g.set(4, y, "█", "0"); }
      }
    } else {
      const bw = 40, n = Math.round((done / total) * bw);
      g.text(2, H - 2, "█".repeat(n), failSeen ? "5" : "2"); g.text(2 + n, H - 2, "░".repeat(bw - n), "8");
      g.text(44, H - 2, `${done}/${total} tests`, "1");
    }
    return g.frame();
  };
}
