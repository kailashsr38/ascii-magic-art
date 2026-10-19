/* zigzag-rule: a doubled chevron zigzag scrolling sideways with a travelling colour gradient. */
import { Grid, palette, gradient, KEYS } from "../lib/kit.js";

const N = 24;
const A = gradient(["#7ee787", "#79c0ff", "#d2a8ff", "#ff7b72", "#ffa657", "#7ee787"], N);        // 0..23
const B = gradient(["#2f6b3a", "#2f557a", "#5a4a7a", "#7a3a36", "#7a5530", "#2f6b3a"], N);        // 24..47

export const meta = {
  slug: "zigzag-rule",
  name: "Zigzag Rule",
  category: "frames",
  note: "A doubled zigzag rule that scrolls sideways while a rainbow gradient slides along it.",
  tags: ["divider", "readme", "zigzag", "chevron", "separator"],
  cols: 90, rows: 5, fps: 20,
  palette: palette([...A, ...B]),
};

export default function create() {
  const { cols } = meta;
  const g = new Grid(cols, meta.rows);
  const P = 8;
  return (t) => {
    g.clear();
    const off = Math.floor(t * 6);
    for (let x = 0; x < cols; x++) {
      const u = (((x + off) % P) + P) % P;
      const y = u < 4 ? 3 - u : u - 4;
      const ch = u < 4 ? "╱" : "╲";
      const ci = ((Math.floor((x - t * 14) / cols * N * 1.5) % N) + N) % N;
      g.set(x, y, ch, KEYS[ci]);
      g.set(x, y + 1, ch, KEYS[24 + ((ci + 3) % N)]);
      // sparkle dots in the hollows of the chevrons
      if (u === 0) g.set(x, 0, Math.sin(t * 3 + x) > 0.3 ? "•" : "·", KEYS[(ci + 6) % N]);
      if (u === 4) g.set(x, 4, Math.cos(t * 3 + x) > 0.3 ? "•" : "·", KEYS[(ci + 12) % N]);
    }
    return g.frame();
  };
}
