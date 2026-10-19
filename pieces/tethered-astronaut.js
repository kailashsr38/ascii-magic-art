/* tethered-astronaut: an astronaut drifting on a tether beside a station hull, the earth turning slowly below. */
import { Grid, palette, gradient, KEYS, fbm, rng, clamp } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("bg", gradient(["#010104", "#04061a", "#081032"], 4));
add("star", ["#7a84b0", "#dce4ff"]);
add("sea", gradient(["#020a1e", "#062a5a", "#0c4a8c", "#2a7ac0", "#5aa8e0"], 8));
add("land", gradient(["#1a2a10", "#3a5a20", "#6a7a3a", "#a89a60"], 4));
add("cloud", gradient(["#6a7a90", "#b8c8dc", "#f4f8ff"], 4));
add("air", gradient(["#0a2a6a", "#3a7ae0", "#9ad0ff"], 3));
add("hull", gradient(["#16181e", "#2e323c", "#4e5462", "#7e8696", "#b8c0cc", "#e8eef4"], 8));
add("suit", gradient(["#2a2e36", "#6a707c", "#b4bac4", "#e8ecf0", "#ffffff"], 6));
add("visor", ["#3a2400", "#a06a10", "#ffc850"]);
add("accent", ["#c8402a", "#2a6ad0", "#ffd860"]);
export const meta = {
  slug: "tethered-astronaut",
  name: "Tethered Spacewalk",
  category: "cosmos",
  note: "An astronaut drifts on a curling tether beside a station hull, waving now and then, while the cloudy blue earth turns slowly far below.",
  tags: ["astronaut", "spacewalk", "earth", "space", "hero", "404"],
  cols: 100, rows: 36, fps: 20,
  palette: palette(all),
};
const K = (n, i) => KEYS[G[n] + i];

// astronaut sprite: each letter is a colour role, space is transparent
const BODY = [
  "      BBwwwww       ",
  "     BwWWWWWWw      ",
  "    BwWVVvvvvWw     ",
  "    BwWVvvvvvWw     ",
  "    BwWvvvvvvWw     ",
  "     BwWWWWWWw      ",
  "   sBBwWWWWWWWws    ",
  "  sw BwWRRbbWWWws   ",
  " sw  BwWWWWWWWw sw  ",
  " Ww  BwWWWWWWWw  Ww ",
  "     swWWWWWWWs     ",
  "     swWWs sWWs     ",
  "     swWW   sWWs    ",
  "     sBBB   sBBBs   ",
];
const WAVE = [
  "                 Ww ",
  "                sw  ",
  "               sw   ",
];
const ROLE = { W: ["█", "suit", 4], w: ["▓", "suit", 3], s: ["▒", "suit", 1], V: ["▓", "visor", 2], v: ["█", "visor", 0],
  B: ["▓", "hull", 4], R: ["█", "accent", 0], b: ["█", "accent", 1] };
export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(4);
  const stars = [];
  for (let i = 0; i < 70; i++) stars.push([Math.floor(r() * cols), Math.floor(r() * rows * 0.75), r() < 0.3 ? 1 : 0]);
  const ex = 64, ey = 196, ER = 146;    // earth centre and radius in (x, 2y) units
  // hull panels: fixed geometry on the left
  return (t) => {
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) g.set(x, y, "░", K("bg", Math.min(2, Math.floor((y / rows) * 3))));
    for (const [x, y, b] of stars) g.set(x, y, b ? "+" : "·", K("star", b));
    // earth: oceans, land and clouds that drift as it turns
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const dx = x + 0.5 - ex, dy = (y + 0.5) * 2 - ey;
      const d = Math.hypot(dx, dy);
      if (d < ER) {
        const mu = Math.sqrt(1 - (d / ER) ** 2);
        const u = dx / (ER * (0.4 + mu * 0.6)), v = dy / ER;
        const lit = clamp(0.25 + 0.75 * (0.6 - u * 0.5 - v * 0.2) * Math.pow(mu, 0.3));
        const lnd = fbm(u * 5 + t * 0.02, v * 6, 4, 3);
        const cl = fbm(u * 7 + t * 0.035, v * 10, 4, 8);
        if (cl > 0.56) g.set(x, y, cl > 0.64 ? "█" : "▓", K("cloud", Math.min(2, Math.floor(lit * 3))));
        else if (lnd > 0.58) g.set(x, y, "▓", K("land", Math.min(3, Math.floor(lit * 4))));
        else g.set(x, y, lnd > 0.5 ? "▓" : "█", K("sea", Math.min(7, Math.floor(lit * 8))));
      } else if (d < ER + 3) {
        const v = 1 - (d - ER) / 3;
        g.set(x, y, v > 0.6 ? "▓" : v > 0.3 ? "▒" : "░", K("air", Math.min(2, Math.floor(v * 3))));
      }
    }
    // station hull: a big panelled cylinder entering from the left
    for (let y = 0; y < rows; y++) for (let x = 0; x < 26; x++) {
      const edge = 18 + Math.round(3 * Math.sin(y * 0.09 + 0.4)) - (y > 26 ? (y - 26) * 2 : 0);
      if (x > edge) continue;
      const shade = clamp(0.25 + 0.7 * (x / edge) - 0.15 * Math.abs(y - 12) / 12);
      let ch = shade > 0.6 ? "█" : shade > 0.4 ? "▓" : "▒";
      let co = K("hull", Math.min(7, Math.floor(shade * 8)));
      if (x === edge) { ch = "█"; co = K("hull", 6); }
      if (y % 7 === 0 && x < edge) { ch = "─"; co = K("hull", 1); }
      if (x % 9 === 4 && x < edge) { ch = "│"; co = K("hull", 1); }
      if ((y % 7 === 3) && (x % 9 === 1)) { ch = "•"; co = K("hull", 5); }
      g.set(x, y, ch, co);
    }
    // hatch with a warm light, the tether anchor
    g.block(11, 9, "╔════╗\n║▓▓▓▓║\n║▓▓▓▓║\n╚════╝", K("hull", 7));
    for (let y = 10; y < 12; y++) for (let x = 12; x < 16; x++) g.set(x, y, "▓", K("accent", 2));
    // astronaut drifts in a slow figure eight
    const ax = 50 + 9 * Math.sin(t * 0.21), ay = 5 + 3 * Math.sin(t * 0.33 + 1);
    const hx = 17, hy = 10.5;
    // tether: a sagging curve with a slow travelling wave
    const tx = ax + 6, ty = ay + 10;
    const midx = (hx + tx) / 2 + 3 * Math.sin(t * 0.5), midy = Math.max(hy, ty) + 7 + 2 * Math.sin(t * 0.4);
    let px = hx, py = hy;
    for (let i = 1; i <= 80; i++) {
      const s = i / 80;
      const wave = Math.sin(s * 9 - t * 1.6) * 0.9 * Math.sin(s * Math.PI);
      const x = (1 - s) * (1 - s) * hx + 2 * s * (1 - s) * midx + s * s * tx;
      const y = (1 - s) * (1 - s) * hy + 2 * s * (1 - s) * midy + s * s * ty + wave;
      const dx = x - px, dy = y - py;
      const ch = Math.abs(dy) * 2 < Math.abs(dx) * 0.5 ? "─" : Math.abs(dx) < Math.abs(dy) * 0.6 ? "│" : (dx > 0) === (dy > 0) ? "╲" : "╱";
      g.set(x, y, ch, K("suit", 3));
      px = x; py = y;
    }
    // sprite, with an arm that waves now and then
    const waving = Math.sin(t * 0.9) > 0.5;
    const X = Math.round(ax), Y = Math.round(ay);
    const put = (row, j, skipArm) => {
      for (let i = 0; i < row.length; i++) {
        const c = row[i];
        if (c === " ") continue;
        if (skipArm && i >= 15) continue;
        const [ch, grp, k] = ROLE[c];
        g.set(X + i, Y + j, ch, K(grp, k));
      }
    };
    BODY.forEach((row, j) => put(row, j, waving && j >= 8 && j <= 9));
    if (waving) WAVE.forEach((row, j) => put(row, j + 5, false));
    return g.frame();
  };
}
