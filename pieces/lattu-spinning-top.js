/* lattu-spinning-top: a striped wooden top spins and wobbles inside a chalk ring on a dusty courtyard, kicking up dust. */
import { Grid, palette, gradient, KEYS, fbm, clamp, rng, fract, TAU } from "../lib/kit.js";

const EARTH = gradient(["#3a2412", "#5a3a1c", "#7a5428", "#9a6e3a", "#b88a50"], 10);  // 0..9
const WALL = gradient(["#6a3a22", "#a05a34", "#c87a48", "#e0a06a"], 6);              // 10..15
const STRIPES = [
  ["#7a0a10", "#c81a24", "#ff4a4a"], ["#8a6a00", "#e0b000", "#ffe04a"],
  ["#0a5a2a", "#18a04a", "#5ae07a"], ["#0a2a7a", "#2058d0", "#5a9aff"],
];                                                                                    // 16..27
const NAMED = { nail: "#d0d4dc", nailD: "#7a808a", chalk: "#f4ecdc", shadow: "#24160a", dust: "#d8b888", string: "#f0e8d0", knob: "#4a2a14", knobL: "#8a5a30" };
const NK = Object.keys(NAMED);
const K = {}; NK.forEach((n, i) => (K[n] = KEYS[28 + i]));

export const meta = {
  slug: "lattu-spinning-top",
  name: "Lattu Spinning Top",
  category: "india",
  note: "A striped wooden lattu spins and wobbles on its iron nail inside a chalk ring on a dusty courtyard, flicking up dust, its string coiled nearby.",
  tags: ["lattu", "top", "india", "toy", "childhood", "loader"],
  cols: 80, rows: 30, fps: 24,
  palette: palette([...EARTH, ...WALL, ...STRIPES.flat(), ...Object.values(NAMED)]),
};

const H = 15;
function width(v) {                         // half width in cells at fraction v from the knob (0) to the tip (1)
  if (v < 0.1) return 1.6;
  if (v < 0.2) return 1.6 + ((v - 0.1) / 0.1) * 9.4;
  if (v < 0.28) return 11;
  if (v < 0.9) return 11 * Math.pow(1 - (v - 0.28) / 0.62, 0.85) + 0.8;
  return 0.7;
}

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const N = cols * rows;
  const bg = [];
  const HOR = 7;
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    if (y < HOR) {
      const brick = ((y % 2) ? (x + 3) % 8 : x % 8) === 0;
      const n = fbm(x * 0.2, y * 0.4, 2, 3);
      bg.push(brick ? ["▒", KEYS[10]] : [n > 0.55 ? "▓" : "█", KEYS[11 + Math.min(4, Math.floor(clamp(0.35 + y * 0.05 + (n - 0.5) * 0.6) * 5))]]);
    } else if (y === HOR) bg.push(["▀", KEYS[10]]);
    else {
      const n = fbm(x * 0.12, y * 0.35, 3, 5), p = fbm(x * 0.6, y * 1.1, 1, 8);
      const v = clamp(0.4 + ((y - HOR) / (rows - HOR)) * 0.4 + (n - 0.5) * 0.35);
      bg.push([n > 0.6 ? "▓" : "█", KEYS[Math.min(9, Math.floor(v * 10))]]);
    }
  }
  function SHC(v) { return v > 0.6 ? "█" : v > 0.4 ? "▓" : "▒"; }
  const r = rng(12);
  const dust = Array.from({ length: 22 }, () => ({ a: r() * TAU, s: 6 + r() * 10, ph: r() }));
  // coiled string lying on the ground
  const coil = [];
  for (let k = 0; k < 90; k++) { const a = k * 0.21; const rr = 0.8 + k * 0.045; coil.push([9 + Math.cos(a) * rr * 1.9, 25 + Math.sin(a) * rr * 0.75]); }
  for (let k = 0; k < 10; k++) coil.push([15 + k * 1.2, 27 + Math.sin(k * 0.8) * 0.6]);

  return (t) => {
    g.clear();
    for (let i = 0; i < N; i++) { g.ch[i] = bg[i][0]; g.co[i] = bg[i][1]; }
    // chalk ring
    for (let k = 0; k < 120; k++) { const a = (k / 120) * TAU; if (k % 4 !== 3) g.set(42 + Math.cos(a) * 30, 22.5 + Math.sin(a) * 5.5, "▓", K.chalk); }
    for (const [x, y] of coil) g.set(x, y, "█", K.string);
    // precession path of the tip and the wobble of the axis
    const tipx = 42 + Math.sin(t * 0.55) * 9 + Math.sin(t * 1.3) * 2;
    const tipy = 24 + Math.sin(t * 0.9) * 1.6;
    const wob = 0.08 + 0.06 * (0.5 + 0.5 * Math.sin(t * 0.37));
    const tilt = Math.sin(t * 5.2) * wob + Math.sin(t * 0.55 + 1) * 0.06;
    const spin = t * 2.6;
    // shadow
    for (let dx = -10; dx <= 10; dx++) {
      const w = 1 - (dx / 10) ** 2;
      g.set(tipx + dx + 3, tipy, w > 0.3 ? "█" : "▓", K.shadow);
      if (w > 0.5) g.set(tipx + dx + 2, tipy + 1, "▓", K.shadow);
    }
    // dust flicks from the tip
    for (const d of dust) {
      const ph = fract(t * 0.9 + d.ph);
      const rr = ph * d.s;
      const a = d.a + t * 0.3;
      g.set(tipx + Math.cos(a) * rr * 1.6, tipy + Math.sin(a) * rr * 0.35 - Math.sin(ph * Math.PI) * 1.5, ph < 0.5 ? "▓" : "▒", ph < 0.6 ? K.dust : KEYS[9]);
    }
    // the top: axis from tip upward, tilted; sample cells in its bounding box
    const ax = Math.sin(tilt), ay = -Math.cos(tilt);        // unit axis in (x, 2y) space, pointing up
    const L = H * 2;                                          // length in (x, 2y) units
    const x0 = Math.floor(tipx - 16), x1 = Math.ceil(tipx + 16);
    const y0 = Math.floor(tipy - H - 3), y1 = Math.ceil(tipy);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const px = x + 0.5 - tipx, py = (y + 0.5 - tipy) * 2;
      const along = px * ax + py * ay;                    // 0 at tip, L at knob
      const across = px * -ay + py * ax;
      if (along < -0.5 || along > L) continue;
      const v = 1 - along / L;
      const w = width(v);
      const u = across / w;
      if (Math.abs(u) > 1) continue;
      if (v >= 0.9) { g.set(x, y, "█", u < 0 ? K.nail : K.nailD); continue; }
      const light = clamp(0.55 + 0.45 * Math.sqrt(1 - u * u) - u * 0.35);
      if (v < 0.1) { g.set(x, y, "█", light > 0.6 ? K.knobL : K.knob); continue; }
      const az = Math.asin(clamp(u, -1, 1)) / Math.PI;     // -0.5..0.5 around the front
      const band = Math.floor(v * 7 + (az + spin) * 2);
      const s = ((band % 4) + 4) % 4;
      const lv = light > 0.78 ? 2 : light > 0.45 ? 1 : 0;
      const ridge = Math.abs(v - 0.28) < 0.02 || Math.abs(v - 0.2) < 0.015;
      g.set(x, y, ridge ? "▀" : lv === 2 ? "█" : "▓", ridge ? K.knob : KEYS[16 + s * 3 + lv]);
    }
    return g.frame();
  };
}
