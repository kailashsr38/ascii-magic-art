/* lake-palace-udaipur: the white marble palace floating on the lake at sunset, the city palace and the Aravalli hills behind, hand-built.
 * Painted once: the sunset sky, the hills, the long city palace on the shore with its towers and
 * balconies, the lake, the island palace with domed pavilions and arches, mirrored in the still water.
 * Each frame adds boats ferrying across with their wakes, pigeons wheeling and the lamps coming on. */
import { fbm, noise2, clamp, lerp, rng } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, clouds, dome, arch, across, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, HILL = 2, SHORE = 3, LAKE = 4, PALACE = 5;
const WL = 62, PX = 104;

const base = new Canvas();
base.sky([[0, "#5a5a98"], [0.45, "#d08aa0"], [0.8, "#f8a878"], [1, "#ffd498"]], SKY, 0, WL);
base.glow(40, 44, 5, 34, "#fff0c4", 0.6, SKY);
base.ridge({ base: 0.42, amp: 0.08, f: 3, seed: 6, top: "#a07898", bot: "#7a6088", depth: 12, m: HILL });
// the city palace along the far shore: long, many-towered, warm sandstone and white
const R = rng(5);
for (let x = 120; x < W; ) {
  const w = 6 + Math.floor(R() * 8), h = 10 + Math.floor(R() * 12);
  base.rect(x, WL - h, x + w, WL + 1, (xx) => mix(hex("#fff0dc"), hex("#c09080"), clamp((xx - x) / w * 0.7)), SHORE);
  for (let yy = WL - h + 3; yy < WL - 2; yy += 4) for (let xx = x + 1; xx < x + w - 1; xx += 3) base.rect(xx, yy, xx + 1, yy + 2, "#7a5060", SHORE);
  if (R() < 0.5) dome(base, x + w / 2, WL - h, w / 3, { c: "#fff4e4", shade: "#c09888", finial: "#d8a840", m: SHORE });
  x += w;
}
// the lake: sunset colours mirrored, the sun's path across it
base.rect(0, WL, W, H, (x, y) => {
  const u = (y - WL) / (H - WL), path = Math.exp(-((x - 40) ** 2) / (40 + u * 800));
  return mix(mix(hex("#e0a0a0"), hex("#6a6090"), clamp(u * 1.1)), hex("#ffe0a8"), clamp(path * 0.8));
}, LAKE);
// the island palace: a long white building at water level with arched galleries and domed chhatris
base.rect(PX - 44, 66, PX + 45, 80, (x) => mix(hex("#ffffff"), hex("#c8b4c0"), clamp((x - PX + 44) / 89 * 0.7)), PALACE);
for (let x = PX - 40; x < PX + 40; x += 6) arch(base, x, 70, 4, 8, "#8a6a7a", PALACE);
base.rect(PX - 30, 56, PX + 31, 66, (x) => mix(hex("#ffffff"), hex("#c8b4c0"), clamp((x - PX + 30) / 61 * 0.7)), PALACE);
for (let x = PX - 26; x < PX + 26; x += 5) arch(base, x, 59, 3, 6, "#9a7a8a", PALACE);
for (const [x, r] of [[PX - 24, 4], [PX, 6], [PX + 24, 4], [PX - 38, 3], [PX + 38, 3]]) dome(base, x, x === PX ? 56 : 66 - (Math.abs(x - PX) < 30 ? 10 : 0), r, { c: "#ffffff", shade: "#c0b0c4", finial: "#e8b840", m: PALACE });
// mirrored in the still lake
const snap = new Canvas().copy(base);
for (let x = 0; x < W; x++) for (let y = 80; y < H; y++) {
  const sy = 2 * 80 - y;
  if (snap.maskAt(x, sy) === PALACE) base.put(x, y, mix(snap.get(x, sy), snap.get(x, y), clamp(0.4 + (y - 80) / 50)), LAKE);
}
for (let x = 0; x < W; x++) for (let y = WL + 1; y < 74; y++) {
  const sy = 2 * WL - y;
  if (snap.maskAt(x, sy) === SHORE && snap.maskAt(x, y) === LAKE) base.put(x, y, mix(snap.get(x, sy), snap.get(x, y), 0.5), LAKE);
}

balance(base);
const PAL = fitPalette(base, { n: 52, extras: ["#ffffff", "#ffd27a", "#1e1820", "#e84a3a", "#f4e8dc"] });

export const meta = {
  slug: "lake-palace-udaipur",
  name: "Lake Palace Udaipur",
  category: "india",
  note: "The white marble palace floats on the lake at sunset below the long city palace and the Aravalli hills, mirrored in the water as boats ferry across.",
  tags: ["udaipur", "rajasthan", "palace", "lake", "sunset", "india", "halftone", "boats"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    clouds(f, t, [[0.25, 0.32, 0.18, 1.2, "#f4b098", 0.45], [0.75, 0.26, 0.3, 1, "#c890a8", 0.35]], SKY, 0.7);
    // boats ferrying to the palace, canopies striped
    for (const [ph, y, dir] of [[0.15, 90, 1], [0.6, 100, -1]]) {
      const u = across(t, 4, ph), x = dir > 0 ? u : W - u;
      for (let k = 2; k < 16; k++) f.add(x - dir * k, y + 1, "#f4e8dc", (1 - k / 16) * 0.5, LAKE);
      f.rect(x - 8, y - 1, x + 9, y + 1, "#f4e8dc"); f.put(x + 9 * dir, y - 2, "#f4e8dc");
      for (let i = -5; i <= 5; i++) f.put(x + i, y - 4, i % 2 ? "#e84a3a" : "#ffd27a");
      for (const i of [-5, 5]) f.rect(x + i, y - 3, x + i + 1, y - 1, "#1e1820");
    }
    // lamps along the palace galleries coming on
    const on = Math.min(1, (t % 18) / 12);
    for (let i = 0; i < 14; i++) if (i / 14 < on) f.put(PX - 39 + i * 6, 78, "#ffd27a");
    birds(f, t, { n: 6, y: 26, period: 14, c: "#1e1820", only: SKY });
    return enc(f);
  };
}
