/* hill-train-kanchenjunga: the little blue toy train climbing through tea gardens below the snow giant at dawn, hand-built.
 * Painted once: the dawn sky, the great white massif glowing pink, the blue ridges below it, the
 * terraced tea gardens and the hill town on the slope. Each frame runs the steam train along its
 * winding track with puffs of smoke, and adds mist in the valley and birds. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, mist, smoke, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, SNOW = 2, RIDGE = 3, TEA = 4, TOWN = 5;

const base = new Canvas();
base.sky([[0, "#6a7ab0"], [0.5, "#c8a8c4"], [1, "#f8d8c0"]], SKY, 0, 56);
// the snow massif: broad, many-summited, pink in the first light
for (let x = 0; x < W; x++) {
  const top = 30 - Math.max(0, 18 - Math.abs(x - 110) * 0.32) - Math.max(0, 10 - Math.abs(x - 60) * 0.4) + fbm(x / 6, 2, 4, 3) * 6;
  for (let y = Math.floor(top); y < 56; y++) {
    const lit = clamp(0.8 - (y - top) / 30 + (fbm(x / 3, y / 3, 3, 5) - 0.5) * 0.5);
    base.put(x, y, mix(hex("#9a8ab8"), hex("#fff0f0"), lit), SNOW);
  }
}
base.ridge({ base: 0.54, amp: 0.06, f: 3, seed: 4, top: "#6a78a8", bot: "#4a5888", depth: 12, m: RIDGE });
base.ridge({ base: 0.62, amp: 0.06, f: 4, seed: 9, top: "#4a6a7a", bot: "#2e4a5a", depth: 12, m: RIDGE });
// the tea garden slope: rows of rounded bushes following the contour
const slope = (x) => 68 + (x / W) * 10 + Math.sin(x / 30) * 3;
for (let x = 0; x < W; x++) for (let y = Math.floor(slope(x)); y < H; y++) {
  const row = Math.sin((y - slope(x)) * 1.4 + Math.sin(x * 0.08) * 1.5);
  base.put(x, y, mix(mix(hex("#c4e888"), hex("#6a9a4a"), clamp(row * 0.5 + 0.5)), hex("#4a7a3a"), clamp((y - slope(x)) / 80)), TEA);
}
// the hill town on the left: houses with coloured roofs stacked on the slope
for (let i = 0; i < 26; i++) {
  const x = 4 + (i * 13) % 70, y = slope(x) - 2 + (i % 4) * 3, w = 5 + (i % 3) * 2;
  base.rect(x, y - 4, x + w, y + 1, (xx) => mix(hex("#f4f0e8"), hex("#a8a0a0"), (xx - x) / w), TOWN);
  base.rect(x - 1, y - 5, x + w + 1, y - 4, ["#c84a3a", "#3a7ab8", "#3a9a6a", "#e8a83a"][i % 4], TOWN);
}

balance(base);
const PAL = fitPalette(base, { n: 50, extras: ["#4a90f0", "#2a5aa8", "#1e1e28", "#e8e0d8", "#ffd27a", "#5a3a2a", "#ffffff"] });

export const meta = {
  slug: "hill-train-kanchenjunga",
  name: "Hill Train Kanchenjunga",
  category: "india",
  note: "The little blue steam train climbs its winding track through tea gardens below the snow giant glowing pink at dawn, puffing smoke as mist fills the valley.",
  tags: ["darjeeling", "toy-train", "himalaya", "kanchenjunga", "tea", "dawn", "india", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

// the track: a gentle S across the slope
const track = (x) => slope(x) + 14 - Math.sin(x / 26) * 4;

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    mist(f, t, { y0: 54, y1: 72, c: "#e8e0d8", a: 0.55, speed: 0.04, scale: 30, cut: 0.45 });
    for (let x = 0; x < W; x++) f.put(x, track(x) + 1, "#5a3a2a");
    // the train: a little blue engine and three coaches, chuffing along
    const ex = ((t * 9) % (W + 90)) - 10;
    for (let c = 0; c < 4; c++) {
      const cx = ex - c * 15, cy = track(cx), w = c === 0 ? 12 : 13;
      if (cx < -15 || cx > W + 15) continue;
      f.rect(cx - w, cy - 7, cx, cy, "#4a90f0");
      f.rect(cx - w, cy - 8, cx, cy - 7, "#ffffff");
      f.rect(cx - w, cy - 1, cx, cy, "#2a5aa8");
      if (c > 0) for (let wx = cx - w + 2; wx < cx - 1; wx += 3) f.rect(wx, cy - 5, wx + 1, cy - 3, "#ffd27a");
      else { f.rect(cx - 4, cy - 10, cx - 1, cy - 6, "#1e1e28"); }
      f.put(cx - w + 2, cy + 1, "#1e1e28"); f.put(cx - 2, cy + 1, "#1e1e28");
    }
    smoke(f, t, ex - 3, track(ex) - 11, { c: "#e8e0d8", n: 7, rise: 3, drift: -2.5, size: 2.2, a: 0.6 });
    birds(f, t, { n: 5, y: 14, period: 16, c: "#1e1e28", only: SKY });
    return enc(f);
  };
}
