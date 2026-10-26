/* glacier-calving-front: the towering blue-white front of a glacier where it meets the lake, a block breaking off and crashing in, hand-built.
 * Painted once: the cool sky, the mountains, the glacier's surface running back to them, the great ice
 * cliff with its blue seracs and crevasses, and the grey-green lake with floating bergs. Each frame calves
 * a slab off the front on a long cycle with its splash and wave, drifts the bergs and sails a tour boat. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, MTN = 2, ICE = 3, LAKE = 4;
const WL = 78;

const base = new Canvas();
base.sky([[0, "#6a90c8"], [0.7, "#b8d0e4"], [1, "#e4ecf2"]], SKY, 0, 40);
base.ridge({ base: 0.34, amp: 0.12, f: 3, seed: 7, top: "#e8eef4", bot: "#8a98b0", depth: 14, m: MTN });
// the glacier surface sweeping back to the mountains, streaked with moraine
for (let x = 0; x < W; x++) for (let y = 40; y < 50; y++) base.put(x, y, mix(hex("#f0f4f8"), hex("#a8b4c4"), clamp((y - 40) / 12 + (Math.sin(x * 0.15 + y) > 0.85 ? 0.3 : 0))), ICE);
// the ice cliff: jagged top, vertical blue fissures, white pinnacles
for (let x = 0; x < W; x++) {
  const top = 46 + Math.abs(Math.sin(x * 0.35) * 3) + fbm(x / 5, 2, 3, 4) * 6;
  for (let y = Math.floor(top); y < WL; y++) {
    const fissure = Math.sin(x * 0.8 + noise2(x / 4, y / 10, 5) * 3) > 0.7, deep = (y - top) / (WL - top);
    base.put(x, y, mix(mix(hex("#ffffff"), hex("#8ac8e8"), clamp(deep * 0.8 + (fissure ? 0.35 : 0))), hex("#2a6a9a"), fissure && deep > 0.3 ? 0.4 : 0), ICE);
  }
}
// the lake: grey-green, small bergs floating in it
base.rect(0, WL, W, H, (x, y) => mix(hex("#9ab8b4"), hex("#4a6a72"), clamp((y - WL) / 30)), LAKE);

balance(base, 0.5);
const PAL = fitPalette(base, { n: 50, extras: ["#ffffff", "#e8f4ff", "#8ac8e8", "#e84a3a", "#1e2a3a", "#f4f8fc"] });

export const meta = {
  slug: "glacier-calving-front",
  name: "Glacier Calving Front",
  category: "landscapes",
  note: "The towering blue-white front of a glacier meets the lake, and every so often a slab of ice breaks away and crashes in with a great splash as bergs drift and a tour boat watches.",
  tags: ["glacier", "perito-moreno", "patagonia", "ice", "lake", "calving", "wonder", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

const LOOP = 16, CX = 112;

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    // drifting bergs
    for (const [x0, y, w, sp] of [[20, 86, 9, 0.6], [70, 96, 6, 0.4], [150, 90, 12, 0.5], [120, 104, 5, 0.7]]) {
      const x = ((x0 + t * sp) % (W + 20)) - 10;
      f.poly([[x, y], [x + w, y], [x + w - 2, y - 4], [x + 2, y - 5]], (xx, yy) => (yy > y - 2 ? hex("#8ac8e8") : hex("#f4f8fc")));
    }
    // the calving: a slab leans out, drops, splashes, and the wave rings out (every 16 s)
    const ph = t % LOOP;
    if (ph > 4 && ph < 9) {
      const p = clamp((ph - 4) / 2.2), drop = p * p * 34, lean = p * 4;
      for (let y = 50; y < 70; y++) for (let x = CX; x < CX + 12; x++) f.put(x + lean * (70 - y) / 20, Math.min(WL - 1, y + drop), (x + y) % 5 ? "#f4f8fc" : "#8ac8e8");
      for (let y = 50; y < 70; y++) for (let x = CX; x < CX + 12; x++) if (p > 0.05) f.add(x, y, "#2a6a9a", 0.5, ICE);
    }
    if (ph > 6 && ph < 11) {
      const s = (ph - 6) / 5;
      for (let k = 0; k < 40; k++) { const a = (k / 40) * Math.PI, r = s * 26; f.add(CX + 6 + Math.cos(a) * r, WL - Math.sin(a) * r * 0.7 * (1 - s), "#ffffff", (1 - s) * 0.9); }
      for (let x = 0; x < W; x++) { const d = Math.abs(x - CX - 6); if (Math.abs(d - s * 60) < 2) f.add(x, WL + 2 + s * 6, "#ffffff", (1 - s) * 0.7, LAKE); }
    }
    // a red tour boat holding off the front
    const bx = 40 + Math.sin(t * 0.1) * 6;
    f.rect(bx, 100, bx + 20, 104, "#e84a3a"); f.rect(bx + 4, 96, bx + 15, 100, "#ffffff"); for (let k = 0; k < 4; k++) f.put(bx + 6 + k * 2, 98, "#1e2a3a");
    birds(f, t, { n: 4, y: 20, period: 16, c: "#1e2a3a", only: SKY });
    return enc(f);
  };
}
