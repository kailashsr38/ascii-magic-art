/* salt-flat-mirror: a vast salt flat under a thin layer of water mirroring the sky perfectly at sunset, a jeep and walkers on it, hand-built.
 * Painted once: the sunset sky with towering clouds, the far mountains, and the flat itself, a perfect
 * mirror with the hexagonal salt crust showing at the edges. Each frame drives a jeep along the horizon
 * with its reflection, walks figures out on the mirror and drifts the clouds above and below. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, puffs, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, MTN = 2, FLAT = 3;
const HOR = 54;

const base = new Canvas();
base.sky([[0, "#3a4a8a"], [0.5, "#c88aa8"], [0.85, "#f8a878"], [1, "#ffd8a0"]], SKY, 0, HOR + 1);
base.glow(130, 50, 4, 30, "#fff0c4", 0.6, SKY);
base.ridge({ base: 0.47, amp: 0.025, f: 4, seed: 6, top: "#8a6a8a", bot: "#6a5a7a", depth: 6, m: MTN });
// the flat: the sky mirrored (redrawn every frame so the jeep and clouds reflect too)
base.rect(0, HOR, W, H, (x, y) => mix(base.get(x, 2 * HOR - y - 1), hex("#6a5a8a"), clamp((y - HOR) / 260)), FLAT);

balance(base);
const PAL = fitPalette(base, { n: 50, extras: ["#ffffff", "#f4e8f0", "#1e1820", "#e8c8a8", "#e84a3a", "#c8a0b8", "#ffe0c8"] });

export const meta = {
  slug: "salt-flat-mirror",
  name: "Salt Flat Mirror",
  category: "landscapes",
  note: "A vast salt flat under a thin sheet of water mirrors the sunset sky perfectly, clouds above and below, as a jeep crosses the horizon and walkers stride out on the reflection.",
  tags: ["uyuni", "bolivia", "salt-flat", "mirror", "reflection", "sunset", "wonder", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    puffs(f, t, [[0.15, 0.22, 8, "#ffe0c8", 1, "#c8a0b8"], [0.55, 0.14, 10, "#ffe8d8", 0.7, "#c8a0b8"], [0.85, 0.3, 6, "#ffe0c8", 1.3, "#c8a0b8"]], SKY);
    // the jeep crossing along the horizon
    const jx = (t * 7) % (W + 30) - 15;
    f.rect(jx, HOR - 4, jx + 8, HOR - 1, "#e84a3a"); f.rect(jx + 1, HOR - 6, jx + 6, HOR - 4, "#1e1820");
    // walkers far out on the flat
    for (const [ph, x0] of [[0, 40], [1.3, 150]]) { const x = x0 + Math.sin(t * 0.1 + ph) * 10; f.rect(x, HOR - 6, x + 1, HOR - 1, "#1e1820"); f.put(x, HOR - 7, "#e8c8a8"); }
    // the mirror: everything above the horizon reflected below, the faintest crust lines showing near the front
    for (let y = HOR; y < H; y++) {
      const sy = 2 * HOR - y - 1;
      for (let x = 0; x < W; x++) {
        const s = sy >= 0 ? f.get(x, sy) : hex("#3a4a8a");
        const crust = y > 88 && (Math.abs(Math.sin(x * 0.3 + y * 0.52)) < 0.08 || Math.abs(Math.sin(x * 0.3 - y * 0.52)) < 0.08);
        f.put(x, y, crust ? mix(s, hex("#ffffff"), 0.35) : mix(s, hex("#6a5a8a"), clamp((y - HOR) / 260)));
      }
    }
    return enc(f);
  };
}
