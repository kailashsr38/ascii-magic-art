/* hourglass: sand runs through a wooden hourglass, which flips over when the top is empty. */
import { Grid, palette, gradient, KEYS, fbm, noise2, clamp, smooth } from "../lib/kit.js";

const ROOM = gradient(["#120c0a", "#2a1a12", "#3d2618"], 6);           // 0-5
const WOOD = gradient(["#3a200f", "#6e3f1c", "#a8652d", "#d99a55"], 8);  // 6-d
const SAND = gradient(["#a8641e", "#e3a447", "#ffd88a", "#fff2c9"], 8);  // e-l
const GLASS = gradient(["#1a2a33", "#3d6474", "#8fc3d4", "#e2f6ff"], 6); // m-r
const pal = palette([...ROOM, ...WOOD, ...SAND, ...GLASS]);

export const meta = {
  slug: "hourglass",
  name: "Hourglass",
  category: "things",
  note: "Sand pours through a wooden hourglass, which turns over as soon as the top runs empty.",
  tags: ["time", "loader", "waiting", "sand", "hero"],
  cols: 70, rows: 36, fps: 24,
  palette: pal,
};

const FLOW = 7.5, FLIP = 1.5, PERIOD = FLOW + FLIP;
const H = 13.5, NECK = 0.8, WMAX = 10.5;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = cols / 2 - 0.5, cy = rows / 2 - 0.5;
  const hw = (v) => {
    const s = Math.min(1, Math.abs(v) / H);
    return NECK + WMAX * Math.sin(s * Math.PI * 0.62) / Math.sin(Math.PI * 0.62) * (1 - 0.06 * s);
  };
  const bump = (u) => Math.exp(-((u / 5) ** 2));
  const LMAX = H * 0.62;
  const room = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const glow = Math.exp(-Math.hypot((x - cx) / 30, (y - cy) / 16));
    const v = clamp(fbm(x * 0.08, y * 0.18, 3) * 0.6 + glow * 0.5);
    room.push([v > 0.6 ? "▒" : "░", KEYS[Math.min(5, Math.floor(v * 6))]]);
  }
  return (t) => {
    const c = t % PERIOD;
    let p, ang, e = 0;
    if (c < FLOW) { p = c / FLOW; ang = 0; }
    else { p = 1; const f = (c - FLOW) / FLIP; ang = Math.PI * smooth(f); e = smooth(clamp((f - 0.35) / 0.65)); }
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const q = 1 - p;
    const Ltop = LMAX * Math.pow(q, 0.6);
    const Lbot = LMAX * Math.pow(p, 0.75);
    const mound = 2.5 * p;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const i = x + y * cols;
      const px = x - cx, py = (y - cy) * 2;
      const u = px * ca + py * sa;
      const v = (-px * sa + py * ca) / 2;
      const av = Math.abs(v);
      let ch = room[i][0], co = room[i][1];
      const w = hw(v);
      if (av > H && av <= H + 1.7 && Math.abs(u) <= WMAX + 3.5) {
        const k = clamp(0.75 - (av - H) * 0.25 + noise2(u * 0.3, v * 3, 4) * 0.25 - Math.abs(u) * 0.015);
        ch = "█"; co = KEYS[6 + Math.min(7, Math.floor(k * 8))];
      } else if (av <= H && Math.abs(Math.abs(u) - (WMAX + 2.3)) < 0.75) {
        const k = clamp(0.35 + noise2(u, v * 0.7, 9) * 0.35 + (u < 0 ? 0.2 : 0));
        ch = "█"; co = KEYS[6 + Math.min(7, Math.floor(k * 8))];
      } else if (av <= H && Math.abs(u) < w + 0.9) {
        const au = Math.abs(u);
        if (au > w - 0.1) {
          ch = u < 0 ? "▓" : "▒"; co = KEYS[22 + (u < 0 ? 4 : 2)];
        } else {
          let sand = false, depth = 0;
          if (v < 0) {
            const d = 2.5 * bump(u) * Math.min(1, Ltop / 3);
            const top = -Ltop + d;
            if (Ltop > 0.2 && v > top) { sand = true; depth = (v - top) / (Ltop + 1); }
          } else if (c < FLOW) {
            const top = H - Lbot - mound * bump(u);
            if (p > 0.01 && v > top) { sand = true; depth = (v - top) / (Lbot + 3); }
            else if (au < 0.7 && p < 0.995 && v < H - Lbot - mound) {
              ch = (Math.floor(v * 2 - t * 18) & 1) ? ":" : "|"; co = KEYS[14 + 6];
              g.ch[i] = ch; g.co[i] = co; continue;
            }
          } else {
            const lo = (1 - e) * (H - LMAX - 2.5 * bump(u)) + e * 0;
            const hi = (1 - e) * H + e * (LMAX - 2.5 * bump(u));
            if (v > lo && v < hi) { sand = true; depth = (v - lo) / (hi - lo + 1); }
          }
          if (sand) {
            const k = clamp(0.85 - depth * 0.5 + (noise2(u * 0.9, v * 1.6, 2) - 0.5) * 0.5 - au * 0.02);
            ch = k > 0.35 ? "█" : "▓"; co = KEYS[14 + Math.min(7, Math.floor(k * 8))];
            g.ch[i] = ch; g.co[i] = co; continue;
          }
          ch = (u < -w * 0.55 && u > -w * 0.75) ? "▒" : "░"; co = KEYS[22 + (u < -w * 0.55 && u > -w * 0.75 ? 3 : 2)];
        }
      }
      g.ch[i] = ch; g.co[i] = co;
    }
    return g.frame();
  };
}
