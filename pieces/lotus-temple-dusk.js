/* lotus-temple-dusk: the white marble lotus temple glowing at dusk above its pools, visitors walking the paths, hand-built.
 * Painted once: the dusk sky, the city's tree line, the temple's three ranks of white petals, inner buds
 * rising, outer petals spreading over the doors, lit from below, the podium and stairs, the nine pools
 * mirroring it, the lawns and the paths. Each frame walks visitors along the paths, drifts clouds,
 * flies parakeets home to the trees and ripples the pools. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, clouds, person, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, TREES = 2, TEMPLE = 3, PODIUM = 4, POOL = 5, LAWN = 6, PATH = 7;
const CX = 96, BASE = 66;

const base = new Canvas();
base.sky([[0, "#3a4a88"], [0.5, "#8a78a8"], [0.85, "#f0a890"], [1, "#ffd0a0"]], SKY, 0, 70);
// the city's trees on the horizon
for (let x = 0; x < W; x++) { const top = 58 + fbm(x / 6, 1, 3, 3) * 6; for (let y = Math.floor(top); y < 72; y++) base.put(x, y, mix(hex("#3a4a42"), hex("#2a3432"), (y - top) / 14), TREES); }
// a petal: a pointed lens rising from its base, leaning out, lit on the face and grey at the edges
function petal(cx, by, w, h, lean, shade = 0) {
  for (let y = Math.floor(by - h); y <= by; y++) {
    const v = (by - y) / h, hw = (w / 2) * Math.sin(Math.PI * Math.min(1, 0.12 + v * 0.88)) * (1 - v * 0.25), c0 = cx + lean * v * v * h;
    for (let x = Math.floor(c0 - hw); x <= c0 + hw; x++) {
      const e = Math.abs(x - c0) / (hw + 0.01);
      base.put(x, y, mix(mix(hex("#ffffff"), hex("#b8b4c8"), clamp(e * e * 0.9 + shade)), hex("#fff0dc"), clamp((v < 0.3 ? 0.3 - v : 0) * 1.2)), TEMPLE);
    }
  }
}
// back rank: the closed buds rising in the middle
for (const [dx, h] of [[-12, 34], [12, 34], [0, 42]]) petal(CX + dx, BASE - 4, 16, h, dx * -0.012, dx ? 0.12 : 0);
// middle rank: petals opening outward
for (const dx of [-22, 22, -10, 10]) petal(CX + dx, BASE - 2, 18, 28, dx * 0.022, 0.08);
// outer rank: wide petals arching over the doors, leaning out
for (const dx of [-38, 38, -20, 20, 0]) petal(CX + dx, BASE, 24, 16, dx * 0.03, 0.04);
// dark doors under the outer petals
for (const dx of [-38, -20, 0, 20, 38]) base.rect(CX + dx - 3, BASE - 4, CX + dx + 3, BASE, "#5a4a5a", TEMPLE);
// the podium and its wide stairs
base.rect(CX - 62, BASE, CX + 63, BASE + 6, (x, y) => mix(hex("#e8e0e8"), hex("#a8a0b0"), (y - BASE) / 6), PODIUM);
for (let k = 0; k < 4; k++) base.rect(CX - 14 - k * 3, BASE + 6 + k * 2, CX + 15 + k * 3, BASE + 8 + k * 2, k % 2 ? "#d8d0d8" : "#f0e8f0", PODIUM);
// the lawns, the pools mirroring the temple, the paths
base.rect(0, 72, W, H, (x, y) => mix(hex("#4a6a3a"), hex("#2e4a2a"), clamp((y - 72) / 36 + fbm(x / 6, y / 3, 2, 5) * 0.3)), LAWN);
const snap = new Canvas().copy(base);
for (const [x0, x1, y0, y1] of [[6, 70, 76, 88], [122, 186, 76, 88], [20, 78, 92, 104], [114, 172, 92, 104]]) {
  base.rect(x0 - 1, y0 - 1, x1 + 1, y1 + 1, "#d8d0d8", PATH);
  base.rect(x0, y0, x1, y1, (x, y) => mix(snap.get(x, 2 * BASE - y + 10), hex("#4a5a8a"), clamp(0.3 + (y - y0) / 40)), POOL);
}
base.poly([[CX - 20, 74], [CX + 21, 74], [CX + 34, H], [CX - 33, H]], (x, y) => mix(hex("#e0d8dc"), hex("#b8a8b0"), (y - 74) / 34), PATH);

balance(base);
const PAL = fitPalette(base, { n: 48, extras: ["#ffffff", "#2a2a3a", "#f08a5a", "#f2c84a", "#8ad06a", "#e8eef8", "#fff0dc"] });

export const meta = {
  slug: "lotus-temple-dusk",
  name: "Lotus Temple Dusk",
  category: "india",
  note: "A temple of white marble petals glows at dusk above its mirror pools as visitors walk the paths and parakeets fly home to the trees.",
  tags: ["lotus-temple", "delhi", "temple", "marble", "dusk", "architecture", "india", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    clouds(f, t, [[0.1, 0.4, 0.14, 1.4, "#c8a8c0", 0.6], [0.6, 0.3, 0.24, 1.2, "#f0b8a8", 0.45], [0.35, 0.25, 0.32, 1, "#ffd0b0", 0.35]], SKY, 0.7);
    // a breeze wrinkling the pools: bands of ripple moving across
    for (let y = 77; y < 104; y += 2) for (let x = 0; x < W; x++) if (f.maskAt(x, y) === POOL && Math.sin(x * 0.4 - t * 3 + y * 0.9) > 0.9) f.add(x, y, "#e8eef8", 0.35);
    // visitors walking up the path to the temple and back down
    for (let i = 0; i < 6; i++) {
      const p = ((t / 24) + i / 6) % 1, up = i % 2 === 0, u = up ? p : 1 - p;
      const y = Math.round(lerp(H - 1, 76, u)), x = CX + (i - 2.5) * lerp(8, 4, u);
      person(f, x, y, { body: ["#f08a5a", "#ffffff", "#f2c84a"][i % 3], head: "#5a4a4a", legs: "#2a2a3a", step: Math.floor(t * 3 + i) });
    }
    // parakeets flying home to the trees
    birds(f, t, { n: 6, y: 30, period: 14, c: "#8ad06a", only: SKY, dir: 1 });
    birds(f, t, { n: 4, y: 20, period: 19, c: "#2a2a3a", only: SKY, phase: 0.5 });
    return enc(f);
  };
}
