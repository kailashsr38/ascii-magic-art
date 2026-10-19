/* git-log-graph: a git commit graph with branches and merges, new commits landing on top. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "git-log-graph",
  name: "Git Log Graph",
  category: "screens",
  note: "A git log graph with feature branches merging back into main as new commits land on top.",
  tags: ["git", "terminal", "developer", "readme", "cli"],
  cols: 84, rows: 24, fps: 12,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#f2cc60", "#56d4dd"]),
};

// newest first; m = merge commit, c = commit, "" = connector row
const PAT = [
  ["*   ", "m"], ["|\\  ", ""], ["| * ", "b"], ["| * ", "b"], ["* | ", "c"], ["|/  ", ""], ["*   ", "c"], ["*   ", "c"],
  ["*   ", "m"], ["|\\  ", ""], ["| * ", "b"], ["| * ", "b"], ["| * ", "b"], ["|/  ", ""], ["*   ", "c"],
];
const CP = PAT.map((p, i) => (p[1] ? i : -1)).filter((i) => i >= 0);
const NC = CP.length, NP = PAT.length;
const MAIN = ["fix: retry flaky webhook delivery", "chore: bump deps", "docs: update API reference", "perf: cache tenant lookups", "fix: null check in session refresh", "chore: tidy logging", "ci: run tests on node 22"];
const BR = [
  ["feat/billing", "add invoice export endpoint", "wire stripe-like webhook stub", "add usage meter"],
  ["feat/auth", "add refresh token rotation", "hash api keys at rest", "expire idle sessions"],
  ["fix/rate-limit", "use sliding window counter", "add burst allowance", "log throttled clients"],
  ["feat/search", "index users by email", "add fuzzy match", "paginate results"],
];
const WHO = ["kai", "maya", "omar", "lena", "dev", "ana"];
const hash = (n) => { let h = (n * 2654435761) >>> 0; h ^= h >>> 13; h = Math.imul(h, 1274126177) >>> 0; return h.toString(16).padStart(8, "0").slice(0, 7); };
const mod = (a, b) => ((a % b) + b) % b;

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const STEP = 1.4;
  return (t) => {
    g.clear();
    const k = Math.floor(t / STEP), f = (t % STEP) / STEP;
    // commit index c (decreasing upward). k-th new commit is c = -k.
    const rowOf = (c) => Math.floor(c / NC) * NP + CP[mod(c, NC)];
    const top = rowOf(-k);
    const W = meta.cols;
    g.box(0, 0, W, meta.rows, "round", "7");
    g.text(2, 0, " $ git log --graph --oneline --all ", "1");
    let cIdx = -k;
    for (let y = 1; y < meta.rows - 1; y++) {
      const row = top + y - 1;
      const [gr, kind] = PAT[mod(row, NP)];
      for (let i = 0; i < gr.length; i++) {
        const ch = gr[i];
        if (ch === " ") continue;
        g.set(2 + i, y, ch, ch === "*" ? (i === 0 ? "3" : "6") : i === 0 ? "3" : "6");
      }
      if (!kind) continue;
      const c = cIdx++;
      const n = -c; // commit number, higher = newer
      const cyc = Math.floor(row / NP), br = BR[mod(cyc, BR.length)];
      const fresh = c === -k && f < 0.5;
      let x = 7;
      g.text(x, y, hash(n + 99991), fresh ? "8" : "4"); x += 8;
      if (c === -k) { g.text(x, y, "(", "8"); g.text(x + 1, y, "HEAD -> ", "9"); g.text(x + 9, y, "main", "2"); g.text(x + 13, y, ", ", "8"); g.text(x + 15, y, "origin/main", "5"); g.text(x + 26, y, ")", "8"); x += 28; }
      let msg;
      if (kind === "m") { msg = `Merge pull request #${mod(n * 7 + 311, 900) + 100} from ${br[0]}`; if (mod(cyc, 2) === 0) { const tag = "(tag: v1." + (mod(Math.floor(n / 4) + 40, 80) + 10) + ".0)"; g.text(x, y, tag, "8"); x += tag.length + 1; msg = `Merge #${mod(n * 7 + 311, 900) + 100} from ${br[0]}`; } }
      else if (kind === "b") { msg = br[0].split("/")[0] + ": " + br[1 + mod(n, 3)]; }
      else msg = MAIN[mod(n, MAIN.length)];
      const age = (k + c) * 7 + 2;
      const when = c === -k ? "just now" : age < 60 ? age + "m ago" : Math.floor(age / 60) + "h ago";
      const who = WHO[mod(n * 5, WHO.length)];
      const room = W - 2 - x - 18;
      g.text(x, y, msg.length > room ? msg.slice(0, room - 2).trimEnd() + ".." : msg, fresh ? "2" : kind === "m" ? "0" : kind === "b" ? "0" : "0");
      g.text(W - 18, y, who.padEnd(6), "6");
      g.text(W - 11, y, when.padStart(9), fresh ? "2" : "1");
    }
    return g.frame();
  };
}
