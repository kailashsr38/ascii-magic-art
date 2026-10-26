/* borobudur-sunrise-mist: the bell-shaped stupas of the temple's top terrace at sunrise, volcanoes rising from mist, hand-built.
 * Painted once: the sunrise sky and sun, two volcano cones, the jungle valley, and the latticed stupas
 * on the stone terrace in the foreground. Each frame adds mist drifting through the valley, a plume
 * from the far volcano and birds. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, mist, smoke, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, VOLC = 2, JUNGLE = 3, STONE = 4;

const base = new Canvas();
base.sky([[0, "#6a6aa0"], [0.4, "#d88a8a"], [0.7, "#f8b070"], [1, "#ffe0a0"]], SKY, 0, 70);
base.glow(84, 54, 6, 40, "#fff2c8", 0.7, SKY);
// two volcano cones, the far one smoking
for (const [cx, top, bw, c1, c2] of [[54, 30, 60, "#9a7a98", "#7a6a88"], [140, 38, 50, "#8a6a8a", "#6a5a7a"]]) {
  for (let x = Math.floor(cx - bw); x < cx + bw; x++) {
    const y0 = top + Math.pow(Math.abs(x - cx) / bw, 1.3) * 38 + fbm(x / 6, 3, 2, 5) * 2;
    for (let y = Math.floor(y0); y < 72; y++) base.put(x, y, mix(hex(c1), hex(c2), clamp((x - cx + bw) / (2 * bw) + (y - y0) / 80)), VOLC);
  }
}
// the jungle valley: rows of palm tops and canopy
for (let x = 0; x < W; x++) for (let y = 66; y < 86; y++) {
  const n = fbm(x / 5, y / 3, 4, 7) + (y - 66) / 40;
  if (n > 0.55) base.put(x, y, mix(hex("#5a6a4a"), hex("#2e3e2a"), clamp((y - 66) / 20 + noise2(x, y, 3) * 0.3)), JUNGLE);
}
// the terrace and its stupas: bell shapes with a diamond lattice, a square spire on top
base.rect(0, 92, W, H, (x, y) => mix(hex("#9a8a7a"), hex("#5a4e48"), clamp((y - 92) / 16 + noise2(x / 2, y / 2, 3) * 0.2)), STONE);
for (let x = 0; x < W; x += 6) base.rect(x, 92, x + 5, 93, "#c8b4a0", STONE);
const stupa = (cx, by, r) => {
  for (let y = Math.floor(by - r * 1.5); y <= by; y++) {
    const u = (by - y) / (r * 1.5), hw = r * Math.sqrt(Math.max(0, 1 - Math.pow(u, 1.6)));
    for (let x = Math.floor(cx - hw); x <= cx + hw; x++) {
      const lat = ((x + y) % 4 === 0 || (x - y + 400) % 4 === 0) && u < 0.85 && u > 0.08; // the lattice openings
      const lit = clamp(0.85 - (x - cx + hw) / (2 * hw + 0.1) * 0.9);
      base.put(x, y, lat ? hex("#3a2e2a") : mix(hex("#5a4e4a"), hex("#ffcf9a"), lit), STONE);
    }
  }
  base.rect(cx - r * 0.15, by - r * 1.5 - r * 0.6, cx + r * 0.15 + 1, by - r * 1.5, "#7a6a60", STONE);
  base.rect(cx - r - 1, by, cx + r + 2, by + 3, "#8a7a6e", STONE);
};
for (const [x, y, r] of [[22, 96, 10], [62, 95, 12], [108, 97, 14], [158, 95, 11], [190, 97, 9]]) stupa(x, y, r);

balance(base);
const PAL = fitPalette(base, { n: 52, extras: ["#fff4e4", "#1e1a22", "#d8c8c0"] });

export const meta = {
  slug: "borobudur-sunrise-mist",
  name: "Borobudur Sunrise Mist",
  category: "cities",
  note: "Bell-shaped stone stupas on the temple's top terrace face the sunrise as mist drifts through the jungle valley and a far volcano trails smoke.",
  tags: ["borobudur", "java", "indonesia", "temple", "sunrise", "volcano", "landmark", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    smoke(f, t, 140, 37, { c: "#d8c8c0", n: 8, rise: 4, drift: 3.5, size: 2.4, a: 0.45 });
    mist(f, t, { y0: 58, y1: 90, c: "#fff4e4", a: 0.7, speed: 0.06, scale: 28, cut: 0.42 });
    birds(f, t, { n: 6, y: 24, period: 17, c: "#1e1a22", only: SKY });
    return enc(f);
  };
}
