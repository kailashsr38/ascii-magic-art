/* juggling-octopus: a pink octopus on the sea floor juggles three balls with two tentacles while its eyes follow them. */
import { Grid, palette, gradient, KEYS, fbm, noise2, clamp, rng, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const SEA = add(gradient(["#021024", "#04203e", "#083058", "#0e4272", "#16568a"], 10));
const SAND = add(gradient(["#3a3424", "#5a4e34", "#7a6a46", "#9a8a5a"], 4));
const WEED = add(["#0e4a2a", "#1a6a36", "#2a8a44"]);
const ROCK = add(["#1a2430", "#2a3644"]);
const OCTO = add(gradient(["#6a1a4a", "#8e2660", "#b23a76", "#d4568c", "#ee7aa6", "#ffaac8"], 12));
const SPOT = add(["#7a1e52"]);
const EYE = add(["#ffffff", "#0a0a14", "#e8f0ff"]);
const BALL = add(["#ff4a3a", "#ffd23a", "#3ad0c0", "#ffffff"]);
const BUB = add(["#6aa8d8", "#b0dcf8"]);

export const meta = {
  slug: "juggling-octopus",
  name: "Juggling Octopus",
  category: "mascots",
  note: "A pink octopus sits on the sea floor juggling three bright balls with two tentacles while its big eyes follow every throw.",
  tags: ["octopus", "mascot", "ocean", "juggle", "loader", "404"],
  cols: 64, rows: 30, fps: 30,
  palette: palette(P),
};

const ell = (g, cx, cy, rx, ry, fn) => {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy;
    if (d <= 1) fn(x, y, dx, dy, d);
  }
};
const BEAT = 0.42;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const bg = [];
  const floorY = (x) => 25 + Math.sin(x * 0.17) * 0.8;
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    if (y >= floorY(x)) { const n = noise2(x * 0.5, y * 1.2, 4); bg.push([n > 0.6 ? "▓" : "█", KEYS[SAND + Math.min(3, Math.floor(clamp(1 - (y - 25) / 5 + (n - 0.5) * 0.4) * 4))]]); continue; }
    const v = clamp(0.95 - y / 28 + (fbm(x * 0.06, y * 0.12, 3, 2) - 0.5) * 0.25);
    bg.push([" ░▒▓"[1 + Math.min(2, Math.floor(v * 3))], KEYS[SEA + Math.min(9, Math.floor(v * 10))]]);
  }
  for (const [rx, rw] of [[4, 5], [55, 6]]) for (let y = 22; y < 26; y++) for (let x = rx - rw; x <= rx + rw; x++) {
    if (Math.hypot((x - rx) / rw, (y - 25) / 3) < 1) bg[x + y * cols] = ["█", KEYS[ROCK + (x < rx ? 1 : 0)]];
  }
  const r = rng(3);
  const bubbles = Array.from({ length: 10 }, () => [r() * cols, r(), 0.5 + r() * 0.6]);
  const HL = [10, 13], HR = [54, 13];
  const ballAt = (T, i) => {
    const local = (((T - i) % 3) + 3) % 3, k = Math.floor((T - i) / 3) * 3 + i;
    const from = ((k % 2) + 2) % 2 === 0 ? HL : HR, to = from === HL ? HR : HL;
    if (local < 2) {
      const u = local / 2;
      return [from[0] + (to[0] - from[0]) * u, from[1] - 4 * u * (1 - u) * 11 - 1, false];
    }
    const u = local - 2; // held, scooping inward
    return [to[0] + (to === HL ? 1 : -1) * Math.sin(u * Math.PI) * 3, to[1] + Math.sin(u * Math.PI) * 1.2 - 1, true];
  };
  return (t) => {
    for (let i = 0; i < bg.length; i++) { g.ch[i] = bg[i][0]; g.co[i] = bg[i][1]; }
    // swaying seaweed
    for (const sx of [10, 15, 50, 59]) for (let k = 0; k < 9; k++) {
      const x = sx + Math.sin(t * 1.3 - k * 0.5 + sx) * k * 0.25;
      g.set(x, 25 - k, k % 2 ? "(" : ")", KEYS[WEED + (k % 3)]);
      g.set(x + 1, 25 - k, "█", KEYS[WEED + (k % 3)]);
    }
    for (const [bx, ph, sp] of bubbles) {
      const u = (t * sp * 0.15 + ph) % 1;
      g.set(bx + Math.sin(u * 12 + bx) * 0.8, 25 - u * 26, u > 0.5 ? "o" : "°", KEYS[BUB + (u > 0.5 ? 1 : 0)]);
    }
    const T = t / BEAT;
    const balls = [0, 1, 2].map((i) => ballAt(T, i));
    const cx = 32, cy = 13.5 + Math.sin(t * 1.5) * 0.4;
    // resting tentacles on the floor, curling
    for (let k = 0; k < 6; k++) {
      const side = k < 3 ? -1 : 1, j = k % 3;
      for (let s = 0; s <= 14; s++) {
        const u = s / 14;
        const x = cx + side * (1.5 + j * 2.6 + u * (5 + j * 3)) + Math.sin(t * 2 + u * 5 + k) * u * 1.4;
        const y = cy + 5 + u * (6.5 - j * 0.6) - Math.sin(u * Math.PI) * 1.5 - (u > 0.8 ? (u - 0.8) * 10 : 0);
        const th = 1.8 * (1 - u * 0.7);
        for (let w = -th; w <= th; w += 0.7) g.set(x + w, y, "█", KEYS[OCTO + Math.min(11, 5 + j + (w < 0 ? 2 : 0) - Math.round(u * 2))]);
        if (s % 3 === 1 && u > 0.2) g.set(x, y + 0.6, "▪", KEYS[OCTO + 11]);
      }
    }
    // two juggling tentacles reaching up to the hands
    for (const [hand, side] of [[HL, -1], [HR, 1]]) {
      const held = balls.find((b) => b[2] && Math.abs(b[0] - hand[0]) < 5);
      const hx = held ? held[0] : hand[0], hy = held ? held[1] + 1.2 : hand[1];
      const sx = cx + side * 8, sy = cy + 3;
      for (let s = 0; s <= 12; s++) {
        const u = s / 12;
        const x = sx + (hx - sx) * u, y = sy + (hy - sy) * u + Math.sin(u * Math.PI) * 3;
        const th = 1.6 * (1 - u * 0.5);
        for (let w = -th; w <= th; w += 0.7) g.set(x + w, y, "█", KEYS[OCTO + 6 + (w < 0 ? 2 : 0)]);
      }
      g.text(Math.round(hx) - 1, Math.round(hy), "▀▄▀", KEYS[OCTO + 10]);
    }
    // mantle
    ell(g, cx, cy, 10, 6.5, (x, y, dx, dy, d) => {
      const lit = clamp(0.55 - dy * 0.35 - dx * 0.2 + Math.sqrt(1 - d) * 0.3);
      const spot = noise2(x * 0.5, y * 0.9, 12) > 0.74 && dy < 0.1;
      g.set(x, y, spot ? "▓" : d > 0.85 ? "▓" : "█", spot ? KEYS[OCTO + 4] : KEYS[OCTO + Math.min(11, Math.floor(lit * 12))]);
    });
    g.text(Math.round(cx - 6), Math.round(cy - 5), "▄▄▄", KEYS[OCTO + 11]);
    // eyes follow the highest ball
    const hi = balls.reduce((a, b) => (b[1] < a[1] ? b : a));
    const lx = clamp((hi[0] - cx) / 14, -1, 1), ly = clamp((hi[1] - cy) / 10, -1, 1);
    const blink = Math.abs((t % 4.6) - 3.9) < 0.12;
    for (const ex of [cx - 4.5, cx + 4.5]) {
      if (blink) { g.text(Math.round(ex - 2), Math.round(cy + 1), "▀▀▀▀", KEYS[EYE + 1]); continue; }
      ell(g, ex, cy + 1, 3.3, 2.5, (x, y) => g.set(x, y, "█", KEYS[EYE]));
      ell(g, ex + lx * 1.2, cy + 1 + ly * 0.7, 1.4, 1.2, (x, y) => g.set(x, y, "█", KEYS[EYE + 1]));
      g.set(ex + lx * 1.2 - 1, cy + ly * 0.7 + 0.4, "▪", KEYS[EYE + 2]);
    }
    g.text(Math.round(cx - 1), Math.round(cy + 4), "▀▄▄▀", KEYS[SPOT]);
    // balls
    balls.forEach(([x, y], i) => {
      g.text(Math.round(x) - 2, Math.round(y), "▄██▄", KEYS[BALL + i]);
      g.text(Math.round(x) - 2, Math.round(y) + 1, "▀██▀", KEYS[BALL + i]);
      g.set(Math.round(x) - 1, Math.round(y), "▄", KEYS[BALL + 3]);
    });
    return g.frame();
  };
}
