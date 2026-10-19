/* spring-mass: masses bouncing on coil springs, a light one, a heavy one and a coupled pair trading energy. */
import { Grid, palette, gradient, KEYS, clamp, TAU } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("bg", gradient(["#0e1220", "#141a2c", "#1a2238", "#222c48"], 4));
add("bar", ["#3a4050", "#7a8294", "#c0c8d6"]);
add("coil", gradient(["#7a869e", "#b8c4d8", "#f0f4fa"], 3));
add("m0", ["#7a1a24", "#d0384a", "#ff8a96"]);
add("m1", ["#0e3a7a", "#2a72d8", "#8ac0ff"]);
add("m2", ["#0e5a3a", "#24a86a", "#8ae8b8"]);
add("m3", ["#6a4a0a", "#d89a1a", "#ffd878"]);
add("ruler", ["#3a4256", "#6a7488", "#a8b0c0"]);

export const meta = {
  slug: "spring-mass",
  name: "Spring Mass",
  category: "motion-lab",
  note: "Masses bob on coil springs at their own natural frequencies, and a coupled pair passes its energy back and forth between two normal modes.",
  tags: ["spring", "oscillator", "harmonic", "physics", "loader", "readme"],
  cols: 84, rows: 34, fps: 30,
  palette: palette(all),
};

const K = (n, i) => KEYS[G[n] + i];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const TOP = 2;
  const PHI = (1 + Math.sqrt(5)) / 2;
  const spring = (x, y0, y1, turns, w, k) => {
    // one half-turn of wire per row, so the coil never aliases however far it stretches
    const ys = Math.ceil(y0), ye = Math.ceil(y1);
    for (let y = ys; y < ye; y++) {
      const odd = (y - ys) & 1;
      g.set(x - w, y, odd ? "┌" : "└", K("coil", Math.max(0, k - 1)));
      for (let i = 1 - w; i < w; i++) g.set(x + i, y, "─", K("coil", odd ? Math.max(0, k - 1) : k));
      g.set(x + w, y, odd ? "┘" : "┐", K("coil", k));
    }
  };
  const mass = (x, y, w, h, key, label) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const edge = i === 0 || j === 0;
      g.set(x - (w >> 1) + i, y + j, j === 0 ? "▄" : "█", K(key, edge ? 2 : i === w - 1 || j === h - 1 ? 0 : 1));
    }
    g.text(x - (label.length >> 1), y + (h >> 1), label, K(key, 2));
    g.set(x, y - 1, "┴", K("bar", 1));
  };
  return (t) => {
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = 0.3 + 0.5 * Math.exp(-Math.abs(y - 14) / 14);
      g.set(x, y, (x + y) % 2 ? "░" : " ", K("bg", Math.min(3, Math.floor(v * 4))));
    }
    // ceiling bar
    g.hline(2, cols - 9, TOP - 1, "▄", K("bar", 1));
    g.hline(2, cols - 9, TOP, "▀", K("bar", 0));
    // a light mass, quick
    const y0 = 14 + 4.5 * Math.cos(t * 3.1);
    spring(12, TOP + 1, y0 - 1, 6, 3, 2);
    mass(12, y0, 11, 4, "m0", "1 kg");
    // a heavy mass, slow and deep
    const y1 = 17 + 5 * Math.cos(t * 1.9 + 1);
    spring(32, TOP + 1, y1 - 1, 7, 4, 2);
    mass(32, y1, 13, 5, "m1", "4 kg");
    // a coupled pair: two normal modes mixed, so the motion beats
    const w1 = 2.2 * Math.sqrt((3 - Math.sqrt(5)) / 2), w2 = 2.2 * Math.sqrt((3 + Math.sqrt(5)) / 2);
    const a = 2.6 * Math.cos(w1 * t), b = 1.6 * Math.cos(w2 * t + 0.4);
    const d1 = a + b, d2 = a * PHI - b / PHI;
    const ya = 10 + d1, yb = 22 + d2;
    spring(56, TOP + 1, ya - 1, 5, 3, 2);
    mass(56, ya, 11, 3, "m2", "1 kg");
    spring(56, ya + 3, yb - 1, 5, 3, 1);
    mass(56, yb, 11, 3, "m3", "1 kg");
    // ruler with centimetre ticks
    for (let y = TOP + 1; y < rows - 1; y++) {
      const major = (y - TOP) % 5 === 0;
      g.set(cols - 7, y, "│", K("ruler", 1));
      g.text(cols - 6, y, major ? "─" : "╴", K("ruler", major ? 2 : 0));
      if (major) g.text(cols - 4, y, String((y - TOP) * 2).padStart(2), K("ruler", 1));
    }
    // markers on the ruler follow each mass
    for (const [y, key] of [[y0 + 2, "m0"], [y1 + 2, "m1"], [ya + 1, "m2"], [yb + 1, "m3"]]) g.set(cols - 8, y, "▶", K(key, 2));
    return g.frame();
  };
}
