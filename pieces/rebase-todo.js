/* rebase-todo: an interactive rebase todo list being edited, reordered and applied. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "rebase-todo",
  name: "Interactive Rebase Todo",
  category: "screens",
  note: "An interactive rebase todo list where commits are squashed, reworded, dropped and reordered before the rebase replays them.",
  tags: ["git", "rebase", "terminal", "developer", "editor", "cli"],
  cols: 80, rows: 26, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60", "#56d4dd"]),
};

const COMMITS = [
  ["a41c9e2", "Add search index schema"],
  ["7b3f0d1", "wip"],
  ["c9e2a77", "Fix typo in index builder"],
  ["0d5b6c3", "Add ranking by recency"],
  ["e88a1f4", "debug logging, remove later"],
  ["3f1d2b9", "Expose /search endpoint"],
  ["91ab4e0", "Add search endpoint tests"],
];
const VERB_C = { pick: "3", squash: "6", fixup: "6", reword: "9", drop: "5", edit: "4" };
// script: [time, row, op, arg]
const SCRIPT = [
  [1.0, 1, "move"], [1.6, 1, "set", "squash"], [2.4, 2, "move"], [3.0, 2, "set", "fixup"],
  [3.8, 4, "move"], [4.4, 4, "set", "drop"], [5.2, 6, "move"], [5.8, 6, "up"], [6.4, 5, "set", "reword"],
];
const SAVE = 7.4, APPLY = 8.4, PERIOD = 14.5;

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    let rows = COMMITS.map(([h, m]) => ({ verb: "pick", h, m, flash: -9 }));
    let cur = 0;
    for (const [at, row, op, arg] of SCRIPT) {
      if (at > lt) break;
      cur = row;
      if (op === "set") { rows[row].verb = arg; rows[row].flash = at; }
      if (op === "up") { const r = rows.splice(row, 1)[0]; rows.splice(row - 1, 0, r); r.flash = at; cur = row - 1; }
    }
    if (lt < APPLY) {
      g.box(0, 0, W, H, "round", "7");
      g.text(2, 0, " .git/rebase-merge/git-rebase-todo ", "1");
      rows.forEach((r, i) => {
        const y = 2 + i;
        const sel = i === cur && lt < SAVE;
        if (sel) g.fill(1, y, W - 2, 1, "░", "8");
        const hot = lt - r.flash < 0.5;
        g.text(2, y, r.verb.padEnd(7), hot ? "0" : VERB_C[r.verb]);
        g.text(9, y, r.h, "4");
        g.text(17, y, r.m, r.verb === "drop" ? "7" : "0");
        if (sel && Math.floor(lt * 3) % 2 === 0) g.set(2, y, "█", "0");
      });
      const help = [
        "# Rebase 5e0a3c1..91ab4e0 onto 5e0a3c1 (7 commands)", "#", "# Commands:",
        "# p, pick <commit> = use commit", "# r, reword <commit> = use commit, but edit the message",
        "# s, squash <commit> = meld into previous commit", "# f, fixup <commit> = like squash, discard this message",
        "# d, drop <commit> = remove commit", "#", "# These lines can be re-ordered; they are executed top to bottom.",
      ];
      help.forEach((l, i) => g.text(2, 10 + i, l, "7"));
      g.hline(1, W - 2, H - 3, "─", "8");
      if (lt >= SAVE) { g.text(2, H - 2, ":wq", "0"); if (lt > SAVE + 0.5) g.text(8, H - 2, "\"git-rebase-todo\" 17L written", "2"); }
      else g.text(2, H - 2, "-- NORMAL --   cw change verb   dd drop   :m-2 move up", "1");
      return g.frame();
    }
    // apply phase: terminal output
    g.box(0, 0, W, H, "round", "7");
    g.text(2, 0, " ~/search-service ", "1");
    g.text(2, 1, "$ ", "2"); g.text(4, 1, "git rebase -i main", "0");
    const k = lt - APPLY;
    const live = rows.filter((r) => r.verb !== "drop");
    let y = 3;
    live.forEach((r, i) => {
      const at = i * 0.45;
      if (k < at) return;
      g.text(2, y, `[${i + 1}/${live.length}]`, "1");
      g.text(9, y, r.verb.padEnd(7), VERB_C[r.verb]);
      g.text(17, y, r.h, "4"); g.text(25, y, r.m, "0");
      g.text(W - 6, y, k - at > 0.3 ? "✓" : ".", k - at > 0.3 ? "2" : "9");
      y++;
    });
    if (k > live.length * 0.45 + 0.4) {
      y++;
      g.text(2, y++, "Successfully rebased and updated refs/heads/feature/search.", "2");
      y++;
      g.text(2, y++, "$ git log --oneline -4", "0");
      const final = [["b72e1d0", "Add search index schema"], ["4c90a3f", "Add ranking by recency"], ["e61b2d8", "Add /search endpoint with tests"], ["5e0a3c1", "Release 2.3.0"]];
      if (k > live.length * 0.45 + 1.2) final.forEach(([h, m], i) => { g.text(2, y, h, "4"); g.text(10, y, m, i === 3 ? "1" : "0"); if (i === 0) g.text(10 + m.length + 1, y, "(HEAD -> feature/search)", "a"); y++; });
    }
    return g.frame();
  };
}
