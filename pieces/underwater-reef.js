/* underwater-reef: a coral reef with fish swimming, light rays from the surface and rising bubbles. */
import { Grid, palette, gradient, KEYS, fbm, rng, clamp } from "../lib/kit.js";

const P = [];
const add = (a) => { const o = P.length; P.push(...a); return o; };
const SEA = add(gradient(["#031432", "#06305e", "#0a5a8a", "#1a8eb4", "#5cc8dc"], 14));
const RAY = add(["#7adcea", "#b8f0f6"]);
const SAND = add(gradient(["#4a4a52", "#8a7c62", "#c8b080", "#e8d4a4"], 6));
const CORAL = add(["#ff5a7a", "#ff8a5a", "#ffb84a", "#c84ac8", "#8a5aff", "#ff7ab8", "#e0405a"]);
const WEED = add(["#1a6a3a", "#2ea05a", "#6ad07a"]);
const FISH = add(["#ffa040", "#ffffff", "#ffe04a", "#4ac8ff", "#ff5a5a", "#b06aff", "#5affc8"]);
const BUB = add(["#c8f4ff", "#ffffff"]);

export const meta = {
  slug: "underwater-reef",
  name: "Underwater Reef",
  category: "landscapes",
  note: "A coral reef where fish swim through shafts of light falling from the surface as bubbles rise.",
  tags: ["ocean", "underwater", "fish", "coral", "wallpaper", "hero"],
  cols: 100, rows: 36, fps: 20,
  palette: palette(P),
};

const FR = ["><(((°>", "><>", "▶█▌█▌◀".split("").reverse().join(""), "><((°>", "><=>"];
const flip = (s) => s.split("").reverse().map((c) => ({ ">": "<", "<": ">", "(": ")", ")": "(", "▶": "◀", "◀": "▶", "▌": "▐", "▐": "▌" }[c] || c)).join("");

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(21);
  // static reef: build once into arrays
  const rch = new Array(cols * rows).fill(null), rco = new Array(cols * rows).fill(null);
  const put = (x, y, ch, co) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < cols && y < rows) { rch[x + y * cols] = ch; rco[x + y * cols] = co; } };
  const bed = Array.from({ length: cols }, (_, x) => 30 + Math.round(fbm(x * 0.08, 2, 3, 6) * 4 - 1));
  for (let x = 0; x < cols; x++) for (let y = bed[x]; y < rows; y++) {
    const v = clamp(0.7 - (y - bed[x]) * 0.08 + (fbm(x * 0.3, y * 0.6, 2, 1) - 0.5) * 0.6);
    put(x, y, v > 0.6 ? "▓" : v > 0.35 ? "▒" : "░", KEYS[SAND + clamp(Math.floor(v * 6), 0, 5)]);
  }
  // brain corals: lumpy domes
  for (const [cx, rad, c] of [[12, 6, 0], [44, 5, 2], [78, 7, 1], [93, 4, 5]]) {
    const by = bed[cx];
    for (let y = by - rad; y <= by; y++) for (let x = cx - rad * 1.6; x <= cx + rad * 1.6; x++) {
      const d = Math.hypot((x - cx) / (rad * 1.6), (y - by) / rad);
      if (d < 1) { const groove = Math.sin(x * 1.1 + y * 2.3 + Math.sin(y * 1.7) * 2) > 0.3; put(x, y, groove ? "▒" : d < 0.7 ? "█" : "▓", KEYS[CORAL + (groove && d < 0.8 ? 6 : c)]); }
    }
  }
  // branching corals: recursive limbs
  const branch = (x, y, a, len, depth, c) => {
    for (let i = 0; i < len; i++) { x += Math.cos(a); y -= Math.sin(a) * 0.6; put(x, y, depth > 1 ? "█" : "▓", KEYS[CORAL + c]); }
    put(x, y - 1, "●", KEYS[CORAL + (c === 3 ? 5 : 2)]);
    if (depth > 0) { branch(x, y, a + 0.5 + r() * 0.3, len * 0.7, depth - 1, c); branch(x, y, a - 0.5 - r() * 0.3, len * 0.7, depth - 1, c); }
  };
  for (const [x, c] of [[26, 3], [58, 0], [68, 4], [35, 5]]) branch(x, bed[x], Math.PI / 2, 4 + r() * 2, 3, c);
  // fan coral lattice
  for (const fx of [86, 4]) for (let y = bed[fx] - 10; y < bed[fx]; y++) {
    const w = Math.round(Math.sin(((y - (bed[fx] - 10)) / 10) * Math.PI) * 5);
    for (let x = fx - w; x <= fx + w; x++) put(x, y, (x + y) % 2 ? "╳" : "┼", KEYS[CORAL + 3]);
  }
  const weeds = [[20, 12], [52, 14], [64, 10], [72, 9], [97, 11], [8, 8], [40, 9]];
  const fish = Array.from({ length: 9 }, (_, i) => ({ y: 4 + Math.floor(r() * 22), sp: 3 + r() * 6, off: r() * 200, dir: r() < 0.5 ? 1 : -1, f: FR[i % FR.length], c: i % 7 }));
  const school = Array.from({ length: 22 }, () => [r() * 10, r() * 4, r() * 6.28]);
  const bubbles = Array.from({ length: 26 }, () => [Math.floor(r() * cols), r() * 40, 2 + r() * 3, r() * 6.28]);
  return (t) => {
    g.clear();
    // water: depth gradient with drifting caustics and slanted light rays
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const depth = y / rows;
      const n = fbm(x * 0.06 + t * 0.08, y * 0.15 - t * 0.05, 3, 4);
      const ray = Math.max(0, Math.sin((x + y * 0.55) * 0.22 + Math.sin(t * 0.4 + x * 0.02) * 1.5)) ** 6 * (1 - depth) * (0.6 + 0.4 * Math.sin(t * 0.7 + x * 0.05));
      const v = clamp(1 - depth * 1.05 + (n - 0.5) * 0.35 + ray * 0.25);
      if (ray > 0.35) g.set(x, y, ray > 0.6 ? "▓" : "▒", KEYS[RAY + (ray > 0.6 ? 1 : 0)]);
      else g.set(x, y, v > 0.65 ? "▓" : v > 0.3 ? "▒" : "░", KEYS[SEA + clamp(Math.floor(v * 14), 0, 13)]);
    }
    // surface shimmer
    for (let x = 0; x < cols; x++) g.set(x, 0, Math.sin(x * 0.5 + t * 3) > 0 ? "≈" : "~", KEYS[RAY + 1]);
    // the reef
    for (let i = 0; i < cols * rows; i++) if (rch[i]) { g.ch[i] = rch[i]; g.co[i] = rco[i]; }
    // swaying weed
    for (const [wx, h] of weeds) for (let j = 0; j < h; j++) {
      const sx = wx + Math.sin(t * 1.5 + j * 0.35 + wx) * j * 0.18;
      g.set(sx, bed[wx] - j, j % 2 ? ")" : "(", KEYS[WEED + (j > h - 3 ? 2 : j % 2)]);
    }
    // fish
    for (const f of fish) {
      const span = cols + 20;
      let x = ((t * f.sp + f.off) % span) - 10;
      if (f.dir < 0) x = cols - x;
      const y = f.y + Math.sin(t * 1.2 + f.off) * 1.2;
      const s = f.dir > 0 ? f.f : flip(f.f);
      for (let i = 0; i < s.length; i++) {
        const c = s[i] === "°" ? 1 : f.c === 0 && (s[i] === "(" || s[i] === ")") && i % 2 ? 1 : f.c;
        g.set(x + i, y, s[i], KEYS[FISH + c]);
      }
    }
    // a school of tiny fish wheeling together
    const scx = 50 + Math.sin(t * 0.3) * 30, scy = 13 + Math.sin(t * 0.5) * 4, dirS = Math.cos(t * 0.3) > 0;
    for (const [ox, oy, ph] of school) g.set(scx + ox + Math.sin(t * 2 + ph) * 0.6, scy + oy, dirS ? ">" : "<", KEYS[FISH + 3]);
    // bubbles
    for (const [bx, off, sp, ph] of bubbles) {
      const y = rows - 3 - ((t * sp + off) % (rows + 2));
      const x = bx + Math.sin(t * 2 + ph) * 0.8;
      g.set(x, y, y < 8 ? "○" : y < 20 ? "o" : "°", KEYS[BUB + (y < 10 ? 1 : 0)]);
    }
    return g.frame();
  };
}
