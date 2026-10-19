/* waffle-iron-open: a round waffle iron puffs steam, its lid swings open on a golden grid waffle, and it is lifted out before the lid closes again. */
import { Grid, palette, gradient, KEYS, fbm, noise2, clamp, smooth, lerp } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const WALL = add(gradient(["#2a3442", "#364456", "#46566a", "#5a6c82"], 5));
const COUNTER = add(gradient(["#d8d2c8", "#ece6dc", "#fbf7f0"], 3));
const IRON = add(gradient(["#08080a", "#16161a", "#26262c", "#3a3a44", "#5a5a66", "#8a8a96"], 6));
const PLATE = add(["#1c1c20", "#2e2e34", "#46464e"]);
const WAFFLE = add(gradient(["#7a3a0c", "#a85a18", "#d08a2e", "#eab454", "#f8d88a"], 7));
const LIGHT = add(["#ff3a2a", "#3aff6a", "#401010"]);
const STEAM = add(gradient(["#6a7280", "#a4acb6", "#dce2e8", "#ffffff"], 4));
const FORK = add(["#9aa2ac", "#e4e8ee"]);

export const meta = {
  slug: "waffle-iron-open",
  name: "Waffle Iron Opening",
  category: "food",
  note: "A round waffle iron puffs steam, its lid swings open on a golden grid waffle, the waffle is lifted out and the lid closes on the next batch.",
  tags: ["waffle", "breakfast", "kitchen", "brunch", "food", "loader"],
  cols: 76, rows: 38, fps: 24,
  palette: palette(P),
};

const PER = 11;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = 36, cy = 27, Rw = 20, ry = 5.5, counterY = 31;
  const waffleCol = (wx, wz, bright) => {
    const gx = ((wx + 40) % 4 + 4) % 4, gz = ((wz * 1.6 + 40) % 4 + 4) % 4;
    const ridge = gx < 1.2 || gz < 1.3;
    return WAFFLE + Math.min(6, Math.max(0, Math.floor((ridge ? 4.5 : 1.5) + bright * 2)));
  };
  return (t) => {
    const p = ((t % PER) + PER) % PER;
    const open = smooth(clamp((p - 3) / 1.3)) * (1 - smooth(clamp((p - 9.2) / 1.3)));
    const ang = open * 1.85;
    const lift = smooth(clamp((p - 6.2) / 1.6));
    const hasWaffle = p > 0.5 && p < 9.2;      // after lift it is gone, before the next batch
    const out = p > 7.8;
    // blue grey wall, pale counter
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      if (y < counterY - 4) {
        const grout = y % 3 === 2 || (x + (Math.floor(y / 3) % 2) * 4) % 8 === 0;
        const v = clamp(0.5 + fbm(x * 0.05, y * 0.12, 2) * 0.3 + Math.exp(-Math.hypot((x - 36) / 30, (y - 12) / 12)) * 0.2 - (grout ? 0.35 : 0));
        g.set(x, y, grout ? "▒" : "█", KEYS[WALL + Math.min(4, Math.floor(v * 5))]);
      } else g.set(x, y, y === counterY - 4 ? "▄" : "█", KEYS[COUNTER + (y === counterY - 4 ? 2 : (x + y) % 13 === 0 ? 0 : 1)]);
    }
    // base: dark body with a front face
    for (let y = cy - Math.ceil(ry); y <= cy + Math.ceil(ry) + 4; y++) for (let x = cx - Rw - 1; x <= cx + Rw + 1; x++) {
      const nx = (x - cx) / (Rw + 1);
      if (Math.abs(nx) > 1) continue;
      const edge = cy + ry * Math.sqrt(1 - nx * nx);
      const top = cy - ry * Math.sqrt(1 - nx * nx);
      if (y < top) continue;
      if (y <= edge) {
        const nz = (y - cy) / ry;
        const inner = nx * nx + nz * nz < 0.78;
        if (inner && hasWaffle && !(out && lift > 0.2)) g.set(x, y, "█", KEYS[waffleCol((x - cx), (y - cy) * (Rw / ry) * 0.5, 0.3 - nx * 0.3)]);
        else g.set(x, y, "█", KEYS[inner ? PLATE + (((x + 40) % 4 < 1) || ((y + 40) % 2 < 1) ? 2 : 0) : IRON + 4]);
      } else if (y <= edge + 4) {
        const v = clamp(Math.sqrt(1 - nx * nx) * 0.5 + 0.2 - nx * 0.25 - (y - edge) * 0.04);
        g.set(x, y, "█", KEYS[IRON + Math.min(5, Math.floor(v * 6))]);
      }
    }
    // indicator light: red while baking, green when ready
    g.text(cx - 2, cy + ry + 2, "●", KEYS[p > 2.4 && p < 9 ? LIGHT + 1 : LIGHT]);
    g.text(cx + 1, cy + ry + 2, "READY", KEYS[p > 2.4 && p < 9 ? LIGHT + 1 : LIGHT + 2]);
    // lid: a disc hinged at the back edge, splatted in 3D
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const step = 0.5;
    for (let wz = -Rw; wz <= Rw; wz += step * 0.6) for (let wx = -Rw - 1; wx <= Rw + 1; wx += step) {
      const rr = Math.hypot(wx, wz);
      if (rr > Rw + 1) continue;
      const along = wz + Rw;                      // distance from the hinge
      const zz = -Rw + along * ca, hh = along * sa;
      const X = Math.round(cx + wx), Y = Math.round(cy + zz * (ry / Rw) - hh * 0.5 - 2.2);
      const under = ang > 0.25;
      let k;
      if (rr > Rw - 1.2) k = IRON + (under ? 2 : 3);
      else if (under) k = (((wx + 40) % 4 < 1) || ((wz * 1.6 + 40) % 4 < 1.2)) ? PLATE + 2 : PLATE + (hasWaffle && !out ? 1 : 0);
      else { const nx = wx / Rw, nz = wz / Rw; k = IRON + Math.min(5, Math.floor(clamp(0.45 - nx * 0.25 - nz * 0.2 + (Math.abs(nx + 0.4) < 0.08 ? 0.4 : 0)) * 6)); }
      g.set(X, Y, "█", KEYS[k]);
    }
    // handle on the front of the lid
    {
      const along = 2 * Rw + 3, zz = -Rw + along * ca, hh = along * sa;
      const Y = Math.round(cy + zz * (ry / Rw) - hh * 0.5 - 2.2);
      for (let x = cx - 4; x <= cx + 4; x++) g.set(x, Y, "█", KEYS[IRON + 3]);
      g.set(cx - 4, Y + 1, "█", KEYS[IRON + 2]); g.set(cx + 4, Y + 1, "█", KEYS[IRON + 2]);
    }
    // waffle lifted out on a fork
    if (out && lift > 0.2 && p < 9.2) {
      const wy = Math.round(lerp(cy, 6, smooth(clamp((p - 7.8) / 1.2)))), wxo = Math.round(lerp(0, 34, smooth(clamp((p - 8.3) / 0.9))));
      for (let y = wy - 3; y <= wy + 3; y++) for (let x = cx + wxo - 16; x <= cx + wxo + 16; x++) {
        const nx = (x - cx - wxo) / 16, nz = (y - wy) / 3.4;
        if (nx * nx + nz * nz > 1) continue;
        g.set(x, y, "█", KEYS[waffleCol(x - cx - wxo, (y - wy) * 3, 0.4 - nx * 0.3)]);
      }
      g.line(cx + wxo + 10, wy, cx + wxo + 24, wy - 6, "█", KEYS[FORK + 1]);
    }
    // steam: leaking from the seam while closed, a big puff when it opens
    const puff = open > 0.05 ? 1 : 0.45;
    for (let k = 0; k < 22; k++) {
      const a = (t * (0.35 + (k % 3) * 0.08) + k / 22) % 1;
      const ex = cx - Rw + ((k * 13) % (2 * Rw));
      const x = ex + Math.sin(a * 5 + k) * 3 + a * 4, y = cy - 3 - a * 22 - open * 4;
      if (a > puff) continue;
      if (y >= 0) g.set(x, y, a < 0.3 ? "▓" : a < 0.6 ? "▒" : "░", KEYS[STEAM + (a < 0.3 ? 3 : a < 0.6 ? 2 : 1)]);
    }
    return g.frame();
  };
}
