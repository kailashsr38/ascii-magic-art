/* seed-germination: a pea seed underground swelling with water, sending a root down and a hooked shoot up into the light. */
import { Grid, palette, gradient, KEYS, fbm, rng, clamp, fract, smooth } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("sky", gradient(["#2a5a9a", "#4a7ab8", "#78a8d8", "#a8d0ec"], 5));
add("sun", ["#ffd23a", "#fff4b0"]);
add("soil", gradient(["#2a1a0e", "#3a2414", "#4a301a", "#5a3c22", "#6e4a2a"], 6));
add("top", ["#4a6a2a", "#6a8a3a"]);
add("pebble", ["#7a7068", "#9a9088"]);
add("seed", ["#8a9a3a", "#b8c85a", "#e0e890"]);
add("root", ["#e8dcc0", "#fff6e0", "#c8b898"]);
add("shoot", ["#c8e0a0", "#4aa83a", "#2a7a2a", "#7ad05a"]);
add("drop", ["#5ab0ff", "#c8e8ff"]);
add("ui", ["#ffffff", "#c8bca8", "#7ee787", "#5a4a3a"]);

export const meta = {
  slug: "seed-germination",
  name: "Seed Germination",
  category: "science",
  note: "A pea seed in the soil soaks up water, pushes its first root down, sends a hooked shoot up through the surface and opens its first leaves, with each stage and day labelled.",
  tags: ["plants", "germination", "biology", "growth", "education", "science"],
  cols: 92, rows: 32, fps: 20,
  palette: palette(all),
};

const K = (n, i = 0) => KEYS[G[n] + i];
const SX = 30, SY = 20, GROUND = 11, PER = 26;
const STAGES = [
  "1 seed soaks up water, swells",
  "2 radicle (first root) grows",
  "3 shoot pushes up in a hook",
  "4 shoot breaks the surface",
  "5 leaves open, photosynthesis",
];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const tex = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) tex[x + y * cols] = fbm(x * 0.15, y * 0.35, 3, 27);
  const r = rng(14);
  const pebbles = Array.from({ length: 22 }, () => [Math.floor(r() * 56), GROUND + 2 + Math.floor(r() * 18)]);
  const drops = Array.from({ length: 16 }, () => [r() * 6.28, 6 + r() * 10, r()]);
  return (t) => {
    g.clear();
    const T = t % PER;
    const G2 = clamp(T / (PER - 2));               // growth 0..1, then a short pause
    const stage = G2 < 0.15 ? 0 : G2 < 0.32 ? 1 : G2 < 0.5 ? 2 : G2 < 0.66 ? 3 : 4;
    // sky and soil
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = tex[x + y * cols];
      if (y < GROUND) g.set(x, y, v > 0.6 ? "▒" : "░", K("sky", Math.min(4, Math.floor(y * 0.4 + v * 1.5))));
      else if (y === GROUND) g.set(x, y, v > 0.5 ? "▀" : "█", K("top", v > 0.5 ? 1 : 0));
      else g.set(x, y, v > 0.55 ? "▓" : "▒", K("soil", clamp(Math.floor(5 - (y - GROUND) * 0.22 + v * 1.4), 0, 5)));
    }
    for (let y = 0; y < 7; y++) for (let x = 76; x < 92; x++) {
      const d = Math.hypot(x - 85, (y - 2) * 2);
      if (d < 4) g.set(x, y, "█", K("sun", d < 2.2 ? 1 : 0));
    }
    for (const [px, py] of pebbles) g.text(px, py, "▄▄", K("pebble", px & 1));
    // water drops moving toward the seed while it soaks up water
    if (G2 < 0.3) for (const [a, d0, ph] of drops) {
      const p = fract(t * 0.35 + ph), d = d0 * (1 - p);
      g.set(SX + Math.cos(a) * d * 2, SY + Math.sin(a) * d * 0.9, "•", K("drop", p > 0.6 ? 1 : 0));
    }
    // root: down, wiggling, with side roots and hairs
    const rootLen = smooth(clamp((G2 - 0.15) / 0.75)) * 11;
    for (let i = 0; i < rootLen; i++) {
      const y = SY + 2 + i, x = SX + Math.round(Math.sin(i * 0.45) * 1.2);
      g.set(x, y, i > rootLen - 1 ? "▼" : "█", K("root", i > rootLen - 1 ? 1 : 0));
      if (i > 2 && i < rootLen - 2 && G2 > 0.35) {
        const side = i & 1 ? 1 : -1, len = Math.min(7, (G2 - 0.35) * 18 - i * 0.4);
        for (let k = 1; k < len; k++) g.set(x + side * k * 2, y + k * 0.5, side > 0 ? "╲" : "╱", K("root", 2));
      }
      if (i > 1 && G2 > 0.25 && (i % 2 === 0)) { g.set(x - 1, y, "·", K("root", 1)); g.set(x + 1, y, "·", K("root", 1)); }
    }
    // shoot: grows up from the seed, hooked until it breaks the surface
    const top = SY - 1 - smooth(clamp((G2 - 0.3) / 0.45)) * 15;   // tip row
    const above = top < GROUND;
    if (G2 > 0.3) {
      for (let y = SY - 1; y >= Math.ceil(top); y--) g.set(SX, y, "┃", K("shoot", y < GROUND ? 1 : 0));
      const ty = Math.ceil(top);
      if (!above) { g.set(SX, ty, "╭", K("shoot", 0)); g.set(SX + 1, ty, "╮", K("shoot", 0)); g.set(SX + 1, ty + 1, "▼", K("shoot", 3)); }
      else {
        // leaves at nodes above ground, growing as the plant does
        const leafG = clamp((G2 - 0.62) / 0.3);
        const nodes = [ty + 1, ty + 4];
        nodes.forEach((ny, k) => {
          if (ny >= GROUND) return;
          const size = Math.round((k === 0 ? leafG : clamp(leafG * 1.4)) * 5);
          if (size < 1) { g.set(SX - 1, ny, "▗", K("shoot", 3)); g.set(SX + 1, ny, "▖", K("shoot", 3)); return; }
          for (let s = 1; s <= size; s++) {
            const lift = s > size - 1 ? -1 : 0;
            g.set(SX - s, ny + lift, s === size ? "▀" : "█", K("shoot", s < 2 ? 2 : 1));
            g.set(SX + s, ny + lift, s === size ? "▀" : "█", K("shoot", s < 2 ? 2 : 1));
            if (s > 1 && s < size) { g.set(SX - s, ny - 1, "▄", K("shoot", 3)); g.set(SX + s, ny - 1, "▄", K("shoot", 3)); }
          }
        });
        g.set(SX, ty - 1, "▲", K("shoot", 3));
        // light arriving at the leaves
        if (stage === 4) for (let k = 0; k < 4; k++) {
          const p = fract(t * 0.6 + k / 4);
          g.set(80 - p * (80 - SX - 6), 4 + p * (ty - 4) + k, "•", K("sun", 1));
        }
      }
    }
    // the seed, swelling with water, its coat splitting once the root is out
    const sw = 1 + 0.3 * smooth(clamp(G2 / 0.15));
    for (let y = SY - 3; y <= SY + 3; y++) for (let x = SX - 7; x <= SX + 7; x++) {
      const nx = (x + 0.5 - SX) / (3.4 * sw * 2 * 0.5 * 2), ny = (y + 0.5 - SY) / (1.7 * sw), q = nx * nx + ny * ny;
      if (q > 1) continue;
      const split = G2 > 0.2 && Math.abs(x - SX) < 1 && y >= SY;
      g.set(x, y, split ? "▒" : q > 0.7 ? "█" : "▓", K("seed", split ? 0 : q > 0.7 ? 0 : q > 0.3 ? 1 : 2));
    }
    // labels
    g.text(1, 0, "SEED GERMINATION", K("ui", 0));
    g.text(1, 1, "pea seed, cotyledons stay in the soil", K("ui", 1));
    g.text(1, GROUND + 1, "soil surface", K("ui", 1));
    g.text(SX + 9, SY, "← seed", K("ui", 0));
    if (rootLen > 3) g.text(SX + 4, SY + 6, "radicle", K("ui", 0));
    if (G2 > 0.35) g.text(SX + 9, SY + 9, "root hairs", K("ui", 1));
    if (G2 > 0.32) g.text(SX + 4, Math.min(SY - 3, Math.max(GROUND + 2, Math.round(top) + 2)), "shoot", K("ui", 0));
    const DX = 58;
    g.fill(DX - 1, 13, 33, 8, " ");
    STAGES.forEach((s, k) => g.text(DX, 14 + k, s, K("ui", k === stage ? 2 : k < stage ? 1 : 3)));
    g.text(DX, 20, `day ${String(Math.floor(G2 * 13) + 1).padStart(2)} of 14`, K("ui", 0));
    g.text(DX, 23, "needs: water, oxygen, warmth", K("ui", 0));
    g.text(DX, 24, "not light, until the shoot", K("ui", 1));
    g.text(DX, 25, "reaches the surface", K("ui", 1));
    return g.frame();
  };
}
