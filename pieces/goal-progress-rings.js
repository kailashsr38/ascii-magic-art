/* goal-progress-rings: four daily goal rings filling up through the day, each ticking to a check mark when met. */
import { Grid, palette, clamp, TAU } from "../lib/kit.js";

export const meta = {
  slug: "goal-progress-rings",
  name: "Daily Goal Rings",
  category: "live-data",
  note: "Four daily goal rings for steps, water, focus time and sleep filling up as the day goes on, each one closing with a check mark when its goal is met.",
  tags: ["progress", "rings", "goals", "habit", "dashboard", "widget"],
  cols: 88, rows: 22, fps: 20,
  palette: palette(["#e6edf3", "#8b949e", "#ff7b72", "#79c0ff", "#d2a8ff", "#7ee787", "#30363d", "#3a1a1a", "#142a44", "#2c2048", "#163a20", "#484f58"]),
};

const GOALS = [["Steps", 10000, "", 1.08, "2", "7"], ["Water", 2.5, " L", 0.92, "3", "8"], ["Focus", 4, " h", 1.15, "4", "9"], ["Sleep", 8, " h", 0.97, "5", "a"]];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const W = 22, cy = 9.5, RO = 9.5, RI = 6.5;
  const PER = 12;
  return (t) => {
    g.clear();
    const day = clamp((t % PER) / (PER - 2));
    const hour = 6 + day * 17;
    g.text(1, 0, "Today", "0");
    g.text(8, 0, String(Math.floor(hour)).padStart(2, "0") + ":" + String(Math.floor((hour % 1) * 60)).padStart(2, "0"), "1");
    let met = 0;
    GOALS.forEach(([name, goal, unit, reach, on, off], k) => {
      const cx = k * W + W / 2;
      // each goal climbs with its own rhythm through the day
      const shape = clamp(day + 0.06 * Math.sin(day * 9 + k * 2));
      const f = clamp(shape * reach, 0, 1.2);
      const done = f >= 1;
      if (done) met++;
      for (let y = 1; y < 19; y++) for (let x = cx - 11; x <= cx + 11; x++) {
        const dx = x + 0.5 - cx, dy = (y + 0.5 - cy) * 2;
        const r = Math.hypot(dx, dy);
        if (r > RO || r < RI) continue;
        let a = Math.atan2(dx, -dy) / TAU; if (a < 0) a += 1;
        const lit = a <= Math.min(1, f);
        g.set(x, y, lit ? "█" : "░", lit ? (done ? on : on) : off);
      }
      const val = goal >= 100 ? Math.round(f * goal).toLocaleString("en-US") : (f * goal).toFixed(1) + unit;
      const pct = Math.round(f * 100) + "%";
      if (done) g.text(cx - 1, Math.floor(cy) - 1, " ✓ ", on);
      g.text(Math.round(cx - pct.length / 2), Math.floor(cy) + (done ? 1 : 0), pct, "0");
      g.text(Math.round(cx - name.length / 2), 19, name, "0");
      const gl = val + " / " + (goal >= 100 ? goal.toLocaleString("en-US") : goal + unit);
      g.text(Math.round(cx - gl.length / 2), 20, gl, "1");
    });
    const m = met + " of 4 goals met";
    g.text(cols - m.length - 1, 0, m, met === 4 ? "5" : "1");
    return g.frame();
  };
}
