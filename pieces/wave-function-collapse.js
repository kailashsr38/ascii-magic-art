/* wave-function-collapse: a terrain map solved tile by tile, each choice narrowing what its neighbours can still become. */
import { Grid, palette, KEYS, rng } from "../lib/kit.js";

const TER = [
  ["#0a2a5a", "#123a7a"], ["#1a5aa8", "#2a74c8"], ["#c8b070", "#e0c888"], ["#3a8a3a", "#5aaa48"],
  ["#1a5a2a", "#246a34"], ["#7a6048", "#9a7a5a"], ["#dce6f0", "#ffffff"],
];
const all = [...TER.flat(), "#262b3e", "#353c56", "#4a5472", "#66729a", "#fff0a0"];

export const meta = {
  slug: "wave-function-collapse",
  name: "Wave Function Collapse",
  category: "algorithms",
  note: "A terrain map is solved by wave function collapse, the lowest entropy tile collapsing first and every choice narrowing what its neighbours can become.",
  tags: ["wfc", "procedural", "map", "algorithm", "tiles", "hero"],
  cols: 96, rows: 32, fps: 24,
  palette: palette(all),
};

const TW = 48, TH = 32, NT = TW * TH, P = 15, SOLVE = 11;
const WEIGHT = [3, 4, 2, 6, 4, 2, 1];
const GLY = [["▓", "≈"], ["▒", "~"], ["░", "▒"], ["▒", "\""], ["▲", "▓"], ["▓", "▲"], ["█", "▓"]];
const POP = new Uint8Array(128).map((_, m) => { let c = 0; while (m) { c += m & 1; m >>= 1; } return c; });
const pop = (m) => POP[m];
const UNK = 14, HI = 18;

function solve(seed) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const r = rng(seed * 97 + attempt * 7919 + 1);
    const mask = new Uint8Array(NT).fill(127);
    const tie = new Float32Array(NT).map(() => r());
    const hist = Array.from({ length: NT }, () => [[0, 127]]);
    let step = 0, ok = true;
    const q = [];
    for (;;) {
      let bi = -1, be = 99;
      for (let i = 0; i < NT; i++) {
        const c = pop(mask[i]);
        if (c > 1 && c + tie[i] < be) { be = c + tie[i]; bi = i; }
      }
      if (bi < 0) break;
      step++;
      // weighted pick among the remaining options
      let tot = 0;
      for (let k = 0; k < 7; k++) if (mask[bi] >> k & 1) tot += WEIGHT[k];
      let v = r() * tot, pick = 0;
      for (let k = 0; k < 7; k++) if (mask[bi] >> k & 1) { v -= WEIGHT[k]; if (v <= 0) { pick = k; break; } }
      mask[bi] = 1 << pick; hist[bi].push([step, mask[bi]]);
      q.length = 0; q.push(bi);
      while (q.length && ok) {
        const i = q.pop(), m = mask[i];
        const allow = (m | (m << 1) | (m >> 1)) & 127;
        const x = i % TW, y = (i - x) / TW;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const X = x + dx, Y = y + dy;
          if (X < 0 || Y < 0 || X >= TW || Y >= TH) continue;
          const j = X + Y * TW, nm = mask[j] & allow;
          if (nm === mask[j]) continue;
          if (!nm) { ok = false; break; }
          mask[j] = nm; hist[j].push([step, nm]); q.push(j);
        }
      }
      if (!ok) break;
    }
    if (ok) return { hist, steps: step };
  }
  return null;
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  let cyc = -1, S = null;
  const cell = new Uint8Array(NT), at = new Int32Array(NT);
  return (t) => {
    const c = Math.floor(t / P), p = t - c * P;
    if (c !== cyc) { cyc = c; S = solve(c + 1); }
    const k = Math.floor(Math.min(1, p / SOLVE) * S.steps);
    const recent = Math.max(2, S.steps / (SOLVE * 24) * 6);
    for (let i = 0; i < NT; i++) {
      const h = S.hist[i];
      let j = 0;
      while (j + 1 < h.length && h[j + 1][0] <= k) j++;
      cell[i] = h[j][1]; at[i] = h[j][0];
    }
    for (let ty = 0; ty < TH; ty++) for (let tx = 0; tx < TW; tx++) {
      const i = tx + ty * TW, m = cell[i], n = pop(m);
      if (n === 1) {
        const v = 31 - Math.clz32(m);
        const fresh = k - at[i] < recent && p < SOLVE + 0.2;
        const hsh = (tx * 73856093) ^ (ty * 19349663);
        for (let s = 0; s < 2; s++) {
          const alt = ((hsh >>> (s * 3)) & 7) < 2;
          g.set(tx * 2 + s, ty, GLY[v][alt ? 1 : 0], fresh ? KEYS[HI] : KEYS[v * 2 + (((hsh >>> (s + 5)) & 3) === 0 ? 1 : 0)]);
        }
      } else {
        // undecided: the fewer options left, the more solid it looks
        const ch = n >= 6 ? "·" : n >= 4 ? ":" : "░";
        const key = KEYS[UNK + (n >= 6 ? 0 : n >= 4 ? 1 : n === 3 ? 2 : 3)];
        g.set(tx * 2, ty, ch, key); g.set(tx * 2 + 1, ty, n >= 6 ? " " : ch, key);
      }
    }
    return g.frame();
  };
}
