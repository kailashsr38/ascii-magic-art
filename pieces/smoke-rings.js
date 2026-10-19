/* smoke-rings: a chimney puffs out smoke rings that rise, widen, wobble and thin away into the dusk. */
import { Grid, palette, gradient, KEYS, fbm, clamp, TAU } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("sky", gradient(["#0e0c1a", "#18162a", "#24203a", "#34284a", "#4a3456", "#6a4258"], 8));
add("haze", gradient(["#2a2a3e", "#3a3a52", "#4e4e66"], 3));
add("smoke", gradient(["#2e3044", "#4a4c62", "#6c6e84", "#9496a8", "#bcbecc", "#e4e4ec", "#ffffff"], 12));
add("brick", ["#1a0c0a", "#3a1a14", "#5a2a1e", "#7a3a26"]);
add("roof", ["#08080e", "#12121c"]);

export const meta = {
  slug: "smoke-rings",
  name: "Rising Smoke Rings",
  category: "demoscene",
  note: "A brick chimney puffs out smoke rings that rise, widen, wobble and slowly thin away into a dusky sky.",
  tags: ["smoke", "rings", "vortex", "calm", "wallpaper", "hero"],
  cols: 84, rows: 36, fps: 24,
  palette: palette(all),
};

const K = (n, i) => KEYS[G[n] + i];
const P = 4.4, LIFE = 13.2, NR = 3;
const SH = "░▒▓█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const N = cols * rows;
  const dens = new Float32Array(N), lit = new Float32Array(N), zb = new Float32Array(N);
  const cx = cols / 2, top = rows - 6;
  const tilt = 0.32, ct = Math.cos(tilt), st = Math.sin(tilt);
  const L = [0.4, -0.75, 0.5];
  return (t) => {
    dens.fill(0); lit.fill(0); zb.fill(-1e9);
    for (let k = 0; k < NR; k++) {
      const off = k * P;
      const n = Math.floor((t + off) / LIFE);
      const a = t + off - n * LIFE;
      const tau = 5.5;
      const ry = top - 2 - a * 2.05 - 3 * (1 - Math.exp(-a / tau));
      const rxc = cx + Math.sin(a * 0.4 + n * 2.1 + k) * a * 0.3;
      const Rm = 3 + a * 1.1, rm = 1.1 + a * 0.12;
      const fade = clamp(a / 0.5) * clamp(1 - a / LIFE) ** 0.8;
      const nu = Math.ceil(Rm * 13), nv = 9;
      const wob = 0.06 + a * 0.012;
      for (let i = 0; i < nu; i++) {
        const u = (i / nu) * TAU;
        const rr = Rm * (1 + wob * Math.sin(u * 3 + a * 1.3 + k) * 0.6 + wob * 0.4 * Math.sin(u * 5 - a));
        const cu = Math.cos(u), su = Math.sin(u);
        for (let j = 0; j < nv; j++) {
          const v = (j / nv) * TAU;
          const cv = Math.cos(v), sv = Math.sin(v);
          const px = (rr + rm * cv) * cu, py = rm * sv, pz = (rr + rm * cv) * su;
          const nx = cv * cu, ny = sv, nz = cv * su;
          // tilt the ring so we look at it from slightly below
          const y2 = py * ct - pz * st, z2 = py * st + pz * ct;
          const ny2 = ny * ct - nz * st, nz2 = ny * st + nz * ct;
          const sx = Math.floor(rxc + px), sy = Math.floor(ry + y2 * 0.5);
          if (sx < 0 || sy < 0 || sx >= cols || sy >= rows) continue;
          const id = sx + sy * cols;
          dens[id] += fade * 0.35;
          if (z2 > zb[id]) { zb[id] = z2; lit[id] = clamp(0.35 + 0.65 * (nx * L[0] + ny2 * L[1] + nz2 * L[2])) * fade; }
        }
      }
    }
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const i = x + y * cols;
      // chimney and roof line
      const ridge = rows - 2 + Math.floor(Math.abs(x - cx) / 14);
      if (y >= ridge) { g.set(x, y, y === ridge ? "▄" : "█", K("roof", y === ridge ? 1 : 0)); continue; }
      if (Math.abs(x + 0.5 - cx) < 5 && y >= top) {
        const cap = y === top;
        const mortar = !cap && ((y - top) % 2 === 0 || (x + (y & 1) * 2) % 4 === 0);
        g.set(x, y, cap ? "▀" : mortar ? "▒" : "█", K("brick", cap ? 3 : mortar ? 0 : 1 + ((x + y) % 3 === 0 ? 1 : 0)));
        continue;
      }
      const d = dens[i];
      if (d > 0.08) {
        const v = clamp(lit[i] * 0.75 + Math.min(d, 1) * 0.35);
        g.set(x, y, SH[Math.min(3, Math.floor(clamp(d * 1.1) * 4))], K("smoke", Math.min(11, Math.floor(v * 12))));
        continue;
      }
      // dusk sky with faint rising haze
      const hz = fbm(x * 0.06, y * 0.1 + t * 0.25, 3, 5);
      const sk = y / rows;
      if (hz > 0.6 && y < top) g.set(x, y, "▒", K("haze", Math.min(2, Math.floor((hz - 0.6) * 12))));
      else g.set(x, y, (x * 3 + y) % 5 === 0 ? "·" : "░", K("sky", Math.min(7, Math.floor(sk * 8))));
    }
    return g.frame();
  };
}
