/* neon-border: a rounded neon tube frame that glows, shifts hue and buzzes now and then. */
import { Grid, palette, gradient, KEYS, fract } from "../lib/kit.js";

const HUES = gradient(["#ff3ea5", "#b84dff", "#3ef0ff", "#b84dff", "#ff3ea5"], 9).slice(0, 8);
// for each hue, 4 intensity levels: deep glow, glow, tube, hot core
const pal = [];
for (const h of HUES) { const r = gradient(["#0d0612", h, "#ffffff"], 7); pal.push(r[2], r[3], r[4], r[5]); }

export const meta = {
  slug: "neon-border",
  name: "Neon Border",
  category: "frames",
  note: "A rounded neon tube frame that glows into the dark, sliding from pink to cyan and buzzing now and then.",
  tags: ["border", "frame", "neon", "glow", "hero", "readme"],
  cols: 84, rows: 9, fps: 24,
  palette: palette(pal),
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const x0 = 3, x1 = cols - 4, y0 = 2, y1 = rows - 3;
  return (t) => {
    g.clear();
    // global flicker: two brief dips per cycle; one corner segment buzzes
    const c = fract(t * 0.29);
    const flick = c < 0.03 ? 0.35 : c > 0.5 && c < 0.515 ? 0.55 : 1;
    const buzz = fract(t * 0.21) < 0.3 ? 0.45 + 0.55 * Math.abs(Math.sin(t * 37)) : 1;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      let d;
      const inside = x >= x0 && x <= x1 && y >= y0 && y <= y1;
      if (inside) d = Math.min(x - x0, x1 - x, (y - y0) * 2, (y1 - y) * 2);
      else d = Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(y0 - y, 0, y - y1) * 2);
      if (d > 5) continue;
      const hue = Math.floor(fract(x / cols * 0.9 + y * 0.01 - t * 0.07) * 8) % 8;
      let f = flick * (x > x1 - 14 && y < y0 + 2 ? buzz : 1);
      if (d < 0.5) {
        let ch = y === y0 || y === y1 ? "─" : "│";
        if (x === x0 && y === y0) ch = "╭"; else if (x === x1 && y === y0) ch = "╮";
        else if (x === x0 && y === y1) ch = "╰"; else if (x === x1 && y === y1) ch = "╯";
        g.set(x, y, ch, KEYS[hue * 4 + (f > 0.8 ? 3 : 2)]);
      } else {
        const v = Math.exp(-d / 2.2) * f * (inside ? 0.85 : 1);
        if (v < 0.1) continue;
        const ch = v > 0.5 ? "▒" : v > 0.25 ? "░" : "·";
        g.set(x, y, ch, KEYS[hue * 4 + (v > 0.4 ? 1 : 0)]);
      }
    }
    return g.frame();
  };
}
