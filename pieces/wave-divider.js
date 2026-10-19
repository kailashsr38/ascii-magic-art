/* wave-divider: two soft sine waves rolling across a band, shifting through a cool to warm gradient. */
import { Grid, palette, gradient, KEYS, TAU } from "../lib/kit.js";

const N = 20;
const BRIGHT = gradient(["#79c0ff", "#a5a8ff", "#d2a8ff", "#ff7bb0", "#ffa657", "#ff7bb0", "#d2a8ff", "#79c0ff"], N); // 0..19
const DIM = gradient(["#1f3a5c", "#2e2f5e", "#40305e", "#5a2a48", "#5a3a22", "#5a2a48", "#40305e", "#1f3a5c"], N); // 20..39

export const meta = {
  slug: "wave-divider",
  name: "Wave Divider",
  category: "frames",
  note: "Two soft sine waves roll across a thin band, their colour drifting from blue to pink to orange.",
  tags: ["divider", "readme", "wave", "gradient", "separator"],
  cols: 96, rows: 7, fps: 24,
  palette: palette([...BRIGHT, ...DIM]),
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const H = rows * 2; // height in half cells
  const mid = H / 2 - 0.5;

  // draw one wave as a thick half-cell line; fn(x) gives height in half cells
  function wave(fn, thick, base, glyphs) {
    for (let x = 0; x < cols; x++) {
      let lo = Infinity, hi = -Infinity;
      for (let s = -0.5; s <= 0.5; s += 0.25) {
        const h = fn(x + s);
        if (h < lo) lo = h; if (h > hi) hi = h;
      }
      lo = Math.round(lo - thick); hi = Math.round(hi + thick);
      const ci = base + (((Math.floor(x / cols * N * 1.0 + glyphs.shift) % N) + N) % N);
      for (let y = 0; y < rows; y++) {
        const top = 2 * y >= lo && 2 * y <= hi, bot = 2 * y + 1 >= lo && 2 * y + 1 <= hi;
        if (top && bot) g.set(x, y, glyphs.full, KEYS[ci]);
        else if (top) g.set(x, y, "▀", KEYS[ci]);
        else if (bot) g.set(x, y, "▄", KEYS[ci]);
      }
    }
  }

  return (t) => {
    g.clear();
    const shift = -t * 4;
    // faint baseline dots
    for (let x = 1; x < cols; x += 3) g.set(x, Math.floor(rows / 2), "·", KEYS[20 + (Math.floor(x / cols * N - shift) % N + N) % N]);
    // back wave, dim and slower
    wave((x) => mid + (H * 0.32) * Math.sin(x * TAU / 64 + t * 1.3 + 1.7), 0.2, 20, { full: "▓", shift: shift + 6 });
    // front wave, bright, amplitude breathing gently
    wave((x) => mid + (H * 0.36) * Math.sin(x * TAU / 44 - t * 2.1) * (0.8 + 0.2 * Math.sin(x * 0.07 + t * 0.9)), 0, 0, { full: "█", shift });
    return g.frame();
  };
}
