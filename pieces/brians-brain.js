/* brians-brain: the Brian's Brain cellular automaton, firing cells dying into refractory trails that sweep across the grid. */
import { Grid, palette, gradient, KEYS, rng } from "../lib/kit.js";

const GLOW = gradient(["#0c1030", "#1a1c5a", "#3a1e8a", "#6a2ab0", "#a03ac8", "#e05ad0"], 6);
const all = ["#ffffff", "#a8f0ff", "#3ab0ff", ...GLOW, "#07081a"];

export const meta = {
  slug: "brians-brain",
  name: "Brian's Brain",
  category: "algorithms",
  note: "The Brian's Brain cellular automaton: firing cells turn refractory then rest, so gliders and spreading wavefronts sweep endlessly across the grid.",
  tags: ["cellular-automaton", "simulation", "emergence", "neurons", "wallpaper", "terminal"],
  cols: 96, rows: 34, fps: 20,
  palette: palette(all),
};

const RATE = 10, PER = 45;
const FIRE = KEYS[0], FIRE2 = KEYS[1], DYING = KEYS[2], G0 = 3, BG = KEYS[3 + GLOW.length];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const N = cols * rows;
  let s = new Uint8Array(N), s2 = new Uint8Array(N);
  const last = new Int32Array(N);
  let cyc = -1, n = 0;
  const reset = (c) => {
    const r = rng(c * 53 + 11);
    s.fill(0); last.fill(-999); n = 0;
    // a few dense seed patches so wavefronts spread outward from them
    for (let k = 0; k < 7; k++) {
      const cx = Math.floor(r() * cols), cy = Math.floor(r() * rows), R = 3 + Math.floor(r() * 4);
      for (let y = -R; y <= R; y++) for (let x = -R * 2; x <= R * 2; x++) {
        if (r() < 0.45) s[((cx + x + cols) % cols) + ((cy + y + rows) % rows) * cols] = 1;
      }
    }
  };
  const step = () => {
    for (let y = 0; y < rows; y++) {
      const ym = ((y + rows - 1) % rows) * cols, y0 = y * cols, yp = ((y + 1) % rows) * cols;
      for (let x = 0; x < cols; x++) {
        const xm = x ? x - 1 : cols - 1, xp = x === cols - 1 ? 0 : x + 1, i = y0 + x;
        const v = s[i];
        if (v === 1) { s2[i] = 2; continue; }
        if (v === 2) { s2[i] = 0; continue; }
        const c = (s[ym + xm] === 1) + (s[ym + x] === 1) + (s[ym + xp] === 1) + (s[y0 + xm] === 1) +
          (s[y0 + xp] === 1) + (s[yp + xm] === 1) + (s[yp + x] === 1) + (s[yp + xp] === 1);
        s2[i] = c === 2 ? 1 : 0;
      }
    }
    const tmp = s; s = s2; s2 = tmp; n++;
    let alive = 0;
    for (let i = 0; i < N; i++) if (s[i] === 1) { last[i] = n; alive++; }
    return alive;
  };
  return (t) => {
    const c = Math.floor(t / PER), want = Math.floor((t - c * PER) * RATE);
    if (c !== cyc || want < n) { cyc = c; reset(c); }
    while (n < want) {
      const alive = step();
      if (alive < 8 || (alive < 90 && n % 20 === 0)) { // rekindle with a fresh patch when the brain goes quiet
        const r = rng(n * 31 + c * 7 + 3);
        const cx = Math.floor(r() * cols), cy = Math.floor(r() * rows), R = 3 + Math.floor(r() * 3);
        for (let y = -R; y <= R; y++) for (let x = -R * 2; x <= R * 2; x++) if (r() < 0.45) s[((cx + x + cols) % cols) + ((cy + y + rows) % rows) * cols] = 1;
      }
    }
    for (let i = 0; i < N; i++) {
      const x = i % cols, y = (i - x) / cols;
      if (s[i] === 1) g.set(x, y, "█", (x + y) & 1 ? FIRE : FIRE2);
      else if (s[i] === 2) g.set(x, y, "▓", DYING);
      else {
        const age = n - last[i];
        if (age < 24) {
          const k = Math.max(0, GLOW.length - 1 - Math.floor(age / 4));
          g.set(x, y, age < 8 ? "▒" : age < 16 ? "░" : "·", KEYS[G0 + k]);
        } else g.set(x, y, (x + y) & 1 ? "·" : " ", BG);
      }
    }
    return g.frame();
  };
}
