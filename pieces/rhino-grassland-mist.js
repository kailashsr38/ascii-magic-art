/* rhino-grassland-mist: one-horned rhinos grazing in tall elephant grass on a misty morning, egrets riding their backs, hand-built.
 * Painted once: the pale morning sky with the sun a soft disc in the haze, the far forest line, the
 * swamp pool reflecting the light, and the tall pale-gold grass in waves across the plain. Each frame
 * moves the rhinos as they graze, lifts and settles the egrets, drifts the mist through the grass,
 * sways the grass heads and walks an elephant safari along the far edge. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, mist, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, TREES = 2, POOL = 3, GRASS = 4;
const HOR = 50;

const base = new Canvas();
base.sky([[0, "#b8c4d4"], [0.7, "#e8e4dc"], [1, "#f4ecd8"]], SKY, 0, HOR + 1);
base.glow(140, 26, 6, 26, "#fff8e8", 0.6, SKY);
// the far forest, faint in the mist
for (let x = 0; x < W; x++) { const top = HOR - 8 - fbm(x / 7, 2, 3, 5) * 8 - (Math.abs(Math.sin(x / 9)) * 4); for (let y = Math.floor(top); y < HOR + 1; y++) base.put(x, y, mix(hex("#c8d0c4"), hex("#b4bcb0"), (y - top) / 16), TREES); }
// the plain: a swamp pool in the middle distance, the tall grass in bands of gold and green
base.rect(0, HOR, W, H, (x, y) => { const n = fbm(x / 9, y / 3, 3, 2), stalk = Math.sin(x * 1.7 + n * 6) > 0.2; return mix(mix(hex("#f4e8b8"), hex("#d4cc94"), clamp((y - HOR) / 50 + n * 0.3)), hex("#7a7c4e"), stalk ? 0.5 : 0); }, GRASS);
for (let y = 58; y < 66; y++) for (let x = 20; x < 120; x++) { const d = Math.hypot((x - 70) / 50, (y - 62) / 4) + fbm(x / 6, y, 2, 3) * 0.2; if (d < 1) base.put(x, y, mix(hex("#f0ece0"), hex("#c8ccc8"), (y - 58) / 8), POOL); }

balance(base, 0.3);
const PAL = fitPalette(base, { n: 48, extras: ["#ffffff", "#5a5456", "#3e383a", "#2a2426", "#e8c8a0", "#a8a0a0", "#2a2622", "#f2c84a"] });

export const meta = {
  slug: "rhino-grassland-mist",
  name: "Rhino Grassland Mist",
  category: "india",
  note: "One-horned rhinos graze in tall elephant grass on a misty morning, white egrets riding their backs and lifting off, as a safari elephant walks the far edge of the plain.",
  tags: ["kaziranga", "rhino", "one-horned-rhino", "grassland", "assam", "egrets", "india", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

// a one-horned rhino side-on, facing dir: armoured plates, low head, the horn, small ears
function rhino(f, x, y, s, dir, graze) {
  const c = "#5a5456", d = "#3e383a";
  f.ellipse(x, y - 6 * s, 9 * s, 5 * s, c);
  for (const k of [-4, 3]) f.line(x + k * s, y - 10 * s, x + k * s, y - 2 * s, d, 1);
  const hx = x + dir * 10 * s, hy = y - (4 - graze * 2) * s;
  f.ellipse(hx, hy, 3.6 * s, 2.6 * s, c);
  f.line(hx + dir * 3 * s, hy - s, hx + dir * 3 * s, hy - 4 * s, "#2a2426", Math.max(1, Math.round(s)));
  f.put(hx - dir * 2 * s, hy - 3 * s, d);
  for (const lx of [-6, -3, 4, 7]) f.rect(x + lx * s - s, y - 2 * s, x + lx * s + s, y, d);
}

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    // a safari elephant walking the far edge of the plain, riders aboard
    const ex = ((t * 2) % (W + 30)) - 15;
    f.ellipse(ex, HOR + 1, 4, 2.4, "#a8a0a0"); f.ellipse(ex + 4, HOR, 1.8, 1.8, "#a8a0a0"); f.rect(ex - 2, HOR - 4, ex + 2, HOR - 1, "#e8c8a0");
    // the rhinos grazing: heads dipping into the grass and lifting, shuffling slowly forward
    for (const [x0, y, s, dir, ph] of [[60, 92, 1.4, 1, 0], [138, 84, 1.1, -1, 2], [100, 72, 0.7, 1, 4]]) {
      const graze = (Math.sin(t * 0.7 + ph) + 1) / 2, x = x0 + Math.sin(t * 0.08 + ph) * 6 * dir;
      rhino(f, Math.round(x), y, s, dir, graze);
    }
    // egrets riding on the rhinos' backs, lifting off and settling (12 s)
    for (const [x0, y, ph] of [[58, 79, 0], [140, 74, 6]]) {
      const q = ((t + ph) % 12) / 12, fly = q > 0.7, h = fly ? Math.sin((q - 0.7) / 0.3 * Math.PI) * 10 : 0, x = x0 + (fly ? Math.sin((q - 0.7) / 0.3 * Math.PI) * 8 : 0), up = Math.sin(t * 10) > 0;
      f.rect(x, y - h, x + 2, y - h + 1, "#ffffff"); f.put(x + 2, y - h - 1, "#ffffff"); f.put(x + 3, y - h - 1, "#f2c84a");
      if (fly) { f.put(x - 1, y - h - (up ? 1 : -1), "#ffffff"); f.put(x + 1, y - h - (up ? 2 : -1), "#ffffff"); }
    }
    // the grass in front of them, its heads swaying in the breeze
    for (let x = 0; x < W; x += 2) { const y = 100 + (x * 7) % 8, sw = Math.round(Math.sin(t * 1.2 + x * 0.15) * 1.5); f.line(x, H, x + sw, y, "#b8ac70", 1); f.put(x + sw, y - 1, "#f4ecd8"); }
    mist(f, t, { y0: 36, y1: 86, c: "#ffffff", a: 0.5, speed: 0.05, scale: 26, cut: 0.42 });
    return enc(f);
  };
}
