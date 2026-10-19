/* cloth-flag: a flag rippling on its pole in a gusty wind, shaded by the folds of the cloth. */
import { Grid, palette, gradient, KEYS, fbm, clamp, TAU } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("sky", gradient(["#2a5aa8", "#3a74c4", "#5a94d8", "#8ab8ea", "#c0dcf6"], 10));
add("cloud", gradient(["#a8c4e4", "#dbe8f6", "#ffffff"], 4));
add("navy", gradient(["#060c24", "#0e1a48", "#1a2e74", "#2e4aa0", "#5a78cc"], 8));
add("white", gradient(["#6a7080", "#a8aeba", "#dde2ea", "#ffffff"], 8));
add("gold", gradient(["#6a4a0a", "#b8860e", "#f0c030", "#fff0a0"], 8));
add("pole", ["#5a5e68", "#a8acb6", "#e6e8ee"]);
add("ground", gradient(["#1e4a1a", "#2e6a24", "#4a8a34"], 3));

export const meta = {
  slug: "cloth-flag",
  name: "Waving Flag",
  category: "motion-lab",
  note: "A flag ripples on its pole in a gusty wind, travelling waves rolling along the cloth with light and shade in every fold.",
  tags: ["flag", "cloth", "wind", "wave", "hero", "banner"],
  cols: 92, rows: 32, fps: 24,
  palette: palette(all),
};

const K = (n, i) => KEYS[G[n] + i];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const PX = 12, TOP = 4, FW = 66, FH = 17;
  // displacement toward the viewer, in cells
  const z = (u, v, t) => {
    const gust = 0.8 + 0.25 * Math.sin(t * 0.7);
    const a = u * (2.6 + 1.2 * u) * gust;
    return a * (Math.sin(u * 9.5 - t * 6.2 + v * 1.2) * 0.75 + Math.sin(u * 17 - t * 9.1 + v * 3.1) * 0.25);
  };
  return (t) => {
    g.clear();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const c = fbm(x * 0.05 - t * 0.5, y * 0.16, 4, 3);
      const v = clamp(y / rows * 0.9 + 0.05);
      if (y >= rows - 3) { g.set(x, y, y === rows - 3 ? "▄" : "█", K("ground", Math.min(2, rows - 1 - y))); continue; }
      if (c > 0.6) g.set(x, y, c > 0.7 ? "▓" : "▒", K("cloud", Math.min(3, Math.floor((c - 0.6) * 20))));
      else g.set(x, y, v > 0.5 ? "▒" : "░", K("sky", Math.min(9, Math.floor(v * 10))));
    }
    // pole
    for (let y = TOP - 1; y < rows - 3; y++) { g.set(PX - 1, y, "▐", K("pole", 2)); g.set(PX, y, "▌", K("pole", 0)); }
    g.text(PX - 1, TOP - 2, "▄▄", K("gold", 6));
    g.text(PX - 1, TOP - 3, "▗▖", K("gold", 7));
    // cloth: sample densely, project, depth test
    const NU = FW * 2, NV = FH * 2;
    for (let j = 0; j <= NV; j++) {
      const v = j / NV;
      for (let i = 0; i <= NU; i++) {
        const u = i / NU;
        const zz = z(u, v, t);
        const du = (z(u + 0.01, v, t) - zz) / 0.01;
        // folds shorten the flag and drag the free edge a little down
        const x = PX + 1 + u * FW * (0.94 - 0.03 * Math.abs(Math.sin(t * 0.7))) - Math.abs(zz) * 0.35;
        const y = TOP + v * FH + zz * 0.22 + u * u * 1.6;
        const shade = clamp(0.6 - du * 0.045 + zz * 0.03, 0.22, 1);
        // pattern: deep blue field, a white band on the diagonal, a gold ring near the hoist
        const diag = Math.abs((v - 0.5) - (u - 0.5) * (FH / FW) * -2.2);
        const ring = Math.hypot((u - 0.2) * FW, (v - 0.5) * FH * 2) / (FH * 0.55);
        let col;
        if (ring > 0.62 && ring < 0.95) col = K("gold", Math.min(7, Math.floor(shade * 8)));
        else if (diag < 0.15 && ring > 0.95) col = K("white", Math.min(7, Math.floor(shade * 8)));
        else col = K("navy", Math.min(7, Math.floor(shade * 8)));
        g.setZ(x, y, zz, shade > 0.5 ? "█" : shade > 0.32 ? "▓" : "▒", col);
      }
    }
    // rings that tie the cloth to the pole
    g.set(PX + 1, TOP, "●", K("pole", 1)); g.set(PX + 1, TOP + FH, "●", K("pole", 1));
    return g.frame();
  };
}
