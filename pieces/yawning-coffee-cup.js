/* yawning-coffee-cup: a sleepy coffee mug on a saucer gives a big yawn while curls of steam rise, then perks up wide awake. */
import { Grid, palette, gradient, KEYS, fbm, clamp, smooth } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const WALL = add(gradient(["#1e120c", "#2e1c12", "#40281a", "#543622", "#68462c"], 10));
const WOOD = add(gradient(["#2a160a", "#3e2210", "#563018", "#6e4020"], 4));
const MUG = add(gradient(["#7a5a5a", "#a88080", "#d0a8a0", "#ecccc0", "#fbe8de", "#ffffff"], 10));
const BAND = add(["#c84a3a", "#e86a52"]);
const COFFEE = add(["#1a0c06", "#3a1e0e", "#6a3a1a", "#a0683a"]);
const PLATE = add(gradient(["#6a6a74", "#9a9aa4", "#c8c8d2", "#ececf4"], 5));
const STEAM = add(["#6a5a52", "#9a8c84", "#cfc4bc", "#f4ece6"]);
const FACE = add(["#1a0a06", "#ff8a8a", "#ffffff", "#c83a4a"]);

export const meta = {
  slug: "yawning-coffee-cup",
  name: "Yawning Coffee Mug",
  category: "mascots",
  note: "A sleepy coffee mug on its saucer gives a long stretchy yawn as curls of steam rise, then blinks itself wide awake.",
  tags: ["coffee", "mascot", "morning", "cute", "loader", "empty-state"],
  cols: 56, rows: 28, fps: 24,
  palette: palette(P),
};

const ell = (g, cx, cy, rx, ry, fn) => {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy;
    if (d <= 1) fn(x, y, dx, dy, d);
  }
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const bg = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    if (y >= 22) { const grain = fbm(x * 0.08, y * 1.3, 2, 5); bg.push([y === 22 ? "▄" : grain > 0.55 ? "▓" : "█", KEYS[WOOD + (y === 22 ? 3 : grain > 0.55 ? 1 : 2)]]); continue; }
    const v = clamp(0.2 + Math.exp(-Math.hypot((x - 27) / 2, y - 10) / 12) * 0.7 + (fbm(x * 0.06, y * 0.12, 3, 2) - 0.5) * 0.2);
    bg.push([" ░▒▓"[1 + Math.min(2, Math.floor(v * 3))], KEYS[WALL + Math.min(9, Math.floor(v * 10))]]);
  }
  return (t) => {
    for (let i = 0; i < bg.length; i++) { g.ch[i] = bg[i][0]; g.co[i] = bg[i][1]; }
    const p = t % 8;
    // yawn amount 0..1, peaks around 4.2 s
    const yawn = p < 3 ? 0 : p < 4 ? smooth(p - 3) : p < 4.8 ? 1 : p < 5.6 ? 1 - smooth((p - 4.8) / 0.8) : 0;
    const awake = p > 5.6 && p < 7.6 ? 1 : 0;
    const stretch = yawn * 1.0;
    const cx = 26, bot = 21, top = 9 - stretch;
    // saucer
    ell(g, cx, 21.6, 17, 1.6, (x, y, dx, dy) => g.set(x, y, dy < 0 ? "▄" : "█", KEYS[PLATE + (dy < 0 ? 3 : dx > 0.4 ? 1 : 2)]));
    // handle
    for (let a = -1.4; a <= 1.4; a += 0.08) {
      const hx = cx + 11 + Math.cos(a) * 4.2, hy = 15 + Math.sin(a) * 3.6 - stretch * 0.5;
      g.set(hx, hy, "█", KEYS[MUG + 5]); g.set(hx + 1, hy, "█", KEYS[MUG + 3]);
    }
    // mug body
    for (let y = Math.floor(top); y <= bot; y++) {
      const u = (y - top) / (bot - top);
      const hw = 11.5 - u * 1.5 - (y === bot ? 1 : 0);
      for (let x = Math.floor(cx - hw); x <= cx + hw; x++) {
        const dx = (x + 0.5 - cx) / hw;
        if (Math.abs(dx) > 1) continue;
        const lit = clamp(0.95 - dx * 0.35 - dx * dx * 0.45 - u * 0.15);
        const band = y >= bot - 3 && y <= bot - 2;
        g.set(x, y, Math.abs(dx) > 0.92 ? "▓" : "█", band ? KEYS[BAND + (dx < 0 ? 1 : 0)] : KEYS[MUG + Math.min(9, Math.floor(lit * 10))]);
      }
    }
    // rim and coffee
    ell(g, cx, top, 11.5, 1.4, (x, y, dx, dy) => g.set(x, y, "█", KEYS[dy < -0.2 ? MUG + 6 : MUG + 9]));
    ell(g, cx, top + 0.1, 10, 0.9, (x, y, dx) => g.set(x, y, "▄", KEYS[COFFEE + (dx < -0.4 ? 2 : 1)]));
    // steam
    for (let i = 0; i < 3; i++) for (let k = 0; k < 14; k++) {
      const a = ((t * 0.32 + i / 3 + k / 14) % 1);
      const sy = top - 1 - a * 9 * (1 + yawn * 0.2);
      const sx = cx - 5 + i * 5 + Math.sin(a * 7 + t * 1.3 + i * 2) * (1.2 + a * 2.2);
      if (sy < 0) continue;
      const lv = a < 0.3 ? 3 : a < 0.6 ? 2 : a < 0.85 ? 1 : 0;
      g.set(sx, sy, a < 0.5 ? "▓" : "▒", KEYS[STEAM + lv]);
    }
    // face
    const fy = 13 - stretch * 0.6;
    const bp = p % 2.6;
    const blink = awake && Math.abs(bp - 1.2) < 0.12;
    for (const ex of [cx - 5, cx + 5]) {
      const X = Math.round(ex - 1), Y = Math.round(fy);
      if (yawn > 0.3) g.text(X, Y, ex < cx ? ">▄" : "▄<", KEYS[FACE]);
      else if (awake && !blink) { g.text(X, Y - 1, "▄█▄", KEYS[FACE]); g.text(X, Y, "███", KEYS[FACE]); g.set(X, Y - 1, "▄", KEYS[FACE + 2]); }
      else { g.text(X, Y, "▄▄▄", KEYS[FACE]); g.text(X, Y - 1, "▄▄▄", KEYS[MUG + 4]); }
    }
    g.text(cx - 9, Math.round(fy + 1.4), "▄▄", KEYS[FACE + 1]); g.text(cx + 8, Math.round(fy + 1.4), "▄▄", KEYS[FACE + 1]);
    const my = fy + 3;
    if (yawn > 0.05) {
      ell(g, cx, my, 1 + yawn * 2.2, 0.6 + yawn * 1.6, (x, y, dx, dy) => g.set(x, y, "█", KEYS[dy > 0.3 ? FACE + 3 : FACE]));
    } else if (awake) g.text(cx - 2, Math.round(my - 0.5), "▀▄▄▀", KEYS[FACE]);
    else g.text(cx - 1, Math.round(my - 0.5), "▄▄", KEYS[FACE]);
    if (yawn > 0.6) { g.text(cx + 13, Math.round(top) - 1, "o", KEYS[STEAM + 2]); g.text(cx + 15, Math.round(top) - 3, "O", KEYS[STEAM + 3]); }
    return g.frame();
  };
}
