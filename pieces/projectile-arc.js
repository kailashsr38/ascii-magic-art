/* projectile-arc: a cannon fires at four angles, each shot tracing its parabola across a field. */
import { Grid, palette, gradient, KEYS, fbm, clamp, TAU } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("sky", gradient(["#16244a", "#24407a", "#3a64a8", "#6a94cc", "#a8c8e8"], 10));
add("hill", ["#1e3a3a", "#2a4e48"]);
add("grass", ["#1e5a1e", "#3a8a2a", "#6ab84a"]);
add("dirt", gradient(["#2a1a0e", "#4a3018", "#6a4628"], 3));
add("shot", ["#ffd23a", "#ff7a4a", "#ff5ab0", "#7ae0ff"]);
add("iron", ["#1a1c22", "#4a4e58", "#9aa0ae"]);
add("wheel", ["#5a3a1a", "#9a6a3a"]);
add("smoke", gradient(["#5a5e6a", "#a8acb6", "#e6e8ee"], 4));
add("ui", ["#c8d0e0", "#ffffff"]);

export const meta = {
  slug: "projectile-arc",
  name: "Projectile Arcs",
  category: "motion-lab",
  note: "A cannon fires the same charge at four angles, and each ball traces its true parabola so you can compare their heights and ranges.",
  tags: ["projectile", "parabola", "gravity", "cannon", "physics", "readme"],
  cols: 96, rows: 32, fps: 30,
  palette: palette(all),
};

const K = (n, i) => KEYS[G[n] + i];
const ANG = [25, 45, 60, 75], GRAV = 30, V0 = 47, SHOT = 3.8;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const GY = rows - 4, CX = 7, CY = GY - 1;
  const hills = Array.from({ length: cols }, (_, x) => Math.round(GY - 3 - 3 * fbm(x * 0.05, 4, 3, 2)));
  const pos = (k, tt) => {
    const a = (ANG[k] * Math.PI) / 180;
    const x = V0 * Math.cos(a) * tt, h = V0 * Math.sin(a) * tt - 0.5 * GRAV * tt * tt;
    return [CX + 3 + x, CY - h / 2, h];
  };
  const flight = (k) => (2 * V0 * Math.sin((ANG[k] * Math.PI) / 180)) / GRAV;
  return (t) => {
    g.clear();
    const lt = t % (SHOT * ANG.length);
    const cur = Math.floor(lt / SHOT), st = lt - cur * SHOT;
    for (let y = 0; y < GY; y++) for (let x = 0; x < cols; x++) {
      const v = clamp(0.15 + (y / GY) * 0.8 + (fbm(x * 0.04 + t * 0.03, y * 0.15, 3, 5) - 0.5) * 0.3);
      g.set(x, y, v > 0.55 ? "▒" : "░", K("sky", Math.min(9, Math.floor(v * 10))));
      if (y >= hills[x]) g.set(x, y, "▓", K("hill", y === hills[x] ? 1 : 0));
    }
    for (let x = 0; x < cols; x++) {
      g.set(x, GY, "▀", K("grass", (x * 7) % 3));
      for (let y = GY + 1; y < rows; y++) g.set(x, y, (x + y) % 3 ? "█" : "▓", K("dirt", Math.min(2, y - GY - 1)));
    }
    // distance marks
    for (let m = 1; m * 10 + CX + 3 < cols - 1; m++) {
      const x = CX + 3 + m * 10;
      g.set(x, GY + 1, "┴", K("ui", 0));
      g.text(x - 1, GY + 2, String(m * 10).padStart(2), K("ui", 0));
    }
    // trails of every shot fired so far this round
    for (let k = 0; k <= cur; k++) {
      const T = flight(k);
      const end = k < cur ? T : Math.min(T, st);
      for (let tt = 0; tt <= end; tt += 0.02) {
        const [x, y] = pos(k, tt);
        g.set(x, y, y - Math.floor(y) < 0.5 ? "▀" : "▄", K("shot", k));
      }
      if (end >= T) {
        const [lx] = pos(k, T);
        g.text(Math.round(lx) - 1, GY - 1, `${ANG[k]}°`, K("shot", k));
        const [, ay] = pos(k, T / 2);
        g.set(Math.round(lx / 2 + (CX + 3) / 2), Math.round(ay) - 1, "▼", K("shot", k));
      }
    }
    // the current ball, and its impact puff
    const T = flight(cur);
    if (st < T) {
      const [x, y] = pos(cur, st);
      g.set(x, y, "●", K("iron", 2));
    } else if (st < T + 0.7) {
      const [lx] = pos(cur, T);
      const p = (st - T) / 0.7;
      const r = 1 + p * 4;
      for (let i = -r; i <= r; i++) g.set(lx + i, GY - 1 - Math.round((1 - Math.abs(i) / r) * 1.5 * (1 - p)), p < 0.5 ? "▒" : "░", K("smoke", Math.min(3, Math.floor((1 - p) * 4))));
    }
    // cannon: barrel at the current angle on a wheeled carriage
    const a = (ANG[cur] * Math.PI) / 180;
    for (let i = 0; i <= 5; i++) {
      const x = CX + Math.cos(a) * i * 1.1, y = CY - 1 - (Math.sin(a) * i * 1.1) / 2;
      g.set(x, y, "█", K("iron", i > 4 ? 0 : 1));
      g.set(x + 1, y, "▌", K("iron", 1));
    }
    g.text(CX - 2, CY, "▟██▙", K("wheel", 0));
    g.set(CX - 1, CY, "◆", K("wheel", 1));
    // muzzle flash and smoke right after firing
    if (st < 0.5) {
      const mx = CX + Math.cos(a) * 7, my = CY - 1 - (Math.sin(a) * 7) / 2;
      const r = 1 + st * 6;
      for (let j = -1; j <= 1; j++) for (let i = -r; i <= r; i++) if (Math.abs(i) / r + Math.abs(j) < 1.2) g.set(mx + i, my + j, st < 0.12 ? "█" : "▒", st < 0.12 ? K("shot", 0) : K("smoke", 2));
    }
    g.text(cols - 26, 1, ` angle ${String(ANG[cur]).padStart(2)}°  v ${V0} m/s `, K("ui", 1));
    return g.frame();
  };
}
