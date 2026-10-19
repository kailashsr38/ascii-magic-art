/* wagging-pup: a floppy eared puppy sits in a sunny park, wagging its tail, panting and tilting its head. */
import { Grid, palette, gradient, KEYS, fbm, noise2, clamp, smooth } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const SKY = add(gradient(["#5aa8e4", "#7cbcec", "#a4d2f4", "#cce6fa"], 6));
const CLOUD = add(["#e8f2fc", "#ffffff"]);
const TREE = add(gradient(["#1a4a22", "#26602a", "#347a34", "#4a9440"], 4));
const GRASS = add(gradient(["#2a6a24", "#3a8a2c", "#52a63a", "#74c04a", "#9ad45e"], 6));
const FUR = add(gradient(["#7a4a1e", "#9e6428", "#c08236", "#daa04a", "#ecbe6a", "#f8dc98"], 12));
const EAR = add(gradient(["#3a1e0c", "#5a2e14", "#7a421e"], 3));
const CREAM = add(["#f4e2c0", "#fff4dc"]);
const EYE = add(["#140a04", "#ffffff"]);
const NOSE = add(["#1a0e0a", "#4a3028"]);
const TONGUE = add(["#e05a6a", "#ff8a98"]);
const COLLAR = add(["#d83a3a", "#ffd24a"]);
const FLOWER = add(["#ffffff", "#ffd84a", "#ff8ac0"]);

export const meta = {
  slug: "wagging-pup",
  name: "Happy Wagging Pup",
  category: "mascots",
  note: "A floppy eared puppy sits in a sunny park, wagging its tail, panting with its tongue out and tilting its head as if asked a question.",
  tags: ["dog", "puppy", "mascot", "pets", "cute", "404"],
  cols: 60, rows: 30, fps: 24,
  palette: palette(P),
};

const ell = (g, cx, cy, rx, ry, fn) => {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy;
    if (d <= 1) fn(x, y, dx, dy, d);
  }
};
const fur = (dx, dy, d, base = 0.55) => clamp(base - dx * 0.25 - dy * 0.3 + Math.sqrt(Math.max(0, 1 - d)) * 0.3);

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const bg = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const hz = 18 + Math.sin(x * 0.15) * 0.8;
    if (y >= hz) {
      const n = noise2(x * 0.5, y * 1.2, 3);
      const v = clamp(0.3 + (y - hz) / 14 + (n - 0.5) * 0.4);
      bg.push([n > 0.62 ? "▓" : "█", KEYS[GRASS + Math.min(5, Math.floor(v * 6))]]);
      continue;
    }
    const tr = 15 - Math.abs(Math.sin(x * 0.21)) * 4 - noise2(x * 0.4, 0, 2) * 2;
    if (y >= tr) { bg.push([noise2(x * 0.6, y * 0.8, 5) > 0.6 ? "▓" : "█", KEYS[TREE + Math.min(3, Math.floor((y - tr) / 2))]]); continue; }
    bg.push(["█", KEYS[SKY + Math.min(5, Math.floor(clamp(y / 14) * 6))]]);
  }
  const flowers = [[4, 24], [9, 27], [52, 23], [56, 27], [47, 28], [13, 22]];
  return (t) => {
    for (let i = 0; i < bg.length; i++) { g.ch[i] = bg[i][0]; g.co[i] = bg[i][1]; }
    // drifting clouds
    for (const [ox, cy, w] of [[5, 3, 7], [40, 5, 9]]) {
      const cx = ((ox + t * 1.2) % (cols + 20)) - 10;
      ell(g, cx, cy, w, 1.6, (x, y, dx, dy) => g.set(x, y, "█", KEYS[CLOUD + (dy < 0 ? 1 : 0)]));
      ell(g, cx - w * 0.3, cy - 1, w * 0.45, 1.3, (x, y) => g.set(x, y, "█", KEYS[CLOUD + 1]));
    }
    for (const [fx, fy] of flowers) { g.set(fx, fy, "●", KEYS[FLOWER + (fx % 3)]); g.set(fx, fy + 1, "│", KEYS[GRASS]); }
    const cx = 30;
    const wag = Math.sin(t * 14);
    const tiltP = t % 7;
    const tilt = tiltP > 3.5 && tiltP < 6 ? smooth(Math.min(1, (tiltP - 3.5) / 0.4)) * (tiltP > 5.6 ? 1 - (tiltP - 5.6) / 0.4 : 1) : 0;
    // shadow
    ell(g, cx, 27.5, 13, 1.2, (x, y) => g.set(x, y, "▓", KEYS[GRASS]));
    // tail wagging
    for (let i = 0; i < 9; i++) {
      const u = i / 8;
      const a = -0.5 - u * 0.9 + wag * 0.7 * u;
      const x = cx + 9 + Math.cos(a) * u * 8, y = 24 + Math.sin(a) * u * 6;
      g.text(Math.round(x), Math.round(y), "██", KEYS[FUR + (u > 0.8 ? 10 : 6)]);
    }
    if (Math.abs(wag) > 0.8) { const s = wag > 0 ? 1 : -1; g.set(cx + 16 + s, 16, s > 0 ? ")" : "(", KEYS[CLOUD + 1]); }
    // body
    ell(g, cx, 22.5, 9, 5.5, (x, y, dx, dy, d) => g.set(x, y, "█", KEYS[FUR + Math.min(11, Math.floor(fur(dx, dy, d) * 12))]));
    ell(g, cx, 22, 4, 4, (x, y, dx, dy) => g.set(x, y, "█", KEYS[CREAM + (dy < 0 ? 1 : 0)]));
    // front legs and paws
    for (const lx of [cx - 5, cx + 3]) {
      for (let y = 22; y <= 26; y++) g.text(lx, y, "███", KEYS[FUR + 8 - (y - 22)]);
      g.text(lx - 1, 27, "▀███▀", KEYS[CREAM + 1]);
    }
    // collar
    for (let x = cx - 6; x <= cx + 6; x++) g.set(x, 17, "▄", KEYS[COLLAR]);
    g.set(cx, 18, "●", KEYS[COLLAR + 1]);
    // head
    const hx = cx + tilt * 1.2, hy = 11 + Math.sin(t * 3) * 0.2 + tilt * 0.3;
    const pant = Math.floor(t * 4) % 2;
    // ears flop: inner ear flips up a bit during tilt
    for (const s of [-1, 1]) {
      const flop = s * (Math.sin(t * 3 + s) * 0.4 + (s > 0 ? tilt : -tilt) * 0.8);
      ell(g, hx + s * 9.5, hy + 1.5 - (s > 0 ? tilt : 0) * 1.5, 2.8, 5 + flop * 0.5, (x, y, dx, dy, d) => g.set(x, y, "█", KEYS[EAR + Math.min(2, Math.floor((1 - d) * 3 + (dy < 0 ? 0.6 : 0)))]));
    }
    ell(g, hx, hy, 9, 6, (x, y, dx, dy, d) => {
      const tl = dy - dx * tilt * 0.25;
      g.set(x, y, "█", KEYS[FUR + Math.min(11, Math.floor(fur(dx, tl, d, 0.62) * 12))]);
    });
    // muzzle
    ell(g, hx, hy + 3, 5, 2.6, (x, y, dx, dy) => g.set(x, y, "█", KEYS[CREAM + (dy < 0 ? 1 : 0)]));
    // eyes
    const blink = Math.abs((t % 3.9) - 1.7) < 0.12;
    for (const s of [-1, 1]) {
      const ex = Math.round(hx + s * 3.8 - 1), ey = Math.round(hy - 1 + (s > 0 ? -tilt * 0.6 : tilt * 0.4));
      if (blink) { g.text(ex, ey + 1, "▀▀▀", KEYS[EYE]); continue; }
      g.text(ex, ey, "▄█▄", KEYS[EYE]); g.text(ex, ey + 1, "▀█▀", KEYS[EYE]);
      g.set(ex, ey, "▄", KEYS[EYE + 1]);
    }
    // brows lift during tilt
    if (tilt > 0.3) { g.text(Math.round(hx - 5), Math.round(hy - 3), "▄▀", KEYS[EAR + 1]); g.text(Math.round(hx + 3), Math.round(hy - 3.6), "▀▄", KEYS[EAR + 1]); }
    // nose and mouth
    g.text(Math.round(hx - 1), Math.round(hy + 2), "▄█▄", KEYS[NOSE]);
    g.set(Math.round(hx), Math.round(hy + 3), "┴", KEYS[NOSE + 1]);
    g.text(Math.round(hx - 2), Math.round(hy + 4), "▀▄", KEYS[NOSE + 1]); g.text(Math.round(hx + 1), Math.round(hy + 4), "▄▀", KEYS[NOSE + 1]);
    // tongue
    const tl = 1 + pant;
    for (let k = 0; k < tl; k++) g.text(Math.round(hx), Math.round(hy + 5 + k), "██", KEYS[TONGUE + (k ? 0 : 1)]);
    g.set(Math.round(hx), Math.round(hy + 5 + tl), "▀", KEYS[TONGUE]);
    return g.frame();
  };
}
