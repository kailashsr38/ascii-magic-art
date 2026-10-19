/* empty-upload-tray: a big arrow drops into a file tray, the tray bounces and a tick pops up. */
import { Grid, palette, clamp } from "../lib/kit.js";

const pal = palette(["#e6edf3", "#8b949e", "#484f58", "#30363d", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#f2cc60", "#1f6feb", "#388bfd", "#0d419d"]);
// 0 text, 1 muted, 2 dim, 3 border, 4 green, 5 blue, 6 orange, 7 red, 8 purple, 9 yellow, a/b/c blues

export const meta = {
  slug: "empty-upload-tray",
  name: "Upload Into Tray",
  category: "empty-states",
  note: "A big arrow drops into a file tray while the progress bar fills, then the tray bounces and a tick pops up.",
  tags: ["empty-state", "upload", "success", "files", "app"],
  cols: 56, rows: 20, fps: 24,
  palette: pal,
};

const fit = (s, w) => (s.length <= w ? s : s.slice(0, Math.max(0, w - 2)) + "..");
const ARROW = ["  ███  ", "  ███  ", "  ███  ", "███████", " █████ ", "  ███  ", "   █   "];
const TICK = ["      ▄█", "█▄  ▄█▀ ", " ▀██▀   "];
const PERIOD = 5.5, FALL = 1.7;

export default function create() {
  const W = meta.cols, H = meta.rows;
  const g = new Grid(W, H);
  const S = (x, y, c, co) => { x = Math.round(x); y = Math.round(y); if (x >= 1 && y >= 1 && x < W - 1 && y < H - 1) g.set(x, y, c, co); };
  const mid = (y, s, co) => { s = fit(s, W - 4); g.text(Math.floor((W - s.length) / 2), y, s, co); };
  return (t) => {
    g.clear();
    g.box(0, 0, W, H, "round", "3");
    const lt = t % PERIOD;
    const p = clamp(lt / FALL);
    const landed = lt >= FALL && lt < PERIOD - 0.4;
    const bounce = lt > FALL && lt < FALL + 0.18 ? 1 : 0;
    const TY = 7 + bounce, TX = 17, TW = 22;
    // arrow, falling with gravity, hidden behind the tray front
    const top = -2 + p * p * 11;
    if (lt < FALL + 0.1) ARROW.forEach((row, r) => {
      const y = Math.round(top + r);
      if (y >= TY + 1) return;
      for (let i = 0; i < row.length; i++) if (row[i] !== " ") S(25 + i, y, row[i], r < 3 ? "b" : "5");
    });
    // tray: open top, solid front
    S(TX, TY, "▗", "a"); S(TX + TW - 1, TY, "▖", "a");
    for (let i = 0; i < TW; i++) {
      S(TX + i, TY + 1, "█", "a");
      S(TX + i, TY + 2, "█", "c");
      S(TX + i, TY + 3, "▀", "c");
    }
    g.text(TX + 7, TY + 1, landed ? " 12 files " : " Uploads ", "0");
    // tick pops above the tray after landing
    if (landed) {
      const rise = Math.min(1, (lt - FALL) / 0.25);
      TICK.forEach((row, r) => { for (let i = 0; i < row.length; i++) if (row[i] !== " ") S(24 + i, 2 + r + Math.round(1 - rise), row[i], "4"); });
    }
    // progress
    const bw = 30, bx = 13, n = Math.round(p * bw);
    g.text(bx, 12, "█".repeat(n), landed ? "4" : "5"); g.text(bx + n, 12, "░".repeat(bw - n), "3");
    g.text(bx + bw + 1, 12, String(Math.round(p * 100)).padStart(3) + "%", "1");
    mid(14, landed ? "Upload complete" : "Uploading...", "0");
    mid(15, "q3-report.pdf and 11 more  ·  24.6 MB", "1");
    mid(17, landed ? "Open folder →" : "Cancel", landed ? "5" : "2");
    return g.frame();
  };
}
