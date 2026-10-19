/* checkout-payment-flow: a checkout page stepping from shipping to payment, processing, then a success receipt. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "checkout-payment-flow",
  name: "Checkout Payment Flow",
  category: "screens",
  note: "A checkout page fills shipping and card details, processes the payment and lands on a confirmed order.",
  tags: ["checkout", "payment", "ecommerce", "form", "app"],
  cols: 80, rows: 23, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60", "#21262d"]),
};

const ITEMS = [["Wool overshirt", "M · Olive", 1, 89.0], ["Canvas tote", "Natural", 2, 18.5], ["Ceramic mug", "Speckle", 1, 14.0]];
const SUB = ITEMS.reduce((a, i) => a + i[2] * i[3], 0);
const SHIP = 6.0, TAX = Math.round(SUB * 0.08 * 100) / 100, TOTAL = SUB + SHIP + TAX;
const FIELDS = [
  [0, "Full name", "Ana Duarte"], [0, "Address", "18 Rua das Flores"], [0, "City / Postcode", "Porto 4050-262"],
  [1, "Card number", "4111 1111 1111 4821"], [1, "Expiry", "09 / 28"], [1, "CVC", "•••"],
];
const PERIOD = 16;
const STEPS = ["Cart", "Shipping", "Payment", "Done"];
const money = (v) => "$" + v.toFixed(2);

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  // typing schedule
  const sched = []; let tt = 0.6;
  FIELDS.forEach((f, i) => { if (i === 3) tt += 0.8; sched.push([tt, tt + f[2].length * 0.07]); tt += f[2].length * 0.07 + 0.35; });
  const payT = tt + 0.4, doneT = payT + 2.2;
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    const step = lt >= doneT ? 3 : lt >= sched[3][0] - 0.4 ? 2 : 1;
    g.box(0, 0, W, H, "round", "7");
    g.text(2, 0, " Checkout ", "0");
    g.text(W - 16, 0, " ■ Secure SSL ", "2");
    // stepper
    STEPS.forEach((s, i) => {
      const x = 3 + i * 13;
      const done = i < step, cur = i === step;
      g.text(x, 2, done ? "✓" : cur ? "●" : "○", done ? "2" : cur ? "3" : "7");
      g.text(x + 2, 2, s, cur ? "0" : done ? "1" : "7");
      if (i < 3) g.hline(x + 3 + s.length, x + 11, 2, "─", done ? "2" : "8");
    });
    // summary panel
    const sx = 52;
    g.vline(sx - 2, 1, H - 2, "│", "8");
    g.text(sx, 4, "Order summary", "0");
    ITEMS.forEach((it, i) => {
      const y = 6 + i * 2;
      g.text(sx, y, it[0], "0"); g.text(W - 3 - money(it[2] * it[3]).length, y, money(it[2] * it[3]), "0");
      g.text(sx, y + 1, `${it[1]} · x${it[2]}`, "1");
    });
    g.hline(sx, W - 3, 12, "─", "8");
    [["Subtotal", SUB], ["Shipping", SHIP], ["Tax", TAX]].forEach(([k, v], i) => { g.text(sx, 13 + i, k, "1"); g.text(W - 3 - money(v).length, 13 + i, money(v), "1"); });
    g.text(sx, 17, "Total", "0"); g.text(W - 3 - money(TOTAL).length, 17, money(TOTAL), "2");
    if (step === 3) {
      const p = Math.min(1, (lt - doneT) / 0.4);
      const bx = 3, by = 5;
      g.box(bx, by, 44, 12, "round", "2");
      if (p > 0.5) {
        g.text(bx + 18, by + 2, "╭───╮", "2"); g.text(bx + 18, by + 3, "│ ✓ │", "2"); g.text(bx + 18, by + 4, "╰───╯", "2");
        g.text(bx + 12, by + 6, "Payment successful", "0");
        g.text(bx + 9, by + 7, "Order #A7-30218 is confirmed", "1");
        g.text(bx + 8, by + 9, "Receipt sent to ana@mailbox.pt", "3");
      }
      return g.frame();
    }
    // form
    const sect = step === 1 ? 0 : 1;
    g.text(3, 4, sect === 0 ? "Shipping address" : "Payment details", "6");
    FIELDS.filter((f) => f[0] === sect).forEach((f, k) => {
      const i = FIELDS.indexOf(f);
      const [a, b] = sched[i];
      const n = lt < a ? 0 : Math.min(f[2].length, Math.floor((lt - a) / 0.07) + 1);
      const active = lt >= a - 0.35 && lt < b + 0.35;
      const half = sect === 1 && k > 0;
      const x = half ? 3 + (k - 1) * 23 : 3, y = 6 + (half ? 1 : k) * 4 - (half ? 0 : 0);
      const w = half ? 21 : 46;
      g.text(x, y, f[1], active ? "3" : "1");
      g.box(x, y + 1, w, 3, "round", active ? "3" : "8");
      let val = f[2].slice(0, n);
      if (i === 3 && n > 0) val = val.split("").map((c, j) => (j < 15 && c !== " " && n === f[2].length && lt > b + 0.4 ? "•" : c)).join("");
      g.text(x + 2, y + 2, val, "0");
      if (active && n < f[2].length && Math.floor(lt * 4) % 2 === 0) g.set(x + 2 + n, y + 2, "▏", "3");
      if (n === f[2].length && !active) g.text(x + w - 3, y + 2, "✓", "2");
    });
    // pay button
    const by = H - 4;
    const pressing = lt >= payT && lt < doneT;
    g.box(3, by, 46, 3, pressing ? "heavy" : "round", step === 2 ? "3" : "8");
    if (pressing) {
      const sp = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"[Math.floor(lt * 12) % 10];
      g.text(18, by + 1, sp + " Processing...", "3");
    } else g.text(step === 2 ? 19 : 18, by + 1, step === 2 ? "Pay " + money(TOTAL) : "Continue to payment", step === 2 ? "0" : "1");
    return g.frame();
  };
}
