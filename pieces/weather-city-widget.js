/* weather-city-widget: a weather card that slides between cities, with live sky icons and hourly and weekly forecasts. */
import { Grid, palette, bigText } from "../lib/kit.js";

export const meta = {
  slug: "weather-city-widget",
  name: "Weather City Widget",
  category: "screens",
  note: "A weather widget that slides from city to city, each with an animated sky icon, hourly temperatures and a five day outlook.",
  tags: ["weather", "widget", "forecast", "app", "dashboard"],
  cols: 66, rows: 22, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60", "#a5d6ff"]),
};

// name, country, temp, cond, kind (0 sun,1 cloud,2 rain,3 snow), hi, lo, hourly, week
const CITIES = [
  ["Lisbon", "Portugal", 24, "Sunny", 0, 27, 18, [21, 22, 24, 25, 26, 25, 23, 21], [[0, 27], [0, 26], [1, 24], [2, 21], [0, 25]]],
  ["Oslo", "Norway", 6, "Light rain", 2, 8, 3, [4, 5, 6, 6, 7, 6, 5, 4], [[2, 8], [1, 9], [2, 7], [1, 10], [3, 2]]],
  ["Mumbai", "India", 31, "Partly cloudy", 1, 33, 26, [28, 29, 31, 32, 33, 32, 30, 29], [[1, 33], [2, 30], [2, 29], [1, 32], [0, 34]]],
  ["Reykjavik", "Iceland", -2, "Snow showers", 3, 0, -5, [-3, -2, -2, -1, 0, -1, -2, -4], [[3, 0], [3, -1], [1, 2], [1, 3], [3, -2]]],
];
const SEG = 5.5;
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const MINI = ["○", "≈", "/", "*"];
const MC = ["9", "1", "3", "a"];

function icon(g, x, y, kind, t) {
  if (kind === 0) {
    const r = ["  \\  |  /  ", "   .---.   ", "-- (   ) --", "   '---'   ", "  /  |  \\  "];
    r.forEach((s, i) => g.text(x, y + i, s, i % 4 === 0 || i === 2 ? "4" : "9"));
    const a = Math.floor(t * 2) % 2;
    if (a) { g.set(x + 1, y + 2, " "); g.set(x + 9, y + 2, " "); }
    return;
  }
  const dx = Math.round(Math.sin(t * 0.8) * 1.5);
  if (kind === 1) g.text(x + 7, y, "\\ | /", "9"), g.text(x + 8, y + 1, ".-.", "9");
  g.text(x + 1 + dx, y + 1, "  .--.", "0");
  g.text(x + 1 + dx, y + 2, ".(    ).", "0");
  g.text(x + 1 + dx, y + 3, "(___.__)_)", "1");
  if (kind >= 2) for (let i = 0; i < 4; i++) {
    const yy = y + 4 + Math.floor((t * 6 + i * 1.7) % 2);
    g.set(x + 2 + i * 2 + dx, yy, kind === 2 ? "/" : "*", kind === 2 ? "3" : "0");
  }
}

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  return (t) => {
    g.clear();
    const lt = t % (SEG * CITIES.length);
    const ci = Math.floor(lt / SEG), f = lt % SEG;
    const off = f < 0.4 ? Math.round((1 - f / 0.4) ** 2 * 30) : 0;
    const c = CITIES[ci];
    const x0 = 3 + off;
    g.text(x0, 2, c[0], "0"); g.text(x0 + c[0].length + 1, 2, "· " + c[1], "1");
    icon(g, x0, 4, c[4], t);
    const tc = c[2] >= 25 ? "4" : c[2] <= 0 ? "a" : "0";
    const tx = x0 + 15;
    const w = bigText(g, tx, 4, String(Math.abs(c[2])), tc);
    if (c[2] < 0) g.text(tx - 2, 6, "-", tc);
    g.text(tx + w, 4, "°C", tc);
    g.text(tx, 10, c[3], "0");
    g.text(tx, 11, `H ${c[5]}°  L ${c[6]}°`, "1");
    g.text(W - 20 + off, 4, "Humidity  " + (40 + ci * 13) + "%", "1");
    g.text(W - 20 + off, 5, "Wind      " + (8 + ci * 5) + " km/h", "1");
    g.text(W - 20 + off, 6, "UV        " + [7, 1, 9, 0][ci], "1");
    g.text(W - 20 + off, 7, "Feels     " + (c[2] - 1) + "°", "1");
    // hourly
    g.hline(1 + off, W - 2, 13, "─", "8");
    const hs = c[7], mn = Math.min(...hs), mx = Math.max(...hs);
    hs.forEach((v, i) => {
      const x = 3 + i * 8 + off;
      const lvl = mx === mn ? 2 : Math.round(((v - mn) / (mx - mn)) * 3);
      g.text(x, 14, String(9 + i * 2).padStart(2, "0") + ":00", "7");
      g.set(x + 1, 15, "▁▂▄▆█"[lvl + 1], tc);
      g.text(x + 2, 15, v + "°", "0");
    });
    g.hline(1 + off, W - 2, 16, "─", "8");
    c[8].forEach(([k, hi], i) => {
      const x = 3 + i * 13 + off;
      g.text(x, 17, DAYS[i], "1");
      g.text(x + 4, 17, MINI[k], MC[k]);
      g.text(x + 6, 17, hi + "°", "0");
      const bar = Math.max(1, Math.min(8, Math.round((hi + 6) / 5)));
      for (let b = 0; b < bar; b++) g.set(x + b, 18, "━", hi > 25 ? "4" : hi < 3 ? "a" : "3");
    });
    g.box(0, 0, W, H, "round", "7");
    g.text(2, 0, " Weather ", "0");
    CITIES.forEach((_, i) => g.set(W / 2 - 4 + i * 2, H - 1, i === ci ? "●" : "○", i === ci ? "0" : "7"));
    g.text(W - 14, 0, " 14:0" + (ci + 2) + " local ", "1");
    g.text(3, H - 2, "Updated 2 min ago", "7");
    g.text(W - 18, H - 2, "← swipe cities →", "7");
    return g.frame();
  };
}
