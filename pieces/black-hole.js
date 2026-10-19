/* black-hole: a black hole with a glowing accretion disk, its far side lensed into a halo over the shadow. */
import { Grid, palette, gradient, KEYS, fbm, rng, clamp, TAU } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("bg", gradient(["#020208", "#070a1e", "#11143a", "#1e1a4a", "#2c1c48"], 8));
add("star", ["#7f8fd0", "#dfe6ff"]);
add("disk", gradient(["#1c0400", "#4a0c02", "#8a1e04", "#c8400a", "#ec7418", "#ffae40", "#ffd890", "#fff3d8", "#ffffff"], 18));

export const meta = {
  slug: "black-hole",
  name: "Black Hole",
  category: "cosmos",
  note: "A black hole's accretion disk swirls around the dark shadow, its far side bent by gravity into a glowing halo.",
  tags: ["black-hole", "accretion", "lensing", "hero", "wallpaper"],
  cols: 100, rows: 38, fps: 24,
  palette: palette(all),
};

const K = (n, i) => KEYS[G[n] + i];
const SH = " ░▒▓█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = cols / 2, cy = rows / 2 + 0.5, RS = 9.5, S = 0.2, ROT = -0.08;
  const RIN = 13, ROUT = 46;
  const cr = Math.cos(ROT), sr = Math.sin(ROT);
  const r = rng(3);
  // a star map larger than the screen, sampled through the lens
  const SW = 220, SHH = 90;
  const smap = new Uint8Array(SW * SHH);
  for (let i = 0; i < 520; i++) smap[Math.floor(r() * SW) + Math.floor(r() * SHH) * SW] = 1 + Math.floor(r() * 3);
  const bgn = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) bgn[x + y * cols] = fbm(x * 0.03, y * 0.08, 4, 8);
  const P = 7;

  // disk texture in co-rotating coordinates, two layers crossfaded so winding never runs away
  const tex = (rd, ph, t) => {
    let s = 0;
    for (let k = 0; k < 2; k++) {
      const f = (t / P + k * 0.5) % 1;
      const wgt = 1 - Math.abs(f * 2 - 1);
      const a = ph - f * P * 1.7 * Math.pow(RIN / rd, 1.5);
      s += wgt * fbm(Math.cos(a) * rd * 0.22 + k * 30, Math.sin(a) * rd * 0.22, 3, 2);
    }
    return s;
  };

  return (t) => {
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const dx = x + 0.5 - cx, dy = (y + 0.5 - cy) * 2;
      const u = dx * cr + dy * sr, w = -dx * sr + dy * cr;
      const rr = Math.hypot(u, w);
      let I = -1;
      // background, bent around the hole
      if (rr > RS) {
        const bend = 1 + (RS * RS * 1.4) / (rr * rr);
        const sx = Math.floor(((cx + dx * bend + t * 3) % SW + SW) % SW);
        const sy = Math.floor(((cy * 2 + dy * bend) / 2 + 30 + SHH) % SHH);
        const halo = Math.exp(-(rr - RS) / 20) * 0.35;
        const v = clamp(bgn[x + y * cols] * 0.9 - 0.18 + halo);
        g.set(x, y, v > 0.42 ? "▒" : "░", K("bg", Math.min(7, Math.floor(v * 8))));
        const st = smap[sx + sy * SW];
        if (st) g.set(x, y, st === 3 ? "+" : st === 2 ? "·" : ".", K("star", st > 1 ? 1 : 0));
      } else g.set(x, y, " ");
      // lensed image of the far disk: a bright halo hugging the shadow
      if (rr > RS && rr < RS * 2) {
        const a = Math.atan2(w, u);
        const top = 0.55 + 0.45 * Math.max(0, -Math.sin(a));
        const prof = Math.exp(-(((rr - RS * 1.18) / (RS * 0.32)) ** 2));
        const tx = tex(RIN + (rr - RS) * 3, a, t);
        I = Math.max(I, prof * top * (0.55 + 0.75 * tx) * (1 - 0.35 * Math.cos(a)));
      }
      // photon ring
      const ring = Math.exp(-(((rr - RS * 1.04) / 0.7) ** 2));
      if (ring > 0.2) I = Math.max(I, ring * 1.05);
      // primary disk
      const rz = w / S, rd = Math.hypot(u, rz);
      if (rd > RIN && rd < ROUT && (rz > 0 || rr > RS * 1.05)) {
        const ph = Math.atan2(rz, u);
        const temp = Math.pow(RIN / rd, 0.9);
        const edge = clamp((rd - RIN) / 2) * clamp((ROUT - rd) / 10);
        const dop = 1 - 0.5 * (u / rd);
        const tx = tex(rd, ph, t);
        const D = temp * edge * dop * (0.45 + 0.9 * tx);
        if (rz < 0 && rr < RS * 2.1) I = Math.max(I, D * 0.6); else I = Math.max(I, D);
      }
      if (I > 0.06) {
        const v = clamp(I);
        g.set(x, y, SH[1 + Math.min(3, Math.floor(v * 4.5))], K("disk", Math.min(17, Math.floor(v * 18))));
      }
    }
    return g.frame();
  };
}
