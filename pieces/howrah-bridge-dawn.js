/* howrah-bridge-dawn: the great steel cantilever bridge over the river at a hazy dawn, buses and yellow taxis crossing, country boats below, hand-built.
 * Painted once: the soft dawn sky with the sun low and red-gold in the haze, the far city shore, the
 * bridge's two towering trusses and the hanging span between them, the river catching the light, the
 * bathing ghat steps on the near bank. Each frame runs traffic across the deck, rows country boats and
 * a ferry across the river, walks bathers down the ghat and flies a flock of pigeons. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, boat, person, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, CITY = 2, BRIDGE = 3, RIVER = 4, GHAT = 5;
const WL = 66, DECK = 52;

const base = new Canvas();
base.sky([[0, "#8a9ab8"], [0.55, "#e0c0b0"], [1, "#f8dcb0"]], SKY, 0, WL + 1);
base.glow(150, 44, 5, 34, "#fff0c8", 0.65, SKY);
// the far shore: the city low and hazy
for (let x = 0; x < W; x++) { const h = 4 + Math.abs(Math.sin(x * 0.37) * 4) + (x % 13 < 2 ? 4 : 0); base.rect(x, WL - h, x + 1, WL + 1, "#b8a8b0", CITY); }
// the bridge: two great towers of crossed steel, the cantilever arms reaching to the hanging span
const truss = (x0, x1, top, bot) => {
  base.line(x0, bot, x0, top, "#5a5560", 2, BRIDGE); base.line(x1, bot, x1, top, "#5a5560", 2, BRIDGE);
  for (let k = 0; k < 4; k++) { const y0 = lerp(top, bot, k / 4), y1 = lerp(top, bot, (k + 1) / 4); base.line(x0, y0, x1, y1, "#6a6570", 1, BRIDGE); base.line(x1, y0, x0, y1, "#6a6570", 1, BRIDGE); }
};
truss(40, 50, 14, WL); truss(142, 152, 14, WL);
// the top chords: curving down from each tower top to the deck and up again, a lattice between them and the deck
const chord = (x) => { const towers = [45, 147]; let y = DECK; for (const tx of towers) { const d = Math.abs(x - tx); if (d < 50) y = Math.min(y, 14 + (d / 50) ** 1.4 * 30); } return y; };
for (let x = 0; x < W; x++) { const y = chord(x); base.rect(x, y, x + 1, y + 2, "#4a4550", BRIDGE); if (x % 6 === 0) base.line(x, y + 2, x + 3, DECK, "#6a6570", 1, BRIDGE); if (x % 6 === 3) base.line(x, y + 2, x - 3, DECK, "#6a6570", 1, BRIDGE); }
base.rect(0, DECK, W, DECK + 3, "#4a4550", BRIDGE);
// the river, catching the dawn
base.rect(0, WL, W, H, (x, y) => { const road = Math.exp(-((x - 150) ** 2) / (40 + (y - WL) * 30)); return mix(mix(hex("#c8b0b0"), hex("#7a7a90"), clamp((y - WL) / 40)), hex("#fff0c8"), clamp(road * 0.8)); }, RIVER);
// the reflection of the towers, broken by the current
for (let y = WL; y < H; y++) for (const tx of [44, 146]) for (let k = 0; k < 10; k++) if (Math.sin(y * 1.3 + k) > -0.2) base.add(tx + k + Math.sin(y * 0.8) * 1.5, y, "#5a5560", 0.35 * (1 - (y - WL) / 42), RIVER);
// the bathing ghat in the near corner, stepped
for (let k = 0; k < 7; k++) base.rect(0, 92 + k * 2, 50 - k * 4, 94 + k * 2, k % 2 ? "#c8b49a" : "#e0ccb0", GHAT);

balance(base, 0.45);
const PAL = fitPalette(base, { n: 48, extras: ["#ffffff", "#f2c84a", "#e86a4a", "#3a6aa8", "#2a2620", "#f4f0e8", "#e8c8a0", "#5a4030"] });

export const meta = {
  slug: "howrah-bridge-dawn",
  name: "Howrah Bridge Dawn",
  category: "india",
  note: "Buses and yellow taxis cross the great steel cantilever bridge in a hazy dawn as country boats and a ferry work the river below and bathers walk down the ghat.",
  tags: ["howrah-bridge", "kolkata", "bridge", "hooghly", "river", "dawn", "india", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    // traffic across the deck both ways: yellow taxis, red buses, carts
    for (let i = 0; i < 9; i++) {
      const dir = i % 2 ? 1 : -1, sp = [9, 6, 11, 5, 8][i % 5], w = i % 3 === 1 ? 7 : 3, c = i % 3 === 1 ? "#e86a4a" : "#f2c84a";
      const x = dir > 0 ? ((t * sp + i * 41) % (W + 20)) - 10 : W + 10 - ((t * sp + i * 41) % (W + 20));
      f.rect(x, DECK - (w > 3 ? 3 : 2), x + w, DECK, c);
    }
    // country boats and a ferry crossing
    boat(f, ((t * 3) % (W + 20)) - 10, 84, 10, { hull: "#5a4030", sail: "#f4f0e8", sailH: 7, dir: 1 });
    boat(f, W + 10 - ((t * 2 + 80) % (W + 20)), 76, 7, { hull: "#5a4030", dir: -1 });
    const fx = W + 20 - ((t * 4) % (W + 40));
    f.rect(fx - 9, 96, fx + 9, 99, "#f4f0e8"); f.rect(fx - 7, 93, fx + 6, 96, "#3a6aa8"); f.rect(fx - 9, 99, fx + 9, 100, "#2a2620");
    for (let k = 1; k < 14; k++) f.add(fx + 9 + k * 1.4, 99 + (k % 2), "#ffffff", (1 - k / 14) * 0.5, RIVER);
    // bathers walking down the ghat steps
    for (let i = 0; i < 2; i++) { const p = ((t / 20) + i * 0.5) % 1, x = lerp(4, 30, p), y = Math.round(92 + p * 12); person(f, x, y, { body: i ? "#f4f0e8" : "#e86a4a", head: "#5a4030", step: Math.floor(t * 3 + i) }); }
    birds(f, t, { n: 7, y: 24, period: 15, c: "#2a2620", only: SKY });
    return enc(f);
  };
}
