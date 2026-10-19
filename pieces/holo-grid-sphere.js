/* holo-grid-sphere: a see-through holographic globe of grid lines turns above a projector pad, a ring of data orbiting it. */
import { Grid, palette, gradient, KEYS, clamp, TAU } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("front", gradient(["#0a4a5a", "#128a9a", "#20c8d8", "#7af4ff", "#e0ffff"], 8));
add("back", gradient(["#1a1040", "#3a1a6a", "#6a2a9a"], 3));
add("fill", gradient(["#041018", "#06202c", "#0a3040", "#0e4256"], 4));
add("ring", gradient(["#5a2a7a", "#b04ac8", "#ff8af0", "#ffe0ff"], 4));
add("bg", ["#04060c", "#080c16", "#0c1220"]);
add("beam", gradient(["#05141c", "#082430", "#0c3444"], 3));
add("pad", ["#1a2a3a", "#3a5a6a", "#7ae0f0", "#ffffff"]);

export const meta = {
  slug: "holo-grid-sphere",
  name: "Holographic Grid Sphere",
  category: "demoscene",
  note: "A see-through holographic globe of glowing grid lines turns above a projector pad while a ring of data blips orbits around it.",
  tags: ["hologram", "sphere", "sci-fi", "3d", "hero", "dashboard"],
  cols: 84, rows: 34, fps: 30,
  palette: palette(all),
};

const K = (n, i) => KEYS[G[n] + i];
const STEP = TAU / 18;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = cols / 2, cy = 14, R = 26, tilt = 0.38;
  const ct = Math.cos(tilt), st = Math.sin(tilt);
  const padY = rows - 4;
  const near = (v, w) => { const f = v / STEP - Math.round(v / STEP); return Math.abs(f) < w; };
  return (t) => {
    const rot = t * 0.45, cr = Math.cos(rot), sr = Math.sin(rot);
    const toObj = (x, y, z) => {
      // undo tilt about X, then spin about Y
      const y1 = y * ct + z * st, z1 = -y * st + z * ct;
      return [x * cr - z1 * sr, y1, x * sr + z1 * cr];
    };
    const gridAt = (x, y, z, w) => {
      const [ox, oy, oz] = toObj(x, y, z);
      const lat = Math.asin(clamp(oy, -1, 1)), lon = Math.atan2(oz, ox);
      return near(lat, w) || near(lon, w * (1 / Math.max(0.25, Math.cos(lat))));
    };
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const sx = (x + 0.5 - cx) / R, sy = -((y + 0.5 - cy) * 2) / R;
      const d2 = sx * sx + sy * sy;
      // projector beam, a soft cone from the pad up to the globe
      const coneW = (padY - y) > 0 ? 6 + (padY - y) * 0.75 : 0;
      const inBeam = y > cy && y < padY && Math.abs(x + 0.5 - cx) < coneW;
      if (d2 < 1) {
        const z = Math.sqrt(1 - d2);
        const rim = 1 - z;
        if (gridAt(sx, sy, z, 0.05 + rim * 0.04)) {
          const lv = clamp(0.45 + z * 0.4 + rim * 0.4);
          g.set(x, y, rim > 0.55 ? "▒" : "▓", K("front", Math.min(7, Math.floor(lv * 8))));
        } else if (gridAt(sx, sy, -z, 0.06)) {
          g.set(x, y, "░", K("back", Math.min(2, Math.floor((1 - rim) * 3))));
        } else {
          const lv = clamp(rim * 1.3);
          g.set(x, y, lv > 0.6 ? "▒" : lv > 0.25 ? "░" : "·", K("fill", Math.min(3, Math.floor(lv * 4))));
        }
      } else if (inBeam) {
        const f = 1 - Math.abs(x + 0.5 - cx) / coneW;
        g.set(x, y, f > 0.5 ? "▒" : "░", K("beam", Math.min(2, Math.floor(f * 3))));
      } else if (y >= padY) {
        const ex = (x + 0.5 - cx) / 15, ey = (y - padY - 1.2) / 1.6;
        const e = ex * ex + ey * ey;
        if (e < 1) g.set(x, y, e > 0.6 ? "▓" : e > 0.25 ? "█" : "▄", K("pad", e > 0.6 ? 1 : e > 0.25 ? 0 : 2));
        else g.set(x, y, (x + y) % 2 ? "─" : "·", K("bg", 2));
      } else {
        // backdrop: faint lab grid
        const gx = x % 6 === 0, gy = y % 3 === 0;
        g.set(x, y, gx && gy ? "+" : gx || gy ? "·" : (x + y) & 1 ? "·" : " ", K("bg", gx && gy ? 2 : gx || gy ? 1 : 0));
      }
    }
    // orbiting ring of data blips
    const n = 90;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU - t * 0.8;
      const rx = Math.cos(a) * 1.45, rz = Math.sin(a) * 1.45, ry = 0;
      const tl = 0.32;
      const y1 = ry * Math.cos(tl) - rz * Math.sin(tl), z1 = ry * Math.sin(tl) + rz * Math.cos(tl);
      const px = cx + rx * R, py = cy - y1 * R * 0.5;
      if (z1 < 0 && rx * rx + y1 * y1 < 1) continue;
      const blip = i % 9 === 0;
      const lv = z1 > 0 ? 3 : 1;
      g.set(px, py, blip ? "■" : z1 > 0 ? "●" : "•", K("ring", blip ? Math.min(3, lv) : lv - 1));
    }
    g.text(Math.round(cx) - 1, padY + 1, "███", K("pad", 3));
    return g.frame();
  };
}
