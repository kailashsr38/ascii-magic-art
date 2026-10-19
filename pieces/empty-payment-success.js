/* empty-payment-success: a card slides in, a processing spinner runs, then a green tick badge pops and the amount counts up. */
import { Grid, palette, clamp } from "../lib/kit.js";

const pal = palette(["#e6edf3", "#8b949e", "#484f58", "#30363d", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#f2cc60", "#2ea043", "#a371f7", "#6e40c9"]);
// 0 text, 1 muted, 2 dim, 3 border, 4 green, 5 blue, 6 orange, 7 red, 8 purple, 9 yellow, a deep green, b violet, c deep violet

export const meta = {
  slug: "empty-payment-success",
  name: "Payment Success Card",
  category: "empty-states",
  note: "A bank card slides in, a spinner processes the charge, then a green tick pops and the amount counts up.",
  tags: ["empty-state", "payment", "success", "checkout", "billing"],
  cols: 60, rows: 20, fps: 24,
  palette: pal,
};

const fit = (s, w) => (s.length <= w ? s : s.slice(0, Math.max(0, w - 2)) + "..");
const ease = (v) => { v = clamp(v); return v * v * (3 - 2 * v); };
const PERIOD = 7, OK = 1.9;
const CHECK = [[-3, 0], [-1, 1], [3, -1]];

export default function create() {
  const W = meta.cols, H = meta.rows;
  const g = new Grid(W, H);
  const S = (x, y, c, co) => { x = Math.round(x); y = Math.round(y); if (x >= 1 && y >= 1 && x < W - 1 && y < H - 1) g.set(x, y, c, co); };
  const T = (x, y, s, co) => { for (let i = 0; i < s.length; i++) S(x + i, y, s[i], co); };
  const mid = (y, s, co) => { s = fit(s, W - 4); g.text(Math.floor((W - s.length) / 2), y, s, co); };
  const card = (x, y) => {
    const w = 25, h = 10;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const edge = j === 0 || j === h - 1 || i === 0 || i === w - 1;
      const ch = j === 0 ? (i === 0 ? "╭" : i === w - 1 ? "╮" : "─") : j === h - 1 ? (i === 0 ? "╰" : i === w - 1 ? "╯" : "─") : edge ? "│" : (i + j * 2) % 7 === 0 ? "·" : " ";
      S(x + i, y + j, ch, edge ? "b" : "c");
    }
    T(x + 2, y + 1, "DEBIT", "1"); T(x + w - 6, y + 1, ")))", "1");
    T(x + 2, y + 3, "▄▄▄▄", "9"); T(x + 2, y + 4, "█▀▀█", "9");
    T(x + 2, y + 6, "•••• •••• •••• 4242", "0");
    T(x + 2, y + 8, "S. RIVERA", "1"); T(x + w - 7, y + 8, "09/28", "1");
  };
  return (t) => {
    g.clear();
    g.box(0, 0, W, H, "round", "3");
    const lt = t % PERIOD;
    const inn = ease(lt / 0.6), out = ease((lt - (PERIOD - 0.6)) / 0.6);
    const ok = lt >= OK && lt < PERIOD - 0.6;
    // badge or spinner on the right
    const BX = 44, BY = 6;
    if (ok) {
      const a = lt - OK, sc = a < 0.15 ? a / 0.15 * 1.15 : a < 0.3 ? 1.15 - (a - 0.15) / 0.15 * 0.15 : 1;
      const rx = 6.5 * sc, ry = 3.4 * sc;
      for (let y = BY - 4; y <= BY + 4; y++) for (let x = BX - 8; x <= BX + 8; x++) {
        const d = Math.hypot((x - BX) / rx, (y - BY) / ry);
        if (d < 1) S(x, y, d > 0.85 ? "▓" : "█", d > 0.85 ? "a" : "4");
      }
      if (sc >= 1) for (let s = 0; s < 2; s++) {
        const [ax, ay] = CHECK[s], [bx, by] = CHECK[s + 1];
        for (let i = 0; i <= 12; i++) { const u = i / 12; S(BX + ax + (bx - ax) * u, BY + ay + (by - ay) * u, "█", "0"); }
      }
    } else if (lt > 0.6 && lt < OK) {
      for (let k = 0; k < 3; k++) {
        const hop = Math.max(0, Math.sin(lt * 9 - k * 0.9));
        S(BX - 3 + k * 3, BY - Math.round(hop * 1.4), "●", "5");
      }
    }
    // card slides in from the left, out to the right
    card(Math.round(-25 + inn * 30 + out * 60), 2);
    const amt = ok ? Math.min(48, (lt - OK) / 0.6 * 48) : 0;
    const s = "$" + amt.toFixed(2).padStart(5, " ");
    if (ok) g.text(BX - Math.floor(s.length / 2), 12, s, "0");
    mid(14, ok ? "Payment successful" : "Processing payment...", ok ? "4" : "0");
    mid(15, ok ? "Receipt sent to sam@example.com" : "Please keep this window open.", "1");
    mid(17, ok ? "View receipt  ·  Done" : "Secured with 3-D check", ok ? "5" : "2");
    return g.frame();
  };
}
