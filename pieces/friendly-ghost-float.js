/* friendly-ghost-float: a round little ghost bobs over a misty graveyard, waving its stubby arms and blinking shyly. */
import { Grid, palette, gradient, KEYS, fbm, clamp, rng } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const SKY = add(gradient(["#0a0618", "#160c2c", "#24143e", "#341e52", "#462a62"], 10));
const MIST = add(gradient(["#4a3a6a", "#6a5a8a", "#8a7aa8"], 3));
const HILL = add(gradient(["#06040c", "#0e0a18", "#181226"], 3));
const STONE = add(["#2a2638", "#3a3650", "#4a4662"]);
const MOON = add(["#d8d4b8", "#f4f0d8"]);
const GHOST = add(gradient(["#6a6a9a", "#9898c4", "#c4c4e4", "#e4e4f6", "#ffffff"], 10));
const EYE = add(["#14102a", "#ffffff"]);
const PINK = add(["#ff9ab8", "#ffc4d6"]);

export const meta = {
  slug: "friendly-ghost-float",
  name: "Friendly Floating Ghost",
  category: "mascots",
  note: "A round little ghost bobs above a misty graveyard, waving its stubby arms, rippling its hem and blinking shyly.",
  tags: ["ghost", "mascot", "halloween", "cute", "404", "empty-state"],
  cols: 60, rows: 28, fps: 24,
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
  const r = rng(7);
  const stars = Array.from({ length: 18 }, () => [Math.floor(r() * cols), Math.floor(r() * 12)]);
  const hill = (x) => 22 + Math.sin(x * 0.11) * 1.2 + Math.sin(x * 0.27 + 1) * 0.6;
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    if (y >= hill(x)) { bg.push([y - hill(x) < 1 ? "▄" : "█", KEYS[HILL + (y - hill(x) < 1 ? 2 : y > 25 ? 0 : 1)]]); continue; }
    const md = Math.hypot((x - 50) / 2, y - 4);
    const v = clamp(0.3 + (y / 22) * 0.4 + Math.exp(-md / 6) * 0.5 + (fbm(x * 0.07, y * 0.15, 3, 3) - 0.5) * 0.2);
    bg.push([" ░▒▓"[1 + Math.min(2, Math.floor(v * 3))], KEYS[SKY + Math.min(9, Math.floor(v * 10))]]);
  }
  for (const [x, y] of stars) bg[x + y * cols] = ["·", KEYS[MIST + 2]];
  // moon
  for (let y = 1; y < 8; y++) for (let x = 44; x < 57; x++) {
    const dx = (x + 0.5 - 50) / 5, dy = (y + 0.5 - 4) / 2.6;
    if (dx * dx + dy * dy <= 1) bg[x + y * cols] = ["█", KEYS[MOON + (dx < 0.2 ? 1 : 0)]];
  }
  // headstones
  for (const [sx, h] of [[5, 3], [14, 2], [44, 3], [53, 2]]) {
    const top = Math.floor(hill(sx + 2)) - h;
    for (let y = top; y < top + h + 1; y++) for (let x = sx; x < sx + 4; x++) {
      const c = y === top && (x === sx || x === sx + 3) ? "▄" : "█";
      bg[x + y * cols] = [c, KEYS[STONE + (x === sx ? 2 : 1)]];
    }
    bg[sx + 1 + (top + 1) * cols] = ["┼", KEYS[STONE]];
  }
  return (t) => {
    for (let i = 0; i < bg.length; i++) { g.ch[i] = bg[i][0]; g.co[i] = bg[i][1]; }
    // drifting mist
    for (let y = 18; y < 25; y++) for (let x = 0; x < cols; x++) {
      const m = fbm(x * 0.08 - t * 0.35, y * 0.4, 3, 9);
      if (m > 0.55) g.set(x, y, m > 0.66 ? "▒" : "░", KEYS[MIST + (m > 0.66 ? 1 : 0)]);
    }
    const cx = 30 + Math.sin(t * 0.785) * 4, cy = 11 + Math.sin(t * 1.57) * 1.3;
    // shadow
    const sw = 7 - (cy - 9.7) * 0.8;
    ell(g, cx, 24.5, sw, 0.9, (x, y) => g.set(x, y, "▓", KEYS[HILL]));
    // arms
    const wave = Math.sin(t * 6.28);
    const arms = [[-1, 0.3 + Math.sin(t * 3.14) * 0.3], [1, -0.6 + wave * 0.9]];
    for (const [s, lift] of arms) {
      const ax = cx + s * 11.5, ay = cy + 2.2 + lift * -1.6;
      ell(g, ax, ay, 2.6, 1.3, (x, y, dx, dy) => g.set(x, y, "█", KEYS[GHOST + (dy < 0 ? 8 : 6)]));
    }
    // body: dome on top, wavy hem below
    const top = cy - 9, base = cy + 5.5;
    for (let y = Math.floor(top); y <= base + 2; y++) for (let x = Math.floor(cx - 12); x <= cx + 12; x++) {
      const dx = (x + 0.5 - cx) / 11;
      let ok;
      if (y + 0.5 < cy) ok = dx * dx + ((y + 0.5 - cy) / 9) ** 2 <= 1;
      else ok = Math.abs(dx) <= 1 + (y - cy) * 0.015 && y + 0.5 <= base + Math.sin((x - cx) * 0.95 - t * 6.28) * 1.3;
      if (!ok) continue;
      const vy = (y - top) / 15;
      const lit = clamp(0.95 - vy * 0.45 - dx * 0.3 - dx * dx * 0.25);
      g.set(x, y, Math.abs(dx) > 0.88 ? "▓" : "█", KEYS[GHOST + Math.min(9, Math.floor(lit * 10))]);
    }
    // face
    const bp = t % 4;
    const blink = Math.abs(bp - 3.1) < 0.14 || Math.abs(bp - 3.45) < 0.12;
    const ey = cy - 2.5, lookX = Math.sin(t * 0.785) * 0.7;
    for (const ex of [cx - 4.2, cx + 4.2]) {
      if (blink) { g.text(Math.round(ex - 1.5), Math.round(ey), "▀▀▀", KEYS[EYE]); continue; }
      ell(g, ex + lookX, ey, 1.7, 2.2, (x, y) => g.set(x, y, "█", KEYS[EYE]));
      g.set(ex + lookX - 0.6, ey - 1.2, "▀", KEYS[EYE + 1]);
    }
    for (const ex of [cx - 7.5, cx + 6.5]) g.text(Math.round(ex), Math.round(ey + 2), "▄▄", KEYS[PINK]);
    const open = Math.sin(t * 1.57) > 0.4;
    const mx = Math.round(cx - 1), my = Math.round(ey + 3);
    if (open) { g.text(mx, my, "▄▄", KEYS[EYE]); g.text(mx, my + 1, "▀▀", KEYS[EYE]); }
    else g.text(mx, my, "▀▀", KEYS[EYE]);
    return g.frame();
  };
}
