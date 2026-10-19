/* file-tree: a project explorer with folders expanding and collapsing under a moving cursor. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "file-tree",
  name: "File Tree",
  category: "screens",
  note: "A project explorer where a cursor walks the tree, opening and closing folders as it goes.",
  tags: ["ide", "editor", "explorer", "terminal", "readme"],
  cols: 54, rows: 26, fps: 20,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60"]),
};

const D = (name, kids, open = false) => ({ name, kids, open });
const F = (name, git = "") => ({ name, git });
const tree = () => D("api-gateway", [
  D(".github", [D("workflows", [F("ci.yml"), F("release.yml")])]),
  D("src", [
    D("routes", [F("auth.ts", "M"), F("billing.ts", "U"), F("users.ts")]),
    D("middleware", [F("cors.ts"), F("rateLimit.ts", "M")]),
    F("index.ts"), F("server.ts"),
  ]),
  D("tests", [F("auth.test.ts"), F("users.test.ts")]),
  F(".env.example"), F("package.json", "M"), F("tsconfig.json"), F("README.md"),
], true);

// d = down, u = up, o = toggle folder at cursor
const SCRIPT = "ddoddoddduuuoddoddduuuuuoddoddduuuuoduuu".split("");
const STEP = 0.42;

function flatten(node, depth, prefix, last, out) {
  out.push({ node, depth, prefix, last });
  if (node.kids && node.open) node.kids.forEach((k, i) => {
    const l = i === node.kids.length - 1;
    flatten(k, depth + 1, depth === 0 ? "" : prefix + (last ? "   " : "│  "), l, out);
  });
  return out;
}
const extCol = (n) => n.endsWith(".ts") ? "3" : n.endsWith(".yml") ? "6" : n.endsWith(".json") ? "9" : n.endsWith(".md") ? "0" : "1";

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const PERIOD = SCRIPT.length * STEP + 1.5;
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    const root = tree();
    let cur = 0;
    const steps = Math.min(SCRIPT.length, Math.floor(lt / STEP));
    let rows = flatten(root, 0, "", true, []);
    for (let i = 0; i < steps; i++) {
      const a = SCRIPT[i];
      if (a === "d") cur = Math.min(rows.length - 1, cur + 1);
      else if (a === "u") cur = Math.max(0, cur - 1);
      else if (rows[cur].node.kids) { rows[cur].node.open = !rows[cur].node.open; rows = flatten(root, 0, "", true, []); }
    }
    const W = meta.cols, H = meta.rows;
    g.box(0, 0, W, H, "round", "7");
    g.text(2, 0, " EXPLORER ", "1");
    g.text(W - 12, 0, " ◆ main ", "6");
    g.text(2, 1, "api-gateway", "0"); g.text(W - 14, 1, "3 changes", "4");
    g.hline(1, W - 2, 2, "─", "8");
    rows.forEach((r, i) => {
      const y = 3 + i;
      if (y > H - 4) return;
      const sel = i === cur;
      if (sel) { g.fill(1, y, W - 2, 1, "░", "8"); g.set(1, y, "▌", "3"); }
      const n = r.node;
      let x = 3;
      if (r.depth > 0) { const p = r.prefix + (r.last ? "└─ " : "├─ "); for (let k = 0; k < p.length; k++) if (p[k] !== " ") g.set(x + k, y, p[k], "7"); x += p.length; }
      if (n.kids) {
        g.set(x, y, n.open ? "▼" : "▶", sel ? "0" : "1");
        g.text(x + 2, y, n.name + "/", sel ? "0" : "3");
      } else {
        g.set(x, y, "•", extCol(n.name));
        g.text(x + 2, y, n.name, sel ? "0" : n.git === "M" ? "4" : n.git === "U" ? "2" : "0");
        if (n.git) g.set(W - 3, y, n.git, n.git === "M" ? "4" : "2");
      }
    });
    const node = rows[cur].node;
    g.hline(1, W - 2, H - 3, "─", "8");
    g.text(2, H - 2, node.kids ? (node.open ? "▼ " : "▶ ") + node.name + "/" : "• " + node.name, "0");
    g.text(W - 20, H - 2, node.kids ? `${node.kids.length} items` : "TypeScript", "1");
    g.text(W - 9, H - 2, `${cur + 1}/${rows.length}`, "1");
    return g.frame();
  };
}
