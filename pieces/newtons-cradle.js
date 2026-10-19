/* newtons-cradle: five chrome balls passing momentum down the line, one ball then two at a time. */
import { Grid, palette, gradient, KEYS, clamp, TAU } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("bg", gradient(["#06070c", "#0c0f1a", "#141a2a", "#1c2438"], 6));
add("chrome", gradient(["#14161e", "#2e3444", "#5a6478", "#8e98ae", "#c4ccdc", "#eef2f8", "#ffffff"], 12));
add("frame", ["#4a5060", "#8a92a4", "#c8ced8"]);
add("wood", gradient(["#2a1608", "#5a3414", "#8a5a2a", "#b07a40"], 5));
add("str", ["#5a6274", "#8a92a6"]);
add("shadow", ["#120a04", "#1e1208"]);

export const meta = {
  slug: "newtons-cradle",
  name: "Newtons Cradle",
  category: "motion-lab",
  note: "Five chrome balls on a frame pass momentum down the line, first one ball at a time and then two.",
  tags: ["momentum", "pendulum", "desk-toy", "physics", "loader", "hero"],
  cols: 92, rows: 32, fps: 30,
  palette: palette(all),
};

const K = (n, i) => KEYS[G[n] + i];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = cols / 2, top = 2, LEN = 15, RB = 5, SP = 10;
  const PER = 1.5;                   // seconds per full swing cycle
  const AMP = 0.5;
  const L = [-0.5, -0.6, 0.62];
  const ball = (bx, by) => {
    const ry = RB / 2;
    for (let y = Math.floor(by - ry - 1); y <= by + ry + 1; y++)
      for (let x = Math.floor(bx - RB - 1); x <= bx + RB + 1; x++) {
        const nx = (x + 0.5 - bx) / RB, ny = (y + 0.5 - by) / ry;
        const q = nx * nx + ny * ny;
        if (q > 1) continue;
        const nz = Math.sqrt(1 - q);
        const d = nx * L[0] + ny * L[1] + nz * L[2];
        const spec = Math.pow(clamp(d), 18);
        const env = 0.25 + 0.35 * clamp(-ny) + 0.25 * nz;    // fake environment reflection, bright above
        const v = clamp(env * 0.8 + d * 0.3 + spec * 0.9);
        g.set(x, y, v > 0.3 ? "█" : "▓", K("chrome", Math.min(11, Math.floor(v * 12))));
      }
  };
  return (t) => {
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = clamp(0.3 + 0.6 * Math.exp(-Math.hypot((x - cx) / 2.5, y - 12) / 12));
      g.set(x, y, v > 0.5 ? "▒" : "░", K("bg", Math.min(5, Math.floor(v * 6))));
    }
    const ph = (t / PER) * TAU;
    const s = Math.sin(ph);
    const two = Math.floor(t / (PER * 4) + 0.75) % 2 === 1;
    const th = [0, 0, 0, 0, 0];
    if (s > 0) { th[4] = AMP * s; if (two) th[3] = AMP * s; }
    else { th[0] = AMP * s; if (two) th[1] = AMP * s; }
    // base board and frame
    const by = top + LEN + 5;
    for (let y = by; y < rows; y++) for (let x = 2; x < cols - 2; x++) {
      const edge = y === by;
      g.set(x, y, edge ? "▄" : "█", K("wood", edge ? 3 : Math.max(0, 3 - (y - by))));
    }
    for (let y = top; y < by; y++) { g.set(4, y, "║", K("frame", 1)); g.set(cols - 5, y, "║", K("frame", 1)); }
    g.hline(4, cols - 5, top, "═", K("frame", 2));
    g.set(4, top, "╔", K("frame", 2)); g.set(cols - 5, top, "╗", K("frame", 2));
    // shadows on the base
    for (let i = 0; i < 5; i++) {
      const px = cx + (i - 2) * SP;
      const sx = px + Math.sin(th[i]) * LEN * 2;
      g.text(Math.round(sx - 4), by + 1, "▀▀▀▀▀▀▀▀", K("shadow", 1));
    }
    for (let i = 0; i < 5; i++) {
      const px = cx + (i - 2) * SP;
      const bx = px + Math.sin(th[i]) * LEN * 2, byy = top + Math.cos(th[i]) * LEN;
      // two strings in a V, seen from the front they converge on the ball
      const n = Math.ceil(byy - top), slope = (bx - px) / Math.max(1, n);
      for (let j = 1; j <= n; j++) {
        const x = px + (bx - px) * (j / n);
        g.set(x, top + j, Math.abs(slope) < 0.35 ? "│" : slope > 0 ? "╲" : "╱", K("str", j > n / 2 ? 1 : 0));
      }
      g.set(px, top, "┬", K("frame", 2));
      ball(bx, byy + RB * 0.5);
    }
    return g.frame();
  };
}
