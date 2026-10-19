/* falling-sand: coloured sand pours from moving spouts, piles into striped dunes, then drains through a trapdoor. */
import { Grid, palette, gradient, KEYS, rng, clamp } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("bg", gradient(["#08090f", "#0e1220", "#141a30", "#1a2240"], 4));
add("wall", ["#3a3f52", "#5a6278", "#8a92a8"]);
const SAND = ["#e8c27a", "#d88a4a", "#c85a3a", "#f0dca8", "#b8743a", "#e8a0a0", "#f4e4c4", "#9a6a3a"];
SAND.forEach((c, i) => add("s" + i, [c]));
add("dark", SAND.map((c) => {
  const v = [1, 3, 5].map((i) => Math.round(parseInt(c.slice(i, i + 2), 16) * 0.62));
  return "#" + v.map((x) => x.toString(16).padStart(2, "0")).join("");
}));
add("ui", ["#5a6478", "#8b949e"]);

export const meta = {
  slug: "falling-sand",
  name: "Falling Sand",
  category: "motion-lab",
  note: "Three moving spouts pour coloured sand that tumbles and piles into striped dunes, then a trapdoor opens and the box drains to start again.",
  tags: ["sand", "particles", "cellular-automaton", "physics", "loader", "hourglass"],
  cols: 80, rows: 32, fps: 30,
  palette: palette(all),
};

const K = (n, i) => KEYS[G[n] + i];
const SPS = 40, PER = 24, POUR = 15.5, OPEN = 16.5;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const L = 2, R = cols - 3, B = rows - 2;           // inner box: x in [L, R], y in [0, B)
  const W = cols, H = rows;
  const cell = new Uint8Array(W * H), moved = new Uint8Array(W * H);
  let n = 0, rand;
  const reset = () => { cell.fill(0); n = 0; rand = rng(4242); };
  const step = () => {
    const tt = n / SPS;
    moved.fill(0);
    const open = tt > OPEN;
    const ltr = n % 2 === 0;
    for (let y = B - 1; y >= 0; y--) {
      for (let k = L; k <= R; k++) {
        const x = ltr ? k : L + R - k;
        const i = x + y * W;
        const c = cell[i];
        if (!c || moved[i]) continue;
        const below = y + 1;
        if (below >= B) {
          // the trapdoor in the middle of the floor
          if (open && (tt > 22.6 || Math.abs(x - cols / 2) < 5)) { cell[i] = 0; }
          continue;
        }
        const d = x + below * W;
        if (!cell[d]) { cell[d] = c; cell[i] = 0; moved[d] = 1; continue; }
        const first = rand() < 0.5 ? -1 : 1;
        for (const s of [first, -first]) {
          const nx = x + s;
          if (nx < L || nx > R) continue;
          const dd = nx + below * W;
          if (!cell[dd] && !cell[nx + y * W]) { cell[dd] = c; cell[i] = 0; moved[dd] = 1; break; }
        }
      }
    }
    if (tt < POUR) {
      const band = 1 + (Math.floor(tt / 2) % SAND.length);
      for (let s = 0; s < 3; s++) {
        const sx = Math.round(cols * (0.22 + s * 0.28) + Math.sin(tt * (0.5 + s * 0.23) + s * 2) * 9);
        if (rand() < 0.85) { const i = sx + 1 * W; if (!cell[i]) cell[i] = 1 + ((band - 1 + s * 3) % SAND.length); }
      }
    }
    n++;
  };
  reset();
  return (t) => {
    const lt = t % PER;
    const want = Math.floor(lt * SPS);
    if (want < n) reset();
    while (n < want) step();
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = 0.25 + (y / rows) * 0.6;
      g.set(x, y, (x * 3 + y) % 5 === 0 ? "·" : "░", K("bg", Math.min(3, Math.floor(v * 4))));
    }
    const tt = n / SPS;
    for (let y = 0; y < B; y++) for (let x = L; x <= R; x++) {
      const c = cell[x + y * W];
      if (!c) continue;
      const falling = moved[x + y * W] && y + 1 < B && !cell[x + (y + 1) * W];
      const top = y === 0 || !cell[x + (y - 1) * W];
      if (falling) g.set(x, y, "•", K("s" + (c - 1), 0));
      else g.set(x, y, top ? "▄" : (x + y) % 3 === 0 ? "▓" : "█", top ? K("s" + (c - 1), 0) : (x * 7 + y * 3) % 5 === 0 ? K("dark", c - 1) : K("s" + (c - 1), 0));
    }
    // box
    for (let y = 0; y <= B; y++) { g.set(L - 1, y, "█", K("wall", 1)); g.set(R + 1, y, "█", K("wall", 1)); }
    const open = tt > OPEN;
    for (let x = L - 1; x <= R + 1; x++) {
      const gap = open && (tt > 22.6 || Math.abs(x - cols / 2) < 5) && x >= L && x <= R;
      g.set(x, B, gap ? " " : "▀", K("wall", 2));
      if (!gap) g.set(x, B + 1, "▀", K("wall", 0));
    }
    // spouts
    if (tt < POUR) for (let s = 0; s < 3; s++) {
      const sx = Math.round(cols * (0.22 + s * 0.28) + Math.sin(tt * (0.5 + s * 0.23) + s * 2) * 9);
      g.text(sx - 1, 0, "▀█▀", K("wall", 2));
    }
    const label = tt < POUR ? "pouring" : open ? "draining" : "settling";
    g.text(cols - 12, rows - 1, label.padStart(10), K("ui", 1));
    return g.frame();
  };
}
