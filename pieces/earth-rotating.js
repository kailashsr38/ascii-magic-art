/* earth-rotating: a tilted globe turning in sunlight, continents, clouds and ice, city lights on the night side. */
import { Grid, palette, gradient, KEYS, fbm, rng, clamp, TAU } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("bg", gradient(["#020308", "#060a1c", "#0c1230", "#141a40"], 6));
add("star", ["#8090d0", "#ffffff"]);
add("sea", gradient(["#041030", "#0a2a6a", "#1450a8", "#2a7ad0", "#62a8ec"], 8));
add("land", gradient(["#0c2a10", "#1e5a22", "#3a8a34", "#6aac48", "#a8c870"], 8));
add("sand", gradient(["#4a3418", "#9a7840", "#d8b878", "#f0dca8"], 5));
add("ice", ["#a8b8cc", "#e4ecf6", "#ffffff"]);
add("cloud", gradient(["#6a7890", "#b8c4d4", "#ffffff"], 4));
add("night", ["#070c1e", "#0e1a3a", "#16261c"]);
add("city", ["#c08a30", "#ffd270"]);
add("dusk", ["#5a2a1a", "#c8642a"]);
add("atmo", gradient(["#0a2a6a", "#2a6ad8", "#7ab8ff"], 4));

export const meta = {
  slug: "earth-rotating",
  name: "Rotating Earth",
  category: "cosmos",
  note: "The earth turns on its tilted axis, continents and clouds sliding from daylight across the terminator into city-lit night.",
  tags: ["earth", "globe", "planet", "world", "hero", "wallpaper"],
  cols: 96, rows: 40, fps: 20,
  palette: palette(all),
};

const K = (n, i) => KEYS[G[n] + i];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = cols / 2, cy = rows / 2, R = 34;
  const L = (() => { const v = [-0.78, -0.25, 0.58]; const l = Math.hypot(...v); return v.map((a) => a / l); })();
  const TILT = 0.41, ct = Math.cos(TILT), st = Math.sin(TILT);
  const r = rng(23);
  const stars = Array.from({ length: 140 }, () => [Math.floor(r() * cols), Math.floor(r() * rows), r() * TAU, r()]);
  const bgn = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) bgn[x + y * cols] = fbm(x * 0.04, y * 0.09, 3, 12);

  return (t) => {
    g.clear();
    const spin = t * 0.35, cs = Math.cos(spin), ss = Math.sin(spin);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const dx = x + 0.5 - cx, dy = (y + 0.5 - cy) * 2;
      const d = Math.hypot(dx, dy) / R;
      if (d >= 1) {
        // space, with a thin atmosphere glow at the limb
        const glow = d < 1.09 ? (1.09 - d) / 0.09 : 0;
        const lit = clamp(0.4 + ((dx * L[0] + dy * L[1]) / (R * d)) * 0.8);
        if (glow > 0 && lit > 0.15) { g.set(x, y, glow > 0.5 ? "▒" : "░", K("atmo", Math.min(3, Math.floor(glow * lit * 4)))); continue; }
        const v = clamp(bgn[x + y * cols] * 0.8 - 0.1);
        g.set(x, y, v > 0.45 ? "▒" : "░", K("bg", Math.min(5, Math.floor(v * 6))));
        continue;
      }
      const nx = dx / R, ny = dy / R, nz = Math.sqrt(1 - d * d);
      const lum = nx * L[0] + ny * L[1] + nz * L[2];
      // into the body frame: undo axial tilt, then spin about the pole
      const ax = nx * ct + ny * st, ay = -nx * st + ny * ct;
      const bx = ax * cs + nz * ss, bz = -ax * ss + nz * cs, by = ay;
      const h = 0.5 * (fbm(bx * 1.3 + bz * 0.6 + 5, by * 1.6 + 2, 4, 1) + fbm(bz * 1.3 - bx * 0.6 + 9, by * 1.6 - bx * 0.4, 4, 2));
      const land = h > 0.53;
      const lat = Math.abs(by);
      const ice = lat > 0.86 || (lat > 0.74 && land);
      const dry = land && fbm(bx * 2 + 3, bz * 2 + by, 2, 3) > 0.55 && lat < 0.5;
      const cl = fbm(bx * 2.2 - bz * 0.7 + t * 0.04, by * 3.2 + bz * 0.9, 3, 4);
      const cloud = clamp((cl - 0.55) * 4);
      if (lum < -0.06) {
        // night side
        if (land && !ice && fbm(bx * 9, by * 9 + bz * 9, 2, 7) > 0.6) g.set(x, y, lum < -0.25 ? "•" : "·", K("city", h > 0.6 ? 1 : 0));
        else g.set(x, y, land ? "▒" : "░", K("night", land ? 2 : 1));
        continue;
      }
      const s = clamp(lum * 1.15 + 0.12);
      if (lum < 0.08) {
        g.set(x, y, "▒", K("dusk", lum > 0.01 ? 1 : 0));
        continue;
      }
      if (cloud > 0.35) { g.set(x, y, cloud > 0.75 ? "█" : "▓", K("cloud", Math.min(3, Math.floor(s * cloud * 4.4)))); continue; }
      if (ice) g.set(x, y, "█", K("ice", Math.min(2, Math.floor(s * 3))));
      else if (dry) g.set(x, y, "█", K("sand", Math.min(4, Math.floor(s * 5))));
      else if (land) g.set(x, y, "█", K("land", Math.min(7, Math.floor(s * (0.6 + h) * 7))));
      else {
        const spec = Math.pow(clamp(lum), 10);
        g.set(x, y, spec > 0.5 ? "▓" : "█", K("sea", Math.min(7, Math.floor(s * 6 + spec * 3))));
      }
    }
    for (const [sx, sy, ph, b] of stars) {
      if (g.get(sx, sy) !== "░") continue;
      const tw = 0.5 + 0.5 * Math.sin(t * (1 + b * 2) + ph);
      g.set(sx, sy, b > 0.85 && tw > 0.5 ? "+" : tw > 0.35 ? "·" : ".", K("star", b > 0.5 ? 1 : 0));
    }
    return g.frame();
  };
}
