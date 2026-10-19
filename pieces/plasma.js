/* plasma: a colourful sine plasma, rainbow bands rolling and folding into each other. */
import { Grid, palette, hsl, KEYS } from "../lib/kit.js";

const N = 36;
const HUES = Array.from({ length: N }, (_, i) => hsl((i / N) * 360, 90, 58));

export const meta = {
  slug: "plasma",
  name: "Sine Plasma",
  category: "demoscene",
  note: "A classic sine plasma, rainbow bands rolling and folding into each other.",
  tags: ["plasma", "demoscene", "retro", "wallpaper", "hero"],
  cols: 88, rows: 30, fps: 30,
  palette: palette(HUES),
};

const CH = "░▒▓█▓▒";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  return (t) => {
    g.clear();
    const cx1 = Math.sin(t * 0.31) * 30, cy1 = Math.cos(t * 0.23) * 20;
    for (let y = 0; y < rows; y++) {
      const py = y * 2;
      for (let x = 0; x < cols; x++) {
        let v = Math.sin(x * 0.11 + t * 0.9);
        v += Math.sin((py * 0.09 + t * 0.6));
        v += Math.sin((x * 0.07 + py * 0.06 + t * 0.7));
        const dx = x - cols / 2 + cx1, dy = py - rows + cy1;
        v += Math.sin(Math.sqrt(dx * dx + dy * dy) * 0.12 - t * 1.3);
        const u = (v + 4) / 8;
        const hi = Math.floor((u * 2 + t * 0.08) * N) % N;
        const b = Math.floor(((Math.sin(v * Math.PI) + 1) / 2) * CH.length * 0.999);
        g.set(x, y, CH[b], KEYS[(hi + N) % N]);
      }
    }
    return g.frame();
  };
}
