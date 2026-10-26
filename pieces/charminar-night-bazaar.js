/* charminar-night-bazaar: the four-minaret gateway lit up at night over the crowded bangle bazaar, hand-built.
 * Painted once: the night sky, the square monument with its four great arches and four tall minarets,
 * lit warm from below, and the old bazaar shopfronts either side with their glowing awnings. Each frame
 * moves the crowd through the street, flickers the stall lights, passes autorickshaws and circles pigeons. */
import { fbm, noise2, clamp, lerp, rng } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, arch, dome, stars, person, across, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, MON = 2, SHOPS = 3, STREET = 4;
const CX = 96, BASE = 84;

const base = new Canvas();
base.sky([[0, "#121838"], [0.6, "#22285a"], [1, "#4a3a6a"]], SKY, 0, BASE);
stars(base, { n: 40, y1: 30, only: SKY, seed: 6 });
// the monument: lit from below, warm cream fading up into the night
const lit = (x, y, x0, x1) => mix(mix(hex("#fff0d4"), hex("#c8a890"), clamp((x - x0) / (x1 - x0) * 0.6)), hex("#5a4a6a"), clamp((BASE - y) / 120));
base.rect(CX - 32, 36, CX + 33, BASE, (x, y) => lit(x, y, CX - 32, CX + 33), MON);
arch(base, CX - 13, 46, 26, 38, "#3a2a3a", MON);
base.rect(CX - 32, 30, CX + 33, 36, (x, y) => lit(x, y, CX - 32, CX + 33), MON);
for (let x = CX - 30; x < CX + 31; x += 4) arch(base, x, 31, 2, 4, "#6a4a5a", MON); // the arcaded gallery
dome(base, CX, 30, 8, { c: "#f4e4cc", shade: "#8a7a8a", finial: "#e8c860", m: MON });
// the four minarets: tall, ringed with balconies, onion caps
for (const x of [CX - 34, CX + 31]) {
  base.rect(x, 4, x + 4, BASE, (xx, y) => lit(xx, y, x, x + 4), MON);
  for (const y of [20, 34, 50]) base.rect(x - 2, y, x + 6, y + 2, "#e8d8c0", MON);
  dome(base, x + 2, 4, 3, { c: "#f4e4cc", shade: "#8a7a8a", finial: "#e8c860", onion: true, m: MON });
}
// the bazaar shopfronts on both sides, warm windows and coloured awnings
const R = rng(9), AWN = ["#e84a6a", "#3a8ae8", "#f2c84a", "#3ac86a", "#e87a3a"];
for (const [x0, x1] of [[0, CX - 38], [CX + 37, W]]) {
  for (let x = x0; x < x1; ) {
    const w = 10 + Math.floor(R() * 8), h = 28 + Math.floor(R() * 12);
    base.rect(x, BASE - h, x + w, BASE, (xx) => mix(hex("#8a7080"), hex("#4a3a50"), clamp((xx - x) / w)), SHOPS);
    for (let y = BASE - h + 3; y < BASE - 14; y += 5) for (let xx = x + 2; xx < x + w - 2; xx += 4) base.rect(xx, y, xx + 2, y + 3, R() < 0.6 ? "#ffd890" : "#3a2a3a", SHOPS);
    base.rect(x, BASE - 12, x + w, BASE, "#ffe0a0", SHOPS); // the lit shop
    base.poly([[x - 1, BASE - 13], [x + w + 1, BASE - 13], [x + w + 3, BASE - 9], [x - 3, BASE - 9]], AWN[Math.floor(R() * AWN.length)], SHOPS);
    x += w + 1;
  }
}
base.rect(0, BASE, W, H, (x, y) => mix(hex("#6a5a6a"), hex("#2a222e"), clamp((y - BASE) / 24)), STREET);

balance(base, 0.5);
const PAL = fitPalette(base, { n: 46, extras: ["#ffd890", "#ffffff", "#e84a6a", "#3a8ae8", "#f2c84a", "#3ac86a", "#1e1820", "#e8c8a8"] });

export const meta = {
  slug: "charminar-night-bazaar",
  name: "Charminar Night Bazaar",
  category: "india",
  note: "The four-minaret gateway glows at night over the crowded bangle bazaar as shoppers flow through the street, stall lights flicker and autorickshaws weave past.",
  tags: ["hyderabad", "charminar", "bazaar", "night", "monument", "market", "india", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    // the crowd: shoppers in bright clothes flowing both ways
    const CROWD = ["#e84a6a", "#3a8ae8", "#f2c84a", "#ffffff", "#3ac86a", "#e87a3a"];
    for (let i = 0; i < 18; i++) {
      const dir = i % 2 ? 1 : -1, u = across(t, 2 + (i % 4) * 0.6, i / 18), x = dir > 0 ? u : W - u, y = 92 + (i % 5) * 3;
      person(f, x, y, { body: CROWD[i % CROWD.length], head: "#8a5a3a", step: Math.floor(t * 4 + i) });
    }
    // two autorickshaws weaving through: yellow and green
    for (const [ph, y, dir] of [[0.2, 104, 1], [0.7, 100, -1]]) {
      const u = across(t, 6, ph), x = dir > 0 ? u : W - u;
      f.rect(x, y - 6, x + 9, y - 1, "#3ac86a"); f.rect(x, y - 7, x + 9, y - 6, "#f2c84a");
      f.rect(x + (dir > 0 ? 7 : 1), y - 5, x + (dir > 0 ? 9 : 3), y - 3, "#ffd890");
      f.put(x + 1, y, "#1e1820"); f.put(x + 8, y, "#1e1820");
    }
    // pigeons circling the minarets
    for (let i = 0; i < 6; i++) { const a = t * 0.7 + i, x = CX + Math.cos(a) * 44, y = 16 + Math.sin(a) * 6; f.put(x, y, "#e8c8a8"); }
    return enc(f);
  };
}
