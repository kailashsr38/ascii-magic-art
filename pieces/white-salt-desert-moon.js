/* white-salt-desert-moon: the endless white salt desert under a full moon, a camel cart crossing and folk musicians by a fire, hand-built.
 * Painted once: the deep blue night sky with the full moon and stars, the far horizon, and the white salt
 * desert cracked into hexagons glowing in the moonlight. Each frame crosses a camel cart along the
 * horizon, flickers a little fire with musicians beside it and sends a shooting star over. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, stars, shootingStar, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, SALT = 2;
const HOR = 58, MOON = [140, 24];

const base = new Canvas();
base.sky([[0, "#0e1438"], [0.6, "#1e2a5a"], [1, "#4a5a8a"]], SKY, 0, HOR + 1);
stars(base, { n: 110, y1: HOR - 6, only: SKY, seed: 7 });
base.glow(MOON[0], MOON[1], 8, 30, "#c8d8ff", 0.4, SKY);
base.ellipse(MOON[0], MOON[1], 8, 8, (x, y) => mix(hex("#ffffff"), hex("#d8e0f0"), clamp(noise2(x / 2, y / 2, 3) * 0.5 + (x - MOON[0] + 8) / 30)), SKY);
// the salt desert: white crust cracked into hexagonal plates, the cracks fading into the distance
base.rect(0, HOR, W, H, (x, y) => {
  const u = (y - HOR) / (H - HOR), s = 1 + u * 5;          // plates grow bigger toward us
  const px = x / (7 * s), py = (y - HOR) / (3.5 * s) * 1.0;
  const hx = px - Math.floor(px), hy = py - Math.floor(py);
  const crack = Math.min(hx, 1 - hx, hy, 1 - hy) < 0.06 + (1 - u) * 0.1;
  const moonPath = Math.exp(-((x - MOON[0]) ** 2) / (80 + u * 1200)) * (1 - u * 0.6);
  return mix(mix(hex("#c8d0e8"), hex("#8a94b8"), clamp(u * 0.6 + (crack ? 0.35 : 0))), hex("#ffffff"), clamp(moonPath * 0.6));
}, SALT);

balance(base, 0.45);
const PAL = fitPalette(base, { n: 50, extras: ["#ff9a3a", "#ffd27a", "#1e1418", "#e84a3a", "#fff4e0", "#5a3a2a"] });

export const meta = {
  slug: "white-salt-desert-moon",
  name: "White Salt Desert Moon",
  category: "india",
  note: "The endless white salt desert glows under a full moon, its crust cracked into hexagons, as a camel cart crosses the horizon and musicians play beside a small fire.",
  tags: ["kutch", "rann", "gujarat", "salt-desert", "full-moon", "night", "india", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    shootingStar(f, t, { period: 13, y: 10, only: SKY });
    // the camel cart crossing the horizon, silhouetted against the glow
    const x = ((t * 5) % (W + 60)) - 30, y = HOR;
    f.rect(x, y - 7, x + 8, y - 4, "#1e1418"); f.rect(x + 5, y - 10, x + 7, y - 6, "#1e1418"); f.rect(x + 7, y - 11, x + 10, y - 9, "#1e1418");
    for (const l of [1, 6]) f.rect(x + l, y - 4, x + l + 1, y - Math.floor(t * 4 + l) % 2, "#1e1418");
    f.rect(x - 14, y - 6, x - 2, y - 3, "#1e1418"); f.ellipse(x - 8, y - 2, 2.5, 2.5, "#1e1418");
    for (let k = -14; k < -2; k += 3) f.put(x + k, y - 7, "#e84a3a");
    // a small fire with three musicians sitting round it, the flames moving
    const FX = 60, FY = 92;
    for (let k = 0; k < 7; k++) { const h = 3 + Math.sin(t * 9 + k * 1.7) * 1.5 + (k === 3 ? 2 : 0); f.rect(FX - 3 + k, FY - h, FX - 2 + k, FY, k % 3 ? "#ff9a3a" : "#ffd27a"); }
    f.glow(FX + 0.5, FY - 2, 1, 14, "#ff9a3a", 0.35);
    for (const [dx, c] of [[-10, "#e84a3a"], [9, "#fff4e0"], [-2, "#ffd27a"]]) { const mx = FX + dx, my = FY + (dx === -2 ? 6 : 0); f.rect(mx - 2, my - 4, mx + 2, my, c); f.put(mx, my - 5, "#5a3a2a"); }
    f.line(FX - 8, FY - 3, FX - 5, FY - 6 + Math.sin(t * 4), "#5a3a2a", 1); // a fiddle bow
    return enc(f);
  };
}
