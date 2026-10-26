/* living-root-bridge: a bridge grown from the roots of rubber fig trees over a clear stream in the misty rainforest, hand-built.
 * Painted once: the green rainforest light, the two great fig trunks on either bank, the woven span of
 * living roots arching between them, mossy boulders, ferns and the clear blue-green pool under it. Each
 * frame drifts mist through the forest, ripples the stream, walks a villager across and drips the leaves. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, mist, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const FOREST = 1, ROOT = 2, ROCK = 3, WATER = 4;
const SPAN = (x) => 52 + Math.pow((x - 96) / 66, 2) * -10 + 10; // the bridge's walking line

const base = new Canvas();
// the forest light: bright mist in the middle distance, dark green crowding the edges
base.fill((x, y) => {
  const d = Math.hypot((x - 96) / 1.7, y - 34) / 90, n = fbm(x / 6, y / 5, 4, 3);
  return mix(mix(hex("#e8f0d4"), hex("#6a9a5a"), clamp(d * 1.7)), hex("#1e3a24"), clamp(d * 1.1 + (n - 0.5) * 0.9));
}, FOREST);
// the two trunks, rooted on the banks, wrapped in twisting roots
for (const [cx, dir] of [[26, 1], [168, -1]]) {
  for (let y = 0; y < 82; y++) {
    const w = 9 + (y > 60 ? (y - 60) * 0.5 : 0) + Math.sin(y * 0.3) * 1.5;
    for (let x = Math.floor(cx - w); x <= cx + w; x++) {
      const twist = Math.sin((x - cx) * 0.9 + y * 0.35) > 0.4 ? 0.2 : 0;
      base.put(x, y, mix(mix(hex("#9a8a6a"), hex("#4a3e32"), clamp((x - cx + w) / (2 * w) * (dir > 0 ? 1 : -1) + (dir < 0 ? 1 : 0))), hex("#2a2420"), twist), ROOT);
    }
  }
}
// the span: many roots woven into a thick arch with a flat stone-paved top, railings of thinner roots
for (let x = 30; x <= 164; x++) {
  const y = SPAN(x);
  for (let k = 0; k < 7; k++) base.put(x, y + k * 0.8 + Math.sin(x * 0.4 + k) * 0.6, mix(hex("#a8946a"), hex("#4a3e30"), k / 7 + ((x + k) % 3 === 0 ? 0.15 : 0)), ROOT);
  base.put(x, y - 1, "#c8b88a", ROOT);
  base.put(x, y - 8 + Math.sin(x * 0.18) * 1.5, "#6a5a42", ROOT); // the hand-rail root
  if (x % 7 === 0) base.line(x, y - 8 + Math.sin(x * 0.18) * 1.5, x + 2, y - 1, "#6a5a42", 1, ROOT);
}
// mossy boulders, the stream and a deep pool under the span
base.rect(0, 80, W, H, (x, y) => mix(hex("#7ac8b8"), hex("#2a7a7a"), clamp((y - 80) / 28 + noise2(x / 5, y / 2, 4) * 0.25)), WATER);
for (const [x, y, rx, ry] of [[14, 84, 18, 8], [58, 92, 12, 6], [128, 96, 14, 7], [180, 86, 16, 8], [96, 104, 10, 5]]) base.ellipse(x, y, rx, ry, (xx, yy) => mix(hex("#9ac070"), hex("#4a6a42"), clamp((yy - y + ry) / (2 * ry) + noise2(xx / 2, yy / 2, 5) * 0.3)), ROCK);

balance(base, 0.5);
const PAL = fitPalette(base, { n: 50, extras: ["#f4f8ec", "#e84a3a", "#2a2420", "#ffffff", "#c8e8e0"] });

export const meta = {
  slug: "living-root-bridge",
  name: "Living Root Bridge",
  category: "india",
  note: "A bridge grown from the twisted roots of two great fig trees arches over a clear blue-green stream in the misty rainforest as a villager crosses and mist drifts through.",
  tags: ["meghalaya", "root-bridge", "rainforest", "stream", "mist", "northeast", "india", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    mist(f, t, { y0: 10, y1: 60, c: "#f4f8ec", a: 0.5, speed: 0.04, scale: 24, cut: 0.45 });
    // the stream: slow ripple lines drifting downstream
    for (let k = 0; k < 6; k++) { const y = 82 + k * 4, x0 = ((t * 6 + k * 37) % (W + 40)) - 20; for (let i = 0; i < 10; i++) f.add(x0 + i, y + Math.sin(i * 0.6) * 0.6, "#c8e8e0", 0.45, WATER); }
    // a villager crossing with a basket, red shawl
    const p = (t % 22) / 22, x = lerp(36, 158, p < 0.5 ? p * 2 : 2 - p * 2), y = SPAN(x) - 1;
    f.rect(x, y - 5, x + 2, y, "#e84a3a"); f.put(x, y - 6, "#2a2420"); f.rect(x - 1, y - 8, x + 3, y - 7, "#c8b88a");
    // drips falling from the leaves
    for (let i = 0; i < 12; i++) { const yy = ((t * 30 + i * 17) % 70), xx = 40 + i * 11; f.add(xx, yy, "#ffffff", 0.6, FOREST); }
    return enc(f);
  };
}
