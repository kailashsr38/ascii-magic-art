/* bouncing-slime: a glossy green slime blob hops on a dungeon floor, squashing on landing and stretching as it leaps. */
import { Grid, palette, gradient, KEYS, fbm, noise2, clamp } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const WALL = add(gradient(["#0c0a16", "#16122a", "#221c3c", "#30284e", "#3e3460"], 10));
const BRICK = add(["#0a0812", "#1a1626"]);
const FLOOR = add(gradient(["#14121e", "#221e30", "#322c44", "#443c58"], 4));
const SLIME = add(gradient(["#0a4a1e", "#127028", "#1e9a32", "#36c044", "#6ade5a", "#b4f68a"], 12));
const GLOSS = add(["#e8ffd8", "#ffffff"]);
const EYE = add(["#06140a", "#ffffff"]);
const PINK = add(["#ff8aa0"]);
const TORCH = add(["#ff8a2a", "#ffc84a", "#fff2a0"]);

export const meta = {
  slug: "bouncing-slime",
  name: "Bouncy Green Slime",
  category: "mascots",
  note: "A glossy green slime blob hops along a dungeon floor, squashing flat on every landing and stretching tall as it leaps.",
  tags: ["slime", "mascot", "bounce", "game", "loader", "404"],
  cols: 60, rows: 26, fps: 30,
  palette: palette(P),
};

const ell = (g, cx, cy, rx, ry, fn) => {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy;
    if (d <= 1) fn(x, y, dx, dy, d);
  }
};
const HOP = 1.3;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const bg = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    if (y >= 21) { const n = noise2(x * 0.3, y, 4); bg.push([y === 21 ? "▄" : n > 0.6 ? "▓" : "█", KEYS[FLOOR + (y === 21 ? 3 : y > 23 ? 0 : 1 + (n > 0.5 ? 1 : 0))]]); continue; }
    const mortar = y % 3 === 2 || (x + (Math.floor(y / 3) % 2) * 4) % 8 === 0;
    const glow = Math.exp(-Math.hypot((x - 8) / 2, y - 6) / 9) + Math.exp(-Math.hypot((x - 52) / 2, y - 6) / 9);
    const v = clamp(0.12 + glow * 0.55 + (fbm(x * 0.1, y * 0.2, 2, 3) - 0.5) * 0.25);
    bg.push(mortar ? ["▒", KEYS[BRICK + (v > 0.4 ? 1 : 0)]] : ["█", KEYS[WALL + Math.min(9, Math.floor(v * 10))]]);
  }
  return (t) => {
    for (let i = 0; i < bg.length; i++) { g.ch[i] = bg[i][0]; g.co[i] = bg[i][1]; }
    // torches
    for (const tx of [8, 52]) {
      g.text(tx - 1, 8, "▀█▀", KEYS[BRICK]); g.set(tx, 9, "█", KEYS[BRICK]);
      const f = Math.floor(t * 9 + tx) % 3;
      g.text(tx - 1, 7, ["▄█▄", "▟█▖", "▗█▙"][f], KEYS[TORCH]); g.set(tx, 6, f === 1 ? "▘" : "▝", KEYS[TORCH + 1]); g.set(tx, 7, "█", KEYS[TORCH + 2]);
    }
    const n = Math.floor(t / HOP), u = (t % HOP) / HOP;
    // horizontal path: hop right then back left over a 4 hop cycle
    const lane = [22, 30, 38, 30], x0 = lane[n % 4], x1 = lane[(n + 1) % 4];
    let h = 0, sx = 1, sy = 1, cx = x0;
    if (u < 0.18) { const k = u / 0.18; sx = 1 + Math.sin(k * Math.PI) * 0.35; sy = 1 - Math.sin(k * Math.PI) * 0.35; }
    else if (u < 0.82) { const k = (u - 0.18) / 0.64; h = 4 * k * (1 - k) * 6; cx = x0 + (x1 - x0) * k; sx = 0.85 + Math.abs(k - 0.5) * 0.2; sy = 1.2 - Math.abs(k - 0.5) * 0.3; }
    else { const k = (u - 0.82) / 0.18; cx = x1; sx = 1 + Math.sin(k * Math.PI) * 0.4; sy = 1 - Math.sin(k * Math.PI) * 0.38; }
    const rx = 11 * sx, ry = 7 * sy, base = 21 - h;
    // shadow
    const sw = Math.max(3, 9 - h * 0.6);
    ell(g, cx, 21.6, sw, 0.8, (x, y) => g.set(x, y, "▓", KEYS[FLOOR]));
    // splash drops right after landing
    if (u > 0.82 || u < 0.12) {
      const k = u > 0.82 ? (u - 0.82) / 0.3 : (u + 0.18) / 0.3;
      for (const s of [-1, 1]) for (const [vx, vy] of [[7, 5], [11, 3]]) {
        const px = cx + s * (rx * 0.8 + vx * k), py = 20 - vy * k + 14 * k * k;
        if (py < 21) g.set(px, py, "●", KEYS[SLIME + 7]);
      }
    }
    // body: an ellipse sliced flat where it meets the ground, flaring at the base
    const cy = base - ry * 0.7;
    for (let y = Math.floor(cy - ry); y <= base; y++) for (let x = Math.floor(cx - rx * 1.3); x <= cx + rx * 1.3; x++) {
      if (y + 0.5 > base + 0.5) continue;
      const dy = (y + 0.5 - cy) / ry, dx = (x + 0.5 - cx) / (rx * (1 + Math.max(0, dy) * 0.3));
      const wob = Math.sin(t * 7 + dx * 3) * 0.05;
      if (dx * dx + dy * dy > 1 + wob) continue;
      const lit = clamp(0.42 - dy * 0.35 - dx * 0.3 + Math.sqrt(Math.max(0, 1 - dx * dx - dy * dy)) * 0.35);
      const bub = false;
      g.set(x, y, bub ? "o" : dx * dx + dy * dy > 0.82 ? "▓" : "█", KEYS[SLIME + Math.min(11, Math.floor(lit * 12) + (bub ? 3 : 0))]);
    }
    // gloss
    g.text(Math.round(cx - rx * 0.6), Math.round(cy - ry * 0.65), "▄▄▄", KEYS[GLOSS]);
    g.set(Math.round(cx - rx * 0.7), Math.round(cy - ry * 0.65) + 1, "▀", KEYS[GLOSS]);
    // face
    const look = h > 1 ? -1 : 0;
    const bp = t % 3.3, blink = Math.abs(bp - 2.4) < 0.1 && h < 1;
    const ey = Math.round(cy - ry * 0.3 + look * 0.5);
    for (const ex of [cx - 3.6 * sx, cx + 3.6 * sx]) {
      if (blink) { g.text(Math.round(ex - 1), ey + 1, "▀▀▀", KEYS[EYE]); continue; }
      ell(g, ex, ey + 1, 2.2, 2.0, (x, y) => g.set(x, y, "█", KEYS[EYE]));
      g.text(Math.round(ex - 1), ey + look * 0.5, "▄", KEYS[EYE + 1]); g.set(Math.round(ex - 1), ey + 1, "█", KEYS[EYE + 1]);
    }
    g.text(Math.round(cx - 6 * sx - 1), ey + 2, "▄▄", KEYS[PINK]); g.text(Math.round(cx + 6 * sx), ey + 2, "▄▄", KEYS[PINK]);
    const my = ey + 3;
    if (h > 2) { g.text(Math.round(cx - 1), my, "▄▄", KEYS[EYE]); g.text(Math.round(cx - 1), my + 1, "▀▀", KEYS[EYE]); }
    else g.text(Math.round(cx - 1.5), my, "▀▄▄▀", KEYS[EYE]);
    return g.frame();
  };
}
