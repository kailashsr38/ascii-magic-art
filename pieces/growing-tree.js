/* growing-tree: a seed sprouts, branches, leafs out, turns gold and drops its leaves, then starts again. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const SKY = add(gradient(["#3a6fb0", "#6a9ad0", "#a8c8e8", "#e2eef4"], 10));
const SOIL = add(gradient(["#1e120a", "#3a2414", "#5c3a20", "#7c5430"], 6));
const GRASS = add(gradient(["#2a5a1e", "#4a8a2a", "#7ab840"], 3));
const BARK = add(gradient(["#2a1a0e", "#4e321c", "#76502e", "#9a7046"], 6));
const LEAF = add(gradient(["#1f5a1c", "#2f7a26", "#4e9e34", "#86c04a", "#c8c03a", "#e89a2a", "#d0581e", "#a8301a"], 16));
const SUN = add(["#fff2b0"]);

export const meta = {
  slug: "growing-tree",
  name: "Growing Tree",
  category: "weather",
  note: "A seed sprouts and grows into a branching tree, leafs out, turns gold, drops its leaves and starts again.",
  tags: ["tree", "growth", "seasons", "loader", "hero", "plant"],
  cols: 90, rows: 36, fps: 24,
  palette: palette(P),
};

const CYCLE = 18;
const SH = " ░▒▓█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const gy = 29, cx = 45;
  const r = rng(42);
  const segs = [], tips = [];
  const grow = (x, y, ang, len, depth, t0, root) => {
    const x1 = x + Math.cos(ang) * len, y1 = y + Math.sin(ang) * len;
    const t1 = t0 + len;
    segs.push({ x, y, x1, y1, depth, t0, t1, root });
    const maxD = root ? 3 : 6;
    if (depth >= maxD) { if (!root) tips.push({ x: x1, y: y1, t: t1, s: r() }); return; }
    const n = depth < 1 ? 2 : r() < 0.35 ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const spread = (n === 2 ? (i ? 1 : -1) * (0.35 + r() * 0.25) : (i - 1) * 0.55) + (r() - 0.5) * 0.2;
      grow(x1, y1, ang + spread, len * (0.68 + r() * 0.12), depth + 1, t1, root);
    }
  };
  grow(0, 0, Math.PI / 2, 6.3, 0, 0, false);
  grow(0, 0, -Math.PI / 2, 2.5, 1, 0, true);
  let maxT = 0;
  for (const s of segs) maxT = Math.max(maxT, s.t1);
  const falls = Array.from({ length: 60 }, (_, i) => ({ tip: tips[i % tips.length], ph: r(), sw: r() * TAU, dx: (r() - 0.5) * 10 }));
  const toScreen = (wx, wy) => [cx + wx * 2, gy - wy];
  return (t) => {
    g.clear();
    const p = (t + 10) % CYCLE;
    const G = clamp((p - 1.2) / 7.5);
    const L = clamp((p - 6.5) / 3.5);
    const autumn = clamp((p - 12) / 2.5);
    const drop = clamp((p - 14) / 2.6);
    const fadeOut = clamp((p - 17) / 0.9);
    for (let y = 0; y < gy; y++) for (let x = 0; x < cols; x++) {
      const c = fbm(x * 0.04 + t * 0.03, y * 0.15, 3, 2);
      const sd = Math.hypot((x - 76) / 2, y - 5);
      const v = clamp(0.15 + (y / gy) * 0.55 + (c - 0.5) * 0.5 + Math.exp(-sd / 5) * 0.6);
      g.set(x, y, SH[1 + Math.min(3, Math.floor(v * 3.6))], KEYS[SKY + Math.min(9, Math.floor(v * 10))]);
    }
    for (let y = 3; y <= 7; y++) for (let x = 70; x <= 82; x++) if (Math.hypot((x - 76) / 2, y - 5) < 2.4) g.set(x, y, "█", KEYS[SUN]);
    for (let y = gy; y < rows; y++) for (let x = 0; x < cols; x++) {
      const n = fbm(x * 0.15, y * 0.4, 2, 5);
      g.set(x, y, n > 0.62 ? "▒" : n > 0.38 ? "▓" : "█", KEYS[SOIL + Math.min(5, Math.floor((1 - (y - gy) / (rows - gy)) * 3 + n * 3))]);
      if (noise2(x * 0.9, y * 1.3, 7) > 0.85) g.set(x, y, "o", KEYS[SOIL + 5]);
    }
    for (let x = 0; x < cols; x++) {
      const n = noise2(x * 0.7, t * 0.5, 3);
      g.set(x, gy - 1, n > 0.6 ? "/" : n > 0.3 ? "|" : "\\", KEYS[GRASS + (x % 3 ? 1 : 2)]);
      g.set(x, gy, "▀", KEYS[GRASS]);
    }
    if (p < 2.2) {
      g.text(cx - 1, gy + 2, "(●)", KEYS[BARK + 3]);
      if (p > 0.6) g.set(cx, gy + 1, "|", KEYS[GRASS + 1]);
      if (p > 1.0) g.text(cx - 1, gy - 1, "\\|/", KEYS[GRASS + 2]);
    }
    const shown = G * maxT;
    for (const s of segs) {
      if (shown <= s.t0 && !s.root) continue;
      const span = s.root ? clamp(G * 2) : clamp((shown - s.t0) / (s.t1 - s.t0));
      if (span <= 0) continue;
      const wx = s.x + (s.x1 - s.x) * span, wy = s.y + (s.y1 - s.y) * span;
      const thick = s.root ? 0.4 : Math.max(0.2, (1.9 - s.depth * 0.33) * (0.4 + 0.6 * G));
      const steps = Math.ceil(Math.hypot(wx - s.x, wy - s.y) * 3) + 1;
      for (let k = 0; k <= steps; k++) {
        const u = k / steps;
        const [sx, sy] = toScreen(s.x + (wx - s.x) * u, s.y + (wy - s.y) * u);
        if (thick < 0.45) {
          const ang = Math.atan2(s.y1 - s.y, s.x1 - s.x);
          const a = Math.abs(Math.cos(ang));
          const ch = a < 0.38 ? "|" : a > 0.92 ? "_" : (Math.cos(ang) * Math.sin(ang) > 0 ? "/" : "\\");
          g.set(sx, sy, fadeOut > 0.5 ? "░" : ch, KEYS[BARK + (s.root ? 4 : 2)]);
        } else {
          const rw = Math.round(thick * 2);
          for (let dx = -rw; dx <= rw; dx++) {
            const lit = clamp(0.5 - dx / (rw + 1) * 0.45);
            g.set(sx + dx, sy, fadeOut > 0.5 ? "░" : Math.abs(dx) === rw ? "▓" : "█", KEYS[BARK + Math.min(5, Math.floor(lit * 6))]);
          }
        }
      }
    }
    const leafAmt = L * (1 - drop * 0.95) * (1 - fadeOut);
    if (leafAmt > 0.02) for (const tip of tips) {
      if (shown < tip.t) continue;
      const rad = 3.2 * leafAmt * (0.8 + tip.s * 0.4);
      const [tx, ty] = toScreen(tip.x, tip.y);
      const rx = Math.ceil(rad * 2), ry = Math.ceil(rad);
      for (let y = Math.floor(ty - ry); y <= ty + ry; y++) for (let x = Math.floor(tx - rx); x <= tx + rx; x++) {
        const d = Math.hypot((x - tx) / 2, y - ty) / rad;
        const n = noise2(x * 0.45 + Math.sin(t * 1.3) * 0.3, y * 0.8, 11);
        if (d + (n - 0.5) * 0.7 > 1) continue;
        const shade = clamp(0.7 - (y - ty) / (ry + 1) * 0.35 + (n - 0.5) * 0.6);
        const k = Math.min(15, Math.floor(shade * 4) + Math.floor(autumn * 9 + tip.s * autumn * 3));
        g.set(x, y, n > 0.66 ? "@" : n > 0.5 ? "%" : n > 0.3 ? "▓" : "&", KEYS[LEAF + k]);
      }
    }
    if (drop > 0 && fadeOut < 1) for (const f of falls) {
      const a = clamp(drop * 1.6 - f.ph * 0.6);
      if (a <= 0 || a >= 1) continue;
      const [tx, ty] = toScreen(f.tip.x, f.tip.y);
      const y = ty + (gy - 1 - ty) * a;
      const x = tx + f.dx * a + Math.sin(t * 3 + f.sw) * 2;
      g.set(x, y, Math.sin(t * 5 + f.sw) > 0 ? "◆" : "-", KEYS[LEAF + 10 + Math.floor(f.ph * 5)]);
    }
    return g.frame();
  };
}
