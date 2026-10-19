/* empty-welcome-door: a front door swings open and warm light spills out across the floor, a first-run welcome. */
import { Grid, palette, clamp } from "../lib/kit.js";

const pal = palette(["#e6edf3", "#8b949e", "#484f58", "#30363d", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#f2cc60", "#5c3a1e", "#7d5230", "#a06c3f", "#fff3c4", "#ffd97a", "#e8a33d", "#8a5a14", "#3a2a12"]);
// 0 text, 1 muted, 2 dim, 3 border, 4 green, 5 blue, 6 orange, 7 red, 8 purple, 9 yellow, a-c wood dark to light, d-h light bright to dim

export const meta = {
  slug: "empty-welcome-door",
  name: "Welcome Door Opening",
  category: "empty-states",
  note: "A front door swings open and warm light spills out across the floor, a friendly first run welcome.",
  tags: ["empty-state", "welcome", "onboarding", "first-run", "hero"],
  cols: 56, rows: 23, fps: 24,
  palette: pal,
};

const fit = (s, w) => (s.length <= w ? s : s.slice(0, Math.max(0, w - 2)) + "..");
const ease = (v) => { v = clamp(v); return v * v * (3 - 2 * v); };
const PERIOD = 6.5;

export default function create() {
  const W = meta.cols, H = meta.rows;
  const g = new Grid(W, H);
  const S = (x, y, c, co) => { x = Math.round(x); y = Math.round(y); if (x >= 1 && y >= 1 && x < W - 1 && y < H - 1) g.set(x, y, c, co); };
  const mid = (y, s, co) => { s = fit(s, W - 4); g.text(Math.floor((W - s.length) / 2), y, s, co); };
  const DX = 21, DW = 14, DY = 1, DH = 11, IX = DX + 1, IW = DW - 2, IY = DY + 1, IH = DH - 2;
  return (t) => {
    g.clear();
    g.box(0, 0, W, H, "round", "3");
    const lt = t % PERIOD;
    const o = ease((lt - 0.4) / 1.3) * (1 - ease((lt - 5.1) / 1.0)) * 0.78;
    // the room behind: warm light, brightest in the middle
    for (let j = 0; j < IH; j++) for (let i = 0; i < IW; i++) {
      const c = Math.abs(i + 0.5 - IW / 2) / (IW / 2) + (j > IH - 3 ? 0.5 : 0);
      S(IX + i, IY + j, "█", c < 0.45 ? "d" : c < 0.9 ? "e" : "f");
    }
    // spill on the floor, widening with distance
    const FY = DY + DH;
    g.hline(2, W - 3, FY, "▀", "3");
    for (let r = 0; r < 3; r++) {
      const half = (IW / 2 + r * 4) * o, cx = IX + IW / 2;
      for (let x = Math.round(cx - half); x < Math.round(cx + half); x++) S(x, FY + r, r === 0 ? "▀" : r === 1 ? "▒" : "░", r === 0 ? "e" : r === 1 ? "f" : "g");
    }
    // the door, hinged on the left, foreshortened as it opens
    const pw = Math.max(1, Math.round(IW * (1 - o)));
    for (let j = 0; j < IH; j++) for (let i = 0; i < pw; i++) {
      const inset = pw > 5 && i > 1 && i < pw - 2 && j > 0 && j < IH - 1 && j !== 4;
      S(IX + i, IY + j, inset ? "▓" : "█", o > 0.05 && i === pw - 1 ? "a" : inset ? "c" : "b");
    }
    if (pw > 2) S(IX + pw - 2, IY + 4, "●", "9");
    // frame on top
    g.box(DX, DY, DW, DH, "heavy", "c");
    // a welcome mat
    g.text(DX + 3, FY + 1, "▄▄▄▄▄▄▄▄", "7");
    mid(16, "Welcome aboard, Sam", "0");
    mid(17, "Let's set up your workspace in three quick steps.", "1");
    const label = "Get started →", bw = label.length + 4, bx = Math.floor((W - bw) / 2);
    g.box(bx, 19, bw, 3, "round", "5"); g.text(bx + 2, 20, label, "5");
    return g.frame();
  };
}
