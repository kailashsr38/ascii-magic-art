/* starburst: coloured rays bursting from the centre, rings pulsing outward. */
import { Grid, palette, hsl, KEYS, TAU } from "../lib/kit.js";

const N = 30;
const A = Array.from({ length: N }, (_, i) => hsl((i / N) * 360, 92, 60));
const D = Array.from({ length: N }, (_, i) => hsl((i / N) * 360, 70, 26));

export const meta = {
  slug: "starburst",
  name: "Starburst",
  category: "demoscene",
  note: "Rainbow rays bursting from a white hot centre while rings pulse outward through them.",
  tags: ["burst", "rays", "retro", "celebration", "hero", "wallpaper"],
  cols: 88, rows: 32, fps: 30,
  palette: palette([...A, ...D, "#ffffff", "#fff3c4"]),
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const RAYS = 18;
  return (t) => {
    g.clear();
    const cx = cols / 2, cy = rows / 2;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const dx = x - cx, dy = (y - cy) * 2.1;
      const r = Math.sqrt(dx * dx + dy * dy);
      const a = Math.atan2(dy, dx) + t * 0.35 + Math.sin(r * 0.06 - t) * 0.15;
      const ray = Math.sin(a * RAYS);
      const ring = Math.sin(r * 0.35 - t * 5);
      const hue = Math.floor(((a / TAU) * 2 + r / 90 - t * 0.1) * N);
      const hk = ((hue % N) + N) % N;
      if (r < 3.5) { g.set(x, y, "█", r < 2 ? KEYS[60] : KEYS[61]); continue; }
      if (ray > 0) {
        const b = ray * (0.75 + 0.25 * ring);
        g.set(x, y, b > 0.7 ? "█" : b > 0.4 ? "▓" : b > 0.15 ? "▒" : "░", KEYS[hk]);
      } else {
        g.set(x, y, ring > 0.6 ? "▒" : ring > -0.2 ? "░" : "·", KEYS[N + hk]);
      }
    }
    return g.frame();
  };
}
