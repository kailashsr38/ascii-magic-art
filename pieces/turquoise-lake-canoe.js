/* turquoise-lake-canoe: a red canoe gliding across an impossibly turquoise lake ringed by ten jagged peaks and pines, morning, hand-built.
 * Painted once: the clear sky, the wall of jagged grey peaks with snow in their gullies, the scree slopes,
 * the dark pine shores and the vivid turquoise lake mirroring the peaks. Each frame paddles the canoe
 * across with its ripples, drifts morning mist over the water and flies birds. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, mist, pine, across, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, PEAK = 2, SHORE = 3, LAKE = 4;
const WL = 72;

const base = new Canvas();
base.sky([[0, "#3a7ad8"], [0.7, "#8ab8e8"], [1, "#d4e4f4"]], SKY, 0, 40);
// the wall of peaks: jagged, steep, grey with snow in the gullies, lit from the left
for (let x = 0; x < W; x++) {
  // ten peaks of different heights and widths, not a regular saw
  const peaks = [[8, 30], [26, 20], [46, 28], [66, 16], [88, 24], [106, 12], [126, 22], [146, 18], [166, 26], [186, 20]];
  let top = 64;
  for (const [px, ph] of peaks) top = Math.min(top, ph + Math.abs(x - px) * (1.3 + (px % 3) * 0.25));
  top += fbm(x / 4, 2, 3, 4) * 5;
  for (let y = Math.floor(top); y < 64; y++) {
    const gully = Math.sin(x * 0.6 + y * 0.3 + noise2(x / 4, y / 6, 3) * 3) > 0.75, d = (y - top) / 46;
    base.put(x, y, gully && d < 0.6 ? hex("#f4f8fc") : mix(hex("#c8ccd4"), hex("#6a6e7a"), clamp(d * 0.8 + (Math.sin(x * 0.35) > 0 ? 0.15 : 0))), PEAK);
  }
}
// scree fans and the pine shore
for (let x = 0; x < W; x++) for (let y = 56; y < WL; y++) if (base.maskAt(x, y) === PEAK || y > 62) base.put(x, y, mix(hex("#a8a49c"), hex("#7a7670"), (y - 56) / 16), SHORE);
for (let i = 0; i < 40; i++) { const x = (i * 23) % W + (i % 3), h = 10 + (i % 5) * 3; pine(base, x, WL, h, i % 2 ? "#1e3a2a" : "#2a4a32", SHORE); }
// the lake: vivid turquoise, the peaks mirrored, deeper colour toward us
const snap = new Canvas().copy(base);
base.rect(0, WL, W, H, (x, y) => mix(mix(snap.get(x, 2 * WL - y - 1), hex("#3ac8d0"), 0.55), hex("#1a8a9a"), clamp((y - WL) / 40)), LAKE);

balance(base, 0.5);
const PAL = fitPalette(base, { n: 50, extras: ["#e83a2a", "#ffffff", "#1e1a1e", "#f4ece4", "#ffd23a"] });

export const meta = {
  slug: "turquoise-lake-canoe",
  name: "Turquoise Lake Canoe",
  category: "landscapes",
  note: "A red canoe glides across an impossibly turquoise lake ringed by jagged peaks and dark pines, morning mist lifting off the water around it.",
  tags: ["moraine-lake", "canada", "rockies", "lake", "canoe", "mountains", "wonder", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    mist(f, t, { y0: WL - 4, y1: WL + 14, c: "#f4ece4", a: 0.45, speed: 0.05, scale: 24, cut: 0.48 });
    // the canoe: long red hull, two paddlers, paddles dipping alternately, a V of ripples
    const x = across(t, 4, 0.2), y = 94, st = Math.sin(t * 2.2);
    for (let k = 2; k < 22; k++) { const a = (1 - k / 22) * 0.45; f.add(x - k, y + 1 + k * 0.2, "#ffffff", a, LAKE); f.add(x - k, y - k * 0.12, "#ffffff", a * 0.6, LAKE); }
    for (let i = -9; i <= 9; i++) { const lift = Math.pow(Math.abs(i) / 9, 3) * 2; f.put(x + i, y - lift, "#e83a2a"); f.put(x + i, y + 1 - lift * 0.5, "#e83a2a"); }
    for (const [px, ph, c] of [[-4, 0, "#ffd23a"], [4, Math.PI, "#1e1a1e"]]) {
      f.rect(x + px, y - 5, x + px + 1, y - 1, c); f.put(x + px, y - 6, "#f4ece4");
      const s = Math.sin(t * 2.2 + ph);
      f.line(x + px, y - 3, x + px + (s > 0 ? 3 : -3), y + 2, "#1e1a1e", 1);
    }
    birds(f, t, { n: 4, y: 12, period: 17, c: "#1e1a1e", only: SKY });
    return enc(f);
  };
}
