/* truchet-tiles: quarter-circle Truchet tiles that turn in waves, re-routing one long flowing pattern. */
import { Grid, palette, gradient, KEYS, clamp, smooth } from "../lib/kit.js";

const HUES = ["#ff5a7a", "#ffb03a", "#ffe45a", "#5aff9a", "#3ad0ff", "#8a6aff"];
const TUBE = HUES.flatMap((h) => gradient(["#1a1020", h, "#ffffff"], 6).slice(1, 5)); // 4 shades per hue
const pal = palette([...TUBE, "#0c0e1c", "#151a30", "#1e2440"]);
const NH = HUES.length;
const BG0 = KEYS[NH * 4], BG1 = KEYS[NH * 4 + 1], BG2 = KEYS[NH * 4 + 2];

export const meta = {
  slug: "truchet-tiles",
  name: "Truchet Tiles",
  category: "algorithms",
  note: "A grid of quarter-circle Truchet tiles turning in rippling waves, the tubes re-routing into new flowing paths.",
  tags: ["tiles", "pattern", "geometry", "wallpaper", "hero"],
  cols: 96, rows: 36, fps: 24,
  palette: pal,
};

const TW = 8, TH = 4, PER = 3.2, TURN = 0.55;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const NX = Math.ceil(cols / TW), NY = Math.ceil(rows / TH);
  const hash = (i, j) => { let h = (i * 374761393 + j * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const base = [], offs = [], slow = [];
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    base.push(hash(i, j) > 0.5 ? 1 : 0);
    offs.push(hash(i + 50, j + 90) * 0.4);
    slow.push(hash(i + 7, j + 3) > 0.5);
  }
  return (t) => {
    const wx = NX / 2 + Math.cos(t * 0.23) * NX * 0.4, wy = NY / 2 + Math.sin(t * 0.31) * NY * 0.4;
    // per-tile rotation angle in quarter turns, continuous in t
    const ang = new Float32Array(NX * NY);
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      const k = i + j * NX;
      const s = (t - Math.hypot(i - wx, (j - wy) * 1.2) * 0.22 - offs[k]) / PER;
      const n = Math.floor(s), fr = (s - n) * PER;
      const turn = smooth(clamp(fr / TURN));
      // half the tiles turn every period, the rest every other period, so the routes keep changing
      ang[k] = slow[k] ? Math.floor(n / 2) + ((n & 1) ? turn : 0) : n + turn;
    }
    const hueShift = t * 0.15;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const i = Math.floor(x / TW), j = Math.floor(y / TH);
      const k = i + j * NX;
      let u = (x % TW + 0.5) / TW - 0.5, v = (y % TH + 0.5) / TH - 0.5;
      const a = -ang[k] * (Math.PI / 2), ca = Math.cos(a), sa = Math.sin(a);
      const ru = u * ca - v * sa + 0.5, rv = u * sa + v * ca + 0.5;
      const o = base[k];
      const d1 = o ? Math.hypot(ru, rv) : Math.hypot(ru - 1, rv);
      const d2 = o ? Math.hypot(ru - 1, rv - 1) : Math.hypot(ru, rv - 1);
      const e = Math.min(Math.abs(d1 - 0.5), Math.abs(d2 - 0.5));
      if (e < 0.19) {
        const core = 1 - e / 0.19;
        const lvl = core > 0.75 ? 3 : core > 0.45 ? 2 : core > 0.2 ? 1 : 0;
        const hue = Math.floor(((x / cols + y / rows * 0.5 + hueShift) % 1) * NH) % NH;
        g.set(x, y, lvl >= 2 ? "█" : lvl === 1 ? "▓" : "▒", KEYS[hue * 4 + lvl]);
      } else {
        const inside = d1 < 0.5 || d2 < 0.5;
        const par = (i + j + o + Math.round(ang[k])) & 1;
        g.set(x, y, inside !== !!par ? "░" : "·", inside !== !!par ? BG1 : (x + y) % 2 ? BG2 : BG0);
      }
    }
    return g.frame();
  };
}
