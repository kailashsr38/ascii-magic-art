/* gantt-chart: task bars on a timeline with a moving today marker and progress filling in. */
import { Grid, palette, clamp } from "../lib/kit.js";

export const meta = {
  slug: "gantt-chart",
  name: "Gantt Chart",
  category: "explainers",
  note: "A project Gantt chart where the today marker sweeps across the weeks, task bars fill with progress and milestones light up.",
  tags: ["gantt", "project", "timeline", "planning", "diagram"],
  cols: 94, rows: 24, fps: 20,
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#79c0ff", "#1d3a5c", "#d2a8ff", "#3c2a5c", "#7ee787", "#1d4a2b", "#ffa657", "#5c3a1d", "#ff7b72", "#f2cc60", "#ffffff", "#21262d"]),
};

// name, start day, duration (0 = milestone), colour pair
const TASKS = [
  ["Research", 0, 9, "34"], ["Wireframes", 5, 10, "56"], ["Visual design", 12, 15, "56"], ["API design", 8, 12, "34"],
  ["Backend build", 18, 25, "78"], ["Frontend build", 24, 24, "78"], ["Beta release", 49, 0, "c"], ["QA testing", 40, 17, "9a"],
  ["Docs", 44, 14, "9a"], ["Launch", 63, 0, "c"],
];
const MONTHS = [["Mar", 0], ["Apr", 29], ["May", 59]];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const X0 = 22, DAYS = 70;
  return (t) => {
    g.clear();
    const LOOP = 14, lt = t % LOOP;
    const today = clamp(lt / 12) * (DAYS - 1);
    const td = Math.floor(today);
    g.text(1, 0, "Q2 launch plan", "0");
    // month and week headers
    for (const [m, d] of MONTHS) g.text(X0 + d, 1, m, "1");
    for (let d = 0; d < DAYS; d += 7) {
      g.text(X0 + d, 2, "W" + (d / 7 + 9), "2");
      for (let y = 3; y < rows - 1; y++) g.set(X0 + d, y, "┊", "e");
    }
    g.hline(0, cols - 1, 3, "─", "2");
    TASKS.forEach(([name, s, dur, co], i) => {
      const y = 4 + i * 2;
      const p = dur ? clamp((today - s) / dur) : today >= s ? 1 : 0;
      const pct = Math.round(p * 100);
      g.text(1, y, name, p >= 1 ? "1" : today >= s ? "0" : "1");
      if (dur) {
        g.text(16, y, (pct + "%").padStart(4), p >= 1 ? "7" : p > 0 ? "0" : "2");
        for (let d = 0; d < dur; d++) {
          const done = d < p * dur;
          g.set(X0 + s + d, y, done ? "█" : "▒", done ? co[0] : co[1]);
        }
        if (p >= 1) g.set(X0 + s + dur + 1, y, "✓", "7");
      } else {
        const on = today >= s;
        g.set(X0 + s, y, "◆", on ? "c" : "2");
        g.text(16, y, on ? "done" : "", "7");
        g.text(X0 + s + 2, y, on ? "reached" : "", "c");
      }
    });
    // today marker
    const tx = X0 + td;
    for (let y = 3; y < rows - 1; y++) if (g.get(tx, y) === " " || g.get(tx, y) === "┊" || g.get(tx, y) === "─") g.set(tx, y, "│", "b");
    g.set(tx, 3, "▼", "b");
    const date = new Date(Date.UTC(2026, 2, 2 + td));
    const label = "today " + ["Jan", "Feb", "Mar", "Apr", "May", "Jun"][date.getUTCMonth()] + " " + date.getUTCDate();
    const lx = Math.min(cols - label.length - 1, tx + 2);
    g.text(lx, 0, label, "b");
    const overall = TASKS.reduce((a, [, s, d]) => a + (d ? clamp((today - s) / d) * d : 0), 0) / TASKS.reduce((a, [, , d]) => a + d, 0);
    g.text(1, rows - 1, "overall", "1");
    const bw = 12, n = Math.round(overall * bw);
    for (let k = 0; k < bw; k++) g.set(9 + k, rows - 1, k < n ? "█" : "░", k < n ? "7" : "2");
    g.text(22, rows - 1, Math.round(overall * 100) + "%", "0");
    return g.frame();
  };
}
