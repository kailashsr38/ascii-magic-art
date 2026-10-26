/* abu-simbel-colossi: four seated colossi carved into the cliff face in the morning sun, hand-built.
 * Painted once: the desert sky, the sandstone cliff, the four seated kings with their crowns and folded
 * hands, the dark doorway between them, the frieze above and the sand below. Each frame adds blowing
 * sand, visitors walking up to the door and a falcon circling. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, person, across, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, ROCK = 2, SAND = 3;
const FLOOR = 92;

const base = new Canvas();
base.sky([[0, "#5a9ad8"], [0.7, "#a8cce8"], [1, "#f0e4c8"]], SKY, 0, 30);
// the cliff face: sandstone, lit from the left
const cliffTop = (x) => 18 + fbm(x / 12, 2, 3, 4) * 8 + (x < 20 || x > 172 ? (Math.min(x, W - x) < 20 ? (20 - Math.min(x, W - x)) * 0.8 : 0) : 0);
for (let x = 0; x < W; x++) for (let y = Math.floor(cliffTop(x)); y < FLOOR; y++) {
  const n = fbm(x / 5, y / 5, 3, 6);
  base.put(x, y, mix(hex("#c8946a"), hex("#7a5038"), clamp(n * 0.6 + (y - 20) / 160)), ROCK); // the cliff, a step darker than the lit kings
}
// the frieze across the top
base.rect(18, 26, 175, 30, "#e8b888", ROCK);
for (let x = 20; x < 174; x += 4) base.rect(x, 26, x + 2, 28, "#c08a5a", ROCK);
// the four seated colossi: tall crown, striped head-dress with lappets over broad shoulders,
// hands on the knees, legs straight down to the throne's foot
const king = (cx) => {
  const lit = (x, x0, x1) => mix(hex("#ffe4b8"), hex("#9a5e40"), clamp((x - x0) / (x1 - x0) * 1.1));
  base.poly([[cx - 4, 34], [cx + 5, 34], [cx + 3, 26], [cx - 2, 26]], (x) => lit(x, cx - 4, cx + 5), ROCK);       // crown
  base.ellipse(cx + 0.5, 26, 2, 2.4, (x) => lit(x, cx - 2, cx + 3), ROCK);
  base.poly([[cx - 9, 46], [cx + 10, 46], [cx + 7, 34], [cx - 6, 34]], (x, y) => mix(lit(x, cx - 9, cx + 10), hex("#c48a5e"), (y % 2) * 0.25), ROCK); // head-dress, striped
  base.rect(cx - 4, 36, cx + 5, 46, (x) => lit(x, cx - 6, cx + 7), ROCK);                                        // the face
  base.rect(cx - 3, 39, cx - 1, 40, "#6a3e2a", ROCK); base.rect(cx + 2, 39, cx + 4, 40, "#6a3e2a", ROCK);      // eyes
  base.rect(cx, 41, cx + 1, 44, "#c48a5e", ROCK);                                                              // nose
  base.rect(cx, 46, cx + 1, 50, "#9a6040", ROCK);                                                              // beard
  base.rect(cx - 16, 46, cx + 17, 52, (x) => lit(x, cx - 16, cx + 17), ROCK);                                  // shoulders
  base.rect(cx - 11, 52, cx + 12, 66, (x) => lit(x, cx - 16, cx + 17), ROCK);                                  // chest
  for (const s of [-1, 1]) base.rect(cx + s * 13 - 2, 50, cx + s * 13 + 3, 68, (x) => lit(x, cx - 16, cx + 17), ROCK); // arms
  base.rect(cx - 15, 66, cx + 16, 71, (x) => lit(x, cx - 16, cx + 17), ROCK);                                  // knees and hands
  for (const s of [-1, 1]) base.rect(cx + s * 8 - 4, 71, cx + s * 8 + 5, FLOOR - 4, (x) => lit(x, cx - 16, cx + 17), ROCK); // shins
  base.rect(cx - 2, 71, cx + 3, FLOOR - 4, "#7a4a34", ROCK);                                                  // shadow between the legs
  base.rect(cx - 17, FLOOR - 4, cx + 18, FLOOR, "#b87e56", ROCK);                                              // the footing
};
for (const x of [30, 68, 126, 164]) king(x);
// the doorway between the inner pair, the falcon god above it
base.rect(90, 58, 105, FLOOR, "#2a1a14", ROCK);
base.rect(93, 44, 102, 56, "#d8a070", ROCK); base.ellipse(97.5, 46, 3, 2.5, "#c08a5a", ROCK);
// the sand
base.rect(0, FLOOR, W, H, (x, y) => mix(hex("#f8d8a8"), hex("#d0a070"), clamp((y - FLOOR) / 16 + noise2(x / 6, y / 2, 3) * 0.2)), SAND);

balance(base);
const PAL = fitPalette(base, { n: 52, extras: ["#ffffff", "#1e1414", "#2a5a9a", "#e84a3a", "#fff0d0"] });

export const meta = {
  slug: "abu-simbel-colossi",
  name: "Abu Simbel Colossi",
  category: "cities",
  note: "Four seated colossi carved into the sandstone cliff glow in the morning sun as visitors walk up to the dark doorway and sand blows across the forecourt.",
  tags: ["egypt", "abu-simbel", "temple", "statues", "desert", "landmark", "wonder", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    // sand blowing low across the forecourt
    for (let i = 0; i < 70; i++) {
      const r = Math.sin(i * 12.9898) * 43758.5453, u = r - Math.floor(r);
      const x = ((u * W + t * (14 + (i % 5) * 4)) % (W + 10)) - 5, y = FLOOR + 2 + (i % 12) + Math.sin(t * 2 + i) * 0.6;
      f.add(x, y, "#fff0d0", 0.55);
    }
    for (const [ph, c, y] of [[0.0, "#2a5a9a", 104], [0.3, "#e84a3a", 100], [0.62, "#ffffff", 106]]) {
      const x = across(t, 4, ph, W, 20);
      person(f, x, y, { body: c, step: Math.floor(t * 4 + ph * 10) });
    }
    // a falcon circling high
    const a = t * 0.4, fx = 150 + Math.cos(a) * 22, fy = 10 + Math.sin(a) * 4;
    f.add(fx, fy, "#1e1414", 1, SKY); f.add(fx - 1, fy - 1, "#1e1414", 1, SKY); f.add(fx + 1, fy - 1, "#1e1414", 1, SKY); f.add(fx - 2, fy, "#1e1414", 1, SKY); f.add(fx + 2, fy, "#1e1414", 1, SKY);
    return enc(f);
  };
}
