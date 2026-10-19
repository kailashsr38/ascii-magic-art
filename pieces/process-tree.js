/* process-tree: a live process tree where workers spawn, run and exit under their parents. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "process-tree",
  name: "Process Tree Live",
  category: "screens",
  note: "A live process tree with branch lines where build workers and request handlers spawn in green, run and exit in red.",
  tags: ["process", "terminal", "system", "linux", "tree", "monitor"],
  cols: 76, rows: 30, fps: 20,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60", "#56d4dd"]),
};

// [pid, parent, name, args, start, end]  (times in seconds, end Infinity = stays)
const PERIOD = 16;
const P = [
  [1, 0, "init", "", -1, 99],
  [412, 1, "sshd", "-D", -1, 99],
  [2210, 412, "sshd", "dev@pts/0", -1, 99],
  [2214, 2210, "zsh", "", -1, 99],
  [5120, 2214, "make", "-j4 all", 0.6, 11.5],
  [5133, 5120, "cc", "-O2 -c parser.c", 1.2, 4.0],
  [5134, 5120, "cc", "-O2 -c lexer.c", 1.5, 3.4],
  [5141, 5120, "cc", "-O2 -c eval.c", 3.6, 7.2],
  [5142, 5120, "cc", "-O2 -c gc.c", 4.2, 8.4],
  [5160, 5120, "ld", "-o interp *.o", 8.8, 10.6],
  [5170, 2214, "./interp", "tests/run.scm", 11.8, 15.2],
  [630, 1, "nginx", "master process", -1, 99],
  [631, 630, "nginx", "worker process", -1, 99],
  [632, 630, "nginx", "worker process", -1, 99],
  [700, 1, "postgres", "-D /var/lib/pg", -1, 99],
  [5150, 700, "postgres", "autovacuum worker", 5.0, 9.6],
  [701, 700, "postgres", "checkpointer", -1, 99],
  [702, 700, "postgres", "walwriter", -1, 99],
  [5180, 700, "postgres", "app db 10.0.0.12 idle", 2.4, 13.8],
  [880, 1, "cron", "-f", -1, 99],
  [5190, 880, "sh", "-c backup.sh", 6.0, 12.6],
  [5191, 5190, "tar", "czf /mnt/nas/home.tgz", 6.4, 12.2],
];

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    const alive = P.filter((p) => p[4] <= lt && lt < p[5] + 0.6);
    const kids = new Map();
    for (const p of alive) { if (!kids.has(p[1])) kids.set(p[1], []); kids.get(p[1]).push(p); }
    const rows = [];
    (function walk(p, prefix, last, depth) {
      rows.push([p, prefix, last, depth]);
      const ks = kids.get(p[0]) || [];
      ks.forEach((k, i) => walk(k, depth === 0 ? "" : prefix + (last ? "   " : "│  "), i === ks.length - 1, depth + 1));
    })(alive[0], "", true, 0);
    g.box(0, 0, W, H, "round", "7");
    g.text(2, 0, " ptree -p -a · build-07 ", "1");
    g.text(2, 1, "PID".padStart(6), "1"); g.text(9, 1, "CPU%", "1"); g.text(15, 1, "COMMAND", "1");
    g.text(W - 12, 1, `${alive.length} procs`, "3");
    g.hline(1, W - 2, 2, "─", "8");
    rows.forEach(([p, prefix, last, depth], i) => {
      const y = 3 + i;
      if (y > H - 4) return;
      const born = lt - p[4] < 0.6 && p[4] > 0;
      const dying = lt >= p[5];
      const c = dying ? "5" : born ? "2" : "0";
      const busy = p[5] < 99 && !dying;
      const cpu = busy ? 20 + Math.abs(Math.sin(lt * 2.3 + p[0])) * 75 : (Math.abs(Math.sin(lt * 0.7 + p[0] * 3)) * 2);
      g.text(2, y, String(p[0]).padStart(6), dying ? "5" : "7");
      g.text(9, y, cpu.toFixed(1).padStart(4), cpu > 50 ? "4" : cpu > 10 ? "9" : "7");
      let x = 15;
      if (depth > 0) { const s = prefix + (last ? "└─ " : "├─ "); g.text(x, y, s, "7"); x += s.length; }
      g.text(x, y, p[2], dying ? "5" : born ? "2" : depth === 0 ? "6" : busy ? "a" : "3");
      if (p[3]) g.text(x + p[2].length + 1, y, p[3].slice(0, W - x - p[2].length - 4), dying ? "5" : "1");
      if (born) g.text(W - 6, y, "+new", "2");
      if (dying) g.text(W - 7, y, "exit 0", "5");
      void c;
    });
    g.hline(1, W - 2, H - 3, "─", "8");
    const load = (1.2 + Math.sin(lt * 0.5) * 0.6 + alive.filter((p) => p[5] < 99).length * 0.35).toFixed(2);
    g.text(2, H - 2, "load ", "1"); g.text(7, H - 2, load, "9");
    g.text(14, H - 2, "● spawned", "2"); g.text(26, H - 2, "● exiting", "5"); g.text(38, H - 2, "● busy", "a");
    g.text(W - 18, H - 2, "refresh 0.5s", "7");
    return g.frame();
  };
}
