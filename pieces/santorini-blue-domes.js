/* santorini-blue-domes: white houses and blue domes over the caldera at sunset, hand-built.
 * Painted once: the sunset sky, the deep sea and the far island, the white cubes stepping down the
 * cliff, two blue domes with their bell tower and crosses, bougainvillea. Each frame adds a sailboat
 * crossing the caldera, gulls and a cat strolling along a wall. */
import { fbm, noise2, clamp, lerp, rng } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, clouds, dome, arch, across, boat, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, SEA = 2, CLIFF = 3, HOUSE = 4;
const HOR = 50;

const base = new Canvas();
base.sky([[0, "#4a6aa8"], [0.5, "#c88aa0"], [0.8, "#f6a878"], [1, "#ffd090"]], SKY, 0, HOR + 1);
base.glow(150, 46, 5, 34, "#fff0c0", 0.6, SKY);
base.rect(0, HOR, W, H, (x, y) => {
  const u = (y - HOR) / (H - HOR), path = Math.exp(-((x - 150) ** 2) / (30 + u * 600));
  return mix(mix(hex("#6a8ac0"), hex("#3a5a9a"), clamp(u)), hex("#ffc890"), clamp(path * 0.7));
}, SEA);
// the far island across the caldera
for (let x = 90; x < W; x++) { const h = 5 + fbm(x / 10, 2, 3, 6) * 6; base.rect(x, HOR - h, x + 1, HOR + 1, "#6a5a7a", CLIFF); }
// the cliff on the left falling to the sea
const cliffEdge = (y) => 60 + (y - 30) * 0.9 + fbm(y / 6, 3, 3, 4) * 10;
for (let y = 30; y < H; y++) for (let x = 0; x < Math.min(W, cliffEdge(y)); x++) base.put(x, y, mix(hex("#c8886a"), hex("#7a4a42"), clamp(noise2(x / 4, y / 4, 3) * 0.6 + (y - 30) / 120)), CLIFF);
// white houses stepping down: boxes with flat roofs, lit from the right, shadowed undersides
const R = rng(21);
const houses = [];
for (let row = 0; row < 6; row++) for (let i = 0; i < 6; i++) {
  const x = -6 + i * 14 + row * 6 + Math.floor(R() * 5), y = 34 + row * 12 + Math.floor(R() * 3), w = 10 + Math.floor(R() * 6), h = 7 + Math.floor(R() * 4);
  if (x + w > cliffEdge(y) + 8) continue;
  houses.push([x, y, w, h]);
}
houses.sort((a, b) => a[1] - b[1]);
for (const [x, y, w, h] of houses) {
  base.rect(x, y - h, x + w, y, (xx, yy) => mix(hex("#fffaf2"), hex("#c8c0c8"), clamp((x + w - xx) / w * 0.6 + (yy > y - 2 ? 0.25 : 0))), HOUSE);
  base.rect(x - 1, y - h - 1, x + w + 1, y - h, "#ffffff", HOUSE);
  arch(base, x + 2, y - h + 3, 3, 4, R() < 0.5 ? "#3a6ab8" : "#4a3a40", HOUSE);
}
// the church: two blue domes, a bell tower with arches, crosses
base.rect(98, 40, 132, 58, (x) => mix(hex("#fffaf2"), hex("#c8c0cc"), clamp((132 - x) / 34 * 0.6)), HOUSE);
dome(base, 108, 40, 9, { c: "#4a8ae0", shade: "#1e4a9a", finial: "#f4f0e8", m: HOUSE });
dome(base, 124, 41, 6, { c: "#4a8ae0", shade: "#1e4a9a", finial: "#f4f0e8", m: HOUSE });
base.rect(134, 30, 142, 58, (x) => mix(hex("#fffaf2"), hex("#c8c0cc"), clamp((142 - x) / 8 * 0.5)), HOUSE);
arch(base, 136, 34, 4, 6, "#2a3a6a", HOUSE); arch(base, 136, 44, 4, 6, "#2a3a6a", HOUSE);
base.rect(137, 25, 139, 30, "#f4f0e8", HOUSE); base.rect(136, 26, 140, 27, "#f4f0e8", HOUSE);
// bougainvillea spilling over the walls
for (let i = 0; i < 260; i++) { const x = 20 + R() * 120, y = 40 + R() * 60; if (base.maskAt(x, y) === HOUSE && R() < 0.5) base.put(x, y, R() < 0.5 ? "#e84a9a" : "#c8287a"); }

balance(base);
const PAL = fitPalette(base, { n: 50, extras: ["#ffffff", "#f4f0e8", "#1a1a26", "#e84a9a", "#2a2a2a", "#f6a858"] });

export const meta = {
  slug: "santorini-blue-domes",
  name: "Santorini Blue Domes",
  category: "cities",
  note: "White houses and blue domes step down the cliff over the caldera at sunset while a sailboat crosses the sea and a cat strolls along a wall.",
  tags: ["santorini", "greece", "domes", "island", "sunset", "landmark", "halftone", "sea"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    clouds(f, t, [[0.3, 0.3, 0.2, 1.2, "#f6b490", 0.45], [0.75, 0.26, 0.32, 1, "#d090a8", 0.35]], SKY, 0.75);
    // a sailboat crossing the caldera, its wake behind it
    const bx = W - across(t, 5, 0.6, W, 30), by = 70;
    for (let k = 2; k < 18; k++) f.add(bx + k, by + 0.5, "#f4f0e8", (1 - k / 18) * 0.5, SEA);
    boat(f, bx, by, 9, { hull: "#1a1a26", sail: "#ffffff", sailH: 10, dir: -1 });
    // a cat walking along the church wall, tail up
    const cx = 100 + ((t * 2.5) % 30), cy = 39;
    f.rect(cx, cy - 2, cx + 4, cy, "#2a2a2a"); f.put(cx + 4, cy - 3, "#2a2a2a"); f.put(cx + 5, cy - 3, "#2a2a2a"); f.put(cx - 1, cy - 3, "#2a2a2a"); f.put(cx - 1, cy - 4, "#2a2a2a");
    birds(f, t, { n: 5, y: 18, period: 14, c: "#1a1a26", only: SKY });
    return enc(f);
  };
}
