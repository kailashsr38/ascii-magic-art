/* thundering-falls-rainbow: a mile-wide curtain of water pouring into a gorge, spray rising and a rainbow in it, hand-built.
 * Painted once: the sky, the lip of the falls running across the frame, the dark basalt gorge, the
 * rainforest on the near edge and a standing rainbow in the spray. Each frame pours the water down the
 * face, boils the spray up out of the gorge and sends a pair of birds through. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, falls, mist, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, LIP = 2, FACE = 3, GORGE = 4, FOREST = 5;
const LIPY = 40, FOOT = 86;

const base = new Canvas();
base.sky([[0, "#5a8ac8"], [0.7, "#a8c8e4"], [1, "#e4ecf0"]], SKY, 0, LIPY);
// the far side: the plateau and the lip of the falls running right across
base.rect(0, LIPY - 6, W, LIPY, (x, y) => mix(hex("#7a9a6a"), hex("#4a6a4a"), (y - LIPY + 6) / 6), LIP);
// the face the water falls down (painted dark; the water is drawn every frame)
base.rect(0, LIPY, W, FOOT, (x, y) => mix(hex("#4a4a52"), hex("#2a2a32"), clamp((y - LIPY) / 46)), FACE);
// the gorge below: dark basalt walls and the boiling pool
base.rect(0, FOOT, W, H, (x, y) => mix(hex("#5a5a62"), hex("#2a2a30"), clamp((y - FOOT) / 22 + noise2(x / 4, y / 3, 3) * 0.3)), GORGE);
// rainforest crowding the near edge at the bottom left and right
for (let x = 0; x < W; x++) {
  const top = (x < 50 ? 74 + x * 0.3 : x > 150 ? 74 + (W - x) * 0.3 : 200) + fbm(x / 5, 2, 3, 6) * 6;
  for (let y = Math.floor(top); y < H; y++) base.put(x, y, mix(hex("#5a8a4a"), hex("#1e3a24"), clamp((y - top) / 24 + fbm(x / 3, y / 3, 3, 8) * 0.4)), FOREST);
}

balance(base, 0.45);
const PAL = fitPalette(base, { n: 46, extras: ["#ffffff", "#eef6ff", "#a9c8dc", "#e84a4a", "#f8a83a", "#f8e84a", "#4ac84a", "#4a8ae8", "#8a5ae8", "#1e1e28"] });

export const meta = {
  slug: "thundering-falls-rainbow",
  name: "Thundering Falls Rainbow",
  category: "landscapes",
  note: "A mile-wide curtain of water pours into a basalt gorge, spray boiling up out of it with a rainbow standing in the mist and the rainforest dripping at its edge.",
  tags: ["victoria-falls", "waterfall", "zambia", "zimbabwe", "rainbow", "wonder", "halftone", "spray"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

const RAINBOW = ["#e84a4a", "#f8a83a", "#f8e84a", "#4ac84a", "#4a8ae8", "#8a5ae8"];

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    // the water: streaks pouring down the whole face, gaps where rock shows through
    falls(f, t, 0, W, LIPY, FOOT, { c: "#ffffff", c2: "#a9c8dc", speed: 26, only: FACE });
    for (const gx of [34, 92, 150]) for (let y = LIPY + 4; y < FOOT; y++) for (let x = gx; x < gx + 3; x++) f.add(x, y, "#2a2a32", 0.6, FACE);
    // spray boiling up out of the gorge and hiding the foot of the falls
    mist(f, t, { y0: 56, y1: 104, c: "#eef6ff", a: 0.95, speed: -0.12, scale: 18, cut: 0.32, seed: 7 });
    // the rainbow standing in the spray
    for (let k = 0; k < RAINBOW.length; k++) {
      const r = 64 - k * 1.6;
      for (let a = 0.15; a < Math.PI - 0.15; a += 0.012) {
        const x = 96 + Math.cos(a) * r * 1.4, y = 112 - Math.sin(a) * r;
        if (y > 52) f.add(x, y, RAINBOW[k], 0.45);
      }
    }
    birds(f, t, { n: 2, y: 22, period: 12, c: "#1e1e28", only: SKY, spread: 2 });
    return enc(f);
  };
}
