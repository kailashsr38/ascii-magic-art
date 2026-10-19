/* volcano-eruption: a volcano erupting at night, lava fountaining and pouring down its flanks. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, TAU } from "../lib/kit.js";

const P = [];
const grp = (hexes) => {
  const o = P.length, n = hexes.length;
  P.push(...hexes);
  return (v) => KEYS[o + (v <= 0 ? 0 : v >= 1 ? n - 1 : Math.floor(v * n))];
};
const SKY = grp(gradient(["#04030a", "#120714", "#2c0c14", "#5a1612"], 8));
const ASH = grp(gradient(["#140c10", "#2e1e20", "#4a3230", "#8a3a22", "#e0622a"], 10));
const ROCK = grp(gradient(["#080406", "#1c0a0a", "#3a1410", "#702a16", "#b4461c"], 10));
const LAVA = grp(gradient(["#a8200c", "#f05a12", "#ffa020", "#ffe070", "#fff8d0"], 10));
const STAR = grp(["#6a5a70"]);

export const meta = {
  slug: "volcano-eruption",
  name: "Volcano Eruption",
  category: "landscapes",
  note: "A volcano erupts into the night, throwing up lava bombs while glowing rivers run down its sides.",
  tags: ["volcano", "lava", "night", "fire", "wallpaper", "hero"],
  cols: 96, rows: 36, fps: 24,
  palette: palette(P),
};

const SH = "░▒▓█";
const sh = (v) => SH[v <= 0 ? 0 : v >= 1 ? 3 : Math.floor(v * 4)];
const CX = 48, TOP = 13, FOOT = 31;
const half = (y) => 4.5 + (y - TOP) * 1.25 + ((y - TOP) / 18) ** 2 * 15;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(9);
  const chans = [[-0.95, 0], [0.15, 2], [1.05, 4], [-0.35, 6]];
  const chanX = chans.map(([k, p]) => Float32Array.from({ length: rows }, (_, y) => CX + k * (y - TOP) * 1.4 + Math.sin(y * 0.45 + p) * 2.2 + (noise2(y * 0.2, p, 3) - 0.5) * 4));
  const tex = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) tex[x + y * cols] = fbm(x * 0.15, y * 0.3, 3, 2);
  const bombs = Array.from({ length: 70 }, () => [(r() - 0.5) * 16, 9 + r() * 9, 1.4 + r() * 1.2, r() * 5]);
  const sparks = Array.from({ length: 50 }, () => [r(), r() * 20, r() * TAU]);
  const stars = Array.from({ length: 30 }, () => [Math.floor(r() * cols), Math.floor(r() * 12)]);

  return (t) => {
    g.clear();
    const pulse = 0.75 + 0.25 * Math.sin(t * 2.3) * Math.sin(t * 0.9);
    // sky with a red glow around the summit
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const d = Math.hypot((x - CX) / 2, y - TOP);
      const v = clamp(0.2 + y / rows * 0.35 + Math.exp(-d / 20) * 0.65 * pulse);
      g.set(x, y, v > 0.5 ? "▒" : "░", SKY(v));
    }
    for (const [x, y] of stars) if (Math.exp(-Math.hypot((x - CX) / 2, y - TOP) / 14) < 0.2) g.set(x, y, "·", STAR(0));
    // ash plume, rising and leaning with the wind, lit from below
    for (let y = 0; y < TOP + 1; y++) {
      const up = TOP - y, cx = CX + up * 0.7 + Math.sin(t * 0.3 + y * 0.2) * 2, w = 3 + up * 1.6;
      for (let x = Math.max(0, Math.floor(cx - w * 1.5)); x < Math.min(cols, cx + w * 1.5); x++) {
        const e = Math.abs(x - cx) / w;
        const n = fbm(x * 0.09 - t * 0.1, y * 0.22 + t * 0.5, 4, 6);
        const dns = n * 1.4 - e * 0.6;
        if (dns > 0.15) {
          const lit = clamp(Math.exp(-up / 4) * pulse + (1 - e) * 0.15);
          g.set(x, y, sh(0.3 + dns * 1.4), ASH(clamp(0.3 + dns * 0.4 + lit * 0.6)));
        }
      }
    }
    // the cone
    for (let y = TOP; y < rows; y++) {
      const h = half(Math.min(y, FOOT + 2));
      for (let x = 0; x < cols; x++) {
        const inCone = Math.abs(x - CX) < h + (noise2(x * 0.3, y, 1) - 0.5) * 2;
        if (!inCone && y < FOOT) continue;
        let lava = 0;
        for (let c = 0; c < chanX.length; c++) {
          if (y < TOP + 1 + c) continue;
          const w = 0.7 + (y - TOP) * 0.05;
          const dd = Math.abs(x - chanX[c][y]);
          if (dd < w) lava = Math.max(lava, 1 - dd / (w + 0.5));
          else if (dd < w + 3) lava = Math.max(lava, -(1 - (dd - w) / 3));
        }
        if (y === TOP && Math.abs(x - CX) < 5) lava = 1;
        if (y >= FOOT) {
          for (let c = 0; c < chanX.length; c++) {
            const pd = Math.hypot((x - chanX[c][FOOT]) / 5, y - FOOT - 1.5);
            if (pd < 1) lava = Math.max(lava, 1 - pd * 0.6);
          }
        }
        if (lava > 0) {
          const flow = fbm(x * 0.4, y * 0.6 - t * 2.2, 3, 4);
          const v = clamp(0.25 + lava * 0.3 + flow * 0.6 * pulse);
          g.set(x, y, flow > 0.55 ? "█" : "▓", LAVA(v));
        } else {
          const glow = lava < 0 ? -lava * 0.5 : 0;
          const crest = Math.exp(-(y - TOP) / 3) * 0.4 * pulse;
          const rim = Math.abs(x - CX) > half(Math.min(y, FOOT + 2)) - 2 ? 0.12 : 0;
          const v = clamp(tex[x + y * cols] * 0.6 + 0.12 + glow + crest + rim + (y - TOP) / 60);
          g.set(x, y, sh(0.55 + v), ROCK(v));
        }
      }
    }
    // embers drifting up in the plume
    for (const [p, off, ph] of sparks) {
      const a = (t * 0.25 + p) % 1, up = a * 18;
      const x = CX + up * 0.7 + Math.sin(t * 2 + ph) * (1 + up * 0.5), y = TOP - up;
      g.set(x, y, a < 0.5 ? "•" : "·", LAVA(clamp(0.9 - a)));
    }
    // lava bombs thrown from the crater
    for (const [vx, vy, life, p] of bombs) {
      const a = (t + p) % life;
      const x = CX + vx * a, y = TOP - 1 - vy * a + 9 * a * a;
      if (y > TOP + (Math.abs(x - CX) > 5 ? (Math.abs(x - CX) - 4) * 0.7 : 0) + 1) continue;
      const v = clamp(1 - a / life);
      g.set(x, y, v > 0.6 ? "●" : v > 0.3 ? "•" : "·", LAVA(0.35 + v * 0.65));
    }
    return g.frame();
  };
}
