/* sprouting-plant-smile: a little pot plant on a sunny sill gets a drop of water, unfurls a brand new leaf and beams. */
import { Grid, palette, gradient, KEYS, fbm, clamp, smooth } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const WALL = add(gradient(["#3a2a1e", "#58402a", "#7a5a3a", "#a07a4e", "#c4a066", "#e4c890"], 10));
const WIN = add(gradient(["#7ac0ec", "#a8d8f6", "#d4ecfc"], 3));
const FRAME = add(["#e8e0d0", "#b8ae9c"]);
const SILL = add(gradient(["#6a4a2a", "#8a6238", "#a87a48", "#c8985e"], 4));
const POT = add(gradient(["#3a5a8a", "#4a72a8", "#5e8ac4", "#7aa4da", "#9cc0ec"], 6));
const SOIL = add(["#2a1a0e", "#3e2816"]);
const LEAF = add(gradient(["#1a5a1e", "#2a7a26", "#3e9a30", "#5cb83e", "#8ad45a", "#bcec88"], 10));
const STEM = add(["#2a6a22", "#3e8a2e"]);
const FACE = add(["#0a1830", "#ffffff", "#ff8aa0"]);
const DROP = add(["#4aa0e8", "#a8dcff"]);
const SPARK = add(["#ffe066", "#fff4b0"]);

export const meta = {
  slug: "sprouting-plant-smile",
  name: "Sprouting Pot Plant",
  category: "mascots",
  note: "A little pot plant on a sunny window sill catches a drop of water, slowly unfurls a brand new leaf and gives a big happy smile.",
  tags: ["plant", "mascot", "growth", "cute", "empty-state", "success"],
  cols: 56, rows: 30, fps: 24,
  palette: palette(P),
};

const ell = (g, cx, cy, rx, ry, fn) => {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy;
    if (d <= 1) fn(x, y, dx, dy, d);
  }
};
// a leaf: teardrop along a direction, size s (0..1)
function leaf(g, bx, by, ang, len, s, sway) {
  if (s <= 0.02) return;
  const L = len * s, W = 2.6 * s;
  const a = ang + sway;
  const ca = Math.cos(a), sa = Math.sin(a);
  for (let y = Math.floor(by - L); y <= by + L; y++) for (let x = Math.floor(bx - L * 2); x <= bx + L * 2; x++) {
    const px = x + 0.5 - bx, py = (y + 0.5 - by) * 2;
    const u = px * ca + py * sa, v = -px * sa + py * ca;
    if (u < 0 || u > L * 2) continue;
    const half = Math.sin((u / (L * 2)) * Math.PI) * W * 2 * (1 - (u / (L * 2)) * 0.3);
    if (Math.abs(v) > half) continue;
    const vein = Math.abs(v) < 0.6;
    const lit = clamp(0.55 + (v / (half + 0.01)) * -0.3 * Math.sign(sa || 1) + (u / (L * 2)) * 0.25);
    g.set(x, y, vein ? "▓" : "█", KEYS[LEAF + Math.min(9, Math.floor(lit * 10) - (vein ? 2 : 0))]);
  }
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const bg = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    if (y >= 25) { bg.push([y === 25 ? "▄" : "█", KEYS[SILL + (y === 25 ? 3 : y === 26 ? 2 : 1)]]); continue; }
    if (x >= 8 && x <= 47 && y >= 1 && y <= 24) {
      const fr = x === 8 || x === 47 || y === 1 || x === 27 || x === 28 || y === 12;
      if (fr) { bg.push(["█", KEYS[FRAME + (x === 28 || y === 12 ? 1 : 0)]]); continue; }
      const v = clamp(y / 24 + (fbm(x * 0.1, y * 0.2, 2, 3) - 0.5) * 0.4);
      bg.push([v > 0.5 ? "▓" : "█", KEYS[WIN + Math.min(2, Math.floor(v * 3))]]);
      continue;
    }
    const v = clamp(0.3 + (fbm(x * 0.08, y * 0.15, 3, 2) - 0.5) * 0.4 + (1 - y / 25) * 0.3);
    bg.push([" ░▒▓"[1 + Math.min(2, Math.floor(v * 3))], KEYS[WALL + Math.min(9, Math.floor(v * 10))]]);
  }
  return (t) => {
    for (let i = 0; i < bg.length; i++) { g.ch[i] = bg[i][0]; g.co[i] = bg[i][1]; }
    const p = t % 10;
    // timeline: drop falls 0-1.2, sip, leaf grows 1.4-4.4, smile + sparkle 4.4-8, leaf folds away 8.6-10 while plant dozes
    const grow = p < 1.4 ? 0 : p < 4.4 ? smooth((p - 1.4) / 3) : p < 8.6 ? 1 : 1 - smooth((p - 8.6) / 1.4);
    const happy = p > 4.2 && p < 8.6;
    const sleepy = p > 8.6 || p < 0.6;
    const cx = 28, sway = Math.sin(t * 1.4) * 0.08;
    // stem
    const stemTop = 11 - grow * 3;
    for (let y = Math.floor(stemTop); y <= 17; y++) {
      const x = cx + Math.sin((17 - y) * 0.3 + t * 1.4) * 0.4 * ((17 - y) / 8);
      g.text(Math.round(x), y, "█", KEYS[STEM + (y % 2)]);
    }
    // old leaves
    leaf(g, cx, 14.5, Math.PI + 0.35, 5.5, 1, sway);
    leaf(g, cx + 1, 13, -0.35, 5.5, 1, -sway);
    // new leaf on top
    leaf(g, cx + 0.5, stemTop + 0.5, -Math.PI / 2 - 0.25, 4.5, grow, sway * 2);
    if (grow > 0.05 && grow < 1) g.set(cx, stemTop, "▲", KEYS[LEAF + 8]);
    // pot
    for (let y = 16; y <= 25; y++) {
      const rim = y <= 17;
      const hw = rim ? 10 : 8.8 - (y - 18) * 0.35;
      for (let x = Math.floor(cx - hw); x <= cx + hw; x++) {
        const dx = (x + 0.5 - cx) / hw;
        const lit = clamp(0.75 - dx * 0.45 - dx * dx * 0.2 + (rim ? 0.1 : 0));
        g.set(x, y, "█", KEYS[POT + Math.min(5, Math.floor(lit * 6))]);
      }
    }
    for (let x = cx - 8; x <= cx + 8; x++) g.set(x, 16, "▄", KEYS[SOIL + (x % 3 === 0 ? 1 : 0)]);
    g.text(Math.round(cx - 0.5), 16, "█", KEYS[STEM]);
    // face on pot
    const blink = !sleepy && Math.abs((t % 3.3) - 2.1) < 0.12;
    for (const ex of [cx - 4, cx + 4]) {
      const X = Math.round(ex - 1);
      if (sleepy || blink) g.text(X, 20, "▄▄▄", KEYS[FACE]);
      else if (happy) g.text(X, 19, "▄▀▄", KEYS[FACE]);
      else { g.text(X, 19, "▄█▄", KEYS[FACE]); g.text(X, 20, "▀█▀", KEYS[FACE]); g.set(X, 19, "▄", KEYS[FACE + 1]); }
    }
    g.text(cx - 7, 21, "▄▄", KEYS[FACE + 2]); g.text(cx + 6, 21, "▄▄", KEYS[FACE + 2]);
    if (happy) { g.text(cx - 2, 21, "▀▄▄▀", KEYS[FACE]); g.text(cx - 1, 22, "▀▀", KEYS[FACE + 2]); }
    else if (p > 0.9 && p < 1.5) g.text(cx - 1, 21, "▄▄", KEYS[FACE]);
    else g.text(cx - 1, 21, "▀▀", KEYS[FACE]);
    // water drop
    if (p < 1.2) {
      const dy = 1 + p * p * 10;
      g.set(cx + 1, Math.min(dy, stemTop - 1), "●", KEYS[DROP]); g.set(cx + 1, Math.min(dy, stemTop - 1) - 1, "▲", KEYS[DROP + 1]);
    } else if (p < 1.6) { g.set(cx - 1, stemTop - 1, "·", KEYS[DROP + 1]); g.set(cx + 3, stemTop - 1, "·", KEYS[DROP + 1]); }
    // sparkles around the new leaf
    if (happy) for (let i = 0; i < 4; i++) {
      const a = t * 1.2 + i * 1.57, r = 9 + Math.sin(t * 2 + i) * 1.5;
      g.set(cx + Math.cos(a) * r, 8 + Math.sin(a) * r * 0.45, i % 2 ? "+" : "·", KEYS[SPARK + (i % 2)]);
    }
    if (sleepy) { const zy = 13 - ((p + 1.4) % 10) * 2; g.text(cx + 10, Math.round(clamp(zy, 4, 14)), "z", KEYS[FACE + 1]); }
    return g.frame();
  };
}
