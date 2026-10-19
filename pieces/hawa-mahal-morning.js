/* hawa-mahal-morning: a pink honeycomb palace facade of tiny windows in morning light, pigeons wheeling past. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, TAU } from "../lib/kit.js";

const P = [];
const grp = (hexes) => {
  const o = P.length, n = hexes.length;
  P.push(...hexes);
  return (v) => KEYS[o + (v <= 0 ? 0 : v >= 1 ? n - 1 : Math.floor(v * n))];
};
const SKY = grp(gradient(["#3a7ac8", "#6aa4e0", "#a8cef0", "#f4e4c8"], 10));
const SUN = grp(["#fff0c0", "#ffffff"]);
const PINK = grp(gradient(["#7a2e3a", "#a8464e", "#d0686a", "#ea8c80", "#ffb8a0", "#ffd8c0"], 12));
const JALI = grp(["#3a141e", "#6a2a34"]);
const TRIM = grp(["#e8c8b8", "#fff4ea"]);
const STREET = grp(gradient(["#6a5040", "#a88870", "#d0b498"], 5));
const BIRD = grp(["#5a5a68", "#c8ccd8"]);

export const meta = {
  slug: "hawa-mahal-morning",
  name: "Hawa Mahal Morning",
  category: "landscapes",
  note: "A pink palace facade of countless small latticed windows catches the morning sun as pigeons wheel past.",
  tags: ["india", "palace", "architecture", "morning", "travel", "wallpaper"],
  cols: 96, rows: 38, fps: 20,
  palette: palette(P),
};

const CX = 48, BASE = 33;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(29);
  // storeys from the ground up: [halfWidth, height]
  const storeys = [[42, 6], [38, 6], [32, 5], [25, 5], [17, 4]];
  const fch = new Array(cols * rows).fill(null), fco = new Array(cols * rows).fill(null), fv = new Float32Array(cols * rows);
  const put = (x, y, ch, kind, v) => { if (x < 0 || x >= cols || y < 0 || y >= rows) return; const i = x + y * cols; fch[i] = ch; fco[i] = kind; fv[i] = v; };
  let y1 = BASE;
  storeys.forEach(([hw, h], s) => {
    const y0 = y1 - h;
    for (let y = y0; y < y1; y++) for (let x = CX - hw; x <= CX + hw; x++) {
      const lx = x - (CX - hw);
      const bay = Math.floor(lx / 4), bx = lx % 4, by = (y - y0) % 3;
      const bulge = bay % 2 === 0 ? 0.08 : -0.04;         // alternating projecting bays
      const lit = 0.45 + (1 - (x - CX + hw) / (2 * hw)) * 0.25 + bulge - s * 0.02;
      if (y === y0) { put(x, y, "▄", "trim", 0); continue; }
      if (bx === 3) { put(x, y, "█", "pink", lit - 0.18); continue; }
      if (by === 1) put(x, y, bx === 1 ? "▀" : "▄", "pink", lit + (bx === 0 ? 0.15 : -0.05));
      else if (by === 2) put(x, y, bx === 1 ? "▒" : "█", bx === 1 ? "jali" : "pink", bx === 1 ? 0 : lit + (bx === 0 ? 0.1 : -0.1));
      else put(x, y, bx === 1 ? "▓" : "█", bx === 1 ? "jali" : "pink", bx === 1 ? 1 : lit);
    }
    // little domed kiosks along the top edge of each storey
    for (let x = CX - hw + 1; x <= CX + hw - 1; x += 4) {
      put(x, y0 - 1, "▄", "pink", 0.7); put(x + 1, y0 - 1, "█", "pink", 0.8); put(x + 2, y0 - 1, "▄", "pink", 0.55);
      put(x + 1, y0 - 2, "▲", "pink", 0.75);
    }
    y1 = y0 - 1;
  });
  // crowning arch
  for (let j = 0; j < 4; j++) for (let x = CX - 7 + j * 2; x <= CX + 7 - j * 2; x++) put(x, y1 - j, j === 3 ? "▲" : "█", "pink", 0.65 + (CX - x) * 0.03);
  put(CX - 3, y1 - 1, "▒", "jali", 0); put(CX + 3, y1 - 1, "▒", "jali", 0);
  // ground arcade
  for (let y = BASE; y < BASE + 2; y++) for (let x = CX - 44; x <= CX + 44; x++) {
    const arch = (x - CX + 44) % 6;
    put(x, y, arch > 1 && arch < 5 && y > BASE ? "█" : "█", arch > 1 && arch < 5 && y > BASE ? "jali" : "pink", arch > 1 && arch < 5 ? 1 : 0.4);
  }
  const flock = Array.from({ length: 16 }, () => [r() * TAU, (r() - 0.5) * 8, (r() - 0.5) * 4, r() * TAU]);
  const sx = 12, sy = 3;

  return (t) => {
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const d = Math.hypot((x - sx) / 2, y - sy);
      if (y >= BASE + 2) {
        const v = clamp(0.4 + (y - BASE) * 0.08 + noise2(x * 0.3, y, 3) * 0.3 - (x / cols) * 0.2);
        g.set(x, y, "█", STREET(v));
        continue;
      }
      const v = clamp(y / BASE * 0.7 + Math.exp(-d / 10) * 0.6 + (fbm(x * 0.04 - t * 0.04, y * 0.3, 3, 2) - 0.5) * 0.2);
      if (d < 3) g.set(x, y, "█", SUN(d < 2 ? 1 : 0));
      else g.set(x, y, v > 0.4 ? "█" : "▓", SKY(v));
    }
    // facade, with a slow brightening of the morning light
    const morning = 0.06 * Math.sin(t * 0.3);
    for (let i = 0; i < fch.length; i++) {
      if (!fch[i]) continue;
      const k = fco[i], x = i % cols, y = Math.floor(i / cols);
      const shine = Math.exp(-(((x - ((t * 6) % 140) + 20) / 8) ** 2)) * 0.12;   // a slow glint across the facade
      g.set(x, y, fch[i], k === "pink" ? PINK(clamp(fv[i] + morning + shine)) : k === "jali" ? JALI(fv[i]) : TRIM(1));
    }
    // pigeons wheeling in a loose flock
    const fx = CX + Math.sin(t * 0.25) * 30, fy = 9 + Math.sin(t * 0.4) * 4;
    for (const [a0, ox, oy, ph] of flock) {
      const a = a0 + t * 0.6;
      const x = fx + Math.cos(a) * 9 + ox, y = fy + Math.sin(a) * 3 + oy;
      const up = Math.sin(t * 10 + ph) > 0;
      g.set(x, y, up ? "╲" : "╱", BIRD(1)); g.set(x + 1, y, up ? "╱" : "╲", BIRD(1));
    }
    return g.frame();
  };
}
