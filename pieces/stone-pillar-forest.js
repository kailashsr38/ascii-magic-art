/* stone-pillar-forest: towering sandstone pillars crowned with pines rising out of a sea of cloud, a cable car crossing, hand-built.
 * Painted once: the bright sky, ranks of pillars from faint and far to tall and near, striated and
 * cracked, pines clinging to their tops and ledges, and the sea of cloud filling the gorges. Each frame
 * flows the clouds between the pillars, runs a cable car along its line and flies birds through the gaps. */
import { fbm, noise2, clamp, lerp, rng } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, mist, pine, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, PILLAR = 2, CLOUD = 3, PINE = 4;

const base = new Canvas();
base.sky([[0, "#7aaad8"], [0.6, "#c8dcec"], [1, "#eef4f4"]], SKY, 0, H);
const R = rng(12);
// the pillars, far to near: tall columns, lit on the left, vertical striations, crack bands, pines on top
for (const [far, n, top0, bottom] of [[0.85, 16, 30, 80], [0.6, 10, 18, 92], [0.3, 7, 8, 108], [0, 4, -4, 108]]) {
  const lit = mix(hex("#e0c8a8"), hex("#c8d4e0"), far), sh = mix(hex("#8a7a6a"), hex("#a8b4c4"), far);
  for (let i = 0; i < n; i++) {
    const cx = ((i + R()) / n) * W, w = (4 + R() * 6) * (1.6 - far), top = top0 + R() * 20 * (1 - far * 0.3);
    for (let x = Math.floor(cx - w / 2); x <= cx + w / 2; x++) {
      const u = (x - cx + w / 2) / w, t0 = top + Math.abs(u - 0.5) * 4 + fbm(x / 2, i, 2, i) * 3;
      for (let y = Math.floor(t0); y < bottom; y++) {
        const crack = Math.abs(Math.sin(y * 0.35 + i * 2)) < 0.08 || noise2(x / 1.5, y / 8, i) > 0.7;
        base.put(x, y, mix(mix(lit, sh, clamp(u * 0.9 + Math.sin(x * 2.1) * 0.08)), sh, crack ? 0.6 : 0), PILLAR);
      }
    }
    // pines along the crown
    for (let k = 0; k < w; k += 2) pine(base, cx - w / 2 + k, top + Math.abs(k / w - 0.5) * 4 + 2, 3 + ((k + i) % 3) * (2 - far), far > 0.5 ? "#8aa494" : "#3a6a3a", PINE);
  }
  // cloud filling the gorges in front of this rank
  for (let y = bottom - 18; y < H; y++) for (let x = 0; x < W; x++) {
    const n = fbm(x / 14, y / 5 + far * 9, 3, 7 + far * 10), a = clamp((y - bottom + 18) / 14) * clamp((n - 0.32) * 2.6);
    if (a > 0.02) base.add(x, y, "#f8fafc", a, undefined);
  }
}
for (let i = 0; i < W * H; i++) if (base.mask[i] === 0) base.mask[i] = CLOUD;

balance(base, 0.45);
const PAL = fitPalette(base, { n: 50, extras: ["#ffffff", "#2a2a2a", "#e86a4a", "#f2c84a", "#4a4a4a"] });

export const meta = {
  slug: "stone-pillar-forest",
  name: "Stone Pillar Forest",
  category: "landscapes",
  note: "Towering sandstone pillars crowned with pines rise out of a sea of cloud that flows between them, a cable car gliding across the gorge and birds threading the gaps.",
  tags: ["zhangjiajie", "pillars", "sandstone", "sea-of-clouds", "cable-car", "mountains", "wonder", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    mist(f, t, { y0: 58, y1: 96, c: "#ffffff", a: 0.7, speed: 0.08, scale: 30, cut: 0.4 });
    mist(f, t, { y0: 84, y1: H, c: "#ffffff", a: 0.6, speed: 0.12, scale: 24, cut: 0.38, seed: 8 });
    // the cable car's line across the gorge, the cabin running along it (20 s each way)
    f.line(0, 22, W, 40, "#4a4a4a", 1);
    const p = (t % 40) / 20, u = p < 1 ? p : 2 - p, x = lerp(10, W - 14, u), y = lerp(22, 40, x / W);
    f.line(x + 2, y, x + 2, y + 4, "#4a4a4a", 1); f.rect(x - 1, y + 4, x + 6, y + 9, "#e86a4a"); f.rect(x, y + 5, x + 5, y + 7, "#f2c84a");
    birds(f, t, { n: 5, y: 48, period: 15, c: "#2a2a2a", spread: 1.2 });
    return enc(f);
  };
}
