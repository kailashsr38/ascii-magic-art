/* autumn-forest: a path through orange and red woods while leaves drift down. */
import { Grid, palette, gradient, KEYS, fbm, rng, clamp } from "../lib/kit.js";

const P = [];
const add = (a) => { const o = P.length; P.push(...a); return o; };
const SKY = add(gradient(["#f6d9a0", "#fbecc8"], 3));
const MIST = add(gradient(["#c89a6a", "#e2b888", "#f0d0a0"], 4));
const LEAF = add(gradient(["#5a1408", "#9a2a10", "#d24a14", "#f07a1e", "#f8a830", "#fcd25a"], 12));
const BARK = add(["#1e120c", "#3a2416", "#5a3a22", "#7a5434"]);
const FLOOR = add(gradient(["#3a1a0c", "#6a2e12", "#a04a1a", "#d07a2a"], 8));
const PATH = add(gradient(["#7a5a3a", "#b08a5a", "#d8b480"], 4));
const FALL = add(["#ff6a1a", "#ffb030", "#e83a1a", "#ffd84a"]);

export const meta = {
  slug: "autumn-forest",
  name: "Autumn Forest",
  category: "landscapes",
  note: "A path winds into orange and red autumn woods while leaves drift down through the light.",
  tags: ["nature", "autumn", "forest", "fall", "seasonal", "wallpaper"],
  cols: 100, rows: 36, fps: 20,
  palette: palette(P),
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(52);
  const hz = 19, vx = 50;
  const backTrunks = Array.from({ length: 9 }, () => [Math.floor(r() * cols), 1]);
  const frontTrunks = [[4, 7], [17, 4], [80, 5], [93, 8], [30, 3], [68, 3]];
  const leaves = Array.from({ length: 50 }, () => [r() * cols, r() * 40, 2 + r() * 3, r() * 6.28, Math.floor(r() * 4)]);
  return (t) => {
    g.clear();
    // bright hazy sky and a misty back canopy
    for (let y = 0; y <= hz; y++) for (let x = 0; x < cols; x++) {
      const n = fbm(x * 0.07 + t * 0.02, y * 0.18, 3, 3);
      const glow = Math.exp(-(((x - vx) / 20) ** 2) - (((y - hz) / 8) ** 2));
      const haze = glow + (y > hz - 4 ? 0.25 : 0);
      if (n + haze * 0.6 > 0.82) g.set(x, y, haze > 0.5 ? "█" : "▓", KEYS[SKY + (haze > 0.5 ? 2 : 1)]);
      else if (haze > 0.3 || n < 0.42) g.set(x, y, n > 0.5 ? "▓" : "▒", KEYS[MIST + clamp(Math.floor(n * 3 + haze * 2), 0, 3)]);
      else { const hue = fbm(x * 0.04, y * 0.08, 2, 33); g.set(x, y, n > 0.58 ? "█" : "▓", KEYS[LEAF + clamp(Math.floor(hue * 10 + (n - 0.5) * 6), 2, 11)]); }
    }
    for (const [bx, w] of backTrunks) for (let y = 8; y <= hz + 1; y++) for (let i = 0; i < w; i++) g.set(bx + i, y, "│", KEYS[BARK + 2]);
    // forest floor with leaf litter
    for (let y = hz + 1; y < rows; y++) for (let x = 0; x < cols; x++) {
      const n = fbm(x * 0.15, y * 0.5, 3, 7);
      const v = clamp(0.3 + (y - hz) / (rows - hz) * 0.4 + (n - 0.5) * 0.8);
      g.set(x, y, n > 0.62 ? "▓" : v > 0.55 ? "▓" : "▒", KEYS[n > 0.62 ? LEAF + 8 + Math.floor(n * 10) % 4 : FLOOR + clamp(Math.floor(v * 8), 0, 7)]);
    }
    // the path, curving gently into the distance
    for (let y = hz + 1; y < rows; y++) {
      const d = (y - hz) / (rows - hz);
      const c = vx + Math.sin(d * 3 + 0.5) * 6 * d;
      const hw = 1 + d * 16;
      for (let x = Math.floor(c - hw); x <= c + hw; x++) {
        const edge = Math.abs(x - c) > hw - 1.5;
        const n = fbm(x * 0.3, y * 0.7, 2, 19);
        if (n > 0.66) g.set(x, y, "•", KEYS[LEAF + 9]);
        else g.set(x, y, edge ? "▒" : n > 0.45 ? "▓" : "▒", KEYS[PATH + clamp(Math.floor(d * 2 + n * 2), 0, 3)]);
      }
    }
    // big foreground trunks with bark lines
    for (const [tx, w] of frontTrunks) {
      const base = rows;
      for (let y = 0; y < base; y++) {
        const flare = y > rows - 4 ? (y - (rows - 4)) : 0;
        for (let x = tx - flare; x < tx + w + flare; x++) {
          const lx = x - tx;
          const lit = lx === 0 ? 3 : lx === w - 1 ? 0 : (lx + Math.floor(y / 3)) % 3 === 0 ? 1 : 2;
          g.set(x, y, lx === 0 ? "▐" : (lx + y) % 5 === 0 ? "║" : "█", KEYS[BARK + lit]);
        }
      }
    }
    // overhanging canopy, swaying slightly
    for (let y = 0; y < 15; y++) for (let x = 0; x < cols; x++) {
      const sway = Math.sin(t * 0.8 + y * 0.3) * 0.6;
      const n = fbm((x + sway) * 0.09, y * 0.22, 4, 11);
      const thick = n - y * 0.03 + (Math.abs(x - vx) > 26 ? 0.15 : 0);
      if (thick > 0.36) {
        const hue = fbm(x * 0.05, y * 0.1, 2, 29);
        const v = clamp(hue * 0.9 + (n - 0.5) * 0.8 + (y < 3 ? -0.15 : 0));
        g.set(x, y, n > 0.6 ? "█" : n > 0.5 ? "▓" : "▒", KEYS[LEAF + clamp(Math.floor(v * 12), 0, 11)]);
      }
    }
    // falling leaves
    for (const [lx, off, sp, ph, c] of leaves) {
      const y = ((t * sp + off) % (rows + 4)) - 2;
      const x = (lx + Math.sin(t * 1.4 + ph) * 3 + t * 1.5) % cols;
      const flick = Math.sin(t * 5 + ph);
      g.set(x, y, flick > 0.3 ? "◆" : flick > -0.3 ? "▪" : "◇", KEYS[FALL + c]);
    }
    return g.frame();
  };
}
