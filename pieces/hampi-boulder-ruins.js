/* hampi-boulder-ruins: the temple gopuram among giant piled boulders at golden hour, the river and banana groves below, hand-built.
 * Painted once: the golden sky, hills of huge rounded boulders piled on each other, the tall temple
 * tower and its pillared halls, coconut palms and banana groves, the river with a coracle. Each frame
 * spins the round coracle downstream, sways the palms, and adds a langur on the rocks and birds. */
import { fbm, noise2, clamp, lerp, rng } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, palm, across, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, ROCK = 2, TEMPLE = 3, GROVE = 4, RIVER = 5;

const base = new Canvas();
base.sky([[0, "#7a8ab8"], [0.5, "#e8b0a0"], [0.85, "#ffd090"], [1, "#ffe4b0"]], SKY, 0, 80);
base.glow(160, 40, 5, 32, "#fff4d0", 0.55, SKY);
// boulder hills: piles of big rounded stones, lit warm from the right
const R = rng(13);
const boulder = (cx, cy, rx, ry) => base.ellipse(cx, cy, rx, ry, (x, y) => {
  const lit = clamp(0.55 + (x - cx) / (rx * 2.5) - (y - cy) / (ry * 2)), n = noise2(x / 2.5, y / 2.5, 7) * 0.15; // sun high on the right: tops and right flanks lit
  return mix(hex("#a8785e"), hex("#ffd8a8"), clamp(lit + n));
}, ROCK);
// boulder hills: wide, low heaps of huge rounded stones, the biggest at the bottom
for (const [cx, w, h] of [[26, 40, 26], [74, 16, 12], [156, 40, 28], [188, 16, 14]]) {
  for (let k = 0; k < 22; k++) {
    const v = Math.pow(k / 22, 1.4), y = 84 - v * h, half = w * (1 - v * 0.75);
    boulder(cx + (R() - 0.5) * 2 * half, y, 11 - v * 5 + R() * 4, 7 - v * 3 + R() * 2);
  }
}
// the temple: a tall stepped gopuram over a pillared hall
const GX = 96;
for (let k = 0; k < 9; k++) {
  const hw = 14 - k * 1.3, y0 = 62 - k * 5;
  base.rect(GX - hw, y0, GX + hw + 1, y0 + 5, (x, y) => mix(hex("#ffd8a8"), hex("#9a6a52"), clamp((x - GX + hw) / (2 * hw) * 0.9 + (y === y0 ? -0.2 : 0))), TEMPLE);
  for (let x = GX - hw + 1; x < GX + hw; x += 3) base.put(x, y0 + 2, "#7a4e3e", TEMPLE);
}
base.rect(GX - 3, 12, GX + 4, 17, "#c8905e", TEMPLE); base.ellipse(GX + 0.5, 11, 3, 2, "#e8b070", TEMPLE);
base.rect(GX - 30, 62, GX + 31, 76, (x, y) => mix(hex("#f4c898"), hex("#9a6a52"), clamp((x - GX + 30) / 61 * 0.8)), TEMPLE);
for (let x = GX - 28; x < GX + 30; x += 4) base.rect(x + 1, 65, x + 3, 76, "#6a4436", TEMPLE); // pillared hall openings
base.rect(GX - 4, 66, GX + 5, 76, "#3a2420", TEMPLE);
// banana groves and the river
base.rect(0, 80, W, 94, (x, y) => mix(hex("#a8c86a"), hex("#5a7a3a"), clamp((y - 80) / 14 + fbm(x / 3, y / 2, 3, 9) * 0.4)), GROVE);
base.rect(0, 94, W, H, (x, y) => mix(mix(hex("#a8b8a0"), hex("#5a7a7a"), clamp((y - 94) / 14)), hex("#ffe0b0"), Math.sin(y * 2 + Math.sin(x * 0.2) * 2) > 0.7 ? 0.2 : 0), RIVER);

balance(base);
const PAL = fitPalette(base, { n: 52, extras: ["#1e1814", "#5a3a2a", "#e8d8c0", "#3a3028"] });

export const meta = {
  slug: "hampi-boulder-ruins",
  name: "Hampi Boulder Ruins",
  category: "india",
  note: "An old temple tower rises among hills of giant piled boulders at golden hour as a round coracle spins down the river past banana groves and a langur watches from the rocks.",
  tags: ["hampi", "karnataka", "temple", "ruins", "boulders", "golden-hour", "india", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    const sw = Math.sin(t * 0.8) * 0.7;
    palm(f, 20, 94, 34, { lean: 0.2, c: "#1e1814", sway: sw, fronds: 8 });
    palm(f, 172, 94, 30, { lean: -0.2, c: "#1e1814", sway: sw * 0.9, fronds: 7 });
    // the coracle: a round basket boat spinning slowly as it drifts downstream, a boatman paddling
    const x = across(t, 3, 0.3), y = 101, spin = t * 0.8;
    f.ellipse(x, y, 6, 2.2, "#5a3a2a"); f.ellipse(x, y - 0.5, 4.5, 1.4, "#3a3028");
    const bx = x + Math.cos(spin) * 2.5;
    f.rect(bx, y - 6, bx + 1, y - 2, "#e8d8c0"); f.put(bx, y - 7, "#5a3a2a");
    f.line(bx + 1, y - 4, bx + 3 + Math.sin(t * 2) * 2, y + 2, "#1e1814", 1);
    // a langur sitting on the boulders, its long tail swinging
    const lx = 150, ly = 54, tail = Math.sin(t * 1.2) * 2;
    f.rect(lx, ly - 4, lx + 2, ly, "#e8d8c0"); f.put(lx + 1, ly - 5, "#3a3028");
    f.line(lx + 1, ly, lx + 3 + tail, ly + 6, "#e8d8c0", 1);
    birds(f, t, { n: 5, y: 22, period: 15, c: "#1e1814", only: SKY });
    return enc(f);
  };
}
