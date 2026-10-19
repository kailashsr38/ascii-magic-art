/* pizza-cheese-pull: a cutter wheel rolls through a hot pie, then a slice lifts away trailing strings of melted cheese. */
import { Grid, palette, gradient, KEYS, fbm, clamp, smooth, rng, lerp } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const TABLE = add(gradient(["#0e0c10", "#1e1a22", "#2e2832"], 4));
const BOARD = add(gradient(["#2a1406", "#5a3214", "#8a5628", "#b47c44"], 6));
const CRUST = add(gradient(["#6a3410", "#a85c1e", "#d8913a", "#f2c070"], 6));
const CHEESE = add(gradient(["#c8781e", "#eaa83a", "#f8d064", "#fff0a8", "#fffbe4"], 8));
const SAUCE = add(["#6a0e08", "#a81e10", "#d8361c"]);
const PEP = add(["#5a0a08", "#a01a14", "#d43a28", "#f07050"]);
const BASIL = add(["#1e5a1a", "#46a032"]);
const STEEL = add(gradient(["#4a505a", "#8a929e", "#d4dae2", "#ffffff"], 5));
const HANDLE = add(["#3a0a0a", "#8a1a1a", "#c83a2a"]);
const STEAM = add(gradient(["#6a625e", "#b4aca6", "#f0eae4"], 4));

export const meta = {
  slug: "pizza-cheese-pull",
  name: "Pizza Cheese Pull",
  category: "food",
  note: "A cutter wheel rolls through a hot pepperoni pizza, then a slice is lifted high, trailing long strings of melted cheese.",
  tags: ["pizza", "cheese", "food", "dinner", "hero", "wallpaper"],
  cols: 84, rows: 38, fps: 24,
  palette: palette(P),
};

const PER = 10;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = 42, cy = 27, rx = 36, ry = 8.5;
  const R = rng(7);
  const peps = [];
  while (peps.length < 14) {
    const a = R() * Math.PI * 2, d = Math.sqrt(R()) * 0.74;
    const p = [Math.cos(a) * d, Math.sin(a) * d];
    if (peps.every((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) > 0.27)) peps.push(p);
  }
  peps.push([0.05, 0.55], [-0.1, 0.3]);
  const leaves = Array.from({ length: 7 }, () => { const a = R() * 6.28, d = 0.2 + R() * 0.55; return [Math.cos(a) * d, Math.sin(a) * d]; });
  const A0 = Math.PI / 2 - 0.5, A1 = Math.PI / 2 + 0.5;
  const inWedge = (nx, ny) => { const a = Math.atan2(ny, nx); return a > A0 && a < A1; };
  const pizza = (nx, ny, bright) => {
    const e = nx * nx + ny * ny;
    if (e > 1) return null;
    if (e > 0.78) return CRUST + Math.min(5, Math.floor(clamp(0.8 - ny * 0.35 + bright) * 6));
    for (const [px, py] of peps) {
      const d = Math.hypot(nx - px, (ny - py) * 0.75);
      if (d < 0.1) return PEP + (d > 0.078 ? 0 : (nx - px) + (ny - py) < -0.02 ? 3 : 2);
    }
    for (const [lx, ly] of leaves) if (Math.hypot((nx - lx) * 1.6, ny - ly) < 0.07) return BASIL + (nx > lx ? 0 : 1);
    const n = fbm(nx * 6 + 9, ny * 6, 3);
    if (n < 0.27) return SAUCE + (n < 0.23 ? 1 : 2);
    return CHEESE + Math.min(7, Math.floor(clamp(0.45 + (n - 0.5) * 1.1 - ny * 0.1 + bright) * 8));
  };
  const edge = (a, f) => [cx + Math.cos(a) * rx * f, cy + Math.sin(a) * ry * f];
  return (t) => {
    const p = ((t % PER) + PER) % PER;
    const cut1 = clamp(p / 1.7), cut2 = clamp((p - 1.9) / 1.7);
    const lift = smooth(clamp((p - 4.2) / 2.2)) * (1 - smooth(clamp((p - 8.4) / 1.4)));
    const sway = Math.sin(t * 2.1) * 1.2 * lift;
    // slice pose: crust edge rises from the front rim to high above, tip pulls up from the centre
    const crustY = lerp(cy + ry, 3, lift), tipY = lerp(cy, 19, lift * lift);
    const W = lerp(rx * Math.cos(A0) * 2, 26, lift), sx = cx + sway;
    // table, board, pie
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const be = ((x - cx) / (rx + 5)) ** 2 + ((y - cy - 0.5) / (ry + 2.5)) ** 2;
      if (be < 1) {
        const v = clamp(0.35 + fbm(x * 0.03, y * 0.6, 2) * 0.5 + (be > 0.85 ? -0.2 : 0));
        g.set(x, y, "█", KEYS[BOARD + Math.min(5, Math.floor(v * 6))]);
      } else if (y > cy && y <= cy + ry + 4 && be < 1.25) g.set(x, y, "█", KEYS[BOARD]);
      else {
        const v = clamp(fbm(x * 0.05, y * 0.3, 3) * 0.5 + Math.exp(-Math.hypot((x - cx) / 40, (y - 8) / 12)) * 0.35);
        g.set(x, y, (x + y * 3) % 7 === 0 ? "▓" : "▒", KEYS[TABLE + Math.min(3, Math.floor(v * 4))]);
      }
    }
    for (let x = cx - rx; x <= cx + rx; x++) {
      const nx = (x - cx) / rx;
      if (Math.abs(nx) < 1) g.set(x, Math.round(cy + ry * Math.sqrt(1 - nx * nx)) + 1, "▀", KEYS[CRUST]);
    }
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = cx - rx; x <= cx + rx; x++) {
      const nx = (x - cx) / rx, ny = (y - cy) / ry;
      if (nx * nx + ny * ny > 1) continue;
      if (lift > 0.01 && inWedge(nx, ny)) { g.set(x, y, "█", KEYS[(x * 3 + y) % 7 === 0 ? CHEESE + 1 : BOARD + 1]); continue; }
      g.set(x, y, "█", KEYS[pizza(nx, ny, 0)]);
    }
    // cut lines appear behind the rolling wheel
    if (lift <= 0.01) for (const [a, c] of [[A0, cut1], [A1, cut2]]) for (let s = 0; s <= c; s += 0.02) {
      const [x, y] = edge(a, s * 1.02);
      g.set(Math.round(x), Math.round(y), "█", KEYS[SAUCE]);
    }
    if (lift > 0.01) {
      const sliceAt = (side, s) => [sx + side * (W / 2) * s, tipY + (crustY - tipY) * s];
      // cheese strings from the pie up to the slice edges and tip
      for (const [side, a] of [[-1, A1], [1, A0]]) for (let s = 0.05; s < 0.9; s += 0.14) {
        const [bx, by] = edge(a, s);
        const [qx, qy] = sliceAt(side, s);
        const n = Math.max(1, Math.round(Math.abs(by - qy)));
        for (let i = 0; i <= n; i++) {
          const f = i / n;
          const bow = Math.sin(f * Math.PI) * (1.5 * side + Math.sin(t * 3 + s * 7) * 0.8) * lift;
          const thin = f > 0.15 && f < 0.85 && lift > 0.35;
          g.set(Math.round(lerp(bx, qx, f) + bow), Math.round(lerp(by, qy, f)), thin ? "│" : "█", KEYS[CHEESE + (thin ? 6 : 4)]);
        }
      }
      // the slice itself, toppings mapped from its place in the pie
      const y0 = Math.floor(Math.min(crustY, tipY)), y1 = Math.ceil(Math.max(crustY, tipY));
      for (let y = y0; y <= y1; y++) {
        const s = Math.abs(crustY - tipY) < 0.5 ? 1 : clamp((y - tipY) / (crustY - tipY));
        const hw = (W / 2) * s;
        for (let x = Math.floor(sx - hw); x <= Math.ceil(sx + hw); x++) {
          const u = hw < 0.5 ? 0.5 : clamp((x - (sx - hw)) / (2 * hw));
          const a = lerp(A1, A0, u);
          let k = s > 0.88 ? CRUST + 2 + (u < 0.5 ? 2 : 1) : pizza(Math.cos(a) * s * 0.97, Math.sin(a) * s * 0.97, 0.1);
          if (k === null) k = CRUST + 3;
          g.set(x, y, "█", KEYS[k]);
        }
      }
      // steam off the hot slice
      for (let k = 0; k < 12; k++) {
        const a = (t * 0.45 + k / 12) % 1;
        const x = sx - 10 + (k % 6) * 4 + Math.sin(a * 7 + k) * 2, y = Math.min(crustY, tipY) - 1 - a * 9;
        if (y >= 0) g.set(x, y, a < 0.4 ? "▒" : "░", KEYS[STEAM + (a < 0.5 ? 2 : 1)]);
      }
    }
    // pizza cutter wheel
    let wa = null;
    if (p < 1.8) wa = [A0, cut1]; else if (p < 3.8) wa = [A1, cut2];
    if (wa) {
      const [hx, hy] = edge(wa[0], wa[1] * 1.02);
      const wx = hx, wy = hy - 2;
      const spin = -wa[1] * 14;
      g.line(wx, wy, wx + 16, wy - 12, "█", KEYS[HANDLE + 1]);
      g.line(wx + 1, wy, wx + 17, wy - 12, "▓", KEYS[HANDLE + 2]);
      for (let y = Math.floor(wy - 3); y <= wy + 3; y++) for (let x = Math.floor(wx - 5); x <= wx + 5; x++) {
        const d = Math.hypot((x - wx) / 4.6, (y - wy) / 2.4);
        if (d > 1) continue;
        const ang = Math.atan2((y - wy) * 2, x - wx) + spin;
        const spoke = Math.abs(Math.sin(ang * 2)) < 0.25;
        g.set(x, y, "█", KEYS[STEEL + (d > 0.78 ? 3 : d < 0.3 ? 4 : spoke ? 0 : 1 + (x < wx ? 1 : 0))]);
      }
    }
    return g.frame();
  };
}
