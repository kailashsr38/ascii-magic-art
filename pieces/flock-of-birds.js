/* flock-of-birds: a starling murmuration folding and stretching across a sunset sky over a still lake. */
import { Grid, palette, gradient, KEYS, fbm, rng, clamp, TAU } from "../lib/kit.js";

const P = [];
const grp = (hexes) => {
  const o = P.length, n = hexes.length;
  P.push(...hexes);
  return (v) => KEYS[o + (v <= 0 ? 0 : v >= 1 ? n - 1 : Math.floor(v * n))];
};
const SKY = grp(gradient(["#3a2466", "#6a3080", "#a83e7c", "#de5a6c", "#f78a4e", "#ffb65a", "#ffe08e"], 16));
const WATER = grp(gradient(["#1c1438", "#3a2458", "#6e3466", "#b04e68", "#e47e56", "#ffb466"], 10));
const SUN = grp(["#ffd27a", "#fff0b8", "#fffbe8"]);
const HILL = grp(["#8a3e6e", "#9c4a72"]);
const TREE = grp(["#140a1a", "#221228"]);
const BIRD = grp(["#100810", "#2a1424"]);

export const meta = {
  slug: "flock-of-birds",
  name: "Murmuration",
  category: "animals",
  note: "Hundreds of starlings fold and stretch as one across a sunset sky over a still lake, while a few birds flap past close by.",
  tags: ["birds", "flock", "sunset", "nature", "hero", "wallpaper"],
  cols: 100, rows: 36, fps: 24,
  palette: palette(P),
};

// quadrant glyphs indexed by which quarters stay lit: 1 top left, 2 top right, 4 bottom left, 8 bottom right
const QUAD = " ▘▝▀▖▌▞▛▗▚▐▜▄▙▟█";
const HZ = 27;                 // horizon / water line
const SX = 72, SR = 6;         // the setting sun

// near birds as pixel art (two pixels per cell across, two down)
const SPRITES = [
  ["X...............X", ".XX...........XX.", "...XX.......XX...", ".....XX.X.XX.....", ".......XXX.......", "........X........"],
  [".................", ".................", "XXXXXX.....XXXXXX", "......XXXXX......", ".......XXX.......", "........X........"],
  [".................", ".................", ".......XXX.......", ".....XX.X.XX.....", "...XX.......XX...", ".XX...........XX."],
].map((rows) => rows.flatMap((row, y) => [...row].map((c, x) => (c === "X" ? [x, y] : null)).filter(Boolean)));
// a far bird is three pixels: wings up, level, wings down
const TINY = [[[0, 0], [2, 0], [1, 1]], [[0, 0], [1, 0], [2, 0]], [[1, 0], [0, 1], [2, 1]]];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(41);
  const PW = cols * 2, PH = rows * 2;
  const ink = new Uint8Array(PW * PH);
  const dot = (x, y) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < PW && y < HZ * 2) ink[x + y * PW] = 1; };

  const N = 440;
  const birds = Array.from({ length: N }, () => {
    const a = r() * TAU, d = Math.pow(r(), 0.65);
    return { u: Math.cos(a) * d, v: Math.sin(a) * d, ph: r() * TAU, fl: 5 + r() * 5 };
  });
  // a tree line of rounded crowns along the far shore
  const tree = new Float32Array(cols);
  for (let x = 0; x < cols; x++) tree[x] = 0.4 + fbm(x * 0.3, 3, 2, 12) * 0.6;
  for (let c = 0; c < 24; c++) {
    const px = r() * cols, rad = 1.5 + r() * 3, ht = 0.8 + r() * 2;
    if (Math.abs(px - SX) < 10) continue;
    for (let x = Math.floor(px - rad); x <= px + rad; x++) {
      if (x < 0 || x >= cols) continue;
      const q = 1 - ((x - px) / rad) ** 2;
      if (q > 0) tree[x] = Math.max(tree[x], ht * Math.sqrt(q) + 0.6);
    }
  }
  const hill = Array.from({ length: cols }, (_, x) => 1 + fbm(x * 0.05, 7, 3, 4) * 3 - Math.exp(-(((x - SX) / 12) ** 2)) * 1.5);
  const near = [
    { y: 3, sp: 9, off: 0, ph: 0, big: true },
    { y: 17, sp: 7, off: 30, ph: 1.7, big: true },
    { y: 6, sp: 6, off: 70, ph: 3.1 },
    { y: 9, sp: 6, off: 78, ph: 2.2 },
  ];

  return (t) => {
    g.clear();
    // sky: a smooth sunset gradient, warmest around the sun, with faint long cloud streaks
    for (let y = 0; y < HZ; y++) for (let x = 0; x < cols; x++) {
      const sd = Math.hypot((x - SX) * 0.5, (y - HZ) * 1.1);
      const glow = Math.exp(-sd / 11);
      const streak = fbm(x * 0.02 - t * 0.02, y * 0.7, 3, 31);
      const v = clamp((y / HZ) ** 1.2 * 0.88 + glow * 0.3 + (streak > 0.6 ? 0.08 : 0) + (fbm(x * 0.05, y * 0.3, 2, 2) - 0.5) * 0.06);
      g.set(x, y, "█", SKY(v));
    }
    for (let y = HZ - SR; y < HZ; y++) for (let x = SX - SR * 2; x <= SX + SR * 2; x++) {
      const d = Math.hypot((x - SX) / 2, y - HZ + 0.5) / SR;
      if (d < 1) g.set(x, y, "█", SUN(d < 0.6 ? 2 : d < 0.85 ? 1 : 0));
    }
    for (let x = 0; x < cols; x++) {
      for (let y = Math.round(HZ - hill[x]); y < HZ; y++) g.set(x, y, "█", HILL(y > HZ - 2 ? 1 : 0));
      const top = HZ - tree[x];
      for (let y = Math.floor(top); y < HZ; y++) g.set(x, y, y === Math.floor(top) && top % 1 > 0.5 ? "▄" : "█", TREE(1));
    }

    // the murmuration, drawn at two pixels per cell so each bird keeps its shape
    ink.fill(0);
    const cx = 42 + Math.sin(t * 0.19) * 14 + Math.sin(t * 0.47) * 3;
    const cy = 10.5 + Math.sin(t * 0.29 + 1) * 1.5;
    const W = 26 + Math.sin(t * 0.37) * 9;
    const Hh = 5 + Math.sin(t * 0.43 + 2) * 1.5;
    const rot = Math.sin(t * 0.23) * 0.3;
    const cr = Math.cos(rot), sr = Math.sin(rot);
    const hook = Math.sin(t * 0.31 + 0.5);
    for (let i = 0; i < N; i++) {
      const b = birds[i];
      let dx = b.u * W + Math.sin(b.v * 3 + t * 1.1) * 4;
      let dy = b.v * Hh + Math.sin(b.u * 2.6 + t * 0.8) * 2.5 - (b.u > 0 ? b.u * b.u * hook * 4 : 0);
      dx += Math.sin(t * 2.1 + b.ph) * 0.8; dy += Math.cos(t * 1.7 + b.ph * 1.3) * 0.4;
      const x = cx + dx * cr - dy * 2 * sr, y = cy + dx * sr * 0.5 + dy * cr;
      const f = Math.sin(t * b.fl + b.ph);
      const shape = TINY[f > 0.35 ? 0 : f < -0.35 ? 2 : 1];
      const px = Math.round(x * 2), py = Math.round(y * 2);
      for (const [ox, oy] of shape) dot(px + ox, py + oy);
    }
    for (const n of near) {
      const x = ((t * n.sp + n.off) % (cols + 24)) - 12;
      const y = n.y + Math.sin(t * 1.3 + n.ph) * 1.2;
      const f = Math.floor((t * 3.2 + n.ph) % 4);
      const sp = SPRITES[f === 3 ? 1 : f];
      const px = Math.round(x * 2), py = Math.round(y * 2);
      for (const [ox, oy] of sp) if (n.big || (ox % 2 === 0 && oy % 2 === 0)) dot(px + (n.big ? ox : ox / 2), py + (n.big ? oy : oy / 2));
    }
    // turn inked pixels into quadrant glyphs over the sky colour
    for (let y = 0; y < HZ; y++) for (let x = 0; x < cols; x++) {
      const p = x * 2 + y * 2 * PW;
      const m = ink[p] | (ink[p + 1] << 1) | (ink[p + PW] << 2) | (ink[p + PW + 1] << 3);
      if (!m) continue;
      const lit = 15 & ~m;
      if (lit === 0) g.set(x, y, "█", BIRD(0));
      else g.set(x, y, QUAD[lit]);
    }

    // the lake: the sky mirrored and rippled, a glittering sun path, the trees reflected dark
    for (let y = HZ; y < rows; y++) {
      const dpt = (y - HZ) / (rows - HZ);
      for (let x = 0; x < cols; x++) {
        const w = Math.sin(x * 0.3 + y * 2.1 - t * 1.4) + Math.sin(x * 0.09 - y * 1.3 + t * 0.8);
        const my = HZ - 1 - (y - HZ);
        const rx = clamp(Math.round(x + w * (0.5 + dpt)), 0, cols - 1);
        const treeRef = y - HZ < tree[rx] * 0.6 - 0.8;
        const path = Math.exp(-(((x - SX) / (4 + dpt * 8)) ** 2));
        const glit = fbm(x * 0.25, y * 1.6 - t * 0.6, 2, 5);
        if (!treeRef && path * (0.5 + glit) > 0.62) {
          g.set(x, y, "█", SUN(glit > 0.55 ? 2 : glit > 0.45 ? 1 : 0));
        } else if (treeRef) {
          g.set(x, y, "█", TREE(1));
        } else {
          const v = clamp((my / HZ) ** 1.2 * 0.85 - dpt * 0.25 + Math.exp(-Math.abs(x - SX) / 14) * 0.15);
          g.set(x, y, "█", WATER(v + (w > 1.2 ? 0.12 : w < -1.2 ? -0.1 : 0)));
        }
      }
    }
    return g.frame();
  };
}
