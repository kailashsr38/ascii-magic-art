/* magnet-field-lines: iron filings and traced field lines around two bar magnets, one slowly turning so the field reconnects. */
import { Grid, palette, gradient, KEYS, clamp, TAU } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("fil", gradient(["#161c2a", "#222e44", "#32445e", "#4a6280", "#6a88a6", "#98b4cc"], 6));
add("line", gradient(["#2a5a7a", "#3a8ab0", "#5ac0e0", "#a8ecff"], 4));
add("flow", ["#ffffff", "#fff0a0"]);
add("north", ["#a01e24", "#e03a3a", "#ffd0d0"]);
add("south", ["#1e3a9a", "#3a6ae0", "#d0e0ff"]);
add("bg", ["#06080e"]);

export const meta = {
  slug: "magnet-field-lines",
  name: "Magnetic Field Lines",
  category: "motion-lab",
  note: "Iron filings and traced field lines wrap around two bar magnets, one slowly turning so the field lines swing, stretch and reconnect between the poles.",
  tags: ["magnetism", "field", "science", "education", "simulation", "hero"],
  cols: 96, rows: 34, fps: 24,
  palette: palette(all),
};

const K = (n, i) => KEYS[G[n] + i];
const DIRS = ["─", "╱", "│", "╲"];
const HALF = 7, NSEED = 14, P = 24;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const W = cols, H = rows * 2;
  const q = new Float32Array(4), qx = new Float32Array(4), qy = new Float32Array(4);
  const mags = [[W * 0.3, H * 0.5, 0], [W * 0.7, H * 0.5, 0]];
  const field = (x, y) => {
    let fx = 0, fy = 0;
    for (let k = 0; k < 4; k++) {
      const dx = x - qx[k], dy = y - qy[k], d2 = dx * dx + dy * dy + 0.6;
      fx += (q[k] * dx) / d2; fy += (q[k] * dy) / d2;
    }
    return [fx, fy];
  };
  const pts = [];
  return (t) => {
    mags[1][2] = Math.PI + (t / P) * TAU; // the right magnet turns once per cycle
    mags[0][2] = Math.sin((t / P) * TAU) * 0.25;
    for (let m = 0; m < 2; m++) {
      const [cx, cy, a] = mags[m];
      const ux = Math.cos(a), uy = Math.sin(a);
      qx[m * 2] = cx + ux * HALF; qy[m * 2] = cy + uy * HALF * 0.9; q[m * 2] = 1; // north
      qx[m * 2 + 1] = cx - ux * HALF; qy[m * 2 + 1] = cy - uy * HALF * 0.9; q[m * 2 + 1] = -1; // south
    }
    // iron filings everywhere, aligned with the local field
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const [fx, fy] = field(x + 0.5, y * 2 + 1);
      const s = Math.hypot(fx, fy);
      const lv = clamp(Math.log(1 + s * 9) / 2.2);
      const ang = Math.atan2(-fy, fx);
      const ch = (x + y * 3) % 4 === 0 ? "·" : DIRS[((Math.round(ang / (Math.PI / 4)) % 4) + 4) % 4];
      g.set(x, y, lv < 0.08 ? "·" : ch, lv < 0.08 ? K("bg", 0) : K("fil", Math.min(5, Math.floor(lv * 6))));
    }
    // traced field lines from each north pole, with pulses flowing N to S
    const flowPh = (t * 8) % 14;
    for (let m = 0; m < 2; m++) {
      const nx0 = qx[m * 2], ny0 = qy[m * 2];
      for (let s = 0; s < NSEED; s++) {
        const a = (s / NSEED) * TAU + 0.11;
        let x = nx0 + Math.cos(a) * 1.4, y = ny0 + Math.sin(a) * 1.4;
        pts.length = 0;
        for (let k = 0; k < 360; k++) {
          const [fx, fy] = field(x, y);
          const l = Math.hypot(fx, fy) || 1e-6;
          x += (fx / l) * 0.7; y += (fy / l) * 0.7;
          if (x < -4 || y < -4 || x > W + 4 || y > H + 4) break;
          pts.push(x, y);
          if (Math.hypot(x - qx[1], y - qy[1]) < 1.2 || Math.hypot(x - qx[3], y - qy[3]) < 1.2) break;
        }
        const np = pts.length / 2;
        for (let k = 0; k < np; k++) {
          const px = pts[k * 2], py = pts[k * 2 + 1] / 2;
          const pulse = ((k - flowPh) % 14 + 14) % 14 < 1;
          if (pulse) { g.set(px, py, "●", K("flow", m)); continue; }
          if (k % 2) continue;
          const [fx, fy] = field(pts[k * 2], pts[k * 2 + 1]);
          const s2 = Math.hypot(fx, fy);
          g.set(px, py, "•", K("line", Math.min(3, Math.floor(clamp(Math.log(1 + s2 * 6) / 1.6) * 4))));
        }
      }
    }
    // magnet bodies
    for (let m = 0; m < 2; m++) {
      const [cx, cy, a] = mags[m];
      const ux = Math.cos(a), uy = Math.sin(a);
      for (let y = Math.floor((cy - 12) / 2); y <= (cy + 12) / 2; y++) for (let x = Math.floor(cx - 12); x <= cx + 12; x++) {
        const dx = x + 0.5 - cx, dy = y * 2 + 1 - cy;
        const along = dx * ux + dy * uy, across = -dx * uy + dy * ux;
        if (Math.abs(along) > HALF + 0.6 || Math.abs(across) > 2.6) continue;
        const pole = along > 0 ? "north" : "south";
        const edge = Math.abs(across) > 1.6;
        g.set(x, y, "█", K(pole, edge ? 0 : 1));
      }
      const lx = cx + ux * HALF * 0.55, ly = (cy + uy * HALF * 0.55) / 2;
      const sx = cx - ux * HALF * 0.55, sy = (cy - uy * HALF * 0.55) / 2;
      g.set(lx, ly, "N", K("north", 2)); g.set(sx, sy, "S", K("south", 2));
    }
    return g.frame();
  };
}
