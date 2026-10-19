/* waterfall: a tall waterfall pouring between mossy cliffs into a churning pool, mist and spray rising. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const ROCK = add(gradient(["#0e1012", "#1e2226", "#30363a", "#464e52", "#62686a"], 10));
const MOSS = add(gradient(["#1a3a16", "#2a5a1e", "#3e7a26", "#5a9a32"], 6));
const WATER = add(gradient(["#1a4a6a", "#2a6a8e", "#4a90b4", "#7ab8d4", "#b4dcec", "#eaf8ff"], 14));
const POOL = add(gradient(["#062030", "#0c3448", "#164c64", "#24687e"], 8));
const MIST = add(gradient(["#8ab4c8", "#c4e0ec", "#ffffff"], 3));
const SKY = add(gradient(["#6a9ac8", "#a4c8e4"], 3));

export const meta = {
  slug: "waterfall",
  name: "Waterfall",
  category: "weather",
  note: "A tall waterfall pours between dark mossy cliffs into a churning pool, throwing up spray and drifting mist.",
  tags: ["waterfall", "water", "river", "forest", "wallpaper", "hero"],
  cols: 90, rows: 38, fps: 24,
  palette: palette(P),
};

const SH = " ░▒▓█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const pool = 29, cx = 45;
  const r = rng(6);
  const spray = Array.from({ length: 110 }, () => [(r() - 0.5) * 2, r(), 0.6 + r() * 0.9, 3 + r() * 9]);
  const leftEdge = (y) => cx - 13 + Math.floor(fbm(y * 0.15, 1, 2, 3) * 4) - (y < 4 ? 3 - y : 0);
  const rightEdge = (y) => cx + 13 - Math.floor(fbm(y * 0.15, 5, 2, 3) * 4) + (y < 4 ? 3 - y : 0);
  return (t) => {
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const n = fbm(x * 0.12, y * 0.25, 4, 2);
      const crack = noise2(x * 0.5, y * 0.3, 7) > 0.78;
      const v = clamp(0.2 + n * 0.7 - Math.abs(x - cx) * 0.004);
      const mossy = fbm(x * 0.1, y * 0.2, 3, 9) > 0.58;
      if (mossy && !crack) g.set(x, y, n > 0.5 ? "▓" : "%", KEYS[MOSS + Math.min(5, Math.floor(v * 6))]);
      else g.set(x, y, crack ? "▒" : n > 0.55 ? "█" : "▓", KEYS[ROCK + Math.min(9, Math.floor(v * 10) - (crack ? 2 : 0))]);
    }
    for (let y = 0; y < 3; y++) for (let x = cx - 18; x <= cx + 18; x++) g.set(x, y, "▒", KEYS[SKY + y % 3]);
    for (let y = 0; y < pool + 1; y++) {
      const L = leftEdge(y), R = rightEdge(y);
      for (let x = L; x <= R; x++) {
        const a = (x - L) / (R - L);
        const streak = fbm(x * 0.55, y * 0.12 - t * 2.6, 3, 4);
        const fast = noise2(x * 1.1, y * 0.3 - t * 6, 8);
        const edge = Math.min(a, 1 - a);
        const v = clamp(0.35 + streak * 0.55 + fast * 0.2 + edge * 0.4 - (y < 3 ? 0 : 0) + (y / pool) * 0.15);
        const ch = v > 0.85 ? "█" : fast > 0.6 ? "│" : v > 0.65 ? "▓" : v > 0.5 ? "▒" : "|";
        g.set(x, y, ch, KEYS[WATER + Math.min(13, Math.floor(v * 14))]);
      }
      if (y === 2) for (let x = L; x <= R; x++) g.set(x, y, "▀", KEYS[WATER + 12]);
    }
    for (let y = pool; y < rows; y++) for (let x = 0; x < cols; x++) {
      const d = Math.hypot((x - cx) / 2.5, (y - pool) * 1.5);
      const w = fbm(x * 0.1 + Math.sign(x - cx) * -t * 0.6, y * 0.6, 3, 5);
      const foam = clamp(1 - d / 14 + (w - 0.5) * 0.8);
      if (foam > 0.35) g.set(x, y, foam > 0.75 ? "█" : foam > 0.55 ? "▓" : "▒", KEYS[MIST + Math.min(2, Math.floor((foam - 0.35) * 5))]);
      else g.set(x, y, w > 0.58 ? "≈" : w > 0.45 ? "~" : "▓", KEYS[POOL + Math.min(7, Math.floor((w + (rows - y) * 0.02) * 8))]);
    }
    for (let y = pool - 7; y < pool + 3; y++) for (let x = cx - 26; x <= cx + 26; x++) {
      const m = fbm(x * 0.12 - t * 0.3, y * 0.3 + t * 0.4, 3, 6);
      const d = Math.hypot((x - cx) / 3, (y - pool) * 1.0);
      if (m > 0.5 + d * 0.035) g.set(x, y, m > 0.7 ? "▒" : "░", KEYS[MIST + (m > 0.65 ? 2 : 1)]);
    }
    for (const [ox, ph, sp, h] of spray) {
      const a = (t * sp + ph) % 1;
      const x = cx + ox * 14 + ox * a * 22;
      const y = pool - Math.sin(a * Math.PI) * h * 0.8;
      g.set(x, y, a < 0.5 ? "▒" : "░", KEYS[MIST + 2]);
    }
    return g.frame();
  };
}
