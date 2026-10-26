/* redwood-forest-light: giant redwood trunks rising out of a fern floor, beams of morning sun slanting through the mist, a walker for scale, hand-built.
 * Painted once: the misty green-gold air of the forest, ranks of trunks from faint and far to massive and
 * near with their furrowed bark lit on one side, the bright fern floor and the trail winding through
 * it. Each frame shifts the beams of light as the mist moves through them, walks a hiker along the trail,
 * drifts motes in the beams and flies a bird between the trunks. */
import { fbm, noise2, clamp, lerp, rng } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, mist, person, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const AIR = 1, TRUNK = 2, FLOOR = 3, TRAIL = 4;
const GROUND = 84;

const base = new Canvas();
base.sky([[0, "#e8eed8"], [0.6, "#c8d4b0"], [1, "#a8bc94"]], AIR, 0, GROUND + 2);
const R = rng(21);
// trunks far to near: faint and thin in the haze, massive and warm up close, bark furrowed and lit from the right
for (const [far, n, wmin, wmax] of [[0.8, 7, 3, 5], [0.55, 5, 5, 7], [0.25, 3, 8, 12], [0, 2, 16, 22]]) {
  const lit = mix(hex("#e8a07a"), hex("#c8d0b0"), far), sh = mix(hex("#7a3e32"), hex("#a0ac8c"), far);
  for (let i = 0; i < n; i++) {
    const cx = ((i + 0.2 + R() * 0.6) / n) * W, w = wmin + R() * (wmax - wmin), base0 = GROUND + (1 - far) * 10;
    for (let y = 0; y < Math.min(H, base0); y++) {
      const flare = y > base0 - 10 ? (y - base0 + 10) * 0.25 * (1 - far) : 0;
      for (let x = Math.floor(cx - w / 2 - flare); x <= cx + w / 2 + flare; x++) {
        const u = (x - cx + w / 2 + flare) / (w + 2 * flare), furrow = Math.sin(x * (2.6 - far) + noise2(x / 2, y / 10, i) * 2) > 0.55;
        base.put(x, y, mix(mix(sh, lit, clamp(u * 1.2 - 0.1)), sh, furrow ? 0.45 : 0), TRUNK);
      }
    }
  }
}
// the fern floor, bright where the sun reaches, and the trail winding through it
for (let y = GROUND; y < H; y++) for (let x = 0; x < W; x++) {
  if (base.maskAt(x, y) === TRUNK && y < GROUND + 4) continue;
  const n = fbm(x / 4, y / 2.5, 3, 5), frond = noise2(x / 1.6, y / 1.2, 7) > 0.45 - n * 0.3;
  base.put(x, y, mix(frond ? hex("#b8dc80") : hex("#6a9a50"), hex("#3a5a32"), clamp((y - GROUND) / 50)), FLOOR);
}
const trail = (y) => 96 + Math.sin(y / 6) * 10 - (y - GROUND) * 1.4;
for (let y = GROUND; y < H; y++) { const w = 1 + (y - GROUND) * 0.18; base.rect(trail(y) - w, y, trail(y) + w, y + 1, "#d8c4a0", TRAIL); }

balance(base, 0.45);
const PAL = fitPalette(base, { n: 50, extras: ["#ffffff", "#fff8e0", "#2a2420", "#3a6aa8", "#e86a4a", "#e8c8a0"] });

export const meta = {
  slug: "redwood-forest-light",
  name: "Redwood Forest Light",
  category: "landscapes",
  note: "Beams of morning sun slant through the mist between giant redwood trunks rising out of a bright fern floor, a hiker small on the winding trail below.",
  tags: ["redwoods", "forest", "sunbeams", "mist", "giant-trees", "hiking", "nature", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    // the beams: slanting shafts of light, their brightness moving with the mist drifting through them
    for (let b = 0; b < 4; b++) {
      const x0 = 40 + b * 38, slope = 0.55;
      for (let y = 0; y < GROUND + 6; y++) for (let dx = -4; dx <= 4; dx++) {
        const x = x0 + y * slope + dx, n = fbm(x / 10 - t * 0.12, y / 8, 2, b + 3), a = (1 - Math.abs(dx) / 5) * clamp(n * 1.5 - 0.15) * 0.75;
        if (a > 0.02) f.add(x, y, "#fff8e0", a);
      }
    }
    mist(f, t, { y0: 60, y1: 92, c: "#f4f4e4", a: 0.4, speed: 0.06, scale: 24, cut: 0.45 });
    // motes drifting in the light
    for (let k = 0; k < 20; k++) { const x = (k * 37 + t * 2) % W, y = (k * 23 + Math.sin(t * 0.5 + k) * 4) % 80; f.add(x, y, "#fff8e0", 0.6); }
    // a hiker walking the trail toward the trees (30 s)
    const p = (t % 30) / 30, y = Math.round(lerp(H - 4, GROUND + 4, p)), x = trail(y);
    person(f, x, y, { body: "#e86a4a", head: "#e8c8a0", legs: "#2a2420", step: Math.floor(t * 3) }); f.rect(x - 1, y - 2, x, y - 1, "#3a6aa8");
    return enc(f);
  };
}
