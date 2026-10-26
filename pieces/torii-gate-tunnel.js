/* torii-gate-tunnel: a path through hundreds of vermilion shrine gates into the forest, hand-built.
 * Painted once: the green forest light at the far end, the stone path and the gates receding in
 * perspective, each with black-footed pillars and a dark top beam, stone lanterns at the sides. Each frame
 * adds a walker going up the path, falling leaves and a breath of mist at the end. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, mist, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const FOREST = 1, PATH = 2, GATE = 3;
const VX = 100, VY = 46; // vanishing point

const base = new Canvas();
// forest all round: dappled greens, brightest at the far end where the light comes in
base.fill((x, y) => {
  const d = Math.hypot((x - VX) / 1.6, y - VY) / 90, n = fbm(x / 6, y / 6, 4, 3);
  return mix(mix(hex("#e8f0c8"), hex("#6a8a4a"), clamp(d * 2.2)), hex("#2a4a2a"), clamp(d * 1.2 + (n - 0.5) * 0.8));
}, FOREST);
// the stone path running into the light
base.poly([[VX - 3, VY + 4], [VX + 3, VY + 4], [W * 0.82, H], [W * 0.18, H]], (x, y) => {
  const n = noise2(x / 3, y / 2, 4);
  return mix(mix(hex("#e0d8c0"), hex("#8a8070"), clamp((y - VY) / 70)), hex("#6a6458"), n * 0.3 + ((y * 3) % 7 < 1 ? 0.2 : 0));
}, PATH);
// the gates, far to near, so near ones paint over far ones
const N = 18;
for (let i = N - 1; i >= 0; i--) {
  const z = 1 + i * 0.55, s = 1 / z;                     // scale with distance
  const hw = 62 * s + 3, top = VY - 70 * s, foot = VY + 58 * s, pw = Math.max(1, 7 * s);
  const shade = clamp(i / N * 0.6);
  const ver = mix(hex("#ff6a3a"), hex("#b8341e"), shade), dark = mix(hex("#2a2222"), hex("#14121a"), shade);
  for (const sx of [-1, 1]) {
    const px = VX + sx * hw;
    base.rect(px - pw / 2, top, px + pw / 2, foot, (x) => mix(ver, hex("#7a2014"), clamp((x - px + pw / 2) / pw * 0.6 + (sx > 0 ? 0.2 : 0))), GATE);
    base.rect(px - pw / 2 - 0.5, foot - 8 * s, px + pw / 2 + 0.5, foot, dark, GATE); // black feet
  }
  base.rect(VX - hw - 8 * s, top - 6 * s, VX + hw + 8 * s, top, ver, GATE);           // kasagi, the top beam
  base.rect(VX - hw - 9 * s, top - 8 * s, VX + hw + 9 * s, top - 5 * s, dark, GATE);   // its black cap
  base.rect(VX - hw, top + 9 * s, VX + hw, top + 13 * s, ver, GATE);                     // nuki, the tie beam
}
// stone lanterns at the sides of the path
for (const [x, y, s] of [[34, 100, 1], [168, 100, 1], [60, 80, 0.6], [142, 80, 0.6]]) {
  base.rect(x - 2 * s, y - 14 * s, x + 2 * s + 1, y, "#9a9488", PATH);
  base.rect(x - 4 * s, y - 18 * s, x + 4 * s + 1, y - 13 * s, "#b8b2a4", PATH);
  base.rect(x - 2 * s, y - 17 * s, x + 2 * s + 1, y - 15 * s, "#ffd890", PATH);
  base.poly([[x - 5 * s, y - 18 * s], [x + 6 * s, y - 18 * s], [x, y - 23 * s]], "#8a8478", PATH);
}

balance(base);
const PAL = fitPalette(base, { n: 52, extras: ["#ffffff", "#2a2228", "#e8c8a0", "#c85a2a", "#e8a040", "#f4f0d8"] });

export const meta = {
  slug: "torii-gate-tunnel",
  name: "Torii Gate Tunnel",
  category: "cities",
  note: "A stone path runs through hundreds of vermilion shrine gates into the green forest light while a walker climbs the path and leaves drift down.",
  tags: ["kyoto", "japan", "shrine", "torii", "forest", "landmark", "halftone", "path"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    mist(f, t, { y0: VY - 14, y1: VY + 10, c: "#f4f0d8", a: 0.35, speed: 0.06, scale: 18, cut: 0.45 });
    // a walker going up the path, getting smaller as they go, every 26 s
    const p = (t % 26) / 26, z = 1 + p * 9, s = 1 / z;
    const x = VX + (W * 0.08) * s, y = VY + 58 * s, hgt = Math.max(2, 22 * s), w = Math.max(1, 6 * s);
    if (p < 0.92) {
      f.rect(x - w / 2, y - hgt, x + w / 2, y, "#2a2228");
      f.rect(x - w / 2, y - hgt * 0.75, x + w / 2, y - hgt * 0.55, "#c85a2a");
      f.ellipse(x, y - hgt - w * 0.4, w * 0.45, w * 0.5, "#2a2228");
    }
    // leaves drifting down through the gates
    for (let i = 0; i < 26; i++) {
      const r1 = Math.sin(i * 12.9898) * 43758.5453, r2 = Math.sin(i * 78.233) * 12543.123;
      const u = r1 - Math.floor(r1), v = r2 - Math.floor(r2);
      const yy = ((u * H + t * (5 + v * 4)) % (H + 6)) - 3, xx = v * W + Math.sin(t * 1.3 + i) * 3;
      f.put(xx, yy, i % 3 ? "#e8a040" : "#c85a2a");
    }
    return enc(f);
  };
}
