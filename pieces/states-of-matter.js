/* states-of-matter: particles in a solid, a liquid and a gas side by side, vibrating, sliding and flying. */
import { Grid, palette, gradient, KEYS, rng, clamp, fract } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("cold", gradient(["#0a1630", "#0e1e40", "#132850"], 3));
add("warm", gradient(["#0a2228", "#0e2e36", "#123a44"], 3));
add("hot", gradient(["#2a1010", "#361414", "#441a18"], 3));
add("pS", ["#5ab0ff", "#c8e6ff"]);
add("pL", ["#3ad8c8", "#b8fff4"]);
add("pG", ["#ff8a5a", "#ffd8c0"]);
add("bond", ["#2a4a7a"]);
add("ui", ["#ffffff", "#8b949e", "#c9d1d9", "#ffd166", "#79c0ff"]);

export const meta = {
  slug: "states-of-matter",
  name: "States Of Matter Particles",
  category: "science",
  note: "Three boxes of particles: a solid vibrating in a fixed lattice, a liquid sliding in a close jumble and a gas flying fast and far apart, with melting, boiling and their reverses marked.",
  tags: ["particles", "solid-liquid-gas", "chemistry", "physics", "education", "science"],
  cols: 100, rows: 30, fps: 24,
  palette: palette(all),
};

const K = (n, i = 0) => KEYS[G[n] + i];
const BW = 30, BH = 19, BY = 2, BXS = [1, 35, 69];
const tri = (v, n) => { const m = fract(v / (2 * n)) * 2 * n; return m < n ? m : 2 * n - m; };

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(6);
  const solid = [];
  for (let j = 0; j < 7; j++) for (let i = 0; i < 9; i++) solid.push([3 + i * 3, 3 + j * 2, r() * 6.28]);
  const liquid = Array.from({ length: 52 }, (_, i) => [(i % 13) * 2 + 1 + r(), 9 + Math.floor(i / 13) * 2 + r(), r() * 6.28, 0.3 + r() * 0.5]);
  const gas = Array.from({ length: 14 }, () => [r() * 27, r() * 16, (r() - 0.5) * 22, (r() - 0.5) * 10]);
  const panel = (k, title, sub, bg) => {
    const x0 = BXS[k];
    for (let y = BY + 1; y < BY + BH - 1; y++) for (let x = x0 + 1; x < x0 + BW - 1; x++) g.set(x, y, (x + y) % 2 ? "░" : "▒", K(bg, Math.min(2, Math.floor((y - BY) / 6))));
    g.box(x0, BY, BW, BH, "light", K("ui", 1));
    g.text(x0 + Math.floor((BW - title.length) / 2), 0, title, K("ui", 0));
    g.text(x0 + Math.floor((BW - sub.length) / 2), BY + BH, sub, K("ui", 1));
  };
  return (t) => {
    g.clear();
    panel(0, "SOLID", "fixed places, vibrate", "cold");
    panel(1, "LIQUID", "close together, slide past", "warm");
    panel(2, "GAS", "far apart, move fast", "hot");
    // solid: lattice with bonds, each particle trembling in place
    const sx = BXS[0], sy = BY;
    for (const [px, py] of solid) {
      if (px + 3 < 28) g.set(sx + px + 1.5, sy + py, "─", K("bond"));
      if (py + 2 < 17) g.set(sx + px, sy + py + 1, "│", K("bond"));
    }
    for (const [px, py, ph] of solid) {
      const dx = Math.round(0.6 * Math.sin(t * 11 + ph)), dy = Math.round(0.4 * Math.sin(t * 13 + ph * 1.7));
      g.set(sx + px + dx, sy + py + dy, "●", K("pS", (px + py) % 4 ? 0 : 1));
    }
    // liquid: particles drift and swap places but stay in the lower part, touching
    const lx = BXS[1], ly = BY;
    for (const [px, py, ph, sp] of liquid) {
      const x = 1 + tri(px + t * sp * 3 + Math.sin(t * 0.9 + ph) * 2, 26.5);
      const y = py + Math.sin(t * 1.3 + ph) * 0.8 + 0.5 * Math.sin(x * 0.4 + t);
      g.set(lx + x, ly + clamp(y, 7, 17), "●", K("pL", (ph * 10) % 3 > 2 ? 1 : 0));
    }
    // surface ripple line
    for (let x = 1; x < BW - 1; x++) g.set(lx + x, ly + 7 + (Math.sin(x * 0.5 + t * 2) > 0.6 ? -1 : 0), "~", K("pL", 0));
    // gas: fast straight lines bouncing off the walls
    const gx = BXS[2], gy = BY;
    for (const [px, py, vx, vy] of gas) {
      const x = 1 + tri(px + vx * t, 27), y = 1 + tri(py + vy * t, 16);
      g.set(gx + x, gy + y, "●", K("pG", 1));
      const tx = 1 + tri(px + vx * (t - 0.06), 27), ty = 1 + tri(py + vy * (t - 0.06), 16);
      if (Math.round(tx) !== Math.round(x) || Math.round(ty) !== Math.round(y)) g.set(gx + tx, gy + ty, "·", K("pG", 0));
    }
    // processes between panels
    const flow = fract(t * 0.6);
    g.set(32 + Math.floor(flow * 2), 9, "→", K("ui", 3)); g.set(33 - Math.floor(flow * 2), 13, "←", K("ui", 4));
    g.set(66 + Math.floor(flow * 2), 9, "→", K("ui", 3)); g.set(67 - Math.floor(flow * 2), 13, "←", K("ui", 4));
    g.text(22, 23, "melting →", K("ui", 3)); g.text(32, 23, "/", K("ui", 1)); g.text(34, 23, "← freezing", K("ui", 4));
    g.text(55, 23, "boiling →", K("ui", 3)); g.text(65, 23, "/", K("ui", 1)); g.text(67, 23, "← condensing", K("ui", 4));
    g.text(1, 25, "Heating gives particles more energy: they move faster and further apart.", K("ui", 2));
    g.text(1, 26, "solid: fixed shape and volume", K("pS", 1));
    g.text(35, 26, "liquid: fixed volume, flows", K("pL", 1));
    g.text(69, 26, "gas: fills its container", K("pG", 1));
    const temp = ["-10 °C", " 25 °C", "110 °C"];
    BXS.forEach((x, k) => g.text(x + 1, BY + BH - 2 + 0, " " + temp[k] + " ", K("ui", 0)));
    g.text(1, 28, "water shown at 1 atm: ice below 0 °C, liquid to 100 °C, steam above", K("ui", 1));
    return g.frame();
  };
}
