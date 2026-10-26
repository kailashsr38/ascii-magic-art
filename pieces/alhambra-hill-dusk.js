/* alhambra-hill-dusk: the red fortress-palace along its wooded hill at dusk, snow peaks behind, hand-built.
 * Painted once: the dusk sky, the snowy sierra, the wooded hill, the long walls with square towers lit
 * warm by the last sun, and the dark cypresses. Each frame adds windows lighting, swifts, cloud and
 * the lights of the town below coming on. */
import { fbm, noise2, clamp, lerp, rng } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, clouds, pine, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, MTN = 2, HILL = 3, FORT = 4, TOWN = 5;

const base = new Canvas();
base.sky([[0, "#4a5a8a"], [0.5, "#a88aa8"], [0.8, "#f0a890"], [1, "#ffd0a0"]], SKY, 0, 56);
// the snowy sierra behind, pink in the last light
base.ridge({ base: 0.42, amp: 0.12, f: 3, seed: 5, top: "#fff0ec", bot: "#b8a8c4", depth: 10, m: MTN });
base.ridge({ base: 0.5, amp: 0.06, f: 4, seed: 11, top: "#9a8aa8", bot: "#7a6a90", depth: 10, m: MTN });
// the wooded hill the fortress stands along
const hillTop = (x) => 60 - Math.sin((x / W) * Math.PI) * 8 + fbm(x / 10, 1, 3, 4) * 3;
for (let x = 0; x < W; x++) for (let y = Math.floor(hillTop(x)); y < 92; y++) {
  const n = fbm(x / 4, y / 4, 3, 7);
  base.put(x, y, mix(mix(hex("#6a7a4a"), hex("#3a4a32"), clamp((y - hillTop(x)) / 30)), hex("#2a3a2a"), clamp(n - 0.5) * 1.6), HILL);
}
// the walls and towers, warm in the sun from the left
const R = rng(9);
const wallTop = (x) => hillTop(x) - 4;
for (let x = 14; x < 182; x++) {
  const y0 = wallTop(x);
  for (let y = Math.floor(y0); y < hillTop(x) + 4; y++) base.put(x, y, mix(hex("#ffc08a"), hex("#b0664e"), clamp((x - 14) / 168 * 0.7 + noise2(x / 2, y / 2, 3) * 0.15)), FORT);
  if (x % 3 === 0) base.put(x, y0 - 1, "#e89a6a", FORT); // merlons
}
for (const [x, w, h] of [[20, 9, 14], [44, 7, 9], [70, 12, 18], [96, 8, 11], [118, 14, 22], [146, 9, 13], [170, 8, 10]]) {
  const by = hillTop(x + w / 2) + 2;
  base.rect(x, by - h - 4, x + w, by, (xx) => mix(hex("#ffc896"), hex("#a85e48"), clamp((xx - x) / w * 1.1)), FORT);
  for (let xx = x; xx < x + w; xx += 2) base.put(xx, by - h - 5, "#e89a6a", FORT);
  base.rect(x + 2, by - h + 1, x + 3, by - h + 4, "#4a2a2a", FORT); if (w > 9) base.rect(x + w - 4, by - h + 1, x + w - 3, by - h + 4, "#4a2a2a", FORT);
}
// cypresses standing along the hill, then the town at the foot
for (let i = 0; i < 18; i++) { const x = 6 + i * 11 + Math.floor(R() * 5); pine(base, x, 92 - Math.floor(R() * 6), 12 + Math.floor(R() * 8), "#1e2e22", HILL); }
for (let x = 0; x < W; x++) for (let y = 92; y < H; y++) base.put(x, y, mix(hex("#c8a890"), hex("#7a6070"), clamp((y - 92) / 16 + fbm(x / 3, y / 2, 2, 3) * 0.4)), TOWN);
const LAMPS = Array.from({ length: 40 }, (_, i) => [Math.floor(R() * W), 93 + Math.floor(R() * 14), R()]);

balance(base);
const PAL = fitPalette(base, { n: 52, extras: ["#ffd27a", "#1e1a24", "#fff4e0"] });

export const meta = {
  slug: "alhambra-hill-dusk",
  name: "Alhambra Hill Dusk",
  category: "cities",
  note: "The red fortress-palace runs along its wooded hill at dusk below the snowy sierra, cypresses dark against it as the town's lights come on and swifts wheel.",
  tags: ["granada", "alhambra", "spain", "fortress", "dusk", "landmark", "halftone", "mountains"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    clouds(f, t, [[0.2, 0.3, 0.16, 1.1, "#f4b8a0", 0.4], [0.7, 0.26, 0.28, 1, "#b898b8", 0.35]], SKY, 0.7);
    // the town's lights coming on one by one over 20 s
    const on = (t % 20) / 20;
    for (const [x, y, r] of LAMPS) if (r < 0.2 + on * 0.8) f.put(x, y, "#ffd27a");
    birds(f, t, { n: 7, y: 20, period: 11, c: "#1e1a24", only: SKY, spread: 1.3 });
    birds(f, t, { n: 4, y: 30, period: 14, dir: 1, phase: 0.4, c: "#1e1a24", only: SKY });
    return enc(f);
  };
}
