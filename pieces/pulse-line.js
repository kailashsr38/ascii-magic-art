/* pulse-line: pulses of light with glowing tails racing along a thin line. */
import { Grid, palette, gradient, KEYS } from "../lib/kit.js";

const CY = gradient(["#21262d", "#1f4f7a", "#2f8fd8", "#79c0ff", "#d6ecff", "#ffffff"], 10); // 0..9
const OR = gradient(["#21262d", "#6a3a14", "#c46a22", "#ffa657", "#ffe1c2", "#ffffff"], 10); // 10..19

export const meta = {
  slug: "pulse-line",
  name: "Pulse Line",
  category: "frames",
  note: "Two pulses of light with glowing tails race in opposite directions along a thin line and light its end caps.",
  tags: ["divider", "readme", "line", "glow", "separator", "loader"],
  cols: 96, rows: 3, fps: 30,
  palette: palette([...CY, ...OR]),
};

export default function create() {
  const { cols } = meta;
  const g = new Grid(cols, meta.rows);
  const span = cols + 40;
  return (t) => {
    g.clear();
    const pa = ((t * 34) % span) - 10;                 // cyan, left to right
    const pb = cols - (((t * 26 + 50) % span) - 10);  // orange, right to left
    for (let x = 1; x < cols - 1; x++) {
      const da = pa - x, db = x - pb;
      const ia = da >= 0 ? Math.exp(-da / 7) : Math.exp(da * 1.5);
      const ib = db >= 0 ? Math.exp(-db / 7) : Math.exp(db * 1.5);
      const [i, base] = ia >= ib ? [ia, 0] : [ib, 10];
      if (i < 0.06) { g.set(x, 1, "─", KEYS[0]); continue; }
      const head = Math.abs(ia >= ib ? da : db) < 0.6;
      g.set(x, 1, head ? "●" : i > 0.35 ? "━" : "─", KEYS[base + Math.min(9, 1 + Math.floor(i * 9))]);
      if (i > 0.3) {
        const k = KEYS[base + Math.min(9, Math.floor(i * 6))];
        g.set(x, 0, "▁", k); g.set(x, 2, "▔", k);
      }
    }
    const capA = Math.max(Math.exp(-Math.abs(pa - (cols - 1)) / 3), Math.exp(-Math.abs(pb - (cols - 1)) / 3));
    const capB = Math.max(Math.exp(-Math.abs(pa) / 3), Math.exp(-Math.abs(pb) / 3));
    g.set(0, 1, "◆", KEYS[2 + Math.floor(capB * 7)]);
    g.set(cols - 1, 1, "◆", KEYS[2 + Math.floor(capA * 7)]);
    return g.frame();
  };
}
