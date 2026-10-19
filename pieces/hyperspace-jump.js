/* hyperspace-jump: stars stretch into streaks, the ship drops into a swirling blue tunnel, then falls back to calm space. */
import { Grid, palette, gradient, KEYS, noise2, rng, clamp, smooth, TAU } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("tun", gradient(["#02030c", "#050a24", "#0a1a4a", "#12307a", "#1e52b0", "#3a86e0", "#7ab8ff", "#c8e4ff"], 12));
add("streak", gradient(["#1a3a8a", "#3a6ad0", "#7aa8ff", "#c8dcff", "#ffffff"], 6));
add("space", ["#04050c", "#0a0c1a"]);
add("star", ["#5a6488", "#a8b4d8", "#ffffff"]);
add("core", ["#e8f4ff", "#ffffff"]);

export const meta = {
  slug: "hyperspace-jump",
  name: "Hyperspace Jump",
  category: "demoscene",
  note: "Calm stars stretch into streaks, the ship plunges into a swirling blue hyperspace tunnel and then drops back out among the stars.",
  tags: ["hyperspace", "space", "sci-fi", "tunnel", "hero", "loader"],
  cols: 96, rows: 32, fps: 30,
  palette: palette(all),
};

const K = (n, i) => KEYS[G[n] + i];
const P = 10, NS = 240, ZM = 12;
// how deep into the jump we are, 0 calm .. 1 full hyperspace
const env = (p) => p < 1.6 ? 0 : p < 3.6 ? smooth((p - 1.6) / 2) : p < 7.8 ? 1 : p < 9.2 ? 1 - smooth((p - 7.8) / 1.4) : 0;
const DIR = ["─", "╱", "│", "╲"];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(77);
  const sa = new Float32Array(NS), sz = new Float32Array(NS), sb = new Float32Array(NS);
  for (let i = 0; i < NS; i++) { sa[i] = r() * TAU; sz[i] = r() * ZM; sb[i] = 0.3 + r() * 0.7; }
  const cx = cols / 2, cy = rows / 2, S = cols * 0.5;
  const speed = (p) => 0.4 + env(p) * 9;
  const dist = (p) => { let d = 0; const n = 60, h = p / n; for (let i = 0; i < n; i++) d += speed((i + 0.5) * h) * h; return d; };
  const per = dist(P);
  return (t) => {
    const cyc = Math.floor(t / P), p = t - cyc * P;
    const e = env(p), v = speed(p), D = dist(p) + cyc * per;
    // tunnel walls
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const dx = (x + 0.5 - cx) / S, dy = (y + 0.5 - cy) * 2 / S;
      const rho = Math.hypot(dx, dy) + 1e-4;
      if (e < 0.02) { g.set(x, y, (x * 13 + y * 7) % 5 ? "·" : " ", K("space", (x + y) & 1)); continue; }
      const a = Math.atan2(dy, dx), depth = 0.6 / rho + D * 0.18;
      const tw = a + depth * 0.35;
      const n = noise2(Math.cos(tw) * 2.2 + 5, depth * 1.4, 4) * 0.6 + noise2(Math.sin(tw) * 2.2 + 9, depth * 3.1, 8) * 0.4;
      const band = 0.5 + 0.5 * Math.sin(tw * 6 + depth * 2);
      let lv = (n * 0.75 + band * 0.35) * clamp(rho * 1.6) * e;
      lv += clamp(0.25 - rho) * 3.2 * e;
      lv = clamp(lv);
      if (lv < 0.08) g.set(x, y, "·", K("space", 1));
      else g.set(x, y, lv > 0.78 ? "▓" : lv > 0.5 ? "▒" : lv > 0.25 ? "░" : ":", K("tun", Math.min(11, Math.floor(lv * 12))));
    }
    // star streaks
    const blur = 0.05 + v * 0.11;
    for (let i = 0; i < NS; i++) {
      let z = (((sz[i] - D) % ZM) + ZM) % ZM + 0.25;
      const z2 = z + blur * (0.5 + z * 0.3);
      const ca = Math.cos(sa[i]), sn = Math.sin(sa[i]);
      const r1 = 1.1 / z, r2 = 1.1 / z2;
      const x1 = cx + ca * r1 * S, y1 = cy + sn * r1 * S * 0.5;
      const x2 = cx + ca * r2 * S, y2 = cy + sn * r2 * S * 0.5;
      if ((x1 < -20 || x1 > cols + 20 || y1 < -10 || y1 > rows + 10) && (x2 < 0 || x2 >= cols || y2 < 0 || y2 >= rows)) continue;
      const near = clamp(1.4 - z / ZM * 1.4) * sb[i];
      const len = Math.hypot(x1 - x2, (y1 - y2) * 2);
      if (len < 1.2) {
        g.set(x1, y1, near > 0.6 ? "•" : "·", K("star", near > 0.6 ? 2 : near > 0.3 ? 1 : 0));
        continue;
      }
      const ang = Math.atan2(-(y1 - y2) * 2, x1 - x2);
      const ch = DIR[((Math.round(ang / (Math.PI / 4)) % 4) + 4) % 4];
      const steps = Math.ceil(Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2)));
      for (let s = 0; s <= steps; s++) {
        const f = s / steps;
        const lvl = Math.min(5, Math.floor((1 - f) * near * 6 + 0.5));
        g.set(x1 + (x2 - x1) * f, y1 + (y2 - y1) * f, s === 0 && near > 0.5 ? "█" : ch, K("streak", lvl));
      }
    }
    if (e > 0.3) g.text(Math.round(cx) - 1, Math.round(cy - 0.5), "▐█▌", K("core", 1));
    return g.frame();
  };
}
