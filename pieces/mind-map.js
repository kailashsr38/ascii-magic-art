/* mind-map: a central idea branching out into topics and sub-topics that grow outward. */
import { Grid, palette, clamp } from "../lib/kit.js";

export const meta = {
  slug: "mind-map",
  name: "Mind Map",
  category: "explainers",
  note: "A mind map growing out from a central idea, branches reaching to six topics and each topic sprouting its own leaves.",
  tags: ["mind-map", "brainstorm", "diagram", "ideas", "planning"],
  cols: 100, rows: 30, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#79c0ff", "#7ee787", "#ffa657", "#d2a8ff", "#f778ba", "#56d4dd", "#ffffff", "#f2cc60"]),
};

// topic, x, y, colour, leaves [text, x, y]
const TOPICS = [
  ["Marketing", 19, 5, "3", [["launch video", 2, 1], ["blog series", 2, 9]]],
  ["Product", 50, 3, "4", [["onboarding", 34, 0], ["pricing page", 66, 0]]],
  ["Design", 80, 6, "5", [["icon set", 85, 1], ["dark mode", 84, 11]]],
  ["Engineering", 80, 22, "6", [["api v2", 86, 17], ["load tests", 84, 27]]],
  ["Support", 49, 26, "7", [["help center", 32, 29], ["live chat", 64, 29]]],
  ["Sales", 17, 22, "8", [["demo script", 2, 17], ["partner deck", 2, 27]]],
];

const slopeCh = (dx, dy) => {
  const ax = Math.abs(dx), ay = Math.abs(dy) * 2;
  if (ay < ax * 0.4) return "─";
  if (ax < ay * 0.4) return "│";
  return dx * dy > 0 ? "╲" : "╱";
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const CX = 50, CY = 14;
  // grow a line from a to b up to fraction p
  const grow = (x0, y0, x1, y1, p, co) => {
    if (p <= 0) return;
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0) * 2);
    const ch = slopeCh(x1 - x0, y1 - y0);
    const m = Math.floor(n * p);
    for (let i = 0; i <= m; i++) {
      const u = i / n;
      g.set(Math.round(x0 + (x1 - x0) * u), Math.round(y0 + (y1 - y0) * u), ch, co);
    }
  };
  const node = (x, y, text, co, p, bold) => {
    if (p <= 0) return;
    const w = text.length + 4, bx = Math.max(0, Math.min(cols - w, x - Math.floor(w / 2)));
    if (bold) g.box(bx, y - 1, w, 3, p >= 1 ? "double" : "round", co);
    else g.box(bx, y - 1, w, 3, "round", p >= 1 ? co : "2");
    const n = Math.floor(clamp(p * 1.4) * text.length);
    for (let i = 0; i < text.length; i++) g.set(bx + 2 + i, y, i < n ? text[i] : " ");
    g.text(bx + 2, y, text.slice(0, n), bold ? "9" : "0");
  };
  const leaf = (x, y, text, co, p) => {
    if (p <= 0) return;
    const n = Math.floor(clamp(p * 1.4) * text.length);
    g.set(x, y, "●", co);
    g.text(x + 2, y, text.slice(0, n), "1");
  };
  return (t) => {
    g.clear();
    const LOOP = 10, lt = (t + 1.6) % LOOP;
    const at = (t0, d) => clamp((lt - t0) / d);
    TOPICS.forEach(([name, x, y, co, leaves], i) => {
      const t0 = 0.6 + i * 0.35;
      grow(CX, CY, x, y, at(t0, 0.9), co);
      leaves.forEach(([lt2, lx, ly], j) => {
        const t1 = t0 + 1.4 + j * 0.3;
        const ex = lx + (lx < x ? lt2.length + 2 : -1);
        grow(x, y, lx < x ? ex : lx, ly, at(t1, 0.6), co);
      });
    });
    TOPICS.forEach(([name, x, y, co, leaves], i) => {
      const t0 = 0.6 + i * 0.35;
      node(x, y, name, co, at(t0 + 0.8, 0.5), false);
      leaves.forEach(([text, lx, ly], j) => leaf(lx, ly, text, co, at(t0 + 1.9 + j * 0.3, 0.5)));
    });
    node(CX, CY, "Launch plan", "a", at(-0.5, 0.8), true);
    const sparkle = Math.floor(lt * 2) % 6;
    if (lt > 5) g.set(CX - 8, CY, "◆", TOPICS[sparkle][3]);
    return g.frame();
  };
}
