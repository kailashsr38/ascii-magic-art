/* pixel-fire: the classic rising fire effect, flames climbing from a white hot base. */
import { Grid, palette, gradient, KEYS, fbm } from "../lib/kit.js";

const FIRE = gradient(["#120202", "#3a0702", "#6e0d02", "#a01402", "#d22a06", "#f0500c", "#f87816", "#fca024", "#fdc63e", "#ffe680", "#fff8d8"], 24);
const SMOKE = gradient(["#0c0a0a", "#231c1c"], 3);

export const meta = {
  slug: "pixel-fire",
  name: "Pixel Fire",
  category: "demoscene",
  note: "The classic demoscene fire, heat rising from a white hot base and breaking into flickering tongues.",
  tags: ["fire", "demoscene", "retro", "hero", "wallpaper"],
  cols: 80, rows: 30, fps: 30,
  palette: palette([...FIRE, ...SMOKE]),
};

const MAX = 36;
const DECAY = [0, 1, 1, 1, 2, 2, 1, 0];
const CH = " .:;=░▒▓██";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const buf = new Uint8Array(cols * rows);
  const hash = (x, y, s) => {
    let h = (x * 73856093) ^ (y * 19349663) ^ (s * 83492791);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return (h ^ (h >>> 16)) >>> 0;
  };
  return (t) => {
    g.clear();
    const step = Math.floor(t * 30);
    // the fire state is a pure function of the last `rows + 4` steps, so replay that window
    buf.fill(0);
    const w0 = step - rows - 4;
    for (let s = w0; s <= step; s++) {
      const base = (rows - 1) * cols;
      for (let x = 0; x < cols; x++) {
        const n = fbm(x * 0.09, s * 0.02, 2);
        buf[base + x] = n > 0.32 ? MAX : MAX - 8;
      }
      for (let y = 0; y < rows - 1; y++) {
        for (let x = 0; x < cols; x++) {
          const src = buf[(y + 1) * cols + x];
          const h = hash(x, y, s);
          const r = h & 3;
          const decay = DECAY[(h >>> 2) & 7];
          let dx = x - r + 1;
          if (dx < 0) dx += cols; else if (dx >= cols) dx -= cols;
          const v = src - decay;
          buf[y * cols + dx] = v > 0 ? v : 0;
        }
      }
    }
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = buf[y * cols + x] / MAX;
      if (v < 0.04) {
        const sm = fbm(x * 0.08, y * 0.18 + t * 0.7, 3);
        g.set(x, y, sm > 0.5 ? "░" : sm > 0.38 ? ":" : ".", KEYS[24 + (sm > 0.55 ? 2 : sm > 0.45 ? 1 : 0)]);
      } else {
        g.set(x, y, CH[Math.min(CH.length - 1, Math.floor(v * CH.length))], KEYS[Math.min(23, Math.floor(Math.pow(v, 1.35) * 24))]);
      }
    }
    return g.frame();
  };
}
