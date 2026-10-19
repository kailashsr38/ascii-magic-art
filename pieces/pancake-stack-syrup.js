/* pancake-stack-syrup: pancakes drop one by one onto a plate, butter lands on top and maple syrup pours and runs down the stack. */
import { Grid, palette, gradient, KEYS, fbm, clamp, smooth, rng } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const WALL = add(gradient(["#f2d8a8", "#f8e4c0", "#fff0d8"], 4));
const CLOTH = add(["#c8283a", "#f4ece4", "#a01e2e", "#dcd2c8"]);
const PLATE = add(["#9aa4ae", "#d4dce4", "#ffffff"]);
const CAKE = add(gradient(["#7a3a10", "#a85a1e", "#d08834", "#ecb45a", "#f8d88a"], 8));
const SYRUP = add(gradient(["#3a1404", "#6a2a08", "#a04a10", "#d47a24", "#f4b048"], 6));
const BUTTER = add(["#e8c840", "#fff09a", "#fffbe0"]);
const BERRY = add(["#1a1a5a", "#3a3aa8", "#c81a3a", "#ff5a6a"]);
const JUG = add(["#5a6a7a", "#9aaabb", "#dde6ee"]);

export const meta = {
  slug: "pancake-stack-syrup",
  name: "Pancake Stack Syrup",
  category: "food",
  note: "Golden pancakes drop one by one onto a plate, a pat of butter lands on top and maple syrup pours over and runs down the stack.",
  tags: ["pancakes", "breakfast", "syrup", "brunch", "food", "hero"],
  cols: 72, rows: 38, fps: 24,
  palette: palette(P),
};

const PER = 12;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const R = rng(17);
  const cx0 = 34, plateY = 32, N = 6, rx = 17, ry = 2.2, th = 2.4;
  const runs = Array.from({ length: 9 }, (_, i) => ({ u: -0.85 + i * 0.21 + (R() - 0.5) * 0.08, max: 3 + R() * 11, sp: 0.6 + R() * 0.8 }));
  const berries = [[-24, 1, 2], [-21, 0, 0], [22, 1, 2], [25, 0, 0], [19, 0, 2]];
  return (t) => {
    const p = ((t % PER) + PER) % PER;
    const slide = p > 10.6 ? smooth((p - 10.6) / 1.4) : 0;
    const inn = p < 0.8 ? 1 - smooth(p / 0.8) : 0;
    const cx = Math.round(cx0 + slide * 60 - inn * 60);
    // warm kitchen wall and gingham tablecloth
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      if (y < 27) {
        const v = clamp(0.3 + fbm(x * 0.05, y * 0.1, 3) * 0.5);
        g.set(x, y, "█", KEYS[WALL + Math.min(3, Math.floor(v * 4))]);
      } else {
        const a = Math.floor(x / 4) % 2, b = Math.floor((y - 27) / 2) % 2;
        g.set(x, y, "█", KEYS[CLOTH + (a && b ? 2 : a || b ? 0 : 1)]);
      }
    }
    // plate
    for (let y = plateY - 2; y <= plateY + 2; y++) for (let x = cx - 26; x <= cx + 26; x++) {
      const d = Math.hypot((x - cx) / 26, (y - plateY) / 2.6);
      if (d < 1) g.set(x, y, "█", KEYS[PLATE + (d > 0.85 ? 0 : d > 0.7 ? 2 : 1)]);
    }
    for (const [dx, dy, k] of berries) { g.set(cx + dx, plateY + dy, "█", KEYS[BERRY + k + (dx % 2 ? 1 : 0)]); g.set(cx + dx + 1, plateY + dy, "█", KEYS[BERRY + k + 1]); }
    // pancakes fall in and stack
    let stackTop = plateY - 1;
    for (let i = 0; i < N; i++) {
      const t0 = 0.6 + i * 0.6;
      if (p < t0) break;
      const f = clamp((p - t0) / 0.45);
      const rest = plateY - 1 - i * th;
      const bounce = f >= 1 ? Math.max(0, Math.sin((p - t0 - 0.45) * 18) * Math.exp(-(p - t0 - 0.45) * 8) * 0.8) : 0;
      const y = f < 1 ? rest - (1 - f * f) * 30 : rest - bounce;
      const sq = i * 0.6;
      for (let yy = Math.floor(y - ry - 1); yy <= y + 1; yy++) for (let x = cx - rx - 2; x <= cx + rx + 2; x++) {
        const ux = (x - cx) / (rx + (i % 2) - sq * 0.3);
        if (Math.abs(ux) > 1) continue;
        const e = Math.sqrt(1 - ux * ux);
        const topEdge = y - ry * e - 0.6, sideBot = y + 0.8;
        if (yy < topEdge || yy > sideBot) continue;
        const isTop = yy < y - 0.5;
        const v = isTop ? clamp(0.5 + fbm(x * 0.3, yy + i * 7, 2) * 0.35) : clamp(0.55 + e * 0.25 - ux * 0.2 - (yy === Math.round(sideBot) ? 0.35 : 0));
        g.set(x, yy, "█", KEYS[CAKE + Math.min(7, Math.floor(v * 8))]);
      }
      if (f >= 1) stackTop = rest;
    }
    const full = p > 0.6 + (N - 1) * 0.6 + 0.45;
    const topY = plateY - 1 - (N - 1) * th;
    // butter drops on, then softens
    if (p > 4.4) {
      const f = clamp((p - 4.4) / 0.35);
      const by = f < 1 ? topY - 2 - (1 - f * f) * 16 : topY - 2;
      const melt = clamp((p - 6) / 4);
      const w = 4 + Math.round(melt * 2), h = melt > 0.6 ? 1 : 2;
      for (let y = 0; y < h; y++) for (let x = -w; x <= w; x++) g.set(cx + x, Math.round(by) + y + (h === 1 ? 1 : 0), "█", KEYS[BUTTER + (y === 0 ? 2 : 1)]);
    }
    // syrup pours from a jug, pools on top and runs down the sides
    const pourOn = p > 5.2 && p < 9.4;
    const syr = clamp((p - 5.4) / 4.5);
    if (full && p > 5.2) {
      // a glass syrup jug, tilted, amber inside
      const jx = cx + 3, jy = 3, tilt = pourOn ? 1 : 0;
      for (let y = 0; y < 8; y++) for (let x = 0; x < 9; x++) {
        const edge = x === 0 || x === 8 || y === 7;
        const yy = jy - 3 + y - (x > 4 ? tilt : 0);
        if (y === 0 && (x < 1 || x > 7)) continue;
        g.set(jx + x, yy, "█", KEYS[edge ? JUG + (x === 0 ? 2 : 1) : y < 3 ? JUG : SYRUP + (x < 3 ? 4 : 3)]);
      }
      for (let y = 0; y < 4; y++) g.set(jx + 9, jy - 1 + y, "▌", KEYS[JUG + 1]);
      g.set(jx - 1, jy + 2, "█", KEYS[JUG + 2]); g.set(jx - 2, jy + 3, "█", KEYS[JUG + 2]);
      if (pourOn) for (let y = jy + 4; y < topY - 1; y++) {
        const xx = jx - 2 + Math.round(Math.sin(y * 0.6 + t * 6) * 0.3);
        g.set(xx, y, "█", KEYS[SYRUP + 3 + ((y + Math.floor(t * 12)) % 3 === 0 ? 1 : 0)]);
        g.set(xx + 1, y, "▌", KEYS[SYRUP + 2]);
      }
      // glossy pool spreading across the top
      const pw = 3 + syr * (rx - 3);
      for (let y = topY - 3; y <= topY; y++) {
        const fy = (y - (topY - 1.5)) / 1.8;
        const hw = pw * Math.sqrt(Math.max(0, 1 - fy * fy));
        for (let x = Math.ceil(cx - 2 - hw); x <= cx - 2 + hw; x++) g.set(x, y, "█", KEYS[SYRUP + (y === topY - 3 ? 4 : x < cx - 2 - hw / 2 ? 4 : 3)]);
      }
      // runs down the stack edge
      for (const r of runs) {
        const len = Math.floor(clamp((syr - 0.25) * r.sp * 2) * r.max);
        const x = Math.round(cx + r.u * rx);
        for (let j = 0; j < len; j++) g.set(x, topY + j, "█", KEYS[SYRUP + (j === len - 1 ? 4 : 2 + (j % 2))]);
      }
    }
    return g.frame();
  };
}
