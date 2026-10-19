/* cool-sun-shades: a grinning sun in sunglasses bobs over the beach with turning rays, now and then sliding its shades down to wink. */
import { Grid, palette, gradient, KEYS, fbm, clamp, smooth, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const SKY = add(gradient(["#1a6ac8", "#3a8ade", "#62a8ec", "#8ec4f4", "#bcdcf8", "#f4e4c0"], 10));
const SEA = add(gradient(["#0a4a8a", "#1268a8", "#2a88c4", "#56aada"], 4));
const SAND = add(gradient(["#c89a5a", "#dcb472", "#ecca8e", "#f8e0b0"], 4));
const SUN = add(gradient(["#e86a0a", "#f48a14", "#fcaa22", "#ffc83a", "#ffe066", "#fff4a8"], 10));
const RAY = add(["#ff9a1a", "#ffc02a", "#ffe066"]);
const SHADE = add(["#0a0a12", "#24243a", "#5a6aa0", "#ffffff"]);
const FACE = add(["#7a2a0a", "#ff6a4a", "#ffffff", "#c8341a"]);
const CLOUD = add(["#ffffff", "#e4eef8"]);

export const meta = {
  slug: "cool-sun-shades",
  name: "Sun in Sunglasses",
  category: "mascots",
  note: "A grinning sun in dark sunglasses bobs over the beach as its rays turn, now and then sliding the shades down its nose to give you a wink.",
  tags: ["sun", "mascot", "summer", "beach", "cool", "hero"],
  cols: 64, rows: 30, fps: 24,
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
    if (y >= 26) { bg.push([fbm(x * 0.2, y, 2, 2) > 0.55 ? "▓" : "█", KEYS[SAND + Math.min(3, y - 26)]]); continue; }
    if (y >= 23) { bg.push(["█", KEYS[SEA + (y - 23)]]); continue; }
    const v = clamp(y / 23 + (fbm(x * 0.05, y * 0.2, 2, 5) - 0.5) * 0.15);
    bg.push(["█", KEYS[SKY + Math.min(9, Math.floor(v * 10))]]);
  }
  return (t) => {
    for (let i = 0; i < bg.length; i++) { g.ch[i] = bg[i][0]; g.co[i] = bg[i][1]; }
    // sea waves rolling in
    for (let x = 0; x < cols; x++) { const w = Math.sin(x * 0.4 - t * 2.5); if (w > 0.6) g.set(x, 23 + (w > 0.9 ? 0 : 1), "▀", KEYS[SEA + 3]); if (Math.sin(x * 0.3 + t * 1.5) > 0.8) g.set(x, 25, "▄", KEYS[CLOUD]); }
    // a cloud drifting by
    const kx = ((t * 2) % (cols + 24)) - 12;
    ell(g, kx, 4, 6, 1.4, (x, y, dx, dy) => g.set(x, y, "█", KEYS[CLOUD + (dy > 0.3 ? 1 : 0)]));
    ell(g, kx + 2, 3, 3.5, 1.2, (x, y) => g.set(x, y, "█", KEYS[CLOUD]));
    const cx = 32, cy = 12.5 + Math.sin(t * 3.2) * 0.5;
    // rays: alternating long and short wedges, turning
    const rot = t * 0.5;
    for (let k = 0; k < 12; k++) {
      const a = rot + (k / 12) * TAU, len = k % 2 ? 4 : 6;
      for (let s = 0; s <= len; s += 0.5) for (let w = -1; w <= 1; w++) {
        const r = 11 + s, ww = (1 - s / len) * 1.6 * w;
        const ca = Math.cos(a), sa = Math.sin(a);
        g.set(cx + ca * r * 1.0 - sa * ww, cy + (sa * r + ca * ww) * 0.5, "█", KEYS[RAY + (s < 2 ? 2 : s < 4 ? 1 : 0)]);
      }
    }
    // sun disc
    ell(g, cx, cy, 13, 6.6, (x, y, dx, dy, d) => {
      const lit = clamp(0.55 - dy * 0.3 - dx * 0.25 + Math.sqrt(1 - d) * 0.35);
      g.set(x, y, d > 0.86 ? "▓" : "█", KEYS[SUN + Math.min(9, Math.floor(lit * 10))]);
    });
    // timeline of the wink: shades slide down 3.4-3.8, wink 4.0-4.4, back up 4.8-5.2
    const p = t % 6.5;
    const down = p < 3.4 ? 0 : p < 3.8 ? smooth((p - 3.4) / 0.4) : p < 4.8 ? 1 : p < 5.2 ? 1 - smooth((p - 4.8) / 0.4) : 0;
    const wink = p > 4 && p < 4.45;
    const ey = Math.round(cy - 1.5);
    // eyes underneath
    if (down > 0.3) {
      g.text(cx - 7, ey, "▄█▄", KEYS[FACE]); g.text(cx - 7, ey + 1, "▀█▀", KEYS[FACE]); g.set(cx - 7, ey, "▄", KEYS[FACE + 2]);
      if (wink) g.text(cx + 4, ey + 1, "▀▀▀", KEYS[FACE]);
      else { g.text(cx + 4, ey, "▄█▄", KEYS[FACE]); g.text(cx + 4, ey + 1, "▀█▀", KEYS[FACE]); g.set(cx + 4, ey, "▄", KEYS[FACE + 2]); }
    }
    // sunglasses
    const sy = ey - 1 + Math.round(down * 2);
    g.text(cx - 13, sy, "▀▄", KEYS[SHADE]); g.text(cx + 11, sy, "▄▀", KEYS[SHADE]);
    g.text(cx - 11, sy, "▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄", KEYS[SHADE]);
    for (const lx of [cx - 10, cx + 2]) {
      g.text(lx, sy + 1, "████████", KEYS[SHADE]);
      g.text(lx + 1, sy + 2, "▀████▀", KEYS[SHADE]);
      g.text(lx + 1, sy + 1, "▄", KEYS[SHADE + 3]); g.text(lx + 2, sy + 1, "▄", KEYS[SHADE + 2]);
    }
    g.text(cx - 2, sy + 1, "▀▀▀▀", KEYS[SHADE + 1]);
    // cheeks and grin
    g.text(cx - 11, Math.round(cy + 2), "▄▄", KEYS[FACE + 1]); g.text(cx + 9, Math.round(cy + 2), "▄▄", KEYS[FACE + 1]);
    const my = Math.round(cy + 3);
    g.text(cx - 5, my, "▀▄▄▄▄▄▄▄▄▀", KEYS[FACE]);
    g.text(cx - 3, my + 1, "▀▀▀▀▀▀", KEYS[wink ? FACE + 3 : FACE]);
    if (wink) g.text(cx - 1, my + 1, "▀▀", KEYS[FACE + 3]);
    return g.frame();
  };
}
