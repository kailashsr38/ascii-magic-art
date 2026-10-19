/* empty-clipboard-copied: a pointer clicks copy on an invite link and the lines paste onto a clipboard with a copied pill. */
import { Grid, palette, clamp } from "../lib/kit.js";

const pal = palette(["#e6edf3", "#8b949e", "#484f58", "#30363d", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#f2cc60", "#7d5230", "#a06c3f", "#c9d1d9", "#8b949e", "#f6f8fa", "#57606a"]);
// 0 text, 1 muted, 2 dim, 3 border, 4 green, 5 blue, 6 orange, 7 red, 8 purple, 9 yellow, a/b board, c/d clip, e paper, f ink

export const meta = {
  slug: "empty-clipboard-copied",
  name: "Copied To Clipboard",
  category: "empty-states",
  note: "A pointer clicks copy on an invite link, the lines paste onto a clipboard and a small copied pill pops up.",
  tags: ["empty-state", "copy", "clipboard", "share", "app"],
  cols: 56, rows: 20, fps: 24,
  palette: pal,
};

const fit = (s, w) => (s.length <= w ? s : s.slice(0, Math.max(0, w - 2)) + "..");
const ease = (v) => { v = clamp(v); return v * v * (3 - 2 * v); };
const PERIOD = 6.5, CLICK = 1.1;
const LINES = [7, 5, 6, 3, 6, 4];
const BOXCH = "╭╮╰╯─│┬┴";

export default function create() {
  const W = meta.cols, H = meta.rows;
  const g = new Grid(W, H);
  const S = (x, y, c, co) => { x = Math.round(x); y = Math.round(y); if (x >= 1 && y >= 1 && x < W - 1 && y < H - 1) g.set(x, y, c, co); };
  const mid = (y, s, co) => { s = fit(s, W - 4); g.text(Math.floor((W - s.length) / 2), y, s, co); };
  return (t) => {
    g.clear();
    g.box(0, 0, W, H, "round", "3");
    const lt = t % PERIOD;
    const copied = lt >= CLICK && lt < PERIOD - 0.5;
    // clipboard
    const BX = 21, BW = 14;
    for (let y = 2; y <= 11; y++) for (let i = 0; i < BW; i++) S(BX + i, y, y === 11 ? "▀" : "█", i < 2 ? "b" : "a");
    for (let y = 3; y <= 10; y++) for (let i = 2; i < BW - 2; i++) S(BX + i, y, "█", "e");
    for (let i = 4; i < BW - 4; i++) { S(BX + i, 1, "▄", "c"); S(BX + i, 2, "█", i === 4 || i === BW - 5 ? "d" : "c"); }
    const shown = copied ? Math.floor(clamp((lt - CLICK) / 0.6) * LINES.length + 0.999) : 0;
    for (let k = 0; k < Math.min(shown, LINES.length); k++) for (let i = 0; i < LINES[k]; i++) S(BX + 3 + i, 4 + k, "▀", k === 0 ? "5" : "f");
    // copied pill pops beside the board
    if (copied && lt > CLICK + 0.15) {
      const lift = Math.round(1 - ease((lt - CLICK - 0.15) / 0.2));
      g.box(BX + BW + 3, 4 + lift, 12, 3, "round", "4");
      g.text(BX + BW + 5, 5 + lift, "✓ Copied", "4");
    }
    // link field with a copy button
    const FX = 5, FW = W - 10, FY = 13;
    g.box(FX, FY, FW, 3, "round", "2");
    g.text(FX + 2, FY + 1, fit("https://example.dev/invite/k7Qx2b", FW - 14), copied ? "5" : "0");
    g.set(FX + FW - 10, FY, "┬", "2"); g.set(FX + FW - 10, FY + 1, "│", "2"); g.set(FX + FW - 10, FY + 2, "┴", "2");
    const pressed = lt >= CLICK && lt < CLICK + 0.2;
    g.text(FX + FW - 8, FY + 1, copied ? "Copied" : " Copy ", pressed ? "0" : copied ? "4" : "5");
    // pointer glides to the button and clicks
    const m = ease((lt - 0.2) / 0.8), back = ease((lt - (PERIOD - 1.2)) / 0.7);
    const k = m * (1 - back), px = Math.round(49 + (FX + FW - 6 - 49) * k), py = Math.round(9 + (FY + 1 - 9) * k);
    const under = g.get(px, py);
    if (!BOXCH.includes(under) && py < H - 1 && py > 0) S(px, py, "↖", "0");
    mid(17, copied ? "Copied to clipboard" : "Share this invite link", "0");
    mid(18, "Anyone with the link can join as a viewer.", "1");
    return g.frame();
  };
}
