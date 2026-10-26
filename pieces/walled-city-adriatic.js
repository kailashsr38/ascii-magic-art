/* walled-city-adriatic: the old walled city seen from the sea, orange roofs climbing behind its massive walls, hand-built.
 * Painted once: the sky, the mountain behind, rows of orange roofs stepping up the hill, the bell tower
 * and the dome, the great sea wall with its towers, and the deep blue sea mirroring it. Each frame adds
 * sailboats and a launch crossing with their wakes, a flag on the tower and gulls. */
import { fbm, noise2, clamp, lerp, rng } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, boat, flag, across, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, HILL = 2, SEA = 3, CITY = 4, WALL = 5;

const base = new Canvas();
const SEAY = 84;
base.sky([[0, "#4a8ad4"], [0.6, "#8ab8e4"], [1, "#e0ecf4"]], SKY, 0, 60);
// the mountain behind the town
base.ridge({ base: 0.36, amp: 0.1, f: 2, seed: 4, top: "#a8b49a", bot: "#7a8a72", depth: 30, m: HILL });
// the roofs: rows of orange tiles stepping up the hill inside the walls, pale gable ends, a few greens
const R = rng(19);
for (let row = 0; row < 7; row++) {
  const y = 44 + row * 5;
  for (let x = 30 + row * 2; x < 178 - row; ) {
    const w = 6 + Math.floor(R() * 7), h = 4 + Math.floor(R() * 2);
    base.rect(x, y, x + w, y + h + 6, (xx, yy) => (yy < y + h ? mix(hex(R() < 0.5 ? "#f08a5a" : "#e8724a"), hex("#a84a32"), clamp((xx - x) / w * 0.6 + (yy - y) / (h * 3))) : mix(hex("#f8ecd8"), hex("#b8a890"), clamp((xx - x) / w))), CITY);
    base.poly([[x, y], [x + w, y], [x + w / 2, y - 2]], "#f49a6a", CITY);
    x += w + (R() < 0.15 ? 3 : 0);
  }
}
// the bell tower and the cathedral dome among the roofs
base.rect(108, 30, 114, 52, (x) => mix(hex("#fff4e0"), hex("#b8a888"), clamp((x - 108) / 6)), CITY);
base.poly([[107, 30], [115, 30], [111, 22]], "#3a8a6a", CITY);
base.ellipse(140, 46, 7, 6, (x) => mix(hex("#f4e8d4"), hex("#a8987e"), clamp((x - 133) / 14)), CITY);
// the great sea wall in front with round towers, rising straight out of the water
base.rect(14, 66, 182, SEAY, (x, y) => mix(hex("#f4e4c8"), hex("#a8987e"), clamp(noise2(x / 3, y / 3, 4) * 0.35 + (y - 66) / 40 + (x - 14) / 600)), WALL);
for (let x = 14; x < 182; x += 4) base.rect(x, 64, x + 2, 66, "#e8d8bc", WALL);
for (const [x, w, h] of [[10, 16, 30], [86, 12, 24], [170, 18, 34]]) {
  base.rect(x, SEAY - h, x + w, SEAY, (xx) => mix(hex("#fff4e0"), hex("#a8987e"), clamp((xx - x) / w)), WALL);
  for (let xx = x; xx < x + w; xx += 3) base.rect(xx, SEAY - h - 2, xx + 2, SEAY - h, "#f4e4c8", WALL);
  base.rect(x + w / 2 - 1, SEAY - h + 6, x + w / 2 + 1, SEAY - h + 10, "#5a4a3a", WALL);
}
// the sea: deep blue, the wall's pale reflection broken in it
const snap = new Canvas().copy(base);
base.rect(0, SEAY, W, H, (x, y) => {
  const sy = 2 * SEAY - y - 1 + Math.round(Math.sin(y * 1.1 + x * 0.1) * 1.5);
  return mix(mix(snap.get(x, sy), hex("#2a6ab0"), 0.6), hex("#1e4a8a"), clamp((y - SEAY) / 40));
}, SEA);

balance(base, 0.5);
const PAL = fitPalette(base, { n: 52, extras: ["#ffffff", "#1e2a3a", "#e84a3a", "#2a4aa8"] });

export const meta = {
  slug: "walled-city-adriatic",
  name: "Walled City Adriatic",
  category: "cities",
  note: "The old city's orange roofs climb the hill behind its massive pale sea walls and round towers as sailboats cross the deep blue water below and gulls wheel overhead.",
  tags: ["dubrovnik", "croatia", "walls", "old-town", "sea", "landmark", "halftone", "rooftops"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    // boats crossing in front of the walls, each with its wake
    for (const [ph, y, sp, sail] of [[0.1, 92, 4, true], [0.5, 100, 5.5, false], [0.8, 104, 3, true]]) {
      const x = across(t, sp, ph);
      for (let k = 2; k < 14; k++) f.add(x - k, y + 0.5, "#ffffff", (1 - k / 14) * 0.55, SEA);
      boat(f, x, y, sail ? 7 : 11, { hull: "#ffffff", sail: sail ? "#ffffff" : null, sailH: sail ? 9 : 0, mast: "#1e2a3a", dir: 1 });
    }
    flag(f, t, 178, 38, 6, 4, "#e84a3a", { c2: "#2a4aa8", pole: "#1e2a3a" });
    birds(f, t, { n: 5, y: 12, period: 14, c: "#1e2a3a", only: SKY });
    return enc(f);
  };
}
