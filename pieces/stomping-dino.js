/* stomping-dino: a chubby little green dinosaur stomps in place kicking up dust, flails its tiny arms and lets out a big roar. */
import { Grid, palette, gradient, KEYS, fbm, noise2, clamp, smooth } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const SKY = add(gradient(["#4a1a3a", "#7a2a42", "#b2443e", "#e0703a", "#f4a050", "#fcd27a"], 10));
const VOLC = add(["#2a1418", "#3e1e22", "#ff6a1a", "#ffb03a"]);
const SMOKE = add(["#5a3a44", "#7a5a62", "#9a7c84"]);
const GROUND = add(gradient(["#3a2414", "#5a3a1e", "#7a522a", "#9a6c3a"], 4));
const FERN = add(["#1a3a1a", "#2a5224"]);
const SKIN = add(gradient(["#0e4a24", "#16642e", "#228038", "#349a44", "#52b456", "#7ed070"], 12));
const BELLY = add(["#c8d87a", "#e4ec9a"]);
const PLATE = add(["#d8641a", "#ff9a3a"]);
const EYE = add(["#ffffff", "#0a0a0a"]);
const MOUTH = add(["#3a0a10", "#ff8a9a", "#ffffff"]);
const DUST = add(["#a88a6a", "#d4b894"]);

export const meta = {
  slug: "stomping-dino",
  name: "Stomping Little Dino",
  category: "mascots",
  note: "A chubby little green dinosaur stomps in place under a smoking volcano, kicking up dust, flailing its tiny arms and letting out a big roar.",
  tags: ["dinosaur", "mascot", "roar", "cute", "404", "game"],
  cols: 64, rows: 28, fps: 24,
  palette: palette(P),
};

const ell = (g, cx, cy, rx, ry, fn) => {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy;
    if (d <= 1) fn(x, y, dx, dy, d);
  }
};
const STEP = 0.7;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const bg = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    if (y >= 24) { const n = noise2(x * 0.4, y * 1.3, 2); bg.push([n > 0.62 ? "▓" : "█", KEYS[GROUND + Math.min(3, Math.floor(clamp(1 - (y - 24) / 4 + (n - 0.5) * 0.3) * 4))]]); continue; }
    const vh = 24 - Math.max(0, 11 - Math.abs(x - 52) * 0.8);
    if (y >= vh && y > 13) { bg.push(["█", KEYS[VOLC + (x < 52 ? 1 : 0)]]); continue; }
    const v = clamp(y / 24 + (fbm(x * 0.05, y * 0.2, 3, 2) - 0.5) * 0.15);
    bg.push(["█", KEYS[SKY + Math.min(9, Math.floor(v * 10))]]);
  }
  for (let x = 49; x <= 55; x++) bg[x + 13 * cols] = ["▄", KEYS[VOLC + 2]];
  for (const fx of [4, 9, 58]) for (let k = 0; k < 4; k++) { bg[fx - k + (23 - k) * cols] = ["▀", KEYS[FERN + 1]]; bg[fx + k + (23 - k) * cols] = ["▀", KEYS[FERN]]; bg[fx + (23 - k) * cols] = ["█", KEYS[FERN]]; }
  return (t) => {
    for (let i = 0; i < bg.length; i++) { g.ch[i] = bg[i][0]; g.co[i] = bg[i][1]; }
    // volcano smoke
    for (let i = 0; i < 6; i++) {
      const a = ((t * 0.18 + i / 6) % 1);
      ell(g, 52 + a * 4 + Math.sin(a * 5 + i) * 1.5, 12 - a * 12, 1.5 + a * 3, 0.8 + a * 1.4, (x, y) => g.set(x, y, a > 0.6 ? "▓" : "█", KEYS[SMOKE + Math.min(2, Math.floor(a * 3))]));
    }
    const p = t % 8;
    const roar = p > 5.2 && p < 7 ? (p < 5.5 ? smooth((p - 5.2) / 0.3) : p > 6.7 ? 1 - smooth((p - 6.7) / 0.3) : 1) : 0;
    const stomping = roar === 0;
    const sp = (t / STEP) % 2, leg = Math.floor(sp), u = sp % 1;
    const lift = stomping ? Math.sin(Math.min(1, u / 0.7) * Math.PI) * 2.2 : 0;
    const slam = stomping && u > 0.7 && u < 0.95;
    const bob = stomping ? Math.abs(Math.sin(sp * Math.PI)) * 0.8 : -roar * 0.5;
    const cx = 26, by = 15 - bob;
    // dust from the slammed foot
    const footX = [cx - 4, cx + 5];
    if (stomping && u > 0.68) {
      const k = (u - 0.68) / 0.32, fx = footX[leg];
      for (const s of [-1, 1]) { g.text(Math.round(fx + s * (3 + k * 5)) - 1, Math.round(23 - k * 1.5), k < 0.5 ? "▄█▄" : "▄▄", KEYS[DUST + (k < 0.5 ? 1 : 0)]); }
    }
    // tail
    for (let i = 0; i <= 20; i++) {
      const v = i / 20;
      const x = cx - 9 - v * 17, y = by + 1 + v * 5 - Math.sin(v * Math.PI) * 1.5 + Math.sin(t * 3 - v * 3) * v * 0.8;
      const th = 3.2 * (1 - v * 0.85);
      for (let w = -th; w <= th; w += 0.5) g.set(x, y + w * 0.5, "█", KEYS[SKIN + Math.min(11, Math.floor(clamp(0.5 - w * 0.12) * 12))]);
      if (i % 4 === 2 && i < 18) g.set(x, y - th * 0.5 - 0.6, "▲", KEYS[PLATE + (i % 8 === 2 ? 1 : 0)]);
    }
    // legs (back leg darker)
    for (const k of [0, 1]) {
      const lx = footX[k], up = leg === k ? lift : 0;
      for (let y = Math.round(by + 4); y <= Math.round(22 - up); y++) g.text(lx - 2, y, "█████", KEYS[SKIN + (k ? 5 : 3)]);
      g.text(lx - 3, Math.round(23 - up), "▀▀▀▀▀▀", KEYS[SKIN + (k ? 6 : 4)]);
      g.text(lx + 1, Math.round(23 - up), "▼▼", KEYS[BELLY + 1]);
    }
    // body
    ell(g, cx, by, 12, 6.5, (x, y, dx, dy, d) => {
      const belly = dy > 0.15 && dx > -0.4;
      const lit = clamp(0.55 - dy * 0.35 - dx * 0.1 + Math.sqrt(1 - d) * 0.3);
      const scale = noise2(x * 0.8, y * 1.4, 4) > 0.75 && !belly;
      g.set(x, y, scale ? "▓" : "█", belly ? KEYS[BELLY + (dy < 0.5 ? 1 : 0)] : KEYS[SKIN + Math.min(11, Math.floor(lit * 12) - (scale ? 2 : 0))]);
    });
    for (let i = -3; i <= 2; i++) g.set(cx + i * 3.5, by - 6.3 - Math.cos(i * 0.4) * 0.6, "▲", KEYS[PLATE + (i % 2 ? 0 : 1)]);
    // neck and head
    const hx = cx + 14, hy = by - 6 - roar * 1;
    ell(g, cx + 9, by - 3, 5, 4.5, (x, y, dx, dy) => g.set(x, y, "█", KEYS[SKIN + 6 - (dy > 0 ? 2 : 0)]));
    ell(g, hx, hy, 8, 4.4, (x, y, dx, dy, d) => {
      const lit = clamp(0.6 - dy * 0.35 - dx * 0.05 + Math.sqrt(1 - d) * 0.3);
      g.set(x, y, "█", KEYS[SKIN + Math.min(11, Math.floor(lit * 12))]);
    });
    g.set(hx - 4, hy - 4.6, "▲", KEYS[PLATE + 1]); g.set(hx - 1, hy - 4.8, "▲", KEYS[PLATE]);
    // jaw: opens wide on the roar
    const jaw = Math.round(roar * 3);
    if (jaw > 0) {
      for (let y = 1; y <= jaw; y++) g.text(Math.round(hx + 1), Math.round(hy + 1 + y), "███████", KEYS[MOUTH]);
      g.text(Math.round(hx + 3), Math.round(hy + 2 + jaw - 1), "▄▄▄", KEYS[MOUTH + 1]);
      g.text(Math.round(hx + 2), Math.round(hy + 2), "▼ ▼ ▼", KEYS[MOUTH + 2]);
      ell(g, hx + 3, hy + 3 + jaw, 5, 1.6, (x, y, dx, dy) => { if (dy > -0.2) g.set(x, y, "█", KEYS[SKIN + 5]); });
      g.text(Math.round(hx + 2), Math.round(hy + 2 + jaw), "▲ ▲ ▲", KEYS[MOUTH + 2]);
    } else {
      g.text(Math.round(hx + 1), Math.round(hy + 2), "▀▀▀▀▄▄", KEYS[SKIN]);
    }
    g.set(Math.round(hx + 6), Math.round(hy - 1), "▪", KEYS[SKIN]);
    // eye
    const blink = Math.abs((t % 3.9) - 2.6) < 0.12;
    const ex = Math.round(hx - 1), ey = Math.round(hy - 2);
    if (roar > 0.5) g.text(ex - 1, ey + 1, "▀▄▄", KEYS[EYE + 1]);
    else if (blink) g.text(ex - 1, ey + 1, "▀▀▀", KEYS[EYE + 1]);
    else { g.text(ex - 1, ey, "▄█▄", KEYS[EYE]); g.text(ex - 1, ey + 1, "▀█▀", KEYS[EYE]); g.set(ex, ey + 1, "█", KEYS[EYE + 1]); g.set(ex + 1, ey, "▄", KEYS[EYE + 1]); }
    g.text(ex - 3, ey + 2, "▄▄", KEYS[MOUTH + 1]);
    // tiny arms flailing
    const fl = Math.sin(t * (roar ? 22 : 9));
    for (const [ax, k] of [[cx + 8, 0], [cx + 10, 1]]) {
      const ay = by + 1 + Math.round(fl * (k ? 1 : -1));
      g.text(ax, ay, "▄█", KEYS[SKIN + 8 - k * 2]); g.set(ax + 2, ay + (k ? 0 : 1), "▀", KEYS[BELLY]);
    }
    // roar shake lines
    if (roar > 0.5) {
      const s = Math.floor(t * 12) % 2;
      for (const [dx, dy, ch] of [[10, -3, "/"], [11, 0, "-"], [10, 3, "\\"], [13, -4, "/"], [14, 0, "-"], [13, 4, "\\"]]) if ((dx > 12) === !!s || dx < 12) g.set(Math.round(hx + dx), Math.round(hy + 2 + dy), ch, KEYS[MOUTH + 2]);
    }
    return g.frame();
  };
}
