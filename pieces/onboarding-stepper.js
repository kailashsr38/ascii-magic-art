/* onboarding-stepper: a four step welcome wizard advancing through workspace, team, integrations and finish. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "onboarding-stepper",
  name: "Onboarding Stepper",
  category: "screens",
  note: "A setup wizard walks through four steps, filling fields, picking options and ticking the stepper rail as it goes.",
  tags: ["onboarding", "wizard", "stepper", "form", "signup", "app"],
  cols: 76, rows: 22, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60"]),
};

const STEPS = [
  ["Workspace", "Name your workspace"], ["Team", "Invite your teammates"],
  ["Integrations", "Connect your tools"], ["Finish", "You are all set"],
];
const SEG = 4.2;

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  const RX = 24;
  return (t) => {
    g.clear();
    const lt = t % (SEG * 4);
    const si = Math.floor(lt / SEG), f = lt % SEG;
    g.box(0, 0, W, H, "round", "7");
    g.text(2, 0, " Welcome ", "0");
    g.text(W - 14, 0, ` Step ${si + 1} of 4 `, "1");
    // rail
    STEPS.forEach(([name, sub], i) => {
      const y = 3 + i * 4, done = i < si, cur = i === si;
      g.text(3, y, done ? "(✓)" : cur ? "(" + (i + 1) + ")" : " " + (i + 1) + " ", done ? "2" : cur ? "3" : "7");
      g.text(7, y, name, cur ? "0" : done ? "1" : "7");
      g.text(7, y + 1, done ? "Completed" : cur ? "In progress" : "Pending", done ? "2" : cur ? "3" : "8");
      if (i < 3) for (let k = 1; k < 4; k++) g.set(4, y + k, "│", done ? "2" : "8");
    });
    g.vline(RX - 2, 1, H - 2, "│", "8");
    const x = RX + 1;
    g.text(x, 2, STEPS[si][1], "0");
    g.hline(x, W - 3, 3, "─", "8");
    const typed = (s, a, sp = 0.08) => s.slice(0, Math.max(0, Math.min(s.length, Math.floor((f - a) / sp) + 1)));
    if (si === 0) {
      g.text(x, 5, "Workspace name", "1");
      g.box(x, 6, 44, 3, "round", "3");
      const v = typed("Northwind Studio", 0.4);
      g.text(x + 2, 7, v, "0");
      g.text(x, 10, "URL", "1");
      g.box(x, 11, 44, 3, "round", "8");
      g.text(x + 2, 12, "app.example/", "7"); g.text(x + 14, 12, v.toLowerCase().replace(/ /g, "-"), "3");
      g.text(x, 15, "Team size", "1");
      ["1-5", "6-20", "21-100", "100+"].forEach((o, i) => {
        const on = i === 1 && f > 2.4;
        g.text(x + i * 11, 16, (on ? "● " : "○ ") + o, on ? "3" : "1");
      });
    } else if (si === 1) {
      const P = [["mira@northwind.studio", "Admin"], ["tom@northwind.studio", "Editor"], ["ana@northwind.studio", "Editor"], ["jules@northwind.studio", "Viewer"]];
      P.forEach(([m, r], i) => {
        const a = 0.3 + i * 0.85;
        if (f < a) return;
        const y = 5 + i * 2;
        g.text(x, y, "●", ["6", "3", "4", "2"][i]);
        g.text(x + 2, y, typed(m, a, 0.03), "0");
        g.text(x + 28, y, r + " ▼", "1");
        if (f > a + 0.7) g.text(W - 12, y, "✓ invited", "2");
      });
      g.text(x, 14, "+ Add another", "3");
      g.text(x, 15, "or share invite link", "7");
    } else if (si === 2) {
      const I = [["Chat", "Messages and alerts"], ["Calendar", "Sync meeting times"], ["Storage", "Attach shared files"], ["Issue tracker", "Link issues to tasks"]];
      I.forEach(([n, d], i) => {
        const y = 5 + i * 3;
        const on = f > 0.6 + i * 0.8 && i !== 2;
        g.box(x, y, 48, 3, "round", on ? "2" : "8");
        g.text(x + 2, y + 1, n, "0"); g.text(x + 16, y + 1, d, "1");
        const st = on ? "Connected" : "Connect";
        g.text(x + 46 - st.length, y + 1, st, on ? "2" : "3");
      });
    } else {
      const p = Math.min(1, f / 1.2);
      const c = ["  .   *   .  ", "*   \\ | /   *", "  -- ✓✓✓ --  ", "*   / | \\   *", "  .   *   .  "];
      c.forEach((r, i) => g.text(x + 16, 5 + i, r, i === 2 ? "2" : ["9", "6", "4"][(i + Math.floor(t * 3)) % 3]));
      g.text(x + 9, 11, "Northwind Studio is ready", "0");
      g.text(x + 8, 12, "4 teammates · 3 integrations", "1");
      for (let k = 0; k < 40; k++) g.set(x + 4 + k, 14, k < p * 40 ? "━" : "─", k < p * 40 ? "2" : "8");
    }
    // nav buttons
    g.text(x, H - 3, si ? "← Back" : "", "1");
    g.box(W - 18, H - 4, 15, 3, "round", "3");
    g.text(W - 15, H - 3, si === 3 ? "Open app →" : "Continue →", "0");
    return g.frame();
  };
}
