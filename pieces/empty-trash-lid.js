/* empty-trash-lid: a crumpled page arcs into a bin, the lid swings shut with a bump and an undo timer drains. */
import { Grid, palette, clamp } from "../lib/kit.js";

const pal = palette(["#e6edf3", "#8b949e", "#484f58", "#30363d", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#f2cc60", "#c9d1d9", "#8b949e", "#6e7681", "#3d444d", "#ffffff"]);
// 0 text, 1 muted, 2 dim, 3 border, 4 green, 5 blue, 6 orange, 7 red, 8 purple, 9 yellow, a-d steel light to dark, e paper

export const meta = {
  slug: "empty-trash-lid",
  name: "Trash Lid Closing",
  category: "empty-states",
  note: "A crumpled page arcs into a bin, the lid swings shut with a bump and an undo timer drains away.",
  tags: ["empty-state", "delete", "trash", "undo", "app"],
  cols: 56, rows: 20, fps: 24,
  palette: pal,
};

const fit = (s, w) => (s.length <= w ? s : s.slice(0, Math.max(0, w - 2)) + "..");
const ease = (v) => { v = clamp(v); return v * v * (3 - 2 * v); };
const PERIOD = 8, SHUT = 1.6, UNDO = 5;

export default function create() {
  const W = meta.cols, H = meta.rows;
  const g = new Grid(W, H);
  const S = (x, y, c, co) => { x = Math.round(x); y = Math.round(y); if (x >= 1 && y >= 1 && x < W - 1 && y < H - 1) g.set(x, y, c, co); };
  const mid = (y, s, co) => { s = fit(s, W - 4); g.text(Math.floor((W - s.length) / 2), y, s, co); };
  const CX = 28, BT = 6, BB = 12;
  return (t) => {
    g.clear();
    g.box(0, 0, W, H, "round", "3");
    const lt = t % PERIOD;
    const open = lt < SHUT ? ease((lt - 0.1) / 0.4) * (1 - ease((lt - 1.35) / 0.25)) : 0;
    const bump = lt > SHUT && lt < SHUT + 0.15 ? 1 : 0;
    // paper ball arcs in (behind the bin body)
    const b = (lt - 0.5) / 0.8;
    if (b > 0 && b < 1) {
      const x = 8 + b * (CX - 8), y = 3 + (b - 0.35) * (b - 0.35) * 14 - 1.7;
      if (y < BT - 0.5 || x < CX - 7) {
        S(x, y, "▟", "e"); S(x + 1, y, "▙", "e"); S(x, y + 1, "▜", "e"); S(x + 1, y + 1, "▛", "e");
      }
    }
    // body, slightly tapered, with ribs
    for (let y = BT; y <= BB; y++) {
      const half = 6 - Math.floor((y - BT) / 4);
      for (let x = CX - half; x <= CX + half; x++) {
        const rib = (x - CX) % 3 === 0 && y > BT && y < BB;
        S(x, y + bump, rib ? "▐" : y === BB ? "▀" : "█", rib ? "d" : x < CX - 2 ? "a" : x > CX + 2 ? "c" : "b");
      }
    }
    // lid hinged on the right
    const ang = open * 0.7, hx = CX + 7, hy = BT - 1 + bump;
    for (let i = 0; i <= 15; i++) {
      const x = hx - Math.cos(ang) * i, y = hy - Math.sin(ang) * i * 0.4;
      S(x, y, "█", "b");
    }
    const mx = hx - Math.cos(ang) * 7.5, my = hy - Math.sin(ang) * 7.5 * 0.4;
    for (let k = -1; k <= 1; k++) S(mx + k - Math.sin(ang) * 1.2, my - Math.cos(ang) * 1, "▄", "a");
    // copy and undo timer
    const after = lt - SHUT, left = clamp(1 - after / UNDO);
    mid(13, lt < SHUT ? "Deleting..." : "Item deleted", "0");
    mid(14, `"draft-notes.md" was moved to the trash.`, "1");
    const live = after > 0 && after < UNDO;
    const secs = live ? Math.ceil(UNDO - after) : 0;
    const label = live ? `Undo (${secs}s)` : "Undo      ";
    const bw = 14, bx = 12;
    g.box(bx, 16, bw, 3, "round", live ? "5" : "3"); g.text(bx + 2, 17, label, live ? "5" : "2");
    const tw = 18, n = Math.round(left * tw);
    g.text(bx + bw + 2, 17, "━".repeat(n), "5"); g.text(bx + bw + 2 + n, 17, "━".repeat(tw - n), "3");
    return g.frame();
  };
}
