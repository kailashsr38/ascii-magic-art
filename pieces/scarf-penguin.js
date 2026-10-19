/* scarf-penguin: a round penguin in a striped red scarf stands in falling snow, flapping its flippers and hopping to keep warm. */
import { Grid, palette, gradient, KEYS, fbm, clamp, rng } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const SKY = add(gradient(["#4a5a8e", "#5a6c9e", "#6e80b0", "#8494c0", "#9aaad0", "#b4c2de"], 10));
const HILL = add(gradient(["#7a90b4", "#98acca", "#b8c8e0", "#d8e4f2", "#f0f6fc"], 6));
const PINE = add(["#0e2a2a", "#163a36", "#e8f0f8"]);
const BODY = add(gradient(["#0a0e1a", "#141a2a", "#1e263a", "#2c364e", "#3e4a66"], 6));
const BELLY = add(gradient(["#b8c4d4", "#d4dce8", "#eef2f8", "#ffffff"], 4));
const BEAK = add(["#e0701a", "#ffa03a"]);
const SCARF = add(["#a01a28", "#d42a3a", "#ff5a5a", "#f4f0e8"]);
const EYE = add(["#ffffff", "#05060a"]);
const PINK = add(["#ff8aa0"]);
const SNOW = add(["#a8b8d0", "#ffffff"]);

export const meta = {
  slug: "scarf-penguin",
  name: "Penguin in a Scarf",
  category: "mascots",
  note: "A round penguin in a striped red scarf stands in the falling snow, its scarf tail flapping in the wind as it hops and flaps to keep warm.",
  tags: ["penguin", "mascot", "winter", "snow", "cute", "seasonal"],
  cols: 56, rows: 30, fps: 24,
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
  const back = (x) => 15 + Math.sin(x * 0.1 + 1) * 2.2;
  const front = (x) => 25 + Math.sin(x * 0.13) * 0.8;
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    if (y >= front(x)) { bg.push(["█", KEYS[HILL + Math.min(5, 3 + Math.floor((y - front(x)) * 0.6))]]); continue; }
    if (y >= back(x)) { const v = clamp(0.35 + (y - back(x)) * 0.04 + (fbm(x * 0.1, y * 0.3, 2, 6) - 0.5) * 0.3); bg.push([v > 0.5 ? "█" : "▓", KEYS[HILL + Math.min(5, Math.floor(v * 4))]]); continue; }
    const v = clamp(y / 17 + (fbm(x * 0.06, y * 0.15, 3, 2) - 0.5) * 0.25);
    bg.push(["█", KEYS[SKY + Math.min(9, Math.floor(v * 10))]]);
  }
  // pine trees on the back hill
  for (const px of [6, 12, 45, 51]) {
    const base = Math.floor(back(px)) + 1;
    for (let k = 0; k < 7; k++) { const w = Math.floor(k / 2) + 1; for (let d = -w; d <= w; d++) { const x = px + d, y = base - 7 + k; if (x >= 0 && x < cols) bg[x + y * cols] = ["█", KEYS[k % 2 && Math.abs(d) === w ? PINE + 2 : PINE + (d < 0 ? 1 : 0)]]; } }
  }
  const r = rng(9);
  const flakes = Array.from({ length: 40 }, () => [r() * cols, r() * rows, 0.6 + r() * 0.8, r() * 6.28]);
  return (t) => {
    for (let i = 0; i < bg.length; i++) { g.ch[i] = bg[i][0]; g.co[i] = bg[i][1]; }
    const p = t % 6;
    const hop = p > 4 && p < 4.5 ? Math.sin(((p - 4) / 0.5) * Math.PI) * 2 : p > 4.6 && p < 5.1 ? Math.sin(((p - 4.6) / 0.5) * Math.PI) * 2 : 0;
    const flap = p > 3.6 && p < 5.3 ? Math.sin(t * 16) : Math.sin(t * 1.5) * 0.15;
    const cx = 27, base = 25 - hop;
    // shadow
    ell(g, cx, 25.4, 8 - hop, 0.8, (x, y) => g.set(x, y, "▀", KEYS[HILL + 1]));
    // feet
    g.text(cx - 5, Math.round(base), "▄██▄", KEYS[BEAK]); g.text(cx + 1, Math.round(base), "▄██▄", KEYS[BEAK]);
    // flippers
    for (const s of [-1, 1]) {
      const a = 0.35 + flap * 0.5;
      for (let k = 0; k < 7; k++) {
        const x = cx + s * (8.5 + Math.sin(a) * k * 0.9), y = base - 11 + k * Math.cos(a) * 0.9;
        g.text(Math.round(x) - (s < 0 ? 1 : 0), Math.round(y), "██", KEYS[BODY + 3 - Math.floor(k / 3)]);
      }
    }
    // body
    ell(g, cx, base - 8, 9.5, 8, (x, y, dx, dy, d) => {
      const belly = Math.hypot(dx / 0.7, (dy - 0.25) / 0.78) < 1;
      const lit = clamp(0.55 - dx * 0.3 - dy * 0.2 + Math.sqrt(1 - d) * 0.3);
      g.set(x, y, "█", belly ? KEYS[BELLY + Math.min(3, Math.floor(lit * 4.5))] : KEYS[BODY + Math.min(5, Math.floor(lit * 6))]);
    });
    // head
    const hy = base - 17;
    ell(g, cx, hy, 8, 4.8, (x, y, dx, dy, d) => {
      const face = Math.hypot((Math.abs(dx) - 0.32) / 0.3, (dy - 0.2) / 0.6) < 1;
      const lit = clamp(0.6 - dx * 0.3 - dy * 0.3 + Math.sqrt(1 - d) * 0.3);
      g.set(x, y, "█", face ? KEYS[BELLY + 2 + (dx < 0 ? 1 : 0)] : KEYS[BODY + Math.min(5, Math.floor(lit * 6))]);
    });
    // eyes
    const blink = Math.abs((t % 3.4) - 1.9) < 0.12;
    for (const ex of [cx - 3, cx + 3]) {
      const X = Math.round(ex - 1), Y = Math.round(hy - 1);
      if (blink) { g.text(X, Y + 1, "▀▀", KEYS[EYE + 1]); continue; }
      g.text(X, Y, "▄▄", KEYS[EYE + 1]); g.text(X, Y + 1, "██", KEYS[EYE + 1]); g.set(X, Y, "▄", KEYS[EYE]);
    }
    g.text(cx - 6, Math.round(hy + 1.5), "▄", KEYS[PINK]); g.text(cx + 5, Math.round(hy + 1.5), "▄", KEYS[PINK]);
    g.text(cx - 1, Math.round(hy + 1), "▄▄", KEYS[BEAK + 1]); g.text(cx - 1, Math.round(hy + 2), "▀▀", KEYS[BEAK]);
    // scarf around the neck
    const sy = Math.round(hy + 4);
    for (let x = cx - 8; x <= cx + 8; x++) { g.set(x, sy, "█", KEYS[SCARF + (Math.floor((x - cx + 8) / 2) % 2 ? 3 : 1)]); g.set(x, sy + 1, "▀", KEYS[SCARF]); }
    // scarf tail flapping in the wind to the right
    for (let k = 0; k < 10; k++) {
      const u = k / 9;
      const x = cx + 5 + k * 1.3, y = sy + 1 + u * 2 + Math.sin(t * 9 - k * 0.8) * u * 1.3;
      g.text(Math.round(x), Math.round(y), "██", KEYS[SCARF + (Math.floor(k / 2) % 2 ? 3 : 2)]);
    }
    for (let k = 0; k < 3; k++) g.set(cx + 18 + k * 0.6, sy + 3 + Math.sin(t * 9 - 9) * 1.3 + k * 0.5 - 1, "▖", KEYS[SCARF + 3]);
    // snow blowing right
    for (const [fx, fy, sp, ph] of flakes) {
      const y = (fy + t * sp * 3) % rows, x = ((fx + t * sp * 2 + Math.sin(t + ph) * 1.5) % cols + cols) % cols;
      g.set(x, y, sp > 1.0 ? "█" : "▓", KEYS[SNOW + (sp > 0.9 ? 1 : 0)]);
    }
    return g.frame();
  };
}
