/* candle-flame: a lit candle in a dark room, its flame flickering and wax slowly dripping. */
import { Grid, palette, gradient, KEYS, fbm, noise2, clamp } from "../lib/kit.js";

const GLOW = gradient(["#0a0604", "#24120a", "#4a2410", "#7a3e14", "#a8601e"], 10); // 0-9
const WAX = gradient(["#6e5a48", "#b49a7c", "#e8d6b8", "#fff4de"], 8);              // a-h
const FLAME = gradient(["#b3240e", "#f06a12", "#ffb12e", "#ffe48a", "#fffbe8"], 8); // i-p
const pal = palette([...GLOW, ...WAX, ...FLAME, "#4f8cff", "#2a1a10", "#c99a3a", "#7d5a1c"]); // q blue, r wick, s brass, t brass dark

export const meta = {
  slug: "candle-flame",
  name: "Candle Flame",
  category: "things",
  note: "A single candle in a dark room, its flame flickering and wax dripping slowly down the side.",
  tags: ["candle", "fire", "cozy", "wallpaper", "hero"],
  cols: 56, rows: 36, fps: 24,
  palette: pal,
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = 28, top = 17, bot = 31, half = 6;
  const drips = [
    { x: cx - half - 1, ph: 0.0, per: 7, max: 9 },
    { x: cx + half + 1, ph: 3.1, per: 9, max: 11 },
    { x: cx - half - 1, ph: 4.4, per: 10, max: 5 },
  ];
  return (t) => {
    const flick = 0.82 + 0.18 * noise2(t * 6, 0.5, 3) + 0.06 * Math.sin(t * 23);
    const sway = (noise2(t * 0.9, 7.1, 5) - 0.5) * 3.2;
    const fy = top - 6;
    // room glow
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const d = Math.hypot((x - cx - sway * 0.3) / 2, y - fy);
      let v = Math.exp(-d / (9 * flick)) * flick + fbm(x * 0.1, y * 0.2, 2) * 0.12;
      if (y >= bot + 1) v = v * 0.8 + 0.08 + ((x * 7 + y * 3) % 5 === 0 ? 0.04 : 0);
      v = clamp(v);
      g.set(x, y, v > 0.62 ? "▓" : v > 0.32 ? "▒" : "░", KEYS[Math.min(9, Math.floor(v * 10))]);
    }
    // candle body: lit cylinder
    for (let y = top; y <= bot; y++) for (let x = cx - half; x <= cx + half; x++) {
      const u = (x - cx) / half;
      const lit = Math.sqrt(Math.max(0, 1 - u * u)) * 0.75 + 0.25 - (y - top) / (bot - top) * 0.35 - u * 0.12;
      g.set(x, y, "█", KEYS[10 + Math.min(7, Math.max(0, Math.floor(clamp(lit) * 8)))]);
    }
    // top rim, a shallow pool of melted wax
    for (let x = cx - half; x <= cx + half; x++) g.set(x, top, Math.abs(x - cx) < half - 1 ? "▀" : "█", KEYS[17]);
    for (let x = cx - half + 2; x <= cx + half - 2; x++) g.set(x, top, "▄", KEYS[16]);
    // drips
    for (const d of drips) {
      const k = ((t + d.ph) % d.per) / d.per;
      const len = Math.floor(Math.min(1, k * 1.4) * d.max);
      for (let j = 0; j <= len; j++) g.set(d.x, top + j, j === len ? "▀" : "█", KEYS[j < 2 ? 17 : 16]);
    }
    // brass holder
    for (let y = bot + 1; y <= bot + 3; y++) {
      const w = y === bot + 1 ? half + 3 : y === bot + 2 ? half + 6 : half + 8;
      for (let x = cx - w; x <= cx + w; x++) {
        const l = (x - cx) / w;
        g.set(x, y, y === bot + 3 ? "▀" : "█", Math.abs(l + 0.3) < 0.35 ? "s" : "t");
      }
    }
    // wick
    g.set(cx, top - 1, "|", "r");
    g.set(cx, top - 2, "'", "i");
    // flame, a teardrop that bends with the draught
    const h = 9.5 * flick;
    for (let y = 0; y < top; y++) {
      const s = (top - 1.5 - y) / h;
      if (s < -0.12 || s > 1) continue;
      const ss = Math.max(0, s);
      const w = 3.6 * Math.pow(1 - ss, 1.2) * Math.sqrt(Math.min(1, (ss + 0.12) * 3.2));
      const xc = cx + sway * ss * ss;
      for (let x = Math.floor(xc - w - 1); x <= Math.ceil(xc + w + 1); x++) {
        const dx = Math.abs(x - xc) / Math.max(0.4, w);
        if (dx > 1) continue;
        const heat = clamp((1 - dx) * 1.15 - ss * 0.55 + 0.25);
        if (ss < 0.14 && dx < 0.45) { g.set(x, y, ss < 0.1 ? "▓" : "█", "q"); continue; }
        g.set(x, y, heat > 0.25 ? "█" : "▓", KEYS[18 + Math.min(7, Math.floor(heat * 8))]);
      }
    }
    return g.frame();
  };
}
