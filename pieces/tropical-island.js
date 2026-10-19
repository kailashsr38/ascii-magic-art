/* tropical-island: a palm island in a turquoise sea, waves lapping at the sand under a high sun. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, TAU } from "../lib/kit.js";

const P = [];
const grp = (hexes) => {
  const o = P.length, n = hexes.length;
  P.push(...hexes);
  return (v) => KEYS[o + (v <= 0 ? 0 : v >= 1 ? n - 1 : Math.floor(v * n))];
};
const SKY = grp(gradient(["#1c64c8", "#3c8ee0", "#78bdf0", "#c4e8ff"], 10));
const SUN = grp(["#fff6c8", "#ffffff"]);
const CLOUD = grp(gradient(["#b0cce8", "#e4f0fc", "#ffffff"], 4));
const SEA = grp(gradient(["#06407e", "#0a6aa8", "#10a0c4", "#38d0d0", "#8cf0e0"], 12));
const FOAM = grp(["#d8fff8", "#ffffff"]);
const SAND = grp(gradient(["#c89a58", "#ecc888", "#fff0c8"], 6));
const TRUNK = grp(["#5a3a1e", "#8a6034"]);
const LEAF = grp(gradient(["#0e4a1e", "#1e7a2a", "#48b03a", "#8ad84a"], 6));
const NUT = grp(["#3a2410"]);

export const meta = {
  slug: "tropical-island",
  name: "Tropical Island",
  category: "landscapes",
  note: "Swaying palms on a small island ringed by turquoise water, waves lapping under a high sun.",
  tags: ["island", "beach", "ocean", "summer", "tropical", "wallpaper"],
  cols: 96, rows: 36, fps: 20,
  palette: palette(P),
};

const SH = "░▒▓█";
const sh = (v) => SH[v <= 0 ? 0 : v >= 1 ? 3 : Math.floor(v * 4)];
const HZ = 14, IX = 54, IY = 26;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const palms = [[47, IY - 1, -0.35, 13, 0], [56, IY - 2, 0.15, 16, 2], [64, IY - 1, 0.45, 11, 4]];
  const sx = 22, sy = 4;

  return (t) => {
    g.clear();
    // sky with sun and drifting cumulus
    for (let y = 0; y < HZ; y++) for (let x = 0; x < cols; x++) {
      const d = Math.hypot((x - sx) / 2, y - sy);
      const v = clamp(y / HZ * 0.9 + Math.exp(-d / 7) * 0.6);
      const c = fbm(x * 0.06 - t * 0.08, y * 0.3, 4, 3) * (1 - Math.abs(y - 8) / 6);
      if (d < 2.6) g.set(x, y, "█", SUN(d < 1.6 ? 1 : 0));
      else if (c > 0.36) g.set(x, y, c > 0.48 ? "█" : c > 0.42 ? "▓" : "▒", CLOUD(clamp((c - 0.36) * 5 + (8 - y) * 0.08)));
      else g.set(x, y, v > 0.5 ? "█" : "▓", SKY(v));
    }
    // sea: deep at the horizon, turquoise near the island, sun glitter
    for (let y = HZ; y < rows; y++) {
      const d = (y - HZ) / (rows - HZ);
      for (let x = 0; x < cols; x++) {
        const isl = Math.hypot((x - IX) / 26, (y - IY) / 7);
        const shallow = clamp(1.4 - isl);
        const w = fbm(x * 0.08 - t * 0.25, y * 0.5 + t * 0.12, 3, 5);
        const glit = Math.exp(-(((x - sx) / (3 + d * 6)) ** 2)) * (0.5 + 0.5 * Math.sin(t * 3 + x * 0.9 + y * 2.1));
        if (glit > 0.7 && w > 0.45) { g.set(x, y, "▓", FOAM(1)); continue; }
        const v = clamp(0.15 + d * 0.35 + shallow * 0.55 + (w - 0.5) * 0.5);
        const crest = Math.sin(x * 0.12 + y * 1.3 - t * 1.6 + w * 4) > 0.975;
        g.set(x, y, crest ? "▀" : w > 0.6 ? "▓" : "█", crest ? FOAM(0) : SEA(v));
      }
    }
    // island sand, with foam lapping at the edge
    for (let y = IY - 4; y < IY + 5; y++) for (let x = IX - 22; x <= IX + 22; x++) {
      const a = Math.atan2(y - IY, (x - IX) / 3);
      const lap = 0.08 * Math.sin(t * 2.2 + a * 3) + 0.04 * Math.sin(t * 3.7 - a * 5);
      const rr = Math.hypot((x - IX) / 19, (y - IY) / 3.6);
      if (rr < 1 - 0.12 + lap) {
        const v = clamp(0.4 + (IY - y) * 0.12 + noise2(x * 0.4, y, 9) * 0.3);
        g.set(x, y, "█", SAND(v));
      } else if (rr < 1.08 + lap) g.set(x, y, "▓", FOAM(rr < 1 + lap ? 1 : 0));
      else if (rr < 1.18 + lap * 1.5 && Math.sin(a * 9 + t * 2) > 0) g.set(x, y, "▒", FOAM(0));
    }
    // palms: curved trunks and drooping fronds that sway
    for (const [bx, by, lean, h, ph] of palms) {
      const sway = Math.sin(t * 1.3 + ph) * 0.6;
      let tx = bx, ty = by;
      for (let j = 0; j < h; j++) {
        const f = j / h;
        tx = bx + lean * j + f * f * (lean * 6 + sway);
        ty = by - j;
        g.set(tx, ty, j % 2 ? "▓" : "█", TRUNK(j % 2));
        g.set(tx + 1, ty, j % 2 ? "▒" : "▓", TRUNK(0));
      }
      const top = [tx + 0.5, ty - 0.5];
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * TAU + 0.2 + Math.sin(t * 1.6 + k + ph) * 0.08;
        const dx = Math.cos(a), dir = Math.sin(a);
        const len = 9 + (k % 3);
        for (let s = 0; s <= len; s++) {
          const fx = top[0] + dx * s * 1.7 + sway * s * 0.1;
          const fy = top[1] + dir * s * 0.45 + 0.022 * s * s * 1.6 - (dir < 0 ? 0 : 0);
          const v = clamp(0.25 + (1 - s / len) * 0.4 + (dir < 0 ? 0.3 : 0));
          g.set(fx, fy, s === len ? "▒" : "█", LEAF(v));
          if (s > 2 && s < len - 1) g.set(fx, fy + 1, "▒", LEAF(v * 0.6));
        }
      }
      g.set(top[0] - 1, top[1] + 1, "●", NUT(0)); g.set(top[0] + 1, top[1] + 1, "●", NUT(0));
    }
    return g.frame();
  };
}
