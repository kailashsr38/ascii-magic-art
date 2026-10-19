/* code-editor: an editor window where TypeScript is typed line by line with syntax colours. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "code-editor",
  name: "Code Editor",
  category: "screens",
  note: "An editor window with line numbers where a small rate limiter is typed out in syntax colours.",
  tags: ["code", "editor", "ide", "developer", "hero", "typing"],
  cols: 86, rows: 30, fps: 30,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#a5d6ff", "#161b22"]),
};

const SRC = `import { Store } from "./store";

export interface Limit {
  windowMs: number;
  max: number;
}

// Sliding window rate limiter, one key per client.
export async function allow(
  store: Store,
  key: string,
  limit: Limit,
): Promise<boolean> {
  const now = Date.now();
  const start = now - limit.windowMs;
  await store.trim(key, start);
  const count = await store.count(key);
  if (count >= limit.max) {
    return false;
  }
  await store.push(key, now);
  return true;
}`;
const KW = new Set(["import", "from", "export", "interface", "async", "function", "const", "await", "if", "return", "true", "false"]);
const TY = new Set(["Store", "Limit", "Promise", "boolean", "number", "string", "Date"]);

function colour(line) {
  const out = new Array(line.length).fill("0");
  const ci = line.indexOf("//");
  if (ci >= 0) for (let i = ci; i < line.length; i++) out[i] = "1";
  const end = ci >= 0 ? ci : line.length;
  let i = 0;
  while (i < end) {
    const c = line[i];
    if (c === '"') { let j = i + 1; while (j < end && line[j] !== '"') j++; for (let k = i; k <= j; k++) out[k] = "9"; i = j + 1; continue; }
    if (/[A-Za-z_]/.test(c)) {
      let j = i; while (j < end && /[A-Za-z0-9_]/.test(line[j])) j++;
      const w = line.slice(i, j);
      const col = KW.has(w) ? (w === "true" || w === "false" ? "3" : "5") : TY.has(w) ? "4" : line[j] === "(" ? "6" : line[i - 1] === "." ? "3" : "0";
      for (let k = i; k < j; k++) out[k] = col;
      i = j; continue;
    }
    if (/[0-9]/.test(c)) { out[i] = "3"; i++; continue; }
    if (/[{}()<>;:,.=\-]/.test(c)) out[i] = c === "=" || c === ">" || c === "-" ? "5" : "1";
    i++;
  }
  return out;
}

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  const lines = SRC.split("\n");
  const cols = lines.map(colour);
  // keystroke times: indentation appears instantly, small pause at line ends
  const keys = []; let tt = 0.3;
  lines.forEach((l, li) => {
    const ind = l.length - l.trimStart().length;
    for (let i = 0; i < l.length; i++) { if (i >= ind) tt += /[ (.]/.test(l[i]) ? 0.03 : 0.016 + ((i * 7 + li * 13) % 5) * 0.004; keys.push([li, i, tt]); }
    tt += l.length ? 0.16 : 0.06;
    keys.push([li + 1, -1, tt]);
  });
  const PERIOD = tt + 2.5;
  const TOP = 4, VIS = H - 7;
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    let cl = 0, cc = 0, n = 0;
    while (n < keys.length && keys[n][2] <= lt) n++;
    if (n) { const k = keys[n - 1]; cl = k[0]; cc = k[1] + 1; if (k[1] < 0) cc = lines[cl] ? lines[cl].length - lines[cl].trimStart().length : 0; }
    else { cl = 0; cc = 0; }
    g.box(0, 0, W, H, "round", "7");
    g.text(2, 0, "●", "5"); g.text(4, 0, "●", "4"); g.text(6, 0, "●", "2");
    g.text(W / 2 - 12, 0, " rate-limit.ts · api-gateway ", "1");
    g.text(2, 1, "• rate-limit.ts", "0"); g.set(18, 1, "●", "0"); g.text(21, 1, "• store.ts", "1"); g.text(33, 1, "• index.ts", "1");
    g.hline(1, W - 2, 2, "─", "8"); g.hline(2, 17, 2, "━", "3");
    g.text(2, 3, "src / middleware / rate-limit.ts", "7");
    const scroll = Math.max(0, cl - VIS + 2);
    for (let r = 0; r < VIS; r++) {
      const li = r + scroll, y = TOP + r;
      if (li >= lines.length || li > cl) break;
      g.text(2, y, String(li + 1).padStart(3), li === cl ? "0" : "7");
      const L = lines[li];
      const len = li < cl ? L.length : Math.min(L.length, cc);
      for (let i = 0; i < len; i++) g.set(7 + i, y, L[i], cols[li][i]);
      // minimap
      const m = Math.min(12, Math.ceil(L.trim().length / 4)), ind = Math.floor((L.length - L.trimStart().length) / 2);
      for (let k = 0; k < m; k++) g.set(W - 15 + ind + k, y, "▪", li === cl ? "1" : "8");
    }
    g.vline(W - 17, 3, H - 4, "│", "8");
    const cy = TOP + cl - scroll;
    if (cl < lines.length && Math.floor(lt * 2.5) % 2 === 0) g.set(7 + cc, cy, "▌", "3");
    g.hline(1, W - 2, H - 3, "─", "8");
    g.text(2, H - 2, "◆ main", "6"); g.text(10, H - 2, "✓ 0 problems", "2");
    g.text(W - 46, H - 2, `Ln ${Math.min(cl, lines.length - 1) + 1}, Col ${cc + 1}`.padEnd(14) + "Spaces: 2   UTF-8   TypeScript", "1");
    return g.frame();
  };
}
