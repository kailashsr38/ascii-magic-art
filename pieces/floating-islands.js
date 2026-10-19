/* floating-islands: grassy islands drifting above a sea of cloud, waterfalls spilling off their edges. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp } from "../lib/kit.js";

const P = [];
const add = (a) => { const o = P.length; P.push(...a); return o; };
const SKY = add(gradient(["#2a6ac8", "#4a8ee0", "#7ab4f0", "#b4d8fa", "#e4f2ff"], 12));
const CLOUD = add(gradient(["#9ab4d8", "#c8daf0", "#eef6ff", "#ffffff"], 5));
const GRASS = add(["#2a7a2a", "#4aa83a", "#8ad25a", "#c4f07a"]);
const ROCK = add(gradient(["#1e1a24", "#3a2e34", "#6a5040", "#9a7652", "#c4a070"], 8));
const TREE = add(["#1a5a2a", "#2e8a3a", "#5ac04a", "#5a3a22"]);
const FALLS = add(["#8ac8f0", "#d0eeff", "#ffffff"]);
const FAR = add(["#7a9ac8", "#9ab8e0"]);

export const meta = {
  slug: "floating-islands",
  name: "Floating Islands",
  category: "landscapes",
  note: "Grassy islands drift above a sea of cloud, waterfalls pouring off their edges into the mist below.",
  tags: ["fantasy", "sky", "islands", "waterfall", "wallpaper", "hero"],
  cols: 100, rows: 36, fps: 20,
  palette: palette(P),
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(44);
  const seaY = 28;
  const islands = [
    { cx: 26, y: 13, w: 17, d: 13, ph: 0, falls: [1], trees: [-9, -3, 4] },
    { cx: 72, y: 8, w: 13, d: 10, ph: 2, falls: [-1], trees: [-4, 3, 7] },
    { cx: 86, y: 20, w: 7, d: 6, ph: 4, falls: [], trees: [0] },
    { cx: 50, y: 22, w: 6, d: 5, ph: 1, falls: [1], trees: [-1] },
  ].map((isl) => {
    const top = [], bot = [];
    for (let i = -isl.w; i <= isl.w; i++) {
      const u = Math.abs(i) / isl.w;
      top.push(Math.round((noise2(i * 0.3, isl.cx, 3) - 0.5) * 1.4 + u * u * 1.5));
      bot.push(Math.max(1, Math.round(isl.d * (1 - u ** 1.4) * (0.7 + 0.5 * noise2(i * 0.4, isl.cx, 9)))));
    }
    return { ...isl, top, bot };
  });
  const far = Array.from({ length: 3 }, () => [r() * cols, 4 + r() * 14, 2 + r() * 3]);
  return (t) => {
    g.clear();
    // open sky with drifting wisps
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const c = fbm(x * 0.035 + t * 0.05, y * 0.18, 4, 2);
      const v = clamp(y / rows * 0.9 + (c > 0.6 ? (c - 0.6) * 2 : 0) + 0.05);
      g.set(x, y, c > 0.62 ? "█" : "▓", KEYS[SKY + clamp(Math.floor(v * 12), 0, 11)]);
    }
    // tiny distant islands in the haze
    for (const [fx, fy, fw] of far) {
      const yy = Math.round(fy + Math.sin(t * 0.4 + fx) * 0.5);
      for (let i = -fw * 2; i <= fw * 2; i++) {
        const dd = Math.round((1 - Math.abs(i) / (fw * 2)) * fw);
        for (let j = 0; j <= dd; j++) g.set(fx + i, yy + j, j === 0 ? "▄" : "▓", KEYS[FAR + (j === 0 ? 1 : 0)]);
      }
    }
    // islands: rocky undersides, grass caps, trees and waterfalls
    for (const isl of islands) {
      const by = Math.round(isl.y + Math.sin(t * 0.6 + isl.ph) * 1.2);
      for (let k = 0; k < isl.top.length; k++) {
        const x = isl.cx - isl.w + k;
        const ty = by + isl.top[k];
        const depth = isl.bot[k];
        const u = (k - isl.w) / isl.w;
        for (let j = 0; j <= depth + 1; j++) {
          const y = ty + j;
          if (j === 0) { g.set(x, y, "▄", KEYS[GRASS + 2 + (noise2(x * 0.5, 1, 4) > 0.5 ? 1 : 0)]); continue; }
          if (j === 1) { g.set(x, y, "█", KEYS[GRASS + (k % 3 === 0 ? 0 : 1)]); continue; }
          if (j === 2 && noise2(x * 0.7, 2, 5) > 0.45) { g.set(x, y, "▀", KEYS[GRASS]); continue; }
          const n = noise2(x * 0.5, y * 0.8, 7);
          const lit = clamp(0.75 - (j / (depth + 1)) * 0.6 - u * 0.25 + (n - 0.5) * 0.4);
          g.set(x, y, j === depth + 1 ? "▀" : lit > 0.55 ? "▓" : lit > 0.3 ? "▒" : "█", KEYS[ROCK + clamp(Math.floor(lit * 8), 0, 7)]);
        }
      }
      // trees
      for (const dx of isl.trees) {
        const x = isl.cx + dx, ty = by + isl.top[dx + isl.w] - 1;
        const sway = Math.sin(t * 1.2 + x) > 0.6 ? 1 : 0;
        g.set(x, ty, "█", KEYS[TREE + 3]);
        g.text(x - 2 + sway, ty - 1, "▄███▄", KEYS[TREE + 1]);
        g.text(x - 1 + sway, ty - 2, "▄█▄", KEYS[TREE + 2]);
        g.set(x - 2 + sway, ty - 1, "▄", KEYS[TREE]);
      }
      // waterfalls pouring off the edge into the cloud sea
      for (const side of isl.falls) {
        const fx = isl.cx + side * (isl.w - 1);
        const fy = by + isl.top[side > 0 ? isl.top.length - 1 : 0];
        for (let y = fy; y < seaY + 2; y++) {
          const spread = (y - fy) * 0.08;
          for (let x = Math.floor(fx + side * 0.5 - spread); x <= Math.ceil(fx + side * 1.5 + spread); x++) {
            const s = noise2(x * 1.7, y * 0.3 - t * 6, 11);
            if (s > 0.3) g.set(x, y, s > 0.7 ? "█" : s > 0.5 ? "│" : "▒", KEYS[FALLS + (s > 0.7 ? 2 : s > 0.5 ? 1 : 0)]);
          }
        }
      }
    }
    // the sea of clouds, billowing slowly
    for (let y = seaY - 3; y < rows; y++) for (let x = 0; x < cols; x++) {
      const n = fbm(x * 0.06 + t * 0.12, y * 0.3 - t * 0.05, 4, 15);
      const top = seaY + (n - 0.5) * 6;
      if (y < top) continue;
      const v = clamp(0.95 - (y - top) * 0.07 + (n - 0.5) * 0.5);
      g.set(x, y, v > 0.75 ? "█" : v > 0.5 ? "▓" : "▒", KEYS[CLOUD + clamp(Math.floor(v * 5), 0, 4)]);
    }
    return g.frame();
  };
}
