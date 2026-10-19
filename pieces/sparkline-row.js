/* sparkline-row: a panel of labelled sparklines with live values and deltas. */
import { Grid, palette, fbm } from "../lib/kit.js";

export const meta = {
  slug: "sparkline-row",
  name: "Sparkline Panel",
  category: "live-data",
  note: "Six labelled sparklines scrolling with their live values, trend arrows and a range bar.",
  tags: ["sparkline", "dashboard", "metrics", "readme", "terminal"],
  cols: 70, rows: 17, fps: 12,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#56d4dd", "#30363d", "#f2cc60"]),
};

const BARS = "▁▂▃▄▅▆▇█";
const METRICS = [
  ["cpu", "%", 10, 95, 1, "3"],
  ["memory", " GB", 4, 15.5, 1, "6"],
  ["requests", "/s", 800, 2600, 0, "2"],
  ["errors", "/m", 0, 40, 0, "5"],
  ["latency", " ms", 40, 220, 0, "4"],
  ["queue", "", 0, 480, 0, "7"],
];

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const N = 36;
  const val = (m, s) => (fbm(s * 0.11, m * 5.1, 3, 11 + m) - 0.5) * 2.8 + 0.5;
  return (t) => {
    g.clear();
    g.box(0, 0, meta.cols, meta.rows, "round", "8");
    g.text(2, 0, " system overview ", "0");
    g.text(meta.cols - 17, 0, " last 6 min ", "1");
    g.text(meta.cols - 5, 0, t % 1 < 0.5 ? "●" : "○", "2");
    const s0 = Math.floor(t * 3);
    METRICS.forEach(([name, unit, lo, hi, dp, co], m) => {
      const y = 2 + m * 2;
      g.text(2, y, name.padEnd(10), "1");
      let last = 0, prev = 0, mn = 1, mx = 0;
      for (let i = 0; i < N; i++) {
        const v = Math.max(0, Math.min(1, val(m, s0 + i)));
        mn = Math.min(mn, v); mx = Math.max(mx, v);
        g.set(13 + i, y, BARS[Math.min(7, Math.floor(v * 8))], i === N - 1 ? "0" : co);
        prev = last; last = v;
      }
      const cur = lo + last * (hi - lo);
      const txt = cur.toFixed(dp) + unit;
      g.text(51, y, txt.padStart(9), "0");
      const up = last >= prev;
      const bad = (m === 3 || m === 4 || m === 5) ? up : false;
      g.text(61, y, up ? "↑" : "↓", up ? (bad ? "5" : "2") : (bad ? "2" : "4"));
      // min/max range indicator
      const rx = 63, rw = 5;
      for (let i = 0; i < rw; i++) g.set(rx + i, y, "─", "8");
      g.set(rx + Math.round(mn * (rw - 1)), y, "╴", "1");
      g.set(rx + Math.round(mx * (rw - 1)), y, "╶", "1");
      g.set(rx + Math.round(last * (rw - 1)), y, "●", co);
    });
    g.hline(1, meta.cols - 2, 14, "─", "8");
    const up = 99.9 + (Math.sin(t * 0.2) > 0 ? 0.07 : 0.05);
    g.text(2, 15, "uptime", "1"); g.text(9, 15, up.toFixed(2) + "%", "2");
    g.text(20, 15, "hosts", "1"); g.text(26, 15, "12/12", "0");
    g.text(34, 15, "alerts", "1"); g.text(41, 15, Math.sin(t * 0.5) > 0.6 ? "1 warn" : "none", Math.sin(t * 0.5) > 0.6 ? "9" : "2");
    g.text(51, 15, "refresh 1s", "1");
    return g.frame();
  };
}
