/* box-plot-live: horizontal box plots of service latency, boxes and whiskers shifting as new samples arrive. */
import { Grid, palette, noise2, rng, clamp } from "../lib/kit.js";

export const meta = {
  slug: "box-plot-live",
  name: "Latency Box Plots",
  category: "live-data",
  note: "Horizontal box plots of response time for six services, the boxes, medians, whiskers and outliers shifting as each new window of samples arrives.",
  tags: ["boxplot", "latency", "chart", "monitoring", "dashboard", "data"],
  cols: 84, rows: 24, fps: 12,
  palette: palette(["#e6edf3", "#8b949e", "#79c0ff", "#7ee787", "#ffa657", "#d2a8ff", "#56d4dd", "#ff7b72", "#30363d", "#484f58", "#1f3a5a", "#1e4428", "#4a2e10", "#3a2c5a", "#103a3c", "#4a1c1c"]),
};

const SVC = [["auth", 38, 0.3, "2", "a"], ["search", 120, 0.45, "3", "b"], ["checkout", 210, 0.35, "4", "c"],
  ["profile", 60, 0.25, "5", "d"], ["images", 160, 0.6, "6", "e"], ["payments", 260, 0.3, "7", "f"]];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const X0 = 13, X1 = cols - 12, MAX = 600;
  const sx = (ms) => X0 + Math.round((Math.min(ms, MAX) / MAX) * (X1 - X0));
  return (t) => {
    g.clear();
    const win = Math.floor(t * 1.5);
    g.text(1, 0, "Response time by service", "0");
    g.text(cols - 26, 0, "window " + String(win % 1000).padStart(3, "0") + " · 500 samples", "1");
    for (let ms = 0; ms <= MAX; ms += 100) {
      const x = sx(ms);
      for (let y = 2; y < rows - 3; y++) g.set(x, y, "┊", "8");
      g.text(x - String(ms).length + 1, rows - 2, String(ms), "1");
    }
    g.text(X1 + 2, rows - 2, "ms", "1");
    g.hline(X0, X1, rows - 3, "─", "9");
    SVC.forEach(([name, base, spread, co, dim], k) => {
      const y = 3 + k * 3;
      // blend from the previous window toward this one so boxes glide
      const f = (t * 1.5) % 1, e = f * f * (3 - 2 * f);
      const at = (w) => {
        const drift = 1 + 0.35 * (noise2(w * 0.4, k * 7, 2) - 0.5) + (k === 4 ? 0.5 * Math.max(0, noise2(w * 0.3, 3, 8) - 0.6) : 0);
        const m = base * drift, s = spread * (0.8 + 0.4 * noise2(w * 0.5, k, 6));
        return [m * Math.exp(-2.2 * s), m * Math.exp(-0.7 * s), m, m * Math.exp(0.75 * s), m * Math.exp(2.4 * s)];
      };
      const a = at(win), b = at(win + 1);
      const q = a.map((v, i) => v + (b[i] - v) * e);
      const [lo, q1, md, q3, hi] = q.map(sx);
      g.text(1, y, name, "0");
      g.text(1, y + 1, "p50 " + Math.round(q[2]), "1");
      g.hline(lo, q1 - 1, y, "─", co);
      g.hline(q3 + 1, hi, y, "─", co);
      g.set(lo, y, "├", co); g.set(hi, y, "┤", co);
      for (let x = q1; x <= q3; x++) { g.set(x, y - 1, "▄", dim); g.set(x, y, "█", dim); g.set(x, y + 1, "▀", dim); }
      g.set(q1, y, "▐", co); g.set(q3, y, "▌", co);
      g.set(md, y - 1, "┬", "0"); g.set(md, y, "┃", "0"); g.set(md, y + 1, "┴", "0");
      // outliers from this window
      const r = rng(win * 31 + k);
      const n = 1 + Math.floor(r() * 3);
      for (let i = 0; i < n; i++) {
        const ms = q[4] * (1.15 + r() * 0.9);
        const x = sx(ms);
        g.set(x, y, ms > MAX ? "►" : "•", ms > MAX * 0.8 ? "7" : co);
      }
      const p99 = Math.round(q[4]);
      g.text(cols - 10, y, "p99 " + String(p99).padStart(4), p99 > 450 ? "7" : "1");
    });
    return g.frame();
  };
}
