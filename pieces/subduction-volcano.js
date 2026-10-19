/* subduction-volcano: an oceanic plate sliding under a continent, melting at depth and feeding an erupting volcano. */
import { Grid, palette, gradient, KEYS, fbm, rng, clamp, fract } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("sky", gradient(["#1a1030", "#3a1a40", "#6a2a44", "#a04a40", "#d8783e"], 6));
add("sea", gradient(["#0a2a50", "#0f3c6c", "#16528a"], 3));
add("ocean", ["#3a4a5e", "#56687e"]);              // oceanic crust stripes
add("cont", gradient(["#5a4630", "#7a603e", "#9a7a50", "#b49466"], 4));
add("mant", gradient(["#3a0a06", "#5a1408", "#7a220c", "#9a3410", "#b84a16"], 6));
add("mag", ["#ff5a1a", "#ffa02a", "#ffe07a"]);
add("ash", ["#4a4450", "#6e6874", "#9a949e"]);
add("rock", ["#2a2228", "#3e3238"]);
add("ui", ["#ffffff", "#ffd8a8", "#0a0a10"]);

export const meta = {
  slug: "subduction-volcano",
  name: "Subduction Zone Volcano",
  category: "science",
  note: "A cross-section where an oceanic plate dives under a continent at a trench, melts in the hot mantle and feeds magma up into an erupting volcano, every layer labelled.",
  tags: ["plate-tectonics", "volcano", "geology", "earth-science", "education", "science"],
  cols: 100, rows: 34, fps: 20,
  palette: palette(all),
};

const K = (n, i = 0) => KEYS[G[n] + i];
const SEA = 9, TR = 44, VX = 72;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const tex = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) tex[x + y * cols] = fbm(x * 0.13, y * 0.28, 3, 11);
  const slabTop = (x) => (x <= TR ? 14 + (x > TR - 4 ? (x - TR + 4) * 0.4 : 0) : 15.6 + (x - TR) * 0.42 + (x - TR) ** 2 * 0.0045);
  const land = (x) => {
    if (x < TR + 2) return 99;
    const coast = x < 52 ? Math.round(13 - (x - TR - 2) * 0.55) : 10;
    const h = Math.max(0, 8 - Math.abs(x - VX) * 0.72);
    return Math.min(coast, Math.round(10 - h + (Math.abs(x - VX) < 1.5 ? 1 : 0)));
  };
  const LAND = Array.from({ length: cols }, (_, x) => land(x));
  const r = rng(3);
  const blobs = Array.from({ length: 10 }, () => [r(), r() * 6 - 3, 0.5 + r() * 0.5]);
  return (t) => {
    g.clear();
    const e = fract(t / 10);
    const erupt = e > 0.15 && e < 0.75 ? Math.min(1, (e - 0.15) * 6, (0.75 - e) * 8) : 0;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = tex[x + y * cols];
      const st = slabTop(x), crustBot = x > TR + 2 ? 20 + Math.round(v * 2) : -1;
      if (y < SEA && y < LAND[x]) { g.set(x, y, v > 0.55 ? "▒" : "░", K("sky", Math.min(5, Math.floor(y * 0.55 + v * 2)))); continue; }
      if (x <= TR + 3 && y < st && y < LAND[x]) { g.set(x, y, y === SEA ? "▀" : v > 0.5 ? "▓" : "▒", K("sea", y === SEA ? 2 : Math.min(2, Math.floor(v * 3)))); continue; }
      if (y >= st && y < st + 4) {
        // oceanic plate, magnetic stripes carried along with the plate
        const s = x + (y - st) * 0.3 + (x > TR ? (st - 14) * 1.1 : 0);
        const band = Math.floor((s - t * 2.2) / 4) & 1;
        g.set(x, y, y === Math.floor(st) ? "▄" : "█", K("ocean", band));
        continue;
      }
      if (y >= LAND[x] && y < crustBot && y < st) { g.set(x, y, v > 0.5 ? "▓" : "▒", K("cont", Math.min(3, Math.floor(v * 3 + (y - LAND[x] < 2 ? 1 : 0))))); continue; }
      // mantle with slow convection texture
      const m = fbm(x * 0.09 + t * 0.05, y * 0.2 - t * 0.03, 3, 5);
      g.set(x, y, m > 0.55 ? "▓" : "▒", K("mant", clamp(Math.floor(m * 4 + (y - 12) / 9), 0, 5)));
    }
    // plate motion arrows on the ocean floor
    for (let k = 0; k < 4; k++) g.set(Math.round(4 + fract(t * 0.1 + k / 4) * 34), 15, "→", K("ui", 0));
    // magma rising from the slab to a chamber and up the vent
    for (const [ph, dx, sp] of blobs) {
      const p = fract(t * 0.09 * sp + ph);
      const x = Math.round(68 + dx + (VX - 68 - dx) * p), y = Math.round(29 - p * 13);
      g.set(x, y, p > 0.5 ? "●" : "•", K("mag", p > 0.7 ? 2 : 1));
    }
    for (let y = 15; y < 19; y++) for (let x = VX - 6; x <= VX + 6; x++) {
      if (((x - VX) / 6.5) ** 2 + ((y - 16.8) / 2) ** 2 > 1) continue;
      g.set(x, y, tex[x + y * cols] > 0.5 ? "█" : "▓", K("mag", tex[x + y * cols] > 0.6 ? 2 : 1));
    }
    for (let y = 3; y < 15; y++) g.set(VX, y, erupt > 0 || y > 9 ? "█" : "▓", K("mag", erupt > 0 ? 2 : 0));
    // eruption: ash column and lava down the flanks
    if (erupt > 0) {
      for (let k = 0; k < 70; k++) {
        const p = fract(k * 0.618 + t * 0.35);
        const y = Math.round(2 - p * 4 * erupt);
        if (y < 0) continue;
        const x = Math.round(VX + (k % 2 ? 1 : -1) * p * (k % 7) * 1.2 + Math.sin(t + k) * 0.6);
        g.set(x, y, p > 0.5 ? "▒" : "▓", K("ash", k % 3));
      }
      const reach = Math.min(12, (e - 0.15) * 40);
      for (let s = -1; s <= 1; s += 2) for (let d = 1; d <= reach; d++) {
        const x = VX + s * d;
        g.set(x, LAND[x], "█", K("mag", d > reach - 2 ? 2 : 0));
      }
    } else if (e > 0.75) {
      for (let s = -1; s <= 1; s += 2) for (let d = 1; d <= 12; d++) g.set(VX + s * d, LAND[VX + s * d], "▓", K("rock", 1));
    }
    // labels
    g.text(1, 0, "SUBDUCTION ZONE", K("ui", 0));
    g.text(1, 11, "OCEAN", K("ui", 0));
    g.text(1, 17, "OCEANIC PLATE", K("ui", 0));
    g.text(1, 18, "dense, moving →", K("ui", 1));
    g.text(36, 8, "TRENCH ↓", K("ui", 0));
    g.text(80, 11, "CONTINENTAL", K("ui", 0)); g.text(80, 12, "PLATE", K("ui", 0));
    g.text(80, 2, "VOLCANO", K("ui", 0));
    g.text(80, 3, erupt > 0 ? "erupting" : "dormant ", K("ui", 1));
    g.text(80, 17, "← MAGMA", K("ui", 0)); g.text(80, 18, "CHAMBER", K("ui", 0));
    g.text(76, 26, "slab melts", K("ui", 1)); g.text(76, 27, "magma rises", K("ui", 1));
    g.text(4, 28, "MANTLE", K("ui", 0));
    g.text(4, 29, "hot rock that flows slowly", K("ui", 1));
    g.text(40, 21, "the plate sinks ↘", K("ui", 1));
    return g.frame();
  };
}
