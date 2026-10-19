/* flow-field: hundreds of particles tracing streamlines through a slowly turning noise flow field. */
import { Grid, palette, gradient, KEYS, noise2, rng, clamp, TAU } from "../lib/kit.js";

const HUES = gradient(["#ff4a8a", "#ff9a4a", "#ffe05a", "#5aff9a", "#3ad0ff", "#7a6aff", "#ff4a8a"], 12);
// each hue in 3 brightness steps
const SH = HUES.flatMap((h) => { const q = gradient(["#06070f", h, "#ffffff"], 6); return [q[1], q[2], h, q[3]]; });
const pal = palette([...SH, "#161c38", "#202a4c"]);
const NH = HUES.length;
const BG1 = KEYS[NH * 4], BG2 = KEYS[NH * 4 + 1];

export const meta = {
  slug: "flow-field",
  name: "Flow Field",
  category: "algorithms",
  note: "Hundreds of particles tracing streamlines through a noise flow field, coloured by the direction they travel.",
  tags: ["particles", "noise", "generative-art", "wallpaper", "hero"],
  cols: 92, rows: 36, fps: 24,
  palette: pal,
};

const NP = 420, LIFE = 4.5, DT = 1 / 14, TRAIL = 26, SPEED = 9;
const DIRS = ["─", "╲", "│", "╱"];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const field = (x, y, t) => noise2(x * 0.03 + 3, y * 0.065 + t * 0.03, 7) * TAU * 2 + t * 0.12;
  const hx = new Float32Array(TRAIL), hy = new Float32Array(TRAIL), ha = new Float32Array(TRAIL);
  const glyph = (a) => {
    const k = ((Math.round((((a % Math.PI) + Math.PI) % Math.PI) / (Math.PI / 4))) % 4);
    return DIRS[k];
  };
  const hueOf = (a) => Math.floor(((((a % TAU) + TAU) % TAU) / TAU) * NH) % NH;
  const QUAD = " ▘▝▀▖▌▞▛▗▚▐▜▄▙▟█";
  const mask = new Uint8Array(cols * rows), best = new Uint8Array(cols * rows), lv = new Int8Array(cols * rows);
  const plot = (x, y, key) => {
    const ix = Math.floor(x), iy = Math.floor(y);
    if (ix < 0 || iy < 0 || ix >= cols * 2 || iy >= rows * 2) return;
    const ci = (ix >> 1) + (iy >> 1) * cols;
    mask[ci] |= 1 << ((ix & 1) + (iy & 1) * 2);
    if ((key & 3) >= lv[ci]) { lv[ci] = key & 3; best[ci] = key; }
  };
  return (t) => {
    mask.fill(0); lv.fill(-1);
    // faint streamlines of the field itself
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const a = field(x, y * 2, t);
      g.set(x, y, (x + y) % 2 ? glyph(a) : "·", (x * 7 + y * 3) % 5 ? BG1 : BG2);
    }
    for (let i = 0; i < NP; i++) {
      const off = (i / NP) * LIFE;
      const cyc = Math.floor((t + off) / LIFE);
      const born = cyc * LIFE - off;
      const r = rng(i * 7919 + cyc * 104729 + 1);
      let x = r() * cols, y = r() * rows * 2;
      const steps = Math.floor((t - born) / DT);
      let n = 0;
      for (let s = 0; s <= steps; s++) {
        const a = field(x, y, born + s * DT);
        hx[n % TRAIL] = x; hy[n % TRAIL] = y; ha[n % TRAIL] = a; n++;
        x += Math.cos(a) * SPEED * DT; y += Math.sin(a) * SPEED * DT;
      }
      const age = t - born;
      const fade = clamp(Math.min(age / 0.6, (LIFE - age) / 0.8));
      const m = Math.min(n, TRAIL);
      for (let j = 0; j < m - 1; j++) {
        const a = (n - 1 - j + TRAIL * 4) % TRAIL, b = (n - 2 - j + TRAIL * 4) % TRAIL;
        const br = (1 - j / m) * fade;
        if (br < 0.1) continue;
        const lvl = br > 0.55 ? 3 : br > 0.3 ? 2 : br > 0.15 ? 1 : 0;
        const key = hueOf(ha[a]) * 4 + lvl;
        const x0 = hx[a] * 2, y0 = hy[a], x1 = hx[b] * 2, y1 = hy[b];
        const st = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
        for (let q = 0; q < st; q++) plot(x0 + ((x1 - x0) * q) / st, y0 + ((y1 - y0) * q) / st, key);
      }
    }
    for (let i = 0; i < mask.length; i++) if (mask[i]) { g.ch[i] = QUAD[mask[i]]; g.co[i] = KEYS[best[i]]; }
    return g.frame();
  };
}
