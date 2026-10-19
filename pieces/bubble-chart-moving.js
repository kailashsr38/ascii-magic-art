/* bubble-chart-moving: a bubble chart of income against life expectancy, the bubbles drifting decade by decade. */
import { Grid, palette, clamp, smooth, bigText } from "../lib/kit.js";

export const meta = {
  slug: "bubble-chart-moving",
  name: "Wealth and Health Bubbles",
  category: "live-data",
  note: "A bubble chart of income against life expectancy for twelve regions, each bubble sized by population and drifting up and to the right decade by decade.",
  tags: ["bubble", "scatter", "chart", "animated", "data", "hero"],
  cols: 88, rows: 30, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#79c0ff", "#7ee787", "#ffa657", "#ff7b72", "#d2a8ff", "#30363d", "#484f58", "#21262d", "#56d4dd"]),
};

// [label, colour, [income 1960, 2020], [life 1960, 2020], [pop 1960, 2020] (millions)]
const R = [
  ["East Asia", "5", [700, 16000], [44, 78], [800, 1600]], ["South Asia", "4", [600, 6500], [42, 70], [550, 1900]],
  ["W. Europe", "2", [9000, 45000], [69, 82], [250, 330]], ["N. America", "2", [15000, 60000], [70, 79], [200, 370]],
  ["Sub-Sahara", "3", [1200, 3800], [40, 62], [220, 1100]], ["Latin Am.", "6", [4000, 15000], [56, 75], [220, 650]],
  ["Mid. East", "a", [3000, 17000], [48, 74], [100, 450]], ["E. Europe", "2", [5000, 25000], [67, 75], [300, 330]],
  ["SE Asia", "5", [900, 11000], [50, 72], [200, 670]], ["Oceania", "6", [11000, 42000], [70, 82], [12, 42]],
  ["N. Africa", "a", [1500, 11000], [46, 74], [70, 240]], ["Central Asia", "4", [1800, 9000], [55, 71], [30, 75]],
];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const X0 = 6, X1 = cols - 6, Y0 = 1, Y1 = rows - 3;
  const lx = (inc) => X0 + ((Math.log10(inc) - 2.6) / (5 - 2.6)) * (X1 - X0);
  const ly = (life) => Y1 - ((life - 35) / (85 - 35)) * (Y1 - Y0);
  const PER = 14;
  return (t) => {
    g.clear();
    const ph = (t % PER) / PER;
    const p = smooth(clamp(ph / 0.85));
    const year = Math.round(1960 + p * 60);
    for (let inc of [1000, 10000, 100000]) {
      const x = Math.round(lx(inc));
      for (let y = Y0; y <= Y1; y++) if (g.get(x, y) === " ") g.set(x, y, "┊", "7");
      const s = inc >= 1000 ? "$" + inc / 1000 + "k" : "$" + inc;
      g.text(x - 1, Y1 + 1, s, "1");
    }
    for (let life = 40; life <= 80; life += 10) {
      const y = Math.round(ly(life));
      for (let x = X0; x <= X1; x += 2) if (g.get(x, y) === " ") g.set(x, y, "·", "7");
      g.text(0, y, String(life), "1");
    }
    // the year sits large and quiet behind the data, on a cleared patch of grid
    for (let y = Y1 - 7; y <= Y1 - 1; y++) for (let x = X1 - 22; x <= X1 - 3; x++) g.set(x, y, " ");
    bigText(g, X1 - 20, Y1 - 6, String(year), "9");
    g.text(X0, rows - 1, "income per person (log)", "1");
    g.text(0, 0, "life expectancy", "1");
    // bubbles, biggest first so small ones stay visible on top
    const B = R.map(([name, co, inc, life, pop]) => {
      const e = (a) => a[0] * Math.pow(a[1] / a[0], p);
      return { name, co, x: lx(e(inc)), y: ly(life[0] + (life[1] - life[0]) * (p + 0.04 * Math.sin(p * 9 + name.length))), r: Math.sqrt(e(pop)) * 0.11 + 0.9 };
    }).sort((a, b) => b.r - a.r);
    for (const b of B) {
      for (let y = Math.floor(b.y - b.r / 2 - 1); y <= b.y + b.r / 2 + 1; y++) for (let x = Math.floor(b.x - b.r - 1); x <= b.x + b.r + 1; x++) {
        const d = Math.hypot((x + 0.5 - b.x) / b.r, (y + 0.5 - b.y) / (b.r / 2));
        if (d < 1) g.set(x, y, d > 0.75 ? "▓" : "█", b.co);
      }
      g.set(b.x, b.y, "●", "0");
    }
    for (const b of B.slice().reverse()) {
      if (b.r < 1.6) continue;
      const x = Math.round(b.x + b.r + 1), y = Math.round(b.y);
      let free = x + b.name.length < cols;
      for (let i = -1; i <= b.name.length && free; i++) if (/[A-Za-z.]/.test(g.get(x + i, y))) free = false;
      if (free) g.text(x - 1, y, " " + b.name + " ", "0");
    }
    return g.frame();
  };
}
