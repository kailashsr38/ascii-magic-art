/* mountain-sunrise: the sun rising behind layered mountain ranges, mist pooling in the valleys. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, TAU } from "../lib/kit.js";

const P = [];
const grp = (hexes) => {
  const o = P.length, n = hexes.length;
  P.push(...hexes);
  return (v) => KEYS[o + (v <= 0 ? 0 : v >= 1 ? n - 1 : Math.floor(v * n))];
};
const SKY = grp(gradient(["#1b1f4d", "#3f3a7a", "#8a4f86", "#d9637a", "#f59a5f", "#ffd27f"], 14));
const SUN = grp(gradient(["#ffc15e", "#fff6cf"], 4));
const RANGE = [
  grp(gradient(["#b08aae", "#e7b9c0", "#ffd9c4"], 5)),
  grp(gradient(["#7a5f99", "#b98aae", "#f2b8a8"], 5)),
  grp(gradient(["#4a3c78", "#7d5f98", "#d9928e"], 5)),
  grp(gradient(["#272452", "#473e70", "#a8687a"], 5)),
  grp(gradient(["#0d0f26", "#211f42", "#6e4660"], 5)),
];
const MIST = grp(gradient(["#c9a3bd", "#f6dcd6"], 4));
const BIRD = grp(["#1c1530"]);

export const meta = {
  slug: "mountain-sunrise",
  name: "Mountain Sunrise",
  category: "landscapes",
  note: "The sun climbs behind five layered mountain ranges while mist drifts through the valleys.",
  tags: ["mountains", "sunrise", "landscape", "wallpaper", "hero"],
  cols: 96, rows: 36, fps: 20,
  palette: palette(P),
};

const SH = "░▒▓█";
const sh = (v) => SH[v <= 0 ? 0 : v >= 1 ? 3 : Math.floor(v * 4)];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  // five static ridgelines, far to near
  const base = [17, 21, 25, 29, 33], amp = [12, 11, 10, 8, 6], freq = [0.04, 0.05, 0.06, 0.075, 0.09];
  const ridge = base.map((b, i) => {
    const out = new Float32Array(cols);
    for (let x = 0; x < cols; x++) {
      const n = fbm(x * freq[i] + i * 31, i * 7.3, 4, i);
      const sharp = 1 - Math.abs(2 * noise2(x * freq[i] * 0.7 + 9 * i, i, 50 + i) - 1);
      out[x] = b - amp[i] * (0.35 * n + 0.65 * sharp * sharp);
    }
    return out;
  });
  const tex = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) tex[x + y * cols] = fbm(x * 0.18, y * 0.35, 3, 3);
  const layerAt = new Int8Array(cols * rows).fill(-1);
  for (let x = 0; x < cols; x++) for (let y = 0; y < rows; y++) {
    for (let i = 4; i >= 0; i--) if (y >= ridge[i][x]) { layerAt[x + y * cols] = i; break; }
  }
  const r = rng(11);
  const birds = Array.from({ length: 5 }, () => [r() * cols, 3 + r() * 9, 2 + r() * 2, r() * TAU]);

  return (t) => {
    g.clear();
    const ph = (t / 40) * TAU;
    const sx = cols * 0.58, sy = 11 - 6 * Math.sin(ph);
    const lift = clamp((16 - sy) / 10);
    // sky with sun glow and slow rays
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      if (layerAt[x + y * cols] >= 0) continue;
      const dx = (x - sx) / 2, dy = y - sy, d = Math.hypot(dx, dy);
      const ray = 0.5 + 0.5 * Math.sin(Math.atan2(dy, dx) * 14 + t * 0.25);
      const cloud = fbm(x * 0.03 + t * 0.03, y * 0.2, 3, 5);
      let v = 0.15 + (y / 22) * 0.55 + Math.exp(-d / 12) * (0.4 + lift * 0.3) + ray * Math.exp(-d / 26) * 0.12 + (cloud - 0.5) * 0.35 + lift * 0.1;
      v = clamp(v);
      if (d < 5) g.set(x, y, "█", SUN(1.2 - d / 5));
      else g.set(x, y, sh(0.35 + v * 0.65), SKY(v));
    }
    // ranges with sun-facing light
    for (let x = 0; x < cols; x++) for (let y = 0; y < rows; y++) {
      const i = layerAt[x + y * cols];
      if (i < 0) continue;
      const R = ridge[i];
      const s = (R[Math.min(cols - 1, x + 1)] - R[Math.max(0, x - 1)]) * (sx > x ? 1 : -1);
      const depth = y - R[x];
      let v = 0.35 + s * 0.25 + (tex[x + y * cols] - 0.5) * 0.5 - depth * 0.03 + lift * 0.1;
      if (depth < 1 && s > 0) v = 0.92 + lift * 0.1;
      v = clamp(v);
      g.set(x, y, sh(0.4 + v * 0.6), RANGE[i](v));
      // valley mist: thicker low in each band, rolling slowly
      if (i < 4) {
        const m = clamp((depth - 2) / 6) * fbm(x * 0.06 - t * 0.12 * (i + 1), y * 0.4 + i * 3, 3, 9);
        if (m > 0.34) g.set(x, y, m > 0.52 ? "▓" : m > 0.42 ? "▒" : "░", MIST(m * 1.6 - 0.4 + lift * 0.2));
      }
    }
    // a few birds crossing
    for (const [bx, by, sp, p] of birds) {
      const x = ((bx + t * sp) % (cols + 10)) - 5;
      const y = by + Math.sin(t * 0.7 + p) * 0.8;
      const up = Math.sin(t * 8 + p) > 0;
      g.set(x, y, up ? "v" : "-", BIRD(0));
      g.set(x + 1, y, up ? "v" : "-", BIRD(0));
    }
    return g.frame();
  };
}
