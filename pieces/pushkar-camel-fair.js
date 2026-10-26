/* pushkar-camel-fair: the desert camel fair at sunset, a big wheel turning over the tents and camels crossing the dunes, hand-built.
 * Painted once: the sunset sky, the sun on the horizon, the low hills, rolling dunes lit on their crests,
 * the white and striped tents of the fair, resting camels. Each frame turns the big wheel with its
 * swinging cars, walks a camel train with riders across the sand, raises their dust and flies birds home. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, flag, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, HILL = 2, DUNE = 3, TENT = 4, FRONT = 5;
const HOR = 58, WX = 46, WY = 36, WR = 20;

const base = new Canvas();
base.sky([[0, "#8a90c0"], [0.45, "#e0a0a8"], [0.8, "#ffb878"], [1, "#ffe0a0"]], SKY, 0, HOR + 1);
base.glow(138, 52, 6, 40, "#fff4d0", 0.65, SKY);
base.ridge({ base: 0.5, amp: 0.05, f: 3, seed: 4, top: "#b88a8a", bot: "#a07a7a", depth: 10, m: HILL });
// rolling dunes: each a smooth swell, lit gold on the sunward face and rosy in the lee
for (const [y0, amp, f0, seed, lit, shade] of [[60, 4, 2, 1, "#ffd8a0", "#f0b890"], [70, 6, 1.6, 5, "#ffd090", "#e8a888"], [84, 7, 1.3, 9, "#f8c888", "#d89c80"]]) {
  for (let x = 0; x < W; x++) {
    const c = y0 - amp * Math.sin(x / W * Math.PI * f0 * 2 + seed) - fbm(x / 40, seed, 2, seed) * 4;
    const slope = Math.cos(x / W * Math.PI * f0 * 2 + seed);
    for (let y = Math.floor(c); y < H; y++) base.put(x, y, mix(mix(hex(lit), hex(shade), clamp(0.5 + slope * 0.7)), hex("#c08a6a"), clamp((y - c) / 34)), DUNE);
  }
}
// the fair: rows of tents, white canvas and red-striped, with pennants
for (let i = 0; i < 14; i++) {
  const x = 70 + i * 9 + (i % 3) * 2, y = 66 + (i % 2) * 2, w = 6 + (i % 3);
  base.poly([[x - w / 2, y], [x + w / 2, y], [x, y - 5]], i % 3 === 1 ? "#f8b8a8" : "#fff4e4", TENT);
  if (i % 3 === 1) for (let k = 0; k < 3; k++) base.line(x - 2 + k * 2, y, x, y - 5, "#f08a7a", 1, TENT);
  base.rect(x - 1, y - 2, x + 1, y, "#7a5a48", TENT);
}
// the wheel's frame: two legs to the hub
base.line(WX - 12, HOR + 10, WX, WY, "#4a3040", 1, FRONT); base.line(WX + 12, HOR + 10, WX, WY, "#4a3040", 1, FRONT);
// camels resting in the foreground sand, legs folded
for (const [x, y] of [[20, 98], [34, 101], [162, 100], [178, 97]]) {
  base.ellipse(x, y - 3, 6, 3, "#6a4430", FRONT); base.ellipse(x - 1, y - 6, 2.6, 1.6, "#6a4430", FRONT);
  base.line(x + 5, y - 3, x + 8, y - 9, "#6a4430", 2, FRONT); base.rect(x + 7, y - 10, x + 11, y - 8, "#6a4430", FRONT);
}

balance(base, 0.45);
const PAL = fitPalette(base, { n: 48, extras: ["#ffffff", "#3a2a2a", "#5a3a28", "#f08a5a", "#f2c84a", "#e8f0a0", "#f4f0e8", "#e86a7a", "#ffe8c8"] });

export const meta = {
  slug: "pushkar-camel-fair",
  name: "Pushkar Camel Fair",
  category: "india",
  note: "A big wheel turns over the tents of the desert camel fair as a camel train with turbaned riders crosses the dunes at sunset, kicking up gold dust.",
  tags: ["pushkar", "camel-fair", "rajasthan", "desert", "camels", "ferris-wheel", "india", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

// a camel walking, side-on: hump, long legs swinging, neck stretched forward, a rider with a bright turban
function camel(f, x, y, dir, step, rider) {
  const c = "#3a2a2a";
  f.ellipse(x, y - 9, 5, 2.4, c); f.ellipse(x - dir, y - 11.5, 2.6, 1.8, c);
  f.line(x + dir * 4, y - 9, x + dir * 7, y - 13, c, 1); f.line(x + dir * 5, y - 9, x + dir * 8, y - 13, c, 1);
  f.line(x + dir * 7, y - 14, x + dir * 10, y - 13, c, 2);
  for (const [lx, ph] of [[-4, 0], [-2, 1], [3, 1], [5, 0]]) { const sw = (step + ph) % 2 ? 1 : -1; f.line(x + lx * dir, y - 8, x + lx * dir + sw, y, c, 1); }
  f.put(x + dir * 6, y - 11, "#f08a5a"); f.put(x + dir * 2, y - 8, "#f2c84a"); f.put(x - dir * 3, y - 8, "#e86a7a");
  if (rider) { f.rect(x - 1, y - 16, x + 1, y - 12, rider); f.rect(x - 1, y - 18, x + 1, y - 16, "#f2c84a"); }
}

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    // the big wheel: rim, spokes turning, cars hanging level (24 s a turn)
    const a0 = (t / 24) * Math.PI * 2;
    for (let k = 0; k < 120; k++) { const a = (k / 120) * Math.PI * 2; f.put(WX + Math.cos(a) * WR, WY + Math.sin(a) * WR, "#4a3040"); }
    for (let k = 0; k < 10; k++) {
      const a = a0 + (k / 10) * Math.PI * 2, cx = WX + Math.cos(a) * WR, cy = WY + Math.sin(a) * WR;
      f.line(WX, WY, cx, cy, "#4a3040", 1);
      f.rect(cx - 1, cy + 1, cx + 2, cy + 3, k % 2 ? "#f2c84a" : "#e86a7a");
    }
    f.rect(WX - 1, WY - 1, WX + 2, WY + 2, "#4a3040");
    // pennants on the tallest tents
    flag(f, t, 88, 56, 4, 2, "#f2c84a", { pole: "#7a5a48" });
    flag(f, t + 0.9, 133, 56, 4, 2, "#e86a7a", { pole: "#7a5a48" });
    // a camel train with riders crossing the dunes, dust lifting from their feet (36 s)
    const p = (t % 36) / 36;
    for (let i = 0; i < 4; i++) {
      const x = lerp(W + 20, -60, p) + i * 18, y = 82 - Math.sin(x / W * Math.PI * 2.6 + 9) * 4;
      if (x < -14 || x > W + 14) continue;
      camel(f, Math.round(x), Math.round(y), -1, Math.floor(t * 3 + i), i % 2 ? "#f08a5a" : "#ffffff");
      for (let k = 0; k < 8; k++) { const d = (t * 1.5 + k * 0.6) % 4; f.add(x + 6 + d * 3, y - d * 1.2 - (k % 3), "#ffe8c8", 0.35 * (1 - d / 4)); }
    }
    birds(f, t, { n: 6, y: 16, period: 18, c: "#3a2a2a", only: SKY });
    return enc(f);
  };
}
