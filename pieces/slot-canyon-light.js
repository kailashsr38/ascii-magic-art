/* slot-canyon-light: inside a narrow sandstone slot canyon, swirling walls lit orange and violet, a shaft of sunlight with dust falling through it, hand-built.
 * Painted once: the sliver of sky far above, the flowing sandstone walls in waves of orange, pink and
 * violet, darker in the depths, and the sand floor. Each frame moves the light beam slowly across, sifts
 * sand falling through it and floats dust in the air. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, WALL = 2, FLOOR = 3;

const base = new Canvas();
// the walls: flowing bands that swirl, glowing where reflected light hits, dark in the deepest folds
base.fill((x, y) => {
  const u = x / W, v = y / H;
  const flow = Math.sin(u * 9 + Math.sin(v * 5 + u * 3) * 2.2 + fbm(u * 3, v * 3, 3, 4) * 3);
  const depth = Math.abs(u - 0.5 - Math.sin(v * 4) * 0.06) * 2; // the open slot runs down the middle
  const glow = clamp(1 - depth * 1.1) * clamp(1.2 - v * 0.8);
  let c = mix(hex("#ff9a5a"), hex("#c85a6a"), clamp(flow * 0.5 + 0.5));
  c = mix(c, hex("#ffd8a0"), clamp(glow * 0.75));
  c = mix(c, hex("#3a1a2e"), clamp(depth - 0.5) * 1.2 * (0.6 + 0.4 * (flow * 0.5 + 0.5)));
  return c;
}, WALL);
// the sliver of sky at the top of the slot
for (let y = 0; y < 18; y++) { const cx = 96 + Math.sin(y * 0.3) * 6, w = 6 - y * 0.3; if (w > 0) base.rect(cx - w, y, cx + w, y + 1, mix(hex("#ffffff"), hex("#8ac8f0"), y / 18), SKY); }
// the sand floor
base.rect(0, 94, W, H, (x, y) => mix(hex("#e8a070"), hex("#8a4a3a"), clamp((y - 94) / 14 + Math.abs(x - 96) / 200 + noise2(x / 4, y, 3) * 0.2)), FLOOR);

balance(base, 0.45);
const PAL = fitPalette(base, { n: 54, extras: ["#fff4d8", "#ffe8c0"] });

export const meta = {
  slug: "slot-canyon-light",
  name: "Slot Canyon Light",
  category: "landscapes",
  note: "Inside a narrow sandstone slot canyon the swirling walls glow orange and violet as a shaft of sunlight slides across with sand sifting down through it.",
  tags: ["antelope-canyon", "slot-canyon", "arizona", "light-beam", "sandstone", "wonder", "halftone", "desert"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    // the beam: a slanted shaft from the slot to the floor, sliding slowly with the sun (40 s)
    const p = (t % 40) / 40, bx = lerp(80, 112, 0.5 - 0.5 * Math.cos(p * Math.PI * 2));
    for (let y = 10; y < 100; y++) {
      const cx = bx + (y - 10) * 0.12, w = 2.2 + (y - 10) * 0.04;
      for (let x = Math.floor(cx - w); x <= cx + w; x++) f.add(x, y, "#fff4d8", (1 - Math.abs(x - cx) / (w + 1)) * 0.6);
    }
    f.ellipse(bx + 11, 98, 7, 1.6, "#ffe8c0");
    // sand sifting down through the beam, catching the light
    for (let i = 0; i < 40; i++) {
      const r = Math.sin(i * 12.9898) * 43758.5453, u = r - Math.floor(r);
      const y = ((u * 90 + t * (10 + (i % 5) * 3)) % 90) + 10, x = bx + (y - 10) * 0.12 + Math.sin(i * 7.7) * 2;
      f.add(x, y, "#ffffff", 0.8);
    }
    // dust motes drifting in the shade
    for (let i = 0; i < 24; i++) { const x = (i * 37 + t * 2) % W, y = 20 + ((i * 53) % 70) + Math.sin(t * 0.5 + i) * 2; f.add(x, y, "#ffe8c0", 0.35); }
    return enc(f);
  };
}
