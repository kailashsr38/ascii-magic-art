/* bisect-hunt: a bisect session halving a range of commits until the first bad one is found. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "bisect-hunt",
  name: "Bisect Hunt",
  category: "screens",
  note: "A bisect session that tests the middle commit, marks it good or bad and halves the range until the first bad commit is found.",
  tags: ["git", "bisect", "debugging", "terminal", "developer", "cli"],
  cols: 88, rows: 26, fps: 20,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60"]),
};

const N = 32, BAD = 21;
const MSGS = ["bump deps", "refactor cache keys", "add retry jitter", "tune pool size", "split config loader", "cache user lookups",
  "add metrics labels", "faster json encode", "inline hot path", "lazy init tls"];
const hash = (i) => ((i * 2654435761) >>> 0).toString(16).padStart(8, "0").slice(0, 7);
const STEP = 1.9;

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  // precompute steps
  const steps = [];
  let lo = 0, hi = N - 1;
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    const bad = mid >= BAD;
    steps.push({ lo, hi, mid, bad });
    if (bad) hi = mid; else lo = mid;
  }
  const PERIOD = 1.2 + steps.length * STEP + 4;
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    const si = Math.floor((lt - 1.2) / STEP);
    const sk = (lt - 1.2) - si * STEP;
    let L = 0, R = N - 1;
    const marks = new Array(N).fill(0);
    marks[0] = 1; marks[N - 1] = -1;
    for (let i = 0; i < Math.min(si, steps.length); i++) { const s = steps[i]; marks[s.mid] = s.bad ? -1 : 1; if (s.bad) R = s.mid; else L = s.mid; }
    const cur = si >= 0 && si < steps.length ? steps[si] : null;
    const done = si >= steps.length;
    if (cur && sk > 1.3) { marks[cur.mid] = cur.bad ? -1 : 1; }
    g.box(0, 0, W, H, "round", "7");
    g.text(2, 0, " bisect · ledger-api · latency regression ", "1");
    // commit rail
    const X0 = 4, SP = 2.5, RY = 4;
    g.text(2, 2, "v2.3.0", "2"); g.text(W - 10, 2, "HEAD", "5");
    for (let i = 0; i < N; i++) {
      const x = Math.round(X0 + i * SP);
      const inRange = i >= L && i <= R;
      if (i < N - 1) g.text(x + 1, RY, "──", inRange && i < R ? "1" : "8");
      let ch = "○", c = inRange ? "1" : "8";
      if (marks[i] === 1) { ch = "●"; c = "2"; }
      if (marks[i] === -1) { ch = "●"; c = "5"; }
      if (cur && i === cur.mid && sk <= 1.3) { ch = "◆"; c = "9"; }
      if (done && i === BAD) { ch = "◆"; c = "5"; }
      g.set(x, RY, ch, c);
    }
    // range bracket
    const bx0 = Math.round(X0 + L * SP), bx1 = Math.round(X0 + R * SP);
    g.hline(bx0, bx1, RY + 1, "─", "3"); g.set(bx0, RY + 1, "└", "3"); g.set(bx1, RY + 1, "┘", "3");
    const rem = R - L - 1;
    const lab = done ? "found" : `${rem} left · ~${Math.ceil(Math.log2(Math.max(2, rem + 1)))} steps`;
    g.text(Math.round((bx0 + bx1) / 2 - lab.length / 2), RY + 2, lab, "3");
    if (cur && sk <= 1.3) g.set(Math.round(X0 + cur.mid * SP), RY - 1, "▼", "9");
    if (done) g.set(Math.round(X0 + BAD * SP), RY - 1, "▼", "5");
    // log
    g.hline(1, W - 2, 8, "─", "8");
    const log = [];
    log.push([["$ ", "2"], ["git bisect start HEAD v2.3.0", "0"]]);
    for (let i = 0; i <= Math.min(si, steps.length - 1); i++) {
      const s = steps[i];
      log.push([["Bisecting: ", "1"], [`${s.hi - s.lo - 1} revisions left to test after this`, "0"]]);
      log.push([["[" + hash(s.mid) + "] ", "4"], [MSGS[s.mid % MSGS.length], "0"]]);
      const fin = i < si || sk > 0.4;
      if (!fin) break;
      log.push([["$ ", "2"], ["make bench | check p99 < 120ms", "0"]]);
      const p99 = s.bad ? 180 + (s.mid * 7) % 40 : 92 + (s.mid * 5) % 20;
      if (i < si || sk > 0.9) log.push([["  p99 ", "1"], [p99 + "ms", s.bad ? "5" : "2"], [s.bad ? "  over budget" : "  ok", s.bad ? "5" : "2"]]);
      if (i < si || sk > 1.3) log.push([["$ ", "2"], ["git bisect " + (s.bad ? "bad" : "good"), s.bad ? "5" : "2"]]);
    }
    if (done) {
      log.push([[hash(BAD), "5"], [" is the first bad commit", "0"]]);
      log.push([["    ", "0"], [MSGS[BAD % MSGS.length] + " (pool size 64 → 8)", "9"]]);
    }
    const VIS = H - 11;
    log.slice(-VIS).forEach((segs, i) => {
      let x = 2;
      for (const [s, c] of segs) { g.text(x, 9 + i, s, c); x += s.length; }
    });
    g.hline(1, W - 2, H - 2, " ");
    g.text(2, H - 2, "● good", "2"); g.text(10, H - 2, "● bad", "5"); g.text(17, H - 2, "◆ testing", "9"); g.text(28, H - 2, "○ untested", "1");
    return g.frame();
  };
}
