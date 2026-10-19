/* orbiting-planets: a small solar system, seven planets on tilted elliptical orbits around a boiling sun. */
import { Grid, palette, gradient, KEYS, fbm, rng, clamp, TAU } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("bg", gradient(["#05061a", "#0e1542", "#1d2468", "#3a2c82", "#6c3c92"], 10));
add("star", ["#8fa3ff", "#ffffff"]);
add("sun", gradient(["#9a2a07", "#e8590c", "#f99a1c", "#fcd34d", "#fff3c4"], 8));
add("orbit", ["#2c3a78", "#4a60b4"]);
const PL = [
  { a: 10.5, r: 2.0, e: 0.2, c: ["#3f3f46", "#71717a", "#a1a1aa", "#e4e4e7"] },
  { a: 15, r: 2.7, e: 0.03, c: ["#6b4a22", "#b98a4a", "#e2c48a", "#fbf0d2"] },
  { a: 20.5, r: 3.1, e: 0.05, c: ["#0b2a5a", "#1e5bb8", "#3fa34d", "#d6eeff"], earth: true },
  { a: 26, r: 2.4, e: 0.12, c: ["#5a1a0e", "#a8381c", "#dc6b3c", "#f8b48a"] },
  { a: 34, r: 5.0, e: 0.05, c: ["#5b3a1e", "#a0652e", "#d9a066", "#f6e2bd"], bands: true },
  { a: 43, r: 3.9, e: 0.06, c: ["#5e4b2a", "#a68b54", "#d8c08a", "#f6ebcc"], bands: true, ring: true },
  { a: 50, r: 3.1, e: 0.02, c: ["#0c1d5e", "#2546b0", "#4f7ee6", "#b6ceff"] },
];
PL.forEach((p, i) => add("p" + i, p.c));

export const meta = {
  slug: "orbiting-planets",
  name: "Orbiting Planets",
  category: "cosmos",
  note: "Seven lit planets sweep along tilted elliptical orbits around a boiling sun, inner worlds racing the outer ones.",
  tags: ["solar-system", "orbit", "planets", "hero", "wallpaper"],
  cols: 110, rows: 38, fps: 24,
  palette: palette(all),
};

const K = (n, i) => KEYS[G[n] + i];
const TILT = 0.62;

function kepler(M, e) {
  let E = M;
  for (let i = 0; i < 5; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  return E;
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = cols / 2, cy = rows / 2, sunR = 5.6;
  const r = rng(11);
  const stars = Array.from({ length: 130 }, () => [Math.floor(r() * cols), Math.floor(r() * rows), r() * TAU, r()]);
  const phase0 = PL.map(() => r() * TAU);
  // static background noise, computed once
  const bgn = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) bgn[x + y * cols] = fbm(x * 0.035, y * 0.08, 4, 3);

  const drawPlanet = (p, i, px, py, L, t) => {
    const rad = p.r, ry = rad * 0.5;
    const k = "p" + i;
    for (let y = Math.floor(py - ry - 1); y <= Math.ceil(py + ry + 1); y++)
      for (let x = Math.floor(px - rad - 1); x <= Math.ceil(px + rad + 1); x++) {
        const nx = (x + 0.5 - px) / rad, ny = (y + 0.5 - py) / ry;
        const q = nx * nx + ny * ny;
        if (q > 1) continue;
        const nz = Math.sqrt(1 - q);
        let lum = clamp(0.22 + 0.85 * (nx * L[0] + ny * L[1] + nz * L[2]));
        let idx = lum < 0.2 ? 0 : 1 + Math.min(2, Math.floor(lum * 3));
        if (p.bands && idx > 0 && Math.sin(ny * 7 + nx * 0.6) > 0.35) idx = Math.max(1, idx - 1);
        if (p.earth && idx > 0) {
          const land = fbm(nx * 2.2 + t * 0.4 + i, ny * 2.2, 2) > 0.52;
          idx = lum > 0.85 ? 3 : land ? 2 : 1;
        }
        g.set(x, y, lum > 0.55 ? "█" : lum > 0.25 ? "▓" : "▒", K(k, idx));
      }
    g.set(px, py, "█", K(k, 3));
  };
  const ring = (p, i, px, py, front) => {
    for (let s = 0; s < 120; s++) {
      const a = (s / 120) * TAU;
      if ((Math.sin(a) > 0) !== front) continue;
      for (const f of [1.55, 1.95, 2.35]) {
        const rx = p.r * f;
        g.set(px + Math.cos(a) * rx, py + Math.sin(a) * rx * 0.5 * 0.42, f === 1.95 ? "═" : "─", K("p" + i, f === 1.55 ? 2 : 3));
      }
    }
  };

  return (t) => {
    g.clear();
    // background nebula, sun glow, corona and surface
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const dx = x + 0.5 - cx, dy = (y + 0.5 - cy) * 2;
      const d = Math.hypot(dx, dy);
      if (d < sunR) {
        const boil = fbm(x * 0.32 + t * 0.7, y * 0.65 - t * 0.5, 3);
        const v = clamp(1.05 - (d / sunR) * 0.55 + (boil - 0.5) * 0.9);
        g.set(x, y, v > 0.45 ? "█" : "▓", K("sun", Math.min(7, Math.floor(v * 8))));
      } else if (d < sunR + 4.5) {
        const a = Math.atan2(dy, dx);
        const c = (1 - (d - sunR) / 4.5) * (0.55 + 0.6 * fbm(a * 2.5 + 10, t * 0.8, 2));
        g.set(x, y, c > 0.6 ? "▓" : c > 0.35 ? "▒" : "░", K("sun", Math.min(4, Math.floor(c * 5))));
      } else {
        const glow = Math.exp(-d / 16);
        const v = clamp(bgn[x + y * cols] * 1.15 - 0.15 + glow * 0.6);
        g.set(x, y, v > 0.5 ? "▒" : "░", K("bg", Math.min(9, Math.floor(v * 10))));
      }
    }
    for (const [sx, sy, ph, b] of stars) {
      const d = Math.hypot(sx - cx, (sy - cy) * 2);
      if (d < sunR + 5) continue;
      const tw = 0.5 + 0.5 * Math.sin(t * (1 + b * 2) + ph);
      g.set(sx, sy, b > 0.85 && tw > 0.6 ? "+" : tw > 0.5 ? "·" : ".", K("star", b > 0.6 && tw > 0.5 ? 1 : 0));
    }
    // orbits
    PL.forEach((p) => {
      const b = p.a * Math.sqrt(1 - p.e * p.e);
      const n = Math.round(p.a * 7);
      for (let s = 0; s < n; s++) {
        const E = (s / n) * TAU;
        const X = p.a * (Math.cos(E) - p.e), Z = b * Math.sin(E);
        const x = cx + X, y = cy + Z * 0.5 * TILT;
        if (Math.hypot(x - cx, (y - cy) * 2) < sunR + 1) continue;
        g.set(x, y, "·", K("orbit", Z > 0 ? 1 : 0));
      }
    });
    // planets, far ones before the sun is repainted over them
    const pos = PL.map((p, i) => {
      const T = 3.6 * Math.pow(p.a / 10.5, 1.5);
      const E = kepler(phase0[i] + (t / T) * TAU, p.e);
      const b = p.a * Math.sqrt(1 - p.e * p.e);
      const X = p.a * (Math.cos(E) - p.e), Z = b * Math.sin(E);
      const d = Math.hypot(X, Z) || 1;
      let L = [-X / d, -(Z / d) * 0.55, -(Z / d) * 0.8 + 0.12];
      const l = Math.hypot(L[0], L[1], L[2]);
      L = L.map((v) => v / l);
      return { p, i, X, Z, L, x: cx + X, y: cy + Z * 0.5 * TILT };
    });
    pos.sort((a, b) => a.Z - b.Z);
    const paint = (o) => {
      if (o.p.ring) ring(o.p, o.i, o.x, o.y, false);
      drawPlanet(o.p, o.i, o.x, o.y, o.L, t);
      if (o.p.ring) ring(o.p, o.i, o.x, o.y, true);
    };
    for (const o of pos) if (o.Z < 0) paint(o);
    // repaint the sun disc over far planets
    for (let y = Math.floor(cy - sunR / 2 - 1); y <= Math.ceil(cy + sunR / 2 + 1); y++)
      for (let x = Math.floor(cx - sunR - 1); x <= Math.ceil(cx + sunR + 1); x++) {
        const d = Math.hypot(x + 0.5 - cx, (y + 0.5 - cy) * 2);
        if (d >= sunR) continue;
        const boil = fbm(x * 0.32 + t * 0.7, y * 0.65 - t * 0.5, 3);
        const v = clamp(1.05 - (d / sunR) * 0.55 + (boil - 0.5) * 0.9);
        const near = pos.some((o) => o.Z < 0 && Math.abs(o.x - x) <= o.p.r + 1 && Math.abs(o.y - y) <= o.p.r * 0.5 + 1);
        if (near) g.set(x, y, v > 0.45 ? "█" : "▓", K("sun", Math.min(7, Math.floor(v * 8))));
      }
    for (const o of pos) if (o.Z >= 0) paint(o);
    return g.frame();
  };
}
