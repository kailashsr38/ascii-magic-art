/* laptop-typing-cat: a grey tabby taps away at a laptop late at night, eyes following the code it writes. */
import { Grid, palette, gradient, KEYS, fbm, clamp, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const WALL = add(gradient(["#06080e", "#0c1220", "#141e32", "#1e2c46", "#2a3c5a"], 10));
const DESK = add(gradient(["#1e120a", "#2e1c10", "#422a18", "#583a22"], 4));
const LAP = add(gradient(["#22262e", "#3a404c", "#5a6270", "#8a94a4", "#b8c2d0"], 5));
const SCR = add(["#0a1018", "#0e1622"]);
const CODE = add(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#d2a8ff", "#ff7b72"]);
const FUR = add(gradient(["#2a2a32", "#44444e", "#62626e", "#84848e", "#a8a8b2"], 10));
const STRIPE = add(["#1c1c24", "#2c2c36"]);
const WHITE = add(["#d8d8e0", "#f4f4fa"]);
const EYE = add(["#7ee06a", "#0a0a0a", "#ffffff"]);
const PINK = add(["#f0a0b0", "#ffc4cc"]);
const MUG = add(["#c84a3a", "#e86a52"]);

export const meta = {
  slug: "laptop-typing-cat",
  name: "Cat at the Keyboard",
  category: "mascots",
  note: "A grey tabby sits up at a laptop late at night, tapping the keys with both paws while its eyes follow the code appearing on screen.",
  tags: ["cat", "mascot", "coding", "laptop", "readme", "empty-state"],
  cols: 64, rows: 28, fps: 24,
  palette: palette(P),
};

const ell = (g, cx, cy, rx, ry, fn) => {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy;
    if (d <= 1) fn(x, y, dx, dy, d);
  }
};

// [indent, text, colour index]
const SRC = [
  [0, "fn nap(hours) {", 5], [2, "let bed = sun()", 0], [2, "if (bed.warm)", 3], [4, "purr(hours)", 2],
  [2, "return \"zzz\"", 4], [0, "}", 0], [0, "// todo: snacks", 1], [0, "nap(16)", 2],
];
const CPS = 10;
const TOTAL = SRC.reduce((s, l) => s + l[1].length + 3, 0);
const LOOP = TOTAL / CPS + 2.5;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const bg = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    if (y >= 21) { const n = fbm(x * 0.1, y * 1.1, 2, 4); bg.push([y === 21 ? "▄" : n > 0.55 ? "▓" : "█", KEYS[DESK + (y === 21 ? 3 : n > 0.55 ? 1 : 2)]]); continue; }
    const v = clamp(0.1 + Math.exp(-Math.hypot((x - 47) / 2, y - 11) / 14) * 0.8 + (fbm(x * 0.06, y * 0.12, 3, 2) - 0.5) * 0.2);
    bg.push([" ░▒▓"[1 + Math.min(2, Math.floor(v * 3))], KEYS[WALL + Math.min(9, Math.floor(v * 10))]]);
  }
  return (t) => {
    for (let i = 0; i < bg.length; i++) { g.ch[i] = bg[i][0]; g.co[i] = bg[i][1]; }
    const lt = t % LOOP;
    const typed = Math.min(TOTAL, Math.floor(lt * CPS));
    const typing = typed < TOTAL;
    // mug on desk
    g.text(2, 19, "▐██▌", KEYS[MUG]); g.text(2, 20, "▐██▌", KEYS[MUG + 1]); g.set(6, 19, ")", KEYS[MUG]);
    g.set(3, 18 - (Math.floor(t * 3) % 2), "~", KEYS[WHITE]);
    // laptop screen
    for (let y = 3; y <= 18; y++) for (let x = 33; x <= 62; x++) {
      const bez = y === 3 || y === 18 || x === 33 || x === 62;
      g.set(x, y, "█", KEYS[bez ? LAP + 1 : SCR + (y % 2)]);
    }
    // code on screen
    let left = typed, line = 0, cx = 0, cy = 0;
    const shown = [];
    for (const [ind, txt, col] of SRC) {
      if (left <= 0) break;
      const n = Math.min(txt.length, left);
      shown.push([ind, txt.slice(0, n), col]);
      cx = ind + n; cy = shown.length - 1;
      left -= txt.length + 3;
      line++;
    }
    const first = Math.max(0, shown.length - 7);
    for (let i = first; i < shown.length; i++) {
      const [ind, s, col] = shown[i];
      const y = 5 + (i - first) * 2;
      g.text(35, y, String(i + 1).padStart(2, " "), KEYS[CODE + 1]);
      g.text(38 + ind, y, s.slice(0, 22 - ind), KEYS[CODE + col]);
    }
    const curY = 5 + (cy - first) * 2;
    if (Math.floor(t * 3) % 2 === 0 || typing) g.set(38 + Math.min(cx, 22), shown.length ? curY : 5, "▌", KEYS[CODE]);
    // keyboard base
    for (let x = 29; x <= 63; x++) { g.set(x, 19, "▄", KEYS[LAP + 3]); g.set(x, 20, x % 2 ? "▀" : "▄", KEYS[LAP + 2]); }
    // tail
    for (let i = 0; i < 18; i++) {
      const u = i / 18;
      const a = -0.6 - u * 2.2 + Math.sin(t * 2 - u * 3) * 0.35;
      const x = 8 - 3 + Math.cos(a) * (3 + u * 6) - 2, y = 19 + Math.sin(a) * (1.5 + u * 3);
      g.set(x, y, "█", KEYS[i % 4 < 2 ? STRIPE + 1 : FUR + 4]); g.set(x + 1, y, "█", KEYS[FUR + 3]);
    }
    // body
    ell(g, 16, 16.2, 9.5, 5.3, (x, y, dx, dy, d) => {
      const stripe = Math.sin(dx * 9 + dy) > 0.7 && Math.abs(dx) > 0.35;
      const chest = Math.hypot((dx - 0.2) / 0.32, (dy + 0.2) / 0.8) < 1;
      const lit = clamp(0.6 - dx * 0.2 - dy * 0.3 + Math.sqrt(1 - d) * 0.3);
      g.set(x, y, stripe ? "▓" : "█", chest ? KEYS[WHITE + (dx > 0.2 ? 1 : 0)] : stripe ? KEYS[STRIPE] : KEYS[FUR + Math.min(9, Math.floor(lit * 10))]);
    });
    // forelegs to keyboard, tapping
    const tick = Math.floor(t * CPS * 0.5);
    for (const [k, px] of [[0, 27], [1, 33]]) {
      const up = typing && (tick + k) % 2 === 0 ? 1 : 0;
      const y1 = 19 - up;
      for (let i = 0; i <= 8; i++) {
        const u = i / 8, x = 20 + k * 3 + (px - 20 - k * 3) * u, y = 15 + (y1 - 15) * u;
        g.text(x, y, "███", KEYS[FUR + 5 + k]);
      }
      g.text(px - 1, y1, "▄██▄", KEYS[WHITE + 1]);
      if (up) g.text(px, y1 + 1, "··", KEYS[CODE]);
    }
    // head
    const hx = 17, hy = 8.5 + Math.sin(t * 1.3) * 0.25;
    for (const [ex, dir] of [[hx - 5, -1], [hx + 5, 1]]) for (let k = 0; k < 4; k++) {
      const w = k;
      for (let d = -w; d <= w; d++) g.set(ex + d + dir * (3 - k) * 0.3, hy - 6 + k, "█", KEYS[Math.abs(d) < w - 1 && k > 1 ? PINK : FUR + 6]);
    }
    ell(g, hx, hy, 9, 5, (x, y, dx, dy, d) => {
      const lit = clamp(0.65 - dx * 0.15 - dy * 0.3 + Math.sqrt(1 - d) * 0.25);
      const brow = dy < -0.4 && Math.abs(dx) < 0.25 && x % 2 === 0;
      const muzzle = dy > 0.05 && Math.abs(dx - 0.05) < 0.4;
      g.set(x, y, brow ? "▓" : "█", brow ? KEYS[STRIPE] : muzzle ? KEYS[WHITE + 1] : KEYS[FUR + Math.min(9, Math.floor(lit * 10))]);
    });
    const look = typing ? clamp(((typed % 24) / 24) * 2 - 0.2, 0, 1) : 0.5;
    const blink = Math.abs((t % 4.4) - 3.6) < 0.12;
    for (const ex of [hx - 3.5, hx + 3.5]) {
      const X = Math.round(ex - 1), Y = Math.round(hy - 0.5);
      if (blink) { g.text(X, Y + 1, "▀▀▀", KEYS[EYE + 1]); continue; }
      g.text(X, Y, "▄▄▄", KEYS[EYE]); g.text(X, Y + 1, "▀▀▀", KEYS[EYE]);
      g.set(X + 1 + Math.round(look), Y, "█", KEYS[EYE + 1]);
    }
    g.set(hx, Math.round(hy + 2), "▼", KEYS[PINK]);
    g.text(hx - 1, Math.round(hy + 3), "▀▀▀", KEYS[STRIPE]);
    g.text(hx - 12, Math.round(hy + 2), "──", KEYS[WHITE]); g.text(hx + 11, Math.round(hy + 2), "──", KEYS[WHITE]);
    return g.frame();
  };
}
