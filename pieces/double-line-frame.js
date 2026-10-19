/* double-line-frame: a double-line box frame with two comets of light chasing around it. */
import { Grid, palette, gradient, KEYS } from "../lib/kit.js";

const GOLD = gradient(["#4a3f28", "#8a6a2a", "#e3b341", "#fff1c2"], 8);  // 0..7
const BLUE = gradient(["#26303c", "#2f5f8f", "#79c0ff", "#e8f4ff"], 8);  // 8..15

export const meta = {
  slug: "double-line-frame",
  name: "Double Line Frame",
  category: "frames",
  note: "A double-line box frame with an inner rule, while comets of gold and blue light chase each other round it.",
  tags: ["border", "frame", "box", "readme", "terminal"],
  cols: 72, rows: 9, fps: 24,
  palette: palette([...GOLD, ...BLUE]),
};

function perimeter(x0, y0, w, h) {
  const p = [];
  for (let x = x0; x < x0 + w; x++) p.push([x, y0]);
  for (let y = y0 + 1; y < y0 + h; y++) p.push([x0 + w - 1, y]);
  for (let x = x0 + w - 2; x >= x0; x--) p.push([x, y0 + h - 1]);
  for (let y = y0 + h - 2; y >= y0 + 1; y--) p.push([x0, y]);
  return p;
}

const HEAVY = { "─": "━", "│": "┃", "┌": "┏", "┐": "┓", "└": "┗", "┘": "┛" };

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const outer = perimeter(0, 0, cols, rows);
  const inner = perimeter(2, 1, cols - 4, rows - 2);
  const glow = (P, i, head, len) => {
    const n = P.length;
    const d = (((head - i) % n) + n) % n;   // cells behind the head
    return d < len ? 1 - d / len : 0;
  };
  return (t) => {
    g.clear();
    g.box(0, 0, cols, rows, "double", KEYS[2]);
    g.box(2, 1, cols - 4, rows - 2, "light", KEYS[9]);
    const n = outer.length, m = inner.length;
    const h1 = (t * 26) % n, h2 = (t * 26 + n / 2) % n, h3 = m - ((t * 18) % m);
    outer.forEach(([x, y], i) => {
      const a = glow(outer, i, Math.floor(h1), 22), b = glow(outer, i, Math.floor(h2), 22);
      if (a > 0.97 || b > 0.97) { g.set(x, y, "◆", a > 0.97 ? KEYS[7] : KEYS[15]); return; }
      if (a > 0.02) g.set(x, y, g.get(x, y), KEYS[Math.min(7, 1 + Math.floor(a * 7))]);
      else if (b > 0.02) g.set(x, y, g.get(x, y), KEYS[8 + Math.min(7, 1 + Math.floor(b * 7))]);
    });
    inner.forEach(([x, y], i) => {
      const n2 = inner.length;
      const d = (((i - Math.floor(h3)) % n2) + n2) % n2;
      if (d === 0) { const c0 = g.get(x, y); g.set(x, y, HEAVY[c0] || c0, KEYS[15]); }
      else if (d < 14) g.set(x, y, g.get(x, y), KEYS[8 + Math.min(7, 1 + Math.floor((1 - d / 14) * 6))]);
    });
    // ornaments on the outer frame
    const mx = Math.floor(cols / 2);
    const pulse = 0.5 + 0.5 * Math.sin(t * 2);
    for (const y of [0, rows - 1]) {
      g.set(mx - 1, y, "╡", KEYS[2]); g.set(mx, y, "◆", KEYS[4 + Math.floor(pulse * 3)]); g.set(mx + 1, y, "╞", KEYS[2]);
    }
    return g.frame();
  };
}
