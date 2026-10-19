/* scroll-banner-frame: a crimson ribbon banner with folded, notched tails and a sheen sliding over the cloth. */
import { Grid, palette, gradient, KEYS, clamp } from "../lib/kit.js";

const RIB = gradient(["#2a0610", "#6e1022", "#b3203a", "#e8475a", "#ff8a8a", "#ffd0c8"], 12); // 0..11
const GOLD = gradient(["#6b4a12", "#c9962e", "#ffd877", "#fff3c4"], 4);                         // 12..15

export const meta = {
  slug: "scroll-banner-frame",
  name: "Ribbon Banner",
  category: "frames",
  note: "A crimson ribbon banner with folded, notched tails, gold trim and a sheen sliding across the cloth.",
  tags: ["banner", "ribbon", "frame", "header", "readme", "hero"],
  cols: 96, rows: 9, fps: 20,
  palette: palette([...RIB, ...GOLD]),
};

const SH = " ░▒▓█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const bx0 = 12, bx1 = cols - 13;           // band columns
  const by0 = 0, by1 = 6;                    // band rows
  const ty0 = 3, ty1 = 8;                    // tail rows
  const tw = 16;                             // tail width (incl. part behind band)
  const orn = "──────────  ◆  ──────────";
  return (t) => {
    g.clear();
    const sheen = ((t * 18) % (bx1 - bx0 + 40)) + bx0 - 20;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const inBand = x >= bx0 && x <= bx1 && y >= by0 && y <= by1;
      if (inBand) {
        const ripple = 0.16 * Math.sin(x * 0.22 - t * 2.4) + 0.08 * Math.sin(x * 0.09 + t * 1.1);
        const prof = 1 - Math.abs((y - 3) / 3.6) ** 2;      // brighter across the middle of the cloth
        const sh = Math.exp(-((((x - sheen) + (y - 3) * 2) / 5) ** 2)) * 0.45;
        const v = clamp(0.2 + prof * 0.5 + ripple + sh);
        if (y === by0) g.set(x, y, "▄", KEYS[Math.min(11, 2 + Math.floor(v * 7))]);
        else if (y === by1) g.set(x, y, "▀", KEYS[Math.min(11, 1 + Math.floor(v * 6))]);
        else g.set(x, y, SH[2 + Math.min(2, Math.floor(v * 3))], KEYS[Math.min(11, 1 + Math.floor(v * 10))]);
        continue;
      }
      // tails, left and right, mirrored
      const lx = x < cols / 2 ? x : cols - 1 - x;
      if (lx < tw && y >= ty0 && y <= ty1) {
        const notch = 4 * (1 - Math.abs(y - 5.5) / 3);
        if (lx < notch) continue;
        const fold = lx >= bx0 && y > by1;   // the folded strip that tucks behind the band
        if (fold) {
          if (lx - bx0 > (y - by1 - 1) * 2 + 1) continue; // triangular fold
          g.set(x, y, "▓", KEYS[1]);
          continue;
        }
        const ripple = 0.12 * Math.sin(lx * 0.5 - t * 2.4);
        const v = clamp(0.25 + (1 - Math.abs(y - 5.5) / 3) * 0.3 + ripple);
        g.set(x, y, SH[2 + Math.min(2, Math.floor(v * 3))], KEYS[Math.min(7, 1 + Math.floor(v * 7))]);
      }
    }
    // gold trim lines and centre ornament
    for (let x = bx0 + 2; x <= bx1 - 2; x++) {
      const tw2 = Math.exp(-(((x - sheen) / 6) ** 2));
      const k = KEYS[12 + Math.min(3, 1 + Math.floor(tw2 * 3))];
      g.set(x, 1, "═", k); g.set(x, 5, "═", k);
    }
    const ox = Math.floor((cols - orn.length) / 2);
    for (let i = 0; i < orn.length; i++) {
      if (orn[i] === " ") continue;
      const tw2 = Math.exp(-(((ox + i - sheen) / 6) ** 2));
      g.set(ox + i, 3, orn[i], KEYS[12 + Math.min(3, (orn[i] === "◆" ? 2 : 1) + Math.floor(tw2 * 2))]);
    }
    return g.frame();
  };
}
