/* idea-lightbulb: a light bulb ponders in the dark, flickers, then switches on with a bright idea and a delighted grin. */
import { Grid, palette, gradient, KEYS, fbm, clamp, smooth, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const DARK = add(gradient(["#06060c", "#0c0c18", "#141426", "#1e1e36"], 6));
const WARM = add(gradient(["#2a1e10", "#4a3418", "#6e4e22", "#94682c", "#b88838"], 6));
const GLASSOFF = add(gradient(["#2a3448", "#3a4660", "#4e5c7a", "#687a98", "#8a9ab4"], 6));
const GLASSON = add(gradient(["#f4a01a", "#fcc02a", "#ffd84a", "#ffea7a", "#fff6b0", "#ffffe6"], 8));
const METAL = add(gradient(["#3a3a44", "#5a5a66", "#82828e", "#aaaab4", "#d0d0d8"], 6));
const FIL = add(["#4a3a2a", "#ff8a1a", "#fff0a0"]);
const FACE = add(["#1a1208", "#ffffff", "#ff8a8a", "#2a3040"]);
const RAY = add(["#ffb02a", "#ffd84a", "#fff4b0"]);
const DOTS = add(["#8a9ab4"]);

export const meta = {
  slug: "idea-lightbulb",
  name: "Bright Idea Bulb",
  category: "mascots",
  note: "A light bulb ponders in the dark with its eyes rolled up, flickers a few times, then switches on with a bright idea and a delighted grin.",
  tags: ["lightbulb", "idea", "mascot", "success", "empty-state", "loader"],
  cols: 56, rows: 30, fps: 24,
  palette: palette(P),
};

const ell = (g, cx, cy, rx, ry, fn) => {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy;
    if (d <= 1) fn(x, y, dx, dy, d);
  }
};
const LOOP = 8;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const noise = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) noise.push(fbm(x * 0.07, y * 0.14, 3, 8));
  return (t) => {
    const p = t % LOOP;
    // on: 0 off, 1 on. Flicker 3.0-3.9 as a few hard switches
    let on = 0;
    if (p >= 3 && p < 3.9) on = [1, 0, 1, 0, 0, 1, 0, 1, 1][Math.floor((p - 3) * 10)] || 0;
    else if (p >= 3.9 && p < 6.8) on = 1;
    else if (p >= 6.8 && p < 7.3) on = 1 - smooth((p - 6.8) / 0.5);
    const lit = on > 0.5;
    const cx = 28, cy = 11.5 + Math.sin(t * 1.6) * 0.3;
    // room: lit warmly when the bulb is on
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const d = Math.hypot((x - cx) / 2, y - cy);
      const v = clamp(0.15 + (noise[x + y * cols] - 0.5) * 0.3 + (y > 25 ? 0.15 : 0) + on * Math.exp(-d / 12) * 0.85);
      const ch = y > 25 ? (y === 26 ? "▄" : "█") : " ░▒▓"[1 + Math.min(2, Math.floor(v * 3))];
      g.set(x, y, ch, KEYS[on > 0.2 ? WARM + Math.min(5, Math.floor(v * 6)) : DARK + Math.min(5, Math.floor(v * 6))]);
    }
    // rays when lit
    if (on > 0.9) {
      const burst = clamp((p - 3.9) / 0.4);
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * TAU + 0.15;
        if (Math.sin(a) > 0.75) continue;
        const r0 = 12.5, r1 = r0 + 2 + burst * 4 + Math.sin(t * 6 + k) * 0.6;
        for (let r = r0; r <= r1; r += 0.5) g.set(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.5, "█", KEYS[RAY + (r < r0 + 2 ? 2 : r < r0 + 4 ? 1 : 0)]);
      }
    }
    // screw base and neck
    for (let y = 19; y <= 24; y++) {
      const hw = y < 23 ? 5 : 4 - (y - 23);
      for (let x = cx - hw; x <= cx + hw; x++) {
        const u = (x - cx) / hw;
        const ridge = y < 23 && y % 2 === 0;
        g.set(x, y, ridge ? "▄" : "█", KEYS[METAL + Math.min(5, Math.max(0, Math.floor(clamp(0.7 - u * 0.4) * 6) - (ridge ? 2 : 0)))]);
      }
    }
    g.text(cx - 1, 25, "▀█▀", KEYS[METAL]);
    // glass bulb: round top tapering into the neck
    const G = lit ? GLASSON : GLASSOFF, n = lit ? 8 : 6;
    for (let y = Math.floor(cy - 8); y <= 19; y++) for (let x = cx - 14; x <= cx + 14; x++) {
      const dy = (y + 0.5 - cy) / 8;
      let hw = y + 0.5 < cy + 3 ? 14 * Math.sqrt(Math.max(0, 1 - Math.min(1, dy * dy))) : 14 * Math.sqrt(Math.max(0, 1 - ((cy + 3 - cy) / 8) ** 2)) - (y + 0.5 - cy - 3) * 2.2;
      hw = Math.max(hw, 5.5);
      const dx = (x + 0.5 - cx) / hw;
      if (Math.abs(dx) > 1) continue;
      const v = clamp(0.6 - dx * 0.3 - dy * 0.25 + Math.sqrt(Math.max(0, 1 - dx * dx)) * 0.25 + (lit ? 0.2 : 0));
      g.set(x, y, Math.abs(dx) > 0.92 ? "▓" : "█", KEYS[G + Math.min(n - 1, Math.floor(v * n))]);
    }
    // glint on the glass
    g.text(cx - 9, Math.round(cy - 5), "▄▄", KEYS[lit ? GLASSON + 7 : GLASSOFF + 5]); g.set(cx - 10, Math.round(cy - 4), "█", KEYS[lit ? GLASSON + 7 : GLASSOFF + 5]);
    // filament
    g.text(cx - 3, 17, "│", KEYS[FIL]); g.text(cx + 3, 17, "│", KEYS[FIL]);
    g.text(cx - 3, 16, "\\~~~~~/", KEYS[FIL + (lit ? 2 : on > 0 ? 1 : 0)]);
    // face
    const fy = Math.round(cy - 1);
    const look = Math.sin(p * 1.5);
    const blink = !lit && Math.abs(p - 1.8) < 0.1;
    for (const ex of [cx - 5, cx + 5]) {
      const X = ex - 1;
      if (lit) { g.text(X, fy - 1, "▄█▄", KEYS[FACE]); g.text(X, fy, "███", KEYS[FACE]); g.text(X, fy + 1, "▀█▀", KEYS[FACE]); g.set(X, fy - 1, "▄", KEYS[FACE + 1]); g.set(X, fy, "█", KEYS[FACE + 1]); }
      else if (blink) g.text(X, fy, "▀▀▀", KEYS[FACE + 3]);
      else { g.text(X, fy, "▄█▄", KEYS[FACE + 3]); g.text(X, fy + 1, "▀▀▀", KEYS[FACE + 3]); g.set(X + 1 + Math.round(look), fy, "▀", KEYS[FACE + 1]); }
    }
    if (lit) {
      g.text(cx - 10, fy + 2, "▄▄", KEYS[FACE + 2]); g.text(cx + 9, fy + 2, "▄▄", KEYS[FACE + 2]);
      g.text(cx - 3, fy + 3, "▀▄▄▄▄▄▀", KEYS[FACE]); g.text(cx - 2, fy + 4, "▀▀▀", KEYS[FACE + 2]);
    } else g.text(cx - 2, fy + 3, p < 3 ? "▄▀▄▀" : "▄▄▄", KEYS[FACE + 3]);
    // thinking dots before, an exclamation after
    if (p < 3) for (let k = 0; k < 3; k++) if (p * 1.2 > k * 0.8) g.text(cx + 15 + k * 3, Math.round(cy - 7 - k * 1.5), k === 2 ? "●" : "•", KEYS[DOTS]);
    if (lit && p > 4.1) { g.text(cx + 16, Math.round(cy - 9), "█", KEYS[RAY + 2]); g.text(cx + 16, Math.round(cy - 8), "█", KEYS[RAY + 2]); g.text(cx + 16, Math.round(cy - 6), "▀", KEYS[RAY + 2]); }
    return g.frame();
  };
}
