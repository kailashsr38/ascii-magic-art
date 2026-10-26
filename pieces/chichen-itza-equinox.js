/* chichen-itza-equinox: the stepped pyramid at Chichen Itza at golden hour on the equinox, hand-built.
 * Painted once: sky, the low sun, the jungle line, nine terraces with their risers and ledges, the
 * shaded side, the great stair, the temple on top and the lawn. Each frame adds the serpent of light
 * forming down the stair, drifting cloud, birds and visitors crossing the lawn. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, ramp, birds, clouds, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, JUNGLE = 2, STONE = 3, STAIR = 4, LAWN = 5;
const CX = 96, BASE = 88, TOP = 34, HB = 60, HT = 15; // pyramid centre, base and top rows, half widths
const STEPS = 9;
const halfAt = (y) => lerp(HB, HT, (BASE - y) / (BASE - TOP));

const base = new Canvas();
// sky: deep blue overhead to a hot band at the horizon, the sun low on the left
base.sky([[0, "#c48a7e"], [0.3, "#e8a072"], [0.6, "#f4b46e"], [0.85, "#ffd08a"], [1, "#ffe0a8"]], SKY, 0, 84);
base.glow(38, 46, 6, 36, "#fff4d0", 0.6, SKY);
// the jungle on the horizon, two layers
base.ridge({ base: 0.8, amp: 0.035, f: 9, seed: 4, top: "#8a8456", bot: "#5e6a3c", depth: 8, m: JUNGLE });
base.ridge({ base: 0.83, amp: 0.03, f: 14, seed: 9, top: "#62703e", bot: "#4a5a30", depth: 6, m: JUNGLE });
// the pyramid: shaded right flank first, then the lit front with terraces
base.poly([[CX + HB, BASE], [CX + HB + 5, BASE - 2], [CX + HT + 2, TOP], [CX + HT, TOP]], (x, y) => {
  const n = noise2(x / 2.2, y / 2.2, 3) * 0.15;
  return mix(hex("#a07258"), hex("#c08c66"), clamp(0.4 + n + ((BASE - y) % 6 < 1.2 ? 0.25 : 0)));
}, STONE);
const stepH = (BASE - TOP) / STEPS;
for (let y = TOP; y < BASE; y++) {
  const hw = halfAt(y), k = (BASE - y) / stepH, f = k - Math.floor(k); // f: 0 at a step's foot, 1 at its lip
  for (let x = Math.round(CX - hw); x <= CX + hw; x++) {
    const side = (x - (CX - hw)) / (2 * hw); // 0 left, 1 right; the sun is on the left
    const n = noise2(x / 1.8, y / 1.8, 5) * 0.12 + fbm(x / 9, y / 9, 2, 8) * 0.12;
    let c = mix(hex("#ffdca0"), hex("#c48e68"), clamp(side * 0.6 + n));
    if (f > 0.82) c = mix(c, hex("#ffe2a8"), 0.55);      // the ledge catches the light
    else if (f < 0.25) c = mix(c, hex("#9a6a52"), 0.45); // shadow at the foot of each riser
    base.put(x, y, c, STONE);
  }
}
// the great stair up the middle, with its balustrades
for (let y = TOP; y < BASE + 1; y++) {
  const w = lerp(9, 6.5, (BASE - y) / (BASE - TOP));
  for (let x = Math.round(CX - w); x <= CX + w; x++) {
    const edge = Math.abs(x - CX) > w - 1.5;
    const tread = (y % 2 === 0);
    base.put(x, y, edge ? hex("#d8a878") : tread ? hex("#fff0c8") : hex("#ecc898"), STAIR);
  }
}
// serpent heads at the foot of the stair
for (const sx of [-1, 1]) base.ellipse(CX + sx * 9.5, BASE - 1, 3, 2, "#7a5240", STAIR);
// the temple on top
base.rect(CX - 13, 21, CX + 14, TOP + 1, (x, y) => mix(hex("#ffd8a0"), hex("#c08a62"), clamp((x - (CX - 13)) / 27 * 0.8 + noise2(x, y, 7) * 0.1)), STONE);
base.rect(CX - 15, 19, CX + 16, 21, "#ecbf8a", STONE);
for (let x = CX - 13; x <= CX + 13; x += 3) base.rect(x, 17, x + 2, 19, "#dcae7c", STONE);
for (const dx of [-8, -1, 6]) base.rect(CX + dx, 26, CX + dx + 3, TOP + 1, "#5a3a2c", STONE);
// lawn, a path to the stair, and jungle trees closing the sides
base.rect(0, BASE, W, H, (x, y) => {
  const n = fbm(x / 6, y / 3, 3, 12);
  const path = Math.abs(x - CX) < lerp(9, 30, (y - BASE) / (H - BASE));
  return path ? mix(hex("#f0d4a0"), hex("#d4ae7e"), n) : mix(hex("#a6b85c"), hex("#6e8c3c"), clamp((y - BASE) / 24 + n * 0.5));
}, LAWN);
for (const [x0, x1, s] of [[0, 34, 21], [158, W, 37]]) {
  for (let y = 40; y < H; y++) for (let x = x0; x < x1; x++) {
    const edge = x0 === 0 ? x1 - x : x - x0;
    const n = fbm(x / 7, y / 7, 4, s) + edge / 40 - (y - 40) / 160;
    if (n > 0.72 - (y > 80 ? 0.2 : 0)) base.put(x, y, mix(hex("#3e5028"), hex("#6e8a3a"), clamp(fbm(x / 3, y / 3, 2, s + 1))), JUNGLE);
  }
}

balance(base);
const PAL = fitPalette(base, { n: 54, extras: ["#fff6d8", "#1a1210", "#2a1c18", "#e8dccb"] });

export const meta = {
  slug: "chichen-itza-equinox",
  name: "Chichen Itza Equinox",
  category: "cities",
  note: "The stepped pyramid at Chichen Itza at golden hour on the equinox, the serpent of light forming down its stair while visitors cross the lawn and birds fly home.",
  tags: ["chichen-itza", "pyramid", "mexico", "wonder", "landmark", "golden-hour", "halftone", "maya"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

const PEOPLE = [[0.0, 0.9, 1], [0.35, 1.2, -1], [0.6, 0.7, 1], [0.8, 1.0, -1]];

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    clouds(f, t, [[0.2, 0.38, 0.14, 1.2, "#f2b48a", 0.5], [0.7, 0.3, 0.24, 1, "#c99098", 0.35], [0.95, 0.24, 0.08, 0.8, "#f7cfa0", 0.6]], SKY, 0.75);
    // the serpent of light: seven triangles of sun appear down the right balustrade, then fade, over 24 s
    const cyc = (t % 24) / 24, lit = clamp(cyc * 1.6) * 7;
    for (let i = 0; i < 7; i++) {
      const a = clamp(lit - i) * clamp((1 - cyc) * 6);
      if (a <= 0) continue;
      const y0 = TOP + 3 + i * 7.2;
      for (let dy = 0; dy < 6; dy++) for (let dx = 0; dx <= Math.round((6 - dy) / 2); dx++) {
        const y = y0 + dy, x = CX + lerp(6.5, 9, (y - TOP) / (BASE - TOP)) + 1 + dx;
        f.add(x, y, "#fff6d8", a * 0.9);
      }
    }
    birds(f, t, { n: 7, y: 16, period: 20, c: "#1a1210", only: SKY });
    // visitors walking the lawn, tiny figures with a step in their stride
    PEOPLE.forEach(([ph, sp, dir], i) => {
      const u = ((t * 0.012 * sp + ph) % 1 + 1) % 1, x = dir > 0 ? lerp(-4, W + 4, u) : lerp(W + 4, -4, u);
      const y = 96 + i * 3, step = Math.floor(t * 4 + i) % 2;
      f.put(x, y - 3, "#e8dccb"); f.put(x, y - 2, i % 2 ? "#b84a3a" : "#3a5a8a"); f.put(x, y - 1, i % 2 ? "#b84a3a" : "#3a5a8a");
      f.put(x - step, y, "#2a1c18"); f.put(x + 1 - step, y, "#2a1c18");
    });
    return enc(f);
  };
}
