/* acropolis-hill-dusk: the temple on the rock above the city at dusk, floodlit gold, hand-built.
 * Painted once: the dusk sky and moon, the limestone rock and its walls, the temple's columns and
 * pediment, olive trees and the white town below. Each frame adds windows coming on, cars on the
 * avenue, swallows and drifting cloud. */
import { fbm, noise2, clamp, lerp, rng } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, clouds, windows, across, flag, pine, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, ROCK = 2, TEMPLE = 3, TOWN = 4;

const base = new Canvas();
base.sky([[0, "#3e4a7a"], [0.4, "#7a6a9a"], [0.7, "#d88a8a"], [1, "#f8b080"]], SKY, 0, 70);
base.ellipse(30, 18, 3.5, 3.5, "#fff6e0", SKY);
base.ellipse(31.5, 17, 3, 3.2, "#5a5a8a", SKY); // a crescent
// the rock: flat-topped, sheer sides, warm in the floodlight
const rockTop = (x) => (x < 46 || x > 150 ? 999 : 56 + Math.max(0, Math.abs(x - 98) - 38) * 0.9);
for (let x = 30; x < 170; x++) {
  const t0 = rockTop(x) === 999 ? 70 + Math.abs(x - 98) * 0.15 : rockTop(x);
  for (let y = Math.floor(t0); y < 86; y++) {
    const n = fbm(x / 4, y / 4, 3, 2), d = (y - t0) / 30;
    base.put(x, y, mix(mix(hex("#f0c890"), hex("#a8784e"), clamp(d + n * 0.4)), hex("#6a5a6a"), clamp((y - 74) / 12)), ROCK);
  }
}
base.rect(46, 52, 151, 56, (x, y) => mix(hex("#d8a870"), hex("#f4cc94"), noise2(x / 2, y, 3) * 0.6), ROCK); // walls
// the temple: stylobate, eight columns lit gold, entablature and pediment
const TX0 = 70, TX1 = 128, TB = 51, TT = 36;
base.rect(TX0 - 3, TB, TX1 + 3, TB + 2, "#ffe2a8", TEMPLE);
for (let i = 0; i < 8; i++) {
  const x = Math.round(lerp(TX0 + 1, TX1 - 3, i / 7));
  base.rect(x, TT + 4, x + 3, TB, (xx) => (xx === x ? hex("#ffeec4") : xx === x + 2 ? hex("#c89a62") : hex("#f6d49c")), TEMPLE);
}
base.rect(TX0 - 2, TT, TX1 + 2, TT + 4, (x, y) => (y === TT + 2 ? hex("#d8aa70") : hex("#ffe4ac")), TEMPLE);
base.poly([[TX0 - 3, TT], [TX1 + 3, TT], [99, TT - 7]], (x, y) => mix(hex("#ffe8b4"), hex("#d8a870"), clamp((TT - y) / 8)), TEMPLE);
base.rect(TX0 + 2, TT + 5, TX1 - 2, TB, (x, y) => (base.maskAt(x, y) === TEMPLE ? null : hex("#7a5a52")), TEMPLE); // the dark cella behind
// olive trees on the slopes and the white town at the foot
for (let x = 0; x < W; x++) for (let y = 70; y < 90; y++) if (base.maskAt(x, y) !== ROCK && fbm(x / 4, y / 3, 3, 13) > 0.55) base.put(x, y, mix(hex("#4a5a48"), hex("#2e3a36"), (y - 70) / 20), ROCK);
// the town: houses of every size stepping down the hill, back rows first, a few cypresses
const R = rng(7), HOUSES = [];
for (let row = 0; row < 4; row++) for (let x = -4; x < W; ) {
  const w = 5 + Math.floor(R() * 8), h = 3 + Math.floor(R() * 4), y = 84 + row * 5 + Math.floor(R() * 3);
  HOUSES.push({ x, y, w, h, roof: R() < 0.55 });
  x += w + Math.floor(R() * 3);
}
for (const { x, y, w, h, roof } of HOUSES) {
  base.rect(x, y - h, x + w, y + 1, (xx) => mix(hex("#eee2d0"), hex("#a8968e"), clamp((xx - x) / w * 0.9)), TOWN);
  if (roof) base.rect(x - 1, y - h - 1, x + w + 1, y - h + 1, (xx) => mix(hex("#d88a62"), hex("#8a4a3a"), clamp((xx - x) / w)), TOWN);
  else base.rect(x, y - h - 1, x + w, y - h, "#c8bcb0", TOWN);
}
for (const x of [12, 38, 71, 133, 162, 184]) pine(base, x, 84 + (x % 7), 9, "#2e3a32", TOWN);
base.rect(0, 101, W, H, "#4a4250", TOWN); // the avenue

balance(base);
const PAL = fitPalette(base, { n: 52, extras: ["#ffd27a", "#3a2a2a", "#ffffff", "#ff6a4a", "#1c1a26", "#3a6ab8", "#f4f4f4"] });

export const meta = {
  slug: "acropolis-hill-dusk",
  name: "Acropolis Hill Dusk",
  category: "cities",
  note: "The ancient temple on its rock glows gold above the white town at dusk, windows coming on below, cars on the avenue and swallows under a crescent moon.",
  tags: ["athens", "acropolis", "parthenon", "greece", "dusk", "landmark", "wonder", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    clouds(f, t, [[0.4, 0.3, 0.22, 1, "#c88aa0", 0.35], [0.9, 0.25, 0.4, 1.2, "#f2a890", 0.45]], SKY, 0.7);
    // windows across the town, more of them lit as the evening goes on (over 20 s, then reset)
    const on = 0.2 + ((t % 20) / 20) * 0.55;
    HOUSES.forEach(({ x, y, w, h }, i) => windows(f, x + 1, y - h + 1, x + w - 1, y, { lit: "#ffd27a", dark: "#9a8a84", gx: 3, gy: 2, on, seed: i }));
    // traffic on the avenue: headlights one way, tail lights the other
    for (let k = 0; k < 10; k++) {
      const dir = k % 2 ? 1 : -1, u = across(t, 18 + (k % 4) * 5, k / 10);
      const x = dir > 0 ? u : W - u, y = 103 + (k % 2) * 2, c = dir > 0 ? "#ffffff" : "#ff6a4a";
      f.put(x, y, c); f.put(x + 1, y, c); f.add(x + 2 * dir, y, c, 0.35);
    }
    // the flag on the rock's east end
    flag(f, t, 140, 38, 8, 5, "#3a6ab8", { c2: "#f4f4f4", pole: "#2a2228" });
    birds(f, t, { n: 7, y: 26, period: 12, c: "#1c1a26", only: SKY });
    birds(f, t, { n: 4, y: 14, period: 17, dir: 1, phase: 0.5, c: "#1c1a26", only: SKY });
    return enc(f);
  };
}
