/* upload-dropzone: files dragged onto a drop zone, then uploading in parallel with progress bars and speeds. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "upload-dropzone",
  name: "Upload Dropzone",
  category: "screens",
  note: "A cursor drags a stack of files onto a drop zone that lights up, then each file uploads with its own progress bar.",
  tags: ["upload", "drag-and-drop", "progress", "files", "app", "loader"],
  cols: 72, rows: 24, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60"]),
};

const FILES = [
  ["site-photos.zip", 48.2, "6", 1.0], ["contract_v3.pdf", 2.4, "5", 2.6], ["hero-banner.png", 6.8, "3", 1.6],
  ["q3-figures.xlsx", 0.9, "2", 3.4], ["interview.mp4", 112.5, "4", 0.55],
];
const DRAG = 3.0, PERIOD = 15;
const ease = (v) => { v = Math.max(0, Math.min(1, v)); return v < 0.5 ? 2 * v * v : 1 - (-2 * v + 2) ** 2 / 2; };

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    g.box(0, 0, W, H, "round", "7");
    g.text(2, 0, " Upload files ", "0");
    g.text(W - 22, 0, " Project: Riverside ", "1");
    const dropped = lt >= DRAG;
    const zy = 2, zh = dropped ? 5 : 11;
    // drag phase: cursor with file stack travels from top-right into zone
    const p = ease(lt / (DRAG - 0.3));
    const cx = Math.round(56 - p * 26), cy = Math.round(-2 + p * 7);
    const over = !dropped && p > 0.75;
    const zc = over ? "3" : dropped ? "8" : "7";
    for (let x = 2; x < W - 2; x++) { g.set(x, zy, x % 2 ? "╌" : "─", zc); g.set(x, zy + zh - 1, x % 2 ? "╌" : "─", zc); }
    for (let y = zy; y < zy + zh; y++) { g.set(2, y, y % 2 ? "╎" : "│", zc); g.set(W - 3, y, y % 2 ? "╎" : "│", zc); }
    g.set(2, zy, "╭", zc); g.set(W - 3, zy, "╮", zc); g.set(2, zy + zh - 1, "╰", zc); g.set(W - 3, zy + zh - 1, "╯", zc);
    if (over) g.fill(3, zy + 1, W - 6, zh - 2, "░", "8");
    if (!dropped) {
      g.text(W / 2 - 1, zy + 3, "↑", over ? "3" : "1");
      g.text(W / 2 - 3, zy + 4, "──┴──", over ? "3" : "7");
      const m = over ? "Release to upload 5 files" : "Drag files here or browse";
      g.text(Math.round(W / 2 - m.length / 2), zy + 6, m, over ? "3" : "0");
      g.text(W / 2 - 13, zy + 8, "Up to 2 GB per file · any type", "7");
      // stack
      // dragged stack drawn as block-element cards so it layers cleanly over the zone border
      // clipped to the window interior: the stack slides in from under the title bar
      const put = (x, y, ch, c) => { if (x >= 1 && x <= W - 2 && y >= 1 && y <= H - 2) g.set(x, y, ch, c); };
      const puts = (x, y, s, c) => { for (let i = 0; i < s.length; i++) put(x + i, y, s[i], c); };
      for (let k = 2; k >= 0; k--) {
        const sx = cx + 2 + k, sy = cy + 1 - k, c = k === 0 ? "0" : "7";
        for (let j = 0; j < 3; j++) puts(sx, sy + j, " ".repeat(12), c);
        puts(sx, sy, "▛" + "▀".repeat(10) + "▜", c);
        put(sx, sy + 1, "▌", c); put(sx + 11, sy + 1, "▐", c);
        puts(sx, sy + 2, "▙" + "▄".repeat(10) + "▟", c);
      }
      puts(cx + 4, cy + 2, "5 files", "0");
      put(cx, cy, "▲", "0"); put(cx, cy + 1, "▌", "0");
      g.text(W - 8, H - 2, "0 of 5", "7");
      return g.frame();
    }
    g.text(W / 2 - 13, zy + 2, "↑ Drop more files or browse", "1");
    // list
    const ut = lt - DRAG;
    let done = 0, total = 0, sent = 0;
    FILES.forEach(([name, mb, c, rate], i) => {
      const y = 8 + i * 3;
      const st = i * 0.25;
      const pr = Math.max(0, Math.min(1, ((ut - st) * rate) / 6));
      total += mb; sent += mb * pr; if (pr >= 1) done++;
      g.text(3, y, "■", c); g.text(5, y, name, "0");
      const sz = mb >= 10 ? mb.toFixed(0) + " MB" : mb.toFixed(1) + " MB";
      g.text(26, y, (pr < 1 ? (mb * pr).toFixed(1) + " / " : "") + sz, "1");
      if (pr >= 1) g.text(W - 12, y, "✓ Done", "2");
      else if (pr > 0) g.text(W - 12, y, (rate * 1.7).toFixed(1) + " MB/s", "7");
      else g.text(W - 12, y, "Queued", "7");
      const bw = W - 12;
      const fx = Math.round(pr * bw);
      for (let k = 0; k < bw; k++) g.set(5 + k, y + 1, k < fx ? "━" : "─", k < fx ? (pr >= 1 ? "2" : "3") : "8");
      g.text(W - 6, y + 1, String(Math.round(pr * 100)).padStart(3) + "%", pr >= 1 ? "2" : "0");
    });
    g.text(3, H - 2, `${done} of 5 uploaded · ${sent.toFixed(0)} of ${total.toFixed(0)} MB`, done === 5 ? "2" : "1");
    g.text(W - 18, H - 2, done === 5 ? "All files ready" : "Cancel all", done === 5 ? "2" : "5");
    return g.frame();
  };
}
