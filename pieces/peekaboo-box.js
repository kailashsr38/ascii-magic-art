/* peekaboo-box: a cardboard box wobbles, its flaps pop open, two eyes peer out, then a fuzzy critter pops up to wave and hides again. */
import { Grid, palette, gradient, KEYS, fbm, clamp, smooth } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const WALL = add(gradient(["#1e1a2e", "#2a2440", "#383054", "#483e68", "#5a4e7a"], 10));
const FLOOR = add(gradient(["#2a1e18", "#3e2c20", "#523a2a", "#684a34"], 4));
const BOX = add(gradient(["#6a4220", "#8a5a2c", "#a87238", "#c48c48", "#dcaa62", "#ecc480"], 10));
const TAPE = add(["#c8b48a", "#e4d4a8"]);
const INSIDE = add(["#0a0604", "#1a1008"]);
const PRINT = add(["#4a2a12"]);
const CRIT = add(gradient(["#c84a1a", "#e8662a", "#ff8a3a", "#ffaa5a", "#ffc888"], 6));
const EYE = add(["#ffffff", "#0a0a0a"]);
const PINK = add(["#ff8aa8"]);
const QM = add(["#ffe07a"]);

export const meta = {
  slug: "peekaboo-box",
  name: "Peekaboo Box",
  category: "mascots",
  note: "A cardboard box wobbles on the floor, its flaps pop open, two eyes peer out of the dark and a fuzzy orange critter pops up to wave before hiding again.",
  tags: ["box", "mascot", "peekaboo", "empty-state", "404", "cute"],
  cols: 60, rows: 28, fps: 24,
  palette: palette(P),
};

const ell = (g, cx, cy, rx, ry, fn) => {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy;
    if (d <= 1) fn(x, y, dx, dy, d);
  }
};
const LOOP = 9;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const bg = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    if (y >= 23) { bg.push([y === 23 ? "▄" : (x + y) % 6 === 0 ? "▓" : "█", KEYS[FLOOR + (y === 23 ? 3 : y < 25 ? 2 : 1)]]); continue; }
    const v = clamp(0.35 + Math.exp(-Math.hypot((x - 30) / 2, y - 10) / 30) * 0.3 + (fbm(x * 0.06, y * 0.12, 3, 5) - 0.5) * 0.2);
    bg.push([" ░▒▓"[1 + Math.min(2, Math.floor(v * 3))], KEYS[WALL + Math.min(9, Math.floor(v * 10))]]);
  }
  return (t) => {
    for (let i = 0; i < bg.length; i++) { g.ch[i] = bg[i][0]; g.co[i] = bg[i][1]; }
    const p = t % LOOP;
    const wob = p < 1.2 ? Math.round(Math.sin(p * 18) * (p > 0.4 ? 1 : 0)) : 0;
    const open = p < 1.2 ? 0 : p < 1.7 ? smooth((p - 1.2) / 0.5) : p < 7 ? 1 : p < 7.5 ? 1 - smooth((p - 7) / 0.5) : 0;
    const peek = p > 1.9 && p < 3.4;
    const rise = p < 3.4 ? 0 : p < 3.8 ? smooth((p - 3.4) / 0.4) : p < 6 ? 1 : p < 6.4 ? 1 - smooth((p - 6) / 0.4) : 0;
    const x0 = 16 + wob, x1 = 44 + wob, top = 13, bot = 23;
    // shadow
    for (let x = x0 - 1; x <= x1 + 3; x++) g.set(x, 23, "▄", KEYS[FLOOR]);
    // back flaps (only when open)
    const fh = Math.round(open * 6);
    if (fh > 0) {
      for (let k = 1; k <= fh; k++) for (let x = x0 + 4 + Math.round(k * 0.3); x <= x1 - 4 + Math.round(k * 0.3); x++) g.set(x, top - 2 - k, "█", KEYS[BOX + 2 + (k % 2)]);
    }
    // opening: dark interior seen from slightly above
    for (let y = top - 2; y < top; y++) for (let x = x0 + 1; x <= x1 + 2; x++) g.set(x, y, "█", KEYS[open > 0.1 ? INSIDE + (y === top - 2 ? 1 : 0) : BOX + 7 - (y - top + 2)]);
    if (open < 0.1) { g.hline(x0 + 1, x1 + 2, top - 1, "▀", KEYS[TAPE + 1]); for (let x = x0 + 1; x <= x1 + 2; x++) g.set(x, top - 2, "▄", KEYS[BOX + 8]); }
    // eyes peeking out of the dark
    if (peek) {
      const look = Math.sin((p - 1.9) * 4);
      const blink = Math.abs(p - 2.9) < 0.08;
      for (const ex of [28, 33]) g.text(Math.round(ex + look * 2), top - 2, blink ? "▄▄" : "▄█", KEYS[EYE]);
    }
    // critter rising out of the box, drawn before the front face so the box hides its lower body
    if (rise > 0) {
      const cy = top + 2 - rise * 6;
      // ear tufts
      for (const s of [-1, 1]) { g.text(30 + s * 4 - 1, Math.round(cy - 4.4), s < 0 ? "▄█" : "█▄", KEYS[CRIT + 1]); g.set(30 + s * 5, Math.round(cy - 5.2), "▲", KEYS[CRIT]); }
      ell(g, 30, cy, 8, 4.2, (x, y, dx, dy, d) => {
        if (y >= top) return;
        const lit = clamp(0.6 - dy * 0.35 - dx * 0.2 + Math.sqrt(1 - d) * 0.3);
        g.set(x, y, d > 0.8 ? "▓" : "█", KEYS[CRIT + Math.min(5, Math.floor(lit * 6))]);
      });
      const blink = Math.abs(p - 5.1) < 0.1;
      for (const ex of [27, 33]) {
        const ey = Math.round(cy - 1);
        if (blink) { g.text(ex - 1, ey + 1, "▀▀", KEYS[EYE + 1]); continue; }
        g.text(ex - 1, ey, "▄▄", KEYS[EYE + 1]); g.text(ex - 1, ey + 1, "██", KEYS[EYE + 1]); g.set(ex - 1, ey, "▄", KEYS[EYE]);
      }
      g.text(23, Math.round(cy + 1), "▄▄", KEYS[PINK]); g.text(36, Math.round(cy + 1), "▄▄", KEYS[PINK]);
      g.text(29, Math.round(cy + 1.5), "▀▄▀", KEYS[EYE + 1]);
      // waving paw over the rim
      if (rise > 0.8) {
        const w = Math.sin(t * 10);
        g.text(Math.round(40 + w), top - 4, "▄█▄", KEYS[CRIT + 3]); g.text(Math.round(40 + w * 0.5), top - 3, "█", KEYS[CRIT + 2]);
        if (Math.abs(w) > 0.7) g.set(Math.round(44 + w), top - 5, w > 0 ? ")" : "(", KEYS[QM]);
      }
    }
    // front flaps (fold out toward the viewer when open)
    if (fh > 0) for (const [hx, dir] of [[x0, -1], [x1, 1]]) for (let k = 0; k < fh; k++) {
      const y = top - 1 - k;
      const xa = hx + (dir > 0 ? 2 : 0) + dir * Math.round(k * 1.5);
      for (let i = 0; i < 6; i++) g.set(xa - dir * i, y, "█", KEYS[BOX + (i === 0 ? 7 : 4 - (dir > 0 ? 2 : 0) + (k % 2))]);
    }
    // front face
    for (let y = top; y < bot; y++) for (let x = x0; x <= x1; x++) {
      const u = (x - x0) / (x1 - x0), v = (y - top) / (bot - top);
      g.set(x, y, "█", KEYS[BOX + Math.min(9, Math.floor(clamp(0.75 - u * 0.25 - v * 0.3) * 10))]);
    }
    // side face for depth
    for (let y = top - 1; y < bot; y++) for (let k = 1; k <= 2; k++) g.set(x1 + k, y + (k === 2 && y === top - 1 ? 1 : 0), "█", KEYS[BOX + 1]);
    // tape and print
    for (let y = top; y < top + 3; y++) g.text(29 + wob, y, "███", KEYS[TAPE]);
    g.text(x0 + 3, top + 3, "↑ ↑", KEYS[PRINT]);
    g.text(x0 + 2, top + 4, "▀▀▀▀▀", KEYS[PRINT]);
    g.text(x1 - 9, bot - 4, "▄▄▄▄▄▄▄", KEYS[TAPE + 1]); g.text(x1 - 9, bot - 3, "▀▀▀▀▀▀▀", KEYS[TAPE + 1]);
    g.text(x1 - 8, bot - 3, "─ ──", KEYS[PRINT]);
    // a question mark while it wobbles shut
    if (p < 1.2 || p > 7.6) g.text(x1 + 4, top - 4 - Math.round(Math.sin(t * 3)), "?", KEYS[QM]);
    return g.frame();
  };
}
