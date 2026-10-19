/* merge-conflict-resolver: a side by side merge editor where conflicts are resolved one at a time into the result pane. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "merge-conflict-resolver",
  name: "Merge Conflict Resolver",
  category: "screens",
  note: "A three pane merge editor walks through conflicting hunks, accepting ours, theirs or both until the file is clean.",
  tags: ["git", "merge", "conflict", "diff", "developer", "editor"],
  cols: 104, rows: 26, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60", "#1b3a24", "#14304d"]),
};

const COMMON = [
  "export function priceFor(cart, user) {",
  "  let total = 0;",
  null, // conflict 0
  "  if (user.coupon) {",
  null, // conflict 1
  "  }",
  null, // conflict 2
  "  return total;",
  "}",
];
const C = [
  { ours: ["  for (const item of cart.items) {", "    total += item.price * item.qty;", "  }"],
    theirs: ["  for (const line of cart.lines) {", "    total += line.unit * line.qty;", "  }"], pick: "theirs" },
  { ours: ["    total *= 1 - user.coupon.pct;"], theirs: ["    total -= user.coupon.flat ?? 0;"], pick: "both" },
  { ours: ["  total = Math.round(total);"], theirs: ["  total = roundCents(total);", "  total += taxFor(user.region, total);"], pick: "ours" },
];
const STEP = 3.0, LEAD = 1.0, PERIOD = LEAD + C.length * STEP + 3;

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  const PW = 50;
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    const active = Math.min(C.length, Math.max(0, Math.floor((lt - LEAD) / STEP)));
    const resolved = (i) => lt >= LEAD + i * STEP + 2.0;
    const remaining = C.filter((_, i) => !resolved(i)).length;
    g.box(0, 0, W, H, "round", "7");
    g.text(2, 0, " src/pricing.ts ", "0");
    g.text(W - 30, 0, remaining ? ` ${remaining} of 3 conflicts left ` : " ✓ all conflicts resolved ", remaining ? "4" : "2");
    // top panes: ours / theirs
    const top = 1, ph = 12;
    g.text(2, top, "● Current (feature/coupons)", "2");
    g.text(PW + 3, top, "● Incoming (main)", "3");
    g.vline(PW + 1, top, top + ph, "│", "8");
    const drawSide = (x, side, col) => {
      let y = top + 1;
      COMMON.forEach((l, li) => {
        if (l !== null) { g.text(x, y, String(y - top).padStart(2), "7"); g.text(x + 3, y++, l.slice(0, PW - 4), "1"); return; }
        const ci = COMMON.slice(0, li).filter((v) => v === null).length;
        const c = C[ci], on = ci === active && !resolved(ci), done = resolved(ci);
        const lines = c[side];
        const picked = done && (c.pick === side || c.pick === "both");
        lines.forEach((s) => {
          if (on) g.fill(x - 1, y, PW - 1, 1, "░", side === "ours" ? "a" : "b");
          g.set(x - 1, y, done ? (picked ? "✓" : " ") : "▌", done ? "2" : col);
          g.text(x, y, String(y - top).padStart(2), "7");
          g.text(x + 3, y, s.slice(0, PW - 4), done && !picked ? "8" : on ? "0" : col);
          y++;
        });
        if (on) {
          const pulse = lt - (LEAD + ci * STEP);
          const btn = side === "ours" ? "Accept Current" : "Accept Incoming";
          const hl = pulse > 1.3 && (c.pick === side || c.pick === "both");
          g.text(x + 3, y, "[" + btn + "]", hl ? "9" : "7");
          if (side === "theirs") g.text(x + 23, y, "[Accept Both]", c.pick === "both" && pulse > 1.3 ? "9" : "7");
          y++;
        }
      });
    };
    drawSide(2, "ours", "2");
    drawSide(PW + 4, "theirs", "3");
    // result pane
    const ry = top + ph + 1;
    g.hline(1, W - 2, ry, "─", "8");
    g.text(2, ry, " Result ", "6");
    let y = ry + 1;
    COMMON.forEach((l, li) => {
      if (y >= H - 1) return;
      if (l !== null) { g.text(4, y, l, "0"); y++; return; }
      const ci = COMMON.slice(0, li).filter((v) => v === null).length;
      const c = C[ci];
      if (!resolved(ci)) {
        g.text(4, y, "<<<<<<< conflict " + (ci + 1) + ", choose a side above", ci === active ? "4" : "5");
        y++; return;
      }
      const lines = c.pick === "both" ? [...c.ours, ...c.theirs] : c[c.pick];
      const fresh = lt < LEAD + ci * STEP + 2.6;
      lines.forEach((s) => { if (y < H - 1) { g.set(2, y, "+", "2"); g.text(4, y, s, fresh ? "2" : "0"); y++; } });
    });
    return g.frame();
  };
}
