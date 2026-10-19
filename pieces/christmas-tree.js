/* christmas-tree: a decorated fir with twinkling lights, a shining star and presents in the snow. */
import { Grid, palette, gradient, KEYS, fbm, clamp, rng, fract } from "../lib/kit.js";

const SKY = gradient(["#040a18", "#0c1a36", "#1a2f5a", "#2c4a80"], 8);            // 0..7
const TREE = gradient(["#04200f", "#0b3a1a", "#145a28", "#1f7a36", "#3a9a4a", "#6cc46a"], 8); // 8..15
const SNOW = gradient(["#5a7096", "#9db2d4", "#d8e4f4", "#ffffff"], 6);            // 16..21
const NAMED = ["#ff3b3b", "#ffd23a", "#3ba0ff", "#4ae06a", "#ff6fd0", // 22..26 lights on
  "#5a1a1a", "#5a4a14", "#163a5a", "#164a22", "#5a1a4a",                     // 27..31 lights off
  "#fff4b0", "#ffe066", "#e0a020", "#5a3418", "#8a5a2a",                     // 32..36 star white, star, gold, trunk dark, trunk
  "#c41e2e", "#1e5ac4", "#1e8a3a", "#ffcf4a", "#e6edf3"];                    // 37..41 boxes, ribbon, flake
const pal = palette([...SKY, ...TREE, ...SNOW, ...NAMED]);

export const meta = {
  slug: "christmas-tree",
  name: "Christmas Tree",
  category: "occasions",
  note: "A decorated fir tree with twinkling coloured lights, gold garlands and a shining star, presents waiting in the snow.",
  tags: ["christmas", "holiday", "winter", "tree", "snow", "hero"],
  cols: 80, rows: 38, fps: 15,
  palette: pal,
};

const SH = " ░▒▓█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = 40, GROUND = 31;
  const tiers = [[7, 12, 1, 7], [10, 17, 3, 12], [15, 23, 5, 17], [21, 30, 7, 23]];
  const halfW = (y) => {
    let w = -1;
    for (const [ty, by, w0, w1] of tiers) if (y >= ty && y <= by) w = Math.max(w, w0 + (y - ty) / (by - ty) * (w1 - w0));
    return w;
  };
  const r = rng(3);
  const lights = [], baubles = [];
  while (lights.length < 46) {
    const y = 8 + Math.floor(r() * 22), x = cx + Math.round((r() * 2 - 1) * 24);
    const w = halfW(y);
    if (w > 1 && Math.abs(x - cx) < w - 0.5) lights.push([x, y, Math.floor(r() * 5), r() * 6.28, 1 + r() * 2]);
  }
  while (baubles.length < 14) {
    const y = 10 + Math.floor(r() * 20), x = cx + Math.round((r() * 2 - 1) * 22);
    const w = halfW(y);
    if (w > 2 && Math.abs(x - cx) < w - 1.5) baubles.push([x, y, r() < 0.5 ? 37 : 34]);
  }
  const flakes = Array.from({ length: 70 }, () => [r() * cols, r() * rows, 0.6 + r() * 1.4, r() * 6.28]);
  const presents = [[19, 27, 9, 4, 37], [29, 28, 7, 3, 38], [50, 28, 8, 3, 39], [59, 26, 10, 5, 38]];
  return (t) => {
    g.clear();
    // sky with a halo around the star
    for (let y = 0; y < GROUND; y++) for (let x = 0; x < cols; x++) {
      const halo = Math.exp(-Math.hypot((x - cx) * 0.5, y - 4) / 5) * (0.8 + 0.2 * Math.sin(t * 3));
      const n = fbm(x * 0.05, y * 0.12 + t * 0.02, 3);
      const v = clamp(0.2 + y / GROUND * 0.35 + (n - 0.5) * 0.4 + halo * 0.6);
      g.set(x, y, SH[1 + Math.min(2, Math.floor(v * 3))], KEYS[Math.min(7, Math.floor(v * 8))]);
    }
    // snowy ground with drifts
    for (let y = GROUND; y < rows; y++) for (let x = 0; x < cols; x++) {
      const drift = fbm(x * 0.08, y * 0.3, 3);
      const v = clamp(0.35 + (y - GROUND) * 0.06 + (drift - 0.5) * 0.8);
      g.set(x, y, SH[2 + Math.min(2, Math.floor(v * 3))], KEYS[16 + Math.min(5, Math.floor(v * 6))]);
    }
    for (let x = 0; x < cols; x++) if (fbm(x * 0.15, 3) > 0.5) g.set(x, GROUND - 1, "▄", KEYS[19]);
    // trunk
    for (let y = 30; y < 33; y++) for (let x = cx - 2; x <= cx + 2; x++) g.set(x, y, x === cx - 2 ? "▓" : "█", KEYS[x === cx + 2 ? 35 : 36]);
    // the tree, lit from the upper left
    for (let y = 7; y <= 30; y++) {
      const w = halfW(y);
      for (let x = Math.ceil(cx - w); x <= Math.floor(cx + w); x++) {
        const u = (x - cx) / Math.max(1, w);
        const n = fbm(x * 0.35, y * 0.7, 2);
        const v = clamp(0.55 - u * 0.3 + (n - 0.5) * 0.7 - (y % 6 === 0 ? 0.1 : 0));
        const edge = Math.abs(x - cx) > w - 1;
        g.set(x, y, edge ? "▒" : SH[2 + Math.min(2, Math.floor(v * 3))], KEYS[8 + Math.min(7, Math.floor(v * 8))]);
      }
    }
    // snow on the tips of each tier
    for (const [, by, , w1] of tiers) for (let x = cx - w1; x <= cx + w1; x++) if ((x * 7) % 5 < 2) g.set(x, by, "▀", KEYS[20]);
    // gold bead garlands drooping across each tier
    for (const [ty, by] of tiers.slice(1)) {
      const yy0 = ty + (by - ty) * 0.45;
      for (let x = cx - 24; x <= cx + 24; x++) {
        const w = halfW(Math.round(yy0));
        const u = (x - cx) / w;
        if (Math.abs(u) > 0.95) continue;
        const y = Math.round(yy0 + 1.6 * (1 - u * u) - u * 1.2);
        if (Math.abs(x - cx) < halfW(y) - 0.5) g.set(x, y, (x + Math.floor(t * 4)) % 2 ? "•" : "·", KEYS[34]);
      }
    }
    for (const [x, y, k] of baubles) { g.set(x, y, "●", KEYS[k]); }
    // twinkling lights, colours chasing
    for (const [x, y, c, ph, sp] of lights) {
      const on = Math.sin(t * sp + ph) > -0.2;
      const cc = (c + Math.floor(t * 0.7)) % 5;
      g.set(x, y, on ? (Math.sin(t * sp + ph) > 0.7 ? "◆" : "•") : "·", KEYS[(on ? 22 : 27) + cc]);
    }
    // the star
    const L = 2 + Math.round(1.5 + 1.5 * Math.sin(t * 2.5));
    g.set(cx, 3, "▲", KEYS[33]); g.set(cx - 1, 4, "◀", KEYS[33]); g.set(cx, 4, "█", KEYS[32]); g.set(cx + 1, 4, "▶", KEYS[33]);
    g.set(cx - 1, 5, "╱", KEYS[33]); g.set(cx + 1, 5, "╲", KEYS[33]); g.set(cx, 5, "▼", KEYS[34]);
    for (let i = 2; i <= L + 2; i++) { g.set(cx - i, 4, i > L ? "·" : "─", KEYS[i > L ? 34 : 33]); g.set(cx + i, 4, i > L ? "·" : "─", KEYS[i > L ? 34 : 33]); }
    if (L > 2) { g.set(cx, 2, "│", KEYS[33]); g.set(cx - 2, 2, "╲", KEYS[34]); g.set(cx + 2, 2, "╱", KEYS[34]); g.set(cx - 2, 6, "╱", KEYS[34]); g.set(cx + 2, 6, "╲", KEYS[34]); }
    if (L > 3) g.set(cx, 1, "·", KEYS[32]);
    // presents
    for (const [x, y, w, h, k] of presents) {
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) g.set(x + i, y + j, i === 0 ? "▓" : "█", KEYS[k]);
      const mx = x + Math.floor(w / 2);
      for (let j = 0; j < h; j++) g.set(mx, y + j, "█", KEYS[40]);
      for (let i = 0; i < w; i++) g.set(x + i, y + 1, i === mx - x ? "┼" : "━", KEYS[40]);
      g.set(mx - 1, y - 1, "◆", KEYS[40]); g.set(mx + 1, y - 1, "◆", KEYS[40]); g.set(mx, y - 1, "●", KEYS[34]);
    }
    // falling snow
    for (const [x0, y0, sp, ph] of flakes) {
      const y = (y0 + t * sp * 2) % rows;
      const x = (x0 + Math.sin(t * 0.8 + ph) * 1.5 + cols) % cols;
      g.set(x, y, sp > 1.4 ? "*" : sp > 1 ? "•" : "·", KEYS[sp > 1 ? 41 : 18]);
    }
    return g.frame();
  };
}
