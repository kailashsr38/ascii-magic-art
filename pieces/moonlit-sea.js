/* moonlit-sea: a full moon over a slow sea, its reflection breaking on the swell. */
import { Grid, fbm, gradient, palette, KEYS, rng, clamp } from "../lib/kit.js";

const SKY = gradient(["#0e1838", "#24396e", "#4a6aa8", "#8aa6d6"], 10);   // 0-9
const SEA = gradient(["#071226", "#123063", "#2c5a9a", "#6b93cc"], 10);   // a-j
const MOON = gradient(["#f7e7a8", "#fff8e0"], 4);                          // k-n
const pal = palette([...SKY, ...SEA, ...MOON, "#dfe8ff"]);                 // o = star

export const meta = {
  slug: "moonlit-sea",
  name: "Moonlit Sea",
  category: "landscapes",
  note: "A full moon over a calm night sea, its reflection breaking on the swell.",
  tags: ["night", "ocean", "moon", "wallpaper", "hero"],
  cols: 96, rows: 36, fps: 20,
  palette: pal,
};

const SHADE = " ░▒▓█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const horizon = Math.floor(rows * 0.56);
  const mx = cols * 0.66, my = rows * 0.25, mr = 6.5;
  const r = rng(7);
  const stars = Array.from({ length: 55 }, () => [Math.floor(r() * cols), Math.floor(r() * (horizon - 6)), r() * 6.28]);
  return (t) => {
    g.clear();
    // sky: a gradient lit around the moon, with slow cloud bands
    for (let y = 0; y < horizon; y++) for (let x = 0; x < cols; x++) {
      const dm = Math.hypot((x - mx) / 2, y - my);
      const glow = Math.exp(-dm / 9);
      const cloud = fbm(x * 0.035 + t * 0.04, y * 0.16, 4);
      const v = clamp(0.25 + (y / horizon) * 0.35 + glow * 0.5 + (cloud - 0.5) * 0.6);
      g.set(x, y, SHADE[1 + Math.min(3, Math.floor(v * 4))], KEYS[Math.min(9, Math.floor(v * 10))]);
    }
    for (const [sx, sy, ph] of stars) {
      const tw = Math.sin(t * 1.6 + ph);
      if (tw > 0) g.set(sx, sy, tw > 0.75 ? "*" : "·", "o");
    }
    // the moon, with a soft limb
    for (let y = 0; y < horizon; y++) for (let x = 0; x < cols; x++) {
      const d = Math.hypot((x - mx) / mr, (y - my) / (mr * 0.5));
      if (d < 1) {
        const crater = fbm(x * 0.4, y * 0.8, 2) > 0.62;
        g.set(x, y, crater ? "▓" : "█", KEYS[20 + Math.min(3, Math.floor((1 - d) * 4 + (crater ? -1 : 0)))]);
      }
    }
    // the sea: moving swell, darker with depth, a broken moon path down the middle
    for (let y = horizon; y < rows; y++) {
      const depth = (y - horizon) / (rows - horizon);
      for (let x = 0; x < cols; x++) {
        const w = fbm(x * 0.07 - t * 0.3, y * 0.6 + t * 0.1, 3);
        const beam = Math.exp(-(((x - mx) / (4 + depth * 12)) ** 2));
        const glint = beam * (0.55 + 0.45 * Math.sin(t * 2.6 + x * 0.6 + y * 1.3)) * (w > 0.45 ? 1 : 0.4);
        if (glint > 0.5) g.set(x, y, glint > 0.78 ? "█" : "▓", KEYS[20 + (glint > 0.78 ? 3 : 1)]);
        else {
          const v = clamp(0.55 - depth * 0.35 + (w - 0.5) * 0.9);
          g.set(x, y, SHADE[1 + Math.min(3, Math.floor(v * 4))], KEYS[10 + Math.min(9, Math.floor(v * 10))]);
        }
      }
    }
    return g.frame();
  };
}
