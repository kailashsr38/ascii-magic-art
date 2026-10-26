/* granite-valley-falls: a glacier-carved valley with a sheer granite dome and a ribbon waterfall leaping from the rim, evening, hand-built.
 * Painted once: the evening sky, the great half-dome glowing orange, the long sheer wall with the
 * waterfall's notch, the pine forest on the valley floor and the meadow with its river. Each frame drops
 * the ribbon fall with its drifting spray, moves the evening light up the dome and flies birds. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, falls, mist, pine, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, ROCK = 2, FALL = 3, FOREST = 4, MEADOW = 5;
const FX = 54;

const base = new Canvas();
base.sky([[0, "#4a6aa8"], [0.6, "#c8a8c0"], [1, "#f8d0b0"]], SKY, 0, 70);
// the half dome on the right: rounded back, sheer cut face toward us
for (let x = 110; x < 186; x++) {
  const u = (x - 110) / 76, top = u < 0.62 ? 22 - Math.sqrt(Math.max(0, 1 - Math.pow((u - 0.62) / 0.62, 2))) * 14 + 14 : 22 + Math.pow((u - 0.62) / 0.38, 3) * 60;
  for (let y = Math.floor(top); y < 76; y++) {
    const face = u > 0.6, streak = Math.sin(x * 0.9 + noise2(x / 3, y / 8, 4) * 2) > 0.6 ? 0.15 : 0;
    base.put(x, y, face ? mix(hex("#ffb07a"), hex("#a86a5a"), clamp(streak + (y - top) / 90)) : mix(hex("#e8b8a0"), hex("#8a7080"), clamp((y - top) / 60 + streak)), ROCK);
  }
}
// the long sheer wall on the left, the notch the fall pours from
for (let x = 0; x < 110; x++) {
  const top = 30 + fbm(x / 9, 2, 3, 5) * 6 + (Math.abs(x - FX) < 4 ? 3 : 0);
  for (let y = Math.floor(top); y < 76; y++) {
    const streak = Math.sin(x * 1.1 + noise2(x / 3, y / 8, 6) * 2.5) > 0.55 ? 0.2 : 0;
    base.put(x, y, mix(mix(hex("#d8b8a8"), hex("#7a6a74"), clamp((y - top) / 50)), hex("#5a5060"), streak), ROCK);
  }
}
base.rect(FX - 2, 30, FX + 3, 76, "#5a5060", FALL);
// the pine forest on the valley floor, and the meadow with its river
for (let i = 0; i < 70; i++) pine(base, (i * 13) % W + (i % 4), 82 + (i % 3) * 2, 10 + (i % 5) * 3, i % 2 ? "#1e3a2a" : "#2a4a32", FOREST);
base.rect(0, 84, W, H, (x, y) => mix(hex("#b8b86a"), hex("#6a7a3a"), clamp((y - 84) / 24 + fbm(x / 4, y / 2, 2, 7) * 0.3)), MEADOW);
for (let y = 88; y < H; y++) { const x = 96 + Math.sin(y / 5) * 12 + (y - 88) * 0.8; base.rect(x - 2, y, x + 3 + (y - 88) * 0.15, y + 1, "#8ab8d0", MEADOW); }

balance(base);
const PAL = fitPalette(base, { n: 50, extras: ["#ffffff", "#eef6ff", "#a9c8dc", "#1e1a24", "#ffd8b0"] });

export const meta = {
  slug: "granite-valley-falls",
  name: "Granite Valley Falls",
  category: "landscapes",
  note: "A ribbon waterfall leaps from the rim of a glacier-carved granite valley as the great half-dome glows orange in the evening light above the pines and the meadow river.",
  tags: ["yosemite", "half-dome", "waterfall", "granite", "valley", "evening", "wonder", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    falls(f, t, FX - 1, FX + 3, 32, 78, { c: "#ffffff", c2: "#a9c8dc", speed: 28 });
    mist(f, t, { y0: 66, y1: 86, c: "#eef6ff", a: 0.55, speed: -0.06, scale: 10, cut: 0.4 });
    // the last light climbing the dome's face as the sun sets (30 s)
    const line = 76 - ((t % 30) / 30) * 50;
    for (let y = Math.floor(line); y < 76; y++) for (let x = 156; x < 186; x++) if (f.maskAt(x, y) === ROCK) f.add(x, y, "#5a4a6a", 0.35);
    birds(f, t, { n: 4, y: 14, period: 16, c: "#1e1a24", only: SKY });
    return enc(f);
  };
}
