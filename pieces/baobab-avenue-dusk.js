/* baobab-avenue-dusk: an avenue of giant baobab trees along a red dirt road at dusk, an ox cart passing, hand-built.
 * Painted once: the glowing dusk sky, the flat land, the red dirt road and the huge bottle-shaped baobabs
 * standing either side with their stubby crowns, mirrored in a roadside pool. Each frame passes the ox
 * cart with its dust, walks a villager with a load on her head and flies bats out from the crowns. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, across, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, LAND = 2, TREE = 3, POOL = 4;
const HOR = 80;

const base = new Canvas();
base.sky([[0, "#3a3a7a"], [0.4, "#a86a8a"], [0.75, "#f88a5a"], [1, "#ffc070"]], SKY, 0, HOR + 1);
base.glow(96, 76, 7, 40, "#fff0b0", 0.7, SKY);
base.rect(0, HOR, W, H, (x, y) => mix(hex("#8a4a3a"), hex("#4a2a24"), clamp((y - HOR) / 28 + fbm(x / 5, y / 2, 2, 6) * 0.3)), LAND);
// the road running to the horizon
base.poly([[90, HOR], [102, HOR], [150, H], [40, H]], (x, y) => mix(hex("#e8805a"), hex("#a84a32"), (y - HOR) / 28), LAND);
// baobabs: bottle trunks, flat stubby crowns, silhouetted against the glow
const baobab = (x, s) => {
  const top = HOR - 46 * s, w0 = 5 * s;
  for (let y = Math.floor(top); y <= HOR + 2; y++) {
    const u = (y - top) / (HOR - top), w = w0 * (0.75 + 0.5 * Math.pow(u, 1.5)) + (u > 0.95 ? 2 * s : 0);
    base.rect(x - w, y, x + w + 1, y + 1, (xx) => mix(hex("#3a2a2a"), hex("#1e1418"), clamp((xx - x + w) / (2 * w))), TREE);
  }
  for (let k = 0; k < 7; k++) { // the crown: short thick branches spreading flat
    const a = -Math.PI / 2 + (k - 3) * 0.32, len = (7 + (k % 3) * 2) * s;
    base.line(x, top, x + Math.cos(a) * len * 1.4, top + Math.sin(a) * len * 0.6, "#1e1418", Math.max(1, Math.round(1.6 * s)), TREE);
    base.ellipse(x + Math.cos(a) * len * 1.4, top + Math.sin(a) * len * 0.6 - 1, 2.6 * s, 1.4 * s, "#2a3a24", TREE);
  }
};
for (const [x, s] of [[20, 1.15], [56, 0.85], [78, 0.55], [114, 0.6], [138, 0.9], [176, 1.25], [88, 0.35], [104, 0.38]]) baobab(x, s);
// a pool beside the road mirroring the trees and the sky
const snap = new Canvas().copy(base);
base.ellipse(30, 100, 26, 5, (x, y) => mix(snap.get(x, 2 * 96 - y), hex("#4a3a5a"), 0.35), POOL);

balance(base);
const PAL = fitPalette(base, { n: 50, extras: ["#e8c8a0", "#f4e0c0", "#e84a3a", "#f2c84a", "#140e10"] });

export const meta = {
  slug: "baobab-avenue-dusk",
  name: "Baobab Avenue Dusk",
  category: "landscapes",
  note: "Giant bottle-shaped baobabs line a red dirt road at dusk against the glowing sky as an ox cart rolls past in its dust and bats leave the crowns.",
  tags: ["baobab", "madagascar", "avenue", "dusk", "trees", "road", "wonder", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    // the ox cart coming down the road toward us and growing (20 s)
    const p = (t % 20) / 20, s = lerp(0.3, 1.4, p), x = lerp(98, 112, p), y = lerp(HOR + 2, 100, p);
    for (let k = 1; k < 10; k++) f.add(x + Math.sin(k) * 3 * s, y - k * 1.2 * s, "#f4e0c0", (1 - k / 10) * 0.4 * s);
    f.rect(x - 3 * s, y - 6 * s, x + 4 * s, y - 2 * s, "#e8c8a0"); f.rect(x - 3 * s, y - 2 * s, x - 2 * s, y, "#140e10"); f.rect(x + 3 * s, y - 2 * s, x + 4 * s, y, "#140e10");
    f.rect(x - 4 * s, y - 13 * s, x + 5 * s, y - 6 * s, "#5a3a2a"); f.ellipse(x + 0.5, y - 5 * s, 3 * s, 3 * s, "#140e10");
    // a woman walking along the road edge with a basket on her head
    const wx = across(t, 3, 0.2), wy = 102;
    f.rect(wx, wy - 6, wx + 2, wy, "#e84a3a"); f.put(wx, wy - 7, "#140e10"); f.rect(wx - 1, wy - 9, wx + 3, wy - 8, "#f2c84a");
    // bats leaving the crowns
    for (let i = 0; i < 6; i++) {
      const bp = ((t * 0.15 + i / 6) % 1), bx = 176 + bp * 40 - i * 30 * bp, by = 22 - bp * 18 + Math.sin(t * 6 + i) * 2;
      f.put(bx, by, "#140e10"); f.put(bx - 1, by - (Math.sin(t * 14 + i) > 0 ? 1 : 0), "#140e10"); f.put(bx + 1, by - (Math.sin(t * 14 + i) > 0 ? 1 : 0), "#140e10");
    }
    return enc(f);
  };
}
