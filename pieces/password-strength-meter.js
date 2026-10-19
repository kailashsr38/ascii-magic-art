/* password-strength-meter: a new password field whose strength meter and rule checklist react to each keystroke. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "password-strength-meter",
  name: "Password Strength Meter",
  category: "screens",
  note: "A password field where each keystroke moves a strength meter from weak to strong and ticks off the rules.",
  tags: ["password", "form", "security", "signup", "validation", "app"],
  cols: 62, rows: 22, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60"]),
};

const PW = "maple7Harbor!river";
const KT = 0.28, START = 0.8, PERIOD = START + PW.length * KT + 4.5;
const RULES = [
  ["At least 12 characters", (s) => s.length >= 12],
  ["One uppercase letter", (s) => /[A-Z]/.test(s)],
  ["One number", (s) => /[0-9]/.test(s)],
  ["One symbol", (s) => /[^A-Za-z0-9]/.test(s)],
  ["Not a common password", (s) => s.length >= 6],
];
const LV = [["Too short", "7"], ["Weak", "5"], ["Fair", "4"], ["Good", "9"], ["Strong", "2"], ["Very strong", "2"]];

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    const n = Math.max(0, Math.min(PW.length, Math.floor((lt - START) / KT) + 1));
    const s = lt < START ? "" : PW.slice(0, n);
    const show = lt > START + PW.length * KT + 1.2 && lt < PERIOD - 1;
    const passed = RULES.map((r) => r[1](s));
    let score = passed.filter(Boolean).length;
    if (s.length < 4) score = 0;
    if (s.length >= 16 && score === 5) score = 5; else score = Math.min(score, 4);
    g.box(0, 0, W, H, "round", "7");
    g.text(2, 0, " Create account ", "0");
    g.text(3, 2, "Email", "1");
    g.box(3, 3, W - 6, 3, "round", "8");
    g.text(5, 4, "ravi.n@fieldnotes.io", "0"); g.text(W - 6, 4, "✓", "2");
    g.text(3, 7, "Password", "3");
    g.box(3, 8, W - 6, 3, "round", "3");
    const disp = show ? s : "•".repeat(s.length);
    g.text(5, 9, disp, "0");
    if (!show && Math.floor(lt * 3) % 2 === 0) g.set(5 + s.length, 9, "▏", "3");
    g.text(W - 12, 9, show ? "● hide" : "○ show", show ? "3" : "1");
    // meter: 5 segments
    const segW = Math.floor((W - 6 - 4) / 5);
    for (let i = 0; i < 5; i++) {
      const on = i < score;
      for (let k = 0; k < segW; k++) g.set(3 + i * (segW + 1) + k, 12, on ? "█" : "▁", on ? LV[score][1] : "8");
    }
    g.text(3, 13, "Strength:", "1");
    g.text(13, 13, LV[score][0], LV[score][1]);
    const ent = Math.round(s.length * 4.7);
    g.text(W - 18, 13, `~${ent} bits`.padStart(14), "7");
    RULES.forEach(([label], i) => {
      const ok = passed[i] && s.length > 0;
      g.text(5, 15 + i, ok ? "✓" : "○", ok ? "2" : "7");
      g.text(7, 15 + i, label, ok ? "0" : "1");
    });
    const ready = score >= 4;
    g.box(W - 22, 15, 19, 3, "round", ready ? "2" : "8");
    g.text(W - 20, 16, "Create account", ready ? "0" : "7");
    return g.frame();
  };
}
