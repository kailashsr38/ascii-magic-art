/* candlestick-chart: price candles with wicks scrolling left, the newest one still forming. */
import { Grid, palette, rng, clamp } from "../lib/kit.js";

export const meta = {
  slug: "candlestick-chart",
  name: "Candlestick Chart",
  category: "live-data",
  note: "Green and red price candles with wicks scrolling left, the newest candle still forming against a live price line.",
  tags: ["candlestick", "trading", "chart", "finance", "dashboard"],
  cols: 78, rows: 23, fps: 20,
  palette: palette(["#e6edf3", "#8b949e", "#3fb950", "#f85149", "#21262d", "#30363d", "#79c0ff", "#0d1117", "#ffa657", "#1f6feb"]),
};

const N = 400;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(77);
  // a seeded random walk, closed into a loop so the price returns to its start
  const close = [];
  let p = 0, drift = 0;
  for (let i = 0; i < N; i++) {
    drift = drift * 0.85 + (r() - 0.5) * 0.45;
    p += drift + (r() - 0.5) * 1.1;
    close.push(p);
  }
  const fix = (close[N - 1] - close[0]) / N;
  const C = close.map((v, i) => 100 + v - fix * i);
  const O = C.map((v, i) => C[(i + N - 1) % N]);
  const H = C.map((v, i) => Math.max(v, O[i]) + r() * 1.8);
  const L = C.map((v, i) => Math.min(v, O[i]) - r() * 1.8);
  const VOL = C.map((v, i) => 0.3 + Math.abs(v - O[i]) * 0.25 + r() * 0.4);
  const X1 = cols - 11, PLOT_TOP = 2, PLOT_BOT = rows - 5;
  const NC = Math.floor((X1 + 1) / 2);
  return (t) => {
    g.clear();
    const per = 0.7;
    const k = Math.floor(t / per), frac = (t % per) / per;
    const first = k;
    const idx = (i) => (first + i) % N;
    // live candle is the last one; its close walks from open toward the real close
    const live = idx(NC - 1);
    const wig = Math.sin(t * 9) * 0.5 * (1 - frac);
    const liveC = O[live] + (C[live] - O[live]) * clamp(frac * 1.3) + wig;
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < NC; i++) { const j = idx(i); lo = Math.min(lo, L[j]); hi = Math.max(hi, H[j]); }
    lo -= 1; hi += 1;
    const toY = (v) => PLOT_TOP + (1 - (v - lo) / (hi - lo)) * (PLOT_BOT - PLOT_TOP);
    // grid and price axis
    for (let q = 0; q <= 4; q++) {
      const v = lo + (q / 4) * (hi - lo), y = Math.round(toY(v));
      for (let x = 0; x <= X1; x += 2) g.set(x, y, "·", "5");
      g.text(X1 + 3, y, v.toFixed(2), "1");
    }
    g.vline(X1 + 1, PLOT_TOP, rows - 2, "│", "5");
    g.hline(0, X1, PLOT_BOT + 1, "─", "5");
    for (let i = 0; i < NC; i++) {
      const j = idx(i), x = i * 2;
      const isLive = i === NC - 1;
      const o = O[j], c = isLive ? liveC : C[j];
      const h = isLive ? Math.max(o, c, O[j] + (H[j] - O[j]) * frac) : H[j];
      const l = isLive ? Math.min(o, c, O[j] - (O[j] - L[j]) * frac) : L[j];
      const up = c >= o, co = up ? "2" : "3";
      const yh = Math.round(toY(h)), yl = Math.round(toY(l));
      const yt = Math.round(toY(Math.max(o, c))), yb = Math.round(toY(Math.min(o, c)));
      for (let y = yh; y <= yl; y++) g.set(x, y, "│", co);
      if (yt === yb) g.set(x, yt, "━", co);
      else for (let y = yt; y <= yb; y++) g.set(x, y, "█", co);
      // volume bars
      const vh = Math.max(1, Math.round(VOL[j] * 2.2));
      for (let y = 0; y < Math.min(2, vh); y++) g.set(x, rows - 2 - y, y === vh - 1 || y === 1 ? "▄" : "█", up ? "2" : "3");
    }
    // live price line and tag
    const ly = Math.round(toY(liveC));
    for (let x = 0; x < X1; x += 3) if (g.get(x, ly) === " " || g.get(x, ly) === "·") g.set(x, ly, "╌", "6");
    const up = liveC >= O[live];
    g.text(X1 + 2, ly, " " + liveC.toFixed(2) + " ", up ? "2" : "3");
    g.set(X1 + 1, ly, "◄", up ? "2" : "3");
    // header
    const chg = ((liveC - C[idx(0)]) / C[idx(0)]) * 100;
    g.text(0, 0, "KVX/USD", "0");
    g.text(9, 0, "1m", "1");
    g.text(13, 0, "O " + O[live].toFixed(2), "1");
    g.text(23, 0, "H " + H[live].toFixed(2), "1");
    g.text(33, 0, "L " + L[live].toFixed(2), "1");
    g.text(43, 0, "C " + liveC.toFixed(2), up ? "2" : "3");
    g.text(54, 0, (chg >= 0 ? "+" : "") + chg.toFixed(2) + "%", chg >= 0 ? "2" : "3");
    const mins = 9 * 60 + 30 + k;
    for (let i = 0; i < NC; i += 10) {
      const m = mins - (NC - 1 - i);
      g.text(i * 2, rows - 1, `${Math.floor(m / 60) % 24}:${String(((m % 60) + 60) % 60).padStart(2, "0")}`, "1");
    }
    return g.frame();
  };
}
