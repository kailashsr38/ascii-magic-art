/* marrakech-rooftop-dusk: terracotta rooftops below the old minaret at dusk, the mountains beyond, hand-built.
 * Painted once: the dusk sky, the snowy mountains, the square minaret with its lantern, the red-pink
 * town of flat roofs, a palm and a rooftop terrace with lanterns. Each frame adds smoke from the
 * food stalls, lanterns lighting, swallows and drifting cloud. */
import { fbm, noise2, clamp, lerp, rng } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, clouds, smoke, palm, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, MTN = 2, TOWN = 3, MIN = 4;

const base = new Canvas();
base.sky([[0, "#4a5a8e"], [0.45, "#a888a8"], [0.75, "#f0a080"], [1, "#ffcf98"]], SKY, 0, 70);
base.ridge({ base: 0.56, amp: 0.1, f: 3, seed: 7, top: "#f8ecec", bot: "#a898b8", depth: 8, m: MTN });
base.ridge({ base: 0.62, amp: 0.04, f: 4, seed: 3, top: "#9a88a8", bot: "#7a6a90", depth: 8, m: MTN });
// the town: flat-roofed blocks of red-pink plaster, stepping toward us
const R = rng(31);
for (let row = 0; row < 5; row++) for (let x = -6; x < W; ) {
  const w = 8 + Math.floor(R() * 12), y = 66 + row * 9 + Math.floor(R() * 3), h = 6 + Math.floor(R() * 6);
  base.rect(x, y - h, x + w, H, (xx, yy) => mix(hex("#f0a888"), hex("#a85a4e"), clamp((xx - x) / w * 0.7 + (yy - y + h) / 50)), TOWN);
  base.rect(x, y - h, x + w, y - h + 1, "#ffc8a8", TOWN);
  if (R() < 0.6) base.rect(x + 2, y - h + 3, x + 4, y - h + 6, "#5a2a2a", TOWN);
  x += w + (R() < 0.3 ? 2 : 0);
}
// the minaret: square tower, decorated panels, a crenellated top and the lantern with gold balls
const MX = 120;
base.rect(MX - 7, 22, MX + 8, 72, (x, y) => mix(hex("#f2b090"), hex("#9a5a4a"), clamp((x - MX + 7) / 15 * 0.9 + noise2(x / 2, y / 2, 5) * 0.08)), MIN);
for (const y of [30, 44, 58]) { base.rect(MX - 4, y, MX + 5, y + 8, "#c87a62", MIN); base.rect(MX - 2, y + 2, MX + 3, y + 6, "#5a2e2a", MIN); }
base.rect(MX - 8, 20, MX + 9, 23, "#3a8a7a", MIN);
for (let x = MX - 8; x <= MX + 8; x += 3) base.rect(x, 17, x + 2, 20, "#f2b090", MIN);
base.rect(MX - 3, 10, MX + 4, 17, (x) => mix(hex("#f2b090"), hex("#9a5a4a"), clamp((x - MX + 3) / 7)), MIN);
for (const [y, r] of [[8, 1.6], [5, 1.2], [3, 0.9]]) base.ellipse(MX + 0.5, y, r, r, "#ffd870", MIN);
// a rooftop terrace in front: a low wall, rugs over it
base.rect(0, 96, 80, H, (x, y) => mix(hex("#e89878"), hex("#a85a48"), clamp((y - 96) / 12 + x / 300)), TOWN);
base.rect(0, 94, 80, 96, "#ffc0a0", TOWN);
base.rect(12, 90, 30, 99, "#c83a3a", TOWN); base.rect(14, 92, 28, 97, "#2a4a8a", TOWN);
base.rect(40, 91, 54, 99, "#e8a83a", TOWN);
const LAMPS = [[8, 88], [34, 86], [60, 88], [76, 86]];
for (const [x, y] of LAMPS) base.line(x, 80, x, y - 2, "#3a2a24", 1, TOWN);

balance(base);
const PAL = fitPalette(base, { n: 50, extras: ["#ffd27a", "#2a1a1e", "#e8dcd0", "#ffb84a"] });

export const meta = {
  slug: "marrakech-rooftop-dusk",
  name: "Marrakech Rooftop Dusk",
  category: "cities",
  note: "Red-pink rooftops spread below the old square minaret at dusk, snowy mountains beyond, while smoke rises from the food stalls and the terrace lanterns come on.",
  tags: ["marrakech", "morocco", "minaret", "rooftops", "dusk", "landmark", "halftone", "lanterns"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    clouds(f, t, [[0.2, 0.3, 0.2, 1.2, "#f2b098", 0.4], [0.75, 0.26, 0.3, 1, "#b890b0", 0.35]], SKY, 0.7);
    smoke(f, t, 150, 72, { c: "#e8dcd0", n: 9, rise: 6, drift: 3, size: 2.6, a: 0.5 });
    smoke(f, t, 176, 76, { c: "#e8dcd0", n: 7, rise: 5, drift: 2.5, size: 2.2, a: 0.4, seed: 4 });
    palm(f, 92, 98, 30, { lean: -0.15, c: "#2a1a1e", sway: Math.sin(t * 0.7) * 0.7, fronds: 8 });
    // the terrace lanterns light one after another, then stay lit
    const lit = Math.min(4, Math.floor((t % 16) / 2));
    LAMPS.forEach(([x, y], i) => { f.rect(x - 1, y - 2, x + 2, y + 2, i < lit ? "#ffd27a" : "#5a3a2a"); if (i < lit) f.glow(x, y, 1, 4, "#ffb84a", 0.4); });
    birds(f, t, { n: 7, y: 26, period: 12, c: "#2a1a1e", only: SKY, spread: 1.3 });
    return enc(f);
  };
}
