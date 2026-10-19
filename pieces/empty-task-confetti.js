/* empty-task-confetti: a checklist ticks itself off and confetti bursts out behind the card. */
import { Grid, palette, clamp, rng } from "../lib/kit.js";

const pal = palette(["#e6edf3", "#8b949e", "#484f58", "#30363d", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#f2cc60", "#56d4dd"]);
// 0 text, 1 muted, 2 dim, 3 border, 4 green, 5 blue, 6 orange, 7 red, 8 purple, 9 yellow, a teal

export const meta = {
  slug: "empty-task-confetti",
  name: "Task Done Confetti",
  category: "empty-states",
  note: "A three item checklist ticks itself off and a burst of confetti rains down around the card.",
  tags: ["empty-state", "success", "tasks", "celebration", "app"],
  cols: 56, rows: 20, fps: 24,
  palette: pal,
};

const fit = (s, w) => (s.length <= w ? s : s.slice(0, Math.max(0, w - 2)) + "..");
const ITEMS = ["Write the changelog", "Tag the release", "Notify the team"];
const TICKS = [0.6, 1.2, 1.8];
const PERIOD = 6.5, BURST = 2.0;
const BITS = "▪▫•◆▀▄";

export default function create() {
  const W = meta.cols, H = meta.rows;
  const g = new Grid(W, H);
  const S = (x, y, c, co) => { x = Math.round(x); y = Math.round(y); if (x >= 1 && y >= 1 && x < W - 1 && y < H - 1) g.set(x, y, c, co); };
  const mid = (y, s, co) => { s = fit(s, W - 4); g.text(Math.floor((W - s.length) / 2), y, s, co); };
  const r = rng(77);
  const conf = Array.from({ length: 110 }, () => ({
    x: 2 + r() * 52, v: 3.5 + r() * 4, spin: r() * 6, c: "456789a"[Math.floor(r() * 7)], d: r() * 1.6, sw: 0.6 + r() * 1.4,
  }));
  const CX = 13, CW = 30, CY = 2, CH = 7;
  return (t) => {
    g.clear();
    g.box(0, 0, W, H, "round", "3");
    const lt = t % PERIOD;
    const done = lt > PERIOD - 0.5 ? 0 : TICKS.filter((k) => lt >= k).length;
    // confetti, behind the card
    const tb = lt - BURST;
    if (tb > 0) for (const p of conf) {
      const tau = tb - p.d;
      if (tau <= 0) continue;
      const y = 1 + p.v * tau;
      if (y > H - 2) continue;
      S(p.x + Math.sin(tau * 3 + p.spin) * p.sw, y, BITS[Math.floor(tau * 5 + p.spin) % BITS.length], p.c);
    }
    // card
    g.fill(CX, CY, CW, CH, " ");
    g.box(CX, CY, CW, CH, "round", done === 3 ? "4" : "2");
    g.text(CX + 2, CY + 1, "Ship v2.4 release", "0");
    g.text(CX + CW - 7, CY + 1, `${done}/3`, done === 3 ? "4" : "1");
    ITEMS.forEach((s, i) => {
      const ok = i < done;
      g.text(CX + 2, CY + 3 + i, ok ? "[✓]" : "[ ]", ok ? "4" : "2");
      g.text(CX + 6, CY + 3 + i, fit(s, CW - 8), ok ? "1" : "0");
    });
    // progress
    const bw = CW, n = Math.round((done / 3) * bw);
    g.text(CX, 10, "━".repeat(n), "4"); g.text(CX + n, 10, "━".repeat(bw - n), "3");
    mid(13, done === 3 ? "Task complete!" : "Almost there", "0");
    mid(14, done === 3 ? "3 of 3 subtasks done, nice work" : `${done} of 3 subtasks done`, "1");
    const label = "Next task →", bw2 = label.length + 4, bx = Math.floor((W - bw2) / 2);
    g.fill(bx, 16, bw2, 3, " ");
    g.box(bx, 16, bw2, 3, "round", "5");
    g.text(bx + 2, 17, label, "5");
    return g.frame();
  };
}
