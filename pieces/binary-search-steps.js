/* binary-search-steps: lo, mid and hi pointers halving a sorted array until the target is found or ruled out. */
import { Grid, palette, clamp, rng, lerp } from "../lib/kit.js";

export const meta = {
  slug: "binary-search-steps",
  name: "Binary Search Steps",
  category: "explainers",
  note: "Binary search on a sorted array of twenty numbers, with lo, mid and hi pointers sliding into place, the discarded half greying out at every step and a log of each comparison until the target is found or proven missing.",
  tags: ["binary-search", "algorithm", "education", "diagram", "computer-science", "readme"],
  cols: 102, rows: 20, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#79c0ff", "#7ee787", "#ffa657", "#ff7b72", "#d2a8ff", "#ffffff", "#56d4dd", "#f2cc60", "#6e7681"]),
};

const N = 20;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(8);
  const A = [];
  let v = 3;
  for (let i = 0; i < N; i++) { v += 2 + Math.floor(r() * 6); A.push(v); }
  const TARGETS = [A[13], A[2], A[9] + 1, A[19]];
  const runs = TARGETS.map((tg) => {
    const steps = [];
    let lo = 0, hi = N - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const cmp = A[mid] === tg ? 0 : A[mid] < tg ? -1 : 1;
      steps.push({ lo, hi, mid, cmp });
      if (cmp === 0) break;
      if (cmp < 0) lo = mid + 1; else hi = mid - 1;
    }
    const found = steps[steps.length - 1].cmp === 0;
    steps.push({ lo, hi, mid: found ? steps[steps.length - 1].mid : -1, end: true, found });
    return { tg, steps };
  });
  const STEP = 1.6, HOLD = 2.4;
  const durs = runs.map((R) => (R.steps.length - 1) * STEP + HOLD + 0.8);
  const LOOP = durs.reduce((a, b) => a + b, 0);
  const CW = 5, X0 = 0;
  const cx = (i) => X0 + i * CW + 2;
  return (t) => {
    g.clear();
    let lt = t % LOOP, ri = 0;
    while (lt >= durs[ri]) { lt -= durs[ri]; ri++; }
    const R = runs[ri];
    const si = Math.min(R.steps.length - 1, Math.floor(lt / STEP));
    const S = R.steps[si];
    const prev = R.steps[Math.max(0, si - 1)];
    const k = clamp((lt - si * STEP) / 0.5);
    const ease = k * k * (3 - 2 * k);
    // header
    g.text(1, 0, "binary search", "0");
    g.text(16, 0, "target", "1");
    g.text(23, 0, String(R.tg), "a");
    const maxSteps = Math.ceil(Math.log2(N + 1));
    g.text(cols - 30, 0, "worst case " + maxSteps + " steps for n=" + N, "b");
    // indices
    for (let i = 0; i < N; i++) g.text(cx(i) - 1, 2, String(i).padStart(2), "b");
    // array cells
    const top = 3;
    g.hline(X0, X0 + N * CW, top, "─", "b"); g.hline(X0, X0 + N * CW, top + 2, "─", "b");
    for (let i = 0; i <= N; i++) {
      const x = X0 + i * CW;
      g.set(x, top, i === 0 ? "┌" : i === N ? "┐" : "┬", "b");
      g.set(x, top + 1, "│", "b");
      g.set(x, top + 2, i === 0 ? "└" : i === N ? "┘" : "┴", "b");
    }
    const lo = S.end ? S.lo : S.lo, hi = S.hi;
    for (let i = 0; i < N; i++) {
      const inRange = i >= lo && i <= hi;
      const isMid = !S.end && i === S.mid;
      const hit = S.end && S.found && i === S.mid;
      let co = inRange ? "0" : "2";
      if (isMid && lt - si * STEP > 0.5) co = S.cmp === 0 ? "4" : "a";
      if (hit) co = "4";
      const s = String(A[i]).padStart(3);
      g.text(cx(i) - 1, top + 1, s, co);
      if (hit) { g.set(cx(i) - 2, top + 1, "[", "4"); g.set(cx(i) + 2, top + 1, "]", "4"); }
      if (!inRange && !hit) g.text(cx(i) - 1, top + 1, s.replace(/\d/g, "·"), "2");
    }
    // range bracket
    if (lo <= hi) {
      const bx0 = X0 + lo * CW, bx1 = X0 + (hi + 1) * CW;
      g.hline(bx0, bx1, top + 3, "─", "3");
      g.set(bx0, top + 3, "└", "3"); g.set(bx1, top + 3, "┘", "3");
      const lab = " " + (hi - lo + 1) + " left ";
      g.text(Math.round((bx0 + bx1) / 2) - (lab.length >> 1), top + 3, lab, "3");
    }
    // pointers (animated)
    const pos = (key) => lerp(cx(prev[key] < 0 ? 0 : prev[key]), cx(S[key] < 0 ? 0 : S[key]), si === 0 ? 1 : ease);
    const ptr = (key, label, co, row) => {
      const x = Math.round(pos(key));
      if (x < 0 || x >= cols) return;
      g.set(x, row, "▲", co);
      g.text(Math.max(0, Math.min(cols - label.length, x - (label.length >> 1))), row + 1, label, co);
    };
    if (!S.end || S.found) {
      ptr("lo", "lo", "3", 8);
      ptr("hi", "hi", "7", 8);
      if (!S.end) ptr("mid", "mid", "a", 10);
    } else {
      // not found: lo passed hi
      g.text(cx(Math.min(N - 1, S.lo)) - 2, 8, "▲ lo", "3");
      g.text(cx(Math.max(0, S.hi)) - 2, 10, "▲ hi", "7");
    }
    // log
    g.box(0, 12, cols, rows - 12, "round", "b");
    g.text(2, 12, " steps ", "0");
    for (let j = 0; j <= si; j++) {
      const s = R.steps[j];
      const y = 13 + j;
      if (y >= rows - 1) break;
      if (s.end) {
        const msg = s.found ? "✓ found " + R.tg + " at index " + s.mid + " in " + j + " comparisons" : "✗ " + R.tg + " is not in the array, lo > hi after " + j + " comparisons";
        g.text(2, y, msg, s.found ? "4" : "6");
        continue;
      }
      if (j === si && lt - si * STEP < 0.5) { g.text(2, y, String(j + 1).padStart(2) + "  mid = (" + s.lo + " + " + s.hi + ") / 2 = " + s.mid, "1"); continue; }
      const rel = s.cmp === 0 ? "=" : s.cmp < 0 ? "<" : ">";
      const act = s.cmp === 0 ? "match" : s.cmp < 0 ? "go right, lo = " + (s.mid + 1) : "go left, hi = " + (s.mid - 1);
      g.text(2, y, String(j + 1).padStart(2), "b");
      g.text(6, y, "mid = (" + s.lo + " + " + s.hi + ") / 2 = " + s.mid, j === si ? "0" : "1");
      g.text(34, y, "a[" + s.mid + "] = " + A[s.mid] + " " + rel + " " + R.tg, j === si ? "a" : "1");
      g.text(56, y, act, s.cmp === 0 ? "4" : j === si ? "9" : "1");
    }
    return g.frame();
  };
}
