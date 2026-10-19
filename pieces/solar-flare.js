/* solar-flare: the churning limb of the sun with a plasma loop arching off it and a flare blasting matter into space. */
import { Grid, palette, gradient, KEYS, fbm, noise2, clamp, smooth, TAU } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("space", gradient(["#030104", "#0c0408", "#1e060a", "#3a0c0c", "#5a1a0e"], 8));
add("sun", gradient(["#3a0602", "#7a1604", "#b83008", "#e8580c", "#ff8a1c", "#ffb840", "#ffe080", "#fff6d0", "#ffffff"], 20));
export const meta = {
  slug: "solar-flare",
  name: "Solar Flare Eruption",
  category: "cosmos",
  note: "The boiling edge of the sun fills the frame while plasma runs along a glowing magnetic loop and a flare erupts, flinging bright matter into space.",
  tags: ["sun", "flare", "plasma", "space", "hero", "wallpaper"],
  cols: 100, rows: 36, fps: 24,
  palette: palette(all),
};
const K = (n, i) => KEYS[G[n] + i];
const SH = "░▒▓█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = 50, cyw = 186, R = 136;     // sun centre and radius in (x, 2y) units, far below the frame
  const field = new Float32Array(cols * rows);
  const PER = 9;
  // loop footpoints along the limb (angles from straight up)
  const loopA = -0.3, loopB = -0.1, loopH = 15;
  const limb = (a, h = 0) => [cx + Math.sin(a) * (R + h), (cyw - Math.cos(a) * (R + h)) / 2];
  const loopPt = (s, wob) => {
    const a = loopA + (loopB - loopA) * s;
    const h = Math.sin(s * Math.PI) * loopH * (1 + wob);
    return limb(a, h);
  };
  return (t) => {
    field.fill(0);
    const ph = (t % PER) / PER;
    // flare: a bright burst then an expanding ejection
    const flareA = 0.12, rise = smooth(clamp((ph - 0.08) / 0.75));
    const glow = Math.exp(-(((ph - 0.12) / 0.06) ** 2)) + 0.25 * Math.exp(-(((ph - 0.3) / 0.2) ** 2));
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const dx = x + 0.5 - cx, dy = (y + 0.5) * 2 - cyw;
      const r = Math.hypot(dx, dy), a = Math.atan2(dx, -dy);
      if (r < R) {
        // surface: granulation that drifts and churns, darker toward the limb
        const mu = Math.sqrt(1 - Math.min(1, (r / R) ** 2));
        const gran = fbm(x * 0.32 + t * 0.15, y * 0.64 - t * 0.06, 2, 4) * 0.55 + fbm(x * 0.07 - t * 0.04, y * 0.14, 2, 9) * 0.45;
        const spot = Math.exp(-(((x - 70) / 4) ** 2 + ((y - 31) / 1.6) ** 2)) * 0.7 + Math.exp(-(((x - 76) / 2.4) ** 2 + ((y - 32) / 1.2) ** 2)) * 0.5;
        const near = Math.exp(-(((a - flareA) / 0.05) ** 2) - ((R - r) / 6) ** 2) * glow;
        const v = 0.36 + 0.2 * Math.pow(mu, 0.6) + (gran - 0.5) * 0.45 - spot * 0.5 + near * 0.35;
        field[x + y * cols] = clamp(v);
      } else {
        const h = r - R;
        // corona: soft glow with streamers that slowly rotate outward
        const str = 0.6 + 0.4 * noise2(a * 9, h * 0.03 - t * 0.15, 3);
        let v = Math.exp(-h / 9) * 0.5 * str + Math.exp(-h / 40) * 0.13;
        // spicules: short jets dancing along the limb
        const sp = noise2(a * 70, t * 0.8, 7);
        if (h < 4 * sp) v = Math.max(v, 0.5 * (1 - h / (4 * sp + 0.01)));
        // ejection: a ragged expanding shell rising from the flare site
        if (ph > 0.08) {
          const ex = cx + Math.sin(flareA) * (R + rise * 70), ey = cyw - Math.cos(flareA) * (R + rise * 70);
          const rd = Math.hypot(dx - (ex - cx), dy - (ey - cyw));
          const shell = 8 + rise * 26;
          const ring = Math.exp(-(((rd - shell) / (3 + rise * 4)) ** 2)) * (1 - rise) * 1.1;
          const core = Math.exp(-((rd / (5 + rise * 10)) ** 2)) * (1 - rise * 0.9);
          const tex = 0.5 + fbm(dx * 0.08 - t * 0.3, dy * 0.08, 3, 11);
          // a thin column connecting the blob back to the surface
          const along = Math.sin(a - flareA) * r;
          const col = Math.exp(-((along / 3) ** 2)) * clamp(1 - h / (rise * 70 + 1)) * 0.7 * (1 - rise);
          v = Math.max(v, (ring + core) * tex, col);
        }
        field[x + y * cols] = clamp(v);
      }
    }
    // plasma loop: a fuzzy arch with knots of plasma sliding down both legs
    const wob = 0.06 * Math.sin(t * 0.7);
    for (let i = 0; i <= 400; i++) {
      const s = i / 400;
      const [px, py] = loopPt(s, wob);
      for (let k = -2; k <= 2; k++) for (let j = -1; j <= 1; j++) {
        const xx = Math.round(px + k), yy = Math.round(py + j * 0.5);
        if (xx < 0 || yy < 0 || xx >= cols || yy >= rows) continue;
        const dd = Math.hypot(px + k - xx, (py - yy) * 2) / 3;
        const flow = 0.5 + 0.5 * Math.sin((s < 0.5 ? s : 1 - s) * 40 + t * 6);
        const v = (0.42 + 0.5 * flow * flow) * Math.max(0, 1 - dd);
        const id = xx + yy * cols;
        field[id] = Math.max(field[id], v);
      }
    }
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = field[x + y * cols];
      const dx = x + 0.5 - cx, dy = (y + 0.5) * 2 - cyw;
      const inside = Math.hypot(dx, dy) < R;
      if (!inside && v < 0.12) { g.set(x, y, v > 0.05 ? "▒" : "░", K("space", Math.min(7, Math.floor(v * 40 + (y > rows * 0.6 ? 2 : 1))))); continue; }
      const li = Math.min(19, Math.floor(v * 20));
      g.set(x, y, inside ? (v > 0.4 ? "█" : "▓") : SH[Math.min(3, Math.floor(v * 4.4))], K("sun", li));
    }
    return g.frame();
  };
}
