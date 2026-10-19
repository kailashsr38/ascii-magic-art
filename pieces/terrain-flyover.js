/* terrain-flyover: a low flight over an endless mesh of green valleys, rock and snowy ridges under a dusk sky. */
import { Grid, palette, gradient, KEYS, fbm, clamp } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("sky", gradient(["#0c1030", "#24306a", "#5a4a8a", "#c06a78", "#f4a070"], 10));
add("land", gradient(["#0a1e14", "#14402a", "#2a6a34", "#5a8a3a", "#8a7a4a", "#8a6a54", "#b0a49a", "#e8eef4", "#ffffff"], 18));
add("fog", gradient(["#3a2e5a", "#7a5a80"], 2));
add("sun", ["#ffd8a0", "#fff4e0"]);
export const meta = {
  slug: "terrain-flyover",
  name: "Terrain Mesh Flyover",
  category: "solids",
  note: "A low flight over an endless gridded landscape, green valleys rising to rocky ridges and snowy peaks that sweep toward the camera under a dusk sky.",
  tags: ["3d", "terrain", "landscape", "mesh", "flyover", "wallpaper"],
  cols: 100, rows: 36, fps: 24,
  palette: palette(all),
};
const K = (n, i) => KEYS[G[n] + i];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  // a tileable height map: four shifted noise samples blended across the tile
  const W = 256, HM = new Float32Array(W * W);
  const f = (x, y) => { const r = 1 - Math.abs(fbm(x * 0.018, y * 0.018, 5, 4) * 2 - 1); return r * r * 0.7 + fbm(x * 0.05, y * 0.05, 3, 9) * 0.3; };
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const u = x / W, v = y / W;
    const h = f(x, y) * (1 - u) * (1 - v) + f(x + W, y) * u * (1 - v) + f(x, y + W) * (1 - u) * v + f(x + W, y + W) * u * v;
    HM[x + y * W] = h;
  }
  let lo = 1, hi = 0;
  for (const h of HM) { lo = Math.min(lo, h); hi = Math.max(hi, h); }
  for (let i = 0; i < HM.length; i++) { const v = (HM[i] - lo) / (hi - lo); HM[i] = Math.pow(v, 1.35) * 46; }
  const height = (x, z) => {
    const xi = Math.floor(x), zi = Math.floor(z), fx = x - xi, fz = z - zi;
    const a = HM[(xi & 255) + (zi & 255) * W], b = HM[((xi + 1) & 255) + (zi & 255) * W];
    const c = HM[(xi & 255) + ((zi + 1) & 255) * W], d = HM[((xi + 1) & 255) + ((zi + 1) & 255) * W];
    return a + (b - a) * fx + (c - a) * fz * (1 - fx) + (d - b) * fz * fx;
  };
  const yb = new Float32Array(cols);
  const HOR = 13;
  return (t) => {
    g.clear();
    // sky
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = clamp(y / (HOR + 6));
      g.set(x, y, v > 0.55 ? "▒" : "░", K("sky", Math.min(9, Math.floor(v * 10))));
    }
    for (let y = HOR - 5; y < HOR + 3; y++) for (let x = 60; x < 86; x++) {
      const d = Math.hypot((x - 72) / 6, (y + 0.5 - (HOR - 1)) / 3);
      if (d < 1) g.set(x, y, d < 0.6 ? "█" : "▓", K("sun", d < 0.6 ? 1 : 0));
    }
    const camZ = t * 9, camX = 40 * Math.sin(t * 0.05) + 128;
    const yaw = 0.25 * Math.sin(t * 0.07);
    const camH = Math.max(height(camX, camZ), height(camX, camZ + 5), height(camX, camZ + 12) - 3, 24) + 5;
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    yb.fill(rows);
    const FOC = 46;
    for (let x = 0; x < cols; x++) {
      const rx = (x - cols / 2) / FOC;
      const dx = rx * cy + sy, dz = cy - rx * sy;
      let d = 1.2;
      let pz = Math.floor((camZ + dz * d) / 5);
      while (d < 150 && yb[x] > 0) {
        const wx = camX + dx * d, wz = camZ + dz * d;
        const h = height(wx, wz);
        const sYf = HOR + ((camH - h) / d) * FOC * 0.5;
        const sY = Math.floor(sYf);
        if (sY < yb[x]) {
          const fog = clamp((d - 30) / 110);
          const hv = clamp(h / 46);
          // slope shading: compare with a sample toward the light
          const slope = clamp(0.55 + (height(wx - 1, wz - 1) - h) * 0.12);
          const gx = d < 55 && Math.abs(wx / 5 - Math.round(wx / 5)) < (d / FOC) / 5 * 0.55;
          const cz = Math.floor(wz / 5), gz = d < 55 && cz !== pz;
          let li = Math.floor(hv * 13 + slope * 5);
          li = Math.max(0, Math.min(17, Math.round(li * (1 - fog * 0.55))));
          for (let y = Math.max(0, sY); y < yb[x]; y++) {
            let ch = blkL(slope, fog), co = K("land", li);
            if (fog > 0.75) co = K("fog", fog > 0.9 ? 1 : 0);
            if ((gz && y === Math.max(0, sY)) || gx) { ch = "▓"; co = K("land", Math.min(17, li + 2)); }
            g.set(x, y, ch, co);
          }
          yb[x] = Math.max(0, sY);
        }
        pz = Math.floor(wz / 5);
        d += 0.12 + d * 0.012;
      }
    }
    return g.frame();
  };
}
function blkL(s, fog) {
  const v = s * (1 - fog * 0.6);
  return v > 0.62 ? "█" : v > 0.45 ? "▓" : v > 0.3 ? "▒" : "░";
}
