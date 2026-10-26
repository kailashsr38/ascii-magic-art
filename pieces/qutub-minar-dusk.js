/* qutub-minar-dusk: the tall fluted red sandstone minaret with its carved balconies at dusk, ruined arches at its foot, hand-built.
 * Painted once: the dusk sky, the tapering fluted tower in five storeys with projecting balconies and
 * bands of carved script, the ruined screen of arches beside it, and the lawns. Each frame circles
 * parakeets and kites around the tower, lights lamps along the path and walks visitors. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, arch, person, across, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, TOWER = 2, RUIN = 3, LAWN = 4;
const CX = 118, BASE = 92, TOP = 6;

const base = new Canvas();
base.sky([[0, "#3a4a8a"], [0.45, "#a87aa0"], [0.8, "#f8a078"], [1, "#ffcf98"]], SKY, 0, BASE);
base.glow(40, 70, 5, 34, "#fff0c4", 0.55, SKY);
// the minaret: five storeys tapering upward, fluted (alternating round and angular flutes), red below,
// buff and white marble above, a balcony ring at each storey
const storeys = [[BASE, 52, 12, "#e88a62", "#8a3a2a"], [52, 32, 10, "#ec9a6e", "#8e4030"], [32, 20, 8.5, "#f0a878", "#944632"], [20, 12, 7, "#f4e4d4", "#a8988e"], [12, TOP, 5.5, "#f8ece0", "#b0a294"]];
for (const [y1, y0, hw, c1, c2] of storeys) {
  for (let y = y0; y < y1; y++) {
    const w = hw + (y - y0) / (y1 - y0) * 2.5;
    for (let x = Math.floor(CX - w); x <= CX + w; x++) {
      const u = (x - CX) / w, flute = Math.cos(u * Math.PI * 4) > 0.3 ? 0.18 : 0;
      base.put(x, y, mix(hex(c1), hex(c2), clamp((u + 1) * 0.45 + flute)), TOWER);
    }
    if ((y - y0) % 6 === 2) for (let x = Math.floor(CX - w); x <= CX + w; x += 2) base.put(x, y, mix(hex(c2), hex("#5a2a22"), 0.4), TOWER); // carved bands
  }
  const bw = hw + 4; // the balcony ring
  base.rect(CX - bw, y0 - 1, CX + bw + 1, y0 + 1, (x) => mix(hex("#ffd8b0"), hex("#7a3a2a"), clamp((x - CX + bw) / (2 * bw))), TOWER);
  for (let x = CX - bw; x <= CX + bw; x += 2) base.put(x, y0 + 1, "#7a3a2a", TOWER);
}
base.rect(CX - 1, TOP - 3, CX + 2, TOP, "#e8d8c8", TOWER);
// the ruined screen of tall pointed arches on the left
base.rect(14, 54, 86, BASE, (x, y) => mix(hex("#e8a07a"), hex("#8a4a3a"), clamp((x - 14) / 72 * 0.6 + noise2(x / 2, y / 2, 4) * 0.15)), RUIN);
for (const [x, w, h] of [[20, 12, 30], [40, 18, 34], [66, 12, 30]]) { arch(base, x, BASE - h, w, h, "#3a2a3a", RUIN); base.poly([[x, BASE - h + w / 2], [x + w, BASE - h + w / 2], [x + w / 2, BASE - h - 4]], "#3a2a3a", RUIN); }
for (let x = 14; x < 86; x += 3) base.put(x, 53, "#c87a5a", RUIN);
// the lawns and the path
base.rect(0, BASE, W, H, (x, y) => (Math.abs(x - CX) < 8 + (y - BASE) * 0.6 ? mix(hex("#e8d0b8"), hex("#a8907e"), (y - BASE) / 16) : mix(hex("#7a9a4a"), hex("#3e5a2e"), clamp((y - BASE) / 16 + fbm(x / 4, y / 2, 2, 5) * 0.3))), LAWN);

balance(base);
const PAL = fitPalette(base, { n: 50, extras: ["#3ac86a", "#ffd27a", "#1e1820", "#ffffff", "#e84a3a", "#f2c84a"] });

export const meta = {
  slug: "qutub-minar-dusk",
  name: "Qutub Minar Dusk",
  category: "india",
  note: "The tall fluted sandstone minaret with its carved balconies rises over ruined arches at dusk as parakeets and kites circle it and the path lamps come on.",
  tags: ["delhi", "qutub-minar", "minaret", "monument", "dusk", "heritage", "india", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    // parakeets circling the tower, green flashes
    for (let i = 0; i < 6; i++) {
      const a = t * 0.9 + i * 1.05, x = CX + Math.cos(a) * (22 + (i % 2) * 6), y = 30 + Math.sin(a) * 4 + i * 4;
      if (Math.sin(a) > 0 || f.maskAt(x, y) !== TOWER) { f.rect(x, y, x + 2, y + 1, "#3ac86a"); f.put(x - 1, y + 1, "#3ac86a"); }
    }
    birds(f, t, { n: 3, y: 16, period: 14, c: "#1e1820", only: SKY, spread: 2.2 });
    // the path lamps lighting one after another
    const on = Math.min(6, Math.floor((t % 14) / 1.5));
    for (let i = 0; i < 6; i++) { const y = BASE + 2 + i * 2.6, x = CX - 10 - i * 1.6; f.rect(x, y - 3, x + 1, y, "#1e1820"); if (i < on) f.glow(x, y - 4, 0.5, 3, "#ffd27a", 0.7); f.rect(x + 20 + i * 3.2, y - 3, x + 21 + i * 3.2, y, "#1e1820"); if (i < on) f.glow(x + 20 + i * 3.2, y - 4, 0.5, 3, "#ffd27a", 0.7); }
    for (const [ph, c] of [[0.1, "#e84a3a"], [0.5, "#f2c84a"], [0.8, "#ffffff"]]) person(f, across(t, 2.6, ph), 100, { body: c, head: "#8a5a3a", step: Math.floor(t * 4 + ph * 9) });
    return enc(f);
  };
}
