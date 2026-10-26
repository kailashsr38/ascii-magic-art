/* grand-canyon-rim: the great canyon from its rim at sunset, layered buttes and the river far below, hand-built.
 * Painted once: the sunset sky, ridge after ridge of banded red rock fading into the distance, the side
 * canyons, the thin river at the bottom, the dark rim and a gnarled juniper in front. Each frame adds
 * shadows lengthening across the rock, ravens riding the updraft and cloud. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, clouds, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, ROCK = 2, RIVER = 3, RIM = 4;

const base = new Canvas();
base.sky([[0, "#3a5a9a"], [0.6, "#8aa8d0"], [1, "#f0e4c8"]], SKY, 0, 40);
// ridge after ridge: each crest stepped (flat mesa tops, sheer drops), a bright sunlit rim along the top
// falling into shadow at the foot where the next ridge stands in front. Far ridges pale and violet, near
// ones deep red: aerial perspective does the depth.
const LAYERS = [
  { base: 0.38, amp: 0.05, f: 5, seed: 3, lit: "#f4d8dc", dark: "#b8a0b8" },
  { base: 0.47, amp: 0.08, f: 4, seed: 7, lit: "#ffd0b8", dark: "#a8788c" },
  { base: 0.57, amp: 0.1, f: 3.4, seed: 13, lit: "#ffc090", dark: "#8a4e58" },
  { base: 0.68, amp: 0.12, f: 3, seed: 21, lit: "#ffb070", dark: "#6a3438" },
  { base: 0.8, amp: 0.1, f: 2.6, seed: 29, lit: "#f49860", dark: "#4a2428" },
];
for (const L of LAYERS) {
  const crest = new Float32Array(W);
  for (let x = 0; x < W; x++) crest[x] = (L.base - L.amp * (Math.round(fbm((x / W) * L.f, L.seed, 4, L.seed) * 5) / 5 * 1.8 - 0.5)) * H;
  for (let x = 0; x < W; x++) for (let y = Math.floor(crest[x]); y < H; y++) {
    const d = y - crest[x], strata = d > 3 && Math.floor(d / 3) % 3 === 0 ? 0.12 : 0;
    base.put(x, y, mix(mix(hex(L.lit), hex(L.dark), clamp(d / 14)), hex("#2a1418"), strata), ROCK);
  }
}
// the river, a thin green thread in the deepest gorge

// the rim in front: dark rock, and a gnarled juniper
for (let x = 0; x < W; x++) { const top = 98 + fbm(x / 8, 3, 3, 9) * 6 - (x < 50 ? (50 - x) * 0.2 : 0); for (let y = Math.floor(top); y < H; y++) base.put(x, y, mix(hex("#a8684e"), hex("#5a3430"), clamp((y - top) / 12 + noise2(x / 2, y / 2, 5) * 0.2)), RIM); }
const branch = (x, y, a, len, w) => {
  if (len < 2) return;
  const x1 = x + Math.cos(a) * len, y1 = y - Math.sin(a) * len;
  base.line(x, y, x1, y1, "#2a1e1e", w, RIM);
  if (len < 7) base.ellipse(x1, y1, 3.5, 2.2, "#3a4a32", RIM);
  branch(x1, y1, a + 0.5, len * 0.68, Math.max(1, w - 1));
  branch(x1, y1, a - 0.6, len * 0.62, Math.max(1, w - 1));
};
branch(22, 96, 1.3, 10, 2);

balance(base);
const PAL = fitPalette(base, { n: 54, extras: ["#1a1214", "#fff0d8"] });

export const meta = {
  slug: "grand-canyon-rim",
  name: "Grand Canyon Rim",
  category: "landscapes",
  note: "Ridge after ridge of banded red rock fades into the sunset from the canyon rim, the river a thin thread far below as ravens ride the updraft past a gnarled juniper.",
  tags: ["grand-canyon", "arizona", "canyon", "sunset", "wonder", "desert", "halftone", "national-park"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    clouds(f, t, [[0.2, 0.32, 0.14, 1.2, "#f4b090", 0.4], [0.7, 0.26, 0.24, 1, "#c890a8", 0.35]], SKY, 0.7);
    // ravens riding the updraft: slow circles over the gorge
    for (let i = 0; i < 2; i++) {
      const a = t * 0.35 + i * 3, x = 110 + Math.cos(a) * (26 + i * 10), y = 50 + Math.sin(a) * 6;
      const tip = Math.sin(t * 2 + i) > 0.7 ? -1 : 0;
      f.put(x, y, "#1a1214"); for (const s of [-1, 1]) { f.put(x + s, y - 1 - (tip ? 0 : 0), "#1a1214"); f.put(x + 2 * s, y - 1 + tip, "#1a1214"); f.put(x + 3 * s, y + tip, "#1a1214"); }
    }
    return enc(f);
  };
}
