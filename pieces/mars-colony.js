/* mars-colony: habitat domes on a red desert under two small moons while a dust storm drifts through. */
import { Grid, palette, gradient, KEYS, fbm, rng, clamp } from "../lib/kit.js";

const P = [];
const add = (a) => { const o = P.length; P.push(...a); return o; };
const SKY = add(gradient(["#2a1410", "#5a2a1e", "#a0523a", "#d88a5e", "#eab48a"], 12));
const MOON = add(["#8a7a6a", "#d8c8b0", "#f4e8d4"]);
const MESA = add(gradient(["#4a1e16", "#7a3020", "#a04a2c"], 4));
const SAND = add(gradient(["#3a140c", "#6e2a16", "#a84422", "#d26a36", "#f0a060"], 12));
const DOME = add(gradient(["#5a5a64", "#a4a8b4", "#e8ecf2"], 5));
const GLOW = add(["#ffd27a", "#9ef0ff", "#ff5a4a"]);
const DUST = add(gradient(["#d88a5a", "#eab088", "#f8d8b4"], 4));

export const meta = {
  slug: "mars-colony",
  name: "Mars Colony",
  category: "landscapes",
  note: "Habitat domes on a rust red desert under two small moons, with a dust storm drifting across.",
  tags: ["space", "mars", "sci-fi", "desert", "wallpaper", "hero"],
  cols: 100, rows: 36, fps: 20,
  palette: palette(P),
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(4);
  const hz = 18;
  const mesa = Array.from({ length: cols }, (_, x) => {
    const m = fbm(x * 0.045, 1, 3, 13);
    return hz - Math.max(0, Math.round((m - 0.36) * 24));
  });
  const domes = [[28, 28, 11, 0], [48, 26, 7, 1], [68, 29, 13, 0], [85, 26, 6, 1]];
  const lights = Array.from({ length: 30 }, () => [r(), r() * 6.28]);
  return (t) => {
    g.clear();
    // dusty butterscotch sky, brighter toward the horizon
    for (let y = 0; y < hz + 1; y++) for (let x = 0; x < cols; x++) {
      const c = fbm(x * 0.025 + t * 0.05, y * 0.18, 3, 5);
      const v = clamp(0.05 + (y / hz) ** 1.3 * 0.85 + (c - 0.5) * 0.3);
      g.set(x, y, v > 0.6 ? "▓" : v > 0.35 ? "▒" : "░", KEYS[SKY + clamp(Math.floor(v * 12), 0, 11)]);
    }
    // two small moons drifting slowly
    const m1x = 22 + 14 * Math.sin(t * 0.06), m2x = 62 - 18 * Math.sin(t * 0.09 + 1);
    for (const [mx, my, mr] of [[m1x, 4, 2.4], [m2x, 8, 1.4]]) {
      for (let y = Math.floor(my - mr); y <= my + mr; y++) for (let x = Math.floor(mx - mr * 2); x <= mx + mr * 2; x++) {
        const d = Math.hypot((x - mx) / (mr * 2), (y - my) / mr);
        if (d < 1) g.set(x, y, d < 0.5 ? "█" : "▓", KEYS[MOON + (d < 0.5 ? 2 : (x < mx ? 0 : 1))]);
      }
    }
    // mesas on the horizon
    for (let x = 0; x < cols; x++) for (let y = mesa[x]; y <= hz; y++) {
      const lit = x > 0 && mesa[x - 1] > mesa[x] ? 3 : (y - mesa[x]) % 3 === 0 ? 2 : 1;
      g.set(x, y, (y - mesa[x]) % 3 === 0 ? "▓" : "█", KEYS[MESA + lit]);
    }
    // rolling dunes, lit from the left, rippled
    for (let y = hz + 1; y < rows; y++) {
      const d = (y - hz) / (rows - hz);
      for (let x = 0; x < cols; x++) {
        const n = fbm(x * 0.03 + y * 0.01, y * 0.1, 3, 2);
        const dune = Math.sin(x * 0.07 + n * 7 + y * 0.25 / (0.3 + d));
        const v = clamp(0.42 + d * 0.2 + dune * 0.22 + (n - 0.5) * 0.25);
        g.set(x, y, v > 0.75 ? "█" : v > 0.5 ? "▓" : v > 0.3 ? "▒" : "░", KEYS[SAND + clamp(Math.floor(v * 12), 0, 11)]);
      }
    }
    // tube corridors and domes
    for (let x = 28; x <= 85; x++) { g.set(x, 27, "▄", KEYS[DOME + 2]); g.set(x, 28, "▀", KEYS[DOME + 1]); }
    for (const [cx, by, rad, kind] of domes) {
      for (let y = by - Math.ceil(rad / 2); y <= by; y++) for (let x = cx - rad; x <= cx + rad; x++) {
        const dx = (x - cx) / rad, dy = (by - y) / (rad * 0.5);
        const d2 = dx * dx + dy * dy;
        if (d2 > 1) continue;
        const z = Math.sqrt(1 - d2);
        const l = clamp(-dx * 0.55 + dy * 0.3 + z * 0.45);
        const rib = kind ? (y - by) % 2 === 0 : (x - cx) % 3 === 0;
        g.set(x, y, rib ? "▒" : l > 0.55 ? "█" : "▓", KEYS[DOME + clamp(Math.floor(l * 5) - (rib ? 1 : 0), 0, 4)]);
      }
      for (let x = cx - rad + 2; x <= cx + rad - 2; x += 3) {
        const [hv, ph] = lights[(x + by) % lights.length];
        g.set(x, by - 1, Math.sin(t * 0.9 + ph) > -0.5 ? "▪" : "·", KEYS[GLOW + (hv < 0.3 ? 1 : 0)]);
      }
    }
    // landing beacon
    g.set(12, 31, Math.sin(t * 4) > 0 ? "●" : "•", KEYS[GLOW + 2]);
    g.text(9, 32, "▀▀▀▀▀▀▀", KEYS[DOME + 1]);
    // the dust storm: a band of drifting dust that thickens and thins
    const storm = 0.5 + 0.5 * Math.sin(t * 0.35);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const n = fbm(x * 0.05 - t * 0.9, y * 0.12 + Math.sin(x * 0.03 + t * 0.2) * 0.5, 3, 31);
      const band = Math.exp(-(((y - 21) / 9) ** 2));
      const a = (n - 0.45) * 2.2 * band * (0.4 + storm * 0.8);
      if (a > 0.4) g.set(x, y, a > 0.9 ? "▒" : "░", KEYS[DUST + clamp(Math.floor(a * 3), 0, 3)]);
    }
    return g.frame();
  };
}
