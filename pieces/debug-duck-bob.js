/* debug-duck-bob: a yellow rubber duck bobs on rippling water, listening to your bug and thinking out loud in a speech bubble. */
import { Grid, palette, gradient, KEYS, fbm, clamp } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const TILE = add(gradient(["#1c2a3e", "#24364e", "#2e4462", "#3a5476", "#48668a"], 6));
const GROUT = add(["#141e2c"]);
const WATER = add(gradient(["#0a3a5a", "#0e4e74", "#16648e", "#2280aa", "#3a9cc4", "#6ac0e0"], 8));
const FOAM = add(["#a8e0f4", "#e4f6fc"]);
const DUCK = add(gradient(["#b87a0a", "#d89a12", "#f0b81e", "#fcd23a", "#ffe46a", "#fff4b0"], 10));
const BEAK = add(["#d8601a", "#ff8a2a", "#ffb05a"]);
const EYE = add(["#0a0a0a", "#ffffff"]);
const PINK = add(["#ff9a7a"]);
const BUB = add(["#e6edf3", "#8b949e", "#ffa657", "#7ee787", "#ff7b72"]);

export const meta = {
  slug: "debug-duck-bob",
  name: "Rubber Duck Debugger",
  category: "mascots",
  note: "A yellow rubber duck bobs on rippling water, listening patiently to your bug and thinking out loud in a speech bubble until it is fixed.",
  tags: ["duck", "mascot", "debugging", "developer", "readme", "terminal"],
  cols: 64, rows: 28, fps: 24,
  palette: palette(P),
};

const ell = (g, cx, cy, rx, ry, fn) => {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy;
    if (d <= 1) fn(x, y, dx, dy, d);
  }
};
// speech lines with colour index, each at most 7 characters
const SAY = [["?", 0], ["hmm..", 1], ["line 42", 2], ["null!", 4], ["fixed ✓", 3], ["quack", 0]];
const STEP = 1.8;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const bg = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const gr = y % 4 === 3 || x % 8 === 7;
    const v = clamp(0.25 + Math.exp(-Math.hypot((x - 26) / 2, y - 8) / 14) * 0.6 + (fbm(x * 0.1, y * 0.2, 2, 6) - 0.5) * 0.2);
    bg.push(gr ? ["▒", KEYS[GROUT]] : ["█", KEYS[TILE + Math.min(5, Math.floor(v * 6))]]);
  }
  const wl = 18;
  return (t) => {
    for (let i = 0; i < bg.length; i++) { g.ch[i] = bg[i][0]; g.co[i] = bg[i][1]; }
    const cx = 24 + Math.sin(t * 0.6) * 2;
    const bob = Math.sin(t * 2.4) * 0.6, rock = Math.sin(t * 2.4 + 0.8);
    const surf = (x) => wl + Math.sin(x * 0.35 - t * 2.4) * 0.45 + Math.sin(x * 0.13 + t * 1.3) * 0.35;
    // water
    for (let x = 0; x < cols; x++) {
      const s = surf(x);
      for (let y = Math.floor(s); y < rows; y++) {
        const depth = (y - s) / (rows - wl);
        const ring = Math.abs(Math.hypot((x - cx) / 2.2, (y - wl - 1) * 1.6) - ((t * 4) % 12)) < 0.6 && y < wl + 4;
        const v = clamp(0.85 - depth * 0.9 + (fbm(x * 0.12 - t * 0.3, y * 0.4, 2, 9) - 0.5) * 0.3);
        if (y === Math.floor(s)) g.set(x, y, s - Math.floor(s) > 0.5 ? "▄" : "▆", KEYS[FOAM]);
        else g.set(x, y, "█", ring ? KEYS[WATER + 7] : KEYS[WATER + Math.min(7, Math.floor(v * 8))]);
      }
    }
    // duck below waterline gets drawn first so water covers it slightly
    const by = wl - 2.5 + bob;
    // tail
    for (let k = 0; k < 3; k++) g.text(Math.round(cx - 13 + k), Math.round(by - 3 + k - rock * 0.5), "▄█", KEYS[DUCK + 5 - k]);
    // body
    ell(g, cx - 1, by, 12, 4.4, (x, y, dx, dy, d) => {
      if (y > surf(x) + 0.6) return;
      const lit = clamp(0.62 - dy * 0.35 - dx * 0.2 + Math.sqrt(1 - d) * 0.3);
      g.set(x, y, d > 0.85 ? "▓" : "█", KEYS[DUCK + Math.min(9, Math.floor(lit * 10))]);
    });
    // wing, flaps on a quack
    const p = t % (STEP * SAY.length), si = Math.floor(p / STEP);
    const flap = si === 4 && (p % STEP) < 0.9 ? Math.round(Math.abs(Math.sin(t * 14)) * 1.5) : 0;
    ell(g, cx - 3, by - 0.5 - flap, 5.5, 2, (x, y, dx, dy) => g.set(x, y, dy < -0.3 ? "▄" : "█", KEYS[DUCK + (dy < 0 ? 4 : 2)]));
    g.text(Math.round(cx - 7), Math.round(by + 0.5 - flap), "▀▀▀", KEYS[DUCK + 1]);
    // head
    const hx = cx + 6.5 + rock * 0.4, hy = by - 6.2;
    ell(g, hx, hy, 6, 3.6, (x, y, dx, dy, d) => {
      const lit = clamp(0.65 - dy * 0.3 - dx * 0.2 + Math.sqrt(1 - d) * 0.3);
      g.set(x, y, d > 0.85 ? "▓" : "█", KEYS[DUCK + Math.min(9, Math.floor(lit * 10))]);
    });
    // beak, opens while talking
    const talk = (p % STEP) < 0.8 && Math.floor(t * 8) % 2 === 0;
    g.text(Math.round(hx + 5), Math.round(hy + 0.5), "▄▄▄▄", KEYS[BEAK + 1]);
    g.text(Math.round(hx + 5), Math.round(hy + 1.5), talk ? "▀▀▀ " : "▀▀▀▀", KEYS[BEAK]);
    if (talk) g.text(Math.round(hx + 5), Math.round(hy + 1), "    ", KEYS[BEAK]);
    // eye
    const blink = Math.abs((t % 4.2) - 3.3) < 0.12;
    const ex = Math.round(hx + 1.5), ey = Math.round(hy - 1);
    if (blink) g.text(ex, ey + 1, "▀▀", KEYS[EYE]);
    else { g.text(ex, ey, "▄▄", KEYS[EYE]); g.text(ex, ey + 1, "██", KEYS[EYE]); g.set(ex, ey, "▄", KEYS[EYE + 1]); }
    g.text(ex - 1, ey + 2, "▄▄", KEYS[PINK]);
    // speech bubble, cleared and drawn last
    const [msg, col] = SAY[si];
    const bw = 11, bx = Math.round(hx + 4), byy = 1;
    g.fill(bx + 1, byy + 1, bw - 2, 1, " ");
    g.box(bx, byy, bw, 3, "round", KEYS[BUB]);
    g.text(bx + 1 + Math.floor((bw - 2 - msg.length) / 2), byy + 1, msg, KEYS[BUB + col]);
    g.set(bx + 2, byy + 3, "╲", KEYS[BUB]);
    return g.frame();
  };
}
