/* jungle-temple-mist: the steep stepped temple pyramid rising above a rainforest canopy in the morning mist, hand-built.
 * Painted once: the pale morning sky and sun, a second temple far off, the tall stepped pyramid with its
 * roof comb and the dark doorway, and the canopy of rainforest. Each frame adds mist rolling over the
 * canopy, parrots crossing and a howler troupe stirring the trees. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, mist, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, FAR = 2, TEMPLE = 3, CANOPY = 4;
const CX = 110;

const base = new Canvas();
base.sky([[0, "#a8b8c8"], [0.6, "#e8d8c8"], [1, "#fff0d8"]], SKY, 0, 80);
base.glow(40, 34, 5, 34, "#fff8e4", 0.55, SKY);
// a second temple far off, faint in the haze
const pyramid = (cx, base0, hw0, steps, stepH, c1, c2, comb) => {
  for (let k = 0; k < steps; k++) {
    const hw = hw0 * (1 - k / (steps + 1.5)), y0 = base0 - (k + 1) * stepH;
    base.rect(cx - hw, y0, cx + hw + 1, y0 + stepH, (x, y) => mix(hex(c1), hex(c2), clamp((x - cx + hw) / (2 * hw) + (y - y0 === 0 ? -0.2 : 0))), comb ? TEMPLE : FAR);
  }
  const top = base0 - steps * stepH;
  if (comb) {
    base.rect(cx - 6, top - 10, cx + 7, top, (x) => mix(hex(c1), hex(c2), clamp((x - cx + 6) / 13)), TEMPLE);  // the temple room
    base.rect(cx - 2, top - 7, cx + 3, top, "#2a2620", TEMPLE);                                                 // its doorway
    base.rect(cx - 5, top - 22, cx + 6, top - 10, (x, y) => mix(hex(c1), hex(c2), clamp((x - cx + 5) / 11 + ((x + y) % 4 === 0 ? 0.2 : 0))), TEMPLE); // the roof comb
    base.rect(cx - 3, base0 - steps * stepH, cx + 4, base0, (x, y) => ((y % 2) ? hex("#d8ccb4") : hex("#a89880")), TEMPLE);   // the stair
  }
};
pyramid(40, 74, 18, 6, 4, "#c8c0b8", "#a8a0a8", false);
pyramid(CX, 86, 34, 9, 6, "#f0e0c4", "#8a7a6a", true);
// the canopy: billowing crowns of rainforest, darker below
for (let x = 0; x < W; x++) {
  const top = 72 + fbm(x / 9, 1, 3, 6) * 12 - (Math.abs(x - CX) < 36 ? 0 : 0);
  for (let y = Math.floor(top); y < H; y++) {
    if (base.maskAt(x, y) === TEMPLE && y < 84) continue;
    const n = fbm(x / 4, y / 4, 4, 9), crown = Math.sin(x * 0.4 + n * 6) * 0.5 + 0.5;
    base.put(x, y, mix(mix(hex("#8aa860"), hex("#2e4a2a"), clamp((y - top) / 26)), hex("#1e3420"), clamp((n - 0.45) * 1.4 + crown * 0.15)), CANOPY);
  }
}

balance(base);
const PAL = fitPalette(base, { n: 52, extras: ["#fff8ec", "#e83a2a", "#2a6ad8", "#f2c84a", "#1e1a16"] });

export const meta = {
  slug: "jungle-temple-mist",
  name: "Jungle Temple Mist",
  category: "cities",
  note: "A steep stepped temple pyramid with its tall roof comb rises above the rainforest canopy as morning mist rolls through and macaws cross the sky.",
  tags: ["tikal", "guatemala", "maya", "pyramid", "rainforest", "mist", "landmark", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    mist(f, t, { y0: 62, y1: 92, c: "#fff8ec", a: 0.75, speed: 0.05, scale: 30, cut: 0.4 });
    // a pair of macaws crossing, long tails, red and blue
    for (const [ph, y, c, c2] of [[0, 30, "#e83a2a", "#2a6ad8"], [0.06, 34, "#2a6ad8", "#f2c84a"]]) {
      const p = ((t / 16 + ph) % 1), x = lerp(W + 10, -20, p), flap = Math.sin(t * 7 + ph * 20) > 0;
      f.rect(x, y, x + 3, y + 1, c); f.line(x + 3, y + 1, x + 8, y + 3, c2, 1);
      f.line(x + 1, y, x - 1, y - (flap ? 3 : -1), c, 1); f.line(x + 2, y, x + 4, y - (flap ? 3 : -1), c, 1);
    }
    // treetops stirring where the monkeys move along the canopy
    const mx = (t * 6) % (W + 40) - 20;
    for (let k = 0; k < 6; k++) f.add(mx + k * 2, 74 + Math.sin(t * 6 + k) * 1.5, "#1e1a16", 0.7, CANOPY);
    return enc(f);
  };
}
