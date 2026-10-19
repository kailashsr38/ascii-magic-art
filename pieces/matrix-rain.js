/* matrix-rain: columns of green glyphs falling like digital rain. */
import { Grid, palette, gradient, KEYS, rng } from "../lib/kit.js";

const GREEN = gradient(["#021a08", "#04390f", "#0a6b1d", "#13a82c", "#2fe05a", "#9dffb0"], 14);

export const meta = {
  slug: "matrix-rain",
  name: "Digital Rain",
  category: "demoscene",
  note: "Columns of green glyphs falling at different speeds, each led by a bright white head.",
  tags: ["code", "rain", "hacker", "terminal", "hero", "wallpaper"],
  cols: 84, rows: 30, fps: 24,
  palette: palette([...GREEN, "#f2fff4"]),
};

const GLYPHS = "01ZXCVBNMASDFGHJKLQWERTYUIOP<>=+*:;|/\\[]{}#$%&7395";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(42);
  const drops = [];
  for (let x = 0; x < cols; x++) for (let k = 0; k < 2; k++) {
    drops.push({ x, speed: 6 + r() * 14, len: 10 + Math.floor(r() * 20), off: r() * 200, gap: Math.floor(r() * 24) });
  }
  const glyph = (x, y, s) => {
    let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return GLYPHS[((h ^ (h >>> 16)) >>> 0) % GLYPHS.length];
  };
  return (t) => {
    g.clear();
    // dim background code everywhere, changing slowly
    const slow = Math.floor(t * 2);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) g.set(x, y, glyph(x, y, slow + ((x * 7) % 5)), KEYS[(x * 3 + y) % 4 === 0 ? 2 : 1]);
    for (const d of drops) {
      const span = rows + d.len + d.gap;
      const head = ((t * d.speed + d.off) % span);
      const hy = Math.floor(head);
      for (let i = 0; i < d.len; i++) {
        const y = hy - i;
        if (y < 0 || y >= rows) continue;
        const f = 1 - i / d.len;
        const s = Math.floor(t * (i === 0 ? 14 : 3)) + i;
        if (i === 0) g.set(d.x, y, glyph(d.x, y, s), "e");
        else g.set(d.x, y, glyph(d.x, y, s), KEYS[Math.max(2, Math.min(13, Math.floor(f * 13)))]);
      }
    }
    return g.frame();
  };
}
