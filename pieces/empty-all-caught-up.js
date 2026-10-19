/* empty-all-caught-up: a ring and a checkmark draw themselves, pop a small burst, then rewind. */
import { Grid, palette, clamp, TAU } from "../lib/kit.js";

const pal = palette(["#e6edf3", "#8b949e", "#484f58", "#30363d", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#f2cc60", "#2ea043", "#1b4721"]);
// 0 text, 1 muted, 2 dim, 3 border, 4 green, 5 blue, 6 orange, 7 red, 8 purple, 9 yellow, a deep green, b darkest green

export const meta = {
  slug: "empty-all-caught-up",
  name: "All Caught Up Check",
  category: "empty-states",
  note: "A green ring and checkmark draw themselves stroke by stroke, pop a little burst and rewind.",
  tags: ["empty-state", "notifications", "success", "inbox", "app"],
  cols: 56, rows: 20, fps: 24,
  palette: pal,
};

const fit = (s, w) => (s.length <= w ? s : s.slice(0, Math.max(0, w - 2)) + "..");
const ease = (v) => { v = clamp(v); return v * v * (3 - 2 * v); };
const PERIOD = 6;
const CHECK = [[-4.5, 0], [-1.2, 2], [5, -2.2]];

export default function create() {
  const W = meta.cols, H = meta.rows;
  const g = new Grid(W, H);
  const S = (x, y, c, co) => { x = Math.round(x); y = Math.round(y); if (x >= 1 && y >= 1 && x < W - 1 && y < 13) g.set(x, y, c, co); };
  const mid = (y, s, co) => { s = fit(s, W - 4); g.text(Math.floor((W - s.length) / 2), y, s, co); };
  const CX = 28, CY = 6.5, RX = 10, RY = 4.4;
  const segLen = CHECK.slice(1).map((p, i) => Math.hypot(p[0] - CHECK[i][0], (p[1] - CHECK[i][1]) * 2));
  const total = segLen[0] + segLen[1];
  return (t) => {
    g.clear();
    g.box(0, 0, W, H, "round", "3");
    const lt = t % PERIOD;
    const out = ease((lt - 5.2) / 0.7);
    const ring = ease(lt / 1.0) * (1 - out);
    const tick = ease((lt - 1.0) / 0.7) * (1 - out);
    // ring, drawn clockwise from the top
    for (let y = 1; y < 13; y++) for (let x = CX - 13; x <= CX + 13; x++) {
      const dx = (x - CX) / RX, dy = (y - CY) / RY, d = Math.hypot(dx, dy);
      if (d < 0.78 || d > 1.16) continue;
      const a = ((Math.atan2(dx, -dy) / TAU) + 1) % 1;
      if (a > ring) { if (ring < 0.999) S(x, y, "·", "3"); continue; }
      S(x, y, d > 1.02 ? "▓" : "█", d > 1.02 ? "a" : "4");
    }
    // checkmark
    let rem = tick * total;
    for (let s = 0; s < 2 && rem > 0; s++) {
      const [ax, ay] = CHECK[s], [bx, by] = CHECK[s + 1];
      const f = Math.min(1, rem / segLen[s]); rem -= segLen[s];
      const steps = 24;
      for (let i = 0; i <= steps * f; i++) {
        const u = i / steps, x = CX + ax + (bx - ax) * u, y = CY + ay + (by - ay) * u;
        S(x, y, "█", "0"); S(x + 1, y, "█", "0");
      }
    }
    // burst of dots flying out of the ring
    const b = (lt - 1.7) / 1.3;
    if (b > 0 && b < 1) for (let k = 0; k < 12; k++) {
      const a = (k / 12) * TAU + 0.26, r = 1.15 + ease(b) * 0.55;
      S(CX + Math.sin(a) * RX * r, CY - Math.cos(a) * RY * r, b < 0.5 ? "•" : "·", k % 3 === 0 ? "9" : k % 3 === 1 ? "4" : "5");
    }
    mid(14, "You're all caught up", "0");
    mid(15, "No new notifications since 09:41.", "1");
    mid(17, "View earlier activity →", "5");
    return g.frame();
  };
}
