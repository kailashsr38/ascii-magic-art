/* lavender-fields: purple rows of lavender running to the horizon, a farmhouse, wind rippling through. */
import { Grid, palette, gradient, KEYS, fbm, clamp } from "../lib/kit.js";

const P = [];
const add = (a) => { const o = P.length; P.push(...a); return o; };
const SKY = add(gradient(["#6a7ac0", "#a89ad0", "#e8b4c4", "#fcd4a8", "#fff0c8"], 12));
const SUN = add(["#fff4d0", "#ffe0a0"]);
const HILL = add(["#5a5a9a", "#7a74b0", "#9a8cc0"]);
const LAV = add(gradient(["#2a1650", "#4a2a8a", "#7048b8", "#9a6ad8", "#c49af0", "#e6ccff"], 12));
const SOIL = add(["#2e3a1e", "#4a5a2a", "#6a7a3a"]);
const HOUSE = add(["#f2e8d8", "#c8b8a8", "#a03a2a", "#6a2418", "#ffd27a", "#1e3a1e", "#3a6a2a", "#5a3a22"]);

export const meta = {
  slug: "lavender-fields",
  name: "Lavender Fields",
  category: "landscapes",
  note: "Rows of purple lavender run to a farmhouse on the horizon as the wind ripples through them at sunset.",
  tags: ["nature", "fields", "summer", "flowers", "wallpaper", "hero"],
  cols: 100, rows: 36, fps: 20,
  palette: palette(P),
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const hz = 14, vx = 46, sx = 30, sy = 6;
  const hill = Array.from({ length: cols }, (_, x) => hz - Math.round(fbm(x * 0.04, 3, 3, 8) * 5 + Math.sin(x * 0.05) * 1.5));
  return (t) => {
    g.clear();
    // warm sunset sky with soft cloud streaks
    for (let y = 0; y <= hz; y++) for (let x = 0; x < cols; x++) {
      const c = fbm(x * 0.03 + t * 0.03, y * 0.3, 3, 4);
      const glow = Math.exp(-Math.hypot((x - sx) / 2, y - sy) / 8);
      const v = clamp(y / hz * 0.75 + glow * 0.4 + (c - 0.5) * 0.25);
      g.set(x, y, c > 0.62 ? "▓" : v > 0.75 ? "█" : "▒", KEYS[SKY + clamp(Math.floor(v * 12), 0, 11)]);
    }
    for (let y = sy - 2; y <= sy + 2; y++) for (let x = sx - 5; x <= sx + 5; x++) {
      const d = Math.hypot((x - sx) / 5, (y - sy) / 2.5);
      if (d < 1) g.set(x, y, "█", KEYS[SUN + (d > 0.7 ? 1 : 0)]);
    }
    // distant hills
    for (let x = 0; x < cols; x++) for (let y = hill[x]; y <= hz; y++) g.set(x, y, y === hill[x] ? "▄" : "█", KEYS[HILL + (y === hill[x] ? 2 : y < hz - 1 ? 1 : 0)]);
    // farmhouse and its tree
    const hx = 64, hy = hz;
    g.text(hx - 4, hy - 7, "  ▄███▄", KEYS[HOUSE + 5]);
    g.text(hx - 4, hy - 6, " ███████", KEYS[HOUSE + 6]);
    g.text(hx - 4, hy - 5, " ▀█████▀", KEYS[HOUSE + 5]);
    g.text(hx - 1, hy - 4, "█", KEYS[HOUSE + 7]); g.text(hx - 1, hy - 3, "█", KEYS[HOUSE + 7]);
    g.text(hx + 3, hy - 4, "  ▄▄▄▄▄▄", KEYS[HOUSE + 2]);
    g.text(hx + 3, hy - 3, " ▄██████▄", KEYS[HOUSE + 3]);
    g.text(hx + 3, hy - 2, "  █▀▀█▀█", KEYS[HOUSE]);
    g.text(hx + 3, hy - 1, "  █▪▌█▪█", KEYS[HOUSE + 1]);
    const lit = Math.sin(t * 0.5) > -0.4;
    g.set(hx + 6, hy - 1, "▪", KEYS[HOUSE + (lit ? 4 : 1)]);
    g.set(hx + 9, hy - 1, "▪", KEYS[HOUSE + (lit ? 4 : 1)]);
    g.set(hx + 9, hy - 5, "▄", KEYS[HOUSE + 3]);
    // lavender rows converging on the vanishing point, rippled by wind
    for (let y = hz + 1; y < rows; y++) {
      const dy = y - hz, depth = 1 / dy;
      for (let x = 0; x < cols; x++) {
        const X = (x - vx) / dy;
        const s = X * 1.6;
        const f = s - Math.floor(s);
        const near = dy / (rows - hz);
        const wave = Math.sin(depth * 40 - t * 2.4 + X * 0.6) * 0.5 + 0.5;
        const gust = fbm(X * 0.6 - t * 0.3, depth * 8 - t * 0.6, 2, 5);
        if (f < 0.68 - near * 0.12) {
          const edge = Math.min(f, 0.68 - near * 0.12 - f) < 0.12;
          const v = clamp(0.25 + near * 0.3 + wave * 0.25 + (gust - 0.5) * 0.5 + (edge ? -0.12 : 0));
          const ch = near > 0.55 ? (wave > 0.6 ? "╿" : (x + y) % 2 ? "▓" : "▒") : near > 0.2 ? "▓" : "█";
          g.set(x, y, ch, KEYS[LAV + clamp(Math.floor(v * 12), 0, 11)]);
        } else g.set(x, y, near > 0.4 ? "▒" : "▓", KEYS[SOIL + clamp(Math.floor(near * 3), 0, 2)]);
      }
    }
    return g.frame();
  };
}
