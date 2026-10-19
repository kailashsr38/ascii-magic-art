/* lissajous: an oscilloscope tracing Lissajous figures that morph as the phase drifts and the frequency ratio steps. */
import { Grid, palette, gradient, KEYS, clamp, TAU } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("bg", gradient(["#020604", "#04100a", "#081a10"], 3));
add("grid", ["#0c2a18", "#164a2a", "#2a7a44"]);
add("beam", gradient(["#0a3a1a", "#1a7a34", "#2ec456", "#7aff9a", "#d8ffe0", "#ffffff"], 12));
add("ui", ["#2a7a44", "#7aff9a"]);

export const meta = {
  slug: "lissajous",
  name: "Lissajous Scope",
  category: "motion-lab",
  note: "A green oscilloscope traces Lissajous figures, the curves twisting as the phase drifts and snapping to a new frequency ratio every few seconds.",
  tags: ["oscilloscope", "lissajous", "harmonics", "retro", "loader", "terminal"],
  cols: 80, rows: 32, fps: 30,
  palette: palette(all),
};

const K = (n, i) => KEYS[G[n] + i];
const RATIOS = [[1, 2], [3, 2], [1, 1], [3, 4], [2, 3], [1, 3], [5, 4], [4, 3]];
const HOLD = 6;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const X0 = 2, Y0 = 1, W = cols - 4, H = rows - 4;
  const cx = X0 + W / 2, cy = Y0 + H / 2;
  const top = new Float32Array(cols * rows), bot = new Float32Array(cols * rows);
  return (t) => {
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = 0.6 - Math.hypot((x - cx) / W, (y - cy) / H) * 0.9;
      g.set(x, y, "░", K("bg", Math.max(0, Math.min(2, Math.floor(v * 3)))));
    }
    // graticule
    for (let y = Y0; y <= Y0 + H; y++) for (let x = X0; x <= X0 + W; x++) {
      const gx = (x - X0) % 8 === 0, gy = (y - Y0) % 4 === 0;
      const axis = Math.abs(x - cx) < 0.5 || Math.abs(y - cy) < 0.5;
      if (gx && gy) g.set(x, y, "┼", K("grid", axis ? 2 : 1));
      else if (axis) g.set(x, y, Math.abs(y - cy) < 0.5 ? "─" : "│", K("grid", 1));
      else if (gx || gy) g.set(x, y, "·", K("grid", 0));
    }
    g.box(X0 - 1, Y0 - 1, W + 3, H + 3, "round", K("grid", 2));
    // beam: accumulate hits, with a dimmer echo of the curve a moment ago for phosphor persistence
    const k = Math.floor(t / HOLD) % RATIOS.length;
    const [a, b] = RATIOS[k];
    const fadeIn = clamp(((t % HOLD) / HOLD) * 8);
    top.fill(0); bot.fill(0);
    for (const [lag, wgt] of [[0.3, 0.35], [0.15, 0.6], [0, 1]]) {
      const d = (t - lag) * 0.55;
      const N = 2400;
      for (let i = 0; i < N; i++) {
        const s = (i / N) * TAU;
        const x = cx + Math.sin(a * s + d) * (W / 2 - 1), y = cy + Math.sin(b * s) * (H / 2 - 0.25);
        const xi = Math.floor(x), yi = Math.floor(y);
        if (xi < 0 || yi < 0 || xi >= cols || yi >= rows) continue;
        const j = xi + yi * cols;
        if (y - yi < 0.5) { if (wgt > top[j]) top[j] = wgt; } else if (wgt > bot[j]) bot[j] = wgt;
      }
    }
    for (let i = 0; i < cols * rows; i++) {
      const u = top[i], l = bot[i];
      if (!u && !l) continue;
      const v = Math.max(u, l) * fadeIn;
      if (v < 0.05) continue;
      g.ch[i] = u && l ? "█" : u ? "▀" : "▄";
      g.co[i] = K("beam", Math.min(11, Math.floor(1 + v * 10.9)));
    }
    g.text(X0 + 1, rows - 1, ` X:Y = ${a}:${b} `, K("ui", 1));
    g.text(cols - 20, rows - 1, ` phase ${(((t * 0.55 * 180) / Math.PI) % 360).toFixed(0).padStart(3)}° `, K("ui", 0));
    return g.frame();
  };
}
