/* bouncing-balls: coloured balls dropped under gravity, bouncing off the walls and floor and slowly settling. */
import { Grid, palette, gradient, KEYS, rng, clamp } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("bg", gradient(["#0a0c18", "#101830", "#182444", "#22325a"], 6));
add("floor", gradient(["#1a1e2a", "#2a3042", "#3a4258"], 3));
add("shadow", ["#05060a"]);
const HUES = [
  ["#5a0e14", "#b8202e", "#ff4a5a", "#ffb0b8"],
  ["#5a3404", "#c87a0a", "#ffb02a", "#ffe4a8"],
  ["#0e4a1e", "#1e9a3e", "#5ae07a", "#c8ffd4"],
  ["#0a2a6a", "#1a5ad0", "#4a9aff", "#c0e0ff"],
  ["#3a1a6a", "#7a3ad0", "#b07aff", "#e8d8ff"],
  ["#0a4a4a", "#14a0a0", "#3ae0d8", "#c8fff8"],
];
HUES.forEach((h, i) => add("b" + i, h));

export const meta = {
  slug: "bouncing-balls",
  name: "Bouncing Balls",
  category: "motion-lab",
  note: "Six coloured balls fall under gravity, bounce off the floor and walls, lose energy with every hit and settle before the next drop.",
  tags: ["gravity", "bounce", "simulation", "physics", "loader", "404"],
  cols: 80, rows: 30, fps: 30,
  palette: palette(all),
};

const K = (n, i) => KEYS[G[n] + i];
const DT = 1 / 120, PER = 10, GRAV = 48;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const FLOOR = rows - 3;
  const RB = 3.4;
  let balls, n, seed = 0;
  const reset = () => {
    const r = rng(101);
    balls = HUES.map((_, i) => ({
      x: 8 + i * 12 + r() * 4, y: 3 + r() * 8,
      vx: (r() - 0.5) * 55, vy: -8 - r() * 22,
      e: 0.9 + r() * 0.06, sq: 0, trail: [],
    }));
    n = 0;
  };
  const step = () => {
    for (const b of balls) {
      b.vy += GRAV * DT;
      b.x += b.vx * DT; b.y += b.vy * DT;
      b.sq *= 0.9;
      const floorY = FLOOR - RB / 2;
      if (b.y > floorY) { b.y = floorY; if (b.vy > 0) { b.sq = Math.min(1, b.vy / 50); b.vy = -b.vy * b.e; b.vx *= 0.985; } }
      if (b.x < RB + 1) { b.x = RB + 1; b.vx = Math.abs(b.vx) * b.e; }
      if (b.x > cols - RB - 2) { b.x = cols - RB - 2; b.vx = -Math.abs(b.vx) * b.e; }
      if (Math.abs(b.vy) < 2 && b.y > floorY - 0.05) b.vy = 0;
    }
    // ball to ball collisions (equal masses, elastic along the contact normal)
    for (let i = 0; i < balls.length; i++) for (let j = i + 1; j < balls.length; j++) {
      const a = balls[i], b = balls[j];
      const dx = b.x - a.x, dy = (b.y - a.y) * 2, d = Math.hypot(dx, dy);
      if (d > 0 && d < RB * 2) {
        const nx = dx / d, ny = dy / d;
        const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * 2 * ny;
        if (rel < 0) {
          const imp = -rel * 0.95;
          a.vx -= imp * nx; a.vy -= (imp * ny) / 2; b.vx += imp * nx; b.vy += (imp * ny) / 2;
        }
        const push = (RB * 2 - d) / 2;
        a.x -= nx * push; a.y -= (ny * push) / 2; b.x += nx * push; b.y += (ny * push) / 2;
      }
    }
    n++;
    if (n % 3 === 0) for (const b of balls) { b.trail.push([b.x, b.y]); if (b.trail.length > 14) b.trail.shift(); }
  };
  reset();
  return (t) => {
    const lt = t % PER;
    const want = Math.floor(lt / DT);
    if (want < n) reset();
    while (n < want) step();
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      if (y >= FLOOR) { g.set(x, y, y === FLOOR ? "▀" : (x + y) % 4 === 0 ? "▚" : "█", K("floor", y === FLOOR ? 2 : 0)); continue; }
      const v = clamp(0.2 + (y / FLOOR) * 0.5);
      g.set(x, y, (x + y * 3) % 7 === 0 ? "·" : "░", K("bg", Math.min(5, Math.floor(v * 6))));
    }
    g.box(0, 0, cols, FLOOR + 1, "light", K("floor", 1));
    balls.forEach((b, i) => {
      // motion trail
      b.trail.forEach(([tx, ty], k) => { if (k < b.trail.length - 2) g.set(tx, ty, k > 8 ? "•" : "·", K("b" + i, k > 8 ? 1 : 0)); });
      // shadow grows sharper as the ball nears the floor
      const h = clamp((FLOOR - b.y) / FLOOR);
      const sw = Math.round(RB * (1.4 - h * 0.8));
      for (let k = -sw; k <= sw; k++) { const sx = Math.round(b.x + k); if (sx > 0 && sx < cols - 1) g.set(sx, FLOOR - 1, "▄", K("shadow", 0)); }
    });
    balls.forEach((b, i) => {
      const sq = b.sq;
      const rx = RB * (1 + sq * 0.35), ry = (RB / 2) * (1 - sq * 0.35);
      const cy = b.y + (RB / 2 - ry);
      for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++)
        for (let x = Math.floor(b.x - rx - 1); x <= b.x + rx + 1; x++) {
          const nx = (x + 0.5 - b.x) / rx, ny = (y + 0.5 - cy) / Math.max(0.7, ry);
          const q = nx * nx + ny * ny;
          if (q > 1) continue;
          const lum = clamp(-nx * 0.5 - ny * 0.5 + Math.sqrt(1 - q) * 0.7);
          g.set(x, y, "█", K("b" + i, lum > 0.85 ? 3 : lum > 0.45 ? 2 : lum > 0.15 ? 1 : 0));
        }
    });
    return g.frame();
  };
}
