/* donut-chart: a ring chart filling up clockwise with a big percentage in the middle. */
import { Grid, palette, TAU, clamp, bigText, gradient } from "../lib/kit.js";

const RING = gradient(["#2ea043", "#7ee787", "#d2ffb0"], 8);   // 0-7
export const meta = {
  slug: "donut-chart",
  name: "Donut Chart",
  category: "live-data",
  note: "A ring chart filling clockwise to its target with the percentage counting up in the middle.",
  tags: ["donut", "chart", "progress", "dashboard", "loader"],
  cols: 64, rows: 24, fps: 24,
  palette: palette([...RING, "#e6edf3", "#8b949e", "#2a3038", "#30363d", "#ffa657", "#79c0ff"]),
};

const GOALS = [[0.73, "storage used", "73.0 GB of 100 GB"], [0.91, "tests passing", "1,822 of 2,002"], [0.46, "sprint done", "23 of 50 points"]];

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const cx = 21, cy = 11.5, R1 = 6.6, R2 = 10.6;
  return (t) => {
    g.clear();
    const P = 6;
    const idx = Math.floor(t / P) % GOALS.length;
    const [goal, label, sub] = GOALS[idx];
    const lt = t % P;
    const e = clamp(lt / 2.6);
    const ease = 1 - Math.pow(1 - e, 3);
    const out = clamp((lt - 5.4) / 0.6);
    const p = goal * ease * (1 - out);
    for (let y = 0; y < meta.rows; y++) for (let x = 0; x < 44; x++) {
      const dx = (x + 0.5 - cx) / 2, dy = y + 0.5 - cy;
      const r = Math.hypot(dx, dy);
      if (r < R1 || r > R2) continue;
      let a = Math.atan2(dx, -dy) / TAU;   // 0 at top, clockwise
      if (a < 0) a += 1;
      const edge = Math.min(r - R1, R2 - r);
      if (a <= p) {
        const k = Math.min(7, Math.floor((a / Math.max(p, 0.01)) * 6) + (edge > 1.2 ? 1 : 0));
        g.set(x, y, edge < 0.55 ? "▓" : "█", String(k));
      } else g.set(x, y, edge < 0.55 ? "░" : "▒", "a");
    }
    // tip marker
    if (p > 0.01) {
      const a = p * TAU, rm = (R1 + R2) / 2;
      g.set(Math.round(cx + Math.sin(a) * rm * 2 - 0.5), Math.round(cy - Math.cos(a) * rm - 0.5), "●", "8");
    }
    const pct = String(Math.round(p * 100)) + "%";
    const w = pct.length * 4 - 1;
    bigText(g, Math.round(cx - w / 2), Math.round(cy - 3), pct, "8");
    const lab = label;
    g.text(Math.round(cx - lab.length / 2), Math.round(cy + 3), lab, "9");
    // side panel
    const lx = 46;
    g.text(lx, 4, label, "8");
    g.text(lx, 5, sub, "9");
    g.hline(lx, lx + 16, 7, "─", "b");
    GOALS.forEach(([gv, l], i) => {
      const y = 9 + i * 3;
      const on = i === idx;
      g.text(lx, y, l, on ? "8" : "9");
      const bw = 12, n = Math.round((on ? p : gv) * bw);
      for (let k = 0; k < bw; k++) g.set(lx + k, y + 1, k < n ? "█" : "░", k < n ? (on ? "4" : "d") : "a");
      g.text(lx + bw + 1, y + 1, String(Math.round((on ? p : gv) * 100)).padStart(3) + "%", on ? "8" : "9");
    });
    return g.frame();
  };
}
