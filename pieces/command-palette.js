/* command-palette: a command palette opening over an editor, a query typed, results filtering. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "command-palette",
  name: "Command Palette",
  category: "screens",
  note: "A command palette drops over a dimmed editor, filters commands as a query is typed and runs the pick.",
  tags: ["command", "search", "editor", "app", "keyboard"],
  cols: 80, rows: 24, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#21262d", "#6e7681"]),
};

const CMDS = [
  ["Git: Push", "Ctrl+Alt+P"], ["Git: Pull", ""], ["Git: Commit All", "Ctrl+Enter"], ["Git: Create Branch...", ""],
  ["Git: Stash", ""], ["File: New File", "Ctrl+N"], ["File: Save All", "Ctrl+K S"], ["View: Toggle Terminal", "Ctrl+`"],
  ["View: Zen Mode", "Ctrl+K Z"], ["Format Document", "Shift+Alt+F"], ["Go to Line...", "Ctrl+G"], ["Go to Symbol...", "Ctrl+Shift+O"],
  ["Preferences: Color Theme", "Ctrl+K T"], ["Preferences: Keyboard Shortcuts", ""], ["Developer: Reload Window", ""],
  ["Run Build Task", "Ctrl+Shift+B"], ["Terminal: New Terminal", ""], ["Search: Find in Files", "Ctrl+Shift+F"],
  ["Toggle Line Comment", "Ctrl+/"], ["Theme: Switch to Dark", ""],
];
// [open at, query, keys down before enter, toast]
const RUNS = [[0.6, "git pu", 0, "Pushed 2 commits to origin/main"], [6.8, "theme", 1, "Theme set to Dark"]];
const PERIOD = 13;
const CODE = [
  "import { createServer } from \"./server\";",
  "import { routes } from \"./routes\";",
  "",
  "const port = Number(process.env.PORT ?? 8080);",
  "const app = createServer(routes);",
  "",
  "app.use(cors({ origin: allowList }));",
  "app.use(rateLimit({ windowMs: 60_000, max: 120 }));",
  "",
  "app.listen(port, () => {",
  "  console.log(`listening on :${port}`);",
  "});",
];

function match(name, q) {
  const hits = []; let j = 0;
  const lo = name.toLowerCase();
  for (let i = 0; i < lo.length && j < q.length; i++) if (lo[i] === q[j]) { hits.push(i); j++; }
  return j === q.length ? hits : null;
}

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    let run = null, rt = 0;
    for (const r of RUNS) if (lt >= r[0]) { run = r; rt = lt - r[0]; }
    const typeT = 0.5, qn = run ? Math.max(0, Math.min(run[1].length, Math.floor((rt - typeT) / 0.16))) : 0;
    const tDone = typeT + run?.[1].length * 0.16 + 0.4;
    const enterT = run ? tDone + run[2] * 0.5 + 0.6 : 0;
    const isOpen = run && rt < enterT + 0.15;
    const dim = isOpen;
    g.box(0, 0, W, H, "round", dim ? "8" : "7");
    g.text(2, 1, "index.ts", dim ? "8" : "0"); g.text(12, 1, "server.ts", dim ? "8" : "1");
    g.hline(1, W - 2, 2, "─", dim ? "9" : "8");
    CODE.forEach((l, i) => { g.text(2, 3 + i, String(i + 1).padStart(3), dim ? "9" : "7"); g.text(7, 3 + i, l, dim ? "8" : i % 3 === 0 ? "3" : "0"); });
    g.hline(1, W - 2, H - 3, "─", dim ? "9" : "8");
    const toast = run && !isOpen && rt < enterT + 2.6;
    g.text(2, H - 2, toast ? "✓ " + run[3] : "◆ main   0 problems", toast ? "2" : dim ? "8" : "1");
    g.text(W - 24, H - 2, "Ctrl+Shift+P  commands", dim ? "8" : "a");
    if (!isOpen) return g.frame();
    const disp = run[1].slice(0, qn), q = disp.replace(/ /g, "");
    const res = CMDS.map((c) => [c, match(c[0], q)]).filter((r) => r[1]).slice(0, 9);
    const sel = Math.max(0, Math.min(res.length - 1, run[2], rt > tDone ? Math.floor((rt - tDone) / 0.5) : 0));
    const pw = 58, px = Math.round((W - pw) / 2);
    const grow = Math.min(1, rt / 0.2);
    const ph = Math.max(3, Math.round((res.length + 4) * grow));
    g.fill(px, 1, pw, ph, " ");
    g.box(px, 1, pw, ph, "round", "a");
    if (grow < 1) return g.frame();
    g.text(px + 2, 2, ">", "3");
    g.text(px + 4, 2, disp || "Type a command", disp ? "0" : "7");
    if (Math.floor(lt * 3) % 2 === 0) g.set(px + 4 + disp.length, 2, "█", "3");
    g.text(px + pw - 12, 2, `${res.length} results`, "1");
    g.hline(px + 1, px + pw - 2, 3, "─", "8");
    res.forEach(([[name, key], hits], i) => {
      const y = 4 + i;
      const on = i === sel;
      if (on) { g.fill(px + 1, y, pw - 2, 1, "░", "9"); g.set(px + 1, y, "▌", "3"); }
      for (let k = 0; k < name.length; k++) g.set(px + 3 + k, y, name[k], hits.includes(k) && q ? "4" : on ? "0" : "1");
      if (key) g.text(px + pw - 2 - key.length, y, key, "7");
    });
    return g.frame();
  };
}
