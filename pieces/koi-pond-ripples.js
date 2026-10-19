/* koi-pond-ripples: a top-down koi pond, fish gliding under lily pads while rings spread across the water. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const WATER = add(gradient(["#062a30", "#0a3a42", "#0e4a52", "#165c62", "#227070", "#2e8480"], 10));
const RING = add(["#3a8a8a", "#6ac0bc", "#b4ece4"]);
const STONE = add(gradient(["#2a2a2a", "#4a4844", "#6e6a62", "#9a948a", "#c4bcb0"], 8));
const MOSS = add(["#2a4a1e", "#3e6a2a"]);
const PAD = add(gradient(["#123a14", "#1e5a1e", "#2e7a28", "#4c9a3a", "#7abc5a"], 8));
const LOTUS = add(["#f4a4c4", "#ffd4e4", "#ffe87a", "#c85a8a"]);
const KOI = add(["#ff5a1a", "#ff8a3a", "#f4f0e8", "#c8c4bc", "#1a1a1e", "#ffc83a", "#ffe08a", "#d03a10"]);

export const meta = {
  slug: "koi-pond-ripples",
  name: "Koi Pond Ripples",
  category: "animals",
  note: "Seen from above, orange, white and golden koi glide in slow loops beneath lily pads while rings spread across the dark pond water.",
  tags: ["koi", "fish", "pond", "zen", "calm", "wallpaper"],
  cols: 92, rows: 34, fps: 24,
  palette: palette(P),
};

const FISH = [
  { cx: 46, cy: 34, ax: 28, ay: 20, w: 0.2, ph: 0, len: 18, kind: 0 },
  { cx: 42, cy: 32, ax: 22, ay: 16, w: -0.26, ph: 2, len: 15, kind: 1 },
  { cx: 50, cy: 34, ax: 26, ay: 18, w: 0.17, ph: 4, len: 16, kind: 2 },
  { cx: 44, cy: 33, ax: 18, ay: 20, w: -0.19, ph: 1, len: 13, kind: 0 },
];
const PADS = [[14, 10, 7], [72, 9, 8], [78, 52, 7], [20, 54, 6], [56, 22, 5.5], [32, 40, 5]];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const W = cols, H = rows * 2;
  const bg = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const ex = Math.min(x, cols - 1 - x) / 6, ey = Math.min(y, rows - 1 - y) / 3;
    const edge = Math.min(ex, ey) + (noise2(x * 0.3, y * 0.6, 3) - 0.5) * 0.8;
    if (edge < 1) {
      const n = noise2(x * 0.45, y * 0.9, 6);
      const moss = noise2(x * 0.2, y * 0.4, 8) > 0.62;
      bg.push([n > 0.5 ? "█" : "▓", moss ? KEYS[MOSS + (n > 0.5 ? 1 : 0)] : KEYS[STONE + Math.min(7, Math.floor(n * 8))]]);
      continue;
    }
    const depth = clamp(fbm(x * 0.04, y * 0.08, 4, 2) * 0.9 + Math.min(1, edge - 1) * 0.1 - 0.05);
    bg.push([depth > 0.5 ? "▓" : "▒", KEYS[WATER + Math.min(9, Math.floor((1 - depth) * 4 + (edge < 1.6 ? 4 : 1)))], depth]);
  }
  const pos = (f, s) => [f.cx + Math.cos(f.w * s + f.ph) * f.ax, f.cy + Math.sin(f.w * 2 * s + f.ph * 1.3) * f.ay * 0.6 + Math.sin(f.w * s + f.ph) * f.ay * 0.4];
  const R = rng(9);
  const drops = Array.from({ length: 7 }, (_, i) => ({ x: 12 + R() * (W - 24), y: 8 + R() * (H - 16), per: 3 + R() * 3, off: R() * 6 }));
  return (t) => {
    for (let i = 0; i < bg.length; i++) { g.ch[i] = bg[i][0]; g.co[i] = bg[i][1]; }
    // koi
    for (const f of FISH) {
      const s0 = t;
      const pts = [];
      for (let k = 0; k <= f.len; k++) {
        const [x, y] = pos(f, s0 - (k * 1.0) / (Math.abs(f.w) * f.ax));
        pts.push([x, y]);
      }
      for (let k = f.len; k >= 0; k--) {
        const u = k / f.len;
        let [x, y] = pts[k];
        const [nx, ny] = pts[Math.max(0, k - 1)], [px, py] = pts[Math.min(f.len, k + 1)];
        let tx = nx - px, ty = ny - py; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
        const wig = Math.sin(u * 5 - t * 7) * u * 1.4;
        x += -ty * wig; y += tx * wig;
        const w = u < 0.85 ? 3.2 * Math.sin(Math.PI * Math.min(1, 0.2 + u * 0.95)) + 0.5 : 0.8;
        for (let sy = Math.floor((y - w) / 2); sy <= Math.ceil((y + w) / 2); sy++) for (let sx = Math.floor(x - w); sx <= Math.ceil(x + w); sx++) {
          const ox = sx + 0.5 - x, oy = sy * 2 + 1 - y;
          if (ox * ox + oy * oy > w * w) continue;
          const side = (-ty * ox + tx * oy) / (w || 1);
          const n = noise2(k * 0.5 + f.ph * 7, side * 1.5, 13);
          let c;
          if (f.kind === 0) c = n > 0.5 ? (side < -0.2 ? 1 : 0) : 2;
          else if (f.kind === 1) c = side < -0.3 ? 6 : 5;
          else c = n > 0.62 ? 4 : n > 0.42 ? 7 : 2;
          if (k === 0 && f.kind !== 1) c = 2;
          g.set(sx, sy, side < -0.6 ? "▓" : "█", KEYS[KOI + c]);
        }
        if (k === f.len) {
          for (const sgn of [-1, 1]) for (let q = 1; q <= 4; q++) g.set(x + tx * -q * 0.2 - ty * sgn * q * 0.9 - tx * q, (y + ty * -q * 0.2 + tx * sgn * q * 0.9 - ty * q) / 2, q > 2 ? "░" : "▒", KEYS[KOI + (f.kind === 1 ? 6 : 3)]);
        }
        if (k === 3) for (const sgn of [-1, 1]) g.set(x - ty * sgn * 3.6, (y + tx * sgn * 3.6) / 2, "▒", KEYS[KOI + 3]);
      }
      // eyes
      const [hx, hy] = pts[0], [ax2, ay2] = pts[2];
      let tx = hx - ax2, ty = hy - ay2; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      for (const sgn of [-1, 1]) g.set(hx - tx * 0.5 - ty * sgn * 1.4, (hy - ty * 0.5 + tx * sgn * 1.4) / 2, "●", KEYS[KOI + 4]);
    }
    // ripple rings
    for (const d of drops) {
      const a = ((t + d.off) % d.per) / d.per;
      if (a > 0.8) continue;
      const r = 1 + a * 14;
      const k = a < 0.25 ? 2 : a < 0.55 ? 1 : 0;
      const n = Math.ceil(r * 7);
      for (let i = 0; i < n; i++) {
        const an = (i / n) * TAU;
        const x = d.x + Math.cos(an) * r, y = (d.y + Math.sin(an) * r) / 2;
        const ci = Math.floor(x) + Math.floor(y) * cols;
        if (bg[ci] && bg[ci].length === 3) g.set(x, y, a < 0.4 ? "○" : "◦", KEYS[RING + k]);
      }
      if (r > 5 && a < 0.6) { const r2 = r - 4; for (let i = 0; i < Math.ceil(r2 * 7); i++) { const an = (i / Math.ceil(r2 * 7)) * TAU; const x = d.x + Math.cos(an) * r2, y = (d.y + Math.sin(an) * r2) / 2; const ci = Math.floor(x) + Math.floor(y) * cols; if (bg[ci] && bg[ci].length === 3) g.set(x, y, "·", KEYS[RING]); } }
    }
    // lily pads float above the fish
    PADS.forEach(([px, py, r], i) => {
      const cx = px + Math.sin(t * 0.15 + i) * 1.2, cy = py + Math.cos(t * 0.12 + i * 2) * 1.0;
      const notch = i * 1.3;
      for (let y = Math.floor((cy - r) / 2); y <= (cy + r) / 2; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
        const dx = x + 0.5 - cx, dy = y * 2 + 1 - cy, d = Math.hypot(dx, dy);
        if (d > r) continue;
        let a = Math.atan2(dy, dx) - notch; a = ((a % TAU) + TAU) % TAU;
        if (a < 0.45 && d > 0.8) continue;
        const vein = Math.abs(Math.sin(Math.atan2(dy, dx) * 5)) < 0.12;
        const v = clamp(0.35 + (1 - d / r) * 0.35 - dy / r * 0.2 + (vein ? 0.2 : 0));
        g.set(x, y, d > r - 1 ? "▓" : "█", KEYS[PAD + Math.min(7, Math.floor(v * 8))]);
      }
      if (i === 1 || i === 3) {
        const lx = Math.round(cx + 1), ly = Math.round(cy / 2);
        g.text(lx - 2, ly - 1, " ▄█▄ ", KEYS[LOTUS]);
        g.text(lx - 2, ly, "▐███▌", KEYS[LOTUS]);
        g.set(lx, ly, "●", KEYS[LOTUS + 2]);
        g.text(lx - 2, ly + 1, " ▀█▀ ", KEYS[LOTUS + 3]);
        g.set(lx - 2, ly - 1, "▓", KEYS[PAD + 3]); g.set(lx + 2, ly - 1, "▓", KEYS[PAD + 3]);
      }
    });
    return g.frame();
  };
}
