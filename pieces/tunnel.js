/* tunnel: flying down an endless textured tunnel that sways as it goes. */
import { Grid, palette, gradient, KEYS, TAU } from "../lib/kit.js";

const A = gradient(["#05020c", "#2a0b4a", "#7a1fa2", "#d65bd8", "#ffd2f4"], 14);
const B = gradient(["#02060c", "#08304a", "#1782a2", "#4fd8e0", "#d8fff8"], 14);

export const meta = {
  slug: "tunnel",
  name: "Texture Tunnel",
  category: "demoscene",
  note: "A flight down an endless checkered tunnel that bends and twists as it goes.",
  tags: ["tunnel", "demoscene", "retro", "hero", "wallpaper"],
  cols: 88, rows: 30, fps: 30,
  palette: palette([...A, ...B]),
};

const CH = " .:░▒▓█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  return (t) => {
    g.clear();
    const cx = cols / 2 + Math.sin(t * 0.7) * cols * 0.12;
    const cy = rows / 2 + Math.cos(t * 0.5) * rows * 0.14;
    const scale = cols / 2;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const dx = (x - cx) / scale, dy = ((y - cy) * 2) / scale;
      const r = Math.sqrt(dx * dx + dy * dy) + 1e-4;
      const ang = Math.atan2(dy, dx);
      const u = (ang / TAU) * 24 + t * 1.2;
      const v = 2.6 / r + t * 4;
      const iu = Math.floor(u), iv = Math.floor(v);
      const check = (iu + iv) & 1;
      const fu = u - iu, fv = v - iv;
      const edge = Math.min(fu, 1 - fu, fv, 1 - fv) < 0.08 ? 0.75 : 1;
      const light = Math.min(0.86, Math.pow(r, 0.9) * 1.15) * edge * (check ? 1 : 0.8) * (0.72 + 0.28 * Math.sin(fv * Math.PI));
      const k = Math.min(13, Math.floor(light * 14));
      const ch = CH[Math.min(CH.length - 1, Math.floor(light * CH.length))];
      g.set(x, y, r < 0.06 ? " " : ch, KEYS[(check ? 0 : 14) + k]);
    }
    return g.frame();
  };
}
