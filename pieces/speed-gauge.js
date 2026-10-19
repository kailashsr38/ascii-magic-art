/* speed-gauge: a semicircular gauge with coloured bands, a swinging needle and a readout. */
import { Grid, palette, TAU, clamp, fbm, bigText } from "../lib/kit.js";

export const meta = {
  slug: "speed-gauge",
  name: "Speed Gauge",
  category: "live-data",
  note: "A semicircular speed test gauge with green to red bands and a needle swinging to the live reading.",
  tags: ["gauge", "speedometer", "dashboard", "meter", "hero"],
  cols: 66, rows: 23, fps: 30,
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#2ea043", "#7ee787", "#d29922", "#f2cc60", "#da3633", "#ff7b72", "#ffffff", "#79c0ff", "#161b22", "#1d4a2b", "#4d3c10", "#521f1f"]),
};

const MAX = 1000;

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const cx = 32.5, cy = 15, R1 = 9.5, R2 = 13;
  const band = (f) => (f < 0.5 ? ["3", "4"] : f < 0.78 ? ["5", "6"] : ["7", "8"]);
  return (t) => {
    g.clear();
    // speed test cycle: ramp, wobble near a plateau, fall back
    const P = 8, lt = t % P;
    const target = 0.62 + 0.18 * Math.sin(Math.floor(t / P) * 2.1);
    const up = clamp(lt / 1.6), down = clamp((lt - 6.6) / 1.2);
    const wob = (fbm(t * 1.3, 2, 3, 5) - 0.5) * 0.12;
    const v = clamp((1 - Math.pow(1 - up, 3)) * (target + wob * up) * (1 - down * down));
    // arc
    for (let y = 0; y <= cy + 1; y++) for (let x = 0; x < meta.cols; x++) {
      const dx = (x + 0.5 - cx) / 2, dy = cy - (y + 0.5);
      const r = Math.hypot(dx, dy);
      if (r < R1 || r > R2 || dy < -0.5) continue;
      const f = 1 - Math.atan2(Math.max(dy, 0), dx) / Math.PI;   // 0 left, 1 right
      const [dim, lit] = band(f);
      const edge = Math.min(r - R1, R2 - r);
      void dim;
      if (f <= v) g.set(x, y, edge < 0.6 ? "▓" : "█", lit);
      else g.set(x, y, edge < 0.6 ? "░" : "▒", f < 0.5 ? "c" : f < 0.78 ? "d" : "e");
    }
    // ticks and labels
    for (let k = 0; k <= 10; k++) {
      const f = k / 10, a = Math.PI * (1 - f);
      const rx = R1 - 1.2;
      g.set(Math.round(cx + Math.cos(a) * rx * 2 - 0.5), Math.round(cy - Math.sin(a) * rx - 0.5), k % 5 ? "·" : "•", "1");
      if (k % 2 === 0) {
        const s = String(k * 100), lr = R2 + 1.6;
        const lx = Math.round(cx + Math.cos(a) * lr * 2 - s.length / 2), ly = Math.round(cy - Math.sin(a) * lr * 0.95 - 0.5);
        g.text(lx, ly, s, "1");
      }
    }
    // needle
    const a = Math.PI * (1 - v), L = R1 - 2.2;
    const nx = cx - 0.5 + Math.cos(a) * L * 2, ny = cy - 0.5 - Math.sin(a) * L;
    g.line(cx - 0.5, cy - 0.5, nx, ny, "•", "9");
    g.set(Math.round(nx), Math.round(ny), "●", band(v)[1]);
    g.text(Math.round(cx) - 2, Math.round(cy) - 1, "(◆)", "0");
    // readout
    const mbps = Math.round(v * MAX);
    const s = String(mbps).padStart(3, "0");
    bigText(g, Math.round(cx) - 9, Math.round(cy) + 1, s, band(v)[1]);
    g.text(Math.round(cx) + 4, Math.round(cy) + 4, "Mbps", "1");
    g.text(1, 0, "download", "0");
    g.text(1, 1, lt < 6.6 ? "testing" + ".".repeat(1 + Math.floor(t * 3) % 3) : "done", lt < 6.6 ? "a" : "4");
    g.text(meta.cols - 14, 0, "ping   12 ms", "1");
    g.text(meta.cols - 14, 1, "jitter  3 ms", "1");
    g.hline(0, meta.cols - 1, meta.rows - 2, "─", "2");
    g.text(1, meta.rows - 1, "server", "1"); g.text(8, meta.rows - 1, "edge-ams-03", "0");
    g.text(26, meta.rows - 1, "peak", "1"); g.text(31, meta.rows - 1, String(Math.round((target + 0.06) * MAX)) + " Mbps", "0");
    g.text(46, meta.rows - 1, "upload", "1"); g.text(53, meta.rows - 1, "118 Mbps", "0");
    return g.frame();
  };
}
