/* twin-spires-night: two silver skyscrapers joined by a sky bridge, lit up at night over the park and fountains, hand-built.
 * Painted once: the night sky, the city around, the twin towers with their stepped silver bands, the sky
 * bridge between them, the spires, the park and the fountain pool. Each frame adds the fountain jets
 * dancing, aircraft lights blinking on the spires, a plane crossing and people at the pool. */
import { fbm, noise2, clamp, lerp, rng } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, windows, stars, person, across, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, CITY = 2, TOWER = 3, PARK = 4, POOL = 5;
const T1 = 76, T2 = 116, GROUND = 86;

const base = new Canvas();
base.sky([[0, "#0e1230"], [0.6, "#1e2450"], [1, "#4a3a6a"]], SKY, 0, GROUND);
stars(base, { n: 50, y1: 40, only: SKY, seed: 4 });
// the city around, lower towers with lit windows
const R = rng(11);
for (let x = 0; x < W; ) {
  const w = 6 + Math.floor(R() * 10), h = 10 + Math.floor(R() * 26);
  base.rect(x, GROUND - h, x + w, GROUND, (xx) => mix(hex("#2e3058"), hex("#1a1c3a"), clamp((xx - x) / w)), CITY);
  windows(base, x + 1, GROUND - h + 2, x + w - 1, GROUND, { lit: R() < 0.6 ? "#ffd890" : "#9ac8ff", dark: "#20224a", gx: 2, gy: 3, on: 0.5, seed: x });
  x += w + 2;
}
// the twin towers: stacked silver tiers narrowing to spires, lit from below
const tower = (cx) => {
  const tiers = [[GROUND, 13], [62, 11.5], [46, 10], [34, 8], [24, 6], [16, 4]];
  for (let k = 0; k < tiers.length - 1; k++) {
    const [y1, hw] = tiers[k], [y0] = tiers[k + 1];
    for (let y = y0; y < y1; y++) for (let x = Math.floor(cx - hw); x <= cx + hw; x++) {
      const u = (x - cx) / hw, band = (y % 3 === 0) ? 0.2 : 0;
      base.put(x, y, mix(hex("#f0f4ff"), hex("#6a7aa8"), clamp((u + 1) * 0.45 + band + (y - 10) / 300)), TOWER);
    }
  }
  base.rect(cx - 0.5, 0, cx + 1, 16, "#e0e8ff", TOWER);
};
tower(T1); tower(T2);
// the sky bridge between them, with its V of struts
base.rect(T1 + 11, 46, T2 - 10, 49, "#d8e0ff", TOWER);
base.line(T1 + 11, 49, 96, 60, "#a8b4e0", 1, TOWER); base.line(T2 - 11, 49, 96, 60, "#a8b4e0", 1, TOWER);
// the park and the fountain pool
base.rect(0, GROUND, W, H, (x, y) => mix(hex("#2a4a3a"), hex("#14281e"), clamp((y - GROUND) / 22 + fbm(x / 4, y / 3, 2, 3) * 0.3)), PARK);
const snap = new Canvas().copy(base);
base.rect(40, 94, 152, 106, (x, y) => mix(snap.get(x, 2 * 94 - y - 10), hex("#1a2a5a"), 0.45), POOL);
base.rect(38, 93, 154, 94, "#a8a8c8", POOL); base.rect(38, 106, 154, 107, "#a8a8c8", POOL);

balance(base, 0.5);
const PAL = fitPalette(base, { n: 50, extras: ["#ffffff", "#ff3a3a", "#8ae0ff", "#ffd890", "#e8c8a8", "#e84a8a"] });

export const meta = {
  slug: "twin-spires-night",
  name: "Twin Spires Night",
  category: "cities",
  note: "Two silver skyscrapers joined by a sky bridge glow over the city at night as the fountains dance in the park pool and a plane blinks across the sky.",
  tags: ["kuala-lumpur", "malaysia", "skyscrapers", "night", "fountains", "landmark", "halftone", "city-lights"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    // aircraft warning lights on the spires, slow red blinks
    if (Math.floor(t * 0.8) % 2 === 0) { f.put(T1, 0, "#ff3a3a"); f.put(T2, 0, "#ff3a3a"); }
    // a plane crossing high, blinking
    const px = across(t, 10, 0.3, W, 20);
    f.put(px, 8, "#ffffff"); if (Math.floor(t * 3) % 2) f.put(px + 1, 8, "#ff3a3a");
    // the fountain jets: a row of arcs rising and falling in a wave
    for (let i = 0; i < 14; i++) {
      const x = 48 + i * 7.5, h = 4 + (Math.sin(t * 1.6 - i * 0.6) * 0.5 + 0.5) * 12;
      for (let k = 0; k < h; k++) f.add(x + Math.sin(k * 0.2) * 0.5, 99 - k, k > h - 2 ? "#ffffff" : "#8ae0ff", 0.85 - (k / h) * 0.4);
      f.add(x - 1, 99 - h, "#ffffff", 0.5); f.add(x + 1, 99 - h, "#ffffff", 0.5);
    }
    for (const [ph, c] of [[0.2, "#e84a8a"], [0.55, "#ffd890"], [0.8, "#ffffff"]]) person(f, across(t, 2.5, ph), 92, { body: c, head: "#e8c8a8", step: Math.floor(t * 4 + ph * 9) });
    return enc(f);
  };
}
