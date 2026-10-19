/* tab-bar: editor tabs switching while the active underline slides to the new tab. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "tab-bar",
  name: "Tab Bar",
  category: "screens",
  note: "An editor tab bar where the active underline slides between files and the content swaps beneath.",
  tags: ["tabs", "editor", "ide", "app", "navigation"],
  cols: 80, rows: 20, fps: 30,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#a5d6ff", "#f2cc60"]),
};

const TABS = [
  ["index.ts", "3", "src / index.ts", [
    "§5import§0 { createServer } §5from§9 \"./server\"§0;",
    "§5import§0 { routes } §5from§9 \"./routes\"§0;",
    "",
    "§5const§0 port = §3Number§0(process.env.PORT ?? §38080§0);",
    "§5const§0 app = §6createServer§0(routes);",
    "",
    "app.§6listen§0(port, () => {",
    "  console.§6log§0(§9`listening on :${port}`§0);",
    "});",
  ]],
  ["server.go", "9", "cmd / server.go", [
    "§5package§0 main",
    "",
    "§5func§0 §6main§0() {",
    "    mux := http.§6NewServeMux§0()",
    "    mux.§6HandleFunc§0(§9\"/health\"§0, health)",
    "    log.§6Fatal§0(http.§6ListenAndServe§0(§9\":8080\"§0, mux))",
    "}",
  ]],
  ["README.md", "0", "README.md", [
    "§3# api-gateway",
    "",
    "Edge router for all public traffic.",
    "",
    "§3## Quick start",
    "",
    "§1```sh",
    "§0npm install && npm run dev",
    "§1```",
  ]],
  ["theme.css", "6", "web / theme.css", [
    "§2:root§0 {",
    "  §9--bg§0: §4#0d1117§0;",
    "  §9--ink§0: §4#e6edf3§0;",
    "  §9--accent§0: §4#79c0ff§0;",
    "}",
    "",
    "§2.card§0 {",
    "  §9border-radius§0: §48px§0;",
    "  §9padding§0: §416px 20px§0;",
    "}",
  ]],
  ["app.py", "a", "worker / app.py", [
    "§5from§0 queue §5import§0 Worker",
    "",
    "§5def§0 §6handle§0(job):",
    "    §5if§0 job.kind == §9\"email\"§0:",
    "        §5return§0 §6send_email§0(job.payload)",
    "    §5raise§0 §3ValueError§0(job.kind)",
    "",
    "Worker(§9\"jobs\"§0).§6run§0(handle)",
  ]],
];
const ORDER = [0, 2, 1, 4, 3, 1];
const STEP = 2;
const ease = (v) => { v = Math.max(0, Math.min(1, v)); return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2; };

function seg(g, x, y, s) {
  let c = "0", i = 0;
  for (let k = 0; k < s.length; k++) {
    if (s[k] === "§") { c = s[k + 1]; k++; continue; }
    g.set(x + i++, y, s[k], c);
  }
}

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  const xs = []; let x = 1;
  for (const [n] of TABS) { xs.push([x, n.length + 6]); x += n.length + 7; }
  return (t) => {
    g.clear();
    const n = ORDER.length, lt = t % (n * STEP);
    const i = Math.floor(lt / STEP), f = (lt % STEP);
    const from = ORDER[(i + n - 1) % n], to = ORDER[i];
    const e = ease(f / 0.45);
    const active = e > 0.5 ? to : from;
    g.box(0, 0, W, H, "round", "7");
    TABS.forEach(([name, c], k) => {
      const [tx, tw] = xs[k];
      const on = k === active;
      g.set(tx + 2, 1, "•", c);
      g.text(tx + 4, 1, name, on ? "0" : "1");
      g.set(tx + tw, 1, "│", "8");
      if (k === 1) g.set(tx + tw - 1, 1, "●", on ? "0" : "1");
      else if (on) g.set(tx + tw - 1, 1, "×", "1");
    });
    g.hline(1, W - 2, 2, "─", "8");
    const [ax, aw] = xs[from], [bx, bw] = xs[to];
    const ux = Math.round(ax + (bx - ax) * e), uw = Math.round(aw + (bw - aw) * e);
    g.hline(ux, ux + uw - 1, 2, "━", "3");
    const tab = TABS[active];
    g.text(2, 3, tab[2], "1");
    const reveal = e > 0.5 ? Math.min(1, (f - 0.22) / 0.35) : 1;
    tab[3].forEach((line, r) => {
      const y = 5 + r;
      g.text(2, y, String(r + 1).padStart(3), "7");
      if (r / tab[3].length <= reveal) seg(g, 7, y, line);
    });
    g.hline(1, W - 2, H - 3, "─", "8");
    g.text(2, H - 2, "◆ main", "6");
    g.text(11, H - 2, `${TABS.length} open · ${tab[0]}`, "1");
    g.text(W - 26, H - 2, "Ln 1, Col 1   UTF-8   LF", "1");
    return g.frame();
  };
}
