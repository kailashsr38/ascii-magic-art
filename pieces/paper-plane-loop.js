/* paper-plane-loop: a cheerful folded paper plane with big eyes glides across the sky and flies a loop the loop, leaving a dashed trail. */
import { Grid, palette, gradient, KEYS, fbm, clamp, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const SKY = add(gradient(["#1a4a9a", "#2460b0", "#3076c4", "#4a8ed4", "#64a4de", "#86bce6"], 10));
const CLOUD = add(["#c8dcf0", "#e4eef8", "#ffffff"]);
const HILL = add(gradient(["#2a6a3a", "#3a8444", "#52a050", "#74ba60"], 4));
const PAPER = add(gradient(["#8a96aa", "#aab4c4", "#c8d0dc", "#e4e8f0", "#ffffff"], 6));
const FOLD = add(["#6a7488"]);
const EYE = add(["#0a0e1a", "#ffffff"]);
const PINK = add(["#ff8aa8"]);
const TRAIL = add(["#e4eef8", "#ffffff"]);

export const meta = {
  slug: "paper-plane-loop",
  name: "Loop the Loop Plane",
  category: "mascots",
  note: "A cheerful folded paper plane with big eyes glides across a sunny sky, flies a full loop the loop and leaves a dashed trail behind it.",
  tags: ["paper-plane", "mascot", "sky", "send", "success", "loader"],
  cols: 72, rows: 28, fps: 30,
  palette: palette(P),
};

const ell = (g, cx, cy, rx, ry, fn) => {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy;
    if (d <= 1) fn(x, y, dx, dy, d);
  }
};
const LOOP = 7;
const LX = 38, LY = 11, LR = 7.5; // loop centre and radius (in rows; x is doubled)

// position (x, y in cells) and heading (radians, screen space, y down) at phase u in 0..1
function path(u) {
  const xStart = -10, xEnd = 84;
  const entry = 0.3, loopEnd = 0.68;
  const yb = LY + LR; // cruise height = bottom of loop
  if (u < entry) { const k = u / entry; return [xStart + (LX - xStart) * k, yb + Math.sin(k * 6) * 0.6, 0]; }
  if (u < loopEnd) {
    const k = (u - entry) / (loopEnd - entry), a = Math.PI / 2 - k * TAU; // start at bottom, go up the front side
    const x = LX + Math.cos(a) * LR * 2, y = LY + Math.sin(a) * LR;
    const hx = Math.sin(a) * 2, hy = -Math.cos(a);
    return [x + k * 0.01, y, Math.atan2(hy, hx)];
  }
  const k = (u - loopEnd) / (1 - loopEnd);
  return [LX + (xEnd - LX) * k, yb - k * 3, Math.atan2(-3, xEnd - LX) * 0.5];
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const bg = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const h = 24 + Math.sin(x * 0.08) * 1.4 + Math.sin(x * 0.19 + 2) * 0.6;
    if (y >= h) { bg.push(["█", KEYS[HILL + Math.min(3, Math.floor((y - h) * 0.8))]]); continue; }
    const v = clamp(y / 24 + (fbm(x * 0.05, y * 0.15, 2, 3) - 0.5) * 0.15);
    bg.push(["█", KEYS[SKY + Math.min(9, Math.floor(v * 10))]]);
  }
  return (t) => {
    for (let i = 0; i < bg.length; i++) { g.ch[i] = bg[i][0]; g.co[i] = bg[i][1]; }
    for (const [ox, cy, w, sp] of [[0, 4, 8, 1.2], [45, 7, 6, 0.8], [70, 3, 5, 1.6]]) {
      const cx = ((ox - t * sp) % (cols + 20) + cols + 20) % (cols + 20) - 10;
      ell(g, cx, cy, w, 1.5, (x, y, dx, dy) => g.set(x, y, "█", KEYS[CLOUD + (dy < 0 ? 2 : 1)]));
      ell(g, cx - w * 0.3, cy - 1, w * 0.45, 1.2, (x, y) => g.set(x, y, "█", KEYS[CLOUD + 2]));
    }
    const u = (t % LOOP) / LOOP;
    // dashed trail from recent positions
    for (let k = 1; k <= 40; k++) {
      const v = u - k * 0.006;
      if (v < 0) break;
      if (Math.floor(k / 2) % 2) continue;
      const [x, y] = path(v);
      g.set(x, y, "█", KEYS[TRAIL + (k < 15 ? 1 : 0)]);
    }
    const [px, py, hd] = path(u);
    const ca = Math.cos(hd), sa = Math.sin(hd);
    // plane: a dart in local coords (s forward, w across); drawn as two wings split by a fold
    for (let y = Math.floor(py - 11); y <= py + 11; y++) for (let x = Math.floor(px - 18); x <= px + 18; x++) {
      const dx = x + 0.5 - px, dy = (y + 0.5 - py) * 2;
      const s = (dx * ca + dy * sa) / 1.35, w = (-dx * sa + dy * ca) / 1.35;
      if (s < -11 || s > 11) continue;
      const half = (11 - s) * 0.36;
      const keel = s > -9 && s < 6 ? Math.min(half * 0.75, (s + 9) * 0.45) : 0;
      if (w < -half || w > keel) continue;
      const top = w < 0;
      const fold = Math.abs(w) < 0.6;
      const lit = top ? 0.98 - (11 - s) * 0.012 - (w < -half + 1 ? 0.15 : 0) : 0.4 - (11 - s) * 0.008;
      g.set(x, y, "█", fold ? KEYS[FOLD] : KEYS[PAPER + Math.min(5, Math.max(0, Math.floor(lit * 6)))]);
    }
    // face on the top wing: eyes stay upright
    const at = (ls, lw) => [Math.round(px + (ls * ca - lw * sa) * 1.35), Math.round(py + (ls * sa + lw * ca) * 0.675)];
    const blink = Math.abs((t % 3.1) - 2.4) < 0.1;
    for (const [es, ew] of [[2, -3], [-3, -4.5]]) {
      const [ex, ey] = at(es, ew);
      g.set(ex, ey, blink ? "▄" : "█", KEYS[EYE]);
    }
    const [mx, my] = at(-1, -1.6);
    g.text(mx - 1, my, "▀▀", KEYS[EYE]);
    const [kx, ky] = at(-5, -2.6);
    g.set(kx, ky, "▄", KEYS[PINK]);
    return g.frame();
  };
}
