/* vaporwave-sun: a striped retro sun sinking into a neon grid sea, cloud streaks drifting and a CRT roll passing over. */
import { Grid, palette, gradient, KEYS, fbm, noise2, clamp } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("sky", gradient(["#07031a", "#160737", "#2e0b58", "#561272", "#8c1a80", "#c82e88", "#f2578c", "#ff8a8a"], 16));
add("sun", gradient(["#fff48a", "#ffd84e", "#ffb042", "#ff8048", "#ff5066", "#ff2f86", "#d81c8c"], 12));
add("floor", gradient(["#06021a", "#10052c", "#1c0840"], 3));
add("grid", gradient(["#3a0e6e", "#7a1eb0", "#c632d0", "#ff5ad8", "#ffb0f0"], 8));
add("refl", gradient(["#7a1a6a", "#ff3f7a", "#ff9a48", "#ffe27a"], 6));
add("mount", ["#12052a", "#1e0a44", "#3c167a", "#9a48e0", "#ff7ae0"]);
add("cloud", ["#3a0a50", "#6a1460", "#a02470"]);
add("star", ["#bfa8ff"]);

export const meta = {
  slug: "vaporwave-sun",
  name: "Vaporwave Sun",
  category: "demoscene",
  note: "A striped retro sun sinks into a scrolling neon grid sea while cloud streaks drift past and a CRT roll bar slides down the screen.",
  tags: ["vaporwave", "retro", "sunset", "neon", "hero", "wallpaper"],
  cols: 96, rows: 32, fps: 24,
  palette: palette(all),
};

const K = (n, i) => KEYS[G[n] + i];
const SKYCH = " .:░░▒▒▓";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const H = 19, cx = cols / 2 - 0.5, cy = H - 1.5, R = 17;
  // static mountain ridge heights per column
  const ridge = new Float32Array(cols);
  for (let x = 0; x < cols; x++) {
    const side = Math.abs(x - cx);
    const base = clamp((side - 15) / 30) * 7.5;
    ridge[x] = base * (0.55 + 0.6 * fbm(x * 0.09, 3.3, 3, 4));
  }
  const stars = [];
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(noise2(i * 3.1, 0.5, 9) * 997) % cols, y = Math.floor(noise2(i * 1.7, 4.5, 11) * 991) % 9;
    stars.push([x, y]);
  }
  const inSun = (x, sy, t) => {
    const dx = x - cx, dy = (sy - cy) * 2;
    if (dx * dx + dy * dy > R * R) return 0;
    const v = (sy - (cy - R / 2)) / (R / 2 + 1.5); // 0 top .. 1 horizon
    if (v > 0.42) {
      const w = 0.15 + (v - 0.42) * 1.6;
      const p = (((sy - t * 1.1) % 2.2) + 2.2) % 2.2;
      if (p < w) return 0;
    }
    return 1 + clamp(v) * 10.99;
  };
  return (t) => {
    g.clear();
    const roll = ((t * 5) % (rows + 10)) - 5;
    for (let y = 0; y < rows; y++) {
      const dim = Math.abs(y - roll) < 1.5;
      if (y < H) {
        for (let x = 0; x < cols; x++) {
          // sky with a glow around the sun
          const dx = x - cx, dy = (y - cy) * 2;
          const d = Math.sqrt(dx * dx + dy * dy);
          const glow = clamp(1 - (d - R) / 26);
          let lv = clamp(y / H * 0.75 + glow * 0.35);
          if (dim) lv *= 0.7;
          let ch = SKYCH[Math.min(SKYCH.length - 1, Math.floor(lv * SKYCH.length))], co = K("sky", Math.min(15, Math.floor(lv * 16)));
          // drifting stripe clouds
          const cl = fbm(x * 0.035 - t * 0.06, y * 0.55, 3, 2);
          const band = y > 4 && y < H - 3;
          const cloudy = band && cl > 0.61;
          // sun disc with moving gaps
          const a = inSun(x, y + 0.25, t), b = inSun(x, y + 0.75, t);
          if (cloudy) { ch = cl > 0.68 ? "▓" : "▒"; co = K("cloud", cl > 0.68 ? 2 : glow > 0.5 ? 1 : 0); }
          if (a || b) {
            const k = Math.floor(Math.max(a, b) - 1);
            ch = a && b ? "█" : a ? "▀" : "▄";
            co = K("sun", Math.min(11, k + (dim ? 1 : 0)));
          }
          // mountains on the flanks
          const top = H - ridge[x];
          if (y >= Math.floor(top)) {
            const edge = y === Math.floor(top);
            ch = edge ? (top - Math.floor(top) < 0.5 ? "▄" : "▁") : (x + y) % 3 ? "▓" : "█";
            co = edge ? K("mount", 3) : K("mount", y - top < 2 ? 2 : (x + y) % 3 ? 1 : 0);
            if (edge && ridge[x] > 5.5) co = K("mount", 4);
          }
          g.set(x, y, ch, co);
        }
      } else {
        // perspective floor
        const dz = y - H + 0.55;
        const Z0 = 9 / dz, Z1 = 9 / (dz + 1), s = t * 1.6;
        const hline = Math.floor(Z0 + s) !== Math.floor(Z1 + s);
        const near = (y - H) / (rows - H);
        for (let x = 0; x < cols; x++) {
          const X0 = (x - cx) / dz * 1.1, X1 = (x + 1 - cx) / dz * 1.1;
          const vline = Math.floor(X0) !== Math.floor(X1);
          let ch = (x + y) % 2 ? "░" : "▒", co = K("floor", Math.min(2, Math.floor(near * 3)));
          // broken sun reflection
          const rw = R * (0.55 + near * 0.35);
          if (Math.abs(x - cx) < rw) {
            const ph = ((Z0 * 0.9 + s * 0.9 + noise2(x * 0.15, y, 5) * 0.6) % 1 + 1) % 1;
            const edgeFade = 1 - Math.abs(x - cx) / rw;
            if (ph < 0.55 && edgeFade > 0.15) {
              const lv = clamp(edgeFade * (1 - near * 0.5));
              ch = lv > 0.6 ? "▓" : lv > 0.3 ? "▒" : "░";
              co = K("refl", Math.min(5, Math.floor(lv * 6)));
            }
          }
          const gl = Math.min(7, Math.floor(1 + near * 7));
          if (hline && vline) { ch = "┼"; co = K("grid", gl); }
          else if (hline) { ch = "─"; co = K("grid", gl); }
          else if (vline) { ch = Math.abs(x - cx) < 1 ? "│" : x < cx ? "╱" : "╲"; co = K("grid", Math.max(1, gl - 1)); }
          if (dim) co = K("grid", 0);
          g.set(x, y, ch, co);
        }
      }
    }
    for (const [x, y] of stars) if (g.get(x, y) === " " || g.get(x, y) === "." || g.get(x, y) === ":") g.set(x, y, "·", K("star", 0));
    g.hline(0, cols - 1, H, "━", K("grid", 7));
    return g.frame();
  };
}
