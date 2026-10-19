/* ringed-planet: a banded gas giant turning inside tilted rings, two moons passing in front and behind. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, TAU } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("bg", gradient(["#03040c", "#0a1030", "#17194a", "#2b2160"], 8));
add("star", ["#9aaeff", "#ffffff"]);
add("body", gradient(["#1a0f08", "#4a2c14", "#8a5a2a", "#c08a4a", "#e2b878", "#f5ddb0", "#fff6e2"], 16));
add("band", gradient(["#2a140a", "#6e3a1a", "#b0602c", "#d88a4c", "#f0b880"], 10));
add("ring", gradient(["#2a2418", "#5c4e34", "#9c8a62", "#cfc098", "#f4ead0"], 10));
add("moon", gradient(["#2a2a30", "#6a6a74", "#b4b4bc", "#f0f0f4"], 6));

export const meta = {
  slug: "ringed-planet",
  name: "Ringed Gas Giant",
  category: "cosmos",
  note: "A banded gas giant turns inside its tilted rings while two small moons slip in front and behind.",
  tags: ["planet", "rings", "moons", "wallpaper", "hero"],
  cols: 100, rows: 38, fps: 24,
  palette: palette(all),
};

const K = (n, i) => KEYS[G[n] + i];
const SH = "░▒▓█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = cols / 2, cy = rows / 2, R = 17.5, S = 0.36, ROT = -0.22;
  const R1 = R * 1.3, R2 = R * 2.25;
  const cr = Math.cos(ROT), sr = Math.sin(ROT);
  const L = [-0.62, -0.42, 0.66];
  const r = rng(5);
  const stars = Array.from({ length: 110 }, () => [Math.floor(r() * cols), Math.floor(r() * rows), r() * TAU, r()]);
  // ring density profile with gaps
  const prof = new Float32Array(200);
  for (let i = 0; i < 200; i++) {
    const f = i / 199;
    let d = 0.55 + 0.45 * noise2(f * 26, 0.5, 9) + 0.2 * Math.sin(f * 90);
    if (f > 0.52 && f < 0.58) d *= 0.08;   // the big gap
    if (f > 0.86 && f < 0.88) d *= 0.3;
    if (f < 0.06) d *= f / 0.06;
    prof[i] = clamp(d);
  }
  const bgn = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) bgn[x + y * cols] = fbm(x * 0.04, y * 0.09, 4, 21);
  const moons = [{ a: 46, sp: 0.21, ph: 1.2, inc: 0.0, rad: 2.4 }, { a: 33, sp: 0.37, ph: 4.0, inc: 5.5, rad: 1.6 }];

  return (t) => {
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const dx = x + 0.5 - cx, dy = (y + 0.5 - cy) * 2;
      const u = dx * cr + dy * sr, w = -dx * sr + dy * cr;
      const i = x + y * cols;
      const v = clamp(bgn[i] * 1.1 - 0.2 + Math.exp(-Math.hypot(dx, dy) / 30) * 0.25);
      g.setZ(x, y, -1e9, v > 0.45 ? "▒" : "░", K("bg", Math.min(7, Math.floor(v * 8))));
      // planet
      const q = (u * u + w * w) / (R * R);
      if (q < 1) {
        const nz = Math.sqrt(1 - q), nx = u / R, ny = w / R;
        const lum = clamp(nx * L[0] + ny * L[1] + nz * L[2]);
        const lon = Math.atan2(nx, nz) + t * 0.25;
        const swirl = fbm(Math.cos(lon) * 2 + ny * 0.5, ny * 9 + Math.sin(lon) * 0.8, 3, 4);
        const band = 0.5 + 0.5 * Math.sin(ny * 13 + (swirl - 0.5) * 4);
        let k = clamp(lum * 1.05 + 0.04);
        // ring shadow across the planet (just above the equator on the lit side)
        const sh = Math.abs(ny + 0.1 + nx * 0.05);
        if (sh < 0.06) k *= 0.35;
        const spot = Math.hypot((nx + 0.25 - Math.sin(t * 0.25) * 0.1) * 2, (ny - 0.32) * 5) < 0.6 ? 1 : 0;
        const col = band > 0.55 && !spot
          ? K("band", Math.min(9, Math.floor(k * 10)))
          : spot ? K("band", Math.min(9, Math.floor(k * 6) + 2)) : K("body", Math.min(15, Math.floor(k * 16)));
        g.setZ(x, y, nz * R, k > 0.4 ? "█" : k > 0.2 ? "▓" : k > 0.08 ? "▒" : "░", col);
      }
      // rings
      const rz = w / S, rd = Math.hypot(u, rz);
      if (rd > R1 && rd < R2) {
        const f = (rd - R1) / (R2 - R1);
        const dens = prof[Math.floor(f * 199)];
        if (dens > 0.12) {
          // planet shadow falls on the far ring behind the planet's lit side
          let lit = 0.2 + 0.8 * dens * (0.8 + 0.2 * Math.sin(rd * 1.7));
          if (rz < 0 && Math.abs(u - rz * 0.25) < R * 0.95 && u > -R * 0.4) lit *= 0.3;
          const ch = SH[Math.min(3, Math.floor(dens * 4))];
          g.setZ(x, y, rz * 2, ch, K("ring", Math.min(9, Math.floor(lit * 10))));
        }
      }
    }
    for (const [sx, sy, ph, b] of stars) {
      const i = sx + sy * cols;
      if (g.z[i] > -1e9) continue;
      const tw = 0.5 + 0.5 * Math.sin(t * (1 + b * 2) + ph);
      g.set(sx, sy, b > 0.8 && tw > 0.6 ? "+" : tw > 0.4 ? "·" : ".", K("star", b > 0.55 ? 1 : 0));
    }
    // moons on their own orbits, depth tested against planet and rings
    for (const m of moons) {
      const a = m.ph + t * m.sp;
      const mu = Math.cos(a) * m.a, mz = Math.sin(a) * m.a;
      const mw = mz * S - m.inc * Math.cos(a);
      const mx = cx + mu * cr - mw * sr, my = cy + (mu * sr + mw * cr) / 2;
      const ry = m.rad / 2;
      for (let y = Math.floor(my - ry - 1); y <= my + ry + 1; y++)
        for (let x = Math.floor(mx - m.rad - 1); x <= mx + m.rad + 1; x++) {
          const nx = (x + 0.5 - mx) / m.rad, ny = (y + 0.5 - my) / Math.max(0.8, ry);
          const q = nx * nx + ny * ny;
          if (q > 1) continue;
          const lum = clamp(nx * L[0] + ny * L[1] + Math.sqrt(1 - q) * L[2]);
          g.setZ(x, y, mz * 2, lum > 0.4 ? "█" : "▓", K("moon", Math.min(5, 1 + Math.floor(lum * 5))));
        }
      g.setZ(mx, my, mz * 2, "█", K("moon", 4));
    }
    return g.frame();
  };
}
