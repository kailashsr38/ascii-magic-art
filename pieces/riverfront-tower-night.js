/* riverfront-tower-night: the skyline across the river at night, the pearl tower and the glass giants lit up, hand-built.
 * Painted once: the night sky, the far skyline of towers with lit windows, the tower with its two
 * glowing spheres, the river with the lights' long reflections and the old stone embankment in front.
 * Each frame adds a lit ferry crossing, a light band climbing a tower, and walkers on the promenade. */
import { fbm, noise2, clamp, lerp, rng } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, windows, person, across, stars, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, CITY = 2, RIVER = 3, BANK = 4;
const SHORE = 68;

const base = new Canvas();
base.sky([[0, "#141a3a"], [0.6, "#2a2a5a"], [1, "#5a3a6a"]], SKY, 0, SHORE);
stars(base, { n: 40, y1: 30, only: SKY, seed: 9 });
// the skyline: towers of every height, the three giants on the right
const R = rng(23), TOWERS = [];
for (let x = 0; x < W; ) {
  const w = 5 + Math.floor(R() * 8), h = 8 + Math.floor(R() * 22);
  TOWERS.push([x, SHORE - h, w, h]); x += w + 1;
}
TOWERS.push([150, 6, 10, SHORE - 6], [164, 14, 9, SHORE - 14], [176, 20, 10, SHORE - 20]);
for (const [x, y, w, h] of TOWERS) {
  base.rect(x, y, x + w, SHORE, (xx) => mix(hex("#3a3a6a"), hex("#1e1e3e"), clamp((xx - x) / w)), CITY);
  windows(base, x + 1, y + 2, x + w - 1, SHORE - 1, { lit: R() < 0.5 ? "#ffe0a0" : "#a8d0ff", dark: "#24244a", gx: 2, gy: 3, on: 0.55, seed: x });
}
base.poly([[176, 20], [186, 20], [181, 6]], "#3a3a6a", CITY);
// the pearl tower: legs, two big spheres and a spire
const PX = 76;
for (const s of [-1, 1]) base.line(PX + s * 7, SHORE, PX + s * 2, 40, "#c8c8e8", 2, CITY);
base.rect(PX - 1, 10, PX + 2, SHORE, "#d8d8f0", CITY);
base.ellipse(PX + 0.5, 46, 8, 7, (x, y) => mix(hex("#ff8ad0"), hex("#a83a8a"), clamp((x - PX + 8) / 16 + (y - 40) / 30)), CITY);
base.ellipse(PX + 0.5, 22, 5, 4.5, (x, y) => mix(hex("#ff9ad8"), hex("#a83a8a"), clamp((x - PX + 5) / 10)), CITY);
base.rect(PX, 0, PX + 1, 10, "#e8e8ff", CITY);
// the river: every light drawn down the water in a long broken streak
const snap = new Canvas().copy(base);
base.rect(0, SHORE, W, 96, (x, y) => {
  const sy = 2 * SHORE - y - 1, br = Math.sin(y * 1.3 + x * 0.05) > -0.1;
  return mix(br ? snap.get(x + Math.round(Math.sin(y * 0.8) * 1.2), sy) : hex("#1a1a3a"), hex("#14142e"), clamp(0.35 + (y - SHORE) / 50));
}, RIVER);
// the embankment and promenade in front
base.rect(0, 96, W, H, (x, y) => mix(hex("#6a6a7a"), hex("#3a3a4a"), clamp((y - 96) / 12 + noise2(x / 3, y, 2) * 0.1)), BANK);
for (let x = 0; x < W; x += 3) base.rect(x, 94, x + 1, 97, "#8a8a9a", BANK);
base.rect(0, 94, W, 95, "#a8a8b8", BANK);

balance(base, 0.5);
const PAL = fitPalette(base, { n: 50, extras: ["#ffe0a0", "#ffffff", "#ff8ad0", "#1a1a3a", "#e84a3a", "#8ae0ff"] });

export const meta = {
  slug: "riverfront-tower-night",
  name: "Riverfront Tower Night",
  category: "cities",
  note: "The skyline across the river at night, the pearl tower's spheres glowing among the glass giants, their lights streaking down the water as a ferry crosses.",
  tags: ["shanghai", "skyline", "china", "night", "river", "landmark", "halftone", "city-lights"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    // a band of light climbing the tallest tower
    const by = SHORE - ((t * 9) % (SHORE - 6));
    f.rect(150, by, 160, by + 2, "#8ae0ff");
    // a lit ferry crossing, its reflection under it
    const x = across(t, 6, 0.4, W, 30), y = 82;
    f.rect(x, y - 3, x + 18, y, "#e8e8f0"); f.rect(x + 2, y - 6, x + 14, y - 3, "#ffffff");
    for (let k = 0; k < 6; k++) f.put(x + 3 + k * 2, y - 5, "#ffe0a0");
    f.rect(x, y + 1, x + 18, y + 4, "#5a5a7a");
    // walkers on the promenade
    for (const [ph, c, dir] of [[0, "#e84a3a", 1], [0.4, "#ffffff", -1], [0.7, "#ffe0a0", 1]]) {
      const u = across(t, 3, ph), px = dir > 0 ? u : W - u;
      person(f, px, 104, { body: c, head: "#e8c8a8", step: Math.floor(t * 4 + ph * 9) });
    }
    return enc(f);
  };
}
