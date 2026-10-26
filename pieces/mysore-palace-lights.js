/* mysore-palace-lights: the palace lit by tens of thousands of bulbs at night, every dome and arch outlined in gold, hand-built.
 * Painted once: the deep night sky, the palace's dark mass with its central tower, onion domes and
 * arcades, the lawn and the fountain. Each frame switches the bulb outlines on in a sweep and holds
 * them, reflects the glow in the fountain pool and moves the crowd and a decorated elephant. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, dome, arch, stars, person, across, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, PALACE = 2, LAWN = 3, POOL = 4;
const CX = 96, BASE = 80;

const base = new Canvas();
base.sky([[0, "#0c1030"], [0.7, "#1a2050"], [1, "#2e2a5a"]], SKY, 0, BASE);
stars(base, { n: 50, y1: 40, only: SKY, seed: 2 });
// the palace: the outline points (bulbs) are collected while the dark mass is painted
const OUT = [];
const mass = (x0, y0, x1, y1) => { base.rect(x0, y0, x1, y1, (x, y) => mix(hex("#4a3a4a"), hex("#2a2030"), clamp((y - y0) / (y1 - y0) * 0.5 + (x - x0) / (x1 - x0) * 0.3)), PALACE); for (let x = x0; x < x1; x += 2) OUT.push([x, y0]); for (let y = y0; y < y1; y += 2) { OUT.push([x0, y]); OUT.push([x1 - 1, y]); } };
const bulbDome = (cx, by, r, onion) => { dome(base, cx, by, r, { c: "#5a4a5a", shade: "#2a2030", finial: null, onion, m: PALACE }); const hgt = onion ? r * 1.5 : r; for (let a = 0; a <= Math.PI; a += 0.25) OUT.push([cx + Math.cos(a) * r * (onion ? 1.1 : 1), by - Math.sin(a) * hgt]); OUT.push([cx, by - hgt - 2]); };
mass(20, 52, 172, BASE);
for (let x = 26; x < 166; x += 8) { arch(base, x, 60, 5, 12, "#1a1420", PALACE); for (let a = 0; a <= Math.PI; a += 0.5) OUT.push([x + 2.5 + Math.cos(a) * 2.5, 62.5 - Math.sin(a) * 2.5]); }
mass(70, 36, 122, 52);
mass(86, 16, 106, 36);
bulbDome(CX, 16, 9, true);
for (const [x, y] of [[74, 36], [118, 36], [24, 52], [168, 52]]) bulbDome(x, y, 4, true);
for (const [x, y] of [[50, 52], [142, 52]]) bulbDome(x, y, 6, false);
// lawn and the fountain pool
base.rect(0, BASE, W, H, (x, y) => mix(hex("#1e3a24"), hex("#0e1e14"), clamp((y - BASE) / 28)), LAWN);
base.ellipse(CX, 96, 34, 6, "#1a2040", POOL);

balance(base, 0.4);
const PAL = fitPalette(base, { n: 46, extras: ["#ffe08a", "#fff4c4", "#ffb84a", "#ffffff", "#e84a6a", "#f2c84a", "#5a4a4a"] });

export const meta = {
  slug: "mysore-palace-lights",
  name: "Mysore Palace Lights",
  category: "india",
  note: "The palace blazes at night with tens of thousands of bulbs outlining every dome and arch in gold, mirrored in the fountain as the crowd gathers and a decorated elephant walks past.",
  tags: ["mysore", "palace", "lights", "dasara", "night", "festival", "india", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    // the lights sweep on from the centre outward over 3 s, hold, then reset every 16 s
    const ph = t % 16, reach = ph < 3 ? (ph / 3) * 100 : ph < 15 ? 999 : 0;
    for (const [x, y] of OUT) {
      if (Math.abs(x - CX) > reach) continue;
      f.put(x, y, "#ffe08a"); f.add(x + 1, y, "#ffb84a", 0.4); f.add(x, y + 1, "#ffb84a", 0.25);
      if (y < BASE && Math.abs(x - CX) < 34) { const ry = 2 * 96 - y - 10; if (ry > 91 && ry < 101) f.add(x, ry, "#ffe08a", 0.4, POOL); }
    }
    // the crowd, and a decorated elephant with a gold cloth walking slowly across
    for (let i = 0; i < 10; i++) { const x = (i * 21 + Math.sin(t * 0.3 + i) * 3) % W, y = 100 + (i % 3) * 3; person(f, x, y, { body: ["#e84a6a", "#ffffff", "#f2c84a"][i % 3], head: "#8a5a3a" }); }
    const ex = across(t, 2.2, 0.3), ey = 92, step = Math.sin(t * 2);
    f.rect(ex, ey - 9, ex + 14, ey - 3, "#5a4a4a"); f.rect(ex + 12, ey - 10, ex + 17, ey - 4, "#5a4a4a"); f.line(ex + 16, ey - 4, ex + 17, ey + 1, "#5a4a4a", 1);
    f.rect(ex + 3, ey - 9, ex + 11, ey - 5, "#f2c84a"); f.rect(ex + 5, ey - 12, ex + 9, ey - 9, "#e84a6a");
    for (const l of [1, 4, 9, 12]) f.rect(ex + l, ey - 3, ex + l + 2, ey + (l % 2 ? step : -step) * 0.5, "#5a4a4a");
    return enc(f);
  };
}
