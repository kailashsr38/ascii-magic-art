/* download-queue: a download manager with sizes, speeds, ETAs and bars finishing one by one. */
import { Grid, palette, noise2 } from "../lib/kit.js";

export const meta = {
  slug: "download-queue",
  name: "Download Queue",
  category: "screens",
  note: "A download manager where six files report size, speed and time left, then finish one by one.",
  tags: ["download", "progress", "loader", "app", "terminal"],
  cols: 80, rows: 24, fps: 20,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60"]),
};

// name, size MB, duration s, start s, colour
const FILES = [
  ["podcast-ep-142.mp3", 58, 2.6, 0.0, "6"],
  ["design-assets-q4.zip", 864, 5.2, 0.2, "4"],
  ["toolchain-arm64.pkg", 212, 4.1, 0.6, "3"],
  ["backup-2026-10-17.sql.gz", 2150, 8.4, 0.1, "9"],
  ["os-image-24.04-amd64.iso", 4710, 10.6, 0.3, "2"],
  ["training-set-v3.tar.gz", 12400, 12.4, 0.4, "5"],
];
const PERIOD = 15;
const fmt = (mb) => (mb >= 1000 ? (mb / 1000).toFixed(1) + " GB" : mb.toFixed(mb < 100 ? 1 : 0) + " MB");
const mmss = (s) => String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(Math.floor(s % 60)).padStart(2, "0");

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols;
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    g.box(0, 0, W, meta.rows, "round", "7");
    let active = 0, total = 0, got = 0, rate = 0;
    FILES.forEach(([name, size, dur, st, c], i) => {
      const y = 2 + i * 3;
      const raw = Math.max(0, Math.min(1, (lt - st) / dur));
      const p = raw < 1 ? raw * (0.92 + 0.08 * noise2(i * 3.1, lt * 0.8)) : 1;
      const done = raw >= 1 && lt < PERIOD - 0.6;
      const speed = (size / dur) * (0.75 + 0.5 * noise2(i * 7.7, lt * 1.7));
      total += size; got += size * p;
      if (!done) { active++; rate += speed; }
      g.set(2, y, done ? "✓" : "↓", done ? "2" : c);
      g.text(4, y, name, done ? "1" : "0");
      const sz = done ? fmt(size) : `${fmt(size * p)} / ${fmt(size)}`;
      g.text(W - 3 - sz.length, y, sz, "1");
      const bw = 44, n = Math.round(p * bw);
      g.text(4, y + 1, "█".repeat(n), done ? "2" : c);
      g.text(4 + n, y + 1, "░".repeat(bw - n), "8");
      g.text(49, y + 1, String(Math.floor(p * 100)).padStart(3) + "%", "0");
      if (done) g.text(55, y + 1, "Completed", "2");
      else {
        const sp = speed >= 1000 ? (speed / 1000).toFixed(1) + " GB/s" : speed.toFixed(1) + " MB/s";
        g.text(55, y + 1, sp.padStart(10), "3");
        g.text(W - 12, y + 1, "eta " + mmss((1 - p) * dur * 6), "1");
      }
    });
    g.text(2, 0, ` Downloads · ${active} active `, "0");
    g.hline(1, W - 2, meta.rows - 3, "─", "8");
    g.text(2, meta.rows - 2, `${fmt(got)} of ${fmt(total)}`, "0");
    g.text(26, meta.rows - 2, `↓ ${rate >= 1000 ? (rate / 1000).toFixed(1) + " GB/s" : rate.toFixed(1) + " MB/s"}`, "3");
    g.text(W - 26, meta.rows - 2, "[ Pause all ]  [ Clear ]", "1");
    return g.frame();
  };
}
