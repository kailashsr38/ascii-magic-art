/* rope-bridge: a plank rope bridge over a canyon sags and bounces under a hiker crossing it, simulated with Verlet ropes. */
import { Grid, palette, gradient, KEYS, fbm, clamp } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("sky", gradient(["#1a2a5a", "#3a4a8a", "#7a6aa0", "#d08a8a", "#f0b07a"], 8));
add("far", ["#4a3a6a", "#5a4a7a"]);
add("rock", gradient(["#1a1010", "#2e1c16", "#4a2c20", "#6a3e2a", "#8a5638"], 5));
add("river", ["#1a4a6a", "#2a6a8a", "#8ac8e0"]);
add("plank", ["#5a3a1e", "#8a5a2e", "#b07a40"]);
add("rope", ["#c8a878", "#e8d0a0"]);
add("hiker", ["#e04a3a", "#2a2a3a", "#f0c8a0", "#3a5a8a"]);
add("grass", ["#3a5a2a", "#5a7a34"]);

export const meta = {
  slug: "rope-bridge",
  name: "Rope Bridge Crossing",
  category: "motion-lab",
  note: "A hiker crosses a plank rope bridge over a canyon at dusk, the Verlet simulated deck sagging and bouncing under every step.",
  tags: ["rope", "verlet", "bridge", "simulation", "scene", "hero"],
  cols: 96, rows: 34, fps: 30,
  palette: palette(all),
};

const K = (n, i) => KEYS[G[n] + i];
const NN = 33, DT = 1 / 60, P = 14, CROSS = 11.5, GRAV = 40;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const H = rows * 2;
  const LX = 17, RX = cols - 17, AY = 26;
  const rest = ((RX - LX) * 1.035) / (NN - 1);
  const x = new Float32Array(NN), y = new Float32Array(NN), ox = new Float32Array(NN), oy = new Float32Array(NN);
  let n = 0, cyc = -1;
  const reset = () => {
    for (let i = 0; i < NN; i++) {
      x[i] = ox[i] = LX + ((RX - LX) * i) / (NN - 1);
      y[i] = oy[i] = AY + Math.sin((Math.PI * i) / (NN - 1)) * 7;
    }
    n = 0;
  };
  const walker = (tt) => clamp((tt - 1) / CROSS);
  const step = () => {
    const tt = n * DT, s = walker(tt) * (NN - 1);
    const j = Math.floor(s), f = s - j;
    const walking = tt > 1 && tt < 1 + CROSS;
    const load = walking ? 55 + 30 * Math.abs(Math.sin(tt * 7.5)) : 0;
    for (let i = 1; i < NN - 1; i++) {
      let ay = GRAV;
      if (i === j) ay += load * (1 - f); else if (i === j + 1) ay += load * f;
      const vx = (x[i] - ox[i]) * 0.993, vy = (y[i] - oy[i]) * 0.993;
      ox[i] = x[i]; oy[i] = y[i];
      x[i] += vx; y[i] += vy + ay * DT * DT;
    }
    for (let it = 0; it < 24; it++) {
      for (let i = 0; i < NN - 1; i++) {
        const dx = x[i + 1] - x[i], dy = y[i + 1] - y[i], d = Math.hypot(dx, dy) || 1e-6;
        const k = (d - rest) / d * 0.5;
        if (i > 0) { x[i] += dx * k; y[i] += dy * k; }
        if (i + 1 < NN - 1) { x[i + 1] -= dx * k; y[i + 1] -= dy * k; }
      }
    }
    n++;
  };
  // static scenery
  const bg = [];
  const cliffL = (yy) => LX + 1 + Math.max(0, (yy - AY / 2) * 0.12) + fbm(yy * 0.3, 1, 2, 3) * 3;
  const cliffR = (yy) => RX - 1 - Math.max(0, (yy - AY / 2) * 0.12) - fbm(yy * 0.3, 5, 2, 4) * 3;
  for (let yy = 0; yy < rows; yy++) for (let xx = 0; xx < cols; xx++) {
    const wy = yy * 2 + 1;
    const ridge = 15 + fbm(xx * 0.05, 2, 3, 9) * 6;
    if (wy >= AY && (xx < cliffL(yy) || xx > cliffR(yy))) {
      const top = wy < AY + 2;
      const n2 = fbm(xx * 0.2, yy * 0.4, 2, 6);
      bg.push(top ? ["▀", K("grass", (xx & 1))] : [n2 > 0.55 ? "▓" : n2 > 0.4 ? "▒" : "█", K("rock", Math.min(4, Math.floor(n2 * 4 + (yy - AY / 2) / 30 * 2)))]);
    } else if (yy >= rows - 3) {
      bg.push([(xx + yy) % 3 ? "≈" : "~", K("river", yy === rows - 3 ? 2 : (xx + yy) & 1)]);
    } else if (wy > AY + 8) {
      const n3 = fbm(xx * 0.15, yy * 0.3, 2, 12);
      bg.push([n3 > 0.55 ? "▒" : "▓", K("rock", n3 > 0.6 ? 1 : 0)]);
    } else if (wy > ridge + 14) {
      bg.push([wy > AY + 2 ? "▓" : "█", K("far", wy > AY ? 0 : 1)]);
    } else {
      bg.push([(xx * 3 + yy) % 4 ? "░" : "▒", K("sky", Math.min(7, Math.floor((yy / (rows * 0.6)) * 8)))]);
    }
  }
  return (t) => {
    const c = Math.floor(t / P), want = Math.floor((t - c * P) / DT);
    if (c !== cyc || want < n) { cyc = c; reset(); }
    while (n < want) step();
    for (let i = 0; i < bg.length; i++) { g.ch[i] = bg[i][0]; g.co[i] = bg[i][1]; }
    // hand ropes hang above the deck with a little more sag, tied to posts
    const rail = (i) => [x[i], (y[i] - 7 + Math.sin((Math.PI * i) / (NN - 1)) * 1.2) / 2];
    for (let i = 0; i < NN - 1; i++) {
      const [a, b] = rail(i), [c2, d] = rail(i + 1);
      g.line(a, b, c2, d, "─", K("rope", 0));
      if (i % 2 === 0) g.line(x[i], y[i] / 2 - 0.5, a, b + 0.5, "│", K("rope", 0));
    }
    for (const px of [LX, RX]) { for (let k = 0; k < 4; k++) g.set(px, AY / 2 - k, "█", K("plank", 0)); }
    // deck planks
    for (let i = 0; i < NN - 1; i++) {
      const sx = (x[i] + x[i + 1]) / 2, sy = (y[i] + y[i + 1]) / 2;
      const half = sy % 2 < 1;
      g.set(x[i], y[i] / 2, half ? "▀" : "▄", K("plank", i % 3 === 0 ? 2 : 1));
      g.set(sx, sy / 2, half ? "▀" : "▄", K("plank", 1));
    }
    // hiker
    const tt = t - c * P, w = walker(tt);
    const s = w * (NN - 1), j = Math.min(NN - 2, Math.floor(s)), f = s - j;
    const hx = x[j] + (x[j + 1] - x[j]) * f, hy = (y[j] + (y[j + 1] - y[j]) * f) / 2;
    const walking = tt > 1 && tt < 1 + CROSS, ph = Math.floor(tt * 7.5 / Math.PI) & 1;
    const fx = Math.round(hx), fy = Math.floor(hy);
    if (tt < P - 0.8) {
      g.set(fx, fy - 3, "●", K("hiker", 2));
      g.set(fx, fy - 2, "█", K("hiker", 0)); g.set(fx - 1, fy - 2, "▐", K("hiker", 1));
      g.set(fx + 1, fy - 2, walking ? (ph ? "\\" : "/") : "│", K("hiker", 2));
      g.text(fx - 1, fy - 1, walking ? (ph ? "/ \\" : " │ ") : " ║ ", K("hiker", 3));
    }
    return g.frame();
  };
}
