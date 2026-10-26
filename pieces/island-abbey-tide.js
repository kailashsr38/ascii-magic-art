/* island-abbey-tide: the abbey on its rocky tidal island at sunset as the tide comes in, hand-built.
 * Painted once: the sky, the island rising from the bay with ramparts and roofs stepping up to the
 * abbey church and its spire, the wet sand flats mirroring it all. Each frame brings the tide in and out
 * over the flats, walks pilgrims along the causeway and adds gulls and cloud. */
import { fbm, noise2, clamp, lerp, rng } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, clouds, person, across, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, ISLE = 2, FLATS = 3;
const HOR = 76, CX = 98;

const base = new Canvas();
base.sky([[0, "#4a5a90"], [0.45, "#b88aa8"], [0.8, "#f6aa80"], [1, "#ffd8a0"]], SKY, 0, HOR + 1);
base.glow(156, 62, 5, 36, "#fff0c4", 0.6, SKY);
// the island: a rocky cone, the town's roofs stepping up it, ramparts at its foot
const rockTop = (x) => HOR - Math.max(0, 44 - Math.pow(Math.abs(x - CX) / 46, 1.15) * 44) - fbm(x / 6, 1, 3, 4) * 2; // a steep cone
for (let x = 48; x < 150; x++) for (let y = Math.floor(rockTop(x)); y <= HOR; y++) base.put(x, y, mix(hex("#8a7080"), hex("#5a4a5e"), clamp((x - 50) / 98 + noise2(x / 2, y / 2, 3) * 0.2)), ISLE);
const R = rng(14);
for (let i = 0; i < 40; i++) { // houses on the slopes, slate roofs
  const x = 60 + R() * 76, y = rockTop(x) + 3 + R() * 6, w = 3 + R() * 4;
  base.rect(x, y - 3, x + w, y + 1, (xx) => mix(hex("#e8c8b0"), hex("#8a6a6e"), clamp((xx - x) / w)), ISLE);
  base.poly([[x - 1, y - 3], [x + w + 1, y - 3], [x + w / 2, y - 6]], "#5a5068", ISLE);
}
base.rect(52, HOR - 6, 146, HOR + 1, (x, y) => mix(hex("#d8b8a0"), hex("#8a7080"), clamp((x - 52) / 94 * 0.8)), ISLE); // ramparts
for (let x = 52; x < 146; x += 3) base.put(x, HOR - 7, "#c8a890", ISLE);
for (const x of [60, 84, 118, 140]) base.rect(x, HOR - 10, x + 4, HOR - 5, "#c8a890", ISLE); // rampart towers
// the abbey church crowning it, and its spire with the gold figure on top
base.rect(CX - 13, 26, CX + 14, 37, (x) => mix(hex("#f0d4c0"), hex("#8a7088"), clamp((x - CX + 13) / 27)), ISLE);
base.poly([[CX - 14, 26], [CX + 15, 26], [CX + 9, 21], [CX - 8, 21]], "#5a5068", ISLE);
base.rect(CX - 3, 12, CX + 4, 26, (x) => mix(hex("#f0d4c0"), hex("#8a7088"), clamp((x - CX + 3) / 7)), ISLE);
base.poly([[CX - 3, 12], [CX + 4, 12], [CX + 0.5, -2]], (x) => mix(hex("#8a8098"), hex("#5a5068"), clamp((x - CX + 3) / 7)), ISLE);

// the flats: wet sand mirroring the sky and the island
const snap = new Canvas().copy(base);
base.rect(0, HOR + 1, W, H, (x, y) => {
  const sy = 2 * HOR - y + 1, wet = fbm(x / 14, y / 3, 3, 8);
  return mix(snap.get(x, sy), hex(wet > 0.5 ? "#c8a490" : "#8a7a8a"), clamp(0.45 + (y - HOR) / 80 + (wet - 0.5) * 0.4));
}, FLATS);
// the causeway
base.rect(CX - 2, HOR + 1, CX + 3, H, (x, y) => mix(hex("#d8c0a8"), hex("#a08a80"), (y - HOR) / 32), ISLE);

balance(base);
const PAL = fitPalette(base, { n: 52, extras: ["#f4f0ec", "#1e1a24", "#c84a3a", "#2a4a8a", "#e8e0d8"] });

export const meta = {
  slug: "island-abbey-tide",
  name: "Island Abbey Tide",
  category: "cities",
  note: "The abbey crowns its rocky tidal island at sunset, mirrored in the wet sand as the tide creeps in and out and pilgrims walk the causeway.",
  tags: ["mont-saint-michel", "france", "abbey", "island", "tide", "sunset", "landmark", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    clouds(f, t, [[0.2, 0.32, 0.18, 1.2, "#f2b098", 0.45], [0.7, 0.26, 0.3, 1, "#b890b0", 0.35]], SKY, 0.7);
    // the tide: a sheet of water creeping in over the flats and back, every 30 s
    const tide = 0.5 - 0.5 * Math.cos((t / 30) * Math.PI * 2), edge = lerp(H + 2, HOR + 6, tide);
    for (let y = Math.floor(edge); y < H; y++) for (let x = 0; x < W; x++) {
      if (f.maskAt(x, y) !== FLATS) continue;
      const lip = y - edge < 2 ? 0.75 : 0.35;
      f.add(x, y, y - edge < 2 ? "#f4f0ec" : "#7a8ab0", lip * (0.6 + 0.4 * noise2(x / 5, y, 2)));
    }
    // pilgrims walking out along the causeway and back
    for (const [ph, c] of [[0, "#c84a3a"], [0.33, "#2a4a8a"], [0.66, "#e8e0d8"]]) {
      const p = ((t / 24 + ph) % 1), y = Math.round(lerp(H - 2, HOR + 4, p < 0.5 ? p * 2 : 2 - p * 2));
      person(f, CX + (ph > 0.5 ? 1 : 0), y, { body: c, step: Math.floor(t * 4 + ph * 9) });
    }
    birds(f, t, { n: 5, y: 26, period: 14, c: "#1e1a24", only: SKY });
    return enc(f);
  };
}
