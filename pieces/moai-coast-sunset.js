/* moai-coast-sunset: a row of moai on their stone platform at sunset, the sea behind them, hand-built.
 * Painted once: the sunset sky and sun over the sea, the grassy headland, the ahu platform and six moai,
 * two with red topknots. Each frame adds surf breaking on the rocks, cloud, seabirds and a grazing horse. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, clouds, surf, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, SEA = 2, LAND = 3, STONE = 4;
const HOR = 58, SUN = [44, 52];

const base = new Canvas();
base.sky([[0, "#6e5a8e"], [0.35, "#c47a8a"], [0.65, "#f29a68"], [1, "#ffcf86"]], SKY, 0, HOR + 1);
base.glow(SUN[0], SUN[1], 6, 38, "#fff0c0", 0.65, SKY);
// the sea, with the sun's path across it
base.rect(0, HOR, W, 80, (x, y) => {
  const u = (y - HOR) / 22, path = Math.exp(-((x - SUN[0]) ** 2) / (60 + u * 400)) * (1 - u * 0.4);
  return mix(mix(hex("#c8786e"), hex("#5a4a6e"), clamp(u)), hex("#ffd896"), clamp(path * 0.9));
}, SEA);
// the headland: grass rising to the right, rocks at the sea edge
const top = (x) => lerp(74, 62, clamp((x - 40) / 120)) + fbm(x / 14, 2, 3, 5) * 4 - 2;
for (let x = 0; x < W; x++) for (let y = Math.floor(top(x)); y < H; y++) {
  const n = fbm(x / 5, y / 4, 3, 7), u = (y - top(x)) / (H - top(x));
  const rock = y < top(x) + 6 && x < 80 && n > 0.5;
  base.put(x, y, rock ? mix(hex("#4a3a40"), hex("#7a5a52"), n) : mix(mix(hex("#a8a058"), hex("#6a7a3a"), clamp(u * 1.4)), hex("#4e5e2e"), clamp(n - 0.5)), LAND);
}
// the ahu platform
base.rect(70, 70, 186, 76, (x, y) => mix(hex("#7a6058"), hex("#a8806a"), noise2(x / 2, y / 2, 3) * 0.6 + (y === 70 ? 0.4 : 0)), STONE);
// six moai with their backs to the sea: long heads, heavy brows, deep-set eyes, lit from the sun behind-left
const moai = (cx, by, h, pukao) => {
  const head = h * 0.56, hw = h * 0.16, bw = h * 0.2;
  for (let y = Math.floor(by - h); y < by; y++) {
    const u = (y - (by - h)) / h; // 0 top
    let half = u < 0.56 ? hw * (0.85 + u * 0.35) : bw * (0.95 + (u - 0.56) * 0.3);
    if (u > 0.1 && u < 0.17) half += 0.8;                                    // the brow ridge
    for (let x = Math.floor(cx - half); x <= cx + half; x++) {
      const side = (x - (cx - half)) / (2 * half);
      const n = noise2(x / 1.5, y / 1.5, 9) * 0.15;
      base.put(x, y, mix(hex("#f2a878"), hex("#5a4650"), clamp(side * 1.2 - 0.1 + n)), STONE);
    }
    if (u > 0.14 && u < 0.5) { base.put(cx - half - 1, y, "#8a6a62", STONE); base.put(cx + half + 1, y, "#4a3a44", STONE); } // long ears
  }
  const top = by - h;
  base.rect(cx - hw * 0.7, top + h * 0.17, cx - 0.5, top + h * 0.24, "#3a2e38", STONE);  // eye sockets under the brow
  base.rect(cx + 1, top + h * 0.17, cx + hw * 0.7 + 1, top + h * 0.24, "#3a2e38", STONE);
  base.rect(cx - 1, top + h * 0.24, cx + 1, top + h * 0.42, (x) => (x < cx ? hex("#f6b484") : hex("#6a5258")), STONE); // the nose
  base.rect(cx - hw * 0.5, top + h * 0.46, cx + hw * 0.5 + 1, top + h * 0.49, "#3a2e38", STONE);  // pursed lips
  base.rect(cx - bw, by - h * 0.3, cx - bw * 0.3, by - h * 0.27, "#6a5258", STONE);            // hands across the belly
  if (pukao) base.ellipse(cx, top - 2, hw * 1.05, 2.6, (x) => mix(hex("#d86a4a"), hex("#7a3a32"), clamp((x - cx + hw) / (2 * hw))), STONE);
};
[[86, 30, false], [104, 33, true], [122, 31, false], [140, 34, false], [158, 32, true], [175, 29, false]].forEach(([x, h, p]) => moai(x, 70, h, p));
// foreground grass
for (let y = 88; y < H; y++) for (let x = 0; x < W; x++) if (fbm(x / 3, y / 2, 3, 11) > 0.5) base.put(x, y, mix(hex("#5e6e32"), hex("#3e4e24"), (y - 88) / 20), LAND);

balance(base);
const PAL = fitPalette(base, { n: 54, extras: ["#f8f2ea", "#1e1820", "#5a3a2a"] });

export const meta = {
  slug: "moai-coast-sunset",
  name: "Moai Coast Sunset",
  category: "cities",
  note: "A row of moai on their stone platform at sunset with the sea behind them, surf breaking on the rocks, seabirds wheeling and a wild horse grazing.",
  tags: ["moai", "easter-island", "sunset", "statues", "landmark", "wonder", "halftone", "coast"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    clouds(f, t, [[0.3, 0.34, 0.2, 1.3, "#f4b08a", 0.45], [0.8, 0.26, 0.32, 1, "#c28aa0", 0.35], [0.05, 0.2, 0.42, 0.8, "#ffd0a0", 0.55]], SKY, 0.75);
    surf(f, t, 60, 76, { foam: "#f8f2ea", n: 3, period: 5.5, only: SEA, wob: 2 });
    birds(f, t, { n: 4, y: 26, period: 14, dir: 1, c: "#1e1820", only: SKY, spread: 1.4 });
    // a wild horse grazing in the foreground, swishing its tail
    const hx = 30 + Math.round(Math.sin(t * 0.05) * 8), hy = 96, down = Math.sin(t * 0.7) > -0.2;
    f.rect(hx, hy - 6, hx + 10, hy - 2, "#5a3a2a");
    for (const lx of [hx + 1, hx + 3, hx + 7, hx + 9]) f.rect(lx, hy - 2, lx + 1, hy + 2, "#3e281e");
    if (down) f.rect(hx - 4, hy - 5, hx, hy - 1, "#5a3a2a"); else f.rect(hx - 4, hy - 9, hx, hy - 5, "#5a3a2a");
    const sw = Math.round(Math.sin(t * 3) * 1.5);
    f.put(hx + 11, hy - 5, "#2a1a14"); f.put(hx + 12, hy - 4 + sw, "#2a1a14"); f.put(hx + 12, hy - 3 + sw, "#2a1a14");
    return enc(f);
  };
}
