/* desert-camp-milky-way: a desert camp under the arch of the Milky Way, tents glowing and a fire burning among the dunes, hand-built.
 * Painted once: the deep night sky with its stars and the bright band of the galaxy arching across it,
 * dark lanes of dust through the band, moonlit dunes in soft ridges, the camp's tents lit from inside,
 * resting camels. Each frame flickers the campfire and lifts its sparks and smoke, walks a figure with
 * a lantern between the tents, sends a shooting star across and wheels the sky slowly. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, shootingStar, smoke, person, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, DUNE = 2, CAMP = 3;
const HOR = 66, FX = 96, FY = 90;

const base = new Canvas();
base.sky([[0, "#141a34"], [0.7, "#2a3458"], [1, "#4a4a6a"]], SKY, 0, HOR + 1);
// the galaxy: a glowing band arching across the sky, mottled, with dark dust lanes along its middle
const band = (x) => 70 - Math.sin((x / W) * Math.PI) * 58;
for (let y = 0; y < HOR; y++) for (let x = 0; x < W; x++) {
  const d = Math.abs(y - band(x)), n = fbm(x / 6, y / 4, 4, 3), glow = clamp(1 - d / (14 + n * 6)), lane = Math.abs(y - band(x) + 2 + (n - 0.5) * 8) < 2.2 && n > 0.4;
  if (glow > 0) base.add(x, y, lane ? "#2a2a44" : mix(hex("#c8c0e8"), hex("#fff0d8"), n), glow * (0.35 + n * 0.55), SKY);
}
// stars: thick near the band, sparse away from it
for (let i = 0; i < 420; i++) {
  const x = (Math.sin(i * 91.17) * 0.5 + 0.5) * W, y = ((Math.sin(i * 47.31) * 0.5 + 0.5) * HOR) | 0, near = Math.abs(y - band(x)) < 16;
  if (!near && i % 3) continue;
  base.put(x, y, i % 5 ? "#fff8e8" : "#c8d4ff", SKY);
}
// moonlit dunes in soft overlapping ridges
for (const [y0, amp, fq, seed, lit, sh] of [[HOR, 4, 1.4, 1, "#7a7494", "#4e4c6c"], [74, 6, 1.1, 4, "#948cac", "#5e5880"], [88, 8, 0.8, 7, "#a8a0bc", "#6a6488"]]) {
  for (let x = 0; x < W; x++) {
    const c = y0 - amp * Math.sin((x / W) * Math.PI * fq * 2 + seed) - fbm(x / 30, seed, 2, seed) * 3, slope = Math.cos((x / W) * Math.PI * fq * 2 + seed);
    for (let y = Math.floor(c); y < H; y++) base.put(x, y, mix(mix(hex(lit), hex(sh), clamp(0.5 + slope * 0.6)), hex("#4a4868"), clamp((y - c) / 40)), DUNE);
  }
}
// the camp: tents in a crescent, canvas lit warm from inside, open doors glowing
for (const [x, y, w] of [[60, 86, 14], [78, 82, 12], [116, 82, 12], [134, 86, 14]]) {
  base.poly([[x - w / 2, y], [x + w / 2, y], [x + w / 4, y - w * 0.55], [x - w / 4, y - w * 0.55]], (xx, yy) => mix(hex("#f8c890"), hex("#c88a68"), clamp((xx - x + w / 2) / w)), CAMP);
  base.rect(x - 2, y - 5, x + 2, y, "#ffe4a8", CAMP);
}
for (const [x, y] of [[30, 100], [166, 98]]) { base.ellipse(x, y - 3, 6, 3, "#2a2638", CAMP); base.ellipse(x - 1, y - 6, 2.6, 1.6, "#2a2638", CAMP); base.line(x + 5, y - 3, x + 8, y - 9, "#2a2638", 2, CAMP); base.rect(x + 7, y - 10, x + 11, y - 8, "#2a2638", CAMP); }

balance(base, 0.35);
const PAL = fitPalette(base, { n: 48, extras: ["#ffffff", "#fff4c8", "#ffd27a", "#ffa04a", "#f86a3a", "#c8c0d0", "#2a2638", "#e8c8a0"] });

export const meta = {
  slug: "desert-camp-milky-way",
  name: "Desert Camp Milky Way",
  category: "landscapes",
  note: "The Milky Way arches over a desert camp among moonlit dunes, tents glowing warm and a campfire throwing sparks as a figure with a lantern walks between them.",
  tags: ["milky-way", "desert", "camp", "stars", "campfire", "night", "nature", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    shootingStar(f, t, { period: 13, y: 10, only: SKY });
    // the fire: flames licking up, its glow on the sand, sparks rising and a thread of smoke
    f.glow(FX, FY - 1, 2, 12, "#ffa04a", 0.35, DUNE);
    for (let k = 0; k < 7; k++) {
      const h = 3 + Math.abs(Math.sin(t * 9 + k * 1.7)) * 4, x = FX - 3 + k;
      for (let j = 0; j < h; j++) f.put(x + Math.round(Math.sin(t * 7 + j + k) * 0.6), FY - j, j < h * 0.4 ? "#fff4c8" : j < h * 0.75 ? "#ffd27a" : "#f86a3a");
    }
    f.rect(FX - 4, FY, FX + 4, FY + 1, "#2a2638");
    for (let k = 0; k < 6; k++) { const s = ((t * 0.7 + k / 6) % 1), x = FX + Math.sin(k * 3 + t) * 3 + s * 4, y = FY - 6 - s * 26; f.add(x, y, "#ffd27a", 1 - s); }
    smoke(f, t, FX + 1, FY - 8, { c: "#c8c0d0", n: 6, rise: 6, drift: 2, size: 2, a: 0.3, seed: 2 });
    // a figure with a lantern walking from tent to tent and back (24 s)
    const p = (t % 24) / 24, u = p < 0.5 ? p * 2 : 2 - p * 2, x = lerp(64, 132, u), y = 92 - Math.sin(u * Math.PI) * 2;
    person(f, x, y, { body: "#e8c8a0", head: "#c8c0d0", legs: "#2a2638", step: Math.floor(t * 3) });
    f.glow(x + 2, y - 2, 0, 4, "#ffd27a", 0.5); f.put(x + 2, y - 2, "#fff4c8");
    return enc(f);
  };
}
