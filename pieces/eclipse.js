/* eclipse: the moon slides across the sun, the sky darkens and the corona flares out at totality. */
import { Grid, palette, gradient, KEYS, fbm, rng, clamp, smooth, TAU } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("sky", gradient(["#03050e", "#0a1230", "#16285a", "#24488a", "#3a6ab8", "#5a8ad8", "#86b0ee"], 14));
add("hor", gradient(["#1a1a3a", "#6a3a4a", "#c86a3a", "#f0a050"], 6));
add("sun", gradient(["#ffb040", "#ffd878", "#fff0c0", "#ffffff"], 6));
add("corona", gradient(["#1a2048", "#4a5a98", "#9aa8d8", "#dfe6ff", "#ffffff"], 10));
add("prom", ["#c8304a", "#ff6a7a"]);
add("moon", ["#020204", "#08080e"]);
add("land", ["#020308", "#060914", "#0c1222"]);
add("star", ["#c0caff"]);

export const meta = {
  slug: "eclipse",
  name: "Solar Eclipse",
  category: "cosmos",
  note: "The moon slides across the sun as the sky darkens, and at totality the pale corona flares out around the black disc.",
  tags: ["eclipse", "sun", "moon", "corona", "hero", "wallpaper"],
  cols: 96, rows: 38, fps: 24,
  palette: palette(all),
};

const K = (n, i) => KEYS[G[n] + i];
const SH = "░▒▓█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = cols / 2, cy = 15, RS = 12, RM = 13.4;
  const r = rng(61);
  const stars = Array.from({ length: 70 }, () => [Math.floor(r() * cols), Math.floor(r() * 28), r() * TAU]);
  const land = Array.from({ length: cols }, (_, x) => Math.round(rows - 3 - 7 * fbm(x * 0.07, 2, 3, 8)));
  const PER = 16;
  return (t) => {
    g.clear();
    const u = 1 - 2 * ((t % PER) / PER);
    const off = 34 * Math.sign(u) * Math.pow(Math.abs(u), 1.7);
    const mx = cx + off, my = cy + off * 0.06;
    const sep = Math.abs(off) / (RS + RM);
    const cover = clamp(1 - sep);
    const dark = smooth(clamp((cover - 0.45) / 0.55)) ** 1.4;
    const total = Math.abs(off) < RM - RS ? 1 : 0;
    const corona = smooth(clamp((cover - 0.9) / 0.1)) * (0.4 + 0.6 * total);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const dx = x + 0.5 - cx, dy = (y + 0.5 - cy) * 2;
      const rs = Math.hypot(dx, dy);
      const rm = Math.hypot(x + 0.5 - mx, (y + 0.5 - my) * 2);
      // sky brightens toward the horizon, dims with the eclipse, warm 360 degree sunset at totality
      const h = y / rows;
      const day = clamp(0.62 + h * 0.35 - dark * 0.68 + Math.exp(-rs / 22) * 0.25 * (1 - dark));
      const n = fbm(x * 0.05 + t * 0.03, y * 0.15, 3, 4);
      let v = clamp(day + (n - 0.5) * 0.12);
      g.set(x, y, v > 0.32 ? "▓" : v > 0.16 ? "▒" : "░", K("sky", Math.min(13, Math.floor(v * 14))));
      if (dark > 0.4 && y > rows - 12) {
        const hz = clamp((y - (rows - 12)) / 9) * dark;
        if (hz > 0.25) g.set(x, y, hz > 0.6 ? "▓" : "▒", K("hor", Math.min(5, Math.floor(hz * 6))));
      }
      // corona streamers
      if (corona > 0 && rs > RS * 0.95 && rm >= RM) {
        const a = Math.atan2(dy, dx);
        const str = fbm(Math.cos(a) * 3.2 + 7, Math.sin(a) * 3.2 + t * 0.05, 3, 11);
        const ray = Math.pow(str, 1.6) * 2.2;
        const I = corona * (Math.pow(RS / rs, 2.6) * (0.6 + ray) + Math.exp(-(rs - RS) / 1.6) * 0.5);
        if (I > 0.1) g.set(x, y, SH[Math.min(3, Math.floor(I * 4))], K("corona", Math.min(9, Math.floor(I * 10))));
      }
      // the sun's visible part, then the moon over it
      if (rs < RS && rm >= RM) {
        const limb = Math.sqrt(1 - (rs / RS) ** 2);
        const s = clamp(0.35 + limb * 0.7);
        const edge = RM - rm > -1.2 ? 1 : 0;
        g.set(x, y, "█", K("sun", Math.min(5, Math.floor(s * 6) + (cover > 0.92 && edge ? 2 : 0))));
      }
      if (rm < RM && (rs < RS + 0.3 || dark > 0.5)) {
        g.set(x, y, "█", K("moon", rm > RM - 1 ? 1 : 0));
        // prominences peeking past the limb at totality
        if (total && rs > RS - 0.6 && rs < RS + 1.2 && rm > RM - 1.3) {
          const a = Math.atan2(dy, dx);
          if (fbm(Math.cos(a) * 5, Math.sin(a) * 5, 2, 13) > 0.6) g.set(x, y, "▓", K("prom", 1));
        }
      }
    }
    // the diamond ring flash just before and after totality
    if (cover > 0.94 && !total) {
      const a = Math.atan2(cy - my, cx - mx);
      const fx = cx + Math.cos(a) * RS, fy = cy + (Math.sin(a) * RS) / 2;
      for (let k = -6; k <= 6; k++) {
        const b = 1 - Math.abs(k) / 7;
        g.set(fx + k, fy, b > 0.6 ? "█" : "─", K("sun", Math.min(5, Math.floor(b * 6))));
        if (Math.abs(k) < 3) g.set(fx, fy + k, "│", K("sun", 4));
      }
      g.set(fx, fy, "●", K("sun", 5));
    }
    if (dark > 0.55) for (const [sx, sy, ph] of stars) {
      if (Math.sin(t * 1.5 + ph) < 0 || g.get(sx, sy) === "█") continue;
      const dx = sx - cx, dy = (sy - cy) * 2;
      if (Math.hypot(dx, dy) < RS * 2.4) continue;
      g.set(sx, sy, "·", K("star", 0));
    }
    for (let x = 0; x < cols; x++) for (let y = land[x]; y < rows; y++) g.set(x, y, y === land[x] ? "▄" : "█", K("land", y === land[x] ? 2 - Math.round(dark) : Math.round(1 - dark)));
    return g.frame();
  };
}
