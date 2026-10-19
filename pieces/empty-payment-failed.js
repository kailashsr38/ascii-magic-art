/* empty-payment-failed: a card tries to pay, gets declined, gives a gentle shake and shows a red cross. */
import { Grid, palette, clamp } from "../lib/kit.js";

const pal = palette(["#e6edf3", "#8b949e", "#484f58", "#30363d", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#f2cc60", "#da3633", "#56d4dd", "#1b4b5a"]);
// 0 text, 1 muted, 2 dim, 3 border, 4 green, 5 blue, 6 orange, 7 red, 8 purple, 9 yellow, a deep red, b teal, c deep teal

export const meta = {
  slug: "empty-payment-failed",
  name: "Payment Declined Shake",
  category: "empty-states",
  note: "A bank card tries to pay, the charge is declined, the card gives a gentle shake and a red cross appears.",
  tags: ["empty-state", "payment", "error", "checkout", "billing"],
  cols: 60, rows: 20, fps: 24,
  palette: pal,
};

const fit = (s, w) => (s.length <= w ? s : s.slice(0, Math.max(0, w - 2)) + "..");
const PERIOD = 6, FAIL = 1.4;

export default function create() {
  const W = meta.cols, H = meta.rows;
  const g = new Grid(W, H);
  const S = (x, y, c, co) => { x = Math.round(x); y = Math.round(y); if (x >= 1 && y >= 1 && x < W - 1 && y < H - 1) g.set(x, y, c, co); };
  const T = (x, y, s, co) => { for (let i = 0; i < s.length; i++) S(x + i, y, s[i], co); };
  const mid = (y, s, co) => { s = fit(s, W - 4); g.text(Math.floor((W - s.length) / 2), y, s, co); };
  const card = (x, y, bad) => {
    const w = 25, h = 10, ec = bad ? "7" : "b";
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const edge = j === 0 || j === h - 1 || i === 0 || i === w - 1;
      const ch = j === 0 ? (i === 0 ? "╭" : i === w - 1 ? "╮" : "─") : j === h - 1 ? (i === 0 ? "╰" : i === w - 1 ? "╯" : "─") : edge ? "│" : (i * 3 + j) % 8 === 0 ? "·" : " ";
      S(x + i, y + j, ch, edge ? ec : "c");
    }
    T(x + 2, y + 1, "CREDIT", "1"); T(x + w - 6, y + 1, ")))", "1");
    T(x + 2, y + 3, "▄▄▄▄", "9"); T(x + 2, y + 4, "█▀▀█", "9");
    T(x + 2, y + 6, "•••• •••• •••• 0019", "0");
    T(x + 2, y + 8, "S. RIVERA", "1"); T(x + w - 7, y + 8, "11/27", "1");
  };
  return (t) => {
    g.clear();
    g.box(0, 0, W, H, "round", "3");
    const lt = t % PERIOD;
    const bad = lt >= FAIL;
    const a = lt - FAIL;
    const dx = bad ? Math.sin(a * 34) * 2.2 * Math.exp(-a * 4.5) : 0;
    const BX = 44, BY = 6;
    if (bad) {
      const sc = Math.min(1, a / 0.2);
      const rx = 6.5 * sc, ry = 3.4 * sc;
      for (let y = BY - 4; y <= BY + 4; y++) for (let x = BX - 8; x <= BX + 8; x++) {
        const d = Math.hypot((x - BX) / rx, (y - BY) / ry);
        if (d < 1) S(x, y, d > 0.85 ? "▓" : "█", d > 0.85 ? "a" : "7");
      }
      if (sc >= 1) for (let i = -2; i <= 2; i++) { S(BX + i * 1.5, BY + i, "█", "0"); S(BX - i * 1.5, BY + i, "█", "0"); }
    } else {
      for (let k = 0; k < 3; k++) {
        const hop = Math.max(0, Math.sin(lt * 9 - k * 0.9));
        S(BX - 3 + k * 3, BY - Math.round(hop * 1.4), "●", "5");
      }
    }
    card(5 + Math.round(dx), 2, bad);
    if (bad) g.text(BX - 9, 12, "declined by issuer", "2");
    mid(14, bad ? "Payment declined" : "Processing payment...", bad ? "7" : "0");
    mid(15, bad ? "Your bank declined the charge. Try another card." : "Please keep this window open.", "1");
    const B1 = "Try again", B2 = "Use another card";
    const w1 = B1.length + 4, w2 = B2.length + 4, gap = 2, x1 = Math.floor((W - w1 - w2 - gap) / 2), x2 = x1 + w1 + gap;
    g.box(x1, 16, w1, 3, "round", bad ? "5" : "3"); g.text(x1 + 2, 17, B1, bad ? "5" : "2");
    g.box(x2, 16, w2, 3, "round", "3"); g.text(x2 + 2, 17, B2, bad ? "1" : "2");
    return g.frame();
  };
}
