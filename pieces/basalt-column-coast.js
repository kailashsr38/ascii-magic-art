/* basalt-column-coast: thousands of hexagonal basalt columns stepping down into a stormy sea, waves breaking over them, hand-built.
 * Painted once: the brooding sky with a break of light, the headland cliffs, and the columns: hexagon tops
 * at many heights, stepping like stairs down to the water, their sides shaded. Each frame breaks waves
 * over the lowest columns, throws spray, walks a visitor up the stones and flies gulls. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, surf, person, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, CLIFF = 2, SEA = 3, COL = 4;
const HOR = 50;

const base = new Canvas();
base.sky([[0, "#4a5268"], [0.6, "#8a90a8"], [1, "#e8dcc8"]], SKY, 0, HOR + 1);
base.glow(150, 36, 3, 30, "#fff4d8", 0.45, SKY);
// the headland on the left, dark cliffs with columns showing
for (let x = 0; x < 70; x++) for (let y = Math.floor(24 + x * 0.3 + fbm(x / 6, 2, 3, 4) * 4); y < 70; y++) base.put(x, y, mix(hex("#5a5a52"), hex("#2e2e2a"), clamp((x % 4 === 0 ? 0.3 : 0) + (y - 24) / 80)), CLIFF);
// the sea
base.rect(70, HOR, W, H, (x, y) => mix(hex("#7a8aa0"), hex("#3a4a5a"), clamp((y - HOR) / 40)), SEA);
// the columns: a hex grid in perspective, each column's top at its own height, stepping down to the sea
const TOPS = [];
for (let row = 0; row < 14; row++) for (let col = 0; col < 26; col++) {
  const hx = col * 7 + (row % 2) * 3.5, hy = 52 + row * 4;          // centre of the hex top on the ground plane
  const dist = Math.hypot((hx - 40) / 1.4, hy - 108);
  const height = clamp(1 - dist / 140) * 26 + Math.sin(col * 2.3 + row * 1.7) * 3;
  if (hx > 30 + row * 5 && hy < 60 + (hx - 30) * 0.1) continue; // the sea takes the far right
  TOPS.push([hx, hy - height, height, row]);
}
TOPS.sort((a, b) => a[1] + a[2] - (b[1] + b[2]));
for (const [cx, cy, height] of TOPS) {
  const r = 3.4;
  for (let y = Math.floor(cy); y < cy + height + 2; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) base.put(x, y, mix(hex("#4a4a4e"), hex("#26262a"), clamp((x - cx + r) / (2 * r) * 0.6 + (y - cy) / 40)), COL); // the sides
  for (let y = Math.floor(cy - 1.6); y <= cy + 1.6; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
    if (Math.abs(x - cx) / r + Math.abs(y - cy) / 3.2 > 1.25) continue;
    base.put(x, y, mix(hex("#a8a49c"), hex("#6a6862"), clamp(noise2(x / 2, y, 3) * 0.5)), COL);   // the hexagon top
  }
}

balance(base);
const PAL = fitPalette(base, { n: 48, extras: ["#ffffff", "#f4f8f8", "#e84a3a", "#1e1e22", "#f2c84a"] });

export const meta = {
  slug: "basalt-column-coast",
  name: "Basalt Column Coast",
  category: "landscapes",
  note: "Thousands of hexagonal basalt columns step down like stairs into a stormy sea as waves break white over the lowest stones and a visitor climbs the steps.",
  tags: ["giants-causeway", "basalt", "columns", "coast", "ireland", "stormy-sea", "wonder", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    surf(f, t, HOR + 4, 80, { foam: "#f4f8f8", n: 4, period: 5, only: SEA, wob: 3 });
    // spray thrown up where the waves hit the columns
    const ph = (t % 5) / 5;
    if (ph > 0.55 && ph < 0.95) { const s = (ph - 0.55) / 0.4; for (let k = 0; k < 30; k++) { const a = (k / 30) * Math.PI, r = s * 12; f.add(118 + Math.cos(a) * r * 1.6, 70 - Math.sin(a) * r, "#ffffff", (1 - s) * 0.8); } }
    // a visitor in a red coat picking their way up the columns
    const p = (t % 26) / 26, x = lerp(40, 92, p), y = Math.round(lerp(100, 70, p));
    person(f, x, y, { body: "#e84a3a", head: "#f2c84a", step: Math.floor(t * 3) });
    birds(f, t, { n: 4, y: 18, period: 13, c: "#ffffff", only: SKY, spread: 1.4 });
    return enc(f);
  };
}
