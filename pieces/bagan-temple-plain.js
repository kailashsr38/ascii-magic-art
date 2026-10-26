/* bagan-temple-plain: brick temples and spired pagodas across a plain at sunset, an ox cart on the dusty road, hand-built.
 * Painted once: the sunset sky and sun, the far hills, dozens of temples and pagodas at every distance,
 * the acacia trees and the road. Each frame adds an ox cart raising dust along the road, haze drifting
 * between the temples and birds. */
import { fbm, noise2, clamp, lerp, rng } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, mist, tree, across, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, LAND = 2, TEMPLE = 3;
const HOR = 64;

const base = new Canvas();
base.sky([[0, "#6a5a8a"], [0.4, "#d07a7a"], [0.75, "#f8a860"], [1, "#ffd08a"]], SKY, 0, HOR + 1);
base.glow(70, 56, 6, 36, "#fff0c0", 0.65, SKY);
base.ridge({ base: 0.6, amp: 0.04, f: 4, seed: 6, top: "#a8708a", bot: "#8a6078", depth: 8, m: LAND });
// the plain, dry and warm
base.rect(0, HOR, W, H, (x, y) => mix(mix(hex("#d89a6a"), hex("#8a5a42"), clamp((y - HOR) / 44)), hex("#6a7a42"), clamp(fbm(x / 6, y / 3, 3, 4) - 0.55) * 1.4), LAND);
// temples at every distance: a stepped base, a bell or a tapering spire, lit from the sun on the left
const R = rng(5);
const temple = (cx, by, s, spire) => {
  const lit = (x, x0, x1) => mix(hex("#f8b880"), hex("#7a3e32"), clamp((x - x0) / (x1 - x0) * 1.1));
  for (let k = 0; k < 3; k++) { const hw = (9 - k * 2.2) * s, y0 = by - (k + 1) * 3.2 * s; base.rect(cx - hw, y0, cx + hw + 1, y0 + 3.2 * s + 1, (x) => lit(x, cx - hw, cx + hw), TEMPLE); }
  const top = by - 9.6 * s;
  if (spire) for (let y = 0; y < 12 * s; y++) { const hw = (3.2 - (y / (12 * s)) * 3) * s; base.rect(cx - hw, top - y, cx + hw + 1, top - y + 1, (x) => lit(x, cx - hw, cx + hw), TEMPLE); }
  else { base.ellipse(cx + 0.5, top, 4 * s, 3 * s, (x) => lit(x, cx - 4 * s, cx + 4 * s), TEMPLE); base.rect(cx, top - 7 * s, cx + 1, top - 2 * s, "#7a3e32", TEMPLE); }
  if (s > 0.8) base.rect(cx - 1, by - 6 * s, cx + 2, by - 2 * s, "#3a1e1a", TEMPLE); // the doorway
};
const SPOTS = [];
for (let i = 0; i < 26; i++) SPOTS.push([R() * W, HOR + 1 + Math.pow(R(), 1.6) * 16, R() < 0.5]);
SPOTS.sort((a, b) => a[1] - b[1]);
for (const [x, y, sp] of SPOTS) temple(x, y, 0.35 + (y - HOR) / 22, sp);
temple(140, 92, 2.4, true); temple(48, 96, 1.8, false);
for (const [x, y, r] of [[18, 98, 6], [96, 100, 5], [180, 102, 7], [118, 84, 3]]) tree(base, x, y, r, { trunk: "#3a2a22", dark: "#3a4a28", light: "#7a8a44", seed: x, m: LAND });
// the road: a pale dusty curve across the foreground
for (let x = 0; x < W; x++) { const y = 100 + Math.sin(x / 40) * 3; base.rect(x, y, x + 1, y + 4, (xx, yy) => mix(hex("#f0c890"), hex("#c89a6a"), (yy - y) / 4), LAND); }

balance(base);
const PAL = fitPalette(base, { n: 52, extras: ["#1e1418", "#f8dcb4", "#e8c8a0", "#5a3a2a"] });

export const meta = {
  slug: "bagan-temple-plain",
  name: "Bagan Temple Plain",
  category: "cities",
  note: "Brick temples and spired pagodas stretch across the plain at sunset while an ox cart raises dust along the road and haze drifts between them.",
  tags: ["bagan", "myanmar", "temples", "pagodas", "sunset", "landmark", "halftone", "plain"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    mist(f, t, { y0: HOR - 4, y1: HOR + 16, c: "#f8dcb4", a: 0.4, speed: 0.05, scale: 30, cut: 0.48 });
    // the ox cart: two humped oxen, a cart with a big spoked wheel, dust rising behind
    const x = across(t, 4, 0.1, W, 40), y = Math.round(100 + Math.sin(x / 40) * 3) + 1;
    for (let k = 0; k < 18; k++) { const p = k / 18; f.add(x - 22 - k * 1.4, y - 2 - p * 5 + Math.sin(t + k) * 1, "#f8dcb4", (1 - p) * 0.5); }
    for (const ox of [0, 7]) { f.rect(x + ox, y - 5, x + ox + 6, y - 2, "#e8c8a0"); f.put(x + ox + 1, y - 6, "#e8c8a0"); f.rect(x + ox + 6, y - 6, x + ox + 8, y - 3, "#e8c8a0"); for (const l of [1, 5]) f.rect(x + ox + l, y - 2, x + ox + l + 1, y + 1 - (Math.floor(t * 4 + ox) % 2), "#5a3a2a"); }
    f.rect(x - 16, y - 8, x - 3, y - 3, "#5a3a2a"); f.rect(x - 14, y - 11, x - 5, y - 8, "#8a5a3a");
    const wh = t * 2;
    for (let a = 0; a < 6; a++) f.put(x - 10 + Math.round(Math.cos(wh + a) * 3), y - 2 + Math.round(Math.sin(wh + a) * 3), "#1e1418");
    birds(f, t, { n: 6, y: 22, period: 15, c: "#1e1418", only: SKY });
    return enc(f);
  };
}
