/* empty-no-results: a magnifier sweeps over empty result rows under a search box that found nothing. */
import { Grid, palette, clamp } from "../lib/kit.js";

const pal = palette(["#e6edf3", "#8b949e", "#484f58", "#30363d", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#f2cc60", "#1c2128"]);
// 0 text, 1 muted, 2 dim, 3 border, 4 green, 5 blue, 6 orange, 7 red, 8 purple, 9 yellow, a deep

export const meta = {
  slug: "empty-no-results",
  name: "No Search Results",
  category: "empty-states",
  note: "A magnifying glass sweeps over empty result rows beneath a search box that came up with nothing.",
  tags: ["empty-state", "search", "no-results", "app", "dashboard"],
  cols: 56, rows: 20, fps: 20,
  palette: pal,
};

const fit = (s, w) => (s.length <= w ? s : s.slice(0, Math.max(0, w - 2)) + "..");
const QUERY = "blue llama socks";
const PERIOD = 9;

export default function create() {
  const W = meta.cols, H = meta.rows;
  const g = new Grid(W, H);
  const S = (x, y, c, co) => { x = Math.round(x); y = Math.round(y); if (x >= 1 && y >= 1 && x < W - 1 && y < H - 1) g.set(x, y, c, co); };
  const mid = (y, s, co) => { s = fit(s, W - 4); g.text(Math.floor((W - s.length) / 2), y, s, co); };
  return (t) => {
    g.clear();
    g.box(0, 0, W, H, "round", "3");
    const lt = t % PERIOD;
    // search field, typing then holding, cleared at the end of the loop
    const n = lt < 1.6 ? Math.floor((lt / 1.6) * QUERY.length) : lt > PERIOD - 0.6 ? Math.floor(((PERIOD - lt) / 0.6) * QUERY.length) : QUERY.length;
    const FX = 9, FW = W - 18;
    g.box(FX, 1, FW, 3, "round", "2");
    g.text(FX + 2, 2, "○", "1"); g.set(FX + 3, 2, "╲", "1");
    const q = fit(QUERY.slice(0, n), FW - 18);
    g.text(FX + 5, 2, q, "0");
    if (Math.floor(t * 2.5) % 2 === 0) g.text(FX + 5 + q.length, 2, "▏", "5");
    if (lt > 1.8 && lt < PERIOD - 0.6) g.text(FX + FW - 12, 2, "0 results", "7");
    // placeholder rows that the lens passes over
    for (let r = 0; r < 4; r++) {
      const y = 6 + r * 2;
      g.text(12, y, "▪", "2");
      g.hline(14, 14 + 14 + ((r * 7) % 9), y, "─", "3");
      g.hline(36, 36 + 3 + ((r * 3) % 5), y, "─", "3");
    }
    // magnifier
    const cx = 28 + 11 * Math.sin(t * 0.8), cy = 9.1 + 0.9 * Math.sin(t * 1.6 + 0.6);
    const RX = 5.2, RY = 2.7;
    for (let y = Math.floor(cy - RY * 1.3); y <= Math.ceil(cy + RY * 1.3); y++) for (let x = Math.floor(cx - RX * 1.3); x <= Math.ceil(cx + RX * 1.3); x++) {
      const d = Math.hypot((x - cx) / RX, (y - cy) / RY);
      if (d < 0.74) S(x, y, " ", " ");
      else if (d < 1.2) S(x, y, d < 0.9 ? "▓" : "█", d < 0.95 ? "2" : "5");
    }
    S(cx, cy, "?", "6"); S(cx - 1, cy, " "); S(cx + 1, cy, " ");
    for (let i = 0; i < 5; i++) {
      const hx = cx + RX * 0.82 + i * 1.0, hy = cy + RY * 0.82 + i * 0.5;
      S(hx, hy, "█", i < 1 ? "1" : "6"); S(hx + 1, hy, "█", i < 1 ? "1" : "6");
    }
    // copy
    mid(15, `No results for "${QUERY}"`, "0");
    mid(16, "Try fewer words or check the spelling.", "1");
    mid(18, "Clear filters  ·  Browse all", "5");
    return g.frame();
  };
}
