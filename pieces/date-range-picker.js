/* date-range-picker: a two month calendar where a check-in and check-out range is picked and the nights add up. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "date-range-picker",
  name: "Date Range Picker",
  category: "screens",
  note: "A two month calendar where a start date is clicked, the range stretches with the cursor and the night count updates.",
  tags: ["calendar", "date", "picker", "booking", "form", "app"],
  cols: 66, rows: 21, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60", "#2f5a8f"]),
};

// November starts on Sunday (offset 6 with Monday first), December on Tuesday (offset 1)
const MONTHS = [["November 2026", 30, 6], ["December 2026", 31, 1]];
const RUNS = [[[0, 12], [0, 19], [0, 17]], [[0, 26], [1, 4], [1, 2]]];
const SEG = 6.5;
const DOW = "Mo Tu We Th Fr Sa Su";

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  const ord = (m, d) => m * 100 + d;
  const cell = (m, d) => { const o = MONTHS[m][2] + d - 1; return [3 + m * 32 + (o % 7) * 4, 6 + Math.floor(o / 7) * 2]; };
  return (t) => {
    g.clear();
    const lt = t % (SEG * RUNS.length);
    const ri = Math.floor(lt / SEG), f = lt % SEG;
    const [s, overshoot, e] = RUNS[ri];
    const startSet = f > 1.0, endSet = f > 3.6;
    // hover moves from start to overshoot then back to end
    const idx = (p) => p[0] * 30 + p[1];
    const at = (i) => (i > 30 ? [1, i - 30] : [0, i]);
    let hover;
    if (f < 1.0) hover = s;
    else if (f < 2.6) hover = at(Math.round(idx(s) + ((f - 1.0) / 1.6) * (idx(overshoot) - idx(s))));
    else hover = at(Math.round(idx(overshoot) + Math.min(1, (f - 2.6) / 1.0) * (idx(e) - idx(overshoot))));
    const end = endSet ? e : startSet ? hover : null;
    const a = ord(...s), b = end ? ord(...end) : a;
    g.box(0, 0, W, H, "round", "7");
    g.text(2, 0, " Select dates ", "0");
    MONTHS.forEach(([name, days, off], m) => {
      const x0 = 3 + m * 32;
      g.text(x0 + Math.floor((27 - name.length) / 2), 2, name, "0");
      if (m === 0) g.text(x0, 2, "◄", "1"); else g.text(x0 + 26, 2, "►", "1");
      g.text(x0, 4, DOW, "7");
      for (let pass = 0; pass < 2; pass++) for (let d = 1; d <= days; d++) {
        const [x, y] = cell(m, d), o = ord(m, d);
        const isS = startSet && o === a, isE = end && startSet && o === b;
        const inR = startSet && o > a && o < b;
        const past = m === 0 && d < 9;
        if (pass === 0) { if (inR) g.fill(x - 1, y, 4, 1, "░", "a"); continue; }
        const ds = String(d).padStart(2);
        if (isS || isE) { g.set(x - 1, y, "[", "3"); g.set(x + 2, y, "]", "3"); g.text(x, y, ds, "9"); continue; }
        const c = inR ? "0" : past ? "8" : (o % 100 + MONTHS[m][2] - 1) % 7 >= 5 ? "1" : "0";
        g.text(x, y, ds, c);
      }
    });
    if (!endSet) { const [hx, hy] = cell(hover[0], hover[1]); g.set(hx + 1, hy + 1, "↖", "4"); }
    g.hline(1, W - 2, H - 5, "─", "8");
    const fmt = (p) => (p[0] ? "Dec " : "Nov ") + p[1];
    const nights = end ? idx(end) - idx(s) : 0;
    g.text(3, H - 4, "Check in", "1"); g.text(3, H - 3, startSet ? fmt(s) : "Add date", startSet ? "0" : "7");
    g.text(18, H - 4, "Check out", "1"); g.text(18, H - 3, endSet ? fmt(e) : "Add date", endSet ? "0" : "7");
    g.text(34, H - 4, "Nights", "1"); g.text(34, H - 3, startSet ? String(nights) : "-", startSet ? "4" : "7");
    g.box(W - 16, H - 4, 13, 3, "round", endSet ? "3" : "8");
    g.text(W - 13, H - 3, "Apply", endSet ? "0" : "7");
    return g.frame();
  };
}
