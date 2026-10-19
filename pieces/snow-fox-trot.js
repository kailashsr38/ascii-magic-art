/* snow-fox-trot: a red fox trotting through fresh snow past pine woods, leaving a line of paw prints. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const SKY = add(gradient(["#8aa4c8", "#b4c4dc", "#dcd4e0", "#f4dccc", "#ffe4c4"], 10));
const MTN = add(gradient(["#7a8aa8", "#94a2bc", "#b4c0d4"], 4));
const PINE = add(gradient(["#0e2420", "#1a3a30", "#2a5244", "#3e6a58"], 6));
const SNOW = add(gradient(["#6a7ea4", "#90a4c8", "#b8c8e4", "#dce6f4", "#f6faff"], 10));
const FOX = add(gradient(["#6a2408", "#9a3a10", "#c85418", "#e8742a", "#f89a48", "#ffbc74"], 10));
const WHITE = add(["#f4f0ea", "#d8d4cc"]);
const DARK = add(["#1a0c06", "#3a1c0e"]);
const EYE = add(["#0a0604", "#ffe08a"]);
const PRINT = add(["#5a6e96", "#7a8eb4"]);

export const meta = {
  slug: "snow-fox-trot",
  name: "Fox Trotting in Snow",
  category: "animals",
  note: "A red fox trots through fresh powder past snowy pine woods, bushy tail swaying and paw prints trailing behind it as snow falls.",
  tags: ["fox", "winter", "snow", "animals", "forest", "wallpaper"],
  cols: 96, rows: 34, fps: 24,
  palette: palette(P),
};

const SH = " ░▒▓█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const R = rng(4);
  const flakes = Array.from({ length: 140 }, () => [R() * cols, R() * rows, 0.5 + R() * 1.5, R() * TAU]);
  const GROUND = 22;
  const fill = (cx, cy, rx, ry, fn) => {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy;
      if (d <= 1) fn(x, y, dx, dy, d);
    }
  };
  const pine = (x, base, h, k, dark) => {
    for (let j = 0; j < h; j++) {
      const w = (j / h) * h * 0.38 + 0.5;
      const y = base - h + j;
      for (let i = Math.floor(x - w); i <= x + w; i++) {
        const tier = (j % 3) === 0;
        const snowy = tier && Math.abs(i - x) < w - 0.5;
        g.set(i, y, snowy ? "▀" : "█", snowy ? KEYS[SNOW + 8] : KEYS[PINE + k + (i < x ? 0 : 1) - (dark ? 0 : 0)]);
      }
    }
    g.set(x, base, "█", KEYS[DARK + 1]);
  };
  return (t) => {
    const cam = t * 7;
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = y / GROUND;
      g.set(x, y, "█", KEYS[SKY + Math.min(9, Math.floor(v * 10))]);
    }
    for (let x = 0; x < cols; x++) {
      const wx = x + cam * 0.08;
      const h = 9 + fbm(wx * 0.03, 0.5, 4, 2) * 9;
      for (let y = Math.floor(GROUND - h); y < GROUND; y++) {
        const capped = y < GROUND - h + 2.5;
        g.set(x, y, capped ? "█" : "▓", KEYS[capped ? SNOW + 8 : MTN + Math.min(2, Math.floor((y - (GROUND - h)) / 3))]);
      }
    }
    // far pines then near pines
    for (let k = -2; k < 20; k++) {
      const wx = k * 7 + Math.floor(cam * 0.3 / 7) * 7;
      const x = Math.round(wx - cam * 0.3);
      const hh = 6 + Math.floor(noise2(wx * 0.3, 1, 3) * 6);
      pine(x, GROUND + 1, hh, 1, false);
    }
    for (let y = GROUND; y < rows; y++) for (let x = 0; x < cols; x++) {
      const wx = x + cam;
      const drift = fbm(wx * 0.06, y * 0.3, 3, 5);
      const v = clamp(0.95 - (y - GROUND) * 0.01 - drift * 0.35 + (y === GROUND ? 0.1 : 0));
      g.set(x, y, drift > 0.62 ? "▓" : "█", KEYS[SNOW + Math.min(9, Math.floor(v * 10))]);
    }
    for (let k = -1; k < 8; k++) {
      const wx = k * 17 + Math.floor(cam * 1.3 / 17) * 17;
      const x = Math.round(wx - cam * 1.3);
      const hh = 11 + Math.floor(noise2(wx * 0.2, 7, 3) * 6);
      if (noise2(wx * 0.13, 3, 9) > 0.58 && Math.abs(x - 50) > 22) pine(x, GROUND + 2, hh, 0, true);
    }
    // fox
    const ph = t * 7.5;
    const bx = 44, by = 24.5 + Math.sin(ph * 2) * 0.35;
    const foot = 31;
    // paw prints in world space, only behind the fox
    for (let k = Math.floor((cam - 10) / 3.5); k * 3.5 < cam + 40; k++) {
      const x = Math.round(k * 3.5 - cam + 40);
      if (x > bx - 4 || x < 0) continue;
      g.text(x, foot + 1 + (k % 2), "●", KEYS[PRINT + (k % 2)]);
    }
    fill(bx, foot + 1, 13, 1.4, (x, y) => g.set(x, y, "▓", KEYS[SNOW + 3]));
    // tail
    const sway = Math.sin(ph * 0.5) * 1.2;
    for (let i = 0; i <= 26; i++) {
      const u = i / 26;
      const x = bx - 10 - u * 16;
      const y = by - 1 - Math.sin(u * 2.2) * 2.6 + sway * u + u * u * 1.5;
      const r = 1.2 + Math.sin(Math.PI * Math.min(1, u * 1.05)) * 2.4;
      fill(x, y, r * 1.3, r * 0.65, (cx, cy, dx, dy) => {
        const tip = u > 0.8;
        const lit = clamp(0.7 - dy * 0.4);
        g.set(cx, cy, dy > 0.6 ? "▓" : "█", tip ? KEYS[WHITE + (dy > 0.4 ? 1 : 0)] : KEYS[FOX + 3 + Math.floor(lit * 6)]);
      });
    }
    // legs (far pair first, darker)
    const legs = [[-8, 0, 0.6], [7, Math.PI, 0.6], [-6, Math.PI, 1], [9, 0, 1]];
    for (const [ox, off, near] of legs) {
      const s = Math.sin(ph + off);
      const lift = Math.max(0, Math.cos(ph + off)) * 1.2;
      const hx = bx + ox, hy = by + 1.5;
      const fx = hx + s * 2.6, fy = foot - lift;
      const kx = (hx + fx) / 2 + 0.8, ky = (hy + fy) / 2;
      for (const o of [0, 1]) {
        g.line(hx + o, hy, kx + o, ky, "█", KEYS[near > 0.8 ? FOX + 4 : FOX + 1]);
        g.line(kx + o, ky, fx + o, fy, "█", KEYS[DARK + (near > 0.8 ? 1 : 0)]);
      }
      g.text(fx, fy, "▀▀▀", KEYS[DARK]);
    }
    // body
    fill(bx, by, 11.5, 3.3, (x, y, dx, dy) => {
      const lit = clamp(0.75 - dy * 0.45 + dx * 0.1);
      const belly = dy > 0.45 && dx > -0.2;
      g.set(x, y, "█", belly ? KEYS[WHITE] : KEYS[FOX + Math.min(9, 2 + Math.floor(lit * 8))]);
    });
    // neck, head, snout, ears
    const hx = bx + 12.5, hy = by - 3.2 + Math.sin(ph * 2 + 0.5) * 0.25;
    fill(bx + 9, by - 1.5, 4, 2.6, (x, y, dx, dy) => g.set(x, y, "█", dy > 0.2 && dx > 0 ? KEYS[WHITE] : KEYS[FOX + 6]));
    fill(hx, hy, 4.6, 2.5, (x, y, dx, dy) => {
      const cheek = dy > 0.25;
      g.set(x, y, "█", cheek ? KEYS[WHITE] : KEYS[FOX + Math.min(9, 5 + Math.floor((1 - dy) * 2.5))]);
    });
    for (let x = Math.floor(hx + 3); x <= hx + 8.5; x++) {
      const u = (x - (hx + 3)) / 5.5;
      g.set(x, Math.round(hy + 0.2), "█", KEYS[FOX + 7]);
      if (u < 0.75) g.set(x, Math.round(hy + 1.2), "▀", KEYS[WHITE]);
    }
    g.set(Math.round(hx + 9), Math.round(hy + 0.2), "●", KEYS[EYE]);
    for (const ex of [-1.8, 1.0]) {
      g.set(hx + ex, hy - 4.2, "▄", KEYS[DARK]);
      g.text(Math.floor(hx + ex - 0.5), hy - 3.2, "█▌", KEYS[FOX + 3]);
      g.set(Math.floor(hx + ex - 0.5), hy - 3.2, "▐", KEYS[DARK + 1]);
      g.text(Math.floor(hx + ex - 1), hy - 2.4, "███", KEYS[FOX + 5]);
    }
    g.set(Math.round(hx + 2), Math.round(hy - 0.6), "●", KEYS[EYE]);
    // falling snow over everything
    for (const [sx, sy, sp, ph2] of flakes) {
      const y = (sy + t * sp * 2.2) % rows;
      const x = ((sx - t * 2 + Math.sin(t * 0.8 + ph2) * 1.5) % cols + cols) % cols;
      if (sp > 1.3) g.set(x, y, "█", KEYS[SNOW + 9]);
      else { const i = Math.floor(x) + Math.floor(y) * cols; if (g.ch[i] === "█" || g.ch[i] === "▓") g.co[i] = KEYS[SNOW + 9]; }
    }
    return g.frame();
  };
}
