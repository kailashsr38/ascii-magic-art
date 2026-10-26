/* shore-temple-waves: the twin granite towers of the shore temple at sunrise, the sea breaking on the rocks below, hand-built.
 * Painted once: the dawn sky with the sun just up over the sea, the sea, the two stepped pyramid towers
 * of weathered granite with their capstones, the compound wall lined with carved bulls, the beach with
 * catamarans drawn up. Each frame rolls the waves in, throws spray off the rocks, walks fishermen down
 * the sand, rocks a catamaran out at sea and flies gulls. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, surf, person, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, SEA = 2, ROCK = 3, TEMPLE = 4, BEACH = 5;
const HOR = 46, SX = 160;

const base = new Canvas();
base.sky([[0, "#7a9ccc"], [0.55, "#c8c0c8"], [0.85, "#ffd8a8"], [1, "#fff0c8"]], SKY, 0, HOR + 1);
base.glow(SX, 40, 5, 34, "#fff4d4", 0.7, SKY);
// the sea, the sun's road laid across it
base.rect(0, HOR, W, 84, (x, y) => { const u = (y - HOR) / 38, road = Math.exp(-((x - SX) ** 2) / (30 + u * 500)); return mix(mix(hex("#8aa0b8"), hex("#3e5e7c"), clamp(u * 1.2)), hex("#ffe8b8"), clamp(road * 0.9)); }, SEA);
// the breakwater rocks the temple stands on
for (let x = 20; x < 150; x++) { const top = 74 - Math.max(0, 1 - Math.abs(x - 84) / 70) * 6 + fbm(x / 4, 1, 3, 2) * 3; for (let y = Math.floor(top); y < 86; y++) base.put(x, y, noise2(x / 2.2, y / 1.6, 5) > 0.72 ? hex("#6a5e54") : mix(hex("#fce6c0"), hex("#c8a888"), clamp((y - top) / 16 + noise2(x / 3, y / 2, 5) * 0.3)), ROCK); }
// a stepped granite tower: tiers narrowing upward, each with a row of little arched niches, the octagonal capstone and finial
function vimana(cx, by, w, tiers) {
  let y = by, ww = w;
  base.rect(cx - w / 2 - 2, by, cx + w / 2 + 2, by + 6, (x) => mix(hex("#d8c8a8"), hex("#8a7a64"), clamp((x - cx + w / 2) / w)), TEMPLE);
  for (let i = 0; i < tiers; i++) {
    const th = Math.max(3, 8 - i);
    base.rect(cx - ww / 2, y - th, cx + ww / 2, y, (x, yy) => mix(hex("#e8d8b8"), hex("#8a7860"), clamp((x - cx + ww / 2) / ww * 0.85 + (yy - y + th) / th * 0.15)), TEMPLE);
    base.rect(cx - ww / 2 - 1, y - th, cx + ww / 2 + 1, y - th + 1, "#f4e8cc", TEMPLE);
    for (let x = cx - ww / 2 + 2; x < cx + ww / 2 - 1; x += 3) base.rect(x, y - th + 2, x + 1, y - 1, "#7a6a58", TEMPLE);
    y -= th; ww *= 0.78;
  }
  base.ellipse(cx, y - 2, ww * 0.6 + 1, 3, "#e8d8b8", TEMPLE); base.ellipse(cx + 1, y - 1, ww * 0.4, 2, "#a89478", TEMPLE);
  base.rect(cx, y - 8, cx + 1, y - 4, "#c8a860", TEMPLE);
}
vimana(104, 66, 30, 5);
vimana(68, 70, 20, 4);
// the compound wall with its row of carved bulls
base.rect(28, 70, 140, 76, (x) => mix(hex("#f4e0bc"), hex("#b89c7c"), clamp((x - 28) / 112)), TEMPLE);
for (let x = 30; x < 140; x += 6) { base.ellipse(x, 69, 2, 1.2, "#b8a888", TEMPLE); base.put(x + 2, 68, "#b8a888", TEMPLE); }
// the beach in front, catamarans drawn up on it
base.rect(0, 86, W, H, (x, y) => mix(hex("#f0d8b0"), hex("#c8a880"), clamp((y - 86) / 22 + fbm(x / 5, y / 3, 2, 4) * 0.25)), BEACH);
for (const [x, y] of [[150, 96], [168, 100]]) { base.rect(x - 9, y - 1, x + 9, y + 1, "#5a4030", BEACH); base.line(x - 6, y - 1, x - 4, y - 7, "#5a4030", 1, BEACH); }

balance(base, 0.5);
const PAL = fitPalette(base, { n: 48, extras: ["#ffffff", "#f4f8f8", "#2a2420", "#5a4030", "#f08a5a", "#f2c84a", "#e8eef4"] });

export const meta = {
  slug: "shore-temple-waves",
  name: "Shore Temple Waves",
  category: "india",
  note: "The twin stepped towers of an ancient granite temple stand on the rocks at sunrise as the sea breaks white below them and fishermen walk down to their catamarans.",
  tags: ["mahabalipuram", "shore-temple", "tamil-nadu", "temple", "sea", "sunrise", "india", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    surf(f, t, HOR + 6, 84, { foam: "#f4f8f8", n: 4, period: 6, only: SEA, wob: 3 });
    // waves breaking on the rocks: spray thrown up and falling back (6 s)
    const ph = (t % 6) / 6;
    if (ph > 0.6) { const s = (ph - 0.6) / 0.4; for (let k = 0; k < 40; k++) { const a = (k / 40) * Math.PI, r = s * 10 + (k % 3); f.add(146 + Math.cos(a) * r * 1.8, 76 - Math.sin(a) * r * (1 - s * 0.5), "#ffffff", (1 - s) * 0.85); } }
    // the tide washing up the beach and back
    const wash = 88 + Math.sin(t * (Math.PI / 3)) * 2;
    for (let x = 0; x < W; x++) { const y = wash + Math.sin(x * 0.09) * 1.2; f.add(x, y, "#ffffff", 0.7, BEACH); f.add(x, y - 1, "#c8d8e0", 0.4, BEACH); }
    // a catamaran rocking out at sea
    const cy = 58 + Math.sin(t * 1.6) * 0.8, cx = 30 + ((t * 0.8) % 40);
    f.rect(cx - 5, cy, cx + 5, cy + 1, "#2a2420"); f.line(cx, cy, cx + 2, cy - 7, "#2a2420", 1); f.poly([[cx + 1, cy - 6], [cx + 6, cy - 1], [cx + 1, cy - 1]], "#f4f0e8");
    // fishermen walking down to their boats
    for (let i = 0; i < 3; i++) { const x = lerp(10, 140, ((t / 30) + i * 0.27) % 1), y = 102 - i * 3; person(f, x, y, { body: i % 2 ? "#f08a5a" : "#f4f0e8", head: "#5a4030", step: Math.floor(t * 3 + i) }); }
    birds(f, t, { n: 5, y: 20, period: 15, c: "#2a2420", only: SKY });
    return enc(f);
  };
}
