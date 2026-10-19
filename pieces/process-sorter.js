/* process-sorter: an interactive process viewer whose table re-sorts by a different column every few seconds. */
import { Grid, palette, clamp } from "../lib/kit.js";

export const meta = {
  slug: "process-sorter",
  name: "Process Viewer Sort",
  category: "screens",
  note: "An interactive process viewer with meter bars where the table slides into a new order as the sort column changes.",
  tags: ["process", "monitor", "terminal", "system", "linux", "dashboard"],
  cols: 96, rows: 28, fps: 20,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60", "#56d4dd", "#1f6feb"]),
};

const PROCS = [
  [1843, "postgres", "postgres: writer", 6.1, 4.2, 512],
  [2211, "dev", "node dist/server.js", 38.0, 6.8, 9120],
  [3302, "dev", "python3 etl/ingest.py", 71.5, 12.4, 2210],
  [612, "root", "containerd --log warn", 2.2, 1.9, 40210],
  [918, "www", "nginx: worker process", 4.4, 0.3, 30115],
  [4410, "dev", "rg -n TODO src/", 22.0, 0.2, 7],
  [1203, "kvstore", "kv-server *:6379", 3.0, 2.6, 18802],
  [5021, "dev", "ffmpeg -i talk.mov out.mp4", 88.2, 3.1, 1544],
  [77, "root", "systemd-journald", 0.4, 0.8, 52011],
  [2990, "dev", "zsh", 0.0, 0.1, 13],
  [3870, "dev", "vim notes/plan.md", 0.3, 0.2, 402],
  [1440, "root", "sshd: dev [priv]", 0.1, 0.1, 88],
  [6001, "dev", "make -j8 test", 41.2, 1.4, 120],
  [702, "root", "cron -f", 0.0, 0.0, 61204],
  [2475, "dev", "jvm -Xmx2g indexer.jar", 54.7, 18.9, 33012],
  [3990, "dev", "rsync -az ./ nas:/backup", 9.8, 0.4, 2899],
];
const SORTS = [["CPU%", 3, -1], ["MEM%", 4, -1], ["TIME+", 5, -1], ["PID", 0, 1]];
const SEG = 4;

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  const PERIOD = SEG * SORTS.length;
  const orderFor = (si, tt) => {
    const [, k, dir] = SORTS[si];
    const val = (p, i) => (k === 3 ? p[3] + Math.sin(tt * 1.3 + i) * 3 : p[k]);
    return PROCS.map((p, i) => i).sort((a, b) => dir * (val(PROCS[a], a) - val(PROCS[b], b)));
  };
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    const si = Math.floor(lt / SEG), prev = (si + SORTS.length - 1) % SORTS.length;
    const k = clamp((lt - si * SEG) / 0.7), e = k * k * (3 - 2 * k);
    const newO = orderFor(si, si * SEG + 0.7), oldO = orderFor(prev, si * SEG);
    const pos = new Array(PROCS.length);
    newO.forEach((pi, r) => (pos[pi] = r));
    const opos = new Array(PROCS.length);
    oldO.forEach((pi, r) => (opos[pi] = r));
    // meters
    for (let c = 0; c < 4; c++) {
      const v = clamp(0.35 + 0.5 * Math.abs(Math.sin(t * 0.9 + c * 1.7)) * (c === 1 ? 1.1 : 1));
      const x = 2 + (c % 2) * 46, y = 1 + Math.floor(c / 2);
      g.text(x, y, String(c), "a"); g.text(x + 1, y, "[", "0");
      const bw = 34, n = Math.round(v * bw), nk = Math.round(n * 0.25);
      for (let i = 0; i < bw; i++) g.set(x + 2 + i, y, i < n ? "|" : " ", i < nk ? "3" : i < n * 0.8 ? "2" : "5");
      g.text(x + 2 + bw - 5, y, (v * 100).toFixed(1).padStart(4) + "%", "1"); g.text(x + bw + 2, y, "]", "0");
    }
    const mem = 0.62 + Math.sin(t * 0.3) * 0.03;
    g.text(2, 3, "Mem[", "a");
    const bw = 34, n = Math.round(mem * bw);
    for (let i = 0; i < bw; i++) g.set(6 + i, 3, i < n ? "|" : " ", i < n * 0.6 ? "2" : i < n * 0.8 ? "3" : "9");
    g.text(6 + bw - 13, 3, `${(mem * 31.2).toFixed(1)}G/31.2G`, "1"); g.text(6 + bw, 3, "]", "0");
    g.text(48, 3, "Tasks: ", "a"); g.text(55, 3, "214, 891 thr; 4 running", "0");
    g.text(48, 4, "Load average: ", "a"); g.text(62, 4, (2.1 + Math.sin(t * 0.4) * 0.3).toFixed(2) + " 1.94 1.71", "0");
    g.text(48, 5, "Uptime: ", "a"); g.text(56, 5, "12 days, 04:" + String(18 + Math.floor(t / 60) % 40).padStart(2, "0") + ":" + String(Math.floor(t) % 60).padStart(2, "0"), "0");
    // header
    const HY = 7;
    g.hline(0, W - 1, HY + 0, " ");
    g.hline(0, W - 1, HY - 1, "─", "8");
    const cols = [["PID", 2, 6], ["USER", 9, 9], ["CPU%", 19, 6], ["MEM%", 26, 6], ["TIME+", 33, 10], ["Command", 46, 0]];
    cols.forEach(([n, x, w]) => {
      const active = SORTS[si][0] === n;
      g.text(x, HY, w ? (n === "USER" ? n.padEnd(w) : n.padStart(w)) : n, active ? "3" : "0");
      if (active) { g.set(x + Math.max(w, n.length), HY, SORTS[si][2] < 0 ? "▼" : "▲", "3"); g.set(x - 1, HY, "▐", "3"); }
    });
    for (let i = 0; i < PROCS.length; i++) {
      const p = PROCS[i];
      const y = Math.round(HY + 1 + opos[i] + (pos[i] - opos[i]) * e);
      if (y > H - 3) continue;
      const cpu = clamp(p[3] + Math.sin(t * 1.3 + i) * 3, 0, 100);
      const secs = p[5] + Math.floor(t * cpu / 100);
      const tm = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}.${String((i * 37) % 100).padStart(2, "0")}`;
      const sel = pos[i] === 0;
      g.text(2, y, String(p[0]).padStart(6), sel ? "9" : "1");
      g.text(9, y, p[1].padEnd(9), p[1] === "root" ? "5" : "1");
      g.text(19, y, cpu.toFixed(1).padStart(6), cpu > 50 ? "5" : cpu > 10 ? "4" : "7");
      g.text(26, y, p[4].toFixed(1).padStart(6), p[4] > 10 ? "6" : "7");
      g.text(33, y, tm.padStart(10), "7");
      const [bin, ...args] = p[2].split(" ");
      g.text(46, y, bin, sel ? "9" : "0"); g.text(47 + bin.length, y, args.join(" "), "1");
    }
    // footer
    const keys = [["F1", "Help"], ["F3", "Search"], ["F4", "Filter"], ["F5", "Tree"], ["F6", "SortBy"], ["F9", "Kill"], ["F10", "Quit"]];
    let x = 0;
    keys.forEach(([a, b]) => { g.text(x, H - 1, a, "0"); g.text(x + a.length, H - 1, b.padEnd(8), k < 1 && b === "SortBy" ? "9" : "a"); x += a.length + 8; });
    return g.frame();
  };
}
