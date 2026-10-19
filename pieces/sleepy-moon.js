/* sleepy-moon: a crescent moon in a striped nightcap rocks gently in the night sky, snoring little z's past drifting clouds. */
import { Grid, palette, gradient, KEYS, fbm, clamp, rng } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const SKY = add(gradient(["#04061a", "#080e2c", "#0e1840", "#162456", "#20326a"], 10));
const STAR = add(["#6a7ab0", "#c8d4ff", "#ffffff"]);
const CLOUD = add(gradient(["#1e2a52", "#2e3c68", "#42527e"], 3));
const MOON = add(gradient(["#a88a2a", "#c8a63a", "#e4c45a", "#f4dc80", "#fff0b0", "#fffadc"], 10));
const CAP = add(["#b8263a", "#e04a5a", "#f4f0f4", "#c8c4d8"]);
const FACE = add(["#5a4010", "#ff9a8a"]);
const ZZ = add(["#8aa0e0", "#c8d8ff", "#ffffff"]);

export const meta = {
  slug: "sleepy-moon",
  name: "Drowsy Crescent Moon",
  category: "mascots",
  note: "A crescent moon in a striped nightcap rocks gently in the night sky, snoring little z's as soft clouds drift past below.",
  tags: ["moon", "mascot", "sleep", "night", "404", "loader"],
  cols: 60, rows: 28, fps: 20,
  palette: palette(P),
};

const ell = (g, cx, cy, rx, ry, fn) => {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy;
    if (d <= 1) fn(x, y, dx, dy, d);
  }
};
const BIGZ = ["▀▀█", "▄▀ ", "█▄▄"];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const bg = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const v = clamp(0.2 + (y / rows) * 0.45 + Math.exp(-Math.hypot((x - 24) / 2, y - 13) / 10) * 0.35 + (fbm(x * 0.06, y * 0.14, 3, 3) - 0.5) * 0.2);
    bg.push([" ░▒▓"[1 + Math.min(2, Math.floor(v * 3))], KEYS[SKY + Math.min(9, Math.floor(v * 10))]]);
  }
  const r = rng(31);
  for (let i = 0; i < 30; i++) { const x = Math.floor(r() * cols), y = Math.floor(r() * rows), b = Math.floor(r() * 3); bg[x + y * cols] = [b === 2 ? "+" : "·", KEYS[STAR + b]]; }
  return (t) => {
    for (let i = 0; i < bg.length; i++) { g.ch[i] = bg[i][0]; g.co[i] = bg[i][1]; }
    // clouds drifting low
    for (const [ox, cy, w, sp] of [[0, 23, 12, 1.4], [38, 25, 14, 1.0], [70, 21, 9, 1.8]]) {
      const cx = ((ox + t * sp) % (cols + 30)) - 15;
      ell(g, cx, cy, w, 2, (x, y, dx, dy) => g.set(x, y, "█", KEYS[CLOUD + (dy < -0.2 ? 2 : 1)]));
      ell(g, cx + w * 0.25, cy - 1.4, w * 0.5, 1.6, (x, y, dx, dy) => g.set(x, y, "█", KEYS[CLOUD + (dy < 0 ? 2 : 1)]));
    }
    const rock = Math.sin(t * 0.9);
    const cx = 24 + rock * 0.8, cy = 15.5 + Math.sin(t * 1.8) * 0.3;
    const ox = cx + 8 + rock * 0.6, oy = cy - 2.5;
    // crescent: outer ellipse minus an offset inner ellipse
    ell(g, cx, cy, 19, 9, (x, y, dx, dy, d) => {
      const ix = (x + 0.5 - ox) / 16, iy = (y + 0.5 - oy) / 8.5;
      if (ix * ix + iy * iy <= 1) return;
      const crater = fbm(x * 0.25, y * 0.5, 2, 7) > 0.62;
      const lit = clamp(0.55 - dx * 0.35 - dy * 0.25 + Math.sqrt(1 - d) * 0.3);
      g.set(x, y, crater ? "▓" : "█", KEYS[MOON + Math.min(9, Math.max(0, Math.floor(lit * 10) - (crater ? 2 : 0)))]);
    });
    // face on the thick part of the crescent
    const fx = Math.round(cx - 15), fy = Math.round(cy - 1);
    g.text(fx, fy, "▀▄▄▀", KEYS[FACE]);
    g.text(fx - 2, fy + 2, "▄▄", KEYS[FACE + 1]);
    const snore = (Math.sin(t * 1.8) + 1) / 2;
    if (snore > 0.6) { g.text(fx + 1, fy + 3, "▄▄", KEYS[FACE]); g.text(fx + 1, fy + 4, "▀▀", KEYS[FACE]); }
    else g.text(fx + 1, fy + 3, "▀▀", KEYS[FACE]);
    // nightcap on the top horn: a striped cone leaning right with a pom-pom
    const baseY = Math.round(cy - 8.5), baseX = cx - 10;
    for (let k = 0; k < 7; k++) {
      const w = 7 - k;
      const sway = Math.sin(t * 1.2 - k * 0.3) * (k / 7) * 1.5;
      const x0 = baseX - w + k * 2.2 + sway, y = baseY - k;
      for (let i = 0; i <= w * 2; i++) g.set(x0 + i, y, "█", KEYS[CAP + (k % 2 ? 2 : 0)]);
    }
    for (let x = baseX - 8; x <= baseX + 8; x++) g.set(x, baseY + 1, "█", KEYS[CAP + 2 + (x % 2)]);
    const tipX = baseX + 7 * 2.2 + Math.sin(t * 1.2 - 2.1) * 1.5 + 2, tipY = baseY - 6 + 1;
    for (let k = 0; k < 4; k++) g.set(tipX - 1 + k, tipY + k * 0.5, "█", KEYS[CAP + (k % 2)]);
    ell(g, tipX + 4, tipY + 2.5, 2, 1.2, (x, y, dx, dy) => g.set(x, y, "█", KEYS[CAP + 2 + (dy > 0 ? 1 : 0)]));
    // snoring z's float up and to the right
    for (let i = 0; i < 3; i++) {
      const a = ((t / 4 + i / 3) % 1);
      const zx = Math.round(cx + 6 + a * 18 + Math.sin(a * 6 + i) * 1.2), zy = Math.round(cy + 2 - a * 12);
      const key = KEYS[ZZ + (a < 0.3 ? 2 : a < 0.7 ? 1 : 0)];
      if (a > 0.5) g.block(zx, zy - 1, BIGZ.join("\n"), key);
      else g.set(zx, zy, a > 0.2 ? "Z" : "z", key);
    }
    return g.frame();
  };
}
