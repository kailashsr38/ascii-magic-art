/* rice-terraces: green stepped rice terraces wrapping the hills, clouds drifting through. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, TAU } from "../lib/kit.js";

const P = [];
const grp = (hexes) => {
  const o = P.length, n = hexes.length;
  P.push(...hexes);
  return (v) => KEYS[o + (v <= 0 ? 0 : v >= 1 ? n - 1 : Math.floor(v * n))];
};
const SKY = grp(gradient(["#5a9ad8", "#8cbce8", "#cfe4f4"], 6));
const MTN = grp(gradient(["#5a7e94", "#86a6b4", "#b4ccd4"], 5));
const PADDY = grp(gradient(["#3e7a1e", "#5ea226", "#8cc83a", "#c4e866"], 10));
const RISER = grp(gradient(["#1a3810", "#2c5418", "#4a6e24"], 4));
const WATER = grp(gradient(["#6a9aa8", "#a8d0d8", "#e0f4f4"], 4));
const SHOOT = grp(["#4a8a2a", "#86c040"]);
const CLOUD = grp(gradient(["#c8d8e0", "#ecf4f8", "#ffffff"], 4));
const HUT = grp(["#4a3020", "#8a6a3a", "#c8a058"]);

export const meta = {
  slug: "rice-terraces",
  name: "Rice Terraces",
  category: "landscapes",
  note: "Bright green rice terraces step down the hillsides while soft clouds drift across the valley.",
  tags: ["rice", "terraces", "hills", "green", "landscape", "wallpaper"],
  cols: 96, rows: 36, fps: 20,
  palette: palette(P),
};

const SH = "░▒▓█";
const sh = (v) => SH[v <= 0 ? 0 : v >= 1 ? 3 : Math.floor(v * 4)];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  // elevation field in screen space: contours become the terrace edges
  const band = new Int16Array(cols * rows), wet = new Uint8Array(cols * 16);
  const N = 14;
  const edge = (x, k) => 9 + 2.4 * k + 0.1 * k * k
    - (1 - k / 16) * (7 * Math.exp(-(((x - 22) / 17) ** 2)) + 6 * Math.exp(-(((x - 74) / 15) ** 2)) - 2 * Math.exp(-(((x - 49) / 8) ** 2)))
    + 1.2 * Math.sin(x * 0.07 + k * 0.6);
  for (let x = 0; x < cols; x++) {
    for (let k = 0; k < 16; k++) wet[x + k * cols] = k % 3 === 2 && noise2(x * 0.06, k * 3, 4) > 0.45 ? 1 : 0;
    for (let y = 0; y < rows; y++) {
      let b = -1;
      for (let k = 0; k < N; k++) if (y >= edge(x, k)) b = k;
      band[x + y * cols] = b;
    }
  }
  const huts = [[30, 0], [66, 0]];
  return (t) => {
    g.clear();
    // sky and distant ranges
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      if (band[x + y * cols] >= 0) continue;
      const m1 = 3 + 3 * fbm(x * 0.04, 1, 3, 4), m2 = 5 + 2.5 * fbm(x * 0.06 + 5, 2, 3, 5);
      if (y >= m2) g.set(x, y, "█", MTN(0.1 + (y - m2) * 0.1));
      else if (y >= m1) g.set(x, y, "▓", MTN(0.6));
      else g.set(x, y, y < 2 ? "█" : "▓", SKY(y / 5 + fbm(x * 0.05 - t * 0.05, y * 0.4, 2, 1) * 0.3));
    }
    // terraces: flat paddy, a dark riser at each step, some flooded fields
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const b = band[x + y * cols];
      if (b < 0) continue;
      const below = y + 1 < rows ? band[x + (y + 1) * cols] : b;
      const aboveB = y > 0 ? band[x + (y - 1) * cols] : b;
      const haze = clamp(1 - y / 18) * 0.35;
      if (below !== b) {
        g.set(x, y, "█", RISER(clamp(0.2 + haze * 2)));
      } else if (wet[x + b * cols]) {
        const ripple = Math.sin(x * 0.4 + t * 1.2 + y) * 0.5 + 0.5;
        const shoot = (x + b * 3) % 3 === 0 && aboveB === b;
        g.set(x, y, shoot ? "▓" : "█", shoot ? SHOOT(1) : WATER(clamp(0.2 + haze + ripple * 0.4)));
      } else {
        const wave = Math.sin(x * 0.3 - t * 1.5 + y * 0.8 + b) * 0.5 + 0.5;
        const v = clamp(0.3 + haze + (b % 2) * 0.18 + wave * 0.1 + (aboveB !== b ? 0.3 : 0));
        g.set(x, y, "█", PADDY(v));
      }
    }
    // two little field huts
    for (const [hx] of huts) {
      let hy = 0;
      while (hy < rows - 1 && band[hx + hy * cols] < 0) hy++;
      hy += 4;
      g.text(hx - 2, hy - 2, "▄███▄", HUT(2));
      g.text(hx - 3, hy - 1, "▀▀▀▀▀▀▀", HUT(1));
      g.text(hx - 1, hy, "█▌█", HUT(0));
    }
    // clouds drifting low through the valley
    for (let y = 6; y < rows - 4; y++) {
      const lane = Math.exp(-(((y - 13) / 4) ** 2)) * 0.7 + Math.exp(-(((y - 24) / 3) ** 2)) * 0.55;
      for (let x = 0; x < cols; x++) {
        const n = fbm(x * 0.045 + t * (y < 18 ? 0.25 : -0.18), y * 0.22, 4, 9);
        const c = n * lane * 1.7 - 0.45;
        if (c > 0.06) g.set(x, y, c > 0.2 ? "█" : "▓", CLOUD(clamp(c * 2.5)));
      }
    }
    return g.frame();
  };
}
