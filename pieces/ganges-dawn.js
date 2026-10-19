/* ganges-dawn: dawn over river ghats, stone steps, wooden boats and floating lamps on the water. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, TAU } from "../lib/kit.js";

const P = [];
const grp = (hexes) => {
  const o = P.length, n = hexes.length;
  P.push(...hexes);
  return (v) => KEYS[o + (v <= 0 ? 0 : v >= 1 ? n - 1 : Math.floor(v * n))];
};
const SKY = grp(gradient(["#2a1c4e", "#6a2e6a", "#c04a6a", "#f0805a", "#ffc070", "#ffe6a8"], 14));
const SUN = grp(["#ffd27a", "#fff4d0"]);
const WATER = grp(gradient(["#1e1838", "#4a2a52", "#9a4a5e", "#e07a5a", "#ffb870"], 12));
const BLD = grp(gradient(["#3a1e2a", "#6a3a3a", "#a8604a", "#e09a6a", "#f8c890"], 10));
const STEP = grp(["#4a3030", "#8a5a48", "#c89068"]);
const WIN = grp(["#1e1018", "#ffb040"]);
const FLAG = grp(["#ff7a1a"]);
const BOAT = grp(["#1a0e10", "#4a2a1e", "#7a4a2a"]);
const LAMP = grp(["#ff9a2a", "#ffe08a", "#fffbe0"]);
const BANK = grp(["#c09078", "#e0b090"]);
const BIRD = grp(["#2a1a2a"]);

export const meta = {
  slug: "ganges-dawn",
  name: "Ganges Dawn",
  category: "landscapes",
  note: "Dawn breaks over riverside ghats as wooden boats drift past and floating lamps flicker on the water.",
  tags: ["river", "dawn", "india", "boats", "lamps", "wallpaper"],
  cols: 100, rows: 36, fps: 20,
  palette: palette(P),
};

const SH = "░▒▓█";
const sh = (v) => SH[v <= 0 ? 0 : v >= 1 ? 3 : Math.floor(v * 4)];
const HZ = 15;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(13);
  const bankY = (x) => HZ + 1 + Math.max(0, (56 - x) * 0.3);   // waterline of the ghats
  // static ghat buildings above the steps
  const bch = new Array(cols * rows).fill(null), bco = new Array(cols * rows).fill(null);
  let x = 0;
  while (x < 58) {
    const w = 4 + Math.floor(r() * 6), temple = r() < 0.28;
    const baseY = Math.floor(bankY(x + w / 2)) - 5;
    const h = Math.max(3, Math.floor((7 + r() * 8) * (1 - x / 90)));
    const lit = 0.35 + r() * 0.4;
    for (let i = 0; i < w && x + i < 60; i++) {
      const xi = x + i, side = i / (w - 1);
      for (let y = baseY - h; y < baseY + 1; y++) {
        if (y < 0) continue;
        const win = i % 2 === 1 && i < w - 1 && (y - baseY) % 2 === 0 && y > baseY - h + 1 && y < baseY;
        bch[xi + y * cols] = win ? "▪" : "█";
        bco[xi + y * cols] = win ? WIN(r() < 0.2 ? 1 : 0) : BLD(clamp(lit + side * 0.3));
      }
      if (temple) {
        const sp = Math.floor((w / 2 - Math.abs(i - (w - 1) / 2)) * 1.6) + 1;
        for (let j = 1; j <= sp; j++) { const y = baseY - h - j; if (y >= 0) { bch[xi + y * cols] = "█"; bco[xi + y * cols] = BLD(clamp(lit + side * 0.35 + 0.1)); } }
        if (Math.abs(i - (w - 1) / 2) < 0.6) {
          const y = baseY - h - sp - 1;
          if (y >= 1) { bch[xi + y * cols] = "│"; bco[xi + y * cols] = BLD(0.9); bch[xi + 1 + (y - 1) * cols] = "▶"; bco[xi + 1 + (y - 1) * cols] = FLAG(0); }
        }
      }
    }
    x += w;
  }
  const boats = [[0.1, 20, 0.9, 1.0], [0.55, 24, 1.3, 1.2], [0.3, 30, 1.8, 1.6], [0.8, 18, 0.6, 0.8]];
  const lamps = Array.from({ length: 46 }, () => [r(), HZ + 2 + r() * (rows - HZ - 3), 0.6 + r() * 1.2, r() * TAU]);
  const birds = Array.from({ length: 6 }, () => [r() * 120, 2 + r() * 8, 2 + r() * 2, r() * TAU]);
  const sx = 74, sy = HZ - 1;

  return (t) => {
    g.clear();
    const rise = 0.5 + 0.5 * Math.sin(t * 0.15);
    // dawn sky, the sun just clearing the far bank
    for (let y = 0; y < HZ; y++) for (let x = 0; x < cols; x++) {
      const d = Math.hypot((x - sx) / 2, y - sy);
      const haze = fbm(x * 0.03 + t * 0.03, y * 0.35, 3, 2);
      const v = clamp(Math.pow(y / HZ, 1.2) * 0.75 + Math.exp(-d / 12) * (0.4 + rise * 0.15) + (haze - 0.5) * 0.3);
      if (d < 4.5) g.set(x, y, "█", SUN(d < 3 ? 1 : 0));
      else g.set(x, y, v > 0.3 ? "█" : "▓", SKY(v));
    }
    // far bank
    for (let x = 0; x < cols; x++) g.set(x, HZ, x % 7 === 3 ? "▄" : "▀", BANK(x > 60 ? 1 : 0));
    // river: mirrored dawn colours, a broken sun path and slow swell
    for (let y = HZ + 1; y < rows; y++) {
      const d = (y - HZ) / (rows - HZ);
      for (let x = 0; x < cols; x++) {
        const w = fbm(x * 0.06 - t * 0.15, y * 0.6 + t * 0.1, 3, 5);
        const path = Math.exp(-(((x - sx) / (3 + d * 10)) ** 2)) * (0.5 + 0.5 * Math.sin(t * 2.4 + x * 0.7 + y * 1.4));
        if (path > 0.45 && w > 0.4) { g.set(x, y, path > 0.75 ? "█" : "▓", SUN(path > 0.75 ? 1 : 0)); continue; }
        const v = clamp(0.85 - d * 0.8 + (w - 0.5) * 0.6 + Math.exp(-Math.abs(x - sx) / 20) * 0.15);
        g.set(x, y, w > 0.58 ? "▓" : "█", WATER(v));
      }
    }
    // ghats: stepped stone banks with buildings and temples above
    for (let x = 0; x < 62; x++) {
      const wl = bankY(x);
      for (let y = Math.max(0, Math.floor(wl) - 5); y < Math.min(rows, Math.ceil(wl)); y++) {
        const k = Math.floor(wl) - y;
        g.set(x, y, k % 2 ? "▀" : "█", STEP(k % 2 ? 1 : x > 40 ? 2 : 1 + (k % 3 === 0 ? 1 : 0)));
      }
    }
    for (let i = 0; i < bch.length; i++) if (bch[i]) g.set(i % cols, Math.floor(i / cols), bch[i], bco[i]);
    // reflections of the ghats in the water
    for (let x = 0; x < 58; x++) {
      const wl = Math.ceil(bankY(x));
      for (let k = 0; k < 4; k++) {
        const y = wl + k;
        if (y < rows && Math.sin(x * 0.8 + y * 2 + t * 3) > -0.2) g.set(x, y, "▒", BLD(0.2));
      }
    }
    // floating lamps drifting downstream
    for (const [p, ly, sp, ph] of lamps) {
      const x = ((p * 140 + t * sp) % 140) - 20 + (ly - HZ) * 0.4;
      if (x < bankY(0) && ly < bankY(Math.max(0, x)) + 1) continue;
      if (ly < bankY(Math.max(0, Math.min(cols - 1, x))) + 0.5) continue;
      const fl = 0.5 + 0.5 * Math.sin(t * 9 + ph);
      g.set(x, ly, "●", LAMP(fl > 0.5 ? 2 : 1));
      g.set(x, ly + 1, "▒", LAMP(0));
    }
    // boats with a rower, gliding across
    for (const [p, by, sp, scale] of boats) {
      const len = Math.round(7 * scale);
      const bx = ((p * 150 + t * sp) % 150) - 25;
      if (by < bankY(Math.max(0, Math.min(cols - 1, bx + len / 2))) + 1) continue;
      g.set(bx, by - 1, "▄", BOAT(2));
      for (let i = 1; i < len - 1; i++) g.set(bx + i, by - 1, "█", BOAT(i % 3 ? 1 : 2));
      g.set(bx + len - 1, by - 1, "▄", BOAT(2));
      for (let i = 1; i < len - 1; i++) g.set(bx + i, by, "▀", BOAT(0));
      const mid = bx + Math.floor(len / 2);
      g.set(mid, by - 2, "▲", BOAT(0)); g.set(mid, by - 3, "●", BOAT(0));
      g.set(mid + 2 + Math.round(Math.sin(t * 2 + p * 9)), by, "╲", BOAT(1));
      for (let i = 0; i < len; i++) if ((i + Math.floor(t * 3)) % 2) g.set(bx + i, by + 1, "░", BOAT(0));
    }
    for (const [bx0, by, sp, ph] of birds) {
      const bx = ((bx0 + t * sp) % 120) - 10, y = by + Math.sin(t * 0.8 + ph);
      const up = Math.sin(t * 9 + ph) > 0;
      g.set(bx, y, up ? "v" : "-", BIRD(0)); g.set(bx + 1, y, up ? "v" : "-", BIRD(0));
    }
    return g.frame();
  };
}
