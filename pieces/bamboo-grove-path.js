/* bamboo-grove-path: a stone path through a towering bamboo grove, light falling green-gold through the stalks, a rickshaw running down it, hand-built.
 * Painted once: the green air of the grove, ranks of bamboo stalks from pale and far to thick and near
 * with their ringed joints, the woven fences along the path and the path running away into light.
 * Each frame runs a rickshaw down the path toward us, walks visitors the other way, sways the leafy
 * tops and drifts falling leaves through the light. */
import { fbm, noise2, clamp, lerp, rng } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, snow, person, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const AIR = 1, STALK = 2, FENCE = 3, PATH = 4;
const VX = 96, VY = 58;

const base = new Canvas();
base.sky([[0, "#c8e0a8"], [0.55, "#e8f4d0"], [1, "#d4e4b8"]], AIR, 0, H);
base.glow(VX, VY - 4, 6, 30, "#fffcec", 0.7, AIR);
// the path: pale stone narrowing to the glow at the end of the grove
for (let y = VY; y < H; y++) { const w = (y - VY) * 0.9 + 2; base.rect(VX - w, y, VX + w, y + 1, (x) => mix(hex("#e8e0c8"), hex("#b8b098"), clamp(Math.abs(x - VX) / (w + 1) * 0.5 + (y - VY) / 80 + (Math.sin(y * 1.4) > 0.8 ? 0.1 : 0))), PATH); }
// stalks: far to near on both sides of the path, ringed joints, lit edge
const R = rng(31);
for (const [far, n, wmin, wmax] of [[0.85, 30, 1, 1], [0.6, 22, 1, 2], [0.3, 14, 2, 3], [0, 7, 4, 6]]) {
  const lit = mix(hex("#a8d070"), hex("#e0f0c8"), far), sh = mix(hex("#4a7a3a"), hex("#b8d498"), far);
  for (let i = 0; i < n; i++) {
    const side = i % 2 ? 1 : -1, off = (0.2 + R() * 0.8) * (1 - far * 0.55), x = VX + side * (8 + off * 92) * (1.05 - far * 0.4), w = wmin + Math.round(R() * (wmax - wmin));
    const bot = lerp(H + 2, VY + 4, far) - R() * 4;
    for (let y = 0; y < bot; y++) for (let k = 0; k < w; k++) {
      const joint = (y + Math.floor(i * 7)) % Math.round(10 - far * 4) === 0;
      base.put(x + k, y, joint ? mix(sh, hex("#2a3a22"), 0.4) : mix(lit, sh, w > 1 ? k / (w - 1) : 0.3), STALK);
    }
  }
}
// low woven fences along both edges of the path
for (const side of [-1, 1]) for (let y = VY + 2; y < H; y++) { const x = VX + side * ((y - VY) * 0.9 + 4), h = 1 + (y - VY) * 0.12; for (let k = 0; k < h; k++) base.put(x + side * k * 0.2, y - k, (k + y) % 2 ? "#a8885a" : "#c8a878", FENCE); }

balance(base, 0.4);
const PAL = fitPalette(base, { n: 48, extras: ["#ffffff", "#2a2420", "#e85a4a", "#3a3a3a", "#f2c84a", "#e8c8a0", "#c8d8a0"] });

export const meta = {
  slug: "bamboo-grove-path",
  name: "Bamboo Grove Path",
  category: "landscapes",
  note: "A stone path runs through a towering bamboo grove toward the light, a rickshaw running down it and visitors strolling the other way as leaves drift through the green air.",
  tags: ["bamboo", "grove", "kyoto", "arashiyama", "path", "rickshaw", "nature", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    // the leafy tops moving in the breeze: dark sprays drifting side to side at the top of the frame
    for (let x = 0; x < W; x++) for (let y = 0; y < 14; y++) { const n = fbm(x / 5 + Math.sin(t * 0.5) * 0.6, y / 3, 2, 4); if (n > 0.55 - y * 0.02) f.add(x, y, "#4a7a3a", clamp((n - 0.5) * 3) * 0.8); }
    // the rickshaw running down the path toward us, growing as it comes (16 s)
    const p = (t % 16) / 16, y = lerp(VY + 4, H - 2, p * p), s = lerp(0.4, 2.2, p * p), x = VX + 6 * s, st = Math.floor(t * 6) % 2;
    f.rect(x - 3 * s, y - 7 * s, x + 3 * s, y - 3 * s, "#e85a4a"); f.rect(x - 3 * s, y - 9 * s, x + 3 * s, y - 7 * s, "#3a3a3a");
    for (let a = 0; a < 12; a++) f.put(x + Math.cos(a / 12 * Math.PI * 2) * 2.5 * s, y - 2.5 * s + Math.sin(a / 12 * Math.PI * 2) * 2.5 * s, "#2a2420");
    f.line(x - 3 * s, y - 4 * s, x - 9 * s, y - 4 * s, "#2a2420", 1);
    f.rect(x - 10 * s, y - 7 * s, x - 9 * s, y - 2 * s, "#3a3a3a"); f.rect(x - 10 * s, y - 9 * s, x - 8.6 * s, y - 7 * s, "#e8c8a0");
    f.line(x - 10 * s, y - 2 * s, x - 10 * s - (st ? 1.5 : -1.5) * s, y, "#2a2420", 1);
    // visitors strolling up the path away from us
    for (let i = 0; i < 3; i++) { const q = ((t / 34) + i / 3) % 1, yy = Math.round(lerp(H - 2, VY + 6, q)), ss = lerp(1, 0.4, q); person(f, VX - 10 * ss - i * 4 * ss, yy, { body: ["#f2c84a", "#ffffff", "#3a3a3a"][i], head: "#e8c8a0", step: Math.floor(t * 3 + i) }); }
    snow(f, t, { n: 30, c: "#c8d8a0", speed: 3, sway: 3, seed: 5, a: 0.9 });
    return enc(f);
  };
}
