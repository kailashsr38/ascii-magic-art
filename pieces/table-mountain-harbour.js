/* table-mountain-harbour: the flat-topped mountain over the city and harbour, its tablecloth of cloud pouring over the edge, hand-built.
 * Painted once: the sky, the long flat mountain with the peaks either side, the city at its foot and
 * the harbour with moored boats. Each frame pours the cloud over the table top and down the face, sails
 * a yacht across the harbour and adds gulls. */
import { fbm, noise2, clamp, lerp, rng } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, boat, across, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, MTN = 2, CITY = 3, SEA = 4;
const TOP = 30, SEAY = 84;

const base = new Canvas();
base.sky([[0, "#3a7ac8"], [0.6, "#86b4e0"], [1, "#d4e4f0"]], SKY, 0, 64);
// the mountain: a long flat table with a peak at each end, cliffs lit by the morning sun
const mtnTop = (x) => {
  if (x > 46 && x < 150) return TOP + fbm(x / 8, 1, 2, 3) * 1.2;
  if (x <= 46) return TOP + Math.pow((46 - x) / 46, 0.8) * 30 - Math.max(0, 8 - Math.abs(x - 20)) * 1.6;   // devil's peak side
  return TOP + Math.pow((x - 150) / 42, 0.9) * 16 - Math.max(0, 10 - Math.abs(x - 176)) * 1.8;            // lion's head side
};
for (let x = 0; x < W; x++) for (let y = Math.floor(mtnTop(x)); y < 74; y++) {
  const n = fbm(x / 5, y / 5, 3, 6), ribs = Math.sin(x * 0.6 + n * 4) > 0.5 ? 0.12 : 0;
  base.put(x, y, mix(mix(hex("#c8b8b0"), hex("#6a7a6a"), clamp((y - mtnTop(x)) / 40)), hex("#4a5a48"), clamp(ribs + (n - 0.5) * 0.6)), MTN);
}
// the city at the foot: white and pastel blocks, towers at the bay
const R = rng(17);
for (let x = 0; x < W; ) {
  const w = 3 + Math.floor(R() * 6), h = 3 + Math.floor(R() * (x > 80 && x < 140 ? 16 : 6));
  base.rect(x, SEAY - h, x + w, SEAY, (xx) => mix(hex(["#f4f0ea", "#f0dcc8", "#d8e4ec", "#f4e0d8"][Math.floor(R() * 4)] ?? "#f4f0ea"), hex("#9a9aa8"), clamp((xx - x) / w * 0.6)), CITY);
  x += w;
}
for (let x = 0; x < W; x++) for (let y = 70; y < 80; y++) if (base.maskAt(x, y) === MTN && fbm(x / 3, y / 2, 2, 9) > 0.48) base.put(x, y, mix(hex("#6a8a5a"), hex("#4a6a42"), (y - 70) / 10), CITY);
// the harbour
base.rect(0, SEAY, W, H, (x, y) => mix(mix(hex("#7aaad0"), hex("#3a6a98"), clamp((y - SEAY) / 24)), hex("#ffffff"), Math.sin(y * 2.2 + Math.sin(x * 0.15) * 2) > 0.7 ? 0.12 : 0), SEA);
for (let x = 10; x < 100; x += 7) boat(base, x, 88 + (x % 3), 5, { hull: "#f4f0ea", sail: null, mast: "#4a4a5a" }), base.rect(x, 80 + (x % 3), x + 1, 87 + (x % 3), "#4a4a5a", SEA);

balance(base, 0.5);
const PAL = fitPalette(base, { n: 52, extras: ["#ffffff", "#f4f4f8", "#1e1e2a", "#e84a3a"] });

export const meta = {
  slug: "table-mountain-harbour",
  name: "Table Mountain Harbour",
  category: "cities",
  note: "The flat-topped mountain stands over the city and harbour as its tablecloth of cloud pours over the edge, a yacht sails across and gulls wheel above the masts.",
  tags: ["cape-town", "south-africa", "mountain", "harbour", "clouds", "landmark", "halftone", "sailing"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    // the tablecloth: a white blanket rolling over the flat top and pouring down the cliffs
    for (let x = 40; x < 156; x++) {
      const top = mtnTop(x) - 3, fallN = fbm(x / 6 - t * 0.15, t * 0.1, 3, 4);
      const fall = 6 + fallN * 14 + Math.sin(x * 0.3 - t * 0.6) * 2;
      for (let y = Math.floor(top); y < top + fall; y++) {
        const k = (y - top) / fall, a = clamp((1 - k) * 1.4) * clamp(0.4 + fbm(x / 4 + t * 0.2, y / 3 - t * 0.4, 3, 7) * 0.9);
        if (a > 0.05) f.add(x, y, "#ffffff", a * 0.92);
      }
    }
    // a yacht crossing the harbour with a red spinnaker
    const x = across(t, 6, 0.3), y = 96;
    boat(f, x, y, 9, { hull: "#ffffff", sail: "#f4f4f8", sailH: 12, mast: "#1e1e2a", dir: 1 });
    f.ellipse(x + 6, y - 7, 3, 4, "#e84a3a");
    birds(f, t, { n: 5, y: 50, period: 13, c: "#1e1e2a", only: SKY });
    return enc(f);
  };
}
