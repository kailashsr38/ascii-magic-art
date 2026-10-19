/* desert-dunes: rolling sand dunes under a hot sky, sand streaming off the crests. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, TAU } from "../lib/kit.js";

const P = [];
const grp = (hexes) => {
  const o = P.length, n = hexes.length;
  P.push(...hexes);
  return (v) => KEYS[o + (v <= 0 ? 0 : v >= 1 ? n - 1 : Math.floor(v * n))];
};
const SKY = grp(gradient(["#2f6fb6", "#6aa3d4", "#b9d3df", "#f5dfae", "#ffe9c2"], 12));
const SUN = grp(gradient(["#fff0b8", "#ffffff"], 3));
const LIT = grp(gradient(["#d98d4a", "#f0b462", "#ffd58a", "#fff0c4"], 8));
const SHD = grp(gradient(["#5a2a1c", "#8a4428", "#b4643a"], 6));
const BLOW = grp(gradient(["#a8683a", "#d29a5a", "#ecc48a"], 3));

export const meta = {
  slug: "desert-dunes",
  name: "Desert Dunes",
  category: "landscapes",
  note: "Rolling sand dunes bake under a blazing sky while the wind lifts sand off every crest.",
  tags: ["desert", "dunes", "sand", "landscape", "wallpaper", "hero"],
  cols: 96, rows: 36, fps: 20,
  palette: palette(P),
};

const SH = "░▒▓█";
const sh = (v) => SH[v <= 0 ? 0 : v >= 1 ? 3 : Math.floor(v * 4)];
// skewed triangle wave: long gentle windward slope, short steep lee face
const dune = (u) => { const f = u - Math.floor(u); return f < 0.72 ? f / 0.72 : (1 - f) / 0.28; };

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const L = 4;
  const base = [15, 20, 26, 33], amp = [3, 5, 7, 9], wl = [26, 34, 44, 60], drift = [0.4, 0.7, 1.1, 1.6];
  const ridge = Array.from({ length: L }, () => new Float32Array(cols + 2));
  const owner = new Int8Array(cols * rows);
  const crest = Array.from({ length: L }, () => new Int16Array(cols));
  const sx = cols * 0.2, sy = 5;

  return (t) => {
    g.clear();
    for (let i = 0; i < L; i++) for (let x = 0; x < cols + 2; x++) {
      const u = (x - 1 + t * drift[i]) / wl[i] + i * 0.37;
      ridge[i][x] = base[i] - amp[i] * (0.8 * dune(u) + 0.2 * noise2(u * 3, i, 7)) + 2;
    }
    for (let i = 0; i < L; i++) {
      let c = -99;
      const R = ridge[i];
      for (let x = 0; x < cols; x++) {
        if (R[x + 1] < R[x] && R[x + 1] <= R[x + 2]) c = x;
        crest[i][x] = c;
      }
    }
    owner.fill(-1);
    for (let x = 0; x < cols; x++) for (let y = 0; y < rows; y++)
      for (let i = L - 1; i >= 0; i--) if (y >= ridge[i][x + 1]) { owner[x + y * cols] = i; break; }
    // sky and sun with heat shimmer near the horizon
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      if (owner[x + y * cols] >= 0) continue;
      const d = Math.hypot((x - sx) / 2, y - sy);
      const shimmer = y > 9 ? Math.sin(x * 0.5 + t * 6 + y) * 0.06 : 0;
      const v = clamp(0.1 + (y / 16) * 0.75 + Math.exp(-d / 8) * 0.5 + shimmer + (fbm(x * 0.05 - t * 0.05, y * 0.3, 2, 4) - 0.5) * 0.15);
      if (d < 3.4) g.set(x, y, "█", SUN(1 - d / 3.4));
      else g.set(x, y, d < 6 ? "▓" : sh(0.45 + v * 0.55), SKY(Math.max(v, d < 6 ? 0.95 : 0)));
    }
    // dunes, lit on the sun-facing slope, ripples on the windward side
    for (let x = 0; x < cols; x++) for (let y = 0; y < rows; y++) {
      const i = owner[x + y * cols];
      if (i < 0) continue;
      const R = ridge[i];
      const s = R[x + 2] - R[x];            // > 0 means the face falls to the right, away from the sun
      const depth = y - R[x + 1];
      const far = (L - 1 - i) * 0.12;
      const dc = x - crest[i][x];
      if (dc >= 0 && dc < wl[i] * 0.6 && depth < 0.5 + dc * 0.9 && s > -0.2) {
        const v = clamp(0.25 + far + depth * 0.05 + (noise2(x * 0.3, y * 0.6, 3) - 0.5) * 0.3);
        g.set(x, y, sh(0.55 + v * 0.45), SHD(v));
      } else {
        const rip = Math.sin(x * 0.55 + y * 2.2 - depth * 0.8 + t * 0.4 * drift[i]);
        const v = clamp(0.45 + far - s * 0.6 + rip * 0.12 - depth * 0.05 + (noise2(x * 0.2, y * 0.5, 9) - 0.5) * 0.2);
        g.set(x, y, rip > 0.6 ? "▓" : "█", LIT(v));
      }
    }
    // sand streaming off the crests in gusts
    for (let i = 0; i < L; i++) {
      const R = ridge[i];
      for (let x = 1; x < cols; x++) {
        if (!(R[x + 1] < R[x] && R[x + 1] <= R[x + 2])) continue;
        const cy = R[x + 1], len = 8 + i * 4;
        for (let k = 0; k < len; k++) {
          const gust = fbm(k * 0.25 - t * 3, i * 5 + x * 0.1, 2, 13);
          const fade = 1 - k / len;
          if (gust * fade > 0.22) {
            const py = cy - 1 - k * 0.12 + Math.sin(k * 0.6 - t * 5) * 0.6;
            g.set(x + k, py, gust * fade > 0.36 ? "█" : "▓", BLOW(fade));
          }
        }
      }
    }
    return g.frame();
  };
}
