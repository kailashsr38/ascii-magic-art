/* histogram: samples pouring into a distribution histogram, bars rising and settling into a bell. */
import { Grid, palette, rng, clamp, gradient } from "../lib/kit.js";

const BAR = gradient(["#1f6feb", "#79c0ff", "#d2a8ff", "#f778ba"], 10);  // 0-9
export const meta = {
  slug: "histogram",
  name: "Histogram",
  category: "live-data",
  note: "Samples pouring into a histogram, the bars rising and settling into a bell curve with live stats.",
  tags: ["histogram", "distribution", "statistics", "chart", "dashboard"],
  cols: 76, rows: 24, fps: 24,
  palette: palette([...BAR, "#e6edf3", "#8b949e", "#30363d", "#ffa657", "#7ee787"]),
};

const BINS = 22, TOTAL = 2400;
const EIGHTH = " ▁▂▃▄▅▆▇█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(5);
  const samples = [];
  for (let i = 0; i < TOTAL; i++) {
    const u = Math.max(1e-9, r()), v = r();
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(6.2831853 * v);
    samples.push(5 + z * 1.1 + (r() < 0.12 ? 1.6 : 0));
  }
  const LO = 0.5, HI = 10.5;
  const binOf = (v) => Math.floor(((v - LO) / (HI - LO)) * BINS);
  // cumulative counts per bin for each sample index, every 20 samples
  const STEP = 20, snaps = [];
  const cur = new Array(BINS).fill(0);
  for (let i = 0; i <= TOTAL; i++) {
    if (i % STEP === 0) snaps.push(cur.slice());
    if (i < TOTAL) { const b = binOf(samples[i]); if (b >= 0 && b < BINS) cur[b]++; }
  }
  const final = snaps[snaps.length - 1];
  const FMAX = Math.max(...final);
  const X0 = 7, BW = 2, GAP = 1, Y1 = rows - 4, PH = Y1 - 3;
  return (t) => {
    g.clear();
    const P = 10, lt = t % P;
    const prog = clamp(lt / 6.5);
    const eased = prog * prog * (3 - 2 * prog);
    const fade = clamp((lt - 9.3) / 0.7);
    const n = Math.round(eased * TOTAL);
    const snap = snaps[Math.floor(n / STEP)];
    const scaleMax = Math.max(FMAX * 0.35, Math.max(...snap)) * 1.05;
    // axes
    for (let k = 0; k <= 4; k++) {
      const y = Y1 - Math.round((k / 4) * PH);
      g.text(0, y, String(Math.round((k / 4) * scaleMax)).padStart(4), "b");
      for (let x = X0; x < X0 + BINS * (BW + GAP); x += 2) g.set(x, y, "┈", "c");
      g.set(X0 - 1, y, "┤", "b");
    }
    g.vline(X0 - 1, 3, Y1 - 1, "│", "b");
    g.hline(X0 - 1, X0 + BINS * (BW + GAP), Y1 + 1, "─", "b");
    g.set(X0 - 1, Y1 + 1, "└", "b");
    let sum = 0, cnt = 0;
    for (let b = 0; b < BINS; b++) {
      const h = (snap[b] / scaleMax) * PH * (1 - fade);
      const full = Math.floor(h), part = Math.floor((h - full) * 8);
      const x = X0 + b * (BW + GAP);
      const co = String(Math.min(9, Math.floor(Math.abs(b - BINS / 2) / (BINS / 2) * 10)));
      for (let k = 0; k < full; k++) for (let i = 0; i < BW; i++) g.set(x + i, Y1 - k, "█", co);
      if (part) for (let i = 0; i < BW; i++) g.set(x + i, Y1 - full, EIGHTH[part], co);
      if (b % 3 === 0) g.text(x, Y1 + 2, (LO + ((b + 0.5) / BINS) * (HI - LO)).toFixed(1), "b");
      const mid = LO + ((b + 0.5) / BINS) * (HI - LO);
      sum += mid * snap[b]; cnt += snap[b];
    }
    // the falling sample
    if (prog < 1 && n < TOTAL) {
      for (let k = 0; k < 3; k++) {
        const s = samples[Math.min(TOTAL - 1, n + k * 7)];
        const b = binOf(s);
        if (b >= 0 && b < BINS) g.set(X0 + b * (BW + GAP) + (k & 1), 2 + ((Math.floor(t * 20) + k * 3) % 3), "•", "d");
      }
    }
    const mean = cnt ? sum / cnt : 0;
    const mx = X0 + Math.round(((mean - LO) / (HI - LO)) * BINS * (BW + GAP));
    if (cnt) for (let y = 3; y <= Y1; y += 2) if (g.get(mx, y) === " " || g.get(mx, y) === "┈") g.set(mx, y, "╎", "d");
    g.text(1, 0, "response size", "a");
    g.text(15, 0, "(kB)", "b");
    const sx = cols - 22;
    g.text(sx, 0, "n", "b"); g.text(sx + 2, 0, String(Math.round(n * (1 - fade))).padStart(5), "a");
    g.text(sx + 9, 0, "mean", "b"); g.text(sx + 14, 0, mean.toFixed(2), "d");
    g.hline(0, cols - 1, 1, "─", "c");
    return g.frame();
  };
}
