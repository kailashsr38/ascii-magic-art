/* git-branching: main and feature branches diverging, gaining commits and merging back over time. */
import { Grid, palette, clamp } from "../lib/kit.js";

export const meta = {
  slug: "git-branching",
  name: "Git Branch Graph",
  category: "explainers",
  note: "A commit graph drawing itself over time as feature branches split from main, gain commits and merge back, with the latest commit message below.",
  tags: ["git", "branches", "version-control", "diagram", "readme", "terminal"],
  cols: 96, rows: 17, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#79c0ff", "#7ee787", "#d2a8ff", "#ffa657", "#ffffff", "#6e7681", "#f2cc60"]),
};

const LANES = [["main", 3, "3"], ["feature/login", 7, "4"], ["feature/search", 11, "5"]];
// slot, lane, kind (c commit, b branch from main, m merge into main), message, hash
const EVENTS = [
  [0, 0, "c", "initial commit", "1a2b3c4"],
  [1, 0, "c", "add readme", "5d6e7f8"],
  [2, 1, "b", "start login form", "9a0b1c2"],
  [3, 1, "c", "validate email field", "3d4e5f6"],
  [3, 0, "c", "bump dependencies", "7a8b9c0"],
  [4, 2, "b", "search index scaffold", "1d2e3f4"],
  [5, 1, "c", "remember me checkbox", "5a6b7c8"],
  [6, 1, "m", "merge feature/login", "9d0e1f2"],
  [7, 2, "c", "fuzzy matching", "3a4b5c6"],
  [8, 0, "c", "fix: header overflow", "7d8e9f0"],
  [9, 2, "c", "highlight results", "1b2c3d4"],
  [10, 2, "m", "merge feature/search", "5e6f7a8"],
  [11, 0, "c", "release v1.2.0", "9b0c1d2"],
];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const X0 = 18, SP = 6;
  const sx = (s) => X0 + s * SP;
  // lane spans: [lane, from x, to x]
  const SPANS = [[0, sx(0), sx(11)], [1, sx(2) - 2, sx(6) - 4], [2, sx(4) - 2, sx(10) - 4]];
  const diag = (x0, y0, x1, y1, head, co) => {
    const n = Math.abs(y1 - y0);
    for (let i = 1; i < n; i++) {
      const x = Math.round(x0 + ((x1 - x0) * i) / n), y = y0 + Math.sign(y1 - y0) * i;
      if (x <= head) g.set(x, y, (x1 - x0) * (y1 - y0) > 0 ? "╲" : "╱", co);
    }
  };
  return (t) => {
    g.clear();
    const LOOP = 14, lt = t % LOOP;
    const p = clamp(lt / 11);
    const head = X0 - 2 + p * (sx(11) - X0 + 3);
    // lane labels
    LANES.forEach(([name, y, co], i) => {
      const started = head >= SPANS[i][1] - 4;
      g.text(0, y, name.padStart(15), started ? co : "2");
    });
    // lane lines
    SPANS.forEach(([lane, a, b]) => {
      const y = LANES[lane][1], co = LANES[lane][2];
      for (let x = a; x <= Math.min(b, head); x++) g.set(x, y, "─", co);
    });
    // branch and merge diagonals
    for (const [s, lane, kind] of EVENTS) {
      const y = LANES[lane][1], co = LANES[lane][2];
      if (kind === "b") {
        diag(sx(s) - 6, LANES[0][1], sx(s) - 2, y, head, co);
      }
      if (kind === "m") {
        diag(sx(s) - 4, y, sx(s), LANES[0][1], head, co);
      }
    }
    // commits
    let last = null;
    for (const ev of EVENTS) {
      const [s, lane, kind, , hash] = ev;
      const x = sx(s), y = kind === "m" ? LANES[0][1] : LANES[lane][1];
      if (head < x) continue;
      last = ev;
      const co = kind === "m" ? "7" : LANES[lane][2];
      g.set(x, y, kind === "m" ? "◆" : "●", co);
      g.text(x - 2, y + (lane === 0 || kind === "m" ? -1 : 1), hash.slice(0, 5), "8");
    }
    // tag and HEAD
    if (head >= sx(11)) {
      g.text(sx(11) - 4, 0, "v1.2.0", "9");
    }
    if (last) {
      const [s, lane, kind] = last;
      const x = sx(s), y = kind === "m" ? LANES[0][1] : LANES[lane][1];
      g.set(x + 2, y, "◀", "6");
      g.text(x + 3, y, "HEAD", "6");
    }
    // commit message line
    g.hline(0, cols - 1, rows - 3, "─", "2");
    if (last) {
      const [, lane, kind, msg, hash] = last;
      g.text(1, rows - 2, hash, "6");
      g.text(9, rows - 2, msg, "0");
      g.text(9 + msg.length + 2, rows - 2, "(" + (kind === "m" ? "main" : LANES[lane][0]) + ")", kind === "m" ? "3" : LANES[lane][2]);
    }
    const count = EVENTS.filter((e) => head >= sx(e[0])).length;
    g.text(cols - 12, rows - 2, count + " commits", "1");
    return g.frame();
  };
}
