/* rope-divider: a thick twisted rope whose strands roll along as it turns. */
import { Grid, palette, gradient, KEYS, fract, clamp, TAU } from "../lib/kit.js";

const ROPE = gradient(["#1e120a", "#4a2c15", "#8a5a2b", "#c48a4a", "#e9c38a", "#fff0d2"], 12);

export const meta = {
  slug: "rope-divider",
  name: "Twisted Rope",
  category: "frames",
  note: "A thick twisted rope laid across the page, its strands rolling along as it slowly turns.",
  tags: ["divider", "rope", "nautical", "readme", "separator"],
  cols: 96, rows: 5, fps: 20,
  palette: palette(ROPE),
};

const SH = "░▒▓█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  return (t) => {
    g.clear();
    for (let y = 0; y < rows; y++) {
      const v = (y - 2) / 2.4;
      const cyl = Math.sqrt(Math.max(0, 1 - v * v));
      const light = 0.85 - v * 0.25;                  // lit from above
      for (let x = 0; x < cols; x++) {
        const s = fract((x + y * 2.2) / 7 - t * 0.7);
        const strand = 0.5 + 0.5 * Math.cos(s * TAU);
        const fib = 0.08 * Math.sin(x * 2.3 + y * 5.1);
        const b = clamp(cyl * light * (0.25 + 0.75 * strand) + fib);
        const k = KEYS[Math.min(11, Math.floor(b * 12))];
        if (y === 0) g.set(x, y, "▄", k);
        else if (y === rows - 1) g.set(x, y, "▀", KEYS[Math.min(11, Math.floor(b * 9))]);
        else if (strand < 0.18) g.set(x, y, "╱", KEYS[1]);
        else g.set(x, y, SH[Math.min(3, Math.floor(b * 4.5))], k);
      }
    }
    return g.frame();
  };
}
