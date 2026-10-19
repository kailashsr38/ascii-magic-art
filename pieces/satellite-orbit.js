/* satellite-orbit: a satellite with solar panel wings circling a blue planet, passing behind it and out again. */
import { Grid, palette, gradient, KEYS, fbm, rng, clamp, TAU } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("bg", gradient(["#020308", "#060a1c", "#0c1230", "#151a42"], 6));
add("star", ["#8090d0", "#ffffff"]);
add("sea", gradient(["#030a22", "#0a2260", "#16469e", "#2a6ed0", "#5aa0ec", "#a8d4ff"], 10));
add("land", gradient(["#0e2a14", "#2a5a26", "#5a8a3a", "#a0b870"], 5));
add("cloud", gradient(["#5a6a88", "#a8b8d0", "#ffffff"], 4));
add("atmo", gradient(["#0a2a6a", "#3a7ae0", "#8ac8ff"], 4));
add("panel", ["#0c1e4a", "#1e4aa8", "#4a8ae8", "#bfe0ff"]);
add("gold", ["#7a5a14", "#d8a830", "#ffe08a"]);
add("ui", ["#ff4a4a", "#5a6478", "#a8b0c0", "#7ee787"]);

export const meta = {
  slug: "satellite-orbit",
  name: "Satellite Orbit",
  category: "cosmos",
  note: "A satellite with glinting solar panel wings circles a cloudy blue planet, slipping behind it and back into the light.",
  tags: ["satellite", "orbit", "planet", "hero", "dashboard"],
  cols: 96, rows: 38, fps: 24,
  palette: palette(all),
};

const K = (n, i) => KEYS[G[n] + i];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = cols / 2, cy = rows / 2 + 1, R = 24, A = 42, S = 0.34, ROT = -0.16;
  const cr = Math.cos(ROT), sr = Math.sin(ROT);
  const L = (() => { const v = [0.65, -0.45, 0.6]; const l = Math.hypot(...v); return v.map((a) => a / l); })();
  const r = rng(71);
  const stars = Array.from({ length: 130 }, () => [Math.floor(r() * cols), Math.floor(r() * rows), r() * TAU, r()]);
  const bgn = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) bgn[x + y * cols] = fbm(x * 0.04, y * 0.09, 3, 14);
  const pos = (a) => {
    const u = Math.cos(a) * A, z = Math.sin(a) * A, w = z * S;
    return [cx + u * cr - w * sr, cy + (u * sr + w * cr) / 2, z];
  };
  const PER = 14;
  return (t) => {
    g.clear();
    const spin = t * 0.12, cs = Math.cos(spin), ss = Math.sin(spin);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const dx = x + 0.5 - cx, dy = (y + 0.5 - cy) * 2;
      const d = Math.hypot(dx, dy) / R;
      if (d >= 1) {
        const lit = clamp(0.35 + ((dx * L[0] + dy * L[1]) / (R * d)) * 0.9);
        if (d < 1.1 && lit > 0.2) { g.setZ(x, y, -1e9, d < 1.05 ? "▒" : "░", K("atmo", Math.min(3, Math.floor(((1.1 - d) / 0.1) * lit * 4)))); continue; }
        const v = clamp(bgn[x + y * cols] * 0.8 - 0.1);
        g.setZ(x, y, -1e9, v > 0.45 ? "▒" : "░", K("bg", Math.min(5, Math.floor(v * 6))));
        continue;
      }
      const nx = dx / R, ny = dy / R, nz = Math.sqrt(1 - d * d);
      const lum = nx * L[0] + ny * L[1] + nz * L[2];
      const bx = nx * cs + nz * ss, bz = -nx * ss + nz * cs;
      const h = fbm(bx * 1.6 + 3, ny * 1.8 + bz * 0.9, 4, 31);
      const cl = clamp((fbm(bx * 2.4 + t * 0.05, ny * 3.4 - bz, 3, 32) - 0.52) * 3.5);
      const s = clamp(lum * 1.1 + 0.08);
      let ch = "█", col;
      if (lum < 0) { ch = lum > -0.12 ? "▒" : "░"; col = K("sea", 0); }
      else if (cl > 0.4) { ch = cl > 0.8 ? "█" : "▓"; col = K("cloud", Math.min(3, Math.floor(s * 4))); }
      else if (h > 0.56) col = K("land", Math.min(4, Math.floor(s * 5)));
      else col = K("sea", Math.min(9, 1 + Math.floor(s * 7 + Math.pow(Math.max(0, lum), 12) * 3)));
      g.setZ(x, y, nz * R * 0.5, ch, col);
    }
    for (const [sx, sy, ph, b] of stars) {
      if (g.get(sx, sy) !== "░" || g.z[sx + sy * cols] > -1e9) continue;
      const tw = 0.5 + 0.5 * Math.sin(t * (1 + b * 2) + ph);
      g.set(sx, sy, b > 0.85 && tw > 0.5 ? "+" : tw > 0.35 ? "·" : ".", K("star", b > 0.5 ? 1 : 0));
    }
    // dotted orbit path
    for (let k = 0; k < 220; k++) {
      const [x, y, z] = pos((k / 220) * TAU);
      if (Math.floor(k) % 2) continue;
      g.setZ(x, y, z * 0.5 - 0.5, "·", K("ui", z > 0 ? 2 : 1));
    }
    // the satellite
    const a = (t / PER) * TAU;
    const [sx, sy, sz] = pos(a);
    const z = sz * 0.5;
    const glint = Math.pow(0.5 + 0.5 * Math.sin(t * 3.1), 6);
    const wing = (x0, y0) => {
      for (let j = 0; j < 3; j++) for (let i = 0; i < 6; i++) {
        const c = (i + j + Math.floor(t * 4)) % 9 === 0 && glint > 0.4 ? 3 : (i % 2 ? 1 : 2);
        g.setZ(x0 + i, y0 + j, z, i % 2 ? "▓" : "█", K("panel", c));
      }
    };
    const X = Math.round(sx), Y = Math.round(sy);
    wing(X - 10, Y - 1);
    wing(X + 5, Y - 1);
    g.setZ(X - 4, Y, z, "═", K("ui", 2)); g.setZ(X + 4, Y, z, "═", K("ui", 2));
    g.setZ(X - 3, Y - 1, z, "▄", K("gold", 1)); g.setZ(X + 3, Y - 1, z, "▄", K("gold", 1));
    for (let i = -3; i <= 3; i++) {
      g.setZ(X + i, Y - 1, z, "▄", K("gold", 1));
      g.setZ(X + i, Y, z, "█", K("gold", i < 0 ? 2 : 1));
      g.setZ(X + i, Y + 1, z, "▀", K("gold", 0));
    }
    g.setZ(X, Y - 2, z, "┴", K("ui", 2));
    g.setZ(X, Y - 3, z, Math.floor(t * 2) % 2 ? "●" : "○", K("ui", 0));
    // a downlink pulse when the satellite is in front of the planet
    if (sz > 6) {
      const p = (t * 1.5) % 1;
      const ty = Y + 2 + p * 7;
      for (let k = -2; k <= 2; k++) g.setZ(X + k * (1 + p), ty, z, "~", K("ui", 3));
    }
    return g.frame();
  };
}
