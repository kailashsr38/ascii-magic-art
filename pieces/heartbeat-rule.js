/* heartbeat-rule: an ECG heartbeat trace swept across a rule like a bedside monitor. */
import { Grid, palette, gradient, KEYS } from "../lib/kit.js";

const GR = gradient(["#0f2a17", "#1b5e2e", "#2ea043", "#7ee787", "#d8ffe0", "#ffffff"], 12); // 0..11
const pal = palette([...GR, "#ff7b72", "#9a3b3b", "#8b949e"]);                                // c heart, d dim heart, e muted

export const meta = {
  slug: "heartbeat-rule",
  name: "Heartbeat Rule",
  category: "frames",
  note: "A green ECG heartbeat trace swept across the page like a bedside monitor, with a heart that beats on every spike.",
  tags: ["divider", "ecg", "heartbeat", "readme", "health", "monitor"],
  cols: 96, rows: 7, fps: 30,
  palette: pal,
};

const gs = (u, m, s) => Math.exp(-(((u - m) / s) ** 2));
const beat = (u) => 0.6 * gs(u, 0.15, 0.035) - 0.5 * gs(u, 0.3, 0.014) + 3.4 * gs(u, 0.34, 0.016) - 1.5 * gs(u, 0.385, 0.016) + 1.0 * gs(u, 0.6, 0.05);

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const X0 = 6, W = cols - X0, PER = 30, BASE = 4;
  const yAt = (x) => BASE - beat((((x - X0) / PER) % 1 + 1) % 1);
  // precompute the trace: for each column, a list of [row, char]
  const trace = [];
  for (let x = X0; x < cols; x++) {
    let lo = Infinity, hi = -Infinity;
    for (let s = 0; s <= 1; s += 0.125) { const y = yAt(x + s); if (y < lo) lo = y; if (y > hi) hi = y; }
    const r0 = Math.round(yAt(x)), r1 = Math.round(yAt(x + 1));
    const a = Math.round(lo), b = Math.round(hi);
    const cells = [];
    if (a === b) cells.push([a, "─"]);
    else if (b - a === 1 && r0 !== r1) cells.push([Math.min(r0, r1), r1 < r0 ? "╱" : "╲"], [Math.max(r0, r1), r1 < r0 ? "╱" : "╲"]);
    else for (let r = a; r <= b; r++) cells.push([r, "│"]);
    trace.push(cells);
  }
  const rCols = [];
  for (let x = X0; x < cols; x++) if (((x - X0) % PER) === Math.round(0.34 * PER)) rCols.push(x - X0);
  return (t) => {
    g.clear();
    const cur = (t * 30) % W;
    for (let i = 0; i < W; i++) {
      const age = (((cur - i) % W) + W) % W;
      if (age > W * 0.82) continue;                    // the gap ahead of the sweep
      const v = Math.max(0, 1 - age / (W * 0.82));
      const k = KEYS[Math.min(11, Math.floor(1 + v * v * 10))];
      for (const [r, ch] of trace[i]) g.set(X0 + i, r, ch, age < 1 ? KEYS[11] : k);
    }
    // heart beats as the sweep crosses each spike
    let since = 99;
    for (const rc of rCols) { const d = (((cur - rc) % W) + W) % W; if (d < since) since = d; }
    const hot = since < 4;
    g.set(2, 2, "♥", hot ? "c" : "d");
    if (hot) { g.set(1, 2, "·", "c"); g.set(3, 2, "·", "c"); }
    g.text(1, 4, "72", "e"); g.text(1, 5, "bpm", "e");
    return g.frame();
  };
}
