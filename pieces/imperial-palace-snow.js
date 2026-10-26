/* imperial-palace-snow: the imperial palace's great gate hall in falling snow, hand-built.
 * Painted once: the pale winter sky, the long red walls, the hall on its white marble terraces with
 * double golden roofs and upturned eaves, snow lying on every ledge, the courtyard. Each frame adds
 * snow falling, a few visitors with red umbrellas crossing the courtyard and crows. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, snow, across, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, WALL = 2, HALL = 3, YARD = 4;
const CX = 96;

const base = new Canvas();
base.sky([[0, "#a8b4c8"], [1, "#e8e4e0"]], SKY, 0, 70);
// the long red walls with golden tile copings, snow on top
base.rect(0, 56, W, 72, (x, y) => mix(hex("#e88a78"), hex("#b8564a"), clamp((y - 56) / 20 + noise2(x / 3, y / 3, 2) * 0.1)), WALL);
base.rect(0, 53, W, 56, "#e8b860", WALL); base.rect(0, 52, W, 53, "#ffffff", WALL);
// the hall: three white marble terraces, red columns, two golden roofs
for (let k = 0; k < 3; k++) {
  const hw = 72 - k * 8, y0 = 82 - k * 5;
  base.rect(CX - hw, y0, CX + hw + 1, y0 + 5, (x, y) => (y === y0 ? hex("#ffffff") : mix(hex("#f4f0ec"), hex("#b8b4b8"), clamp((x - CX + hw) / (2 * hw) * 0.6))), HALL);
  for (let x = CX - hw; x <= CX + hw; x += 3) base.rect(x, y0 - 1, x + 1, y0, "#d8d4d4", HALL); // balustrade posts
}
base.rect(CX - 48, 46, CX + 49, 72, (x) => ((x - CX + 48) % 8 < 2 ? hex("#a83a32") : mix(hex("#f0a088"), hex("#c8604e"), clamp((x - CX + 48) / 96 * 0.8))), HALL);
for (let x = CX - 44; x < CX + 44; x += 8) base.rect(x + 2, 50, x + 6, 70, "#6a2a26", HALL); // doors between the columns
const roof = (y, hw, depth, lift) => {
  for (let yy = 0; yy < depth; yy++) {
    const u = yy / depth, w = lerp(hw * 0.7, hw, u);
    for (let x = Math.floor(CX - w); x <= CX + w; x++) {
      const edge = Math.abs(x - CX) / w, curl = edge > 0.85 ? (edge - 0.85) * lift : 0;
      base.put(x, y - depth + yy - curl, mix(hex("#ffe08a"), hex("#c8902a"), clamp(u * 0.8 + (x - CX + w) / (2 * w) * 0.3)), HALL);
    }
  }
  base.rect(CX - hw * 0.7, y - depth - 1, CX + hw * 0.7 + 1, y - depth, "#ffffff", HALL); // snow on the ridge
};
roof(46, 60, 10, 18);
base.rect(CX - 38, 30, CX + 39, 37, (x) => mix(hex("#f0a088"), hex("#c8604e"), clamp((x - CX + 38) / 76)), HALL);
roof(30, 46, 9, 16);
// the courtyard: snow, a stone path up the middle
base.rect(0, 87, W, H, (x, y) => (Math.abs(x - CX) < 14 + (y - 87) * 0.8 ? mix(hex("#d8d4d4"), hex("#b8b4b8"), noise2(x / 2, y / 2, 3) * 0.6) : mix(hex("#ffffff"), hex("#dcdce4"), clamp((y - 87) / 40 + noise2(x / 4, y / 3, 5) * 0.2))), YARD);

balance(base, 0.45);
const PAL = fitPalette(base, { n: 52, extras: ["#ffffff", "#1e1a1e", "#d83a3a", "#3a3a4a"] });

export const meta = {
  slug: "imperial-palace-snow",
  name: "Imperial Palace Snow",
  category: "cities",
  note: "The imperial palace's great hall stands on its marble terraces under golden roofs as snow falls, visitors with red umbrellas crossing the white courtyard.",
  tags: ["beijing", "forbidden-city", "china", "palace", "snow", "winter", "landmark", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    // visitors under red umbrellas, crossing the courtyard
    for (const [ph, y, dir] of [[0.15, 96, 1], [0.6, 102, -1], [0.85, 92, 1]]) {
      const u = across(t, 3.5, ph), x = dir > 0 ? u : W - u;
      f.rect(x - 3, y - 7, x + 4, y - 5, "#d83a3a"); f.put(x, y - 8, "#d83a3a");
      f.rect(x, y - 5, x + 1, y - 1, "#3a3a4a"); f.put(x - (Math.floor(t * 4) % 2), y, "#1e1a1e"); f.put(x + 1, y, "#1e1a1e");
    }
    birds(f, t, { n: 4, y: 16, period: 18, c: "#1e1a1e", only: SKY });
    snow(f, t, { n: 220, c: "#ffffff", speed: 7, sway: 2.5, a: 0.95 });
    return enc(f);
  };
}
