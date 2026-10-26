/* temple-gopuram-madurai: a towering temple gateway crowded with painted figures in a hundred colours, morning light, hand-built.
 * Painted once: the morning sky, a second gopuram behind, the great tapering tower of many tiers each
 * crowded with tiny painted figures, its barrel-vault crown with gold finials, the gateway at its foot
 * and the temple wall. Each frame adds pigeons circling the tower, pilgrims passing the gate and flowers
 * on a stall. */
import { fbm, noise2, clamp, lerp, rng } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, person, across, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, TOWER = 2, WALL = 3, STREET = 4;
const CX = 100, BASE = 84, TIERS = 11;

const base = new Canvas();
base.sky([[0, "#5a9ad8"], [0.7, "#a8cce8"], [1, "#e8eef0"]], SKY, 0, BASE);
// a second, smaller gopuram behind on the left, paler in the haze
const gopuram = (cx, by, hw0, tiers, th, vivid, m) => {
  const R = rng(cx);
  // light, bright paint: saturated darks read as black in halftone, these keep their colour
  const COLS = vivid ? ["#ff9a9a", "#8ac4ff", "#ffe48a", "#8ae8a4", "#ffb880", "#dca8ff", "#ffffff", "#ffc4d4", "#a4f4f0"] : ["#d8ccd8", "#c8d4e4", "#e8e0d0"];
  for (let k = 0; k < tiers; k++) {
    const hw = hw0 * (1 - k / (tiers + 2.2)), y0 = by - (k + 1) * th;
    for (let y = Math.floor(y0); y < y0 + th; y++) for (let x = Math.floor(cx - hw); x <= cx + hw; x++) {
      const ledge = y === Math.floor(y0) + th - 1, side = (x - cx + hw) / (2 * hw);
      if (ledge) { base.put(x, y, mix(hex("#fff4e0"), hex("#a8988a"), side * 0.6), m); continue; }
      // the figures: a little block of colour per niche, shaded toward the right
      const niche = Math.floor((x - cx + hw) / 4) + k * 7, c = hex(COLS[Math.abs(Math.floor(Math.sin(niche * 12.9898) * 43758.5)) % COLS.length]);
      base.put(x, y, (x % 4) === 0 ? mix(c, hex("#7a6a7a"), 0.25) : mix(c, hex("#8a7a8a"), clamp(side * 0.25)), m);
    }
  }
  const top = by - tiers * th, cw = hw0 * 0.32;
  base.ellipse(cx, top - 1, cw, 4, (x) => mix(hex(vivid ? "#f2c84a" : "#d8d0c0"), hex("#8a6a3a"), clamp((x - cx + cw) / (2 * cw))), m);
  for (let i = -2; i <= 2; i++) { base.rect(cx + i * cw * 0.4, top - 7, cx + i * cw * 0.4 + 1, top - 3, "#ffd84a", m); base.put(cx + i * cw * 0.4, top - 8, "#ffd84a", m); }
};
gopuram(36, 70, 18, 7, 5, false, TOWER);
gopuram(CX, BASE, 34, TIERS, 6.2, true, TOWER);
// the gateway at the foot and the temple wall either side
base.rect(0, 70, W, BASE + 6, (x, y) => mix(hex("#f4e4c8"), hex("#b8a488"), clamp((y - 70) / 30 + noise2(x / 3, y / 3, 3) * 0.1)), WALL);
for (let x = 0; x < W; x += 4) base.rect(x, 70, x + 2, 72, ((x / 4) | 0) % 2 ? "#e84a4a" : "#ffffff", WALL); // red and white stripes on the wall
base.rect(CX - 6, 70, CX + 7, BASE + 6, "#3a2420", WALL);
base.rect(CX - 8, 68, CX + 9, 70, "#f2c84a", WALL);
// the street
base.rect(0, BASE + 6, W, H, (x, y) => mix(hex("#d8c0a0"), hex("#9a8070"), clamp((y - BASE) / 30 + noise2(x / 5, y / 2, 4) * 0.15)), STREET);

balance(base, 0.3);
// the tower's paint gets its own palette slots: left to the fit, a hundred small niches average to mud
const PAINT = ["#ff9a9a", "#8ac4ff", "#ffe48a", "#8ae8a4", "#ffb880", "#dca8ff", "#ffc4d4", "#a4f4f0", "#c87a7a", "#6a9ad8", "#d8b860", "#6ac080"];
const PAL = fitPalette(base, { n: 40, extras: [...PAINT, "#ffffff", "#1e1818", "#ff8a3a", "#f8e84a", "#e8c8a8", "#9a9aa8"] });

export const meta = {
  slug: "temple-gopuram-madurai",
  name: "Temple Gopuram Madurai",
  category: "india",
  note: "A towering temple gateway rises in tiers crowded with painted figures in a hundred colours as pigeons circle it and pilgrims pass the gate in the morning light.",
  tags: ["madurai", "tamil-nadu", "temple", "gopuram", "colourful", "pilgrims", "india", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    // pigeons circling the tower in a loose flock
    for (let i = 0; i < 10; i++) {
      const a = t * 0.6 + i * 0.6, x = CX + Math.cos(a) * (40 + (i % 3) * 6), y = 26 + Math.sin(a) * 8 + (i % 4) * 3, up = Math.sin(t * 9 + i) > 0;
      f.put(x, y, "#9a9aa8"); f.put(x - 1, y - (up ? 1 : 0), "#9a9aa8"); f.put(x + 1, y - (up ? 1 : 0), "#9a9aa8");
    }
    // pilgrims in saffron and white passing the gate
    for (const [ph, c, dir] of [[0.1, "#ff8a3a", 1], [0.4, "#ffffff", -1], [0.65, "#e84a4a", 1], [0.85, "#f8e84a", -1]]) {
      const u = across(t, 3.5, ph), x = dir > 0 ? u : W - u;
      person(f, x, 100, { body: c, head: "#8a5a3a", step: Math.floor(t * 4 + ph * 9) });
    }
    // a flower stall with marigold garlands
    f.rect(150, 92, 170, 96, "#5a3a2a");
    for (let i = 0; i < 18; i++) f.put(151 + i, 91 - (i % 3 === 0 ? 1 : 0), i % 2 ? "#ff8a3a" : "#f8e84a");
    return enc(f);
  };
}
