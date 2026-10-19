/* pendulum-wave: a row of pendulums with tuned lengths drifting in and out of phase, making snakes and waves. */
import { Grid, palette, gradient, KEYS, clamp, TAU } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("bg", gradient(["#0a0c16", "#10142a", "#161c38", "#1e2646"], 4));
add("bar", ["#3a3f4e", "#8a92a4", "#d0d6e2"]);
add("str", ["#3e465e", "#6a7490"]);
add("bob", gradient(["#ff5a6a", "#ff9a3a", "#ffd23a", "#7ee787", "#3ad0c8", "#58a6ff", "#a07aff", "#ff6ad0"], 16));
add("hi", ["#ffffff"]);
add("shadow", ["#1c2030", "#262c40"]);
add("ui", ["#5a6478", "#8b949e"]);

export const meta = {
  slug: "pendulum-wave",
  name: "Pendulum Wave",
  category: "motion-lab",
  note: "Fifteen pendulums with carefully tuned lengths swing in and out of phase, forming travelling waves, snakes and chaos before realigning.",
  tags: ["pendulum", "waves", "harmonics", "physics", "hero", "loader"],
  cols: 90, rows: 32, fps: 30,
  palette: palette(all),
};

const K = (n, i) => KEYS[G[n] + i];
const N = 15, CYCLE = 36, BASE = 24;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const top = 3, x0 = 10, dx = (cols - 20) / (N - 1);
  const EL = 0.7;                  // camera looks down 40 degrees, swings move toward and away from it
  const ce = Math.cos(EL), se = Math.sin(EL);
  return (t) => {
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = (y / rows) * 0.8 + ((x * 7 + y * 13) % 5 === 0 ? 0.15 : 0);
      g.set(x, y, (x + y) % 2 ? "░" : " ", K("bg", Math.min(3, Math.floor(v * 4))));
    }
    const lt = t % CYCLE;
    // the frame
    g.hline(x0 - 6, cols - x0 + 5, top, "═", K("bar", 1));
    g.set(x0 - 7, top, "╔", K("bar", 1)); g.set(cols - x0 + 6, top, "╗", K("bar", 1));
    for (let y = top + 1; y < rows - 2; y++) { g.set(x0 - 7, y, "║", K("bar", 0)); g.set(cols - x0 + 6, y, "║", K("bar", 0)); }
    g.hline(x0 - 9, cols - x0 + 8, rows - 2, "▀", K("bar", 0));
    const bobs = [];
    for (let i = 0; i < N; i++) {
      const f = (BASE + i) / CYCLE;          // oscillations per second
      const len = Math.pow(BASE / (BASE + i), 2);
      const L = 22 * len;                     // rows of string at rest
      const th = 0.5 * Math.cos(TAU * f * lt);
      const sx = x0 + i * dx;
      const down = L * Math.cos(th), out = L * Math.sin(th);
      const by = top + down * ce + out * se;
      const bx = sx + out * 0.12 * (sx - cols / 2) / (cols / 2);
      bobs.push([sx, bx, by, th, i, out]);
    }
    // shadows on the floor show the swing direction
    for (const [sx, , , , , out] of bobs) g.text(Math.round(sx + out * 0.1) - 1, rows - 3, "▁▁▁", K("shadow", out > 0 ? 1 : 0));
    for (const [sx, bx, by] of bobs) {
      const steps = Math.ceil(by - top);
      for (let j = 1; j < steps; j++) g.set(sx + ((bx - sx) * j) / steps, top + j, "│", K("str", j > steps - 3 ? 1 : 0));
      g.set(sx, top, "┬", K("bar", 2));
    }
    // nearer bobs drawn bigger and later
    bobs.sort((a, b) => a[5] - b[5]);
    for (const [, bx, by, , i, out] of bobs) {
      const c = K("bob", Math.min(15, Math.floor((i / (N - 1)) * 15)));
      const x0 = Math.round(bx) - 2, y0 = Math.round(by - 0.5);
      g.text(x0, y0, "▄██▄", c);
      g.text(x0, y0 + 1, "▀██▀", c);
      g.set(x0 + 1, y0, "▄", K("hi", 0));
    }
    const sec = lt.toFixed(1).padStart(4);
    g.text(cols - 22, rows - 1, `t = ${sec}s / ${CYCLE}s`, K("ui", 1));
    g.text(2, rows - 1, "pendulum wave · 15 bobs", K("ui", 0));
    return g.frame();
  };
}
