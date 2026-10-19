/* calendar-year-heatmap: twelve small month calendars filling in day by day with activity, a year at a glance. */
import { Grid, palette, noise2, rng, clamp } from "../lib/kit.js";

export const meta = {
  slug: "calendar-year-heatmap",
  name: "Twelve Month Heatmap",
  category: "live-data",
  note: "Twelve little month calendars fill in day by day with workout minutes, darker squares for rest days and bright ones for big sessions, until the whole year is logged.",
  tags: ["calendar", "heatmap", "year", "habit", "dashboard", "data"],
  cols: 100, rows: 24, fps: 20,
  palette: palette(["#e6edf3", "#8b949e", "#21262d", "#0e4429", "#006d32", "#26a641", "#39d353", "#30363d", "#484f58", "#ffa657", "#79c0ff"]),
};

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(11);
  // minutes per day: weekly rhythm, seasonal swing, the odd streak and gap
  const mins = [];
  let start = 2;   // Jan 1 is a Wednesday (0 = Monday)
  for (let d = 0; d < 365; d++) {
    const wd = (start + d) % 7;
    const season = 0.6 + 0.4 * Math.sin((d / 365) * 6.28 - 1.2);
    const rest = wd === 6 || r() < 0.12 || noise2(d * 0.08, 1, 4) < 0.25;
    mins.push(rest ? 0 : Math.round((15 + r() * 55) * season + (wd === 5 ? 30 : 0)));
  }
  const lvl = (m) => (m === 0 ? 0 : m < 25 ? 1 : m < 45 ? 2 : m < 65 ? 3 : 4);
  const PER = 15, FILL = 12;
  return (t) => {
    g.clear();
    const ph = t % PER;
    const upto = Math.min(365, Math.floor((ph / FILL) * 365));
    let doy = 0, total = 0, active = 0, streak = 0, best = 0;
    for (let d = 0; d < upto; d++) { total += mins[d]; if (mins[d]) { active++; streak++; best = Math.max(best, streak); } else streak = 0; }
    g.text(1, 0, "Workout log 2025", "0");
    const sum = (total / 60).toFixed(0) + " h  ·  " + active + " active days  ·  best streak " + best;
    g.text(cols - sum.length - 1, 0, sum, "1");
    for (let m = 0; m < 12; m++) {
      const bx = 1 + (m % 6) * 16 + (m % 6 > 2 ? 2 : 0), by = 2 + Math.floor(m / 6) * 11;
      g.text(bx, by, MON[m], "0");
      g.text(bx, by + 1, "M T W T F S S", "8");
      const first = (start + doy) % 7;
      for (let i = 0; i < DAYS[m]; i++) {
        const d = doy + i, cell = first + i;
        const x = bx + (cell % 7) * 2, y = by + 2 + Math.floor(cell / 7);
        if (d < upto) g.set(x, y, "■", String(2 + lvl(mins[d])));
        else if (d === upto) g.set(x, y, "□", "9");
        else g.set(x, y, "·", "7");
      }
      doy += DAYS[m];
    }
    // legend
    g.text(cols - 26, rows - 1, "less", "1");
    for (let q = 0; q < 5; q++) g.set(cols - 21 + q * 2, rows - 1, "■", String(2 + q));
    g.text(cols - 10, rows - 1, "more", "1");
    if (upto < 365) {
      let d = upto, m = 0;
      while (d >= DAYS[m]) { d -= DAYS[m]; m++; }
      g.text(1, rows - 1, "logging " + MON[m] + " " + (d + 1) + "  ·  " + (mins[upto] || 0) + " min", "a");
    } else g.text(1, rows - 1, "year complete", "6");
    return g.frame();
  };
}
