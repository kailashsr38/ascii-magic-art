/* liberty-harbor-dawn: the copper-green statue on her island at dawn, the city far off, hand-built.
 * Painted once: the dawn sky and rising sun, the distant skyline, the harbour, the island's star fort,
 * the pedestal and the statue with her torch raised. Each frame adds a ferry crossing with its wake,
 * gulls and drifting cloud. */
import { fbm, noise2, clamp, lerp, rng } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, clouds, across, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, CITY = 2, SEA = 3, LAND = 4, STATUE = 5;
const HOR = 70, SX = 62;

const base = new Canvas();
base.sky([[0, "#6a86b8"], [0.4, "#b8a8c4"], [0.7, "#f6b896"], [1, "#ffdcae"]], SKY, 0, HOR + 1);
base.glow(150, 64, 5, 40, "#fff2cc", 0.65, SKY);
// the far skyline, hazy blue, towers of every height
const R = rng(3);
for (let x = 96; x < W; ) {
  const w = 3 + Math.floor(R() * 6), h = 4 + Math.floor(R() * (x > 130 && x < 160 ? 24 : 12));
  base.rect(x, HOR - h, x + w, HOR + 1, (xx) => mix(hex("#9a90b0"), hex("#7a7698"), clamp((xx - x) / w)), CITY);
  if (h > 20) base.rect(x + Math.floor(w / 2), HOR - h - 5, x + Math.floor(w / 2) + 1, HOR - h, "#7a7698", CITY);
  x += w + (R() < 0.3 ? 1 : 0);
}
// the harbour: dawn colours mirrored, darker toward us, the sun's path
base.rect(0, HOR, W, H, (x, y) => {
  const u = (y - HOR) / (H - HOR), path = Math.exp(-((x - 150) ** 2) / (40 + u * 900)) * (1 - u * 0.5);
  const ripple = Math.sin(y * 1.7 + Math.sin(x * 0.2) * 1.5) > 0.6 ? 0.08 : 0;
  return mix(mix(hex("#e0b0aa"), hex("#7a88b0"), clamp(u * 1.2)), hex("#ffe0b0"), clamp(path * 0.85 + ripple));
}, SEA);
// the island, the star-shaped fort and the trees around it
base.ellipse(SX, HOR + 3, 34, 5, (x, y) => mix(hex("#8a9a5a"), hex("#5a6a42"), clamp((y - HOR) / 8)), LAND);
base.poly([[SX - 18, HOR], [SX - 10, HOR - 4], [SX, HOR - 2], [SX + 10, HOR - 4], [SX + 18, HOR], [SX, HOR + 3]], (x) => mix(hex("#c8a890"), hex("#8a7a7a"), clamp((x - SX + 18) / 36)), LAND);
// pedestal: granite, stepped, lit from the right (the dawn)
base.rect(SX - 7, HOR - 22, SX + 8, HOR - 3, (x) => mix(hex("#8a7e86"), hex("#f0d8c0"), clamp((x - SX + 7) / 15)), STATUE);
base.rect(SX - 9, HOR - 6, SX + 10, HOR - 2, (x) => mix(hex("#7a6e78"), hex("#e0c4ac"), clamp((x - SX + 9) / 19)), STATUE);
base.rect(SX - 6, HOR - 24, SX + 7, HOR - 21, "#c8b0a4", STATUE);
// the statue: robe, raised right arm and torch, crown, tablet
const cu = (x, x0, x1) => mix(hex("#4a8a7a"), hex("#a8e0c8"), clamp((x - x0) / (x1 - x0)));
base.poly([[SX - 5, HOR - 24], [SX + 6, HOR - 24], [SX + 4, HOR - 44], [SX - 3, HOR - 44]], (x) => cu(x, SX - 5, SX + 6), STATUE);
base.ellipse(SX + 0.5, HOR - 47, 2.6, 3, (x) => cu(x, SX - 2, SX + 3), STATUE);
for (let k = -3; k <= 3; k++) base.line(SX + 0.5, HOR - 49, SX + 0.5 + k * 1.4, HOR - 52 + Math.abs(k) * 0.4, "#9ad8c0", 1, STATUE); // crown rays
base.rect(SX + 4, HOR - 62, SX + 6, HOR - 42, (x) => cu(x, SX + 3, SX + 6), STATUE); // the raised arm
base.rect(SX + 3, HOR - 64, SX + 7, HOR - 62, "#8ac8b0", STATUE);                    // torch cup
base.rect(SX - 6, HOR - 38, SX - 3, HOR - 31, "#3e7a6a", STATUE);                    // the tablet

balance(base);
const PAL = fitPalette(base, { n: 52, extras: ["#ffd27a", "#ffffff", "#f2ece4", "#2a2a3a", "#c84a3a"] });

export const meta = {
  slug: "liberty-harbor-dawn",
  name: "Harbor Liberty Dawn",
  category: "cities",
  note: "The copper-green statue raises her torch on her island at dawn, the city skyline hazy beyond the harbour as a ferry crosses and gulls drift by.",
  tags: ["new-york", "statue", "liberty", "harbor", "dawn", "landmark", "halftone", "ferry"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    clouds(f, t, [[0.2, 0.3, 0.2, 1.2, "#e8b0a8", 0.45], [0.7, 0.36, 0.34, 1, "#b8a0c0", 0.35], [0.95, 0.24, 0.12, 0.8, "#ffd8b0", 0.5]], SKY, 0.7);
    // the torch flame burns steady gold
    f.rect(SX + 4, HOR - 67, SX + 6, HOR - 64, "#ffd27a");
    // the ferry crossing right to left, a white wake fanning behind it
    const x = W - across(t, 7, 0.3, W, 40), y = 88;
    for (let k = 1; k < 26; k++) { const a = (1 - k / 26) * 0.7; f.add(x + 12 + k, y + (k * 0.12), "#f2ece4", a, SEA); f.add(x + 12 + k, y - (k * 0.05), "#f2ece4", a * 0.5, SEA); }
    f.rect(x, y - 3, x + 13, y, "#f2ece4"); f.rect(x + 1, y - 6, x + 9, y - 3, "#ffffff");
    f.rect(x + 2, y - 5, x + 8, y - 4, "#2a2a3a"); f.rect(x + 3, y - 8, x + 5, y - 6, "#c84a3a");
    birds(f, t, { n: 4, y: 30, period: 15, dir: 1, c: "#2a2a3a", only: SKY, spread: 1.6 });
    return enc(f);
  };
}
