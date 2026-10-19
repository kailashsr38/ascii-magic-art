/* golden-gate-fog: a red suspension bridge with thick fog rolling in beneath the deck. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, TAU } from "../lib/kit.js";

const P = [];
const grp = (hexes) => {
  const o = P.length, n = hexes.length;
  P.push(...hexes);
  return (v) => KEYS[o + (v <= 0 ? 0 : v >= 1 ? n - 1 : Math.floor(v * n))];
};
const SKY = grp(gradient(["#2a4a7a", "#5a7aa8", "#c8a8a8", "#f8c890", "#ffe4b8"], 12));
const HILL = grp(["#2a3448", "#3e4a60", "#5a6478"]);
const SEA = grp(gradient(["#0e1e30", "#1e3450", "#34506e"], 5));
const RED = grp(["#5a1408", "#8e2412", "#c4381a", "#e8582a"]);
const FOG = grp(gradient(["#8a90a0", "#b4b8c4", "#dcdee4", "#f6f6f8"], 8));
const LIGHT = grp(["#ffd88a"]);

export const meta = {
  slug: "golden-gate-fog",
  name: "Bridge in the Fog",
  category: "landscapes",
  note: "A red suspension bridge stands over the bay as thick fog rolls in beneath its deck.",
  tags: ["bridge", "fog", "city", "bay", "architecture", "wallpaper"],
  cols: 100, rows: 36, fps: 20,
  palette: palette(P),
};

const DECK = 21, T1 = 27, T2 = 73, TOP = 3, HZ = 23;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  // main cable height along x: hangs between towers, falls to the anchorages
  const cable = Float32Array.from({ length: cols }, (_, x) => {
    if (x < T1) { const u = x / T1; return DECK - 3 - (DECK - 3 - TOP - 1) * u * u; }
    if (x > T2) { const u = (cols - 1 - x) / (cols - 1 - T2); return DECK - 3 - (DECK - 3 - TOP - 1) * u * u; }
    const u = (x - (T1 + T2) / 2) / ((T2 - T1) / 2);
    return DECK - 2 - (DECK - 2 - TOP - 1) * u * u;
  });
  const hill = Float32Array.from({ length: cols }, (_, x) => HZ - 1 - Math.max(0, 6 * Math.exp(-(((x - 90) / 14) ** 2)) + 4 * Math.exp(-(((x - 6) / 12) ** 2))) - fbm(x * 0.1, 1, 2, 3) * 1.5);

  const tower = (tx, below) => {
    for (let y = TOP; y < rows; y++) {
      if (below ? y <= DECK + 1 : y > DECK + 1) continue;
      for (const lx of [tx - 2, tx + 2]) { g.set(lx, y, "█", RED(lx > tx ? 1 : 2)); g.set(lx + (lx > tx ? 1 : -1), y, "▌", RED(0)); }
      if (!below && (y === TOP || y === TOP + 5 || y === TOP + 10 || y === TOP + 14)) for (let x = tx - 1; x <= tx + 1; x++) g.set(x, y, y === TOP ? "█" : "▀", RED(2));
    }
    if (!below) { g.set(tx - 2, TOP - 1, "▄", RED(2)); g.set(tx + 2, TOP - 1, "▄", RED(2)); }
  };

  return (t) => {
    g.clear();
    // warm evening sky
    for (let y = 0; y < HZ; y++) for (let x = 0; x < cols; x++) {
      const v = clamp(Math.pow(y / HZ, 1.2) + (fbm(x * 0.03 - t * 0.03, y * 0.3, 3, 2) - 0.5) * 0.3 + Math.exp(-Math.hypot((x - 50) / 30, y - HZ) / 3) * 0.1);
      g.set(x, y, v > 0.35 ? "█" : "▓", SKY(v));
    }
    for (let x = 0; x < cols; x++) for (let y = Math.ceil(hill[x]); y < HZ; y++) g.set(x, y, "█", HILL(y - hill[x] < 1 ? 2 : 1));
    for (let y = HZ; y < rows; y++) for (let x = 0; x < cols; x++) {
      const w = noise2(x * 0.2 - t * 0.3, y * 0.9, 4);
      g.set(x, y, w > 0.6 ? "▓" : "█", SEA(clamp((y - HZ) / 12 + (w - 0.5) * 0.6)));
    }
    tower(T1, true); tower(T2, true);
    // fog bank rolling under the deck, thick low, wispy higher up
    for (let y = 12; y < rows; y++) for (let x = 0; x < cols; x++) {
      const n = fbm(x * 0.05 - t * 0.35, y * 0.22 + Math.sin(t * 0.2) * 0.3, 4, 7);
      const body = y > DECK ? 0.9 - (y - DECK) * 0.02 : 0.9 - (DECK - y) * 0.11;
      const roll = Math.sin(x * 0.09 - t * 0.6 + y * 0.2) * 0.12;
      const f = n * body * 1.6 + roll - 0.62;
      if (f > 0) g.set(x, y, f > 0.24 ? "█" : f > 0.12 ? "▓" : "▒", FOG(clamp(0.2 + f * 2.2)));
    }
    // deck, towers, main cables and suspenders above the fog
    tower(T1, false); tower(T2, false);
    for (let x = 0; x < cols; x++) {
      const cy = cable[x];
      g.set(x, cy, "█", RED(2));
      if (x % 2 === 0 && Math.abs(x - T1) > 2 && Math.abs(x - T2) > 2) for (let y = Math.floor(cy) + 1; y < DECK; y++) g.set(x, y, "│", RED(1));
      g.set(x, DECK, "▀", RED(3)); g.set(x, DECK + 1, "█", RED(0));
      if (x % 6 === Math.floor(t * 8) % 6) g.set(x, DECK, "▀", LIGHT(0));
    }
    for (const tx of [T1, T2]) g.set(tx, TOP - 2, "•", LIGHT(0));
    // wisps that drift over the deck
    for (let y = DECK - 3; y < DECK + 3; y++) for (let x = 0; x < cols; x++) {
      const n = fbm(x * 0.07 - t * 0.5, y * 0.4 + 9, 3, 11);
      if (n > 0.66) g.set(x, y, n > 0.72 ? "▓" : "▒", FOG(clamp((n - 0.6) * 5)));
    }
    return g.frame();
  };
}
