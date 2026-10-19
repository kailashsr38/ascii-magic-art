/* hummingbird-hibiscus: a hummingbird with blurred wings hovering and sipping between two red hibiscus flowers. */
import { Grid, palette, gradient, KEYS, fbm, noise2, clamp, smooth, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const BG = add(gradient(["#0a2418", "#123a26", "#1e5232", "#36703e", "#5a8e48", "#8aac5a"], 12));
const LEAF = add(gradient(["#0a2a10", "#164a1a", "#2a6a26", "#4a8a34"], 6));
const PETAL = add(gradient(["#5a0418", "#8a0a26", "#c01834", "#e83a44", "#ff6a5a", "#ff9a84"], 10));
const STAM = add(["#ffd23a", "#fff09a", "#c87a1a"]);
const BIRD = add(gradient(["#0a3a2a", "#127a4a", "#24b064", "#6ae08a"], 6));
const THROAT = add(["#a8102a", "#ff2a5a", "#ff8ab0"]);
const BELLY = add(["#9aa4a0", "#d8dcd4"]);
const BEAK = add(["#1a1410", "#3a302a"]);
const WING = add(["#4a6a5a", "#8aa89a", "#c4d8cc"]);

export const meta = {
  slug: "hummingbird-hibiscus",
  name: "Hummingbird at Hibiscus",
  category: "animals",
  note: "A ruby-throated hummingbird hovers on blurred wings, sipping from one red hibiscus and then darting across to the other.",
  tags: ["hummingbird", "bird", "flowers", "garden", "nature", "hero"],
  cols: 88, rows: 32, fps: 30,
  palette: palette(P),
};

const PER = 9;
const FL = [{ x: 17, y: 18, face: 1 }, { x: 71, y: 12, face: -1 }];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const bg = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const n = fbm(x * 0.035, y * 0.07, 4, 2);
    const bok = Math.max(0, 1 - Math.hypot((x % 23) - 11, ((y + (x / 23 | 0) * 7) % 15 - 7) * 2) / 7) * (noise2(x / 23 | 0, 3, 4) > 0.5 ? 0.35 : 0);
    const v = clamp(0.15 + n * 0.7 + bok - y / rows * 0.15);
    bg.push([v > 0.62 ? "█" : v > 0.4 ? "▓" : "▒", KEYS[BG + Math.min(11, Math.floor(v * 12))]]);
  }
  const ell = (cx, cy, rx, ry, fn) => {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy;
      if (d <= 1) fn(x, y, dx, dy, d);
    }
  };
  const flower = (f, t, i) => {
    const sx = Math.sin(t * 0.7 + i * 2) * 0.8, cx = f.x + sx, cy = f.y + Math.sin(t * 0.5 + i) * 0.3;
    // stem and leaves
    g.line(cx - f.face * 2, cy + 4, cx - f.face * 6 - sx, rows - 1, "█", KEYS[LEAF + 2]);
    g.line(cx - f.face * 3, cy + 4, cx - f.face * 7 - sx, rows - 1, "▓", KEYS[LEAF + 1]);
    for (const [lx, ly, rx, ry] of [[cx - f.face * 12, cy + 9, 9, 2.6], [cx + f.face * 2, cy + 12, 8, 2.2], [cx - f.face * 8, rows - 3, 10, 2.4]]) {
      ell(lx, ly, rx, ry, (x, y, dx, dy) => g.set(x, y, Math.abs(dy) < 0.15 ? "▒" : "█", KEYS[LEAF + Math.min(5, Math.floor(clamp(0.7 - dy * 0.5 + dx * f.face * 0.2) * 6))]));
    }
    // petals
    const R = 13;
    for (let y = Math.floor(cy - R / 2) - 1; y <= cy + R / 2 + 1; y++) for (let x = Math.floor(cx - R) - 1; x <= cx + R + 1; x++) {
      const dx = x + 0.5 - cx, dy = (y + 0.5 - cy) * 2;
      const d = Math.hypot(dx, dy), a = Math.atan2(dy, dx) + i;
      const rr = R * (0.72 + 0.28 * Math.abs(Math.cos(2.5 * a))) + Math.sin(a * 9) * 0.3;
      if (d > rr) continue;
      const u = d / rr;
      const vein = Math.abs(Math.sin(a * 2.5 + 0.0)) < 0.08 && u > 0.3;
      const v = clamp(0.15 + u * 0.75 - (dy > 0 ? 0.08 : 0) + (vein ? -0.25 : 0));
      g.set(x, y, u > 0.92 ? "▓" : "█", KEYS[PETAL + Math.min(9, Math.floor(v * 10))]);
    }
    ell(cx, cy, 2, 1, (x, y) => g.set(x, y, "█", KEYS[PETAL]));
    // stamen column reaching toward the viewer side
    for (let k = 1; k <= 7; k++) g.set(cx + f.face * k, cy - k * 0.3, k > 5 ? "●" : "─", KEYS[k > 5 ? STAM : PETAL + 6]);
    g.set(cx + f.face * 7, cy - 2.6, "•", KEYS[STAM + 1]); g.set(cx + f.face * 6, cy - 1.4, "•", KEYS[STAM]);
    g.set(cx + f.face * 8, cy - 2.0, "•", KEYS[STAM + 1]);
    return [cx, cy];
  };
  return (t) => {
    for (let i = 0; i < bg.length; i++) { g.ch[i] = bg[i][0]; g.co[i] = bg[i][1]; }
    const tips = FL.map((f, i) => flower(f, t, i));
    // flight plan: sip at A, dart to B, sip, dart back
    const p = ((t % PER) + PER) % PER;
    const at = (k, back) => { const [cx, cy] = tips[k]; const f = FL[k]; return [cx + f.face * (22 + back), cy - 3]; };
    let bx, by, face;
    const sip = (k, u) => { const back = 3 - Math.max(0, Math.sin(u * TAU * 1.5)) * 3; const [x, y] = at(k, back); return [x, y + Math.sin(u * 20) * 0.25]; };
    if (p < 3.4) { [bx, by] = sip(0, p / 3.4); face = -1; }
    else if (p < 4.5) {
      const u = smooth((p - 3.4) / 1.1);
      const [x0, y0] = at(0, 3), [x1, y1] = at(1, 3);
      bx = x0 + (x1 - x0) * u; by = y0 + (y1 - y0) * u - Math.sin(u * Math.PI) * 6; face = u < 0.5 ? -1 : 1;
      face = 1;
    } else if (p < 7.9) { [bx, by] = sip(1, (p - 4.5) / 3.4); face = 1; }
    else {
      const u = smooth((p - 7.9) / 1.1);
      const [x0, y0] = at(1, 3), [x1, y1] = at(0, 3);
      bx = x0 + (x1 - x0) * u; by = y0 + (y1 - y0) * u - Math.sin(u * Math.PI) * 4; face = -1;
    }
    // the bird faces the flower it is feeding from: beak points along -face from the bird
    const d = face;
    const fl = Math.floor(t * 30) % 3;
    // wings behind body: blurred previous stroke, then current stroke
    const wing = (up, k, ch) => {
      const tipx = bx - d * 3.5, tipy = by + (up ? -8 : 4.5);
      for (let s = 0; s <= 1; s += 0.12) {
        const x = bx + (tipx - bx) * s, y = by - 0.8 + (tipy - by + 0.8) * s;
        const w = 2.4 * Math.sin(Math.PI * Math.min(1, s * 1.1 + 0.1));
        for (let o = -w; o <= w; o += 1) g.set(x + o - d * s, y, ch, KEYS[WING + k]);
      }
    };
    wing(fl !== 0, 0, "░");
    // tail
    for (let k = 1; k <= 7; k++) { g.set(bx - d * (5 + k), by + 0.8 + k * 0.4, k > 4 ? "▀" : "█", KEYS[BIRD + (k > 4 ? 0 : 1)]); g.set(bx - d * (5 + k), by + 1.8 + k * 0.4, "▀", KEYS[BIRD]); }
    g.set(bx - d * 12, by + 3.6, "▀", KEYS[BEAK]);
    ell(bx, by, 6, 2.4, (x, y, dx, dy) => {
      const belly = dy > 0.25;
      g.set(x, y, "█", belly ? KEYS[BELLY + (dy > 0.6 ? 0 : 1)] : KEYS[BIRD + Math.min(5, Math.floor(clamp(0.7 - dy * 0.6 + dx * d * 0.2) * 6))]);
    });
    const hx = bx + d * 5.2, hy = by - 1.9;
    ell(hx, hy, 3.2, 1.9, (x, y, dx, dy) => g.set(x, y, "█", dy > 0.3 ? KEYS[THROAT + (dx * d > 0 ? 1 : 0)] : KEYS[BIRD + 3]));
    g.set(hx + d * 1, hy - 0.6, "●", KEYS[BEAK]);
    for (let k = 1; k <= 9; k++) g.set(hx + d * (2.6 + k), hy + 0.1 + k * 0.05, "─", KEYS[BEAK + (k < 3 ? 1 : 0)]);
    // current wing in front
    wing(fl === 0, 2, fl === 0 ? "▓" : "▒");
    return g.frame();
  };
}
