/* timeline: a horizontal timeline whose moving marker reveals milestones above and below the line. */
import { Grid, palette, clamp } from "../lib/kit.js";

export const meta = {
  slug: "timeline",
  name: "Timeline",
  category: "explainers",
  note: "A horizontal company timeline where a moving marker reveals each milestone, labels popping up above and below the line.",
  tags: ["timeline", "history", "roadmap", "diagram", "about"],
  cols: 96, rows: 17, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#79c0ff", "#7ee787", "#ffa657", "#d2a8ff", "#f778ba", "#f2cc60", "#56d4dd", "#ffffff", "#6e7681"]),
};

const MS = [
  ["2019", "Founded", "first commit", "3"], ["2020", "Seed round", "$1.2M raised", "4"], ["2020", "v1.0 ships", "public launch", "5"],
  ["2021", "10k users", "word of mouth", "6"], ["2022", "Series A", "$8M raised", "7"], ["2023", "Mobile apps", "phone and tablet", "8"],
  ["2024", "100k users", "in 90 countries", "9"], ["2025", "v3.0", "rebuilt engine", "3"],
];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const AY = 8, X0 = 4, X1 = cols - 5;
  const mx = (i) => Math.round(X0 + 4 + (i / (MS.length - 1)) * (X1 - X0 - 8));
  return (t) => {
    g.clear();
    const LOOP = 12, lt = t % LOOP;
    const p = clamp(lt / 9.5);
    const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    const fade = clamp((lt - 11.3) / 0.6);
    const head = X0 + ease * (X1 - X0);
    // axis: travelled part bright
    for (let x = X0; x <= X1; x++) g.set(x, AY, x <= head ? "━" : "─", x <= head && fade < 0.5 ? "a" : "2");
    g.set(X1 + 1, AY, "▶", "2");
    // year ticks
    MS.forEach(([yr, title, sub, co], i) => {
      const x = mx(i);
      const passed = head >= x && fade < 0.5;
      const age = (head - x) / 3;
      g.set(x, AY, passed ? "●" : "○", passed ? co : "b");
      const up = i % 2 === 0;
      if (!passed) return;
      const grow = clamp(age);
      if (grow > 0.2) g.set(x, up ? AY - 1 : AY + 1, "│", co);
      if (grow >= 0.5) {
        const by = up ? AY - 6 : AY + 2;
        const w = Math.max(title.length, sub.length) + 4;
        const bx = Math.max(0, Math.min(cols - w, x - Math.floor(w / 2)));
        g.box(bx, by, w, 5, "round", grow >= 1 ? co : "b");
        g.set(x, up ? by + 4 : by, up ? "┬" : "┴", co);
        g.text(bx + 2, by + 1, yr, "1");
        g.text(bx + 2, by + 2, title, grow >= 1 ? "0" : "1");
        g.text(bx + 2, by + 3, sub, "1");
      }
    });
    // moving marker
    if (fade < 0.5 && p < 1) {
      g.set(Math.round(head), AY, "◆", "a");
      g.set(Math.round(head) - 1, AY, "━", "b");
    }
    g.text(1, 0, "Our story", "0");
    g.text(cols - 14, rows - 1, "2019 to today", "1");
    const reached = MS.filter((_, i) => head >= mx(i) && fade < 0.5).length;
    g.text(1, rows - 1, reached + " of " + MS.length + " milestones", "1");
    return g.frame();
  };
}
