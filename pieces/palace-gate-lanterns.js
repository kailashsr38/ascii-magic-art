/* palace-gate-lanterns: a palace gate hall with painted eaves at dusk, mountains behind and lanterns along the wall, hand-built.
 * Painted once: the dusk sky, the rocky mountain behind, the long wall, the two-tier gate hall with its
 * curving tiled roofs and green-and-red painted brackets, the three arched gates and the stone court. Each
 * frame adds guards in bright robes pacing, lanterns swaying, a few visitors and birds. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, person, across, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, MTN = 2, GATE = 3, COURT = 4;
const CX = 96;

const base = new Canvas();
base.sky([[0, "#3a4a8a"], [0.5, "#8a7aa8"], [0.85, "#f0a090"], [1, "#ffcfa0"]], SKY, 0, 60);
// the granite mountain behind
for (let x = 0; x < W; x++) {
  const top = 26 + Math.pow(Math.abs(x - 120) / 70, 1.4) * 24 + fbm(x / 7, 2, 3, 3) * 6;
  for (let y = Math.floor(top); y < 64; y++) base.put(x, y, mix(hex("#a898a8"), hex("#6a6a7a"), clamp((y - top) / 30 + noise2(x / 4, y / 4, 6) * 0.25)), MTN);
}
// the long stone wall with its tiled coping
base.rect(0, 58, W, 76, (x, y) => mix(hex("#e8d8c8"), hex("#a89890"), clamp((y - 58) / 30 + noise2(x / 2, y / 2, 4) * 0.08)), GATE);
base.rect(0, 55, W, 58, "#4a4a58", GATE);
// the gate hall: stone base with three arches, two tiers of wooden hall with painted brackets, sweeping roofs
base.rect(CX - 42, 52, CX + 43, 82, (x, y) => mix(hex("#f0e4d4"), hex("#a8988a"), clamp((x - CX + 42) / 85 * 0.6 + noise2(x / 2, y / 2, 5) * 0.1)), GATE);
for (const dx of [-26, -6, 14]) {
  for (let y = 64; y < 82; y++) for (let x = CX + dx; x < CX + dx + 12; x++) {
    const r = 6;
    if (y < 64 + r && Math.hypot(x + 0.5 - (CX + dx + 6), y + 0.5 - (64 + r)) > r) continue;
    base.put(x, y, "#2a2230", GATE);
  }
}
const tier = (y, hw, h) => {
  base.rect(CX - hw, y, CX + hw + 1, y + h, (x) => ((x - CX + hw) % 7 < 2 ? hex("#c84a3a") : mix(hex("#3a8a6a"), hex("#2a5a4a"), (x % 7) / 7)), GATE);
  for (let x = CX - hw; x < CX + hw; x += 3) base.put(x, y, "#e8b84a", GATE); // painted brackets
};
const roof = (y, hw, depth) => {
  for (let yy = 0; yy < depth; yy++) {
    const u = yy / depth, w = lerp(hw * 0.65, hw, u);
    for (let x = Math.floor(CX - w); x <= CX + w; x++) {
      const e = Math.abs(x - CX) / w, curl = e > 0.8 ? (e - 0.8) * 14 : 0;
      base.put(x, y - depth + yy - curl, mix(hex("#5a5a6a"), hex("#2e2e3a"), clamp(u * 0.7 + ((x % 3) === 0 ? 0.2 : 0))), GATE);
    }
  }
};
tier(44, 38, 8); roof(44, 50, 8);
tier(28, 26, 7); roof(28, 36, 9);
// the stone court
base.rect(0, 82, W, H, (x, y) => mix(hex("#d8ccc0"), hex("#9a8e88"), clamp((y - 82) / 26 + ((x + Math.floor(y / 3) * 4) % 12 < 1 ? 0.15 : 0))), COURT);

balance(base);
const PAL = fitPalette(base, { n: 50, extras: ["#ffd27a", "#d83a3a", "#2a4ab8", "#f2c84a", "#1e1a24", "#ffffff"] });

export const meta = {
  slug: "palace-gate-lanterns",
  name: "Palace Gate Lanterns",
  category: "cities",
  note: "A palace gate hall with sweeping tiled roofs and painted eaves stands at dusk below a granite mountain as guards in bright robes pace and lanterns sway along the wall.",
  tags: ["seoul", "korea", "palace", "gate", "lanterns", "dusk", "landmark", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    // lanterns hung along the wall, swaying on their cords
    for (let i = 0; i < 10; i++) {
      const x = 6 + i * 20 + (i >= 3 && i <= 6 ? 200 : 0), sw = Math.sin(t * 1.5 + i) * 1.2;
      if (x > W) continue;
      f.line(x, 59, x + sw, 63, "#1e1a24", 1);
      f.ellipse(x + sw, 66, 2, 2.6, i % 2 ? "#d83a3a" : "#ffd27a");
    }
    // two guards in red and blue robes pacing in front of the gates
    for (const [cx, c, ph] of [[CX - 34, "#d83a3a", 0], [CX + 34, "#2a4ab8", 1.5]]) {
      const x = cx + Math.round(Math.sin(t * 0.4 + ph) * 8), y = 92;
      f.rect(x - 2, y - 9, x + 3, y, c); f.rect(x - 1, y - 12, x + 2, y - 9, "#f0d0b0"); f.rect(x - 2, y - 13, x + 3, y - 11, "#1e1a24");
      f.rect(x + 3, y - 14, x + 4, y - 2, "#f2c84a"); // the banner pole
    }
    for (const [ph, c] of [[0.2, "#ffffff"], [0.6, "#f2c84a"]]) person(f, across(t, 3, ph), 100, { body: c, head: "#e8c8a8", step: Math.floor(t * 4 + ph * 9) });
    birds(f, t, { n: 5, y: 14, period: 16, c: "#1e1a24", only: SKY });
    return enc(f);
  };
}
