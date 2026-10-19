/* arctic-icebergs: icebergs drifting on a dark polar sea under a faint aurora. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp } from "../lib/kit.js";

const P = [];
const add = (a) => { const o = P.length; P.push(...a); return o; };
const SKY = add(gradient(["#03060f", "#071428", "#0e2240", "#1a3458"], 8));
const AUR = add(gradient(["#0e4a3a", "#1a8a5a", "#3ad08a", "#9af0c0"], 6));
const ICE = add(gradient(["#1a3a5a", "#3a6a94", "#7aa8cc", "#bcdcef", "#f2fbff"], 10));
const SEA = add(gradient(["#02050c", "#06111f", "#0c2034", "#173350"], 6));
const SUB = add(["#0e3a52", "#1a5a72"]);
const STAR = add(["#8090b0", "#e0e8ff"]);

export const meta = {
  slug: "arctic-icebergs",
  name: "Arctic Icebergs",
  category: "landscapes",
  note: "Icebergs drift on a dark polar sea under a faint green aurora, the swell rolling past them.",
  tags: ["nature", "arctic", "ice", "ocean", "aurora", "wallpaper"],
  cols: 100, rows: 36, fps: 20,
  palette: palette(P),
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(61);
  const hz = 21;
  const stars = Array.from({ length: 70 }, () => [Math.floor(r() * cols), Math.floor(r() * (hz - 2)), r(), r() * 6.28]);
  // icebergs: jagged profiles, [cx, halfWidth, height, seed, bob phase]
  const bergs = [[22, 16, 11, 1, 0], [62, 9, 6, 2, 2], [84, 12, 9, 3, 4], [44, 4, 3, 4, 1]].map(([cx, w, h, s, ph]) => {
    const prof = [];
    for (let i = -w; i <= w; i++) {
      const u = i / w;
      const base = h * Math.pow(Math.max(0, 1 - u * u), 0.35) * (0.6 + 0.45 * noise2(i * 0.2, s * 3, 4));
      const jag = (noise2(i * 0.5, s * 10, 7) - 0.5) * h * 0.3;
      prof.push(Math.max(0, base + jag));
    }
    return { cx, w, h, prof, ph };
  });
  return (t) => {
    g.clear();
    // night sky with a faint aurora curtain
    for (let y = 0; y < hz; y++) for (let x = 0; x < cols; x++) {
      const v = y / hz;
      const curtainY = 5 + Math.sin(x * 0.06 + t * 0.25) * 2.5 + Math.sin(x * 0.021 - t * 0.15) * 2;
      const rays = fbm(x * 0.25 + t * 0.15, t * 0.1, 2, 13);
      const a = Math.exp(-(((y - curtainY) / (3 + rays * 3)) ** 2)) * (0.3 + rays) * (0.65 + 0.35 * Math.sin(t * 0.4 + x * 0.03));
      if (a > 0.32) g.set(x, y, a > 0.75 ? "▓" : a > 0.5 ? "▒" : "░", KEYS[AUR + clamp(Math.floor(a * 6), 0, 5)]);
      else g.set(x, y, v > 0.6 ? "▒" : "░", KEYS[SKY + clamp(Math.floor(v * 7 + rays), 0, 7)]);
    }
    for (const [sx, sy, b, ph] of stars) {
      const ki = KEYS.indexOf(g.co[sx + sy * cols]);
      if (ki >= AUR && ki < AUR + 6) continue;
      if (Math.sin(t * 1.5 + ph) > -0.3) g.set(sx, sy, b > 0.85 ? "*" : "·", KEYS[STAR + (b > 0.6 ? 1 : 0)]);
    }
    // the sea: rolling swell with aurora light smeared on it
    for (let y = hz; y < rows; y++) {
      const d = (y - hz) / (rows - hz);
      for (let x = 0; x < cols; x++) {
        const w = fbm(x * 0.06 - t * 0.25, y * 0.5 + t * 0.15, 3, 3);
        const swell = Math.sin(x * 0.12 + y * 0.9 - t * 1.6) * 0.15;
        const aur = Math.exp(-(((x - 50 - Math.sin(t * 0.25) * 20) / 30) ** 2)) * (w > 0.55 ? 1 : 0) * (1 - d);
        const v = clamp(0.35 + d * 0.3 + (w - 0.5) * 0.7 + swell);
        if (aur > 0.45) g.set(x, y, "-", KEYS[AUR + 2]);
        else g.set(x, y, v > 0.6 ? "▓" : v > 0.35 ? "▒" : "░", KEYS[SEA + clamp(Math.floor(v * 6), 0, 5)]);
      }
    }
    // icebergs: lit from the left, bobbing, with a submerged shelf and a reflection
    for (const b of bergs) {
      const bob = Math.sin(t * 0.9 + b.ph) * 0.6;
      const drift = Math.sin(t * 0.05 + b.ph) * 3;
      for (let i = 0; i < b.prof.length; i++) {
        const x = Math.round(b.cx + drift) + i - b.w;
        const top = hz - b.prof[i] + bob;
        const slope = (b.prof[Math.min(b.prof.length - 1, i + 1)] - b.prof[Math.max(0, i - 1)]);
        for (let y = Math.floor(top); y < hz; y++) {
          const depthIn = y - top;
          const u = (i - b.w) / b.w;
          const lit = clamp(0.62 - u * 0.4 - depthIn * 0.035 + slope * 0.06 + (noise2(x * 0.4, y * 0.7, 3) - 0.5) * 0.3 + (y === Math.floor(top) ? 0.2 : 0));
          g.set(x, y, lit > 0.75 ? "█" : lit > 0.45 ? "▓" : "▒", KEYS[ICE + clamp(Math.floor(lit * 10), 0, 9)]);
        }
        // pale shelf under the water and broken reflection
        const shelf = Math.round(b.prof[i] * 0.5);
        for (let y = hz; y < Math.min(rows, hz + shelf); y++) {
          const wob = Math.sin(y * 2 + t * 2 + x * 0.3) > 0.2;
          g.set(x + (wob ? 1 : 0), y, wob ? "▒" : "░", KEYS[SUB + (y - hz < 2 ? 1 : 0)]);
        }
        g.set(x, hz, "▀", KEYS[ICE + 8]);
      }
    }
    return g.frame();
  };
}
