/* desert-buttes-road: a straight road running toward giant red sandstone buttes in the desert, a car driving it, hand-built.
 * Painted once: the big sky, the three famous buttes and mesas on the horizon with their talus skirts,
 * the red desert with sage and the long straight road narrowing to a point. Each frame drives a car up
 * the road with a dust trail, drifts cloud shadows over the land and adds cloud and a hawk. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, puffs, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, BUTTE = 2, LAND = 3, ROAD = 4;
const HOR = 66, VX = 96;

const base = new Canvas();
base.sky([[0, "#2e6ab8"], [0.6, "#7aa8dc"], [1, "#d8e4f0"]], SKY, 0, HOR + 1);
// the buttes: sheer-sided towers on talus skirts, lit warm from the left
const butte = (cx, hw, top, skirt) => {
  for (let x = Math.floor(cx - hw - skirt); x <= cx + hw + skirt; x++) {
    const d = Math.abs(x - cx), cap = d < hw ? top : top + (d - hw) * (HOR - top) / skirt;
    for (let y = Math.floor(cap); y <= HOR; y++) {
      const face = d < hw, lit = clamp(0.8 - (x - cx + hw) / (2 * hw) * 0.7);
      const strata = Math.sin(y * 1.1) > 0.7 ? 0.12 : 0;
      base.put(x, y, face ? mix(mix(hex("#b85a3a"), hex("#ff9a5a"), lit), hex("#7a3a2a"), strata) : mix(hex("#d07a52"), hex("#9a4a32"), clamp((y - cap) / 14)), BUTTE);
    }
  }
};
butte(36, 9, 34, 16); butte(70, 5, 30, 12); butte(150, 14, 38, 18); butte(118, 4, 46, 8);
// the desert: red earth and grey-green sage, darker toward us
base.rect(0, HOR, W, H, (x, y) => {
  const u = (y - HOR) / (H - HOR), n = fbm(x / 4, y / 2, 3, 6);
  return mix(mix(hex("#e89a6a"), hex("#a85a3a"), clamp(u)), hex("#8a9a6a"), n > 0.6 ? 0.5 : 0);
}, LAND);
// the road narrowing to the vanishing point, its centre line
base.poly([[VX - 1, HOR], [VX + 1, HOR], [W * 0.7, H], [W * 0.3, H]], (x, y) => mix(hex("#7a7a82"), hex("#4a4a52"), (y - HOR) / 42), ROAD);
for (let y = HOR + 1; y < H; y++) if (Math.floor(Math.pow(y - HOR, 0.6) * 2) % 2 === 0) base.rect(VX - 0.5, y, VX + 0.5 + (y - HOR) / 40, y + 1, "#ffe08a", ROAD);

balance(base);
const PAL = fitPalette(base, { n: 50, extras: ["#ffffff", "#e8f0f8", "#d83a3a", "#1e1a1e", "#f4c8a0"] });

export const meta = {
  slug: "desert-buttes-road",
  name: "Desert Buttes Road",
  category: "landscapes",
  note: "A straight road runs toward giant red sandstone buttes across the desert as a red car drives it trailing dust, cloud shadows sliding over the land.",
  tags: ["monument-valley", "desert", "road-trip", "buttes", "utah", "arizona", "wonder", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    puffs(f, t, [[0.1, 0.18, 7, "#ffffff", 1.2, "#e8f0f8"], [0.5, 0.12, 6, "#ffffff", 0.9, "#e8f0f8"], [0.85, 0.26, 5, "#ffffff", 1.5, "#e8f0f8"]], SKY);
    // cloud shadows sliding across the desert
    for (let y = HOR; y < H; y++) for (let x = 0; x < W; x++) {
      const n = fbm(x / 24 - t * 0.04, y / 6, 2, 3);
      if (n > 0.6) f.add(x, y, "#7a3a2a", (n - 0.6) * 1.2, LAND);
    }
    // the car: a small red car driving away up the road, shrinking, dust behind
    const p = (t % 14) / 14, z = 1 + p * 12, s = 1 / z, y = HOR + 40 * s, x = VX + 6 * s;
    if (p < 0.9) {
      for (let k = 1; k < 10; k++) f.add(x + (Math.sin(k) * 2) * s, y + k * 1.4 * s, "#f4c8a0", (1 - k / 10) * 0.5);
      f.rect(x - 5 * s, y - 4 * s, x + 5 * s, y, "#d83a3a"); f.rect(x - 3 * s, y - 6 * s, x + 3 * s, y - 4 * s, "#1e1a1e");
    }
    // a hawk circling
    const a = t * 0.4, hx = 60 + Math.cos(a) * 18, hy = 20 + Math.sin(a) * 4;
    for (let k = -3; k <= 3; k++) f.add(hx + k, hy - (Math.abs(k) > 1 ? 1 : 0), "#1e1a1e", 1, SKY);
    return enc(f);
  };
}
