/* tulip-fields-windmill: stripes of tulips in every colour running to a windmill whose sails turn against a big sky, hand-built.
 * Painted once: the wide sky, the flat horizon with its tree line and farm, the windmill's tapering body
 * and cap, and the bands of tulips in pink, yellow, white, coral and lilac converging on it, green
 * leaves between the rows. Each frame turns the sails, drifts the clouds, rides a cyclist along the
 * path, and flies birds. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, puffs, person, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, FAR = 2, MILL = 3, FIELD = 4, PATH = 5;
const HOR = 54, MX = 128, VX = 118;

const base = new Canvas();
base.sky([[0, "#5a94d4"], [0.7, "#a8cce8"], [1, "#e4eef4"]], SKY, 0, HOR + 1);
// the flat horizon: a tree line, a farmhouse, a far church spire
for (let x = 0; x < W; x++) { const top = HOR - 3 - Math.max(0, fbm(x / 5, 1, 2, 3) * 4 - 1); for (let y = Math.floor(top); y < HOR + 1; y++) base.put(x, y, "#4a6a4a", FAR); }
base.rect(30, HOR - 7, 42, HOR, "#c87a6a", FAR); base.poly([[29, HOR - 7], [43, HOR - 7], [36, HOR - 12]], "#5a4a48", FAR); base.rect(166, HOR - 14, 168, HOR, "#5a5a68", FAR);
// the windmill: tapering octagonal body, the gallery around its waist, the thatched cap
for (let y = 22; y < HOR + 2; y++) { const w = lerp(5, 10, (y - 22) / 32); base.rect(MX - w, y, MX + w, y + 1, (x) => mix(hex("#6a5a52"), hex("#3a302c"), clamp((x - MX + w) / (2 * w))), MILL); }
base.rect(MX - 11, 40, MX + 11, 41, "#2a2420", MILL);
base.ellipse(MX, 22, 6, 3.5, "#4a3a32", MILL);
base.rect(MX - 2, HOR - 6, MX + 2, HOR + 2, "#f4ead8", MILL); base.rect(MX - 3, 30, MX - 1, 33, "#f4ead8", MILL);
// the tulip fields: coloured bands radiating from the vanishing point, leaves between
const COLS = ["#f8a8c8", "#f8e070", "#ffffff", "#f8a088", "#d0b0f0", "#f8c8a0", "#f890a8"].map(hex);
base.rect(0, HOR + 1, W, H, (x, y) => {
  const d = (y - HOR) / (H - HOR), a = (x - VX) / Math.max(0.5, y - HOR + 1), band = Math.floor(a * 2.2 + 50), within = (a * 2.2 + 50) % 1;
  if (within < 0.2 + 0.1 * (1 - d)) return mix(hex("#5a8a4a"), hex("#3a6a3a"), d);
  return mix(COLS[band % COLS.length], hex("#ffffff"), clamp((1 - d) * 0.25));
}, FIELD);
// a farm path running toward the mill
for (let y = HOR + 1; y < H; y++) { const w = 0.5 + (y - HOR) * 0.08, x = VX - 2 - (y - HOR) * 0.9; base.rect(x - w, y, x + w, y + 1, "#d8c8a8", PATH); }

balance(base, 0.4);
const PAL = fitPalette(base, { n: 50, extras: ["#ffffff", "#2a2420", "#f4ead8", "#3a6aa8", "#e86a4a", "#e8c8a0"] });

export const meta = {
  slug: "tulip-fields-windmill",
  name: "Tulip Fields Windmill",
  category: "landscapes",
  note: "Stripes of tulips in pink, yellow, white, coral and lilac run to a windmill whose sails turn against a big sky as a cyclist rides the farm path.",
  tags: ["tulips", "windmill", "netherlands", "fields", "spring", "flowers", "nature", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    puffs(f, t, [[0.15, 0.12, 6, "#ffffff", 0.8, "#dce6f0"], [0.55, 0.08, 5, "#ffffff", 0.6, "#dce6f0"], [0.85, 0.22, 4, "#ffffff", 0.7, "#dce6f0"]], SKY);
    // the sails: four lattice blades turning around the hub (one turn every 8 s)
    const a0 = (t / 8) * Math.PI * 2, hx = MX, hy = 24;
    for (let k = 0; k < 4; k++) {
      const a = a0 + (k * Math.PI) / 2, ca = Math.cos(a), sa = Math.sin(a), px = -sa, py = ca;
      for (let r = 2; r < 24; r++) {
        f.put(hx + ca * r, hy + sa * r, "#2a2420");
        if (r > 5) for (let w = 1; w < 5; w++) f.put(hx + ca * r + px * w, hy + sa * r + py * w, (r + w) % 3 === 0 ? "#2a2420" : "#f4ead8");
      }
    }
    f.rect(hx - 1, hy - 1, hx + 2, hy + 2, "#2a2420");
    // a cyclist riding the path toward the mill and shrinking into the distance (20 s)
    const p = (t % 20) / 20, y = lerp(H - 2, HOR + 4, p), s = lerp(1.6, 0.5, p), x = VX - 2 - (y - HOR) * 0.9, sp = Math.floor(t * 6) % 2;
    f.rect(x - 1 * s, y - 6 * s, x + 1 * s, y - 3 * s, "#e86a4a"); f.rect(x - 0.5 * s, y - 7.5 * s, x + 1 * s, y - 6 * s, "#e8c8a0");
    for (const dx of [-2.5, 2.5]) { f.put(x + dx * s - 1, y - 1, "#2a2420"); f.put(x + dx * s + 1, y - 1, "#2a2420"); f.put(x + dx * s, y - 2 + sp, "#2a2420"); f.put(x + dx * s, y, "#2a2420"); }
    f.line(x - 2.5 * s, y - 1, x + 2.5 * s, y - 1, "#2a2420", 1);
    birds(f, t, { n: 5, y: 12, period: 16, c: "#2a2420", only: SKY });
    return enc(f);
  };
}
