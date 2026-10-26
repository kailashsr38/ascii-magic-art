/* ellora-rock-temple: a whole temple carved down out of a single basalt hillside, its towers standing in the pit, the cliff galleries around it, hand-built.
 * Painted once: the warm afternoon sky, the hillside of dark basalt with the cut walls of the great pit,
 * the galleries carved into the cliff with their pillars, and the temple itself standing free in the
 * pit: the pyramidal tower, the hall, the gateway, the stone pillars and the elephant beside them, all
 * one rock. Each frame walks visitors through the gateway and round the court, swings the light over
 * the cliff as the clouds pass, sends a monkey along the ledge and flies kites over the hill. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, person, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, HILL = 2, CLIFF = 3, TEMPLE = 4, COURT = 5;
const CX = 96, FLOOR = 94;

const base = new Canvas();
base.sky([[0, "#6a9ad0"], [0.7, "#c8d8e4"], [1, "#f0e8d8"]], SKY, 0, 30);
// the hilltop scrub along the skyline
base.ridge({ base: 0.2, amp: 0.04, f: 3, seed: 3, top: "#a8a070", bot: "#8a8458", depth: 6, m: HILL });
// the cut walls of the pit: sheer basalt, layered, with galleries of pillars carved into them
base.rect(0, 26, W, FLOOR, (x, y) => mix(hex("#b8a494"), hex("#7a6a5e"), clamp((y - 26) / 70 + (Math.sin(y * 0.9) > 0.85 ? 0.12 : 0) + noise2(x / 3, y / 6, 4) * 0.2)), CLIFF);
for (const [gx0, gx1, gy] of [[4, 44, 56], [148, 188, 56], [8, 40, 74], [152, 184, 74]]) {
  base.rect(gx0, gy, gx1, gy + 12, "#3a302a", CLIFF);
  for (let x = gx0 + 2; x < gx1 - 1; x += 5) base.rect(x, gy, x + 2, gy + 12, "#a8968a", CLIFF);
  base.rect(gx0 - 1, gy - 2, gx1 + 1, gy, "#c8b4a4", CLIFF);
}
// the temple: the tower rising in stepped tiers to its capstone, lit warm on the left
const tier = (hw, y0, y1, c1, c2) => base.rect(CX - hw, y0, CX + hw + 1, y1, (x, y) => mix(hex(c1), hex(c2), clamp((x - CX + hw) / (2 * hw))), TEMPLE);
for (let k = 0; k < 7; k++) { const hw = 26 - k * 3.4, y1 = 70 - k * 6; tier(hw, y1 - 6, y1, "#e8d4bc", "#8a7466"); base.rect(CX - hw, y1 - 6, CX + hw + 1, y1 - 5, "#f4e4d0", TEMPLE); for (let x = CX - hw + 2; x < CX + hw - 1; x += 4) base.rect(x, y1 - 4, x + 2, y1 - 1, "#7a6458", TEMPLE); }
base.ellipse(CX, 22, 5, 3, "#d8c4ac", TEMPLE); base.rect(CX, 15, CX + 1, 19, "#d8c4ac", TEMPLE);
// the hall at the tower's foot, its pillared porch, and the gateway in front
tier(36, 70, FLOOR, "#dcc8b0", "#7a6658");
for (let x = CX - 32; x < CX + 33; x += 6) base.rect(x, 76, x + 2, FLOOR, "#5a4a42", TEMPLE);
base.rect(CX - 8, 80, CX + 9, FLOOR, "#3a302a", TEMPLE);
// the two stone pillars and the stone elephant beside them
for (const x of [CX - 50, CX + 50]) { base.rect(x - 1, 52, x + 2, FLOOR, (xx) => mix(hex("#d8c4ac"), hex("#8a7466"), (xx - x + 1) / 3), TEMPLE); base.rect(x - 2, 50, x + 3, 52, "#e8d4bc", TEMPLE); }
base.ellipse(CX - 64, 88, 7, 5, "#a89484", TEMPLE); base.ellipse(CX - 70, 86, 3, 3, "#a89484", TEMPLE); base.line(CX - 72, 87, CX - 73, FLOOR, "#a89484", 1, TEMPLE);
for (const lx of [-68, -60]) base.rect(CX + lx, 90, CX + lx + 2, FLOOR, "#8a7466", TEMPLE);
// the court floor
base.rect(0, FLOOR, W, H, (x, y) => mix(hex("#c8b8a4"), hex("#a8988a"), clamp((y - FLOOR) / 14 + fbm(x / 6, y / 2, 2, 3) * 0.2)), COURT);

balance(base, 0.4);
const PAL = fitPalette(base, { n: 48, extras: ["#ffffff", "#2a2420", "#e86a4a", "#f2c84a", "#3a6aa8", "#e8c8a0", "#6a5040", "#f4f0e8"] });

export const meta = {
  slug: "ellora-rock-temple",
  name: "Ellora Rock Temple",
  category: "india",
  note: "A whole temple carved down out of a single basalt hillside stands in its pit, tower, hall, pillars and stone elephant all one rock, as visitors walk the court and a monkey runs the cliff ledge.",
  tags: ["ellora", "kailasa", "rock-cut", "temple", "maharashtra", "basalt", "india", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    // a cloud's shadow passing over the cliff and the tower (24 s)
    const sx = ((t * 9) % (W + 120)) - 60;
    for (let y = 26; y < FLOOR; y++) for (let x = Math.max(0, Math.floor(sx - 40)); x < Math.min(W, sx + 40); x++) { const d = Math.abs(x - sx) / 40; f.add(x, y, "#4a3e3a", (1 - d * d) * 0.28); }
    // visitors walking in through the gateway and round the court
    for (let i = 0; i < 7; i++) {
      const p = ((t / 28) + i / 7) % 1, x = lerp(4, W - 4, p), y = FLOOR + 4 + (i % 3) * 3;
      person(f, i % 2 ? x : W - x, y, { body: ["#e86a4a", "#ffffff", "#f2c84a", "#3a6aa8"][i % 4], head: "#6a5040", step: Math.floor(t * 3 + i) });
    }
    // a monkey running along the gallery ledge, pausing, running on
    const m = (t % 16) / 16, mx = m < 0.5 ? lerp(150, 186, m * 2) : lerp(186, 150, (m - 0.5) * 2), hop = Math.abs(Math.sin(t * 6)) * (Math.floor(m * 8) % 2 ? 1 : 0);
    f.ellipse(mx, 53 - hop, 1.6, 1.2, "#6a5040"); f.put(mx + (m < 0.5 ? 2 : -2), 52 - hop, "#6a5040"); f.line(mx - (m < 0.5 ? 2 : -2), 53, mx - (m < 0.5 ? 4 : -4), 50, "#6a5040", 1);
    birds(f, t, { n: 4, y: 10, period: 17, c: "#2a2420", only: SKY });
    return enc(f);
  };
}
