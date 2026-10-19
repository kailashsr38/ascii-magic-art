/* pricing-toggle-table: a three tier pricing table flipping between monthly and yearly with prices rolling. */
import { Grid, palette, bigText } from "../lib/kit.js";

export const meta = {
  slug: "pricing-toggle-table",
  name: "Pricing Plan Toggle",
  category: "screens",
  note: "A three plan pricing table where the billing switch flips between monthly and yearly, prices roll to the new numbers and a plan is picked.",
  tags: ["pricing", "plans", "saas", "toggle", "landing", "app"],
  cols: 96, rows: 26, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60"]),
};

const PLANS = [
  ["Starter", 9, 7, ["1 project", "5 GB storage", "Email support", "Basic analytics"], "1"],
  ["Team", 24, 19, ["10 projects", "100 GB storage", "Priority support", "Shared workspaces", "Audit log"], "3"],
  ["Scale", 59, 47, ["Unlimited projects", "1 TB storage", "24/7 support", "SSO and roles", "Custom limits"], "6"],
];
const SEG = 5;

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  return (t) => {
    g.clear();
    const lt = t % (SEG * 2);
    const yearly = lt >= SEG;
    const f = lt % SEG;
    const sw = Math.min(1, f / 0.3);
    const knob = yearly ? sw : 1 - sw;
    g.box(0, 0, W, H, "round", "7");
    g.text(W / 2 - 13, 1, "Simple plans for every team", "0");
    // toggle
    const tx = W / 2 - 14;
    g.text(tx, 3, "Monthly", yearly ? "1" : "0");
    const kx = Math.round(knob * 4);
    g.set(tx + 9, 3, "(", "7");
    for (let k = 0; k < 5; k++) g.set(tx + 10 + k, 3, k === kx ? "●" : k < kx ? "━" : "─", k === kx ? "0" : yearly ? "2" : "7");
    g.set(tx + 15, 3, ")", "7");
    g.text(tx + 17, 3, "Yearly", yearly ? "0" : "1");
    g.text(tx + 24, 3, "save 20%", yearly ? "2" : "7");
    const pick = 1;
    PLANS.forEach(([name, m, y, feats, c], i) => {
      const x = 3 + i * 31, by = 5, bw = 29, bh = 19;
      const hot = i === pick;
      g.box(x, by, bw, bh, hot ? "heavy" : "round", hot ? c : "8");
      if (hot) g.text(x + bw - 15, by, " Most popular ", "9");
      g.text(x + 2, by + 1, name, c);
      // rolling price
      const from = yearly ? m : y, to = yearly ? y : m;
      const p = Math.min(1, Math.max(0, (f - 0.2 - i * 0.08) / 0.5));
      const val = Math.round(from + (to - from) * (1 - (1 - p) ** 3));
      g.text(x + 2, by + 3, "$", "0");
      const w = bigText(g, x + 4, by + 3, String(val), p < 1 && f < 1 ? "4" : "0");
      g.text(x + 5 + w, by + 6, "/ mo", "1");
      g.text(x + 2, by + 9, yearly ? `billed $${y * 12} yearly` : "billed monthly", yearly ? "2" : "7");
      g.hline(x + 1, x + bw - 2, by + 10, "─", "8");
      feats.forEach((s, k) => { g.text(x + 2, by + 11 + k, "✓", c === "1" ? "2" : c); g.text(x + 4, by + 11 + k, s, "0"); });
      const clicked = hot && f > 3.2 && f < 3.6;
      g.box(x + 2, by + bh - 4, bw - 4, 3, clicked ? "heavy" : "round", hot ? (clicked ? "2" : c) : "7");
      const cta = hot && f > 3.2 ? "✓ Selected" : "Choose " + name;
      g.text(x + Math.floor((bw - cta.length) / 2), by + bh - 3, cta, hot && f > 3.2 ? "2" : hot ? "0" : "1");
      if (hot && f > 2.4 && f < 3.4) g.set(x + bw - 6, by + bh - 3, "↖", "0");
    });
    return g.frame();
  };
}
