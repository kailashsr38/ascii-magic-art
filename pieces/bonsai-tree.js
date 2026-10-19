/* bonsai-tree: a twisted bonsai in a glazed pot, its foliage pads rustling in a soft breeze. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const WALL = add(gradient(["#2a2420", "#3e342c", "#54463a", "#6a5a48", "#80705a"], 10));
const TABLE = add(gradient(["#1e140c", "#3a2614", "#5a3c20", "#7a5430"], 6));
const POT = add(gradient(["#123048", "#1c4a6a", "#2c6a8e", "#5a98b8"], 6));
const SOIL = add(["#2a1c10", "#4a3420"]);
const BARK = add(gradient(["#2a1a10", "#4a3220", "#6e4e32", "#94704a"], 6));
const LEAF = add(gradient(["#14401c", "#1e5a24", "#2e7a2c", "#4a9a36", "#78bc48", "#a8d860"], 12));
const MOSS = add(["#3a6a24", "#5a8a2c"]);

export const meta = {
  slug: "bonsai-tree",
  name: "Bonsai Tree",
  category: "weather",
  note: "A twisted bonsai in a glazed blue pot, its cloud-shaped foliage pads rustling in a soft breeze.",
  tags: ["bonsai", "tree", "zen", "calm", "plant", "wallpaper"],
  cols: 84, rows: 36, fps: 20,
  palette: palette(P),
};

const SH = " ░▒▓█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = 42, potTop = 25;
  const r = rng(88);
  const trunk = [];
  for (let i = 0; i <= 40; i++) {
    const u = i / 40;
    trunk.push([cx + Math.sin(u * 4.2) * 8 * (0.4 + u) - u * 4, potTop - u * 15, 2.8 - u * 2]);
  }
  const branches = [
    [trunk[22], [cx - 20, potTop - 11], 0.9],
    [trunk[30], [cx + 18, potTop - 14], 0.8],
    [trunk[40], [cx - 6, potTop - 19], 0.7],
    [trunk[16], [cx + 16, potTop - 6], 0.7],
  ];
  const pads = [[cx - 22, potTop - 13, 10, 3.2], [cx + 19, potTop - 16, 10, 3], [cx - 5, potTop - 21, 12, 3.6], [cx + 18, potTop - 8, 8, 2.6], [cx - 10, potTop - 16, 6, 2.2]];
  const falls = Array.from({ length: 6 }, () => [r() * 40 + cx - 20, r(), 4 + r() * 4]);
  const thick = (x0, y0, x1, y1, w0, w1) => {
    const n = Math.ceil(Math.hypot(x1 - x0, (y1 - y0) * 2)) * 2 + 1;
    for (let i = 0; i <= n; i++) {
      const u = i / n, x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u, w = w0 + (w1 - w0) * u;
      const rw = Math.max(0, Math.round(w * 2));
      for (let dx = -rw; dx <= rw; dx++) {
        const lit = clamp(0.55 - dx / (rw + 1) * 0.5 + noise2((x + dx) * 0.8, y * 1.3, 3) * 0.25);
        g.set(x + dx, y, rw === 0 ? "/" : Math.abs(dx) === rw ? "▓" : "█", KEYS[BARK + Math.min(5, Math.floor(lit * 6))]);
      }
    }
  };
  return (t) => {
    g.clear();
    for (let y = 0; y < 30; y++) for (let x = 0; x < cols; x++) {
      const d = Math.hypot((x - cx) / 2.2, y - 14);
      const v = clamp(0.75 - d / 28 + (fbm(x * 0.05, y * 0.1, 3, 2) - 0.5) * 0.3);
      g.set(x, y, SH[1 + Math.min(3, Math.floor(v * 4))], KEYS[WALL + Math.min(9, Math.floor(v * 10))]);
    }
    for (let y = 30; y < rows; y++) for (let x = 0; x < cols; x++) {
      const grain = noise2(x * 0.08, y * 2.5, 5);
      g.set(x, y, y === 30 ? "▀" : grain > 0.55 ? "▓" : "█", KEYS[TABLE + Math.min(5, (y === 30 ? 5 : Math.floor(grain * 4)))]);
    }
    for (let y = potTop; y < 31; y++) {
      const u = (y - potTop) / 6;
      const hw = y === potTop ? 22 : 20 - u * 3;
      for (let x = Math.floor(cx - hw); x <= cx + hw; x++) {
        const a = (x - cx) / hw;
        const lit = clamp(0.6 - a * 0.35 - u * 0.2);
        let ch = y === potTop ? "▄" : Math.abs(a) > 0.95 ? "▓" : "█";
        if (y === potTop + 2 && Math.abs(a) < 0.85 && (x % 6 === 0)) ch = "◆";
        g.set(x, y, ch, KEYS[POT + Math.min(5, Math.floor(lit * 6) + (y === potTop ? 1 : 0))]);
      }
    }
    for (let x = cx - 20; x <= cx + 20; x++) g.set(x, potTop - 1, noise2(x * 0.5, 1) > 0.55 ? "▄" : "_", KEYS[noise2(x * 0.5, 1) > 0.55 ? MOSS : SOIL + 1]);
    for (let i = 0; i < trunk.length - 1; i++) thick(trunk[i][0], trunk[i][1], trunk[i + 1][0], trunk[i + 1][1], trunk[i][2], trunk[i + 1][2]);
    for (const [[x0, y0], [x1, y1], w] of branches) thick(x0, y0, (x0 + x1) / 2, y1 + (y0 - y1) * 0.3, w, w * 0.6), thick((x0 + x1) / 2, y1 + (y0 - y1) * 0.3, x1, y1, w * 0.6, 0.2);
    for (const [px, py, rx, ry] of pads) {
      const sway = Math.sin(t * 1.3 + px * 0.1) * 0.6;
      for (let y = Math.floor(py - ry - 1); y <= py + ry; y++) for (let x = Math.floor(px - rx * 2 - 2); x <= px + rx * 2 + 2; x++) {
        const yy = y - py;
        const flat = yy > 0 ? yy * 1.8 : yy;
        const d = Math.hypot((x - px - sway * (-yy + ry) / ry) / (rx * 2), flat / ry);
        const n = fbm(x * 0.35 + t * 0.6, y * 0.6 - t * 0.2, 2, 6);
        if (d + (0.5 - n) * 0.45 > 1) continue;
        const lit = clamp(0.75 - (yy + ry) / (2 * ry) * 0.6 + (n - 0.5) * 0.9 + Math.sin(t * 2.5 + x * 0.4 + y) * 0.08);
        g.set(x, y, n > 0.68 ? "*" : n > 0.52 ? "▓" : n > 0.36 ? "%" : "&", KEYS[LEAF + Math.min(11, Math.floor(lit * 12))]);
      }
    }
    for (const [fx, ph, per] of falls) {
      const a = (t / per + ph) % 1;
      if (a > 0.85) continue;
      const y = potTop - 16 + a * 22;
      g.set(fx + Math.sin(t * 2 + ph * 9) * 2, y, Math.sin(t * 6 + ph * 5) > 0 ? "◆" : "-", KEYS[LEAF + 9]);
    }
    return g.frame();
  };
}
