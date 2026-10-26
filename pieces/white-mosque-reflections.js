/* white-mosque-reflections: the great white mosque with its many domes and four minarets mirrored in long pools at blue hour, hand-built.
 * Painted once: the blue-hour sky, the white marble mosque with its main dome, rows of smaller domes and
 * four slender minarets, the colonnade arches, and the reflecting pools in front. Each frame adds the
 * lamps along the colonnade coming on, visitors walking the edge of the pools and birds. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, dome, arch, person, across, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, MOSQUE = 2, POOL = 3, DECK = 4;
const CX = 96, BASE = 68;

const base = new Canvas();
base.sky([[0, "#2a3a7a"], [0.5, "#5a6ab0"], [0.85, "#c8a0c0"], [1, "#f0c8b8"]], SKY, 0, BASE + 1);
// the colonnade along the front, arches lit from inside
const white = (x, x0, x1) => mix(hex("#ffffff"), hex("#b8bcd8"), clamp((x - x0) / (x1 - x0) * 0.7));
base.rect(20, 54, 172, BASE, (x) => white(x, 20, 172), MOSQUE);
for (let x = 24; x < 168; x += 8) arch(base, x, 57, 5, 10, "#f8d8a0", MOSQUE);
// the domes: rows of small ones, then the great dome in the middle
for (let x = 30; x < 170; x += 14) dome(base, x, 54, 5, { c: "#ffffff", shade: "#a8acc8", finial: "#e8c860", m: MOSQUE });
base.rect(64, 34, 129, 54, (x) => white(x, 64, 129), MOSQUE);
for (const x of [74, 118]) dome(base, x, 34, 9, { c: "#ffffff", shade: "#a8acc8", finial: "#e8c860", m: MOSQUE });
dome(base, CX, 34, 16, { c: "#ffffff", shade: "#9aa0c4", finial: "#e8c860", m: MOSQUE });
// four slender minarets at the corners
for (const x of [16, 44, 148, 176]) {
  const h = x === 16 || x === 176 ? 56 : 48;
  base.rect(x - 2, BASE - h, x + 3, BASE, (xx) => white(xx, x - 2, x + 3), MOSQUE);
  for (const y of [BASE - h + 10, BASE - h + 26]) base.rect(x - 3, y, x + 4, y + 2, "#e8eaf4", MOSQUE);
  base.poly([[x - 2, BASE - h], [x + 3, BASE - h], [x + 0.5, BASE - h - 7]], "#e8c860", MOSQUE);
}
// the deck and the long reflecting pools
base.rect(0, BASE, W, BASE + 4, "#d8d8e8", DECK);
const snap = new Canvas().copy(base);
base.rect(0, BASE + 4, W, H, (x, y) => {
  if ((x > 60 && x < 66) || (x > 126 && x < 132)) return hex("#c8c8dc"); // walkways between the pools
  const sy = 2 * (BASE + 3) - y + Math.round(Math.sin(y * 0.6 + x * 0.02) * 0.5);
  return mix(snap.get(x, sy), hex("#1e2a5a"), clamp(0.3 + (y - BASE) / 70));
}, POOL);

balance(base, 0.5);
const PAL = fitPalette(base, { n: 52, extras: ["#ffd890", "#ffffff", "#1e1a2a", "#e84a8a"] });

export const meta = {
  slug: "white-mosque-reflections",
  name: "White Mosque Reflections",
  category: "cities",
  note: "The great white mosque with its many domes and four minarets glows at blue hour, mirrored in long pools as the colonnade lamps come on and visitors stroll by.",
  tags: ["abu-dhabi", "mosque", "domes", "minarets", "reflection", "blue-hour", "landmark", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    // the lamps along the deck lighting one by one (16 s), then holding
    const lit = Math.min(12, Math.floor((t % 16) * 1.1));
    for (let i = 0; i < 12; i++) { const x = 12 + i * 15; f.rect(x, BASE, x + 1, BASE + 3, "#c8c8dc"); if (i < lit) f.glow(x, BASE - 1, 0.6, 3, "#ffd890", 0.6); }
    for (const [ph, c, dir] of [[0.1, "#ffffff", 1], [0.45, "#e84a8a", -1], [0.7, "#1e1a2a", 1]]) {
      const u = across(t, 3, ph), x = dir > 0 ? u : W - u;
      person(f, x, BASE + 3, { body: c, head: "#e8c8a8", step: Math.floor(t * 4 + ph * 9) });
    }
    birds(f, t, { n: 5, y: 12, period: 15, c: "#1e1a2a", only: SKY });
    return enc(f);
  };
}
