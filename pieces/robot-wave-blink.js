/* robot-wave-blink: a friendly tin robot waves hello, blinks its round screen eyes and flashes its antenna light. */
import { Grid, palette, gradient, KEYS, fbm, clamp, smooth } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const BG = add(gradient(["#08141a", "#0e232a", "#16343c", "#20464c", "#2c5858"], 10));
const FLOOR = add(gradient(["#0e1416", "#1a2428", "#26343a", "#34464c"], 4));
const METAL = add(gradient(["#2e3a4a", "#4a5a6e", "#6e8298", "#96aabe", "#c2d2e0", "#eef6fc"], 12));
const DARK = add(["#141c26", "#222c38", "#34404e"]);
const EYE = add(["#2ab8e0", "#6ae8ff", "#d0faff", "#ffffff"]);
const RED = add(["#ff4a4a", "#ff9a9a", "#5a1a1a"]);
const ACC = add(["#ffb43a", "#7ee787", "#ffd47a"]);

export const meta = {
  slug: "robot-wave-blink",
  name: "Waving Tin Robot",
  category: "mascots",
  note: "A friendly tin robot waves hello with one arm, blinks its round screen eyes and flashes the light on its antenna.",
  tags: ["robot", "mascot", "wave", "cute", "404", "empty-state"],
  cols: 64, rows: 30, fps: 24,
  palette: palette(P),
};

const ell = (g, cx, cy, rx, ry, fn) => {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy;
    if (d <= 1) fn(x, y, dx, dy, d);
  }
};
const limb = (cx0, cy0, cx1, cy1, r, fn) => {
  const n = Math.ceil(Math.hypot(cx1 - cx0, (cy1 - cy0) * 2) * 2) + 1;
  for (let i = 0; i <= n; i++) {
    const u = i / n, x = cx0 + (cx1 - cx0) * u, y = cy0 + (cy1 - cy0) * u;
    for (let yy = Math.floor(y - r); yy <= y + r; yy++) for (let xx = Math.floor(x - r); xx <= x + r; xx++)
      if (Math.hypot(xx + 0.5 - x, (yy + 0.5 - y) * 2) <= r) fn(xx, yy, u);
  }
};
const rbox = (g, x0, y0, w, h, fn) => {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    const u = ((x - x0) / (w - 1)) * 2 - 1, v = ((y - y0) / (h - 1)) * 2 - 1;
    if ((x === x0 || x === x0 + w - 1) && (y === y0 || y === y0 + h - 1)) continue;
    fn(x, y, u, v, x === x0 || x === x0 + w - 1 || y === y0 || y === y0 + h - 1);
  }
};
const metal = (u, v, edge) => [edge ? "▓" : "█", KEYS[METAL + Math.min(11, Math.max(0, Math.floor(clamp(0.62 - v * 0.3 - u * 0.22) * 12) - (edge ? 3 : 0)))]];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const bg = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    if (y >= 26) { bg.push([(x + y) % 3 ? "▓" : "▒", KEYS[FLOOR + (y === 26 ? 3 : 1 + ((x >> 3) + y) % 2)]]); continue; }
    const v = clamp(0.12 + Math.exp(-Math.hypot((x - 32) / 2, y - 12) / 12) * 0.75 + (fbm(x * 0.06, y * 0.12, 3, 4) - 0.5) * 0.2);
    bg.push([" ░▒▓"[1 + Math.min(2, Math.floor(v * 3))], KEYS[BG + Math.min(9, Math.floor(v * 10))]]);
  }
  return (t) => {
    for (let i = 0; i < bg.length; i++) { g.ch[i] = bg[i][0]; g.co[i] = bg[i][1]; }
    const p = t % 6;
    const w = p < 0.5 ? smooth(p / 0.5) : p < 3.4 ? 1 : p < 3.9 ? 1 - smooth((p - 3.4) / 0.5) : 0;
    const bob = Math.round(Math.sin(t * 2.2) * 0.6);
    // shadow on the floor
    ell(g, 32, 27, 13, 1.2, (x, y) => g.set(x, y, "▓", KEYS[FLOOR]));
    // legs and feet
    for (const lx of [27, 35]) {
      for (let y = 23; y < 26; y++) g.text(lx, y, "▐█▌", KEYS[METAL + 4 + (y % 2)]);
      g.text(lx - 1, 26, "▄███▄", KEYS[METAL + 6]);
    }
    // body
    const by = 15 + bob;
    rbox(g, 23, by, 18, 10, (x, y, u, v, e) => { const [c, k] = metal(u, v, e); g.set(x, y, c, k); });
    rbox(g, 26, by + 2, 12, 5, (x, y) => g.set(x, y, "█", KEYS[DARK]));
    for (let i = 0; i < 4; i++) {
      const h = 1 + Math.floor((Math.sin(t * 3.1 + i * 1.7) * 0.5 + 0.5) * 3);
      for (let k = 0; k < h; k++) g.set(28 + i * 2, by + 5 - k, "▆", KEYS[ACC + 1]);
    }
    g.set(35, by + 3, "♥", KEYS[RED]);
    g.text(27, by + 8, "● ● ●", KEYS[ACC]);
    // neck
    g.text(29, by - 1, "▓▓▓▓▓▓", KEYS[DARK + 2]);
    // arms
    const sl = [22, by + 2], sr = [41, by + 2];
    const restHand = [17.5, by + 8];
    limb(sl[0], sl[1], restHand[0], restHand[1], 1.3, (x, y) => g.set(x, y, "█", KEYS[METAL + 5]));
    ell(g, restHand[0], restHand[1] + 0.4, 1.8, 1.1, (x, y, dx, dy) => g.set(x, y, "█", KEYS[METAL + (dy < 0 ? 8 : 6)]));
    const ph1 = 0.3 + w * 1.45, ph2 = 0.5 + w * (2.34 + Math.sin(t * 9) * 0.42);
    const ex = sr[0] + Math.sin(ph1) * 7, ey = sr[1] + Math.cos(ph1) * 3.5;
    const hx = ex + Math.sin(ph2) * 9, hy = ey + Math.cos(ph2) * 4.5;
    limb(sr[0], sr[1], ex, ey, 1.3, (x, y) => g.set(x, y, "█", KEYS[METAL + 7]));
    limb(ex, ey, hx, hy, 1.2, (x, y) => g.set(x, y, "█", KEYS[METAL + 8]));
    ell(g, hx, hy, 2.3, 1.5, (x, y, dx, dy) => g.set(x, y, "█", KEYS[METAL + (dy < 0 ? 10 : 8)]));
    if (w > 0.8) { const s = Math.sin(t * 9) > 0 ? 1 : -1; g.set(hx + 3 * s, hy - 1, s > 0 ? ")" : "(", KEYS[EYE + 2]); g.set(hx + 4 * s, hy - 1, s > 0 ? ")" : "(", KEYS[EYE + 1]); }
    // head
    const hy0 = 4 + bob;
    for (const sx of [18, 44]) { g.text(sx, hy0 + 4, "▐█", KEYS[METAL + 3]); g.text(sx, hy0 + 5, "▐█", KEYS[METAL + 2]); }
    rbox(g, 20, hy0, 24, 10, (x, y, u, v, e) => { const [c, k] = metal(u, v, e); g.set(x, y, c, k); });
    rbox(g, 22, hy0 + 1, 20, 7, (x, y, u, v, e) => g.set(x, y, "█", KEYS[DARK + (e ? 1 : 0)]));
    // antenna with blinking light
    g.vline(32, hy0 - 2, hy0 - 1, "│", KEYS[METAL + 6]);
    const on = Math.floor(t * 2) % 2 === 0;
    g.text(31, hy0 - 3, "▄█▄", KEYS[on ? RED : RED + 2]);
    if (on) { g.set(29, hy0 - 3, "-", KEYS[RED + 1]); g.set(35, hy0 - 3, "-", KEYS[RED + 1]); }
    // eyes
    const bp = t % 4.1;
    const one = (c) => { const d = Math.abs(bp - c); return d < 0.13 ? 1 - d / 0.13 : 0; };
    const blink = Math.max(one(2.2), Math.floor(t / 4.1) % 2 ? one(2.55) : 0);
    const look = w > 0.5 ? 0 : Math.sin(t * 0.9) * 0.8;
    for (const cx of [27, 37]) {
      const ry = 2.3 * (1 - blink), cy = hy0 + 4.2;
      if (ry < 0.7) { g.text(cx - 3, Math.round(cy), "▀▀▀▀▀▀", KEYS[EYE]); continue; }
      if (w > 0.85) { g.text(cx - 2, Math.round(cy) - 1, "▄▀▀▄", KEYS[EYE + 1]); g.text(cx - 3, Math.round(cy), "▀    ▀", KEYS[EYE + 1]); continue; }
      ell(g, cx, cy, 3.3, ry, (x, y, dx, dy, d) => g.set(x, y, "█", KEYS[EYE + (d > 0.6 ? 0 : 1)]));
      ell(g, cx + look * 1.2, cy + 0.3, 1.2, ry * 0.45, (x, y) => g.set(x, y, "█", KEYS[DARK]));
      g.set(cx + look * 1.2 - 1, cy - 1, "█", KEYS[EYE + 3]);
    }
    // mouth and cheeks
    const my = hy0 + 7;
    if (w > 0.5) g.text(29, my, "▀▄▄▄▄▀", KEYS[EYE + 1]); else g.text(29, my, "▀▀▀▀▀▀", KEYS[EYE]);
    g.text(23, my, "▄▄", KEYS[RED + 1]); g.text(39, my, "▄▄", KEYS[RED + 1]);
    return g.frame();
  };
}
