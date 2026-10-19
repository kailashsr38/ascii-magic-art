/* bar-chart-race: horizontal bars racing and reordering by value, year by year. */
import { Grid, palette, noise2, bigText, clamp, smooth } from "../lib/kit.js";

export const meta = {
  slug: "bar-chart-race",
  name: "Bar Chart Race",
  category: "live-data",
  note: "Ten city bars racing year by year, swapping places as their populations grow.",
  tags: ["chart", "race", "dashboard", "data", "hero"],
  cols: 76, rows: 25, fps: 20,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#56d4dd", "#f2cc60", "#f778ba", "#a5d6ff", "#bbe58c", "#484f58", "#30363d"]),
};

const CITIES = [
  ["Tokyo", 34, 0.10], ["Delhi", 18, 0.95], ["Shanghai", 16, 0.80], ["Dhaka", 11, 1.10], ["Cairo", 13, 0.55],
  ["Lagos", 7, 1.60], ["Mumbai", 17, 0.45], ["Sao Paulo", 18, 0.30], ["Mexico City", 19, 0.25], ["Karachi", 10, 1.00],
];
const COLS = "23456789ab";
const PART = " ▏▎▍▌▋▊▉";
const Y0 = 2000, YEARS = 24, STEP = 0.9;

function value(i, yr) {
  const [, base, gr] = CITIES[i];
  const p = yr / YEARS;
  return base * (1 + gr * p) + 2.2 * (noise2(yr * 0.35, i * 7.3, 3) - 0.5);
}
function ranks(yr) {
  const v = CITIES.map((_, i) => value(i, yr));
  const order = v.map((_, i) => i).sort((a, b) => v[b] - v[a]);
  const r = new Array(v.length);
  order.forEach((idx, k) => (r[idx] = k));
  return r;
}

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const rk = [];
  for (let y = 0; y <= YEARS; y++) rk.push(ranks(y));
  const LABEL = 14, BAR0 = 15, BARW = 50;
  return (t) => {
    g.clear();
    const loop = t % (YEARS * STEP + 3);
    const yr = Math.min(YEARS, loop / STEP);
    const yi = Math.floor(yr), f = smooth(clamp((yr - yi) / 0.6));
    const vals = CITIES.map((_, i) => value(i, yr));
    const max = Math.max(...vals) * 1.08;
    g.text(1, 0, "Largest cities by population", "0");
    g.text(30, 0, "(millions)", "1");
    g.hline(0, meta.cols - 1, 1, "─", "d");
    // vertical gridlines
    for (let k = 0; k <= 4; k++) {
      const vx = BAR0 + Math.round(((k * 10) / max) * BARW);
      if (vx < BAR0 + BARW) { g.vline(vx, 2, 22, "┊", "d"); g.text(vx, 23, String(k * 10), "1"); }
    }
    const order = CITIES.map((_, i) => i).sort((a, b) => {
      const pa = lerpR(rk, a, yi, f), pb = lerpR(rk, b, yi, f);
      return pb - pa;
    });
    for (const i of order) {
      const pos = lerpR(rk, i, yi, f);
      const y = 2 + Math.round(pos * 2);
      const v = vals[i];
      const w = (v / max) * BARW;
      const full = Math.floor(w), part = Math.floor((w - full) * 8);
      g.text(LABEL - CITIES[i][0].length, y, CITIES[i][0], pos < 0.5 ? "0" : "1");
      for (let x = 0; x < full; x++) g.set(BAR0 + x, y, "█", COLS[i]);
      if (part) g.set(BAR0 + full, y, PART[part], COLS[i]);
      g.text(BAR0 + full + 1, y, " " + v.toFixed(1) + " ", "0");
      g.text(0, y, String(Math.round(pos) + 1).padStart(2), "1");
    }
    const yearS = String(Y0 + yi);
    for (let yy = 15; yy <= 22; yy++) for (let x = meta.cols - 19; x < meta.cols; x++) g.set(x, yy, " ");
    bigText(g, meta.cols - 17, 16, yearS, "c");
    g.text(meta.cols - 17, 22, "year", "1");
    return g.frame();
  };
}
function lerpR(rk, i, yi, f) {
  const a = rk[yi][i], b = rk[Math.min(rk.length - 1, yi + 1)][i];
  return a + (b - a) * f;
}
