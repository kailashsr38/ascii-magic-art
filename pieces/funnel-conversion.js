/* funnel-conversion: a signup funnel filling through the day, visitors dropping in at the top and trickling down to paid. */
import { Grid, palette, clamp } from "../lib/kit.js";

export const meta = {
  slug: "funnel-conversion",
  name: "Signup Funnel",
  category: "live-data",
  note: "A signup funnel counting up through the day, dots dropping in at the top and thinning out stage by stage from visits down to paid customers.",
  tags: ["funnel", "conversion", "chart", "dashboard", "analytics", "data"],
  cols: 80, rows: 24, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#79c0ff", "#56d4dd", "#7ee787", "#f2cc60", "#ffa657", "#30363d", "#484f58", "#ff7b72"]),
};

const ST = [["Visits", 1, "2"], ["Signed up", 0.204, "3"], ["Activated", 0.106, "4"], ["Started trial", 0.048, "5"], ["Paid", 0.0168, "6"]];
const DAY = 14;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const CX = 38, MAXW = 40;
  // funnel bar widths shrink less than the numbers so small stages stay visible
  const width = (k) => Math.round(MAXW * Math.pow(ST[k][1], 0.32));
  return (t) => {
    g.clear();
    const ph = (t % DAY) / DAY;
    const visits = Math.floor(48210 * clamp(ph * 1.08));
    const hour = Math.floor(ph * 24);
    g.text(1, 0, "Signup funnel", "0");
    g.text(16, 0, "today " + String(hour).padStart(2, "0") + ":" + String(Math.floor((ph * 24 * 60) % 60)).padStart(2, "0"), "1");
    g.hline(0, cols - 1, 1, "─", "7");
    ST.forEach(([name, rate, co], k) => {
      const y = 3 + k * 4;
      const w = width(k), x0 = CX - Math.floor(w / 2);
      const n = Math.floor(visits * rate);
      // the bar fills left to right as the count builds toward its usual end of day level
      const fill = w * clamp(ph * 1.08) / 2;
      for (let i = 0; i < w; i++) {
        const on = Math.abs(i + 0.5 - w / 2) < fill;
        g.set(x0 + i, y, on ? "█" : "░", on ? co : "7");
        g.set(x0 + i, y + 1, on ? "▀" : " ", on ? co : "7");
      }
      // funnel walls slope in to the next stage
      if (k < 4) {
        const w2 = width(k + 1);
        for (let d = 1; d <= 2; d++) {
          const f = d / 3, half = (w / 2) * (1 - f) + (w2 / 2) * f;
          g.set(Math.round(CX - half) - 1, y + 1 + d, "╲", "8");
          g.set(Math.round(CX + half), y + 1 + d, "╱", "8");
        }
      }
      g.text(1, y, name, "0");
      g.text(1, y + 1, n.toLocaleString("en-US"), co);
      const pct = k === 0 ? "100%" : ((rate / ST[k - 1][1]) * 100).toFixed(1) + "%";
      if (k > 0) {
        g.text(62, y - 2, "↓ " + pct, "1");
        g.text(70, y - 2, "drop " + (100 - parseFloat(pct)).toFixed(0) + "%", "9");
      }
      g.text(62, y, (rate * 100).toFixed(1).padStart(5) + "% of visits", "8");
    });
    // users falling through the funnel: each dot exits at its own stage
    for (let i = 0; i < 46; i++) {
      const seed = (i * 7919) % 101 / 101;
      const life = (t * 0.55 + i * 0.137) % 1;
      const stop = seed < 0.55 ? 0 : seed < 0.78 ? 1 : seed < 0.9 ? 2 : seed < 0.96 ? 3 : 4;
      const y = 2 + life * 19;
      const stage = Math.min(4, Math.floor((y - 2) / 4));
      const off = (((i * 13) % 9) - 4) * 0.12 * width(Math.min(4, stage));
      let x = CX + off * (1 - life * 0.3);
      if (stage > stop) {
        // dropped out: drift sideways and fade
        const out = (y - (3 + stop * 4)) * 2.2;
        x += off >= 0 ? out + width(stop) / 2 : -out - width(stop) / 2;
        if (x < 16 || x > 60) continue;
        g.set(x, y, "·", "8");
      } else if (g.get(Math.round(x), Math.floor(y)) !== "█") g.set(x, y, "•", "0");
    }
    return g.frame();
  };
}
