/* stock-ticker: a scrolling ticker tape of made-up symbols with arrows, prices and changes. */
import { Grid, palette, fbm, rng } from "../lib/kit.js";

export const meta = {
  slug: "stock-ticker",
  name: "Stock Ticker",
  category: "live-data",
  note: "A market ticker tape of made-up symbols scrolling past with green and red arrows, prices and percent changes.",
  tags: ["ticker", "stocks", "market", "finance", "banner", "header"],
  cols: 100, rows: 9, fps: 30,
  palette: palette(["#e6edf3", "#8b949e", "#3fb950", "#f85149", "#30363d", "#f2cc60", "#79c0ff", "#161b22", "#d2a8ff"]),
};

const SYMS = ["QVRA", "LMNX", "ORBT", "KAEL", "ZYPH", "NOVQ", "TRXL", "HALO9", "VYNE", "BRQZ", "OXIM", "PLYX", "SOLQ", "FJRD", "MERQ", "UXIO"];
const INDEX = [["WORLD 500", 5214.6], ["TECH 100", 18322.4], ["SMALL CAP", 2094.8], ["GOLD", 2398.1], ["OIL", 78.42], ["10Y", 4.21], ["EUR/USD", 1.0832]];
const NEWS = [
  "ORBT beats quarterly estimates, shares jump in late trading",
  "central bank holds rates steady, signals patience",
  "KAEL announces 3-for-1 stock split",
  "chip shortage eases as new fabs come online",
  "ZYPH recalls batch of smart thermostats",
  "markets close mixed after a quiet session",
];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(21);
  const base = SYMS.map(() => 12 + r() * 380);
  const price = (i, t) => base[i] * (1 + (fbm(t * 0.05, i * 9.1, 3, 4) - 0.5) * 0.12);
  const open = (i) => base[i] * (1 + (fbm(0, i * 9.1, 3, 4) - 0.5) * 0.12 - 0.012 + (i % 3) * 0.01);
  // a lane: list of [text, colour] segments, scrolled by an offset
  const lane = (y, segs, offset) => {
    const len = segs.reduce((a, [s]) => a + s.length, 0);
    let x = -(((offset % len) + len) % len);
    while (x < cols) {
      for (const [s, co] of segs) { g.text(Math.floor(x), y, s, co); x += s.length; if (x >= cols) break; }
    }
  };
  return (t) => {
    g.clear();
    g.hline(0, cols - 1, 0, "━", "4");
    g.hline(0, cols - 1, 4, "─", "4");
    g.hline(0, cols - 1, 6, "─", "4");
    g.hline(0, cols - 1, 8, "━", "4");
    // lane 1: symbols
    const segs = [];
    SYMS.forEach((s, i) => {
      const p = price(i, t), o = open(i), ch = ((p - o) / o) * 100, up = ch >= 0;
      segs.push([s + " ", "0"], [p.toFixed(2) + " ", "0"], [(up ? "▲ " : "▼ ") + (up ? "+" : "") + ch.toFixed(2) + "%", up ? "2" : "3"], ["   │   ", "4"]);
    });
    lane(2, segs, t * 14);
    // sparkline row under the symbols: tiny trend dots moving with the tape
    // lane 2: indices, slower and opposite direction
    const iseg = [];
    INDEX.forEach(([n, v], i) => {
      const w = v * (1 + (fbm(t * 0.07, i * 3.7 + 50, 2, 8) - 0.5) * 0.01);
      const d = (fbm(t * 0.07, i * 3.7 + 50, 2, 8) - 0.5) * 2;
      iseg.push([n + " ", "6"], [w.toFixed(v < 10 ? 4 : 2) + " ", "0"], [(d >= 0 ? "↑" : "↓") + Math.abs(d).toFixed(2) + "%", d >= 0 ? "2" : "3"], ["  ·  ", "1"]);
    });
    lane(5, iseg, -t * 7);
    // lane 3: headlines
    const nseg = [];
    NEWS.forEach((n) => nseg.push(["■ ", "5"], [n, "1"], ["      ", "1"]));
    lane(7, nseg, t * 10);
    // fixed badge on the left of the main lane
    const clock = 9 * 3600 + 41 * 60 + Math.floor(t);
    const label = "   LIVE " + `${String(Math.floor(clock / 3600)).padStart(2, "0")}:${String(Math.floor(clock / 60) % 60).padStart(2, "0")}:${String(clock % 60).padStart(2, "0")} `;
    for (let y = 1; y <= 3; y++) for (let x = 0; x < label.length + 2; x++) g.set(x, y, " ");
    g.text(0, 2, label, "5");
    g.set(1, 2, t % 1 < 0.5 ? "●" : " ", "3");
    g.set(label.length, 2, "│", "4");
    g.text(0, 1, " markets", "1");
    g.text(0, 3, " open", "2");
    return g.frame();
  };
}
