/* empty-rate-limited: an hourglass drains while a "try again in 30s" countdown ticks down, then the retry button wakes up. */
import { Grid, palette, clamp } from "../lib/kit.js";

const pal = palette(["#e6edf3", "#8b949e", "#484f58", "#30363d", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#f2cc60", "#d29922", "#9e6a03"]);
// 0 text, 1 muted, 2 dim, 3 border, 4 green, 5 blue, 6 orange, 7 red, 8 purple, 9 yellow, a amber, b dark amber

export const meta = {
  slug: "empty-rate-limited",
  name: "Rate Limit Hourglass",
  category: "empty-states",
  note: "An hourglass drains grain by grain as a try again in 30 seconds countdown ticks down, then the retry button wakes up.",
  tags: ["empty-state", "rate-limit", "error", "api", "countdown"],
  cols: 62, rows: 18, fps: 20,
  palette: pal,
};

const fit = (s, w) => (s.length <= w ? s : s.slice(0, Math.max(0, w - 2)) + "..");
const WAIT = 30, READY = 3, PERIOD = WAIT + READY;
const HW = [5, 4, 3, 2, 1];
const CAP = HW.reduce((a, h) => a + 2 * h + 1, 0);

export default function create() {
  const W = meta.cols, H = meta.rows;
  const g = new Grid(W, H);
  const CX = 13, TOP = 2;
  // pour n cells of sand into the rows in order, each row centred
  const fillRows = (rows, n, co) => {
    for (const [y, hw] of rows) {
      const w = 2 * hw + 1;
      if (n <= 0) break;
      const k = Math.min(w, Math.round(n));
      const x0 = CX - Math.floor(k / 2);
      for (let i = 0; i < k; i++) g.set(x0 + i, y, k < w ? "▄" : "█", co);
      n -= w;
    }
  };
  return (t) => {
    g.clear();
    g.box(0, 0, W, H, "round", "3");
    const lt = t % PERIOD, p = clamp(lt / WAIT), ready = lt >= WAIT;
    // frame of the glass
    g.hline(CX - 7, CX + 7, TOP, "▄", "b"); g.hline(CX - 7, CX + 7, TOP + 12, "▀", "b");
    HW.forEach((hw, r) => {
      g.set(CX - hw - 1, TOP + 1 + r, "╲", "1"); g.set(CX + hw + 1, TOP + 1 + r, "╱", "1");
      g.set(CX - hw - 1, TOP + 11 - r, "╱", "1"); g.set(CX + hw + 1, TOP + 11 - r, "╲", "1");
    });
    g.set(CX - 1, TOP + 6, ")", "1"); g.set(CX + 1, TOP + 6, "(", "1");
    for (let y = TOP + 1; y <= TOP + 11; y++) { g.set(CX - 7, y, "▐", "b"); g.set(CX + 7, y, "▌", "b"); }
    // sand: top drains from its upper rows, bottom piles up from the floor
    const top = HW.map((hw, r) => [TOP + 1 + r, hw]).reverse();
    const bottomRows = HW.map((hw, r) => [TOP + 11 - r, hw]);
    fillRows(top, (ready ? 0 : 1 - p) * CAP, "9");
    fillRows(bottomRows, (ready ? 1 : p) * CAP, "a");
    if (!ready) {
      g.set(CX, TOP + 6, "│", "9");
      const pile = TOP + 11 - Math.ceil(p * 5);
      for (let y = TOP + 7; y < pile; y++) g.set(CX, y, (Math.floor(t * 8) + y) % 2 ? "·" : "•", "9");
    }
    // copy on the right
    const X = 26, TW = W - X - 2;
    g.text(X, 3, fit("Too many requests", TW), "0");
    g.text(X, 4, fit("Limit: 60 requests a minute.", TW), "1");
    const secs = Math.max(0, Math.ceil(WAIT - lt));
    g.text(X, 6, ready ? "You can try again now.".padEnd(20) : `Try again in ${String(secs).padStart(2)}s`.padEnd(20), ready ? "4" : "6");
    const bw = TW - 5, n = Math.round(p * bw);
    g.text(X, 8, "█".repeat(n), ready ? "4" : "a"); g.text(X + n, 8, "░".repeat(bw - n), "3");
    g.text(X + bw + 1, 8, String(Math.round(p * 100)).padStart(3) + "%", "1");
    g.box(X, 10, 11, 3, "round", ready ? "5" : "3"); g.text(X + 2, 11, "Retry →", ready ? "5" : "2");
    g.text(X + 13, 11, "View limits", "2");
    g.text(X, 14, fit("HTTP 429  ·  resets every 60s", TW), "2");
    return g.frame();
  };
}
