/* ferris-wheel: a lit observation wheel turning at dusk, its gondolas hanging upright. */
import { Grid, palette, gradient, KEYS, fbm, rng, clamp, TAU } from "../lib/kit.js";

const SKY = gradient(["#140d2e", "#2e1b52", "#5a2a6e", "#a8406a", "#f07a5a", "#ffb36b"], 12); // 0-b (0..11)
const pal = palette([
  ...SKY,
  "#0a0814", "#1a1428", "#2a2238",          // c d e  ground and city
  "#c8ccd8", "#7c8296",                     // f g    steel light, steel dark
  "#ff4f6d", "#ffd23f", "#3fd0ff", "#7dff8a", "#ff8f3f", "#c77dff", // h i j k l m gondolas
  "#fff6c8", "#ffe08a",                     // n o    bulbs
]);

export const meta = {
  slug: "ferris-wheel",
  name: "Ferris Wheel",
  category: "things",
  note: "A big wheel turning against a dusk sky, its rim lights chasing and its gondolas hanging level.",
  tags: ["fair", "carnival", "night", "wallpaper", "hero"],
  cols: 92, rows: 40, fps: 24,
  palette: pal,
};

const GCOL = "hijklm";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = 46, cy = 17, R = 30, N = 12;
  const r = rng(5);
  const city = Array.from({ length: cols }, (_, x) => 35 - Math.floor(r() * 4 + (Math.sin(x * 0.3) > 0.6 ? 2 : 0)));
  const stars = Array.from({ length: 30 }, () => [Math.floor(r() * cols), Math.floor(r() * 12), r() * 6]);
  const at = (a, rr) => [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.5];
  return (t) => {
    const rot = t * 0.18;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = clamp(y / 34 + (fbm(x * 0.05 + t * 0.03, y * 0.2, 3) - 0.5) * 0.25);
      g.set(x, y, v > 0.55 ? "▓" : v > 0.25 ? "▒" : "░", KEYS[Math.min(11, Math.floor(v * 12))]);
    }
    for (const [sx, sy, ph] of stars) if (Math.sin(t * 2 + ph) > 0.2) g.set(sx, sy, "·", "n");
    // city and ground
    for (let x = 0; x < cols; x++) {
      for (let y = city[x]; y < rows; y++) g.set(x, y, y >= 37 ? "▓" : "█", y >= 37 ? "e" : "d");
      if ((x * 7) % 5 === 0) g.set(x, city[x] + 1, "▪", "o");
    }
    // A-frame legs
    for (const side of [-1, 1]) {
      g.line(cx, cy, cx + side * 15, 37, "█", "g");
      g.line(cx + side * 1, cy, cx + side * 16, 37, "▓", "g");
    }
    g.line(cx - 9, 30, cx + 9, 30, "═", "g");
    // spokes and rims
    for (let k = 0; k < N; k++) {
      const a = rot + (k * TAU) / N;
      for (let s = 2; s < R; s += 0.5) { const [x, y] = at(a, s); g.set(Math.round(x), Math.round(y), "·", "f"); }
    }
    for (let i = 0; i < 240; i++) {
      const a = (i / 240) * TAU;
      const [x1, y1] = at(a, R); g.set(Math.round(x1), Math.round(y1), "█", "f");
      const [x2, y2] = at(a, R - 3); g.set(Math.round(x2), Math.round(y2), "▓", "g");
    }
    // chasing rim lights
    for (let i = 0; i < 48; i++) {
      const a = rot + (i / 48) * TAU;
      const [x, y] = at(a, R);
      const on = (i + Math.floor(t * 6)) % 4 === 0;
      g.set(Math.round(x), Math.round(y), on ? "●" : "•", on ? "n" : (i % 2 ? "h" : "i"));
    }
    // hub
    g.set(cx - 1, cy, "█", "f"); g.set(cx, cy, "●", "n"); g.set(cx + 1, cy, "█", "f");
    // gondolas, hanging below their pins, always level
    for (let k = 0; k < N; k++) {
      const a = rot + (k * TAU) / N + TAU / (N * 2);
      const [px, py] = at(a, R);
      const swing = Math.sin(t * 1.3 + k) * 0.4;
      const gx = Math.round(px + swing), gy = Math.round(py);
      const c = GCOL[k % GCOL.length];
      g.set(gx, gy, "┬", "f");
      g.text(gx - 2, gy + 1, "▐███▌", c);
      g.set(gx - 1, gy + 1, "▀", "n"); g.set(gx + 1, gy + 1, "▀", "n");
      g.text(gx - 2, gy + 2, "▝▀▀▀▘", c);
    }
    return g.frame();
  };
}
