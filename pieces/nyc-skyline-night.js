/* nyc-skyline-night: a dense skyscraper skyline at night, windows flicking on and off over a river. */
import { Grid, palette, gradient, KEYS, fbm, rng, clamp } from "../lib/kit.js";

const P = [];
const add = (a) => { const o = P.length; P.push(...a); return o; };
const SKY = add(gradient(["#05071a", "#0d1638", "#1f2a5c", "#4a3a6e", "#8a4e6a"], 12));
const BLD = add(["#0c1022", "#18203e", "#232d54", "#30396a"]);
const WIN = add(["#f9d77e", "#ffeeb0", "#bfe3ff", "#ffb35c", "#7fd0ff"]);
const RED = add(["#ff3b3b", "#7a1a2a"]);
const RIV = add(gradient(["#03050f", "#0b1330", "#1a2650"], 5));
const STAR = add(["#d9e2ff"]);

export const meta = {
  slug: "nyc-skyline-night",
  name: "City Skyline Night",
  category: "landscapes",
  note: "A dense skyscraper skyline at night, its windows flicking on and off above a dark river.",
  tags: ["city", "night", "skyline", "wallpaper", "hero", "header"],
  cols: 104, rows: 36, fps: 15,
  palette: palette(P),
};

function hash(a, b, c) {
  let h = (a * 374761393 + b * 668265263 + c * 1274126177) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(77);
  const water = 29;
  const stars = Array.from({ length: 40 }, () => [Math.floor(r() * cols), Math.floor(r() * 10), r() * 6.28]);
  // layered towers: back, mid, front
  const layers = [];
  const spec = [[4, 9, 6, 18, 1, 0.45], [6, 12, 9, 22, 2, 0.55], [7, 13, 15, 25, 3, 0.6]];
  spec.forEach(([wmin, wvar, tmin, tvar, shade, dens], li) => {
    const list = [];
    for (let x = -2 - li * 3; x < cols;) {
      const w = wmin + Math.floor(r() * wvar);
      const top = tmin + Math.floor(r() * (tvar - tmin));
      const style = r();
      list.push({ x, w, top, style, shade, dens, id: li * 1000 + list.length, win: Math.floor(r() * 3) });
      x += w + (r() < 0.3 ? 1 : 0) - (li === 0 ? 1 : 0);
    }
    layers.push(list);
  });
  // heightmap of the skyline for reflections
  const sky = new Int16Array(cols * rows);
  return (t) => {
    g.clear();
    for (let y = 0; y < water; y++) {
      for (let x = 0; x < cols; x++) {
        const c = fbm(x * 0.04 + t * 0.02, y * 0.2, 3, 9);
        const v = clamp((y / water) ** 1.25 + (c - 0.5) * 0.3);
        g.set(x, y, v > 0.55 ? "▓" : v > 0.3 ? "▒" : "░", KEYS[SKY + clamp(Math.floor(v * 12), 0, 11)]);
      }
    }
    for (const [sx, sy, ph] of stars) if (Math.sin(t * 1.3 + ph) > 0.1) g.set(sx, sy, "·", KEYS[STAR]);
    sky.fill(0);
    const slot = Math.floor(t * 1.5);
    for (const list of layers) for (const b of list) {
      const { x: bx, w, top, style, shade } = b;
      // crown
      const cx = bx + Math.floor(w / 2);
      if (style > 0.8) { // spire with beacon
        for (let y = top - 6; y < top; y++) g.set(cx, y, "│", KEYS[BLD + shade]);
        g.set(cx, top - 7, Math.sin(t * 4 + b.id) > 0 ? "●" : "•", KEYS[RED + (Math.sin(t * 4 + b.id) > 0 ? 0 : 1)]);
      } else if (style > 0.6) { // stepped crown
        for (let s = 1; s <= 3; s++) for (let x = bx + s * 1; x < bx + w - s; x++) g.set(x, top - s, "█", KEYS[BLD + shade]);
      } else if (style > 0.45) { // antenna
        g.set(cx - 1, top - 1, "▄", KEYS[BLD + shade]); g.set(cx, top - 2, "╽", KEYS[BLD + shade]);
        g.set(cx, top - 3, Math.sin(t * 2.5 + b.id) > 0.3 ? "•" : "·", KEYS[RED]);
      }
      for (let y = top; y < water; y++) for (let x = bx; x < bx + w; x++) {
        if (x < 0 || x >= cols) continue;
        const lx = x - bx, ly = y - top;
        const edge = lx === 0 || lx === w - 1;
        let ch = edge ? "█" : "▓", co = KEYS[BLD + (edge ? shade - 1 : shade)];
        const pattern = b.win === 0 ? (lx % 2 === 1 && ly % 2 === 1) : b.win === 1 ? (lx % 3 !== 0 && ly % 2 === 1) : (lx % 2 === 1 && ly % 3 !== 2);
        if (!edge && ly > 0 && pattern) {
          const h = hash(x, y, b.id);
          const period = 3 + Math.floor(h * 9);
          const on = hash(x, y, Math.floor((slot + h * 40) / period)) < b.dens;
          if (on) {
            const hue = h < 0.55 ? 0 : h < 0.75 ? 3 : h < 0.92 ? 2 : 4;
            ch = shade === 3 ? "█" : shade === 2 ? "▪" : "·";
            co = KEYS[WIN + (hash(x, y, 7) < 0.15 ? 1 : hue)];
          } else { ch = "▒"; co = KEYS[BLD + Math.max(0, shade - 1)]; }
        }
        g.set(x, y, ch, co);
      }
    }
    // river: reflections of the skyline, broken by ripples
    for (let y = water; y < rows; y++) {
      const d = (y - water) / (rows - water);
      for (let x = 0; x < cols; x++) {
        const wob = Math.round(Math.sin(y * 1.7 + t * 2 + x * 0.15) * (1 + d * 2));
        const sy = water - 1 - (y - water) * 2;
        const w = fbm(x * 0.12 - t * 0.4, y * 0.8, 2, 3);
        const srcIdx = (x + wob) + sy * cols;
        const sc = sy >= 0 && x + wob >= 0 && x + wob < cols ? g.co[srcIdx] : " ";
        const ki = KEYS.indexOf(sc), isLight = ki >= WIN && ki < WIN + 5;
        if (isLight && w > 0.3) g.set(x, y, w > 0.6 ? "═" : "─", sc);
        else g.set(x, y, w > 0.6 ? "▒" : "░", KEYS[RIV + clamp(Math.floor((1 - d) * 3 + w * 2), 0, 4)]);
      }
    }
    g.hline(0, cols - 1, water, "▀", KEYS[RIV + 4]);
    return g.frame();
  };
}
