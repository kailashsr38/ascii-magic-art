/* empty-cobweb-folder: an empty open folder under a corner cobweb, with a small spider bobbing on its thread. */
import { Grid, palette, TAU } from "../lib/kit.js";

const pal = palette(["#e6edf3", "#8b949e", "#484f58", "#30363d", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#f2cc60", "#7a4a12", "#b0701e", "#d9902f", "#f0b45a", "#6e7681"]);
// 0 text, 1 muted, 2 dim, 3 border, 4 green, 5 blue, 6 orange, 7 red, 8 purple, 9 yellow, a-d folder dark to light, e web

export const meta = {
  slug: "empty-cobweb-folder",
  name: "Cobweb Empty Folder",
  category: "empty-states",
  note: "An empty open folder sits under a corner cobweb while a small spider bobs up and down on its thread.",
  tags: ["empty-state", "files", "folder", "onboarding", "app"],
  cols: 56, rows: 20, fps: 20,
  palette: pal,
};

const fit = (s, w) => (s.length <= w ? s : s.slice(0, Math.max(0, w - 2)) + "..");
const SPIDER = ["╲╲ ╱╱", "─(●)─", "╱╱ ╲╲"];

export default function create() {
  const W = meta.cols, H = meta.rows;
  const g = new Grid(W, H);
  const S = (x, y, c, co) => { x = Math.round(x); y = Math.round(y); if (x >= 1 && y >= 1 && x < W - 1 && y < H - 1) g.set(x, y, c, co); };
  const mid = (y, s, co) => { s = fit(s, W - 4); g.text(Math.floor((W - s.length) / 2), y, s, co); };
  // the web is static: radial threads from the top right corner plus three arcs
  const web = [];
  const OX = W - 2, OY = 1;
  const angs = [0.06, 0.45, 0.85, 1.25];
  for (const a of angs) for (let r = 0; r < 17; r += 0.5) {
    const x = OX - Math.cos(a) * r, y = OY + Math.sin(a) * r * 0.5;
    web.push([x, y, a < 0.3 ? "─" : "╱"]);
  }
  for (const R of [5, 10, 15]) for (let a = 0.06; a <= 1.25; a += 0.05) web.push([OX - Math.cos(a) * R, OY + Math.sin(a) * R * 0.5, "·"]);
  return (t) => {
    g.clear();
    g.box(0, 0, W, H, "round", "3");
    for (const [x, y, c] of web) S(x, y, c, c === "·" ? "1" : "e");
    // folder: back panel with tab, then the front panel
    const FX = 14, FW = 26;
    for (let i = 0; i < 9; i++) S(FX + i, 3, "▄", "b");
    for (let y = 4; y <= 11; y++) for (let i = 0; i < FW; i++) S(FX + i, y, "█", y < 6 ? "a" : "b");
    for (let i = 0; i < FW; i++) { S(FX + i, 6, "▄", "d"); for (let y = 7; y <= 11; y++) S(FX + i, y, "█", y < 9 ? "c" : "b"); }
    for (let i = 0; i < FW; i++) S(FX + i, 12, "▀", "a");
    g.text(FX + 9, 9, " 0 items ", "0");
    // spider on its thread
    const sy = 6 + 2.4 * (1 + Math.sin(t * 1.1)) + 0.5 * Math.sin(t * 2.7);
    const sx = 46 + Math.sin(t * 0.7) * 0.6;
    for (let y = 2; y < sy - 1; y++) S(46, y, "│", "2");
    SPIDER.forEach((row, r) => { for (let i = 0; i < row.length; i++) if (row[i] !== " ") S(sx - 2 + i, sy - 1 + r, row[i], row[i] === "●" ? "0" : "1"); });
    mid(14, "Nothing here yet", "0");
    mid(15, "Create your first project to get started.", "1");
    const label = "+ New project", bw = label.length + 4, bx = Math.floor((W - bw) / 2);
    g.box(bx, 16, bw, 3, "round", "5"); g.text(bx + 2, 17, label, "5");
    return g.frame();
  };
}
