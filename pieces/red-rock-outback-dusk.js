/* red-rock-outback-dusk: the great red monolith glowing at dusk on the flat outback, kangaroos crossing the spinifex, hand-built.
 * Painted once: the dusk sky, the huge rounded monolith with its ribbed flanks and caves, burning red
 * in the last light, the flat red plain with spinifex and desert oaks. Each frame hops kangaroos across
 * the plain, raises a little dust behind them and adds a wedge-tailed eagle and the first stars. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, stars, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, ROCK = 2, PLAIN = 3;
const HOR = 74, RX = 100;

const base = new Canvas();
base.sky([[0, "#2a3a6a"], [0.45, "#7a5a8a"], [0.8, "#e8907a"], [1, "#ffc08a"]], SKY, 0, HOR + 1);
stars(base, { n: 30, y1: 24, only: SKY, seed: 3 });
// the monolith: a long loaf with steep sides, ribbed with gullies, caves near the base
const rockTop = (x) => {
  const u = (x - RX) / 64;
  if (Math.abs(u) > 1) return 999;
  return HOR - 40 * Math.pow(1 - Math.pow(Math.abs(u), 6), 0.35) + fbm(x / 7, 2, 3, 5) * 2;
};
for (let x = RX - 66; x < RX + 66; x++) {
  const top = rockTop(x);
  for (let y = Math.floor(top); y <= HOR; y++) {
    const rib = Math.sin(x * 0.5 + (y - top) * 0.1) > 0.55 ? 0.22 : 0, d = (y - top) / 40;
    const glow = clamp(0.9 - d * 0.6 - (x - RX) / 220);
    base.put(x, y, mix(mix(hex("#6a2a2a"), hex("#ff8a4a"), glow), hex("#3a1418"), rib), ROCK);
  }
}
for (const [x, y, r] of [[RX - 30, HOR - 6, 3], [RX + 8, HOR - 4, 2.5], [RX + 40, HOR - 8, 2]]) base.ellipse(x, y, r * 1.5, r, "#3a1418", ROCK);
// the plain: red earth with spinifex tussocks and a few desert oaks
base.rect(0, HOR, W, H, (x, y) => {
  const n = fbm(x / 3, y / 2, 3, 8), u = (y - HOR) / (H - HOR);
  return mix(mix(hex("#d06a42"), hex("#8a3a28"), clamp(u)), hex("#8a9a5a"), n > 0.58 ? 0.55 : 0);
}, PLAIN);
for (const [x, h] of [[20, 14], [164, 18], [186, 11]]) {
  base.line(x, HOR + 4, x, HOR + 4 - h, "#2a1a14", 1, PLAIN);
  for (let k = 0; k < 6; k++) base.line(x, HOR + 4 - h * 0.4 - k * 1.5, x + (k % 2 ? 4 : -4), HOR + 4 - h - k, "#3a3a24", 1, PLAIN);
}

balance(base);
const PAL = fitPalette(base, { n: 52, extras: ["#1e1210", "#e8b080", "#fff4e0", "#5a3a2a"] });

export const meta = {
  slug: "red-rock-outback-dusk",
  name: "Red Rock Outback Dusk",
  category: "landscapes",
  note: "The great red monolith burns in the last light on the flat outback as kangaroos bound across the spinifex, kicking dust, under the first evening stars.",
  tags: ["uluru", "australia", "outback", "kangaroo", "monolith", "dusk", "wonder", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

// a kangaroo mid-bound: body leaning forward, long tail, a hop arc
function roo(f, x, y, ph, s) {
  const hop = Math.abs(Math.sin(ph)) * 5 * s, yy = y - hop, c = "#5a3a2a";
  f.ellipse(x, yy - 4 * s, 3 * s, 2.2 * s, c);
  f.rect(x + 2 * s, yy - 8 * s, x + 3.5 * s, yy - 5 * s, c); f.put(x + 3 * s, yy - 9 * s, c);
  f.line(x - 2 * s, yy - 3 * s, x - 7 * s, yy - 1 * s + hop * 0.2, c, 1);
  f.line(x, yy - 2 * s, x + 1 * s, yy, c, 1); f.line(x + 1 * s, yy, x + 3 * s, yy, c, 1);
}

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    for (let i = 0; i < 3; i++) {
      const x = ((t * 12 + i * 22) % (W + 60)) - 30, y = 96 + i * 4, ph = t * 5 + i;
      for (let k = 1; k < 8; k++) f.add(x - 4 - k * 2, y - Math.abs(Math.sin(ph - k * 0.3)) * 2, "#e8b080", (1 - k / 8) * 0.4);
      roo(f, x, y, ph, 1 + i * 0.15);
    }
    // a wedge-tailed eagle circling high
    const a = t * 0.3, ex = 150 + Math.cos(a) * 24, ey = 18 + Math.sin(a) * 5;
    for (let k = -4; k <= 4; k++) f.add(ex + k, ey - (Math.abs(k) > 2 ? 1 : 0), "#1e1210", 1, SKY);
    return enc(f);
  };
}
