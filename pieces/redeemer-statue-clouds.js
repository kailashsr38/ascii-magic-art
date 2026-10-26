/* redeemer-statue-clouds: the great statue with open arms on its peak above a sea of cloud, hand-built.
 * Painted once: the morning sky, the granite peak and its forested shoulders, the plinth and the statue
 * lit by the low sun, the sugarloaf peaks far off. Each frame adds the cloud sea drifting past the
 * summit and frigatebirds circling. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, puffs, mist, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, FAR = 2, PEAK = 3, STATUE = 4;
const CX = 96;

const base = new Canvas();
base.sky([[0, "#2e5a96"], [0.45, "#5a86ba"], [0.8, "#a8c4dc"], [1, "#e6e0d4"]], SKY, 0, 78);

// far off: the sugarloaf peaks standing out of the haze
for (const [cx, bw, h] of [[160, 15, 24], [178, 9, 15], [26, 20, 14]]) {
  for (let y = 0; y < h; y++) {
    const w = bw * Math.sqrt((y + 1) / h);
    for (let x = Math.floor(cx - w); x <= cx + w; x++) base.put(x, 80 - h + y, mix(hex("#a4b2c4"), hex("#7a8aa2"), clamp((x - cx + w) / (2 * w))), FAR);
  }
}
base.rect(0, 80, W, H, (x, y) => mix(hex("#b8c4d4"), hex("#8a9ab4"), (y - 80) / 28), FAR);
// the peak: a steep granite dome lit from the right, forest on its shoulders
const peakTop = (x) => 66 + Math.pow(Math.abs(x - CX) / 42, 1.7) * 38 + fbm(x / 8, 1, 3, 3) * 2;
for (let x = 34; x < 160; x++) for (let y = Math.max(0, Math.floor(peakTop(x))); y < H; y++) {
  const side = (x - CX) / 60, n = fbm(x / 5, y / 5, 3, 6), d = y - peakTop(x);
  const forest = d > 3 + Math.abs(side) * 4 && n > 0.42;
  base.put(x, y, forest ? mix(hex("#8aa860"), hex("#5a7a48"), clamp(n + (CX - x) / 120)) : mix(hex("#f8d4a8"), hex("#b08a7a"), clamp(-side * 0.9 + 0.35 + n * 0.25)), PEAK);
}
// plinth and statue, lit from the right: robe, outstretched arms, head
base.rect(CX - 6, 58, CX + 7, 68, (x) => mix(hex("#a8a2a0"), hex("#f4eee6"), clamp((x - CX + 6) / 13)), PEAK);
const lit = (x, x0, x1) => mix(hex("#d8c8b8"), hex("#fff8ec"), clamp((x - x0) / (x1 - x0)));
base.poly([[CX - 6, 58], [CX + 7, 58], [CX + 5, 22], [CX - 4, 22]], (x) => lit(x, CX - 6, CX + 7), STATUE);   // robe
base.poly([[CX - 38, 22], [CX + 39, 22], [CX + 39, 26], [CX + 9, 29], [CX - 8, 29], [CX - 38, 26]], (x) => lit(x, CX - 38, CX + 39), STATUE); // arms and sleeves
base.rect(CX - 40, 22, CX - 37, 26, "#d8c8b8", STATUE); base.rect(CX + 38, 22, CX + 41, 26, "#fff8ec", STATUE); // hands
base.ellipse(CX + 0.5, 15, 3.6, 4.4, (x) => lit(x, CX - 3, CX + 4), STATUE);                                 // head
base.rect(CX - 2, 19, CX + 3, 22, (x) => lit(x, CX - 2, CX + 3), STATUE);                                    // neck
for (let y = 32; y < 58; y += 6) base.line(CX - 3, y, CX + 4, y + 2, "#d0c0b0", 1, STATUE);                // folds of the robe

balance(base);
const PAL = fitPalette(base, { n: 54, extras: ["#ffffff", "#f6f2ee", "#d4d6e0", "#1c1a22"] });

export const meta = {
  slug: "redeemer-statue-clouds",
  name: "Redeemer Statue Clouds",
  category: "cities",
  note: "The great statue with open arms stands on its granite peak above a sea of cloud drifting over the bay, frigatebirds circling in the morning light.",
  tags: ["rio", "statue", "brazil", "clouds", "landmark", "wonder", "halftone", "mountain"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    // the cloud sea: soft fog over the bay and the lower slopes, big cumulus drifting through it
    mist(f, t, { y0: 70, y1: 108, c: "#f6f2ee", a: 0.9, speed: 0.06, scale: 34, cut: 0.36, seed: 4 });
    puffs(f, t, [[0.05, 0.86, 9, "#ffffff", 1.6, "#e2e2ea"], [0.45, 0.94, 11, "#ffffff", 1.1, "#e2e2ea"], [0.8, 0.88, 8, "#ffffff", 1.9, "#e2e2ea"]], [FAR, PEAK]);
    // frigatebirds circling the statue on long thin wings
    for (let i = 0; i < 3; i++) {
      const a = t * 0.3 + i * 2.1, x = CX + Math.cos(a) * (56 + i * 12), y = 36 + Math.sin(a) * 6 + i * 5;
      const flap = Math.sin(t * 3 + i) > 0.6 ? -1 : 0;
      f.add(x, y, "#1c1a22", 1, SKY);
      for (let k = 1; k <= 3; k++) { const dy = k === 1 ? 0 : k === 3 ? -1 + flap : -1; f.add(x - k, y + dy, "#1c1a22", 1, SKY); f.add(x + k, y + dy, "#1c1a22", 1, SKY); }
    }
    return enc(f);
  };
}
