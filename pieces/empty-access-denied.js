/* empty-access-denied: a padlock's shackle snaps shut with a little jolt above a request access button. */
import { Grid, palette, clamp } from "../lib/kit.js";

const BODY = ["#9e6a03", "#bb8009", "#d29922", "#e3b341", "#f2cc60"];
const pal = palette(["#e6edf3", "#8b949e", "#484f58", "#30363d", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#f2cc60", ...BODY, "#c9d1d9", "#6e7681", "#161b22"]);
// 0 text, 1 muted, 2 dim, 3 border, 4 green, 5 blue, 6 orange, 7 red, 8 purple, 9 yellow, a-e body dark to light, f steel, g dark steel, h hole

export const meta = {
  slug: "empty-access-denied",
  name: "Access Denied Padlock",
  category: "empty-states",
  note: "A brass padlock's shackle drops and snaps shut with a small jolt above a polite request access button.",
  tags: ["empty-state", "permissions", "403", "security", "app"],
  cols: 56, rows: 22, fps: 24,
  palette: pal,
};

const fit = (s, w) => (s.length <= w ? s : s.slice(0, Math.max(0, w - 2)) + "..");
const PERIOD = 5.5, SHUT = 1.4;

export default function create() {
  const W = meta.cols, H = meta.rows;
  const g = new Grid(W, H);
  const S = (x, y, c, co) => { x = Math.round(x); y = Math.round(y); if (x >= 1 && y >= 1 && x < W - 1 && y < H - 1) g.set(x, y, c, co); };
  const mid = (y, s, co) => { s = fit(s, W - 4); g.text(Math.floor((W - s.length) / 2), y, s, co); };
  return (t) => {
    g.clear();
    g.box(0, 0, W, H, "round", "3");
    const lt = t % PERIOD;
    const lift = lt < SHUT ? 2 : lt < SHUT + 0.2 ? 2 * (1 - (lt - SHUT) / 0.2) : lt > PERIOD - 0.8 ? 2 * clamp((lt - (PERIOD - 0.8)) / 0.5) : 0;
    const a = lt - SHUT - 0.2;
    const jolt = a > 0 && a < 0.5 ? Math.round(Math.sin(a * 40) * Math.exp(-a * 6) * 1.6) : 0;
    const CX = 28 + jolt, BY = 9, BH = 6, BW = 17;
    // shackle: upper half ellipse plus two posts into the body
    const sy = 6 - Math.round(lift), RX = 5.2, RY = 3.6;
    for (let y = sy - 4; y < BY; y++) for (let x = CX - 8; x <= CX + 8; x++) {
      const dx = (x - CX) / RX;
      let on = false;
      if (y <= sy) { const d = Math.hypot(dx, (y - sy) / RY); on = d > 0.66 && d < 1.12; }
      else on = Math.abs(dx) > 0.66 && Math.abs(dx) < 1.12;
      if (on) S(x, y, "█", x < CX ? "f" : "g");
    }
    // body, lit from the top left
    for (let j = 0; j < BH; j++) for (let i = 0; i < BW; i++) {
      const k = clamp(0.95 - j * 0.12 - i * 0.025);
      const ch = j === 0 ? "▄" : j === BH - 1 ? "▀" : "█";
      S(CX - 8 + i, BY + j, ch, "abcde"[Math.min(4, Math.floor(k * 5))]);
    }
    // keyhole
    S(CX, BY + 2, "●", "h"); S(CX, BY + 3, "█", "h"); S(CX - 1, BY + 3, "▗", "h"); S(CX + 1, BY + 3, "▖", "h");
    if (a > 0 && a < 0.7) g.text(CX + 10, BY - 1, "click", "2");
    mid(16, "You don't have access to this page", "0");
    mid(17, "Ask a workspace admin to give you the Editor role.", "1");
    const label = "Request access", bw = label.length + 4, bx = Math.floor((W - bw) / 2);
    g.box(bx, 18, bw, 3, "round", "5"); g.text(bx + 2, 19, label, "5");
    return g.frame();
  };
}
