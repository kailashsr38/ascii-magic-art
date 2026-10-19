/* empty-reconnecting: signal bars climb on each retry, drop when it fails, then all go green when the link is back. */
import { Grid, palette } from "../lib/kit.js";

const pal = palette(["#e6edf3", "#8b949e", "#484f58", "#30363d", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#f2cc60", "#1f6feb", "#2ea043"]);
// 0 text, 1 muted, 2 dim, 3 border, 4 green, 5 blue, 6 orange, 7 red, 8 purple, 9 yellow, a deep blue, b deep green

export const meta = {
  slug: "empty-reconnecting",
  name: "Reconnecting Signal Bars",
  category: "empty-states",
  note: "Signal bars climb on each reconnect attempt, drop when it fails, and all turn green when the connection is back.",
  tags: ["empty-state", "network", "offline", "loader", "status"],
  cols: 56, rows: 20, fps: 24,
  palette: pal,
};

const fit = (s, w) => (s.length <= w ? s : s.slice(0, Math.max(0, w - 2)) + "..");
const HEIGHTS = [2, 3, 5, 6, 8];
const TRY = 3, TRIES = 3, BACK = 2.8, PERIOD = TRY * TRIES + BACK;

export default function create() {
  const W = meta.cols, H = meta.rows;
  const g = new Grid(W, H);
  const mid = (y, s, co) => { s = fit(s, W - 4); g.text(Math.floor((W - s.length) / 2), y, s, co); };
  const BW = 3, X0 = Math.floor((W - (HEIGHTS.length * (BW + 1) - 1)) / 2), BASE = 10;
  return (t) => {
    g.clear();
    g.box(0, 0, W, H, "round", "3");
    const lt = t % PERIOD;
    const attempt = Math.min(TRIES, Math.floor(lt / TRY) + 1);
    const at = lt - (attempt - 1) * TRY;
    const back = lt >= TRY * TRIES - 0.6;
    // how many bars are lit: climb, and on failed tries fall back down
    let lit;
    if (back) lit = 5;
    else if (at < 2.0) lit = Math.min(attempt + 1, Math.floor(at / 0.4) + 1);
    else lit = Math.max(0, Math.round((attempt + 1) * (1 - (at - 2.0) / 0.8)));
    HEIGHTS.forEach((h, i) => {
      const x = X0 + i * (BW + 1);
      for (let j = 0; j < h; j++) for (let k = 0; k < BW; k++) {
        const on = i < lit;
        g.set(x + k, BASE - j, on ? "█" : "░", on ? (back ? (j === h - 1 ? "4" : "b") : j === h - 1 ? "5" : "a") : "3");
      }
    });
    g.hline(X0 - 3, X0 + HEIGHTS.length * (BW + 1) + 1, BASE + 1, "▀", "3");
    if (!back && at >= 2.0) g.text(X0 + HEIGHTS.length * (BW + 1) + 1, 3, "✗", "7");
    if (back) g.text(X0 + HEIGHTS.length * (BW + 1) + 1, 3, "✓", "4");
    const dots = ".".repeat(1 + (Math.floor(t * 3) % 3)).padEnd(3);
    mid(13, back ? "Back online" : `Reconnecting${dots}`, back ? "4" : "0");
    mid(14, back ? "Your changes will sync in a moment." : `Attempt ${attempt} of 5  ·  looking for a network`, "1");
    mid(16, back ? "wifi: studio-5g  ·  signal strong" : "Working offline, nothing is lost", "2");
    return g.frame();
  };
}
