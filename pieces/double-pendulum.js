/* double-pendulum: a chaotic double pendulum integrated with RK4, its tip drawing a fading braille trail. */
import { Grid, palette, gradient, KEYS, clamp } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("trail", gradient(["#ffffff", "#a8f0ff", "#5ac8ff", "#4a8aff", "#8a6aff", "#b04ad8", "#7a3aa0"], 14));
add("grid", ["#12141e", "#1c2030", "#2a3046"]);
add("rod", ["#c8d0e0", "#ffffff"]);
add("bob", ["#ff9a3a", "#ffd27a", "#ff5a6a", "#ffb0b8"]);
add("ui", ["#5a6478", "#8b949e"]);

export const meta = {
  slug: "double-pendulum",
  name: "Double Pendulum",
  category: "motion-lab",
  note: "A double pendulum swings chaotically under gravity, its lower bob tracing a fading trail that never settles into a pattern.",
  tags: ["chaos", "pendulum", "simulation", "physics", "hero", "readme"],
  cols: 72, rows: 34, fps: 30,
  palette: palette(all),
};

const K = (n, i) => KEYS[G[n] + i];
const GRAV = 9.81, DT = 1 / 240, PER = 24, TRAIL = 900;

function deriv(s) {
  const [a1, a2, w1, w2] = s;
  const d = a1 - a2, den = 3 - Math.cos(2 * d);
  const dw1 = (-GRAV * 3 * Math.sin(a1) - GRAV * Math.sin(a1 - 2 * a2) - 2 * Math.sin(d) * (w2 * w2 + w1 * w1 * Math.cos(d))) / den;
  const dw2 = (2 * Math.sin(d) * (w1 * w1 * 2 + GRAV * 2 * Math.cos(a1) + w2 * w2 * Math.cos(d))) / den;
  return [w1, w2, dw1, dw2];
}
function rk4(s) {
  const k1 = deriv(s);
  const k2 = deriv(s.map((v, i) => v + (k1[i] * DT) / 2));
  const k3 = deriv(s.map((v, i) => v + (k2[i] * DT) / 2));
  const k4 = deriv(s.map((v, i) => v + k3[i] * DT));
  return s.map((v, i) => v + (DT / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const px = cols / 2, py = rows / 2 - 1, U = 7.6;
  const toScr = (x, y) => [px + x * U * 2, py + y * U];
  let s, n;
  const hx = new Float32Array(TRAIL), hy = new Float32Array(TRAIL);
  const reset = () => { s = [2.35, 2.75, 0, 0]; n = 0; };
  const tip = () => {
    const x1 = Math.sin(s[0]), y1 = Math.cos(s[0]);
    return [x1, y1, x1 + Math.sin(s[1]), y1 + Math.cos(s[1])];
  };
  reset();
  return (t) => {
    const lt = t % PER;
    const want = Math.floor(lt / DT);
    if (want < n) reset();
    while (n < want) {
      s = rk4(s); n++;
      const [, , x2, y2] = tip();
      hx[n % TRAIL] = x2; hy[n % TRAIL] = y2;
    }
    g.clear();
    // faint lab grid
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const gx = (x - Math.round(px)) % 6 === 0, gy = (y - Math.round(py)) % 3 === 0;
      g.set(x, y, gx && gy ? "┼" : gx ? "│" : gy ? "─" : "·", K("grid", gx && gy ? 2 : gx || gy ? 1 : 0));
    }
    // trail, oldest first so the newest segments sit on top
    const len = Math.min(n, TRAIL - 1);
    for (let k = len; k >= 1; k--) {
      const i0 = (n - k) % TRAIL, i1 = (n - k + 1) % TRAIL;
      const [ax, ay] = toScr(hx[i0], hy[i0]), [bx, by] = toScr(hx[i1], hy[i1]);
      const a = k / TRAIL;
      const ch = a < 0.12 ? "█" : a < 0.3 ? "▓" : a < 0.6 ? "▒" : "░";
      const col = K("trail", Math.min(13, Math.floor(a * 14)));
      const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, (by - ay) * 2)));
      for (let j = 0; j < steps; j++) g.set(ax + ((bx - ax) * j) / steps, ay + ((by - ay) * j) / steps, ch, col);
    }
    // rods and bobs
    const [x1, y1, x2, y2] = tip();
    const [a1, b1] = toScr(x1, y1), [a2, b2] = toScr(x2, y2);
    const rod = (ax, ay, bx, by) => {
      const steps = Math.ceil(Math.hypot(bx - ax, (by - ay) * 2) * 1.5);
      for (let j = 0; j <= steps; j++) g.set(ax + ((bx - ax) * j) / steps, ay + ((by - ay) * j) / steps, "•", K("rod", 0));
    };
    rod(px, py, a1, b1); rod(a1, b1, a2, b2);
    const bob = (bx, by, c) => {
      const x0 = Math.round(bx) - 2, y0 = Math.round(by - 0.5);
      g.text(x0, y0, "▄██▄", K("bob", c));
      g.text(x0, y0 + 1, "▀██▀", K("bob", c));
      g.set(x0 + 1, y0, "█", K("bob", c + 1));
    };
    bob(a1, b1, 0); bob(a2, b2, 2);
    g.text(Math.round(px) - 1, Math.round(py), "▐█▌", K("rod", 1));
    g.text(1, 0, " a1 " + ((((s[0] * 180) / Math.PI) % 360 + 540) % 360 - 180).toFixed(0).padStart(4) + "°  a2 " + ((((s[1] * 180) / Math.PI) % 360 + 540) % 360 - 180).toFixed(0).padStart(4) + "° ", K("ui", 1));
    return g.frame();
  };
}
