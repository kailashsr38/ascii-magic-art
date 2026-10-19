/* endless-corridor: a ray-cast flight down an infinite lit corridor, doors and ceiling lamps rushing past. */
import { Grid, palette, gradient, KEYS, clamp } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("wall", gradient(["#05080c", "#0c1a22", "#16323c", "#245058", "#3a7476", "#6aa6a0", "#b8e0d4"], 12));
add("floor", gradient(["#06050a", "#141018", "#2a2026", "#463434", "#6a5048", "#a07c64", "#e0bc98"], 12));
add("ceil", gradient(["#06060a", "#14141c", "#262632", "#40404e", "#6a6a7a"], 6));
add("lamp", ["#ffd890", "#ffeec4", "#ffffff"]);
add("trim", gradient(["#0a2a3a", "#1a6a8a", "#2ac0e8", "#a8f0ff"], 6));
add("door", gradient(["#08040a", "#2a0e14", "#5a1a20", "#8a2a2a", "#c04a3a"], 6));

export const meta = {
  slug: "endless-corridor",
  name: "Endless Corridor",
  category: "demoscene",
  note: "A ray-cast flight down an infinite corridor, ceiling lamps, red doors and a glowing trim line rushing past.",
  tags: ["raycast", "corridor", "3d", "demoscene", "hero", "wallpaper"],
  cols: 96, rows: 32, fps: 30,
  palette: palette(all),
};

const K = (n, i) => KEYS[G[n] + i];
const SH = " ·:░░▒▒▓▓█";
const pick = (name, n, v) => K(name, Math.max(0, Math.min(n - 1, Math.floor(v * n))));
const shd = (v) => SH[Math.max(1, Math.min(9, Math.floor(v * 10)))];
const fr = (v) => v - Math.floor(v);

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const W = 1.25, HH = 1, F = cols * 0.42;
  return (t) => {
    const camZ = t * 3.6;
    const camX = Math.sin(t * 0.45) * 0.25, camY = Math.sin(t * 0.9) * 0.05;
    const roll = Math.sin(t * 0.31) * 0.06, cr = Math.cos(roll), sr = Math.sin(roll);
    for (let y = 0; y < rows; y++) {
      const py0 = (rows / 2 - y - 0.5) * 2;
      for (let x = 0; x < cols; x++) {
        const px0 = x + 0.5 - cols / 2;
        const px = px0 * cr - py0 * sr, py = px0 * sr + py0 * cr;
        const ax = Math.abs(px) || 1e-6, ay = Math.abs(py) || 1e-6;
        const sxw = px > 0 ? W - camX : W + camX, syw = py > 0 ? HH - camY : HH + camY;
        const tx = sxw / ax, ty = syw / ay;
        let ch, co;
        if (tx < ty) {
          // side wall
          const z = F * tx, zw = camZ + z, hy = camY + py * tx;
          const fog = Math.exp(-z * 0.055);
          const seg = fr(zw / 7);
          let lv = 0.55 + 0.25 * (1 - Math.abs(hy));
          lv *= 0.75 + 0.25 * Math.max(0, Math.cos((fr(zw / 7 + 0.5) - 0.5) * 6));
          if (seg > 0.35 && seg < 0.6 && hy < 0.62) {
            // recessed door
            const edge = seg < 0.38 || seg > 0.57 || hy > 0.56;
            const knob = seg > 0.53 && seg < 0.56 && Math.abs(hy + 0.05) < 0.06;
            ch = edge ? "█" : knob ? "●" : shd(lv * fog * 0.9);
            co = knob ? K("lamp", 0) : pick("door", 6, (edge ? 0.55 : 0.85) * lv * fog * 1.5);
          } else if (Math.abs(hy + 0.28) < 0.05) {
            ch = "━"; co = pick("trim", 6, fog * 1.3);
          } else {
            const seam = fr(zw / 1.75) < 0.07 || Math.abs(hy - 0.75) < 0.03;
            ch = seam ? (fr(zw / 1.75) < 0.07 ? "│" : "─") : shd(lv * fog * 1.25);
            co = pick("wall", 12, (seam ? 0.6 : 1) * lv * fog * 1.45);
          }
        } else if (py > 0) {
          // ceiling with lamps
          const z = F * ty, zw = camZ + z, hx = camX + px * ty;
          const fog = Math.exp(-z * 0.055);
          const lampAt = fr(zw / 7 + 0.5);
          if (lampAt < 0.12 && Math.abs(hx) < 0.45) {
            ch = fog > 0.4 ? "█" : "▓"; co = K("lamp", fog > 0.5 ? 2 : fog > 0.2 ? 1 : 0);
          } else {
            const seam = fr(zw / 1.75) < 0.08 || Math.abs(hx) > 0.95 && Math.abs(hx) < 1.0;
            const lv = (0.45 + 0.35 * Math.exp(-Math.pow((lampAt - 0.06) * 6, 2))) * fog;
            ch = seam ? "─" : shd(lv * 1.1); co = pick("ceil", 6, lv * (seam ? 0.8 : 1.3));
          }
        } else {
          // floor tiles reflecting the lamps
          const z = F * ty, zw = camZ + z, hx = camX + px * ty;
          const fog = Math.exp(-z * 0.055);
          const tile = (Math.floor(zw / 0.875) + Math.floor((hx + 2) / 0.625)) & 1;
          const glow = Math.exp(-Math.pow((fr(zw / 7 + 0.5) - 0.06) * 4, 2)) * (1 - Math.abs(hx) * 0.6);
          const lv = clamp(((tile ? 0.5 : 0.36) + glow * 0.7) * fog * 1.3);
          const grout = fr(zw / 0.875) < 0.06;
          ch = grout ? "─" : shd(lv * 1.2); co = pick("floor", 12, grout ? lv * 0.6 : lv * 1.2);
        }
        g.set(x, y, ch, co);
      }
    }
    return g.frame();
  };
}
