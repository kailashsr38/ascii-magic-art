/* bubble-tea-pearls: a tall cup of milk tea, tapioca pearls being sucked up a fat straw while ice bobs and condensation runs down. */
import { Grid, palette, gradient, KEYS, fbm, noise2, clamp, rng } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const BG = add(gradient(["#1e3a3e", "#2a5054", "#3a6a6a", "#4e8a82", "#6aa898"], 7));
const TEA = add(gradient(["#7a4a28", "#a06a40", "#c4905e", "#dcb084", "#eed0a8"], 8));
const PEARL = add(["#0e0604", "#24120a", "#4a2a18", "#8a6048"]);
const CUP = add(["#a8c4c8", "#d8eef0", "#ffffff"]);
const STRAW = add(["#8a1a4a", "#d03a7a", "#ff7ab0", "#ffc0dc"]);
const ICE = add(["#b8dce4", "#e4f6fa", "#ffffff"]);
const LID = add(["#c8d8dc", "#eef8fa"]);
const TABLE = add(gradient(["#3a2418", "#5e3c26", "#845a3a"], 4));

export const meta = {
  slug: "bubble-tea-pearls",
  name: "Bubble Tea Pearls",
  category: "food",
  note: "A tall cup of brown sugar milk tea, tapioca pearls sucked one by one up a fat pink straw while ice bobs and condensation runs down the cup.",
  tags: ["bubble tea", "boba", "drink", "cafe", "cute", "loader"],
  cols: 58, rows: 40, fps: 24,
  palette: palette(P),
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const R = rng(9);
  const cx = 29, top = 9, bot = 35, tableY = 36;
  const pearls = [];
  for (let i = 0; i < 46; i++) pearls.push([R(), R(), R() * 6.28]);
  const drops = Array.from({ length: 7 }, () => [R() < 0.5 ? -1 : 1, R() * 0.8, 3 + R() * 5, R()]);
  const halfW = (y) => 11 - (y - top) * 0.12;
  // straw path: tilts in from upper right, down to the pearls
  const straw = (f) => [cx + 12 - f * 13, 0 + f * (bot - 3)];
  return (t) => {
    // teal cafe backdrop and table
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      if (y < tableY) {
        const stripe = Math.floor(x / 4) % 2;
        const v = clamp(0.3 + stripe * 0.18 + Math.exp(-Math.hypot((x - 12) / 22, (y - 6) / 14)) * 0.4 + (fbm(x * 0.2, y * 0.2, 2) - 0.5) * 0.1);
        g.set(x, y, "█", KEYS[BG + Math.min(6, Math.floor(v * 7))]);
      } else g.set(x, y, y === tableY ? "▀" : "█", KEYS[TABLE + (y === tableY ? 3 : y > tableY + 1 ? 0 : 1)]);
    }
    // cup body with tea, a brown sugar streak and pearls at the bottom
    const level = top + 3;
    for (let y = top; y <= bot; y++) {
      const w = halfW(y);
      for (let x = Math.floor(cx - w); x <= Math.ceil(cx + w); x++) {
        const u = (x - cx) / w;
        if (Math.abs(u) > 1) continue;
        if (Math.abs(u) > 0.92 || y === bot) { g.set(x, y, "█", KEYS[CUP + (u < 0 ? 2 : 1)]); continue; }
        if (y < level) { g.set(x, y, "▒", KEYS[CUP]); continue; }
        const streak = Math.sin(x * 0.5 + y * 0.35 + Math.sin(y * 0.2 + t * 0.4) * 2) > 0.7 && y > level + 6;
        let v = clamp(0.55 + (1 - Math.abs(u)) * 0.2 - u * 0.15 - (y - level) * 0.008 + (fbm(x * 0.2, y * 0.2 + t * 0.1, 2) - 0.5) * 0.3);
        if (streak) v -= 0.4;
        if (Math.abs(u + 0.7) < 0.06) v = 1;
        g.set(x, y, "█", KEYS[TEA + Math.min(7, Math.max(0, Math.floor(v * 8)))]);
      }
    }
    // pearls jostling at the bottom
    for (const [a, b, ph] of pearls) {
      const y = bot - 1 - Math.floor(b * 5) + Math.round(Math.sin(t * 1.5 + ph) * 0.4);
      const w = halfW(y) - 1.5;
      const x = Math.round(cx - w + a * w * 2 + Math.sin(t * 1.1 + ph) * 0.6);
      g.set(x, y, "█", KEYS[PEARL + (Math.sin(ph + t) > 0.3 ? 1 : 0)]);
      g.set(x + 1, y, "█", KEYS[PEARL + (Math.sin(ph) > 0.5 ? 3 : 2)]);
    }
    // ice cubes bobbing near the top
    for (const [ix, ph] of [[cx - 7, 0], [cx + 1, 2], [cx + 6, 4.1]]) {
      const iy = level + Math.round(1 + Math.sin(t * 1.3 + ph) * 0.8);
      const ixx = ix + Math.round(Math.sin(t * 0.7 + ph) * 1);
      for (let y = iy; y < iy + 3; y++) for (let x = ixx; x < ixx + 5; x++) g.set(x, y, "█", KEYS[ICE + (y === iy || x === ixx ? 2 : (x + y) % 2)]);
    }
    // domed lid
    for (let y = top - 4; y <= top; y++) for (let x = cx - 13; x <= cx + 13; x++) {
      const d = Math.hypot((x - cx) / 12.5, (y - top) / 4.5);
      if (y === top && Math.abs(x - cx) <= 12) { g.set(x, y, "█", KEYS[LID + 1]); continue; }
      if (d < 1 && d > 0.85) g.set(x, y, "█", KEYS[LID + (x < cx ? 1 : 0)]);
      else if (d < 0.85) g.set(x, y, "▓", KEYS[LID]);
    }
    // straw with pearls racing up it
    const sp = [];
    for (let i = 0; i <= 80; i++) { const f = i / 80; const [x, y] = straw(f); if (y < bot - 1) sp.push([x, y, f]); }
    for (const [x, y] of sp) {
      g.set(x - 1, y, "█", KEYS[STRAW + 1]);
      g.set(x, y, "█", KEYS[STRAW + 2]);
      g.set(x + 1, y, "█", KEYS[STRAW + 0]);
    }
    for (let k = 0; k < 4; k++) {
      const a = ((t * 0.55 + k / 4) % 1);
      const [x, y] = straw(1 - a);
      if (y < bot - 1 && y >= 0) { g.set(x, y, "█", KEYS[PEARL + 1]); g.set(x - 1, y, "▓", KEYS[PEARL + 3]); }
    }
    // condensation drops sliding down the outside
    for (const [side, h, per, ph] of drops) {
      const a = ((t / per + ph) % 1);
      const y = Math.round(top + 2 + h * 6 + a * (bot - top - 6));
      const x = Math.round(cx + side * (halfW(y) - 0.2));
      g.set(x, y, "█", KEYS[CUP + 2]);
      if (y - 1 > top) g.set(x, y - 1, "▓", KEYS[CUP + 1]);
    }
    return g.frame();
  };
}
