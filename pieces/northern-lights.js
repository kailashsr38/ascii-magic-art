/* northern-lights: aurora curtains rippling over a snowy pine forest and a frozen lake. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, TAU } from "../lib/kit.js";

const P = [];
const grp = (hexes) => {
  const o = P.length, n = hexes.length;
  P.push(...hexes);
  return (v) => KEYS[o + (v <= 0 ? 0 : v >= 1 ? n - 1 : Math.floor(v * n))];
};
const SKY = grp(gradient(["#030614", "#0a1630", "#14385a", "#2a6a72"], 8));
const AUR = grp(gradient(["#0c3b3a", "#139a6a", "#3cf08e", "#b4ffd2"], 8));
const AURTOP = grp(gradient(["#1c2350", "#5a3a8c", "#c06ad0"], 5));
const STAR = grp(["#8fa6c8", "#f2f6ff"]);
const SNOW = grp(gradient(["#3a4a6a", "#7d93b8", "#c8d8f0", "#f4f8ff"], 6));
const PINE = grp(["#02070c", "#08141e", "#3a5a6a"]);
const ICE = grp(gradient(["#08142a", "#14284a", "#2a4870"], 5));
const ICEAUR = grp(["#0f4a44", "#1f8a66", "#4cc89a"]);

export const meta = {
  slug: "northern-lights",
  name: "Northern Lights",
  category: "landscapes",
  note: "Green and violet aurora curtains ripple above a snowy pine forest and a frozen lake.",
  tags: ["aurora", "night", "snow", "winter", "wallpaper", "hero"],
  cols: 96, rows: 36, fps: 20,
  palette: palette(P),
};

const SH = "░▒▓█";
const sh = (v) => SH[v <= 0 ? 0 : v >= 1 ? 3 : Math.floor(v * 4)];
const SHORE = 24, LAKE = 27;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(5);
  const stars = Array.from({ length: 70 }, () => [Math.floor(r() * cols), Math.floor(r() * 20), r() * TAU]);
  // pines along the far shore, tallest in the middle distance
  const pines = [];
  for (let x = -2; x < cols + 2; x += 5 + Math.floor(r() * 5)) pines.push([x, 6 + Math.floor(r() * 9) + (Math.abs(x - 48) < 14 ? -2 : 0)]);
  const treeMask = new Int8Array(cols * rows);    // 1 body, 2 snowy edge
  for (const [px, h] of pines) for (let j = 0; j < h; j++) {
    const y = SHORE - j, half = Math.floor((h - j) * 0.38);
    for (let i = -half; i <= half; i++) {
      const x = px + i;
      if (x < 0 || x >= cols || y < 0) continue;
      const tier = (h - j) % 3 === 1;
      const snowy = (tier && Math.abs(i) === half && half > 0) || j === h - 1;
      if (treeMask[x + y * cols] !== 1) treeMask[x + y * cols] = snowy ? 2 : 1;
    }
  }
  const aur = new Float32Array(cols * rows), aurH = new Float32Array(cols * rows);

  return (t) => {
    g.clear();
    aur.fill(0);
    // three curtains with vertical rays, folding slowly
    for (let c = 0; c < 3; c++) for (let x = 0; x < cols; x++) {
      const base = 9 + c * 4 + 5 * (fbm(x * 0.022 + t * 0.05 + c * 9, c * 3 + t * 0.03, 3, c) - 0.5) * 2 + Math.sin(x * 0.07 + t * 0.4 + c * 2) * 2;
      const rays = Math.pow(fbm(x * 0.3 + t * 0.6 * (c % 2 ? -1 : 1), t * 0.25 + c * 7, 2, 11 + c), 1.6) * 2.2;
      const str = (0.6 + 0.4 * Math.sin(x * 0.04 - t * 0.3 + c)) * (c === 1 ? 1 : 0.75);
      for (let y = 0; y < SHORE; y++) {
        const up = base - y;
        const f = up >= 0 ? Math.exp(-up / (5 + c * 1.5)) : Math.exp(up * 1.3);
        const v = f * rays * str;
        const i = x + y * cols;
        if (v > aur[i]) { aur[i] = v; aurH[i] = clamp(up / 10); }
      }
    }
    // sky, stars, aurora
    for (let y = 0; y < SHORE + 1; y++) for (let x = 0; x < cols; x++) {
      const i = x + y * cols, a = aur[i];
      if (a > 0.18) {
        if (aurH[i] > 0.55) g.set(x, y, sh(a), AURTOP(clamp(a * 0.9 + 0.1)));
        else g.set(x, y, sh(a), AUR(clamp(a * 0.85)));
      } else {
        const v = clamp(Math.pow(y / SHORE, 2.2) * 1.05 + a * 2);
        g.set(x, y, v > 0.55 ? "▒" : "░", a > 0.08 ? AUR(0) : SKY(v));
      }
    }
    for (const [x, y, ph] of stars) {
      if (aur[x + y * cols] > 0.25) continue;
      const tw = Math.sin(t * 2 + ph);
      g.set(x, y, tw > 0.6 ? "+" : tw > -0.2 ? "·" : ".", STAR(tw > 0.6 ? 1 : 0));
    }
    // snowy shore band
    for (let y = SHORE - 1; y < LAKE; y++) for (let x = 0; x < cols; x++) {
      if (y < SHORE) continue;
      const v = clamp(0.55 + (noise2(x * 0.2, y, 2) - 0.5) * 0.5 - (y - SHORE) * 0.08);
      g.set(x, y, sh(0.5 + v * 0.5), SNOW(v));
    }
    // snowy hills behind the forest, catching the aurora light
    for (let x = 0; x < cols; x++) {
      const top = SHORE - 3 - 4 * fbm(x * 0.04, 2, 3, 12);
      for (let y = Math.ceil(top); y < SHORE; y++) {
        const a = aur[x + Math.max(0, Math.floor(top) - 4) * cols];
        g.set(x, y, "█", SNOW(clamp(0.35 + (y - top) * 0.05 + a * 0.4 + (noise2(x * 0.3, y, 6) - 0.5) * 0.3)));
      }
    }
    // forest
    for (let y = 0; y <= SHORE; y++) for (let x = 0; x < cols; x++) {
      const m = treeMask[x + y * cols];
      if (!m) continue;
      if (m === 2) g.set(x, y, "▓", PINE(2));
      else g.set(x, y, "█", PINE((x + y) % 4 === 0 ? 0.5 : 0));
    }
    // frozen lake: dim mirror of the sky with ice cracks
    for (let y = LAKE; y < rows; y++) {
      const d = (y - LAKE) / (rows - LAKE);
      for (let x = 0; x < cols; x++) {
        const sy = 2 * LAKE - y - 4;
        const a = sy >= 0 ? aur[x + sy * cols] : 0;
        const crack = Math.abs(noise2(x * 0.12, y * 0.5, 31) - 0.5) < 0.03;
        if (crack) { g.set(x, y, "─", SNOW(0.6)); continue; }
        if (a > 0.25 && noise2(x * 0.5, y * 2 + t * 0.5, 8) > 0.3) g.set(x, y, a > 0.6 ? "▓" : "▒", ICEAUR(clamp(a * 0.8)));
        else {
          const v = clamp(0.3 + d * 0.5 + (noise2(x * 0.08, y * 0.6, 17) - 0.5) * 0.6);
          g.set(x, y, v > 0.6 ? "▒" : "▓", ICE(v));
        }
      }
    }
    // snow drift in the foreground corners
    for (let x = 0; x < cols; x++) {
      const top = rows - 2 - Math.max(0, 5 - x * 0.25) - Math.max(0, (x - cols + 20) * 0.25) + noise2(x * 0.2, 1, 3);
      for (let y = Math.floor(top); y < rows; y++) g.set(x, y, "█", SNOW(clamp(0.95 - (y - top) * 0.12)));
    }
    return g.frame();
  };
}
