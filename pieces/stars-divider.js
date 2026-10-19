/* stars-divider: a band of twinkling dots and sparkling stars. */
import { Grid, palette, gradient, KEYS, rng } from "../lib/kit.js";

const W = gradient(["#2a2f3a", "#6e7a96", "#c9d4ee", "#ffffff"], 6);   // 0..5 white-blue
const Y = gradient(["#3a3424", "#9a8550", "#f2d78a", "#fff8dc"], 6);   // 6..11 gold
const P = gradient(["#2e2640", "#6e5a9a", "#d2a8ff", "#f6eeff"], 6);   // 12..17 lilac

export const meta = {
  slug: "stars-divider",
  name: "Twinkle Star Band",
  category: "frames",
  note: "A narrow band of twinkling dots and four-pointed sparkles that bloom and fade in white, gold and lilac.",
  tags: ["divider", "stars", "sparkle", "readme", "night", "separator"],
  cols: 96, rows: 5, fps: 20,
  palette: palette([...W, ...Y, ...P]),
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(42);
  const small = Array.from({ length: 120 }, () => {
    const y = Math.floor(r() * rows);
    return [Math.floor(r() * cols), y, r() * 6.28, 1 + r() * 2.5, Math.floor(r() * 3) * 6, y === 2 ? 1 : y === 0 || y === 4 ? 0.6 : 0.85];
  });
  const big = [8, 24, 39, 57, 72, 88].map((x, i) => [x, 2, i * 1.3, 1.1 + (i % 3) * 0.25, (i % 3) * 6]);
  return (t) => {
    g.clear();
    for (const [x, y, ph, sp, fam, w] of small) {
      const b = (0.5 + 0.5 * Math.sin(t * sp + ph)) * w;
      if (b < 0.12) continue;
      const ch = b > 0.8 ? "*" : b > 0.55 ? "+" : b > 0.32 ? "•" : "·";
      g.set(x, y, ch, KEYS[fam + Math.min(5, Math.floor(b * 6))]);
    }
    for (const [x, y, ph, sp, fam] of big) {
      const b = Math.max(0, Math.sin(t * sp + ph));
      const L = Math.round(b * 4);
      for (let i = 1; i <= L; i++) {
        const k = KEYS[fam + Math.max(1, Math.min(5, Math.floor((1 - i / 5) * b * 6)))];
        g.set(x - i, y, i === L ? "·" : "─", k); g.set(x + i, y, i === L ? "·" : "─", k);
      }
      if (b > 0.45) { const k = KEYS[fam + Math.floor(b * 4)]; g.set(x, y - 1, "│", k); g.set(x, y + 1, "│", k); }
      if (b > 0.85) { const k = KEYS[fam + 2]; g.set(x, y - 2, "·", k); g.set(x, y + 2, "·", k); }
      g.set(x, y, b > 0.6 ? "◆" : b > 0.25 ? "◇" : "·", KEYS[fam + Math.min(5, 1 + Math.floor(b * 5))]);
    }
    return g.frame();
  };
}
