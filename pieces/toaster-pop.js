/* toaster-pop: a chrome toaster concentrates, glows, then pops two golden slices high into the air and catches them. */
import { Grid, palette, gradient, KEYS, fbm, clamp, smooth } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const TILE = add(gradient(["#1a3a3a", "#22504e", "#2e6662", "#3e7e78", "#52968e"], 6));
const GROUT = add(["#122826"]);
const COUNTER = add(gradient(["#3a2a20", "#5a4030", "#7a5a40", "#9a7656"], 4));
const CHROME = add(gradient(["#4a5260", "#6a7484", "#8e98a8", "#b4bece", "#d8e0ec", "#f6faff"], 12));
const SLOT = add(["#14100c", "#ff5a1a", "#ffa03a"]);
const TOAST = add(gradient(["#7a4214", "#a8621e", "#cc8a34", "#e8b25a", "#f4d08a"], 6));
const CRUST = add(["#5a2e0e", "#7a3e14"]);
const FACE = add(["#10141c", "#ffffff", "#ff8aa0"]);
const LEVER = add(["#1a1a1e", "#3a3a42"]);
const HEAT = add(["#ff8a3a", "#ffd07a"]);

export const meta = {
  slug: "toaster-pop",
  name: "Toaster Pops Toast",
  category: "mascots",
  note: "A chrome toaster squints and glows as it concentrates, then pops two golden slices high into the air and catches them with a grin.",
  tags: ["toaster", "mascot", "kitchen", "breakfast", "loader", "success"],
  cols: 60, rows: 30, fps: 30,
  palette: palette(P),
};

const ell = (g, cx, cy, rx, ry, fn) => {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy;
    if (d <= 1) fn(x, y, dx, dy, d);
  }
};
const LOOP = 6;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const bg = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    if (y >= 25) { bg.push([y === 25 ? "▄" : "█", KEYS[COUNTER + (y === 25 ? 3 : y === 26 ? 2 : 1)]]); continue; }
    const gr = y % 4 === 3 || x % 8 === 0;
    const v = clamp(0.3 + Math.exp(-Math.hypot((x - 30) / 2, y - 12) / 12) * 0.6 + (fbm(x * 0.1, y * 0.2, 2, 2) - 0.5) * 0.2);
    bg.push(gr ? ["▒", KEYS[GROUT]] : ["█", KEYS[TILE + Math.min(5, Math.floor(v * 6))]]);
  }
  return (t) => {
    for (let i = 0; i < bg.length; i++) { g.ch[i] = bg[i][0]; g.co[i] = bg[i][1]; }
    const p = t % LOOP;
    // 0-2.6 toasting (lever down, glow), 2.6 pop, toast flies 2.6-4.2, lands in slots, 4.2-6 proud
    const toasting = p < 2.6;
    let toastY = -2; // rows above the slot
    if (p >= 2.6 && p < 4.2) { const k = (p - 2.6) / 1.6; toastY = 4 * k * (1 - k) * 11; }
    else if (p >= 4.2) toastY = 2 + Math.max(0, 1 - (p - 4.2) * 4) * 1;
    const jig = toasting && p > 1.2 ? (Math.floor(t * 20) % 2) * 0.5 : 0;
    const squash = p >= 2.6 && p < 2.8 ? 1 - (p - 2.6) / 0.2 : 0;
    const cx = 30 + jig, top = 12 + squash;
    // shadow
    ell(g, 30, 25.5, 16, 0.9, (x, y) => g.set(x, y, "▀", KEYS[COUNTER]));
    // toast slices behind the top
    const spin = p >= 2.6 && p < 4.2 ? (p - 2.6) / 1.6 : 0;
    for (const [sx, dir] of [[cx - 5, -1], [cx + 5, 1]]) {
      const ty = top + 3 - toastY - 6;
      const tilt = Math.round(Math.sin(spin * Math.PI) * dir * 2);
      for (let y = 0; y < 7; y++) {
        const row = Math.round(ty + y);
        if (row >= top + 1) continue;
        const off = Math.round(tilt * (3 - y) / 3);
        const hw = y === 0 ? 3 : 4;
        for (let x = -hw; x <= hw; x++) {
          const edge = Math.abs(x) === hw || y === 0;
          const shade = clamp(0.8 - x * 0.06 - y * 0.06 - (p < 2.6 ? 0.25 : 0));
          g.set(sx + x + off, row, y === 0 && Math.abs(x) === hw ? "▄" : "█", edge ? KEYS[CRUST + (x < 0 ? 1 : 0)] : KEYS[TOAST + Math.min(5, Math.floor(shade * 6))]);
        }
      }
    }
    // body
    for (let y = Math.floor(top); y <= 25; y++) for (let x = Math.floor(cx - 14); x <= cx + 14; x++) {
      const u = (x + 0.5 - cx) / 14, v = (y - top) / (25 - top);
      const corner = (Math.abs(u) > 0.9 && (v < 0.12 || v > 0.92));
      if (corner || Math.abs(u) > 1) continue;
      const lit = clamp(0.8 - u * 0.35 - u * u * 0.4 - v * 0.25 + (Math.abs(u - 0.55) < 0.06 ? 0.3 : 0));
      g.set(x, y, Math.abs(u) > 0.95 ? "▓" : "█", KEYS[CHROME + Math.min(11, Math.floor(lit * 12))]);
    }
    // slots
    for (const sx of [cx - 5, cx + 5]) {
      g.text(Math.round(sx - 4), Math.round(top), "▄▄▄▄▄▄▄▄▄", KEYS[toasting ? SLOT + 1 + (Math.floor(t * 6) % 2) : SLOT]);
    }
    if (toasting && p > 0.6) for (let i = 0; i < 4; i++) {
      const k = ((t * 0.9 + i * 0.25) % 1);
      g.set(cx - 7 + i * 4 + Math.sin(k * 6 + i) * 1.2, top - 1 - k * 5, k < 0.5 ? "~" : "·", KEYS[HEAT + (k < 0.5 ? 1 : 0)]);
    }
    // lever on the side
    const lev = toasting ? 20 : 15;
    g.vline(Math.round(cx + 15), 15, 21, "▌", KEYS[LEVER]);
    g.text(Math.round(cx + 15), lev, "██▌", KEYS[LEVER + 1]);
    // dial
    g.text(Math.round(cx - 11), 22, "▄█▄", KEYS[LEVER + 1]); g.set(Math.round(cx - 10), 22, toasting ? "▖" : "▗", KEYS[CHROME + 11]);
    // feet
    g.text(Math.round(cx - 12), 25, "▀▀▀", KEYS[LEVER]); g.text(Math.round(cx + 10), 25, "▀▀▀", KEYS[LEVER]);
    // face
    const fy = 17;
    const blink = !toasting && Math.abs((t % 3) - 5.4 % 3) < 0.1;
    for (const ex of [cx - 5, cx + 5]) {
      const X = Math.round(ex - 1);
      if (toasting && p > 1.2) g.text(X, fy, ex < cx ? "▀▄▄" : "▄▄▀", KEYS[FACE]);
      else if (blink) g.text(X, fy + 1, "▀▀▀", KEYS[FACE]);
      else if (!toasting) g.text(X, fy, "▄▀▄", KEYS[FACE]);
      else { g.text(X, fy, "▄█▄", KEYS[FACE]); g.text(X, fy + 1, "▀█▀", KEYS[FACE]); g.set(X, fy, "▄", KEYS[FACE + 1]); }
    }
    g.text(Math.round(cx - 9), fy + 2, "▄▄", KEYS[FACE + 2]); g.text(Math.round(cx + 8), fy + 2, "▄▄", KEYS[FACE + 2]);
    if (toasting) g.text(Math.round(cx - 1), fy + 3, p > 1.2 ? "▄▄▄" : "▀▀▀", KEYS[FACE]);
    else { g.text(Math.round(cx - 2), fy + 2, "▀▄▄▄▀", KEYS[FACE]); g.text(Math.round(cx - 1), fy + 3, "▀▀▀", KEYS[FACE + 2]); }
    // pop burst lines
    if (p >= 2.6 && p < 3.1) for (const [dx, ch] of [[-16, "\\"], [16, "/"], [-18, "-"], [18, "-"]]) g.set(Math.round(cx + dx), top - (ch === "-" ? 0 : 1), ch, KEYS[HEAT + 1]);
    return g.frame();
  };
}
