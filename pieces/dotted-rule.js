/* dotted-rule: a rule of dots with soft pulses of light swelling along it. */
import { Grid, palette, gradient, KEYS } from "../lib/kit.js";

const LV = gradient(["#2a3038", "#2f4a6b", "#3f78b5", "#79c0ff", "#bfe0ff", "#f2f8ff"], 12); // 0..11
const WARM = gradient(["#3a2a1e", "#7a4a22", "#d98a3a", "#ffa657", "#ffd3a8", "#fff4e8"], 12); // 12..23

export const meta = {
  slug: "dotted-rule",
  name: "Pulsing Dot Rule",
  category: "frames",
  note: "A quiet rule of dots where soft pulses of light swell and travel from end to end.",
  tags: ["divider", "readme", "dots", "separator", "minimal"],
  cols: 90, rows: 3, fps: 24,
  palette: palette([...LV, ...WARM]),
};

export default function create() {
  const { cols } = meta;
  const g = new Grid(cols, meta.rows);
  return (t) => {
    g.clear();
    const span = cols + 24;
    const pulses = [
      [((t * 22) % span) - 12, 0],
      [((t * 22 + span / 2) % span) - 12, 0],
      [cols - (((t * 15 + 30) % span) - 12), 12],
    ];
    for (let x = 1; x < cols - 1; x += 2) {
      let best = 0, fam = 0;
      for (const [p, f] of pulses) {
        const d = (x - p) / 5;
        const v = Math.exp(-d * d);
        if (v > best) { best = v; fam = f; }
      }
      const breathe = 0.08 + 0.06 * Math.sin(t * 1.5 + x * 0.3);
      const v = Math.min(1, breathe + best);
      const ch = v > 0.8 ? "●" : v > 0.5 ? "•" : "·";
      g.set(x, 1, ch, KEYS[fam + Math.min(11, Math.floor(v * 12))]);
      if (best > 0.55) {
        const k = KEYS[fam + Math.min(11, Math.floor(best * 6))];
        g.set(x, 0, "·", k); g.set(x, 2, "·", k);
      }
    }
    g.set(0, 1, "◇", KEYS[3]); g.set(cols - 1, 1, "◇", KEYS[3]);
    return g.frame();
  };
}
