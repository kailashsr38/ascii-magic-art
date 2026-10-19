/* rule-30: Wolfram's rule 30 elementary automaton, its chaotic triangles scrolling up the screen. */
import { Grid, palette, gradient, KEYS } from "../lib/kit.js";

const HUE = gradient(["#ff5a7a", "#ffb03a", "#ffe45a", "#5aff9a", "#3ad0ff", "#8a6aff", "#ff5a7a"], 12);
const DIM = gradient(["#3a1a2a", "#3a2a14", "#3a3418", "#163a24", "#12303a", "#221a3a", "#3a1a2a"], 12);
const MID = HUE.map((h, i) => gradient([DIM[i], h], 3)[1]);
const pal = palette([...DIM, ...MID, ...HUE, "#0e0e1a"]);
const NH = 12, BG = KEYS[36];

export const meta = {
  slug: "rule-30",
  name: "Rule 30",
  category: "algorithms",
  note: "The rule 30 elementary cellular automaton growing from a single cell, its chaotic triangles scrolling upward.",
  tags: ["cellular", "automaton", "chaos", "terminal", "loader"],
  cols: 96, rows: 36, fps: 24,
  palette: pal,
};

const RATE = 14, EPOCH = 520, PRE = 24;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const VIS = rows * 2, PAD = EPOCH + 4, BW = cols + PAD * 2;
  // a wide strip so the edges never wrap: the left side stays orderly, the right turns chaotic
  const ring = Array.from({ length: VIS }, () => new Uint8Array(BW));
  let epoch = -1, gen = -1;
  const reset = () => { for (const r of ring) r.fill(0); ring[0][PAD + (cols >> 1)] = 1; gen = 0; };
  const step = () => {
    const a = ring[gen % VIS], b = ring[(gen + 1) % VIS];
    b[0] = 0; b[BW - 1] = 0;
    for (let x = 1; x < BW - 1; x++) b[x] = (30 >> ((a[x - 1] << 2) | (a[x] << 1) | a[x + 1])) & 1;
    gen++;
  };
  return (t) => {
    const total = PRE + Math.floor(t * RATE);
    const e = Math.floor(total / EPOCH), target = Math.max(PRE, total % EPOCH);
    if (e !== epoch || target < gen) { epoch = e; reset(); }
    while (gen < target) step();
    // until the screen fills the apex sits at the top; after that the newest row is at the bottom
    const first = Math.max(0, gen - (VIS - 1));
    for (let y = 0; y < rows; y++) {
      const g1 = first + y * 2, g2 = g1 + 1;
      const r1 = g1 <= gen ? ring[g1 % VIS] : null, r2 = g2 <= gen ? ring[g2 % VIS] : null;
      const age = (gen - g1) / VIS;
      const tier = age < 0.3 ? 2 : age < 0.65 ? 1 : 0;
      for (let x = 0; x < cols; x++) {
        const a = r1 ? r1[PAD + x] : 0, b = r2 ? r2[PAD + x] : 0;
        const hue = Math.floor((x / cols) * NH + g1 * 0.02) % NH;
        if (a || b) g.set(x, y, a && b ? "█" : a ? "▀" : "▄", KEYS[tier * NH + hue]);
        else g.set(x, y, (x + y) % 3 ? " " : "·", BG);
      }
    }
    return g.frame();
  };
}
