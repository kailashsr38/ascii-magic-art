/* er-diagram: database tables with fields and relationship lines lighting up one join at a time. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "er-diagram",
  name: "ER Diagram",
  category: "explainers",
  note: "An entity relationship diagram of a shop database where each foreign key link lights up in turn with its join written below.",
  tags: ["database", "schema", "erd", "sql", "diagram", "docs"],
  cols: 90, rows: 23, fps: 20,
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#79c0ff", "#7ee787", "#ffa657", "#d2a8ff", "#f2cc60", "#ffffff", "#6e7681", "#56d4dd"]),
};

const CORNER = { RD: "╮", RU: "╯", LD: "╭", LU: "╰", DR: "╰", DL: "╯", UR: "╭", UL: "╮" };
const dirOf = (a, b) => (b[0] > a[0] ? "R" : b[0] < a[0] ? "L" : b[1] > a[1] ? "D" : "U");
function cellsOf(pts) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    let [x, y] = out[out.length - 1];
    const [tx, ty] = pts[i];
    while (x !== tx || y !== ty) { x += Math.sign(tx - x); y += Math.sign(ty - y); out.push([x, y]); }
  }
  return out;
}

// name, x, y, fields [name, type, key]
const TABLES = {
  users: [3, 0, [["id", "bigint", "PK"], ["email", "text", ""], ["name", "text", ""], ["created_at", "datetime", ""]]],
  orders: [33, 0, [["id", "bigint", "PK"], ["user_id", "bigint", "FK"], ["total", "numeric", ""], ["status", "text", ""], ["placed_at", "datetime", ""]]],
  addresses: [3, 12, [["id", "bigint", "PK"], ["user_id", "bigint", "FK"], ["city", "text", ""], ["country", "char(2)", ""]]],
  order_items: [33, 12, [["id", "bigint", "PK"], ["order_id", "bigint", "FK"], ["product_id", "bigint", "FK"], ["qty", "int", ""], ["price", "numeric", ""]]],
  products: [64, 12, [["id", "bigint", "PK"], ["sku", "text", ""], ["name", "text", ""], ["price", "numeric", ""]]],
};
const W = 26;
const fy = (tb, i) => TABLES[tb][1] + 3 + i;

const RELS = [
  ["users", 0, "orders", 1, [[29, fy("users", 0)], [31, fy("users", 0)], [31, fy("orders", 1)], [32, fy("orders", 1)]], "5"],
  ["users", 0, "addresses", 1, [[2, fy("users", 0)], [1, fy("users", 0)], [1, fy("addresses", 1)], [2, fy("addresses", 1)]], "4"],
  ["orders", 0, "order_items", 1, [[59, fy("orders", 0)], [61, fy("orders", 0)], [61, fy("order_items", 1)], [59, fy("order_items", 1)]], "6"],
  ["products", 0, "order_items", 2, [[63, fy("products", 0)], [62, fy("products", 0)], [62, fy("order_items", 2)], [59, fy("order_items", 2)]], "a"],
];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const paths = RELS.map((r) => cellsOf(r[4]));
  return (t) => {
    g.clear();
    const STEP = 2.2;
    const k = Math.floor(t / STEP) % RELS.length;
    const p = Math.min(1, (t % STEP) / 0.7);
    const [ta, fa, tb, fb, , rco] = RELS[k];
    // relationship lines
    paths.forEach((cells, i) => {
      const on = i === k;
      const n = on ? Math.max(1, Math.floor(p * cells.length)) : cells.length;
      for (let j = 0; j < cells.length; j++) {
        const [x, y] = cells[j];
        const din = j ? dirOf(cells[j - 1], cells[j]) : dirOf(cells[j], cells[j + 1]);
        const dout = j < cells.length - 1 ? dirOf(cells[j], cells[j + 1]) : din;
        let ch = din === dout ? (din === "R" || din === "L" ? "─" : "│") : CORNER[din + dout];
        if (j === 0) ch = "┼";
        if (j === cells.length - 1) ch = din === "R" ? "<" : ">";
        g.set(x, y, ch, on && j < n ? RELS[i][5] : "9");
      }
    });
    // tables
    for (const [name, [x, y, fields]] of Object.entries(TABLES)) {
      const on = name === ta || name === tb;
      const h = fields.length + 4;
      const co = on ? rco : "1";
      g.box(x, y, W, h, "round", co);
      g.hline(x + 1, x + W - 2, y + 2, "─", co);
      g.set(x, y + 2, "├", co); g.set(x + W - 1, y + 2, "┤", co);
      g.text(x + 2, y + 1, name, on ? "8" : "0");
      g.text(x + W - 2 - String(fields.length).length - 5, y + 1, fields.length + " cols", "9");
      fields.forEach(([f, type, key], i) => {
        const hot = (name === ta && i === fa) || (name === tb && i === fb);
        g.text(x + 2, y + 3 + i, key ? key : "  ", key === "PK" ? "7" : "3");
        g.text(x + 5, y + 3 + i, f, hot ? "8" : key ? "0" : "1");
        g.text(x + W - 2 - type.length, y + 3 + i, type, hot ? rco : "9");
        if (hot && p >= 1) g.set(x + 1, y + 3 + i, "►", rco);
      });
    }
    // the join, typed out
    const join = `JOIN ${tb} ON ${tb}.${TABLES[tb][2][fb][0]} = ${ta}.${TABLES[ta][2][fa][0]}`;
    const n = Math.floor(Math.min(1, (t % STEP) / 1.2) * join.length);
    g.hline(0, cols - 1, rows - 2, "─", "2");
    g.text(1, rows - 1, "sql>", "9");
    g.text(6, rows - 1, join.slice(0, n), "0");
    if (n < join.length || Math.floor(t * 3) % 2) g.set(6 + n, rows - 1, "█", "1");
    g.text(cols - 22, rows - 1, "1 ─< many", "1");
    g.text(cols - 11, rows - 1, "5 tables", "1");
    return g.frame();
  };
}
