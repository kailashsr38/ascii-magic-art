/* leaning-tower-square: the white marble bell tower leaning over its lawn on a summer afternoon, hand-built.
 * Painted once: the blue sky, the cathedral's arcaded flank and dome, the tilted tower with its eight
 * rings of arches, the green lawn and the path. Each frame adds clouds, tourists walking and posing,
 * and pigeons. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, puffs, person, across, birds, arch, dome, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, DUOMO = 2, TOWER = 3, LAWN = 4;
const BASEY = 84, TILT = 0.085; // the lean: pixels across per pixel up

const base = new Canvas();
base.sky([[0, "#5a9ae0"], [0.5, "#86b8e8"], [1, "#d0e4f4"]], SKY, 0, BASEY);
// the cathedral on the left: arcaded marble flank, a dome behind
dome(base, 34, 42, 13, { c: "#f4eee4", shade: "#a8a098", finial: "#c8b070", m: DUOMO });
base.rect(30, 30, 39, 42, "#e8e0d4", DUOMO);
base.rect(0, 44, 70, BASEY, (x, y) => mix(hex("#f8f2e8"), hex("#b8b0a8"), clamp((x / 70) * 0.5 + ((y - 44) % 9 < 1 ? 0.3 : 0))), DUOMO);
base.poly([[0, 44], [70, 44], [62, 36], [0, 36]], (x) => mix(hex("#d8d0c4"), hex("#9a948e"), x / 70), DUOMO);
for (let row = 0; row < 3; row++) for (let x = 3; x < 68; x += 6) arch(base, x, 48 + row * 11, 3, 7, "#5a5458", DUOMO);
// the tower: a cylinder of eight arcaded storeys, tilted, lit from the left
const CX0 = 118, R0 = 14, HT = 72;
const cxAt = (y) => CX0 + (BASEY - y) * TILT;
for (let y = BASEY - HT; y <= BASEY; y++) {
  const cx = cxAt(y), top = y < BASEY - HT + 9, r = top ? R0 - 3 : R0;
  const storey = Math.floor((BASEY - y) / 8), inStorey = (BASEY - y) % 8;
  for (let x = Math.floor(cx - r); x <= cx + r; x++) {
    const u = (x - cx) / r; // -1 left .. 1 right
    const light = clamp(0.95 - (u + 1) * 0.42);
    let c = mix(hex("#9a948c"), hex("#fffaf0"), light);
    if (inStorey === 0 || inStorey === 1) c = mix(c, hex("#d8d0c4"), 0.4);                       // the cornice band
    else if (storey > 0 && !top && Math.round((u + 1) * 5) % 2 === 0 && inStorey > 2) c = mix(c, hex("#5a5458"), 0.55 + (u > 0 ? 0.2 : 0)); // the arcade's dark gaps
    base.put(x, y, c, TOWER);
  }
}
base.rect(cxAt(BASEY - HT) - 6, BASEY - HT - 3, cxAt(BASEY - HT) + 6, BASEY - HT, "#e8e0d4", TOWER); // the bell chamber's top
// a dark line of pines and hedge behind the lawn
for (let x = 70; x < W; x++) { const h = 3 + Math.round(fbm(x / 5, 2, 3, 9) * 5); base.rect(x, BASEY - h, x + 1, BASEY + 1, (xx, y) => mix(hex("#3e5a32"), hex("#24361e"), (y - BASEY + h) / (h + 1)), LAWN); }
for (const x of [76, 88, 172, 184]) for (let i = 0; i < 16; i++) { const w = Math.max(0.5, (16 - i) * 0.22); for (let d = -Math.floor(w); d <= w; d++) base.put(x + d, BASEY - i, "#2a3e24", LAWN); }
// the lawn and the path
base.rect(0, BASEY, W, H, (x, y) => {
  const path = Math.abs(x - 96 - (y - BASEY) * 0.8) < 10 + (y - BASEY) * 0.6;
  const n = fbm(x / 7, y / 3, 3, 4);
  const shadow = x > 120 && x < 168 && Math.abs((y - BASEY) * 1.6 - (x - 120)) < 14 - (x - 120) * 0.1; // the tower's shadow across the lawn
  const g = path ? mix(hex("#f0e4cc"), hex("#d0c0a4"), n) : mix(hex("#9ccc5c"), hex("#6a9a40"), clamp((y - BASEY) / 30 + n * 0.4));
  return shadow ? mix(g, hex("#2e4a24"), 0.6) : g;
}, LAWN);

balance(base);
const PAL = fitPalette(base, { n: 50, extras: ["#ffffff", "#e8eef4", "#c84a3a", "#2a5a9a", "#f2c84a", "#2a2228", "#e8c8a0"] });

export const meta = {
  slug: "leaning-tower-square",
  name: "Leaning Tower Square",
  category: "cities",
  note: "The white marble bell tower leans over its green lawn beside the cathedral on a summer afternoon, clouds drifting, tourists strolling and posing.",
  tags: ["pisa", "leaning-tower", "italy", "landmark", "summer", "halftone", "tourists", "marble"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

const WALKERS = [[0.1, 6, 1, "#c84a3a"], [0.45, 5, -1, "#2a5a9a"], [0.7, 7, 1, "#f2c84a"], [0.25, 4, -1, "#ffffff"]];

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    puffs(f, t, [[0.1, 0.18, 6, "#ffffff", 1.2, "#e8eef4"], [0.55, 0.12, 5, "#ffffff", 0.9, "#e8eef4"], [0.85, 0.3, 4, "#ffffff", 1.5, "#e8eef4"]], SKY);
    WALKERS.forEach(([ph, sp, dir, c], i) => {
      const u = across(t, sp, ph), x = dir > 0 ? u : W - u, y = 92 + i * 4;
      person(f, x, y, { body: c, step: Math.floor(t * 4 + i) });
    });
    // two tourists posing to "hold up" the tower, arms raised
    for (const [x, c] of [[150, "#c84a3a"], [158, "#2a5a9a"]]) { person(f, x, 98, { body: c }); f.put(x - 1, 94 - (Math.floor(t * 0.5) % 2), "#e8c8a0"); }
    birds(f, t, { n: 5, y: 20, period: 13, c: "#2a2228", only: SKY });
    return enc(f);
  };
}
