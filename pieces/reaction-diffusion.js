/* reaction-diffusion: Gray-Scott chemistry growing coral, spots and mazes from a few seeds. */
import { Grid, palette, gradient, KEYS, rng } from "../lib/kit.js";

const RAMP = gradient(["#05101e", "#0a2a4a", "#0e5a7a", "#1aa0a0", "#6ae0b0", "#e0ffd0", "#ffffff"], 16);
const pal = palette(RAMP);
const NR = RAMP.length;

export const meta = {
  slug: "reaction-diffusion",
  name: "Reaction Diffusion",
  category: "algorithms",
  note: "Gray-Scott reaction diffusion growing coral, spots and mazes outward from a handful of seeds.",
  tags: ["simulation", "organic", "turing-pattern", "wallpaper", "hero"],
  cols: 80, rows: 30, fps: 24,
  palette: pal,
};

const RATE = 520;   // iterations per second
const EPOCH = 26;   // seconds per pattern before reseeding with the next recipe
const PRESETS = [[0.0545, 0.062], [0.035, 0.065], [0.04, 0.06], [0.026, 0.055]];
const SHADE = " ░▒▓█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const W = cols, H = rows * 2, N = W * H;
  let U = new Float32Array(N), V = new Float32Array(N), U2 = new Float32Array(N), V2 = new Float32Array(N);
  let epoch = -1, it = 0, F = 0, K = 0;
  const seed = (e) => {
    U.fill(1); V.fill(0);
    const r = rng(e * 977 + 3);
    const n = 14;
    for (let s = 0; s < n; s++) {
      const cx = 4 + Math.floor(r() * (W - 8)), cy = 4 + Math.floor(r() * (H - 8));
      for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) {
        const i = (cx + x) + (cy + y) * W;
        U[i] = 0.5 + r() * 0.1; V[i] = 0.25 + r() * 0.1;
      }
    }
    [F, K] = PRESETS[((e % PRESETS.length) + PRESETS.length) % PRESETS.length];
  };
  const step = () => {
    for (let y = 0; y < H; y++) {
      const ym = ((y + H - 1) % H) * W, y0 = y * W, yp = ((y + 1) % H) * W;
      for (let x = 0; x < W; x++) {
        const xm = x === 0 ? W - 1 : x - 1, xp = x === W - 1 ? 0 : x + 1;
        const i = y0 + x;
        const u = U[i], v = V[i];
        const lu = U[y0 + xm] + U[y0 + xp] + U[ym + x] + U[yp + x] - 4 * u;
        const lv = V[y0 + xm] + V[y0 + xp] + V[ym + x] + V[yp + x] - 4 * v;
        const uvv = u * v * v;
        U2[i] = u + 0.2 * lu - uvv + F * (1 - u);
        V2[i] = v + 0.1 * lv + uvv - (F + K) * v;
      }
    }
    let tmp = U; U = U2; U2 = tmp; tmp = V; V = V2; V2 = tmp;
  };
  return (t) => {
    const e = Math.floor(t / EPOCH);
    const target = Math.floor((t - e * EPOCH) * RATE);
    if (e !== epoch || target < it) { epoch = e; it = 0; seed(e); }
    while (it < target) { step(); it++; }
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = (V[x + y * 2 * W] + V[x + (y * 2 + 1) * W]) * 0.5;
      const k = Math.min(1, v * 2.6);
      const si = Math.min(4, Math.floor(k * 5.5));
      g.set(x, y, k < 0.04 ? "·" : SHADE[Math.max(1, si)], KEYS[Math.min(NR - 1, Math.floor(k * NR))]);
    }
    return g.frame();
  };
}
