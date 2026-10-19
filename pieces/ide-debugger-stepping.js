/* ide-debugger-stepping: a debugger stepping through code past breakpoints while variables and the call stack update. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "ide-debugger-stepping",
  name: "Debugger Stepping",
  category: "screens",
  note: "An editor debugger steps line by line through a loop, pausing on breakpoints while locals, watches and the call stack change.",
  tags: ["debugger", "ide", "breakpoints", "code", "developer", "editor"],
  cols: 104, rows: 28, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60", "#a5d6ff", "#3a3200"]),
};

const SRC = [
  "§6function §3applyDiscounts§0(cart, rules) {",
  "  §6let §0total = §40§0;",
  "  §6for §0(§6const §0item §6of §0cart) {",
  "    §6let §0price = item.price * item.qty;",
  "    §6const §0rule = rules[item.sku];",
  "    §6if §0(rule) {",
  "      price = price * (§41§0 - rule.pct);",
  "    }",
  "    total += price;",
  "  }",
  "  §6return §0Math.round(total * §4100§0) / §4100§0;",
  "}",
  "",
  "§6const §0cart = [",
  "  { sku: §a\"tea\"§0, price: §44.5§0, qty: §42§0 },",
  "  { sku: §a\"mug\"§0, price: §412§0, qty: §41§0 },",
  "  { sku: §a\"jam\"§0, price: §46.25§0, qty: §43§0 },",
  "];",
  "§3applyDiscounts§0(cart, { mug: { pct: §40.25§0 } });",
];
const BP = new Set([4, 7, 9]);
// execution trace: [line(1-based), locals]
const TRACE = [];
(function build() {
  const cart = [["tea", 4.5, 2], ["mug", 12, 1], ["jam", 6.25, 3]];
  const rules = { mug: 0.25 };
  let total = 0;
  TRACE.push([2, { total: "undefined" }]);
  TRACE.push([3, { total: "0" }]);
  for (const [sku, p, q] of cart) {
    let price = p * q;
    const it = `{sku:"${sku}"}`;
    TRACE.push([4, { total: String(total), item: it }]);
    TRACE.push([5, { total: String(total), item: it, price: String(price) }]);
    const r = rules[sku];
    TRACE.push([6, { total: String(total), item: it, price: String(price), rule: r ? `{pct:${r}}` : "undefined" }]);
    if (r) { TRACE.push([7, { total: String(total), item: it, price: String(price), rule: `{pct:${r}}` }]); price = price * (1 - r); }
    TRACE.push([9, { total: String(total), item: it, price: String(price) }]);
    total += price;
  }
  TRACE.push([11, { total: String(total) }]);
})();
const ST = 0.75;

function parse(s) { const ch = [], co = []; let c = "0"; for (let i = 0; i < s.length; i++) { if (s[i] === "§") { c = s[++i]; continue; } ch.push(s[i]); co.push(c); } return { ch, co }; }

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  const P = SRC.map(parse);
  const PERIOD = TRACE.length * ST + 2;
  const CW = 64;
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    const si = Math.min(TRACE.length - 1, Math.floor(lt / ST));
    const finished = lt >= TRACE.length * ST;
    const [line, locals] = TRACE[si];
    const prevLocals = si > 0 ? TRACE[si - 1][1] : {};
    g.box(0, 0, W, H, "round", "7");
    g.text(2, 0, " checkout.js ", "0");
    const paused = !finished;
    g.text(16, 0, paused ? (BP.has(line) ? " ● Paused on breakpoint " : " ● Paused on step ") : " ► Running ", paused ? "4" : "2");
    const tb = ["► Continue F5", "↓ Step Over F10", "→ Step Into F11", "■ Stop"];
    let x = 2; tb.forEach((s, i) => { g.text(x, 1, s, i === 1 && paused ? "3" : "1"); x += s.length + 3; });
    g.hline(1, W - 2, 2, "─", "8");
    P.forEach((p, i) => {
      const y = 3 + i;
      if (y >= H - 1) return;
      const ln = i + 1, cur = paused && ln === line;
      if (cur) g.fill(1, y, CW - 1, 1, "░", "b");
      if (BP.has(ln)) g.set(2, y, "●", "5");
      if (cur) g.set(3, y, "►", "9");
      g.text(4, y, String(ln).padStart(3), cur ? "9" : "7");
      p.ch.forEach((c, j) => { if (8 + j < CW) g.set(8 + j, y, c, p.co[j]); });
      // inline value hint
      if (cur && locals.price) g.text(Math.min(CW - 14, 9 + p.ch.length + 2), y, "price=" + locals.price, "6");
    });
    g.vline(CW, 3, H - 2, "│", "8");
    const rx = CW + 2;
    g.text(rx, 3, "VARIABLES", "1");
    let y = 4;
    g.text(rx, y++, "▼ Local", "6");
    Object.entries(locals).forEach(([k, v]) => {
      const changed = prevLocals[k] !== v;
      g.text(rx + 2, y, k + ":", "3");
      g.text(rx + 3 + k.length, y, v.slice(0, W - rx - 6 - k.length), changed ? "9" : "0");
      y++;
    });
    y++;
    g.text(rx, y++, "▼ Watch", "6");
    g.text(rx + 2, y, "cart.length:", "3"); g.text(rx + 15, y++, "3", "0");
    g.text(rx + 2, y, "total > 20:", "3"); g.text(rx + 14, y++, String(parseFloat(locals.total) > 20), "0");
    y++;
    g.text(rx, y++, "CALL STACK", "1");
    g.text(rx + 2, y++, "applyDiscounts  :" + line, "0");
    g.text(rx + 2, y++, "<module>        :19", "1");
    g.text(rx + 2, y++, "run             :1", "7");
    y++;
    g.text(rx, y++, "BREAKPOINTS", "1");
    [...BP].forEach((b) => { g.text(rx + 2, y, "● checkout.js:" + b, b === line && paused ? "4" : "1"); y++; });
    if (finished) g.text(rx, H - 2, "→ returned 27.75", "2");
    return g.frame();
  };
}
