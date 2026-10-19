/* ramadan-lanterns: brass lanterns glowing on long chains beneath a crescent moon, over a lit arcade. */
import { Grid, palette, gradient, KEYS, fbm, clamp, rng } from "../lib/kit.js";

const SKY = gradient(["#030816", "#071a33", "#0d2a4a", "#14405e", "#1d5670"], 10);     // 0..9
const WARM = gradient(["#2a2016", "#5a3a1a", "#8a5a22", "#b8802e"], 4);                  // 10..13
const MOON = gradient(["#c8a24a", "#f2d27a", "#fff2c0"], 3);                             // 14..16
const BRASS = gradient(["#4a3010", "#8a6420", "#d4a440", "#ffe08a"], 4);                 // 17..20
const GLASS = [];
for (const h of ["#ffb030", "#ff4a5a", "#3ad08a", "#3ac8e0"]) GLASS.push(...gradient(["#3a1a08", h, "#fff8e0"], 5).slice(1)); // 21..36
const NAMED = ["#0a1620", "#12222e", "#ffcf6a", "#ffe9b0", "#c8a24a", "#e8edf8"];         // 37 wall, 38 wall lit, 39 arch light, 40 arch hot, 41 trim, 42 star
const pal = palette([...SKY, ...WARM, ...MOON, ...BRASS, ...GLASS, ...NAMED]);

export const meta = {
  slug: "ramadan-lanterns",
  name: "Ramadan Lanterns",
  category: "occasions",
  note: "Brass lanterns with coloured glass glow and sway on long chains beneath a crescent moon, above a softly lit arcade.",
  tags: ["ramadan", "lanterns", "crescent", "night", "festival", "hero"],
  cols: 90, rows: 36, fps: 20,
  palette: pal,
};

const SH = " ░▒▓█";
const SPRITE = [
  "    o    ",
  "   ▄█▄   ",
  "  ▄███▄  ",
  " ▄█████▄ ",
  " █GGGGG█ ",
  " █GGGGG█ ",
  " █GGGGG█ ",
  " █GGGGG█ ",
  " █GGGGG█ ",
  " ▀█▀█▀█▀ ",
  "   ▀█▀   ",
  "    ▼    ",
];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(30);
  const L = [[5, 9], [15, 15], [25, 6], [33, 17], [59, 16], [67, 7], [76, 14], [85, 9]].map(([x, len], i) => ({ x, len, ph: r() * 6, fam: i % 4, s: r() * 9 }));
  const stars = Array.from({ length: 60 }, () => [Math.floor(r() * cols), Math.floor(r() * 26), r() * 6.28]);
  const mx = 46, my = 7, MR = 7;
  const WALL = 29;
  return (t) => {
    g.clear();
    const pos = L.map((l) => ({ ...l, cx: l.x + Math.round(Math.sin(t * 0.8 + l.ph) * 1.2), f: 0.8 + 0.2 * Math.sin(t * 9 + l.s) * Math.sin(t * 5.3 + l.s * 2) }));
    // sky, warmed around each lantern
    for (let y = 0; y < WALL; y++) for (let x = 0; x < cols; x++) {
      let glow = 0;
      for (const p of pos) { const d = Math.hypot((x - p.cx) * 0.5, y - (p.len + 6)); if (d < 9) glow += Math.exp(-d / 3) * p.f; }
      const dm = Math.hypot((x - mx) * 0.5, y - my);
      const n = fbm(x * 0.05 + t * 0.03, y * 0.12, 3);
      const v = clamp(0.15 + y / WALL * 0.45 + (n - 0.5) * 0.35 + Math.exp(-dm / 6) * 0.4);
      if (glow > 0.3) g.set(x, y, SH[1 + Math.min(3, Math.floor(glow * 2.5))], KEYS[10 + Math.min(3, Math.floor(glow * 2.2))]);
      else g.set(x, y, SH[1 + Math.min(3, Math.floor(v * 4))], KEYS[Math.min(9, Math.floor(v * 10))]);
    }
    for (const [x, y, ph] of stars) {
      const b = Math.sin(t * 1.4 + ph);
      if (b > 0.2) g.set(x, y, b > 0.85 ? "*" : "·", KEYS[42]);
    }
    // crescent moon
    for (let y = 0; y < 16; y++) for (let x = mx - 14; x <= mx + 14; x++) {
      const d1 = Math.hypot((x - mx) / MR, (y - my) / (MR * 0.5));
      const d2 = Math.hypot((x - mx - 3) / (MR * 0.95), (y - my + 0.6) / (MR * 0.48));
      if (d1 < 1 && d2 > 1) g.set(x, y, "█", KEYS[14 + Math.min(2, Math.floor((d2 - 1) * 3 + 1))]);
    }
    g.set(mx + 7, my - 1, "*", KEYS[16]); g.set(mx + 6, my - 1, "─", KEYS[15]); g.set(mx + 8, my - 1, "─", KEYS[15]);
    // lanterns on chains
    for (const p of pos) {
      const top = p.len;
      g.line(p.x, 0, p.cx + 4, top - 1, (x, y) => (y % 2 ? "│" : "┆"), KEYS[18]);
      SPRITE.forEach((row, j) => {
        for (let i = 0; i < row.length; i++) {
          const c = row[i];
          if (c === " ") continue;
          const x = p.cx + i, y = top + j;
          if (c === "G") {
            const gi = i - 2, gj = j - 4;
            const d = Math.abs(gi - 2) + Math.abs(gj - 2);
            if (d === 2) { g.set(x, y, "▒", KEYS[18]); continue; }
            const lv = Math.min(3, Math.floor(p.f * (d === 0 ? 4 : d === 1 ? 3.4 : 2.6)));
            g.set(x, y, d < 2 ? "█" : "▓", KEYS[21 + p.fam * 4 + lv]);
          } else if (c === "o") g.set(x, y, "○", KEYS[19]);
          else if (c === "▼") g.set(x, y, "▼", KEYS[21 + p.fam * 4 + 1]);
          else g.set(x, y, c, KEYS[17 + (i < 4 ? 2 : 1) + (j < 3 && i === 4 ? 1 : 0)]);
        }
      });
    }
    // arcade wall with glowing arches and a gold trim
    for (let y = WALL; y < rows; y++) for (let x = 0; x < cols; x++) {
      const u = (x % 12) - 5.5;
      const spring = 33.2 - Math.sqrt(Math.max(0, 16 - u * u)) * 0.85;
      const open = Math.abs(u) < 4 && y > spring;
      if (y === WALL) { g.set(x, y, x % 2 ? "◆" : "─", KEYS[41]); continue; }
      if (open) {
        const v = clamp(0.45 + (y - 31) * 0.1 + (fbm(x * 0.3, y * 0.5 + t * 0.4, 2) - 0.5) * 0.4);
        g.set(x, y, v > 0.6 ? "█" : "▓", KEYS[v > 0.75 ? 40 : 39]);
      } else g.set(x, y, Math.abs(Math.abs(u) - 4.5) < 0.6 ? "▓" : "█", KEYS[Math.abs(u) < 5 ? 38 : 37]);
    }
    return g.frame();
  };
}
