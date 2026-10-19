/* planet-astronaut-wave: a tiny astronaut stands on top of a slowly turning pocket planet and waves hello. */
import { Grid, palette, gradient, KEYS, fbm, noise2, clamp, rng, smooth, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const SPACE = add(gradient(["#04030c", "#0a0820", "#140e34", "#201648", "#2e1e5a"], 10));
const NEB = add(gradient(["#3a1a5a", "#5a2a7a", "#7a3a8a"], 3));
const STAR = add(["#8a8ab0", "#d8dcff", "#ffffff"]);
const PLAN = add(gradient(["#3a1a2a", "#5e2a3a", "#8a3e46", "#b45a4e", "#d87e5a", "#f0a86a"], 12));
const CRATER = add(["#2a1020", "#4a1e2e"]);
const SUIT = add(gradient(["#6a7084", "#9aa0b4", "#c8ccdc", "#eceef6", "#ffffff"], 8));
const VISOR = add(gradient(["#0a1440", "#16307a", "#2a5ab4", "#5aa0e4"], 4));
const ORANGE = add(["#ff8a2a", "#ffb45a"]);
const FACE = add(["#ffd0a8", "#1a0c06", "#ff8a8a"]);

export const meta = {
  slug: "planet-astronaut-wave",
  name: "Pocket Planet Astronaut",
  category: "mascots",
  note: "A tiny astronaut stands on top of a slowly turning pocket planet, waving hello from inside a round helmet as stars drift past.",
  tags: ["astronaut", "mascot", "space", "planet", "404", "hero"],
  cols: 64, rows: 30, fps: 24,
  palette: palette(P),
};

const ell = (g, cx, cy, rx, ry, fn) => {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy;
    if (d <= 1) fn(x, y, dx, dy, d);
  }
};
const limb = (g, x0, y0, x1, y1, r, ch, co) => {
  const n = Math.ceil(Math.hypot(x1 - x0, (y1 - y0) * 2) * 2) + 1;
  for (let i = 0; i <= n; i++) {
    const u = i / n, x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u;
    for (let yy = Math.floor(y - r); yy <= y + r; yy++) for (let xx = Math.floor(x - r); xx <= x + r; xx++)
      if (Math.hypot(xx + 0.5 - x, (yy + 0.5 - y) * 2) <= r) g.set(xx, yy, ch, co);
  }
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const bg = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const n = fbm(x * 0.05, y * 0.11, 4, 8);
    const v = clamp(0.15 + (n - 0.4) * 1.1);
    bg.push(n > 0.62 ? ["▒", KEYS[NEB + Math.min(2, Math.floor((n - 0.62) * 12))]] : [" ░▒"[1 + Math.min(1, Math.floor(v * 2))], KEYS[SPACE + Math.min(9, Math.floor(v * 10))]]);
  }
  const r = rng(21);
  const stars = Array.from({ length: 40 }, () => [r() * cols, Math.floor(r() * 20), Math.floor(r() * 3)]);
  const PX = 32, PY = 35, PR = 22;
  return (t) => {
    for (let i = 0; i < bg.length; i++) { g.ch[i] = bg[i][0]; g.co[i] = bg[i][1]; }
    for (const [sx, sy, b] of stars) {
      const x = ((sx - t * (0.6 + b * 0.5)) % cols + cols) % cols;
      g.set(x, sy, b === 2 ? "+" : b ? "·" : ".", KEYS[STAR + b]);
    }
    // planet, turning: surface pattern scrolls with longitude
    const spin = t * 0.25;
    ell(g, PX, PY, PR * 1.25, PR * 0.62, (x, y, dx, dy, d) => {
      const lon = Math.asin(clamp(dx / Math.sqrt(Math.max(0.0001, 1 - dy * dy)), -1, 1)) + spin;
      const lat = dy * 2;
      const n = fbm(Math.cos(lon) * 2 + 5, lat + Math.sin(lon) * 2, 3, 3);
      const crater = noise2(lon * 4, lat * 3, 11) > 0.72;
      const lit = clamp(0.25 + Math.sqrt(1 - d) * 0.65 - dx * 0.25 + (n - 0.5) * 0.5);
      if (crater && d < 0.85) g.set(x, y, "▓", KEYS[CRATER + (lit > 0.5 ? 1 : 0)]);
      else g.set(x, y, d > 0.93 ? "▓" : "█", KEYS[PLAN + Math.min(11, Math.floor(lit * 12))]);
    });
    // astronaut standing on the top of the planet
    const top = PY - PR * 0.62; // y of surface at centre
    const ax = PX, feet = Math.floor(top) ;
    const p = t % 6;
    const wave = p < 0.4 ? smooth(p / 0.4) : p < 3.6 ? 1 : p < 4 ? 1 - smooth((p - 3.6) / 0.4) : 0;
    const hop = p > 4.4 && p < 5.2 ? Math.sin(((p - 4.4) / 0.8) * Math.PI) * 1.5 : 0;
    const by = feet - hop;
    // boots and legs
    for (const lx of [ax - 3, ax + 1]) { g.text(lx, by - 2, "██", KEYS[SUIT + 4]); g.text(lx - (lx < ax ? 1 : 0), by - 1, "▄██▄".slice(lx < ax ? 0 : 1, lx < ax ? 3 : 4), KEYS[SUIT + 1]); }
    // backpack
    for (let y = by - 9; y <= by - 4; y++) g.text(ax - 6, y, "▐█", KEYS[SUIT + 1]);
    // torso
    ell(g, ax, by - 5.5, 5, 3.4, (x, y, dx, dy) => g.set(x, y, "█", KEYS[SUIT + Math.min(7, Math.floor(clamp(0.8 - dx * 0.35 - dy * 0.2) * 8))]));
    g.text(ax - 2, by - 6, "▄▄", KEYS[ORANGE]); g.set(ax + 1, by - 6, "●", KEYS[VISOR + 3]);
    // resting arm
    limb(g, ax - 4, by - 7, ax - 6, by - 3.5, 1.1, "█", KEYS[SUIT + 3]);
    g.set(ax - 6, by - 3, "●", KEYS[SUIT + 4]);
    // waving arm
    const a1 = 0.4 + wave * 1.5, a2 = 0.3 + wave * (2.5 + Math.sin(t * 8) * 0.4);
    const sx = ax + 4, sy = by - 7;
    const ex = sx + Math.sin(a1) * 4, ey = sy + Math.cos(a1) * 2;
    const hx = ex + Math.sin(a2) * 5, hy = ey + Math.cos(a2) * 2.5;
    limb(g, sx, sy, ex, ey, 1.1, "█", KEYS[SUIT + 5]);
    limb(g, ex, ey, hx, hy, 1.1, "█", KEYS[SUIT + 6]);
    ell(g, hx, hy, 1.5, 1, (x, y) => g.set(x, y, "█", KEYS[SUIT + 7]));
    // helmet
    const hcx = ax, hcy = by - 12.5;
    ell(g, hcx, hcy, 6.5, 3.8, (x, y, dx, dy, d) => g.set(x, y, d > 0.75 ? "▓" : "█", KEYS[SUIT + Math.min(7, Math.floor(clamp(0.85 - dx * 0.3 - dy * 0.25) * 8))]));
    ell(g, hcx + 0.5, hcy + 0.3, 4.8, 2.6, (x, y, dx, dy) => g.set(x, y, "█", KEYS[VISOR + Math.min(3, Math.floor(clamp(0.4 - dy * 0.3 + dx * 0.2) * 4))]));
    // face behind visor
    ell(g, hcx + 0.5, hcy + 0.5, 3.4, 1.8, (x, y) => g.set(x, y, "█", KEYS[FACE]));
    const blink = Math.abs((t % 3.7) - 2.9) < 0.12;
    for (const ex2 of [hcx - 1, hcx + 2]) g.set(ex2, hcy + 0.3, blink ? "▄" : "█", KEYS[FACE + 1]);
    g.text(Math.round(hcx - 2), Math.round(hcy + 1.2), "▄", KEYS[FACE + 2]); g.text(Math.round(hcx + 3), Math.round(hcy + 1.2), "▄", KEYS[FACE + 2]);
    g.text(Math.round(hcx), Math.round(hcy + 1.2), wave > 0.5 ? "▀▀" : "▄▄", KEYS[FACE + 1]);
    g.text(Math.round(hcx + 2), Math.round(hcy - 2), "▄", KEYS[STAR + 2]); g.set(Math.round(hcx + 3), Math.round(hcy - 1), "▘", KEYS[STAR + 2]);
    // antenna
    g.vline(hcx - 4, Math.round(hcy - 5), Math.round(hcy - 3), "│", KEYS[SUIT + 2]);
    g.set(hcx - 4, Math.round(hcy - 6), "●", KEYS[ORANGE + (Math.floor(t * 2) % 2)]);
    return g.frame();
  };
}
