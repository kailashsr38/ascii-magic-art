/* giraffes-below-peak: giraffes browsing the acacias on the savanna below the snow-capped volcano at sunrise, hand-built.
 * Painted once: the sunrise sky, the great flat-topped volcano with its snow cap floating above a band of
 * cloud, the golden grassland and flat-topped acacias. Each frame walks giraffes across browsing, sways
 * their necks, drifts the cloud band and flies a flock of birds. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, mist, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, MTN = 2, GRASS = 3, TREE = 4;
const HOR = 72;

const base = new Canvas();
base.sky([[0, "#6a7ab8"], [0.5, "#e8a8a0"], [0.85, "#ffc888"], [1, "#ffe0a8"]], SKY, 0, HOR + 1);
// the volcano: broad flanks, flat summit, the snow cap catching the sunrise
for (let x = 0; x < W; x++) {
  const d = Math.abs(x - 110), top = d < 24 ? 26 + fbm(x / 4, 1, 2, 3) * 2 : 26 + Math.pow((d - 24) / 70, 0.85) * 46;
  const snowLine = 34 + fbm(x / 3, 2, 3, 5) * 6; // per column: the snow's lower edge
  for (let y = Math.floor(top); y < HOR; y++) {
    const snow = y < snowLine && d < 40;
    base.put(x, y, snow ? mix(hex("#fff4f0"), hex("#e0c8d8"), clamp((x - 100) / 40)) : mix(hex("#c8a8c0"), hex("#8a7aa0"), clamp((y - top) / 40 + (x - 110) / 300)), MTN);
  }
}
// the grassland: gold, with a darker band of bush in the middle distance
base.rect(0, HOR, W, H, (x, y) => {
  const u = (y - HOR) / (H - HOR), n = fbm(x / 4, y / 2, 3, 6);
  return mix(mix(hex("#e8c070"), hex("#a87a3a"), clamp(u)), hex("#6a6a3a"), y < HOR + 5 ? 0.5 : n > 0.6 ? 0.35 : 0);
}, GRASS);
// flat-topped acacias
const acacia = (x, y, s) => {
  base.line(x, y, x - 1 * s, y - 10 * s, "#2a1e18", Math.max(1, s), TREE);
  base.line(x - 1 * s, y - 10 * s, x - 6 * s, y - 14 * s, "#2a1e18", 1, TREE); base.line(x - 1 * s, y - 10 * s, x + 5 * s, y - 15 * s, "#2a1e18", 1, TREE);
  base.ellipse(x, y - 15 * s, 13 * s, 2.6 * s, (xx, yy) => mix(hex("#4a5a2a"), hex("#2a361a"), clamp((yy - (y - 15 * s)) / (3 * s) + 0.3)), TREE);
};
acacia(22, 98, 1.3); acacia(184, 88, 0.8); acacia(150, 80, 0.5);

balance(base);
const PAL = fitPalette(base, { n: 48, extras: ["#f0b860", "#d89a4a", "#5a3a22", "#1e1612", "#fff4f0", "#f0d8a8"] });

export const meta = {
  slug: "giraffes-below-peak",
  name: "Giraffes Below The Peak",
  category: "landscapes",
  note: "Giraffes browse the flat-topped acacias on the golden savanna below the snow-capped volcano at sunrise as a band of cloud drifts across its flanks.",
  tags: ["kilimanjaro", "savanna", "giraffe", "africa", "sunrise", "wildlife", "wonder", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

// a giraffe: patterned body, long legs, a neck that sways up and down as it browses
function giraffe(f, x, y, s, ph, dir) {
  const c = "#f0b860", spot = "#5a3a22", bob = Math.sin(ph) * 2 * s;
  f.rect(x - 5 * s, y - 16 * s, x + 5 * s, y - 11 * s, c);
  for (let k = 0; k < 6; k++) f.put(x - 4 * s + k * 1.7 * s, y - 14 * s + (k % 2) * s, spot);
  for (const lx of [-4, -2, 2, 4]) f.rect(x + lx * s, y - 11 * s, x + lx * s + Math.max(1, s * 0.8), y, c);
  const nx = x + dir * 4 * s, ny = y - 16 * s;
  f.line(nx, ny, nx + dir * 4 * s, ny - 12 * s + bob, c, Math.max(1, Math.round(s * 1.2)));
  f.rect(nx + dir * 3 * s, ny - 14 * s + bob, nx + dir * 7 * s, ny - 11 * s + bob, c);
  f.put(nx + dir * 4 * s, ny - 15 * s + bob, spot); f.line(x - dir * 5 * s, y - 15 * s, x - dir * 7 * s, y - 10 * s, spot, 1);
}

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    mist(f, t, { y0: 46, y1: 62, c: "#f0d8a8", a: 0.6, speed: 0.04, scale: 28, cut: 0.42 });
    giraffe(f, 66 + Math.sin(t * 0.05) * 16, 104, 2.2, t * 0.6, 1);
    giraffe(f, 124 + Math.sin(t * 0.04 + 2) * 12, 96, 1.6, t * 0.7 + 1, -1);
    giraffe(f, 100 + Math.sin(t * 0.06 + 4) * 8, 88, 1, t * 0.5 + 2, 1);
    birds(f, t, { n: 7, y: 20, period: 15, c: "#1e1612", only: SKY });
    return enc(f);
  };
}
