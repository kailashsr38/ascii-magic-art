/* himalaya-peaks: high snow peaks above drifting cloud, prayer flags fluttering in the foreground. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, TAU } from "../lib/kit.js";

const P = [];
const grp = (hexes) => {
  const o = P.length, n = hexes.length;
  P.push(...hexes);
  return (v) => KEYS[o + (v <= 0 ? 0 : v >= 1 ? n - 1 : Math.floor(v * n))];
};
const SKY = grp(gradient(["#0a2460", "#1c4a9a", "#4a82cc", "#9cc4ec"], 10));
const SNOW = grp(gradient(["#34446e", "#6a80b0", "#b4c6e4", "#ffffff"], 10));
const ROCK = grp(gradient(["#1a1e2e", "#2e3448", "#4a5068"], 5));
const FARM = grp(["#7a92c0", "#a8bcdc"]);
const CLOUD = grp(gradient(["#c0cce0", "#e8eef8", "#ffffff"], 4));
const GROUND = grp(gradient(["#1a120e", "#3a2a1e", "#5a4430"], 5));
const POLE = grp(["#4a3424", "#8a6a48"]);
const STRING = grp(["#c8b8a0"]);
const FLAGS = [grp(["#1a5ad8", "#3a7aff"]), grp(["#d8dce4", "#ffffff"]), grp(["#c82020", "#ff3a3a"]), grp(["#1a9a3a", "#3ad05a"]), grp(["#e8b800", "#ffdc3a"])];

export const meta = {
  slug: "himalaya-peaks",
  name: "Himalaya Peaks",
  category: "landscapes",
  note: "Sharp snow peaks rise above drifting cloud while strings of prayer flags flutter in the wind.",
  tags: ["mountains", "snow", "prayer flags", "himalaya", "landscape", "wallpaper"],
  cols: 100, rows: 36, fps: 20,
  palette: palette(P),
};

const SH = "░▒▓█";
const sh = (v) => SH[v <= 0 ? 0 : v >= 1 ? 3 : Math.floor(v * 4)];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const ridged = (x, s, f) => { let v = 0, a = 0.6, fr = f; for (let o = 0; o < 4; o++) { v += a * (1 - Math.abs(2 * noise2(x * fr, o * 3, s + o) - 1)); a *= 0.5; fr *= 2; } return v; };
  const main = Float32Array.from({ length: cols + 2 }, (_, i) => {
    const x = i - 1;
    return 33 - Math.pow(ridged(x, 3, 0.035), 1.8) * 24 - 7 * Math.exp(-(((x - 58) / 16) ** 2)) - 3 * Math.exp(-(((x - 22) / 10) ** 2));
  });
  const far = Float32Array.from({ length: cols }, (_, x) => 18 - ridged(x + 40, 9, 0.05) * 10);
  const tex = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) tex[x + y * cols] = noise2(x * 0.5, y * 0.12, 5) * 0.6 + noise2(x * 0.15, y * 0.3, 6) * 0.4;
  const groundTop = (x) => 30 + 2.5 * Math.sin(x * 0.05) + noise2(x * 0.2, 2, 9) * 2;

  return (t) => {
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = clamp(y / 22 + (fbm(x * 0.03, y * 0.2 - t * 0.02, 2, 1) - 0.5) * 0.15);
      g.set(x, y, "█", SKY(v));
      if (y >= far[x]) g.set(x, y, y - far[x] < 2 ? "▓" : "█", FARM(y - far[x] < 2 ? 1 : 0));
    }
    // main range: sunlit faces white, shadow faces blue, rock showing low down
    for (let x = 0; x < cols; x++) {
      const top = main[x + 1];
      const s = main[x + 2] - main[x];           // > 0 falls away to the right; sun is to the left
      for (let y = Math.ceil(top); y < rows; y++) {
        const depth = y - top, tx = tex[x + y * cols];
        const snowline = 21 + tx * 6;
        if (y > snowline) { g.set(x, y, tx > 0.55 ? "▓" : "█", ROCK(clamp(tx * 0.9 - depth * 0.01))); continue; }
        const lit = clamp(0.5 - s * 0.7 + (tx - 0.5) * 0.6 - depth * 0.03);
        g.set(x, y, sh(0.5 + lit), SNOW(lit));
      }
    }
    // cloud drifting through the valleys
    for (let y = 14; y < 32; y++) {
      const lane = Math.exp(-(((y - 23) / 4.5) ** 2));
      for (let x = 0; x < cols; x++) {
        const n = fbm(x * 0.04 - t * 0.22, y * 0.25 + t * 0.03, 4, 12);
        const c = n * lane * 1.8 - 0.5;
        if (c > 0.04) g.set(x, y, c > 0.18 ? "█" : "▓", CLOUD(clamp(c * 2.5)));
      }
    }
    // foreground ridge
    for (let x = 0; x < cols; x++) for (let y = Math.floor(groundTop(x)); y < rows; y++)
      g.set(x, y, noise2(x * 0.4, y * 0.8, 3) > 0.6 ? "▓" : "█", GROUND(clamp(0.3 + noise2(x * 0.2, y * 0.5, 4) * 0.6 - (y - 30) * 0.05)));
    // pole and two strings of flags
    for (let y = 13; y < 33; y++) { g.set(7, y, "█", POLE(1)); g.set(8, y, "▌", POLE(0)); }
    g.set(7, 12, "▲", POLE(1));
    const lines = [[8, 15, cols, 21, 3], [8, 20, cols, 29, 2.5]];
    lines.forEach(([x0, y0, x1, y1, sag], li) => {
      let k = 0;
      for (let x = x0; x < x1; x++) {
        const u = (x - x0) / (x1 - x0);
        const sagNow = sag * (1 + 0.1 * Math.sin(t * 1.3 + li));
        const y = y0 + (y1 - y0) * u + sagNow * 4 * u * (1 - u);
        g.set(x, y, "─", STRING(0));
        if ((x - x0) % 4 === 1 && x + 2 < cols) {
          const fl = FLAGS[k % 5];
          const flap = Math.sin(t * 7 + x * 0.5 + li * 2);
          const fy = Math.floor(y) + 1;
          g.set(x, fy, "█", fl(1)); g.set(x + 1, fy, flap > -0.4 ? "█" : "▓", fl(flap > 0 ? 1 : 0)); if (flap > 0.3) g.set(x + 2, fy, "▌", fl(0));
          g.set(x + (flap > 0 ? 1 : 0), fy + 1, "█", fl(0)); g.set(x + 1 + (flap > 0 ? 1 : 0), fy + 1, flap > 0.5 ? "▀" : "▓", fl(0));
          k++;
        }
      }
    });
    return g.frame();
  };
}
