/* binary-stars: a heavy orange star and a light blue companion swing around their shared centre of mass on Kepler ellipses, trailing their paths. */
import { Grid, palette, gradient, KEYS, noise2, fbm, clamp, TAU } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("a", gradient(["#3a1206", "#7a2a0a", "#c0520e", "#f08a20", "#ffc050", "#fff0b0", "#ffffff"], 10));
add("b", gradient(["#081a3a", "#123a7a", "#2a6ac0", "#5aa8f0", "#a8dcff", "#f0faff", "#ffffff"], 10));
add("ta", ["#4a1e0a", "#7a3a12", "#b0601e", "#e08a30"]);
add("tb", ["#102a4a", "#1a4a7a", "#2a70b0", "#5aa0e0"]);
add("sky", ["#04050c", "#080a18", "#0e1024", "#161834"]);
add("star", ["#5a6080", "#c8d0f0"]);
add("cm", ["#5a6478"]);

export const meta = {
  slug: "binary-stars",
  name: "Binary Star Orbit",
  category: "motion-lab",
  note: "A heavy orange star and a lighter blue companion swing around their shared centre of mass on Kepler ellipses, speeding up at closest approach and leaving fading trails.",
  tags: ["orbit", "gravity", "kepler", "stars", "space", "hero"],
  cols: 96, rows: 34, fps: 30,
  palette: palette(all),
};

const K = (n, i) => KEYS[G[n] + i];
const P = 9, E = 0.55, M1 = 0.68, M2 = 0.32, NTR = 140;

function rel(t) {
  const M = ((t / P) % 1) * TAU;
  let e = M;
  for (let i = 0; i < 8; i++) e -= (e - E * Math.sin(e) - M) / (1 - E * Math.cos(e));
  const x = Math.cos(e) - E, y = Math.sqrt(1 - E * E) * Math.sin(e);
  return [x, y];
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = cols / 2, cy = rows / 2;
  const SX = 40, SY = 40 * 0.5 * 0.62, ROT = 0.35;
  const cr = Math.cos(ROT), sr = Math.sin(ROT);
  const scr = (x, y) => [cx + (x * cr - y * sr) * SX, cy + (x * sr + y * cr) * SY, x * sr + y * cr];
  const bg = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const n = fbm(x * 0.05, y * 0.1, 3, 8), h = noise2(x * 9.1, y * 7.3, 2);
    if (h > 0.975) bg.push([h > 0.992 ? "•" : "·", K("star", h > 0.99 ? 1 : 0)]);
    else bg.push([n > 0.58 ? "░" : (x + y * 2) % 5 ? " " : "·", K("sky", n > 0.58 ? 3 : n > 0.5 ? 2 : 1)]);
  }
  const pos = (t) => {
    const [x, y] = rel(t);
    return [scr(-M2 * x, -M2 * y), scr(M1 * x, M1 * y)];
  };
  return (t) => {
    for (let i = 0; i < bg.length; i++) { g.ch[i] = bg[i][0]; g.co[i] = bg[i][1]; }
    const [A, B] = pos(t);
    // glow halos
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const da = Math.hypot(x + 0.5 - A[0], (y + 0.5 - A[1]) * 2), db = Math.hypot(x + 0.5 - B[0], (y + 0.5 - B[1]) * 2);
      const ia = 16 / (da * da + 4), ib = 7 / (db * db + 3);
      const I = ia + ib;
      if (I < 0.06) continue;
      const lv = clamp(Math.sqrt(I) * 0.6);
      const which = ia * 1.1 > ib ? "a" : "b";
      g.set(x, y, lv > 0.55 ? "▓" : lv > 0.35 ? "▒" : lv > 0.22 ? "░" : "·", K(which, Math.min(6, Math.floor(lv * 9))));
    }
    // trails sampled from the recent past
    for (let k = NTR; k >= 1; k--) {
      const [a, b] = pos(t - (k / NTR) * P * 0.85);
      const lv = Math.min(3, Math.floor((1 - k / NTR) * 4));
      const ch = k % 2 ? "·" : "•";
      if (g.get(a[0], a[1]) !== "▓" && g.get(a[0], a[1]) !== "▒") g.set(a[0], a[1], ch, K("ta", lv));
      if (g.get(b[0], b[1]) !== "▓") g.set(b[0], b[1], ch, K("tb", lv));
    }
    g.set(cx, cy, "+", K("cm", 0));
    // star discs, the farther one first
    const disc = (S, r, name) => {
      for (let y = Math.floor(S[1] - r); y <= S[1] + r; y++) for (let x = Math.floor(S[0] - r * 2); x <= S[0] + r * 2; x++) {
        const u = (x + 0.5 - S[0]) / (r * 2), v = (y + 0.5 - S[1]) / r, d = u * u + v * v;
        if (d > 1) continue;
        const l = clamp(1 - d * 0.7 + (-u - v) * 0.15);
        g.set(x, y, "█", K(name, Math.min(9, 5 + Math.floor(l * 5))));
      }
    };
    const order = A[2] < B[2] ? [[A, 2.1, "a"], [B, 1.3, "b"]] : [[B, 1.3, "b"], [A, 2.1, "a"]];
    for (const [S, r, n] of order) disc(S, r, n);
    return g.frame();
  };
}
