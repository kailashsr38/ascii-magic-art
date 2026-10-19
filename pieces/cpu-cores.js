/* cpu-cores: a terminal system monitor with per-core bars, memory, load and a process list. */
import { Grid, palette, fbm, clamp } from "../lib/kit.js";

export const meta = {
  slug: "cpu-cores",
  name: "CPU Monitor",
  category: "live-data",
  note: "A terminal system monitor with eight per-core usage bars, memory and swap, load averages and a busy process list.",
  tags: ["cpu", "monitor", "terminal", "system", "dashboard"],
  cols: 80, rows: 22, fps: 8,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#ff7b72", "#79c0ff", "#f2cc60", "#30363d", "#56d4dd", "#d2a8ff", "#161b22", "#2ea043"]),
};

const PROCS = [
  ["node", "server.js --port 3000", "app"], ["dbd", "writer process", "db"], ["python3", "train.py --epochs 40", "ml"],
  ["nginx", "worker process", "www"], ["kvcache", "*:6379", "cache"], ["make", "-j8 all", "kai"],
  ["cargo", "build --release", "kai"], ["ffmpeg", "-i clip.mov -c:v h264", "kai"], ["sshd", "kai@pts/1", "root"], ["containerd", "--config /etc/ctd.toml", "root"], ["systemd", "--user", "kai"], ["rsync", "-az backup/ nas:/vol1", "kai"],
];

export default function create() {
  const { cols } = meta;
  const g = new Grid(cols, meta.rows);
  const meter = (x, y, w, label, parts, text) => {
    g.text(x, y, label, "7");
    g.text(x + label.length, y, "[", "0");
    const inner = w - label.length - 2;
    let pos = 0;
    for (const [frac, co] of parts) {
      const n = Math.round(frac * inner);
      for (let i = 0; i < n && pos < inner; i++, pos++) g.set(x + label.length + 1 + pos, y, "|", co);
    }
    for (; pos < inner; pos++) g.set(x + label.length + 1 + pos, y, " ");
    g.text(x + label.length + 1 + inner - text.length, y, text, "1");
    g.text(x + w - 1, y, "]", "0");
  };
  return (t) => {
    g.clear();
    const s = t * 0.6;
    const core = (i) => clamp(Math.pow(fbm(s + i * 13.7, i * 3.1, 3, 21), 1.6) * 1.7 - 0.12, 0.02, 0.99);
    let tot = 0;
    for (let i = 0; i < 8; i++) {
      const u = core(i); tot += u;
      const x = i < 4 ? 0 : 40, y = (i % 4);
      const user = u * 0.78, sys = u * 0.22;
      meter(x + 1, y, 38, String(i + 1).padStart(2) + " ", [[user, u > 0.8 ? "3" : "2"], [sys, "3"]], (u * 100).toFixed(1) + "%");
    }
    const mem = 0.52 + 0.08 * Math.sin(t * 0.21) + 0.03 * fbm(t, 4, 2, 2);
    meter(1, 4, 38, "Mem", [[mem * 0.7, "2"], [mem * 0.1, "4"], [mem * 0.2, "5"]], (mem * 31.2).toFixed(1) + "G/31.2G");
    meter(1, 5, 38, "Swp", [[0.04, "3"]], "312M/8.00G");
    const avg = tot / 8;
    const l1 = (avg * 9.2).toFixed(2), l5 = (6.1 + Math.sin(t * 0.05)).toFixed(2), l15 = "5.34";
    g.text(41, 4, "Tasks:", "7"); g.text(48, 4, String(214 + Math.round(fbm(t * 0.3, 1, 2, 3) * 20)), "0");
    g.text(52, 4, ", 1083 thr;", "0"); g.text(64, 4, String(1 + Math.round(avg * 8)), "2"); g.text(66, 4, " running", "0");
    g.text(41, 5, "Load average:", "7"); g.text(55, 5, l1, "0"); g.text(60, 5, l5, "0"); g.text(65, 5, l15, "1");
    const up = 3 * 86400 + 4 * 3600 + 17 * 60 + Math.floor(t);
    g.text(41, 6, "Uptime:", "7");
    g.text(49, 6, `3 days, ${String(Math.floor(up / 3600) % 24).padStart(2, "0")}:${String(Math.floor(up / 60) % 60).padStart(2, "0")}:${String(up % 60).padStart(2, "0")}`, "0");
    // process header
    g.fill(0, 8, cols, 1, " ", "9");
    const hdr = "    PID USER      CPU%  MEM%   TIME+    Command";
    for (let i = 0; i < cols; i++) g.set(i, 8, i < hdr.length ? hdr[i] : " ", "9");
    g.text(0, 8, hdr, "2");
    const rows = PROCS.map((p, i) => [p, clamp(fbm(s * 1.3 + i * 5, i, 2, 40 + i) * 1.8 - 0.35, 0, 1) * (i < 3 ? 160 : 60)]);
    rows.sort((a, b) => b[1] - a[1]);
    rows.forEach(([[cmd, args, user], cpu], i) => {
      const y = 9 + i;
      const pid = 1000 + PROCS.findIndex((p) => p[0] === cmd) * 1373 % 9000;
      const sel = i === 0;
      if (sel) for (let x = 0; x < cols; x++) g.set(x, y, " ", "4");
      g.text(0, y, String(pid).padStart(7), sel ? "4" : "0");
      g.text(8, y, user.padEnd(8), sel ? "4" : "1");
      g.text(17, y, cpu.toFixed(1).padStart(5), cpu > 80 ? "3" : sel ? "4" : "0");
      g.text(23, y, (1.2 + (pid % 70) / 10).toFixed(1).padStart(5), sel ? "4" : "0");
      const tm = Math.floor(t * cpu / 50 + pid % 400);
      g.text(30, y, `${Math.floor(tm / 60)}:${String(tm % 60).padStart(2, "0")}.${String(pid % 100).padStart(2, "0")}`.padStart(8), "1");
      g.text(41, y, cmd, sel ? "4" : cpu > 80 ? "5" : "0");
      g.text(42 + cmd.length, y, args, "1");
    });
    g.text(0, meta.rows - 1, "F1Help  F2Setup  F3Search  F4Filter  F5Tree  F6SortBy  F9Kill  F10Quit", "1");
    for (const k of ["F1", "F2", "F3", "F4", "F5", "F6", "F9", "F10"]) {
      const i = g.ch.slice((meta.rows - 1) * cols, meta.rows * cols).join("").indexOf(k);
      if (i >= 0) g.text(i, meta.rows - 1, k, "7");
    }
    return g.frame();
  };
}
