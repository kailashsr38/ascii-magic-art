/* swimming-whale: a humpback whale gliding beneath the waves, surfacing now and then to blow a spout. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, TAU, smooth } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const SKY = add(gradient(["#3a78c0", "#6aa2dc", "#a4ccec", "#d8ecf8"], 8));
const CLOUD = add(["#e4eef6", "#ffffff"]);
const SEA = add(gradient(["#0a2a50", "#104070", "#185890", "#2270a8", "#3a8cc0", "#5aa8d4", "#84c4e4"], 14));
const BACK = add(gradient(["#06080e", "#0e1420", "#182232", "#243248", "#36485e"], 8));
const BELLY = add(gradient(["#7a8ea4", "#a4b6c8", "#cad8e4"], 4));
const FOAM = add(["#bfe4f4", "#ffffff"]);
const EYE = add(["#05080e"]);

export const meta = {
  slug: "swimming-whale",
  name: "Swimming Whale",
  category: "animals",
  note: "A humpback whale glides beneath the waves through shafts of light, rising now and then to blow a spout.",
  tags: ["whale", "ocean", "sea", "underwater", "hero", "wallpaper"],
  cols: 100, rows: 34, fps: 24,
  palette: palette(P),
};

const SH = " ░▒▓█";
const CYCLE = 12;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const surf = 8;
  const r = rng(17);
  const motes = Array.from({ length: 70 }, () => [r() * cols, surf + 1 + r() * (rows - surf - 1), 0.5 + r() * 2, r() < 0.15]);
  const spout = Array.from({ length: 60 }, () => [r() - 0.5, r(), 0.6 + r() * 0.6]);
  const L = 56;
  return (t) => {
    g.clear();
    const p = (t % CYCLE) / CYCLE;
    const rise = smooth(clamp((p - 0.35) / 0.2)) * (1 - smooth(clamp((p - 0.75) / 0.2)));
    const wy = 21 - rise * 9.2 + Math.sin(t * 0.8) * 0.6;
    const hx = 72 + Math.sin(t * 0.3) * 4;
    for (let y = 0; y < surf; y++) for (let x = 0; x < cols; x++) {
      const c = fbm(x * 0.04 - t * 0.05, y * 0.3, 3, 4);
      const v = clamp(0.2 + (y / surf) * 0.75);
      if (c > 0.6 && y < surf - 2) g.set(x, y, c > 0.67 ? "█" : "▓", KEYS[CLOUD + (c > 0.65 ? 1 : 0)]);
      else g.set(x, y, SH[1 + Math.min(2, Math.floor(v * 3))], KEYS[SKY + Math.min(7, Math.floor(v * 8))]);
    }
    for (let y = surf; y < rows; y++) for (let x = 0; x < cols; x++) {
      const d = (y - surf) / (rows - surf);
      const ray = Math.sin((x + y * 0.7) * 0.16 - t * 0.25) > 0.75 ? 0.12 * (1 - d) : 0;
      const n = fbm(x * 0.05 + t * 0.15, y * 0.15, 3, 2);
      const v = clamp(0.92 - d * 0.75 + ray + (n - 0.5) * 0.25);
      g.set(x, y, ray > 0.03 ? "▒" : "▓", KEYS[SEA + Math.min(13, Math.floor(v * 14))]);
    }
    for (let x = 0; x < cols; x++) {
      const n = noise2(x * 0.3 + t * 1.2, 1, 3);
      g.set(x, surf, n > 0.6 ? "~" : n > 0.3 ? "≈" : "▀", KEYS[FOAM + (n > 0.6 ? 1 : 0)]);
    }
    for (const [mx, my, sp, big] of motes) {
      let x = (mx - t * sp * 2.2) % cols; if (x < 0) x += cols;
      g.set(x, my, big ? "o" : "·", KEYS[big ? FOAM : SEA + 12]);
    }
    const yc = (s) => wy + Math.sin(s * 3.2 - t * 2.4) * s * s * 2.2 + rise * s * 2.5;
    const half = (s) => s < 0.1 ? 1.8 + 3.4 * Math.sqrt(s / 0.1) : s < 0.42 ? 5.2 : 5.2 * Math.pow(1 - (s - 0.42) / 0.58, 1.3) + 0.45 + (s > 0.6 && s < 0.66 ? 0.8 : 0);
    const finA = Math.sin(t * 1.3) * 0.25;
    const finFront = () => { for (let k = 0; k <= 16; k++) {
      const fx = hx - L * 0.22 - k * 1.1, fy = yc(0.22) + 3.5 + k * 0.5 + Math.sin(finA) * k * 0.2;
      const w = k < 12 ? 2 : 1;
      for (let q = 0; q <= w; q++) g.set(fx + q, fy, "█", KEYS[BELLY + (q ? 2 : 1)]);
      if (k % 4 === 2) g.set(fx, fy + 1, "▀", KEYS[BELLY + 3]);
    } };
    for (let x = Math.floor(hx - L); x <= hx + 1; x++) {
      const s = (hx - x) / L;
      if (s < 0 || s > 1) continue;
      const c = yc(s), h = half(s);
      for (let y = Math.floor(c - h); y <= c + h; y++) {
        const rel = (y - c) / h;
        if (Math.abs(rel) > 1) continue;
        if (rel > 0.25) {
          const groove = s < 0.5 && Math.round(y) % 2 === 0;
          g.set(x, y, groove ? "▄" : "█", KEYS[BELLY + Math.min(3, Math.floor((rel - 0.25) * 3) + (groove ? 0 : 1))]);
        } else {
          const n = noise2(x * 0.4, y * 0.7, 6);
          const lit = clamp(0.55 - rel * 0.35 + (n - 0.5) * 0.3 - (rel < -0.8 ? 0.15 : 0) + (y < surf ? 0.3 : 0));
          g.set(x, y, n > 0.82 ? "▒" : "█", KEYS[BACK + Math.min(7, Math.floor(lit * 8))]);
        }
      }
      if (s < 0.2) g.set(x, Math.round(c + h * 0.3), "▀", KEYS[BACK]);
    }
    finFront();
    g.set(hx - L * 0.13, Math.round(yc(0.13) + 0.5), "●", KEYS[EYE]);
    for (let k = 0; k < 6; k++) g.set(hx - 1 - k * 1.6, Math.round(yc(0.02 + k * 0.03) - half(0.02 + k * 0.03) + 0.4), "▪", KEYS[BACK + 5]);
    const tx = hx - L, ty = yc(1);
    const flap = Math.sin(t * 2.4 - 3.2) * 1.5;
    for (let k = 0; k <= 11; k++) {
      const yy = ty + flap * k / 11;
      const th = k < 2 ? 1 : k < 9 ? 1.6 : 0.6;
      for (let q = -th; q <= th; q += 1) g.set(tx - k, yy + q * 0.6, Math.abs(q) >= th - 0.1 ? "▓" : "█", KEYS[BACK + (q < 0 ? 4 : 2)]);
    }
    g.set(tx - 6, ty + flap * 6 / 11, "▒", KEYS[BACK + 1]);
    if (rise > 0.6) {
      const bx = hx - L * 0.12, by = yc(0.12) - half(0.12);
      const amt = clamp((rise - 0.6) / 0.4);
      for (const [sx, ph, sp] of spout) {
        const a = (t * sp * 1.4 + ph) % 1;
        const h = a * 8 * amt;
        const x = bx + sx * (2 + a * 12) * amt;
        const y = Math.min(by, surf) - h + a * a * 3;
        if (y < -1) continue;
        g.set(x, y, a < 0.4 ? "█" : a < 0.7 ? "▓" : "░", KEYS[FOAM + (a < 0.6 ? 1 : 0)]);
      }
    }
    return g.frame();
  };
}
