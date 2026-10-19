/* rainy-window: rain running down a window pane over the soft bokeh lights of a city at night. */
import { Grid, palette, gradient, KEYS, fbm, rng, clamp } from "../lib/kit.js";

const P = [];
const add = (a) => { const o = P.length; P.push(...a); return o; };
const BG = add(gradient(["#06070f", "#0e1226", "#1a1e3a", "#2a2a4e"], 6));
const HUES = [["#3a2410", "#a0601e", "#ffb24a", "#ffe2a8"], ["#3a0e18", "#a02838", "#ff5a6a", "#ffc0c8"],
  ["#0a2a30", "#1a7a82", "#4ae0e0", "#c0fff8"], ["#22183a", "#6a4aa8", "#b48aff", "#ecdcff"], ["#2a2a2a", "#8a8a8a", "#e8e8e8", "#ffffff"]];
const BOK = HUES.map((h) => add(h));
const DROP = add(["#9ab4d0", "#d8ecff", "#ffffff", "#5a6e8a"]);
const FRAME = add(["#140c08", "#2e1c12", "#4a3020", "#6a4a32"]);

export const meta = {
  slug: "rainy-window",
  name: "Rainy Window",
  category: "landscapes",
  note: "Raindrops slide down a window pane in front of the blurred, glowing lights of a city at night.",
  tags: ["rain", "city", "night", "cozy", "wallpaper", "lofi"],
  cols: 96, rows: 36, fps: 24,
  palette: palette(P),
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(5);
  const bokeh = Array.from({ length: 36 }, () => ({ x: r() * cols, y: 3 + r() * (rows - 6), rad: 1.3 + r() * 3, h: Math.floor(r() * HUES.length), ph: r() * 6.28, sp: 0.3 + r() * 0.8 }));
  const beads = Array.from({ length: 130 }, () => [Math.floor(r() * cols), Math.floor(r() * rows), r()]);
  const runners = Array.from({ length: 16 }, () => ({ x: 2 + Math.floor(r() * (cols - 4)), off: r() * 50, sp: 4 + r() * 6, len: 4 + Math.floor(r() * 8) }));
  const I = new Float32Array(cols * rows), H = new Int8Array(cols * rows);
  return (t) => {
    g.clear();
    I.fill(0); H.fill(-1);
    // soft lights: each cell takes the brightest disc that reaches it
    for (const b of bokeh) {
      const bx = b.x + Math.sin(t * 0.1 + b.ph) * 1.5;
      const pulse = 0.9 + 0.1 * Math.sin(t * b.sp + b.ph);
      const x0 = Math.max(0, Math.floor(bx - b.rad * 2 - 2)), x1 = Math.min(cols - 1, Math.ceil(bx + b.rad * 2 + 2));
      const y0 = Math.max(0, Math.floor(b.y - b.rad - 1)), y1 = Math.min(rows - 1, Math.ceil(b.y + b.rad + 1));
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const d = Math.hypot((x - bx) / 2, y - b.y) / b.rad;
        const v = (d < 0.7 ? 0.82 : d < 1 ? 0.62 : d < 1.45 ? 0.34 : 0) * pulse;
        const i = x + y * cols;
        if (v > I[i]) { I[i] = v; H[i] = b.h; }
      }
    }
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const i = x + y * cols;
      const n = fbm(x * 0.05, y * 0.1 + t * 0.02, 3, 4);
      const base = clamp(0.15 + (1 - y / rows) * 0.2 + (n - 0.5) * 0.5 + (x > 30 && x < 70 && y > 22 ? 0.2 : 0));
      if (I[i] > 0.25) {
        const v = I[i];
        g.set(x, y, v > 0.7 ? "▓" : v > 0.5 ? "▒" : "░", KEYS[BOK[H[i]] + (v > 0.7 ? 3 : v > 0.5 ? 2 : 1)]);
      } else g.set(x, y, base > 0.4 ? "▒" : "░", KEYS[BG + clamp(Math.floor(base * 6), 0, 5)]);
    }
    // beads of water clinging to the glass
    for (const [bx, by, s] of beads) g.set(bx, by, s > 0.85 ? "o" : s > 0.5 ? "°" : "·", KEYS[DROP + (s > 0.85 ? 1 : s > 0.5 ? 0 : 3)]);
    // drops running down, stick and slip, leaving a wet trail
    for (const d of runners) {
      const p = t * d.sp + d.off;
      const y = ((p + Math.sin(p * 0.7) * 2) % (rows + d.len + 6)) - 2;
      const wig = Math.round(Math.sin(p * 0.3 + d.x) * 0.7);
      for (let k = 1; k <= d.len; k++) g.set(d.x + wig * (k > d.len / 2 ? 0 : 1), y - k, k < 4 ? "│" : "╎", KEYS[DROP + (k < 4 ? 1 : 0)]);
      g.set(d.x + wig, y, "●", KEYS[DROP + 2]);
      g.set(d.x + wig, y + 1, "▀", KEYS[DROP + 1]);
    }
    // window frame and mullions
    const mx = Math.floor(cols / 2), my = 15;
    for (let y = 0; y < rows; y++) { g.set(mx - 1, y, "▐", KEYS[FRAME + 2]); g.set(mx, y, "█", KEYS[FRAME + 1]); g.set(mx + 1, y, "▌", KEYS[FRAME]); }
    for (let x = 0; x < cols; x++) { g.set(x, my, "▄", KEYS[FRAME + 3]); g.set(x, my + 1, "▀", KEYS[FRAME + 1]); }
    for (let y = 0; y < rows; y++) { g.set(0, y, "█", KEYS[FRAME]); g.set(1, y, "▌", KEYS[FRAME + 2]); g.set(cols - 1, y, "█", KEYS[FRAME]); g.set(cols - 2, y, "▐", KEYS[FRAME + 2]); }
    for (let x = 0; x < cols; x++) { g.set(x, 0, "▀", KEYS[FRAME + 1]); g.set(x, rows - 2, "▄", KEYS[FRAME + 3]); g.set(x, rows - 1, "█", KEYS[FRAME + 2]); }
    g.set(mx, my, "█", KEYS[FRAME + 2]); g.set(mx, my + 1, "█", KEYS[FRAME + 1]);
    return g.frame();
  };
}
