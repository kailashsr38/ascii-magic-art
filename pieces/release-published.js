/* release-published: a terminal tags a release and the notes write themselves out. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "release-published",
  name: "Release Published",
  category: "screens",
  note: "A terminal tags v1.1.0, pushes it, and the release notes type themselves out with new features, fixes and thanks to contributors.",
  tags: ["release", "changelog", "git", "terminal", "version", "open-source", "readme", "cli"],
  cols: 80, rows: 28, fps: 30,
  loop: 14,
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#7ee787", "#79c0ff", "#d2a8ff", "#ffa657", "#ffd75e", "#ff7b72"]),
};

// [kind, text, colour]: "$" typed commands, "o" output lines, "h" headings
const SCRIPT = [
  ["$", "git tag -a v1.1.0 -m \"100 new pieces\"", "0"],
  ["$", "git push origin v1.1.0", "0"],
  ["o", "Enumerating objects: 214, done.", "1"],
  ["o", " * [new tag]         v1.1.0 -> v1.1.0", "3"],
  ["$", "release publish v1.1.0", "0"],
  ["o", "✓ Release v1.1.0 published", "3"],
  ["h", "## What's new", "4"],
  ["o", "+ 100 new pieces: wonders, landmarks, India, more", "0"],
  ["o", "+ Star Milestone: your repo, your count", "0"],
  ["o", "+ Settings on pieces: repo=\"...\" stars=\"...\"", "0"],
  ["h", "## Fixes", "4"],
  ["o", "~ Bold digits hold up in the halftone looks", "1"],
  ["h", "## Thanks", "4"],
  ["o", "* every one of you who starred the repo", "7"],
];

const LOOP = 14, CPS = 34, OUT_GAP = 0.18;

export default function create() {
  const g = new Grid(meta.cols, meta.rows), W = meta.cols;
  // time each line starts and how long it takes
  const plan = [];
  let at = 0.6;
  for (const [k, s] of SCRIPT) {
    const dur = k === "$" ? s.length / CPS : 0.05;
    plan.push({ at, dur });
    at += dur + (k === "$" ? 0.45 : OUT_GAP);
  }
  return (t) => {
    g.clear();
    const ph = ((t % LOOP) + LOOP) % LOOP;
    g.box(0, 0, W, meta.rows, "round", "2");
    g.text(2, 0, " ● ● ● ", "2"); g.text(Math.round(W / 2) - 4, 0, " ~/repo ", "1");
    let y = 2;
    let cursor = null;
    SCRIPT.forEach(([k, s, c], i) => {
      const { at: a, dur } = plan[i];
      if (ph < a) return;
      if (k === "h" && y > 2) y++;
      if (y > meta.rows - 3) return;
      if (k === "$") {
        const n = Math.min(s.length, Math.floor((ph - a) / dur * s.length));
        g.text(2, y, ">", "5"); g.text(4, y, s.slice(0, n), c);
        if (n < s.length) cursor = [4 + n, y];
      } else {
        const lead = s[0];
        g.text(4, y, s, c);
        if ("+~*".includes(lead)) g.set(4, y, lead, lead === "+" ? "3" : lead === "~" ? "6" : "7");
      }
      y++;
    });
    if (!cursor) { const done = plan[plan.length - 1].at + 0.2; if (ph > done) { g.text(2, y + 1, ">", "5"); cursor = [4, y + 1]; } }
    if (cursor && Math.floor(t * 2.2) % 2 === 0) g.set(cursor[0], cursor[1], "█", "0");
    return g.frame();
  };
}
