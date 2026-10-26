/* andaman-teal-beach: a white island beach on teal water at sunset, tall forest at its edge and an elephant swimming in the shallows, hand-built.
 * Painted once: the warm sunset sky, the sea grading from deep teal to clear turquoise over the sand,
 * the curve of white beach, and the tall forest along it, trunks pale against the shadow. Each frame
 * rolls the surf in, swims the elephant across with its trunk up, puts a boat on the horizon, walks
 * two people along the waterline and flies birds home. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, puffs, surf, person, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, SEA = 2, SAND = 3, FOREST = 4;
const HOR = 44;

const base = new Canvas();
base.sky([[0, "#88b0dc"], [0.5, "#c8c0d0"], [0.85, "#ffc8a0"], [1, "#ffe0b0"]], SKY, 0, HOR + 1);
base.glow(118, 40, 4, 30, "#fff4d0", 0.6, SKY);
// the sea: deep teal far out, turquoise and clear over the sand
const shore = (x) => 78 + Math.sin(x / 40 + 0.6) * 6 + x * 0.08;
base.rect(0, HOR, W, H, (x, y) => { const d = clamp((y - HOR) / (shore(x) - HOR)); return mix(mix(hex("#3a8a98"), hex("#58c0c0"), d), hex("#a8ecdc"), clamp((d - 0.75) * 4)); }, SEA);
// the white sand, curving away
for (let x = 0; x < W; x++) for (let y = Math.floor(shore(x)); y < H; y++) base.put(x, y, mix(hex("#fff8ec"), hex("#e0d0b8"), clamp((y - shore(x)) / 30 + fbm(x / 6, y / 3, 2, 3) * 0.2)), SAND);
// the tall forest along the left of the beach: a high canopy of rounded crowns stepping down to the sand, pale trunks in a thin band of shade
const CANOPY = (x) => 10 + x * 0.3 + fbm(x / 6, 2, 3, 7) * 8 - Math.abs(Math.sin(x / 7.5)) * 5 + Math.max(0, x - 50) * 1.5;
for (let x = 0; x < 84; x++) {
  const top = CANOPY(x), bot = Math.min(shore(x) - 1, 68 + x * 0.3), mid = Math.max(top + 6, bot - 9);
  if (top > bot - 2) continue;
  for (let y = Math.floor(top); y < bot; y++) {
    const n = noise2(x / 2.5, y / 2.5, 4);
    base.put(x, y, y < mid ? mix(hex("#9ac86a"), hex("#4a7a44"), clamp((y - top) / 24 + n * 0.45)) : mix(hex("#5a7a52"), hex("#48684a"), n), FOREST);
  }
}
for (const [x, lean] of [[6, 0.1], [17, -0.05], [31, 0.12], [44, 0.04]]) {
  const y1 = Math.min(shore(x) - 1, 68 + x * 0.3), y0 = y1 - 12;
  for (let y = Math.floor(y0); y < y1; y++) base.put(x + (y - y0) * lean, y, "#e8e0d0", FOREST);
}
balance(base);
const PAL = fitPalette(base, { n: 48, extras: ["#ffffff", "#f4fcfa", "#8a7a7a", "#6a5a5a", "#f08a5a", "#f2c84a", "#2a2420", "#c8d8e0"] });

export const meta = {
  slug: "andaman-teal-beach",
  name: "Andaman Teal Beach",
  category: "india",
  note: "An elephant swims through clear teal shallows off a white island beach at sunset, the tall forest standing at the sand's edge and the surf rolling in.",
  tags: ["andaman", "havelock", "beach", "island", "elephant", "teal-water", "india", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    puffs(f, t, [[0.55, 0.12, 5, "#fff4ec", 0.6, "#f0c8b8"], [0.9, 0.2, 4, "#fff4ec", 0.5, "#f0c8b8"]], SKY);
    surf(f, t, 66, 92, { foam: "#ffffff", n: 3, period: 5.5, only: SEA, wob: 2 });
    // the elephant swimming: head and the ridge of the back above water, trunk raised like a snorkel (40 s)
    const ex = lerp(W + 14, 60, (t % 40) / 40), ey = 62 + Math.sin(t * 1.2) * 0.6;
    for (let k = 1; k < 18; k++) f.add(ex + k * 1.5, ey + 1 + (k % 2), "#f4fcfa", (1 - k / 18) * 0.6, SEA);
    f.ellipse(ex + 4, ey, 5, 1.6, "#8a7a7a"); f.ellipse(ex - 2, ey - 1, 3, 2.4, "#8a7a7a");
    f.rect(ex - 3, ey - 2, ex - 1, ey - 1, "#6a5a5a");
    f.line(ex - 5, ey - 1, ex - 6, ey - 6 + Math.sin(t * 0.8) * 0.6, "#8a7a7a", 1);
    for (let k = -4; k < 10; k++) f.add(ex + k, ey + 1, "#ffffff", 0.7, SEA);
    // a boat far out on the horizon
    const bx = across(t, 2.2, 0.3);
    f.rect(bx - 3, HOR + 2, bx + 3, HOR + 3, "#2a2420"); f.rect(bx - 1, HOR, bx + 1, HOR + 2, "#f4f0e8");
    // two people strolling along the waterline
    for (let i = 0; i < 2; i++) { const x = lerp(170, 90, ((t / 34) + i * 0.04) % 1), y = Math.round(shore(x) + 5 + i); person(f, x + i * 3, y, { body: i ? "#f08a5a" : "#f2c84a", head: "#6a5a5a", step: Math.floor(t * 3 + i) }); }
    birds(f, t, { n: 5, y: 16, period: 16, c: "#2a2420", only: SKY });
    return enc(f);
  };
}

function across(t, speed, phase) { const span = W + 40; return ((phase * span + t * speed) % span) - 20; }
