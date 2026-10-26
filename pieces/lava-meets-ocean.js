/* lava-meets-ocean: glowing lava pouring off a black coast into the sea at dusk, steam billowing up where it hits, hand-built.
 * Painted once: the dusk sky with the volcano's long slope, the black lava fields, the sea, and the
 * channels of lava running down the slope to the cliff edge. Each frame pulses the molten flow down the
 * channels, pours it over the edge, boils the water white, billows steam lit orange from below, breaks
 * waves on the black rock and flies a seabird past. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, smoke, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, SLOPE = 2, ROCK = 3, LAVA = 4, SEA = 5;
const EDGE = 76;

const base = new Canvas();
base.sky([[0, "#4a5a88"], [0.55, "#b88aa0"], [1, "#f8b890"]], SKY, 0, 50);
// the volcano's long shield slope, hazy, and the black lava field coming down to the cliff
for (let x = 0; x < W; x++) { const top = 36 - x * 0.12 + fbm(x / 20, 1, 2, 3) * 3; for (let y = Math.floor(top); y < EDGE; y++) base.put(x, y, mix(hex("#7a6a7a"), hex("#4a3e48"), clamp((y - top) / 40)), SLOPE); }
// the sea, catching the glow
base.rect(0, EDGE, W, H, (x, y) => mix(mix(hex("#b8a0b8"), hex("#6a7090"), clamp((y - EDGE) / 30)), hex("#f8a070"), clamp(Math.exp(-((x - 120) ** 2) / 600) * (1 - (y - EDGE) / 40) * 0.6)), SEA);
for (let x = 0; x < 150; x++) { const top = 50 + x * 0.1 + fbm(x / 8, 2, 2, 5) * 4; for (let y = Math.floor(top); y < EDGE + 3; y++) base.put(x, y, noise2(x / 2, y / 2, 3) > 0.6 ? hex("#5a5058") : mix(hex("#3a3238"), hex("#2a2428"), noise2(x / 4, y / 3, 6)), ROCK); }
// the cliff face down to the sea, ledged
for (let x = 0; x < 150; x++) { const bot = EDGE + 6 + Math.sin(x * 0.3) * 1.5; for (let y = EDGE + 3; y < bot; y++) base.put(x, y, mix(hex("#4a4048"), hex("#2a2428"), (y - EDGE) / 8), ROCK); }
// the lava: two braided flows meandering down the field, splitting and rejoining, cooling crust at their edges
const flow = (k, y) => [42, 104][k % 2] + (k > 1 ? 9 : 0) * Math.sin((y - 50) / 9) + fbm(y / 9, k * 3, 2, k + 2) * 18 - 9 + (y - 50) * [0.5, -0.3, 0.7, -0.5][k];
const width = (k, y) => 1 + clamp(noise2(y / 5, k * 7, 4)) * 2.5;
const CH = [0, 1, 2, 3];
for (const k of CH) for (let y = 50; y < EDGE + 3; y++) { const x = flow(k, y), w = width(k, y); base.rect(x - w - 1, y, x + w + 1, y + 1, "#5a3a34", LAVA); base.rect(x - w, y, x + w, y + 1, "#d8703a", LAVA); }
balance(base, 0.35);
const PAL = fitPalette(base, { n: 48, extras: ["#ffffff", "#fff4c8", "#ffd27a", "#ffa04a", "#f86a3a", "#f8d8c8", "#e8c8b8"] });

export const meta = {
  slug: "lava-meets-ocean",
  name: "Lava Meets Ocean",
  category: "landscapes",
  note: "Glowing lava runs down a black volcanic coast and pours off the cliff into the sea at dusk, the water boiling white and steam billowing up lit orange from below.",
  tags: ["lava", "volcano", "hawaii", "ocean", "steam", "coast", "wonder", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    // molten pulses running down each flow, white-hot at their heads, glowing on the rock around
    for (const k of CH) for (let y = 50; y < EDGE + 3; y++) {
      const x = flow(k, y), w = width(k, y), s = Math.sin((y - t * 7) * 0.45 + k * 2) * 0.5 + 0.5;
      f.rect(x - w, y, x + w, y + 1, s > 0.78 ? "#fff4c8" : s > 0.42 ? "#ffd27a" : "#ffa04a");
      if (y % 3 === 0) f.glow(x, y, 0, 4, "#f86a3a", 0.2, ROCK);
    }
    // pouring over the cliff into the sea, the water boiling white where it lands
    for (const k of [0, 1]) {
      const x = flow(k, EDGE + 2);
      for (let y = EDGE + 3; y < EDGE + 9; y++) f.rect(x - 1, y, x + 2, y + 1, Math.sin((y - t * 14) * 0.9) > 0 ? "#fff4c8" : "#ffa04a");
      for (let j = 0; j < 16; j++) { const a = (j / 16) * Math.PI * 2 + t * 2, r = 3 + Math.sin(t * 5 + j) * 1.5; f.add(x + Math.cos(a) * r * 1.6, EDGE + 10 + Math.sin(a) * r * 0.5, "#ffffff", 0.75, SEA); }
    }
    // the steam plume: billows boiling up from where the lava meets the water, lit orange underneath, pink above
    for (const k of [0, 1]) {
      const x0 = flow(k, EDGE + 2);
      for (let i = 0; i < 9; i++) {
        const age = ((t / 7) + i / 9 + k * 0.37) % 1, r = 3 + age * 9, x = x0 + age * 22 + Math.sin(i * 2.3 + t * 0.3) * 4, y = EDGE + 6 - age * 52;
        const c = age < 0.3 ? "#ffd8b0" : "#f8e0e4";
        for (let yy = Math.floor(y - r); yy <= y + r; yy++) for (let xx = Math.floor(x - r * 1.3); xx <= x + r * 1.3; xx++) { const d = Math.hypot((xx - x) / 1.3, yy - y) / r; if (d < 1) f.add(xx, yy, c, (1 - d) * (1 - age) * 0.6); }
      }
    }
    // waves breaking on the black rock below the cliff
    const ph = (t % 5) / 5;
    for (let x = 0; x < 150; x++) { const y = lerp(H - 4, EDGE + 7, ph) + Math.sin(x * 0.2) * 1; f.add(x, y, "#ffffff", (ph < 0.8 ? 0.7 : (1 - ph) * 3.5), SEA); }
    birds(f, t, { n: 2, y: 20, period: 17, c: "#2a2428", only: SKY });
    return enc(f);
  };
}
