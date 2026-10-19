/* pie-chart: a round pie chart, corrected for tall cells, slowly rotating with a legend. */
import { Grid, palette, TAU, clamp } from "../lib/kit.js";

export const meta = {
  slug: "pie-chart",
  name: "Pie Chart",
  category: "live-data",
  note: "A round pie chart of traffic sources turning slowly, each slice lifting out in turn beside its legend.",
  tags: ["pie", "chart", "dashboard", "analytics", "readme"],
  cols: 72, rows: 26, fps: 20,
  palette: palette([
    "#e6edf3", "#8b949e", "#30363d",
    "#79c0ff", "#a5d6ff", "#7ee787", "#b4f1be", "#ffa657", "#ffc895", "#d2a8ff", "#e4cfff", "#ff7b72", "#ffaba5",
  ]),
};

const SLICES = [["Organic search", 0.38], ["Direct", 0.22], ["Referral", 0.16], ["Social", 0.14], ["Email", 0.10]];
const BASE = "3579b", HI = "468ac";

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const cx = 22, cy = 12.5, R = 11.2;
  const starts = [];
  let acc = 0;
  for (const [, f] of SLICES) { starts.push(acc); acc += f; }
  return (t) => {
    g.clear();
    const rot = t * 0.25;
    const active = Math.floor(t / 2.5) % SLICES.length;
    const lift = clamp(Math.min((t % 2.5) / 0.4, (2.5 - (t % 2.5)) / 0.4));
    const mid = (starts[active] + SLICES[active][1] / 2) * TAU + rot;
    const ox = Math.cos(mid) * 1.1 * lift, oy = Math.sin(mid) * 1.1 * lift;
    for (let y = 0; y < meta.rows; y++) for (let x = 0; x < 46; x++) {
      for (let pass = 0; pass < 2; pass++) {
        const sx = pass ? ox : 0, sy = pass ? oy : 0;
        const dx = (x + 0.5 - cx) / 2 - sx, dy = y + 0.5 - cy - sy;
        const r = Math.hypot(dx, dy);
        if (r > R) continue;
        let a = (Math.atan2(dy, dx) - rot) / TAU;
        a -= Math.floor(a);
        let k = 0;
        while (k < SLICES.length - 1 && a >= starts[k + 1]) k++;
        if ((k === active) !== (pass === 1)) continue;
        // edge between slices or at the rim
        const fromEdge = Math.min(a - starts[k], starts[k] + SLICES[k][1] - a) * TAU * r;
        const rim = R - r;
        let ch = "█";
        if (fromEdge < 0.22) ch = " ";
        else if (rim < 0.7) ch = "▓";
        g.set(x, y, ch, k === active ? HI[k] : BASE[k]);
      }
    }
    // legend
    const lx = 50;
    g.text(lx, 2, "Traffic sources", "0");
    g.text(lx, 3, "last 30 days", "1");
    g.hline(lx, lx + 20, 4, "─", "2");
    SLICES.forEach(([name, f], k) => {
      const y = 6 + k * 2;
      const on = k === active;
      g.text(lx, y, "■", on ? HI[k] : BASE[k]);
      g.text(lx + 2, y, name, on ? "0" : "1");
      g.text(lx + 17, y, (Math.round(f * 100) + "%").padStart(4), on ? HI[k] : "0");
      if (on) g.text(lx - 2, y, "►", HI[k]);
    });
    g.hline(lx, lx + 20, 17, "─", "2");
    g.text(lx, 18, "visits", "1");
    g.text(lx + 12, 18, "184,302", "0");
    g.text(lx, 19, "selected", "1");
    const sel = Math.round(184302 * SLICES[active][1]).toLocaleString("en-US");
    g.text(lx + 21 - sel.length, 19, sel, HI[active]);
    return g.frame();
  };
}
