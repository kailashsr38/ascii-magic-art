/* mangrove-tiger-creek: a tiger swimming across a tidal creek in the mangrove forest at morning, a boat waiting and a kingfisher diving, hand-built.
 * Painted once: the hazy morning sky, the mangrove walls on both banks with their arching stilt roots and
 * spiked breathing roots in the mud, the shining mud flats and the wide brown creek. Each frame swims
 * the tiger across with its head and shoulders above the water, rocks a wooden boat at its mooring,
 * dives a kingfisher, crawls crabs over the mud and drifts the mist. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, mist, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, FOREST = 2, MUD = 3, CREEK = 4;
const WL = 62;

const base = new Canvas();
base.sky([[0, "#9ab4cc"], [0.7, "#dce4dc"], [1, "#f0eedc"]], SKY, 0, WL + 1);
// the far bank: a low even wall of mangrove, pale in the haze
for (let x = 0; x < W; x++) { const top = WL - 10 - fbm(x / 6, 1, 3, 3) * 6; for (let y = Math.floor(top); y < WL + 1; y++) base.put(x, y, mix(hex("#a8b89a"), hex("#8a9a80"), (y - top) / 16), FOREST); }
// the near banks: dense canopy above, the stilt roots arching down into the mud below
for (const [x0, x1, top0] of [[0, 62, 8], [138, W, 12]]) for (let x = x0; x < x1; x++) {
  const edge = x0 === 0 ? (x1 - x) / (x1 - x0) : (x - x0) / (x1 - x0), top = top0 + (1 - edge) * 30 + fbm(x / 5, 2, 3, 5) * 6, roots = top + 22 - (1 - edge) * 8;
  for (let y = Math.floor(top); y < roots; y++) base.put(x, y, mix(hex("#a8c888"), hex("#6a9060"), clamp((y - top) / 20 + noise2(x / 2.5, y / 2.5, 4) * 0.35)), FOREST);
  for (let y = Math.floor(roots); y < WL + 6; y++) {
    const arc = Math.sin(x * 0.9) * Math.sin((y - roots) * 0.35 + x) > 0.5;
    base.put(x, y, arc ? hex("#5a4a3c") : mix(hex("#b8b49c"), hex("#9a9884"), (y - roots) / 20), FOREST);
  }
}
// the mud flats shining at the creek's edge, spiked with breathing roots
base.rect(0, WL + 4, W, WL + 12, (x, y) => mix(hex("#c8b8a0"), hex("#a8987e"), (y - WL - 4) / 8), MUD);
for (let i = 0; i < 70; i++) { const x = (i * 29) % W, y = WL + 6 + (i % 5); base.rect(x, y - 2, x + 1, y, "#6a5a48", MUD); }
// the creek: brown, wide, catching the sky
base.rect(0, WL + 12, W, H, (x, y) => mix(hex("#e0d4bc"), hex("#c0b098"), clamp((y - WL - 12) / 30 + fbm(x / 10, y / 3, 2, 4) * 0.15)), CREEK);

balance(base, 0.3);
const PAL = fitPalette(base, { n: 48, extras: ["#ffffff", "#f8a050", "#e88838", "#2a2420", "#f4f0e8", "#3a8ad8", "#f2a060", "#7a5a40"] });

export const meta = {
  slug: "mangrove-tiger-creek",
  name: "Mangrove Tiger Creek",
  category: "india",
  note: "A tiger swims across a wide tidal creek in the mangrove forest at morning, head and shoulders above the brown water, as a kingfisher dives and a wooden boat rocks at its mooring.",
  tags: ["sundarbans", "tiger", "mangroves", "creek", "bengal", "wildlife", "india", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    mist(f, t, { y0: WL - 12, y1: WL + 8, c: "#f4f0e8", a: 0.5, speed: 0.04, scale: 24, cut: 0.42 });
    // the tiger swimming across: head up, striped shoulders, a V of wake spreading behind (36 s)
    const p = ((t + 14) % 36) / 36, x = lerp(W + 16, -36, p), y = 94 + Math.sin(t * 1.4) * 0.5;
    for (let k = 1; k < 26; k++) { const a = (1 - k / 26) * 0.6; f.add(x + 18 + k * 1.2, y + 3 + k * 0.35, "#f4f0e8", a, CREEK); f.add(x + 18 + k * 1.2, y + 3 - k * 0.15, "#f4f0e8", a * 0.7, CREEK); }
    // drawn at twice the scale so the head reads: orange shoulders striped black, the white-cheeked face, ears up
    f.ellipse(x + 9, y + 1, 11, 2.6, "#e88838");
    for (let k = 0; k < 6; k++) f.line(x + 3 + k * 3, y - 1, x + 4 + k * 3, y + 3, "#2a2420", 1);
    f.ellipse(x - 3, y - 2, 5.5, 4.2, "#f8a050");
    f.rect(x - 7, y - 7, x - 5, y - 5, "#e88838"); f.rect(x - 1, y - 7, x + 1, y - 5, "#e88838");
    f.rect(x - 6, y - 3, x - 5, y - 2, "#2a2420"); f.rect(x - 2, y - 3, x - 1, y - 2, "#2a2420");
    f.ellipse(x - 4, y + 1, 3, 1.4, "#ffffff"); f.put(x - 4, y, "#2a2420");
    f.line(x - 1, y - 6, x - 1, y - 4, "#2a2420", 1); f.line(x - 5, y - 6, x - 5, y - 4, "#2a2420", 1);
    for (let k = -8; k < 22; k++) f.add(x + k, y + 4, "#ffffff", 0.55, CREEK);
    // a wooden boat rocking at its mooring by the left bank
    const r = Math.sin(t * 1.1) * 0.6;
    f.rect(16, 80 + r, 46, 83 + r, "#7a5a40"); f.rect(20, 77 + r, 40, 80 + r, "#2a2420"); f.rect(24, 74 + r, 34, 77 + r, "#f2a060");
    f.line(46, 81, 58, 72, "#2a2420", 1);
    // a kingfisher diving from a root, a splash, back up (10 s)
    const d = (t % 10) / 10, kx = 140 + d * 20, ky = d < 0.4 ? 58 : d < 0.55 ? lerp(58, 84, (d - 0.4) / 0.15) : lerp(84, 58, (d - 0.55) / 0.45);
    f.rect(kx, ky, kx + 2, ky + 1, "#3a8ad8"); f.put(kx + 2, ky, "#f8a050"); f.put(kx + 3, ky, "#2a2420");
    if (d > 0.54 && d < 0.7) for (let k = 0; k < 8; k++) f.add(kx + Math.cos(k) * 3, 84 + Math.sin(k) * 1, "#ffffff", 0.7, CREEK);
    // fiddler crabs scuttling on the mud
    for (let i = 0; i < 4; i++) { const cx = 70 + i * 18 + Math.sin(t * 0.7 + i * 2) * 4; f.put(cx, WL + 8, i % 2 ? "#e88838" : "#ffffff"); f.put(cx + 1, WL + 8, "#7a5a40"); }
    return enc(f);
  };
}
