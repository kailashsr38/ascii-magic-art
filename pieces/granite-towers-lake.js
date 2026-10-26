/* granite-towers-lake: three sheer granite towers rising over a glacial lake in Patagonia at sunrise, guanacos on the shore, hand-built.
 * Painted once: the sunrise sky, the three needle towers glowing orange on their east faces, the
 * moraine and glacier below them, the milky turquoise lake and the windswept scrub. Each frame streams
 * cloud off the summits in the wind, ruffles the lake, walks guanacos along the shore and flies a condor. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, mist, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, ROCK = 2, ICE = 3, LAKE = 4, SCRUB = 5;
const WL = 76;

const base = new Canvas();
base.sky([[0, "#4a6aa8"], [0.5, "#c8a0b8"], [0.85, "#ffc8a0"], [1, "#ffe0c0"]], SKY, 0, 60);
// three needle towers, the sun striking their right faces
for (const [cx, hw, top] of [[66, 9, 12], [96, 11, 6], [128, 9, 14]]) {
  for (let y = top; y < 64; y++) {
    // a needle: a sharp, jagged summit flaring into a broad base
    const u = (y - top) / (64 - top), w = hw * Math.min(1.15, 0.12 + Math.pow(u, 0.55) * 1.05) + noise2(y / 2.5, cx, 4) * 1.6;
    for (let x = Math.floor(cx - w); x <= cx + w; x++) {
      const lit = (x - (cx - w)) / (2 * w);
      base.put(x, y, mix(hex("#5a4a6a"), hex("#ffa86a"), clamp(lit * 1.1 - 0.15 + noise2(x / 1.5, y / 2, 7) * 0.15)), ROCK);
    }
  }
}
// the cirque below: dark rock ridges and the glacier tongue
base.ridge({ base: 0.62, amp: 0.06, f: 3, seed: 5, top: "#7a6a80", bot: "#4a4058", depth: 10, m: ROCK });
base.poly([[78, 62], [118, 62], [124, 72], [110, 76], [86, 76], [72, 72]], (x, y) => mix(hex("#f4f8ff"), hex("#a8c0d8"), clamp((y - 62) / 14 + noise2(x / 3, y, 2) * 0.2)), ICE);
// the lake, milky turquoise
base.rect(0, WL, W, 94, (x, y) => mix(hex("#7ad0c8"), hex("#3a9a9a"), clamp((y - WL) / 18)), LAKE);
const snap = new Canvas().copy(base);
for (let x = 0; x < W; x++) for (let y = WL; y < 92; y++) { const s = snap.get(x, 2 * WL - y - 1); if (snap.maskAt(x, 2 * WL - y - 1) === ROCK) base.put(x, y, mix(s, snap.get(x, y), 0.55), LAKE); }
// windswept scrub on the near shore
base.rect(0, 92, W, H, (x, y) => mix(hex("#a89a5a"), hex("#5a5a32"), clamp((y - 92) / 16 + fbm(x / 3, y / 2, 3, 8) * 0.5)), SCRUB);

balance(base);
const PAL = fitPalette(base, { n: 50, extras: ["#ffffff", "#f4ece4", "#c8885a", "#3a2a22", "#1e1a1e"] });

export const meta = {
  slug: "granite-towers-lake",
  name: "Granite Towers Lake",
  category: "landscapes",
  note: "Three sheer granite towers glow orange at sunrise over a milky turquoise glacial lake as cloud streams off their summits and guanacos walk the windswept shore.",
  tags: ["patagonia", "torres-del-paine", "chile", "mountains", "lake", "sunrise", "wonder", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    // cloud banners streaming off the summits in the west wind
    for (const [cx, top] of [[66, 12], [96, 6], [128, 14]]) for (let k = 0; k < 30; k++) {
      const p = ((t * 0.12 + k / 30) % 1), x = cx + p * 46, y = top + 2 + Math.sin(p * 5 + cx) * 2 + p * 4;
      for (let r = -1; r <= 1; r++) f.add(x, y + r, "#f4ece4", (1 - p) * 0.55 * (r ? 0.5 : 1), SKY);
    }
    // wind ruffling the lake in patches
    for (let y = WL + 2; y < 92; y++) for (let x = 0; x < W; x++) if (fbm(x / 10 - t * 0.3, y / 2, 2, 3) > 0.62) f.add(x, y, "#ffffff", 0.2, LAKE);
    // guanacos walking the shore
    for (let i = 0; i < 3; i++) {
      const x = ((t * 3 + i * 18) % (W + 40)) - 20, y = 100 + i, step = Math.floor(t * 3 + i) % 2;
      f.rect(x, y - 5, x + 6, y - 3, "#c8885a"); f.rect(x + 5, y - 9, x + 6, y - 5, "#c8885a"); f.put(x + 7, y - 9, "#c8885a");
      for (const l of [0, 5]) f.rect(x + l, y - 3, x + l + 1, y - step, "#3a2a22");
    }
    // a condor gliding wide circles
    const a = t * 0.25, cx = 150 + Math.cos(a) * 30, cy = 26 + Math.sin(a) * 6;
    for (let k = -5; k <= 5; k++) f.add(cx + k, cy + (Math.abs(k) > 3 ? -1 : 0), "#1e1a1e", 1, SKY);
    return enc(f);
  };
}
