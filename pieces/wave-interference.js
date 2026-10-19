/* wave-interference: two point sources sending out circular waves that add and cancel into an interference pattern. */
import { Grid, palette, gradient, KEYS, clamp, TAU } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("wave", gradient(["#02041a", "#081a52", "#0e3a8a", "#1a1e3e", "#147a9a", "#3ac8d8", "#bff8ff", "#ffffff"], 20));
add("src", ["#ffd23a", "#ffffff"]);
add("ui", ["#5a6478", "#c8d0e0"]);

export const meta = {
  slug: "wave-interference",
  name: "Wave Interference",
  category: "motion-lab",
  note: "Two vibrating sources send out circular waves that reinforce and cancel, carving the classic fan of nodal lines as the sources drift apart.",
  tags: ["waves", "interference", "ripple", "physics", "wallpaper", "background"],
  cols: 96, rows: 34, fps: 24,
  palette: palette(all),
};

const K = (n, i) => KEYS[G[n] + i];
const SH = "░▒▓█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = cols / 2, cy = rows / 2 - 2;
  const LAM = 6.5, k = TAU / LAM, W = 5.2;
  return (t) => {
    g.clear();
    const d = 11 + 6 * Math.sin(t * 0.25);
    const s1 = [cx - d, cy], s2 = [cx + d, cy];
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const px = x + 0.5, py = (y + 0.5) * 2;
      const r1 = Math.hypot(px - s1[0], py - s1[1] * 2), r2 = Math.hypot(px - s2[0], py - s2[1] * 2);
      const a = Math.sin(k * r1 - W * t) / Math.sqrt(r1 * 0.15 + 1) + Math.sin(k * r2 - W * t) / Math.sqrt(r2 * 0.15 + 1);
      const v = clamp((a / 1.7 + 1) / 2);
      const m = Math.abs(a);
      g.set(x, y, SH[Math.min(3, Math.floor(m * 2.6))], K("wave", Math.min(19, Math.floor(v * 20))));
    }
    for (const [sx, sy] of [s1, s2]) {
      g.set(sx, sy, "●", K("src", 1));
      g.set(sx - 1, sy, "(", K("src", 0)); g.set(sx + 1, sy, ")", K("src", 0));
    }
    const label = ` wavelength ${LAM.toFixed(1)}  spacing ${(d * 2).toFixed(1)} `;
    g.text(cols - label.length - 1, rows - 1, label, K("ui", 1));
    return g.frame();
  };
}
