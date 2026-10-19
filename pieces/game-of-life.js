/* game-of-life: Conway's Life on a wrapping board, coloured by cell age, reseeding when it settles. */
import { Grid, palette, rng } from "../lib/kit.js";

const pal = palette([
  "#fff6c8", "#ffd23f", "#9aff6a", "#3fe0c0", "#3fa0ff", "#5a5aff", "#8a4ad8", // 0-6 young to old
  "#1a1440", "#100c2a", "#2a2050", // 7 trail, 8 board dot, 9 trail bright
]);

export const meta = {
  slug: "game-of-life",
  name: "Game of Life",
  category: "algorithms",
  note: "Conway's Game of Life on a wrapping board, cells coloured by age, starting a fresh random board every 45 seconds, or sooner if it stalls.",
  tags: ["cellular", "automaton", "conway", "terminal", "wallpaper"],
  cols: 96, rows: 36, fps: 12,
  palette: pal,
};

const RATE = 12;          // generations per second
const EPOCH = 540;        // hard reseed every 45 s so time maps to a bounded computation

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const W = cols, H = rows * 2, N = W * H;
  let cur = new Uint8Array(N), nxt = new Uint8Array(N);
  const age = new Uint16Array(N), dead = new Uint8Array(N);
  let epoch = -1, gen = -1, seeds = 0, history = [];
  const seed = (s) => {
    const r = rng(s * 7919 + 13);
    for (let i = 0; i < N; i++) { cur[i] = r() < 0.32 ? 1 : 0; age[i] = 0; dead[i] = 9; }
    history = [];
  };
  const step = () => {
    let pop = 0;
    for (let y = 0; y < H; y++) {
      const ym = ((y + H - 1) % H) * W, y0 = y * W, yp = ((y + 1) % H) * W;
      for (let x = 0; x < W; x++) {
        const xm = (x + W - 1) % W, xp = (x + 1) % W;
        const n = cur[ym + xm] + cur[ym + x] + cur[ym + xp] + cur[y0 + xm] + cur[y0 + xp] + cur[yp + xm] + cur[yp + x] + cur[yp + xp];
        const i = y0 + x;
        const alive = n === 3 || (n === 2 && cur[i]);
        nxt[i] = alive ? 1 : 0;
        if (alive) { age[i] = cur[i] ? Math.min(age[i] + 1, 999) : 0; dead[i] = 0; pop++; }
        else if (dead[i] < 9) dead[i]++;
      }
    }
    [cur, nxt] = [nxt, cur];
    history.push(pop);
    if (history.length > 40) history.shift();
    // settled: the population has not changed for 40 generations, or nearly everything died
    if ((history.length === 40 && history.every((p) => p === history[0])) || pop < 25) { seeds++; seed(epoch * 1000 + seeds); }
  };
  return (t) => {
    const total = Math.floor(t * RATE);
    const e = Math.floor(total / EPOCH), target = total % EPOCH;
    if (e !== epoch || target < gen) { epoch = e; gen = 0; seeds = 0; seed(e * 1000); }
    while (gen < target) { step(); gen++; }
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const a = x + y * 2 * W, b = a + W;
      const ta = cur[a], tb = cur[b];
      if (ta || tb) {
        const ag = Math.min(ta ? age[a] : 999, tb ? age[b] : 999);
        const k = ag < 1 ? 0 : ag < 3 ? 1 : ag < 6 ? 2 : ag < 12 ? 3 : ag < 25 ? 4 : ag < 60 ? 5 : 6;
        g.set(x, y, ta && tb ? "█" : ta ? "▀" : "▄", String(k));
      } else {
        const d = Math.min(dead[a], dead[b]);
        if (d < 3) g.set(x, y, "▒", "9");
        else if (d < 7) g.set(x, y, "░", "7");
        else g.set(x, y, (x + y) % 2 ? "·" : " ", "8");
      }
    }
    return g.frame();
  };
}
