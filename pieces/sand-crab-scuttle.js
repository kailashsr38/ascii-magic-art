/* sand-crab-scuttle: a red crab scuttling sideways across the beach, dodging the waves as they wash in. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, smooth, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const SKY = add(gradient(["#4a9ad8", "#7ab8e8", "#b4d8f4"], 4));
const SEA = add(gradient(["#0a4a7a", "#0e6a9a", "#1a8ab4", "#3aaac8", "#7accd8"], 8));
const FOAM = add(["#e8f4f8", "#ffffff", "#b4dce8"]);
const WET = add(gradient(["#6a5a3e", "#8a7650", "#a48e62"], 4));
const SAND = add(gradient(["#b49a6a", "#ccb07a", "#e0c48c", "#f0d8a4"], 8));
const BITS = add(["#f4e8dc", "#e8a4a0", "#8a7a6a", "#2a6a3a"]);
const CRAB = add(["#7a1a0a", "#b42a12", "#e04a1e", "#ff7a3a", "#ffb07a", "#1a0a06", "#ffffff"]);

export const meta = {
  slug: "sand-crab-scuttle",
  name: "Sand Crab Scuttle",
  category: "animals",
  note: "A red crab scuttles sideways across a sunny beach, claws raised, darting up the sand whenever a wave washes in.",
  tags: ["crab", "beach", "summer", "sea", "animals", "loader"],
  cols: 88, rows: 28, fps: 24,
  palette: palette(P),
};

const PER = 10;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const R = rng(14);
  const bits = Array.from({ length: 26 }, () => [Math.floor(R() * cols), 14 + Math.floor(R() * 14), Math.floor(R() * 4)]);
  return (t) => {
    g.clear();
    // wave cycle: wash reaches a row then drains back
    const wp = (t % 5) / 5;
    const reach = 9.5 + Math.sin(wp * Math.PI) ** 1.5 * 6;
    const wetLine = 9.5 + 6.5 * Math.max(Math.sin(Math.min(1, wp + 0.08) * Math.PI) ** 1.5, 0.75 * (wp > 0.5 ? 1 : 0) * (1 - (wp - 0.5) * 2) + 0.2);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const edge = reach + Math.sin(x * 0.12 + t * 0.4) * 1.2 + noise2(x * 0.1, t * 0.2, 3) * 1.5;
      if (y < 4) { g.set(x, y, "█", KEYS[SKY + Math.min(3, y)]); continue; }
      if (y < 9) {
        const w = Math.sin(x * 0.3 - t * 1.5 + y * 2) + noise2(x * 0.2 - t, y, 1) - 0.4;
        g.set(x, y, w > 0.7 ? "▀" : "█", w > 0.7 ? KEYS[FOAM + 2] : KEYS[SEA + Math.min(7, y - 4 + (w > 0 ? 2 : 0))]);
        continue;
      }
      if (y < edge - 0.8) {
        const w = Math.sin(x * 0.25 - t * 2 + y * 1.5) > 0.5;
        g.set(x, y, w ? "▒" : "█", KEYS[SEA + 5 + Math.min(2, Math.floor((y - 9) / 4)) + (w ? 0 : 0)]);
      } else if (y < edge + 0.4) g.set(x, y, (x + Math.floor(t * 6)) % 3 ? "▀" : "█", KEYS[FOAM + (x % 2)]);
      else if (y < wetLine + Math.sin(x * 0.12) * 1.2 + 1.5) g.set(x, y, noise2(x * 0.5, y, 4) > 0.6 ? "▓" : "█", KEYS[WET + Math.min(3, Math.floor((y - 9) / 4))]);
      else {
        const n = fbm(x * 0.15, y * 0.4, 3, 5);
        const rip = Math.sin(x * 0.5 + y * 1.2 + n * 3) > 0.8;
        g.set(x, y, rip ? "▒" : n > 0.55 ? "▓" : "█", KEYS[SAND + Math.min(7, Math.floor(n * 5 + (y - 12) * 0.18))]);
      }
    }
    for (const [x, y, k] of bits) if (y > reach + 1) g.set(x, y, ["●", "◆", "▪", "≈"][k], KEYS[BITS + k]);
    // the crab: scuttles left and right, retreats up the beach when the water reaches it
    const p = ((t % PER) + PER) % PER / PER;
    const cx = 44 + Math.sin(p * TAU) * 30;
    const vx = Math.cos(p * TAU);
    const flee = clamp((reach - 12.5) / 2.5);
    const cy = 20 + flee * 3;
    const step = Math.floor(t * 14) % 2;
    // footprints
    for (let k = 1; k < 16; k++) {
      const pk = p - k * 0.008;
      const fx = 44 + Math.sin(pk * TAU) * 30;
      if (cy + 2 > reach + 1) g.set(fx, cy + 3, k % 2 ? "·" : ":", KEYS[WET + 1]);
    }
    // legs
    for (let i = 0; i < 3; i++) for (const s of [-1, 1]) {
      const lx = cx + s * (5 + i * 1.8), up = (i + (s > 0 ? 1 : 0) + step) % 2;
      g.set(lx, cy + 1, s > 0 ? "\\" : "/", KEYS[CRAB + 1]);
      g.set(lx + s * 0.8, cy + 2 - up * 0.6, s > 0 ? "\\" : "/", KEYS[CRAB + 1]);
    }
    // body
    for (let y = -3; y <= 1; y++) for (let x = -8; x <= 8; x++) {
      const d = (x / 8.5) ** 2 + ((y + 0.8) / 2.6) ** 2;
      if (d > 1) continue;
      g.set(cx + x, cy + y, y === 1 ? "▀" : "█", KEYS[CRAB + Math.min(4, Math.floor(clamp(0.8 - (y + 1) * 0.25 - Math.abs(x) * 0.04) * 5))]);
    }
    for (let x = -3; x <= 3; x += 2) g.set(cx + x, cy - 1, "·", KEYS[CRAB + 4]);
    // eye stalks
    for (const s of [-1, 1]) { g.set(cx + s * 2, cy - 4, "│", KEYS[CRAB + 1]); g.set(cx + s * 2, cy - 5, "●", KEYS[CRAB + 5]); }
    // claws wave up and snap
    const snap = Math.sin(t * 6) > 0.4;
    for (const s of [-1, 1]) {
      const lift = Math.sin(t * 3 + s) * 0.8 + (flee > 0.3 ? -1 : 0);
      const ax = cx + s * 9, ay = cy - 1.5 + lift * 0.5;
      g.set(ax, ay, "█", KEYS[CRAB + 2]);
      g.set(ax + s, ay - 1, "█", KEYS[CRAB + 2]);
      const px = ax + s * 2, py = ay - 2 + lift * 0.5;
      g.text(Math.round(px) - 1, Math.round(py), "███", KEYS[CRAB + 3]);
      g.text(Math.round(px) - 1, Math.round(py) - 1, snap ? "▄ ▄" : "▄▄▄", KEYS[CRAB + 2]);
      g.set(Math.round(px), Math.round(py) - 1, snap ? " " : "▄", KEYS[CRAB + 2]);
    }
    return g.frame();
  };
}
