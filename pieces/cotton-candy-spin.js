/* cotton-candy-spin: pink sugar threads whirl round a carnival spinner tub as a paper cone turns and gathers a growing cloud of floss. */
import { Grid, palette, gradient, KEYS, fbm, noise2, clamp, smooth, lerp, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const NIGHT = add(gradient(["#140a24", "#22123a", "#341c50", "#4a2866"], 5));
const BULB = add(["#ffd84a", "#ff6a8a", "#6ae0ff", "#3a2a1a"]);
const TENT = add(["#c81e3a", "#f4ece0"]);
const FLOSS = add(gradient(["#c84a8a", "#ea6aa8", "#ff94c4", "#ffbedc", "#ffe4f0"], 7));
const STEEL = add(gradient(["#3a3e46", "#626a74", "#98a0ac", "#ccd4de", "#f4f8fc"], 6));
const CART = add(["#2a6ab0", "#4a94e0", "#f4f4f8"]);
const CONE = add(["#d8c8a8", "#f8f0e0"]);

export const meta = {
  slug: "cotton-candy-spin",
  name: "Cotton Candy Spinner",
  category: "food",
  note: "Pink sugar threads whirl around a carnival spinner tub while a paper cone turns and gathers a growing cloud of cotton candy.",
  tags: ["cotton candy", "carnival", "fair", "sweet", "food", "cute"],
  cols: 70, rows: 40, fps: 24,
  palette: palette(P),
};

const PER = 10;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = 35, tubY = 27, trx = 22, tryy = 4.5;
  return (t) => {
    const p = ((t % PER) + PER) % PER;
    const grow = smooth(clamp(p / 7.5));
    const lift = smooth(clamp((p - 8) / 1.2));
    const drop = p < 0.8 ? 1 - smooth(p / 0.8) : 0;
    // carnival night with a striped tent and a string of bulbs
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = clamp(0.2 + fbm(x * 0.05, y * 0.1, 2) * 0.3 + y / rows * 0.2);
      g.set(x, y, v > 0.4 ? "▓" : "▒", KEYS[NIGHT + Math.min(4, Math.floor(v * 5))]);
    }
    for (let y = 0; y < 5; y++) for (let x = 0; x < cols; x++) {
      const scallop = y === 4 && Math.sin(x * 0.52) < 0;
      if (!scallop) g.set(x, y, "█", KEYS[TENT + (Math.floor((x + y) / 5) % 2)]);
    }
    for (let x = 0; x < cols; x++) {
      const y = 7 + Math.round(Math.sin((x / cols) * Math.PI) * 2);
      g.set(x, y, "─", KEYS[BULB + 3]);
      if (x % 6 === 3) g.set(x, y + 1, "●", KEYS[BULB + (x / 6 | 0) % 3]);
    }
    // cart body below the tub
    for (let y = tubY + 3; y < rows; y++) for (let x = cx - 24; x <= cx + 24; x++) {
      const stripe = y === tubY + 6;
      g.set(x, y, "█", KEYS[stripe ? CART + 2 : CART + (x < cx - 12 ? 1 : 0)]);
    }
    // tub: back rim, inside, spinner head
    for (let y = tubY - 5; y <= tubY + 3; y++) for (let x = cx - trx; x <= cx + trx; x++) {
      const nx = (x - cx) / trx, ny = (y - tubY) / tryy;
      const e = nx * nx + ny * ny;
      if (y > tubY && Math.abs(nx) <= 1) {
        const v = clamp(Math.sqrt(1 - nx * nx) * 0.5 + 0.3 - nx * 0.25);
        g.set(x, y, "█", KEYS[STEEL + Math.min(5, Math.floor(v * 6))]);
        continue;
      }
      if (e > 1) continue;
      if (e > 0.82) { g.set(x, y, "█", KEYS[STEEL + (y < tubY ? 2 : 4)]); continue; }
      g.set(x, y, "█", KEYS[STEEL + (ny < 0 ? 0 : 1)]);
    }
    for (let y = tubY - 1; y <= tubY + 1; y++) for (let x = cx - 3; x <= cx + 3; x++) g.set(x, y, "█", KEYS[STEEL + (y === tubY - 1 ? 5 : 3)]);
    // floss threads whirling around inside the tub
    for (let k = 0; k < 9; k++) {
      const r = 0.35 + (k % 5) * 0.12;
      for (let s = 0; s < 1.3; s += 0.04) {
        const a = t * 4 + k * 0.7 - s;
        const x = Math.round(cx + Math.cos(a) * r * trx), y = Math.round(tubY + Math.sin(a) * r * tryy * 0.9 - (k % 3) * 0.6);
        if (Math.sin(a) < -0.2 || (y < tubY + 3)) g.set(x, y, "█", KEYS[FLOSS + (s < 0.3 ? 4 : s < 0.8 ? 2 : 1)]);
      }
    }
    // the cone and its growing cloud, turning as it gathers floss
    const sy = Math.round(lerp(tubY - 2, -14, lift) - drop * 30);
    const R = 3 + grow * 11, H = 2 + grow * 6.5;
    const ccx = cx, ccy = sy - 3 - H * 0.6;
    for (let y = Math.floor(ccy - H - 1); y <= ccy + H + 1; y++) for (let x = Math.floor(ccx - R - 3); x <= ccx + R + 3; x++) {
      if (y < 0 || y >= rows) continue;
      const dx = (x - ccx) / R, dy = (y - ccy) / H;
      const ang = Math.atan2(dy, dx);
      const lump = (noise2(Math.cos(ang) * 2 + t * 1.6, Math.sin(ang) * 2, 4) - 0.5) * 0.35;
      const d = Math.hypot(dx, dy) - lump;
      if (d > 1) continue;
      const tex = fbm(x * 0.35 + t * 2.5, y * 0.6, 2);
      const lit = clamp(0.55 - dx * 0.25 - dy * 0.3 + (tex - 0.5) * 0.7);
      g.set(x, y, d > 0.85 ? "▓" : "█", KEYS[FLOSS + Math.min(6, Math.floor(lit * 7))]);
    }
    // paper cone stick below the cloud
    for (let y = Math.round(ccy + H * 0.6); y <= sy + 4; y++) {
      if (y < 0 || y >= rows) continue;
      const w = Math.max(0, Math.round((sy + 4 - y) * 0.15));
      for (let x = cx - w; x <= cx + w; x++) g.set(x, y, "█", KEYS[CONE + (x <= cx ? 1 : 0)]);
    }
    // a strand trailing from the tub onto the cone
    if (lift < 0.2 && drop === 0) for (let s = 0; s <= 1; s += 0.06) {
      const a = t * 4;
      const x0 = cx + Math.cos(a) * trx * 0.6, y0 = tubY + Math.sin(a) * tryy * 0.5;
      g.set(Math.round(lerp(x0, ccx + R * Math.cos(a) * 0.8, s)), Math.round(lerp(y0, ccy + H * 0.5, s)), "░", KEYS[FLOSS + 3]);
    }
    return g.frame();
  };
}
