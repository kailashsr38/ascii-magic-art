/* pr-merged: a pull request goes green check by check, gets approved and merges. */
import { Grid, palette, clamp } from "../lib/kit.js";

export const meta = {
  slug: "pr-merged",
  name: "Pull Request Merged",
  category: "screens",
  note: "A pull request page where the checks turn green one by one, a review approves it and the merge button lands it, branch deleted.",
  tags: ["github", "pull-request", "merge", "ci", "code-review", "open-source", "readme", "ui"],
  cols: 88, rows: 30, fps: 24,
  loop: 13,
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#7ee787", "#238636", "#d2a8ff", "#8957e5", "#e3b341", "#79c0ff", "#f85149", "#161b22"]),
};

const LOOP = 13;
const CHECKS = [
  ["build", "Build and test (node 20)", 1.4],
  ["lint", "Lint and typecheck", 2.1],
  ["visual", "Visual snapshots, 734 tiles", 3.2],
  ["e2e", "End to end, chrome", 4.4],
  ["size", "Bundle size, +1.2 kB", 5.0],
];
const SPIN = "↑↗→↘↓↙←↖";

export default function create() {
  const g = new Grid(meta.cols, meta.rows), W = meta.cols;
  return (t) => {
    g.clear();
    const ph = ((t % LOOP) + LOOP) % LOOP;
    const approved = ph > 6.0, merged = ph > 8.2;
    // title and state pill
    g.text(2, 1, "Add star milestone piece with custom repo and count", "0");
    g.text(2 + 52, 1, "#412", "1");
    const pill = merged ? " ◆ Merged " : " ○ Open ", pc = merged ? "6" : "4";
    g.box(2, 3, pill.length + 2, 3, "round", pc); g.text(3, 4, pill, merged ? "5" : "3");
    const by = merged ? "merged 3 commits into main from feat/star-milestone" : "wants to merge 3 commits into main from feat/star-milestone";
    g.text(pill.length + 6, 4, "kail", "0"); g.text(pill.length + 11, 4, by, "1");
    g.hline(0, W - 1, 6, "─", "2");
    // conversation: a review
    g.text(2, 8, "●", "8"); g.text(4, 8, "reviewer", "0");
    g.text(13, 8, approved ? "approved these changes" : "requested a review", approved ? "3" : "1");
    g.text(4, 9, approved ? "Looks great. The bold digits read well in the dots look." : "...", "1");
    // checks box
    const bx = 2, bw = W - 4, top = 11;
    const allGreen = ph > CHECKS[CHECKS.length - 1][2];
    g.box(bx, top, bw, CHECKS.length + 4, "round", allGreen ? "4" : "2");
    const head = allGreen ? "All checks have passed" : "Some checks haven't completed yet";
    g.text(bx + 2, top + 1, allGreen ? "✓" : SPIN[Math.floor(t * 8) % 8], allGreen ? "3" : "7");
    g.text(bx + 4, top + 1, head, "0");
    const done = CHECKS.filter((c) => ph > c[2]).length;
    const sum = `${done} of ${CHECKS.length} done`;
    g.text(bx + bw - 2 - sum.length, top + 1, sum, "1");
    g.hline(bx + 1, bx + bw - 2, top + 2, "─", "2");
    CHECKS.forEach(([id, label, at], i) => {
      const y = top + 3 + i, ok = ph > at, started = ph > at - 1.2;
      g.text(bx + 2, y, ok ? "✓" : started ? SPIN[Math.floor(t * 8 + i) % 8] : "○", ok ? "3" : started ? "7" : "1");
      g.text(bx + 4, y, label, ok ? "0" : "1");
      const st = ok ? `${(12 + i * 17) % 60 + 8}s` : started ? "running" : "queued";
      g.text(bx + bw - 2 - st.length, y, st, ok ? "1" : started ? "7" : "1");
    });
    // the merge box
    const my = top + CHECKS.length + 5;
    g.box(bx, my, bw, 5, "round", merged ? "6" : allGreen && approved ? "4" : "2");
    if (merged) {
      g.text(bx + 2, my + 1, "◆", "5"); g.text(bx + 4, my + 1, "Pull request successfully merged and closed", "0");
      g.text(bx + 4, my + 2, "The feat/star-milestone branch can be safely deleted.", "1");
      const del = ph > 9.6, label = del ? " Branch deleted " : " Delete branch ";
      g.box(bx + bw - 3 - label.length, my + 1, label.length + 2, 3, "round", "2"); g.text(bx + bw - 2 - label.length, my + 2, label, del ? "1" : "0");
    } else {
      const ready = allGreen && approved, press = ph > 7.6 && ph < 8.2;
      g.text(bx + 2, my + 1, ready ? "✓" : "○", ready ? "3" : "1");
      g.text(bx + 4, my + 1, ready ? "This branch has no conflicts with the base branch" : "Waiting on checks and review", ready ? "0" : "1");
      const lab = press ? " Merging... " : " Merge pull request ";
      g.box(bx + 2, my + 2, lab.length + 2, 3, "round", ready ? "3" : "2");
      g.text(bx + 3, my + 3, lab, ready ? "3" : "1");
      // the bottom edge of the button sits on the merge box's bottom edge
      g.set(bx + 2, my + 4, "├", ready ? "3" : "2"); g.set(bx + 3 + lab.length, my + 4, "┤", ready ? "3" : "2");
    }
    return g.frame();
  };
}
