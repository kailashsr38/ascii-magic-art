/* empty-session-expired: a sleepy wall clock with sweeping hands and drifting z's above a sign in again button. */
import { Grid, palette, TAU } from "../lib/kit.js";

const pal = palette(["#e6edf3", "#8b949e", "#484f58", "#30363d", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#f2cc60", "#a371f7", "#6e40c9", "#3b2e58"]);
// 0 text, 1 muted, 2 dim, 3 border, 4 green, 5 blue, 6 orange, 7 red, 8 purple, 9 yellow, a violet, b deep violet, c night

export const meta = {
  slug: "empty-session-expired",
  name: "Session Expired Clock",
  category: "empty-states",
  note: "A sleepy wall clock sweeps its hands while little z's drift up from it, above a sign in again button.",
  tags: ["empty-state", "session", "auth", "timeout", "app"],
  cols: 56, rows: 20, fps: 24,
  palette: pal,
};

const fit = (s, w) => (s.length <= w ? s : s.slice(0, Math.max(0, w - 2)) + "..");

export default function create() {
  const W = meta.cols, H = meta.rows;
  const g = new Grid(W, H);
  const S = (x, y, c, co) => { x = Math.round(x); y = Math.round(y); if (x >= 1 && y >= 1 && x < W - 1 && y < H - 1) g.set(x, y, c, co); };
  const mid = (y, s, co) => { s = fit(s, W - 4); g.text(Math.floor((W - s.length) / 2), y, s, co); };
  const CX = 26, CY = 6.5, RX = 9.5, RY = 4.7;
  const hand = (ang, len, co) => {
    for (let i = 0; i <= 20; i++) {
      const r = (i / 20) * len;
      S(CX + Math.sin(ang) * RX * r, CY - Math.cos(ang) * RY * r, "█", co);
    }
  };
  return (t) => {
    g.clear();
    g.box(0, 0, W, H, "round", "3");
    // face and rim
    for (let y = 1; y < 13; y++) for (let x = CX - 12; x <= CX + 12; x++) {
      const d = Math.hypot((x - CX) / RX, (y - CY) / RY);
      if (d < 0.86) S(x, y, " ");
      else if (d < 1.12) S(x, y, d > 1.0 ? "▓" : "█", d > 1.0 ? "b" : "a");
    }
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * TAU, r = 0.72;
      S(CX + Math.sin(a) * RX * r, CY - Math.cos(a) * RY * r, k % 3 === 0 ? "■" : "·", k % 3 === 0 ? "0" : "1");
    }
    // hands: minute sweeps a lap every 6 s, hour creeps
    hand((t / 6) * TAU, 0.6, "5");
    hand((t / 72) * TAU + 2.2, 0.4, "0");
    S(CX, CY, "●", "6");
    // z's drifting up and away
    for (let k = 0; k < 3; k++) {
      const a = (t / 2.4 + k / 3) % 1;
      const x = CX + 12 + a * 8 + Math.sin(a * 6 + k) * 0.8, y = CY - 1 - a * 5;
      S(x, y, a > 0.45 ? "Z" : "z", a > 0.75 ? "2" : a > 0.4 ? "1" : "0");
    }
    mid(14, "Your session expired", "0");
    mid(15, "You were signed out after 30 minutes away.", "1");
    const label = "Sign in again", bw = label.length + 4, bx = Math.floor((W - bw) / 2);
    g.box(bx, 16, bw, 3, "round", "5"); g.text(bx + 2, 17, label, "5");
    return g.frame();
  };
}
