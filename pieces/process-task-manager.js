/* process-task-manager: a system monitor listing processes with live CPU and memory, re-sorting as load shifts. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "process-task-manager",
  name: "Process Task Manager",
  category: "screens",
  note: "A task manager where per process CPU and memory numbers churn, rows slide to re-sort by load, and a runaway process gets ended.",
  tags: ["task-manager", "processes", "system", "monitor", "dashboard", "terminal"],
  cols: 92, rows: 26, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60"]),
};

const P = [
  ["video-encoder", 4412, "kai", 38, 3, 812], ["browser", 2201, "kai", 22, 4, 1640], ["db-server", 1088, "postgres", 14, 2, 920],
  ["indexer", 3310, "root", 9, 5, 210], ["node dev-server", 5120, "kai", 12, 3, 540], ["chat-client", 2875, "kai", 5, 2, 380],
  ["backup-agent", 912, "root", 3, 6, 120], ["window-server", 301, "root", 7, 1, 260], ["music-player", 3990, "kai", 2, 1, 150],
  ["spotlight-ish", 1402, "root", 4, 4, 95], ["sshd", 88, "root", 0.2, 0, 12], ["cron", 64, "root", 0.1, 0, 4],
];
const PERIOD = 18, KILL = 0, KILL_T = 11.5;
const ROWS = 14;

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  const cpuAt = (i, t) => {
    const [, , , base, wob] = P[i];
    let v = base + wob * Math.sin(t * (0.9 + i * 0.31) + i * 2.1) + wob * 0.5 * Math.sin(t * 2.3 + i);
    if (i === KILL) v += Math.min(40, Math.max(0, (t % PERIOD) - 3) * 6);
    return Math.max(0, v);
  };
  const order = (t) => {
    const lt = t % PERIOD;
    const ids = P.map((_, i) => i).filter((i) => !(i === KILL && lt >= KILL_T + 0.6));
    ids.sort((a, b) => cpuAt(b, Math.floor(t)) - cpuAt(a, Math.floor(t)));
    const pos = []; ids.forEach((id, k) => (pos[id] = k)); return pos;
  };
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    const cur = order(t), prev = order(t - 1);
    const fr = t - Math.floor(t), e = Math.min(1, fr / 0.35), ee = e * e * (3 - 2 * e);
    g.box(0, 0, W, H, "round", "7");
    g.text(2, 0, " Activity ", "0");
    const tabs = ["CPU", "Memory", "Energy", "Disk", "Network"];
    let tx = 14; tabs.forEach((s, i) => { g.text(tx, 0, ` ${s} `, i === 0 ? "3" : "7"); tx += s.length + 3; });
    const H1 = ["Process", 2], cols = [["PID", 26], ["User", 34], ["% CPU ▼", 46], ["Threads", 58], ["Memory", 70]];
    g.text(2, 2, H1[0], "1"); cols.forEach(([n, x]) => g.text(x, 2, n, n.includes("CPU") ? "3" : "1"));
    g.hline(1, W - 2, 3, "─", "8");
    const sel = lt >= KILL_T - 2.2 && lt < KILL_T + 0.6;
    let totalCpu = 0;
    P.forEach((p, i) => {
      if (cur[i] === undefined && prev[i] === undefined) return;
      const c0 = prev[i] ?? cur[i], c1 = cur[i] ?? prev[i];
      const pos = c0 + (c1 - c0) * ee;
      const y = Math.round(4 + pos);
      if (y > 4 + ROWS - 1) return;
      const cpu = cpuAt(i, t);
      totalCpu += cpu;
      const isSel = sel && i === KILL;
      const dying = i === KILL && lt >= KILL_T;
      g.fill(1, y, W - 2, 1, " ");
      if (isSel) { g.fill(1, y, W - 2, 1, "░", "8"); g.set(1, y, "▌", "5"); }
      const nc = dying ? "7" : isSel ? "5" : "0";
      g.text(2, y, p[0], nc);
      g.text(26, y, String(p[1]), "1");
      g.text(34, y, p[2], p[2] === "root" ? "6" : "1");
      g.text(46, y, cpu.toFixed(1).padStart(5), cpu > 30 ? "5" : cpu > 12 ? "4" : "0");
      const bl = Math.min(6, Math.round(cpu / 8));
      for (let k = 0; k < 6; k++) g.set(52 + k, y, k < bl ? "■" : "·", k < bl ? (cpu > 30 ? "5" : "3") : "8");
      g.text(58, y, String(Math.round(8 + i * 3 + Math.sin(t + i) * 2)).padStart(4), "1");
      const mem = p[5] + (i === KILL ? Math.max(0, lt - 3) * 120 : 0);
      g.text(70, y, (mem >= 1000 ? (mem / 1024).toFixed(2) + " GB" : Math.round(mem) + " MB").padStart(9), mem > 1000 ? "4" : "1");
    });
    // footer graph
    const fy = 4 + ROWS;
    g.hline(1, W - 2, fy, "─", "8");
    const used = Math.min(99, totalCpu / 1.6);
    g.text(2, fy + 1, "System", "1"); g.text(10, fy + 1, (used * 0.35).toFixed(1) + "%", "5");
    g.text(2, fy + 2, "User", "1"); g.text(10, fy + 2, (used * 0.65).toFixed(1) + "%", "3");
    g.text(2, fy + 3, "Idle", "1"); g.text(10, fy + 3, (100 - used).toFixed(1) + "%", "0");
    const gx = 20, gw = 44;
    for (let k = 0; k < gw; k++) {
      const tt = t - (gw - k) * 0.25;
      let s = 0; for (let i = 0; i < P.length; i++) if (!(i === KILL && (tt % PERIOD) >= KILL_T + 0.6)) s += cpuAt(i, tt);
      const v = Math.min(1, s / 160);
      const h = Math.round(v * 6);
      for (let r = 0; r < h; r++) g.set(gx + k, fy + 4 - Math.floor(r / 2), r % 2 ? "█" : "▄", v > 0.75 ? "5" : "3");
    }
    g.text(68, fy + 1, "Threads    2,184", "1");
    g.text(68, fy + 2, "Processes    " + (lt >= KILL_T + 0.6 ? "411" : "412"), "1");
    if (sel || (lt >= KILL_T && lt < KILL_T + 2.5)) {
      const msg = lt < KILL_T ? "Force quit video-encoder?  [Cancel] [Force Quit]" : "✓ video-encoder (4412) ended";
      g.text(W - 2 - msg.length, H - 2, msg, lt < KILL_T ? "5" : "2");
    }
    return g.frame();
  };
}
