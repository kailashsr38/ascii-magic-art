/* window-tiling-manager: a desktop where app windows open, snap and re-tile into splits and grids. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "window-tiling-manager",
  name: "Window Tiling Manager",
  category: "screens",
  note: "A desktop where windows open one by one and the tiling layout slides between halves, columns and a grid.",
  tags: ["desktop", "windows", "tiling", "layout", "os", "app"],
  cols: 96, rows: 30, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60", "#161b22"]),
};

const APPS = [
  ["Terminal", "2", ["$ npm run dev", "ready on :3000", "compiled in 412ms", "$ _"]],
  ["Editor", "3", ["fn main() {", "  let x = 42;", "  println!(x);", "}"]],
  ["Browser", "4", ["localhost:3000", "", "  Welcome back", "  [ Sign in ]"]],
  ["Notes", "9", ["Today", "- ship tiling", "- fix focus", "- coffee"]],
];
// layouts in fractions of desktop [x,y,w,h] per window count
const LAYOUTS = [
  { n: 1, r: [[0, 0, 1, 1]] },
  { n: 2, r: [[0, 0, 0.5, 1], [0.5, 0, 0.5, 1]] },
  { n: 3, r: [[0, 0, 0.5, 1], [0.5, 0, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]] },
  { n: 4, r: [[0, 0, 0.5, 0.5], [0.5, 0, 0.5, 0.5], [0, 0.5, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]] },
  { n: 4, r: [[0, 0, 0.25, 1], [0.25, 0, 0.25, 1], [0.5, 0, 0.25, 1], [0.75, 0, 0.25, 1]] },
  { n: 4, r: [[0, 0, 0.6, 1], [0.6, 0, 0.4, 0.34], [0.6, 0.34, 0.4, 0.33], [0.6, 0.67, 0.4, 0.33]] },
];
const NAMES = ["Monocle", "Split", "Main + stack", "Grid", "Columns", "Wide main"];
const STEP = 2.2, ANIM = 0.45;
const ease = (v) => { v = Math.max(0, Math.min(1, v)); return 1 - (1 - v) ** 3; };

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  const DX = 1, DY = 2, DW = W - 2, DH = H - 4;
  const PERIOD = LAYOUTS.length * STEP + 1.2;
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    const li = Math.min(LAYOUTS.length - 1, Math.floor(lt / STEP));
    const f = lt - li * STEP;
    const prev = LAYOUTS[Math.max(0, li - 1)], cur = LAYOUTS[li];
    const e = li === 0 ? 1 : ease(f / ANIM);
    // wallpaper
    for (let y = DY; y < DY + DH; y++) for (let x = DX; x < DX + DW; x++) if ((x * 3 + y * 7) % 11 === 0) g.set(x, y, "·", "8");
    // top bar
    g.fill(0, 0, W, 1, " ");
    g.text(1, 0, "◆ Workspace 1", "6");
    [1, 2, 3, 4].forEach((k) => g.text(17 + k * 3, 0, String(k), k === 1 ? "0" : "7"));
    g.text(W - 34, 0, "Layout: " + NAMES[li], "3");
    g.text(W - 7, 0, "14:0" + Math.floor(lt / 3) % 10, "1");
    const focus = (cur.n - 1 + Math.floor(f / 0.8)) % cur.n;
    for (let i = 0; i < cur.n; i++) {
      const a = prev.r[i] || [cur.r[i][0] + cur.r[i][2] / 2, cur.r[i][1] + cur.r[i][3] / 2, 0, 0];
      const b = cur.r[i];
      const r = a.map((v, k) => v + (b[k] - v) * e);
      const x = Math.round(DX + r[0] * DW), y = Math.round(DY + r[1] * DH);
      const w = Math.round(DX + (r[0] + r[2]) * DW) - x, h = Math.round(DY + (r[1] + r[3]) * DH) - y;
      if (w < 4 || h < 3) { if (w > 0 && h > 0) g.fill(x, y, Math.max(1, w), Math.max(1, h), "▒", APPS[i][1]); continue; }
      const gx = x + 0, gy = y, gw = w - 1, gh = h - 1;
      g.fill(gx, gy, gw, gh, " ");
      const isF = i === focus && e >= 1;
      g.box(gx, gy, gw, gh, isF ? "heavy" : "round", isF ? APPS[i][1] : "7");
      const title = " " + APPS[i][0] + " ";
      if (gw > title.length + 4) g.text(gx + 2, gy, title, isF ? "0" : "1");
      if (gw > 10) { g.set(gx + gw - 4, gy, "─", "7"); g.set(gx + gw - 3, gy, "×", isF ? "5" : "7"); }
      APPS[i][2].forEach((l, k) => {
        if (k + 1 < gh - 1) g.text(gx + 2, gy + 1 + k, l.slice(0, Math.max(0, gw - 4)), k === 0 ? APPS[i][1] : "1");
      });
    }
    // dock
    g.hline(0, W - 1, H - 2, "─", "8");
    APPS.forEach(([n, c], i) => {
      const x = W / 2 - 22 + i * 12;
      const open = i < cur.n;
      g.text(x, H - 1, n, open ? c : "7");
      if (open) g.set(x + Math.floor(n.length / 2), H - 2, "•", c);
    });
    return g.frame();
  };
}
