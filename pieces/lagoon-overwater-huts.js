/* lagoon-overwater-huts: thatched huts on stilts curving out over a turquoise lagoon below a green volcanic peak, hand-built.
 * Painted once: the bright sky, the jagged green peak and the island's palm-fringed shore, the reef line
 * where the deep water breaks, the lagoon from clear turquoise to pale over the sand, and the curve of
 * overwater huts on their stilts along the boardwalk. Each frame paddles an outrigger canoe across,
 * drifts clouds over the peak, breaks surf on the reef, sways the palms and glides a ray under the water. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, puffs, palm, birds, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, PEAK = 2, SHORE = 3, REEF = 4, LAGOON = 5, HUT = 6;
const HOR = 50;

const base = new Canvas();
base.sky([[0, "#5a98d8"], [0.7, "#a8d0ec"], [1, "#e4f2f8"]], SKY, 0, HOR + 1);
// the volcanic peak: a sheer dark-green block with a flat crown, lower ridges falling away from it
base.ridge({ base: 0.46, amp: 0.22, f: 2, seed: 3, top: "#5a8a5a", bot: "#3a6a46", depth: 30, m: PEAK, shape: (u) => Math.max(0, 1 - Math.abs(u - 0.38) * 3.2) ** 0.7 * 1.6 + Math.max(0, 1 - Math.abs(u - 0.62) * 5) * 0.5 - 0.1 });
for (let x = 0; x < W; x++) for (let y = 0; y < HOR; y++) if (base.maskAt(x, y) === PEAK && noise2(x / 2, y / 4, 4) > 0.62) base.put(x, y, "#8aa878", PEAK);
// the island's shore: a thin band of sand and palms at the water
base.rect(0, HOR - 2, W, HOR + 1, "#f0e4c8", SHORE);
// the reef line, then the lagoon: deep blue outside, turquoise, pale over the sand
base.rect(0, HOR + 1, W, HOR + 4, "#4a88b8", REEF);
base.rect(0, HOR + 4, W, H, (x, y) => mix(mix(hex("#4ac0c8"), hex("#8ae0d8"), clamp((y - HOR - 4) / 30)), hex("#d8f4ec"), clamp((y - 86) / 22)), LAGOON);
// the boardwalk curving out over the lagoon, huts on stilts along it
const HUTS = [];
for (let i = 0; i < 9; i++) { const u = i / 8, x = lerp(18, 176, u), y = 64 + Math.sin(u * Math.PI) * -6 + u * 18; HUTS.push([x, y, 5 + u * 5]); }
for (let i = 0; i < HUTS.length - 1; i++) base.line(HUTS[i][0], HUTS[i][1] + 2, HUTS[i + 1][0], HUTS[i + 1][1] + 2, "#b89a70", 1, HUT);
for (const [x, y, s] of HUTS) {
  for (const dx of [-s * 0.6, 0, s * 0.6]) base.rect(x + dx, y, x + dx + 1, y + s * 0.6, "#4a3a2e", HUT);
  base.rect(x - s * 0.7, y - s * 0.5, x + s * 0.7, y + 1, "#f4ead8", HUT);
  base.rect(x - s * 0.2, y - s * 0.3, x + s * 0.2, y + 1, "#6a5040", HUT);
  base.poly([[x - s, y - s * 0.45], [x + s, y - s * 0.45], [x, y - s * 1.3]], (xx, yy) => mix(hex("#e8c890"), hex("#b08a5a"), clamp((xx - x + s) / (2 * s))), HUT);
}

balance(base, 0.45);
const PAL = fitPalette(base, { n: 48, extras: ["#ffffff", "#f4fcfa", "#2a2a2a", "#f2c84a", "#e86a4a", "#3a6a8a", "#1e3a24"] });

export const meta = {
  slug: "lagoon-overwater-huts",
  name: "Lagoon Overwater Huts",
  category: "landscapes",
  note: "Thatched huts on stilts curve out over a turquoise lagoon below a sheer green volcanic peak, an outrigger canoe paddling past and a ray gliding beneath.",
  tags: ["bora-bora", "lagoon", "overwater", "tropical", "island", "turquoise", "wonder", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    puffs(f, t, [[0.3, 0.1, 6, "#ffffff", 0.7, "#dce8f0"], [0.75, 0.2, 5, "#ffffff", 0.5, "#dce8f0"]], SKY);
    // surf breaking along the reef, a line of white running along it
    for (let x = 0; x < W; x++) { const a = 0.5 + 0.5 * Math.sin(x * 0.15 - t * 1.4); f.add(x, HOR + 2, "#ffffff", a * 0.9, REEF); }
    // palms along the shore, swaying
    for (const [x, h] of [[8, 12], [150, 10], [176, 13], [186, 9]]) palm(f, x, HOR - 1, h, { c: "#1e3a24", sway: Math.sin(t * 0.8 + x) * 1.2, lean: 0.2 });
    // a ray gliding under the lagoon, wings rippling
    const rx = ((t * 3) % (W + 30)) - 15, ry = 96 + Math.sin(t * 0.4) * 2, flap = Math.sin(t * 2);
    for (let k = -5; k <= 5; k++) f.add(rx + k, ry + Math.abs(k) * 0.3 * flap, "#3a6a8a", 0.5, LAGOON);
    f.add(rx, ry - 1, "#3a6a8a", 0.5, LAGOON); for (let k = 1; k < 6; k++) f.add(rx - 5 - k, ry, "#3a6a8a", 0.35, LAGOON);
    // an outrigger canoe paddling across the lagoon
    const cx = W + 12 - ((t * 5) % (W + 30)), cy = 80, dip = Math.sin(t * 6);
    for (let k = 1; k < 12; k++) f.add(cx + 7 + k * 1.4, cy + 1, "#ffffff", (1 - k / 12) * 0.6, LAGOON);
    f.rect(cx - 7, cy - 1, cx + 7, cy + 1, "#e86a4a"); f.line(cx - 3, cy - 2, cx - 3, cy - 5, "#2a2a2a", 1); f.rect(cx - 6, cy - 5, cx + 6, cy - 4, "#2a2a2a");
    for (const [px, c] of [[-3, "#f2c84a"], [3, "#ffffff"]]) { f.rect(cx + px, cy - 4, cx + px + 1, cy - 1, c); f.put(cx + px, cy - 5, "#6a5040"); f.line(cx + px + 1, cy - 3, cx + px + 3, cy + 1 + dip, "#2a2a2a", 1); }
    birds(f, t, { n: 3, y: 14, period: 18, c: "#2a2a2a", only: SKY });
    return enc(f);
  };
}
