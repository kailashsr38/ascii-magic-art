/* empty-inbox-plane: a paper plane loops over an empty inbox tray, leaving a dotted trail. */
import { Grid, palette, TAU } from "../lib/kit.js";

const pal = palette(["#e6edf3", "#8b949e", "#484f58", "#30363d", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#f2cc60", "#1f6feb", "#388bfd"]);
// 0 text, 1 muted, 2 dim, 3 border, 4 green, 5 blue, 6 orange, 7 red, 8 purple, 9 yellow, a deep blue, b mid blue

export const meta = {
  slug: "empty-inbox-plane",
  name: "Empty Inbox Plane",
  category: "empty-states",
  note: "A paper plane loops a figure eight above an empty inbox tray, trailing a dotted line.",
  tags: ["empty-state", "inbox", "messages", "email", "app"],
  cols: 56, rows: 20, fps: 24,
  palette: pal,
};

const fit = (s, w) => (s.length <= w ? s : s.slice(0, Math.max(0, w - 2)) + "..");
const RIGHT = ["▀▄▄▄     ", " ▀█████▄▄", " ▄██▀▀▀  ", "▀▀       "];
const LEFT = RIGHT.map((r) => [...r].reverse().join(""));
const LAP = 7;

export default function create() {
  const W = meta.cols, H = meta.rows;
  const g = new Grid(W, H);
  const S = (x, y, c, co) => { x = Math.round(x); y = Math.round(y); if (x >= 1 && y >= 1 && x < W - 1 && y < H - 1) g.set(x, y, c, co); };
  const mid = (y, s, co) => { s = fit(s, W - 4); g.text(Math.floor((W - s.length) / 2), y, s, co); };
  const path = (s) => [W / 2 + 18 * Math.sin(TAU * s), 4.2 + 1.8 * Math.sin(2 * TAU * s)];
  return (t) => {
    g.clear();
    g.box(0, 0, W, H, "round", "3");
    const s = t / LAP;
    // dotted trail
    for (let k = 1; k <= 26; k++) {
      if (k % 2) continue;
      const [x, y] = path(s - k * 0.008);
      S(x, y, k < 12 ? "•" : "·", k < 16 ? "1" : "2");
    }
    // tray
    const TW = 26, X0 = Math.floor((W - TW) / 2), Y0 = 8;
    S(X0 + 1, Y0, "╱", "1"); S(X0 + TW - 2, Y0, "╲", "1");
    S(X0, Y0 + 1, "╱", "1"); S(X0 + TW - 1, Y0 + 1, "╲", "1");
    for (let i = 0; i < TW; i++) {
      const notch = i >= 7 && i < TW - 7;
      S(X0 + i, Y0 + 2, notch ? (i === 7 || i === TW - 8 ? "▄" : " ") : "█", "b");
      S(X0 + i, Y0 + 3, "█", notch ? "a" : "b");
      S(X0 + i, Y0 + 4, "▀", "a");
    }
    g.text(X0 + 11, Y0 + 3, " 0 ", "0");
    // the plane, facing the way it flies
    const [px, py] = path(s), [qx] = path(s + 0.002);
    const spr = qx >= px ? RIGHT : LEFT;
    spr.forEach((row, r) => { for (let i = 0; i < row.length; i++) if (row[i] !== " ") S(px - 4 + i, py - 1 + r, row[i], r < 2 ? "0" : "1"); });
    mid(14, "Your inbox is empty", "0");
    mid(15, "New messages will land here.", "1");
    const label = "+ Compose", bw = label.length + 4, bx = Math.floor((W - bw) / 2);
    g.box(bx, 16, bw, 3, "round", "5");
    g.text(bx + 2, 17, label, "5");
    return g.frame();
  };
}
