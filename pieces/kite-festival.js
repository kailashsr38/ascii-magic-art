/* kite-festival: a sky full of bright paper kites bobbing on their strings above crowded flat rooftops. */
import { Grid, palette, gradient, KEYS, fbm, clamp, rng } from "../lib/kit.js";

const SKY = gradient(["#1f5fc8", "#3a82e0", "#6aa8ee", "#a8ccf2", "#f2dcb8", "#ffcf90"], 12); // 0..11
const KC = ["#ff2e5a", "#ffc800", "#18b45a", "#2a6aff", "#ff7a00", "#b03adf", "#00b8c8", "#ffffff"]; // 12..19
const DIM = ["#c86a84", "#d8b86a", "#5aa878", "#6a8ad8", "#d89a5a", "#a87ac8", "#5ab0b8", "#e8eef8"];  // 20..27
const WALLS = ["#f2a0b0", "#f6d26a", "#7ad0c8", "#f4ece0", "#e8a070", "#b8a8e8"];                     // 28..33
const WSH = ["#b06878", "#b8963a", "#3a9088", "#b8ae9e", "#a86838", "#7a6aa8"];                       // 34..39
const NAMED = ["#2a2030", "#5a4a5a", "#3a2a24", "#ffe9a8", "#e8e4f0"];                                // 40 window, 41 tank, 42 person, 43 sun, 44 string
const pal = palette([...SKY, ...KC, ...DIM, ...WALLS, ...WSH, ...NAMED]);

export const meta = {
  slug: "kite-festival",
  name: "Kite Festival",
  category: "occasions",
  note: "Dozens of bright paper kites with fluttering tails bob on their strings above crowded, colourful flat rooftops.",
  tags: ["kite", "festival", "sky", "rooftops", "spring", "hero"],
  cols: 100, rows: 36, fps: 20,
  palette: pal,
};

const SH = " ░▒▓█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(77);
  // rooftops
  const houses = [];
  let x = 0;
  while (x < cols) {
    const w = 8 + Math.floor(r() * 9), top = 23 + Math.floor(r() * 6);
    houses.push({ x, w, top, c: Math.floor(r() * 6), tank: r() < 0.5, person: r() < 0.55 });
    x += w;
  }
  const kites = Array.from({ length: 16 }, (_, i) => {
    const far = i < 7;
    return { x: ((i * 7) % 16 + 0.5) / 16 * cols + (r() - 0.5) * 4, y: (far ? 3 : 6) + r() * (far ? 8 : 12), h: far ? 2 : 3 + Math.floor(r() * 2), c1: Math.floor(r() * 7), c2: Math.floor(r() * 7), ph: r() * 6.28, far };
  });
  kites.forEach((k) => { if (k.c2 === k.c1) k.c2 = (k.c1 + 3) % 7; });
  return (t) => {
    g.clear();
    // morning sky with a low sun and wisps
    for (let y = 0; y < rows; y++) for (let xx = 0; xx < cols; xx++) {
      const sun = Math.exp(-Math.hypot((xx - 82) * 0.5, y - 20) / 5);
      const n = fbm(xx * 0.04 - t * 0.04, y * 0.25, 3);
      const v = clamp(y / 30 + (n - 0.5) * 0.25 + sun * 0.4);
      g.set(xx, y, n > 0.62 ? "▓" : "█", KEYS[Math.min(11, Math.floor(v * 12))]);
    }
    for (let y = 16; y < 24; y++) for (let xx = 74; xx < 91; xx++) if (Math.hypot((xx - 82) * 0.5, (y - 20)) < 3.2) g.set(xx, y, "█", KEYS[43]);
    // kites, far ones first
    const anchors = [];
    for (const k of kites) {
      const kx = k.x + Math.sin(t * 0.5 + k.ph) * 3 + Math.sin(t * 1.7 + k.ph) * 0.8;
      const ky = k.y + Math.sin(t * 1.1 + k.ph * 2) * 1.2;
      const cx = Math.round(kx), cy = Math.round(ky);
      const h = k.h, w = h * 2;
      const base = k.far ? 20 : 12;
      // tail first so the kite sits over it
      for (let i = 1; i <= h * 3; i++) {
        const tx = cx + Math.round(Math.sin(t * 4 + i * 0.7 + k.ph) * 1.5), ty = cy + h + i;
        g.set(tx, ty, i % 3 === 0 ? "█" : "▌", KEYS[base + (i % 3 === 0 ? k.c2 : k.c1)]);
      }
      for (let j = -h; j <= h; j++) for (let i = -w; i <= w; i++) {
        const dy = j < 0 ? -j / h : j / (h * 1.0);
        if (Math.abs(i) / w + dy > 1.0001) continue;
        const left = i < 0, up = j < 0;
        const col = (left === up) ? k.c1 : k.c2;
        const spar = i === 0 || j === 0;
        g.set(cx + i, cy + j, spar && !k.far && i === 0 ? "▌" : "█", spar && !k.far && i === 0 ? KEYS[42] : KEYS[base + col]);
      }
      if (!k.far) anchors.push([cx, cy + 1]);
    }
    // houses with parapets, windows and water tanks
    for (const hs of houses) {
      for (let y = hs.top; y < rows; y++) for (let i = 0; i < hs.w; i++) {
        const xx = hs.x + i;
        const shade = i === hs.w - 1 || i === hs.w - 2;
        const win = y > hs.top + 1 && (y - hs.top) % 3 !== 1 && i % 4 === 2;
        let ch = "█", k = KEYS[(shade ? 34 : 28) + hs.c];
        if (y === hs.top) { ch = i % 2 ? "▄" : "█"; k = KEYS[34 + hs.c]; }
        if (win) { ch = "█"; k = KEYS[40]; }
        g.set(xx, y, ch, k);
      }
      if (hs.tank) { g.text(hs.x + 1, hs.top - 2, "▄██▄", KEYS[41]); g.text(hs.x + 1, hs.top - 1, "████", KEYS[41]); }
      if (hs.person) {
        const px = hs.x + hs.w - 4, py = hs.top - 1;
        g.set(px, py - 2, "●", KEYS[42]); g.set(px, py - 1, "█", KEYS[42]); g.set(px, py, "▌", KEYS[42]);
        const arm = Math.sin(t * 3 + hs.x) > 0 ? "╱" : "│";
        g.set(px + 1, py - 2, arm, KEYS[42]);
        // the string up to the nearest kite
        let best = null, bd = 1e9;
        for (const a of anchors) { const d = Math.abs(a[0] - px); if (d < bd) { bd = d; best = a; } }
        if (best && bd < 30) g.line(px + 1, py - 3, best[0], best[1], (lx, ly) => g.get(lx, ly), KEYS[44]);
      }
    }
    return g.frame();
  };
}
