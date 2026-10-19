/* kaleidoscope: an eightfold mirrored pattern, shifting colour as it turns. */
import { Grid, palette, hsl, KEYS, fbm, TAU } from "../lib/kit.js";

const N = 40;
const HUE = Array.from({ length: N }, (_, i) => hsl((i / N) * 360, 90, 58 + 10 * Math.sin((i / N) * TAU * 3)));

export const meta = {
  slug: "kaleidoscope",
  name: "Kaleidoscope",
  category: "demoscene",
  note: "An eightfold mirrored pattern that turns and shifts colour like a kaleidoscope.",
  tags: ["kaleidoscope", "pattern", "psychedelic", "symmetry", "wallpaper", "hero"],
  cols: 80, rows: 32, fps: 24,
  palette: palette([...HUE, "#0a0612"]),
};

const CH = " ·░▒▓█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const SEG = 8, W = TAU / SEG;
  return (t) => {
    g.clear();
    const cx = cols / 2, cy = rows / 2;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const dx = (x - cx) / 2, dy = y - cy;
      const r = Math.sqrt(dx * dx + dy * dy);
      let a = Math.atan2(dy, dx) + t * 0.15;
      a = ((a % W) + W) % W;
      if (a > W / 2) a = W - a;
      const u = Math.cos(a) * r * 0.12, v = Math.sin(a) * r * 0.12;
      const n = fbm(u + Math.sin(t * 0.3) * 2, v - t * 0.25, 3);
      const s = Math.sin(r * 0.4 - t * 1.5 + n * 6);
      const val = 0.5 + 0.5 * Math.sin(n * 14 + s);
      const hue = Math.floor((n * 2.2 + r * 0.02 + t * 0.06) * N);
      const k = ((hue % N) + N) % N;
      const c = Math.min(CH.length - 1, 2 + Math.floor(val * (CH.length - 2)));
      g.set(x, y, CH[c], val < 0.06 ? KEYS[N] : KEYS[k]);
    }
    return g.frame();
  };
}
