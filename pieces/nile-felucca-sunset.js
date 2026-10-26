/* nile-felucca-sunset: white-sailed feluccas on the river at sunset, palms and a temple on the far bank, hand-built.
 * Painted once: the sunset sky and sun, the desert hills and the temple's columns on the west bank,
 * the date palms, the wide river with the sun's path. Each frame sails the feluccas, leaning, across the
 * water, and adds egrets, palms swaying and cloud. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, clouds, palm, across, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, BANK = 2, RIVER = 3;
const HOR = 62, SUN = [120, 50];

const base = new Canvas();
base.sky([[0, "#5a5a8e"], [0.4, "#c87a88"], [0.75, "#f8a060"], [1, "#ffd488"]], SKY, 0, HOR + 1);
base.glow(SUN[0], SUN[1], 6, 40, "#fff0c0", 0.7, SKY);
// the desert hills on the west bank
base.ridge({ base: 0.56, amp: 0.05, f: 3, seed: 7, top: "#b8708a", bot: "#8a5a72", depth: 8, m: BANK });
// the temple's columns and pylon, lit from behind
for (const x of [30, 36, 42, 48, 54]) base.rect(x, 48, x + 3, 64, "#7a4a5a", BANK);
base.rect(28, 45, 58, 48, "#8a5a66", BANK);
base.poly([[62, 64], [80, 64], [77, 44], [65, 44]], "#7a4a5a", BANK);
// the bank: a dark strip of fields
base.rect(0, 62, W, 66, (x) => mix(hex("#5a4a52"), hex("#3a3a3e"), noise2(x / 4, 1, 3)), BANK);
// the river: warm sky mirrored, the sun's path down it
base.rect(0, 66, W, H, (x, y) => {
  const u = (y - 66) / (H - 66), path = Math.exp(-((x - SUN[0]) ** 2) / (40 + u * 1200)) * (1 - u * 0.3);
  const ripple = Math.sin(y * 2.1 + Math.sin(x * 0.18) * 2) > 0.62 ? 0.1 : 0;
  return mix(mix(hex("#e09078"), hex("#6a5a80"), clamp(u * 1.1)), hex("#ffe0a0"), clamp(path * 0.85 + ripple));
}, RIVER);

balance(base);
const PAL = fitPalette(base, { n: 52, extras: ["#fffaf0", "#1a1418", "#f4ece0", "#2a2024"] });

export const meta = {
  slug: "nile-felucca-sunset",
  name: "Nile Felucca Sunset",
  category: "cities",
  note: "White-sailed feluccas lean across the river at sunset past date palms and an old temple on the far bank, egrets flying low over the water.",
  tags: ["nile", "egypt", "felucca", "sailing", "river", "sunset", "landmark", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

// a felucca: a low hull and one great slanted lateen sail
function felucca(f, x, y, s, dir) {
  for (let i = -Math.round(10 * s); i <= 10 * s; i++) { const lift = Math.pow(Math.abs(i) / (10 * s), 3) * 2 * s; f.put(x + i, y - lift, "#1a1418"); f.put(x + i, y + 1 - lift * 0.5, "#1a1418"); }
  const top = [x + dir * 3 * s, y - 26 * s], foot = [x - dir * 9 * s, y - 2 * s], mast = [x, y - 2];
  for (let k = 0; k <= 26 * s; k++) {
    const v = k / (26 * s);
    const ax = lerp(top[0], foot[0], v), ay = lerp(top[1], foot[1], v);
    const bx = lerp(top[0], mast[0], Math.min(1, v * 1.15)), by = lerp(top[1], mast[1], Math.min(1, v * 1.15));
    for (let j = Math.min(ax, bx); j <= Math.max(ax, bx); j++) f.put(j, lerp(ay, by, (j - ax) / (bx - ax || 1)), v < 0.08 ? "#f4ece0" : "#fffaf0");
  }
  f.line(top[0], top[1], foot[0], foot[1], "#2a2024", 1);
}

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    clouds(f, t, [[0.25, 0.3, 0.2, 1.2, "#f6a888", 0.45], [0.75, 0.24, 0.32, 1, "#c88aa0", 0.35]], SKY, 0.7);
    // palms on the near bank, swaying
    const sw = Math.sin(t * 0.8) * 0.8;
    palm(f, 176, 108, 40, { lean: -0.22, c: "#1a1418", sway: sw, fronds: 8 });
    palm(f, 188, 108, 30, { lean: 0.1, c: "#1a1418", sway: sw * 0.8, fronds: 7 });
    palm(f, 8, 108, 34, { lean: 0.25, c: "#1a1418", sway: sw * 0.9, fronds: 7 });
    // feluccas sailing, the near one large
    felucca(f, across(t, 3, 0.2, W, 40), 82, 0.8, 1);
    felucca(f, W - across(t, 2.2, 0.6, W, 40), 74, 0.5, -1);
    felucca(f, across(t, 4, 0.75, W, 50), 98, 1.2, 1);
    birds(f, t, { n: 5, y: 58, period: 13, c: "#fffaf0", only: [SKY, RIVER], rise: 1 });
    return enc(f);
  };
}
