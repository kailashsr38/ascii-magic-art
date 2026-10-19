/* jelly-bounce: a pressure soft body jelly drops, squashes, wobbles and hops around a little room. */
import { Grid, palette, gradient, KEYS, clamp, TAU } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("jelly", gradient(["#0a4a2a", "#127a3a", "#20a848", "#4ad060", "#9af08a", "#e0ffd0"], 8));
add("rim", ["#06301a", "#0a4022"]);
add("eye", ["#ffffff", "#0a0a10"]);
add("wall", gradient(["#1a1430", "#261c42", "#342656"], 3));
add("floor", ["#2a2034", "#3a2c44", "#4a3a56", "#5e4c6a"]);
add("shadow", ["#0e0a16", "#16101e"]);

export const meta = {
  slug: "jelly-bounce",
  name: "Jelly Bounce",
  category: "motion-lab",
  note: "A pressure soft body jelly drops onto the floor, squashes, wobbles back into shape and hops around its little room.",
  tags: ["soft-body", "spring", "bounce", "cute", "simulation", "loader"],
  cols: 80, rows: 30, fps: 30,
  palette: palette(all),
};

const K = (n, i) => KEYS[G[n] + i];
const NP = 28, DT = 1 / 240, P = 9, GRAV = 70;
const HOPS = [[3.2, -48, 14], [5.4, -58, -18], [7.4, -42, 6]];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const W = cols, H = rows * 2, FLOOR = H - 7;
  const x = new Float32Array(NP), y = new Float32Array(NP), vx = new Float32Array(NP), vy = new Float32Array(NP);
  const R0 = 10, L0 = 2 * R0 * Math.sin(Math.PI / NP), A0 = Math.PI * R0 * R0;
  let n = 0, cyc = -1, hop = 0;
  const fx = new Float32Array(NP), fy = new Float32Array(NP);
  const reset = () => {
    for (let i = 0; i < NP; i++) {
      const a = (i / NP) * TAU;
      x[i] = W * 0.3 + Math.cos(a) * R0; y[i] = 12 + Math.sin(a) * R0;
      vx[i] = 14; vy[i] = 0;
    }
    n = 0; hop = 0;
  };
  const step = () => {
    const tt = n * DT;
    if (hop < HOPS.length && tt >= HOPS[hop][0]) {
      for (let i = 0; i < NP; i++) { vy[i] += HOPS[hop][1]; vx[i] += HOPS[hop][2]; }
      hop++;
    }
    let A = 0;
    for (let i = 0; i < NP; i++) { const j = (i + 1) % NP; A += x[i] * y[j] - x[j] * y[i]; }
    A = Math.abs(A) / 2;
    const press = 3200 * (A0 / A - 1);
    fx.fill(0); fy.fill(0);
    for (let i = 0; i < NP; i++) {
      const j = (i + 1) % NP;
      const dx = x[j] - x[i], dy = y[j] - y[i], l = Math.hypot(dx, dy) || 1e-6;
      const dv = ((vx[j] - vx[i]) * dx + (vy[j] - vy[i]) * dy) / l;
      const f = 1500 * (l - L0) + 8 * dv;
      fx[i] += (f * dx) / l; fy[i] += (f * dy) / l; fx[j] -= (f * dx) / l; fy[j] -= (f * dy) / l;
      // pressure acts along the edge normal (points are counter clockwise in y-down space)
      const nx = dy, ny = -dx;
      fx[i] += press * nx * 0.5; fy[i] += press * ny * 0.5; fx[j] += press * nx * 0.5; fy[j] += press * ny * 0.5;
    }
    for (let i = 0; i < NP; i++) {
      vx[i] += fx[i] * DT; vy[i] += (fy[i] + GRAV) * DT;
      vx[i] *= 0.9995; vy[i] *= 0.9995;
      x[i] += vx[i] * DT; y[i] += vy[i] * DT;
      if (y[i] > FLOOR) { y[i] = FLOOR; vy[i] *= -0.2; vx[i] *= 0.9; }
      if (x[i] < 1) { x[i] = 1; vx[i] = Math.abs(vx[i]) * 0.5; }
      if (x[i] > W - 1) { x[i] = W - 1; vx[i] = -Math.abs(vx[i]) * 0.5; }
    }
    n++;
  };
  // the pressure normal (dy, -dx) points outward when the shoelace sum is positive
  const orient = () => { let s = 0; for (let i = 0; i < NP; i++) { const j = (i + 1) % NP; s += x[i] * y[j] - x[j] * y[i]; } return s; };
  const fixDir = () => { if (orient() < 0) { x.reverse(); y.reverse(); } };
  const xs = [];
  return (t) => {
    const c = Math.floor(t / P), want = Math.floor((t - c * P) / DT);
    if (c !== cyc || want < n) { cyc = c; reset(); fixDir(); }
    while (n < want) step();
    // room
    for (let yy = 0; yy < rows; yy++) for (let xx = 0; xx < cols; xx++) {
      if (yy * 2 >= FLOOR + 1) {
        const d = yy * 2 - FLOOR;
        const tile = (Math.floor((xx - cols / 2) / (2 + d * 0.8) + 100) + yy) & 1;
        g.set(xx, yy, tile ? "▓" : "▒", K("floor", Math.min(3, (d >> 2) + tile)));
      } else {
        const brick = (yy % 2 === 0) || ((xx + (yy & 2 ? 3 : 0)) % 6 === 0);
        g.set(xx, yy, brick ? "░" : "·", K("wall", brick ? 1 + ((xx * 7 + yy) % 5 === 0 ? 1 : 0) : 0));
      }
    }
    let cx = 0, cy = 0, minY = 1e9, maxY = -1e9, minX = 1e9, maxX = -1e9;
    for (let i = 0; i < NP; i++) { cx += x[i]; cy += y[i]; minY = Math.min(minY, y[i]); maxY = Math.max(maxY, y[i]); minX = Math.min(minX, x[i]); maxX = Math.max(maxX, x[i]); }
    cx /= NP; cy /= NP;
    // shadow
    const sw = (maxX - minX) * 0.55 * clamp(1 - (FLOOR - maxY) / 40, 0.3, 1);
    const sr = Math.floor(FLOOR / 2) + 1;
    for (let xx = Math.floor(cx - sw); xx <= cx + sw; xx++) g.set(xx, sr, "▓", K("shadow", Math.abs(xx - cx) < sw * 0.6 ? 0 : 1));
    // fill the body row by row
    for (let yy = Math.max(0, Math.floor(minY / 2)); yy <= Math.min(rows - 1, Math.floor(maxY / 2)); yy++) {
      const wy = yy * 2 + 1;
      xs.length = 0;
      for (let i = 0; i < NP; i++) {
        const j = (i + 1) % NP;
        if ((y[i] <= wy) !== (y[j] <= wy)) xs.push(x[i] + ((wy - y[i]) / (y[j] - y[i])) * (x[j] - x[i]));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        for (let xx = Math.round(xs[k]); xx < Math.round(xs[k + 1]); xx++) {
          const edge = xx === Math.round(xs[k]) || xx === Math.round(xs[k + 1]) - 1;
          const u = (xx + 0.5 - cx) / ((maxX - minX) / 2 + 0.1), v = (wy - cy) / ((maxY - minY) / 2 + 0.1);
          const l = clamp(0.7 - u * 0.35 - v * 0.45 - (u * u + v * v) * 0.25);
          const spec = Math.hypot(u + 0.42, v + 0.5) < 0.18;
          g.set(xx, yy, edge ? "█" : spec ? "█" : l > 0.55 ? "▓" : "▒", edge ? K("rim", 1) : spec ? K("jelly", 7) : K("jelly", Math.min(6, Math.floor(l * 7))));
        }
      }
    }
    // eyes follow the body
    const ey = Math.round((cy - (maxY - minY) * 0.12) / 2), ex = Math.round(cx), sp = Math.max(2, Math.round((maxX - minX) * 0.16));
    const look = vx[0] > 3 ? 1 : vx[0] < -3 ? -1 : 0;
    for (const s of [-1, 1]) {
      g.set(ex + s * sp, ey, "●", K("eye", 0));
      g.set(ex + s * sp + (look || 0), ey, look ? "•" : "●", K("eye", look ? 1 : 0));
      if (!look) g.set(ex + s * sp, ey, "•", K("eye", 1));
    }
    return g.frame();
  };
}
