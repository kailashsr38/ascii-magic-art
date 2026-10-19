/* empty-onboarding-flag: checkpoints tick up a hill path, then a flag drops onto the summit and waves. */
import { Grid, palette, clamp } from "../lib/kit.js";

const pal = palette(["#e6edf3", "#8b949e", "#484f58", "#30363d", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#f2cc60", "#1b4721", "#26622d", "#2ea043", "#56c264", "#da3633", "#ff7b72", "#c9d1d9"]);
// 0 text, 1 muted, 2 dim, 3 border, 4 green, 5 blue, 6 orange, 7 red, 8 purple, 9 yellow, a-d hill dark to light, e flag dark, f flag light, g pole

export const meta = {
  slug: "empty-onboarding-flag",
  name: "Onboarding Flag Planted",
  category: "empty-states",
  note: "Checkpoints tick off one by one up a hill path, then a flag drops onto the summit, kicks up dust and waves.",
  tags: ["empty-state", "onboarding", "success", "milestone", "app"],
  cols: 56, rows: 20, fps: 24,
  palette: pal,
};

const fit = (s, w) => (s.length <= w ? s : s.slice(0, Math.max(0, w - 2)) + "..");
const PERIOD = 7.5, DROP = 1.7, UNFURL = 2.2;
const STEPS = [0.3, 0.6, 0.95, 1.3];

export default function create() {
  const W = meta.cols, H = meta.rows;
  const g = new Grid(W, H);
  const S = (x, y, c, co) => { x = Math.round(x); y = Math.round(y); if (x >= 1 && y >= 1 && x < W - 1 && y < H - 1) g.set(x, y, c, co); };
  const mid = (y, s, co) => { s = fit(s, W - 4); g.text(Math.floor((W - s.length) / 2), y, s, co); };
  const CX = 28, CY = 14, RX = 21, RY = 6.2;
  const onHill = (a) => [CX - RX * Math.cos(a), CY - RY * Math.sin(a)];
  return (t) => {
    g.clear();
    g.box(0, 0, W, H, "round", "3");
    const lt = t % PERIOD;
    const reset = lt > PERIOD - 0.5;
    // hill
    for (let y = 7; y <= 13; y++) for (let x = CX - RX - 1; x <= CX + RX + 1; x++) {
      const d = Math.hypot((x - CX) / RX, (y - CY) / RY);
      if (d > 1) continue;
      const lit = clamp(0.9 - (x - CX + 8) / 40 - (y - 8) / 12);
      S(x, y, "█", "abcd"[Math.min(3, Math.floor(lit * 4))]);
    }
    // trail dots and checkpoints
    for (let a = 0.12; a < 1.45; a += 0.075) { const [x, y] = onHill(a); S(x, y + 1, "·", "0"); }
    STEPS.forEach((a, i) => {
      const [x, y] = onHill(a);
      const ok = !reset && lt > 0.3 + i * 0.35;
      S(x, y + 1, ok ? "✓" : "○", ok ? "0" : "1");
    });
    // pole drops, dust puffs, flag unfurls and waves
    const top = 2;
    const fall = reset ? -1 : clamp((lt - DROP) / 0.4);
    if (fall > 0) {
      const dy = Math.round((1 - fall * fall) * -8);
      for (let y = top; y <= 7; y++) S(CX, y + dy, "┃", "g");
      S(CX, top - 1 + dy, "●", "9");
      const w = Math.round(clamp((lt - UNFURL) / 0.6) * 11);
      for (let i = 1; i <= w; i++) {
        const wave = Math.sin(i * 0.7 - t * 6) * 0.55 * (i / 11);
        const shade = Math.cos(i * 0.7 - t * 6) > 0 ? "f" : "e";
        for (let r = 0; r < 3; r++) S(CX + i, top + r + dy + Math.round(wave), "█", shade);
      }
      const p = lt - DROP - 0.4;
      if (p > 0 && p < 0.8) for (let k = 0; k < 3; k++) {
        const d = 2 + p * 7 + k;
        S(CX - d, 7 - Math.round(p * 2), "·", "1"); S(CX + d, 7 - Math.round(p * 2), "·", "1");
      }
    }
    const done = lt > 0.3 + 3 * 0.35 && !reset ? 4 : reset ? 0 : STEPS.filter((_, i) => lt > 0.3 + i * 0.35).length;
    mid(15, done === 4 && lt > DROP ? "You're all set!" : "Finishing setup...", "0");
    mid(16, `Onboarding  ·  ${done} of 4 steps complete`, "1");
    mid(18, "Go to your dashboard →", "5");
    return g.frame();
  };
}
