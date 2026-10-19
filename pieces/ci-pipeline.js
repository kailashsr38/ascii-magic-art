/* ci-pipeline: build, test and deploy stages with a run passing through, statuses and a live log. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "ci-pipeline",
  name: "CI Pipeline",
  category: "explainers",
  note: "A CI pipeline where each run moves through checkout, install, lint, test, build and deploy, with spinners, timings, a live log and the odd failing test.",
  tags: ["ci", "pipeline", "devops", "build", "terminal", "readme"],
  cols: 96, rows: 19, fps: 15,
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#79c0ff", "#7ee787", "#ff7b72", "#f2cc60", "#d2a8ff", "#ffffff", "#6e7681"]),
};

const SPIN = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏";
const STAGES = [
  ["checkout", 0.9, ["Fetching origin/main", "HEAD is now at a3f9c2e", "Submodules: none"]],
  ["install", 1.6, ["Resolving 1,284 packages", "Using cache key deps-7f31c0", "added 1284 packages in 4.2s"]],
  ["lint", 1.0, ["Checking 412 files", "0 errors, 3 warnings", "Formatting ok"]],
  ["test", 2.4, ["Running 2,002 tests in 8 workers", "auth.spec.ts      48 passed", "upload.spec.ts    31 passed", "billing.spec.ts   62 passed"]],
  ["build", 1.6, ["Compiling 318 modules", "Bundle: 214.6 kB gzip", "Wrote dist/ in 6.1s"]],
  ["deploy", 1.4, ["Uploading build artifacts", "Health check passed (200)", "Live at prod in 38s"]],
];
const FAIL_LOG = ["Running 2,002 tests in 8 workers", "auth.spec.ts      48 passed", "upload.spec.ts    1 failed", "  expected 201, received 503", "Error: 1 test failed"];
const RUNS = [[1482, "a3f9c2e", "fix: retry flaky upload", 3], [1483, "b81d4e0", "feat: add export button", -1]];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const BW = 13, GAP = 3, BY = 3;
  const total = STAGES.reduce((a, s) => a + s[1], 0);
  const RUN_LEN = total + 3;
  return (t) => {
    g.clear();
    const ri = Math.floor(t / RUN_LEN) % RUNS.length;
    const lt = t % RUN_LEN;
    const [num, sha, msg, failAt] = RUNS[ri];
    // stage states
    let acc = 0, cur = -1, curT = 0, failed = false;
    const state = STAGES.map(([, d], i) => {
      if (failed) return ["skip", 0];
      if (lt < acc) return ["wait", 0];
      if (lt < acc + d) { cur = i; curT = lt - acc; acc += d; return ["run", curT]; }
      acc += d;
      if (i === failAt) { failed = true; return ["fail", d]; }
      return ["ok", d];
    });
    const done = cur < 0 && lt >= total * 0.5;
    // header
    g.text(1, 0, "pipeline", "1");
    g.text(10, 0, "#" + num, "0");
    g.text(17, 0, "main", "7");
    g.text(23, 0, sha, "3");
    g.text(32, 0, msg, "0");
    const overall = failed ? ["✗ failed", "5"] : done && cur < 0 && state[5][0] === "ok" ? ["✓ passed", "4"] : ["● running", "6"];
    g.text(cols - 12, 0, overall[0], overall[1]);
    // stage boxes
    STAGES.forEach(([name, d], i) => {
      const x = 1 + i * (BW + GAP);
      const [s, el] = state[i];
      const co = s === "ok" ? "4" : s === "fail" ? "5" : s === "run" ? "6" : "2";
      g.box(x, BY, BW, 5, s === "run" ? "heavy" : "round", co);
      g.text(x + 2, BY + 1, name, s === "wait" || s === "skip" ? "1" : "0");
      const icon = s === "ok" ? "✓" : s === "fail" ? "✗" : s === "run" ? SPIN[Math.floor(t * 12) % SPIN.length] : s === "skip" ? "─" : "○";
      const word = s === "ok" ? "passed" : s === "fail" ? "failed" : s === "run" ? "running" : s === "skip" ? "skipped" : "queued";
      g.text(x + 2, BY + 2, icon + " " + word, co === "2" ? "9" : co);
      const secs = s === "run" ? el * 9 : s === "ok" || s === "fail" ? d * 9 : 0;
      g.text(x + 2, BY + 3, secs ? Math.floor(secs) + "s" : "", "1");
      if (s === "run") {
        const w = BW - 2, n = Math.round((el / d) * w);
        for (let k = 0; k < w; k++) g.set(x + 1 + k, BY + 4, k < n ? "━" : "─", k < n ? "6" : "2");
      }
      if (i < STAGES.length - 1) {
        const nx = x + BW;
        const lit = s === "ok";
        g.text(nx, BY + 2, "──▶", lit ? "4" : "2");
      }
    });
    // log panel
    const LY = 9;
    g.box(0, LY, cols, rows - LY, "round", "2");
    const show = cur >= 0 ? cur : failed ? failAt : STAGES.length - 1;
    g.text(2, LY, " " + STAGES[show][0] + " log ", "0");
    const lines = failed && show === failAt ? FAIL_LOG : STAGES[show][2];
    const frac = cur >= 0 ? curT / STAGES[cur][1] : 1;
    const n = Math.min(lines.length, Math.ceil(frac * lines.length + 0.01));
    for (let i = 0; i < n; i++) {
      const line = lines[i];
      const bad = /fail|Error|received/.test(line);
      g.text(2, LY + 2 + i, String(i + 1).padStart(3), "9");
      g.text(7, LY + 2 + i, line, bad ? "5" : /passed|ok|Live|200/.test(line) ? "4" : "1");
    }
    if (cur >= 0 && Math.floor(t * 3) % 2) g.set(7, LY + 2 + n, "█", "1");
    if (failed) g.text(2, rows - 2, "re-run with: ci retry " + num, "6");
    else if (state[5][0] === "ok") g.text(2, rows - 2, "deployed in " + Math.round(total * 9) + "s", "4");
    return g.frame();
  };
}
