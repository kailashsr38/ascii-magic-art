/* spiral-galaxy: a tilted two-armed spiral galaxy turning slowly, with a warm core, blue arms and pink star nurseries. */
import { Grid, palette, gradient, KEYS, fbm, rng, clamp, TAU } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("bg", gradient(["#020309", "#060a1c", "#0e1230", "#181a40"], 6));
add("core", gradient(["#3a2410", "#8a5a24", "#d8a050", "#f6d898", "#fff4dc", "#ffffff"], 10));
add("arm", gradient(["#0a1030", "#1c2c6a", "#3456a8", "#6488d8", "#a8c0f4", "#e8f0ff"], 12));
add("pink", ["#8a2a6a", "#d4509a", "#ff9ccc"]);
add("star", ["#8fa0e0", "#ffffff"]);

export const meta = {
  slug: "spiral-galaxy",
  name: "Spiral Galaxy",
  category: "cosmos",
  note: "A tilted spiral galaxy turns slowly, its golden core feeding two blue arms dotted with pink star nurseries.",
  tags: ["galaxy", "stars", "spiral", "wallpaper", "hero"],
  cols: 104, rows: 40, fps: 24,
  palette: palette(all),
};

const K = (n, i) => KEYS[G[n] + i];
const SH = "░▒▓█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = cols / 2, cy = rows / 2, S = 0.52, ROT = 0.32;
  const cr = Math.cos(ROT), sr = Math.sin(ROT);
  const PITCH = 0.36, W = 0.12;
  const r = rng(17);
  const stars = Array.from({ length: 120 }, () => [Math.floor(r() * cols), Math.floor(r() * rows), r() * TAU, r()]);
  // disk stars that ride the arms
  const dstars = Array.from({ length: 160 }, () => {
    const rad = 4 + r() * 40, arm = r() < 0.5 ? 0 : Math.PI;
    return [rad, arm + Math.log(rad) / PITCH + (r() - 0.5) * 0.7, r() * TAU];
  });
  return (t) => {
    g.clear();
    const spin = t * W;
    const cs = Math.cos(-spin), ss = Math.sin(-spin);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const dx = x + 0.5 - cx, dy = (y + 0.5 - cy) * 2;
      const u = dx * cr + dy * sr, w = (-dx * sr + dy * cr) / S;
      const rad = Math.hypot(u, w) + 0.001;
      // galaxy frame (co-rotating)
      const gu = u * cs - w * ss, gw = u * ss + w * cs;
      const th = Math.atan2(gw, gu);
      const armPh = 2 * (th - Math.log(rad) / PITCH);
      const arm = Math.pow(0.5 + 0.5 * Math.cos(armPh), 2.2);
      const lane = Math.pow(0.5 + 0.5 * Math.cos(armPh + 0.9), 6);
      const clump = fbm(gu * 0.18 + 40, gw * 0.18, 3, 5);
      const bulge = Math.exp(-rad / 6) * 1.4;
      const disk = Math.exp(-rad / 24) * (0.22 + 1.25 * arm * (0.45 + clump)) * (1 - 0.55 * lane * clamp(rad / 8));
      const I = clamp(bulge + disk);
      const haze = fbm(x * 0.05, y * 0.12, 3, 2);
      if (I < 0.07) {
        const v = clamp(haze * 0.8 - 0.1 + I * 2);
        g.set(x, y, v > 0.5 ? "▒" : "░", K("bg", Math.min(5, Math.floor(v * 6))));
        continue;
      }
      const ch = SH[Math.min(3, Math.floor(I * 5))];
      const warm = clamp(bulge / (bulge + disk + 0.001) * 1.4 - 0.2);
      if (warm > 0.5) g.set(x, y, ch, K("core", Math.min(9, Math.floor(I * 10))));
      else if (arm > 0.6 && clump > 0.62 && rad > 9) g.set(x, y, ch, K("pink", Math.min(2, Math.floor((clump - 0.62) * 14))));
      else g.set(x, y, ch, K("arm", Math.min(11, Math.floor(1 + I * 14 + warm * 3))));
    }
    for (const [sx, sy, ph, b] of stars) {
      if (g.get(sx, sy) !== "░") continue;
      const tw = 0.5 + 0.5 * Math.sin(t * (1 + b * 2) + ph);
      g.set(sx, sy, b > 0.85 && tw > 0.5 ? "+" : tw > 0.4 ? "·" : ".", K("star", b > 0.5 ? 1 : 0));
    }
    for (const [rad, a0, ph] of dstars) {
      const a = a0 + spin;
      const u = Math.cos(a) * rad, w = Math.sin(a) * rad * S;
      const x = cx + u * cr - w * sr, y = cy + (u * sr + w * cr) / 2;
      const tw = Math.sin(t * 2 + ph);
      if (tw > -0.3) g.set(x, y, tw > 0.6 ? "*" : "·", K("star", 1));
    }
    return g.frame();
  };
}
