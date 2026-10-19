/* coffee-steam: a mug of coffee on a wooden table, steam curling up from it. */
import { Grid, palette, gradient, KEYS, fbm, noise2, clamp } from "../lib/kit.js";

const WALL = gradient(["#1b130f", "#33241b", "#4d382a", "#6a4f3a"], 8);   // 0-7
const TABLE = gradient(["#2a1508", "#5a3013", "#8a4f22", "#b77236"], 8);  // 8-f
const MUG = gradient(["#4a1418", "#8f2a2c", "#cf4a3f", "#f08a6e"], 8);    // g-n
const STEAM = gradient(["#5d5552", "#9a928c", "#d8d2cc", "#ffffff"], 6);  // o-t
const pal = palette([...WALL, ...TABLE, ...MUG, ...STEAM, "#2a140a", "#6b3a1a", "#c08a55", "#e8e2da", "#a9a39c"]);
// u coffee dark, v coffee, w crema, x saucer light, y saucer shade

export const meta = {
  slug: "coffee-steam",
  name: "Coffee Mug",
  category: "things",
  note: "A red mug of coffee on a wooden table, wisps of steam curling up into the warm room.",
  tags: ["coffee", "cozy", "morning", "hero", "wallpaper"],
  cols: 64, rows: 34, fps: 24,
  palette: pal,
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = 29, top = 16, bot = 28, half = 10, tableY = 25;
  return (t) => {
    // wall and table
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      if (y < tableY) {
        const glow = Math.exp(-Math.hypot((x - 50) / 26, (y - 4) / 12));
        const v = clamp(0.15 + glow * 0.55 + fbm(x * 0.07, y * 0.15, 3) * 0.3);
        g.set(x, y, v > 0.55 ? "▒" : "░", KEYS[Math.min(7, Math.floor(v * 8))]);
      } else {
        const grain = fbm(x * 0.05, y * 1.4, 3) + Math.sin(x * 0.15 + y * 0.8) * 0.05;
        const v = clamp(0.25 + grain * 0.55 + (y - tableY) * 0.03);
        g.set(x, y, v > 0.5 ? "▓" : "▒", KEYS[8 + Math.min(7, Math.floor(v * 8))]);
      }
    }
    // saucer
    for (let y = bot - 1; y <= bot + 2; y++) for (let x = cx - 17; x <= cx + 17; x++) {
      const d = Math.hypot((x - cx) / 17, (y - bot - 0.4) / 2.2);
      if (d < 1) g.set(x, y, d > 0.82 || y > bot ? "█" : "▓", y > bot ? "y" : "x");
    }
    // handle (a ring in square space)
    for (let y = top + 1; y <= bot - 2; y++) for (let x = cx + half - 1; x <= cx + half + 8; x++) {
      const d = Math.hypot((x - (cx + half)) / 6.5, (y - (top + 5.5)) / 4.3);
      if (d > 0.62 && d < 1) g.set(x, y, "█", KEYS[16 + Math.floor(clamp(0.6 - (y - top) * 0.04) * 8)]);
    }
    // mug body, a lit cylinder
    for (let y = top; y <= bot; y++) for (let x = cx - half; x <= cx + half; x++) {
      const u = (x - cx) / half;
      let lit = Math.sqrt(Math.max(0, 1 - u * u)) * 0.7 + 0.15 + u * 0.18;
      if (Math.abs(u - 0.45) < 0.08) lit += 0.35;
      if (y === bot) lit *= 0.6;
      g.set(x, y, "█", KEYS[16 + Math.min(7, Math.floor(clamp(lit) * 8))]);
    }
    // rim and coffee surface with a turning swirl of crema
    for (let x = cx - half; x <= cx + half; x++) g.set(x, top - 1, "▄", "n");
    for (let x = cx - half + 1; x <= cx + half - 1; x++) {
      const u = (x - cx) / half;
      const a = Math.atan2(0, u) + t * 0.6;
      const cr = Math.sin(u * 7 - t * 1.2 + Math.cos(a) * 1.5) > 0.55;
      g.set(x, top, cr ? "▀" : "█", cr ? "w" : Math.abs(u) > 0.8 ? "u" : "v");
    }
    // steam: three wisps rising and curling
    for (let y = 0; y < top - 1; y++) {
      const hgt = (top - 1 - y) / (top - 1);
      for (let x = 0; x < cols; x++) {
        let dens = 0;
        for (let k = 0; k < 3; k++) {
          const off = (k - 1) * 5;
          const ph = y * 0.35 + t * 1.6 + k * 2.1;
          const xc = cx + off + Math.sin(ph) * (1 + hgt * 5) + (noise2(y * 0.15 + t * 0.6, k * 3, 2) - 0.5) * 6 * hgt + hgt * 4;
          const w = 1.2 + hgt * 3;
          const puff = 0.55 + 0.45 * noise2(x * 0.25, y * 0.5 + t * 2.2, k + 11);
          dens += Math.exp(-(((x - xc) / w) ** 2)) * puff * (1 - hgt) ** 0.9;
        }
        if (dens > 0.18) {
          const v = clamp(dens);
          g.set(x, y, v > 0.7 ? "▓" : v > 0.4 ? "▒" : "░", KEYS[24 + Math.min(5, Math.floor(v * 6))]);
        }
      }
    }
    return g.frame();
  };
}
