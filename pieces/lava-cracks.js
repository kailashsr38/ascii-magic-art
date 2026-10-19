/* lava-cracks: plates of cooled black crust drift on a lava river, molten light glowing through the moving cracks. */
import { Grid, palette, gradient, KEYS, fbm, rng, clamp } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("melt", gradient(["#3a0602", "#7a1004", "#c02606", "#f05410", "#ff8a20", "#ffc040", "#fff0a0"], 12));
add("crust", gradient(["#060404", "#100a0a", "#1c1412", "#2a1e1a", "#3a2a24", "#4e3a30"], 6));
add("ember", ["#2a0a06", "#4a1208", "#6a1c0a"]);

export const meta = {
  slug: "lava-cracks",
  name: "Lava Crust Cracks",
  category: "demoscene",
  note: "Plates of cooled black crust drift down a lava river, molten orange light glowing up through the cracks as they pull apart.",
  tags: ["lava", "volcano", "fire", "glow", "wallpaper", "hero"],
  cols: 96, rows: 32, fps: 24,
  palette: palette(all),
};

const K = (n, i) => KEYS[G[n] + i];
const NS = 44;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(404);
  const Wp = cols + 12, H = rows * 2;
  const s0x = new Float32Array(NS), s0y = new Float32Array(NS), sv = new Float32Array(NS), sp = new Float32Array(NS);
  for (let i = 0; i < NS; i++) {
    s0x[i] = r() * Wp; s0y[i] = r() * H; sp[i] = r() * 6.28;
    sv[i] = 1.6 + 1.1 * Math.sin((s0y[i] / H) * Math.PI) + r() * 0.3;
  }
  const M = NS * 3, sx = new Float32Array(M), sy = new Float32Array(M), sid = new Int16Array(M);
  return (t) => {
    for (let i = 0; i < NS; i++) {
      const x = (((s0x[i] + sv[i] * t) % Wp) + Wp) % Wp - 6;
      const y = s0y[i] + Math.sin(t * 0.25 + sp[i]) * 2.5;
      for (let c = 0; c < 3; c++) { const j = i * 3 + c; sx[j] = x + (c - 1) * Wp; sy[j] = y; sid[j] = i; }
    }
    for (let y = 0; y < rows; y++) {
      const py = y * 2 + 1;
      for (let x = 0; x < cols; x++) {
        const px = x + 0.5;
        let d1 = 1e9, d2 = 1e9, b = 0;
        for (let j = 0; j < M; j++) {
          const dx = px - sx[j];
          if (dx > 26 || dx < -26) continue;
          const dy = py - sy[j];
          const d = dx * dx + dy * dy;
          if (d < d1) { d2 = d1; d1 = d; b = j; } else if (d < d2) d2 = d;
        }
        const e1 = Math.sqrt(d1), e2 = Math.sqrt(d2);
        const crack = (e2 - e1) * 0.5; // distance to the plate edge
        const id = sid[b];
        if (crack < 2.2) {
          const lv = clamp(1 - crack / 2.2);
          const v = Math.pow(lv, 1.6);
          const ch = v > 0.7 ? "█" : v > 0.45 ? "▓" : v > 0.22 ? "▒" : "░";
          g.set(x, y, ch, K("melt", Math.min(11, Math.floor(v * 12))));
        } else {
          // crust texture rides with its plate
          const tx = px - sx[b], ty = py - sy[b];
          const n = fbm(tx * 0.22 + id * 13.1, ty * 0.22 + id * 7.7, 3, 11);
          const edge = clamp(1 - (crack - 2.2) / 3);
          if (edge > 0.45 && n < 0.55) { g.set(x, y, n < 0.4 ? "▒" : "░", K("ember", Math.min(2, Math.floor(edge * 3)))); continue; }
          const lvl = Math.min(5, Math.floor(n * 6 + (1 - e1 / 14) * 1.2));
          const ch = n > 0.62 ? "▓" : n > 0.48 ? "▒" : n > 0.36 ? "░" : "·";
          g.set(x, y, ch, K("crust", Math.max(0, lvl)));
        }
      }
    }
    return g.frame();
  };
}
