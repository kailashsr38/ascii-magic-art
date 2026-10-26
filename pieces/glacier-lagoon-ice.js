/* glacier-lagoon-ice: icebergs drifting in a glacier lagoon at midnight-sun dusk, the glacier and peaks behind, seals in the water, hand-built.
 * Painted once: the pastel sky, the dark peaks and the white glacier flowing down to the lagoon, and the
 * still water. Each frame drifts the icebergs, white and blue and striped with ash, rolls a seal through
 * the water and flies terns. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, MTN = 2, GLACIER = 3, WATER = 4;
const WL = 58;

const base = new Canvas();
base.sky([[0, "#7a8ac0"], [0.5, "#e8b8c8"], [1, "#ffe0c8"]], SKY, 0, 50);
base.ridge({ base: 0.36, amp: 0.12, f: 3, seed: 3, top: "#5a5a72", bot: "#3a3a52", depth: 20, m: MTN });
// the glacier: a broad, low tongue of white ice filling the valley floor between the peaks, its front a wall at the water
for (let x = 20; x < 176; x++) {
  const top = 46 + Math.abs(x - 98) * 0.06 + fbm(x / 6, 2, 3, 5) * 2;
  for (let y = Math.floor(top); y < WL; y++) base.put(x, y, mix(hex("#ffffff"), hex("#9ab8d4"), clamp((y - top) / 12 + (Math.sin(x * 0.9 + y) > 0.8 ? 0.35 : 0))), GLACIER);
}
// the lagoon: pastel sky mirrored, darker toward us
const snap = new Canvas().copy(base);
base.rect(0, WL, W, H, (x, y) => mix(snap.get(x, 2 * WL - y - 1), hex("#3a4a6a"), clamp(0.35 + (y - WL) / 70)), WATER);

balance(base);
const PAL = fitPalette(base, { n: 46, extras: ["#ffffff", "#f4f8fc", "#8ad0f0", "#4a9ad0", "#2a2a2e", "#5a5a62", "#1e1e24", "#c8d8e8"] });

export const meta = {
  slug: "glacier-lagoon-ice",
  name: "Glacier Lagoon Ice",
  category: "landscapes",
  note: "Icebergs of white and glacial blue, some striped with ash, drift across a still lagoon under the pastel midnight sun as a seal rolls through the water and terns fly over.",
  tags: ["iceland", "glacier", "lagoon", "icebergs", "seal", "midnight-sun", "wonder", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

const BERGS = [
  [10, 70, 22, 12, 0.5, "w"], [64, 66, 14, 8, 0.35, "b"], [110, 74, 28, 14, 0.42, "s"], [160, 64, 12, 7, 0.3, "w"], [36, 88, 18, 10, 0.55, "b"], [140, 92, 24, 11, 0.48, "w"],
];

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    for (const [x0, y, w, h, sp, kind] of BERGS) {
      const x = ((x0 + t * sp) % (W + w + 20)) - w - 10;
      // the berg: an irregular block, faceted, with its reflection
      for (let yy = 0; yy < h; yy++) {
        const rowW = w * (0.6 + 0.4 * Math.sin((yy / h) * Math.PI)) + Math.sin(yy * 1.7 + x0) * 2;
        for (let xx = 0; xx < rowW; xx++) {
          const px = x + (w - rowW) / 2 + xx, py = y - h + yy, lit = xx / rowW;
          let c = kind === "b" ? mix(hex("#8ad0f0"), hex("#4a9ad0"), lit) : mix(hex("#ffffff"), hex("#c8d8e8"), lit);
          if (kind === "s" && Math.floor(yy / 2.5) % 2 === 0) c = mix(c, hex("#2a2a2e"), 0.55);
          f.put(px, py, c);
          f.add(px, y + (h - yy) * 0.7, c, 0.35, WATER);
        }
      }
    }
    // a seal surfacing, rolling and diving (12 s)
    const sp2 = (t % 12) / 12;
    if (sp2 < 0.5) { const sx = 90 + sp2 * 20, sy = 100; f.ellipse(sx, sy, 4, 1.6, "#5a5a62"); f.ellipse(sx + 3, sy - 1, 1.6, 1.4, "#5a5a62"); for (let k = 0; k < 10; k++) f.add(sx + Math.cos(k) * 7, sy + Math.sin(k) * 1.5, "#ffffff", 0.3, WATER); }
    // terns flickering over the water
    for (let i = 0; i < 4; i++) { const x = ((t * 14 + i * 50) % (W + 20)) - 10, y = 40 + i * 3 + Math.sin(t * 3 + i) * 3, up = Math.sin(t * 10 + i) > 0; f.put(x, y, "#ffffff"); f.put(x - 1, y - (up ? 1 : 0), "#ffffff"); f.put(x + 1, y - (up ? 1 : 0), "#ffffff"); }
    return enc(f);
  };
}
