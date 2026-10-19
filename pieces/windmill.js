/* windmill: an old windmill on a green hill, sails turning over a tulip field at sunset. */
import { Grid, palette, gradient, KEYS, fbm, noise2, clamp, TAU } from "../lib/kit.js";

const SKY = gradient(["#1d2b5a", "#3d4f8c", "#8a6fa8", "#e88a6a", "#ffc27a"], 10); // 0-9
const HILL = gradient(["#0f2a17", "#1f4d24", "#3a7a2e", "#6aa83a", "#a8cf55"], 10); // a-j
const FAR = gradient(["#3a4a78", "#5a6a98"], 3);                                   // k-m
const MILL = gradient(["#3a2418", "#6b4630", "#9c6c4a", "#c99a70"], 6);           // n-s
const SAIL = gradient(["#b8a890", "#e8dcc4", "#fff6e6"], 4);                       // t-w
const pal = palette([...SKY, ...HILL, ...FAR, ...MILL, ...SAIL, "#e8344a", "#ffd23a", "#ff7ab6", "#fff3c4", "#2a1a12"]);
// x red, y yellow, z pink, A sun, B dark

export const meta = {
  slug: "windmill",
  name: "Windmill on a Hill",
  category: "things",
  note: "An old windmill on a green hill, its lattice sails turning above a striped tulip field at sunset.",
  tags: ["windmill", "countryside", "sunset", "wallpaper", "hero"],
  cols: 92, rows: 36, fps: 24,
  palette: pal,
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const mx = 46, hubY = 10, baseY = 25;
  const hill = (x) => 25 - 4.5 * Math.exp(-(((x - mx) / 26) ** 2)) + Math.sin(x * 0.05) * 0.8 + 3;
  const far = (x) => 21 + Math.sin(x * 0.09 + 1) * 1.6 + Math.sin(x * 0.23) * 0.7;
  const L = 21, W = 4.2;
  return (t) => {
    const rot = t * 0.7;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      let ch, co;
      const hy = hill(x);
      if (y < far(x)) {
        const sd = Math.hypot((x - 74) / 2, y - 15);
        if (sd < 3.2) { ch = "█"; co = "A"; }
        else {
          const cl = fbm(x * 0.04 - t * 0.05, y * 0.18, 4);
          const v = clamp(y / 20 + Math.exp(-sd / 10) * 0.35 + (cl - 0.5) * 0.5);
          ch = cl > 0.62 ? "▓" : v > 0.5 ? "▒" : "░"; co = KEYS[Math.min(9, Math.floor(v * 10))];
        }
      } else if (y < hy) {
        ch = "▓"; co = KEYS[20 + (y - far(x) > 1.5 ? 2 : 1)];
      } else {
        const depth = (y - hy) / (rows - hy + 1);
        const field = y > 29;
        if (field) {
          const stripe = Math.floor((x + (y - 29) * 2.2) / 7) % 4;
          const sway = noise2(x * 0.3 + t * 0.8, y, 3);
          ch = sway > 0.5 ? "▓" : "█";
          co = stripe === 0 ? "x" : stripe === 1 ? "y" : stripe === 2 ? "z" : KEYS[10 + 4 + Math.floor(sway * 3)];
        } else {
          const w = noise2(x * 0.15 - t * 1.2, y * 0.6, 7);
          const v = clamp(0.75 - depth * 0.6 + (w - 0.5) * 0.5 - Math.abs(x - mx) * 0.004);
          ch = w > 0.6 ? "▓" : "▒"; co = KEYS[10 + Math.min(9, Math.floor(v * 10))];
        }
      }
      g.set(x, y, ch, co);
    }
    // tower: a tapered body with a door and a window
    for (let y = hubY + 1; y <= baseY + 2; y++) {
      const s = (y - hubY - 1) / (baseY + 1 - hubY);
      const half = 3.5 + s * 4;
      for (let x = Math.floor(mx - half); x <= Math.ceil(mx + half); x++) {
        const u = (x - mx) / half;
        if (Math.abs(u) > 1) continue;
        const l = clamp(0.65 - u * 0.4 + (Math.abs(u) > 0.9 ? -0.3 : 0));
        g.set(x, y, (y % 3 === 0) ? "▓" : "█", KEYS[23 + Math.min(5, Math.floor(l * 6))]);
      }
    }
    for (let y = baseY - 1; y <= baseY + 2; y++) for (let x = mx - 1; x <= mx + 1; x++) g.set(x, y, "█", "B");
    g.set(mx, 17, "█", "A"); g.set(mx + 1, 17, "█", "A");
    // cap
    for (let y = hubY - 2; y <= hubY + 1; y++) {
      const half = 2 + (y - hubY + 2) * 1.4;
      for (let x = Math.floor(mx - half); x <= Math.ceil(mx + half); x++) g.set(x, y, y === hubY - 2 ? "▄" : "█", KEYS[23 + (x < mx ? 4 : 2)]);
    }
    // sails: four lattice blades on stocks
    const R = L + 1;
    for (let y = Math.max(0, hubY - 12); y <= Math.min(rows - 1, hubY + 12); y++) for (let x = mx - R - 1; x <= mx + R + 1; x++) {
      const dx = x - mx, dy = (y - hubY) * 2;
      const r = Math.hypot(dx, dy);
      if (r > R || r < 1) continue;
      for (let k = 0; k < 4; k++) {
        const a = rot + (k * TAU) / 4;
        const ca = Math.cos(a), sa = Math.sin(a);
        const along = dx * ca + dy * sa, across = -dx * sa + dy * ca;
        if (along < 0 || along > L) continue;
        if (Math.abs(across) < 0.75) { g.set(x, y, "█", "o"); break; }
        if (along > 3 && across > 0.75 && across < W) {
          const lat = (along % 2.6) < 0.8 || across > W - 0.9;
          g.set(x, y, lat ? "█" : "▓", lat ? "p" : KEYS[29 + Math.min(3, Math.floor(clamp(0.5 + ca * 0.4) * 4))]);
          break;
        }
      }
    }
    g.set(mx, hubY, "●", "A");
    return g.frame();
  };
}
