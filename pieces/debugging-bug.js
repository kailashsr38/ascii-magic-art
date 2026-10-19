/* debugging-bug: a little red beetle paces along a page of code with a magnifying glass, stopping to inspect the line with the error. */
import { Grid, palette, gradient, KEYS, clamp } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const ED = add(["#0d1117", "#131a24", "#1a2230"]);
const CODE = add(["#3a414a", "#525c68", "#5a6e88", "#7a64a0", "#5a8a66", "#9a7a4a"]);
const GUT = add(["#262c34", "#3a424c"]);
const ERR = add(["#ff7b72", "#ffb4ac"]);
const SHELL = add(gradient(["#6a0e12", "#981a1e", "#c42a2a", "#e44a3a", "#ff7a5a", "#ffb08a"], 8));
const SPOT = add(["#1a0606"]);
const HEAD = add(["#2a2040", "#4a3a6a", "#6e5a94"]);
const EYE = add(["#ffffff", "#0a0a0a"]);
const LEG = add(["#8a7aa8"]);
const GLASS = add(["#c8962a", "#f0c050", "#ffe08a", "#5a3a1a"]);
const LENS = add(["#cfe8ff", "#e6edf3", "#79c0ff", "#d2a8ff", "#7ee787"]);

export const meta = {
  slug: "debugging-bug",
  name: "Bug With a Magnifier",
  category: "mascots",
  note: "A little red beetle paces along a page of code holding up a magnifying glass, stopping to peer at the line with the error underlined in red.",
  tags: ["bug", "mascot", "debugging", "developer", "code", "readme"],
  cols: 64, rows: 28, fps: 24,
  palette: palette(P),
};

const ell = (g, cx, cy, rx, ry, fn) => {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy;
    if (d <= 1) fn(x, y, dx, dy, d);
  }
};
const SRC = [
  "import { load } from './store'", "", "export function total(cart) {", "  let sum = 0", "  for (const item of cart.items) {",
  "    sum += item.price * item.qty", "  }", "  return sum", "}", "", "function shipping(order) {", "  if (order.express) {",
  "    return rate.express", "  }", "  return order.qty * rates[order.adress]", "}", "", "const cart = load('cart')", "console.log(total(cart))",
  "", "// TODO: tax per region", "export default total", "",
];
const ERR_ROW = 15, ERR_COL = 7 + SRC[14].indexOf("adress"), ERR_LEN = 6;
const INS = ERR_COL + 3 - 21;
const LOOP = 16;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const bgc = [], bgk = [];
  const kw = /\b(import|from|export|function|let|const|for|of|return|if|default)\b/g;
  for (let y = 0; y < rows; y++) {
    const line = SRC[y - 1] || "";
    const colour = new Array(cols).fill(CODE + 1);
    let m; kw.lastIndex = 0;
    while ((m = kw.exec(line))) for (let i = 0; i < m[0].length; i++) colour[7 + m.index + i] = CODE + 3;
    for (let i = 0; i < line.length; i++) if (line[i] === "'" || /[0-9]/.test(line[i])) colour[7 + i] = CODE + 5;
    for (let x = 0; x < cols; x++) {
      let ch = " ", k = ED + (y === 24 ? 2 : 0);
      if (y >= 1 && y <= SRC.length && x < 4) { const s = String(y).padStart(3, " ") + " "; ch = s[x]; k = GUT; }
      else if (x === 5) { ch = "│"; k = GUT; }
      else if (x >= 7 && x - 7 < line.length) { ch = line[x - 7]; k = colour[x]; }
      if (ch === " ") { ch = "█"; k = y === ERR_ROW ? ED + 2 : ED + (y === 24 ? 2 : 1); }
      bgc.push(ch); bgk.push(KEYS[k]);
    }
  }
  return (t) => {
    for (let i = 0; i < bgc.length; i++) { g.ch[i] = bgc[i]; g.co[i] = bgk[i]; }
    // the error token and its squiggle
    const ey = ERR_ROW;
    for (let i = 0; i < ERR_LEN; i++) { g.co[ERR_COL + i + ey * cols] = KEYS[ERR]; g.set(ERR_COL + i, ey + 1, i % 2 ? "^" : "~", KEYS[ERR]); }
    // pacing: walk right, stop at the error, inspect, walk back
    const p = t % LOOP;
    let bx, dir, walking = true, inspect = false;
    if (p < 5) { bx = 14 + (p / 5) * (INS - 14); dir = 1; }
    else if (p < 9) { bx = INS; dir = 1; walking = false; inspect = true; }
    else if (p < 12.5) { bx = INS + ((p - 9) / 3.5) * (36 - INS); dir = 1; }
    else { bx = 36 - ((p - 12.5) / 3.5) * 22; dir = -1; }
    const gy = 23;
    const step = walking ? Math.floor(t * 8) % 2 : 0;
    const X = (dx) => bx + dx * dir;
    // legs
    for (let i = 0; i < 3; i++) {
      const lx = X(-5 + i * 4), lift = (i + step) % 2 === 0 && walking ? 1 : 0;
      g.set(lx, gy - 2, "█", KEYS[LEG]); g.set(lx + dir * (lift ? 1 : -1) * 0.6, gy - 1, "█", KEYS[LEG]);
      g.set(lx + dir * (lift ? 1 : -1), gy - lift, "▀", KEYS[LEG]);
    }
    // shell
    ell(g, X(-1), 18, 10, 4.8, (x, y, dx, dy, d) => {
      const lit = clamp(0.55 - dy * 0.35 + dx * dir * 0.1 + Math.sqrt(1 - d) * 0.35);
      const spot = [[-4, -1], [1, -2], [4, 1], [-2, 2], [-6, 1]].some(([sx, sy]) => Math.hypot(x + 0.5 - X(sx - 1), (y + 0.5 - 18 - sy) * 2) < 1.6);
      g.set(x, y, spot ? "█" : d > 0.85 ? "▓" : "█", spot ? KEYS[SPOT] : KEYS[SHELL + Math.min(7, Math.floor(lit * 8))]);
    });
    g.text(Math.round(X(-1)) - 4, 13, "▄▄▄▄▄▄▄▄", KEYS[SHELL + 7]);
    g.text(Math.round(X(-1 - dir * 3)) - 1, 14, "▀▀▀", KEYS[SHELL + 7]);
    // head
    const hx = X(9.5), hy = 18;
    ell(g, hx, hy, 4.4, 3, (x, y, dx, dy) => g.set(x, y, "█", KEYS[HEAD + (dy < 0 ? 2 : 1)]));
    // antennae, bobbing
    const ab = Math.sin(t * 5) * 0.6;
    g.line(hx + dir * 1, hy - 2, hx + dir * 3, hy - 5 + ab, "▪", KEYS[HEAD + 2]);
    g.set(hx + dir * 3.5, hy - 5.5 + ab, "●", KEYS[HEAD + 2]);
    g.line(hx - dir * 1, hy - 2, hx - dir * 0, hy - 5.5 - ab, "▪", KEYS[HEAD + 2]);
    g.set(hx, hy - 6 - ab, "●", KEYS[HEAD + 2]);
    // eye looking toward the lens
    const blink = Math.abs((t % 3.6) - 2.2) < 0.12;
    const ex = Math.round(hx + dir * 0.5) - 1, eyy = Math.round(hy - 1);
    if (blink) g.text(ex, eyy + 1, "▀▀▀", KEYS[EYE]);
    else { g.text(ex, eyy, "▄█▄", KEYS[EYE]); g.text(ex, eyy + 1, "▀█▀", KEYS[EYE]); g.set(ex + 1 + dir, eyy + 1, "▀", KEYS[EYE + 1]); g.set(ex + 1 + dir, eyy, "▄", KEYS[EYE + 1]); }
    g.set(hx + dir * 3, hy + 1, "▄", KEYS[ERR + 1]);
    // magnifying glass held out front; dips down over the error while inspecting
    const lcx = inspect ? ERR_COL + 3 : X(21), lcy = inspect ? ey + 0.5 + Math.sin(t * 2) * 0.3 : 17 + Math.sin(t * 3) * 0.4;
    g.line(X(12), 20, lcx - dir * 5, lcy + 2, "█", KEYS[GLASS + 3]);
    ell(g, lcx, lcy, 6, 3.2, (x, y, dx, dy, d) => {
      if (d > 0.62) { g.set(x, y, "█", KEYS[GLASS + (dy < 0 ? 2 : dx < 0 ? 1 : 0)]); return; }
      g.set(x, y, "░", KEYS[LENS + 2]);
    });
    // what the lens sees, drawn spaced out bigger
    const cxr = Math.round(lcx), cyr = Math.round(lcy);
    const src = SRC[cyr - 1] || "";
    for (let k = -1; k <= 1; k++) {
      const ch = src[cxr - 7 + k] || "·";
      const isErr = cyr === ey && cxr + k >= ERR_COL && cxr + k < ERR_COL + ERR_LEN;
      g.set(cxr + k * 2, cyr, ch, KEYS[isErr ? ERR : LENS + 1]);
    }
    g.set(cxr - 2, cyr - 1, "▗", KEYS[LENS]);
    if (inspect) { g.text(Math.round(hx) - 1, 9, "▄█▄", KEYS[ERR]); g.text(Math.round(hx) - 1, 10, " █ ", KEYS[ERR]); g.text(Math.round(hx) - 1, 11, " ▄ ", KEYS[ERR]); }
    return g.frame();
  };
}
