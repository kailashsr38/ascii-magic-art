/* calendar-month: a month calendar with event dots and a selection hopping between days. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "calendar-month",
  name: "Calendar Month",
  category: "screens",
  note: "A month calendar with coloured event dots, today marked, and a selection hopping between days with an agenda panel.",
  tags: ["calendar", "schedule", "app", "dashboard", "date"],
  cols: 84, rows: 22, fps: 12,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60"]),
};

// October 2026 starts on a Thursday (Mon-first column 3)
const START = 3, DAYS = 31, TODAY = 18;
const EV = {
  1: [["09:00", "Quarter kickoff", "3"]],
  2: [["14:00", "Design review", "6"]],
  5: [["10:00", "Sprint planning", "2"], ["16:00", "1:1 with Maya", "4"]],
  7: [["12:30", "Lunch with Dev", "4"]],
  8: [["11:00", "Customer call, Northwind", "3"]],
  9: [["15:00", "Release v1.42", "5"]],
  12: [["10:00", "Sprint planning", "2"]],
  14: [["09:30", "Board prep", "9"], ["13:00", "Hiring sync", "6"]],
  15: [["18:00", "Team dinner", "4"]],
  16: [["15:00", "Release v1.43", "5"]],
  19: [["10:00", "Sprint planning", "2"], ["14:00", "Security audit", "5"], ["16:00", "1:1 with Maya", "4"]],
  21: [["11:00", "Launch rehearsal", "6"]],
  22: [["09:00", "Product launch", "5"], ["17:00", "Launch party", "9"]],
  23: [["10:00", "Launch retro", "3"]],
  24: [["All day", "Team offsite", "2"]],
  26: [["10:00", "Sprint planning", "2"]],
  28: [["13:00", "Investor update", "9"]],
  30: [["15:00", "Release v1.44", "5"], ["18:30", "Halloween social", "4"]],
};
const PATH = [18, 19, 20, 21, 22, 15, 8, 9, 16, 23, 24, 17, 10, 3, 2, 9, 14, 21, 28, 29, 30, 23, 22, 19];
const WD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const STEP = 1.1;

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  const CW = 7, CH = 3, GX = 1, GY = 4;
  const pos = (d) => { const i = d - 1 + START; return [GX + (i % 7) * CW, GY + Math.floor(i / 7) * CH]; };
  return (t) => {
    g.clear();
    const sel = PATH[Math.floor(t / STEP) % PATH.length];
    g.box(0, 0, W, H, "round", "7");
    g.text(2, 1, "October 2026", "0");
    g.text(16, 1, "←  →", "1");
    g.text(36, 1, "Month", "3"); g.text(43, 1, "Week", "1");
    g.hline(1, W - 2, 2, "─", "8");
    WD.forEach((d, i) => g.text(GX + i * CW + 2, 3, d, i > 4 ? "7" : "1"));
    // grid lines
    for (let r = 0; r <= 5; r++) for (let x = GX; x <= GX + 7 * CW; x++) g.set(x, GY + r * CH, (x - GX) % CW === 0 ? "┼" : "─", "8");
    for (let r = 0; r < 5; r++) for (let c = 0; c <= 7; c++) for (let k = 1; k < CH; k++) g.set(GX + c * CW, GY + r * CH + k, "│", "8");
    for (let d = 1; d <= DAYS; d++) {
      const [x, y] = pos(d);
      const wk = (d - 1 + START) % 7 > 4;
      const isT = d === TODAY;
      if (isT) { g.set(x + 1, y + 1, "●", "4"); }
      g.text(x + 2 + (d < 10 ? 1 : 0), y + 1, String(d), isT ? "4" : d === sel ? "0" : wk ? "7" : "1");
      const ev = EV[d] || [];
      ev.forEach((e, j) => g.set(x + 2 + j * 2, y + 2, "•", e[2]));
    }
    // selection box
    const [sx, sy] = pos(sel);
    g.box(sx, sy, CW + 1, CH + 1, "heavy", "3");
    // agenda panel
    const AX = GX + 7 * CW + 3;
    g.vline(AX - 2, 3, H - 2, "│", "8");
    const wd = WD[(sel - 1 + START) % 7];
    g.text(AX, 4, `${wd} ${sel} October`, "0");
    g.text(AX, 5, sel === TODAY ? "Today" : sel < TODAY ? `${TODAY - sel} days ago` : `in ${sel - TODAY} days`, sel === TODAY ? "4" : "1");
    const ev = EV[sel] || [];
    if (!ev.length) g.text(AX, 7, "No events", "7");
    ev.forEach(([tm, title, c], j) => {
      const y = 7 + j * 3;
      g.set(AX, y, "▌", c); g.set(AX, y + 1, "▌", c);
      g.text(AX + 2, y, title.slice(0, W - AX - 4), "0");
      g.text(AX + 2, y + 1, tm, "1");
    });
    g.text(AX, H - 3, "+ New event", "3");
    return g.frame();
  };
}
