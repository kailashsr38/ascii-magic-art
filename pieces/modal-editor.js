/* modal-editor: a modal text editor switching between normal, insert and command modes while editing a config file. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "modal-editor",
  name: "Modal Editor Session",
  category: "screens",
  note: "A modal terminal text editor where the cursor hops, a line is deleted, a new one inserted, a search and replace runs and the file is saved.",
  tags: ["vim", "editor", "terminal", "developer", "typing", "config"],
  cols: 80, rows: 26, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60", "#56d4dd", "#1f6feb"]),
};

const START = [
  "# edge proxy config",
  "[server]",
  "listen      = 0.0.0.0:8080",
  "workers     = 4",
  "timeout_ms  = 3000",
  "log_level   = debug",
  "",
  "[upstream.api]",
  "host        = 10.0.0.21:9000",
  "host        = 10.0.0.22:9000",
  "retries     = 2",
  "",
  "[upstream.static]",
  "host        = 10.0.0.30:9100",
  "cache_ttl   = 60",
];

// script steps: [duration, action]
function steps() {
  const S = [];
  const keys = (k, d = 0.22) => S.push([d, { keys: k }]);
  keys("j", 0.3); keys("j"); keys("j"); keys("j"); keys("j");
  S.push([0.5, { keys: "dd", op: (st) => { st.lines.splice(st.r, 1); } }]);
  S.push([0.4, { keys: "O", op: (st) => { st.lines.splice(st.r, 0, ""); st.c = 0; st.mode = "INSERT"; } }]);
  const ins = "log_level   = info";
  for (let i = 0; i < ins.length; i++) S.push([0.05, { op: (st) => { st.lines[st.r] += ins[i]; st.c = st.lines[st.r].length; } }]);
  S.push([0.5, { keys: "Esc", op: (st) => { st.mode = "NORMAL"; st.c = Math.max(0, st.c - 1); } }]);
  keys("j"); keys("j"); keys("j");
  S.push([0.3, { keys: "w", op: (st) => { st.c = 14; } }]);
  S.push([0.4, { keys: "cw", op: (st) => { st.lines[st.r] = st.lines[st.r].slice(0, 14); st.mode = "INSERT"; } }]);
  const v = "10.0.0.24:9000";
  for (let i = 0; i < v.length; i++) S.push([0.05, { op: (st) => { st.lines[st.r] += v[i]; st.c = st.lines[st.r].length; } }]);
  S.push([0.5, { keys: "Esc", op: (st) => { st.mode = "NORMAL"; st.c--; } }]);
  const cmd = ":%s/9000/9443/g";
  S.push([0.2, { op: (st) => { st.mode = "COMMAND"; st.cmd = ":"; } }]);
  for (let i = 1; i < cmd.length; i++) S.push([0.07, { op: (st) => { st.cmd = cmd.slice(0, i + 1); } }]);
  S.push([1.0, { op: (st) => { st.lines = st.lines.map((l) => l.replace(/9000/g, "9443")); st.mode = "NORMAL"; st.cmd = ""; st.msg = "2 substitutions on 2 lines"; st.hl = "9443"; } }]);
  S.push([0.2, { op: (st) => { st.mode = "COMMAND"; st.cmd = ":"; st.msg = ""; } }]);
  S.push([0.12, { op: (st) => { st.cmd = ":w"; } }]);
  S.push([0.12, { op: (st) => { st.cmd = ":wq"; } }]);
  S.push([2.2, { op: (st) => { st.mode = "NORMAL"; st.cmd = ""; st.saved = true; st.msg = "\"proxy.conf\" 15L, 312B written"; } }]);
  return S;
}

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  const S = steps();
  const PERIOD = 0.8 + S.reduce((a, s) => a + s[0], 0);
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    const st = { lines: START.slice(), r: 0, c: 0, mode: "NORMAL", cmd: "", msg: "", hl: "", saved: false, last: "" };
    let tt = 0.8;
    for (const [d, a] of S) {
      if (tt > lt) break;
      if (a.keys === "j") { st.r = Math.min(st.lines.length - 1, st.r + 1); st.c = Math.min(st.c, Math.max(0, st.lines[st.r].length - 1)); }
      if (a.op) a.op(st);
      if (a.keys) st.last = a.keys;
      if (a.keys && a.keys !== "Esc") st.dirty = true;
      tt += d;
    }
    const TOP = 0, VIS = H - 2;
    for (let i = 0; i < VIS; i++) {
      const y = TOP + i;
      const L = st.lines[i];
      if (L === undefined) { g.set(0, y, "~", "b"); continue; }
      const cur = i === st.r;
      g.text(0, y, String(cur ? i + 1 : Math.abs(i - st.r)).padStart(3), cur ? "9" : "7");
      const x0 = 4;
      if (cur) g.fill(x0, y, W - x0, 1, " ");
      if (L.startsWith("#")) g.text(x0, y, L, "1");
      else if (L.startsWith("[")) g.text(x0, y, L, "6");
      else {
        const eq = L.indexOf("=");
        if (eq < 0) g.text(x0, y, L, "0");
        else {
          g.text(x0, y, L.slice(0, eq), "3"); g.text(x0 + eq, y, "=", "5");
          const val = L.slice(eq + 1);
          g.text(x0 + eq + 1, y, val, /^\s*\d+$/.test(val) ? "4" : "2");
          if (st.hl) { let k = L.indexOf(st.hl); while (k >= 0) { g.text(x0 + k, y, st.hl, "9"); k = L.indexOf(st.hl, k + 1); } }
        }
      }
      if (cur && st.mode !== "COMMAND") {
        const ch = L[st.c] || " ";
        if (st.mode === "INSERT") { if (Math.floor(lt * 3) % 2 === 0) g.set(x0 + st.c, y, "▏", "0"); }
        else if (Math.floor(lt * 2.5) % 3 !== 2) g.set(x0 + st.c, y, "█", "0");
      }
    }
    // status line
    const SY = H - 2;
    g.fill(0, SY, W, 1, "▄", "8");
    const modeC = st.mode === "INSERT" ? "2" : st.mode === "COMMAND" ? "4" : "3";
    g.text(0, SY, ` ${st.mode} `, modeC);
    g.text(10, SY, ` proxy.conf${st.dirty && !st.saved ? " [+]" : ""} `, "0");
    g.text(W - 30, SY, ` conf  utf-8  ${String(st.r + 1).padStart(2)}:${String(st.c + 1).padEnd(3)} `, "1");
    g.text(W - 6, SY, ` ${Math.round(((st.r + 1) / st.lines.length) * 100)}% `.padStart(6), modeC);
    // command line
    if (st.mode === "COMMAND") { g.text(0, H - 1, st.cmd, "0"); if (Math.floor(lt * 3) % 2 === 0) g.set(st.cmd.length, H - 1, "█", "0"); }
    else if (st.mode === "INSERT") g.text(0, H - 1, "-- INSERT --", "2");
    else if (st.msg) g.text(0, H - 1, st.msg, st.saved ? "2" : "1");
    if (st.last && st.mode === "NORMAL") g.text(W - 12, H - 1, st.last.padStart(4), "7");
    return g.frame();
  };
}
