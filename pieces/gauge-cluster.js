/* gauge-cluster: a server dashboard of four arc gauges with needles swinging to live load readings. */
import { Grid, palette, noise2, clamp, TAU } from "../lib/kit.js";

export const meta = {
  slug: "gauge-cluster",
  name: "Server Gauge Cluster",
  category: "live-data",
  note: "A server dashboard of four arc gauges for CPU, memory, disk and network, the needles swinging to live readings with sparklines of the last minute underneath.",
  tags: ["gauge", "dashboard", "monitoring", "server", "data", "terminal"],
  cols: 96, rows: 24, fps: 20,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#f2cc60", "#ffa657", "#ff7b72", "#30363d", "#21262d", "#79c0ff", "#484f58"]),
};

const G4 = [["CPU", "%", 100, 0], ["Memory", "GB", 64, 1], ["Disk I/O", "MB/s", 500, 2], ["Network", "Mb/s", 1000, 3]];
const SPARK = "▁▂▃▄▅▆▇█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const W = 24, R = 10.2, CY = 12;
  const level = (k, tt) => clamp([0.35, 0.62, 0.25, 0.45][k] + 0.42 * (noise2(tt * 0.45, k * 11, 3) - 0.5) + 0.25 * Math.max(0, noise2(tt * 1.3, k * 4, 9) - 0.6));
  return (t) => {
    g.clear();
    g.text(1, 0, "web-03  ·  live", "0");
    g.text(cols - 21, 0, "uptime 41d 06:12:" + String(Math.floor(t) % 60).padStart(2, "0"), "1");
    G4.forEach(([name, unit, max, k]) => {
      const cx = k * W + W / 2;
      const v = level(k, t);
      // arc from 210 to -30 degrees
      for (let y = CY - Math.ceil(R / 2) - 1; y <= CY + 1; y++) for (let x = cx - R - 1; x <= cx + R + 1; x++) {
        const dx = x + 0.5 - cx, dy = (y + 0.5 - CY) * 2;
        const r = Math.hypot(dx, dy);
        if (r < R - 3.4 || r > R) continue;
        let a = Math.atan2(-dy, dx);
        if (a < -Math.PI / 2) a += TAU;
        const f = (Math.PI * 7 / 6 - a) / (Math.PI * 4 / 3);
        if (f < 0 || f > 1) continue;
        const co = f < 0.6 ? "2" : f < 0.8 ? "3" : f < 0.9 ? "4" : "5";
        g.set(x, y, f <= v ? "█" : "░", f <= v ? co : "6");
      }
      // ticks
      for (let q = 0; q <= 4; q++) {
        const a = Math.PI * 7 / 6 - (q / 4) * Math.PI * 4 / 3;
        g.set(Math.round(cx + Math.cos(a) * (R + 1.2) - 0.5), Math.round(CY - Math.sin(a) * (R + 1.2) / 2 - 0.5), "·", "9");
      }
      // needle
      const a = Math.PI * 7 / 6 - v * Math.PI * 4 / 3;
      for (let s = 0; s < R - 3.8; s += 0.4) {
        const x = cx + Math.cos(a) * s - 0.5, y = CY - (Math.sin(a) * s) / 2 - 0.5;
        g.set(Math.round(x), Math.round(y), s < 1 ? "●" : "•", "0");
      }
      const val = unit === "%" ? Math.round(v * max) + "%" : (v * max).toFixed(max > 100 ? 0 : 1) + " " + unit;
      g.text(Math.round(cx - val.length / 2), CY + 1, val, v > 0.8 ? "5" : "0");
      g.text(Math.round(cx - name.length / 2), CY + 2, name, "1");
      // sparkline of the last minute
      const sx = cx - 10;
      const hist = [];
      for (let i = 0; i < 20; i++) hist.push(level(k, t - (19 - i) * 0.6));
      const lo = Math.min(...hist) - 0.02, hi = Math.max(...hist) + 0.02;
      for (let i = 0; i < 20; i++) {
        const sv = (hist[i] - lo) / (hi - lo);
        g.set(sx + i, CY + 6, SPARK[Math.min(7, Math.floor(sv * 8))], i === 19 ? "0" : "8");
      }
      g.text(sx, CY + 7, "-60s", "9"); g.text(sx + 17, CY + 7, "now", "9");
      if (k < 3) g.vline((k + 1) * W, 2, rows - 2, "│", "7");
    });
    g.hline(0, cols - 1, 1, "─", "7");
    g.hline(0, cols - 1, rows - 2, "─", "7");
    const load = (level(0, t) * 4).toFixed(2);
    g.text(1, rows - 1, "load " + load + "  " + (level(0, t - 5) * 4).toFixed(2) + "  " + (level(0, t - 15) * 4).toFixed(2) + "   procs 312   threads 1,948", "1");
    return g.frame();
  };
}
