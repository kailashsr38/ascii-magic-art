/* golden-pavilion-pond: the gold-leaf pavilion on its mirror pond among pines and maples, hand-built.
 * Painted once: the soft sky, wooded hills, the three-storey pavilion (the top two in gold, dark roofs
 * with upturned eaves, a phoenix on top), pine islets and maples, and its reflection in the pond. Each
 * frame adds two ducks paddling with their wakes, drifting cloud and birds. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, clouds, tree, across, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, HILL = 2, BLD = 3, POND = 4, ISLE = 5;
const WL = 70, PX = 110;

const base = new Canvas();
base.sky([[0, "#8ab4d8"], [0.6, "#c8dce8"], [1, "#eef0e4"]], SKY, 0, 50);
// wooded hills behind: dark greens, a few autumn maples
base.ridge({ base: 0.5, amp: 0.12, f: 2.5, seed: 3, top: "#9ab872", bot: "#6a8a52", depth: 26, m: HILL });
base.ridge({ base: 0.58, amp: 0.06, f: 6, seed: 9, top: "#7a9a5a", bot: "#4e6e3e", depth: 14, m: HILL });
for (let i = 0; i < 160; i++) { const x = (i * 53) % W, y = 52 + ((i * 29) % 18); if (base.maskAt(x, y) === HILL) base.ellipse(x, y, 2.5, 2, i % 3 ? "#c85a3a" : "#e8a040", HILL); }
// the pavilion: ground floor of plain wood and white plaster, two upper floors in gold leaf
const roof = (y, hw, depth) => {
  base.poly([[PX - hw - 5, y], [PX + hw + 5, y], [PX + hw + 1, y - depth], [PX - hw - 1, y - depth]], (x, yy) => mix(hex("#4a3e3a"), hex("#2a2224"), clamp((yy - y + depth) / depth)), BLD);
  base.put(PX - hw - 6, y - 1, "#4a3e3a", BLD); base.put(PX + hw + 6, y - 1, "#4a3e3a", BLD); // upturned tips
};
const gold = (x, x0, x1) => mix(hex("#fff0a0"), hex("#b88a2a"), clamp((x - x0) / (x1 - x0) * 0.9));
base.rect(PX - 19, 58, PX + 20, WL, (x) => ((x - PX) % 6 === 0 ? hex("#6a4a3a") : mix(hex("#f4ece0"), hex("#b8aa98"), clamp((x - PX + 19) / 39))), BLD);
roof(58, 20, 4);
base.rect(PX - 15, 46, PX + 16, 54, (x) => gold(x, PX - 15, PX + 16), BLD);
for (let x = PX - 13; x < PX + 15; x += 5) base.rect(x, 48, x + 2, 52, "#c89a3a", BLD);
roof(46, 16, 4);
base.rect(PX - 10, 35, PX + 11, 42, (x) => gold(x, PX - 10, PX + 11), BLD);
roof(35, 12, 6);
base.rect(PX - 1, 25, PX + 2, 29, "#ffe070", BLD); base.put(PX - 2, 26, "#ffe070", BLD); base.put(PX + 2, 25, "#ffe070", BLD); // the phoenix
// pine islets and big pines framing the pond
for (const [x, y, r] of [[40, 70, 7], [64, 68, 5], [166, 69, 8], [184, 71, 6]]) {
  base.ellipse(x, y + 1, r + 4, 2, "#6a6050", ISLE);
  tree(base, x, y, r, { trunk: "#4a3a2a", dark: "#1e3a24", light: "#4a6e3a", seed: x, m: ISLE });
}
// the pond: everything above mirrored, darkened and cooled, with a few lily pads
const snap = new Canvas().copy(base);
base.rect(0, WL, W, H, (x, y) => {
  const sy = 2 * WL - y - 1 + Math.round(Math.sin(y * 0.8 + x * 0.04) * 0.8);
  return mix(snap.get(x, sy), hex("#3a5a5a"), clamp(0.35 + (y - WL) / 90));
}, POND);
for (let i = 0; i < 40; i++) { const x = (i * 71) % W, y = 86 + ((i * 17) % 20); base.ellipse(x, y, 2.2, 1, "#5a8a4a", POND); }

balance(base);
const PAL = fitPalette(base, { n: 52, extras: ["#ffffff", "#2a2224", "#f4ece0", "#5a4a3a", "#3a7a5a"] });

export const meta = {
  slug: "golden-pavilion-pond",
  name: "Golden Pavilion Pond",
  category: "cities",
  note: "The gold-leaf pavilion stands mirrored in its pond among pines and autumn maples while two ducks paddle across and clouds drift over the hills.",
  tags: ["kyoto", "japan", "temple", "pond", "reflection", "landmark", "halftone", "gold"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    clouds(f, t, [[0.2, 0.3, 0.12, 1.2, "#ffffff", 0.35], [0.7, 0.24, 0.24, 1, "#f4f4f0", 0.3]], SKY, 0.8);
    // two ducks paddling across, a V of ripples behind each
    for (const [ph, y, dir] of [[0.1, 84, 1], [0.55, 94, -1]]) {
      const u = across(t, 3.2, ph), x = dir > 0 ? u : W - u;
      for (let k = 1; k < 12; k++) { const a = (1 - k / 12) * 0.5; f.add(x - dir * k, y + 1 + k * 0.25, "#d8e4e0", a, POND); f.add(x - dir * k, y + 1 - k * 0.15, "#d8e4e0", a * 0.6, POND); }
      f.rect(x - 2, y - 1, x + 2, y + 1, "#5a4a3a"); f.rect(x + dir * 2, y - 2, x + dir * 3, y - 1, "#3a7a5a"); f.put(x + dir * 4, y - 2, "#e8a040");
    }
    birds(f, t, { n: 4, y: 14, period: 16, c: "#2a2224", only: SKY });
    return enc(f);
  };
}
